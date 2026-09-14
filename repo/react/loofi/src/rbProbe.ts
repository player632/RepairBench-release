// Strictly READ-ONLY observation bridge for the WLB repair-bench verifier.
//
// Contract this file obeys, line by line:
//   * it never writes to localStorage / sessionStorage / cookies / indexedDB,
//   * it never mutates a DOM node (no classList / style / innerText / attribute write, no event
//     dispatch, no focus(), no scroll),
//   * it never calls into application code and never imports an application module,
//   * it publishes EXACTLY ONE global, `window.__rb`, and it publishes it at most once,
//   * every reader is FAIL-CLOSED: a missing node yields a sentinel STRING ('__NOEL__', '__NONE__',
//     '__EMPTY__', '__NOGROUP__', '__NOPROBE__') and a throw is converted into '__ERR__:<message>',
//     so a red checkpoint always reads as a difference of scalar VALUES and never as an exception.
//
//
// labels are deliberately named `headLabel` / `tailLabel` rather than anything containing
// currentTime / duration / elapsed / progress / paused / playing / playback. Those two words stay out
// of every assertion expression; the one checkpoint that reads an asynchronously-loaded quantity
// (F06) does so through the R22-2 latch form, where the sampler lives in `setup` and the assertion
// reads only the latched boolean `window.__L['F06'].hit`.
const NOEL = '__NOEL__';
const NONE = '__NONE__';
const EMPTY = '__EMPTY__';

const q = (selector: string): Element | null => document.querySelector(selector);
const qa = (selector: string): Element[] =>
    Array.prototype.slice.call(document.querySelectorAll(selector)) as Element[];
const byId = (id: string): HTMLElement | null => document.getElementById(id);
const testid = (id: string): Element | null => q(`[data-testid="${id}"]`);

const txt = (el: Element | null): string =>
    el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : NOEL;

// MUI renders an `<a>` when a Button carries `href` (download.component.tsx:44-56) and a real
// `<button disabled>` otherwise, so "disabled" has to be read three ways to mean the same thing.
const isDisabled = (el: Element | null): boolean => {
    if (!el) return false;
    if ((el as HTMLButtonElement).disabled === true) return true;
    if (el.getAttribute('aria-disabled') === 'true') return true;
    return String(el.getAttribute('class') || '').indexOf('Mui-disabled') >= 0;
};

const scoped = (hostId: string, selector: string): Element[] => {
    const host = testid(hostId);
    if (!host) return [];
    return Array.prototype.slice.call(host.querySelectorAll(selector)) as Element[];
};

// R24 (P12): #footer is a SEED id that controls.component.tsx:119 renders exactly once and nothing else in
// the tree reuses, so scoping by it is unambiguous; there is no instrumentation-added testid for the footer.
// Read-only, fail-closed on a missing host, returns [] rather than throwing.
const inFooter = (selector: string): Element[] => {
    const host = byId('footer');
    if (!host) return [];
    return Array.prototype.slice.call(host.querySelectorAll(selector)) as Element[];
};

// Two path prefixes that are unique to each of the two speaker glyphs in
// src/lib/icons.component.tsx (Audio at :199, MutedAudio at :211). Read-only string comparison, so
// the cold-boot "crossed-out speaker" can be told apart from the plain one - which matters because
// controls.component.tsx:183 lights the muted glyph whenever `muted || volume === 0`, and the cold
// boot volume IS 0 by design (see the decoy guard P14).
const ICON_PLAIN_MARK = '5.353-9.348';
const ICON_MUTED_MARK = '2.94-7.763';

