/* eslint-disable */
// @ts-nocheck
// WebGPU effects engine (WGSL) — scene compositor + GPU particles + transitions + post-FX.
// Frozen vendor core: WGSL, render(), doBlur(), the pipelines, the uniform-slot layout, resize()
// and texture loading are unchanged. Only the module boundary (IIFE + window global → ES export)
// and dispose() were adapted. Typed via ./engine.d.ts.

  // ---- shared WGSL helpers ----
  const HELP = `
  fn hash11(p0:f32)->f32{ var p=fract(p0*0.1031); p=p*(p+33.33); p=p*(p+p); return fract(p); }
  fn hash21(p0:vec2<f32>)->f32{ var p=fract(p0*vec2<f32>(123.34,456.21)); p=p+dot(p,p+45.32); return fract(p.x*p.y); }
  fn vnoise(p:vec2<f32>)->f32{ let i=floor(p); let f=fract(p); let a=hash21(i); let b=hash21(i+vec2<f32>(1.0,0.0)); let c=hash21(i+vec2<f32>(0.0,1.0)); let d=hash21(i+vec2<f32>(1.0,1.0)); let u=f*f*(3.0-2.0*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
  fn fbm(p0:vec2<f32>)->f32{ var p=p0; var v=0.0; var a=0.5; for(var i=0;i<5;i=i+1){ v=v+a*vnoise(p); p=p*2.02+vec2<f32>(11.3,7.7); a=a*0.5; } return v; }
  fn modf2(a:f32,b:f32)->f32{ return a-b*floor(a/b); }
  fn lum(c:vec3<f32>)->f32{ return dot(c,vec3<f32>(0.299,0.587,0.114)); }
  `;

  // fullscreen triangle
  const VS_FULL = `
  struct VO { @builtin(position) pos:vec4<f32>, @location(0) uv:vec2<f32> };
  @vertex fn vs(@builtin(vertex_index) vi:u32)->VO {
    var o:VO;
    let x = f32((vi << 1u) & 2u);
    let y = f32(vi & 2u);
    let p = vec2<f32>(x, y);            // 0..2
    o.pos = vec4<f32>(p*2.0-1.0, 0.0, 1.0);
    o.uv = vec2<f32>(p.x, 1.0 - p.y);   // texcoord, y down (0 top)
    return o;
  }`;

  // ---- SCENE ----
  const SCENE_WGSL = `
  struct U { d: array<vec4<f32>, 7> };
  @group(0) @binding(0) var<uniform> U_:U;
  @group(0) @binding(1) var samp:sampler;
  @group(0) @binding(2) var texCur:texture_2d<f32>;
  @group(0) @binding(3) var texPrev:texture_2d<f32>;
  @group(0) @binding(4) var texDepth:texture_2d<f32>;
  ${HELP}
  fn cover(imgA:f32, canA:f32, uv:vec2<f32>)->vec2<f32>{
    var b=uv;
    if(canA>imgA){ b.y=(uv.y-0.5)*(imgA/canA)+0.5; } else { b.x=(uv.x-0.5)*(canA/imgA)+0.5; }
    return b;
  }
  fn sampleScene(tex:texture_2d<f32>, imgA:f32, canA:f32, off:vec2<f32>, uv:vec2<f32>)->vec3<f32>{
    let b = cover(imgA,canA,uv) + off;
    return textureSample(tex,samp,b).rgb;
  }
  struct VO { @builtin(position) pos:vec4<f32>, @location(0) uv:vec2<f32> };
  @fragment fn fs(in:VO)->@location(0) vec4<f32>{
    let time=U_.d[0].x; let canA=U_.d[0].y; let imgATo=U_.d[0].z; let imgAFrom=U_.d[0].w;
    let mouse=vec2<f32>(U_.d[1].x,U_.d[1].y);
    let trans=U_.d[2].x; let transMode=U_.d[2].y; let fogAmt=U_.d[2].z;
    // Survivors keep their original lanes (pruned effects left documented gaps at d[1].z–d[1].w,
    // d[3].z–d[5].y, d[5].w, d[6].y).
    let fGrade=U_.d[3].x; let fWarm=U_.d[3].y;
    let fFog=U_.d[5].z;
    let fParallax=U_.d[6].x; let fKenburns=U_.d[6].z; let parallaxAmt=U_.d[6].w;

    var uv=in.uv;
    var off=vec2<f32>(0.0,0.0);
    // Depth parallax (ported from Studio, issue 12): shift each pixel by its sampled depth so planes
    // move at different rates as the pointer moves — foreground drifts, background stays put. parallaxAmt
    // scales the reach. Needs the depth map (setDepth); with the flat/absent stand-in it degrades to ~none.
    if(fParallax>0.5){ let dpt=clamp(textureSample(texDepth,samp,uv).r,0.0,1.0); off=off+(mouse-0.5)*parallaxAmt*dpt; }
    var suv=uv;
    if(fKenburns>0.5){ let z=1.0+0.05*(0.5+0.5*sin(time*0.05)); let pan=vec2<f32>(sin(time*0.045)*0.018,cos(time*0.037)*0.014); suv=(uv-0.5)/z+0.5+pan; }

    var uvTo=suv; var uvFrom=suv; var m:f32;
    if(trans>=0.999){ m=1.0; }
    else {
      let md=i32(transMode+0.5);
      if(md==0){ m=trans; }
      else if(md==1){ let w=0.09; m=clamp((trans*(1.0+w)-uv.x)/w,0.0,1.0); }
      else if(md==2){ let n=fbm(uv*5.0); m=smoothstep(n-0.05,n+0.05,trans); }
      else if(md==3){ let row=floor(uv.y*24.0); let rt=hash11(row*1.7); m=step(rt,trans); let env=1.0-abs(trans*2.0-1.0); let sh=(hash11(row+floor(time*22.0))-0.5)*0.10*env; uvTo.x=uvTo.x+sh; uvFrom.x=uvFrom.x+sh*0.5; }
      // Ripple (ported from Studio, mode 16 there): a wavefront expands from center; edge = trans*maxR - d
      // gates the from→to reveal, and a decaying sinusoidal ring warps UVs so both frames ride the wave.
      else if(md==5){ let dir=uv-0.5; let d=length(dir*vec2<f32>(canA,1.0)); let maxR=length(vec2<f32>(0.5*canA,0.5))+0.05; let edge=trans*maxR-d; let ring=sin(edge*55.0-time*2.0)*exp(-abs(edge)*7.0)*(1.0-abs(trans*2.0-1.0)); let warp=normalize(dir+vec2<f32>(1e-5,1e-5))*ring*0.03; uvTo=suv+warp; uvFrom=suv+warp; m=smoothstep(-0.015,0.015,edge); }
      else { let cell=mix(2.0,90.0,sin(trans*3.14159)); let px=(floor(suv*cell)+0.5)/cell; uvTo=px; uvFrom=px; m=trans; }
    }
    let colTo=sampleScene(texCur,imgATo,canA,off,uvTo);
    let colFrom=sampleScene(texPrev,imgAFrom,canA,off,uvFrom);
    var col=mix(colFrom,colTo,m);
    // hardcoded: fog tint — warm-brown low vec3(0.62,0.30,0.26) → desaturated rose high vec3(0.78,0.66,0.62), lerped by height.
    if(fFog>0.5){ let h=smoothstep(0.05,0.85,1.0-uv.y); let f=pow(clamp(fbm(vec2<f32>(uv.x*3.0+time*0.05,uv.y*2.2-time*0.03)),0.0,1.0),1.4); let fogCol=mix(vec3<f32>(0.62,0.30,0.26),vec3<f32>(0.78,0.66,0.62),uv.y); col=mix(col,fogCol,clamp(f*h*fogAmt,0.0,0.85)); }
    if(fGrade>0.5){ col=(col-0.5)*1.12+0.5; let l=lum(col); col=mix(vec3<f32>(l),col,1.18); col=col*1.02; }
    if(fWarm>0.5){ col=col*vec3<f32>(1.10,1.0,0.86); let l=lum(col); col=mix(vec3<f32>(l),col,1.18); }
    return vec4<f32>(max(col,vec3<f32>(0.0)),1.0);
  }`;

  // ---- PARTICLES (instanced quad) ----
  const PART_WGSL = `
  struct U { d: array<vec4<f32>, 2> };
  @group(0) @binding(0) var<uniform> U_:U;
  fn h11(p0:f32)->f32{ var p=fract(p0*0.1031); p=p*(p+33.33); p=p*(p+p); return fract(p); }
  struct VO { @builtin(position) pos:vec4<f32>, @location(0) uv:vec2<f32>, @location(1) col:vec4<f32>, @location(2) round:f32 };
  @vertex fn vs(@builtin(vertex_index) vi:u32, @builtin(instance_index) ii:u32)->VO {
    let time=U_.d[0].x; let wind=U_.d[0].y; let typef=U_.d[0].z; let turb=U_.d[0].w;
    let roundf=U_.d[1].x; let resX=U_.d[1].y; let resY=U_.d[1].z;
    var corners=array<vec2<f32>,6>(vec2<f32>(-1.0,-1.0),vec2<f32>(1.0,-1.0),vec2<f32>(-1.0,1.0),vec2<f32>(-1.0,1.0),vec2<f32>(1.0,-1.0),vec2<f32>(1.0,1.0));
    let c=corners[vi];
    let id=f32(ii);
    let r1=h11(id); let r2=h11(id+11.7); let r3=h11(id+23.3); let r4=h11(id+41.1);
    let ty=i32(typef+0.5); let t=time;
    var pos:vec2<f32>; var size=2.0; var col=vec3<f32>(1.0); var alpha=1.0;
    // Two surviving types (PT order): 0 = ash (drifting alpha flecks), 1 = dust (slow additive motes).
    if(ty==0){ let sp=0.02+r2*0.04; let life=fract(r1+t*sp); pos=vec2<f32>(fract(r3+sin(life*4.0+r1*20.0)*0.05+wind*life*0.4),life); size=1.2+r4*2.6; col=vec3<f32>(0.22,0.20,0.19); alpha=0.5+0.4*r2; }
    else { let sp=0.008+r2*0.02; let life=fract(r1+t*sp); pos=vec2<f32>(fract(r3+sin(t*0.2+r1*10.0)*0.04+wind*0.1),fract(r4+sin(t*0.1+r3*8.0)*0.03)); size=1.0+r4*1.6; col=vec3<f32>(1.0,0.95,0.85); alpha=0.10+0.20*r2; }
    // Turbulent wind (ported from Studio, C3): a swirl of organic offset scaled by the per-type strength
    // (0 = original drift). Set per particle type via fPart[3] from state.params.turb in render().
    if(turb>0.0){ pos=pos+vec2<f32>(sin(pos.y*9.0+t*0.7+r1*6.28),cos(pos.x*9.0+t*0.6+r2*6.28))*turb; }
    let center=vec2<f32>(pos.x*2.0-1.0, 1.0-pos.y*2.0);
    let half=vec2<f32>(size/resX, size/resY)*2.0;
    var o:VO;
    o.pos=vec4<f32>(center+c*half,0.0,1.0);
    o.uv=c; o.col=vec4<f32>(col,alpha); o.round=roundf;
    return o;
  }
  @fragment fn fs(in:VO)->@location(0) vec4<f32>{
    let d=in.uv;
    var a:f32;
    if(in.round>0.5){ a=smoothstep(1.0,0.0,length(d)); }
    else { a=smoothstep(1.0,0.0,abs(d.x)*3.5)*smoothstep(1.0,0.0,abs(d.y)); }
    return vec4<f32>(in.col.rgb, in.col.a*a);
  }`;

  // ---- BLUR ----
  const BLUR_WGSL = `
  struct U { d: array<vec4<f32>, 2> };
  @group(0) @binding(0) var<uniform> U_:U;
  @group(0) @binding(1) var samp:sampler;
  @group(0) @binding(2) var tex:texture_2d<f32>;
  struct VO { @builtin(position) pos:vec4<f32>, @location(0) uv:vec2<f32> };
  @fragment fn fs(in:VO)->@location(0) vec4<f32>{
    let dir=vec2<f32>(U_.d[0].x,U_.d[0].y); let texel=vec2<f32>(U_.d[0].z,U_.d[0].w); let bright=U_.d[1].x;
    var w=array<f32,5>(0.227,0.194,0.121,0.054,0.016);
    var c=textureSample(tex,samp,in.uv).rgb*w[0];
    for(var i=1;i<5;i=i+1){ let o=dir*texel*f32(i)*1.4; c=c+textureSample(tex,samp,in.uv+o).rgb*w[i]; c=c+textureSample(tex,samp,in.uv-o).rgb*w[i]; }
    if(bright>0.5){ let l=dot(c,vec3<f32>(0.299,0.587,0.114)); c=c*smoothstep(0.55,0.95,l); }
    return vec4<f32>(c,1.0);
  }`;

  // ---- COMPOSITE ----
  const COMP_WGSL = `
  struct U { d: array<vec4<f32>, 7> };
  @group(0) @binding(0) var<uniform> U_:U;
  @group(0) @binding(1) var samp:sampler;
  @group(0) @binding(2) var texScene:texture_2d<f32>;
  @group(0) @binding(3) var texBloom:texture_2d<f32>;
  @group(0) @binding(4) var texDof:texture_2d<f32>;
  // Depth map (the active scene's, or the 1×1 stand-in) — the focus family's depth mode samples it.
  // Bound every frame (auto layout); other modes ignore it. Same texture the scene pass reads for parallax.
  @group(0) @binding(5) var texDepth:texture_2d<f32>;
  fn h2(p:vec2<f32>)->f32{ return fract(sin(dot(p,vec2<f32>(12.9898,78.233)))*43758.5453); }
  fn lum(c:vec3<f32>)->f32{ return dot(c,vec3<f32>(0.299,0.587,0.114)); }
  fn aces(x:vec3<f32>)->vec3<f32>{ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),vec3<f32>(0.0),vec3<f32>(1.0)); }
  // Tonemap family (ported from Studio, issue 15). tonemapMode picks the curve: 0 ACES · 2 filmic · 3
  // Reinhard. Reinhard is the gentle x/(1+x) roll-off; Hable/Filmic is the Uncharted-2 operator with a
  // toe+shoulder normalized by its own white point. AgX (mode 1) is intentionally not ported (no shipped
  // look uses it); unknown modes fall back to ACES.
  fn reinhard(x:vec3<f32>)->vec3<f32>{ return clamp(x/(1.0+x),vec3<f32>(0.0),vec3<f32>(1.0)); }
  fn hable(x:vec3<f32>)->vec3<f32>{ let A=0.15; let B=0.50; let C=0.10; let D=0.20; let E=0.02; let F=0.30; return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F; }
  fn filmic(x:vec3<f32>)->vec3<f32>{ let w=hable(vec3<f32>(11.2)); return clamp(hable(x*2.0)/w,vec3<f32>(0.0),vec3<f32>(1.0)); }
  struct VO { @builtin(position) pos:vec4<f32>, @location(0) uv:vec2<f32> };
  @fragment fn fs(in:VO)->@location(0) vec4<f32>{
    let time=U_.d[0].x; let glitch=U_.d[0].y; let bloomAmt=U_.d[0].w;
    let dofAmt=U_.d[1].x; let exposure=U_.d[1].y;
    let texelF=vec2<f32>(U_.d[2].x,U_.d[2].y); let tonemapMode=U_.d[2].z; let focusMode=U_.d[2].w;
    // Survivors keep their original lanes (pruned effects left documented gaps at d[0].z, d[1].z,
    // d[4].x, d[4].z, d[5].x–d[5].w, d[6].x).
    let fBloom=U_.d[3].x; let fFocus=U_.d[3].y; let fVignette=U_.d[3].z; let fScan=U_.d[3].w;
    let fTonemap=U_.d[4].y; let fHalation=U_.d[4].w;
    let fVhs=U_.d[6].y; let vhsAmt=U_.d[6].z;
    let uv=in.uv;
    var gsh=vec2<f32>(0.0,0.0); let g=glitch;
    if(g>0.01){ let row=floor(uv.y*48.0); gsh.x=(h2(vec2<f32>(row,floor(time*18.0)))-0.5)*0.06*g; }
    var col:vec3<f32>;
    if(g>0.01){ let ca=0.008*g; col=vec3<f32>(textureSample(texScene,samp,uv+vec2<f32>(gsh.x+ca,0.0)).r, textureSample(texScene,samp,uv+gsh).g, textureSample(texScene,samp,uv+vec2<f32>(gsh.x-ca,0.0)).b); }
    else { col=textureSample(texScene,samp,uv).rgb; }
    // Focus family (ported from Studio): one blurred copy (texDof), focusMode picks where it wins.
    // Radial (0) — blur grows toward the frame edge (classic centre-focus). Tilt-shift (1) — sharp
    // horizontal band, blurred above/below. Depth (2) — the depth map's red channel is the blur mask.
    if(fFocus>0.5){ let b=textureSample(texDof,samp,uv).rgb; var blur:f32; if(focusMode<0.5){ blur=smoothstep(0.25,0.95,length(uv-0.5)); } else if(focusMode<1.5){ blur=smoothstep(0.12,0.45,abs(uv.y-0.5)); } else { blur=textureSample(texDepth,samp,uv).r; } col=mix(col,b,clamp(blur,0.0,1.0)*dofAmt); }
    if(fBloom>0.5){ col=col+textureSample(texBloom,samp,uv).rgb*bloomAmt; }
    if(fHalation>0.5){ col=col+textureSample(texBloom,samp,uv).rgb*vec3<f32>(0.55,0.12,0.06)*1.4; }
    if(fTonemap>0.5){ let e=col*exposure; let tm=i32(tonemapMode+0.5); if(tm==2){ col=filmic(e); } else if(tm==3){ col=reinhard(e); } else { col=aces(e); } }
    if(fScan>0.5){ col=col*(0.92+0.08*sin(uv.y*1600.0)); }
    if(fVignette>0.5){ col=col*mix(1.0,smoothstep(1.18,0.35,length((uv-0.5)*vec2<f32>(1.05,1.0))),0.85); }
    // VHS (ported from Studio): one strength (vhsAmt 0..1) drives the whole magnetic-tape look — per-row
    // horizontal jitter, RGB tape bleed, a rolling dropout band of noise, and a fine scanline shimmer.
    if(fVhs>0.5){ let a=vhsAmt; let jl=floor(uv.y*80.0); let jitter=(h2(vec2<f32>(jl,floor(time*8.0)))-0.5)*0.04*a; let su=uv+vec2<f32>(jitter,0.0); let bleed=0.02*a; let r=textureSample(texScene,samp,su+vec2<f32>(bleed,0.0)).r; let gg=textureSample(texScene,samp,su).g; let bb=textureSample(texScene,samp,su-vec2<f32>(bleed,0.0)).b; var v=vec3<f32>(r,gg,bb); let band=smoothstep(0.9,0.98,uv.y+(h2(vec2<f32>(floor(time*3.0),0.0))-0.5)*0.06); let ns=h2(uv*vec2<f32>(320.0,240.0)+fract(time)); v=mix(v,vec3<f32>(ns),band*a*0.8); v=v*(0.9+0.1*sin(uv.y*640.0+time*30.0)); col=mix(col,v,a); }
    return vec4<f32>(col,1.0);
  }
  fn modf2(a:f32,b:f32)->f32{ return a-b*floor(a/b); }`;

  async function createEngine(canvas) {
    if (!navigator.gpu) throw new Error('no webgpu');
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('no adapter');
    const device = await adapter.requestDevice();
    const ctx = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({ device, format, alphaMode: 'opaque' });
    const OFF = 'rgba8unorm';

    const mod = (code) => device.createShaderModule({ code });
    const mFull = mod(VS_FULL);
    const mScene = mod(SCENE_WGSL), mPart = mod(PART_WGSL), mBlur = mod(BLUR_WGSL), mComp = mod(COMP_WGSL);

    function fsPipeline(fragMod, targetFormat, blend) {
      return device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: mFull, entryPoint: 'vs' },
        fragment: { module: fragMod, entryPoint: 'fs', targets: [{ format: targetFormat, blend: blend || undefined }] },
        primitive: { topology: 'triangle-list' },
      });
    }
    const pScene = fsPipeline(mScene, OFF);
    const pBlur = fsPipeline(mBlur, OFF);
    const pComp = fsPipeline(mComp, format);
    const ADD_BLEND = { color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' } };
    const ALPHA_BLEND = { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' } };
    function partPipeline(blend) {
      return device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: mPart, entryPoint: 'vs' },
        fragment: { module: mPart, entryPoint: 'fs', targets: [{ format: OFF, blend }] },
        primitive: { topology: 'triangle-list' },
      });
    }
    const pPartAdd = partPipeline(ADD_BLEND);
    const pPartAlpha = partPipeline(ALPHA_BLEND);

    const samp = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' });

    // uniform buffers — each is a fixed-size array<vec4<f32>,N> in WGSL, mirrored by a Float32Array
    // on the CPU (N*4 floats). fX[k] maps to U_.d[k>>2][k&3]. Effect flags and params occupy fixed
    // lanes (no registry) — see the per-slot maps where fScene/fComp are written in render(), and
    // ARCHITECTURE.md. The vec4 count, the Float32Array length, and buf(n) must stay in lockstep;
    // adding a uniform past the free pad lanes means growing all three together.
    const buf = (n) => device.createBuffer({ size: n * 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const ubScene = buf(7), ubComp = buf(7), ubPart = buf(2), ubBlur = buf(2);
    const fScene = new Float32Array(28), fComp = new Float32Array(28), fPart = new Float32Array(8), fBlur = new Float32Array(8);

    // render targets
    let W = 1, H = 1, dpr = Math.min(window.devicePixelRatio || 1, 1.5); // hardcoded: dpr cap 1.5 (GPU budget)
    let sceneTex, bloomA, bloomB, dofA, dofB;
    function mkTarget(w, h) { return device.createTexture({ size: [w, h], format: OFF, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST }); }
    function destroyT(t) { if (t) t.destroy(); }
    function resize() {
      const rc = canvas.getBoundingClientRect();
      W = Math.max(2, Math.round(rc.width * dpr)); H = Math.max(2, Math.round(rc.height * dpr));
      canvas.width = W; canvas.height = H;
      [sceneTex, bloomA, bloomB, dofA, dofB].forEach(destroyT);
      const hw = Math.max(2, W >> 1), hh = Math.max(2, H >> 1);
      sceneTex = mkTarget(W, H); bloomA = mkTarget(hw, hh); bloomB = mkTarget(hw, hh); dofA = mkTarget(hw, hh); dofB = mkTarget(hw, hh);
    }
    resize();
    const ro = new ResizeObserver(() => resize()); ro.observe(canvas);

    // textures
    const textures = {};
    function placeholderTex() {
      const t = device.createTexture({ size: [1, 1], format: OFF, usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
      device.queue.writeTexture({ texture: t }, new Uint8Array([20, 20, 26, 255]), { bytesPerRow: 4 }, [1, 1]);
      return t;
    }
    // Persistent 1×1 stand-in bound to the scene pass's depth slot whenever a scene has no depth map.
    // The 'auto' layout requires the depth binding every frame; parallax reads ~0 depth from it so it
    // degrades to no shift (and no shipped scene toggles parallax, so this is inert until a depth look ships).
    const noTex = placeholderTex();
    function loadTexture(key, url) {
      const e = { tex: placeholderTex(), aspect: 16 / 9 };
      textures[key] = e;
      (async () => {
        try {
          const resp = await fetch(url); const blob = await resp.blob();
          const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
          e.aspect = bmp.width / bmp.height;
          const t = device.createTexture({ size: [bmp.width, bmp.height], format: OFF, usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
          device.queue.copyExternalImageToTexture({ source: bmp }, { texture: t }, [bmp.width, bmp.height]);
          e.tex = t;
        } catch (err) { console.error('tex load failed', url, err); }
      })();
      return e;
    }

    // hardcoded: particle config, indexed by type (PT). COUNTS are instance counts scaled by
    // params.intensity at draw; ADDITIVE picks add vs alpha blend; ROUND picks the soft-disc vs
    // streak fragment shape. The index into these arrays is the `ty` the particle shader branches on.
    //              ash   dust
    const COUNTS = [2500, 3000];
    const ADDITIVE = [false, true];
    const ROUND = [1, 1];
    const PT = ['ash', 'dust'];

    let curTex = null, prevTex = null, trans = 1.0, transMode = 0, transDur = 0.8;
    // Key into `textures` of the active scene's depth map (loaded via loadTexture like any image), or null.
    let depthKey = null;
    const state = { time: 0, mouse: [0.5, 0.5], wind: 0.15, glitch: 0, toggles: {}, params: { intensity: 0.8, fogAmt: 0.6, bloomAmt: 0.7, dofAmt: 0.3, exposure: 1.0, tonemapMode: 0, focusMode: 0, vhsAmt: 0.55, turb: {}, parallaxAmt: 0.05 } };
    function tf(k) { return state.toggles[k] ? 1 : 0; }
    function bg(pipeline, entries) { return device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries }); }

    function fullDraw(pass, pipeline, group) { pass.setPipeline(pipeline); pass.setBindGroup(0, group); pass.draw(3); }

    function renderTo(targetView, pipeline, group, clear) {
      const enc = device.createCommandEncoder();
      const pass = enc.beginRenderPass({ colorAttachments: [{ view: targetView, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }] });
      fullDraw(pass, pipeline, group); pass.end();
      device.queue.submit([enc.finish()]);
    }

    function doBlur(srcTex, tmp, dst, bright, w, h) {
      // pass 1: src -> tmp (horizontal)
      fBlur[0] = 1; fBlur[1] = 0; fBlur[2] = 1 / w; fBlur[3] = 1 / h; fBlur[4] = bright; device.queue.writeBuffer(ubBlur, 0, fBlur);
      let group = bg(pBlur, [{ binding: 0, resource: { buffer: ubBlur } }, { binding: 1, resource: samp }, { binding: 2, resource: srcTex.createView() }]);
      renderTo(tmp.createView(), pBlur, group, true);
      // pass 2: tmp -> dst (vertical)
      fBlur[0] = 0; fBlur[1] = 1; fBlur[4] = 0; device.queue.writeBuffer(ubBlur, 0, fBlur);
      group = bg(pBlur, [{ binding: 0, resource: { buffer: ubBlur } }, { binding: 1, resource: samp }, { binding: 2, resource: tmp.createView() }]);
      renderTo(dst.createView(), pBlur, group, true);
    }

    // render pass order (one frame):
    //   1. scene + particles       — SCENE_WGSL to sceneTex (full res); particles drawn in the SAME pass
    //   2. (opt) bloom / dof blur  — doBlur() separable Gaussian into half-res bloomA / dofA
    //   3. composite               — COMP_WGSL post-FX to the swapchain (canvas)
    function render() {
      const t = state.time;

      // scene uniforms — ubScene slot map (fScene index → meaning):
      //   d[0] 0:time 1:canvasAspect(W/H) 2:curImgAspect 3:prevImgAspect
      //   d[1] 4:mouse.x 5:mouse.y 6:— 7:—
      //   d[2] 8:trans 9:transMode 10:fogAmt 11:—
      //   d[3] 12:grade 13:warm 14:— 15:—     | d[4] 16:— 17:— 18:— 19:—
      //   d[5] 20:— 21:— 22:fog 23:—          | d[6] 24:parallax 25:— 26:kenburns 27:parallaxAmt
      // (6–7, 14–21, 23, 25 are documented gaps — pruned effects' lanes, left 0 rather than renumbered.)
      const cur = curTex || { tex: placeholderTex(), aspect: 16 / 9 };
      const prv = prevTex || cur;
      fScene[0] = t; fScene[1] = W / H; fScene[2] = cur.aspect; fScene[3] = prv.aspect;
      fScene[4] = state.mouse[0]; fScene[5] = state.mouse[1];
      fScene[8] = trans; fScene[9] = transMode; fScene[10] = state.params.fogAmt; fScene[11] = 0;
      fScene[12] = tf('grade'); fScene[13] = tf('warm');
      fScene[22] = tf('fog');
      fScene[24] = tf('parallax'); fScene[26] = tf('kenburns'); fScene[27] = state.params.parallaxAmt;
      device.queue.writeBuffer(ubScene, 0, fScene);
      // Active scene's depth map (or the 1×1 stand-in). Bound every frame (auto layout requires it),
      // but parallax samples it only while the 'parallax' toggle is on.
      const depthEntry = depthKey ? textures[depthKey] : null;
      const depthView = (depthEntry?.tex ?? noTex).createView();
      const sceneGroup = bg(pScene, [
        { binding: 0, resource: { buffer: ubScene } }, { binding: 1, resource: samp },
        { binding: 2, resource: cur.tex.createView() }, { binding: 3, resource: prv.tex.createView() },
        { binding: 4, resource: depthView },
      ]);

      // scene + particles in one pass
      const enc = device.createCommandEncoder();
      const pass = enc.beginRenderPass({ colorAttachments: [{ view: sceneTex.createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }] });
      pass.setPipeline(pScene); pass.setBindGroup(0, sceneGroup); pass.draw(3);
      // particles
      fPart[1] = state.wind; fPart[5] = W; fPart[6] = H; fPart[7] = dpr;
      for (let i = 0; i < PT.length; i++) {
        if (!state.toggles[PT[i]]) continue;
        fPart[0] = t; fPart[2] = i; fPart[3] = state.params.turb[PT[i]] || 0; fPart[4] = ROUND[i];
        device.queue.writeBuffer(ubPart, 0, fPart);
        const pp = ADDITIVE[i] ? pPartAdd : pPartAlpha;
        const grp = bg(pp, [{ binding: 0, resource: { buffer: ubPart } }]);
        pass.setPipeline(pp); pass.setBindGroup(0, grp);
        pass.draw(6, Math.round(COUNTS[i] * state.params.intensity));
      }
      pass.end();
      device.queue.submit([enc.finish()]);

      // bloom / dof
      const doBloom = state.toggles.bloom || state.toggles.halation;
      const hw = Math.max(2, W >> 1), hh = Math.max(2, H >> 1);
      if (doBloom) doBlur(sceneTex, bloomB, bloomA, 1.0, hw, hh);
      const doDof = state.toggles.focus;
      if (doDof) doBlur(sceneTex, dofB, dofA, 0.0, hw, hh);

      // composite to swapchain — ubComp slot map (fComp index → meaning):
      //   d[0] 0:time 1:glitch 2:— 3:bloomAmt   | d[1] 4:dofAmt 5:exposure 6:— 7:—
      //   d[2] 8:texelF.x(1/W) 9:texelF.y(1/H) 10:tonemapMode 11:focusMode
      //   d[3] 12:bloom 13:focus 14:vignette 15:scan   | d[4] 16:— 17:tonemap 18:— 19:halation
      //   d[5] 20:— 21:— 22:— 23:—                     | d[6] 24:— 25:vhs 26:vhsAmt 27:FREE
      // (2, 6, 16, 18, 20–24 are documented gaps — pruned effects' lanes, left 0 rather than renumbered.)
      fComp[0] = t; fComp[1] = state.glitch; fComp[3] = state.params.bloomAmt;
      fComp[4] = state.params.dofAmt; fComp[5] = state.params.exposure;
      fComp[8] = 1 / W; fComp[9] = 1 / H; fComp[10] = state.params.tonemapMode; fComp[11] = state.params.focusMode;
      fComp[12] = tf('bloom'); fComp[13] = tf('focus'); fComp[14] = tf('vignette'); fComp[15] = tf('scan');
      fComp[17] = tf('tonemap'); fComp[19] = tf('halation');
      fComp[25] = tf('vhs'); fComp[26] = state.params.vhsAmt;
      device.queue.writeBuffer(ubComp, 0, fComp);
      const compGroup = bg(pComp, [
        { binding: 0, resource: { buffer: ubComp } }, { binding: 1, resource: samp },
        { binding: 2, resource: sceneTex.createView() },
        { binding: 3, resource: (doBloom ? bloomA : sceneTex).createView() },
        { binding: 4, resource: (doDof ? dofA : sceneTex).createView() },
        { binding: 5, resource: depthView },
      ]);
      renderTo(ctx.getCurrentTexture().createView(), pComp, compGroup, true);
    }

    return {
      device, state, backend: 'webgpu',
      loadTexture,
      setActive(key) { const e = textures[key]; if (!e) return; if (!curTex) { curTex = e; prevTex = e; trans = 1.0; } else if (e !== curTex) { prevTex = curTex; curTex = e; trans = 0.0; } },
      setTransition(modeIdx, durSec) { transMode = modeIdx; transDur = Math.max(0.1, durSec); },
      setDepth(key) { depthKey = key || null; },
      setMouse(x, y) { state.mouse[0] = x; state.mouse[1] = y; },
      setToggles(t) { state.toggles = t; },
      setParams(p) { Object.assign(state.params, p); },
      setGlitch(v) { state.glitch = v; },
      transitioning() { return trans < 1.0; },
      tick(dt) {
        const rc = canvas.getBoundingClientRect();
        const tw = Math.round(rc.width * dpr), th = Math.round(rc.height * dpr);
        if (tw > 2 && th > 2 && (tw !== W || th !== H)) resize();
        if (trans < 1.0) trans = Math.min(1.0, trans + dt / transDur);
        state.time += dt; render();
      },
      dispose() {
        ro.disconnect();
        for (const k in textures) destroyT(textures[k]?.tex);
        destroyT(noTex);
        [sceneTex, bloomA, bloomB, dofA, dofB].forEach(destroyT);
        [ubScene, ubComp, ubPart, ubBlur].forEach((b) => b.destroy());
        device.destroy();
      },
    };
  }

  export { createEngine };
