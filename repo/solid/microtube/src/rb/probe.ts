// RepairBench read-only instrumentation probe.
// Publishes observable application state for the verifier. Every reader is read-only and
// fail-closed: on error it returns an inert sentinel instead of throwing.
const q = (sel: string): Element | null => document.querySelector(sel);
const qa = (sel: string): Element[] => Array.prototype.slice.call(document.querySelectorAll(sel));
const txt = (el: Element | null): string | null => (el ? (el.textContent || '').trim() : null);
const norm = (s: string | null): string | null => (s === null ? null : s.replace(/\s+/g, ' ').trim());

const stub = (): any => (window as any).__RB_STUB__ || null;

const api = {
    // ---------- 环境／路由 ----------
    route: (): string => window.location.pathname + window.location.search,
    docTitle: (): string => document.title,
    probeVersion: (): string => 'rb-probe/microtube/v1',

    // ---------- 启动门 ----------
    appReady: (): boolean => !!q('[data-rb-main]'),
    loaderPresent: (): boolean => !!q('[data-rb-root] > .absolute.inset-0'),
    loginWallText: (): string | null => {
        const hits = qa('[data-rb-placeholder-text]');
        for (const h of hits) {
            const t = norm(txt(h));
            if (t && t.indexOf('logged in') >= 0) return t;
        }
        return null;
    },
    placeholderTexts: (): string[] => qa('[data-rb-placeholder-text]').map((e) => norm(txt(e))).filter((x) => x !== null) as string[],

    // ---------- 卡片列表（Playlists / Playlist 页共用 ListItem） ----------
    cardTitles: (): string[] => qa('[data-rb-card]').map((c) => norm(txt(c.querySelector('[data-rb-title]')))).filter((x) => x !== null) as string[],
    cardCount: (): number => qa('[data-rb-card]').length,
    cardBadge: (titleContains: string): string | null => {
        const cards = qa('[data-rb-card]');
        for (const c of cards) {
            const t = norm(txt(c.querySelector('[data-rb-title]'))) || '';
            if (t.indexOf(titleContains) >= 0) return norm(txt(c.querySelector('[data-rb-badge]')));
        }
        return null;
    },
    cardBadges: (): string[] => {
        const out: string[] = [];
        for (const c of qa('[data-rb-card]')) {
            const t = norm(txt(c.querySelector('[data-rb-title]'))) || '';
            const b = norm(txt(c.querySelector('[data-rb-badge]')));
            out.push(t + '=' + (b === null ? '<none>' : b));
        }
        return out;
    },
    cardIndexOf: (titleContains: string): number => {
        const cards = qa('[data-rb-card]');
        for (let i = 0; i < cards.length; i += 1) {
            const t = norm(txt(cards[i].querySelector('[data-rb-title]'))) || '';
            if (t.indexOf(titleContains) >= 0) return i;
        }
        return -1;
    },
    cardSubtitle: (titleContains: string): string | null => {
        for (const c of qa('[data-rb-card]')) {
            const t = norm(txt(c.querySelector('[data-rb-title]'))) || '';
            if (t.indexOf(titleContains) >= 0) return norm(txt(c.querySelector('[data-rb-subtitle]')));
        }
        return null;
    },
    cardSubSubtitle: (titleContains: string): string | null => {
        for (const c of qa('[data-rb-card]')) {
            const t = norm(txt(c.querySelector('[data-rb-title]'))) || '';
            if (t.indexOf(titleContains) >= 0) return norm(txt(c.querySelector('[data-rb-subsubtitle]')));
        }
        return null;
    },
    // 缩略图 img 是否真的挂载（Img.tsx 用加载成功门控 <img> ⇒ 这是「异步加载门控渲染」类的可读面）
    cardImgMounted: (titleContains: string): boolean => {
        for (const c of qa('[data-rb-card]')) {
            const t = norm(txt(c.querySelector('[data-rb-title]'))) || '';
            if (t.indexOf(titleContains) >= 0) return !!c.querySelector('img');
        }
        return false;
    },

    // ---------- 队列面板 ----------
    queueHeaderText: (): string | null => norm(txt(q('[data-rb-queue="panel"] header > span:first-child > span'))),
    queueItemIds: (): string[] => qa('[data-rb-queue-item]').map((e) => e.getAttribute('data-rb-queue-item') || ''),
    queueItemCount: (): number => qa('[data-rb-queue-item]').length,
    queueItemTitles: (): string[] => qa('[data-rb-queue-item]').map((e) => norm(txt(e.querySelector('[data-rb-title]')))).filter((x) => x !== null) as string[],
    queueItemBadge: (id: string): string | null => {
        const el = q('[data-rb-queue-item="' + id + '"]');
        return el ? norm(txt(el.querySelector('[data-rb-badge]'))) : null;
    },
    queueItemBadges: (): string[] => qa('[data-rb-queue-item]').map((e) => (e.getAttribute('data-rb-queue-item') || '') + '=' + (norm(txt(e.querySelector('[data-rb-badge]'))) || '<none>')),
    // 🔴 修掉的恒真装饰（本轮实测揪出来）：旧写法是 items[i].querySelector('[data-rb-queue-item-active="1"]')，
    //   而 instrumentation 把 data-rb-queue-item 与 data-rb-queue-item-active **加在同一个元素上**
    //   （components/player/QueueItem.tsx 的外层 div）⇒ querySelector 只找**后代**、永远找不到自己 ⇒ 恒返回 -1。
    //   桩把 currentId 播种成 SEEDED_QUEUE_VIDEO.id（＝队列唯一那条 rbseed00001），Queue.tsx:81 的
    //
    //   『高亮走 currentId、不经 D08 的 getter』隔离守卫变成砸不动的装饰（改 currentId 也读不出变化）。
    queueActiveIndex: (): number => {
        const items = qa('[data-rb-queue-item]');
        for (let i = 0; i < items.length; i += 1) {
            if (items[i].getAttribute('data-rb-queue-item-active') === '1') return i;
        }
        return -1;
    },
    queueActiveIds: (): string[] => qa('[data-rb-queue-item]')
        .filter((e) => e.getAttribute('data-rb-queue-item-active') === '1')
        .map((e) => e.getAttribute('data-rb-queue-item') || '') as string[],
    queuePanelVisible: (): boolean => {
        const s = q('[data-rb-queue="panel"]');
        return !!s && (s.getAttribute('class') || '').indexOf('translate-y-0') >= 0;
    },
    newQueueBadge: (): string | null => norm(txt(q('[data-rb-hook="queue-toggle"] [data-rb-badge]'))),
    queueToggleHasBadgeClass: (): boolean => {
        const b = q('[data-rb-hook="queue-toggle"]');
        return !!b && (b.getAttribute('class') || '').indexOf('badge--active') >= 0;
    },

    // ---------- 播放器信息条 ----------
    infoTitle: (): string | null => norm(txt(q('[data-rb-info-title]'))),
    infoTimeCurrent: (): string | null => norm(txt(q('[data-rb-time-current]'))),
    infoTimeDuration: (): string | null => norm(txt(q('[data-rb-time-duration]'))),
    infoTimePair: (): string => (api.infoTimeCurrent() || '<none>') + ' / ' + (api.infoTimeDuration() || '<none>'),
    playerHookPresent: (hook: string): boolean => !!q('[data-rb-hook="' + hook + '"]'),
    playerHookDisabled: (hook: string): boolean | null => {
        const b = q('[data-rb-hook="' + hook + '"]');
        return b ? b.hasAttribute('disabled') : null;
    },
    playerHookCount: (): number => qa('[data-rb-hook]').length,
    screenPlaceholderText: (): string | null => norm(txt(q('[data-rb-screen] [data-rb-placeholder-text]'))),

    // ---------- 通知（D11 时序面） ----------
    notificationPresent: (): boolean => !!q('[data-rb-notification]'),
    notificationMessage: (): string | null => norm(txt(q('[data-rb-notification-message]'))),
    notificationState: (): string => (api.notificationPresent() ? 'visible:' + (api.notificationMessage() || '') : 'absent'),

    // ---------- 富文本链接面（D06） ----------
    richText: (sel: string) => {
        const root = q(sel);
        if (!root) return null;
        const anchors = Array.prototype.slice.call(root.querySelectorAll('a'));
        return {
            mailtos: anchors.filter((a: any) => String(a.getAttribute('href') || '').indexOf('mailto:') === 0).map((a: any) => a.getAttribute('href')),
            blanks: anchors.filter((a: any) => a.getAttribute('target') === '_blank').map((a: any) => a.getAttribute('href')),
            anchorCount: anchors.length,
            text: norm(root.textContent || '')
        };
    },
    channelAboutMailto: (): string | null => {
        const r = api.richText('[data-rb-channel-about]');
        return r && r.mailtos.length ? r.mailtos[0] : null;
    },
    channelAboutBlankCount: (): number => {
        const r = api.richText('[data-rb-channel-about]');
        return r ? r.blanks.length : -1;
    },
    descriptionMailto: (): string | null => {
        const r = api.richText('[data-rb-description]');
        return r && r.mailtos.length ? r.mailtos[0] : null;
    },

    // ---------- 持久化面（D09 ＋ 结构柱④ 状态隔离） ----------
    storageKeyList: (): string[] => Object.keys(window.localStorage).sort(),
    sessionKeyList: (): string[] => Object.keys(window.sessionStorage).sort(),
    persisted: (): any => {
        const raw = window.localStorage.getItem('microtube');
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return '<unparseable>'; }
    },
    persistedTopKeys: (): string[] => {
        const p = api.persisted();
        return p && typeof p === 'object' ? Object.keys(p).sort() : [];
    },
    persistedPlayerKeys: (): string[] => {
        const p = api.persisted();
        return p && p.player && typeof p.player === 'object' ? Object.keys(p.player).sort() : [];
    },
    persistedHas: (key: string): boolean => {
        const p = api.persisted();
        return !!(p && typeof p === 'object' && Object.prototype.hasOwnProperty.call(p.player || {}, key));
    },
    persistedQueueLength: (): number => {
        const p = api.persisted();
        return p && p.player && Array.isArray(p.player.queue) ? p.player.queue.length : -1;
    },
    globalRbKeys: (): string[] => Object.keys(window).filter((k) => k.indexOf('__rb') === 0 || k.indexOf('__RB') === 0).sort(),

    // ---------- 桩账本（0 联网自证面） ----------
    stubPresent: (): boolean => !!stub(),
    stubSeededStorage: (): boolean | null => { const s = stub(); return s ? !!s.seededLocalStorage : null; },
    stubYoutubeRequests: (): number => { const s = stub(); return s ? s.log.youtube.length : -1; },
    stubYoutubePaths: (): string[] => { const s = stub(); return s ? s.log.youtube.map((r: any) => r.path) : []; },
    stubFirebaseAttempts: (): number => { const s = stub(); return s ? s.log.firebase.length : -1; },
    stubBlocked: (): number => { const s = stub(); return s ? s.log.blocked.length : -1; },
    stubWsAttempts: (): number => { const s = stub(); return s ? s.log.ws.length : -1; },
    stubUnmatched: (): number => { const s = stub(); return s ? s.log.other.length : -1; },
    stubSwRegisterAttempts: (): number => { const s = stub(); return s ? s.sw.registerAttempts : -1; },
    stubSwAccessorDeleted: (): any => { const s = stub(); return s ? s.sw.accessorDeleted : null; },
    stubSwInNavigator: (): boolean => 'serviceWorker' in navigator,
    stubClipboardWrites: (): string[] => { const s = stub(); return s ? s.clipboard.writes.slice() : []; },
    stubYtConstructions: (): number => { const s = stub(); return s ? s.yt.playerConstructions.length : -1; },
    swRegistrations: (): Promise<number> => {
        const s = stub();
        if (s && typeof s.sw.getRegistrations === 'function') return Promise.resolve(s.sw.getRegistrations());
        if ('serviceWorker' in navigator && (navigator as any).serviceWorker) return (navigator as any).serviceWorker.getRegistrations().then((r: any[]) => r.length);
        return Promise.resolve(0);
    },
    cacheKeyCount: (): Promise<number> => {
        if ((window as any).caches && (window as any).caches.keys) return (window as any).caches.keys().then((k: string[]) => k.length);
        return Promise.resolve(0);
    },

    // ---------- 通用逃生口（只读） ----------
    textOf: (sel: string): string | null => norm(txt(q(sel))),
    countOf: (sel: string): number => qa(sel).length,
    attrOf: (sel: string, name: string): string | null => { const e = q(sel); return e ? e.getAttribute(name) : null; },
    bodyTextLength: (): number => (document.body.textContent || '').length
};

export const installRbProbe = (): void => {
    try {
        (window as any).__RB__ = api;
        (window as any).__RB_PROBE_INSTALLED__ = true;
    } catch (e) {
        (window as any).__RB_PROBE_INSTALLED__ = 'FAILED:' + String((e as Error) && (e as Error).message);
    }
};

export default api;
