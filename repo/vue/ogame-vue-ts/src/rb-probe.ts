/**
 * RepairBench instrumentation probe - neutral observer plus one deterministic boot fixture.
 *
 * WHAT THIS FILE IS ALLOWED TO DO
 *  1. Reset Web Storage and drop service workers / caches at boot, so every page load of every
 *
 *  2. Count - never change, never block - the egress surfaces a browser page has, so "this build
 *     issues zero cross-origin requests" is a measured claim instead of a declared one.
 *  3. Count uncaught errors and unhandled rejections.
 *  4. Install ONE fixed game state (rbBuildFixture) into the live pinia stores before the router
 *     guard runs. The seed's own new-game path derives the planet temperature from Math.random
 *     (src/logic/planetLogic.ts generatePlanetTemperature), so without a fixture no reading on any
 *     production surface would be reproducible across two runs of the same tree.
 *  5. Publish string-returning readers on window.__rb for state that has no DOM surface at all
 *     (queue contents and queue order live in pinia and only reach the DOM behind a popover).
 *
 * WHAT THIS FILE NEVER DOES
 *  It renders nothing, adds no data-testid / id / class / attribute, holds no selector, level,
 *  cost, time or numeric constant belonging to any injected defect, never calls a game-logic
 *  function to compute an answer (every reader below is a plain field read or a count), and never
 *  writes application state after boot.
 */
import { OfficerType } from '@/types/game'
import type { Officer, Planet, Player } from '@/types/game'
import { useGameStore } from '@/stores/gameStore'
import { useNPCStore } from '@/stores/npcStore'
import { useUniverseStore } from '@/stores/universeStore'
import * as gameLogic from '@/logic/gameLogic'
import * as planetLogic from '@/logic/planetLogic'
import * as oreDepositLogic from '@/logic/oreDepositLogic'

declare global {
  interface Window {
    __rb: Record<string, () => string>
  }
}

// ---------------------------------------------------------------------------
// 1. boot hygiene: storage reset + service worker / cache drop
// ---------------------------------------------------------------------------
const rbCounters = {
  egress: 0,
  errors: 0,
  rejections: 0,
  serviceWorkers: 0,
  cachesDropped: 0,
  fixtureInstalls: 0
}
const rbEgressLog: string[] = []

try {
  localStorage.clear()
  sessionStorage.clear()
} catch {
  /* storage disabled - the fixture still installs, persistence simply does not happen */
}

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      rbCounters.serviceWorkers += regs.length
      return Promise.all(regs.map((r) => r.unregister()))
    })
    .catch(() => {})
}
if (typeof caches !== 'undefined') {
  caches
    .keys()
    .then((keys) => {
      rbCounters.cachesDropped += keys.length
      return Promise.all(keys.map((k) => caches.delete(k)))
    })
    .catch(() => {})
}

// ---------------------------------------------------------------------------
// 2. egress counters (observe only, always delegate to the original)
// ---------------------------------------------------------------------------
const isCrossOrigin = (url: unknown): boolean => {
  try {
    const u = new URL(String(url), window.location.href)
    if (u.protocol === 'data:' || u.protocol === 'blob:' || u.protocol === 'about:') return false
    return u.origin !== window.location.origin
  } catch {
    return false
  }
}

const noteEgress = (surface: string, url: unknown): void => {
  if (!isCrossOrigin(url)) return
  rbCounters.egress += 1
  if (rbEgressLog.length < 12) rbEgressLog.push(surface + ':' + String(url).slice(0, 120))
}

const originalFetch = window.fetch ? window.fetch.bind(window) : undefined
if (originalFetch) {
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    noteEgress('fetch', typeof input === 'string' ? input : (input as Request)?.url ?? String(input))
    return originalFetch(input as RequestInfo, init)
  }) as typeof window.fetch
}

const xhrOpen = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: unknown[]) {
  noteEgress('xhr', url)
  return (xhrOpen as unknown as (...a: unknown[]) => void).apply(this, [method, url, ...rest])
} as typeof XMLHttpRequest.prototype.open

