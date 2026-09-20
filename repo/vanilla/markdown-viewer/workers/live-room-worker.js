const MAX_MESSAGE_BYTES = 8 * 1024 * 1024;
const MAX_PARTICIPANTS = 64;
const AUTH_STORAGE_KEY = "live-room-auth-v1";
const CAPABILITY_PATTERN = /^[A-Za-z0-9_-]{24,160}$/;
const ROLE_HOST = "host";
const ROLE_EDIT = "edit";
const ROLE_VIEW = "view";

function parseRoomMessage(data) {
  if (typeof data === "string") {
    if (data.length > MAX_MESSAGE_BYTES) return null;
    return JSON.parse(data);
  }

  if (data instanceof ArrayBuffer) {
    if (data.byteLength > MAX_MESSAGE_BYTES) return null;
    return JSON.parse(new TextDecoder().decode(data));
  }

  return null;
}

function safeSend(socket, message) {
  try {
    socket.send(JSON.stringify(message));
  } catch (_) {
    try {
      socket.close(1011, "send failed");
    } catch (_) {}
  }
}

function normalizeLiveRole(role) {
  return role === ROLE_HOST || role === ROLE_EDIT ? role : ROLE_VIEW;
}

function secureHeaders(base) {
  return Object.assign({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "accelerometer=(), autoplay=(), browsing-topics=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), publickey-credentials-get=(), usb=(), xr-spatial-tracking=()",
    "Cross-Origin-Resource-Policy": "same-site"
  }, base || {});
}

function isAllowedLiveOrigin(origin) {
  if (origin === "https://markdownviewer.pages.dev" || origin === "null") {
    return true;
  }
  if (/^https:\/\/[a-z0-9-]+\.markdownviewer\.pages\.dev$/i.test(origin || "")) {
    return true;
  }
  if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin || "")) {
    return true;
  }
  return false;
}

function isValidCapability(value) {
  return CAPABILITY_PATTERN.test(String(value || ""));
}

function canSendMessageType(role, type) {
  if (role === ROLE_HOST) return true;
  if (role === ROLE_EDIT) {
    return new Set([
      "hello",
      "presence",
      "sync-request",
      "sync-state",
      "y-update",
      "review-sync-request",
      "review-update",
      "leave"
    ]).has(type);
  }
  return new Set([
    "hello",
    "presence",
    "sync-request",
    "review-sync-request",
    "review-update",
    "leave"
  ]).has(type);
}

function normalizeOutboundMessage(message, fallbackSender, roomId, role) {
  if (!message || typeof message.type !== "string") return null;
  if (message.roomId && message.roomId !== roomId) return null;
  if (!canSendMessageType(role, message.type)) return null;

  const sender = String(message.sender || fallbackSender || "").slice(0, 120);
  if (!sender) return null;

  const allowedTypes = new Set([
    "hello",
    "presence",
    "sync-request",
    "sync-state",
    "y-update",
    "review-sync-request",
    "review-sync-state",
    "review-update",
    "leave",
    "session-end"
  ]);
  if (!allowedTypes.has(message.type)) return null;

  return Object.assign({}, message, {
    sender,
    roomId,
    role,
    sentAt: Date.now()
  });
}

export class LiveRoom {
  constructor(state) {
    this.state = state;
    this.sessions = new Map();
  }

  broadcast(message, exceptSocket) {
    this.sessions.forEach((session, socket) => {
      if (socket !== exceptSocket) {
        safeSend(socket, message);
      }
    });
  }

  removeSocket(socket) {
    const session = this.sessions.get(socket);
    if (!session) return;
    this.sessions.delete(socket);
    this.broadcast({
      type: "leave",
      sender: session.participantId,
      roomId: session.roomId,
      role: session.role,
      sentAt: Date.now()
    }, socket);
  }

