/**
 * Extrude a 2D profile into 3D case geometry.
 *
 * Profile coordinate system:
 *   profile x → 3D Z (front=0 → +Z, back=max → -Z)
 *   profile y → 3D Y (height)
 *   extrusion → 3D X (left/right width)
 *
 * Each point can have an optional `d` (depth offset) for creating
 * ramps, chamfers, and bevels — the point gets extruded at a different
 * width than the main body.
 */

import * as THREE from "three";

/**
 * @param {Array<{x: number, y: number, d?: number}>} profilePoints
 * @param {number} width — total case width in world units
 * @param {number} depth — total case depth in world units
 * @param {number} maxHeight — maps max profile Y to this world height
 * @returns {THREE.BufferGeometry}
 */
export function extrudeCaseProfile(profilePoints, width, depth, maxHeight) {
  if (profilePoints.length < 3) return new THREE.BufferGeometry();

  const hw = width / 2;

  // Normalize profile to world coordinates
  const maxPX = Math.max(...profilePoints.map((p) => p.x)) || 1;
  const maxPY = Math.max(...profilePoints.map((p) => p.y)) || 1;
  const scaleZ = depth / maxPX;
  const scaleY = maxHeight / maxPY;

  const wp = profilePoints.map((p) => ({
    z: depth / 2 - (p.x * scaleZ),
    y: p.y * scaleY,
    // Per-vertex width offset: d=0 means full width, d>0 means narrower at this vertex
    hwLocal: hw - (p.d || 0) * (width / 100),
  }));

  const n = wp.length;
  const verts = [];
  const idx = [];

  // ─── Side faces: connect consecutive profile points as quads ───
  // Each edge of the profile becomes a quad (4 verts: left-i, right-i, right-j, left-j)
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const base = verts.length / 3;
    const pi = wp[i], pj = wp[j];

    // Quad: left-i, right-i, right-j, left-j
    verts.push(-pi.hwLocal, pi.y, pi.z);  // 0
    verts.push( pi.hwLocal, pi.y, pi.z);  // 1
    verts.push( pj.hwLocal, pj.y, pj.z);  // 2
    verts.push(-pj.hwLocal, pj.y, pj.z);  // 3

    // Two triangles — outward-facing (determine by cross product)
    // We want the normal to face outward from the polygon
    idx.push(base, base + 1, base + 2);
    idx.push(base, base + 2, base + 3);
  }

  // ─── Left cap face (x = -hw side) ───
  // Collect all left-side vertices and triangulate with fan from centroid
  const leftBase = verts.length / 3;
  let cy = 0, cz = 0;
  for (const p of wp) { cy += p.y; cz += p.z; }
  cy /= n; cz /= n;
  verts.push(-hw, cy, cz); // centroid
  for (const p of wp) verts.push(-p.hwLocal, p.y, p.z);
  for (let i = 0; i < n; i++) {
    const a = leftBase;
    const b = leftBase + 1 + i;
    const c = leftBase + 1 + ((i + 1) % n);
    // CCW when viewed from -X (outside)
    idx.push(a, c, b);
  }

  // ─── Right cap face (x = +hw side) ───
  const rightBase = verts.length / 3;
  verts.push(hw, cy, cz); // centroid
  for (const p of wp) verts.push(p.hwLocal, p.y, p.z);
  for (let i = 0; i < n; i++) {
    const a = rightBase;
    const b = rightBase + 1 + i;
    const c = rightBase + 1 + ((i + 1) % n);
    // CCW when viewed from +X (outside)
    idx.push(a, b, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  // Double-sided to avoid any winding issues
  return geo;
}

/**
 * Compute the mount surface: a line segment on the top of the case
 * where keys should be placed.
 *
 * Returns { startY, startZ, endY, endZ, angle } in world coordinates,
 * representing where the key field mounts.
 *
 * @param {Array<{x: number, y: number}>} profilePoints
 * @param {number[]} mountEdge — [fromIndex, toIndex]
 * @param {number} depth
 * @param {number} maxHeight
 * @returns {{ startY, startZ, endY, endZ, angle }}
 */
export function computeMountSurface(profilePoints, mountEdge, depth, maxHeight) {
  const maxPX = Math.max(...profilePoints.map((p) => p.x)) || 1;
  const maxPY = Math.max(...profilePoints.map((p) => p.y)) || 1;
  const scaleZ = depth / maxPX;
  const scaleY = maxHeight / maxPY;

  // Always orient front-to-back (lower profile x = front) regardless of
  // mountEdge winding order.  This ensures dy and angle are consistent
  // no matter which direction the edge was specified.
  let from = profilePoints[mountEdge[0]];
  let to = profilePoints[mountEdge[1]];
  if (from.x > to.x) { const tmp = from; from = to; to = tmp; }

  const startZ = depth / 2 - (from.x * scaleZ);   // front → +Z
  const startY = from.y * scaleY;
  const endZ = depth / 2 - (to.x * scaleZ);        // back  → -Z
  const endY = to.y * scaleY;

  // Slope angle: positive when back is higher than front
  const dz = Math.abs(endZ - startZ) || 1;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dz);

  return { startY, startZ, endY, endZ, angle };
}

