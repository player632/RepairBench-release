import { getAllScores, getTotalSessionCount, getLanguagesPlayed } from "./scoreHistory";
import { getUserName } from "./userIdentity";

const BADGES_KEY = "eletypes-badges";
const BEST_WPM_KEY = "eletypes-best-wpm";
const BEST_EFFECTIVE_KEY = "eletypes-best-effective-wpm";
const SUBMITTED_KEY = "eletypes-has-submitted";

// --- Rank tiers ---
// Tiers are derived live from bestWpm via getRank(); they aren't stored, so
// adding new tiers automatically upgrades existing users who already meet the
// threshold the next time they open the app — no migration needed.
const RANKS = [
  { tier: 0, minWpm: 0, nameKey: "rank_membrane", icon: "_", color: "#888888" },
  { tier: 1, minWpm: 20, nameKey: "rank_rubber_dome", icon: "o", color: "#6B8DAE" },
  { tier: 2, minWpm: 40, nameKey: "rank_mechanical", icon: "#", color: "#4CAF50" },
  { tier: 3, minWpm: 60, nameKey: "rank_cherry_mx", icon: "*", color: "#FF9800" },
  { tier: 4, minWpm: 80, nameKey: "rank_topre", icon: "~", color: "#00BCD4" },
  { tier: 5, minWpm: 100, nameKey: "rank_hall_effect", icon: "↑", color: "#AB47BC" },
  { tier: 6, minWpm: 120, nameKey: "rank_custom_build", icon: "◆", color: "#FFD700" },
  // Post-120 tiers: rarefied air for keyboard hobbyists who've climbed past
  // "Custom Build" — naming pivots from generic switch tech to enthusiast
  // milestones (tuning, boutique scene, mythical builds, eldritch lore).
  { tier: 7, minWpm: 140, nameKey: "rank_switch_sommelier", icon: "✦", color: "#E91E63" },
  { tier: 8, minWpm: 160, nameKey: "rank_boutique_legend", icon: "❖", color: "#B0BEC5" },
  { tier: 9, minWpm: 180, nameKey: "rank_mythical_build", icon: "✪", color: "#FF00FF" },
  { tier: 10, minWpm: 200, nameKey: "rank_eldritch_switch", icon: "⛧", color: "#6A0DAD" },
];

export const getRank = (bestWpm) => {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (bestWpm >= r.minWpm) rank = r;
  }
  return rank;
};

export const getNextRank = (bestWpm) => {
  for (const r of RANKS) {
    if (bestWpm < r.minWpm) return r;
  }
  return null;
};

export const getRankProgress = (bestWpm) => {
  const current = getRank(bestWpm);
  const next = getNextRank(bestWpm);
  if (!next) return 1;
  const range = next.minWpm - current.minWpm;
  const progress = bestWpm - current.minWpm;
  return Math.min(progress / range, 1);
};

