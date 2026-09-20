/*!
 * rb-probe.js - repair-bench observation bridge for codersquiz (repair-vanilla__codersquiz-01).
 *
 * Loaded last on every scored page (index/select/game/end/review/highScore) by
 * environment/instrumentation.patch. It adds NO rule, constant, branch or style to the quiz:
 * it only (a) reads what the app already exposes - DOM nodes, the browser's own storage and the
 * top-level bindings core.js declares - and (b) drives the app through its OWN entry points
 * (real element.click() on the real nodes, real keyup on the real input) so that every scalar a
 * checkpoint asserts on is produced by application code, never by the bridge.
 *
 * Two namespaces, both inert until called:
 *   window.__CQ__      read-only observers (each returns plain scalars/strings, never app objects)
 *   window.__CQ_CMD__  setup drivers (pre-state seeding + real-event interaction)
 *
 * Determinism notes (the seed draws questions with an unseeded Math.random, so no observer here
 * returns a question-dependent value that a checkpoint pins to a literal; the drivers instead make
 * the run RNG-independent by choosing WHICH choice to click from the app's own current question,
 * and the seeded record for the review/end/high-score pages is built from the app's own bank file
 * in file order). The bridge never seeds, stubs or wraps Math.random, never writes an app global
 * and never touches a measured surface.
 */
