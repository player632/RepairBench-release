/**
 * Procedural keycap geometry.
 *
 * Approach: generate a grid of vertices for top and bottom faces,
 * then stitch sides between them. All faces use CCW winding
 * when viewed from outside (Three.js default front-face).
 */

import * as THREE from "three";

/**
 * @param {Object} params
 * @param {number} [params.topWidth=0.85]
 * @param {number} [params.topDepth=0.85]
 * @param {number} [params.dishDepth=0.05]
 * @param {"cylindrical"|"spherical"|"flat"} [params.dishType="cylindrical"]
 * @param {number} [params.segments=6]
 * @returns {THREE.BufferGeometry}
 */
export function createKeycapGeometry({
  topWidth = 0.85,
  topDepth = 0.85,
  dishDepth = 0.05,
  dishType = "cylindrical",
  segments = 6,
} = {}) {
  const S = segments;
  const S1 = S + 1;

  // Half-sizes
  const bw = 0.5, bd = 0.5, hh = 0.5; // bottom half-width, half-depth, half-height
  const tw = bw * topWidth, td = bd * topDepth;

  // Dish offset
  const dish = (u01, v01) => {
    if (dishDepth <= 0 || dishType === "flat") return 0;
    const nx = (u01 - 0.5) * 2;
    const nz = (v01 - 0.5) * 2;
    if (dishType === "cylindrical") {
      return -dishDepth * Math.max(0, 1 - nx * nx);
    }
    return -dishDepth * Math.max(0, 1 - nx * nx - nz * nz);
  };

  // Lerp helper
  const lerp = (a, b, t) => a + (b - a) * t;

  // We'll build positions array, then index it
  const pos = [];
  const idx = [];

  // ════════════════════════════════════════════
  // TOP FACE: (S+1)*(S+1) grid at y = +hh + dish
  // ════════════════════════════════════════════
  const topBase = 0;
  for (let iz = 0; iz < S1; iz++) {
    const v = iz / S;
    for (let ix = 0; ix < S1; ix++) {
      const u = ix / S;
      pos.push(
        lerp(-tw, tw, u),
        hh + dish(u, v),
        lerp(-td, td, v)
      );
    }
  }
  // Index top face: viewed from above (+Y), CCW
  for (let iz = 0; iz < S; iz++) {
    for (let ix = 0; ix < S; ix++) {
      const a = topBase + iz * S1 + ix;
      const b = a + 1;
      const d = a + S1;
      const c = d + 1;
      // Two triangles, CCW when viewed from +Y
      idx.push(a, d, b);
      idx.push(b, d, c);
    }
  }

  // ════════════════════════════════════════════
  // BOTTOM FACE: 4 vertices at y = -hh
  // ════════════════════════════════════════════
  const btmBase = pos.length / 3;
  // Corners: 0=front-left, 1=front-right, 2=back-right, 3=back-left
  pos.push(-bw, -hh, -bd); // 0
  pos.push( bw, -hh, -bd); // 1
  pos.push( bw, -hh,  bd); // 2
  pos.push(-bw, -hh,  bd); // 3
  // CCW when viewed from -Y (below)
  idx.push(btmBase, btmBase + 1, btmBase + 2);
  idx.push(btmBase, btmBase + 2, btmBase + 3);

  // ════════════════════════════════════════════
  // SIDE FACES: connect bottom edges to top edges
  // Each side: S quads, each quad has 4 unique verts (for sharp edges)
  // ════════════════════════════════════════════

  const addSideStrip = (bottomEdge, topEdge, flipWinding) => {
    // bottomEdge, topEdge: arrays of [x,y,z] with S+1 points each
    for (let i = 0; i < S; i++) {
      const base = pos.length / 3;
      const bl = bottomEdge[i], br = bottomEdge[i + 1];
      const tl = topEdge[i], tr = topEdge[i + 1];
      pos.push(...bl, ...br, ...tr, ...tl);
      if (flipWinding) {
        idx.push(base, base + 3, base + 2);
        idx.push(base, base + 2, base + 1);
      } else {
        idx.push(base, base + 1, base + 2);
        idx.push(base, base + 2, base + 3);
      }
    }
  };

  // Build edge arrays
  const frontBottom = [], frontTop = [];
  const backBottom = [], backTop = [];
  const leftBottom = [], leftTop = [];
  const rightBottom = [], rightTop = [];

  for (let i = 0; i < S1; i++) {
    const u = i / S;
    // Front edge (z = -depth)
    frontBottom.push([ lerp(-bw, bw, u), -hh, -bd ]);
    frontTop.push([ lerp(-tw, tw, u), hh + dish(u, 0), -td ]);
    // Back edge (z = +depth)
    backBottom.push([ lerp(-bw, bw, u), -hh, bd ]);
    backTop.push([ lerp(-tw, tw, u), hh + dish(u, 1), td ]);
    // Left edge (x = -width)
    leftBottom.push([ -bw, -hh, lerp(-bd, bd, u) ]);
    leftTop.push([ -tw, hh + dish(0, u), lerp(-td, td, u) ]);
    // Right edge (x = +width)
    rightBottom.push([ bw, -hh, lerp(-bd, bd, u) ]);
    rightTop.push([ tw, hh + dish(1, u), lerp(-td, td, u) ]);
  }

  // Front: outward normal is -Z. Looking from -Z, bottom goes left-to-right.
  // For CCW when viewed from -Z: bottom-right, bottom-left, top-left, top-right
  addSideStrip(frontBottom, frontTop, true);

  // Back: outward normal is +Z. Looking from +Z, bottom goes right-to-left.
  addSideStrip(backBottom, backTop, false);

  // Left: outward normal is -X.
  addSideStrip(leftBottom, leftTop, false);

  // Right: outward normal is +X.
  addSideStrip(rightBottom, rightTop, true);

  // ════════════════════════════════════════════
  // Build geometry
  // ════════════════════════════════════════════
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  return geo;
}

/** Create keycap geometry from a CapGeometry spec. */
export function createKeycapFromSpec(capSpec) {
  return createKeycapGeometry({
    topWidth: capSpec.topWidth || 0.85,
    topDepth: capSpec.topDepth || 0.85,
    dishDepth: capSpec.dishDepth || 0.05,
    dishType: capSpec.dishType || "cylindrical",
    segments: 6,
  });
}
