import React, { memo, useState } from "react";
import {
  Line,
  YAxis,
  Tooltip as TooltipChart,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { getScores, removeScore } from "../../../services/scoreHistory";
import { useLocale } from "../../../context/LocaleContext";

const ScoreHistoryPanel = ({ language, difficulty, duration, numberAddon, symbolAddon, theme, onScoreChange }) => {
  const { t } = useLocale();
  const [version, setVersion] = useState(0);
  // Re-read scores when version changes (after delete)
  const scores = getScores({ language, difficulty, duration, numberAddon, symbolAddon });
  // Force re-render trick: version is in state but scores are read fresh
  void version;

  if (scores.length === 0) {
    return (
      <p style={{ color: theme.textTypeBox, fontSize: "14px" }}>
        {t("no_history")}
      </p>
    );
  }

  const handleRemove = (index) => {
    removeScore({ language, difficulty, duration, numberAddon, symbolAddon, index });
    setVersion((v) => v + 1);
    if (onScoreChange) onScoreChange();
  };

  // Compute stats — use effectiveWpm if available, fall back to wpm
  const getEffective = (s) =>
    s.effectiveWpm != null ? s.effectiveWpm : Math.round(s.wpm * (s.accuracy / 100) * 100) / 100;

  // Flag outliers
  const effectives = scores.map(getEffective);
  const sorted = [...effectives].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const mean = effectives.reduce((a, b) => a + b, 0) / effectives.length;
  const sd = Math.sqrt(effectives.reduce((a, b) => a + (b - mean) ** 2, 0) / effectives.length);
  const isOutlier = (s) => {
    // Low accuracy is always suspect
    if (s.accuracy < 50) return true;
    const eff = getEffective(s);
    // Far below median — catches obvious garbage in small samples
    if (scores.length >= 3 && eff < median * 0.5) return true;
    // Statistical outlier
    if (scores.length >= 4 && Math.abs(eff - mean) > 2 * sd) return true;
    return false;
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span style={{ color: theme.textTypeBox, fontSize: "13px" }}>
          {scores.length === 1 ? t("last_session") : t("last_sessions", scores.length)}
        </span>
        <div style={{ fontSize: "13px", color: theme.textTypeBox, display: "flex", gap: "16px" }}>
          <span>
            {t("best")}:{" "}
            <span style={{ color: theme.stats }}>
              {Math.round(Math.max(...effectives) * 100) / 100}
            </span>
          </span>
          <span>
            {t("avg")}:{" "}
            <span style={{ color: theme.text }}>
              {Math.round(effectives.reduce((a, b) => a + b, 0) / effectives.length * 100) / 100}
            </span>
          </span>
          <span style={{ fontSize: "11px", opacity: 0.6 }}>
            {t("stats_effective_header")}
          </span>
        </div>
      </div>
      {scores.length > 1 && (
        <ResponsiveContainer width="100%" height={100}>
          <ComposedChart
            data={scores.map((s) => ({ ...s, _outlier: isOutlier(s) }))}
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
                      <circle cx={cx} cy={cy} r={5} fill="none" stroke="#ff4444" strokeWidth={2} />
                      <circle cx={cx} cy={cy} r={2} fill="#ff4444" />
                    </g>
                  );
                }
                return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill={theme.stats} />;
              }}
              strokeWidth={1.5}
            />
            <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
            <TooltipChart
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const eff = getEffective(d);
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
                      <div>{d.wpm} WPM · {d.accuracy}% ACC</div>
                      <div style={{ color: theme.stats }}>{eff} {t("stats_effective_header")}</div>
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
      )}
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          marginTop: "8px",
          scrollbarWidth: "thin",
          scrollbarColor: `${theme.stats}44 transparent`,
        }}
      >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ color: theme.textTypeBox, borderBottom: `1px solid ${theme.textTypeBox}` }}>
            <th style={{ textAlign: "left", padding: "6px 8px" }}>{t("rank_header")}</th>
            <th style={{ textAlign: "right", padding: "6px 8px" }}>WPM</th>
            <th style={{ textAlign: "right", padding: "6px 8px" }}>ACC</th>
            <th style={{ textAlign: "right", padding: "6px 8px" }} title={t("stats_effective_tooltip")}>{t("stats_effective_header")}</th>
            <th style={{ textAlign: "right", padding: "6px 8px" }}>{t("date_header")}</th>
            <th style={{ width: "28px" }}></th>
          </tr>
        </thead>
        <tbody>
          {[...scores].reverse().map((entry, idx) => {
            const originalIdx = scores.length - 1 - idx;
            const outlier = isOutlier(entry);
            const eff = getEffective(entry);
            return (
              <tr
                key={idx}
                style={{
                  color: idx === 0 ? theme.stats : outlier ? `${theme.textTypeBox}88` : theme.text,
                  borderBottom: `1px solid ${theme.textTypeBox}33`,
                  fontStyle: "normal",
                }}
              >
                <td style={{ padding: "5px 8px" }}>
                  {scores.length - idx}
                  {outlier && (
                    <span
                      title={t("stats_outlier_tooltip")}
                      style={{ marginLeft: "6px", fontSize: "14px", color: "#ff4444" }}
                    >
                      ⚠
                    </span>
                  )}
                </td>
                <td style={{ textAlign: "right", padding: "5px 8px" }}>{entry.wpm}</td>
                <td style={{ textAlign: "right", padding: "5px 8px" }}>{Math.round(entry.accuracy)}%</td>
                <td style={{ textAlign: "right", padding: "5px 8px", color: theme.stats }}>{eff}</td>
                <td style={{ textAlign: "right", padding: "5px 8px", color: theme.textTypeBox, fontSize: "12px" }}>
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td style={{ textAlign: "center", padding: "5px 4px" }}>
                  <button
                    onClick={() => handleRemove(originalIdx)}
                    title={t("stats_remove")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: theme.stats,
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "2px 4px",
                      fontWeight: 600,
                    }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default memo(ScoreHistoryPanel);
