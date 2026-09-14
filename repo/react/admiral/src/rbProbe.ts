// RepairBench instrumentation: a strictly READ-ONLY probe published once as
// `window.__rb`.
//
// Contract:
//   * published exactly once, after the first render is scheduled (see main.tsx);
//   * every member is a pure read of the DOM / location / performance timeline
//     that the application itself already produced - the probe never writes
//     application state, never dispatches an event, never touches storage, never
//     mutates the DOM and never changes what is rendered;
//   * every member is fail-closed: on any error it returns an inert sentinel
//     ('' / -1 / false) instead of throwing, so a probe bug can never be
//     mistaken for an application behaviour.
//
// It exists so the verifier can read scalars off the existing render path
// instead of scraping framework-internal CSS class names.
export interface RbProbe {
    version: number
    boot: {
        rootKids: () => number
        ready: () => boolean
    }
    loc: {
        path: () => string
        search: () => string
        href: () => string
    }
    dom: {
        count: (sel: string) => number
        text: (sel: string) => string
        attr: (sel: string, name: string) => string
        texts: (sel: string, limit: number) => string
        checked: (sel: string) => number
    }
    nav: {
        collapseExpanded: () => string
        menuItems: () => number
    }
    theme: {
        name: () => string
    }
    table: {
        rows: () => number
        headerCells: () => number
        cell: (row: number, col: number) => string
        ariaSort: (col: number) => string
        totalText: () => string
        sizeChanger: () => number
        pageItems: () => number
        activePage: () => string
        checkedRows: () => number
        selectAllPresent: () => boolean
    }
    net: {
        count: (substr: string) => number
    }
    storage: {
        localKeys: () => string
        sessionKeys: () => string
        raw: (key: string) => string
    }
    globals: {
        rbKeys: () => string
    }
}

const norm = (v: unknown) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim()

const q = (sel: string) => {
    try {
        return document.querySelector(sel)
    } catch {
        return null
    }
}

const qa = (sel: string) => {
    try {
        return Array.from(document.querySelectorAll(sel))
    } catch {
        return []
    }
}

// The table prefix this app configures for rc-table is "admiral-table" and the
// pagination prefix is "pagination"; both are read through these helpers so the
// probe has exactly one place that knows about them.
const TBODY_ROW = '.admiral-table-tbody tr.admiral-table-row'
const THEAD_TH = '.admiral-table-thead th.admiral-table-cell'

const probe: RbProbe = {
    version: 1,
    boot: {
        rootKids: () => {
            try {
                const r = document.getElementById('root')
                return r ? r.children.length : -1
            } catch {
                return -1
            }
        },
        ready: () => {
            try {
                const r = document.getElementById('root')
                if (!r || r.children.length === 0) return false
                return document.body.textContent != null && document.body.textContent.length > 0
            } catch {
                return false
            }
        },
    },
    loc: {
        path: () => {
            try {
                return location.pathname
            } catch {
                return ''
            }
        },
        search: () => {
            try {
                return location.search
            } catch {
                return ''
            }
        },
        href: () => {
            try {
                return location.href
            } catch {
                return ''
            }
        },
    },
    dom: {
        count: (sel) => qa(sel).length,
        text: (sel) => norm((q(sel) as HTMLElement | null)?.textContent ?? ''),
        attr: (sel, name) => {
            const el = q(sel)
            if (!el) return ''
            const v = el.getAttribute(name)
            return v == null ? '' : String(v)
        },
        texts: (sel, limit) =>
            qa(sel)
                .slice(0, Number(limit) || 0)
                .map((el) => norm((el as HTMLElement).textContent ?? ''))
                .join('|'),
        checked: (sel) => qa(sel + ':checked').length,
    },
    nav: {
        collapseExpanded: () => {
            const el = q('[data-testid="nav-collapse-toggle"]')
            if (!el) return ''
            const v = el.getAttribute('aria-expanded')
            return v == null ? '' : String(v)
        },
        menuItems: () => qa('[data-testid="menu-item"]').length,
    },
    theme: {
        name: () => {
            const el = q('[data-testid="theme-switch"]')
            if (!el) return ''
            const v = el.getAttribute('data-theme-name')
            return v == null ? '' : String(v)
        },
    },
    table: {
        rows: () => qa(TBODY_ROW).length,
        headerCells: () => qa(THEAD_TH).length,
        cell: (row, col) => {
            const rows = qa(TBODY_ROW)
            const tr = rows[Number(row)]
            if (!tr) return ''
            const td = (tr as HTMLElement).querySelectorAll('td')[Number(col)]
            return norm((td as HTMLElement | undefined)?.textContent ?? '')
        },
        ariaSort: (col) => {
            const th = qa(THEAD_TH)[Number(col)]
            if (!th) return ''
            const v = th.getAttribute('aria-sort')
            return v == null ? '' : String(v)
        },
        totalText: () => norm((q('.pagination-total-text') as HTMLElement | null)?.textContent ?? ''),
        sizeChanger: () => qa('.pagination-options').length,
        pageItems: () => qa('.pagination-item').length,
        activePage: () => {
            const el = q('.pagination-item-active')
            return norm((el as HTMLElement | null)?.textContent ?? '')
        },
        checkedRows: () => qa(TBODY_ROW + ' input[type="checkbox"]').filter((i) => (i as HTMLInputElement).checked).length,
        selectAllPresent: () => q('[data-testid="table-select-all"] input[type="checkbox"]') !== null,
    },
    net: {
        count: (substr) => {
            try {
                const needle = String(substr)
                return performance
                    .getEntriesByType('resource')
                    .filter((e) => String(e.name).indexOf(needle) >= 0).length
            } catch {
                return -1
            }
        },
    },
    storage: {
        localKeys: () => {
            try {
                return Object.keys(localStorage).sort().join(',')
            } catch {
                return ''
            }
        },
        sessionKeys: () => {
            try {
                return Object.keys(sessionStorage).sort().join(',')
            } catch {
                return ''
            }
        },
        raw: (key) => {
            try {
                const v = localStorage.getItem(String(key))
                return v == null ? '' : String(v)
            } catch {
                return ''
            }
        },
    },
    globals: {
        rbKeys: () => {
            try {
                return Object.keys(window)
                    .filter((k) => k.indexOf('__rb') === 0)
                    .sort()
                    .join(',')
            } catch {
                return ''
            }
        },
    },
}

let published = false

export function publishRbProbe(): boolean {
    if (published) return false
    published = true
    try {
        Object.defineProperty(window, '__rb', {
            value: probe,
            writable: false,
            configurable: false,
            enumerable: true,
        })
        return true
    } catch {
        return false
    }
}
