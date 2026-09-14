import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Switch,
  FormControlLabel,
  Slider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import styled, { useTheme } from "styled-components";
import { useLocale } from "../../../context/LocaleContext";

// MUI's Dialog renders via portal and uses its own theme, so reach for our
// styled-components theme here and apply it inline / via this scoped wrapper.
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
  .MuiSwitch-track {
    background-color: ${({ theme }) => theme.textTypeBox};
  }
  .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
    background-color: ${({ theme }) => theme.stats};
    opacity: 0.6;
  }
  .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb {
    color: ${({ theme }) => theme.stats};
  }
  .MuiSlider-root {
    color: ${({ theme }) => theme.stats};
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

const FONT_OPTIONS = ["sans-serif", "serif", "monospace", "Tomorrow", "Rufina"];
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const isLikelyColor = (s) =>
  typeof s === "string" &&
  /^(#[0-9a-f]{3,8}|rgb|hsl)/i.test(s.trim());

// Best-effort linear-gradient parser. Returns null on miss, in which case the
// editor falls back to Custom CSS mode and keeps the raw string.
const parseLinearGradient = (s) => {
  if (typeof s !== "string") return null;
  const m = s.trim().match(/^linear-gradient\(\s*([\s\S]+)\s*\);?\s*$/i);
  if (!m) return null;
  const inner = m[1];
  // Split on top-level commas (no nested parens in our simple form).
  const parts = inner.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  let angle = 90;
  let stopsStart = 0;
  const first = parts[0];
  const degMatch = first.match(/^(-?\d+(?:\.\d+)?)deg$/);
  if (degMatch) {
    angle = parseFloat(degMatch[1]);
    stopsStart = 1;
  } else if (/^to\s+/i.test(first)) {
    const dir = first.replace(/\s+/g, " ").toLowerCase();
    const map = {
      "to top": 0, "to right": 90, "to bottom": 180, "to left": 270,
      "to top right": 45, "to bottom right": 135,
      "to bottom left": 225, "to top left": 315,
    };
    angle = map[dir] ?? 90;
    stopsStart = 1;
  }

  const stops = parts.slice(stopsStart).map((p) => {
    const tokens = p.split(/\s+/);
    const color = tokens[0];
    const posTok = tokens[1];
    let position = null;
    if (posTok && /%$/.test(posTok)) {
      position = parseFloat(posTok);
    }
    return { color, position };
  });

  if (stops.length < 2) return null;
  if (!stops.every((s) => HEX_RE.test(s.color))) return null;

  return { type: "linear", angle, stops };
};

const serializeLinearGradient = ({ angle, stops }) => {
  const stopStrs = stops.map((s) =>
    s.position == null ? s.color : `${s.color} ${s.position}%`
  );
  return `linear-gradient(${angle}deg, ${stopStrs.join(", ")})`;
};

const parseTextShadow = (s) => {
  if (typeof s !== "string" || !s.trim()) return null;
  const m = s.trim().match(
    /^(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(#[0-9a-f]{3,8})$/i
  );
  if (!m) return null;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]), blur: parseFloat(m[3]), color: m[4] };
};

const serializeTextShadow = ({ x, y, blur, color }) =>
  `${x}px ${y}px ${blur}px ${color}`;

const normalizeHex = (v) => {
  if (typeof v !== "string") return "#000000";
  if (HEX_RE.test(v)) return v;
  return "#000000";
};

// ---------- Small UI building blocks ----------

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

const ColorInput = ({ value, onChange }) => {
  const safe = normalizeHex(value).slice(0, 7); // <input type=color> only takes #RRGGBB
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="color"
        value={safe}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 36, height: 28, padding: 0, border: "1px solid rgba(127,127,127,0.4)",
          borderRadius: 4, background: "transparent", cursor: "pointer",
        }}
      />
      <TextField
        size="small"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        inputProps={{ style: { fontFamily: "monospace", fontSize: 12, padding: "4px 8px" } }}
        sx={{ width: 110 }}
      />
    </div>
  );
};

