// repair-bench INSTRUMENTATION: the observation bridge. Read-only - it wraps HLViewer.init once to
// capture the instance the seed created, subscribes to the seed's own emitters and publishes
// window.__HLV__ for the frozen checker.
import { installRbProbe } from './rb-probe'
import { Game } from './Game'
import { Config } from './Config'
import { PlayerInterface } from './PlayerInterface/index'

declare const VERSION: string

class HLV {
  public static readonly VERSION = VERSION

  private game: Game

  constructor(game: Game) {
    this.game = game
  }

  load(name: string) {
    this.game.load(name)
  }

  setTitle(title: string) {
    this.game.setTitle(title)
  }

  getTitle() {
    return this.game.getTitle()
  }
}

export namespace HLViewer {
  export function init(rootSelector: string, params: Config | string) {
    const node = document.querySelector(rootSelector)
    if (!node) {
      return null
    }

    const config = Config.init(params)
    const result = Game.init(config)
    if (result.status === 'success') {
      const game = result.game
      const ui = new PlayerInterface(game, node)

      ui.draw()
      game.draw()

      return new HLV(game)
    }

    return null
  }
}

if (typeof window !== 'undefined') {
  Object.assign(window, { HLViewer })
}

installRbProbe()
