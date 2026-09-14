// RepairBench INSTRUMENTATION probe for hlviewer.js (delivered as
//
//
// WHAT THIS FILE IS: an observation and event-dispatch bridge for the frozen checker
// (tests/dsl.json). It contains NO application logic and NO fix: every reader below returns a
// value that the seed itself owns (a DOM node's text, a class list, a style the seed's own Solid
// components wrote, a field of the seed's own Game/ReplayPlayer/SoundSystem, or the seed's own
// formatTime()), and every action dispatches a REAL DOM event on a REAL element so the seed's own
// listeners run. If a defect breaks a behaviour, the corresponding reader below shows it - the
// probe never papers over it, never recomputes a value the seed should have produced, and never
// catches an error silently (errors are counted and their messages recorded).
//
// WHY IT HOOKS HLViewer.init: the seed's public entry (src/index.ts) returns an HLV instance whose
// `game` field is TS-private, and the demo entry page may not carry instrumentation glue (ruling
// G5(2): the entry page imports build products only, 0 lines of tested logic). So the probe wraps
// init once, at module-evaluation time, to capture the instance the seed itself created.
import { formatTime } from './Time'
import { PlayerMode } from './Game'

type Any = any

const w = window as Any

const state: {
  viewer: Any
  game: Any
  initCalls: number
  marks: { [name: string]: number }
  errors: string[]
  consoleErrors: number
  baselineGlobals: Set<string>
  counters: { [name: string]: number }
  rafTicks: number
} = {
  viewer: null,
  game: null,
  initCalls: 0,
  marks: {},
  errors: [],
  consoleErrors: 0,
  baselineGlobals: new Set(Object.keys(window)),
  counters: {},
  rafTicks: 0
}

// The seed's own emitters, subscribed read-only. A counter that fails to advance is exactly the
// evidence an un-wired or un-emitted event leaves behind; subscribing has no other side effect
// (nanoevents `on` only appends a listener).
const GAME_EVENTS = ['loadstart', 'load', 'prereplaychange', 'postreplaychange', 'modechange', 'titlechange', 'preupdate', 'postupdate']
const PLAYER_EVENTS = ['play', 'pause', 'stop', 'seek']
const bump = (name: string): void => {
  state.counters[name] = (state.counters[name] || 0) + 1
}

// ---------------------------------------------------------------- selectors (the seed's own class names)
const SEL = {
  app: '.hlv-app',
  title: '.hlv-title',
  screen: '.hlv-screen',
  controls: '.hlv-controls',
  loading: '.hlv-loading',
  loadingLog: '.hlv-loading-log',
  loadingItem: '.hlv-loading-log-item',
  loadingSpinner: '.hlv-loading-spinner',
  time: '.hlv-time',
  timeline: '.hlv-timeline',
  timelineKnob: '.hlv-timeline-knob',
  timelineLine: '.hlv-timeline-line',
  timelineGhostLine: '.hlv-timeline-ghostline',
  timelineGhostTime: '.hlv-timeline-ghosttime',
  volume: '.hlv-volume',
  volumeKnob: '.hlv-volume-knob',
  volumeLine: '.hlv-volume-line',
  target: '#hlv-target'
}

