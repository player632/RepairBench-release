/**
 * rb-probe.ts - RepairBench observation bridge.
 *
 * Added by environment/instrumentation.patch. It is an OBSERVER only: it imports
 * the redux store the application already created, subscribes to it so that
 * one-shot facts (the muzzle offset of the first bullet of a given heading, the
 * level mix of the first bot queue, the helmet budget a spawned tank was given)
 * are frozen into scalars at the instant they happen, and publishes pure readers
 * on window.__RB__ plus a handful of clearly named input helpers that the
 * verifier's setup phase uses to drive the same DOM events a user would produce.
 *
 * Two rules this file obeys:
 *   1. every reader is total - it returns a sentinel ('', -1, false) instead of
 *      throwing, so a missing element can never be mistaken for a crash;
 *   2. nothing here writes to the store, to the DOM tree structure, to storage
 *      or to the URL. The only mutations are the data-testid markers stamp()
 *      puts on nodes that already exist and the latch object it owns.
 *
 * The pixel font in components/Text.tsx draws every glyph as a <path> or <g>
 * carrying class "character-<name>", so on-screen copy is recoverable from the
 * DOM without reading a single pixel; textOf()/textsOf() do exactly that.
 */
import store from './utils/store'
import history from './utils/history'

const W = window as any

// ---------------------------------------------------------------------------
// small total helpers
// ---------------------------------------------------------------------------
function num(v: any, dflt: number): number {
  const n = typeof v === 'boolean' ? (v ? 1 : 0) : Number(v)
  return isFinite(n) ? n : dflt
}
function str(v: any): string {
  return v === null || v === undefined ? '' : String(v)
}
function safe<T>(fn: () => T, dflt: T): T {
  try {
    const v = fn()
    return v === undefined ? dflt : v
  } catch (e) {
    lastErr = str((e as any) && (e as any).message ? (e as any).message : e).slice(0, 160)
    return dflt
  }
}
let lastErr = ''

function S(): any {
  return (store as any).getState()
}

// ---------------------------------------------------------------------------
// latch: frozen scalars + event high/low water marks
// ---------------------------------------------------------------------------
const latch: { [k: string]: any } = {}
function remember(key: string, value: any): boolean {
  latch[key] = value
  return true
}
function recall(key: string): any {
  return latch[key] === undefined ? null : latch[key]
}

const ev = {
  bulletSpawns: 0,
  upBullet: null as any,
  downBullet: null as any,
  leftBullet: null as any,
  rightBullet: null as any,
  maxPlayerBullets: 0,
  brickTruePrev: -1,
  brickRemovedTotal: 0,
  brickRemoveEvents: 0,
  steelTruePrev: -1,
  steelRemovedTotal: 0,
  mapLoadBricks: -1,
  mapLoadSteels: -1,
  mapLoadRivers: -1,
  mapLoadSnows: -1,
  mapLoadForests: -1,
  mapLoadEagleX: -1,
  mapLoadEagleY: -1,
  firstPlayerTankId: -1,
  helmetFirstPos: -1,
  helmetLastPos: -1,
  helmetUptime: -1,
  firstRemainingBots: '',
  firstRemainingBotCount: -1,
  firstRemainingBotLevels: '',
  stageStarts: 0,
  mapLoads: 0,
  eagleWasNull: true,
  showHudEver: false,
  pausedEver: false,
  curtainMaxT: -1,
  curtainUpdates: 0,
  curtainPrevT: null as any,
  playerSpawns: 0,
  firstPlayerSpawn: null as any,
  tankIdsSeen: {} as { [k: string]: boolean },
  botDeaths: 0,
  hits: 0,
  powerUpPicks: 0,
  subscribeError: '',
}

function levelMix(list: any): string {
  if (!list || typeof list.count !== 'function') return ''
  const m: { [k: string]: number } = {}
  const order = ['basic', 'fast', 'power', 'armor']
  list.forEach((lv: string) => {
    m[lv] = (m[lv] || 0) + 1
  })
  return order
    .filter(k => m[k])
    .map(k => k + ':' + m[k])
    .join(',')
}

