// instrumentation: read-only probe bridge for verification (window.__TETRIS__)
import { List } from 'immutable';
import actions from './actions';

export function installProbe(store) {
  const read = () => {
    const s = store.getState();
    const cur = s.get('cur');
    const matrix = s.get('matrix');
    const rows = [];
    matrix.forEach((line) => {
      const r = [];
      line.forEach((n) => r.push(n ? 1 : 0));
      rows.push(r);
    });
    let lowest = -1;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].some(Boolean)) { lowest = i; break; }
    }
    return {
      points: s.get('points'),
      max: s.get('max'),
      clearLines: s.get('clearLines'),
      speedRun: s.get('speedRun'),
      speedStart: s.get('speedStart'),
      startLines: s.get('startLines'),
      pause: s.get('pause'),
      lock: s.get('lock'),
      reset: s.get('reset'),
      music: s.get('music'),
      cur: cur ? { type: cur.type, xy: [cur.xy.get(0), cur.xy.get(1)], rotateIndex: cur.rotateIndex } : null,
      next: s.get('next'),
      rows,
      filled: rows.reduce((a, r) => a + r.filter(Boolean).length, 0),
      lowestFilledRow: lowest,
    };
  };
  window.__TETRIS__ = {
    read,
    // test fixtures: deterministic piece placement for verification
    forcePiece: (type) => {
      store.dispatch(actions.moveBlock({ type }));
      return true;
    },
    setMatrix: (rows) => {
      store.dispatch(actions.matrix(List(rows.map(r => List(r)))));
      return true;
    },
  };
}
