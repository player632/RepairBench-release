import React from "react";
import { useGameStore, useHashRate, useResearchRate } from "./engine/game";
import { getVictoryStorage } from "./engine/victory-store";

// rb-probe.tsx - observation face for the repair-bench harness.
//
// Two rules shaped this file:
//
// 1. NOTHING here is recomputed. Every number is either read straight off the store or
//    obtained from the application's own exported selectors (useHashRate, useResearchRate).
//    A probe that re-implemented the app's arithmetic would keep producing the correct
//    answer after a defect changed the app's one, and could therefore never go red.
//
// 2. Values that the UI renders through an animated counter (countup.js writes into
//    #doge-counter and #success-percent imperatively, over 100ms) are exposed here as
//    exact store numbers instead, so an assertion reads a settled value rather than
//    racing an animation. The animated elements themselves are left untouched.
//
// The strip is fixed to the bottom-left, tiny and click-through: it is readable by a
// locator (so innerText/text assertions work) without covering any panel of the game.

const fmt = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return value.map((v) => fmt(v)).join("|");
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
};

const Cell: React.FC<{ id: string; value: unknown }> = ({ id, value }) => (
  <span data-testid={id}>{fmt(value)}</span>
);

export const RbProbe: React.FC = () => {
  const store = useGameStore();
  const hashRate = useHashRate();
  const researchRate = useResearchRate();
  const victories = getVictoryStorage();

  return (
    <div
      data-testid="rb-probe"
      style={{
        position: "fixed",
        left: 0,
        bottom: 0,
        zIndex: 99999,
        pointerEvents: "none",
        fontSize: 9,
        lineHeight: "11px",
        color: "#777",
        background: "rgba(255,255,255,0.55)",
        maxWidth: "42vw",
        whiteSpace: "normal",
      }}
    >
      <Cell id="rb-ticks" value={store.ticks} />
      <Cell id="rb-phase" value={store.phase} />
      <Cell id="rb-luck" value={store.luck} />
      <Cell id="rb-paused" value={store.paused} />
      <Cell id="rb-dogecoin" value={store.dogecoin} />
      <Cell id="rb-usd" value={store.usd} />
      <Cell id="rb-max-dogecoin" value={store.maxDogecoin} />
      <Cell id="rb-max-usd" value={store.maxUsd} />
      <Cell id="rb-small-miners" value={store.smallMiners} />
      <Cell id="rb-medium-miners" value={store.mediumMiners} />
      <Cell id="rb-large-miners" value={store.largeMiners} />
      <Cell id="rb-hash-rate" value={hashRate} />
      <Cell id="rb-research-rate" value={researchRate} />
      <Cell id="rb-real-estate" value={store.realEstate} />
      <Cell id="rb-real-estate-count" value={store.realEstate.length} />
      <Cell id="rb-unlocks" value={store.unlocks} />
      <Cell id="rb-tweet-count" value={store.tweetCount} />
      <Cell id="rb-twitter-followers" value={store.twitterFollowers} />
      <Cell id="rb-tweet-ids-len" value={store.tweetIDs.length} />
      <Cell id="rb-current-mission" value={store.currentMission} />
      <Cell id="rb-current-location" value={store.currentLocation} />
      <Cell id="rb-engineers" value={store.engineers} />
      <Cell id="rb-astronauts" value={store.astronauts} />
      <Cell id="rb-success-chance" value={store.successChance} />
      <Cell id="rb-miner-allocation" value={store.minerAllocation} />
      <Cell id="rb-failures" value={store.failures} />
      <Cell id="rb-casualties" value={store.casualties} />
      <Cell id="rb-doge-per-usd" value={store.dogePerUSD} />
      <Cell id="rb-price-history-len" value={store.priceHistory.length} />
      <Cell id="rb-price-history-last" value={store.priceHistory.length ? store.priceHistory[store.priceHistory.length - 1] : "empty"} />
      <Cell id="rb-victories-len" value={victories.length} />
      <Cell id="rb-env-version" value={typeof window !== "undefined" && window.__rb ? window.__rb.version : "absent"} />
      <Cell id="rb-env-seed" value={typeof window !== "undefined" && window.__rb ? window.__rb.seed : -1} />
      <Cell id="rb-storage-keys" value={typeof window !== "undefined" ? Object.keys(window.localStorage).sort() : []} />
    </div>
  );
};