function onChange(): void {
  try {
    const s = S()
    const bullets = s.bullets
    // --- bullets: latch the spawn facts of the first bullet of each heading ---
    if (bullets && typeof bullets.forEach === 'function') {
      let playerBullets = 0
      bullets.forEach((b: any) => {
        if (b.side === 'player') playerBullets++
        const idk = 'b' + b.bulletId
        if (!ev.tankIdsSeen[idk]) {
          ev.tankIdsSeen[idk] = true
          ev.bulletSpawns++
          const owner = s.tanks ? s.tanks.get(b.tankId) : null
          const rec = {
            dir: str(b.direction),
            ox: num(b.x, -1) - (owner ? num(owner.x, 0) : 0),
            oy: num(b.y, -1) - (owner ? num(owner.y, 0) : 0),
            speedMilli: Math.round(num(b.speed, -1) * 1000),
            power: num(b.power, -1),
            side: str(b.side),
            tankId: num(b.tankId, -1),
          }
          if (b.side === 'player') {
            if (rec.dir === 'up' && ev.upBullet === null) ev.upBullet = rec
            else if (rec.dir === 'down' && ev.downBullet === null) ev.downBullet = rec
            else if (rec.dir === 'left' && ev.leftBullet === null) ev.leftBullet = rec
            else if (rec.dir === 'right' && ev.rightBullet === null) ev.rightBullet = rec
          }
        }
      })
      if (playerBullets > ev.maxPlayerBullets) ev.maxPlayerBullets = playerBullets
    }
    // --- map: brick / steel removal totals ---
    const map = s.map
    if (map && map.bricks && typeof map.bricks.count === 'function') {
      const bt = map.bricks.filter((v: any) => v === true).count()
      if (ev.brickTruePrev >= 0 && bt < ev.brickTruePrev) {
        ev.brickRemoveEvents++
        ev.brickRemovedTotal += ev.brickTruePrev - bt
      }
      ev.brickTruePrev = bt
      const st = map.steels.filter((v: any) => v === true).count()
      if (ev.steelTruePrev >= 0 && st < ev.steelTruePrev) ev.steelRemovedTotal += ev.steelTruePrev - st
      ev.steelTruePrev = st
      if (ev.eagleWasNull && map.eagle != null) {
        ev.eagleWasNull = false
        ev.mapLoads++
        if (ev.mapLoads === 1) {
          // frozen here so that a checkpoint never has to guess WHEN the map
          // appeared: the composition is read at the first store observation
          // that carries an eagle, i.e. before any bot can fire at a brick.
          ev.mapLoadBricks = num(map.bricks.filter((v: any) => v === true).count(), -1)
          ev.mapLoadSteels = num(map.steels.filter((v: any) => v === true).count(), -1)
          ev.mapLoadRivers = num(map.rivers.filter((v: any) => v === true).count(), -1)
          ev.mapLoadSnows = num(map.snows.filter((v: any) => v === true).count(), -1)
          ev.mapLoadForests = num(map.forests.filter((v: any) => v === true).count(), -1)
          ev.mapLoadEagleX = num(map.eagle.x, -1)
          ev.mapLoadEagleY = num(map.eagle.y, -1)
        }
      }
      if (map.eagle == null) ev.eagleWasNull = true
    }
    // --- game record ---
    const g = s.game
    if (g) {
      if (g.showHUD === true) ev.showHudEver = true
      if (g.paused === true) ev.pausedEver = true
      const ct = num(g.stageEnterCurtainT, -1)
      if (ev.curtainPrevT === null || ct !== ev.curtainPrevT) {
        ev.curtainUpdates++
        ev.curtainPrevT = ct
      }
      if (ct > ev.curtainMaxT) ev.curtainMaxT = ct
      if (g.currentStageName != null) {
        const mix = levelMix(g.remainingBots)
        if (ev.firstRemainingBots === '' && g.remainingBots && g.remainingBots.size > 0) {
          ev.firstRemainingBots = mix
          ev.firstRemainingBotCount = num(g.remainingBots.size, -1)
          ev.firstRemainingBotLevels = str(g.remainingBots.first ? g.remainingBots.first() : '')
        }
        const sk = 'stage:' + str(g.currentStageName)
        if (!ev.tankIdsSeen[sk]) {
          ev.tankIdsSeen[sk] = true
          ev.stageStarts++
        }
      }
    }
    // --- tanks: the first player tank that appears ---
    const tanks = s.tanks
    if (tanks && typeof tanks.forEach === 'function') {
      tanks.forEach((t: any) => {
        const tk = 't' + t.tankId
        if (!ev.tankIdsSeen[tk]) {
          ev.tankIdsSeen[tk] = true
          if (t.side === 'player') {
            ev.playerSpawns++
            ev.firstPlayerTankId = num(t.tankId, -1)
            if (ev.firstPlayerSpawn === null) {
              ev.firstPlayerSpawn = {
                x: num(t.x, -1),
                y: num(t.y, -1),
                dir: str(t.direction),
                helmet: Math.round(num(t.helmetDuration, -1)),
                level: str(t.level),
                side: str(t.side),
                color: str(t.color),
              }
            }
          }
        } else if (t.side === 'bot' && t.alive === false) {
          const dk = 'd' + t.tankId
          if (!ev.tankIdsSeen[dk]) {
            ev.tankIdsSeen[dk] = true
            ev.botDeaths++
          }
        }
      })
    }
    // --- helmet uptime: the wall-clock DURATION between the first store
    //     observation that saw the spawned player tank shielded and the first
    //     one that saw it unshielded. It is measured here (setup time) and
    //     frozen into a scalar; a checkpoint asserts the duration, never a
    //     clock reading (纪律⑨). ---
    if (ev.firstPlayerTankId >= 0 && ev.helmetUptime < 0) {
      const ht = tanks && typeof tanks.get === 'function' ? tanks.get(ev.firstPlayerTankId) : null
      const nowMs = performance.now()
      if (ht && num(ht.helmetDuration, 0) > 0) {
        if (ev.helmetFirstPos < 0) ev.helmetFirstPos = nowMs
        ev.helmetLastPos = nowMs
      } else if (ev.helmetLastPos > 0) {
        ev.helmetUptime = Math.round(ev.helmetLastPos - ev.helmetFirstPos)
      }
    }
  } catch (e) {
    ev.subscribeError = str((e as any) && (e as any).message ? (e as any).message : e).slice(0, 160)
  }
}

let subscribed = false
function watch(): boolean {
  if (subscribed) return true
  subscribed = true
  try {
    ;(store as any).subscribe(onChange)
    onChange()
  } catch (e) {
    ev.subscribeError = str((e as any) && (e as any).message ? (e as any).message : e).slice(0, 160)
    return false
  }
  return true
}

// ---------------------------------------------------------------------------
// pixel-font text recovery
// ---------------------------------------------------------------------------
const CHAR_MAP: { [k: string]: string } = {
  blank: ' ',
  colon: ':',
  dash: '-',
  plus: '+',
  dot: '.',
  'question-mark': '?',
  'roman-numeral-one': '\u2160',
  'roman-numeral-two': '\u2161',
  'leftwards-arrow': '\u2190',
  'upwards-arrow': '\u2191',
  'rightwards-arrow': '\u2192',
  'downwards-arrow': '\u2193',
  'copyright-sign': '\u00a9',
}
function glyph(cls: string): string {
  const m = /character-([a-z0-9-]+)/.exec(cls || '')
  if (!m) return ''
  const k = m[1]
  if (CHAR_MAP[k] !== undefined) return CHAR_MAP[k]
  if (k.length === 1) return k
  return '?' + k + '?'
}
function textOfGroup(g: Element): string {
  let out = ''
  const nodes = g.querySelectorAll('[class*="character-"]')
  for (let i = 0; i < nodes.length; i++) out += glyph(nodes[i].getAttribute('class') || '')
  return out
}
function q(sel: string): Element | null {
  return safe(() => document.querySelector(sel), null)
}
function qa(sel: string): Element[] {
  return safe(() => Array.prototype.slice.call(document.querySelectorAll(sel)), [])
}
function textGroups(scopeSel: string): string[] {
  const scope = scopeSel ? q(scopeSel) : document.documentElement
  if (!scope) return []
  const groups = Array.prototype.slice.call(scope.querySelectorAll('g.text'))
  return groups.map(textOfGroup)
}
function buttonTexts(): string[] {
  return qa('.text-button').map(b => {
    const t = b.querySelector('g.text')
    return t ? textOfGroup(t) : ''
  })
}
function buttonsWith(areaClass: string): string {
  return qa('.text-button')
    .filter(b => {
      const r = b.querySelector('rect.text-area')
      return r ? (' ' + (r.getAttribute('class') || '') + ' ').indexOf(' ' + areaClass + ' ') >= 0 : false
    })
    .map(b => {
      const t = b.querySelector('g.text')
      return t ? textOfGroup(t) : ''
    })
    .join(',')
}

