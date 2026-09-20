// WebSocket-based chunked uploader with a GLOBAL pool of connections.
//
// Previously each file opened its own 3 sockets. Now all uploads share one
// pool of POOL_SIZE (3) persistent /ws/upload connections created once at
// module load. The pool keeps every socket busy for as long as files are
// queued:
//
//   - 1 file     -> all 3 sockets split that file's chunk queue.
//   - 2 files    -> the larger file gets 2 sockets, the smaller 1.
//   - 3+ files   -> one socket per file; the next file starts as soon as a
//                   socket finishes its current file.
//
// Sockets become idle only when there are no files left to upload, or the
// user has paused uploads.
//
// Chunking: files are split into the fewest chunks such that every chunk is
// >= MIN_CHUNK_SIZE (3 MB), even split, and as close to TARGET_CHUNK_SIZE
// (7 MB) as possible. When a file's tail would leave a small
// (< MIN_CHUNK_SIZE) remainder, that remainder is coalesced into the previous
// chunk so no tiny chunks are ever sent.
//
// Protocol (see requestHandler/uploadws.go):
//   - text frame  {type:"init", data:{upload_id, auth:{...}}}      -> init_ack
//   - binary frame [36-byte ASCII upload_id][4-byte BE chunk index][gzip] -> chunk_ack
//   - text frame  {type:"finalize", data:{upload_id, ...}}         -> finalize_response
//   - text frame  {type:"cancel", data:{upload_id}}                (no reply)

const POOL_SIZE = 3; // global WebSocket connections shared by all uploads

export type WsAuth = { token: string } | { email: string; password: string };

function authPayload(auth: WsAuth) {
    if ("token" in auth) return { token: auth.token };
    return { email: auth.email, password: auth.password };
}

function wsUploadUrl(): string {
    const dev = import.meta.env.DEV;
    const host = (import.meta.env.VITE_API_URL || "localhost:8080").trim();
    const isLocal = host.startsWith("127.0.0.1") || host.startsWith("0.0.0.0") || host.startsWith("localhost");
    if (!dev) {
        return `${isLocal ? "ws" : "wss"}://${window.location.host}/ws/upload`;
    }
    return `${isLocal ? "ws" : "wss"}://${host}/ws/upload`;
}

const RECONNECT_BASE_MS = 300;
const RECONNECT_MAX_MS = 5000;
const CHUNK_SEND_TIMEOUT_MS = 60_000;

// Uploads are collected for this long before dispatch so a batch of files
// (drag & drop of N files) is scheduled as one unit instead of serially.
const COLLECT_MS = 150;

// Chunk sizing. TARGET_CHUNK_SIZE is the "normal" chunk size; MIN_CHUNK_SIZE
// is the floor below which no chunk may fall (files smaller than MIN are a
// single chunk), and also the threshold used to coalesce small leftovers.
const TARGET_CHUNK_SIZE = 7 * 1024 * 1024; // 7 MB
const MIN_CHUNK_SIZE = 3 * 1024 * 1024;    // 3 MB

/**
 * Plan the byte sizes of a file's chunks, in order. Guarantees:
 *   - every chunk is <= TARGET_CHUNK_SIZE (except tiny single-chunk files)
 *   - every chunk is >= MIN_CHUNK_SIZE when the file allows it
 *   - a small tail (< MIN_CHUNK_SIZE) is merged into the previous chunk so no
 *     sub-MIN_CHUNK_SIZE chunk is ever sent (unless the whole file is small).
 *
 * The file is split into the fewest chunks that keep each chunk at or below
 * TARGET_CHUNK_SIZE, then the bytes are distributed as evenly as possible so
 * every chunk lands close to the "normal" 7 MB size. Because the split is
 * even, no chunk ever falls below MIN_CHUNK_SIZE (the smallest possible chunk
 * is TARGET/2 = 3.5 MB), so tiny chunks are never produced in the first
 * place; the tail-merge below is a safety net.
 *
 * Examples (TARGET=7MB, MIN=3MB):
 *   1MB  -> [1MB]
 *   8MB  -> [4MB, 4MB]
 *   21MB -> [7MB, 7MB, 7MB]
 *   24MB -> [6MB, 6MB, 6MB, 6MB]
 *   40MB -> [6.67MB x6]
 *   50MB -> [6.25MB x8]
 */