const build = () => ({
    boot: {
        // The app is up when the sidebar tab strip, the footer transport bar and a mounted React root
        // all exist. Every checkpoint's setup polls this behind a bounded gate before asserting.
        ready: (): boolean =>
            !!(byId('tabs') && byId('footer') && byId('root')) &&
            (byId('root') as HTMLElement).childElementCount >= 1,
        rootKids: (): number => {
            const root = byId('root');
            return root ? root.childElementCount : -1;
        },
        mounted: (): boolean => {
            const root = byId('root');
            return !!root && root.childElementCount >= 1;
        },
        // App.tsx:17-23 appends 79 decorative divs to the static .backdrop-overlay node in
        // public/index.html. The count is a deterministic adaptation-territory reading (the opacity
        // values themselves come from the seeded `decorRandom` stream and are deliberately NOT
        // asserted: CSSOM number serialisation is not something a verifier should pin).
        backdropDivs: (): number => qa('.backdrop-overlay div').length,
        backdropPainted: (): boolean => {
            const divs = qa('.backdrop-overlay div');
            if (!divs.length) return false;
            return divs.every(
                (d) => String((d as HTMLElement).style.opacity || '') !== ''
            );
        },
        cards: (): number => scoped('home-root', '.card').length,
        largeCards: (): number => scoped('home-root', '.large-card').length,
        firstCardTitle: (): string => txt(q('[data-testid="home-root"] .card p')),
    },
    globals: {
        // Exactly one probe global, published once. `window.__L` (the R22 latch namespace the runner
        // installs from `setup`) does not start with `__rb`, so it is not counted here - and any
        // "fix" that smuggles state through a new `__rb*` global shows up immediately.
        rbKeys: (): string =>
            Object.keys(window)
                .filter((k) => k.indexOf('__rb') === 0)
                .sort()
                .join(','),
    },
    storage: {
        localKeys: (): string => Object.keys(window.localStorage).sort().join(','),
        sessionKeys: (): string => Object.keys(window.sessionStorage).sort().join(','),
    },
    net: {
        // Resource-timing based: an entry whose name is neither same-origin nor a data URI is an
        // external request. Read-only, and it is the P01/P16 proof that the offline adaptation really
        // removed every third-party call (firebase socket, githubusercontent artwork/audio, the
        // loofi.stanleyowen.com release feed and the two App.css background images).
        externalCount: (): number => {
            try {
                const origin = window.location.origin;
                const entries = performance.getEntriesByType(
                    'resource'
                ) as PerformanceEntry[];
                let n = 0;
                for (const e of entries) {
                    const name = String(e.name || '');
                    if (name.indexOf(origin) === 0) continue;
                    if (name.indexOf('data:') === 0) continue;
                    if (name.indexOf('blob:') === 0) continue;
                    n++;
                }
                return n;
            } catch (err) {
                return -1;
            }
        },
    },
    pane: {
        // `properties.activeTab` is the app's ONLY navigation state (there are zero <Route> elements
        // in the whole tree; base.component.tsx:18-36 picks the pane with a ternary chain), so "which
        // pane is mounted" IS the reading of activeTab. Order matters: the search field is the most
        // specific marker, the settings container the least.
        // R24 CORRECTION (appended, nothing deleted): `id="settings"` is NOT a usable pane marker through
        // getElementById, because the seed renders that id TWICE - sidebar.component.tsx:69 puts
        // id={tab.toLowerCase()} on every tab Button, so a `button#settings` sits in the DOM on EVERY pane,
        // while settings.component.tsx:41 puts id="settings" on the pane container, and MUI renders a
        // Button without href as a real <button>. getElementById returns the first match in document order,
        // i.e. the sidebar button, so this reader answered 'settings' on the Home pane in all six runs of the
        // 2026-09-09T08:49Z leg (P01/F10/F12 red as "expected home, actual settings") even though Home was
        // provably mounted in those same runs - their setup gate boot.cards()===12 counts
        // [data-testid="home-root"] .card and PASSED. meta.json's own instrumentation note records this exact
        // collision ("the sidebar renders id=download/id=settings while download.component.tsx:34 and
        // settings.component.tsx:41 render the same two ids"), which is why the download branch already reads
        // testid('download-root') instead of byId('download'). This now obeys the same rule for settings:
        // tag-qualify to the pane container, and test home-root first. 0 expected values changed, and all five
        // labels still return, so P03/P05/P13/P15/F01/F02/F11 keep their readings.
        name: (): string => {
            if (byId('search-query')) return 'search';
            if (testid('download-root')) return 'download';
            if (testid('home-root')) return 'home';
            if (q('div#settings')) return 'settings';
            return 'none';
        },
    },
    nav: {
        backDisabled: (): boolean => isDisabled(testid('nav-back')),
        forwardDisabled: (): boolean => isDisabled(testid('nav-forward')),
        tabCount: (): number => qa('#tabs button').length,
        tabLabels: (): string => {
            const tabs = qa('#tabs button');
            if (!tabs.length) return NONE;
            return tabs
                .map((b) => txt(b.children[1] || null))
                .join('|');
        },
        // sidebar.component.tsx:28-37 keeps the `.active` class on the tab strip in sync with
        // `properties.activeTab` through a direct DOM write, i.e. a SECOND channel next to React's own
        // `SolidIcon`/`OutlineIcon` swap. Reading it is how D01/D12 get caught even when the icon swap
        // would still look right.
        activeTabLabel: (): string => {
            const active = q('#tabs button.active');
            return active ? txt(active.children[1] || null) : NONE;
        },
    },
    deck: {
        footerTitle: (): string => txt(q('#footer .song-title')),
        footerAuthor: (): string => txt(q('#footer .author')),
        // `.progress-time` occurs exactly twice inside the footer (controls.component.tsx:155-170):
        // [0] is #current-duration, the play-head side; [1] is the total side, fed by
        // `property.duration`. Neither name mentions a media quantity, per the R22 naming discipline.
        headLabel: (): string => {
            const els = qa('#footer .progress-time');
            return els.length > 0 ? txt(els[0]) : NOEL;
        },
        tailLabel: (): string => {
            const els = qa('#footer .progress-time');
            return els.length > 1 ? txt(els[1]) : NOEL;
        },
        // R24 (P12 PLAYBACK_BAR): the two COUNTS as well as the two labels. meta.json's instrumentation note
        // already declares both names in this probe's surface ("deck.footerTitle/footerAuthor/headLabel/
        // tailLabel/volumeValue/muteIconName/timeSlotCount/barCount/prevDisabled/nextDisabled") but they were
        // never exposed, so P12 read "__ERR__:window.__rb.deck.timeSlotCount is not a function" in all six
        // runs of the 2026-09-09T08:49Z leg. The dsl calls 40 distinct probe methods against 43 defined and
        // the difference is exactly these two, so nothing else was latently missing. Ground truth read from
        // the seed: controls.component.tsx renders ONE .playback-bar (:160) inside #footer (:119) and exactly
        // TWO .progress-time slots (:162 play-head side, :174 total side) => P12's expected 2 and 1 are
        // correct and are NOT changed here. Pure counts of what the seed already renders, scoped to #footer;
        // the names stay inside the probe per the R22 naming discipline.
        timeSlotCount: (): number => inFooter('.progress-time').length,
        barCount: (): number => inFooter('.playback-bar').length,
        imageSrc: (): string => {
            const img = q('#footer img');
            return img ? String(img.getAttribute('src') || EMPTY) : NOEL;
        },
        prevDisabled: (): boolean => isDisabled(testid('deck-prev')),
        nextDisabled: (): boolean => isDisabled(testid('deck-next')),
        // Reserve reader: MUI Slider exposes its value on the thumb (`role="slider"`), and falls back
        // to the hidden range input. Kept in the probe surface but NOT asserted by any checkpoint in
        // this draft - it is the first thing a feasibility leg should confirm before it is promoted.
        volumeValue: (): number => {
            const host = q('#footer .audio');
            if (!host) return -1;
            const thumb = host.querySelector('[role="slider"]');
            const fromThumb = thumb ? thumb.getAttribute('aria-valuenow') : null;
            if (fromThumb !== null) return Number(fromThumb);
            const input = host.querySelector('input');
            return input ? Number((input as HTMLInputElement).value) : -1;
        },
        muteIconKind: (): string => {
            const btn = testid('deck-mute');
            if (!btn) return NOEL;
            const p = btn.querySelector('svg path');
            const d = p ? String(p.getAttribute('d') || '') : '';
            if (!d) return '__NOPATH__';
            if (d.indexOf(ICON_PLAIN_MARK) >= 0) return 'plain';
            if (d.indexOf(ICON_MUTED_MARK) >= 0) return 'muted';
            return '__OTHERICON__';
        },
    },
    theme: {
        // app.component.tsx:137-143 and preferences.component.tsx:28-34 both write
        // `#backdrop-image`'s INLINE background. Classified rather than returned verbatim so the
        // expected value never has to carry the run's port number.
        backdropTag: (): string => {
            const el = byId('backdrop-image');
            if (!el) return NOEL;
            const s = String(el.style.background || '');
            if (!s) return EMPTY;
            const at = s.indexOf('rb-theme=');
            if (at >= 0) {
                const slug = s.slice(at + 9).replace(/["')\s].*$/, '');
                return 'theme:' + slug;
            }
            return '__OTHER__:' + s.slice(0, 60);
        },
        // preferences.component.tsx:36-48 mirrors the stored theme name onto the theme buttons'
        // `.active` class - the third channel of the same state.
        activeThemeButton: (): string => {
            const host = byId('themes');
            if (!host) return NOEL;
            const active = host.querySelector('button.active');
            return active ? String(active.getAttribute('data-testid') || NONE) : NONE;
        },
    },
    search: {
        inputValue: (): string => {
            const el = byId('search-query');
            return el ? (el as HTMLInputElement).value : NOEL;
        },
        // The `<b>` section headers ("Songs" / "Artists") live in `.col-4` wrappers; the
        // "No Results Found for <b>kw</b>" block is `.mt-30` WITHOUT `.col-4`, so the child combinator
        // keeps the echoed keyword out of this reading.
        sections: (): string => {
            const root = testid('search-root');
            if (!root) return NOEL;
            const bs = scoped('search-root', '.col-4 > b');
            if (!bs.length) return NONE;
            return bs.map((b) => txt(b)).join('|');
        },
        groupCount: (): number => qa('#playlist').length,
        groupTitles: (index: number): string => {
            const groups = qa('#playlist');
            const g = groups[Number(index)];
            if (!g) return '__NOGROUP__';
            const hs = Array.prototype.slice.call(
                g.querySelectorAll('.large-card h3')
            ) as Element[];
            if (!hs.length) return NONE;
            return hs.map((h) => txt(h)).join('|');
        },
    },
    download: {
        fileNames: (): string => {
            const ps = scoped('download-root', 'p.small');
            if (!ps.length) return NOEL;
            return ps.map((x) => txt(x) || EMPTY).join('|');
        },
        actionsEnabled: (): boolean => {
            const bs = scoped('download-root', 'a, button');
            if (!bs.length) return false;
            return bs.every((b) => !isDisabled(b));
        },
        // Gate condition for the bounded poll in P13: the axios call in
        // download.component.tsx:12-19 has no `.catch`, so the three filename slots stay empty until
        // the same-origin /latest.json fixture resolves.
        ready: (): boolean => {
            const ps = scoped('download-root', 'p.small');
            if (ps.length !== 3) return false;
            return ps.every((x) => txt(x) !== '');
        },
    },
    about: {
        version: (): string => txt(q('[data-testid="about-root"] .small')),
    },
    dom: {
        count: (selector: string): number => qa(String(selector)).length,
        text: (selector: string): string => txt(q(String(selector))),
        attr: (selector: string, name: string): string => {
            const el = q(String(selector));
            return el ? String(el.getAttribute(String(name)) || EMPTY) : NOEL;
        },
        classHas: (selector: string, cls: string): boolean => {
            const el = q(String(selector));
            return el ? el.classList.contains(String(cls)) : false;
        },
        // getElementById rather than a CSS selector: the play-button ids are built by the application
        // itself as `(title + author).replace(/\s/g, '-')` and are therefore not guaranteed to be
        // CSS-escapable. D07's whole observable is "this id lookup stops finding the card".
        byIdClassHas: (id: string, cls: string): boolean => {
            const el = byId(String(id));
            return el ? el.classList.contains(String(cls)) : false;
        },
        byIdExists: (id: string): boolean => !!byId(String(id)),
    },
});

export type RbProbe = ReturnType<typeof build>;

export function publishRbProbe(): boolean {
    const w = window as unknown as { __rb?: RbProbe };
    if (w.__rb) return false; // published exactly once, ever
    w.__rb = build();
    return true;
}