/**
 * Extrude a single edge into a thin strip geometry (accent / LED strip).
 *
 * The strip sits slightly above the case surface so it's visible.
 * It spans the full extrusion width at the two endpoints.
 *
 * @param {Array<{x: number, y: number, d?: number}>} profilePoints
 * @param {number} fromIdx — start point index
 * @param {number} toIdx   — end point index
 * @param {number} width   — case width
 * @param {number} depth   — case depth
 * @param {number} maxHeight
 * @param {number} [thickness=0.03] — strip thickness (height above surface)
 * @returns {THREE.BufferGeometry}
 */
export function extrudeEdgeStrip(profilePoints, fromIdx, toIdx, width, depth, maxHeight, thickness = 0.03) {
  const hw = width / 2;
  const maxPX = Math.max(...profilePoints.map((p) => p.x)) || 1;
  const maxPY = Math.max(...profilePoints.map((p) => p.y)) || 1;
  const scaleZ = depth / maxPX;
  const scaleY = maxHeight / maxPY;

  const pFrom = profilePoints[fromIdx];
  const pTo = profilePoints[toIdx];

  const z0 = depth / 2 - (pFrom.x * scaleZ);
  const y0 = pFrom.y * scaleY;
  const hw0 = hw - (pFrom.d || 0) * (width / 100);

  const z1 = depth / 2 - (pTo.x * scaleZ);
  const y1 = pTo.y * scaleY;
  const hw1 = hw - (pTo.d || 0) * (width / 100);

  // Compute outward normal for offset (so strip sits on surface, not inside)
  const dz = z1 - z0;
  const dy = y1 - y0;
  const len = Math.hypot(dz, dy) || 1;
  const ny = dz / len;   // outward normal Y component
  const nz = -dy / len;  // outward normal Z component
  const off = thickness;

  // 4 corners at "from", 4 corners at "to" — outer face strip
  const verts = new Float32Array([
    // From end — bottom edge
    -hw0, y0,          z0,
     hw0, y0,          z0,
    // From end — top edge (offset outward)
    -hw0, y0 + ny*off, z0 + nz*off,
     hw0, y0 + ny*off, z0 + nz*off,
    // To end — bottom edge
    -hw1, y1,          z1,
     hw1, y1,          z1,
    // To end — top edge (offset outward)
    -hw1, y1 + ny*off, z1 + nz*off,
     hw1, y1 + ny*off, z1 + nz*off,
  ]);

  const indices = [
    // Front face (from bottom to top, from→to)
    0, 1, 5, 0, 5, 4,  // bottom strip
    2, 3, 7, 2, 7, 6,  // top strip
    0, 2, 6, 0, 6, 4,  // left side
    1, 5, 7, 1, 7, 3,  // right side
    0, 1, 3, 0, 3, 2,  // from cap
    4, 5, 7, 4, 7, 6,  // to cap
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Convert profile to shell schema JSON.
 */
export function profileToShellSchema({ name, profilePoints, mountEdge }) {
  return {
    schema: "eletypes-shell/1",
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    meta: { name },
    profile: {
      points: profilePoints,
      mountEdge,
    },
  };
}
