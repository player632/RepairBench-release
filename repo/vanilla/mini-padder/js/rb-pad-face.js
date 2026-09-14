/*
 * rb-pad-face.js - offline verification fixture: a read-only view of this page.
 *
 * Verification runs need to read what the application ended up doing, and they
 * need to drive its own handlers through real DOM events. This file provides
 * exactly those two things and nothing else:
 *
 *   window.__rbState()  a recomputed-on-every-call READ-ONLY snapshot of the
 *                       page, flattened into scalar fields (strings, numbers,
 *                       booleans, null). Every field is safe-wrapped: a missing
 *                       or broken shape comes back as an 'ERR' sentinel string
 *                       instead of throwing, so a broken page is reported as a
 *                       failed expectation and never as a crashed run.
 *   window.__rbCmd      a small surface that drives the SEED'S OWN handlers by
 *                       dispatching real events on real nodes (a click on the
 *                       management button, a change on a select or an input, a
 *                       mouseenter on the layout box) or by calling the
 *                       application's own methods. It never pokes private state
 *                       and never repairs anything.
 *
 * Deliberately NOT exposed: wall-clock readings, frame counters, animation
 * timestamps and anything else that moves between two identical runs. Fields
 * published here were selected because three consecutive runs in three fresh
 * browser contexts produced byte-identical values for every one of them.
 *
 * This file reads the application; it does not modify, wrap or replace any
 * application behaviour.
 */