const q = (sel: string): HTMLElement | null => document.querySelector(sel) as HTMLElement | null
const qa = (sel: string): HTMLElement[] => Array.prototype.slice.call(document.querySelectorAll(sel)) as HTMLElement[]
const exists = (sel: string): boolean => !!q(sel)
const txt = (sel: string): string | null => {
  const e = q(sel)
  return e ? (e.textContent || '').trim() : null
}
const cls = (sel: string): string | null => {
  const e = q(sel)
  return e ? e.getAttribute('class') : null
}
const hasClass = (sel: string, name: string): boolean => {
  const e = q(sel)
  return e ? e.classList.contains(name) : false
}
const styleProp = (sel: string, prop: string): string | null => {
  const e = q(sel)
  return e ? e.style.getPropertyValue(prop) : null
}
// The seed writes derived percentages straight into inline styles (Timeline knobOffset/lineOffset,
// VolumeControl knobOffset/lineOffset, the ghost time's left), so the CSSOM hands back a serialized
// <percentage>. dsl_runner's assertEq is strict equality with no tolerance op, and these values are
// ratios of two floats (currentTime / replay.length, 1 - (right - pageX) / width), so a raw string
// compare would put the checkpoint one ULP away from failing. These readers return the same number
// the seed computed, rounded to 3 decimals - still the seed's own value, still exactly the channel a
// defect moves (a dropped divisor or an inverted axis changes it by orders of magnitude, not by an
// ULP), but no longer sensitive to float serialization.
const pctOf = (sel: string, prop: string): number | null => {
  const v = styleProp(sel, prop)
  if (v === null) {
    return null
  }
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? Number(n.toFixed(3)) : null
}
const rectOf = (sel: string): { left: number; right: number; top: number; bottom: number; width: number; height: number } | null => {
  const e = q(sel)
  if (!e) {
    return null
  }
  const r = e.getBoundingClientRect()
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
}
const finite = (v: Any): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const round = (v: Any, p: number): number | null => {
  const n = finite(v)
  return n === null ? null : Number(n.toFixed(p))
}
const g = (): Any => state.game
const player = (): Any => (state.game ? state.game.player : null)
const sound = (): Any => (state.game ? state.game.soundSystem : null)

// ---------------------------------------------------------------- real DOM events (never a direct state write)
const mouse = (type: string, init: Any): MouseEvent => new MouseEvent(type, Object.assign({ bubbles: true, cancelable: true, view: window, button: 0 }, init))
const key = (type: string, code: string): KeyboardEvent => new KeyboardEvent(type, { bubbles: true, cancelable: true, view: window, code, key: code })

const pageXAt = (sel: string, fraction: number): number => {
  const r = rectOf(sel)
  if (!r) {
    return 0
  }
  return r.left + window.scrollX + r.width * fraction
}
const pageYAt = (sel: string, fraction: number): number => {
  const r = rectOf(sel)
  if (!r) {
    return 0
  }
  return r.top + window.scrollY + r.height * fraction
}

