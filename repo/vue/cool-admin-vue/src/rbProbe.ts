// --- harness instrumentation (IN-1): a strictly READ-ONLY probe bridge, published once as window.__rb ---
// Why this file exists: a repair checkpoint has to compare a scalar it can actually reach. The DSL's
// locator vocabulary resolves data-testid / role= / text= / aria-label= / attr=value only, so it cannot
// express "the third column of the dialog table titled X", "the computed value of --el-color-primary-light-3"
// or "did the loading overlay finish hiding". Those reads are what this bridge provides.
// Hard rules it obeys:
//   * every function READS live application state (DOM text/attributes, computed CSS, localStorage,
//     location) and returns a JSON-safe SCALAR (string | number | boolean | null). No object is ever
//     returned, because dsl_runner compares js_eval results with a loose == against a scalar.
//   * nothing here WRITES application state, dispatches an event, or mutates a store; there is no setter.
//   * no application module imports this file. The only import site is src/main.ts (IN-2), and it is a
//     side-effect-free publish, so removing this file plus that one import restores the seed exactly.
//   * no checkpoint asserts SEED BEHAVIOUR through a value this bridge invents: every reading below is a
//     projection of something a user could see (text, attribute, colour, URL, stored key).
// Failure sentinels are distinctive strings ('__NOCARD__' etc.) rather than '' so that a checkpoint that
// reads the wrong selector is visibly red for the right reason instead of silently matching an empty cell.

function q(sel: string): Element | null {
	try {
		return document.querySelector(sel);
	} catch (e) {
		return null;
	}
}

function qin(root: Element | null, sel: string): Element[] {
	if (!root) return [];
	try {
		return Array.prototype.slice.call(root.querySelectorAll(sel));
	} catch (e) {
		return [];
	}
}

function qa(sel: string): Element[] {
	try {
		return Array.prototype.slice.call(document.querySelectorAll(sel));
	} catch (e) {
		return [];
	}
}

function txt(el: Element | null): string {
	if (!el) return '';
	const html = el as HTMLElement;
	const raw = typeof html.innerText === 'string' ? html.innerText : el.textContent || '';
	return String(raw).replace(/\s+/g, ' ').trim();
}

// cool-admin's cl-dialog (packages/crud/src/components/dialog/index.tsx) renders <el-dialog class="cl-dialog">
// with a CUSTOM #header slot, so the title text lives in .cl-dialog__title and element-plus's default
// .el-dialog__title is never emitted. Read cl-dialog's title first, then fall back to a plain el-dialog title.
function dlgTitle(d: Element | null): string {
	if (!d) return '';
	return txt(d.querySelector('.cl-dialog__title')) || txt(d.querySelector('.el-dialog__title'));
}

