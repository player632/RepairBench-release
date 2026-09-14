import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import styled, { useTheme } from "styled-components";
import { useLocale } from "../../../context/LocaleContext";
import { ENGLISH_MODE, CHINESE_MODE } from "../../../constants/Constants";
import {
  parseCustomWordsText,
  resolveChineseText,
  CUSTOM_WORDS_MAX_TEXT,
  SAMPLE_WORDS_EN,
  SAMPLE_WORDS_ZH,
} from "../../../scripts/customWords";

const ThemedScope = styled.div`
  color: ${({ theme }) => theme.text};
  font-family: ${({ theme }) => theme.fontFamily};

  .MuiInputBase-input,
  .MuiInputBase-root {
    color: ${({ theme }) => theme.text};
    font-family: ${({ theme }) => theme.fontFamily};
  }
  .MuiInputLabel-root {
    color: ${({ theme }) => theme.textTypeBox};
  }
  .MuiInputLabel-root.Mui-focused {
    color: ${({ theme }) => theme.stats};
  }
  .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.textTypeBox}55;
  }
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.textTypeBox};
  }
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.stats};
  }
  .MuiFormHelperText-root {
    color: ${({ theme }) => theme.textTypeBox};
  }
  .MuiFormHelperText-root.Mui-error {
    color: #ff6b6b;
  }
  .MuiSvgIcon-root {
    color: ${({ theme }) => theme.text};
    opacity: 0.85;
  }
  .MuiButton-text {
    color: ${({ theme }) => theme.text};
  }
  .MuiButton-contained {
    background: ${({ theme }) => theme.stats};
    color: ${({ theme }) => theme.background};
    &:hover { background: ${({ theme }) => theme.stats}; opacity: 0.85; }
  }
`;

const FieldRow = ({ label, hint, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6, fontWeight: 500 }}>
      {label}
    </div>
    {children}
    {hint && (
      <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>{hint}</div>
    )}
  </div>
);

const LangChip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: active ? "rgba(127,127,127,0.25)" : "transparent",
      border: "1px solid rgba(127,127,127,0.35)",
      borderRadius: 4,
      padding: "4px 12px",
      fontSize: 12,
      cursor: "pointer",
      color: "inherit",
      opacity: active ? 1 : 0.7,
    }}
  >
    {children}
  </button>
);

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {object}  props.draft               — { id, name, language, text }
 * @param {(d: object) => void} props.onChange
 * @param {(d: object) => void} props.onSave
 * @param {() => void} props.onCancel
 * @param {() => void} [props.onDelete]
 * @param {boolean} [props.isExisting]
 * @param {string[]} [props.existingNames]
 */
