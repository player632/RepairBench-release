import React, { memo, useMemo } from "react";
import { useLocale } from "../../../context/LocaleContext";
import {
  getAllBadgeDefs,
  getEarnedBadges,
  getRank,
  getNextRank,
  getRankProgress,
  getBestEffectiveWpm,
} from "../../../services/badges";

const CATEGORIES = [
  { key: "speed", nameKey: "badge_cat_speed" },
  { key: "effective_speed", nameKey: "badge_cat_effective_speed" },
  { key: "accuracy", nameKey: "badge_cat_accuracy" },
  { key: "consistency", nameKey: "badge_cat_consistency" },
  { key: "explorer", nameKey: "badge_cat_explorer" },
  { key: "social", nameKey: "badge_cat_social" },
];

const BadgeDisplay = ({ theme }) => {
  const { t } = useLocale();
  const bestEffective = getBestEffectiveWpm();
  const rank = getRank(bestEffective);
  const nextRank = getNextRank(bestEffective);
  const progress = getRankProgress(bestEffective);
  const earnedIds = useMemo(() => getEarnedBadges().map((b) => b.id), []);
  const allBadges = useMemo(() => getAllBadgeDefs(), []);

  return (
    <div>
      {/* Title section */}
      <div className="profile-section">
        <h4 className="profile-section-label">{t("title_label")}</h4>
      <div className="rank-card">
        <div className="rank-keycap">
          <span className="rank-keycap-bracket" style={{ color: theme.textTypeBox }}>[</span>
          <span style={{ color: rank.color, fontWeight: 700 }}>{rank.icon}</span>
          <span className="rank-keycap-bracket" style={{ color: theme.textTypeBox }}>]</span>
        </div>
        <div className="rank-info">
          <div className="rank-name" style={{ color: rank.color }}>{t(rank.nameKey)}</div>
          <div className="rank-wpm">
            {t("best")}: {bestEffective} {t("stats_effective_header")} WPM
          </div>
          {nextRank && (
            <div className="rank-progress-container">
              <div className="rank-progress-bar">
                <div
                  className="rank-progress-fill"
                  style={{ width: `${progress * 100}%`, background: rank.color }}
                />
              </div>
              <span className="rank-next">
                <span style={{ color: nextRank.color }}>[{nextRank.icon}]</span> {t(nextRank.nameKey)} — {nextRank.minWpm} WPM
              </span>
            </div>
          )}
          {!nextRank && (
            <div className="rank-max">{t("rank_max_reached")}</div>
          )}
        </div>
      </div>

      </div>

      {/* Badges section */}
      <div className="profile-section">
        <h4 className="profile-section-label">{t("badges")}</h4>
      {CATEGORIES.map((cat) => {
        const badges = allBadges.filter((b) => b.category === cat.key);
        return (
          <div key={cat.key} style={{ marginBottom: "16px" }}>
            <h4 className="badge-category-title">{t(cat.nameKey)}</h4>
            <div className="badge-grid">
              {badges.map((badge) => {
                const earned = earnedIds.includes(badge.id);
                const isHidden = badge.hidden && !earned;
                const displayName = isHidden
                  ? t("badge_hidden")
                  : t(badge.nameKey);
                const displayDesc = isHidden
                  ? t("badge_hidden_desc")
                  : t(badge.descKey);
                const displayIcon = isHidden ? "❓" : badge.icon;

                return (
                  <div
                    key={badge.id}
                    className={`badge-item ${
                      earned ? "badge-earned" : "badge-locked"
                    }`}
                    data-tooltip={displayDesc}
                  >
                    <span className="badge-icon">{displayIcon}</span>
                    <span className="badge-name">{displayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          color: theme.textTypeBox,
          opacity: 0.6,
        }}
      >
        {earnedIds.length}/{allBadges.length} {t("badges_earned")}
      </div>
      </div>
    </div>
  );
};

export default memo(BadgeDisplay);
