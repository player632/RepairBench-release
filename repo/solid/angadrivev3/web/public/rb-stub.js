//
//
//
//   本株前端 0 处 fetch/axios/XHR/createResource/useQuery（surface.json B3），全部业务数据走**一条同源 WebSocket**
//   （web/src/Websockets.tsx:7 `const wsUrl = webSocketUrl("/ws");`）。可交付面是 web/dist 静态产物，名单配方里没有 Go 后端，
//   不桩则：连不上 → 每 300ms 无限重连（web/src/Websockets.tsx:6 RECONNECT_DELAY）→ /my_drive 恒 FilesError、
//   /my_collections 恒 CollectionsError、/account 计数恒 0、首页计数恒 0 ⇒ 12 枚缺陷全部不可观测。
//
//
//   web/src/Websockets.tsx:73 在收到 login_response 之后把 `ws.onmessage = () => {}` 置空，此后所有帧都走
//   web/src/App.tsx:93 的 `socket.addEventListener("message", …)`（另有 MyDrive.tsx:57 与 HomePage.tsx:99 两条 addEventListener 链）。
//   ⇒ 本桩**同时**驱动 onmessage 属性链与 addEventListener 链（见 _fire），两条链收到同一帧。只实现属性 ⇒ 握手后全聋。
//
// 硬约束（逐条都是结构性的，不是口号）：
//   1) 本文件属 instrumentation ⇒ clean／mut／oracle 三态**字节相同**；mutation.patch 永不触碰 public/rb-*（桩不得充当缺陷宿主）。
//
//
//
//
//
//   WS /ws                → 本桩主体（RbWebSocket），按后端真形状回 22 类帧
//   WS /ws/upload         → 同一桩顶替（POOL_SIZE=3 条共享连接，uploadWebsockets.tsx:28）；init/chunk/finalize/cancel 已实现，
//                           🔴 但 42 条检查点无一读上传面 ⇒ 记为「已实现、未被检查点覆盖」（uncovered，见 __RB_STUB__.uncovered）
//   fetch/axios/XHR       → 应用 0 处；emailjs（@emailjs/browser，ContactMe.tsx:44 四参硬编码真凭据）是唯一真外网 API
//                           ⇒ 顶替 window.fetch／XMLHttpRequest.open+send／navigator.sendBeacon，非本机一律中和并记账
//   apiUrl()              → 死代码（定义 1 处、真调用 0 处，ApiUrl.tsx:17）⇒ 无需覆盖
//
//                           PreviewImage 的 onError 回退占位 svg（FileCard.tsx:12-19），守卫 P27/P28 钉死这个正常形状
//   github 外链 3 处       → 顶替 window.open ＋ document 捕获期拦非本机 <a> 点击；探针不点它们
//   index.html og/twitter → 4 处 meta，运行期不取 ⇒ 无需处置
//   svg xmlns 10 处        → 命名空间，非请求
//   字体/CDN 0 处          → 无需处置；另对 script/link/iframe/img/media 的 src|href（属性与 setAttribute 两条路）加非本机拒绝闸（纵深防御）
(() => {
  const W = typeof window !== "undefined" ? window : globalThis;
  if (W.__RB_STUB__) return;

  const VERSION = 1;
  const OPEN_DELAY_MS = 0;    // 构造函数返回后再开（同步开会导致 ws.onopen 还没挂上 ⇒ 应用永不发 login）
  const REPLY_DELAY_MS = 0;   // 回帧「立刻」：同一个宏任务队列，FIFO 保序
  const CLOSE_DELAY_MS = 0;
  const T0 = Date.now();
  const ms = () => Date.now() - T0;

  // ------------------------------------------------------------------ 日志（只增不改；每项带相对毫秒）
  const journal = {
    ctor: [],        // {url, kind, at}
    opened: [],      // {url, kind, at}
    closed: [],      // {url, kind, code, at}
    sent: [],        // {url, kind, type, bytes, binary, at}   ← 应用发出的帧
    delivered: [],   // {url, kind, type, at}                  ← 桩回给应用的帧
    blocked: [],     // {channel, host, at}                    ← 被中和的非本机出口
    unhandled: [],   // {url, type, at}                        ← 桩没有建模的请求型
    errors: [],      // {message, at}
  };
  const push = (arr, item) => { arr.push(item); if (arr.length > 500) arr.shift(); };
  const noteError = (e) => { push(journal.errors, { message: String((e && e.message) || e), at: ms() }); };
  const clone = (v) => JSON.parse(JSON.stringify(v));

  // ------------------------------------------------------------------ 本机判定（0 外网出口的唯一判据）
  const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
  const baseHref = () => (W.location && W.location.href ? String(W.location.href) : "http://localhost/");
  const hostOf = (u) => { try { return new URL(String(u), baseHref()).host; } catch (e) { return ""; } };
  const isLocalUrl = (u) => {
    const s = String(u === null || u === undefined ? "" : u);
    if (s === "") return true;
    if (/^(#|about:|data:|blob:)/i.test(s)) return true;      // 非网络出口
    let h = "";
    try { h = new URL(s, baseHref()).host; } catch (e) { return true; }
    if (!h) return true;                                       // 相对 URL ⇒ 同源 ⇒ 本机
    const bare = h.replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
    if (bare === "") return true;
    return LOCAL_HOSTS.indexOf(bare) >= 0;
  };

  // ------------------------------------------------------------------ 夹具（0 随机；来源 = defect_plan.json 的 readings.*，逐字对齐）
  const ACCOUNT_TOKEN = "rb-fixture-account-token";
  const TS = {
    SIZE_BASE: 1751000000,
    TYPE_BASE: 1752000000,
    DELETE_BASE: 1750500000,
    LINK_BASE: 1750600000,
    SEARCH_BASE: 1753000000,
    COLL_BASE: 1755000000,
    DEFAULT_COLL: 1754000000,
    INTL: 1750399500,            // readings.d08_intl.timestamp_unix_seconds（干净态读作 "20 Jun 2025, 02:05 pm"）
    UPLOAD: 1750700000,
    // readings.sort_fixtures 的四个时间戳逐字照抄（F09 的六条期望顺序由它们算出）
    SORT_ALPHA: 1750000000, SORT_BRAVO: 1740000000, SORT_CHARLIE: 1760000000, SORT_DELTA: 1730000000,
  };
  // database.FileData 的 JSON 形状（database/models.go:62-69）
  const mkFile = (original_file_name, file_directory, file_size, timestamp) => ({
    original_file_name: original_file_name,
    file_directory: file_directory,
    account_token: ACCOUNT_TOKEN,
    file_size: file_size,
    timestamp: timestamp,
  });
  // requestHandler.CollectionCardData 的 JSON 形状（requestHandler/models.go:21-29）
  const mkColl = (id, name, size, file_count, folder_count, editor_count, timestamp) => ({
    id: id, name: name, size: size, file_count: file_count,
    folder_count: folder_count, editor_count: editor_count, timestamp: timestamp,
  });

  // 默认合集：名字长度 5 与 9（都 ≤10 ⇒ D12 的门槛在它们上面两态同值，不给非 D12 检查点添噪声）
  const DEFAULT_COLLECTIONS = [
    mkColl("rb-coll-trips", "Trips", 10485760, 3, 1, 2, TS.DEFAULT_COLL),
    mkColl("rb-coll-assets", "Assets 24", 52428800, 7, 0, 1, TS.DEFAULT_COLL - 1000),
  ];

  // readings.size_samples = [1023, 5242880, 3221225472, 1536, 999]
  const FILES_SIZE5 = [
    mkFile("tiny note.txt", "s1z4k7q0m3vb.txt", 1023, TS.SIZE_BASE),
    mkFile("project deck.pdf", "s2x5j8r1n4wc.pdf", 5242880, TS.SIZE_BASE + 100),
    mkFile("archive image.iso", "s3v6h9t2p5xd.iso", 3221225472, TS.SIZE_BASE + 200),
    mkFile("config seed.json", "s4b7g0u3q6yf.json", 1536, TS.SIZE_BASE + 300),
    mkFile("readme stub.md", "s5n8f1v4r7zg.md", 999, TS.SIZE_BASE + 400),
  ];
  // readings.d02_d03_getFileType 的五个 file_directory 逐字照抄
  const FILES_TYPES5 = [
    mkFile("PHOTO.JPG", "u1/ab/PHOTO.JPG", 204800, TS.TYPE_BASE),
    mkFile("notes.pdf", "u1/ab/notes.pdf", 102400, TS.TYPE_BASE + 100),
    mkFile("readme.txt", "u1/ab/readme.txt", 4096, TS.TYPE_BASE + 200),
    mkFile("clip.mp4", "u1/ab/clip.mp4", 10485760, TS.TYPE_BASE + 300),
    mkFile("backup.zip", "u1/ab/backup.zip", 52428800, TS.TYPE_BASE + 400),
  ];
  // readings.d04_removal_filter：initial_count 6、target u1/c/charlie.pdf、干净态帧后剩 a/b/d/e/f
  const FILES_DELETE6 = [
    mkFile("alpha.pdf", "u1/a/alpha.pdf", 5242880, TS.DELETE_BASE + 600),
    mkFile("bravo.pdf", "u1/b/bravo.pdf", 1048576, TS.DELETE_BASE + 500),
    mkFile("charlie.pdf", "u1/c/charlie.pdf", 104857600, TS.DELETE_BASE + 400),
    mkFile("delta.pdf", "u1/d/delta.pdf", 512, TS.DELETE_BASE + 300),
    mkFile("echo.pdf", "u1/e/echo.pdf", 2048, TS.DELETE_BASE + 200),
    mkFile("foxtrot.pdf", "u1/f/foxtrot.pdf", 8192, TS.DELETE_BASE + 100),
  ];
  const DELETE_TARGET = "u1/c/charlie.pdf";
  const EXTRA_FILE = mkFile("golf upload.pdf", "u1/g/golf.pdf", 40960, TS.DELETE_BASE + 700);   // P08 的 toggle:true 帧
  // readings.link_fixtures FX_A/FX_B/FX_C/FX_D ＋ 1 个音频夹具（P28）
  // 目录段是 12 位 [a-z0-9] ＋ 单点 ＋ 扩展名，与 database/insert.go 的 allowed_filename_characters/generateFileName 对撞过
  const FILES_LINK5 = [
    mkFile("ReportFinal.pdf", "k3n8vq2xl0pa.pdf", 262144, TS.LINK_BASE),
    mkFile("Q3  report  final.pdf", "m7t2wq9zb4rc.pdf", 524288, TS.LINK_BASE + 100),
    mkFile("plain file.pdf", "p5y1hd6sk8ue.pdf", 131072, TS.LINK_BASE + 200),
    mkFile("README", "z9x8c7v6b5n4", 8192, TS.LINK_BASE + 300),
    mkFile("Ambient loop.mp3", "w2k9jd5tq8rm.mp3", 4194304, TS.LINK_BASE + 400),
  ];
  const FILES_INTL1 = [mkFile("Timestamp probe.pdf", "t8m3qz1wv6kd.pdf", 204800, TS.INTL)];
  const FILES_SORT4 = [
    mkFile("alpha.pdf", "u1/a/alpha.pdf", 5242880, TS.SORT_ALPHA),
    mkFile("bravo.pdf", "u1/b/bravo.pdf", 1048576, TS.SORT_BRAVO),
    mkFile("charlie.pdf", "u1/c/charlie.pdf", 104857600, TS.SORT_CHARLIE),
    mkFile("delta.pdf", "u1/d/delta.pdf", 512, TS.SORT_DELTA),
  ];
  // readings.search_fixtures 三条逐字照抄
  const FILES_SEARCH3 = [
    mkFile("Report Final.pdf", "k3n8vq2xl0pa.pdf", 102400, TS.SEARCH_BASE),
    mkFile("invoice.pdf", "m7t2wq9zb4rc.pdf", 204800, TS.SEARCH_BASE + 100),
    mkFile("charlie.pdf", "charlie9x8c7.pdf", 51200, TS.SEARCH_BASE + 200),
  ];
  // readings.name_samples：长度 9/10/11/12/13（时间戳递减 ⇒ DesktopCollections 的排序把渲染顺序钉成 9,10,11,12,13）
  const COLL5 = [
    mkColl("rb-coll-len09", "Cxxxxxxxx", 1048576, 2, 0, 1, TS.COLL_BASE),
    mkColl("rb-coll-len10", "Cxxxxxxxxx", 2097152, 3, 1, 1, TS.COLL_BASE - 1000),
    mkColl("rb-coll-len11", "Cxxxxxxxxxx", 4194304, 4, 1, 2, TS.COLL_BASE - 2000),
    mkColl("rb-coll-len12", "Cxxxxxxxxxxx", 8388608, 5, 2, 2, TS.COLL_BASE - 3000),
    mkColl("rb-coll-len13", "Cxxxxxxxxxxxx", 16777216, 6, 2, 3, TS.COLL_BASE - 4000),
  ];

  const FIXTURES = {
    size5: { files: FILES_SIZE5, collections: DEFAULT_COLLECTIONS, serves: ["P01", "F01", "P02", "P03", "F05", "P09", "P10", "P23", "P24", "P25", "P26", "P29", "P30"] },
    types5: { files: FILES_TYPES5, collections: DEFAULT_COLLECTIONS, serves: ["F02", "F03", "P04", "P05", "P06"] },
    delete6: { files: FILES_DELETE6, collections: DEFAULT_COLLECTIONS, serves: ["F04", "P07", "P08"] },
    link5: { files: FILES_LINK5, collections: DEFAULT_COLLECTIONS, serves: ["F06", "F07", "P11", "P12", "P13", "P27", "P28"] },
    intl1: { files: FILES_INTL1, collections: DEFAULT_COLLECTIONS, serves: ["F08", "P14"] },
    sort4: { files: FILES_SORT4, collections: DEFAULT_COLLECTIONS, serves: ["F09", "P15", "P16"] },
    search3: { files: FILES_SEARCH3, collections: DEFAULT_COLLECTIONS, serves: ["F10", "P17", "P18"] },
    gate1: { files: [FILES_SORT4[0]], collections: DEFAULT_COLLECTIONS, serves: ["P20"] },
    gate2: { files: [FILES_SORT4[0], FILES_SORT4[1]], collections: DEFAULT_COLLECTIONS, serves: ["F11"] },
    gate3: { files: [FILES_SORT4[0], FILES_SORT4[1], FILES_SORT4[2]], collections: DEFAULT_COLLECTIONS, serves: ["P19"] },
    coll5: { files: FILES_SIZE5, collections: COLL5, serves: ["F12", "P21", "P22"] },
  };
  const DEFAULT_FIXTURE = "size5";
  // 检查点 → 夹具（由 serves 反推，单一真源）
  const FIXTURE_MAP = {};
  for (const fname of Object.keys(FIXTURES)) {
    for (const cp of FIXTURES[fname].serves) FIXTURE_MAP[cp] = { fixture: fname, profile: "full" };
  }
  FIXTURE_MAP.F05 = { fixture: "size5", profile: "full", note: "🔴 不得 reload：桩在下次加载会重新预置 profile（种子自愈），F05 必须在同一次加载内点 Log Out 后立刻读" };
  FIXTURE_MAP.P26 = { fixture: "size5", profile: "full", note: "点击开关前后比 localStorage 键集；rb_profile/rb_fixture 是环境键，加载前就写好，不因点击而增加" };

  // ------------------------------------------------------------------ 预置 profile（两套 ＋ 一个逃生口）
  const PROFILES = {
    full: { email: "rb.probe@localhost.local", password: "rb-probe-password", display_name: "RB Probe" },
    empty: {},
    none: null,     // 完全不碰 localStorage（腿自己用 addInitScript 预置时用这条）
  };
  const PROFILE_KEYS = ["email", "password", "display_name", "token"];
  let profile = "full";
  let fixture = DEFAULT_FIXTURE;
  let state = { files: [], collections: [] };

  const lsGet = (k) => { try { return W.localStorage ? W.localStorage.getItem(k) : null; } catch (e) { return null; } };
  const lsSet = (k, v) => { try { if (W.localStorage) W.localStorage.setItem(k, v); } catch (e) { noteError(e); } };
  const lsDel = (k) => { try { if (W.localStorage) W.localStorage.removeItem(k); } catch (e) { noteError(e); } };

  function applyProfile(name) {
    profile = PROFILES[name] === undefined ? "full" : name;
    const p = PROFILES[profile];
    if (p === null) return { profile: profile, seeded: [] };
    for (const k of PROFILE_KEYS) lsDel(k);
    const seeded = [];
    for (const k of Object.keys(p)) { lsSet(k, p[k]); seeded.push(k); }
    return { profile: profile, seeded: seeded };
  }
  function loadFixture(name) {
    fixture = FIXTURES[name] ? name : DEFAULT_FIXTURE;
    const fx = FIXTURES[fixture];
    state = { files: fx.files.map(clone), collections: fx.collections.map(clone) };
    return { fixture: fixture, files: state.files.length, collections: state.collections.length };
  }
  // 开关读取优先级：URL 查询参数 → localStorage 环境键 → 默认值（0 随机、可复现）
  function readSwitch(name, fallback) {
    try {
      const search = W.location && W.location.search ? String(W.location.search) : "";
      if (search) {
        const sp = new URLSearchParams(search);
        const v = sp.get(name);
        if (v) return v;
      }
    } catch (e) { noteError(e); }
    const lv = lsGet(name);
    if (lv) return String(lv);
    return fallback;
  }

  // ------------------------------------------------------------------ 握手记账（P01 的机读面）
  const handshake = {
    ws_replaced: false,
    ctor_calls: 0,
    ctor_urls: [],
    opened: 0,
    closed: 0,
    frames_sent: 0,
    frames_delivered: 0,
    login_sent: 0,
    login_response_delivered: 0,
    get_user_files_sent: 0,
    get_user_files_response_delivered: 0,
    get_user_collections_sent: 0,
    get_user_collections_response_delivered: 0,
    homepage_updates_enabled: 0,
    upload_init_sent: 0,
    upload_chunks_sent: 0,
    upload_finalize_sent: 0,
  };
  const bumpSent = (type) => {
    handshake.frames_sent += 1;
    if (type === "login") handshake.login_sent += 1;
    else if (type === "get_user_files") handshake.get_user_files_sent += 1;
    else if (type === "get_user_collections") handshake.get_user_collections_sent += 1;
    else if (type === "enable_homepage_updates") handshake.homepage_updates_enabled += 1;
    else if (type === "init") handshake.upload_init_sent += 1;
    else if (type === "finalize") handshake.upload_finalize_sent += 1;
  };
  const bumpDelivered = (type) => {
    handshake.frames_delivered += 1;
    if (type === "login_response") handshake.login_response_delivered += 1;
    else if (type === "get_user_files_response") handshake.get_user_files_response_delivered += 1;
    else if (type === "get_user_collections_response") handshake.get_user_collections_response_delivered += 1;
  };
  const uniq = (arr) => { const out = []; for (const x of arr) if (out.indexOf(x) < 0) out.push(x); return out; };

  // ------------------------------------------------------------------ 首页推送帧（enable_homepage_updates=true 才发；全部写死）
  const HOMEPAGE_FRAMES = [
    { type: "system_information", data: { ram: { total_ram: 17179869184, used_ram: 6442450944, free_ram: 10737418240, ram_percent_used: 37.5 }, cpu: { cpu_model_name: "rb-fixture-cpu", cpu_usage: 23 } } },
    { type: "graph_data", data: { x_axis: ["01 Jun", "02 Jun", "03 Jun", "04 Jun", "05 Jun", "06 Jun", "07 Jun"], y_axis: [0, 1073741824, 2147483648, 1610612736, 3221225472, 2684354560, 3758096384], label: "Space Used", begin_at_zero: false } },
    { type: "graph_data", data: { x_axis: ["01 Jun", "02 Jun", "03 Jun", "04 Jun", "05 Jun", "06 Jun", "07 Jun"], y_axis: [12, 18, 9, 25, 31, 22, 27], label: "Site Activity", begin_at_zero: true } },
    { type: "user_count", data: 1234 },
    { type: "files_hosted_count", data: 5678 },
  ];
  const accountPayload = () => ({
    token: "rb-fixture-account-token",
    display_name: (PROFILES.full && PROFILES.full.display_name) || "RB Probe",
    email: lsGet("email") || (PROFILES.full && PROFILES.full.email) || "",
  });

  // ------------------------------------------------------------------ WebSocket 桩
  const live = new Set();

  class RbWebSocket {
    constructor(url, protocols) {
      this.url = String(url === null || url === undefined ? "" : url);
      this.protocol = Array.isArray(protocols) ? String(protocols[0] || "") : String(protocols || "");
      this.extensions = "";
      this.binaryType = "arraybuffer";
      this.bufferedAmount = 0;
      this.readyState = 0;                       // CONNECTING
      this.onopen = null; this.onmessage = null; this.onerror = null; this.onclose = null;
      this._ls = Object.create(null);
      this._kind = /\/ws\/upload(\?|#|$)/.test(this.url) ? "upload" : (/\/ws(\?|#|$)/.test(this.url) ? "main" : "other");
      handshake.ctor_calls += 1;
      handshake.ctor_urls.push(this.url);
      push(journal.ctor, { url: this.url, kind: this._kind, at: ms() });
      live.add(this);
      setTimeout(() => { try { this._open(); } catch (e) { noteError(e); } }, OPEN_DELAY_MS);
    }
    addEventListener(type, fn) {
      if (typeof fn !== "function") return;
      const k = String(type);
      if (!this._ls[k]) this._ls[k] = [];
      this._ls[k].push(fn);
    }
    removeEventListener(type, fn) {
      const k = String(type);
      const a = this._ls[k];
      if (!a) return;
      this._ls[k] = a.filter((f) => f !== fn);
    }
    dispatchEvent(ev) {
      const type = ev && ev.type ? String(ev.type) : "message";
      this._fire(type, ev);
      return true;
    }
    // 🔴 两条链一起驱动：onmessage/onopen/… 属性链 ＋ addEventListener 链（Websockets.tsx:73 置空属性后全靠后者）
    _fire(type, ev) {
      const prop = this["on" + type];
      if (typeof prop === "function") { try { prop.call(this, ev); } catch (e) { noteError(e); } }
      const a = this._ls[type];
      if (a && a.length) { for (const fn of a.slice()) { try { fn.call(this, ev); } catch (e2) { noteError(e2); } } }
    }
    _event(type, data) {
      if (typeof MessageEvent === "function") {
        try { return new MessageEvent(type, { data: data }); } catch (e) { noteError(e); }
      }
      return { type: type, data: data, origin: baseHref(), lastEventId: "", source: null, ports: [] };
    }
    _open() {
      if (this.readyState !== 0) return;
      this.readyState = 1;                       // OPEN：FileCard.tsx:165 与 DriveDesktop.tsx:42 的守卫靠它放行
      handshake.opened += 1;
      push(journal.opened, { url: this.url, kind: this._kind, at: ms() });
      this._fire("open", this._event("open", undefined));
    }
    send(data) {
      if (this.readyState !== 1) { push(journal.blocked, { channel: "ws_send_not_open", host: this.url, at: ms() }); return; }
      if (typeof data === "string") {
        let msg = null;
        try { msg = JSON.parse(data); } catch (e) { msg = null; }
        const type = msg && typeof msg.type === "string" ? msg.type : "(unparsable)";
        bumpSent(type);
        push(journal.sent, { url: this.url, kind: this._kind, type: type, bytes: data.length, binary: false, at: ms() });
        try { this._route(type, msg ? msg.data : undefined); } catch (e) { noteError(e); }
        return;
      }
      bumpSent("(binary)");
      handshake.upload_chunks_sent += 1;
      push(journal.sent, { url: this.url, kind: this._kind, type: "(binary)", bytes: byteLengthOf(data), binary: true, at: ms() });
      try { this._routeBinary(data); } catch (e) { noteError(e); }
    }
    close(code, reason) {
      if (this.readyState === 2 || this.readyState === 3) return;
      this.readyState = 2;                       // CLOSING
      const c = code === undefined || code === null ? 1000 : Number(code);
      push(journal.closed, { url: this.url, kind: this._kind, code: c, at: ms() });
      setTimeout(() => {
        if (this.readyState === 3) return;
        this.readyState = 3;                     // CLOSED
        handshake.closed += 1;
        live.delete(this);
        let ev = null;
        if (typeof CloseEvent === "function") {
          try { ev = new CloseEvent("close", { code: c, reason: String(reason || ""), wasClean: true }); } catch (e) { noteError(e); }
        }
        if (!ev) ev = { type: "close", code: c, reason: String(reason || ""), wasClean: true };
        this._fire("close", ev);
      }, CLOSE_DELAY_MS);
    }
    _queue(frames) {
      // 逐帧一个宏任务（等距 1ms）⇒ FIFO 保序，且一定落在应用挂好 addEventListener 之后
      for (let i = 0; i < frames.length; i += 1) {
        const f = frames[i];
        setTimeout(() => { try { this._deliver(f); } catch (e) { noteError(e); } }, REPLY_DELAY_MS + i);
      }
    }
    _deliver(frame) {
      if (this.readyState !== 1) return;         // 已关 ⇒ 丢帧（保真：真连接不会在关闭后投递）
      const type = frame && typeof frame.type === "string" ? frame.type : "(unknown)";
      bumpDelivered(type);
      push(journal.delivered, { url: this.url, kind: this._kind, type: type, at: ms() });
      this._fire("message", this._event("message", JSON.stringify(frame)));
    }
    _route(type, data) {
      switch (type) {
        case "login":
        case "register":
          // 🔴 立刻回一帧**非** "invalid credentials" 的 login_response（Websockets.tsx:62-74 的成功分支才会发 get_user_*）
          this._queue([{ type: type === "login" ? "login_response" : "register_response", data: accountPayload() }]);
          return;
        case "get_user_files":
          this._queue([{ type: "get_user_files_response", data: state.files.map(clone) }]);
          return;
        case "get_user_collections":
          this._queue([{ type: "get_user_collections_response", data: state.collections.map(clone) }]);
          return;
        case "delete_file": {
          const dir = String((data && data.file_directory) || "");
          const i = indexOfFile(dir);
          const removed = i >= 0 ? state.files.splice(i, 1)[0] : mkFile(dir.split("/").pop() || dir, dir, 0, TS.UPLOAD);
          // 后端真序（messageHandlers.go:222-249）：先 delete_file_response，再 file_update{toggle:false} 脉冲
          this._queue([{ type: "delete_file_response", data: { success: removed.original_file_name } }]);
          broadcastMain({ type: "file_update", data: { toggle: false, File: clone(removed) } });
          return;
        }
        case "bulk_delete_files": {
          const dirs = (data && data.file_directories) || [];
          const deleted = [];
          const pulses = [];
          for (const d of dirs) {
            const i = indexOfFile(String(d));
            if (i >= 0) { const r = state.files.splice(i, 1)[0]; deleted.push(r.file_directory); pulses.push({ type: "file_update", data: { toggle: false, File: clone(r) } }); }
          }
          this._queue([{ type: "bulk_delete_files_response", data: { deleted: deleted, errors: [] } }]);
          for (const p of pulses) broadcastMain(p);
          return;
        }
        case "convert_video": {
          const dir = String((data && data.file_directory) || "");
          const i = indexOfFile(dir);
          const f = i >= 0 ? state.files[i] : mkFile(dir, dir, 0, TS.UPLOAD);
          // 后端 HandleConversionRequest 返回 string（convert.go:14）⇒ data 是字符串，不是对象（保真）
          this._queue([{ type: "convert_video_response", data: "conversion queued for " + f.original_file_name }]);
          return;
        }
        case "get_collection":
        case "add_folder_to_collection":
        case "remove_folder_from_collection":
        case "create_folder_in_collection":
        case "add_file_to_collection":
        case "remove_file_from_collection": {
          const id = String((data && (data.id || data.collection_id)) || "");
          const card = findCollection(id) || mkColl(id, "Offline Fixture", 0, 0, 0, 1, TS.DEFAULT_COLL);
          this._queue([
            { type: "get_collection_response", data: { collection_id: card.id, collection_name: card.name, is_owner: true, files: state.files.slice(0, 2).map(clone), folders: [] } },
            { type: "collection_card_update", data: clone(card) },
          ]);
          return;
        }
        case "new_collection": {
          const name = String((data && data.name) || "New Collection");
          const id = "rb-coll-new-" + (state.collections.length + 1);
          const card = mkColl(id, name, 0, 0, 0, 1, TS.DEFAULT_COLL);
          state.collections.push(clone(card));
          this._queue([{ type: "new_collection_response", data: { collection_id: id, collection_name: name, is_owner: true, files: [], folders: [] } }]);
          broadcastMain({ type: "collection_update", data: { toggle: true, collection: clone(card) } });
          return;
        }
        case "delete_collection": {
          const id = String((data && (data.id || data.collection_id)) || "");
          const i = state.collections.findIndex((c) => c.id === id);
          const card = i >= 0 ? state.collections.splice(i, 1)[0] : mkColl(id, "Offline Fixture", 0, 0, 0, 0, TS.DEFAULT_COLL);
          this._queue([{ type: "delete_collection_response", data: { success: true, id: card.id } }]);
          broadcastMain({ type: "collection_update", data: { toggle: false, collection: clone(card) } });
          return;
        }
        case "change_password":
        case "change_email":
        case "change_display_name": {
          if (type === "change_display_name" && data && typeof data.display_name === "string") lsSet("display_name", data.display_name);
          if (type === "change_email" && data && typeof data.email === "string") lsSet("email", data.email);
          if (type === "change_password" && data && typeof data.new_password === "string") lsSet("password", data.new_password);
          this._queue([{ type: type + "_response", data: { success: true } }]);
          return;
        }
        case "import_from_github":
        case "delete_account":
          // messageHandlers.go:125-128 ⇒ 这两型的 responseType 就是 success_notification
          this._queue([{ type: "success_notification", data: type + " accepted (offline fixture)" }]);
          return;
        case "enable_homepage_updates":
          if (data === true || (data && data.enable === true)) this._queue(HOMEPAGE_FRAMES.map(clone));
          return;                                  // data:false ⇒ 停止推送，无回帧（保真）
        case "init": {
          const upId = String((data && data.upload_id) || "");
          this._queue([{ type: "init_ack", data: { upload_id: upId } }]);
          return;
        }
        case "finalize": {
          const upId = String((data && data.upload_id) || "");
          const name = String((data && data.original_file_name) || "uploaded file.bin");
          const dir = (upId.slice(0, 12) || "rbupload0000") + ".bin";     // 确定性派生，0 随机
          const added = mkFile(name, dir, Number((data && data.total_size) || 0) || 0, TS.UPLOAD);
          if (indexOfFile(dir) < 0) state.files.unshift(clone(added));
          this._queue([{ type: "finalize_response", data: { success: true, message: "offline fixture finalize", fileName: name, fileDirectory: dir, accessPath: "/i/" + dir } }]);
          broadcastMain({ type: "file_update", data: { toggle: true, File: clone(added) } });   // uploadws.go:449 的成功脉冲
          return;
        }
        case "cancel":
          return;                                  // 后端无回帧（uploadws.go:376）
        default:
          push(journal.unhandled, { url: this.url, type: type, at: ms() });
      }
    }
    _routeBinary(data) {
      // 协议（uploadws.go:24）：[36 字节 ASCII upload_id][4 字节大端 chunk index][gzip 负载]
      const toBytes = (d) => {
        if (!d) return null;
        if (typeof ArrayBuffer !== "undefined" && d instanceof ArrayBuffer) return new Uint8Array(d);
        if (d instanceof Uint8Array) return d;
        if (typeof d.buffer !== "undefined" && d.buffer) return new Uint8Array(d.buffer, d.byteOffset || 0, d.byteLength || 0);
        return null;
      };
      const bytes = toBytes(data);
      if (!bytes || bytes.byteLength < 40) { push(journal.unhandled, { url: this.url, type: "(binary_short)", at: ms() }); return; }
      let uploadId = "";
      for (let i = 0; i < 36; i += 1) { const c = bytes[i]; if (c === 0) break; uploadId += String.fromCharCode(c); }
      let chunkIndex = 0;
      try { chunkIndex = new DataView(bytes.buffer, bytes.byteOffset + 36, 4).getUint32(0, false); } catch (e) { noteError(e); }
      this._queue([{ type: "chunk_ack", data: { upload_id: uploadId, chunk_index: chunkIndex } }]);
    }
  }
  RbWebSocket.CONNECTING = 0; RbWebSocket.OPEN = 1; RbWebSocket.CLOSING = 2; RbWebSocket.CLOSED = 3;
  RbWebSocket.prototype.CONNECTING = 0; RbWebSocket.prototype.OPEN = 1;
  RbWebSocket.prototype.CLOSING = 2; RbWebSocket.prototype.CLOSED = 3;

  function indexOfFile(dir) {
    for (let i = 0; i < state.files.length; i += 1) if (state.files[i].file_directory === dir) return i;
    return -1;
  }
  function findCollection(id) {
    for (let i = 0; i < state.collections.length; i += 1) if (state.collections[i].id === id) return state.collections[i];
    return null;
  }
  function byteLengthOf(d) {
    if (!d) return 0;
    if (typeof d === "string") return d.length;
    if (typeof d.byteLength === "number") return d.byteLength;
    if (typeof d.size === "number") return d.size;
    return 0;
  }
  function broadcastMain(frame) {
    for (const s of Array.from(live)) {
      if (s._kind === "main" && s.readyState === 1) s._queue([frame]);
    }
  }

  // ------------------------------------------------------------------ 顶替 window.WebSocket（真构造器不留引用 ⇒ 结构上不可能产生真连接）
  W.WebSocket = RbWebSocket;
  handshake.ws_replaced = (W.WebSocket === RbWebSocket);

  //
  const synthResponse = (body) => {
    if (typeof Response === "function") {
      try { return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } }); } catch (e) { noteError(e); }
    }
    return { ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" }, text: () => Promise.resolve(body), json: () => Promise.resolve({}) };
  };
  const nativeFetch = typeof W.fetch === "function" ? W.fetch.bind(W) : null;
  W.fetch = function rbFetch(input, init) {
    const url = typeof input === "string" ? input : String((input && input.url) || input || "");
    if (isLocalUrl(url)) {
      if (nativeFetch) return nativeFetch(input, init);
      return Promise.resolve(synthResponse("{}"));
    }
    // emailjs 的唯一真外网 POST 落在这里 ⇒ 中和成一次本机合成 200，0 字节出网
    push(journal.blocked, { channel: "fetch", host: hostOf(url), at: ms() });
    return Promise.resolve(synthResponse("{}"));
  };
  if (typeof W.XMLHttpRequest === "function" && W.XMLHttpRequest.prototype) {
    const xhrOpen = W.XMLHttpRequest.prototype.open;
    const xhrSend = W.XMLHttpRequest.prototype.send;
    if (typeof xhrOpen === "function" && typeof xhrSend === "function") {
      W.XMLHttpRequest.prototype.open = function rbOpen(method, url) {
        this.__rbLocal = isLocalUrl(url);
        if (!this.__rbLocal) push(journal.blocked, { channel: "xhr.open", host: hostOf(url), at: ms() });
        if (this.__rbLocal) return xhrOpen.apply(this, arguments);
        return undefined;                                  // 非本机：根本不建立连接
      };
      W.XMLHttpRequest.prototype.send = function rbSend(body) {
        if (this.__rbLocal !== false) return xhrSend.apply(this, arguments);
        const self = this;
        setTimeout(() => {
          try {
            Object.defineProperty(self, "readyState", { value: 4, configurable: true });
            Object.defineProperty(self, "status", { value: 200, configurable: true });
            Object.defineProperty(self, "responseText", { value: "{}", configurable: true });
            Object.defineProperty(self, "response", { value: "{}", configurable: true });
          } catch (e) { noteError(e); }
          if (typeof self.onreadystatechange === "function") { try { self.onreadystatechange(); } catch (e2) { noteError(e2); } }
          if (typeof self.onload === "function") { try { self.onload(); } catch (e3) { noteError(e3); } }
          if (typeof self.dispatchEvent === "function" && typeof Event === "function") {
            try { self.dispatchEvent(new Event("load")); } catch (e4) { noteError(e4); }
          }
        }, 0);
        return undefined;
      };
    }
  }
  if (W.navigator && typeof W.navigator.sendBeacon === "function") {
    const nativeBeacon = W.navigator.sendBeacon.bind(W.navigator);
    try {
      W.navigator.sendBeacon = function rbBeacon(url, data) {
        if (isLocalUrl(url)) return nativeBeacon(url, data);
        push(journal.blocked, { channel: "navigator.sendBeacon", host: hostOf(url), at: ms() });
        return false;
      };
    } catch (e) { noteError(e); }
  }
  const nativeOpen = typeof W.open === "function" ? W.open.bind(W) : null;
  W.open = function rbOpen(url, name, features) {
    if (url === undefined || url === null || isLocalUrl(url)) return nativeOpen ? nativeOpen(url, name, features) : null;
    push(journal.blocked, { channel: "window.open", host: hostOf(url), at: ms() });   // Navbar.tsx:125 的外链落这里
    return null;
  };
  // 锚点击闸（Header.tsx:22／Navbar.tsx:38 两个 target=_blank 外链）：捕获期 preventDefault，不改 DOM、不改 href 属性
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("click", (ev) => {
      try {
        const t = ev.target;
        const a = t && typeof t.closest === "function" ? t.closest("a[href]") : null;
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (isLocalUrl(href)) return;
        push(journal.blocked, { channel: "anchor.click", host: hostOf(href), at: ms() });
        ev.preventDefault();
      } catch (e) { noteError(e); }
    }, true);
  }
  // 资源属性闸（纵深防御；🔴 不含 A 标签 ⇒ F06/F07/P11/P12 要读的 href 一律原样保留）
  const guardAttr = (ctorName, prop, channel) => {
    const C = W[ctorName];
    if (!C || !C.prototype) return;
    const d = Object.getOwnPropertyDescriptor(C.prototype, prop);
    if (!d || typeof d.set !== "function") return;
    const nativeSet = d.set, nativeGet = d.get;
    try {
      Object.defineProperty(C.prototype, prop, {
        configurable: true,
        enumerable: d.enumerable,
        get: function () { return typeof nativeGet === "function" ? nativeGet.call(this) : ""; },
        set: function (v) {
          if (isLocalUrl(v)) { nativeSet.call(this, v); return; }
          push(journal.blocked, { channel: channel, host: hostOf(v), at: ms() });
        },
      });
    } catch (e) { noteError(e); }
  };
  guardAttr("HTMLScriptElement", "src", "script.src");
  guardAttr("HTMLLinkElement", "href", "link.href");
  guardAttr("HTMLIFrameElement", "src", "iframe.src");
  guardAttr("HTMLImageElement", "src", "img.src");
  guardAttr("HTMLMediaElement", "src", "media.src");
  if (typeof Element !== "undefined" && Element.prototype && typeof Element.prototype.setAttribute === "function") {
    const nativeSetAttribute = Element.prototype.setAttribute;
    const GUARDED = { SCRIPT: 1, LINK: 1, IFRAME: 1, IMG: 1, AUDIO: 1, VIDEO: 1, OBJECT: 1, EMBED: 1, SOURCE: 1 };
    Element.prototype.setAttribute = function rbSetAttribute(name, value) {
      try {
        const n = String(name).toLowerCase();
        if ((n === "src" || n === "href") && GUARDED[this.tagName] && !isLocalUrl(value)) {
          push(journal.blocked, { channel: "setAttribute:" + n, host: hostOf(value), at: ms() });
          return;
        }
      } catch (e) { noteError(e); }
      return nativeSetAttribute.call(this, name, value);
    };
  }

  // ------------------------------------------------------------------ 启动：先预置 profile 与夹具（必须在应用模块求值前完成）
  applyProfile(readSwitch("rb_profile", "full"));
  loadFixture(readSwitch("rb_fixture", DEFAULT_FIXTURE));

  // ------------------------------------------------------------------ 对外面（只读为主；写面只有夹具/profile/帧三组显式 API）
  W.__RB_STUB__ = {
    version: VERSION,
    kind: "websocket-offline-stub",
    stub_shape: "window.WebSocket 构造器级顶替（/ws ＋ /ws/upload）＋ 非本机出口中和（fetch/XHR/sendBeacon/window.open/anchor/资源属性）",
    profiles: Object.keys(PROFILES),
    fixtures: Object.keys(FIXTURES),
    fixture_map: FIXTURE_MAP,
    default_fixture: DEFAULT_FIXTURE,
    get profile() { return profile; },
    get fixture() { return fixture; },
    get state() { return { files: state.files.map(clone), collections: state.collections.map(clone) }; },
    handshake: handshake,
    journal: journal,
    isStubSocket: (x) => x instanceof RbWebSocket,
    sockets: () => Array.from(live).map((s) => ({ url: s.url, kind: s._kind, readyState: s.readyState, listeners: Object.keys(s._ls) })),
    sentTypes: () => uniq(journal.sent.map((x) => x.type)),
    deliveredTypes: () => uniq(journal.delivered.map((x) => x.type)),
    blockedChannels: () => uniq(journal.blocked.map((x) => x.channel)),
    // 夹具切换：默认切换后**立刻**向活的 /ws 推一帧新的 get_user_files_response ＋ get_user_collections_response
    // ⇒ 应用无需 reload 就换列表（UniversalMessageHandler 走 App.tsx:93 的 addEventListener 链，桩两条链都驱动）
    setFixture: (name, opts) => {
      const r = loadFixture(String(name));
      const wantPush = !opts || opts.push !== false;
      let pushed = 0;
      if (wantPush) {
        for (const s of Array.from(live)) {
          if (s._kind !== "main" || s.readyState !== 1) continue;
          s._queue([
            { type: "get_user_files_response", data: state.files.map(clone) },
            { type: "get_user_collections_response", data: state.collections.map(clone) },
          ]);
          pushed += 1;
        }
      }
      return { fixture: r.fixture, files: r.files, collections: r.collections, pushed_to_sockets: pushed };
    },
    // 🔴 profile 只在**加载前**有效（登录分支在 ws.onopen 里一次性决定）⇒ 运行期改 profile 必须 reload，返回值如实说明
    setProfile: (name) => { const r = applyProfile(String(name)); return { profile: r.profile, seeded: r.seeded, requires_reload: true }; },
    pushFrame: (frame) => { broadcastMain(clone(frame)); return { pushed: true, type: frame && frame.type }; },
    pushFileUpdate: (toggle, target) => {
      let f = null;
      if (target && typeof target === "object") f = Object.assign(mkFile("", "", 0, TS.UPLOAD), target);
      else {
        const dir = String(target || DELETE_TARGET);
        const i = indexOfFile(dir);
        f = i >= 0 ? state.files[i] : mkFile(dir.split("/").pop() || dir, dir, 4096, TS.UPLOAD);
      }
      if (toggle === true) { if (indexOfFile(f.file_directory) < 0) state.files.unshift(clone(f)); }
      else { const i = indexOfFile(f.file_directory); if (i >= 0) state.files.splice(i, 1); }
      broadcastMain({ type: "file_update", data: { toggle: toggle === true, File: clone(f) } });
      return { toggle: toggle === true, file_directory: f.file_directory, files_after: state.files.length };
    },
    pushCollectionCardUpdate: (idOrCard) => {
      const card = (idOrCard && typeof idOrCard === "object" && idOrCard.id)
        ? Object.assign(mkColl("", "", 0, 0, 0, 0, TS.DEFAULT_COLL), idOrCard)
        : findCollection(String(idOrCard || ""));
      if (!card) return { pushed: false, reason: "unknown collection id" };
      broadcastMain({ type: "collection_card_update", data: clone(card) });
      return { pushed: true, id: card.id, name: card.name };
    },
    deleteTarget: DELETE_TARGET,
    extraFile: clone(EXTRA_FILE),
    reset: () => { applyProfile(profile); loadFixture(fixture); return { profile: profile, fixture: fixture }; },
    channels: [
      { channel: "ws /ws", measured: "Websockets.tsx:7,43", disposition: "桩主体（RbWebSocket）", egress: "none" },
      { channel: "ws /ws/upload", measured: "uploadWebsockets.tsx:28,126", disposition: "同一桩顶替；init/chunk/finalize/cancel 已实现", egress: "none", coverage: "未被任何检查点读取" },
      { channel: "fetch/axios/XHR", measured: "全树 0 处（surface.json B3）", disposition: "无需 HTTP 桩；仍顶替 fetch/XHR 作为 emailjs 的闸", egress: "none" },
      { channel: "emailjs", measured: "ContactMe.tsx:44（四参硬编码真凭据）", disposition: "非本机 fetch 一律中和成合成 200 并记账", egress: "blocked" },
      { channel: "apiUrl()", measured: "ApiUrl.tsx:17（定义 1、调用 0）", disposition: "死代码，无需覆盖", egress: "none" },
      { channel: "assetsUrl()", measured: "ApiUrl.tsx:30（无同源短路）", disposition: "不顶替，恒指本机 8080", egress: "local-only" },
      { channel: "github 外链", measured: "Header.tsx:22／Navbar.tsx:38／Navbar.tsx:125", disposition: "window.open 顶替 ＋ 捕获期锚点击闸", egress: "blocked" },
      { channel: "og/twitter meta", measured: "index.html:15,18,22,25", disposition: "运行期不取", egress: "none" },
      { channel: "svg xmlns", measured: "10 处", disposition: "命名空间，非请求", egress: "none" },
      { channel: "字体/CDN", measured: "0 处（index.css:1 只有 @import tailwindcss，构建期解析）", disposition: "无需处置；另有 script/link/img/media 属性闸", egress: "none" },
      { channel: "EventSource", measured: "0 处（surface.json B4）", disposition: "无需处置", egress: "none" },
    ],
    uncovered: [
      "/ws/upload 上传面：桩已实现 init/chunk_ack/finalize_response 与成功脉冲，但 42 条检查点无一读它 ⇒ 记为未覆盖面（不做半顶）",
      "二进制帧的 gzip 负载不解压（只解析 36B upload_id ＋ 4B 大端 index）⇒ chunk_ack 的形状对、内容不校验",
    ],
  };
})();
