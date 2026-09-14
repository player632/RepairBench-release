#!/usr/bin/env node
// dsl_lib.mjs - named script atoms for dsl_runner.mjs.
// Registry of app-specific setup scripts referenced by {"action":"script","target":<name>}.
// Apps: drawdb (repair-react__drawdb-01), vue-fabric-editor (repair-vue__vue-fabric-editor-01),
// fortune-sheet (repair-react__fortune-sheet-01).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- drawdb helpers ----------

// dismiss the pick_db modal that appears on fresh /editor loads with an empty diagram store
async function dbDismissModal(page, label = "generic") {
  try {
    const confirm = page.getByTestId("db-confirm");
    await confirm.waitFor({ state: "visible", timeout: 2500 });
    await page.getByTestId("db-card-" + label).click().catch(() => {});
    await page.waitForTimeout(150);
    await confirm.click();
    await page.waitForTimeout(300);
  } catch (e) { /* modal not present */ }
}

async function dbAddTable(page, { rapid = false, openPanel = true } = {}) {
  const btn = page.getByTestId("add-table");
  await btn.click();
  if (!rapid) await sleep(400);
  if (openPanel) {
    // The side-panel accordion renders TableInfo only for the SELECTED table
    // (Semi Collapse lazyRender); upstream calibration opens the new table's
    // editor by double-clicking it on the canvas (Table.jsx openEditor).
    try {
      const n = await page.getByTestId(/^canvas-table-/).count();
      if (n > 0) {
        await page.getByTestId(`canvas-table-${n - 1}`).dblclick({ timeout: 4000 });
        await sleep(300);
      }
    } catch (e) { /* best effort */ }
  }
}

// drag the grip dot of one field row onto another field row to create a relationship
async function dbLinkFields(page, srcRowId = "table-row-0-0", dstRowId = "table-row-1-0") {
  const src = page.getByTestId(srcRowId);
  const dst = page.getByTestId(dstRowId);
  const s0 = await src.boundingBox();
  if (s0) await src.hover({ position: { x: 13, y: s0.height / 2 } }).catch(() => {});
  await sleep(150);
  const s = await src.boundingBox();
  const d = await dst.boundingBox();
  if (!s || !d) throw new Error("link rows not found");
  // grip dot sits at the left inside the row (~13px from left, vertically centered)
  const sx = s.x + 13, sy = s.y + s.height / 2;
  const dx = d.x + 13, dy = d.y + d.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  // move in steps; pass over the destination row so onPointerEnter sets hoveredTable
  await page.mouse.move(dx, dy, { steps: 18 });
  await sleep(120);
  await dst.hover({ position: { x: 13, y: d.height / 2 }, force: true }).catch(() => {});
  await sleep(120);
  await page.mouse.up();
  await sleep(300);
}

// move canvas table i so its top-left sits at diagram coords (x, y) (assumes zoom=1)
async function dbMoveTableTo(page, i, x, y) {
  const root = page.getByTestId("canvas-root");
  const card = page.getByTestId("canvas-table-" + i);
  const rb = await root.boundingBox();
  const cb = await card.boundingBox();
  if (!rb || !cb) throw new Error("canvas/table not found for move");
  const curX = cb.x - rb.x, curY = cb.y - rb.y;
  const dx = x - curX, dy = y - curY;
  // drag by the table header strip
  const hx = cb.x + Math.min(60, cb.width / 2), hy = cb.y + 12;
  await page.mouse.move(hx, hy);
  await page.mouse.down();
  await page.mouse.move(hx + dx, hy + dy, { steps: 20 });
  await sleep(80);
  await page.mouse.up();
  await sleep(250);
}

async function dbPickDb(page, label) {
  // the pick_db modal appears on fresh /editor loads with an empty diagram store
  const card = page.getByTestId("db-card-" + label);
  try {
    await card.waitFor({ state: "visible", timeout: 4000 });
    await card.click();
    await sleep(150);
    await page.getByTestId("db-confirm").click();
    await sleep(300);
  } catch (e) {
    // modal not present (already has diagrams) - nothing to do for generic default
  }
}

