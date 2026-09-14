import React, { useMemo } from "react";
import { useLocale } from "../../../context/LocaleContext";

const CELL_SIZE = 16;
const CELL_GAP = 2;
const WEEKS = 13;

const getIntensity = (count) => {
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const StatCard = ({ label, value, theme }) => (
  <div
    style={{
      flex: "1 1 0",
      padding: "6px 8px",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "16px",
        fontWeight: 600,
        color: theme.stats,
        fontFamily: theme.fontFamily,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: "10px", color: theme.textTypeBox, marginTop: "1px" }}>
      {label}
    </div>
  </div>
);

const AccuracyGauge = ({ allScores, theme, size }) => {
  const { avgAcc, cv, label } = useMemo(() => {
    if (!allScores || allScores.length === 0) {
      return { avgAcc: 0, cv: 0, label: "—" };
    }
    if (allScores.length === 1) {
      return { avgAcc: allScores[0].accuracy, cv: 1, label: "Flawless" };
    }
    const accs = allScores.map((s) => s.accuracy);
    const m = accs.reduce((a, b) => a + b, 0) / accs.length;
    const variance = accs.reduce((a, b) => a + (b - m) ** 2, 0) / accs.length;
    const sd = Math.sqrt(variance);
    const coefficient = sd / Math.max(m, 1);
    const consistency = Math.max(0, Math.min(1, 1 - coefficient));
    let lbl;
    if (consistency >= 0.95) lbl = "Flawless";
    else if (consistency >= 0.85) lbl = "Reliable";
    else if (consistency >= 0.7) lbl = "Uneven";
    else lbl = "Volatile";
    return { avgAcc: Math.round(m * 10) / 10, cv: consistency, label: lbl };
  }, [allScores]);

  const r = (size - 8) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75;
  const filled = arcLength * cv;
  const startAngle = 135;

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={`${theme.textTypeBox}15`}
        strokeWidth={5}
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${startAngle} ${cx} ${cy})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={theme.text}
        strokeWidth={5}
        strokeDasharray={`${filled} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        opacity={0.8}
        transform={`rotate(${startAngle} ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="600"
        fill={theme.text}
      >
        {Math.round(cv * 100)}%
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontSize="10"
        fill={theme.textTypeBox}
      >
        {label}
      </text>
    </svg>
  );
};

const ConsistencyGauge = ({ allScores, theme, size }) => {
  const { mean, cv, label } = useMemo(() => {
    if (!allScores || allScores.length === 0) {
      return { mean: 0, cv: 0, label: "—" };
    }
    if (allScores.length === 1) {
      return { mean: allScores[0].wpm, cv: 1, label: "Laser" };
    }
    const wpms = allScores.map((s) =>
      s.effectiveWpm != null ? s.effectiveWpm : Math.round(s.wpm * (s.accuracy / 100) * 100) / 100
    );
    const m = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const variance = wpms.reduce((a, b) => a + (b - m) ** 2, 0) / wpms.length;
    const sd = Math.sqrt(variance);
    const coefficient = sd / m; // 0 = perfectly consistent
    const consistency = Math.max(0, Math.min(1, 1 - coefficient));
    let lbl;
    if (consistency >= 0.9) lbl = "Laser";
    else if (consistency >= 0.75) lbl = "Steady";
    else if (consistency >= 0.5) lbl = "Variable";
    else lbl = "Erratic";
    return { mean: m, cv: consistency, label: lbl };
  }, [allScores]);

  const r = (size - 8) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.75; // 270 degrees
  const filled = arcLength * cv;
  const startAngle = 135; // start from bottom-left

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      {/* Background arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={`${theme.textTypeBox}15`}
        strokeWidth={5}
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${startAngle} ${cx} ${cy})`}
      />
      {/* Filled arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={theme.stats}
        strokeWidth={5}
        strokeDasharray={`${filled} ${circumference}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        opacity={0.8}
        transform={`rotate(${startAngle} ${cx} ${cy})`}
      />
      {/* Percentage */}
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="600"
        fill={theme.stats}
      >
        {Math.round(cv * 100)}%
      </text>
      {/* Label */}
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fontSize="10"
        fill={theme.textTypeBox}
      >
        {label}
      </text>
    </svg>
  );
};