// ---------------------------------------------------------------- the bridge
const bridge = {
  // --- attachment / boot ---
  attach: (viewer: Any): boolean => {
    state.viewer = viewer || null
    state.game = viewer && viewer.game ? viewer.game : null
    const gg = state.game
    if (!gg) {
      return false
    }
    for (const name of GAME_EVENTS) {
      if (gg.events && typeof gg.events.on === 'function') {
        gg.events.on(name, () => bump('game:' + name))
      }
    }
    if (gg.player && gg.player.events && typeof gg.player.events.on === 'function') {
      for (const name of PLAYER_EVENTS) {
        gg.player.events.on(name, () => bump('player:' + name))
      }
    }
    if (gg.soundSystem && gg.soundSystem.events && typeof gg.soundSystem.events.on === 'function') {
      gg.soundSystem.events.on('volumeChange', () => bump('sound:volumeChange'))
    }
    if (gg.loader && gg.loader.events && typeof gg.loader.events.on === 'function') {
      gg.loader.events.on('progress', () => bump('loader:progress'))
    }
    return true
  },
  eventCount: (name: string): number => state.counters[name] || 0,
  eventCounterNames: (): string[] => Object.keys(state.counters).sort(),
  resetEventCounters: (): boolean => {
    state.counters = {}
    return true
  },
  rafTickCount: (): number => state.rafTicks,
  markRaf: (name: string): number => {
    state.marks['raf:' + name] = state.rafTicks
    return state.rafTicks
  },
  rafAdvancedSinceMark: (name: string): boolean | null => {
    const k = 'raf:' + name
    return k in state.marks ? state.rafTicks > state.marks[k] : null
  },
  visibilityState: (): string => String(document.visibilityState),
  documentHidden: (): boolean => !!document.hidden,
  fullscreenElementPresent: (): boolean => !!document.fullscreenElement,
  initCallCount: (): number => state.initCalls,
  viewerAttached: (): boolean => state.viewer !== null,
  gameAttached: (): boolean => state.game !== null,
  computedStyle: (sel: string, prop: string): string | null => {
    const e = q(sel)
    return e ? window.getComputedStyle(e).getPropertyValue(prop) : null
  },

  // --- DOM face ---
  appExists: (): boolean => exists(SEL.app),
  appClass: (): string | null => cls(SEL.app),
  appIsVisible: (): boolean => hasClass(SEL.app, 'visible'),
  appModeFree: (): boolean => hasClass(SEL.app, 'mode-free'),
  appModeReplay: (): boolean => hasClass(SEL.app, 'mode-replay'),
  titleText: (): string | null => txt(SEL.title),
  screenExists: (): boolean => exists(SEL.screen),
  canvasInAppCount: (): number => qa(SEL.app + ' canvas').length,
  canvasWidth: (): number | null => {
    const c = document.querySelector(SEL.app + ' canvas') as HTMLCanvasElement | null
    return c ? c.width : null
  },
  canvasHeight: (): number | null => {
    const c = document.querySelector(SEL.app + ' canvas') as HTMLCanvasElement | null
    return c ? c.height : null
  },
  canvasDrawingBufferWidth: (): number | null => {
    const c = document.querySelector(SEL.app + ' canvas') as HTMLCanvasElement | null
    if (!c) {
      return null
    }
    const gl = c.getContext('webgl')
    return gl ? gl.drawingBufferWidth : null
  },
  controlsExists: (): boolean => exists(SEL.controls),
  loadingExists: (): boolean => exists(SEL.loading),
  loadingVisible: (): boolean => hasClass(SEL.loading, 'visible'),
  loadingItemCount: (): number => qa(SEL.loadingItem).length,
  loadingLogText: (): string | null => txt(SEL.loadingLog),
  loadingLogLines: (): string[] => qa(SEL.loadingItem).map((e) => (e.textContent || '').trim()),
  spinnerExists: (): boolean => exists(SEL.loadingSpinner),
  timeText: (): string | null => txt(SEL.time),
  timelineExists: (): boolean => exists(SEL.timeline),
  timelineKnobLeft: (): string | null => styleProp(SEL.timelineKnob, 'left'),
  timelineKnobLeftPct: (): number | null => pctOf(SEL.timelineKnob, 'left'),
  timelineLineRight: (): string | null => styleProp(SEL.timelineLine, 'right'),
  timelineLineRightPct: (): number | null => pctOf(SEL.timelineLine, 'right'),
  timelineGhostTimeText: (): string | null => txt(SEL.timelineGhostTime),
  timelineGhostTimeLeft: (): string | null => styleProp(SEL.timelineGhostTime, 'left'),
  timelineGhostTimeLeftPct: (): number | null => pctOf(SEL.timelineGhostTime, 'left'),
  volumeExists: (): boolean => exists(SEL.volume),
  volumeKnobLeft: (): string | null => styleProp(SEL.volumeKnob, 'left'),
  volumeKnobLeftPct: (): number | null => pctOf(SEL.volumeKnob, 'left'),
  volumeLineRight: (): string | null => styleProp(SEL.volumeLine, 'right'),
  volumeLineRightPct: (): number | null => pctOf(SEL.volumeLine, 'right'),
  buttonCountInControls: (): number => qa(SEL.controls + ' button').length,
  buttonTitles: (): string[] => qa(SEL.controls + ' button').map((e) => e.getAttribute('title') || e.getAttribute('aria-label') || (e.textContent || '').trim()),

  // --- seed state (read through the seed's own objects) ---
  mode: (): number | null => {
    const gg = g()
    return gg ? finite(gg.mode) : null
  },
  modeName: (): string | null => {
    const gg = g()
    if (!gg) {
      return null
    }
    return gg.mode === PlayerMode.REPLAY ? 'REPLAY' : gg.mode === PlayerMode.FREE ? 'FREE' : 'OTHER'
  },
  modeIsReplayEnumValue: (): boolean => PlayerMode.REPLAY === 1,
  mapName: (): string | null => {
    const gg = g()
    return gg ? String(gg.mapName) : null
  },
  mapNameLower: (): string | null => {
    const gg = g()
    return gg ? String(gg.mapName).toLowerCase() : null
  },
  entityCount: (): number | null => {
    const gg = g()
    return gg && Array.isArray(gg.entities) ? gg.entities.length : null
  },
  soundCount: (): number | null => {
    const gg = g()
    return gg && Array.isArray(gg.sounds) ? gg.sounds.length : null
  },
  replayLength: (): number | null => {
    const p = player()
    return p && p.replay ? round(p.replay.length, 3) : null
  },
  replayMapCount: (): number | null => {
    const p = player()
    return p && p.replay && Array.isArray(p.replay.maps) ? p.replay.maps.length : null
  },
  replayChunkCount: (): number | null => {
    const p = player()
    if (!p || !p.replay || !Array.isArray(p.replay.maps) || !p.replay.maps[0]) {
      return null
    }
    return Array.isArray(p.replay.maps[0].chunks) ? p.replay.maps[0].chunks.length : null
  },
  // --- chunk table + seek-safety sweep (leg HLV2 calibration channels) ---
  // WHY THESE EXIST: the seed's ReplayChunk.timeLength is left at its constructor default 10 for
  // every periodic split (src/Replay/Replay.ts:683-695 sets the data and creates the next chunk but
  // never assigns timeLength), while the chunk's data actually spans [startTime, nextStartTime).
  // ReplayPlayer.seek() (src/ReplayPlayer.ts:91-129) therefore accepts any t in
  // [startTime, startTime+10) and then reads frames until frame.time > t; when t is at or past the
  // last frame stored in that chunk the reader runs off the end of the DataView and throws
  // RangeError. That is a PRE-EXISTING seed bug (0 bytes of it are mine), so the frozen checker must
  // only assert on seek targets that are measured crash-free. These two readers expose the table and
  // the crash map; they change nothing (seekSafe calls the seed's own seek and only reports).
  chunkTable: (): Any => {
    const p = player()
    if (!p || !p.replay || !Array.isArray(p.replay.maps) || !p.replay.maps[0] || !Array.isArray(p.replay.maps[0].chunks)) {
      return null
    }
    const chunks = p.replay.maps[0].chunks
    const out: Any[] = []
    for (let i = 0; i < chunks.length; ++i) {
      const c = chunks[i]
      out.push({
        i,
        startTime: round(c.startTime, 3),
        timeLength: round(c.timeLength, 3),
        timeLimit: round(c.startTime + c.timeLength, 3),
        dataLen: c.data && typeof c.data.length === 'number' ? c.data.length : null,
        hasReader: c.reader ? true : false
      })
    }
    return { replayLength: round(p.replay.length, 3), mapCount: p.replay.maps.length, chunkCount: chunks.length, chunks: out }
  },
  seekSafe: (t: number): Any => {
    const p = player()
    if (!p) {
      return { t, ok: false, err: 'NO_PLAYER' }
    }
    const at = (): Any => ({ currentTime: round(p.currentTime, 3), seekEvents: bridge.eventCount('player:seek'), chunk: finite(p.currentChunk), map: finite(p.currentMap) })
    const before = at()
    try {
      p.seek(t)
      return { t, ok: true, err: null, before, after: at() }
    } catch (e) {
      const msg = e instanceof Error ? e.name + ': ' + e.message : String(e)
      return { t, ok: false, err: msg.slice(0, 200), before, after: at() }
    }
  },
  seekSweep: (times: number[]): Any => {
    const out: Any[] = []
    for (const t of times) {
      out.push(bridge.seekSafe(t))
    }
    const crash = out.filter((r) => !r.ok)
    // A seek can also SUCCEED and still do nothing: ReplayPlayer.seek() only acts when some chunk
    // satisfies t >= startTime && t < startTime + timeLength, and because the periodic split never
    // assigns timeLength (it stays at the constructor default 10) the accepted window is shorter
    // than the data, leaving gaps that no chunk claims. seekEvents is the reliable discriminator:
    // events.emit("seek", t) only runs after the frame loop completed.
    const noOp = out.filter((r) => r.ok && r.before.seekEvents === r.after.seekEvents)
    const good = out.filter((r) => r.ok && r.before.seekEvents !== r.after.seekEvents)
    // compact: only the failure records are returned verbatim; the good ones collapse to their times
    return {
      probed: out.length,
      goodCount: good.length,
      goodTimes: good.map((r) => r.t),
      crashCount: crash.length,
      crashTimes: crash.map((r) => r.t),
      crashRecords: crash.slice(0, 40),
      noOpCount: noOp.length,
      noOpTimes: noOp.map((r) => r.t),
      firstRecord: out.length ? out[0] : null,
      lastRecord: out.length ? out[out.length - 1] : null
    }
  },
  currentTime: (): number | null => {
    const p = player()
    return p ? round(p.currentTime, 3) : null
  },
  currentTimeExact: (): number | null => {
    const p = player()
    return p ? finite(p.currentTime) : null
  },
  currentTick: (): number | null => {
    const p = player()
    return p ? finite(p.currentTick) : null
  },
  currentMapIndex: (): number | null => {
    const p = player()
    return p ? finite(p.currentMap) : null
  },
  currentChunkIndex: (): number | null => {
    const p = player()
    return p ? finite(p.currentChunk) : null
  },
  isPlaying: (): boolean | null => {
    const p = player()
    return p ? !!p.isPlaying : null
  },
  isPaused: (): boolean | null => {
    const p = player()
    return p ? !!p.isPaused : null
  },
  speed: (): number | null => {
    const p = player()
    return p ? finite(p.speed) : null
  },
  volume: (): number | null => {
    const s = sound()
    return s ? round(s.getVolume(), 6) : null
  },
  preMuteVolume: (): number | null => {
    const s = sound()
    return s ? round(s.preMuteVolume, 6) : null
  },
  channelCount: (): number | null => {
    const s = sound()
    return s && Array.isArray(s.channels) ? s.channels.length : null
  },
  localStorageVolume: (): string | null => {
    const v = localStorage.getItem('volume')
    return v === null ? null : String(v)
  },
  localStorageKeyCount: (): number => localStorage.length,
  localStorageKeys: (): string[] => {
    const out: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k !== null) {
        out.push(k)
      }
    }
    return out.sort()
  },
  cameraPos: (): number[] | null => {
    const gg = g()
    if (!gg || !gg.camera || !gg.camera.position) {
      return null
    }
    return [round(gg.camera.position[0], 2), round(gg.camera.position[1], 2), round(gg.camera.position[2], 2)] as number[]
  },
  cameraAspect: (): number | null => {
    const gg = g()
    return gg && gg.camera ? round(gg.camera.aspect, 4) : null
  },
  isPausedGameFlag: (): boolean | null => {
    const gg = g()
    return gg ? !!gg.isPaused : null
  },
  pointerLockedFlag: (): boolean | null => {
    const gg = g()
    return gg ? !!gg.pointerLocked : null
  },
  titleField: (): string | null => {
    const gg = g()
    return gg ? String(gg.title) : null
  },
  viewerGetTitle: (): string | null => (state.viewer ? String(state.viewer.getTitle()) : null),

  // --- the seed's own pure formatter, exposed so a defect in it is directly visible ---
  formatTime: (seconds: number): string => formatTime(seconds),

  // --- marks: turn a time-dependent quantity into an exact boolean ---
  mark: (name: string): number => {
    const p = player()
    const v = p ? Number(p.currentTime) : 0
    state.marks[name] = v
    return round(v, 3) as number
  },
  advancedSinceMark: (name: string): boolean | null => {
    const p = player()
    if (!p || !(name in state.marks)) {
      return null
    }
    return Number(p.currentTime) > state.marks[name]
  },
  deltaSinceMark: (name: string): number | null => {
    const p = player()
    if (!p || !(name in state.marks)) {
      return null
    }
    return round(Number(p.currentTime) - state.marks[name], 3)
  },

  // --- actions: real events on real elements ---
  clickTarget: (): boolean => {
    const e = q(SEL.target)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('click', {}))
    return true
  },
  clickScreen: (): boolean => {
    const e = q(SEL.screen)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('click', {}))
    return true
  },
  dblClickScreen: (): boolean => {
    const e = q(SEL.screen)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('dblclick', {}))
    return true
  },
  pressKeyCode: (code: string): boolean => {
    window.dispatchEvent(key('keydown', code))
    window.dispatchEvent(key('keyup', code))
    return true
  },
  keyDownCode: (code: string): boolean => {
    window.dispatchEvent(key('keydown', code))
    return true
  },
  mouseEnterTarget: (): boolean => {
    const e = q(SEL.target)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('mouseover', {}))
    return true
  },
  mouseMoveTarget: (): boolean => {
    const e = q(SEL.target)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('mousemove', {}))
    return true
  },
  mouseLeaveTarget: (): boolean => {
    const e = q(SEL.target)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('mouseout', {}))
    return true
  },
  contextMenuTarget: (): boolean => {
    const e = q(SEL.target)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('contextmenu', {}))
    return true
  },
  timelineDownAt: (fraction: number): boolean => {
    const e = q(SEL.timeline)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('mousedown', { pageX: pageXAt(SEL.timeline, fraction), pageY: pageYAt(SEL.timeline, 0.5), clientX: pageXAt(SEL.timeline, fraction) }))
    return true
  },
  timelineMoveAt: (fraction: number): boolean => {
    const e = q(SEL.timeline)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('mousemove', { pageX: pageXAt(SEL.timeline, fraction), pageY: pageYAt(SEL.timeline, 0.5), clientX: pageXAt(SEL.timeline, fraction) }))
    return true
  },
  timelineEnter: (): boolean => {
    const e = q(SEL.timeline)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('mouseenter', { pageX: pageXAt(SEL.timeline, 0.5), pageY: pageYAt(SEL.timeline, 0.5) }))
    e.dispatchEvent(mouse('mouseover', { pageX: pageXAt(SEL.timeline, 0.5), pageY: pageYAt(SEL.timeline, 0.5) }))
    return true
  },
  timelineLeave: (): boolean => {
    const e = q(SEL.timeline)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('mouseleave', {}))
    e.dispatchEvent(mouse('mouseout', {}))
    return true
  },
  windowMouseUp: (): boolean => {
    window.dispatchEvent(mouse('mouseup', {}))
    return true
  },
  // The seed's buttons carry no id/testid, only an inner SVG <title>; locating one by that text
  // and dispatching a real click keeps the seed's own onClick wiring in the path under test.
  clickButtonByTitle: (title: string): boolean => {
    const btns = qa(SEL.controls + ' button')
    for (const b of btns) {
      if ((b.textContent || '').trim() === title) {
        b.dispatchEvent(mouse('click', {}))
        return true
      }
    }
    return false
  },
  buttonTitleList: (): string[] => qa(SEL.controls + ' button').map((b) => (b.textContent || '').trim()),

  // --- explicit API-level actions (the seed's OWN methods; used to localise a defect: if the
  // --- ui* path is red while the api* path is green, the break is in the event wiring) ---
  apiPlay: (): boolean => {
    const p = player()
    if (!p) {
      return false
    }
    p.play()
    return true
  },
  apiPause: (): boolean => {
    const p = player()
    if (!p) {
      return false
    }
    p.pause()
    return true
  },
  apiStop: (): boolean => {
    const p = player()
    if (!p) {
      return false
    }
    p.stop()
    return true
  },
  apiSeekTo: (t: number): boolean => {
    const p = player()
    if (!p) {
      return false
    }
    p.seek(t)
    return true
  },
  apiSeekPct: (pct: number): boolean => {
    const p = player()
    if (!p) {
      return false
    }
    p.seekByPercent(pct)
    return true
  },
  apiSpeedUp: (): boolean => {
    const p = player()
    if (!p) {
      return false
    }
    p.speedUp()
    return true
  },
  apiSpeedDown: (): boolean => {
    const p = player()
    if (!p) {
      return false
    }
    p.speedDown()
    return true
  },
  apiSetVolume: (v: number): boolean => {
    const snd = sound()
    if (!snd) {
      return false
    }
    snd.setVolume(v)
    return true
  },
  apiToggleMute: (): boolean => {
    const snd = sound()
    if (!snd) {
      return false
    }
    snd.toggleMute()
    return true
  },
  apiSetTitle: (t: string): boolean => {
    if (!state.viewer) {
      return false
    }
    state.viewer.setTitle(t)
    return true
  },
  apiGetTitle: (): string | null => (state.viewer ? String(state.viewer.getTitle()) : null),
  apiChangeMode: (m: number): boolean => {
    const gg = g()
    if (!gg) {
      return false
    }
    gg.changeMode(m)
    return true
  },
  playerModeEnum: (): { free: number; replay: number } => ({ free: PlayerMode.FREE, replay: PlayerMode.REPLAY }),

  volumeDownAt: (fraction: number): boolean => {
    const e = q(SEL.volume)
    if (!e) {
      return false
    }
    e.dispatchEvent(mouse('mousedown', { pageX: pageXAt(SEL.volume, fraction), pageY: pageYAt(SEL.volume, 0.5), clientX: pageXAt(SEL.volume, fraction) }))
    return true
  },

  // --- health / isolation / network ---
  errorCount: (): number => state.errors.length,
  errorMessages: (): string[] => state.errors.slice(0, 6),
  consoleErrorCount: (): number => state.consoleErrors,
  foreignResourceEntryCount: (): number => {
    const here = window.location.origin
    return bridge.resourceEntryNames().filter((n) => n.indexOf(here) !== 0).length
  },
  foreignResourceEntryNames: (): string => bridge.resourceEntryNames().filter((n) => n.indexOf(window.location.origin) !== 0).join(','),
  resourceEntryNames: (): string[] => {
    const es = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    return es.map((e) => e.name).sort()
  },
  resourceEntryCount: (): number => (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).length,
  extraGlobalCount: (): number => bridge.extraGlobalNames().length,
  extraGlobalNames: (): string[] => Object.keys(window).filter((k) => !state.baselineGlobals.has(k)).sort()
}

