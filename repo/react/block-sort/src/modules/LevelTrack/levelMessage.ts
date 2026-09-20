import {
  getDifficultyLevel,
  LEVEL_SCALE
} from "@/game/level-settings/levelSettings";
import { getLevelTypeByUnlock } from "@/game/level-types";
import { timesMap } from "@/support/timeMap";

import {
  DIFFICULTIES,
  DIFFICULTY_LEVELS,
  ZEN_MODE_UNLOCK
} from "../GameModi/constants";

export const getLevelMessage = (levelNr: number): string | undefined => {
  if (LEVEL_SCALE.includes(levelNr)) {
    const difficulty = DIFFICULTIES[getDifficultyLevel(levelNr)];
    const message = `${timesMap(difficulty.stars, () => "⭐️").join("")} ${difficulty.name} ${timesMap(difficulty.stars, () => "⭐️").join("")}`;
    return message;
  }
  if (ZEN_MODE_UNLOCK - 1 === levelNr) {
    return "🌻 Zen mode unlocked";
  }
  const unlockedZenDifficulty = DIFFICULTY_LEVELS.find(
    (d) => d.unlocksAtLevel - 1 === levelNr
  );
  if (unlockedZenDifficulty) {
    return `🌻 Zen difficulty ${unlockedZenDifficulty.name} unlocked`;
  }

  const unlockedZenType = getLevelTypeByUnlock(levelNr);
  if (unlockedZenType) {
    return `🌻 Zen level type ${unlockedZenType.name} unlocked`;
  }

  return undefined;
};