if (navigator.sendBeacon) {
  const beacon = navigator.sendBeacon.bind(navigator)
  navigator.sendBeacon = ((url: string | URL, data?: BodyInit | null) => {
    noteEgress('beacon', url)
    return beacon(url, data)
  }) as typeof navigator.sendBeacon
}

const windowOpen = window.open.bind(window)
window.open = ((url?: string | URL, ...rest: unknown[]) => {
  noteEgress('window.open', url)
  return (windowOpen as unknown as (...a: unknown[]) => Window | null)(url, ...rest)
}) as typeof window.open

const wrapCtor = (name: 'EventSource' | 'WebSocket', surface: string): void => {
  const original = window[name] as unknown as new (url: string | URL, ...a: unknown[]) => unknown
  if (typeof original !== 'function') return
  const wrapped = function (url: string | URL, ...args: unknown[]) {
    noteEgress(surface, url)
    return new original(url, ...args)
  } as unknown
  window[name] = wrapped as unknown as typeof EventSource & typeof WebSocket
}
wrapCtor('EventSource', 'eventsource')
wrapCtor('WebSocket', 'websocket')

const wrapSrcSetter = (proto: object, attr: 'src' | 'href', surface: string): void => {
  const descriptor = Object.getOwnPropertyDescriptor(proto, attr)
  if (!descriptor || !descriptor.set || !descriptor.get) return
  const { get, set } = descriptor
  Object.defineProperty(proto, attr, {
    configurable: true,
    enumerable: descriptor.enumerable,
    get() {
      return get.call(this)
    },
    set(value: string) {
      noteEgress(surface, value)
      set.call(this, value)
    }
  })
}
wrapSrcSetter(HTMLScriptElement.prototype, 'src', 'script.src')
wrapSrcSetter(HTMLImageElement.prototype, 'src', 'img.src')
wrapSrcSetter(HTMLIFrameElement.prototype, 'src', 'iframe.src')
wrapSrcSetter(HTMLLinkElement.prototype, 'href', 'link.href')

// ---------------------------------------------------------------------------
// 3. error counters
// ---------------------------------------------------------------------------
window.addEventListener('error', () => {
  rbCounters.errors += 1
})
window.addEventListener('unhandledrejection', () => {
  rbCounters.rejections += 1
})

// ---------------------------------------------------------------------------
// 4. the deterministic boot fixture
// ---------------------------------------------------------------------------
export interface RbFixture {
  now: number
  player: Player
  planet: Planet
  universePlanet: Planet
  currentPlanetId: string
  locale: 'en'
  isDark: 'dark'
  gameSpeed: number
  isPaused: boolean
}

/**
 * One fixed single-planet save. Pure: takes `now`, returns plain data. Built on top of the seed's
 * own initialisers (gameLogic.initializePlayer / planetLogic.createInitialPlanet) so every key the
 * application expects exists, then every field that the seed derives from Math.random or from the
 * wall clock is overwritten with a literal. The ore deposits are re-derived from the fixed position
 * through the seed's own deterministic calculateInitialDeposits path, which leaves all three
 * deposit efficiencies at exactly 1.
 */
