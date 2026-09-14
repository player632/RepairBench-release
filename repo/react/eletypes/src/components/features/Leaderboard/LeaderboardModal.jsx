import React, { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, IconButton as MuiIconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchLeaderboard } from "../../../services/leaderboard";
import { supabase } from "../../../services/supabase";
import { getUserTag } from "../../../services/userIdentity";
import ScoreHistoryPanel from "./ScoreHistoryPanel";
import { useLocale } from "../../../context/LocaleContext";
import {
  DEFAULT_COUNT_DOWN,
  DEFAULT_DIFFICULTY,
  ENGLISH_MODE,
  COUNT_DOWN_90,
  COUNT_DOWN_60,
  COUNT_DOWN_30,
  COUNT_DOWN_15,
  HARD_DIFFICULTY,
  CHINESE_MODE,
} from "../../../constants/Constants";

const DURATIONS = [COUNT_DOWN_15, COUNT_DOWN_30, COUNT_DOWN_60, COUNT_DOWN_90];
const DIFFICULTIES = [DEFAULT_DIFFICULTY, HARD_DIFFICULTY];
const LANGUAGES = [
  { value: ENGLISH_MODE, label: "eng" },
  { value: CHINESE_MODE, label: "chn" },
];

const TAB_LEADERBOARD = "leaderboard";
const TAB_HISTORY = "history";

const LeaderboardModal = ({ open, onClose, theme }) => {
  const { t } = useLocale();
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem("language");
    return stored ? JSON.parse(stored) : ENGLISH_MODE;
  });
  const [difficulty, setDifficulty] = useState(() => {
    const stored = localStorage.getItem("difficulty");
    return stored ? JSON.parse(stored) : DEFAULT_DIFFICULTY;
  });
  const [duration, setDuration] = useState(() => {
    const stored = localStorage.getItem("timer-constant");
    return stored ? JSON.parse(stored) : DEFAULT_COUNT_DOWN;
  });
  const [numberAddon, setNumberAddon] = useState(() => {
    const stored = localStorage.getItem("number");
    return stored ? JSON.parse(stored) : false;
  });
  const [symbolAddon, setSymbolAddon] = useState(() => {
    const stored = localStorage.getItem("symbol");
    return stored ? JSON.parse(stored) : false;
  });

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_LEADERBOARD);

  const loadLeaderboard = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const data = await fetchLeaderboard({
      language,
      difficulty,
      duration,
      numberAddon,
      symbolAddon,
    });
    setLeaderboardData(data);
    setLoading(false);
  }, [language, difficulty, duration, numberAddon, symbolAddon]);

  useEffect(() => {
    if (open && activeTab === TAB_LEADERBOARD) {
      loadLeaderboard();
    }
  }, [open, loadLeaderboard, activeTab]);

  const pillStyle = (active) => ({
    background: "transparent",
    border: `1px solid ${active ? theme.stats : theme.textTypeBox}44`,
    borderRadius: "4px",
    color: active ? theme.stats : theme.textTypeBox,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: theme.fontFamily,
    transition: "all 0.2s",
  });

  const tabStyle = (isActive) => ({
    background: "transparent",
    border: "none",
    borderBottom: isActive ? `2px solid ${theme.stats}` : `2px solid transparent`,
    color: isActive ? theme.stats : theme.textTypeBox,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "15px",
    fontFamily: theme.fontFamily,
    fontWeight: isActive ? 600 : 400,
    transition: "all 0.2s",
  });

  return (
    <Dialog
      open={open}
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
          borderBottom: `1px solid ${theme.textTypeBox}30`,
        }}
      >
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            style={tabStyle(activeTab === TAB_LEADERBOARD)}
            onClick={() => setActiveTab(TAB_LEADERBOARD)}
          >
            {t("leaderboard")}
          </button>
          <button
            style={tabStyle(activeTab === TAB_HISTORY)}
            onClick={() => setActiveTab(TAB_HISTORY)}
          >
            {t("your_history")}
          </button>
        </div>
        <MuiIconButton onClick={onClose} style={{ color: theme.textTypeBox }}>
          <CloseIcon fontSize="small" />
        </MuiIconButton>
      </div>
      <DialogContent>
        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              style={pillStyle(language === lang.value)}
              onClick={() => setLanguage(lang.value)}
            >
              {lang.label}
            </button>
          ))}
          <span style={{ color: theme.textTypeBox, alignSelf: "center" }}>|</span>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              style={pillStyle(difficulty === d)}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
          <span style={{ color: theme.textTypeBox, alignSelf: "center" }}>|</span>
          {DURATIONS.map((d) => (
            <button
              key={d}
              style={pillStyle(duration === d)}
              onClick={() => setDuration(d)}
            >
              {d}s
            </button>
          ))}
          <span style={{ color: theme.textTypeBox, alignSelf: "center" }}>|</span>
          <button
            style={pillStyle(numberAddon)}
            onClick={() => setNumberAddon(!numberAddon)}
          >
            +num
          </button>
          <button
            style={pillStyle(symbolAddon)}
            onClick={() => setSymbolAddon(!symbolAddon)}
          >
            +sym
          </button>
        </div>

        {/* Leaderboard tab */}
        {activeTab === TAB_LEADERBOARD && (
          <>
            {!supabase ? (
              <p style={{ color: theme.textTypeBox, fontSize: "14px" }}>
                {t("leaderboard_unavailable")}
              </p>
            ) : loading ? (
              <p style={{ color: theme.textTypeBox, fontSize: "14px" }}>{t("loading")}</p>
            ) : leaderboardData.length === 0 ? (
              <p style={{ color: theme.textTypeBox, fontSize: "14px" }}>
                {t("no_scores_for_mode")}
              </p>
            ) : (
              <div style={{ maxHeight: "400px", overflowY: "auto", scrollbarWidth: "thin" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr
                      style={{
                        color: theme.textTypeBox,
                        borderBottom: `1px solid ${theme.textTypeBox}`,
                      }}
                    >
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>{t("rank_header")}</th>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>{t("name_header")}</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>WPM</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>ACC</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>{t("date_header")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, idx) => (
                      <tr
                        key={idx}
                        style={{
                          color: idx < 3 ? theme.stats : theme.text,
                          borderBottom: `1px solid ${theme.textTypeBox}33`,
                        }}
                      >
                        <td style={{ padding: "5px 8px" }}>
                          {idx === 0
                            ? t("rank_1")
                            : idx === 1
                            ? t("rank_2")
                            : idx === 2
                            ? t("rank_3")
                            : t("rank_n", idx + 1)}
                        </td>
                        <td style={{ padding: "5px 8px" }}>
                          {entry.user_name}
                          <span style={{ color: theme.textTypeBox, fontSize: "11px", marginLeft: "4px" }}>
                            {getUserTag(entry.user_id)}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", padding: "5px 8px" }}>{entry.wpm}</td>
                        <td style={{ textAlign: "right", padding: "5px 8px" }}>
                          {Math.round(entry.accuracy)}%
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "5px 8px",
                            color: theme.textTypeBox,
                            fontSize: "12px",
                          }}
                        >
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* History tab */}
        {activeTab === TAB_HISTORY && (
          <ScoreHistoryPanel
            language={language}
            difficulty={difficulty}
            duration={duration}
            numberAddon={numberAddon}
            symbolAddon={symbolAddon}
            theme={theme}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardModal;
