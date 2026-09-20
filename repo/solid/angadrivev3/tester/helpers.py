"""Shared helpers for the AngaDrive integration tests.

These functions abstract the common operations every test needs:

  * opening a websocket connection,
  * sending a request and waiting for a specific response type,
  * waiting for a message matching a predicate (used for pulses),
  * uploading a file over the HTTP chunked-upload endpoint,
  * generating bcrypt hashes and random emails.

The helpers intentionally return ``None`` on timeout/failure so tests can
assert on the result directly.
"""

import asyncio
import gzip
import json
import os
import subprocess
import uuid

import websockets

from . import config


def make_msg(msg_type, data):
    """Build a websocket message in the ``{"type": ..., "data": ...}`` shape."""
    return json.dumps({"type": msg_type, "data": data})


def bcrypt_hash(password):
    """Return a bcrypt hash of ``password`` (matches Go's bcrypt usage).

    The Go server stores a bcrypt hash at registration and compares it against
    the plaintext password at login, so tests must send a hash when registering
    and the plaintext when logging in.
    """
    import bcrypt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def random_email():
    """Return a unique test email address."""
    return f"tester_{uuid.uuid4().hex[:10]}@example.com"


async def open_ws():
    """Open a websocket connection to the server."""
    return await websockets.connect(config.WS_URL)


async def recv_until(ws, predicate, timeout=config.DEFAULT_TIMEOUT):
    """Read messages until one satisfies ``predicate``; return it or None.

    Args:
        ws:        the websocket connection.
        predicate: a callable taking a parsed message dict and returning bool.
        timeout:   seconds to wait before giving up.

    Returns the first matching message dict, or ``None`` on timeout/close.
    """
    try:
        async with asyncio.timeout(timeout):
            while True:
                raw = await ws.recv()
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                if predicate(msg):
                    return msg
    except (asyncio.TimeoutError, websockets.ConnectionClosed):
        return None


async def send_and_wait(ws, msg_type, data, want_type, timeout=config.DEFAULT_TIMEOUT):
    """Send a request and wait for the response of the given type.

    Args:
        ws:        the websocket connection.
        msg_type:  the request message type (e.g. ``"login"``).
        data:      the request payload.
        want_type: the response type to wait for (e.g. ``"login_response"``).
        timeout:   seconds to wait.

    Returns the matching response dict, or ``None`` on timeout.
    """
    await ws.send(make_msg(msg_type, data))
    return await recv_until(ws, lambda m: m.get("type") == want_type, timeout)


async def upload_file(email=None, password=None, token=None, collection_id="",
                      filename="hello.txt", content=b"hello world"):
    """Upload a small file over the websocket upload transport (3 connections).

    Args:
        email/password/token: authentication credentials.
        collection_id:        optional collection to add the file to.
        filename:             the original file name.
        content:              the raw file bytes.

    Returns the finalize data dict (with fileDirectory etc.) or None on failure.
    """
    result = await ws_upload_file(email=email, password=password, token=token,
                                  collection_id=collection_id, filename=filename,
                                  content=content)
    if result and result.get("success"):
        return result
    return None


async def generate_test_video(path, duration=3, size="320x240", fps=24, seed=None):
    """Generate a small test MP4 video using ffmpeg.

    ``seed`` (if given) is drawn into the frame so that videos generated with
    different seeds have different content (and therefore different sha256),
    which keeps preview tests isolated across runs.

    Returns True on success, False if ffmpeg is unavailable or fails.
    """
    try:
        # Draw the seed text into the frame so content differs per seed.
        draw = ""
        if seed is not None:
            draw = f",drawtext=text='{seed}':fontsize=24:fontcolor=white:x=10:y=10"
        subprocess.run(
            ["ffmpeg", "-y", "-f", "lavfi", "-i", f"testsrc=duration={duration}:size={size}:rate={fps}",
             "-vf", f"format=yuv420p{draw}",
             "-pix_fmt", "yuv420p", path],
            check=True, capture_output=True,
        )
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


