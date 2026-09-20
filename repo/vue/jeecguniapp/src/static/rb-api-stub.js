/* rb-api-stub.js - RepairBench environment adapter for JeecgUniapp (H5 build).
 *
 * WHY THIS FILE EXISTS (0 business logic edited):
 *   The upstream app talks to a remote JeecgBoot backend (env/.env.production sets
 *   VITE_SERVER_BASEURL='https://api3.boot.jeecg.com') and uni-mini-router's beforeEach admits
 *   only /pages/login/login{,Oauth2} unless userStore.isLogined. The verifier runs with
 *   allow_internet=false, so this stub makes the measured surface self-sufficient and
 *   deterministic: it (1) pre-seeds the persisted pinia 'user' store exactly the way
 *   pinia-plugin-persistedstate + uni storage leave it in localStorage in H5, (2) answers the
 *   app's own endpoints with fixed fixtures, and (3) records every request it answered on
 *   window.__rbApiLog so request-shape checkpoints have a verdict surface.
 *   It is loaded as a CLASSIC script from index.html's <head>, i.e. before the module bundle,
 *   and it only ever touches window.XMLHttpRequest / window.fetch / localStorage.
 *
 * 🔴 FIXTURE MATCHING IS PATH-PREFIX BASED ON PURPOSE. src/interceptors/request.ts appends the
 *   qs.stringify'd `query` object with either '?' or '&', so the recorded pathname of one and the
 *   same logical endpoint differs between the two spellings. Matching on a bare path prefix (no
 *   `(\?|$)` anchor) keeps the fake backend's ANSWER identical either way, which confines that
 *   one defect's blast radius to the outgoing request shape recorded in __rbApiLog instead of
 *   letting it cascade into every consumer's data and turning pass-to-pass checkpoints red.
 */