export function rbBuildFixture(now: number): RbFixture {
  const player: Player = gameLogic.initializePlayer('player1', 'Commander')
  const planet: Planet = planetLogic.createInitialPlanet('player1', '母星')

  planet.id = 'planet1'
  planet.name = '母星'
  planet.ownerId = 'player1'
  planet.position = { galaxy: 1, system: 1, position: 8 }
  planet.temperature = { min: 0, max: 40 }
  planet.resources = { metal: 125000, crystal: 48000, deuterium: 25000, darkMatter: 300, energy: 0 }
  planet.oreDeposits = oreDepositLogic.generateOreDeposits(planet.position)
  planet.buildings.metalMine = 6
  planet.buildings.crystalMine = 4
  planet.buildings.deuteriumSynthesizer = 3
  planet.buildings.solarPlant = 5
  planet.buildings.roboticsFactory = 2
  planet.buildings.naniteFactory = 1
  planet.buildings.shipyard = 2
  planet.buildings.researchLab = 3
  planet.buildings.metalStorage = 3
  planet.buildings.crystalStorage = 2
  planet.buildings.deuteriumTank = 1
  planet.buildings.darkMatterCollector = 1
  planet.fleet.lightFighter = 5
  planet.fleet.smallCargo = 2
  planet.fleet.espionageProbe = 3
  planet.defense.rocketLauncher = 20
  planet.defense.lightLaser = 5
  planet.defense.smallShieldDome = 1
  planet.buildQueue = []
  planet.waitingBuildQueue = []
  planet.lastUpdate = now
  planet.isMoon = false

  player.planets = [planet]
  player.technologies.energyTechnology = 3
  player.technologies.laserTechnology = 3
  player.technologies.computerTechnology = 2
  player.technologies.espionageTechnology = 1
  player.technologies.combustionDrive = 1
  player.technologies.miningTechnology = 2
  player.researchQueue = []
  player.waitingResearchQueue = []
  player.points = 0
  player.bonusPoints = 0
  player.isGMEnabled = false
  player.lastVersionCheckTime = now
  player.privacyAgreed = true
  const officers = player.officers as Record<string, Officer>
  for (const key of Object.keys(officers)) {
    officers[key] = { type: officers[key].type, active: false }
  }
  officers[OfficerType.DarkMatterSpecialist] = {
    type: OfficerType.DarkMatterSpecialist,
    active: true,
    hiredAt: now - 3600 * 1000,
    expiresAt: now + 3 * 24 * 3600 * 1000
  }

  // One sentinel NPC planet so App.vue's initGame skips generateNPCPlanets(), which would otherwise
  // create 200 Math.random planets (and 200 per-tick NPC simulations) on every single page load.
  const universePlanet: Planet = JSON.parse(JSON.stringify(planet)) as Planet
  universePlanet.id = 'rb_sentinel_planet'
  universePlanet.name = 'RB Sentinel'
  universePlanet.ownerId = 'npc_rb_sentinel'
  universePlanet.position = { galaxy: 1, system: 15, position: 9 }
  universePlanet.resources = { metal: 0, crystal: 0, deuterium: 0, darkMatter: 0, energy: 0 }
  universePlanet.oreDeposits = oreDepositLogic.generateOreDeposits(universePlanet.position)
  universePlanet.lastUpdate = now

  return {
    now,
    player,
    planet,
    universePlanet,
    currentPlanetId: planet.id,
    locale: 'en',
    isDark: 'dark',
    gameSpeed: 1,
    isPaused: false
  }
}

/** Writes the fixture into the live stores. Called from src/main.ts between app.use(pinia) and app.use(router). */
export function rbInstallFixture(): string {
  if (typeof window === 'undefined') return 'no-window'
  const fixture = rbBuildFixture(Date.now())
  const game = useGameStore()
  const npc = useNPCStore()
  const universe = useUniverseStore()

  game.gameTime = fixture.now
  game.isPaused = fixture.isPaused
  game.gameSpeed = fixture.gameSpeed
  game.player = fixture.player
  game.currentPlanetId = fixture.currentPlanetId
  game.locale = fixture.locale
  game.isDark = fixture.isDark
  npc.npcs = []
  npc.lastGrowthCheck = {}
  universe.planets = { '1:15:9': fixture.universePlanet }
  universe.debrisFields = {}
  rbCounters.fixtureInstalls += 1
  return 'installed'
}

// ---------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------
const str = (v: unknown): string => (v === undefined || v === null ? 'none' : String(v))

