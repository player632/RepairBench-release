/**
 * RepairBench offline stand-in - added by environment/adaptation.patch (instance repair-vanilla__snake-vanilla-01).
 *
 * WHY THIS FILE EXISTS. Upstream drives its whole right-hand panel through three endpoints on
 * the upstream host (js/index.js:17 createScore, js/index.js:28 createLog,
 * js/messageBox.js:24 getSnakeScoreTopList) and three off-site window.open targets
 * (js/messageBox.js:102/105/108). Offline, XMLHttpRequest can never reach readyState 4 with
 * status 200/304, so js/messageBox.js:73 never calls para.success - and that success callback is
 * the ONLY code that renders the hero board (js/messageBox.js:40) and the default nickname
 * (js/messageBox.js:42). Left as-is the panel would stay frozen on the hardcoded markup in
 * index.html:41-60 and there would be nothing to measure.
 *
 * WHAT IT CHANGES. (a) MessageBox.prototype.myAjax is replaced by an in-tree route table with an
 * IDENTICAL call shape (para.url / para.data / para.success(responseText)) that resolves on a
 * macrotask, preserving the async ordering the page was written against; (b) window.open is
 * reduced to an inert no-op returning null (the value a browser returns for a blocked popup), so
 * the three off-site buttons keep their own control flow but touch no network.
 *
 * WHAT IT DOES NOT CHANGE. No game logic, no rendering path, no selector, no style, no timing
 * constant. js/snake.js is untouched by this patch. The rendering code under test
 * (js/messageBox.js:27-42, :80-112) runs exactly as shipped.
 */
(function () {
  'use strict';

  // Canned hero-board payload. Its length (3) deliberately differs from the 5 rows the entry
  // document hardcodes at index.html:41-60, so a checkpoint can tell "the list was rendered from
  // the endpoint" apart from "the hardcoded markup is still there".
  var SCORE_TOP_LIST = {
    code: 0,
    data: {
      total: 3,
      list: [
        { userName: '\u6bd4\u514b\u5927\u9b54\u738b', score: 230 },
        { userName: '\u5f20\u53ef', score: 120 },
        { userName: '\u738b\u8000\u8f89', score: 100 }
      ]
    }
  };

  var ROUTES = {
    'rb-offline/api/getSnakeScoreTopList': function () { return SCORE_TOP_LIST; },
    'rb-offline/api/createScore': function (body) { return { code: 0, data: { ok: true, received: body === undefined ? null : body } }; },
    'rb-offline/api/createLog': function (body) { return { code: 0, data: { ok: true, received: body === undefined ? null : body } }; }
  };

  if (typeof MessageBox !== 'undefined' && MessageBox.prototype) {
    MessageBox.prototype.myAjax = function (para) {
      var route = ROUTES[para && para.url];
      var payload = route ? route(para.data) : { code: 0, data: {} };
      window.setTimeout(function () {
        if (para && typeof para.success === 'function') {
          para.success(JSON.stringify(payload));
        }
      }, 0);
    };
  }

  window.open = function () { return null; };
})();
