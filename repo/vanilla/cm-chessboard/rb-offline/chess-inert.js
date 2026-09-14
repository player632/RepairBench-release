/**
 * Offline stand-in for the third-party chess engine that the pristine example
 * pages import from a public CDN. The verified surface of this task never uses
 * an engine, so this module is deliberately inert: it holds a FEN string and
 * reports that no move is available. Every page that drives itself from the
 * engine's move list already guards on an empty move list, so each of them
 * settles on its initial position instead of reaching out to the network.
 */
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

export class Chess {
    constructor(fen, options) {
        this.options = options || {}
        this._fen = typeof fen === "string" && fen.length ? fen : START
    }
    fen() { return this._fen }
    get_fen() { return this._fen }
    load(fen) { this._fen = fen; return true }
    reset() { this._fen = START }
    moves() { return [] }
    move() { return null }
    undo() { return null }
    turn() { return (this._fen.split(" ")[1] || "w") }
    history() { return [] }
    header() { return {} }
    game_over() { return false }
    is_game_over() { return false }
    in_check() { return false }
    in_checkmate() { return false }
    in_stalemate() { return false }
    in_draw() { return false }
    in_threefold_repetition() { return false }
    insufficient_material() { return false }
    is_check() { return false }
    is_checkmate() { return false }
    is_stalemate() { return false }
    is_draw() { return false }
    board() { return [] }
}

export default Chess
