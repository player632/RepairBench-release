/**
 * KeyboardLab — 3D keyboard visualization wrapper.
 *
 * Accepts a BoardLayout and optional ShellProfile.
 * Defaults to generic-75-ansi if no layout provided.
 */

import React, { forwardRef, useRef, useImperativeHandle, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import KeyboardModel from "./KeyboardModel";
import ViewportControls from "./ViewportControls";
import { getPreset } from "./presets";

// Keeps the camera FOV in sync with the viewer setting. The `camera` prop on
// <Canvas> is applied once at mount; runtime FOV changes have to go through
// camera.fov + updateProjectionMatrix().
const CameraFovAdjuster = ({ fov }) => {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    if (!camera) return;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, fov, invalidate]);
  return null;
};

const DEFAULT_PRESET = getPreset("generic-75-ansi");

// Deterministic pseudo-random from a seed so star positions don't flicker on
// re-render. Simple LCG.
const seededRand = (seed) => {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// CSS background builder — turns the viewer bg type + 1–2 colors + options
// into a single `background` value we slap on the wrapper div. The Canvas
// clears to transparent so this shows through. When grid3D is true we skip
// the CSS grid — a 3D GridHelper inside the scene handles it instead.
const buildViewportBg = (type, c1, c2, { starCount = 6, grid3D = false } = {}) => {
  switch (type) {
    case "gradient":
      return `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`;
    case "studio":
      return `radial-gradient(ellipse at center, ${c1} 0%, ${c2} 90%)`;
    case "stars": {
      // Generate N stars with a seeded RNG so the pattern is stable across
      // renders. Each star is its own radial-gradient layer.
      const n = Math.max(0, Math.min(200, starCount | 0));
      const rand = seededRand(42); // fixed seed — stable star field
      const layers = [];
      for (let i = 0; i < n; i++) {
        const x = (rand() * 100).toFixed(1);
        const y = (rand() * 100).toFixed(1);
        const size = (1 + rand() * 1.5).toFixed(1);
        layers.push(`radial-gradient(${size}px ${size}px at ${x}% ${y}%, #fff 50%, transparent 51%)`);
      }
      layers.push(`linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`);
      return layers.join(",");
    }
    case "grid": {
      // 3D mode: solid base only — the GridHelper inside the scene draws the
      // perspective grid. 2D mode: blueprint-style crosshatch via two 1px
      // line gradients at 40px spacing.
      if (grid3D) return c1;
      const line = c2 || "#ffffff22";
      return (
        `linear-gradient(to right, ${line} 1px, transparent 1px) 0 0 / 40px 40px,` +
        `linear-gradient(to bottom, ${line} 1px, transparent 1px) 0 0 / 40px 40px,` +
        `${c1}`
      );
    }
    case "solid":
    default:
      return c1;
  }
};

const KeyboardLab = forwardRef(({
  layout = DEFAULT_PRESET.layout,
  shell = DEFAULT_PRESET.shell,
  keycapPreset,
  keycapColor = "#2a2a2e",
  accentKeyColor = "#3d3d42",
  caseColor = "#1a1a1e",
  opacity,
  legendPreset,
  caseProfile,
  caseScale = 1.0,
  mountOffset = { x: 0, y: 0, z: 0 },
  mountFit = 0.85,
  extrudeWidth = 1.0,
  renderStyle,
  renderStyleCase,
  backgroundColor = "#111115",
  ambientIntensity = 0.35,
  keyIntensity = 0.9,
  viewerBgType = "solid",
  viewerBg2 = "#1a1a2e",
  fov = 40,
  fogDensity = 0,
  shadowOpacity = 0.25,
  grid3D = false,
  starCount = 6,
  onViewerChange,
  style,
}, ref) => {
  const modelRef = useRef();

  useImperativeHandle(ref, () => ({
    triggerKey: (keyName) => {
      modelRef.current?.triggerKey(keyName);
    },
  }), []);

  const cssBackground = buildViewportBg(viewerBgType, backgroundColor, viewerBg2, { starCount, grid3D });
  const showGrid3D = viewerBgType === "grid" && grid3D;

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative",
      background: cssBackground,
      ...style,
    }}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
        camera={{ position: [0, 10, 16], fov, near: 0.1, far: 100 }}
        // Transparent clear so the wrapper div's CSS background shows through —
        // this is how we get gradient / studio / stars for free, without any
        // skybox or RenderTarget setup.
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }}
      >
        {/* Exponential fog for depth falloff — color matches the bg so the
            keyboard blends into the distance. density = 0 disables it. */}
        {fogDensity > 0 && <fogExp2 attach="fog" args={[backgroundColor, fogDensity]} />}
        <CameraFovAdjuster fov={fov} />
        <ambientLight intensity={ambientIntensity} />
        <directionalLight position={[6, 10, 4]} intensity={keyIntensity * 1.0} />
        <directionalLight position={[-4, 6, -3]} intensity={keyIntensity * 0.28} />
        <directionalLight position={[0, 2, -8]} intensity={keyIntensity * 0.17} />
        <Environment preset="apartment" />

        {/* Ground contact shadow — adds depth + grounds the keyboard in space.
            Zero opacity skips it. Extra-wide + soft so the board feels heavier. */}
        {shadowOpacity > 0 && (
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={shadowOpacity}
            scale={18}
            blur={2.2}
            far={4}
            resolution={512}
            color="#000000"
          />
        )}

        {/* Scene-space 3D grid — perspective depth you can't get from flat CSS.
            Two-tone grid with denser minor lines. Sits just below the case. */}
        {showGrid3D && (
          <gridHelper
            args={[40, 40, viewerBg2 || "#5ba3d9", viewerBg2 || "#1a3a5c"]}
            position={[0, -0.55, 0]}
          />
        )}

        <KeyboardModel
          ref={modelRef}
          layout={layout}
          shell={shell}
          keycapPreset={keycapPreset}
          keycapColor={keycapColor}
          accentKeyColor={accentKeyColor}
          caseColor={caseColor}
          opacity={opacity}
          legendPreset={legendPreset}
          caseProfile={caseProfile}
          caseScale={caseScale}
          mountOffset={mountOffset}
          mountFit={mountFit}
          extrudeWidth={extrudeWidth}
          renderStyle={renderStyle}
          renderStyleCase={renderStyleCase}
        />

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.42}
          minDistance={4}
          maxDistance={35}
          enableDamping
          dampingFactor={0.06}
          target={[0, 0.15, 0]}
        />
      </Canvas>

      {onViewerChange && (
        <ViewportControls
          bgType={viewerBgType}
          bg1={backgroundColor}
          bg2={viewerBg2}
          ambient={ambientIntensity}
          keyLight={keyIntensity}
          fov={fov}
          fogDensity={fogDensity}
          shadowOpacity={shadowOpacity}
          grid3D={grid3D}
          starCount={starCount}
          onChange={onViewerChange}
        />
      )}
    </div>
  );
});

KeyboardLab.displayName = "KeyboardLab";

export default KeyboardLab;