function dbTableFixture(tableId, name, x, y, fieldCount) {
  const fields = [];
  for (let i = 0; i < fieldCount; i++) {
    fields.push({
      name: i === 0 ? "id" : "col_" + i,
      type: "INT",
      default: "",
      check: "",
      primary: i === 0,
      unique: false,
      unsigned: i === 0,
      notNull: i === 0,
      increment: i === 0,
      comment: "",
      id: tableId + "_f" + i,
    });
  }
  return {
    id: tableId,
    name,
    x,
    y,
    locked: false,
    fields,
    comment: "",
    indices: [],
    uniqueConstraints: [],
    color: "#2f68ad",
    collapsed: false,
  };
}


// relationship fixture matching the shape Canvas.handleLinking produces
function dbRelFixture(startTable, endTable, cardinality = "one_to_many") {
  const sf = startTable.fields[0];
  const ef = endTable.fields[0];
  return {
    startTableId: startTable.id,
    startFieldId: sf.id,
    endTableId: endTable.id,
    endFieldId: ef.id,
    cardinality,
    fields: [{ startFieldId: sf.id, endFieldId: ef.id }],
    updateConstraint: "No action",
    deleteConstraint: "No action",
    name: `fk_${startTable.name}_${sf.name}_${endTable.name}`,
    id: startTable.id + "_rel_" + endTable.id,
  };
}

