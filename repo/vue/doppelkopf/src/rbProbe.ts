// [repair-bench instrumentation] read-only model exposure hook (single namespace key window.__rbDoko).
//
// Why this file exists: the measured surface of this instance is the game MODEL (src/models/*.ts) plus
// one component-level DOM mapping (src/components/Card.vue). The model modules are ES modules that the
// production bundle never attaches to window, so a black-box verifier served from dist/ has no handle on
// Card / Hand / Trick / Party / Score / RingQueue / Affinities / Notifier and cannot construct the
// situations the 12 defects live in. This module publishes the EXISTING exported bindings, unmodified,
// under one namespaced key.
//
// What it does NOT do: it reads no property of those bindings, writes no property, calls no method,
// adds no listener, installs no wrapper, changes no value, creates no instance and starts no timer.
// It is a single assignment of an object literal of already-exported identifiers, executed once at
// bundle evaluation time. It therefore cannot move any measured reading.
import {
  Card,
  Suit,
  Rank,
  values,
  trumps,
  cardOrder,
  ace,
  ten,
  king,
  queen,
  jack,
  compare,
  byCardValuesDesc,
} from "@/models/card";
import { Hand } from "@/models/hand";
import { Trick } from "@/models/trick";
import { PlayedCard } from "@/models/playedCard";
import { Player } from "@/models/player";
import { Party, PartyName, findParties, getPartyName } from "@/models/party";
import { Score } from "@/models/score";
import { Scorecard } from "@/models/scorecard";
import { TrickStack } from "@/models/trickStack";
import { RingQueue } from "@/models/ringQueue";
import { Notifier, Notification, notifier } from "@/models/notifier";
import { playableCards } from "@/models/playableCardFinder";
import { Affinities, AffinityEvent } from "@/models/affinities";
import { extras } from "@/models/extras";
import { Deck, allCards } from "@/models/deck";
import { generateNames, sample, sampleSize, shuffle, chance } from "@/models/random";
import { Round, RoundState } from "@/models/round";
import { Game } from "@/models/game";
import { Features } from "@/models/features";
import { Config } from "@/models/config";
import { TablePosition } from "@/models/tablePosition";
import { Reservation } from "@/models/reservations";
import { Announcement } from "@/models/announcements";
import { Memory, PerfectMemory } from "@/models/memory";
import { Behavior, RuleBasedBehaviour } from "@/models/behaviors";

declare global {
  interface Window {
    __rbDoko?: Record<string, unknown>;
    __rbGame?: unknown;
  }
}

// Annotated on purpose: src/models/features.ts declares the Features interface locally (it is NOT
// exported) while exporting the Features constant, so an inferred type here would make vue-tsc's
// declaration emit fail with TS4023 (Exported variable 'api' ... cannot be named). The annotation is
// type-only: it changes nothing at runtime and nothing about what gets published.
const api: Record<string, unknown> = {
  Card,
  Suit,
  Rank,
  values,
  trumps,
  cardOrder,
  ace,
  ten,
  king,
  queen,
  jack,
  compare,
  byCardValuesDesc,
  Hand,
  Trick,
  PlayedCard,
  Player,
  Party,
  PartyName,
  findParties,
  getPartyName,
  Score,
  Scorecard,
  TrickStack,
  RingQueue,
  Notifier,
  Notification,
  notifier,
  playableCards,
  Affinities,
  AffinityEvent,
  extras,
  Deck,
  allCards,
  generateNames,
  sample,
  sampleSize,
  shuffle,
  chance,
  Round,
  RoundState,
  Game,
  Features,
  Config,
  TablePosition,
  Reservation,
  Announcement,
  Memory,
  PerfectMemory,
  Behavior,
  RuleBasedBehaviour,
};

window.__rbDoko = api;

export default api;