  async authenticateSocket(url) {
    const role = normalizeLiveRole(url.searchParams.get("role") || "");
    const capability = url.searchParams.get("cap") || "";
    if (!isValidCapability(capability)) return null;

    let auth = await this.state.storage.get(AUTH_STORAGE_KEY);
    if (role === ROLE_HOST) {
      const hostCap = url.searchParams.get("hostCap") || "";
      const editCap = url.searchParams.get("editCap") || "";
      const viewCap = url.searchParams.get("viewCap") || "";
      if (![hostCap, editCap, viewCap].every(isValidCapability) || capability !== hostCap) {
        return null;
      }

      if (!auth) {
        auth = { hostCap, editCap, viewCap, createdAt: Date.now() };
        await this.state.storage.put(AUTH_STORAGE_KEY, auth);
      }
      if (auth.hostCap !== capability) return null;
      return ROLE_HOST;
    }

    if (!auth) return null;
    if (role === ROLE_EDIT) {
      return capability === auth.editCap ? ROLE_EDIT : null;
    }
    return capability === auth.viewCap ? ROLE_VIEW : null;
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get("Upgrade") || "";
    if (upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Markdown Viewer live room Durable Object", {
        headers: secureHeaders({
          "Cache-Control": "no-store",
          "Content-Type": "text/plain; charset=utf-8"
        })
      });
    }

    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (!isAllowedLiveOrigin(origin)) {
      return new Response("Live room origin is not allowed", {
        status: 403,
        headers: secureHeaders({ "Cache-Control": "no-store" })
      });
    }

    const roomId = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
    const secret = url.searchParams.get("secret") || "";
    if (!roomId || !secret) {
      return new Response("Missing live room credentials", {
        status: 400,
        headers: secureHeaders({ "Cache-Control": "no-store" })
      });
    }

    const role = await this.authenticateSocket(url);
    if (!role) {
      return new Response("Invalid live room credentials", {
        status: 403,
        headers: secureHeaders({ "Cache-Control": "no-store" })
      });
    }

    if (this.sessions.size >= MAX_PARTICIPANTS) {
      return new Response("Live room is full", {
        status: 429,
        headers: secureHeaders({ "Cache-Control": "no-store" })
      });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const participantId = "socket-" + crypto.randomUUID();

    server.accept();
    this.sessions.set(server, {
      participantId,
      roomId,
      role,
      joinedAt: Date.now()
    });

    server.addEventListener("message", (event) => {
      let parsed;
      try {
        parsed = parseRoomMessage(event.data);
      } catch (_) {
        return;
      }

      const session = this.sessions.get(server);
      const normalized = normalizeOutboundMessage(parsed, participantId, roomId, session ? session.role : ROLE_VIEW);
      if (!normalized) return;

      if (session && parsed.sender) {
        session.participantId = String(parsed.sender).slice(0, 120);
      }

      this.broadcast(normalized, server);
    });

    const close = () => this.removeSocket(server);
    server.addEventListener("close", close);
    server.addEventListener("error", close);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}

export default {
  fetch(request, env) {
    if (!env || !env.LIVE_ROOMS) {
      return new Response("Missing LIVE_ROOMS binding", {
        status: 500,
        headers: secureHeaders({ "Cache-Control": "no-store" })
      });
    }

    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (!isAllowedLiveOrigin(origin)) {
      return new Response("Live room origin is not allowed", {
        status: 403,
        headers: secureHeaders({ "Cache-Control": "no-store" })
      });
    }

    const roomId = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
    if (!roomId) {
      return new Response("Missing live room", {
        status: 400,
        headers: secureHeaders({ "Cache-Control": "no-store" })
      });
    }

    const secret = url.searchParams.get("secret") || "";
    if (!secret) {
      return new Response("Missing live room credentials", {
        status: 400,
        headers: secureHeaders({ "Cache-Control": "no-store" })
      });
    }

    const id = env.LIVE_ROOMS.idFromName(roomId + ":" + secret);
    return env.LIVE_ROOMS.get(id).fetch(request);
  }
};