const queueSignature = (items: Array<{ type: string; itemType: string; targetLevel?: number; quantity?: number; startTime?: number; endTime?: number }>): string => {
  if (!items || items.length === 0) return 'empty'
  return items
    .map((item) => {
      const dur = item.startTime && item.endTime ? Math.round((item.endTime - item.startTime) / 1000) : -1
      const amount = item.targetLevel !== undefined ? 'L' + item.targetLevel : 'x' + str(item.quantity)
      return [item.type, item.itemType, amount, dur + 's'].join(':')
    })
    .join('|')
}

const waitingSignature = (items: Array<{ type: string; itemType: string; targetLevel?: number; quantity?: number; priority?: number }>): string => {
  if (!items || items.length === 0) return 'empty'
  return items
    .map((item) => [item.type, item.itemType, item.targetLevel !== undefined ? 'L' + item.targetLevel : 'x' + str(item.quantity)].join(':'))
    .join('|')
}

const rbReaders: Record<string, () => string> = {
  // --- health / isolation -------------------------------------------------
  probe: () => 'rb-probe-1',
  booted: () => (rbCounters.fixtureInstalls > 0 ? 'true' : 'false'),
  fixtureInstalls: () => str(rbCounters.fixtureInstalls),
  errors: () => str(rbCounters.errors),
  rejections: () => str(rbCounters.rejections),
  egress: () => str(rbCounters.egress),
  egressLog: () => (rbEgressLog.length ? rbEgressLog.join('|') : 'none'),
  serviceWorkers: () => str(rbCounters.serviceWorkers),
  cachesDropped: () => str(rbCounters.cachesDropped),
  lsCount: () => {
    try {
      return str(localStorage.length)
    } catch {
      return 'no-storage'
    }
  },
  lsKeys: () => {
    try {
      return Object.keys(localStorage).sort().join(',')
    } catch {
      return 'no-storage'
    }
  },
  theme: () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
  hash: () => window.location.hash || 'none',

  // --- fixed-fixture state (plain field reads, no logic recomputation) ----
  locale: () => {
    try {
      return str(useGameStore().locale)
    } catch {
      return 'no-store'
    }
  },
  coordinates: () => {
    try {
      const p = useGameStore().currentPlanet
      return p ? `${p.position.galaxy}:${p.position.system}:${p.position.position}` : 'no-planet'
    } catch {
      return 'no-store'
    }
  },
  planetName: () => {
    try {
      return str(useGameStore().currentPlanet?.name)
    } catch {
      return 'no-store'
    }
  },
  points: () => {
    try {
      return str(useGameStore().player.points)
    } catch {
      return 'no-store'
    }
  },
  universePlanets: () => {
    try {
      return str(Object.keys(useUniverseStore().planets).length)
    } catch {
      return 'no-store'
    }
  },

  // --- queues: the state that has no DOM surface outside a popover --------
  buildQueue: () => {
    try {
      return queueSignature(useGameStore().currentPlanet?.buildQueue ?? [])
    } catch {
      return 'no-store'
    }
  },
  buildQueueLen: () => {
    try {
      return str((useGameStore().currentPlanet?.buildQueue ?? []).length)
    } catch {
      return 'no-store'
    }
  },
  researchQueue: () => {
    try {
      return queueSignature(useGameStore().player.researchQueue ?? [])
    } catch {
      return 'no-store'
    }
  },
  researchQueueLen: () => {
    try {
      return str((useGameStore().player.researchQueue ?? []).length)
    } catch {
      return 'no-store'
    }
  },
  waitingBuild: () => {
    try {
      return waitingSignature(useGameStore().currentPlanet?.waitingBuildQueue ?? [])
    } catch {
      return 'no-store'
    }
  },
  waitingBuildLen: () => {
    try {
      return str((useGameStore().currentPlanet?.waitingBuildQueue ?? []).length)
    } catch {
      return 'no-store'
    }
  },
  waitingResearchLen: () => {
    try {
      return str((useGameStore().player.waitingResearchQueue ?? []).length)
    } catch {
      return 'no-store'
    }
  }
}

if (typeof window !== 'undefined') {
  window.__rb = rbReaders
}