const CustomWordsEditor = ({
  open,
  draft,
  onChange,
  onSave,
  onCancel,
  onDelete,
  isExisting = false,
  existingNames = [],
}) => {
  const { t } = useLocale();
  const stcTheme = useTheme();
  const [nameError, setNameError] = useState("");
  const [local, setLocal] = useState(draft);
  // For zh mode: pinyin-pro-resolved pairs. null until first async resolve.
  const [resolved, setResolved] = useState(draft?.resolved || null);
  const [resolving, setResolving] = useState(false);
  const resolveSeq = useRef(0);

  useEffect(() => {
    if (open && draft) {
      setLocal(draft);
      setResolved(draft.resolved || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft?.id]);

  // Trigger pinyin-pro lookup whenever the zh-mode text changes. Sync parsing
  // handles the overrides; the async lookup fills in hanzi-only lines. The
  // `resolveSeq` guard discards stale results when the user keeps typing.
  useEffect(() => {
    if (!local) return;
    if (local.language !== CHINESE_MODE) {
      setResolved(null);
      setResolving(false);
      return;
    }
    const seq = ++resolveSeq.current;
    setResolving(true);
    resolveChineseText(local.text || "")
      .then((next) => {
        if (resolveSeq.current === seq) {
          setResolved(next);
          setResolving(false);
        }
      })
      .catch(() => {
        if (resolveSeq.current === seq) setResolving(false);
      });
  }, [local?.text, local?.language]);

  const parsed = useMemo(() => {
    if (!local) return [];
    if (local.language === CHINESE_MODE) {
      // Prefer resolved (async-filled) so the preview shows generated pinyin.
      return parseCustomWordsText({ ...local, resolved });
    }
    return parseCustomWordsText(local);
  }, [local, resolved]);

  if (!draft || !local) return null;

  const set = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  const setName = (name) => {
    setNameError("");
    set({ name });
  };

  const setLanguage = (language) => {
    if (language === local.language) return;
    // Replace the textarea content with the new language's sample. Different
    // languages have totally different content shapes (English words vs.
    // hanzi-per-line), so persisting the old text after switching never
    // produces a useful starting point.
    set({
      language,
      text: language === CHINESE_MODE ? SAMPLE_WORDS_ZH : SAMPLE_WORDS_EN,
    });
  };

  const setText = (text) => {
    if (text.length > CUSTOM_WORDS_MAX_TEXT) {
      text = text.slice(0, CUSTOM_WORDS_MAX_TEXT);
    }
    set({ text });
  };

  const placeholder =
    local.language === CHINESE_MODE
      ? t("custom_words_placeholder_zh")
      : t("custom_words_placeholder_en");

  const formatHint =
    local.language === CHINESE_MODE
      ? t("custom_words_format_hint_zh")
      : t("custom_words_format_hint_en");

  const handleSave = () => {
    const name = (local.name || "").trim();
    if (!name) {
      setNameError(t("custom_words_name_required"));
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
      setNameError(t("custom_words_name_duplicate"));
      return;
    }
    if (parsed.length === 0) {
      setNameError(t("custom_words_empty_warning"));
      return;
    }
    if (local.language === CHINESE_MODE && resolving) {
      // Pinyin still being generated — block save briefly. Almost always a
      // sub-100ms wait but worth guarding against the race.
      setNameError(t("custom_words_resolving"));
      return;
    }
    setNameError("");
    // Persist the resolved pairs so the runtime doesn't need pinyin-pro.
    const next = {
      ...local,
      name,
      resolved: local.language === CHINESE_MODE ? parsed : null,
    };
    onSave(next);
  };

  const handleCancel = () => onCancel();

  const handleDelete = () => {
    if (window.confirm(t("custom_words_confirm_delete"))) onDelete();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      slotProps={{ backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.08)" } } }}
      PaperProps={{
        sx: {
          background: stcTheme.background,
          color: stcTheme.text,
          fontFamily: stcTheme.fontFamily,
          backgroundColor: stcTheme.background,
          border: `1px solid ${stcTheme.textTypeBox}30`,
        },
      }}
    >
      <ThemedScope>
        <DialogContent sx={{ pb: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 500, color: stcTheme.title }}>
                {t("custom_words_editor_title")}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                {t("custom_words_editor_subtitle")}
              </div>
            </div>
            <IconButton size="small" onClick={handleCancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>

          <div style={{ marginTop: 18 }}>
            <FieldRow label={t("custom_words_field_name")}>
              <TextField
                size="small"
                fullWidth
                value={local.name || ""}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("custom_words_field_name_placeholder")}
                error={!!nameError}
                helperText={nameError || ""}
                inputProps={{ maxLength: 40 }}
              />
            </FieldRow>

            <FieldRow label={t("custom_words_field_language")}>
              <div style={{ display: "flex", gap: 6 }}>
                <LangChip
                  active={local.language === ENGLISH_MODE}
                  onClick={() => setLanguage(ENGLISH_MODE)}
                >
                  {t("custom_words_lang_en")}
                </LangChip>
                <LangChip
                  active={local.language === CHINESE_MODE}
                  onClick={() => setLanguage(CHINESE_MODE)}
                >
                  {t("custom_words_lang_zh")}
                </LangChip>
              </div>
            </FieldRow>

            <FieldRow label={t("custom_words_field_words")} hint={formatHint}>
              <TextField
                size="small"
                multiline
                minRows={8}
                maxRows={16}
                fullWidth
                value={local.text || ""}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                inputProps={{ style: { fontFamily: "monospace", fontSize: 13, lineHeight: 1.5 } }}
              />
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
                {resolving
                  ? t("custom_words_resolving")
                  : t("custom_words_parsed_count", parsed.length)}
              </div>
              {local.language === CHINESE_MODE && parsed.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    maxHeight: 120,
                    overflowY: "auto",
                    padding: "8px 10px",
                    border: `1px solid ${stcTheme.textTypeBox}33`,
                    borderRadius: 4,
                    fontFamily: "monospace",
                    fontSize: 12,
                    lineHeight: 1.7,
                    background: `${stcTheme.textTypeBox}08`,
                  }}
                >
                  <div style={{ fontSize: 10, opacity: 0.55, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                    {t("custom_words_preview_label")}
                  </div>
                  {parsed.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <span style={{ minWidth: 56, color: stcTheme.text }}>{p.key || "—"}</span>
                      <span style={{ color: stcTheme.textTypeBox }}>→</span>
                      <span style={{ color: stcTheme.stats }}>{p.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </FieldRow>
          </div>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <div>
            {isExisting && onDelete && (
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={handleDelete}
              >
                {t("custom_words_action_delete")}
              </Button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="small" onClick={handleCancel}>
              {t("custom_words_action_cancel")}
            </Button>
            <Button size="small" variant="contained" onClick={handleSave}>
              {isExisting ? t("custom_words_action_save") : t("custom_words_action_save_activate")}
            </Button>
          </div>
        </DialogActions>
      </ThemedScope>
    </Dialog>
  );
};

export default CustomWordsEditor;