export function planChunks(fileSize: number): number[] {
    if (fileSize <= 0) return [0];
    // Fewest chunks that keep each chunk <= TARGET_CHUNK_SIZE.
    const n = Math.max(1, Math.ceil(fileSize / TARGET_CHUNK_SIZE));
    // Even split into n chunks.
    const base = Math.floor(fileSize / n);
    const rem = fileSize % n;
    const sizes: number[] = [];
    for (let i = 0; i < n; i++) sizes.push(base + (i < rem ? 1 : 0));
    // Coalesce a small tail (< MIN) into the previous chunk so no tiny chunk
    // is ever sent. The combined size may exceed TARGET; the server does not
    // care about chunk boundaries, only that all of them arrive.
    if (sizes.length > 1 && sizes[sizes.length - 1] < MIN_CHUNK_SIZE) {
        sizes[sizes.length - 2] += sizes.pop()!;
    }
    return sizes;
}

class UploadCancelled extends Error {}

type PendingChunk = {
    index: number;
    data: ArrayBuffer;
};

/** One of the global pooled /ws/upload connections. */
class UploadConnection {
    private ws: WebSocket | null = null;
    private connecting: Promise<WebSocket> | null = null;
    private url: string;
    private auth: WsAuth;
    private joined = new Set<string>();

    constructor(url: string, auth: WsAuth) {
        this.url = url;
        this.auth = auth;
    }

    connect(): Promise<WebSocket> {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) return Promise.resolve(this.ws);
        if (this.connecting) return this.connecting;

        this.connecting = new Promise<WebSocket>((resolve, reject) => {
            const ws = new WebSocket(this.url);
            ws.binaryType = "arraybuffer";
            let settled = false;
            ws.onopen = () => { settled = true; this.ws = ws; resolve(ws); };
            ws.onerror = () => { if (!settled) { settled = true; reject(new Error("WebSocket connection failed")); } };
            ws.onclose = () => {
                if (!settled) { settled = true; reject(new Error("WebSocket closed before open")); }
                if (this.ws === ws) { this.ws = null; this.joined.clear(); }
            };
        }).then((ws) => { this.connecting = null; return ws; })
          .catch((err) => { this.connecting = null; throw err; });