// Format local date as YYYY-MM-DD (avoids UTC timezone shift from toISOString)
const toLocalDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const ActivityHeatmap = ({ scoresByDate, streak, activeDays, allScores, theme }) => {
  const { t } = useLocale();

  const { grid, monthLabels, todayCount } = useMemo(() => {
    const today = new Date();
    const todayKey = toLocalDateStr(today);

    // End on Saturday of the current week, start 13 weeks before that
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay())); // next Saturday
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - WEEKS * 7 + 1);

    const cells = [];
    const months = [];
    let lastMonth = -1;
    let todayN = 0;

    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        const key = toLocalDateStr(date);
        const count = scoresByDate[key] ? scoresByDate[key].length : 0;
        const month = date.getMonth();

        if (key === todayKey) todayN = count;

        if (month !== lastMonth) {
          months.push({ week: w, month });
          lastMonth = month;
        }

        cells.push({
          week: w,
          day: d,
          date: key,
          count,
          intensity: getIntensity(count),
          isFuture: date > today,
        });
      }
    }

    return { grid: cells, monthLabels: months, todayCount: todayN };
  }, [scoresByDate]);

  const intensityColors = [
    `${theme.textTypeBox}15`,
    `${theme.stats}44`,
    `${theme.stats}77`,
    `${theme.stats}aa`,
    theme.stats,
  ];

  const step = CELL_SIZE + CELL_GAP;
  const labelW = 14;
  const gridWidth = labelW + WEEKS * step;
  const monthH = 12;
  const gridHeight = monthH + 7 * step;
  const legendH = 14;
  const svgH = gridHeight + legendH + 4;

  const sectionTitleStyle = {
    fontSize: "9px",
    color: theme.textTypeBox,
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "4px",
    textAlign: "center",
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
      {/* Heatmap — 30% */}
      <div style={{ flex: "0 0 30%" }}>
        <svg
          viewBox={`0 0 ${gridWidth} ${svgH}`}
          width="100%"
          style={{ display: "block" }}
        >
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={`m${i}`}
              x={labelW + m.week * step}
              y={monthH - 2}
              fontSize="7"
              fill={theme.textTypeBox}
            >
              {MONTH_NAMES[m.month]}
            </text>
          ))}

          {/* Day labels */}
          {[1, 3, 5].map((d) => (
            <text
              key={`d${d}`}
              x={0}
              y={monthH + d * step + CELL_SIZE * 0.8}
              fontSize="7"
              fill={theme.textTypeBox}
            >
              {["S", "M", "T", "W", "T", "F", "S"][d]}
            </text>
          ))}

          {/* Grid */}
          {grid.map((cell, i) => (
            <rect
              key={i}
              x={labelW + cell.week * step}
              y={monthH + cell.day * step}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={
                cell.isFuture
                  ? "transparent"
                  : intensityColors[cell.intensity]
              }
            >
              {cell.count > 0 && (
                <title>
                  {cell.date}: {cell.count} {cell.count === 1 ? "session" : "sessions"}
                </title>
              )}
            </rect>
          ))}

          {/* Legend */}
          <text
            x={labelW}
            y={gridHeight + legendH}
            fontSize="6.5"
            fill={theme.textTypeBox}
          >
            {t("heatmap_less")}
          </text>
          {intensityColors.map((color, i) => (
            <rect
              key={`l${i}`}
              x={labelW + 20 + i * 10}
              y={gridHeight + legendH - 7}
              width={7}
              height={7}
              rx={1.5}
              fill={color}
            />
          ))}
          <text
            x={labelW + 20 + intensityColors.length * 10 + 3}
            y={gridHeight + legendH}
            fontSize="6.5"
            fill={theme.textTypeBox}
          >
            {t("heatmap_more")}
          </text>
        </svg>
      </div>

      {/* Consistency gauge — 30% */}
      <div
        style={{ flex: "0 0 30%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        title={t("stats_consistency_tooltip")}
      >
        <div style={sectionTitleStyle}>{t("stats_consistency")}</div>
        <ConsistencyGauge allScores={allScores} theme={theme} size={svgH - 16} />
      </div>

      {/* Accuracy consistency — 30% */}
      <div
        style={{ flex: "0 0 30%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
        title={t("stats_accuracy_tooltip")}
      >
        <div style={sectionTitleStyle}>{t("stats_accuracy_consistency")}</div>
        <AccuracyGauge allScores={allScores} theme={theme} size={svgH - 16} />
      </div>

      {/* Stats — 10% */}
      <div
        style={{
          flex: "0 0 10%",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          justifyContent: "center",
        }}
      >
        <StatCard label={t("stats_streak")} value={streak} theme={theme} />
        <StatCard label={t("stats_today")} value={todayCount} theme={theme} />
        <StatCard label={t("stats_active_days")} value={activeDays} theme={theme} />
      </div>
    </div>
  );
};

export default ActivityHeatmap;
