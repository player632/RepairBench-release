/* RepairBench instrumentation host for cherry-markdown (full UMD build).
 * Reads a per-checkpoint config blob from localStorage (seeded by the DSL),
 * boots the editor with an explicit toolbar surface, exposes a window.__CHERRY__
 * bridge and stamps data-testid probes onto the generated toolbar / editor /
 * previewer DOM (including lazily created dropdown and table-picker items). */
(function () {
  'use strict';

  var cfg = {};
  try { cfg = JSON.parse(localStorage.getItem('ch.config.v1') || '{}'); } catch (e) { cfg = {}; }

  var CherryCtor = window.Cherry && (window.Cherry.default || window.Cherry);
  var changes = [];

  var options = {
    id: 'ch-host',
    value: typeof cfg.value === 'string' ? cfg.value : '# hello\n\nplain **bold** seed',
    editor: { defaultModel: 'edit&preview' },
    toolbars: {
      showToolbar: true,
      toolbar: [
        'bold', 'italic', 'strikethrough', 'underline', '|',
        'header', '|',
        'ul', 'ol', 'checklist', 'quote', '|',
        'link', 'table', 'codeBlock', '|',
        'undo', 'redo', '|',
        'fullScreen', 'switchPreview', 'search',
      ],
      toolbarRight: [],
      bubble: false,
      float: false,
      toc: false,
      sidebar: false,
    },
  };

  var cherry = new CherryCtor(options);

  cherry.on('afterChange', function (msg) {
    changes.push({ t: Date.now(), md: String(msg.markdownText) });
  });

  // ---- probes ----------------------------------------------------------
  function stamp(el, id) {
    if (el && !el.getAttribute('data-testid')) {
      el.setAttribute('data-testid', id);
    }
    return el;
  }

  function stampToolbarButton(btn) {
    var ms = btn.className.match(/cherry-toolbar-([A-Za-z0-9_-]+)/g) || [];
    for (var i = 0; i < ms.length; i += 1) {
      var name = ms[i].slice('cherry-toolbar-'.length);
      if (name !== 'button') {
        stamp(btn, 'ch-tb-' + name);
        break;
      }
    }
  }

  function stampNode(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.classList) {
      if (node.classList.contains('cherry-toolbar-button')) stampToolbarButton(node);
      if (node.classList.contains('cherry-dropdown-item')) {
        var dd = node.closest ? node.closest('.cherry-dropdown') : null;
        var ddName = dd && dd.getAttribute('name') ? dd.getAttribute('name') : 'menu';
        var icon = node.querySelector('i.ch-icon');
        var iconName = icon ? (icon.className.match(/ch-icon-([A-Za-z0-9_-]+)/) || [])[1] : '';
        var title = (node.getAttribute('title') || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        stamp(node, 'ch-dd-' + ddName + '-' + (iconName || title || 'item'));
      }
      if (node.classList.contains('cherry-insert-table-menu-item')) {
        stamp(node, 'ch-tbl-r' + node.getAttribute('data-row') + 'c' + node.getAttribute('data-col'));
      }
    }
    var nested = node.querySelectorAll
      ? node.querySelectorAll('.cherry-toolbar-button, .cherry-dropdown-item, .cherry-insert-table-menu-item')
      : [];
    for (var i = 0; i < nested.length; i += 1) stampNode(nested[i]);
  }

  function stampStatic() {
    stamp(document.querySelector('#ch-host .cherry') || document.querySelector('.cherry'), 'ch-root');
    stamp(document.querySelector('.cherry-toolbar'), 'ch-toolbar');
    stamp(document.querySelector('.cherry-editor'), 'ch-editor');
    stamp(document.querySelector('.cm-editor'), 'ch-cm');
    stamp(document.querySelector('.cm-content'), 'ch-cm-content');
    stamp(document.querySelector('.cherry-previewer'), 'ch-previewer');
    stamp(document.querySelector('.cherry-drag'), 'ch-drag');
    /* the table-picker grid (BubbleTableMenu) and any pre-created dropdown
     * items exist from construction time, before the observer is attached,
     * so they must be stamped here as well */
    var items = document.querySelectorAll(
      '.cherry-toolbar-button, .cherry-dropdown-item, .cherry-insert-table-menu-item',
    );
    for (var i = 0; i < items.length; i += 1) stampNode(items[i]);
  }

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i += 1) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j += 1) stampNode(added[j]);
    }
  });

  function view() { return cherry.editor.editor.view; }
  function doc() { return view().state.doc; }
  function previewerDom() { return document.querySelector('.cherry-previewer'); }

  window.__CHERRY__ = {
    ready: true,
    /* live reads straight from the CodeMirror document / the engine, so the
     * bridge never serves the debounced lastMarkdownText cache */
    code: function () { return doc().toString(); },
    html: function () { return cherry.engine.makeHtml(doc().toString()); },
    insert: function (s) { cherry.insert(String(s)); return true; },
    setValue: function (s) { cherry.setValue(String(s)); return true; },
    switchModel: function (m) { cherry.switchModel(m); return true; },
    select: function (fromLine, fromCh, toLine, toCh) {
      var d = doc();
      var from = d.line(fromLine + 1).from + fromCh;
      var to = d.line(toLine + 1).from + toCh;
      view().dispatch({ selection: { anchor: from, head: to } });
      view().focus();
      return true;
    },
    cursor: function (line, ch) { return window.__CHERRY__.select(line, ch, line, ch); },
    changes: changes,
    clearChanges: function () { changes.length = 0; return true; },
    editorScrollTop: function () { return cherry.editor.editor.scrollDOM.scrollTop; },
    editorScrollMax: function () {
      var s = cherry.editor.editor.scrollDOM;
      return s.scrollHeight - s.clientHeight;
    },
    setEditorScrollTop: function (y) {
      cherry.editor.editor.scrollDOM.scrollTop = y;
      return cherry.editor.editor.scrollDOM.scrollTop;
    },
    previewScrollTop: function () {
      var p = previewerDom();
      return p ? p.scrollTop : -1;
    },
    previewScrollMax: function () {
      var p = previewerDom();
      return p ? p.scrollHeight - p.clientHeight : -1;
    },
    setPreviewScrollTop: function (y) {
      var p = previewerDom();
      if (p) p.scrollTop = y;
      return p ? p.scrollTop : -1;
    }
  };

  stampStatic();
  var mount = document.querySelector('#ch-host');
  if (mount) observer.observe(mount, { childList: true, subtree: true });
})();