        return this.connecting;
    }

    isOpen(): boolean {
        return !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    /** Join an upload session on this connection (init handshake). */
    async join(uploadId: string): Promise<void> {
        if (this.joined.has(uploadId) && this.isOpen()) return;
        const ws = await this.connect();
        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Init timed out")), CHUNK_SEND_TIMEOUT_MS);
            const onMessage = (event: MessageEvent) => {
                if (typeof event.data !== "string") return;
                let msg: any;
                try { msg = JSON.parse(event.data); } catch { return; }
                if (msg.type === "init_ack" && msg.data?.upload_id === uploadId) {
                    cleanup(); this.joined.add(uploadId); resolve();
                } else if (msg.type === "error") {
                    cleanup(); reject(new Error(String(msg.data)));
                }
            };
            const onClose = () => { cleanup(); reject(new Error("WebSocket closed while joining")); };
            const cleanup = () => { clearTimeout(timer); ws.removeEventListener("message", onMessage); ws.removeEventListener("close", onClose); };
            ws.addEventListener("message", onMessage);
            ws.addEventListener("close", onClose);
            ws.send(JSON.stringify({ type: "init", data: { upload_id: uploadId, auth: authPayload(this.auth) } }));
        });
    }

    /** Send one chunk for uploadId: [36B id][4B BE index][gzip]. */
    async sendChunk(uploadId: string, chunk: PendingChunk): Promise<void> {
        const ws = await this.connect();
        const idBytes = new TextEncoder().encode(uploadId);
        const header = new Uint8Array(4);
        new DataView(header.buffer).setUint32(0, chunk.index, false);
        const frame = new Uint8Array(idBytes.length + 4 + chunk.data.byteLength);
        frame.set(idBytes, 0);
        frame.set(header, idBytes.length);
        frame.set(new Uint8Array(chunk.data), idBytes.length + 4);

        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Chunk ${chunk.index} send timed out`)), CHUNK_SEND_TIMEOUT_MS);
            const onMessage = (event: MessageEvent) => {
                if (typeof event.data !== "string") return;
                let msg: any;
                try { msg = JSON.parse(event.data); } catch { return; }
                if (msg.type === "chunk_ack" && msg.data?.upload_id === uploadId && msg.data?.chunk_index === chunk.index) {
                    cleanup(); resolve();
                } else if (msg.type === "chunk_error" && msg.data?.upload_id === uploadId && msg.data?.chunk_index === chunk.index) {
                    cleanup(); reject(new Error(String(msg.data?.error || `Chunk ${chunk.index} rejected`)));
                }
            };
            const onClose = () => { cleanup(); reject(new Error("WebSocket closed while sending chunk")); };
            const cleanup = () => { clearTimeout(timer); ws.removeEventListener("message", onMessage); ws.removeEventListener("close", onClose); };
            ws.addEventListener("message", onMessage);
            ws.addEventListener("close", onClose);
            ws.send(frame);
        });
    }

    /** Force-close the socket so the next send reconnects. */
    drop() {
        if (this.ws) {
            try { this.ws.close(); } catch { /* ignore */ }
            this.ws = null;
            this.joined.clear();
        }
    }

    async finalize(uploadId: string, payload: Record<string, unknown>): Promise<any> {
        const ws = await this.connect();
        payload.upload_id = uploadId;
        return new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Finalize timed out")), CHUNK_SEND_TIMEOUT_MS);
            const onMessage = (event: MessageEvent) => {
                if (typeof event.data !== "string") return;
                let msg: any;
                try { msg = JSON.parse(event.data); } catch { return; }
                if (msg.type === "finalize_response") { cleanup(); resolve(msg.data); }
                else if (msg.type === "error") { cleanup(); reject(new Error(String(msg.data))); }
            };
            const cleanup = () => { clearTimeout(timer); ws.removeEventListener("message", onMessage); };
            ws.addEventListener("message", onMessage);
            ws.send(JSON.stringify({ type: "finalize", data: payload }));
        });
    }

    cancel(uploadId?: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify({ type: "cancel", data: uploadId ? { upload_id: uploadId } : {} }));
            } catch { /* ignore */ }
        }
    }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Send one chunk over one connection with reconnect + retry backoff. */
async function sendChunkWithRetries(
    conn: UploadConnection,
    uploadId: string,
    chunk: PendingChunk,
    maxRetries: number,
): Promise<void> {
    for (let attempt = 0; ; attempt++) {
        if (attempt > maxRetries) {
            throw new Error(`Chunk ${chunk.index} failed after ${maxRetries + 1} attempts`);
        }
        try {
            await conn.sendChunk(uploadId, chunk);
            return;
        } catch (err: any) {
            if (err instanceof UploadCancelled) throw err;
            conn.drop();
            try { await conn.join(uploadId); } catch { /* rejoin before next send */ }
            await sleep(Math.min(RECONNECT_BASE_MS * Math.pow(2, attempt), RECONNECT_MAX_MS));
        }
    }
}

// ---------------------------------------------------------------------------
// Global pool
// ---------------------------------------------------------------------------

type UploadJob = {
    uploadId: string;
    file: File;
    auth: WsAuth;
    chunks: PendingChunk[];         // one entry per planned chunk; data filled lazily
    sockets: Set<UploadConnection>; // sockets currently driving this job
    uploaded: number;               // chunks acked
    chunkSizes: number[];           // planned sizes (bytes per chunk) for progress
    collectionId?: string;
    running: boolean;               // a worker set is driving this job
    waitWhilePaused?: () => Promise<void>;
    isPaused?: () => boolean;
    shouldCancel?: () => boolean;
    onProgress?: (progress: number) => void;
    resolve: (result: any) => void;
    reject: (err: any) => void;
};

class UploadPool {
    private conns: UploadConnection[] = [];
    private jobs: UploadJob[] = [];
    private processing = false;
    private collectTimer: number | undefined;

    constructor(url: string, auth: WsAuth) {
        for (let i = 0; i < POOL_SIZE; i++) this.conns.push(new UploadConnection(url, auth));
    }

    enqueue(opts: {
        uploadId: string;
        file: File;
        auth: WsAuth;
        collectionId?: string;
        waitWhilePaused?: () => Promise<void>;
        isPaused?: () => boolean;
        shouldCancel?: () => boolean;
        onProgress?: (progress: number) => void;
    }): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const chunkSizes = planChunks(opts.file.size);
            const chunks: PendingChunk[] = chunkSizes.map((_, i) => ({ index: i, data: new ArrayBuffer(0) }));
            this.jobs.push({
                uploadId: opts.uploadId,
                file: opts.file,
                auth: opts.auth,
                chunks,
                sockets: new Set(),
                uploaded: 0,
                chunkSizes,
                collectionId: opts.collectionId,
                running: false,
                waitWhilePaused: opts.waitWhilePaused,
                isPaused: opts.isPaused,
                shouldCancel: opts.shouldCancel,
                onProgress: opts.onProgress,
                resolve,
                reject,
            });
            this.scheduleCollect();
        });
    }

    private scheduleCollect() {
        if (this.collectTimer !== undefined) return;
        this.collectTimer = window.setTimeout(() => {
            this.collectTimer = undefined;
            this.process();
        }, COLLECT_MS);
    }

    private process() {
        if (this.processing) return;
        this.processing = true;
        try {
            this.rebalanceSockets();
            this.startUnstarted();
        } finally {
            this.processing = false;
        }
    }

    private startUnstarted() {
        for (const job of [...this.jobs]) {
            if (job.sockets.size > 0 && !job.running) void this.runJob(job);
        }
    }

    /**
     * Distribute idle sockets across jobs per the user's rule:
     *   - 1 job    -> all sockets
     *   - 2 jobs   -> larger file gets 2 sockets, smaller 1
     *   - 3+ jobs  -> one socket each; any leftover sockets join the largest
     *                 pending job so every socket has work.
     */
    private rebalanceSockets() {
        const idle = this.conns.filter((c) => !this.jobs.some((j) => j.sockets.has(c)));
        if (idle.length === 0) return;
        const unassigned = this.jobs.filter((j) => j.sockets.size === 0).sort((a, b) => b.file.size - a.file.size);
        const active = this.jobs.filter((j) => j.sockets.size > 0).sort((a, b) => b.file.size - a.file.size);

        if (unassigned.length === 0) {
            // No queued files: all idle sockets help the single active job so
            // one remaining (largest) file uses the whole pool.
            if (active.length === 1) {
                for (const s of idle) active[0].sockets.add(s);
            } else if (active.length === 2) {
                // Larger active file gets the extra sockets.
                for (const s of idle) active[0].sockets.add(s);
            }
            return;
        }

        const sockets = [...idle];
        let si = 0;
        if (unassigned.length === 1) {
            for (const s of sockets) unassigned[0].sockets.add(s);
            si = sockets.length;
        } else if (unassigned.length === 2) {
            // Two queued files: bigger gets 2 sockets, smaller gets 1 — but
            // only when the pool can afford it. With fewer idle sockets, give
            // each file at least one so every socket keeps working.
            const [big, small] = unassigned;
            if (sockets.length >= 3) {
                for (let i = 0; i < 2 && si < sockets.length; i++) big.sockets.add(sockets[si++]);
                if (si < sockets.length) small.sockets.add(sockets[si++]);
            } else {
                // Not enough idle sockets for the ideal split: one each, and
                // any leftover (impossible here) goes to the bigger file.
                big.sockets.add(sockets[si++]);
                if (si < sockets.length) small.sockets.add(sockets[si++]);
            }
            while (si < sockets.length) big.sockets.add(sockets[si++]);
        } else {
            for (const job of unassigned) {
                if (si >= sockets.length) break;
                job.sockets.add(sockets[si++]);
            }
            while (si < sockets.length) {
                unassigned.sort((a, b) => b.file.size - a.file.size);
                unassigned[0].sockets.add(sockets[si++]);
            }
        }
    }

    private ensureNotCancelled(job: UploadJob) {
        if (job.shouldCancel && job.shouldCancel()) throw new UploadCancelled("cancelled");
    }

    private async compressChunk(job: UploadJob, index: number): Promise<ArrayBuffer> {
        let start = 0;
        for (let i = 0; i < index; i++) start += job.chunkSizes[i];
        const end = start + job.chunkSizes[index];
        const blob = job.file.slice(start, end);
        const stream = new Blob([blob]).stream().pipeThrough(new CompressionStream('gzip'));
        return await new Response(stream).arrayBuffer();
    }

    private async runJob(job: UploadJob) {
        if (job.running) return;
        job.running = true;
        const sockets = [...job.sockets];
        try {
            await Promise.all(sockets.map((s) => s.join(job.uploadId)));
            const totalChunks = job.chunkSizes.length;
            const compressingSlots = new Set<number>();

            const nextEmpty = (): number => {
                for (let i = 0; i < totalChunks; i++) {
                    const c = job.chunks[i];
                    if (c && c.data.byteLength === 0 && !compressingSlots.has(i)) return i;
                }
                return -1;
            };
            const nextUnsent = (): PendingChunk | undefined => {
                for (let i = 0; i < totalChunks; i++) {
                    const c = job.chunks[i];
                    if (c && c.data.byteLength > 0 && !(c as any)._sent) return c;
                }
                return undefined;
            };
            const refill = async () => {
                while (compressingSlots.size < sockets.length * 2) {
                    const slot = nextEmpty();
                    if (slot === -1) return;
                    compressingSlots.add(slot);
                    try {
                        const data = await this.compressChunk(job, slot);
                        if (job.chunks[slot]) job.chunks[slot].data = data;
                    } finally {
                        compressingSlots.delete(slot);
                    }
                }
            };

            const worker = async (conn: UploadConnection) => {
                for (;;) {
                    this.ensureNotCancelled(job);
                    if (job.isPaused && job.isPaused() && job.waitWhilePaused) {
                        await job.waitWhilePaused();
                        this.ensureNotCancelled(job);
                    }
                    const chunk = nextUnsent();
                    if (!chunk) {
                        const allSent = job.chunks.every((c) => (c as any)._sent);
                        if (allSent && compressingSlots.size === 0) return;
                        await refill();
                        if (allSent && compressingSlots.size === 0 && !nextUnsent()) return;
                        await sleep(30);
                        continue;
                    }
                    (chunk as any)._sent = true;
                    try {
                        await sendChunkWithRetries(conn, job.uploadId, chunk, 5);
                        job.uploaded++;
                        if (job.onProgress) {
                            let sentBytes = 0;
                            for (let i = 0; i < job.uploaded; i++) sentBytes += job.chunkSizes[i];
                            job.onProgress(Math.round((sentBytes / job.file.size) * 100));
                        }
                    } catch (err: any) {
                        if (err instanceof UploadCancelled) throw err;
                        (chunk as any)._sent = false;
                        throw err;
                    }
                }
            };

            await Promise.all(sockets.map((s) => worker(s)));

            const finalizePayload: Record<string, unknown> = {
                total_chunks: totalChunks,
                original_file_name: job.file.name,
                auth: authPayload(job.auth),
            };
            if (job.collectionId) finalizePayload.collection_id = job.collectionId;
            let result: any;
            let finalized = false;
            for (const s of sockets) {
                try {
                    result = await s.finalize(job.uploadId, finalizePayload);
                    finalized = true;
                    break;
                } catch (err: any) {
                    if (err instanceof UploadCancelled) throw err;
                    continue;
                }
            }
            if (!finalized) throw new Error(`Finalization failed for ${job.file.name}`);
            if (!result || result.success !== true) {
                const missing = result?.missingChunks;
                if (missing && Array.isArray(missing) && missing.length > 0) {
                    throw new Error(`Finalization failed: missing chunks: ${missing.join(", ")}`);
                }
                throw new Error(`Finalization failed: ${result?.message || "unknown error"}`);
            }
            job.resolve(result);
        } catch (err: any) {
            sockets.forEach((s) => s.cancel(job.uploadId));
            job.reject(err);
        } finally {
            job.running = false;
            const idx = this.jobs.indexOf(job);
            if (idx !== -1) this.jobs.splice(idx, 1);
            for (const s of sockets) job.sockets.delete(s);
            this.process(); // hand freed sockets to queued jobs
        }
    }
}

// ---------------------------------------------------------------------------
// Singleton pool
// ---------------------------------------------------------------------------

let sharedPool: UploadPool | null = null;

function getPool(auth?: WsAuth): UploadPool {
    if (!sharedPool) sharedPool = new UploadPool(wsUploadUrl(), auth || { token: "" });
    return sharedPool;
}

/** Enqueue a file upload into the global pool. Primary upload API. */
export async function enqueueUpload(opts: {
    uploadId: string;
    file: File;
    auth: WsAuth;
    collectionId?: string;
    waitWhilePaused?: () => Promise<void>;
    isPaused?: () => boolean;
    shouldCancel?: () => boolean;
    onProgress?: (progress: number) => void;
}): Promise<any> {
    return getPool(opts.auth).enqueue(opts);
}

/** Stop a queued or in-flight upload (cancels its session server-side). */
export function cancelQueuedUpload(uploadId: string): void {
    if (!sharedPool) return;
    const pool = sharedPool as any;
    const jobs: UploadJob[] = pool.jobs || [];
    const job = jobs.find((j) => j.uploadId === uploadId);
    if (job) {
        for (const s of job.sockets) s.cancel(uploadId);
        const idx = jobs.indexOf(job);
        if (idx !== -1) jobs.splice(idx, 1);
        job.reject(new UploadCancelled("cancelled"));
    }
}

/** Debug/introspection helper used by tests and the UI. */
export function poolStatus(): {
    totalSockets: number;
    open: number;
    queued: number;
    activeUploads: number;
    jobs: { uploadId: string; sockets: number; uploaded: number; total: number; size: number }[];
} {
    if (!sharedPool) return { totalSockets: POOL_SIZE, open: 0, queued: 0, activeUploads: 0, jobs: [] };
    const pool = sharedPool as any;
    const jobs: any[] = (pool.jobs || []).map((j: UploadJob) => ({
        uploadId: j.uploadId,
        sockets: j.sockets.size,
        uploaded: j.uploaded,
        total: j.chunkSizes.length,
        size: j.file.size,
    }));
    return {
        totalSockets: POOL_SIZE,
        open: pool.conns.filter((c: UploadConnection) => c.isOpen()).length,
        queued: (pool.jobs || []).filter((j: UploadJob) => j.sockets.size === 0).length,
        activeUploads: (pool.jobs || []).filter((j: UploadJob) => j.sockets.size > 0).length,
        jobs,
    };
}

/** Legacy wrapper retained for compatibility. */
export async function uploadFileOverWebsockets(
    file: File,
    uploadSystemId: string,
    authDetails: WsAuth | any,
    updateProgress?: (progress: number) => void,
    collectionId?: string,
    waitWhilePaused?: () => Promise<void>,
    isPaused?: () => boolean,
    _manageController?: unknown,
    shouldCancel?: () => boolean,
): Promise<void> {
    await enqueueUpload({
        uploadId: uploadSystemId,
        file,
        auth: authDetails as WsAuth,
        collectionId,
        waitWhilePaused,
        isPaused,
        shouldCancel,
        onProgress: updateProgress,
    });
}