const GradientBuilder = ({ value, onChange }) => {
  const parsed = useMemo(
    () => parseLinearGradient(value) || { type: "linear", angle: 90, stops: [
      { color: "#888B8D", position: 0 }, { color: "#FAF9F6", position: 100 },
    ] },
    // intentionally only re-parse when the upstream string actually changes
    [value]
  );

  const update = (next) => onChange(serializeLinearGradient(next));

  const setAngle = (deg) => update({ ...parsed, angle: deg });
  const setStop = (i, patch) => {
    const stops = parsed.stops.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    update({ ...parsed, stops });
  };
  const addStop = () => {
    if (parsed.stops.length >= 6) return;
    const stops = [...parsed.stops, { color: "#888888", position: 100 }];
    update({ ...parsed, stops });
  };
  const removeStop = (i) => {
    if (parsed.stops.length <= 2) return;
    const stops = parsed.stops.filter((_, idx) => idx !== i);
    update({ ...parsed, stops });
  };

  const { t } = useLocale();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          height: 28, borderRadius: 4,
          background: serializeLinearGradient(parsed),
          border: "1px solid rgba(127,127,127,0.3)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, opacity: 0.7, minWidth: 50 }}>
          {t("theme_gradient_angle")}
        </span>
        <Slider
          size="small"
          value={parsed.angle}
          min={0}
          max={360}
          step={1}
          onChange={(_, v) => setAngle(v)}
        />
        <span style={{ fontSize: 11, fontFamily: "monospace", minWidth: 40, textAlign: "right" }}>
          {parsed.angle}°
        </span>
      </div>
      {parsed.stops.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, opacity: 0.6, minWidth: 50 }}>
            {t("theme_gradient_stop")} {i + 1}
          </span>
          <ColorInput value={s.color} onChange={(c) => setStop(i, { color: c })} />
          <TextField
            size="small"
            type="number"
            value={s.position ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              setStop(i, { position: raw === "" ? null : Math.max(0, Math.min(100, parseFloat(raw))) });
            }}
            inputProps={{ min: 0, max: 100, style: { fontSize: 12, padding: "4px 8px" } }}
            sx={{ width: 70 }}
            InputProps={{ endAdornment: <span style={{ fontSize: 11, opacity: 0.5 }}>%</span> }}
          />
          {parsed.stops.length > 2 && (
            <IconButton size="small" onClick={() => removeStop(i)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </div>
      ))}
      {parsed.stops.length < 6 && (
        <Button size="small" startIcon={<AddIcon />} onClick={addStop} sx={{ alignSelf: "flex-start" }}>
          {t("theme_gradient_add_stop")}
        </Button>
      )}
    </div>
  );
};

const RawCssInput = ({ value, onChange, hint }) => (
  <div>
    <TextField
      size="small"
      multiline
      minRows={2}
      maxRows={4}
      fullWidth
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      inputProps={{ style: { fontFamily: "monospace", fontSize: 12 } }}
    />
    {hint && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>{hint}</div>}
  </div>
);

// Field with a kind toggle (solid / gradient / custom). Used for `background`.
const BackgroundLikeField = ({ value, onChange, allowSolid = true }) => {
  const { t } = useLocale();
  const inferredKind = useMemo(() => {
    if (allowSolid && isLikelyColor(value)) return "solid";
    if (parseLinearGradient(value)) return "gradient";
    return "custom";
  }, [value, allowSolid]);

  const [kind, setKind] = useState(inferredKind);

  // If the value changes from outside (e.g., switching themes), re-sync kind.
  useEffect(() => {
    setKind(inferredKind);
  }, [inferredKind]);

  const handleKind = (next) => {
    setKind(next);
    if (next === "solid" && !isLikelyColor(value)) {
      onChange("#222222");
    } else if (next === "gradient" && !parseLinearGradient(value)) {
      onChange("linear-gradient(90deg, #888B8D 0%, #FAF9F6 100%)");
    }
    // "custom" keeps the existing string so users can paste their own
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {allowSolid && (
          <KindChip active={kind === "solid"} onClick={() => handleKind("solid")}>
            {t("theme_kind_solid")}
          </KindChip>
        )}
        <KindChip active={kind === "gradient"} onClick={() => handleKind("gradient")}>
          {t("theme_kind_gradient")}
        </KindChip>
        <KindChip active={kind === "custom"} onClick={() => handleKind("custom")}>
          {t("theme_kind_custom_css")}
        </KindChip>
      </div>
      {kind === "solid" && <ColorInput value={value} onChange={onChange} />}
      {kind === "gradient" && <GradientBuilder value={value} onChange={onChange} />}
      {kind === "custom" && (
        <RawCssInput value={value} onChange={onChange} hint={t("theme_raw_css_hint")} />
      )}
    </div>
  );
};