async def fetch_preview_status(file_directory):
    """Request a video preview and return the HTTP status code.

    Returns the status code (int), or None on connection error.
    """
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{config.HTTP_URL}/preview-video/{file_directory}.gif") as resp:
            return resp.status


async def fetch_preview(file_directory):
    """Request a video preview and return ``(status, body_bytes)``.

    Unlike :func:`fetch_preview_status`, this also returns the response body so
    tests can inspect the served content (e.g. verify GIF magic bytes).
    """
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{config.HTTP_URL}/preview-video/{file_directory}.gif") as resp:
            body = await resp.read()
            return resp.status, body


async def send_chunk(upload_id, chunk_index, content):
    """Send a single gzipped chunk to ``/upload/{upload_id}``.

    Returns the HTTP status code (int), or None on connection error.
    """
    import aiohttp
    chunk = gzip.compress(content)
    async with aiohttp.ClientSession() as session:
        data = aiohttp.FormData()
        data.add_field("chunk", chunk, filename="chunk", content_type="application/octet-stream")
        data.add_field("chunkIndex", str(chunk_index))
        async with session.post(f"{config.HTTP_URL}/upload/{upload_id}", data=data) as resp:
            return resp.status


async def finalize_upload(upload_id, total_chunks, filename, email=None,
                          password=None, token=None, collection_id=""):
    """Finalize an upload and return ``(status, body)``.

    This is the low-level counterpart to :func:`upload_file`; it returns the
    raw HTTP status and parsed JSON body (or raw text) so tests can assert on
    error codes and messages.
    """
    import aiohttp
    async with aiohttp.ClientSession() as session:
        form = aiohttp.FormData()
        form.add_field("totalChunks", str(total_chunks))
        form.add_field("originalFileName", filename)
        form.add_field("collectionId", collection_id)
        if token:
            form.add_field("token", token)
        if email:
            form.add_field("email", email)
        if password:
            form.add_field("password", password)
        async with session.post(f"{config.HTTP_URL}/upload/success/{upload_id}", data=form) as resp:
            text = await resp.text()
            try:
                body = json.loads(text)
            except json.JSONDecodeError:
                body = text
            return resp.status, body


async def upload_file_full(email=None, password=None, token=None, collection_id="",
                           filename="hello.txt", content=b"hello world",
                           total_chunks=1, chunk_size=None):
    """Upload a file over the websocket transport, returning finalize details.

    Splits ``content`` into ``total_chunks`` (or ``chunk_size``-byte pieces),
    distributes the chunks across three ``/ws/upload`` connections and
    finalizes. Returns ``(ok, body)`` where ``ok`` is True when the finalize
    response reported success and ``body`` is the finalize data dict (or an
    error message string).
    """
    result = await ws_upload_file(email=email, password=password, token=token,
                                  collection_id=collection_id, filename=filename,
                                  content=content, total_chunks=total_chunks,
                                  chunk_size=chunk_size)
    if result is None:
        return 0, None
    if result.get("success"):
        return 200, result
    return 400, result


WS_UPLOAD_CONNECTIONS = 3  # number of websocket connections in the pool
UPLOAD_ID_LEN = 36        # ASCII upload_id bytes prefixed on binary frames


async def open_upload_ws():
    """Open one upload websocket connection."""
    return await websockets.connect(config.WS_UPLOAD_URL, max_size=16 * 1024 * 1024)


def _auth_payload(email=None, password=None, token=None):
    if email and password:
        return {"email": email, "password": password}
    return {"token": token or ""}


def new_upload_id():
    """Return a fresh 36-char upload_id (str(uuid4()), matching the browser).

    The websocket transport validates upload_ids on the server, so tests must
    send str(uuid4()) (36 chars), not uuid4().hex (32 chars).
    """
    return str(uuid.uuid4())


