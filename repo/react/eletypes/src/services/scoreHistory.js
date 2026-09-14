const HISTORY_KEY = "eletypes-score-history";
const MAX_ENTRIES = 50;

const getModeKey = ({ language, difficulty, duration, numberAddon, symbolAddon }) => {
  return `${language}|${difficulty}|${numberAddon}|${symbolAddon}`;
};

const getAll = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
  } catch {
    return {};
  }
};

export const addScore = ({ wpm, accuracy, language, difficulty, duration, numberAddon, symbolAddon }) => {
  const all = getAll();
  const key = getModeKey({ language, difficulty, duration, numberAddon, symbolAddon });
  const entries = all[key] || [];
  const roundedWpm = Math.round(wpm);
  const roundedAccuracy = Math.round(accuracy) / 100;
  entries.push({
    wpm: roundedWpm,
    accuracy: roundedAccuracy,
    effectiveWpm: Math.round(roundedWpm * roundedAccuracy * 100) / 100,
    date: new Date().toISOString(),
  });
  // Keep only the last MAX_ENTRIES
  all[key] = entries.slice(-MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
};

export const removeScore = ({ language, difficulty, duration, numberAddon, symbolAddon, index }) => {
  const all = getAll();
  const key = getModeKey({ language, difficulty, duration, numberAddon, symbolAddon });
  const entries = all[key] || [];
  if (index >= 0 && index < entries.length) {
    entries.splice(index, 1);
    all[key] = entries;
    if (entries.length === 0) delete all[key];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  }
};

export const clearAllScores = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const getScores = ({ language, difficulty, duration, numberAddon, symbolAddon }) => {
  const all = getAll();
  const key = getModeKey({ language, difficulty, duration, numberAddon, symbolAddon });
  return all[key] || [];
};

export const getAllScores = () => {
  const all = getAll();
  return Object.values(all).flat();
};

export const getTotalSessionCount = () => {
  return getAllScores().length;
};

export const getLanguagesPlayed = () => {
  const all = getAll();
  const languages = new Set();
  for (const key of Object.keys(all)) {
    if (all[key].length > 0) {
      languages.add(key.split("|")[0]);
    }
  }
  return languages;
};

const getEffective = (s) =>
  s.effectiveWpm != null
    ? s.effectiveWpm
    : Math.round(s.wpm * (s.accuracy / 100) * 100) / 100;

export const getAggregateStats = () => {
  const all = getAll();
  const allScores = Object.values(all).flat();
  if (allScores.length === 0) return null;

  const totalSessions = allScores.length;
  const effectives = allScores.map(getEffective);
  const bestEffective = Math.round(Math.max(...effectives) * 100) / 100;
  const avgEffective = Math.round(effectives.reduce((a, b) => a + b, 0) / totalSessions * 100) / 100;
  const avgAccuracy = Math.round(
    (allScores.reduce((a, b) => a + b.accuracy, 0) / totalSessions) * 100
  ) / 100;

  // Count unique modes played
  const modesPlayed = Object.keys(all).filter((k) => all[k].length > 0).length;

  return { totalSessions, bestEffective, avgEffective, avgAccuracy, modesPlayed };
};

export const getScoresByDate = () => {
  const allScores = getAllScores();
  const byDate = {};
  for (const score of allScores) {
    // Convert ISO UTC string to local date for correct timezone matching
    const d = new Date(score.date);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!byDate[day]) byDate[day] = [];
    byDate[day].push(score);
  }
  return byDate;
};

export const getModeBreakdown = () => {
  const all = getAll();
  const breakdown = [];
  for (const [key, scores] of Object.entries(all)) {
    if (scores.length === 0) continue;
    const [language, difficulty, duration, numberAddon, symbolAddon] = key.split("|");
    const effectives = scores.map(getEffective);
    breakdown.push({
      language,
      difficulty,
      duration: Number(duration),
      numberAddon: numberAddon === "true",
      symbolAddon: symbolAddon === "true",
      sessions: scores.length,
      bestEffective: Math.round(Math.max(...effectives) * 100) / 100,
      avgEffective: Math.round(effectives.reduce((a, b) => a + b, 0) / scores.length * 100) / 100,
      avgAccuracy: Math.round(
        (scores.reduce((a, b) => a + b.accuracy, 0) / scores.length) * 100
      ) / 100,
    });
  }
  return breakdown.sort((a, b) => b.sessions - a.sessions);
};
