/* RepairBench instrumentation host for summernote (summernote-lite build).
 * Reads a per-checkpoint config blob from localStorage (seeded by the DSL),
 * boots the editor, exposes a window.__SN__ bridge and stamps data-testid
 * probes onto the generated UI. */
(function () {
  'use strict';
  var cfg = {};
  try { cfg = JSON.parse(localStorage.getItem('sn.config.v1') || '{}'); } catch (e) { cfg = {}; }

  var $ = window.jQuery;
  var $note = $('#sn-editor');
  if (typeof cfg.html === 'string') { $note.val(cfg.html); }

  var changes = [];
  var blurFocus = [];

  var options = {
    height: (typeof cfg.height === 'number') ? cfg.height : 350,
    placeholder: (typeof cfg.placeholder === 'string') ? cfg.placeholder : '',
    maxTextLength: (typeof cfg.maxTextLength === 'number') ? cfg.maxTextLength : 0,
    tabDisable: false,
    toolbar: [
      ['style', ['style']],
      ['font', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
      ['fontsize', ['fontsize']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['table', ['table']],
      ['insert', ['link']],
      ['view', ['fullscreen', 'codeview', 'help']],
      ['history', ['undo', 'redo']]
    ]
  };
  if (cfg.hint) { options.hint = cfg.hint; }

  $note.on('summernote.change', function (e, html) { changes.push(String(html)); });
  $note.on('summernote.focusin summernote.focusout', function (e) { blurFocus.push(e.type); });

  $note.summernote(options);

  // ---- testid probes (contenteditable structure + toolbar buttons first) ----
  function stamp(sel, id) {
    var el = document.querySelector(sel);
    if (el) { el.setAttribute('data-testid', id); }
    return el;
  }
  function stampByIcon(iconClass, id) {
    var icon = document.querySelector('.' + iconClass);
    var btn = icon ? icon.closest('button') : null;
    if (btn) { btn.setAttribute('data-testid', id); }
    return btn;
  }
  stamp('.note-editor', 'sn-editor-root');
  stamp('.note-editable', 'sn-editable');
  stamp('.note-codable', 'sn-codable');
  stamp('.note-toolbar', 'sn-toolbar');
  stamp('.note-statusbar', 'sn-statusbar');
  stamp('.note-placeholder', 'sn-placeholder');
  stamp('.note-editing-area', 'sn-editing-area');
  stamp('.note-btn-bold', 'sn-tb-bold');
  stamp('.note-btn-italic', 'sn-tb-italic');
  stamp('.note-btn-underline', 'sn-tb-underline');
  stamp('.note-btn-strikethrough', 'sn-tb-strikethrough');
  stamp('.btn-fullscreen', 'sn-tb-fullscreen');
  stamp('.btn-codeview', 'sn-tb-codeview');
  stampByIcon('note-icon-unorderedlist', 'sn-tb-ul');
  stampByIcon('note-icon-orderedlist', 'sn-tb-ol');
  stampByIcon('note-icon-link', 'sn-tb-link');
  stampByIcon('note-icon-undo', 'sn-tb-undo');
  stampByIcon('note-icon-redo', 'sn-tb-redo');
  stampByIcon('note-icon-question', 'sn-tb-help');
  stamp('.note-link-text', 'sn-link-text');
  stamp('.note-link-url', 'sn-link-url');
  stamp('.note-link-btn', 'sn-link-btn');
  stamp('.note-hint-popover', 'sn-hint-popover');

  // ---- bridge ----
  window.__SN__ = {
    jq: $,
    note: $note[0],
    changes: changes,
    focusEvents: blurFocus,
    ready: true,
    invoke: function () { return $note.summernote.apply($note, Array.prototype.slice.call(arguments)); },
    code: function (html) {
      if (html === undefined) { return $note.summernote('code'); }
      return $note.summernote('code', html);
    },
    editableEl: function () { return document.querySelector('.note-editable'); },
    codableEl: function () { return document.querySelector('.note-codable'); }
  };
})();
