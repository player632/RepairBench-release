/*
 * md-bridge.js - WLB instrumentation bridge for Method Draw.
 *
 * Bridge discipline (S-design rule 2): the bridge object is REINSTALLED on
 * every render tick (canvas changed / selected / zoomed events, plus load).
 * Consumers (DSL checkpoints) must read window.__MD__ fresh on every access
 * and must never cache the bridge object across interactions.
 * All members are getters that read live engine state at call time.
 *
 * svgCanvas.bind() is SINGLE-SLOT (it replaces the previous handler and
 * returns it). The bridge therefore CHAINS each previous handler instead of
 * clobbering it, so editor wiring (selectedChanged / elementChanged /
 * zoom.changed) keeps working exactly as upstream.
 */
(function () {
  function layer () {
    try { return svgCanvas.getCurrentDrawing().getCurrentLayer() } catch (e) { return null }
  }
  function elems () {
    const l = layer()
    if (!l) return []
    return Array.prototype.slice.call(l.children).filter(function (el) {
      return el.tagName !== 'title' && el.tagName !== 'defs'
    })
  }
  function find (id) {
    const c = document.getElementById('svgcontent')
    try { return c ? c.querySelector('#' + id) : null } catch (e) { return null }
  }
  function install () {
    window.__MD__ = {
      v: 3,
      installedAt: Date.now(),
      ready: function () {
        try {
          return !document.body.classList.contains('loading') && !!document.getElementById('svgcontent') && !!layer()
        } catch (e) { return false }
      },
      res: function () {
        try { const r = svgCanvas.getResolution(); return { w: r.w, h: r.h, zoom: r.zoom } } catch (e) { return null }
      },
      zoom: function () { try { return svgCanvas.getZoom() } catch (e) { return -1 } },
      mode: function () { try { return svgCanvas.getMode() } catch (e) { return '' } },
      count: function () { return elems().length },
      ids: function () { return elems().map(function (el) { return el.id }) },
      tags: function () { return elems().map(function (el) { return el.tagName }) },
      attr: function (id, name) { const el = find(id); return el ? el.getAttribute(name) : null },
      bbox: function (id) {
        const el = find(id)
        try { const b = el.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height } } catch (e) { return null }
      },
      texts: function () {
        try {
          const c = document.getElementById('svgcontent')
          return c ? Array.prototype.slice.call(c.querySelectorAll('text')).map(function (t) { return t.textContent }) : []
        } catch (e) { return [] }
      },
      title: function () { try { return svgCanvas.getDocumentTitle() } catch (e) { return '' } },
      sel: function () { try { return editor.selected.filter(Boolean).length } catch (e) { return 0 } },
      selTag: function () {
        try { const s = editor.selected.filter(Boolean); return s.length ? s[0].tagName : '' } catch (e) { return '' }
      },
      selId: function () {
        try { const s = editor.selected.filter(Boolean); return s.length ? s[0].id : '' } catch (e) { return '' }
      },
      groups: function () { return elems().filter(function (el) { return el.tagName === 'g' }).length },
      swatch: function (which) {
        try {
          const el = document.querySelector(which === 'stroke' ? '#stroke_color rect' : '#fill_color rect')
          return el ? el.getAttribute('fill') : null
        } catch (e) { return null }
      },
      selectAll: function () { try { svgCanvas.selectAllInCurrentLayer(); return true } catch (e) { return false } },
      clearSel: function () { try { svgCanvas.clearSelection(); return true } catch (e) { return false } },
      undoStack: function () { try { return svgCanvas.undoMgr.getUndoStackSize() } catch (e) { return -1 } },
      redoStack: function () { try { return svgCanvas.undoMgr.getRedoStackSize() } catch (e) { return -1 } },
      hijackConfirm: function () {
        window.__MD_CONFIRM__ = 0
        window.confirm = function () { window.__MD_CONFIRM__++; return false }
        return true
      }
    }
  }
  function chain (event) {
    var prev = svgCanvas.bind(event, function (w, arg) {
      try { if (prev) prev(w, arg) } finally { try { install() } catch (e) {} }
    })
  }
  install()
  try {
    chain('changed')
    chain('selected')
    chain('zoomed')
  } catch (e) { /* engine not ready: load hook below reinstalls */ }
  window.addEventListener('load', install)
})()