const KindChip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: active ? "rgba(127,127,127,0.25)" : "transparent",
      border: "1px solid rgba(127,127,127,0.35)",
      borderRadius: 4,
      padding: "3px 10px",
      fontSize: 11,
      cursor: "pointer",
      color: "inherit",
      opacity: active ? 1 : 0.7,
    }}
  >
    {children}
  </button>
);

// ---------- Editor ----------

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {object}  props.workingTheme   — the in-progress theme (also driving the live preview)
 * @param {(t: object) => void} props.onChange  — called on every keystroke for live preview
 * @param {() => void} props.onSave
 * @param {() => void} props.onCancel
 * @param {() => void} [props.onDelete]   — only present when editing an existing custom theme
 * @param {boolean} [props.isExistingCustom]
 * @param {string[]} [props.existingNames] — for duplicate-name check
 */
const CustomThemeEditor = ({
  open,
  workingTheme,
  onChange,
  onSave,
  onCancel,
  onDelete,
  isExistingCustom = false,
  existingNames = [],
}) => {
  const { t } = useLocale();
  const stcTheme = useTheme();
  const [nameError, setNameError] = useState("");

  // Keep input state local so each keystroke doesn't re-render the whole app
  // tree (TypeBox, words list, footer, …). Propagation upstream — which drives
  // the live preview behind the dialog — is throttled to ~16fps.
  const [local, setLocal] = useState(workingTheme);
  const pendingRef = useRef(null);

  // Re-sync local when the editor opens on a different theme.
  useEffect(() => {
    if (open && workingTheme) setLocal(workingTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workingTheme?.id]);

  // Flush + cleanup on unmount.
  useEffect(() => () => {
    if (pendingRef.current) clearTimeout(pendingRef.current);
  }, []);

  const propagate = (next) => {
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      pendingRef.current = null;
      onChange(next);
    }, 60);
  };

  const flush = (next) => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
    }
    if (next) onChange(next);
  };

  if (!workingTheme || !local) return null;

  // Keep side effects out of the updater so React doesn't re-run propagate
  // during reconciliation.
  const set = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    propagate(next);
  };

  // Name doesn't drive live preview — skip the upstream churn entirely.
  const setName = (label) => {
    setNameError("");
    setLocal({ ...local, label });
  };

  const shadowOn = !!local.textShadow;
  const shadowParsed = parseTextShadow(local.textShadow);

  const handleSave = () => {
    const name = (local.label || "").trim();
    if (!name) {
      setNameError(t("theme_name_required"));
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
      setNameError(t("theme_name_duplicate"));
      return;
    }
    setNameError("");
    flush(local);
    onSave(local);
  };

  const handleCancel = () => {
    flush(null);
    onCancel();
  };

  const handleDelete = () => {
    flush(null);
    if (window.confirm(t("theme_confirm_delete"))) onDelete();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      // Keep the page visible so the live preview is uninterrupted.
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
              {t("theme_editor_title")}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
              {t("theme_editor_subtitle")}
            </div>
          </div>
          <IconButton size="small" onClick={handleCancel}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <div style={{ marginTop: 18 }}>
          <FieldRow label={t("theme_field_name")}>
            <TextField
              size="small"
              fullWidth
              value={local.label || ""}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("theme_field_name_placeholder")}
              error={!!nameError}
              helperText={nameError || ""}
            />
          </FieldRow>

          <FieldRow label={t("theme_field_background")}>
            <BackgroundLikeField
              value={local.background}
              onChange={(v) => set({ background: v })}
            />
          </FieldRow>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 16 }}>
            <FieldRow label={t("theme_field_text")}>
              <ColorInput value={local.text} onChange={(v) => set({ text: v })} />
            </FieldRow>
            <FieldRow label={t("theme_field_title")}>
              <ColorInput value={local.title} onChange={(v) => set({ title: v })} />
            </FieldRow>
            <FieldRow label={t("theme_field_typing_dim")}>
              <ColorInput value={local.textTypeBox} onChange={(v) => set({ textTypeBox: v })} />
            </FieldRow>
            <FieldRow label={t("theme_field_accent")}>
              <ColorInput value={local.stats} onChange={(v) => set({ stats: v })} />
            </FieldRow>
          </div>

          <FieldRow label={t("theme_field_font")}>
            <FormControl size="small" fullWidth>
              <Select
                value={FONT_OPTIONS.includes(local.fontFamily) ? local.fontFamily : ""}
                displayEmpty
                onChange={(e) => set({ fontFamily: e.target.value })}
                renderValue={(v) => v || local.fontFamily || "sans-serif"}
              >
                {FONT_OPTIONS.map((f) => (
                  <MenuItem key={f} value={f} style={{ fontFamily: f }}>{f}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </FieldRow>

          <FieldRow label={t("theme_field_text_shadow")}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={shadowOn}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set({ textShadow: shadowParsed ? local.textShadow : "1px 1px 2px #000000" });
                    } else {
                      set({ textShadow: "" });
                    }
                  }}
                />
              }
              label={<span style={{ fontSize: 12 }}>{t("theme_shadow_enabled")}</span>}
            />
            {shadowOn && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "center", marginTop: 8 }}>
                <TextField
                  size="small" type="number" label={t("theme_shadow_x")}
                  value={shadowParsed?.x ?? 1}
                  onChange={(e) => set({ textShadow: serializeTextShadow({ ...(shadowParsed || { x: 1, y: 1, blur: 2, color: "#000000" }), x: parseFloat(e.target.value) || 0 }) })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small" type="number" label={t("theme_shadow_y")}
                  value={shadowParsed?.y ?? 1}
                  onChange={(e) => set({ textShadow: serializeTextShadow({ ...(shadowParsed || { x: 1, y: 1, blur: 2, color: "#000000" }), y: parseFloat(e.target.value) || 0 }) })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small" type="number" label={t("theme_shadow_blur")}
                  value={shadowParsed?.blur ?? 2}
                  onChange={(e) => set({ textShadow: serializeTextShadow({ ...(shadowParsed || { x: 1, y: 1, blur: 2, color: "#000000" }), blur: Math.max(0, parseFloat(e.target.value) || 0) }) })}
                  InputLabelProps={{ shrink: true }}
                />
                <ColorInput
                  value={shadowParsed?.color || "#000000"}
                  onChange={(c) => set({ textShadow: serializeTextShadow({ ...(shadowParsed || { x: 1, y: 1, blur: 2, color: "#000000" }), color: c }) })}
                />
              </div>
            )}
            {shadowOn && !shadowParsed && (
              <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>
                <em>Existing shadow couldn't be parsed — toggle off and on to reset.</em>
              </div>
            )}
          </FieldRow>

          <details style={{ marginTop: 8 }}>
            <summary
              style={{
                fontSize: 12,
                opacity: 0.65,
                cursor: "pointer",
                userSelect: "none",
                marginBottom: 10,
              }}
            >
              {t("theme_section_advanced")}
            </summary>
            <FieldRow
              label={t("theme_field_alert_gradient")}
              hint={t("theme_field_alert_gradient_hint")}
            >
              <BackgroundLikeField
                value={local.gradient}
                onChange={(v) => set({ gradient: v })}
                allowSolid={false}
              />
            </FieldRow>
          </details>
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <div>
          {isExistingCustom && onDelete && (
            <Button
              size="small"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDelete}
            >
              {t("theme_action_delete")}
            </Button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="small" onClick={handleCancel}>{t("theme_action_cancel")}</Button>
          <Button size="small" variant="contained" onClick={handleSave}>
            {t("theme_action_save")}
          </Button>
        </div>
      </DialogActions>
      </ThemedScope>
    </Dialog>
  );
};

export default CustomThemeEditor;
