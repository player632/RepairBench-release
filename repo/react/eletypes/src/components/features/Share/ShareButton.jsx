import React, { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import ShareModal from "./ShareModal";
import { useLocale } from "../../../context/LocaleContext";

// html2canvas's CSS color parser throws on gradient/function backgrounds
// (e.g., `linear-gradient(...)` used by the Budapest theme and dynamic
// WebGL-backed themes). Pull the first solid color stop out, or fall back
// to a neutral dark so capture never breaks the Share flow.
const toSolidBackground = (bg) => {
  if (!bg || typeof bg !== "string") return "#1a1a1a";
  const trimmed = bg.trim();
  // If it's already a recognizable solid color, use as-is.
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^rgba?\(/i.test(trimmed) && !/gradient/i.test(trimmed)) return trimmed;
  // Otherwise scrape out the first color stop from any gradient-like value.
  const hex = trimmed.match(/#([0-9a-fA-F]{3,8})/);
  if (hex) return hex[0];
  const rgb = trimmed.match(/rgba?\([^)]+\)/i);
  if (rgb) return rgb[0];
  return "#1a1a1a";
};

const ShareButton = ({ targetRef, theme, label }) => {
  const { t } = useLocale();
  const [imageData, setImageData] = useState(null);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = useCallback(async () => {
    if (!targetRef?.current) return;
    setCapturing(true);
    try {
      const solidBg = toSolidBackground(theme.background);
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: solidBg,
        scale: 2,
        logging: false,
        useCORS: true,
        // Strip linear-gradient / other unsupported background functions from
        // the cloned tree before html2canvas walks it. Any element whose
        // inline `background` looks like a gradient gets swapped to the
        // sanitized solid. We don't touch the live DOM.
        onclone: (clonedDoc) => {
          const all = clonedDoc.querySelectorAll("[style]");
          all.forEach((el) => {
            const inlineBg = el.style && el.style.background;
            if (inlineBg && /gradient\s*\(/i.test(inlineBg)) {
              el.style.background = toSolidBackground(inlineBg);
            }
            const inlineImg = el.style && el.style.backgroundImage;
            if (inlineImg && /gradient\s*\(/i.test(inlineImg)) {
              el.style.backgroundImage = "none";
            }
          });
        },
      });

      // Add watermark
      const ctx = canvas.getContext("2d");
      ctx.font = "14px sans-serif";
      ctx.fillStyle = theme.textTypeBox;
      ctx.globalAlpha = 0.5;
      ctx.fillText("eletypes.com", canvas.width - 120, canvas.height - 12);
      ctx.globalAlpha = 1;

      setImageData(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Share capture failed:", err);
    }
    setCapturing(false);
  }, [targetRef, theme]);

  return (
    <>
      <button
        onClick={handleCapture}
        disabled={capturing}
        style={{
          background: "transparent",
          border: `1px solid ${theme.stats}`,
          borderRadius: "4px",
          color: theme.stats,
          padding: "4px 12px",
          cursor: capturing ? "wait" : "pointer",
          fontSize: "13px",
          fontFamily: theme.fontFamily,
          opacity: capturing ? 0.5 : 1,
        }}
      >
        {capturing ? "..." : label || t("share_button")}
      </button>
      {imageData && (
        <ShareModal
          imageData={imageData}
          theme={theme}
          onClose={() => setImageData(null)}
        />
      )}
    </>
  );
};

export default ShareButton;