export function installRbProbe(): void {
  w.__HLV__ = bridge

  // Observation-only rAF counter: the seed drives its whole frame loop (Game.draw -> update ->
  // 'postupdate' -> the Timeline's progress signal) from requestAnimationFrame, so whether rAF
  // fires at all in the checker's headless page decides which channels are assertable. Counting
  // ticks changes nothing about the seed's own loop.
  const tick = (): void => {
    state.rafTicks++
    window.requestAnimationFrame(tick)
  }
  window.requestAnimationFrame(tick)

  window.addEventListener('error', (ev: ErrorEvent) => {
    state.errors.push(String(ev.message || 'error'))
  })
  window.addEventListener('unhandledrejection', (ev: Any) => {
    state.errors.push('unhandledrejection: ' + String((ev && ev.reason && ev.reason.message) || (ev && ev.reason) || 'unknown'))
  })
  const origError = console.error.bind(console)
  console.error = (...args: Any[]) => {
    state.consoleErrors++
    if (state.errors.length < 12) {
      state.errors.push('console.error: ' + args.map((a) => String(a)).join(' ').slice(0, 200))
    }
    origError(...args)
  }

  const ns = w.HLViewer
  if (!ns || typeof ns.init !== 'function' || ns.__rbWrapped) {
    return
  }
  const origInit = ns.init
  ns.init = function (rootSelector: string, params: Any) {
    state.initCalls++
    const viewer = origInit.call(ns, rootSelector, params)
    bridge.attach(viewer)
    return viewer
  }
  ns.__rbWrapped = true
}