(function () {
  'use strict';

  var rec = {
    gc: 0,
    pgc: 0,
    trail: [],
    last: null,
    lastSlot: -1
  };

  window.addEventListener('gamepadChange', function () { rec.gc++; });
  window.addEventListener('processedGamepadChange', function (e) {
    rec.pgc++;
    try {
      var d = e.detail;
      for (var k = 0; k < 4; k++) {
        if (d && d[k]) {
          rec.last = d[k];
          rec.lastSlot = k;
          rec.trail.push((d[k].id ? d[k].id.gamepadId : '?') + '/' + (d[k].mappingId || '?'));
        }
      }
    } catch (err) { rec.last = 'unserializable'; }
  });

  function has(name) {
    try {
      /* eslint-disable no-eval */
      return eval('typeof ' + name + ' !== "undefined"') ? eval(name) : null;
    } catch (e) { return null; }
  }
  function safe(fn, fallback) {
    try { var v = fn(); return v === undefined ? 'undef' : v; }
    catch (e) { return fallback === undefined ? 'ERR' : fallback; }
  }
  function enc(v) {
    if (v === null) { return 'null'; }
    if (v === undefined) { return 'undef'; }
    if (typeof v === 'object') { return JSON.stringify(v); }
    return String(v);
  }
  /* a buttonChange (or null) flattened to one comparable scalar */
  function bc(v) {
    if (v === null) { return 'null'; }
    if (v === undefined) { return 'undef'; }
    if (typeof v !== 'object') { return enc(v); }
    return enc(v.value) + '/' + enc(v.delta) + '/' + enc(v.pressed);
  }
  function stick(v, prop) {
    if (v === null || v === undefined) { return 'null'; }
    if (!v[prop]) { return 'nil'; }
    return Array.isArray(v[prop]) ? v[prop].map(enc).join(',') : enc(v[prop]);
  }
  function el(sel) { return document.querySelector(sel); }
  function els(sel) { return Array.from(document.querySelectorAll(sel)); }

  window.__rbState = function () {
    var W = has('Watcher'), M = has('Mapper'), R = has('Renderer'), Cp = has('Cp'),
      Obte = has('Obte'), Lg = has('Logger'), MM = has('MappingManager');
    var p = (rec.last && typeof rec.last === 'object') ? rec.last : null;
    var cc = document.getElementById('canvas-container');
    var cpDom = document.getElementById('control-panel');
    var o = {};

    o.ready = !!(W && M && R && Cp && window.__rbPad);

    /* ---- watcher / connection ---- */
    o.wConn = safe(function () { return W.connectionAmount; }, -1);
    o.wOnLoop = safe(function () { return W.onLoop; }, 'ERR');
    o.wPadKeys = safe(function () { return Object.keys(W.gamepads).sort().join(','); }, 'ERR');
    o.wPadIds = safe(function () { return (W.gamepadId || []).filter(Boolean).map(function (x) { return x.gamepadId; }).join(','); }, 'ERR');
    o.wPadNames = safe(function () { return (W.gamepadId || []).filter(Boolean).map(function (x) { return x.name; }).join('|'); }, 'ERR');
    o.wPadIdCount = safe(function () { return (W.gamepadId || []).filter(Boolean).length; }, -1);
    o.wBrowser = safe(function () { return String(W.browser); }, 'ERR');

    /* ---- event bridge counters ---- */
    o.gcCount = rec.gc;
    o.pgcCount = rec.pgc;
    o.procTrail = rec.trail.join('>');
    o.procLastSlot = rec.lastSlot;

    /* ---- last processed gamepad change (scalars only) ---- */
    o.lpGameId = safe(function () { return p ? enc(p.id && p.id.gamepadId) : 'none'; }, 'ERR');
    o.lpGameName = safe(function () { return p ? enc(p.id && p.id.name) : 'none'; }, 'ERR');
    o.lpMappingId = safe(function () { return p ? enc(p.mappingId) : 'none'; }, 'ERR');
    o.lpProps = safe(function () { return p ? (p.properties || []).join(',') : 'none'; }, 'ERR');
    o.lpStickKeys = safe(function () { return p ? Object.keys(p.sticks || {}).sort().join(',') : 'none'; }, 'ERR');
    o.lpLValue = safe(function () { return p ? stick(p.sticks ? p.sticks.left : null, 'value') : 'none'; }, 'ERR');
    o.lpLDelta = safe(function () { return p ? stick(p.sticks ? p.sticks.left : null, 'delta') : 'none'; }, 'ERR');
    o.lpLActive = safe(function () { return p && p.sticks && p.sticks.left ? enc(p.sticks.left.active) : 'none'; }, 'ERR');
    o.lpLPressed = safe(function () { return p && p.sticks && p.sticks.left ? enc(p.sticks.left.pressed) : 'none'; }, 'ERR');
    o.lpRValue = safe(function () { return p ? stick(p.sticks ? p.sticks.right : null, 'value') : 'none'; }, 'ERR');
    o.lpRActive = safe(function () { return p && p.sticks && p.sticks.right ? enc(p.sticks.right.active) : 'none'; }, 'ERR');
    o.lpDpadUp = safe(function () { return p ? bc(p.buttons && p.buttons.dpad ? p.buttons.dpad.up : null) : 'none'; }, 'ERR');
    o.lpDpadDown = safe(function () { return p ? bc(p.buttons && p.buttons.dpad ? p.buttons.dpad.down : null) : 'none'; }, 'ERR');
    o.lpDpadLeft = safe(function () { return p ? bc(p.buttons && p.buttons.dpad ? p.buttons.dpad.left : null) : 'none'; }, 'ERR');
    o.lpDpadRight = safe(function () { return p ? bc(p.buttons && p.buttons.dpad ? p.buttons.dpad.right : null) : 'none'; }, 'ERR');
    o.lpDpadState = safe(function () { return p ? enc(p.buttons && p.buttons.dpad ? p.buttons.dpad.value : null) : 'none'; }, 'ERR');
    o.lpFaceDown = safe(function () { return p ? bc(p.buttons && p.buttons.face ? p.buttons.face.down : null) : 'none'; }, 'ERR');
    o.lpFaceUp = safe(function () { return p ? bc(p.buttons && p.buttons.face ? p.buttons.face.up : null) : 'none'; }, 'ERR');
    o.lpFaceL3 = safe(function () { return p ? bc(p.buttons && p.buttons.face ? p.buttons.face.l3 : null) : 'none'; }, 'ERR');
    o.lpFaceR3 = safe(function () { return p ? bc(p.buttons && p.buttons.face ? p.buttons.face.r3 : null) : 'none'; }, 'ERR');
    o.lpFaceSelect = safe(function () { return p ? bc(p.buttons && p.buttons.face ? p.buttons.face.select : null) : 'none'; }, 'ERR');
    o.lpShR1 = safe(function () { return p ? bc(p.buttons && p.buttons.shoulder ? p.buttons.shoulder.r1 : null) : 'none'; }, 'ERR');
    o.lpShR2 = safe(function () { return p ? bc(p.buttons && p.buttons.shoulder ? p.buttons.shoulder.r2 : null) : 'none'; }, 'ERR');
    o.lpShL1 = safe(function () { return p ? bc(p.buttons && p.buttons.shoulder ? p.buttons.shoulder.l1 : null) : 'none'; }, 'ERR');
    o.lpShL2 = safe(function () { return p ? bc(p.buttons && p.buttons.shoulder ? p.buttons.shoulder.l2 : null) : 'none'; }, 'ERR');

    /* ---- mapping table ---- */
    o.mapKeyCount = safe(function () { return Object.keys(M.mappings).length; }, -1);
    o.mapKeys = safe(function () { return Object.keys(M.mappings).sort().join(','); }, 'ERR');
    o.mapDpadState = safe(function () { return JSON.stringify(M.dpadState); }, 'ERR');
    o.mapXinputName = safe(function () { return enc(M.mappings.XInput && M.mappings.XInput.name); }, 'ERR');
    o.mapXinputL3 = safe(function () { return enc(M.mappings.XInput.buttons.face.l3); }, 'ERR');
    o.mapXinputR3 = safe(function () { return enc(M.mappings.XInput.buttons.face.r3); }, 'ERR');
    o.mapDinputL3 = safe(function () { return enc(M.mappings.DInput.buttons.face.l3); }, 'ERR');
    o.mapDinputR3 = safe(function () { return enc(M.mappings.DInput.buttons.face.r3); }, 'ERR');
    o.mapDinputLeftDeadzone = safe(function () { return enc(M.mappings.DInput.sticks.left.deadzone); }, 'ERR');
    o.mapXinputLeftDeadzone = safe(function () { return enc(M.mappings.XInput.sticks.left.deadzone); }, 'ERR');
    o.mapDsLeftDeadzone = safe(function () { return enc(M.mappings['054c0ce6'].sticks.left.deadzone); }, 'ERR');
    o.mapDsRightDeadzone = safe(function () { return enc(M.mappings['054c0ce6'].sticks.right.deadzone); }, 'ERR');
    o.mapDsSticksDeadzoneKey = safe(function () { return M.mappings['054c0ce6'].sticks.hasOwnProperty('deadzone'); }, 'ERR');
    o.mapXinputSticksDeadzoneKey = safe(function () { return M.mappings.XInput.sticks.hasOwnProperty('deadzone'); }, 'ERR');
    o.mapDsProps = safe(function () { return (M.mappings['054c0ce6'].properties || []).join(','); }, 'ERR');
    o.mapQanbaProps = safe(function () { return (M.mappings['0f30'].properties || []).join(','); }, 'ERR');
    o.mapUnknownName = safe(function () { return enc(M.mappings['00000000'] && M.mappings['00000000'].name); }, 'ERR');
    o.mapAssignmentOngoing = safe(function () { return M.assignmentState.map(function (a) { return a.ongoing ? 1 : 0; }).join(''); }, 'ERR');
    o.mapMappedIdFor045e028e = safe(function () { return enc(M.getMappedGamepadId('045e028e')); }, 'ERR');
    o.mapMappedIdForXInput = safe(function () { return enc(M.getMappedGamepadId('XInput')); }, 'ERR');
    o.mapMappedIdFor0f300001 = safe(function () { return enc(M.getMappedGamepadId('0f300001')); }, 'ERR');
    o.mapMappedIdFor1234abcd = safe(function () { return enc(M.getMappedGamepadId('1234abcd')); }, 'ERR');
    o.mapEveryButtonInfoLen = safe(function () { return MM.everyButtonInfo.length; }, -1);

    /* ---- persistence ---- */
    o.lsKeys = safe(function () { return Object.keys(localStorage).sort().join(','); }, 'ERR');
    o.lsKeyCount = safe(function () { return Object.keys(localStorage).length; }, -1);
    o.lsHasMappings = safe(function () { return localStorage.getItem('mappings') !== null; }, 'ERR');
    o.lsMappingsLen = safe(function () { return (localStorage.getItem('mappings') || '').length; }, -1);
    o.lsMappingsKeyCount = safe(function () { var v = localStorage.getItem('mappings'); return v ? Object.keys(JSON.parse(v)).length : -1; }, -2);
    o.lsHasVersion = safe(function () { return localStorage.getItem('version') !== null; }, 'ERR');
    o.lsVersionValue = safe(function () { return enc(localStorage.getItem('version')); }, 'ERR');
    o.lsHasSkinList = safe(function () { return localStorage.getItem('skinList') !== null; }, 'ERR');
    o.lsSkinListLen = safe(function () { return (localStorage.getItem('skinList') || '').length; }, -1);
    o.lsSkinListCount = safe(function () { var v = localStorage.getItem('skinList'); return v ? JSON.parse(v).length : -1; }, -2);
    o.lsHasFadeOption = safe(function () { return localStorage.getItem('fadeOption') !== null; }, 'ERR');
    o.lsFadeTimeJson = safe(function () { var v = JSON.parse(localStorage.getItem('fadeOption')); return JSON.stringify(v.time); }, 'ERR');
    o.lsFadeOpacityJson = safe(function () { var v = JSON.parse(localStorage.getItem('fadeOption')); return JSON.stringify(v.opacity); }, 'ERR');
    o.lsFadeDuration = safe(function () { var v = JSON.parse(localStorage.getItem('fadeOption')); return enc(v.duration); }, 'ERR');
    o.lsHasControlPanelValues = safe(function () { return localStorage.getItem('controlPanelValues') !== null; }, 'ERR');
    o.lsCpvKeys = safe(function () { var v = JSON.parse(localStorage.getItem('controlPanelValues')); return Object.keys(v).sort().join(','); }, 'ERR');
    o.lsCpvDisplayWidth = safe(function () { var v = JSON.parse(localStorage.getItem('controlPanelValues')); return enc(v.displayWidth); }, 'ERR');
    o.lsCpvFadeout0 = safe(function () { var v = JSON.parse(localStorage.getItem('controlPanelValues')); return enc(v.fadeout && v.fadeout[0]); }, 'ERR');
    o.lsCpvLayout = safe(function () { var v = JSON.parse(localStorage.getItem('controlPanelValues')); return enc(v.layout); }, 'ERR');
    o.lsHasCustomSkin = safe(function () { return localStorage.getItem('customskin') !== null; }, 'ERR');

    /* ---- renderer: skin list / mapping ---- */
    o.skinListSize = safe(function () { return R.skinList.size; }, -1);
    o.skinListHasHbox = safe(function () { return R.skinList.has('hbox'); }, 'ERR');
    o.skinListHasBiker = safe(function () { return R.skinList.has('biker'); }, 'ERR');
    o.skinListHasMegapad = safe(function () { return R.skinList.has('megapad'); }, 'ERR');
    o.skinListHasMegapadX = safe(function () { return R.skinList.has('megapad-x'); }, 'ERR');
    o.skinListHasMegapadD = safe(function () { return R.skinList.has('megapad-d'); }, 'ERR');
    o.skinListHasXinput = safe(function () { return R.skinList.has('gamepad-xinput'); }, 'ERR');
    o.skinListHasDinput = safe(function () { return R.skinList.has('gamepad-dinput'); }, 'ERR');
    o.skinListDisplayNameHbox = safe(function () { return enc(R.skinList.get('hbox')); }, 'ERR');
    o.skinsLoadedCount = safe(function () { return Object.keys(R.skins).filter(function (k) { return R.skins[k] && R.skins[k].loaded; }).length; }, -1);
    o.skinLoadedHbox = safe(function () { return !!(R.skins['hbox'] && R.skins['hbox'].loaded); }, 'ERR');
    o.skinLoadedBiker = safe(function () { return !!(R.skins['biker'] && R.skins['biker'].loaded); }, 'ERR');
    o.skinLoadedXinput = safe(function () { return !!(R.skins['gamepad-xinput'] && R.skins['gamepad-xinput'].loaded); }, 'ERR');
    o.skinEntryCount = safe(function () { return Object.keys(R.skins).length; }, -1);
    o.skinMappingKeys = safe(function () { return Object.keys(R.skinMapping).sort().join(','); }, 'ERR');
    o.skinMappingJson = safe(function () { return JSON.stringify(R.skinMapping); }, 'ERR');
    o.skinMappingFor045e = safe(function () { return enc(R.skinMapping['045e028e']); }, 'ERR');
    o.skinMappingForXInput = safe(function () { return enc(R.skinMapping['XInput']); }, 'ERR');
    o.skinMappingForxinput = safe(function () { return enc(R.skinMapping['xinput']); }, 'ERR');
    o.skinMappingForDInput = safe(function () { return enc(R.skinMapping['DInput']); }, 'ERR');
    o.fallbackSkinsJson = safe(function () { return JSON.stringify(R.fallbackSkins); }, 'ERR');
    o.defaultSkinForXInput = safe(function () { return enc(R.findDefaultSkin('XInput', [])); }, 'ERR');
    o.defaultSkinFor045e = safe(function () { return enc(R.findDefaultSkin('045e028e', [])); }, 'ERR');
    o.defaultSkinForJoystick = safe(function () { return enc(R.findDefaultSkin('0f300001', ['joystick'])); }, 'ERR');
    o.maxCanvasSizeJson = safe(function () { return JSON.stringify(R.maxCanvasSize); }, 'ERR');
    o.renderPending = safe(function () { return R.renderPending; }, 'ERR');

    /* ---- renderer: slots and canvas geometry ---- */
    o.slotCount = safe(function () { return R.skinSlot.filter(Boolean).length; }, -1);
    o.slot0Name = safe(function () { return enc(R.skinSlot[0] && R.skinSlot[0].internalName); }, 'ERR');
    o.slot0GamepadId = safe(function () { return enc(R.skinSlot[0] && R.skinSlot[0].gamepadId); }, 'ERR');
    o.slot0Layers = safe(function () { return R.skinSlot[0] ? R.skinSlot[0].layer.length : -1; }, -2);
    o.slot0ActiveStateReady = safe(function () { return R.skinSlot[0] ? R.skinSlot[0].activeStateReady : 'noslot'; }, 'ERR');
    o.slot1Name = safe(function () { return enc(R.skinSlot[1] && R.skinSlot[1].internalName); }, 'ERR');
    o.slot1GamepadId = safe(function () { return enc(R.skinSlot[1] && R.skinSlot[1].gamepadId); }, 'ERR');
    o.canvasTotal = safe(function () { return document.querySelectorAll('canvas').length; }, -1);
    o.canvasInContainer = safe(function () { return cc ? cc.querySelectorAll('canvas').length : -1; }, -2);
    o.canvasSizes = safe(function () { return cc ? Array.from(cc.querySelectorAll('canvas')).map(function (c) { return c.width + 'x' + c.height; }).join('|') : ''; }, 'ERR');
    o.canvasDatasetIds = safe(function () { return R.canvas.map(function (d) { return (d && d.dataset && d.dataset.id) || '-'; }).join(','); }, 'ERR');
    o.slotDivChildren = safe(function () { return cc ? Array.from(cc.children).map(function (d) { return d.children.length; }).join(',') : ''; }, 'ERR');
    o.slotDivCount = safe(function () { return cc ? cc.children.length : -1; }, -2);
    o.layer0Top = safe(function () { return R.skinSlot[0] && R.skinSlot[0].layer[0] ? R.skinSlot[0].layer[0].style.top : 'noslot'; }, 'ERR');
    o.layer0Left = safe(function () { return R.skinSlot[0] && R.skinSlot[0].layer[0] ? R.skinSlot[0].layer[0].style.left : 'noslot'; }, 'ERR');
    o.layer0Width = safe(function () { return R.skinSlot[0] && R.skinSlot[0].layer[0] ? R.skinSlot[0].layer[0].width : -1; }, -2);
    o.layer0Height = safe(function () { return R.skinSlot[0] && R.skinSlot[0].layer[0] ? R.skinSlot[0].layer[0].height : -1; }, -2);
    o.layer1Top = safe(function () { return R.skinSlot[0] && R.skinSlot[0].layer[1] ? R.skinSlot[0].layer[1].style.top : 'noslot'; }, 'ERR');
    o.layer1Left = safe(function () { return R.skinSlot[0] && R.skinSlot[0].layer[1] ? R.skinSlot[0].layer[1].style.left : 'noslot'; }, 'ERR');
    o.layerLastTop = safe(function () { var s = R.skinSlot[0]; return s && s.layer.length ? s.layer[s.layer.length - 1].style.top : 'noslot'; }, 'ERR');
    o.layerLastLeft = safe(function () { var s = R.skinSlot[0]; return s && s.layer.length ? s.layer[s.layer.length - 1].style.left : 'noslot'; }, 'ERR');
    o.layerOffsets = safe(function () {
      var s = R.skinSlot[0]; if (!s) { return 'noslot'; }
      return s.layer.map(function (l) { return l.style.left + ',' + l.style.top; }).join('|');
    }, 'ERR');
    o.orderStickJson = safe(function () { return JSON.stringify(R.order.stick); }, 'ERR');
    o.orderButtonGroupJson = safe(function () { return JSON.stringify(R.order.buttonGroup); }, 'ERR');

    /* ---- renderer: fade-out option ---- */
    o.fadeTimeJson = safe(function () { return JSON.stringify(R.fadeout.time); }, 'ERR');
    o.fadeTime0 = safe(function () { return R.fadeout.time[0]; }, 'ERR');
    o.fadeTime1 = safe(function () { return R.fadeout.time[1]; }, 'ERR');
    o.fadeTime2 = safe(function () { return R.fadeout.time[2]; }, 'ERR');
    o.fadeTimeCount = safe(function () { return R.fadeout.time.length; }, -1);
    o.fadeOpacityJson = safe(function () { return JSON.stringify(R.fadeout.opacity); }, 'ERR');
    o.fadeDuration = safe(function () { return R.fadeout.duration; }, 'ERR');
    o.fadeDeltaCount = safe(function () { return R.fadeout.deltaOpacity.length; }, -1);
    o.fadeDelta0 = safe(function () { return String(R.fadeout.deltaOpacity[0]); }, 'ERR');
    o.fadeDelta1 = safe(function () { return String(R.fadeout.deltaOpacity[1]); }, 'ERR');
    o.fadeDelta2 = safe(function () { return String(R.fadeout.deltaOpacity[2]); }, 'ERR');
    o.fadeTotalTime = safe(function () { return R.fadeout.totalTime; }, 'ERR');
    o.fadeFps = safe(function () { return R.fadeoutFps; }, -1);
    o.fadeTextArrayJson = safe(function () { return JSON.stringify(R.getFadeoutOptionAsTextArray()); }, 'ERR');
    o.fadeTextArray0 = safe(function () { return String(R.getFadeoutOptionAsTextArray()[0]); }, 'ERR');

    /* ---- control panel DOM ---- */
    o.cpOptions = safe(function () { return cpDom ? cpDom.querySelectorAll('.option').length : -1; }, -2);
    o.cpInputs = safe(function () { return cpDom ? cpDom.querySelectorAll('input').length : -1; }, -2);
    o.cpSelects = safe(function () { return cpDom ? cpDom.querySelectorAll('select').length : -1; }, -2);
    o.cpButtons = safe(function () { return cpDom ? cpDom.querySelectorAll('button').length : -1; }, -2);
    o.cpPanelValueKeys = safe(function () { return Object.keys(Cp.panelValues).sort().join(','); }, 'ERR');
    o.cpPanelKeys = safe(function () { return Object.keys(Cp.panel).sort().join(','); }, 'ERR');
    o.layoutSelectCount = safe(function () { return document.querySelectorAll('div[data-name="layout"] select').length; }, -1);
    o.layoutSelectOptions = safe(function () { var s = el('div[data-name="layout"] select'); return s ? s.options.length : -1; }, -2);
    o.layoutSelect0Value = safe(function () { var s = el('div[data-name="layout"] select'); return s ? enc(s.value) : 'ERR'; }, 'ERR');
    o.layoutSelect0Index = safe(function () { var s = el('div[data-name="layout"] select'); return s ? s.selectedIndex : -1; }, -2);
    o.layoutSelect1Value = safe(function () { var s = document.querySelectorAll('div[data-name="layout"] select')[1]; return s ? enc(s.value) : 'ERR'; }, 'ERR');
    o.layoutHasHboxOption = safe(function () { var s = el('div[data-name="layout"] select'); return s ? !!s.options.namedItem('hbox') : 'ERR'; }, 'ERR');
    o.layoutHasMegapadXOption = safe(function () { var s = el('div[data-name="layout"] select'); return s ? !!s.options.namedItem('megapad-x') : 'ERR'; }, 'ERR');
    o.layoutLabel0Html = safe(function () { return enc(el('div[data-name="layout"] label span').innerHTML); }, 'ERR');
    o.layoutLabel0Name = safe(function () { return enc(el('div[data-name="layout"] label span').dataset.name); }, 'ERR');
    o.layoutLabel0GamepadId = safe(function () { return enc(el('div[data-name="layout"] label span').dataset.gamepadId); }, 'ERR');
    o.layoutLabel0Inactive = safe(function () { return el('div[data-name="layout"] label').classList.contains('inactive'); }, 'ERR');
    o.fadeInput0 = safe(function () { return enc(document.querySelectorAll('div[data-name="fade"] input')[0].value); }, 'ERR');
    o.fadeInput1 = safe(function () { return enc(document.querySelectorAll('div[data-name="fade"] input')[1].value); }, 'ERR');
    o.fadeInput2 = safe(function () { return enc(document.querySelectorAll('div[data-name="fade"] input')[2].value); }, 'ERR');
    o.fadeInputCount = safe(function () { return document.querySelectorAll('div[data-name="fade"] input').length; }, -1);
    o.displayWidthValue = safe(function () { return enc(el('div[data-name="displayWidth"] input').value); }, 'ERR');
    o.displayWidthMin = safe(function () { return enc(el('div[data-name="displayWidth"] input').min); }, 'ERR');
    o.displayWidthMax = safe(function () { return enc(el('div[data-name="displayWidth"] input').max); }, 'ERR');
    o.displayWidthStep = safe(function () { return enc(el('div[data-name="displayWidth"] input').step); }, 'ERR');
    o.canvasContainerWidth = safe(function () { return enc(cc && cc.dataset.width); }, 'ERR');
    o.sizeDescriptorText = safe(function () { var d = document.getElementById('displaySizeDescriptor'); return d ? enc(d.textContent.replace(/\u00a0/g, ' ').trim()) : 'ERR'; }, 'ERR');
    o.alertCount = safe(function () { return els('.cpMessage').length; }, -1);
    o.alertClassNames = safe(function () { return els('.cpMessage').map(function (a) { return a.className.replace('vertical-space-but-no-divider cpMessage', '').trim(); }).join('|'); }, 'ERR');
    o.cpAlertsLength = safe(function () { return Cp.alerts.length; }, -1);
    o.deadzoneButtonCount = safe(function () { return document.querySelectorAll('#deadzoneUpdate div').length; }, -1);
    o.deadzoneLabel0 = safe(function () { return enc(document.querySelectorAll('#deadzoneUpdate button')[0].textContent); }, 'ERR');
    o.assignButtonCount = safe(function () { return document.querySelectorAll('#inputAssignment button').length; }, -1);
    o.managementButtonNames = safe(function () { return els('div[data-name="management"] button').map(function (b) { return b.dataset.name; }).join(','); }, 'ERR');

    /* ---- on-browser text editor ---- */
    o.editorExists = safe(function () { return !!Obte && !!Obte.dom; }, 'ERR');
    o.editorVisible = safe(function () { return Obte.dom.wrapper.classList.contains('active'); }, 'ERR');
    o.editorInactive = safe(function () { return Obte.dom.wrapper.classList.contains('inactive'); }, 'ERR');
    o.editorTitle = safe(function () { return enc(Obte.dom.title.innerText); }, 'ERR');
    o.editorTextareaLen = safe(function () { return Obte.dom.textarea.value.length; }, -1);
    o.editorTextareaHead = safe(function () { return Obte.dom.textarea.value.slice(0, 40); }, 'ERR');
    o.editorTextareaLines = safe(function () { return Obte.dom.textarea.value.split('\n').length; }, -1);
    o.editorNotify = safe(function () { return enc(Obte.dom.notifyArea.innerText); }, 'ERR');
    o.editorNotifyVisible = safe(function () { return Obte.dom.notifyArea.classList.contains('visible'); }, 'ERR');
    o.editorNotifyError = safe(function () { return Obte.dom.notifyArea.classList.contains('error'); }, 'ERR');
    o.editorSaveDisabled = safe(function () { return Obte.dom.saveButton.disabled; }, 'ERR');
    o.editorLoadDisabled = safe(function () { return Obte.dom.loadButton.disabled; }, 'ERR');
    o.editorButtonCount = safe(function () { return Obte.dom.buttonDiv.getElementsByTagName('button').length; }, -1);
    o.editorProtectionDuration = safe(function () { return Obte.buttonProtectionDuration; }, -1);

    /* ---- page level ---- */
    o.versionText = safe(function () { var v = el('.version'); return v ? enc(v.textContent) : 'ERR'; }, 'ERR');
    o.versionDomCount = safe(function () { return els('.version').length; }, -1);
    o.errorLogLen = safe(function () { return Lg.errorLog.length; }, -1);
    o.errorLogHeadLen = safe(function () { return Lg.errorLog[0].length; }, -1);
    o.pageErrorCount = safe(function () { return window.__rbPad.snapshot().errCount; }, -1);
    o.pageErrorHead = safe(function () { var e = window.__rbPad.errors(); return e.length ? enc(e[0].msg) : 'none'; }, 'ERR');
    o.stubConnected = safe(function () { return window.__rbPad.snapshot().connected; }, 'ERR');
    o.stubConnectedCount = safe(function () { return window.__rbPad.snapshot().connectedCount; }, -1);
    o.stubFires = safe(function () { return window.__rbPad.snapshot().fires; }, 'ERR');
    o.docTitle = safe(function () { return enc(document.title); }, 'ERR');
    o.bodyWidth = safe(function () { return document.body.offsetWidth; }, -1);

    return o;
  };

  /* ---- command surface: drives the seed's own handlers, nothing else ---- */
  function clickNode(node) {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }
  function changeNode(node) {
    node.dispatchEvent(new Event('change', { bubbles: true }));
  }

  window.__rbCmd = {
    /* connect / drive pads through the fixture */
    connect: function (index, id, opts) { return window.__rbPad.connect(index, Object.assign({ id: id }, opts || {})); },
    disconnect: function (index) { return window.__rbPad.disconnect(index); },
    press: function (index, bi, v) { return window.__rbPad.press(index, bi, v); },
    axis: function (index, ai, v) { return window.__rbPad.axis(index, ai, v); },
    frame: function (index, a, b) { return window.__rbPad.frame(index, a, b); },

    /* control panel: management buttons open the on-browser text editor */
    openManagement: function (name) {
      var b = els('div[data-name="management"] button').filter(function (x) { return x.dataset.name === name; })[0];
      if (!b) { return 'no-button:' + name; }
      clickNode(b);
      return 'clicked:' + name;
    },
    setEditorText: function (text) {
      var t = has('Obte'); if (!t) { return 'no-editor'; }
      t.dom.textarea.value = text;
      return t.dom.textarea.value.length;
    },
    saveEditor: function () { var t = has('Obte'); if (!t) { return 'no-editor'; } t.saveFromEditor(); return 'saved'; },
    loadEditor: function () { var t = has('Obte'); if (!t) { return 'no-editor'; } t.loadToEditor(); return 'loaded'; },
    closeEditor: function () { var t = has('Obte'); if (!t) { return 'no-editor'; } t.visibility = false; return 'closed'; },
    clickEditorClose: function () { var t = has('Obte'); if (!t) { return 'no-editor'; } clickNode(t.dom.wrapper.querySelector('button.close')); return 'clicked'; },

    /* control panel: layout select per slot */
    hoverLayout: function () {
      var c = el('div[data-name="layout"]');
      if (!c) { return 'no-container'; }
      c.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, cancelable: false, view: window }));
      return 'entered';
    },
    chooseLayout: function (slotIndex, value) {
      var s = document.querySelectorAll('div[data-name="layout"] select')[slotIndex];
      if (!s) { return 'no-select'; }
      s.value = value;
      changeNode(s);
      return s.value;
    },

    /* control panel: fade-out text array */
    setFadeInputs: function (timeStr, opacityStr, durationStr) {
      var ins = document.querySelectorAll('div[data-name="fade"] input');
      if (ins.length < 3) { return 'no-inputs'; }
      var vals = [timeStr, opacityStr, durationStr];
      for (var i = 0; i < 3; i++) {
        if (vals[i] === null || vals[i] === undefined) { continue; }
        ins[i].value = vals[i];
        changeNode(ins[i]);
      }
      return [ins[0].value, ins[1].value, ins[2].value].join('|');
    },

    /* control panel: display width slider */
    setDisplayWidth: function (v) {
      var i = el('div[data-name="displayWidth"] input');
      if (!i) { return 'no-input'; }
      i.value = String(v);
      changeNode(i);
      return i.value;
    },

    /* control panel: alerts */
    clickAlert: function (n) { var a = els('.cpMessage')[n || 0]; if (!a) { return 'no-alert'; } clickNode(a); return 'clicked'; },

    /* control panel: assignment + deadzone dynamic buttons */
    clickAssignButton: function (n) { var b = document.querySelectorAll('#inputAssignment button')[n || 0]; if (!b) { return 'no-button'; } clickNode(b); return 'clicked:' + (b.dataset.index || ''); },
    clickDeadzoneButton: function (n, position) {
      var b = document.querySelectorAll('#deadzoneUpdate button')[n || 0];
      if (!b) { return 'no-button'; }
      b.dataset.position = position || 'left';
      clickNode(b);
      return 'clicked';
    }
  };
})();
