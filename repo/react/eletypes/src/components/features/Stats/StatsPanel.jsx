import React, { useState, useRef } from "react";
import {
  Line,
  YAxis,
  Tooltip as TooltipChart,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  getAllScores,
  getAggregateStats,
  getScoresByDate,
  getModeBreakdown,
  clearAllScores,
} from "../../../services/scoreHistory";
import { useLocale } from "../../../context/LocaleContext";
import ActivityHeatmap from "./ActivityHeatmap";
import ShareButton from "../Share/ShareButton";
import ScoreHistoryPanel from "../Leaderboard/ScoreHistoryPanel";
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

const StatCard = ({ label, value, sub, theme }) => (
  <div
    style={{
      flex: "1 1 0",
      minWidth: "80px",
      padding: "10px 12px",
      border: `1px solid ${theme.textTypeBox}22`,
      borderRadius: "6px",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "22px",
        fontWeight: 600,
        color: theme.stats,
        fontFamily: theme.fontFamily,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: "11px", color: theme.textTypeBox, marginTop: "2px" }}>
      {label}
    </div>
    {sub && (
      <div style={{ fontSize: "10px", color: theme.textTypeBox, opacity: 0.6, marginTop: "1px" }}>
        {sub}
      </div>
    )}
  </div>
);

const DURATIONS = [COUNT_DOWN_15, COUNT_DOWN_30, COUNT_DOWN_60, COUNT_DOWN_90];
const DIFFICULTIES = [DEFAULT_DIFFICULTY, HARD_DIFFICULTY];
const LANGUAGES = [
  { value: ENGLISH_MODE, label: "eng" },
  { value: CHINESE_MODE, label: "chn" },
];