// ---------------------------------------------------------------------------
// side-effecting input helpers (setup phase only; each one is total)
// ---------------------------------------------------------------------------
function fire(el: Element, type: string, opts: any): boolean {
  if (!el) return false
  try {
    const e = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: num(opts && opts.clientX, 0),
      clientY: num(opts && opts.clientY, 0),
      button: 0,
    })
    el.dispatchEvent(e)
    return true
  } catch (err) {
    lastErr = 'fire:' + str((err as any) && (err as any).message).slice(0, 120)
    return false
  }
}
function nav(p: string): boolean {
  return safe(() => {
    ;(history as any).replace(str(p))
    return true
  }, false)
}
function navPush(p: string): boolean {
  return safe(() => {
    ;(history as any).push(str(p))
    return true
  }, false)
}
function key(code: string, type: string): boolean {
  return safe(() => {
    const t = type === 'keyup' ? 'keyup' : 'keydown'
    const k = code === 'Escape' ? 'Escape' : code.length === 1 ? code : ''
    const e = new KeyboardEvent(t, { code: str(code), key: k, bubbles: true, cancelable: true })
    document.dispatchEvent(e)
    return true
  }, false)
}
function keyTap(code: string): boolean {
  const a = key(code, 'keydown')
  const b = key(code, 'keyup')
  return a && b
}
function keyEscape(): boolean {
  return safe(() => {
    const e = new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true, cancelable: true })
    document.dispatchEvent(e)
    return true
  }, false)
}
function clickSel(sel: string): boolean {
  const el = q(sel)
  return el ? fire(el, 'click', {}) : false
}
function clickButton(label: string): boolean {
  const want = str(label)
  const btns = qa('.text-button')
  for (let i = 0; i < btns.length; i++) {
    const t = btns[i].querySelector('g.text')
    if (t && textOfGroup(t) === want) {
      const r = btns[i].querySelector('rect.text-area')
      return fire(r || btns[i], 'click', {})
    }
  }
  return false
}
function clickAreaButton(groupSel: string, index: number): boolean {
  const rects = qa(groupSel + ' rect.area-button')
  const i = num(index, -1)
  return i >= 0 && i < rects.length ? fire(rects[i], 'click', {}) : false
}
const ITEM_ORDER = ['X', 'B', 'T', 'R', 'S', 'F', 'E']
function pickItem(type: string): boolean {
  const i = ITEM_ORDER.indexOf(str(type).toUpperCase())
  return i >= 0 ? clickAreaButton('.item-switch-buttons', i) : false
}
function paintCell(row: number, col: number): boolean {
  // Editor.getT() maps a viewport coordinate straight back to a block index with
  // floor(client / ZOOM_LEVEL / BLOCK_SIZE), so the inverse is exact and does not
  // depend on where the svg sits in the page.
  const clientX = num(col, -1) * 32 + 16
  const clientY = num(row, -1) * 32 + 16
  if (clientX < 0 || clientY < 0) return false
  const svg = q('svg.screen')
  if (!svg) return false
  const a = fire(svg, 'mousedown', { clientX, clientY })
  const b = fire(svg, 'mouseup', { clientX, clientY })
  return a && b
}
function typeName(text: string): boolean {
  const g = q('.config-view g[tabindex]') || q('g[tabindex]')
  if (!g) return false
  const s = str(text)
  let okAll = true
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i)
    try {
      ;(g as any).focus && (g as any).focus()
    } catch (e) {
      /* focus is best effort */
    }
    const e = new KeyboardEvent('keydown', {
      code: 'Key' + ch.toUpperCase(),
      key: ch,
      bubbles: true,
      cancelable: true,
    })
    okAll = g.dispatchEvent(e) !== false && okAll
  }
  return okAll
}
function stamp(): boolean {
  return safe(() => {
    document.documentElement.setAttribute('data-testid', 'rb-probe-loaded')
    const svg = q('svg.screen')
    if (svg) svg.setAttribute('data-testid', 'rb-screen')
    return true
  }, false)
}
function snap(k: string): boolean {
  return safe(() => {
    latch['snap:' + str(k)] = {
      helmet: playerTankHelmet(),
      helmetPositive: playerTankHelmet() > 0 ? 1 : 0,
      helmetLayer: helmetLayerImageCount(),
      curtainT: curtainT(),
      paused: pausedFlag() ? 1 : 0,
      showHud: showHudFlag() ? 1 : 0,
      playerY: playerTankY(),
      playerX: playerTankX(),
      bullets: bulletTotal(),
      time: timeValue(),
    }
    return true
  }, false)
}
function snapNum(k: string, field: string): number {
  const s = recall('snap:' + str(k))
  return s ? num(s[str(field)], -1) : -1
}