(function () {
  'use strict';
  if (window.__rbStubInstalled) return;
  window.__rbStubInstalled = true;

  var RB = {
    token: 'rb-stub-token-0123456789',
    loginTenantId: 7,
    user: {
      id: 'rb-u-1', username: 'rbuser', realname: 'RB 测试用户', avatar: '',
      phone: '13800000000', email: 'rb@example.local', sex: 1, birthday: '',
      orgCode: 'A01', orgCodeTxt: '研发部', loginTenantId: 7, post: '前端工程师',
      workNo: 'RB0001', departIds: 'A01', clientid: 'rb-client'
    }
  };
  window.__rbStubConfig = RB;

  // ---- (1) deterministic logged-in state -------------------------------------
  // A checkpoint that needs the LOGGED-OUT shape sets localStorage['rb-noseed']='1' (and writes
  // its own localStorage['user']) before reloading, so this stub leaves that state untouched and
  // the real login form / the real router guard can be driven. Everything else starts logged-in.
  try {
    if (localStorage.getItem('rb-noseed') !== '1') {
      var seeded = {
        userInfo: Object.assign({}, RB.user, {
          token: RB.token, userid: RB.user.id, tenantId: RB.loginTenantId,
          // 🔴 Date.now(), NOT a fixed epoch: pages/login/login.vue:334 checkToken() treats the
          //    persisted record as EXPIRED once `+new Date() - userInfo.localStorageTime > 2h` and
          //    then calls clearUserInfo(). A hardcoded stamp measured fresh at 01:10Z and stale at
          //    01:25Z on the same day, i.e. the login face flipped with wall-clock time (seat 8
          //    measured exactly that: G.login clean=pages/message/message vs delivered=login).
          //    Seeding "now" keeps the 2-hour window open for every verifier run, whenever it runs.
          localStorageTime: Date.now()
        })
      };
      localStorage.setItem('user', JSON.stringify(seeded));
    }
  } catch (e) { window.__rbStubSeedError = String(e); }

  // ---- (2) fixtures ----------------------------------------------------------
  function env(data, extra) {
    var o = { success: true, code: 200, message: '操作成功', msg: '操作成功', result: data, timestamp: 1789687000000 };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  var FIXTURES = [
    { m: 'POST', re: /\/sys\/mLogin/, fn: function () {
        return env({ token: RB.token, userInfo: Object.assign({}, RB.user) });
      } },
    { m: 'POST', re: /\/sys\/sms/, fn: function () { return env(true, { message: 'ok' }); } },
    { m: 'GET', re: /\/sys\/user\/appQueryUser/, fn: function () {
        return env(Object.assign({}, RB.user, { token: RB.token, tenantId: RB.loginTenantId }));
      } },
    { m: 'GET', re: /\/sys\/tenant\/getCurrentUserTenant/, fn: function () {
        return env({ list: [ { id: 'rb-t1', name: 'RB 租户一' }, { id: 'rb-t2', name: 'RB 租户二' } ] });
      } },
    { m: 'GET', re: /\/sys\/sysDepart\/queryDepartTreeSync/, fn: function () {
        return env([ { key: 'A01', title: '研发部', value: 'A01', slotTitle: '研发部', isLeaf: false,
                       children: [ { key: 'A01A01', title: '前端组', value: 'A01A01', slotTitle: '前端组', isLeaf: true } ] } ]);
      } },
    { m: 'GET', re: /\/sys\/category\/loadDictItem/, fn: function () { return env([]); } },
    // 🔴 `template` must be a JSON *string* the page can JSON.parse: pages-work/dragPage/index.vue:162
    //    does `result.template ? JSON.parse(result.template) : []`. An empty JSON array keeps the
    //    page on its own built-in empty state (wd-status-tip 「暂无内容」) with 0 page errors.
    { m: 'GET', re: /\/drag\/page\/queryById/, fn: function () {
        return env({ id: 'rb-drag-1', name: 'RB 仪表盘', pageConfig: '{"list":[]}', template: '[]', status: '1' });
      } },
    { m: 'GET', re: /\/drag\/page\/list/, fn: function () {
        return env({ records: [], total: 0, current: 1, size: 10 });
      } },
    { m: 'GET', re: /\/eoa\/sysAppConfig\/queryAppConfigRoute/, fn: function () {
        return env({ route: [], config: [ { carouselImgJson: '' } ] });
      } },
    { m: 'GET', re: /\/foo/, fn: function () { return env({ id: 'rb-foo-1', name: '张三' }); } },
    { m: 'GET', re: /\/pet\/findByStatus/, fn: function () { return env([ { id: 1, name: 'rb-pet' } ]); } },
    { m: 'POST', re: /\/eoa\/im\/newApi\/chatToTop/, fn: function () { return env(true); } },
    { m: 'POST', re: /\/eoa\/im\/newApi\/removeChat/, fn: function () { return env(true); } },
    { m: 'GET', re: /\/sys\/sysAnnouncementSend\/getMyAnnouncementSend/, fn: function () {
        return env({ records: [], total: 0, current: 1, size: 10 });
      } }
  ];
  function resolve(method, pathOnly, body) {
    var m = String(method || 'GET').toUpperCase();
    for (var i = 0; i < FIXTURES.length; i++) {
      var f = FIXTURES[i];
      if (f.m !== m) continue;
      if (f.re.test(pathOnly)) return { fixture: f.re.source, data: f.fn(body) };
    }
    // generic JeecgBoot envelope; z-paging consumers need records/total, table consumers need list
    return { fixture: 'GENERIC', data: env({ records: [], total: 0, current: 1, size: 10, list: [], rows: [] }) };
  }

  // ---- (3) record + answer ---------------------------------------------------
  var LOG = [];
  window.__rbApiLog = LOG;
  function record(method, url, body, headers) {
    var rec = { method: String(method || 'GET').toUpperCase(), url: String(url).slice(0, 300), body: null, headers: {}, fixture: null, at: Date.now() };
    try {
      var u = new URL(url, window.location.href);
      rec.origin = u.origin; rec.path = u.pathname; rec.search = u.search;
      rec.sameOrigin = u.origin === window.location.origin;
    } catch (e) { rec.path = String(url); rec.search = ''; rec.sameOrigin = false; }
    if (typeof body === 'string' && body) rec.body = body.slice(0, 400);
    if (headers) for (var k in headers) rec.headers[k] = String(headers[k]).slice(0, 120);
    var hit = resolve(rec.method, rec.path, body);
    rec.fixture = hit.fixture;
    LOG.push(rec);
    if (LOG.length > 400) LOG.shift();
    return hit.data;
  }

  function StubXHR() {
    var self = this;
    var st = { method: 'GET', url: '', headers: {}, readyState: 0, status: 0, response: null, responseText: '', handlers: {} };
    this._rb = st;
    this.upload = { addEventListener: function () {}, removeEventListener: function () {}, onprogress: null };
    this.open = function (m, u) { st.method = m; st.url = u; st.readyState = 1; };
    this.setRequestHeader = function (k, v) { st.headers[k] = v; };
    this.getAllResponseHeaders = function () { return 'content-type: application/json;charset=UTF-8\r\n'; };
    this.getResponseHeader = function (k) { return String(k).toLowerCase() === 'content-type' ? 'application/json;charset=UTF-8' : null; };
    this.abort = function () { st.aborted = true; };
    this.addEventListener = function (t, fn) { (st.handlers[t] = st.handlers[t] || []).push(fn); };
    this.removeEventListener = function (t, fn) { var a = st.handlers[t] || []; var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
    Object.defineProperty(this, 'readyState', { get: function () { return st.readyState; } });
    Object.defineProperty(this, 'status', { get: function () { return st.status; } });
    Object.defineProperty(this, 'response', { get: function () { return st.response; } });
    Object.defineProperty(this, 'responseText', { get: function () { return st.responseText; } });
    function fire(t, ev) { var a = st.handlers[t] || []; for (var i = 0; i < a.length; i++) { try { a[i].call(self, ev); } catch (e) {} } }
    this.send = function (body) {
      var data = record(st.method, st.url, body, st.headers);
      setTimeout(function () {
        if (st.aborted) return;
        st.readyState = 4; st.status = 200;
        st.response = data; st.responseText = JSON.stringify(data);
        if (typeof self.onreadystatechange === 'function') { try { self.onreadystatechange({ type: 'readystatechange', target: self }); } catch (e) {} }
        if (typeof self.onload === 'function') { try { self.onload({ type: 'load', target: self }); } catch (e) {} }
        fire('readystatechange', { type: 'readystatechange', target: self });
        fire('load', { type: 'load', target: self });
        fire('loadend', { type: 'loadend', target: self });
      }, 0);
    };
  }
  StubXHR.UNSENT = 0; StubXHR.OPENED = 1; StubXHR.HEADERS_RECEIVED = 2; StubXHR.LOADING = 3; StubXHR.DONE = 4;
  window.XMLHttpRequest = StubXHR;

  var realFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    var method = (init && init.method) || (typeof input === 'object' && input && input.method) || 'GET';
    var data = record(method, url, init && init.body, (init && init.headers) || null);
    return Promise.resolve({
      ok: true, status: 200, statusText: 'OK',
      json: function () { return Promise.resolve(data); },
      text: function () { return Promise.resolve(JSON.stringify(data)); },
      headers: { get: function () { return 'application/json;charset=UTF-8'; } }
    });
  };
  window.__rbFetchWasNative = typeof realFetch === 'function';
})();
