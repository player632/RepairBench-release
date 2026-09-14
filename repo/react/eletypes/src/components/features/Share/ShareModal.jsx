import React, { useState } from "react";
import { Dialog, DialogContent, IconButton as MuiIconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useLocale } from "../../../context/LocaleContext";

const SHARE_URL = "https://eletypes.com";

const canNativeShareFiles = (() => {
  try {
    return typeof navigator.share === "function" && navigator.canShare;
  } catch {
    return false;
  }
})();

const SOCIAL_LINKS = [
  { id: "x", label: "X", icon: "𝕏", getUrl: (text) => `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SHARE_URL)}` },
  { id: "discord", label: "Discord", icon: "💬", copy: true },
  { id: "whatsapp", label: "WhatsApp", icon: "💚", nativeShare: true, getUrl: (text) => `https://wa.me/?text=${encodeURIComponent(text + " " + SHARE_URL)}` },
  { id: "telegram", label: "Telegram", icon: "✈️", nativeShare: true, getUrl: (text) => `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(text)}` },
  { id: "linkedin", label: "LinkedIn", icon: "💼", getUrl: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}` },
  { id: "weibo", label: "微博", icon: "🔴", getUrl: (text) => `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}&url=${encodeURIComponent(SHARE_URL)}` },
  { id: "wechat", label: "微信", icon: "🟢", copy: true },
];

const ShareModal = ({ imageData, theme, onClose }) => {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const [socialCopied, setSocialCopied] = useState(null);

  const shareText = t("share_text");

  const getImageBlob = async () => {
    const res = await fetch(imageData);
    return res.blob();
  };

  const copyImage = async () => {
    const blob = await getImageBlob();
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
  };

  const nativeShareImage = async () => {
    const blob = await getImageBlob();
    const file = new File([blob], "eletypes-result.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Eletypes",
        text: shareText,
        files: [file],
      });
      return true;
    }
    return false;
  };

  const handleCopy = async () => {
    try {
      await copyImage();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = `eletypes-${Date.now()}.png`;
    link.href = imageData;
    link.click();
  };

  const handleSocialClick = async (social) => {
    // On mobile, WhatsApp/Telegram can receive files via native share
    if (social.nativeShare && canNativeShareFiles) {
      try {
        const shared = await nativeShareImage();
        if (shared) return;
      } catch {
        // Fall through to URL intent
      }
    }

    // Copy image to clipboard first
    try {
      await copyImage();
    } catch {
      // Fallback silently
    }

    if (social.copy) {
      setSocialCopied(social.id);
      setTimeout(() => setSocialCopied(null), 2000);
    } else if (social.getUrl) {
      setSocialCopied(social.id);
      setTimeout(() => setSocialCopied(null), 2000);
      window.open(social.getUrl(shareText), "_blank", "noopener,noreferrer,width=600,height=400");
    }
  };

  const btnStyle = {
    background: "transparent",
    border: `1px solid ${theme.stats}`,
    borderRadius: "4px",
    color: theme.stats,
    padding: "8px 20px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: theme.fontFamily,
  };

  const socialBtnStyle = {
    background: "transparent",
    border: `1px solid ${theme.textTypeBox}33`,
    borderRadius: "4px",
    color: theme.text,
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: theme.fontFamily,
    display: "flex",
    alignItems: "center",
    gap: "4px",
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      BackdropProps={{
        sx: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
      }}
      PaperProps={{
        style: {
          background: theme.background,
          color: theme.text,
          borderRadius: "8px",
          border: `1px solid ${theme.textTypeBox}33`,
        },
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px 0",
        }}
      >
        <span style={{ fontSize: "16px", fontWeight: 600 }}>
          {t("share_title")}
        </span>
        <MuiIconButton onClick={onClose} style={{ color: theme.textTypeBox }}>
          <CloseIcon fontSize="small" />
        </MuiIconButton>
      </div>
      <DialogContent>
        <div style={{ textAlign: "center" }}>
          <img
            src={imageData}
            alt="Share preview"
            style={{
              maxWidth: "100%",
              borderRadius: "6px",
              border: `1px solid ${theme.textTypeBox}22`,
            }}
          />
        </div>

        {/* Primary actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <button onClick={handleCopy} style={btnStyle}>
            {copied ? t("share_copied") : t("share_copy")}
          </button>
          <button onClick={handleDownload} style={btnStyle}>
            {t("share_download")}
          </button>
          {canNativeShareFiles && (
            <button onClick={nativeShareImage} style={btnStyle}>
              {t("share_share")}
            </button>
          )}
        </div>

        {/* Social share hint */}
        <div
          style={{
            textAlign: "center",
            fontSize: "11px",
            color: theme.textTypeBox,
            marginTop: "16px",
            marginBottom: "8px",
          }}
        >
          {t("share_social_hint")}
        </div>

        {/* Social share */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {SOCIAL_LINKS.map((social) => (
            <button
              key={social.id}
              onClick={() => handleSocialClick(social)}
              style={socialBtnStyle}
            >
              <span style={{ fontSize: "14px" }}>{social.icon}</span>
              {socialCopied === social.id
                ? social.copy
                  ? t("share_copied")
                  : t("share_opened")
                : social.label}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
