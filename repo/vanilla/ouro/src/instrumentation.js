// instrumentation: offline verification harness for a canvas-only Phaser build.
//
// Ouro renders every pixel into a single <canvas>, so there is no DOM surface a
// verifier can assert against. This module adds two read-only affordances and
// changes no game behaviour:
//
//   1. a fixed-position HUD strip whose cells carry `data-testid` attributes and
//      mirror live scene state (scores, food tallies, snake lengths, head and
//      ball positions, mute flag, chosen colours, active scene), and
//   2. `window.__OURO__`, a bridge exposing the running scenes, the Snake/Food
//      constructors and a deterministic synthetic key press.
//
// FRESH-READ CONTRACT: `window.__OURO__` is re-assigned on every game step and
// every accessor recomputes from live state - nothing is memoised. Consumers
// MUST re-read `window.__OURO__` on each access and MUST NOT cache the bridge,
// a scene reference or a HUD cell across interactions.

import Snake from './classes/snake'
import Food from './classes/food'

export const HUD_FIELDS = [
  'scene',
  'canvas',
  'loading',
  'score1',
  'score2',
  'food1',
  'food2',
  'snake1-len',
  'snake2-len',
  'snake1-head',
  'snake2-head',
  'ball',
  'mute',
  'color1',
  'color2',
  'title-selection',
  'menu-p1',
  'menu-p2',
]

export const KEY_CODES = {
  ENTER: 13,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  A: 65,
  D: 68,
  M: 77,
  S: 83,
  W: 87,
}

const DEFAULT_BOUNDS = { top: 64, right: 400, bottom: 560, left: 0 }

const TESTID_PREFIX = 'ouro-'

function safe(read, fallback) {
  try {
    const value = read()

    return value === undefined || value === null ? fallback : value
  } catch (err) {
    return fallback
  }
}

function pointOf(target) {
  return Math.round(target.x) + ',' + Math.round(target.y)
}

function buildHud() {
  const existing = document.getElementById('ouro-hud')

  if (existing) {
    return existing
  }

  const hud = document.createElement('div')

  hud.id = 'ouro-hud'
  hud.setAttribute('data-testid', 'ouro-hud')
  hud.setAttribute(
    'style',
    [
      'position:fixed',
      'left:0',
      'bottom:0',
      'z-index:2147483647',
      'display:flex',
      'flex-wrap:wrap',
      'gap:4px',
      'max-width:100vw',
      'padding:2px',
      'font:10px monospace',
      'color:#39ff88',
      'background:rgba(0,0,0,0.65)',
      'pointer-events:none',
    ].join(';'),
  )

  HUD_FIELDS.forEach((name) => {
    const cell = document.createElement('span')

    cell.setAttribute('data-testid', TESTID_PREFIX + name)
    cell.textContent = ''
    hud.appendChild(cell)
  })

  document.body.appendChild(hud)

  return hud
}

function writeCell(name, value) {
  const cell = document.querySelector('[data-testid="' + TESTID_PREFIX + name + '"]')

  if (cell) {
    cell.textContent = String(value)
  }
}

// Phaser 3.15 has no SceneManager#getScenes, so the running scene is resolved by
// scanning SceneManager#scenes. sys.isActive() is `status === RUNNING`, i.e. it is
// only true once the scene's own create() has finished.
function runningScenes(game) {
  const all = (game.scene && game.scene.scenes) || []

  return all.filter((candidate) => candidate && candidate.sys && candidate.sys.isActive())
}