const probe = {
	// ---- boot / shell -------------------------------------------------------------
	boot: {
		// The one deterministic readiness gate. Every checkpoint polls THIS instead of sleeping a fixed
		// number of milliseconds: the app boots through bootstrap(app) -> eps -> person -> permmenu ->
		// menu.setRoutes -> router, and src/cool/utils/loading.ts:29 only adds .is-hide to #Loading once
		// src/cool/router/index.ts:47 Loading.close() has run, i.e. after the first route resolved.
		ready(): boolean {
			const app = q('#app');
			if (!app || app.children.length < 1) return false;
			const loading = document.getElementById('Loading');
			if (loading && !loading.classList.contains('is-hide')) return false;
			return !!(q('.app-layout') || q('.page-login'));
		},
		rootKids(): number {
			const app = q('#app');
			return app ? app.children.length : 0;
		},
		loadingHidden(): boolean {
			const l = document.getElementById('Loading');
			return !l || l.classList.contains('is-hide');
		},
		// The preload shell's own name text (src/modules/base/config.ts:50-66 writes config.app.name into
		// .preload__name), which is what a cold index.html shows before Vue mounts.
		shellName(): string {
			return txt(q('#Loading .preload__name'));
		},
		title(): string {
			return String(document.title || '');
		},
		// Which top-level surface is on screen: the login page, the authenticated layout, or neither.
		surface(): string {
			if (q('.page-login')) return 'login';
			if (q('.app-layout')) return 'layout';
			if (q('#app') && (q('#app') as HTMLElement).children.length > 0) return 'other';
			return 'none';
		}
	},

	// ---- location -----------------------------------------------------------------
	loc: {
		path(): string {
			return String(location.pathname || '');
		},
		search(): string {
			return String(location.search || '');
		},
		full(): string {
			return String(location.pathname || '') + String(location.search || '');
		},
		// One query parameter, or '' when absent. Read from the browser's own URL, never from the store,
		// so a checkpoint measures what the router actually committed to the address bar.
		query(name: string): string {
			try {
				const v = new URLSearchParams(location.search).get(name);
				return v === null ? '' : String(v);
			} catch (e) {
				return '__ERR__';
			}
		}
	},

	// ---- generic DOM reads --------------------------------------------------------
	dom: {
		count(sel: string): number {
			return qa(sel).length;
		},
		has(sel: string): boolean {
			return qa(sel).length > 0;
		},
		text(sel: string): string {
			return txt(q(sel));
		},
		// All matches, in DOM order, joined with '|'. Order is part of the reading on purpose: a checkpoint
		// that wants an order-insensitive set sorts it inside its own assert expression.
		texts(sel: string): string {
			return qa(sel)
				.map((e) => txt(e))
				.join('|');
		},
		attr(sel: string, name: string): string {
			const el = q(sel);
			if (!el) return '__NOEL__';
			const v = el.getAttribute(name);
			return v === null ? '__NOATTR__' : String(v);
		},
		classOf(sel: string): string {
			const el = q(sel);
			return el ? String(el.getAttribute('class') || '') : '__NOEL__';
		},
		// Does any element matching sel carry the given class token?
		anyHasClass(sel: string, cls: string): boolean {
			return qa(sel).some((e) => e.classList.contains(cls));
		},
		countWithClass(sel: string, cls: string): number {
			return qa(sel).filter((e) => e.classList.contains(cls)).length;
		},
		bodyText(): string {
			return txt(document.body);
		},
		contains(needle: string): boolean {
			return txt(document.body).indexOf(needle) >= 0;
		}
	},

	// ---- harness globals ----------------------------------------------------------
	globals: {
		// Exactly which __rb* globals exist. A checkpoint reads this to prove the bridge was published once
		// and that no second harness global was smuggled in.
		rbKeys(): string {
			const out: string[] = [];
			for (const k in window) {
				if (Object.prototype.hasOwnProperty.call(window, k) && /^__rb/.test(k)) out.push(k);
			}
			return out.sort().join(',');
		}
	},

	// ---- storage ------------------------------------------------------------------
	storage: {
		localKeys(): string {
			const out: string[] = [];
			for (let i = 0; i < localStorage.length; i += 1) out.push(String(localStorage.key(i)));
			return out.sort().join(',');
		},
		// The RAW stored string. src/cool/utils/storage.ts goes through store@2.0.12's json2 plugin, so the
		// raw value is JSON text ('"en"', '1700000000000'); reading it raw is what lets a checkpoint tell
		// "the key was written under a different name" from "the key was written with a different shape".
		local(name: string): string {
			try {
				const v = localStorage.getItem(name);
				return v === null ? '__ABSENT__' : String(v);
			} catch (e) {
				return '__ERR__';
			}
		},
		sessionKeys(): string {
			const out: string[] = [];
			for (let i = 0; i < sessionStorage.length; i += 1) out.push(String(sessionStorage.key(i)));
			return out.sort().join(',');
		}
	},

	// ---- the process (tab) bar: src/modules/base/pages/main/components/process.vue --
	proc: {
		labels(): string {
			return qa('.app-process__item .label')
				.map((e) => txt(e))
				.join('|');
		},
		count(): number {
			return qa('.app-process__item').length;
		},
		activeCount(): number {
			return qa('.app-process__item.active').length;
		},
		activeLabel(): string {
			const a = qa('.app-process__item.active');
			if (!a.length) return '__NONE__';
			return a.map((e) => txt(e.querySelector('.label'))).join('|');
		},
		// One scalar that carries both the invariant "exactly one tab is active" and "it is the tab the user
		// just navigated to", so a single assert can be red for one reason only.
		activeSummary(): string {
			return String(qa('.app-process__item.active').length) + ':' + probe.proc.activeLabel();
		},
		activePath(): string {
			const a = q('.app-process__item.active');
			return a ? String(a.getAttribute('data-index') === null ? '__NOINDEX__' : a.getAttribute('data-index')) : '__NONE__';
		}
	},

	// ---- theme: src/plugins/theme/hooks/index.ts -----------------------------------
	theme: {
		bodyClass(): string {
			return String(document.body ? document.body.getAttribute('class') || '' : '__NOBODY__');
		},
		bodyDataTheme(): string {
			if (!document.body) return '__NOBODY__';
			const v = document.body.getAttribute('data-theme');
			return v === null ? '__NOATTR__' : String(v);
		},
		// A custom property as the browser computed it on <html>. src/plugins/theme/hooks/index.ts:69-80
		// writes --el-color-primary plus its light-1..9 / dark-1..9 ramp through mix(), so this is the
		// observable end of that arithmetic.
		cssVar(name: string): string {
			try {
				const v = getComputedStyle(document.documentElement).getPropertyValue(name);
				return String(v || '').trim() || '__EMPTY__';
			} catch (e) {
				return '__ERR__';
			}
		},
		drawerOpen(): boolean {
			return qa('.drawer-theme').length > 0;
		}
	},

	// ---- el-tabs -------------------------------------------------------------------
	tabs: {
		// The text of the currently selected tab, read from the tab strip's own aria-selected item.
		activeText(): string {
			const items = qa('.el-tabs__item');
			if (!items.length) return '__NOTABS__';
			const on = items.filter((e) => e.classList.contains('is-active'));
			if (!on.length) return '__NOACTIVE__';
			return on.map((e) => txt(e)).join('|');
		},
		count(): number {
			return qa('.el-tabs__item').length;
		},
		labels(): string {
			return qa('.el-tabs__item')
				.map((e) => txt(e))
				.join('|');
		}
	},

	// ---- el-dialog + el-table ------------------------------------------------------
	dialog: {
		openTitles(): string {
			return qa('.el-dialog')
				.map((d) => dlgTitle(d))
				.filter((s) => s)
				.join('|');
		},
		tableCount(title: string): number {
			const d = qa('.el-dialog').filter((x) => dlgTitle(x) === title)[0];
			return d ? qin(d, '.el-table').length : -1;
		},
		rowCount(title: string): number {
			const d = qa('.el-dialog').filter((x) => dlgTitle(x) === title)[0];
			if (!d) return -1;
			return qin(d, '.el-table__body-wrapper tbody tr').length;
		},
		// One column of the dialog's table, in DOM order, joined with '|'. This is the read that the dict
		// checkpoints need and that no locator vocabulary can express.
		columnTexts(title: string, col: number): string {
			const d = qa('.el-dialog').filter((x) => dlgTitle(x) === title)[0];
			if (!d) return '__NODIALOG__';
			const rows = qin(d, '.el-table__body-wrapper tbody tr');
			if (!rows.length) return '__NOROWS__';
			return rows
				.map((r) => {
					const cells = Array.prototype.slice.call(r.children);
					const c = cells[col];
					return c ? txt(c as Element) : '__NOCELL__';
				})
				.join('|');
		},
		headerTexts(title: string): string {
			const d = qa('.el-dialog').filter((x) => dlgTitle(x) === title)[0];
			if (!d) return '__NODIALOG__';
			return qin(d, '.el-table__header-wrapper th')
				.map((e) => txt(e))
				.filter((s) => s)
				.join('|');
		}
	},

	// ---- el-descriptions -----------------------------------------------------------
	desc: {
		// The content cell that sits next to the label cell, for both the bordered (th/td) and the plain
		// (span/span) el-descriptions layouts.
		itemContent(label: string): string {
			const cells = qa('.el-descriptions__label');
			for (let i = 0; i < cells.length; i += 1) {
				if (txt(cells[i]) !== label) continue;
				const row = cells[i].parentElement;
				if (!row) return '__NOROW__';
				const kids = Array.prototype.slice.call(row.children);
				const at = kids.indexOf(cells[i]);
				const next = kids[at + 1];
				return next ? txt(next as Element) : '__NOCELL__';
			}
			return '__NOLABEL__';
		}
	},

	// ---- the dashboard's cl-number cards -------------------------------------------
	number: {
		// '<number text>|<suffix text>' for the .card whose header label is `label`. Splitting the two
		// matters because src/modules/base/components/num/index.vue renders them as separate nodes and
		// only the first one carries the toFixed() formatting under test.
		parts(label: string): string {
			const cards = qa('.demo-home .card');
			for (let i = 0; i < cards.length; i += 1) {
				if (txt(cards[i].querySelector('.card__header .label')) !== label) continue;
				const n = cards[i].querySelector('.card__container .cl-number');
				if (!n) return '__NONUM__|';
				const suf = n.querySelector('.cl-number__suffix');
				const sufText = suf ? txt(suf) : '';
				let whole = txt(n);
				if (sufText && whole.slice(-sufText.length) === sufText) whole = whole.slice(0, whole.length - sufText.length);
				return whole.trim() + '|' + sufText;
			}
			return '__NOCARD__|';
		},
		// The card footer's static figures (日增用户数 69 / 访客数 142 / 转化率 60%), which are literals in the
		// template and therefore a stable territory guard next to the animated counters.
		footerValue(label: string): string {
			const cards = qa('.demo-home .card');
			for (let i = 0; i < cards.length; i += 1) {
				if (txt(cards[i].querySelector('.card__header .label')) !== label) continue;
				const spans = qin(cards[i], '.card__footer span');
				return spans.length >= 2 ? txt(spans[spans.length - 1]) : '__NOFOOTER__';
			}
			return '__NOCARD__';
		}
	},

	// ---- the offline fixture's own ledger (adaptation AD-1/AD-3) --------------------
	backend: {
		// How many fixture endpoints were answered / went unanswered. This reads the harness ledger that
		// AD-3 published as window.__rbBackend; it is a STRUCTURAL sentinel (did the offline data plane
		// answer at all), never an assertion about seed behaviour.
		calls(): number {
			const b = (window as any).__rbBackend;
			return b && Array.isArray(b.calls) ? b.calls.length : -1;
		},
		misses(): number {
			const b = (window as any).__rbBackend;
			return b && Array.isArray(b.misses) ? b.misses.length : -1;
		},
		missList(): string {
			const b = (window as any).__rbBackend;
			return b && Array.isArray(b.misses) ? b.misses.slice(0, 12).join(',') : '__NOLEDGER__';
		}
	}
};

export type RbProbe = typeof probe;

// Idempotent publish: assigning twice would hide a double-install, so the second call is a no-op and
// window.__rb keeps the FIRST bridge object (a checkpoint asserts exactly one __rb* global exists).
export function installRbProbe(): boolean {
	const w = window as any;
	if (w.__rb) return false;
	w.__rb = probe;
	return true;
}

export default probe;