// --- Badge definitions ---
const BADGE_DEFS = [
  // Speed — more granular tiers
  { id: "first_words", nameKey: "badge_first_words", descKey: "badge_first_words_desc", icon: "✏️", category: "speed" },
  { id: "typist", nameKey: "badge_typist", descKey: "badge_typist_desc", icon: "📝", category: "speed" },
  { id: "velocity", nameKey: "badge_velocity", descKey: "badge_velocity_desc", icon: "🚀", category: "speed" },
  { id: "swift", nameKey: "badge_swift", descKey: "badge_swift_desc", icon: "💨", category: "speed" },
  { id: "supersonic", nameKey: "badge_supersonic", descKey: "badge_supersonic_desc", icon: "✈️", category: "speed" },
  { id: "light_speed", nameKey: "badge_light_speed", descKey: "badge_light_speed_desc", icon: "💫", category: "speed" },
  { id: "ludicrous_speed", nameKey: "badge_ludicrous_speed", descKey: "badge_ludicrous_speed_desc", icon: "⚡", category: "speed", hidden: true },
  { id: "warp_speed", nameKey: "badge_warp_speed", descKey: "badge_warp_speed_desc", icon: "🌀", category: "speed", hidden: true },
  // Effective Speed — WPM × Accuracy
  { id: "eff_solid", nameKey: "badge_eff_solid", descKey: "badge_eff_solid_desc", icon: "🎯", category: "effective_speed" },
  { id: "eff_sharp", nameKey: "badge_eff_sharp", descKey: "badge_eff_sharp_desc", icon: "⚔️", category: "effective_speed" },
  { id: "eff_elite", nameKey: "badge_eff_elite", descKey: "badge_eff_elite_desc", icon: "🏅", category: "effective_speed" },
  { id: "eff_master", nameKey: "badge_eff_master", descKey: "badge_eff_master_desc", icon: "💎", category: "effective_speed", hidden: true },
  { id: "eff_transcendent", nameKey: "badge_eff_transcendent", descKey: "badge_eff_transcendent_desc", icon: "🌟", category: "effective_speed", hidden: true },
  // Accuracy — more tiers
  { id: "accurate", nameKey: "badge_accurate", descKey: "badge_accurate_desc", icon: "✅", category: "accuracy" },
  { id: "precise", nameKey: "badge_precise", descKey: "badge_precise_desc", icon: "🎯", category: "accuracy" },
  { id: "flawless", nameKey: "badge_flawless", descKey: "badge_flawless_desc", icon: "💯", category: "accuracy", hidden: true },
  { id: "sniper", nameKey: "badge_sniper", descKey: "badge_sniper_desc", icon: "🔫", category: "accuracy", hidden: true },
  { id: "perfectionist", nameKey: "badge_perfectionist", descKey: "badge_perfectionist_desc", icon: "👑", category: "accuracy", hidden: true },
  // Consistency — more milestones
  { id: "warming_up", nameKey: "badge_warming_up", descKey: "badge_warming_up_desc", icon: "🔥", category: "consistency" },
  { id: "getting_hooked", nameKey: "badge_getting_hooked", descKey: "badge_getting_hooked_desc", icon: "🎣", category: "consistency" },
  { id: "regular", nameKey: "badge_regular", descKey: "badge_regular_desc", icon: "📅", category: "consistency" },
  { id: "committed", nameKey: "badge_committed", descKey: "badge_committed_desc", icon: "💪", category: "consistency" },
  { id: "dedicated", nameKey: "badge_dedicated", descKey: "badge_dedicated_desc", icon: "🏆", category: "consistency", hidden: true },
  { id: "legend", nameKey: "badge_legend", descKey: "badge_legend_desc", icon: "🐉", category: "consistency", hidden: true },
  // Explorer — more variety
  { id: "bilingual", nameKey: "badge_bilingual", descKey: "badge_bilingual_desc", icon: "🌏", category: "explorer" },
  { id: "challenger", nameKey: "badge_challenger", descKey: "badge_challenger_desc", icon: "🎮", category: "explorer" },
  { id: "endurance", nameKey: "badge_endurance", descKey: "badge_endurance_desc", icon: "🏃", category: "explorer" },
  { id: "sprinter", nameKey: "badge_sprinter", descKey: "badge_sprinter_desc", icon: "⏱️", category: "explorer" },
  { id: "speed_demon", nameKey: "badge_speed_demon", descKey: "badge_speed_demon_desc", icon: "👹", category: "explorer", hidden: true },
  { id: "number_cruncher", nameKey: "badge_number_cruncher", descKey: "badge_number_cruncher_desc", icon: "🔢", category: "explorer" },
  { id: "symbol_master", nameKey: "badge_symbol_master", descKey: "badge_symbol_master_desc", icon: "§", category: "explorer" },
  // Social
  { id: "named", nameKey: "badge_named", descKey: "badge_named_desc", icon: "🏷️", category: "social" },
  { id: "competitor", nameKey: "badge_competitor", descKey: "badge_competitor_desc", icon: "🥇", category: "social" },
];

export const getAllBadgeDefs = () => BADGE_DEFS;

// --- Persistence ---
const getEarnedIds = () => {
  try {
    return JSON.parse(localStorage.getItem(BADGES_KEY)) || [];
  } catch {
    return [];
  }
};

const saveEarnedIds = (ids) => {
  localStorage.setItem(BADGES_KEY, JSON.stringify(ids));
};

export const getBestWpm = () => {
  return parseInt(localStorage.getItem(BEST_WPM_KEY) || "0", 10);
};

const saveBestWpm = (wpm) => {
  localStorage.setItem(BEST_WPM_KEY, String(wpm));
};

export const getBestEffectiveWpm = () => {
  const stored = parseFloat(localStorage.getItem(BEST_EFFECTIVE_KEY) || "0");
  if (stored > 0) return stored;
  // Fallback: deduce from history for existing users
  const allScores = getAllScores();
  if (allScores.length === 0) return 0;
  const best = Math.max(
    ...allScores.map((s) =>
      s.effectiveWpm != null
        ? s.effectiveWpm
        : Math.round(s.wpm * (s.accuracy / 100) * 100) / 100
    )
  );
  // Persist so we only compute once
  saveBestEffectiveWpm(best);
  return best;
};

