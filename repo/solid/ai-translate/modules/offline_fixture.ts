// Offline verification fixture - ADAPTATION layer, not part of the shipped product.
//
// Why this file exists: the pristine face is a pywebview desktop app. Its whole
// transport is (a) a native bridge the browser build never gets
// (window.pywebview.api: clipboard, active window title, config store, cache
// write, translation history) and (b) five public translation endpoints reached
// with window.fetch. With no bridge the config promise resolves to undefined, so
// the enabled-model list is never published and the page stays on its skeleton
// forever; with no network the three automatic engines and the streaming engine
// can never answer. The face is therefore unobservable offline in BOTH ways.
//
// This module supplies the missing host, and nothing else:
//   1. window.pywebview.api - an in-page stand-in for the native bridge. It keeps
//      the seed's own call graph intact (clipboard poll loop, window-title guard,
//      config read/save, cache write, history query); no seed branch is bypassed
//      and no seed value is invented: the clipboard text, the window title and
//      the config all come from a store the checkpoints drive explicitly.
//   2. a window.fetch wrapper - loopback requests are passed through untouched,
//      the five translation hosts are answered from deterministic in-page
//      stand-ins that ECHO the request the application itself built (so a
//      wrong field, a wrong language tag or a wrong serialiser shows up in the
//      rendered output), and any other host answers an empty object. Nothing
//      leaves the machine: the wrapper answers before the network stack is
//      reached, so a checkpoint can assert 0 non-loopback resource entries.
//   3. window.__ait - a read-only control/observation surface for the harness
//      (clipboard push, window-title set, config patch + refocus, request log,
//      cache-write log, config-write log, bridge call counters, and a mark /
//      since pair so a checkpoint can count events inside its own window).
//
// Two config profiles are available, chosen by the URL so that every checkpoint
// stays a fresh-context, no-shared-state reading:
//   ?ait_profile=main   (default) three enabled engines -> the columns face
//   ?ait_profile=empty            no enabled engine     -> the settings face
export {}

type IApi = Window["pywebview"]["api"]
type R = Record<string, unknown>

interface IRequestRecord { url: string, body: string }

const clone = (value: unknown): unknown => JSON.parse(JSON.stringify(value))

const params = new URLSearchParams(window.location.search)
const profile = params.get("ait_profile") || "main"

function profileConfig(): R {
    if (profile === "empty") {
        return { wsServerUrl: "", caching: true, targetLanguage: "English - US", providers: {} }
    }
    return {
        wsServerUrl: "",
        caching: true,
        targetLanguage: "English - US",
        providers: {
            Auto: {
                provider_name: "Automatic Translators",
                about_url: null,
                api_key: "none",
                models: [
                    { name: "google-translate", owned_by: "Google", enabled: true, index: 0, auto_fetch: true },
                    { name: "DeepLX", owned_by: "DeepL", enabled: true, index: 1, auto_fetch: true }
                ]
            },
            g4f: {
                provider_name: "GPT4Free",
                api_key: "none",
                models: [
                    { name: "gpt-4o-mini", owned_by: "openai", enabled: true, index: 2, auto_fetch: true }
                ]
            }
        }
    }
}

const store = {
    clip: "",
    windowTitle: "Fixture Game Window",
    config: profileConfig(),
    requests: [] as IRequestRecord[],
    saved: [] as R[],
    savedConfigs: [] as R[],
    calls: {} as Record<string, number>,
    marks: { request: 0, saved: 0, config: 0 }
}

const bump = (name: string): void => { store.calls[name] = (store.calls[name] || 0) + 1 }

const parseBody = (body: string): R => {
    if (!body) { return {} }
    try { return JSON.parse(body) as R }
    catch { return {} }
}

const jsonReply = (payload: unknown): Response => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" }
})

// The streaming engine is fed the way its own reader expects: "data: <json>"
// frames whose delta.content pieces concatenate into one answer. The pieces are
// deliberately split mid-word and mid-escape so a reader that dropped, reordered
// or double-decoded a frame would show it in the rendered column.
const streamReply = (pieces: string[]): Response => {
    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            for (const piece of pieces) {
                controller.enqueue(encoder.encode("data: " + JSON.stringify({
                    choices: [{ delta: { content: piece }, finish_reason: null }]
                }) + "\n\n"))
            }
            controller.close()
        }
    })
    return new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } })
}

const api: IApi = {
    GetActiveWindowTitle: async <T = string>(): Promise<T> => {
        bump("GetActiveWindowTitle")
        return store.windowTitle as unknown as T
    },
    GetClipboardText: async <T = string>(): Promise<T> => {
        bump("GetClipboardText")
        return store.clip as unknown as T
    },
    GetConfig: async <T = Record<string, unknown>>(): Promise<T> => {
        bump("GetConfig")
        return clone(store.config) as unknown as T
    },
    SaveConfig: async (configs: Record<string, unknown> | string): Promise<void> => {
        bump("SaveConfig")
        const next: R = typeof configs === "string" ? parseBody(configs) : configs as R
        store.config = clone(next) as R
        store.savedConfigs.push(clone(next) as R)
    },
    OpenConfigDir: async (): Promise<void> => { bump("OpenConfigDir") },
    OpenConfigWindow: async (): Promise<void> => { bump("OpenConfigWindow") },
    SaveText: async <T = { error: string } | void>(data: ISaveTextDTO): Promise<T> => {
        bump("SaveText")
        store.saved.push(clone(data) as R)
        return undefined as unknown as T
    },
    QueryTranslation: async <T = ITextResponseDTO>(data: ITextDTO): Promise<T> => {
        bump("QueryTranslation")
        return clone({
            window_title: data.window_title,
            originalText: data.originalText,
            translatedText: [],
            history: ["Previous line one", "Previous line two"]
        }) as unknown as T
    }
}