const StatsPanel = ({ theme }) => {
  const { t } = useLocale();
  const [version, setVersion] = useState(0);
  void version; // triggers re-render when incremented

  const stats = getAggregateStats();
  const scoresByDate = getScoresByDate();
  const allScores = getAllScores();
  const modeBreakdown = getModeBreakdown();

  const handleScoreChange = () => setVersion((v) => v + 1);
  const shareRef = useRef(null);

  // History filters
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

  if (!stats) {
    return (
      <p style={{ color: theme.textTypeBox, fontSize: "14px" }}>
        {t("no_history")}
      </p>
    );
  }

  // Build WPM trend from all scores sorted by date
  const getEffective = (s) =>
    s.effectiveWpm != null ? s.effectiveWpm : Math.round(s.wpm * (s.accuracy / 100) * 100) / 100;

  const wpmTrend = [...allScores]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((s, i) => ({
      session: i + 1,
      wpm: s.wpm,
      accuracy: s.accuracy,
      effectiveWpm: getEffective(s),
      date: s.date,
      _outlier: s.accuracy < 50,
    }));

  // Mark outliers in trend
  if (wpmTrend.length >= 3) {
    const effs = wpmTrend.map((s) => s.effectiveWpm);
    const sorted = [...effs].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const trendMean = effs.reduce((a, b) => a + b, 0) / effs.length;
    const trendSd = Math.sqrt(effs.reduce((a, b) => a + (b - trendMean) ** 2, 0) / effs.length);
    for (const s of wpmTrend) {
      if (s.effectiveWpm < median * 0.5) s._outlier = true;
      if (wpmTrend.length >= 4 && Math.abs(s.effectiveWpm - trendMean) > 2 * trendSd) s._outlier = true;
    }
  }

  // Active days count
  const activeDays = Object.keys(scoresByDate).length;

  // Streak calculation (using local dates)
  const toLocalDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date();
  let streak = 0;
  const checkDate = new Date(today);
  while (true) {
    const key = toLocalDate(checkDate);
    if (scoresByDate[key]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (streak === 0) {
      // Allow checking yesterday if nothing today yet
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayKey = toLocalDate(checkDate);
      if (scoresByDate[yesterdayKey]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  const formatModeLabel = (mode) => {
    const parts = [];
    parts.push(mode.language === "ENGLISH_MODE" ? "eng" : "chn");
    parts.push(mode.difficulty === "normal" ? "normal" : "hard");
    parts.push(`${mode.duration}s`);
    if (mode.numberAddon) parts.push("+num");
    if (mode.symbolAddon) parts.push("+sym");
    return parts.join(" · ");
  };

  return (
    <div>
      <div ref={shareRef} style={{ background: theme.background, padding: "16px" }}>
      {/* Summary cards */}
      <div className="profile-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h4 className="profile-section-label" style={{ color: theme.textTypeBox, margin: 0 }}>
            {t("stats_overview")}
          </h4>
          <ShareButton targetRef={shareRef} theme={theme} />
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <StatCard label={t("stats_best_effective")} value={stats.bestEffective} theme={theme} />
          <StatCard label={t("stats_avg_effective")} value={stats.avgEffective} theme={theme} />
          <StatCard
            label={t("stats_avg_acc")}
            value={`${stats.avgAccuracy}%`}
            theme={theme}
          />
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="profile-section">
        <h4 className="profile-section-label" style={{ color: theme.textTypeBox }}>
          {t("stats_activity")}
        </h4>
        <ActivityHeatmap
          scoresByDate={scoresByDate}
          streak={streak}
          activeDays={activeDays}
          allScores={allScores}
          theme={theme}
        />
      </div>
      </div>{/* end shareRef */}

      {/* WPM trend chart */}
      {wpmTrend.length > 1 && (
        <div className="profile-section">
          <h4 className="profile-section-label" style={{ color: theme.textTypeBox }}>
            {t("stats_wpm_trend")}
          </h4>
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart
              data={wpmTrend}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <Line
                type="monotone"
                dataKey="wpm"
                stroke={theme.text}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload._outlier) {
                    return (
                      <g key={`dot-${cx}-${cy}`}>
                        <circle cx={cx} cy={cy} r={4} fill="none" stroke="#ff4444" strokeWidth={2} />
                        <circle cx={cx} cy={cy} r={1.5} fill="#ff4444" />
                      </g>
                    );
                  }
                  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={2} fill={theme.stats} />;
                }}
                strokeWidth={1.5}
              />
              <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
              <TooltipChart
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: theme.background,
                          border: `1px solid ${theme.textTypeBox}`,
                          padding: "4px 8px",
                          fontSize: "12px",
                          opacity: 0.9,
                        }}
                      >
                        {d._outlier && (
                          <div style={{ color: "#ff4444", fontWeight: 600 }}>⚠ {t("stats_outlier_label")}</div>
                        )}
                        <div>
                          {d.wpm} WPM · {d.accuracy}%
                        </div>
                        <div style={{ color: theme.stats }}>
                          {d.effectiveWpm} {t("stats_effective_header")}
                        </div>
                        <div style={{ color: theme.textTypeBox }}>
                          {new Date(d.date).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mode breakdown */}
      {modeBreakdown.length > 0 && (
        <div className="profile-section">
          <h4 className="profile-section-label" style={{ color: theme.textTypeBox }}>
            {t("stats_modes_breakdown")}
          </h4>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  color: theme.textTypeBox,
                  borderBottom: `1px solid ${theme.textTypeBox}33`,
                }}
              >
                <th style={{ textAlign: "left", padding: "5px 6px" }}>
                  {t("stats_mode")}
                </th>
                <th style={{ textAlign: "right", padding: "5px 6px" }}>#</th>
                <th style={{ textAlign: "right", padding: "5px 6px" }}>
                  {t("stats_best_short")}
                </th>
                <th style={{ textAlign: "right", padding: "5px 6px" }}>
                  {t("stats_avg_short")}
                </th>
                <th style={{ textAlign: "right", padding: "5px 6px" }}>ACC</th>
              </tr>
            </thead>
            <tbody>
              {modeBreakdown.slice(0, 8).map((mode, i) => (
                <tr
                  key={i}
                  style={{
                    color: theme.text,
                    borderBottom: `1px solid ${theme.textTypeBox}15`,
                  }}
                >
                  <td
                    style={{
                      padding: "4px 6px",
                      color: theme.textTypeBox,
                      fontSize: "13px",
                    }}
                  >
                    {formatModeLabel(mode)}
                  </td>
                  <td style={{ textAlign: "right", padding: "4px 6px" }}>
                    {mode.sessions}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "4px 6px",
                      color: theme.stats,
                    }}
                  >
                    {mode.bestEffective}
                  </td>
                  <td style={{ textAlign: "right", padding: "4px 6px" }}>
                    {mode.avgEffective}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "4px 6px",
                      fontSize: "12px",
                      color: theme.textTypeBox,
                    }}
                  >
                    {mode.avgAccuracy}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Session history */}
      <div className="profile-section">
        <h4 className="profile-section-label" style={{ color: theme.textTypeBox }}>
          {t("my_history")}
        </h4>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "12px",
          }}
        >
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
        <ScoreHistoryPanel
          language={language}
          difficulty={difficulty}
          duration={duration}
          numberAddon={numberAddon}
          symbolAddon={symbolAddon}
          theme={theme}
          onScoreChange={handleScoreChange}
        />
      </div>

      {/* Clear all history */}
      <div style={{ textAlign: "right", paddingTop: "8px" }}>
        <button
          onClick={() => {
            if (window.confirm(t("stats_clear_confirm"))) {
              clearAllScores();
              handleScoreChange();
            }
          }}
          style={{
            background: "transparent",
            border: `1px solid ${theme.stats}44`,
            borderRadius: "4px",
            color: theme.stats,
            padding: "4px 12px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: theme.fontFamily,
          }}
        >
          {t("stats_clear_all")}
        </button>
      </div>
    </div>
  );
};

export default StatsPanel;
