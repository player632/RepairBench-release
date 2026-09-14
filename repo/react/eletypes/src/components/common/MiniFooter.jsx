/**
 * MiniFooter — shared minimal bottom nav for standalone routes.
 *
 * Uses the same bracketed monospace aesthetic as the top nav profile area.
 * Controls: Back, Theme, Sound toggle + type, Language.
 */

import React from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TranslateIcon from "@mui/icons-material/Translate";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import EditIcon from "@mui/icons-material/Edit";
import { Tooltip } from "@mui/material";
import Select from "../utils/Select";
import { useLocale } from "../../context/LocaleContext";
import { buildGroupedOptions, findOptionForTheme, isCustomTheme } from "../../style/customThemes";

const Sep = ({ theme }) => (
  <span style={{ color: theme?.stats || "#6ec6ff", opacity: 0.25, fontSize: "14px", fontFamily: "monospace", userSelect: "none" }}>│</span>
);

const BracketBtn = ({ children, onClick, href, title, theme }) => {
  const Tag = href ? "a" : "button";
  const props = href ? { href } : { onClick };
  return (
    <Tooltip title={title || ""} placement="top">
      <Tag className="profile-btn" {...props} style={href ? { textDecoration: "none" } : {}}>
        <span className="profile-bracket">[</span>
        {children}
        <span className="profile-bracket">]</span>
      </Tag>
    </Tooltip>
  );
};

const MiniFooter = ({
  theme,
  customThemes,
  handleThemeChange,
  onCreateTheme,
  onEditCurrentTheme,
  soundMode,
  toggleSoundMode,
  soundOptions,
  soundType,
  handleSoundTypeChange,
  backLabel,
}) => {
  const { locale, setLocale, t } = useLocale();
  const groupedThemeOptions = buildGroupedOptions(customThemes, t);
  const themeOptionValue = findOptionForTheme(groupedThemeOptions, theme);
  const currentIsCustom = isCustomTheme(theme);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 16px",
      flexWrap: "wrap",
    }}>
      <BracketBtn href="/" title={backLabel || t("return")} theme={theme}>
        <ArrowBackIcon style={{ fontSize: "14px" }} />
        <span style={{ fontSize: "12px", marginLeft: "2px" }}>{backLabel || t("return")}</span>
      </BracketBtn>

      <Sep theme={theme} />

      <BracketBtn title={t("sound_mode_tooltip")} onClick={toggleSoundMode} theme={theme}>
        {soundMode
          ? <VolumeUpIcon style={{ fontSize: "14px" }} />
          : <VolumeOffIcon style={{ fontSize: "14px", opacity: 0.4 }} />
        }
      </BracketBtn>
      {soundMode && (
        <Select
          classNamePrefix="Select"
          value={soundOptions.find((e) => e.label === soundType)}
          options={soundOptions}
          isSearchable={false}
          isSelected={false}
          onChange={handleSoundTypeChange}
          menuPlacement="top"
        />
      )}

      <Sep theme={theme} />

      <BracketBtn theme={theme}>
        <PaletteOutlinedIcon style={{ fontSize: "14px" }} />
      </BracketBtn>
      <Select
        classNamePrefix="Select"
        value={themeOptionValue}
        options={groupedThemeOptions}
        isSearchable={false}
        isSelected={false}
        onChange={handleThemeChange}
        menuPlacement="top"
      />
      {currentIsCustom && onEditCurrentTheme && (
        <BracketBtn title={t("theme_action_edit")} onClick={onEditCurrentTheme} theme={theme}>
          <EditIcon style={{ fontSize: "14px" }} />
        </BracketBtn>
      )}
      {onCreateTheme && (
        <BracketBtn title={t("theme_action_new")} onClick={onCreateTheme} theme={theme}>
          <ColorLensIcon style={{ fontSize: "14px" }} />
        </BracketBtn>
      )}

      <Sep theme={theme} />

      <BracketBtn title={t("locale_toggle")} onClick={() => setLocale(locale === "en" ? "zh" : "en")} theme={theme}>
        <TranslateIcon style={{ fontSize: "14px" }} />
      </BracketBtn>
    </div>
  );
};

export default MiniFooter;