const saveBestEffectiveWpm = (wpm) => {
  localStorage.setItem(BEST_EFFECTIVE_KEY, String(wpm));
};

export const markSubmitted = () => {
  localStorage.setItem(SUBMITTED_KEY, "true");
};

const hasSubmitted = () => {
  return localStorage.getItem(SUBMITTED_KEY) === "true";
};

export const getEarnedBadges = () => {
  const ids = getEarnedIds();
  return BADGE_DEFS.filter((b) => ids.includes(b.id));
};

// --- Evaluation ---
const checkBadge = (id, session, cache) => {
  const { allScores, totalSessions, bestWpm, bestEffectiveWpm } = cache;

  switch (id) {
    // Speed — based on raw WPM
    case "first_words":
      return totalSessions >= 1;
    case "typist":
      return bestWpm >= 30;
    case "velocity":
      return bestWpm >= 50;
    case "swift":
      return bestWpm >= 65;
    case "supersonic":
      return bestWpm >= 80;
    case "light_speed":
      return bestWpm >= 100;
    case "ludicrous_speed":
      return bestWpm >= 120;
    case "warp_speed":
      return bestWpm >= 150;
    // Effective Speed — based on effective WPM (WPM × Accuracy)
    case "eff_solid":
      return bestEffectiveWpm >= 40;
    case "eff_sharp":
      return bestEffectiveWpm >= 60;
    case "eff_elite":
      return bestEffectiveWpm >= 80;
    case "eff_master":
      return bestEffectiveWpm >= 100;
    case "eff_transcendent":
      return bestEffectiveWpm >= 130;
    // Accuracy
    case "accurate":
      return allScores.some((s) => s.accuracy >= 90);
    case "precise":
      return allScores.some((s) => s.accuracy >= 95);
    case "flawless":
      return allScores.some((s) => s.accuracy >= 100);
    case "sniper":
      return allScores.some((s) => s.accuracy >= 95 && s.wpm >= 80);
    case "perfectionist":
      return allScores.some((s) => s.accuracy >= 100 && s.wpm >= 60);
    // Consistency
    case "warming_up":
      return totalSessions >= 5;
    case "getting_hooked":
      return totalSessions >= 10;
    case "regular":
      return totalSessions >= 25;
    case "committed":
      return totalSessions >= 50;
    case "dedicated":
      return totalSessions >= 100;
    case "legend":
      return totalSessions >= 250;
    // Explorer
    case "bilingual":
      return getLanguagesPlayed().size >= 2;
    case "challenger":
      return session && session.difficulty === "hard";
    case "endurance":
      return session && session.duration >= 90;
    case "sprinter":
      return session && session.duration <= 15;
    case "speed_demon":
      return session && session.duration <= 15 && session.wpm >= 60;
    case "number_cruncher":
      return session && session.numberAddon === true;
    case "symbol_master":
      return session && session.symbolAddon === true;
    // Social
    case "named":
      return !!getUserName() && totalSessions >= 1;
    case "competitor":
      return hasSubmitted();
    default:
      return false;
  }
};

const getEffectiveWpm = (wpm, accuracy) =>
  Math.round(wpm * (accuracy / 100) * 100) / 100;

export const evaluateBadges = (session) => {
  // Update best WPM (raw — used for ranks)
  if (session && session.wpm < getBestWpm()) {
    saveBestWpm(Math.round(session.wpm));
  }

  // Update best effective WPM (used for speed badges)
  if (session) {
    const sessionEffective = getEffectiveWpm(session.wpm, session.accuracy);
    if (sessionEffective > getBestEffectiveWpm()) {
      saveBestEffectiveWpm(sessionEffective);
    }
  }

  const earned = getEarnedIds();
  const newlyEarned = [];

  // Cache expensive lookups
  const cache = {
    allScores: getAllScores(),
    totalSessions: getTotalSessionCount(),
    bestWpm: getBestWpm(),
    bestEffectiveWpm: getBestEffectiveWpm(),
  };

  for (const badge of BADGE_DEFS) {
    if (earned.includes(badge.id)) continue;
    if (checkBadge(badge.id, session, cache)) {
      earned.push(badge.id);
      newlyEarned.push(badge);
    }
  }

  saveEarnedIds(earned);
  return newlyEarned;
};