// ---------------------------------------------------------------------------
// pure readers
// ---------------------------------------------------------------------------
function ok(): boolean {
  return true
}
function err(): string {
  return lastErr || ev.subscribeError || ''
}
function routePath(): string {
  return safe(() => str(S().router.location.pathname), '')
}
function routeSearch(): string {
  return safe(() => str(S().router.location.search), '')
}
function hashPath(): string {
  return safe(() => {
    let h = window.location.hash || ''
    if (h.charAt(0) === '#') h = h.slice(1)
    const qi = h.indexOf('?')
    return qi >= 0 ? h.slice(0, qi) : h
  }, '')
}
function hashSearch(): string {
  return safe(() => {
    const h = window.location.hash || ''
    const qi = h.indexOf('?')
    return qi >= 0 ? h.slice(qi) : ''
  }, '')
}
function bodyChildCount(): number {
  return safe(() => num(document.body.children.length, -1), -1)
}
function hiddenFormCount(): number {
  return safe(
    () =>
      qa('body > form').filter(f => (f as HTMLElement).style && (f as HTMLElement).style.display === 'none')
        .length,
    -1,
  )
}
function screenCount(): number {
  return safe(() => qa('svg.screen').length, -1)
}
function aboutExists(): boolean {
  return !!q('.about')
}
function aboutHidden(): boolean {
  const a = q('.about')
  return a ? (' ' + (a.getAttribute('class') || '') + ' ').indexOf(' hide ') >= 0 : false
}
function aboutCloseButtonPresent(): boolean {
  return !!q('.about button.close')
}
function aboutParagraphCount(): number {
  const a = q('.about')
  return a ? safe(() => a.querySelectorAll('p').length, -1) : -1
}
function aboutHasVersion(v: string): boolean {
  const a = q('.about')
  return a ? (a.textContent || '').indexOf(str(v)) >= 0 : false
}
function aboutHasCompileTimeLabel(): boolean {
  const a = q('.about')
  return a ? (a.textContent || '').indexOf('\u7f16\u8bd1\u65f6\u95f4') >= 0 : false
}
function aboutRouteHintLength(): number {
  const a = q('.about')
  if (!a) return -1
  const sw = a.querySelector('div > div')
  return safe(() => num((a.lastElementChild ? a.lastElementChild.textContent.length : 0), -1), -1)
}
function gameStatus(): string {
  return safe(() => str(S().game.status), '')
}
function currentStage(): string {
  return safe(() => str(S().game.currentStageName === null ? '' : S().game.currentStageName), '')
}
function comingStage(): string {
  return safe(() => str(S().game.comingStageName === null ? '' : S().game.comingStageName), '')
}
function lastStageName(): string {
  return safe(() => str(S().game.lastStageName === null ? '' : S().game.lastStageName), '')
}
function pausedFlag(): boolean {
  return safe(() => S().game.paused === true, false)
}
function pausedEverTrue(): boolean {
  return ev.pausedEver
}
function showHudFlag(): boolean {
  return safe(() => S().game.showHUD === true, false)
}
function showHudEverTrue(): boolean {
  return ev.showHudEver
}
function remainingBots(): number {
  return safe(() => num(S().game.remainingBots.size, -1), -1)
}
function remainingBotLevels(): string {
  return safe(() => levelMix(S().game.remainingBots), '')
}
function firstRemainingBotCount(): number {
  return ev.firstRemainingBotCount
}
function firstRemainingBotLevels(): string {
  return ev.firstRemainingBots
}
function firstRemainingBotHead(): string {
  return ev.firstRemainingBotLevels
}
function timeValue(): number {
  return safe(() => Math.round(num(S().time, -1)), -1)
}
function stageCount(): number {
  return safe(() => num(S().stages.size, -1), -1)
}
function defaultStageCount(): number {
  return safe(() => num(S().stages.filter((s: any) => !s.custom).count(), -1), -1)
}
function customStageCount(): number {
  return safe(() => num(S().stages.filter((s: any) => s.custom).count(), -1), -1)
}
function customStageNames(): string {
  return safe(
    () =>
      S()
        .stages.filter((s: any) => s.custom)
        .map((s: any) => s.name)
        .toArray()
        .sort()
        .join(','),
    '',
  )
}
function stageAt(i: number, field: string): string {
  return safe(() => {
    const st = S().stages.get(num(i, -1))
    if (!st) return ''
    if (field === 'name') return str(st.name)
    if (field === 'difficulty') return str(st.difficulty)
    if (field === 'custom') return st.custom ? 'true' : 'false'
    if (field === 'botCounts') return st.bots.map((b: any) => b.count).toArray().join(',')
    if (field === 'botLevels') return st.bots.map((b: any) => b.tankLevel).toArray().join(',')
    if (field === 'botTotal') return str(st.bots.map((b: any) => b.count).toArray().reduce((a: number, b: number) => a + b, 0))
    return ''
  }, '')
}
function stageByName(name: string, field: string): string {
  return safe(() => {
    const st = S().stages.find((s: any) => s.name === str(name))
    if (!st) return ''
    if (field === 'custom') return st.custom ? 'true' : 'false'
    if (field === 'difficulty') return str(st.difficulty)
    if (field === 'riverIndices')
      return st.map.rivers
        .map((set: boolean, t: number) => (set ? t : -1))
        .filter((t: number) => t >= 0)
        .toArray()
        .sort((a: number, b: number) => a - b)
        .join(',')
    if (field === 'riverCount') return str(st.map.rivers.filter((v: any) => v === true).count())
    if (field === 'brickCount') return str(st.map.bricks.filter((v: any) => v === true).count())
    if (field === 'steelCount') return str(st.map.steels.filter((v: any) => v === true).count())
    if (field === 'forestCount') return str(st.map.forests.filter((v: any) => v === true).count())
    if (field === 'snowCount') return str(st.map.snows.filter((v: any) => v === true).count())
    if (field === 'eagleXY') return st.map.eagle ? num(st.map.eagle.x, -1) + ',' + num(st.map.eagle.y, -1) : 'none'
    if (field === 'botTotal') return str(st.bots.map((b: any) => b.count).toArray().reduce((a: number, b: number) => a + b, 0))
    return ''
  }, '')
}
function p1Lives(): number {
  return safe(() => num(S().player1.lives, -1), -1)
}
function p2Lives(): number {
  return safe(() => num(S().player2.lives, -1), -1)
}
function p1Score(): number {
  return safe(() => num(S().player1.score, -1), -1)
}
function p1GameScore(): number {
  return safe(() => num(S().game.playersScores.get('player-1'), -1), -1)
}
function p1ActiveTankId(): number {
  return safe(() => num(S().player1.activeTankId, -1), -1)
}
function mapCount(which: string): number {
  return safe(() => {
    const m = S().map
    if (!m) return -1
    const list = which === 'brick' ? m.bricks : which === 'steel' ? m.steels : which === 'river' ? m.rivers : which === 'snow' ? m.snows : which === 'forest' ? m.forests : null
    return list ? num(list.filter((v: any) => v === true).count(), -1) : -1
  }, -1)
}
function brickTrue(): number {
  return mapCount('brick')
}
function steelTrue(): number {
  return mapCount('steel')
}
function riverTrue(): number {
  return mapCount('river')
}
function snowTrue(): number {
  return mapCount('snow')
}
function forestTrue(): number {
  return mapCount('forest')
}
function eagleExists(): boolean {
  return safe(() => S().map.eagle != null, false)
}
function eagleXY(): string {
  return safe(() => {
    const e = S().map.eagle
    return e ? num(e.x, -1) + ',' + num(e.y, -1) : 'none'
  }, 'none')
}
function eagleBroken(): boolean {
  return safe(() => (S().map.eagle ? S().map.eagle.broken === true : false), false)
}
function mapLoaded(): boolean {
  return eagleExists()
}
function mapLoadCount(): number {
  return ev.mapLoads
}
function stageStartCount(): number {
  return ev.stageStarts
}
function tankTotal(): number {
  return safe(() => num(S().tanks.size, -1), -1)
}
function tankAlive(): number {
  return safe(() => num(S().tanks.filter((t: any) => t.alive).count(), -1), -1)
}
function botAlive(): number {
  return safe(() => num(S().tanks.filter((t: any) => t.alive && t.side === 'bot').count(), -1), -1)
}
function playerTankCount(): number {
  return safe(() => num(S().tanks.filter((t: any) => t.side === 'player').count(), -1), -1)
}
function pTank(): any {
  const id = p1ActiveTankId()
  return safe(() => (id >= 0 ? S().tanks.get(id) : null), null)
}
function playerTankExists(): boolean {
  return !!pTank()
}
function playerTankX(): number {
  return safe(() => (pTank() ? num(pTank().x, -1) : -1), -1)
}
function playerTankY(): number {
  return safe(() => (pTank() ? num(pTank().y, -1) : -1), -1)
}
function playerTankDir(): string {
  return safe(() => (pTank() ? str(pTank().direction) : ''), '')
}
function playerTankLevel(): string {
  return safe(() => (pTank() ? str(pTank().level) : ''), '')
}
function playerTankMoving(): boolean {
  return safe(() => (pTank() ? pTank().moving === true : false), false)
}
function playerTankHelmet(): number {
  return safe(() => (pTank() ? Math.round(num(pTank().helmetDuration, -1)) : -1), -1)
}
function playerTankXMod8(): number {
  const x = playerTankX()
  return x < 0 ? -1 : x % 8
}
function playerTankYMod8(): number {
  const y = playerTankY()
  return y < 0 ? -1 : y % 8
}
function playerSpawnCount(): number {
  return ev.playerSpawns
}
function firstPlayerSpawnField(f: string): any {
  const r = ev.firstPlayerSpawn
  if (!r) return f === 'dir' || f === 'level' || f === 'side' || f === 'color' ? '' : -1
  return f === 'dir' || f === 'level' || f === 'side' || f === 'color' ? str(r[f]) : num(r[f], -1)
}
function helmetLayerImageCount(): number {
  return safe(() => qa('.helmet-layer image').length, -1)
}
function helmetLayerExists(): boolean {
  return !!q('.helmet-layer')
}
function helmetConsistent(): boolean {
  const positive = playerTankHelmet() > 0
  const n = helmetLayerImageCount()
  if (n < 0) return false
  return positive ? n === 1 : n === 0
}
function bulletTotal(): number {
  return safe(() => num(S().bullets.size, -1), -1)
}
function playerBulletCount(): number {
  return safe(() => num(S().bullets.filter((b: any) => b.side === 'player').count(), -1), -1)
}
function maxPlayerBullets(): number {
  return ev.maxPlayerBullets
}
function bulletSpawnCount(): number {
  return ev.bulletSpawns
}
function bulletField(heading: string, f: string): any {
  const r =
    heading === 'up'
      ? ev.upBullet
      : heading === 'down'
      ? ev.downBullet
      : heading === 'left'
      ? ev.leftBullet
      : heading === 'right'
      ? ev.rightBullet
      : null
  if (!r) return f === 'dir' || f === 'side' ? '' : -1
  return f === 'dir' || f === 'side' ? str(r[f]) : num(r[f], -1)
}
function brickRemovedTotal(): number {
  return ev.brickRemovedTotal
}
function brickRemoveEvents(): number {
  return ev.brickRemoveEvents
}
function steelRemovedTotal(): number {
  return ev.steelRemovedTotal
}
function botDeathCount(): number {
  return ev.botDeaths
}
function explosionCount(): number {
  return safe(() => num(S().explosions.size, -1), -1)
}
function flickerCount(): number {
  return safe(() => num(S().flickers.size, -1), -1)
}
function scorePopupCount(): number {
  return safe(() => num(S().scores.size, -1), -1)
}
function textRecordCount(): number {
  return safe(() => num(S().texts.size, -1), -1)
}
function powerUpCount(): number {
  return safe(() => num(S().powerUps.size, -1), -1)
}
function curtainT(): number {
  return safe(() => num(S().game.stageEnterCurtainT, -1), -1)
}
function curtainMaxT(): number {
  return ev.curtainMaxT
}
function curtainUpdateCount(): number {
  return ev.curtainUpdates
}
function curtainGroupCount(): number {
  return safe(() => qa('[role^="curtain-"]').length, -1)
}
function curtainClipHeights(): string {
  return safe(
    () =>
      qa('[role^="curtain-"] clipPath rect')
        .map(r => r.getAttribute('height') || '')
        .join(','),
    '',
  )
}
function curtainContentText(): string {
  const g = q('[role^="curtain-"]')
  if (!g) return ''
  const t = g.querySelector('g.text')
  return t ? textOfGroup(t) : ''
}
function editorContentField(f: string): string {
  return safe(() => {
    const ec = S().editorContent
    if (!ec) return ''
    if (f === 'name') return str(ec.name)
    if (f === 'difficulty') return str(ec.difficulty)
    if (f === 'custom') return ec.custom ? 'true' : 'false'
    if (f === 'botCounts') return ec.bots.map((b: any) => b.count).toArray().join(',')
    if (f === 'botLevels') return ec.bots.map((b: any) => b.tankLevel).toArray().join(',')
    if (f === 'botTotal')
      return str(ec.bots.map((b: any) => b.count).toArray().reduce((a: number, b: number) => a + b, 0))
    if (f === 'riverIndices')
      return ec.map.rivers
        .map((set: boolean, t: number) => (set ? t : -1))
        .filter((t: number) => t >= 0)
        .toArray()
        .sort((a: number, b: number) => a - b)
        .join(',')
    if (f === 'riverCount') return str(ec.map.rivers.filter((v: any) => v === true).count())
    if (f === 'brickCount') return str(ec.map.bricks.filter((v: any) => v === true).count())
    if (f === 'steelCount') return str(ec.map.steels.filter((v: any) => v === true).count())
    if (f === 'forestCount') return str(ec.map.forests.filter((v: any) => v === true).count())
    if (f === 'snowCount') return str(ec.map.snows.filter((v: any) => v === true).count())
    if (f === 'eagleExists') return ec.map.eagle ? 'true' : 'false'
    if (f === 'eagleXY') return ec.map.eagle ? num(ec.map.eagle.x, -1) + ',' + num(ec.map.eagle.y, -1) : 'none'
    return ''
  }, '')
}
// --- storage / residue ---
function lsLength(): number {
  return safe(() => num(window.localStorage.length, -1), -1)
}
function lsKeysSorted(): string {
  return safe(() => {
    const out: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) out.push(str(window.localStorage.key(i)))
    return out.sort().join(',')
  }, '')
}
function lsHasKey(k: string): boolean {
  return safe(() => window.localStorage.getItem(str(k)) !== null, false)
}
function lsRawLen(k: string): number {
  return safe(() => num((window.localStorage.getItem(str(k)) || '').length, -1), -1)
}
function lsRawField(k: string, f: string): string {
  return safe(() => {
    const rawText = window.localStorage.getItem(str(k))
    if (rawText === null) return 'no-key'
    const arr = JSON.parse(rawText)
    if (!arr || !arr.length) return f === 'count' ? '0' : 'empty'
    if (f === 'count') return str(arr.length)
    if (f === 'names') return arr.map((s: any) => str(s.name)).sort().join(',')
    if (f === 'customFlags') return arr.map((s: any) => (s.custom ? 'true' : 'false')).join(',')
    if (f === 'bots') return arr.map((s: any) => (s.bots || []).join('|')).join(';')
    if (f === 'mapRows') return str((arr[0].map || []).length)
    if (f === 'row') return ''
    return ''
  }, '')
}
function lsRawMapRow(k: string, i: number): string {
  return safe(() => {
    const rawText = window.localStorage.getItem(str(k))
    if (rawText === null) return 'no-key'
    const arr = JSON.parse(rawText)
    if (!arr || !arr.length) return 'empty'
    const rows = arr[0].map || []
    const idx = num(i, -1)
    return idx >= 0 && idx < rows.length ? str(rows[idx]).replace(/ +$/, '') : 'out-of-range'
  }, '')
}
function lsRawIndexOf(k: string, needle: string): number {
  return safe(() => {
    const rawText = window.localStorage.getItem(str(k))
    return rawText === null ? -2 : (rawText.indexOf(str(needle)) >= 0 ? 1 : 0)
  }, -2)
}
function sessionStorageLength(): number {
  return safe(() => num(window.sessionStorage.length, -1), -1)
}
function cookieText(): string {
  return safe(() => str(document.cookie), '')
}
//
//
const POLYFILL_GLOBALS = ['__core-js_shared__']
function rbGlobalCount(): number {
  return safe(() => {
    let n = 0
    for (const k in window) if (k.indexOf('__') === 0 && POLYFILL_GLOBALS.indexOf(k) < 0) n++
    return n
  }, -1)
}
function rbBridgePresent(): boolean {
  return safe(() => !!(window as any).__RB__ && typeof (window as any).__RB__.ok === 'function', false)
}
// --- DOM readers ---
function countSel(sel: string): number {
  return safe(() => qa(str(sel)).length, -1)
}
function attrOf(sel: string, name: string): string {
  const el = q(str(sel))
  return el ? str(el.getAttribute(str(name))) : ''
}
function styleVisibilityOf(sel: string): string {
  const el = q(str(sel)) as any
  return el && el.style ? str(el.style.visibility) : ''
}
function textsOfScope(sel: string): string {
  return textGroups(str(sel)).join(',')
}
function textOfScope(sel: string): string {
  const t = textGroups(str(sel))
  return t.length ? t[0] : ''
}
function screenTexts(): string {
  return textGroups('svg.screen').join(',')
}
function screenTextJoined(): string {
  return textGroups('svg.screen').join('')
}
function allButtonTexts(): string {
  return buttonTexts().join(',')
}
function disabledButtonTexts(): string {
  return buttonsWith('disabled')
}
function selectedButtonTexts(): string {
  return buttonsWith('selected')
}
function buttonCount(): number {
  return safe(() => qa('.text-button').length, -1)
}
function titleCursorTransform(): string {
  return safe(() => {
    const scope = q('.game-title-scene')
    if (!scope) return ''
    const imgs = Array.prototype.slice.call(scope.querySelectorAll('image'))
    for (let i = 0; i < imgs.length; i++) {
      const k = (imgs[i].getAttribute('data-imageKey') || imgs[i].getAttribute('data-imagekey')) || ''
      if (k.indexOf('Tank/player/') === 0) return str(imgs[i].getAttribute('transform'))
    }
    return ''
  }, '')
}
function titleCursorY(): number {
  const m = /translate\(\s*(-?[\d.]+)[,\s]+(-?[\d.]+)\s*\)/.exec(titleCursorTransform())
  return m ? num(m[2], -1) : -1
}
function titleCursorX(): number {
  const m = /translate\(\s*(-?[\d.]+)[,\s]+(-?[\d.]+)\s*\)/.exec(titleCursorTransform())
  return m ? num(m[1], -1) : -1
}
function playerTankTransform(): string {
  return safe(() => {
    const layer = q('.tank-layer')
    if (!layer) return ''
    const imgs = Array.prototype.slice.call(layer.querySelectorAll('image'))
    for (let i = 0; i < imgs.length; i++) {
      const k = (imgs[i].getAttribute('data-imageKey') || imgs[i].getAttribute('data-imagekey')) || ''
      if (k.indexOf('Tank/player/') === 0) return str(imgs[i].getAttribute('transform'))
    }
    return ''
  }, '')
}
function tankImageKeyPrefixes(): string {
  return safe(() => {
    const layer = q('.tank-layer')
    if (!layer) return ''
    return Array.prototype.slice
      .call(layer.querySelectorAll('image'))
      .map((im: Element) => {
        const k = str((im.getAttribute('data-imageKey') || im.getAttribute('data-imagekey')) || '')
        const p = k.split('/')
        return p.length >= 4 ? p.slice(0, 4).join('/') : k
      })
      .sort()
      .join(',')
  }, '')
}
function hudExists(): boolean {
  return !!q('g.HUD')
}
function hudDisplayAttr(): string {
  return attrOf('g.HUD', 'display')
}
function hudPlayer1Texts(): string {
  return textGroups('.player-1-info').join(',')
}
function hudPlayer2Present(): boolean {
  return !!q('.player-2-info')
}
function botThumbCount(): number {
  return safe(() => qa('.remaining-bot-count-indicator image').length, -1)
}
function botIndicatorExists(): boolean {
  return !!q('.remaining-bot-count-indicator')
}
function galleryNavTexts(): string {
  return safe(() => {
    const hint = qa('svg.screen > g')
    // the nav strip is the last scaled group in the gallery screen
    const groups = qa('.text-button')
    return groups
      .map(b => {
        const t = b.querySelector('g.text')
        return t ? textOfGroup(t) : ''
      })
      .join(',')
  }, '')
}
function galleryTankImageCount(): number {
  return safe(() => qa('svg.screen image').length, -1)
}
function stagePreviewKeys(): string {
  return safe(
    () =>
      qa('svg.screen image')
        .map((im: Element) => str((im.getAttribute('data-imageKey') || im.getAttribute('data-imagekey')) || ''))
        .filter(k => k.indexOf('StagePreview/') === 0)
        .sort()
        .join(','),
    '',
  )
}
function stagePreviewEmptyCount(): number {
  return safe(() => qa('.stage-preview.empty').length, -1)
}
function shelfCardCount(): number {
  return safe(() => qa('svg.screen image[data-imagekey^="StagePreview/"]').length, -1)
}
function popupAlertExists(): boolean {
  return !!q('.popup-alert')
}
function popupConfirmExists(): boolean {
  return !!q('.popup-confirm')
}
function popupAlertText(): string {
  const g = q('.popup-alert .text-with-line-wrap')
  if (!g) return ''
  return Array.prototype.slice
    .call(g.querySelectorAll('g.text'))
    .map(textOfGroup)
    .join('')
}
function popupConfirmText(): string {
  const g = q('.popup-confirm .text-with-line-wrap')
  if (!g) return ''
  return Array.prototype.slice
    .call(g.querySelectorAll('g.text'))
    .map(textOfGroup)
    .join('')
}
function editorBotLevelKeys(): string {
  return safe(() => {
    const scope = q('.bots-config')
    if (!scope) return ''
    return Array.prototype.slice
      .call(scope.querySelectorAll('image'))
      .map((im: Element) => {
        const k = str((im.getAttribute('data-imageKey') || im.getAttribute('data-imagekey')) || '')
        const p = k.split('/')
        return p.length >= 3 ? p[2] : k
      })
      .join(',')
  }, '')
}
function editorNameText(): string {
  const g = q('.config-view g[tabindex] g.text')
  return g ? textOfGroup(g) : ''
}
function editorDifficultyText(): string {
  return safe(() => {
    const groups = textGroups('.config-view')
    // config view order: 'name:', <input value>, 'difficulty:', '-', <n>, '+', 'bots:', ...
    return groups.length > 4 ? groups[4] : ''
  }, '')
}
function editorBotCountTexts(): string {
  return safe(() => {
    const scope = q('.bots-config')
    if (!scope) return ''
    return Array.prototype.slice
      .call(scope.querySelectorAll('g.text'))
      .map(textOfGroup)
      .join(',')
  }, '')
}
function mapViewExists(): boolean {
  return !!q('.map-view')
}
function configViewExists(): boolean {
  return !!q('.config-view')
}
function menuButtonTexts(): string {
  return safe(() => {
    const scope = q('g.menu')
    if (!scope) return ''
    return Array.prototype.slice
      .call(scope.querySelectorAll('.text-button'))
      .map((b: Element) => {
        const t = b.querySelector('g.text')
        return t ? textOfGroup(t) : ''
      })
      .join(',')
  }, '')
}
function pauseTextPresent(): boolean {
  return textGroups('svg.screen').indexOf('pause') >= 0
}
function gridLineCount(): number {
  return safe(() => qa('.dash-lines line').length, -1)
}
function itemSwitchButtonCount(): number {
  return safe(() => qa('.item-switch-buttons rect.area-button').length, -1)
}
function cornerLinkCount(): number {
  return safe(() => qa('a.github-corner').length, -1)
}
function cornerHref(): string {
  return attrOf('a.github-corner', 'href')
}
function cornerOutsideContainer(): boolean {
  const a = q('a.github-corner')
  const c = q('#container')
  return a && c ? !c.contains(a) : false
}
function cornerSvgPathCount(): number {
  return safe(() => qa('a.github-corner svg path').length, -1)
}