const bridgeHost = window as unknown as { pywebview?: { api: IApi } }
if (!bridgeHost.pywebview) { bridgeHost.pywebview = { api } }

const matching = (host: string): IRequestRecord | null => {
    const hits = store.requests.filter((r) => r.url.indexOf(host) >= 0)
    return hits.length ? hits[hits.length - 1] : null
}

const savedOf = (model: string): R | null => {
    const hits = store.saved.filter((s) => String(s.src_model ?? "") === model)
    return hits.length ? hits[hits.length - 1] : null
}

const messagesOf = (host: string): R[] => {
    const hit = matching(host)
    if (!hit) { return [] }
    const parsed = parseBody(hit.body)
    const list = parsed.messages
    return Array.isArray(list) ? list as R[] : []
}

const ait = {
    profile: (): string => profile,
    clip: (): string => store.clip,
    pushClip: (text: string): string => { store.clip = text; return store.clip },
    windowTitle: (): string => store.windowTitle,
    setWindowTitle: (title: string): string => { store.windowTitle = title; return store.windowTitle },
    config: (): string => JSON.stringify(store.config),
    // writes the stand-in config store and refocuses the window, which is how the
    // shipped app reloads its own config: the focus handler compares the stored
    // copy against the live one and republishes when they differ.
    setConfig: (patch: R): string => {
        Object.assign(store.config, patch)
        window.dispatchEvent(new Event("focus"))
        return JSON.stringify(store.config)
    },
    requests: (): number => store.requests.length,
    saved: (): number => store.saved.length,
    savedConfigs: (): number => store.savedConfigs.length,
    calls: (name: string): number => store.calls[name] || 0,
    mark: (): number => {
        store.marks.request = store.requests.length
        store.marks.saved = store.saved.length
        store.marks.config = store.savedConfigs.length
        return store.marks.request
    },
    since: (): number => store.requests.length - store.marks.request,
    savedSince: (): number => store.saved.length - store.marks.saved,
    configsSince: (): number => store.savedConfigs.length - store.marks.config,
    count: (host: string): number => store.requests.filter((r) => r.url.indexOf(host) >= 0).length,
    lastUrl: (host: string): string => { const hit = matching(host); return hit ? hit.url : "" },
    lastBody: (host: string): string => { const hit = matching(host); return hit ? hit.body : "" },
    lastField: (host: string, field: string): string => {
        const hit = matching(host)
        if (!hit) { return "" }
        const parsed = parseBody(hit.body)
        return String(parsed[field])
    },
    lastMessage: (host: string, index: number): string => {
        const list = messagesOf(host)
        const hit = list[index]
        return hit ? String(hit.content ?? "") : ""
    },
    savedField: (model: string, field: string): string => {
        const hit = savedOf(model)
        return hit ? String(hit[field]) : ""
    },
    savedKeys: (model: string): string => {
        const hit = savedOf(model)
        return hit ? Object.keys(hit).sort().join(",") : ""
    },
    savedCount: (model: string): number => store.saved.filter((s) => String(s.src_model ?? "") === model).length
}

const aitHost = window as unknown as { __ait?: typeof ait }
if (!aitHost.__ait) { aitHost.__ait = ait }

const nativeFetch: typeof window.fetch = window.fetch.bind(window)

const wrappedFetch: typeof window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url)
    const body = typeof init?.body === "string" ? init.body : ""
    store.requests.push({ url, body })

    if (url.indexOf(window.location.origin) === 0 || url.indexOf("/") === 0) {
        return nativeFetch(input, init)
    }

    const sent = parseBody(body)

    if (url.indexOf("google-translate-serverless") >= 0) {
        return jsonReply({ text: "[GOOGLE:" + String(sent.to ?? "") + "] " + String(sent.text ?? "") })
    }
    if (url.indexOf("deep-lx-vercel") >= 0) {
        return jsonReply({ data: "[DEEPLX:" + String(sent.target_lang ?? "") + "] " + String(sent.text ?? "") })
    }
    if (url.indexOf("playmak3r-sugoi") >= 0) {
        const query = new URL(url).searchParams.get("text") || ""
        return jsonReply({ text: "[SUGOI] " + query })
    }
    if (url.indexOf("playmak3r-g4f") >= 0) {
        return streamReply(['"Hel', 'lo,\nwor', 'ld!"'])
    }
    return jsonReply({})
}

window.fetch = wrappedFetch