async def _init_upload_ws(ws, upload_id, email=None, password=None, token=None,
                          timeout=config.DEFAULT_TIMEOUT):
    """Send the init handshake on an upload socket; return init_ack or None."""
    await ws.send(make_msg("init", {"upload_id": upload_id,
                                    "auth": _auth_payload(email, password, token)}))
    return await recv_until(ws, lambda m: m.get("type") == "init_ack", timeout)


async def ws_send_chunk(ws, upload_id, chunk_index, content):
    """Send one gzipped chunk as a binary frame over an upload socket.

    Frame layout: [36-byte ASCII upload_id][4-byte BE chunk index][gzip].
    Returns True when the server acks THIS upload's chunk.
    """
    payload = gzip.compress(content)
    id_bytes = upload_id.encode("ascii")
    frame = id_bytes + chunk_index.to_bytes(4, "big") + payload
    await ws.send(frame)
    ack = await recv_until(
        ws,
        lambda m: (m.get("type") in ("chunk_ack", "chunk_error")
                   and m.get("data", {}).get("upload_id") == upload_id),
        config.DEFAULT_TIMEOUT)
    return bool(ack and ack.get("type") == "chunk_ack")


async def ws_finalize(ws, upload_id, total_chunks, filename, email=None,
                      password=None, token=None, collection_id=""):
    """Finalize an upload over an upload socket.

    Returns the finalize_response data dict (with ``success`` bool), or None.
    """
    await ws.send(make_msg("finalize", {
        "upload_id": upload_id,
        "total_chunks": total_chunks,
        "original_file_name": filename,
        "collection_id": collection_id,
        "auth": _auth_payload(email, password, token),
    }))
    resp = await recv_until(ws, lambda m: m.get("type") in ("finalize_response", "error"),
                            config.DEFAULT_TIMEOUT)
    if resp is None:
        return None
    if resp.get("type") == "error":
        return {"success": False, "message": resp.get("data")}
    return resp.get("data")


async def ws_upload_file(email=None, password=None, token=None, collection_id="",
                         filename="hello.txt", content=b"hello world",
                         total_chunks=1, chunk_size=None):
    """Upload a file over the pooled websocket transport.

    Mirrors the frontend behaviour: gzip each chunk, distribute the chunks
    across three ``/ws/upload`` connections, then finalize on one of them.

    Returns the finalize data dict on success (``success == True``), or None.
    """
    upload_id = new_upload_id()

    if chunk_size is not None:
        pieces = [content[i:i + chunk_size] for i in range(0, len(content), chunk_size)] or [b""]
    else:
        n = max(1, total_chunks)
        base = len(content) // n
        rem = len(content) % n
        pieces = []
        idx = 0
        for i in range(n):
            size = base + (1 if i < rem else 0)
            pieces.append(content[idx:idx + size])
            idx += size

    conns = [await open_upload_ws() for _ in range(WS_UPLOAD_CONNECTIONS)]
    try:
        inits = await asyncio.gather(*[
            _init_upload_ws(ws, upload_id, email=email, password=password, token=token)
            for ws in conns
        ])
        if not all(inits):
            return None

        # Distribute chunks round-robin across the connections (all sent
        # concurrently, like the browser does).
        async def send_all(ws, indices):
            for i in indices:
                if not await ws_send_chunk(ws, upload_id, i, pieces[i]):
                    return False
            return True

        buckets = [list(range(b, len(pieces), WS_UPLOAD_CONNECTIONS))
                   for b in range(WS_UPLOAD_CONNECTIONS)]
        ok = await asyncio.gather(*[send_all(ws, bucket)
                                    for ws, bucket in zip(conns, buckets)])
        if not all(ok):
            return None

        return await ws_finalize(conns[0], upload_id, len(pieces), filename,
                                 email=email, password=password, token=token,
                                 collection_id=collection_id)
    finally:
        for ws in conns:
            try:
                await ws.close()
            except Exception:
                pass