function mapLoadField(f: string): any {
  if (f === 'eagleXY') return ev.mapLoadEagleX + ',' + ev.mapLoadEagleY
  const v =
    f === 'brick'
      ? ev.mapLoadBricks
      : f === 'steel'
      ? ev.mapLoadSteels
      : f === 'river'
      ? ev.mapLoadRivers
      : f === 'snow'
      ? ev.mapLoadSnows
      : f === 'forest'
      ? ev.mapLoadForests
      : -1
  return num(v, -1)
}
function helmetUptimeMs(): number {
  return ev.helmetUptime
}
function firstPlayerTankId(): number {
  return ev.firstPlayerTankId
}
function rbResidueKeys(): string {
  return safe(() => {
    const out: string[] = []
    for (const k in window) if (k.indexOf('__') === 0 && k !== '__RB__' && POLYFILL_GLOBALS.indexOf(k) < 0) out.push(k)
    return out.sort().join(',')
  }, '')
}

const RB = {
  ok: ok,
  err: err,
  watch: watch,
  remember: remember,
  recall: recall,
  snap: snap,
  snapNum: snapNum,
  stamp: stamp,
  // input helpers (setup phase)
  nav: nav,
  navPush: navPush,
  key: key,
  keyTap: keyTap,
  keyEscape: keyEscape,
  clickSel: clickSel,
  clickButton: clickButton,
  clickAreaButton: clickAreaButton,
  pickItem: pickItem,
  paintCell: paintCell,
  typeName: typeName,
  // route / shell
  routePath: routePath,
  routeSearch: routeSearch,
  hashPath: hashPath,
  hashSearch: hashSearch,
  bodyChildCount: bodyChildCount,
  hiddenFormCount: hiddenFormCount,
  screenCount: screenCount,
  cornerLinkCount: cornerLinkCount,
  cornerHref: cornerHref,
  cornerOutsideContainer: cornerOutsideContainer,
  cornerSvgPathCount: cornerSvgPathCount,
  aboutExists: aboutExists,
  aboutHidden: aboutHidden,
  aboutCloseButtonPresent: aboutCloseButtonPresent,
  aboutParagraphCount: aboutParagraphCount,
  aboutHasVersion: aboutHasVersion,
  aboutHasCompileTimeLabel: aboutHasCompileTimeLabel,
  // store
  gameStatus: gameStatus,
  currentStage: currentStage,
  comingStage: comingStage,
  lastStageName: lastStageName,
  pausedFlag: pausedFlag,
  pausedEverTrue: pausedEverTrue,
  showHudFlag: showHudFlag,
  showHudEverTrue: showHudEverTrue,
  remainingBots: remainingBots,
  remainingBotLevels: remainingBotLevels,
  firstRemainingBotCount: firstRemainingBotCount,
  firstRemainingBotLevels: firstRemainingBotLevels,
  firstRemainingBotHead: firstRemainingBotHead,
  timeValue: timeValue,
  stageCount: stageCount,
  defaultStageCount: defaultStageCount,
  customStageCount: customStageCount,
  customStageNames: customStageNames,
  stageAt: stageAt,
  stageByName: stageByName,
  p1Lives: p1Lives,
  p2Lives: p2Lives,
  p1Score: p1Score,
  p1GameScore: p1GameScore,
  p1ActiveTankId: p1ActiveTankId,
  brickTrue: brickTrue,
  steelTrue: steelTrue,
  riverTrue: riverTrue,
  snowTrue: snowTrue,
  forestTrue: forestTrue,
  eagleExists: eagleExists,
  eagleXY: eagleXY,
  eagleBroken: eagleBroken,
  mapLoaded: mapLoaded,
  mapLoadCount: mapLoadCount,
  stageStartCount: stageStartCount,
  tankTotal: tankTotal,
  tankAlive: tankAlive,
  botAlive: botAlive,
  playerTankCount: playerTankCount,
  playerTankExists: playerTankExists,
  playerTankX: playerTankX,
  playerTankY: playerTankY,
  playerTankDir: playerTankDir,
  playerTankLevel: playerTankLevel,
  playerTankMoving: playerTankMoving,
  playerTankHelmet: playerTankHelmet,
  playerTankXMod8: playerTankXMod8,
  playerTankYMod8: playerTankYMod8,
  playerSpawnCount: playerSpawnCount,
  firstPlayerSpawnField: firstPlayerSpawnField,
  helmetLayerExists: helmetLayerExists,
  helmetLayerImageCount: helmetLayerImageCount,
  helmetConsistent: helmetConsistent,
  bulletTotal: bulletTotal,
  playerBulletCount: playerBulletCount,
  maxPlayerBullets: maxPlayerBullets,
  bulletSpawnCount: bulletSpawnCount,
  bulletField: bulletField,
  brickRemovedTotal: brickRemovedTotal,
  brickRemoveEvents: brickRemoveEvents,
  steelRemovedTotal: steelRemovedTotal,
  botDeathCount: botDeathCount,
  explosionCount: explosionCount,
  flickerCount: flickerCount,
  scorePopupCount: scorePopupCount,
  textRecordCount: textRecordCount,
  powerUpCount: powerUpCount,
  curtainT: curtainT,
  curtainMaxT: curtainMaxT,
  curtainUpdateCount: curtainUpdateCount,
  curtainGroupCount: curtainGroupCount,
  curtainClipHeights: curtainClipHeights,
  curtainContentText: curtainContentText,
  editorContentField: editorContentField,
  // residue
  lsLength: lsLength,
  lsKeysSorted: lsKeysSorted,
  lsHasKey: lsHasKey,
  lsRawLen: lsRawLen,
  lsRawField: lsRawField,
  lsRawMapRow: lsRawMapRow,
  lsRawIndexOf: lsRawIndexOf,
  sessionStorageLength: sessionStorageLength,
  cookieText: cookieText,
  rbGlobalCount: rbGlobalCount,
  rbResidueKeys: rbResidueKeys,
  rbBridgePresent: rbBridgePresent,
  mapLoadField: mapLoadField,
  helmetUptimeMs: helmetUptimeMs,
  firstPlayerTankId: firstPlayerTankId,
  // DOM
  countSel: countSel,
  attrOf: attrOf,
  styleVisibilityOf: styleVisibilityOf,
  textsOfScope: textsOfScope,
  textOfScope: textOfScope,
  screenTexts: screenTexts,
  screenTextJoined: screenTextJoined,
  allButtonTexts: allButtonTexts,
  disabledButtonTexts: disabledButtonTexts,
  selectedButtonTexts: selectedButtonTexts,
  buttonCount: buttonCount,
  titleCursorTransform: titleCursorTransform,
  titleCursorX: titleCursorX,
  titleCursorY: titleCursorY,
  playerTankTransform: playerTankTransform,
  tankImageKeyPrefixes: tankImageKeyPrefixes,
  hudExists: hudExists,
  hudDisplayAttr: hudDisplayAttr,
  hudPlayer1Texts: hudPlayer1Texts,
  hudPlayer2Present: hudPlayer2Present,
  botThumbCount: botThumbCount,
  botIndicatorExists: botIndicatorExists,
  galleryNavTexts: galleryNavTexts,
  galleryTankImageCount: galleryTankImageCount,
  stagePreviewKeys: stagePreviewKeys,
  stagePreviewEmptyCount: stagePreviewEmptyCount,
  shelfCardCount: shelfCardCount,
  popupAlertExists: popupAlertExists,
  popupConfirmExists: popupConfirmExists,
  popupAlertText: popupAlertText,
  popupConfirmText: popupConfirmText,
  editorBotLevelKeys: editorBotLevelKeys,
  editorNameText: editorNameText,
  editorDifficultyText: editorDifficultyText,
  editorBotCountTexts: editorBotCountTexts,
  mapViewExists: mapViewExists,
  configViewExists: configViewExists,
  menuButtonTexts: menuButtonTexts,
  pauseTextPresent: pauseTextPresent,
  gridLineCount: gridLineCount,
  itemSwitchButtonCount: itemSwitchButtonCount,
}

W.__RB__ = RB
watch()
stamp()