// Deterministic diagram injection into the drawDB IndexedDB store, followed by
// navigation to the diagram route (the loadDiagram path). Replaces UI-click
// multi-table seeding: addTable() places every table at transform.pan, so all
// tables stack at the same coordinates and stacked foreignObjects occlude each
// other's pointer events, which made hover and drag seeding nondeterministic
// (drawdb CP-11/12/13/22/32 hover timeouts). Seeding therefore writes to the
// drawDB store directly and then reloads; the single retained real-interaction
// probe is drag-link (CP-11).
async function dbInjectDiagram(page, lib, { diagramId, database = "generic", name = "wlb-seed", tables, references = [], pan = { x: 290, y: 190 }, zoom = 1 }) {
  await page.evaluate(async (rec) => {
    const open = indexedDB.open("drawDB");
    const idb = await new Promise((res, rej) => {
      open.onsuccess = () => res(open.result);
      open.onerror = () => rej(open.error);
    });
    const store = idb.transaction("diagrams", "readwrite").objectStore("diagrams");
    await new Promise((res, rej) => {
      const rq = store.put(rec);
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
    idb.close();
  }, {
    diagramId, database, name,
    gistId: "", loadedFromGistId: "",
    lastModified: new Date(),
    tables, references, notes: [], areas: [],
    pan, zoom,
  });
  await page.goto(lib.baseUrl + "/editor/diagrams/" + diagramId, { waitUntil: "load", timeout: 60000 });
  await sleep(800);
}

// ---------- registry ----------

// ---------- luckysheet helpers (repair-vanilla__luckysheet-01) ----------
// Geometry comes from window.__lsTest (instrumentation.patch hook: cellPoint /
// colHeaderPoint / rowHeaderPoint read Store.visibledatarow/visibledatacolumn
// and mirror handler.js mouseposition()). Interactions use the REAL Playwright
// mouse so jQuery/canvas handlers see trusted events.

async function lsPoint(page, fn, arg) {
  const p = await page.evaluate(([f, a]) => window.__lsTest[f](a[0], a[1]), [fn, arg]);
  if (!p || typeof p.x !== "number" || typeof p.y !== "number") throw new Error("__lsTest." + fn + " returned " + JSON.stringify(p));
  return p;
}

async function lsWaitReady(page) {
  await page.waitForFunction(() => window.luckysheet && window.__lsTest && Array.isArray(window.luckysheet.getluckysheetfile()) && window.luckysheet.getluckysheetfile().length > 0, { timeout: 45000 });
  await sleep(600);
}

async function lsFillHandleBox(page) {
  const loc = page.locator("#luckysheet-cell-main div.luckysheet-cs-fillhandle");
  await loc.waitFor({ state: "visible", timeout: 4000 });
  const b = await loc.boundingBox();
  if (!b) throw new Error("fill handle bounding box unavailable");
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}


export const scripts = {

  // ---- luckysheet (repair-vanilla__luckysheet-01) ----
  // value: "r,c" — real-mouse click at the center of cell (r,c)
  "ls-click-cell": async (state, step) => {
    const page = state.activePage();
    const [r, c] = String(step.value).split(",").map(Number);
    const p = await lsPoint(page, "cellPoint", [r, c]);
    await page.mouse.click(p.x, p.y);
    await sleep(350);
  },

  // value: "r,c" — real-mouse double click (opens the cell editor)
  "ls-dblclick-cell": async (state, step) => {
    const page = state.activePage();
    const [r, c] = String(step.value).split(",").map(Number);
    const p = await lsPoint(page, "cellPoint", [r, c]);
    await page.mouse.dblclick(p.x, p.y);
    await sleep(350);
  },

  // value: "r1,c1,r2,c2" — select cell (r1,c1), then drag its fill handle to cell (r2,c2)
  "ls-drag-fill": async (state, step) => {
    const page = state.activePage();
    const [r1, c1, r2, c2] = String(step.value).split(",").map(Number);
    const s = await lsPoint(page, "cellPoint", [r1, c1]);
    await page.mouse.click(s.x, s.y);
    await sleep(400);
    const h = await lsFillHandleBox(page);
    const t = await lsPoint(page, "cellPoint", [r2, c2]);
    await page.mouse.move(h.x, h.y);
    await page.mouse.down();
    await page.mouse.move(t.x, t.y, { steps: 14 });
    await sleep(120);
    await page.mouse.up();
    await sleep(700);
  },

  // value: "c1,c2" — press on column header c1, drag to c2 and HOLD (no mouseup)
  "ls-col-drag-hold": async (state, step) => {
    const page = state.activePage();
    const [c1, c2] = String(step.value).split(",").map(Number);
    const a = await lsPoint(page, "colHeaderPoint", [0, c1]);
    const b = await lsPoint(page, "colHeaderPoint", [0, c2]);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 10 });
    await sleep(100);
  },

  // value: "r1,r2" — press on row header r1, drag to r2 and HOLD (no mouseup)
  "ls-row-drag-hold": async (state, step) => {
    const page = state.activePage();
    const [r1, r2] = String(step.value).split(",").map(Number);
    const a = await lsPoint(page, "rowHeaderPoint", [r1, 0]);
    const b = await lsPoint(page, "rowHeaderPoint", [r2, 0]);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 10 });
    await sleep(100);
  },

  // release a held mouse button at the current position
  "ls-mouse-up": async (state) => {
    const page = state.activePage();
    await page.mouse.up();
    await sleep(300);
  },

  // value: text — keyboard.type into whatever has focus (canvas cell editor, contenteditable)
  "ls-type": async (state, step) => {
    const page = state.activePage();
    await page.keyboard.type(String(step.value), { delay: 12 });
    await sleep(200);
  },

  // value: key — keyboard.press (Enter, Escape, ...)
  "ls-press": async (state, step) => {
    const page = state.activePage();
    await page.keyboard.press(String(step.value));
    await sleep(300);
  },

  // wait until luckysheet + __lsTest hooks are live
  "ls-wait-ready": async (state) => {
    await lsWaitReady(state.activePage());
  },

  // drawdb: one table (default generic db, default 1 field "id")
  "seed-one-table": async (state) => {
    const page = state.activePage();
    await dbDismissModal(page);
    await dbAddTable(page);
  },

  // drawdb: one table with exactly two fields
  "seed-one-table-two-fields": async (state) => {
    const page = state.activePage();
    await dbDismissModal(page);
    await dbAddTable(page);
    await page.getByTestId("table-add-field-0").click();
    await sleep(400);
  },

  // drawdb: one table on the generic dialect (default) - same shape as seed-one-table
  "seed-generic-one-table": async (state) => {
    const page = state.activePage();
    await dbDismissModal(page);
    await dbAddTable(page);
  },

  // drawdb: two tables linked by one relationship (seeded cardinality
  // one_to_many per CP-12 calibration; injected at fixed non-overlapping
  // coords so every table row is pointer-reachable)
  "seed-two-tables-linked": async (state, step, lib) => {
    const page = state.activePage();
    const t0 = dbTableFixture("wlb_lnk_t0", "table_wlb_l0", 60, 60, 1);
    const t1 = dbTableFixture("wlb_lnk_t1", "table_wlb_l1", 520, 320, 1);
    await dbInjectDiagram(page, lib, {
      diagramId: "wlb-seed-two-linked",
      tables: [t0, t1],
      references: [dbRelFixture(t0, t1, "one_to_many")],
    });
  },

  // drawdb: mysql dialect + two linked tables (AUTO_INCREMENT in export)
  "seed-mysql-two-tables-linked": async (state, step, lib) => {
    const page = state.activePage();
    const t0 = dbTableFixture("wlb_my_t0", "table_wlb_m0", 60, 60, 1);
    const t1 = dbTableFixture("wlb_my_t1", "table_wlb_m1", 520, 320, 1);
    await dbInjectDiagram(page, lib, {
      diagramId: "wlb-seed-mysql-linked",
      database: "mysql",
      tables: [t0, t1],
      references: [dbRelFixture(t0, t1, "one_to_many")],
    });
  },

  // drawdb: two unlinked single-field tables at fixed coordinates
  // (exact coords required: CP-32 calcPath derivation uses 60,60/520,320)
  "seed-two-tables-fixed-coords-unlinked": async (state, step, lib) => {
    const page = state.activePage();
    await dbInjectDiagram(page, lib, {
      diagramId: "wlb-seed-two-unlinked",
      tables: [
        dbTableFixture("wlb_fix_t0", "table_wlb_f0", 60, 60, 1),
        dbTableFixture("wlb_fix_t1", "table_wlb_f1", 520, 320, 1),
      ],
    });
  },

  // drawdb: two linked single-field tables at fixed coords (end table right-below)
  "seed-two-tables-fixed-coords-end-right-below": async (state, step, lib) => {
    const page = state.activePage();
    const t0 = dbTableFixture("wlb_rb_t0", "table_wlb_r0", 60, 60, 1);
    const t1 = dbTableFixture("wlb_rb_t1", "table_wlb_r1", 520, 320, 1);
    await dbInjectDiagram(page, lib, {
      diagramId: "wlb-seed-two-rb",
      tables: [t0, t1],
      references: [dbRelFixture(t0, t1, "one_to_many")],
    });
  },

  // drawdb: three named tables (CP-35: orders/users/products) at separated coords
  "seed-three-tables": async (state, step, lib) => {
    const page = state.activePage();
    await dbInjectDiagram(page, lib, {
      diagramId: "wlb-seed-three",
      name: "wlb-seed-three",
      tables: [
        dbTableFixture("wlb_3_orders", "orders", 60, 80, 1),
        dbTableFixture("wlb_3_users", "users", 400, 80, 1),
        dbTableFixture("wlb_3_products", "products", 60, 340, 1),
      ],
      pan: { x: 340, y: 255 },
    });
  },

  // drawdb: one table with field 0 selected in the side panel context
  "seed-one-table-selected-field0": async (state) => {
    const page = state.activePage();
    await dbDismissModal(page);
    await dbAddTable(page);
    // open the table's info side sheet so field details are reachable
    await page.getByTestId("table-item-0").click();
    await sleep(300);
    // the seeded id field is autoincrement, which disables the default-value
    // input (FieldDetails: disabled = noDefault || increment); CP-18's
    // derivation requires increment:false. Expand details, uncheck increment,
    // collapse again so the checkpoint's own field-more-0 click expands fresh.
    await page.getByTestId("field-more-0").click();
    await sleep(300);
    await page.locator("div.flex", { hasText: /^Autoincrement$/ }).locator(".semi-checkbox-inner").first().click({ timeout: 5000 });
    await sleep(300);
    await page.getByTestId("field-more-0").click();
    await sleep(300);
  },

  // drawdb: seed a saved diagram (fixed diagramId) directly into IndexedDB,
  // then navigate to the parameterized route so mount runs loadDiagram
  "seed-saved-diagram-one-table": async (state, step, lib) => {
    const page = state.activePage();
    const diagramId = "wlb-seed-diagram-0001";
    await page.evaluate(async (id) => {
      const open = indexedDB.open("drawDB");
      const idb = await new Promise((res, rej) => {
        open.onsuccess = () => res(open.result);
        open.onerror = () => rej(open.error);
      });
      const table = {
        id: "wlbseedtbl01",
        name: "table_wlbseed01",
        x: 120,
        y: 120,
        locked: false,
        fields: [{
          name: "id", type: "INT", default: "", check: "",
          primary: true, unique: false, unsigned: true, notNull: true,
          increment: true, comment: "", id: "wlbseedfld01",
        }],
        comment: "",
        indices: [],
        uniqueConstraints: [],
        color: "#2f68ad",
        collapsed: false,
      };
      const record = {
        diagramId: id,
        database: "generic",
        name: "wlb-seed",
        gistId: "",
        loadedFromGistId: "",
        lastModified: new Date(),
        tables: [table],
        references: [],
        notes: [],
        areas: [],
        pan: { x: 0, y: 0 },
        zoom: 1,
      };
      const store = idb.transaction("diagrams", "readwrite").objectStore("diagrams");
      await new Promise((res, rej) => {
        const rq = store.add(record);
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
      idb.close();
    }, diagramId);
    await page.goto(lib.baseUrl + "/editor/diagrams/" + diagramId, { waitUntil: "load", timeout: 60000 });
    await sleep(800);
  },

  // drawdb: two add-table clicks dispatched within the SAME JS task, with no
  // settle wait. Two separate Playwright click dispatches are two event-loop
  // tasks, and React 18 flushes discrete events per task, so under load the
  // re-render could land between them and close the D1 stale-closure window,
  // which made CP-17 pass intermittently in the defective state. A single
  // evaluate with two synchronous el.click() calls keeps both setStates in one
  // batch: the clean functional updater chains to 2 tables while the D1
  // stale-closure write collapses to 1, deterministically in both states.
  "add-table-x2-same-frame": async (state) => {
    const page = state.activePage();
    await dbDismissModal(page);
    await page.getByTestId("add-table").waitFor({ state: "visible", timeout: 10000 });
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="add-table"]');
      btn.click();
      btn.click();
    });
    await sleep(400);
  },

  // drawdb: create one relationship by dragging field grip -> field grip
  "drag-link": async (state) => {
    const page = state.activePage();
    await dbLinkFields(page, "table-row-0-0", "table-row-1-0");
  },

  // vue-fabric-editor: real-pointer drag from canvas center to marker B
  "wlb-vfe-drag-center-to-b": async (state) => {
    const page = state.activePage();
    const box = await page.getByTestId("wlb-canvas-box").boundingBox();
    const b = await page.getByTestId("wlb-drag-marker-b").boundingBox();
    if (!box || !b) throw new Error("vfe canvas/marker not found");
    const sx = box.x + box.width / 2, sy = box.y + box.height / 2;
    const dx = b.x, dy = b.y;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(dx, dy, { steps: 24 });
    await sleep(80);
    await page.mouse.up();
    await sleep(200);
  },

  // vue-fabric-editor: real-pointer rubber drag from marker A to marker B
  "wlb-vfe-drag-box-a-to-b": async (state) => {
    const page = state.activePage();
    const a = await page.getByTestId("wlb-drag-marker-a").boundingBox();
    const b = await page.getByTestId("wlb-drag-marker-b").boundingBox();
    if (!a || !b) throw new Error("vfe markers not found");
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 24 });
    await sleep(80);
    await page.mouse.up();
    await sleep(200);
  },

  // fortune-sheet: scroll the vertical scrollbar to the bottom
  "wlb-fs-scroll-bottom-y": async (state) => {
    const page = state.activePage();
    const sb = page.getByTestId("scrollbar-y");
    await sb.waitFor({ state: "attached", timeout: 15000 });
    await sb.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await sleep(400);
    await sb.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await sleep(300);
  },

  // seven23: full offline fixture seed via the __SEVEN23__ instrumentation
  // bridge (local account Main/EUR, 8 categories, 13 transactions through the
  // real worker CREATE path, 2 change rates via raw IDB + chain refresh, and
  // account currencies EUR+USD for the convertor). Deterministic amounts and
  // fixed 2025 dates; only the two "current month" transactions use today's
  // date so dashboard totals stay observable in any run month.
  "seven23-seed": async (state) => {
    const page = state.activePage();
    const out = await page.evaluate(async () => {
      for (let i = 0; i < 100; ++i) {
        if (window.__SEVEN23__) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const S = window.__SEVEN23__;
      if (!S) return { error: "no bridge" };
      const st0 = S.store.getState();
      if (st0.accounts.local.length > 0) return { already: true };
      const account = await S.store.dispatch(
        S.AccountActions.create({ name: "Main", currency: 1, isLocal: true })
      );
      await S.store.dispatch(S.AccountActions.switchAccount(account));
      const db = await new Promise((res, rej) => {
        const r = indexedDB.open("seven23", 15);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      const cats = [
        "cat-food:Food", "cat-transport:Transport", "cat-salary:Salary",
        "cat-housing:Housing", "cat-health:Health", "cat-leisure:Leisure",
        "cat-shopping:Shopping", "cat-travel:Travel",
      ].map((x) => {
        const [id, name] = x.split(":");
        return { id, name, account: account.id, active: true, deleted: false, parent: null };
      });
      await new Promise((res, rej) => {
        const tx = db.transaction("categories", "readwrite");
        const os = tx.objectStore("categories");
        cats.forEach((c) => os.put(c));
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
      await S.store.dispatch(S.CategoryActions.refresh());
      const mk = (t) => S.store.dispatch(S.TransactionActions.create(Object.assign(
        { account: account.id, local_currency: 1, isPending: false, category: null }, t)));
      await mk({ name: "Rent January", date: "2025-01-03", local_amount: -800, category: "cat-housing" });
      await mk({ name: "Salary January", date: "2025-01-05", local_amount: 2000, category: "cat-salary" });
      await mk({ name: "Supermarket", date: "2025-01-10", local_amount: -120, category: "cat-food" });
      await mk({ name: "Coffee shop", date: "2025-01-10", local_amount: -8.5, category: "cat-food" });
      await mk({ name: "Train ticket", date: "2025-01-12", local_amount: -45, category: "cat-transport" });
      await mk({ name: "Movie night", date: "2025-01-14", local_amount: -20, category: "cat-leisure" });
      await mk({ name: "New shoes", date: "2025-01-16", local_amount: -60, category: "cat-shopping" });
      await mk({ name: "Pending refund", date: "2025-01-18", local_amount: 75, category: "cat-shopping", isPending: true });
      await mk({ name: "Freelance payment", date: "2025-01-20", local_amount: 300 });
      await mk({ name: "Gym membership", date: "2025-01-01", local_amount: -25, category: "cat-health" });
      await mk({ name: "Bonus March", date: "2025-03-15", local_amount: 150, category: "cat-salary" });
      const now = new Date();
      const iso = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
      await mk({ name: "Current salary", date: iso, local_amount: 1800, category: "cat-salary" });
      await mk({ name: "Current groceries", date: iso, local_amount: -250, category: "cat-food" });
      await new Promise((res, rej) => {
        const tx = db.transaction("changes", "readwrite");
        const os = tx.objectStore("changes");
        os.put({ id: "chg-jan", account: account.id, name: "Rate January", date: "2025-01-01", local_amount: 100, local_currency: 1, new_amount: 110, new_currency: 7 });
        os.put({ id: "chg-mar", account: account.id, name: "Rate March", date: "2025-03-01", local_amount: 100, local_currency: 1, new_amount: 90, new_currency: 7 });
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
      await S.store.dispatch(S.ChangeActions.refresh());
      const cur = S.store.getState().account;
      await S.store.dispatch(S.AccountActions.update(Object.assign({}, cur, { currencies: [1, 7] })));
      const st = S.store.getState();
      return { seeded: true, transactions: st.transactions ? st.transactions.length : -1 };
    }).catch((e) => ({ error: String(e).slice(0, 300) }));
    if (!out || out.error) throw new Error("seven23-seed failed: " + JSON.stringify(out));
    await sleep(400);
  },


  // restfox-ui: full offline fixture seed via the __RESTFOX__ instrumentation
  // bridge (default workspace My Collection, Staging/Production environments, APIs folder with a
  // folder-level header, echo/status/plugin/auth/alpha/bravo requests, runner
  // set). All requests target the deterministic same-origin /proxy echo served
  // by the verifier. baseUrl is injected by the runner.
  "restfox-seed": async (state, step, { baseUrl, sleep }) => {
    const page = state.activePage();
    const out = await page.evaluate(async (BASE) => {
      for (let i = 0; i < 100; ++i) {
        if (window.__RESTFOX__) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const R = window.__RESTFOX__;
      if (!R) return { error: "no bridge" };
      const store = R.store;
      if (store.state.collection.length > 0) return { already: true };
      // first boot auto-creates the default workspace "My Collection" and activates it
      for (let i = 0; i < 150 && (!store.state.activeWorkspace || !store.state.activeWorkspaceLoaded); ++i) await new Promise((r) => setTimeout(r, 100));
      if (!store.state.activeWorkspace) return { error: "workspace not active" };
      const ws = store.state.activeWorkspace;
      const wsId = ws._id;

      const envBase = { base_url: BASE, api_token: "tok-staging" };
      const environments = [
        { name: "Staging", environment: { base_url: BASE, api_token: "tok-staging" }, color: "#61affe" },
        { name: "Production", environment: { base_url: BASE, api_token: "tok-prod" }, color: "#49cc90" },
      ];
      ws.environment = envBase;
      ws.environments = environments;
      ws.currentEnvironment = "Staging";
      store.commit("updateWorkspaceEnvironment", { workspaceId: wsId, environment: envBase });
      store.commit("updateWorkspaceEnvironments", { workspaceId: wsId, environments });
      store.commit("updateWorkspaceCurrentEnvironment", { workspaceId: wsId, currentEnvironment: "Staging" });

      const mk = async (payload) => {
        const r = await store.dispatch("createCollectionItem", payload);
        if (!r || r.error) throw new Error("createCollectionItem failed: " + JSON.stringify(r));
        return r;
      };
      const patch = (id, fields) => R.db.updateCollection(wsId, id, fields);
      const find = (name) => store.state.collection.find((c) => c.name === name);

      await mk({ type: "request_group", name: "APIs", parentId: null });
      const apis = find("APIs");
      await patch(apis._id, { headers: [{ name: "X-Api-Source", value: "folder-value", disabled: false }] });

      await mk({ type: "request", name: "Get Echo", method: "GET", parentId: null, url: "{{base_url}}/echo" });
      await patch(find("Get Echo")._id, { parameters: [{ name: "token", value: "{{api_token}}" }] });

      await mk({ type: "request", name: "Post Echo", method: "POST", parentId: null, url: "{{base_url}}/echo" });
      await patch(find("Post Echo")._id, { body: { mimeType: "application/json", text: '{"token":"{{api_token}}","kind":"post-echo"}' } });

      await mk({ type: "request", name: "Auth Echo", method: "GET", parentId: null, url: "{{base_url}}/echo" });
      await patch(find("Auth Echo")._id, { authentication: { type: "basic", username: "alice", password: "secret", disabled: false } });

      await mk({ type: "request", name: "Status 404", method: "GET", parentId: null, url: "{{base_url}}/status/404" });

      await mk({ type: "request", name: "Folder Echo", method: "GET", parentId: apis._id, url: "{{base_url}}/echo" });
      await patch(find("Folder Echo")._id, { headers: [{ name: "X-Api-Source", value: "request-value", disabled: false }] });

      await mk({ type: "request", name: "Plugin Echo", method: "GET", parentId: null, url: "{{base_url}}/echo" });
      const pluginEcho = find("Plugin Echo");
      store.commit("addPlugin", {
        type: "script",
        name: null,
        code: { pre_request: "", post_request: "test('status is 200', () => {\n    if(rf.response.getStatusCode() !== 200) {\n        throw new Error('expected 200')\n    }\n})" },
        workspaceId: wsId,
        collectionId: pluginEcho._id,
      });

      await mk({ type: "request", name: "Alpha", method: "POST", parentId: null, url: "{{base_url}}/echo" });
      await patch(find("Alpha")._id, { body: { mimeType: "text/plain", text: "alpha-body-content" } });
      await mk({ type: "request", name: "Bravo", method: "POST", parentId: null, url: "{{base_url}}/echo" });
      await patch(find("Bravo")._id, { body: { mimeType: "text/plain", text: "bravo-body-content" } });

      await mk({ type: "request_group", name: "Runner Set", parentId: null });
      const runnerSet = find("Runner Set");
      await mk({ type: "request", name: "Runner One", method: "GET", parentId: runnerSet._id, url: "{{base_url}}/echo" });
      await mk({ type: "request", name: "Runner Two", method: "GET", parentId: runnerSet._id, url: "{{base_url}}/echo" });

      await store.dispatch("refreshWorkspace");
      store.commit("closeAllTabs");
      return { seeded: true, items: store.state.collection.length };
    }, baseUrl).catch((e) => ({ error: String(e).slice(0, 300) }));
    if (!out || out.error) throw new Error("restfox-seed failed: " + JSON.stringify(out));
    await sleep(400);
  },

};