(function () {
  'use strict';
  if (window.__CQ__) { return; }

  var VERSION = 'rb-probe/codersquiz-1';
  var bankCache = {};

  function safe(fn, fallback) {
    try {
      var v = fn();
      return (v === undefined ? fallback : v);
    } catch (err) {
      return fallback;
    }
  }
  function byId(id) { return document.getElementById(id); }
  function nodes(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function first(sel) { var n = nodes(sel); return n.length ? n[0] : null; }
  function txt(node) {
    if (node === null || node === undefined) { return null; }
    var s = node.innerText;
    if (s === undefined || s === null) { s = node.textContent; }
    return String(s);
  }
  function distinctCount(list) {
    var seen = {};
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      var k = String(list[i]);
      if (!Object.prototype.hasOwnProperty.call(seen, k)) { seen[k] = true; n++; }
    }
    return n;
  }
  function join(list, sep) {
    var out = [];
    for (var i = 0; i < list.length; i++) { out.push(list[i] === null || list[i] === undefined ? '' : String(list[i])); }
    return out.join(sep === undefined ? '|' : sep);
  }
  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }
  function waitFor(pred, ms, step) {
    var limit = (ms === undefined ? 20000 : ms);
    var every = (step === undefined ? 50 : step);
    var t0 = Date.now();
    return new Promise(function (resolve, reject) {
      var tick = function () {
        var v = false;
        try { v = pred(); } catch (err) { v = false; }
        if (v) { resolve(v); return; }
        if (Date.now() - t0 > limit) { reject(new Error('rb-probe waitFor timed out after ' + limit + 'ms')); return; }
        setTimeout(tick, every);
      };
      tick();
    });
  }

  /* ---- read-only view of the bindings core.js declares at script top level ---- */
  function core() {
    return safe(function () {
      return {
        present: true,
        counterVar: questionCounter,
        scoreVar: score,
        accepting: acceptingAnswers,
        availableN: availableQuestions.length,
        answeredN: answeredQuestions.length,
        bankN: questions.length,
        category: selectedCategory,
        currentStem: currentQuestion ? currentQuestion.question : null,
        currentAnswer: currentQuestion ? currentQuestion.answer : null,
        currentChoices: currentQuestion ? join([currentQuestion.choice1, currentQuestion.choice2, currentQuestion.choice3, currentQuestion.choice4], ' | ') : null
      };
    }, null);
  }

  /* ---- game.html ---- */
  function game() {
    var c = core();
    return {
      counter: txt(byId('questionCounter')),
      score: txt(byId('score')),
      barWidth: safe(function () { return byId('progress-bar').style.width; }, null),
      barComputed: safe(function () { return getComputedStyle(byId('progress-bar')).width; }, null),
      questionHTML: safe(function () { return byId('question').innerHTML; }, null),
      questionText: txt(byId('question')),
      questionChildren: safe(function () { return byId('question').children.length; }, -1),
      choiceN: nodes('.choice-text').length,
      choiceTexts: join(nodes('.choice-text').map(function (n) { return txt(n); }), ' | '),
      choiceNumbers: join(nodes('.choice-text').map(function (n) { return n.getAttribute('data-number'); }), ','),
      containerClasses: join(nodes('.choice-container').map(function (n) { return n.className; }), ' | '),
      flashN: nodes('.choice-container.correct, .choice-container.incorrect').length,
      gameHidden: safe(function () { return byId('game').classList.contains('hidden'); }, null),
      loaderHidden: safe(function () { return byId('loader').classList.contains('hidden'); }, null),
      counterVar: c ? c.counterVar : null,
      scoreVar: c ? c.scoreVar : null,
      accepting: c ? c.accepting : null,
      availableN: c ? c.availableN : null,
      answeredN: c ? c.answeredN : null,
      bankN: c ? c.bankN : null,
      category: c ? c.category : null,
      currentStem: c ? c.currentStem : null,
      currentAnswer: c ? c.currentAnswer : null,
      currentChoices: c ? c.currentChoices : null,
      path: location.pathname
    };
  }

  /* ---- review.html ---- */
  function slideNodes() { return nodes('.mySlides'); }
  function dotNodes() { return nodes('.demo'); }
  function blockIndices() {
    var out = [];
    var s = slideNodes();
    for (var i = 0; i < s.length; i++) { if (s[i].style.display === 'block') { out.push(i); } }
    return out;
  }
  function activeDotIndices() {
    var out = [];
    var d = dotNodes();
    for (var i = 0; i < d.length; i++) { if (d[i].classList.contains('active')) { out.push(i); } }
    return out;
  }
  function stemOf(i) { var s = slideNodes()[i]; return s ? txt(s.querySelector('h2.question')) : null; }
  function successOf(i) { var s = slideNodes()[i]; return s ? txt(s.querySelector('xmp.success')) : null; }
  function dangerOf(i) { var s = slideNodes()[i]; return s ? txt(s.querySelector('xmp.danger')) : null; }
  function displayOf(i) { var s = slideNodes()[i]; return s ? String(s.style.display) : null; }
  function dotClass(i) { var d = dotNodes()[i]; return d ? String(d.className) : null; }
  function dotItem(i) { var d = dotNodes()[i]; return d ? d.getAttribute('data-item') : null; }
  function review() {
    var s = slideNodes();
    var d = dotNodes();
    var bi = blockIndices();
    var ai = activeDotIndices();
    return {
      slideN: s.length,
      dotN: d.length,
      slidesListChildren: safe(function () { return byId('slides').children.length; }, -1),
      caption: txt(byId('caption')),
      blockIndex: (bi.length === 1 ? bi[0] : (bi.length === 0 ? -1 : 1000 + bi.length)),
      blockIndices: join(bi, ','),
      blockN: bi.length,
      activeDotN: ai.length,
      activeDots: join(ai, ','),
      activeDotIndex: (ai.length === 1 ? ai[0] : -1),
      stems: join(s.map(function (n) { return txt(n.querySelector('h2.question')); }), ' ~~ '),
      stemDistinct: distinctCount(s.map(function (n) { return txt(n.querySelector('h2.question')); })),
      successTexts: join(s.map(function (n) { return txt(n.querySelector('xmp.success')); }), ' ~~ '),
      successDistinct: distinctCount(s.map(function (n) { return txt(n.querySelector('xmp.success')); })),
      dangerTexts: join(s.map(function (n) { return txt(n.querySelector('xmp.danger')); }), ' ~~ '),
      successN: nodes('.mySlides xmp.success').length,
      dangerN: nodes('.mySlides xmp.danger').length,
      emptySpan: txt(first('#slides li span')),
      closeText: txt(first('button.back')),
      path: location.pathname
    };
  }

  /* ---- end.html ---- */
  function endPage() {
    return {
      finalScore: txt(byId('finalScore')),
      saveDisabled: safe(function () { return byId('saveScoreBtn').disabled; }, null),
      saveTitle: safe(function () { return byId('saveScoreBtn').getAttribute('title'); }, null),
      saveType: safe(function () { return byId('saveScoreBtn').getAttribute('type'); }, null),
      username: safe(function () { return byId('username').value; }, null),
      usernamePlaceholder: safe(function () { return byId('username').getAttribute('placeholder'); }, null),
      formAction: safe(function () { return first('form').getAttribute('action'); }, null),
      formMethod: safe(function () { return first('form').getAttribute('method'); }, null),
      linkN: nodes('#end a.btn').length,
      linkHrefs: join(nodes('#end a.btn').map(function (a) { return a.getAttribute('href'); }), ','),
      heading: txt(first('.final-score')),
      path: location.pathname
    };
  }

  /* ---- highScore.html ---- */
  function hsItems() { return nodes('#highScoresList li'); }
  function hs() {
    var items = hsItems();
    return {
      itemN: items.length,
      listChildren: safe(function () { return byId('highScoresList').children.length; }, -1),
      listHTMLLen: safe(function () { return byId('highScoresList').innerHTML.length; }, -1),
      rowsText: join(items.map(function (li) { return txt(li); }), ' ~~ '),
      names: join(items.map(function (li) { return txt(li.children[0]); }), '|'),
      cats: join(items.map(function (li) { return txt(li.children[1]); }), '|'),
      scores: join(items.map(function (li) { return txt(li.children[2]); }), '|'),
      spanN: join(items.map(function (li) { return li.children.length; }), ','),
      emptySpan: txt(first('#highScoresList li span')),
      itemClass: join(items.map(function (li) { return String(li.className); }), '|'),
      heading: txt(byId('finaleScores')),
      homeHref: safe(function () { return first('#highScores a.btn').getAttribute('href'); }, null),
      path: location.pathname
    };
  }

  /* ---- storage / network ---- */
  function aqParsed() {
    return safe(function () {
      var raw = localStorage.getItem('AnsweredQuestions');
      if (raw === null) { return null; }
      var v = JSON.parse(raw);
      return (v && typeof v.length === 'number') ? v : null;
    }, null);
  }
  function hsParsed() {
    return safe(function () {
      var raw = localStorage.getItem('highscores');
      if (raw === null) { return null; }
      var v = JSON.parse(raw);
      return (v && typeof v.length === 'number') ? v : null;
    }, null);
  }
  function store() {
    var aq = aqParsed();
    var hsl = hsParsed();
    return {
      lsN: localStorage.length,
      ssN: sessionStorage.length,
      lsKeys: join(Object.keys(localStorage).sort(), ','),
      ssKeys: join(Object.keys(sessionStorage).sort(), ','),
      cookieLen: document.cookie.length,
      hashLen: location.hash.length,
      aqPresent: aq !== null,
      aqN: aq ? aq.length : -1,
      aqChoices: aq ? join(aq.map(function (r) { return r ? r.choice : null; }), ',') : null,
      aqStemDistinct: aq ? distinctCount(aq.map(function (r) { return (r && r.question) ? r.question.question : null; })) : -1,
      aqCorrectN: aq ? aq.filter(function (r) { return !!(r && r.question) && Number(r.choice) === Number(r.question.answer); }).length : -1,
      aqBankShaped: aq ? aq.every(function (r) { return !!(r && r.question) && typeof r.question.question === 'string' && [1, 2, 3, 4].indexOf(Number(r.choice)) >= 0; }) : null,
      aqAnswerKeys: aq ? join(aq.map(function (r) { return (r && r.question) ? Object.keys(r.question).sort().join('+') : null; }), ',') : null,
      mostRecentScore: localStorage.getItem('mostRecentScore'),
      mostRecentScoreSession: sessionStorage.getItem('mostRecentScore'),
      selectedCategory: localStorage.getItem('selectedCategory'),
      hsPresent: hsl !== null,
      hsN: hsl ? hsl.length : -1,
      hsScores: hsl ? join(hsl.map(function (r) { return r ? r.score : null; }), '|') : null,
      hsNames: hsl ? join(hsl.map(function (r) { return r ? r.name : null; }), '|') : null,
      hsScoreTypes: hsl ? join(hsl.map(function (r) { return r ? typeof r.score : null; }), ',') : null
    };
  }
  function net() {
    var ents = safe(function () { return performance.getEntriesByType('resource'); }, []);
    var here = location.origin;
    var cross = ents.filter(function (e) { return String(e.name).indexOf(here) !== 0; });
    return {
      resourceN: ents.length,
      crossOriginN: cross.length,
      crossOriginNames: join(cross.map(function (e) { return e.name; }), ','),
      libFetchN: ents.filter(function (e) { return String(e.name).indexOf('/lib/') >= 0; }).length,
      soundFetchN: ents.filter(function (e) { return String(e.name).indexOf('/sounds/') >= 0; }).length,
      probeLoaded: !!window.__CQ__
    };
  }

  /* ---- drivers: real pre-state + real events ---- */
  function wrongOf(answer) { return (Number(answer) % 4) + 1; }
  function choiceNode(idx) { return first('.choice-text[data-number="' + idx + '"]'); }
  function clear() {
    localStorage.clear();
    sessionStorage.clear();
    return { lsN: localStorage.length, ssN: sessionStorage.length };
  }
  function fetchBank(category) {
    var cat = String(category || 'html');
    if (Object.prototype.hasOwnProperty.call(bankCache, cat)) { return Promise.resolve(bankCache[cat]); }
    return fetch('/lib/' + cat + '.json').then(function (res) { return res.json(); }).then(function (data) {
      bankCache[cat] = data;
      return data;
    });
  }
  function seedAnswers(opts) {
    var o = opts || {};
    var cat = String(o.category || 'html');
    var n = (o.n === undefined ? 10 : Number(o.n));
    var pattern = String(o.pattern || '');
    return fetchBank(cat).then(function (bank) {
      if (n > bank.length) { throw new Error('seedAnswers: n=' + n + ' exceeds bank ' + bank.length); }
      var rec = [];
      for (var i = 0; i < n; i++) {
        var q = bank[i];
        var a = Number(q.answer);
        var ch = (pattern.charAt(i) === 'W' ? wrongOf(a) : a);
        rec.push({ question: q, choice: ch });
      }
      localStorage.setItem('AnsweredQuestions', JSON.stringify(rec));
      localStorage.setItem('selectedCategory', cat);
      var correctN = rec.filter(function (r) { return Number(r.choice) === Number(r.question.answer); }).length;
      if (o.withScore !== false) { localStorage.setItem('mostRecentScore', String(correctN * 10)); }
      return {
        category: cat, n: rec.length, correctN: correctN, wrongN: rec.length - correctN,
        score: correctN * 10, firstStem: rec.length ? rec[0].question.question : null,
        lsKeys: join(Object.keys(localStorage).sort(), ',')
      };
    });
  }
  function seedCategory(category) {
    var cat = String(category || 'html');
    localStorage.setItem('selectedCategory', cat);
    return { selectedCategory: localStorage.getItem('selectedCategory'), lsKeys: join(Object.keys(localStorage).sort(), ',') };
  }
  function seedHighScores(rows) {
    var list = rows || [];
    localStorage.setItem('highscores', JSON.stringify(list));
    return { n: list.length, scores: join(list.map(function (r) { return r.score; }), '|') };
  }
  function seedScore(value, category) {
    localStorage.setItem('mostRecentScore', String(value));
    if (category) { localStorage.setItem('selectedCategory', String(category)); }
    return { mostRecentScore: localStorage.getItem('mostRecentScore'), selectedCategory: localStorage.getItem('selectedCategory') };
  }
  function ready(expectCounter, ms) {
    return waitFor(function () {
      var c = core();
      if (!c) { return false; }
      if (c.accepting !== true) { return false; }
      if (expectCounter !== undefined && expectCounter !== null && c.counterVar !== expectCounter) { return false; }
      return !!choiceNode(1);
    }, (ms === undefined ? 25000 : ms)).then(function () { return core(); });
  }
  function answerOnce(mode, expectCounter) {
    return ready(expectCounter).then(function (c) {
      var a = Number(c.currentAnswer);
      var idx = (mode === 'wrong' ? wrongOf(a) : a);
      var node = choiceNode(idx);
      if (!node) { throw new Error('answerOnce: no .choice-text[data-number="' + idx + '"]'); }
      node.click();
      return { clicked: idx, correct: a, mode: String(mode || 'correct'), counterVar: c.counterVar, answeredN: c.answeredN + 1 };
    });
  }
  function tapExtra(mode) {
    var c = core();
    if (!c) { return { clicked: null, reason: 'core-absent' }; }
    var a = Number(c.currentAnswer);
    var idx = (mode === 'wrong' ? wrongOf(a) : a);
    var node = choiceNode(idx);
    if (!node) { return { clicked: null, reason: 'node-absent' }; }
    node.click();
    return { clicked: idx, correct: a };
  }
  function playQuiz(pattern) {
    var p = String(pattern);
    var clicks = [];
    var step = function (i) {
      if (i >= p.length) {
        return Promise.resolve({ answered: clicks.length, clicks: join(clicks, ','), pattern: p });
      }
      return answerOnce(p.charAt(i) === 'W' ? 'wrong' : 'correct', i + 1).then(function (r) {
        clicks.push(r.clicked);
        return step(i + 1);
      });
    };
    return step(0);
  }
  function clickNext(times) {
    var n = Number(times || 1);
    var done = 0;
    for (var i = 0; i < n; i++) {
      var b = first('a.next');
      if (!b) { break; }
      b.click();
      done++;
    }
    return { clicked: done, caption: txt(byId('caption')), blockIndices: join(blockIndices(), ','), activeDots: join(activeDotIndices(), ',') };
  }
  function clickPrev(times) {
    var n = Number(times || 1);
    var done = 0;
    for (var i = 0; i < n; i++) {
      var b = first('a.prev');
      if (!b) { break; }
      b.click();
      done++;
    }
    return { clicked: done, caption: txt(byId('caption')), blockIndices: join(blockIndices(), ','), activeDots: join(activeDotIndices(), ',') };
  }
  function clickDot(i) {
    var d = dotNodes()[Number(i)];
    if (!d) { throw new Error('clickDot: no .demo at index ' + i); }
    d.click();
    return { dot: Number(i), caption: txt(byId('caption')), blockIndices: join(blockIndices(), ','), activeDots: join(activeDotIndices(), ',') };
  }
  function pickCategory(id) {
    var b = byId(String(id));
    if (!b) { throw new Error('pickCategory: no button #' + id); }
    setTimeout(function () { b.click(); }, 0);
    return { scheduled: String(id), text: txt(b) };
  }
  function typeUsername(name) {
    var inp = byId('username');
    if (!inp) { throw new Error('typeUsername: no #username on this page'); }
    inp.value = String(name);
    inp.dispatchEvent(new Event('keyup', { bubbles: true }));
    return { value: inp.value, saveDisabled: safe(function () { return byId('saveScoreBtn').disabled; }, null) };
  }
  function blankUsername() {
    var inp = byId('username');
    if (!inp) { throw new Error('blankUsername: no #username on this page'); }
    inp.value = '';
    inp.dispatchEvent(new Event('keyup', { bubbles: true }));
    return { value: inp.value, saveDisabled: safe(function () { return byId('saveScoreBtn').disabled; }, null) };
  }
  function saveScore(name) {
    var r = typeUsername(name);
    setTimeout(function () {
      var b = byId('saveScoreBtn');
      if (b) { b.click(); }
    }, 0);
    return { scheduled: true, value: r.value, saveDisabledAtSchedule: r.saveDisabled };
  }
  function clickClose() {
    var b = first('button.back');
    setTimeout(function () { if (b) { b.click(); } }, 0);
    return { scheduled: !!b };
  }
  function clickLink(href) {
    var links = nodes('a.btn');
    var target = null;
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('href') === href) { target = links[i]; break; }
    }
    setTimeout(function () { if (target) { target.click(); } }, 0);
    return { scheduled: !!target, href: href };
  }

  window.__CQ__ = {
    probe: VERSION,
    version: function () { return VERSION; },
    url: function () { return location.pathname; },
    href: function () { return location.href; },
    origin: function () { return location.origin; },
    title: function () { return document.title; },
    text: function (sel) { return txt(first(sel)); },
    html: function (sel) { var n = first(sel); return n ? String(n.innerHTML) : null; },
    count: function (sel) { return nodes(sel).length; },
    attr: function (sel, name) { var n = first(sel); return n ? n.getAttribute(name) : null; },
    core: function () { return core(); },
    game: function () { return game(); },
    review: function () { return review(); },
    end: function () { return endPage(); },
    hs: function () { return hs(); },
    store: function () { return store(); },
    net: function () { return net(); },
    stemOf: function (i) { return stemOf(i); },
    successOf: function (i) { return successOf(i); },
    dangerOf: function (i) { return dangerOf(i); },
    displayOf: function (i) { return displayOf(i); },
    dotClass: function (i) { return dotClass(i); },
    dotItem: function (i) { return dotItem(i); },
    blockIndices: function () { return join(blockIndices(), ','); },
    activeDots: function () { return join(activeDotIndices(), ','); },
    aq: function () { return aqParsed(); },
    waitFor: function (pred, ms) { return waitFor(pred, ms); },
    sleep: function (ms) { return sleep(ms); }
  };

  window.__CQ_CMD__ = {
    clear: function () { return clear(); },
    bank: function (category) { return fetchBank(category); },
    seedAnswers: function (opts) { return seedAnswers(opts); },
    seedCategory: function (category) { return seedCategory(category); },
    seedHighScores: function (rows) { return seedHighScores(rows); },
    seedScore: function (value, category) { return seedScore(value, category); },
    ready: function (expectCounter, ms) { return ready(expectCounter, ms); },
    answerOnce: function (mode, expectCounter) { return answerOnce(mode, expectCounter); },
    tapExtra: function (mode) { return tapExtra(mode); },
    playQuiz: function (pattern) { return playQuiz(pattern); },
    clickNext: function (times) { return clickNext(times); },
    clickPrev: function (times) { return clickPrev(times); },
    clickDot: function (i) { return clickDot(i); },
    pickCategory: function (id) { return pickCategory(id); },
    typeUsername: function (name) { return typeUsername(name); },
    blankUsername: function () { return blankUsername(); },
    saveScore: function (name) { return saveScore(name); },
    clickClose: function () { return clickClose(); },
    clickLink: function (href) { return clickLink(href); }
  };
})();
