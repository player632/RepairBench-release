/**
 * ViewportControls — floating settings overlay anchored to the 3D viewport.
 *
 * Observer-side controls (background, lighting, depth/atmosphere). These are
 * NOT part of the design doc — they're the viewer's preference for how the
 * keyboard is lit and framed while they look at it. Collapsed by default;
 * click the ⚙ button in the top-right corner of the viewport to expand.
 *
 * Layout is vertical — every row is its own labeled line so tall panels don't
 * get cramped. Sections stack: Background → Lighting → Depth.
 */

import React, { useState } from "react";
import { useLabTranslation } from "./i18n/useLabTranslation";

// Second-color defaults tuned per bg type so switching types doesn't land the
// user on an ugly combination.
const BG2_DEFAULTS = {
  solid: "#111115",
  gradient: "#1a1a2e",
  studio: "#0a0a0f",
  stars: "#050510",
  grid: "#2a3550",
};

const ViewportControls = ({
  bgType, bg1, bg2, ambient, keyLight,
  fov, fogDensity, shadowOpacity,
  grid3D, starCount,
  onChange,
}) => {
  const tLab = useLabTranslation();
  const [open, setOpen] = useState(false);
  const {
    setViewerBg, setViewerBg2, setViewerBgType,
    setViewerAmbient, setViewerKey,
    setViewerFov, setViewerFog, setViewerShadow,
    setViewerGrid3D, setViewerStarCount,
  } = onChange || {};

  const BG_TYPES = [
    { id: "solid",    label: tLab("lab_viewer_bg_solid") },
    { id: "gradient", label: tLab("lab_viewer_bg_gradient") },
    { id: "studio",   label: tLab("lab_viewer_bg_studio") },
    { id: "stars",    label: tLab("lab_viewer_bg_stars") },
    { id: "grid",     label: tLab("lab_viewer_bg_grid") },
  ];

  const btn = {
    background: "rgba(20, 20, 28, 0.85)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "6px",
    color: "#e0e0e0",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "inherit",
    display: "flex", alignItems: "center", gap: "6px",
  };
  const panel = {
    background: "rgba(20, 20, 28, 0.92)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    color: "#e0e0e0",
    padding: "16px",
    fontSize: "12px",
    display: "flex", flexDirection: "column", gap: "14px",
    width: "240px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  };
  const section = { display: "flex", flexDirection: "column", gap: "8px" };
  const sectionTitle = {
    fontSize: "10px", fontWeight: 600, letterSpacing: "1.2px",
    textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
    paddingBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.08)",
  };
  const row = { display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between" };
  const label = { fontSize: "11px", color: "rgba(255,255,255,0.7)" };
  const input = {
    background: "rgba(0,0,0,0.35)",
    color: "#e0e0e0",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "3px",
    padding: "3px 6px",
    fontSize: "12px",
    fontFamily: "monospace",
    width: "64px",
    textAlign: "right",
  };
  // colorScheme: "dark" tells the browser to render this native control
  // (including its dropdown options) with dark-theme system colors, fixing
  // the white-on-dark contrast issue when options are open.
  const select = { ...input, width: "110px", textAlign: "left", fontFamily: "inherit", colorScheme: "dark" };
  const colorSwatch = { width: "28px", height: "28px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", cursor: "pointer", background: "transparent", padding: 0 };

  const handleTypeChange = (nextType) => {
    setViewerBgType?.(nextType);
    // Seed a nice bg2 default when switching away from solid, unless the user
    // already customized bg2.
    if (nextType !== "solid" && bg2 === BG2_DEFAULTS[bgType]) {
      setViewerBg2?.(BG2_DEFAULTS[nextType]);
    }
  };

  // Second-color controls only make sense when the bg type uses one.
  const hasSecondColor = bgType !== "solid";
  // For grid, the second color is a line color; for gradient/studio/stars it's
  // a second gradient stop. Labeling reflects the meaning.
  const bg1Label = bgType === "solid" ? tLab("lab_viewer_bg_color") :
                   bgType === "grid" ? tLab("lab_viewer_bg_base") :
                   tLab("lab_viewer_bg_top");
  const bg2Label = bgType === "grid" ? tLab("lab_viewer_bg_lines") :
                   tLab("lab_viewer_bg_bottom");

  return (
    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 5 }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={btn}
          title={tLab("lab_tab_viewer")} aria-label={tLab("lab_tab_viewer")}>
          <span style={{ fontSize: "14px" }}>⚙</span>
          <span>{tLab("lab_tab_viewer")}</span>
        </button>
      ) : (
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "11px", letterSpacing: "1.2px", textTransform: "uppercase", opacity: 0.75 }}>
              {tLab("lab_tab_viewer")}
            </span>
            <button onClick={() => setOpen(false)}
              style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: 0 }}>
              ×
            </button>
          </div>

          {/* ── Background ────────────────────── */}
          <div style={section}>
            <div style={sectionTitle}>{tLab("lab_viewer_bg")}</div>
            <div style={row}>
              <span style={label}>{tLab("lab_viewer_bg_type")}</span>
              <select value={bgType} onChange={(e) => handleTypeChange(e.target.value)} style={select}>
                {BG_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div style={row}>
              <span style={label}>{bg1Label}</span>
              <input type="color" value={bg1}
                onChange={(e) => setViewerBg?.(e.target.value)}
                style={colorSwatch} />
            </div>
            {hasSecondColor && (
              <div style={row}>
                <span style={label}>{bg2Label}</span>
                <input type="color" value={bg2}
                  onChange={(e) => setViewerBg2?.(e.target.value)}
                  style={colorSwatch} />
              </div>
            )}
            {bgType === "grid" && (
              <div style={row}>
                <span style={label}>{tLab("lab_viewer_grid_3d")}</span>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!grid3D}
                    onChange={(e) => setViewerGrid3D?.(e.target.checked)}
                    style={{ accentColor: "#6ec6ff", cursor: "pointer" }} />
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                    {tLab("lab_viewer_grid_3d_note")}
                  </span>
                </label>
              </div>
            )}
            {bgType === "stars" && (
              <div style={row}>
                <span style={label}>{tLab("lab_viewer_star_count")}</span>
                <input type="number" min="0" max="200" step="1" value={starCount ?? 6}
                  onChange={(e) => setViewerStarCount?.(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
                  style={input} />
              </div>
            )}
          </div>

          {/* ── Lighting ──────────────────────── */}
          <div style={section}>
            <div style={sectionTitle}>{tLab("lab_viewer_lighting")}</div>
            <div style={row}>
              <span style={label}>{tLab("lab_viewer_ambient")}</span>
              <input type="number" min="0" max="2" step="0.05" value={ambient.toFixed(2)}
                onChange={(e) => setViewerAmbient?.(Math.max(0, Math.min(2, parseFloat(e.target.value) || 0)))}
                style={input} />
            </div>
            <div style={row}>
              <span style={label}>{tLab("lab_viewer_key_light")}</span>
              <input type="number" min="0" max="3" step="0.05" value={keyLight.toFixed(2)}
                onChange={(e) => setViewerKey?.(Math.max(0, Math.min(3, parseFloat(e.target.value) || 0)))}
                style={input} />
            </div>
          </div>

          {/* ── Depth ─────────────────────────── */}
          <div style={section}>
            <div style={sectionTitle}>{tLab("lab_viewer_depth")}</div>
            <div style={row}>
              <span style={label}>{tLab("lab_viewer_fov")}</span>
              <input type="number" min="20" max="70" step="1" value={fov}
                onChange={(e) => setViewerFov?.(Math.max(20, Math.min(70, parseInt(e.target.value) || 40)))}
                style={input} />
            </div>
            <div style={row}>
              <span style={label}>{tLab("lab_viewer_fog")}</span>
              <input type="number" min="0" max="0.2" step="0.005" value={(fogDensity ?? 0).toFixed(3)}
                onChange={(e) => setViewerFog?.(Math.max(0, Math.min(0.2, parseFloat(e.target.value) || 0)))}
                style={input} />
            </div>
            <div style={row}>
              <span style={label}>{tLab("lab_viewer_shadow")}</span>
              <input type="number" min="0" max="1" step="0.05" value={(shadowOpacity ?? 0).toFixed(2)}
                onChange={(e) => setViewerShadow?.(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                style={input} />
            </div>
          </div>

          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", fontStyle: "italic", lineHeight: 1.4 }}>
            {tLab("lab_viewer_note")}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewportControls;
