/**
 * KeyboardLayout2D — 2D keyboard layout renderer/editor foundation.
 *
 * Renders from the same BoardLayout JSON that drives the 3D renderer.
 * Uses positioned DOM divs (not SVG) for simplicity and text rendering.
 *
 * Current capabilities (V0):
 * - Renders all keys from layout at correct positions
 * - Click to select a key (shows properties)
 * - Active key highlighting (pressed keys)
 * - Color by kind (alpha, accent, mod, fn, nav, arrow)
 * - Export layout as JSON
 *
 * Future: drag to move keys, resize handles, property editor panel.
 */

import React, { useState, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import { computeBounds, extractKeys } from "./schema/derive";

const KIND_COLORS = {
  alpha:  { bg: "#2a2a2e", border: "#3a3a3e" },
  accent: { bg: "#3d3d42", border: "#4d4d52" },
  mod:    { bg: "#2d2d32", border: "#3d3d42" },
  fn:     { bg: "#252528", border: "#35353a" },
  nav:    { bg: "#282830", border: "#38383e" },
  arrow:  { bg: "#282830", border: "#38383e" },
};

const KeyboardLayout2D = ({
  layout,
  scale = 48,
  maxScale = 48,
  fitToContainer = true,
  activeKeys = null,
  onKeyClick,
  onLayoutChange,
  theme,
}) => {
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const containerRef = useRef(null);
  const [autoScale, setAutoScale] = useState(scale);
  const keys = extractKeys(layout);
  const bounds = useMemo(() => computeBounds(keys), [keys]);

  // Auto-scale: measure container width and pick the largest scale that fits.
  useLayoutEffect(() => {
    if (!fitToContainer) return;
    const el = containerRef.current;
    if (!el) return;
    const recompute = (width) => {
      if (!bounds.width || !width) return;
      // Reserve a few px for the key gap; round down to integer scale.
      const fit = Math.floor((width - 4) / bounds.width);
      setAutoScale(Math.max(8, Math.min(maxScale, fit)));
    };
    recompute(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => recompute(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [bounds.width, maxScale, fitToContainer]);

  const effectiveScale = fitToContainer ? autoScale : scale;

  const textColor = theme?.text || "#e0e0e0";
  const statsColor = theme?.stats || "#6ec6ff";
  const bgColor = theme?.background || "#111115";

  const handleKeyClick = useCallback((key) => {
    setSelectedKeyId(key.id === selectedKeyId ? null : key.id);
    if (onKeyClick) onKeyClick(key);
  }, [selectedKeyId, onKeyClick]);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(layout, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layout.id || "keyboard-layout"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [layout]);

  const handleCopyJson = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(layout, null, 2));
  }, [layout]);

  const selectedKey = keys.find((k) => k.id === selectedKeyId);

  const gap = 3; // pixel gap between keys

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", minWidth: 0 }}>
      {/* Layout metadata */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "12px", color: textColor, opacity: 0.7 }}>
          {layout?.meta?.name} — {keys.length} keys
        </div>
      </div>

      {/* Key field */}
      <div
        style={{
          position: "relative",
          width: bounds.width * effectiveScale + gap,
          height: bounds.height * effectiveScale + gap,
          margin: "0 auto",
        }}
      >
        {keys.map((key) => {
          const w = key.w * effectiveScale - gap;
          const h = (key.h || 1) * effectiveScale - gap;
          const x = key.x * effectiveScale;
          const y = key.y * effectiveScale;
          const isSelected = key.id === selectedKeyId;
          const isActive = activeKeys?.has(key.id);
          const colors = KIND_COLORS[key.kind] || KIND_COLORS.alpha;

          return (
            <div
              key={key.id}
              onClick={() => handleKeyClick(key)}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: w,
                height: h,
                background: isActive ? statsColor + "33" : colors.bg,
                border: `1px solid ${isSelected ? statsColor : isActive ? statsColor + "88" : colors.border}`,
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.1s, border-color 0.15s",
                boxShadow: isSelected ? `0 0 0 1px ${statsColor}` : "none",
                transform: key.rotation ? `rotate(${key.rotation}deg)` : undefined,
                transformOrigin: "center",
                userSelect: "none",
              }}
            >
              <span
                style={{
                  fontSize: w < effectiveScale * 0.8 ? "9px" : key.label?.length > 3 ? "9px" : "11px",
                  color: isActive ? statsColor : textColor,
                  opacity: isActive ? 1 : 0.7,
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  padding: "0 2px",
                }}
              >
                {key.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected key properties */}
      {selectedKey && (
        <div
          style={{
            fontSize: "12px",
            color: textColor,
            background: bgColor,
            border: `1px solid ${textColor}22`,
            borderRadius: "6px",
            padding: "10px 14px",
            fontFamily: "monospace",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "4px 12px",
            maxWidth: bounds.width * effectiveScale,
            margin: "0 auto",
          }}
        >
          <span style={{ opacity: 0.5 }}>id</span><span>{selectedKey.id}</span>
          <span style={{ opacity: 0.5 }}>label</span><span>{selectedKey.label || "(none)"}</span>
          <span style={{ opacity: 0.5 }}>position</span><span>x={selectedKey.x} y={selectedKey.y}</span>
          <span style={{ opacity: 0.5 }}>size</span><span>w={selectedKey.w} h={selectedKey.h || 1}</span>
          <span style={{ opacity: 0.5 }}>kind</span><span style={{ color: statsColor }}>{selectedKey.kind}</span>
          <span style={{ opacity: 0.5 }}>cluster</span><span>{selectedKey.cluster || "(none)"}</span>
          {selectedKey.code && <><span style={{ opacity: 0.5 }}>code</span><span>{selectedKey.code}</span></>}
        </div>
      )}
    </div>
  );
};

export default KeyboardLayout2D;