function buildBridge(game) {
  return {
    contract: 'fresh-read',
    version: '1.0',
    game,
    Snake,
    Food,

    scene(key) {
      if (!key) {
        const running = runningScenes(game)

        return running.length ? running[running.length - 1] : null
      }

      return game.scene.getScene(key) || null
    },

    sceneKey() {
      const running = runningScenes(game)

      return running.length ? running[running.length - 1].sys.settings.key : ''
    },

    // SceneManager#start does NOT stop the scene that is currently running (only
    // ScenePlugin#start does), so shut the others down first to keep exactly one
    // active scene, matching the navigation the game itself performs.
    gotoScene(key, data) {
      runningScenes(game).forEach((candidate) => {
        const candidateKey = candidate.sys.settings.key

        if (candidateKey !== key) {
          game.scene.stop(candidateKey)
        }
      })

      game.scene.start(key, data || {})

      return this.sceneKey()
    },

    pressKey(name) {
      const upper = String(name).toUpperCase()
      const code = KEY_CODES[upper]

      if (code === undefined) {
        return false
      }

      const dispatch = (type) => {
        const event = new KeyboardEvent(type, {
          bubbles: true,
          cancelable: true,
          key: upper,
          code: 'Key' + upper,
        })

        Object.defineProperty(event, 'keyCode', { get: () => code })
        Object.defineProperty(event, 'which', { get: () => code })
        window.dispatchEvent(event)
      }

      dispatch('keydown')
      setTimeout(() => dispatch('keyup'), 250) // release on a later task: Phaser 3.15.1 ProcessKeyUp clears _justDown, so a same-batch down/up pair is invisible to JustDown()

      return true
    },

    makeSnake(x, y, options) {
      const scene = this.scene('game')

      if (!scene) {
        return null
      }

      return new Snake(scene, x, y, Object.assign({ bounds: DEFAULT_BOUNDS }, options || {}))
    },

    makeFood(x, y, options) {
      const scene = this.scene('game')

      if (!scene) {
        return null
      }

      return new Food(scene, x, y, Object.assign({ bounds: DEFAULT_BOUNDS }, options || {}))
    },

    // Collects every Text game object in the scene, recursing into Containers
    // (the menu nests its player sections inside two containers, so a flat scan
    // of children.list would miss them). Coordinates are reported in the
    // container-local space Phaser stores on the child.
    texts(key) {
      const scene = this.scene(key)

      if (!scene || !scene.children) {
        return []
      }

      const found = []

      const walk = (list) => {
        list.forEach((child) => {
          if (!child) {
            return
          }

          if (child.type === 'Text') {
            found.push({
              text: String(child.text),
              x: child.x,
              y: child.y,
              originX: child.originX,
              originY: child.originY,
            })
          }

          if (child.type === 'Container' && Array.isArray(child.list)) {
            walk(child.list)
          }
        })
      }

      walk(scene.children.list)

      return found
    },

    snapshot() {
      return {
        scene: this.sceneKey(),
        canvasW: safe(() => this.game.config.width, -1),
        canvasH: safe(() => this.game.config.height, -1),
        mute: safe(() => Boolean(this.game.sound.mute), false),
        score1: safe(() => String(this.scene('game').score1Display.text), ''),
        score2: safe(() => String(this.scene('game').score2Display.text), ''),
        food1: safe(() => String(this.scene('game').foodScore1Display.text), ''),
        food2: safe(() => String(this.scene('game').foodScore2Display.text), ''),
        snake1Len: safe(() => this.scene('game').snake1.body.getLength(), -1),
        snake2Len: safe(() => this.scene('game').snake2.body.getLength(), -1),
        snake1Head: safe(() => pointOf(this.scene('game').snake1.headPosition), ''),
        snake2Head: safe(() => pointOf(this.scene('game').snake2.headPosition), ''),
        ball: safe(() => pointOf(this.scene('game').ball), ''),
        titleSelection: safe(() => this.scene('title').selections[this.scene('title').selectionIndex].label, ''),
        menuP1: safe(() => this.scene('menu').colors[this.scene('menu').player1ColorIndex], ''),
        menuP2: safe(() => this.scene('menu').colors[this.scene('menu').player2ColorIndex], ''),
        hudScene: safe(() => document.querySelector('[data-testid="ouro-scene"]').textContent, ''),
      }
    },
  }
}

function mirrorHud(game, bridge) {
  const loading = bridge.scene('loading')
  const title = bridge.scene('title')
  const menu = bridge.scene('menu')
  const played = bridge.scene('game')

  writeCell('scene', bridge.sceneKey())
  writeCell('canvas', safe(() => game.canvas.width + 'x' + game.canvas.height, ''))
  writeCell('loading', safe(() => String(loading.loading), ''))
  writeCell('mute', safe(() => String(Boolean(game.sound.mute)), ''))
  writeCell('title-selection', safe(() => title.selections[title.selectionIndex].label, ''))
  writeCell('menu-p1', safe(() => menu.colors[menu.player1ColorIndex], ''))
  writeCell('menu-p2', safe(() => menu.colors[menu.player2ColorIndex], ''))
  writeCell('score1', safe(() => String(played.score1Display.text), ''))
  writeCell('score2', safe(() => String(played.score2Display.text), ''))
  writeCell('food1', safe(() => String(played.foodScore1Display.text), ''))
  writeCell('food2', safe(() => String(played.foodScore2Display.text), ''))
  writeCell('color1', safe(() => String(played.color1), ''))
  writeCell('color2', safe(() => String(played.color2), ''))
  writeCell('snake1-len', safe(() => played.snake1.body.getLength(), ''))
  writeCell('snake2-len', safe(() => played.snake2.body.getLength(), ''))
  writeCell('snake1-head', safe(() => pointOf(played.snake1.headPosition), ''))
  writeCell('snake2-head', safe(() => pointOf(played.snake2.headPosition), ''))
  writeCell('ball', safe(() => pointOf(played.ball), ''))
}

export function installInstrumentation(game) {
  window.__OURO__ = buildBridge(game)

  if (game.__ouroInstrumented) {
    return window.__OURO__
  }

  game.__ouroInstrumented = true

  const boot = () => {
    buildHud()

    if (game.canvas) {
      game.canvas.setAttribute('data-testid', 'ouro-canvas')
    }

    game.events.on('step', () => {
      // fresh-read contract: a brand new bridge object on every single step
      const bridge = buildBridge(game)

      window.__OURO__ = bridge
      mirrorHud(game, bridge)
    })

    mirrorHud(game, window.__OURO__)
  }

  if (game.isBooted) {
    boot()
  } else {
    game.events.once('ready', boot)
  }

  return window.__OURO__
}
