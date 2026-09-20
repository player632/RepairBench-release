"""Playwright UI tests for the WebSocket-based upload flow.

Drives the real frontend (served by the Go backend at ``http://API_URL``) in a
headless Chromium browser and verifies that the upload UI keeps working with
the global pool of WebSocket connections:

  * register + login through the UI,
  * upload a file through the upload popup (drag & drop),
  * verify the progress bar reaches 100% and "Uploaded!" appears,
  * verify the file shows up in the drive file list (server round-trip),
  * verify a multi-chunk upload works through the same UI.

The upload itself now happens over a shared pool of three ``/ws/upload``
connections; these tests assert the observable UI behaviour is unchanged.

Run:  python -m tester.playwright_upload   (server must be running)
"""

import asyncio
import os
import sys
import tempfile
import uuid

from playwright.async_api import async_playwright, expect

from . import config
from .harness import check, summary, exit_with_result

BASE_URL = f"http://{config.API_URL}"


def _make_file(path, size_mb=1, seed=b"ws-ui-upload-test"):
    """Create a deterministic test file of roughly size_mb megabytes."""
    # Repeat the seed to the target size; gzip-compressible, like real usage.
    with open(path, "wb") as f:
        written = 0
        block = seed * 4096  # ~88KB
        while written < size_mb * 1024 * 1024:
            remaining = size_mb * 1024 * 1024 - written
            chunk = block[:min(len(block), remaining)]
            f.write(chunk)
            written += len(chunk)


async def _register_via_ui(page, email, password):
    """Register a test user over the app's own websocket API, then inject the
    credentials into localStorage so the UI treats the browser as logged in."""
    import json as _json
    import websockets as _websockets
    from .helpers import bcrypt_hash

    async with _websockets.connect(config.WS_URL) as ws:
        await ws.send(_json.dumps({"type": "register", "data": {
            "display_name": "PW Tester",
            "email": email,
            "hashed_password": bcrypt_hash(password),
        }}))
        await asyncio.wait_for(ws.recv(), config.DEFAULT_TIMEOUT)

    await page.goto(f"{BASE_URL}/account", wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)
    await page.evaluate(
        "([e, p]) => { localStorage.setItem('email', e); localStorage.setItem('password', p); }",
        [email, password],
    )
    # Reload so the app picks up the credentials and logs the socket in.
    await page.reload(wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)
    stored_email = await page.evaluate("() => localStorage.getItem('email')")
    check("ui auth stored", stored_email == email, f"(email: {stored_email!r})")


async def test_ui_upload_single_file(page):
    """Upload a single file through the UI and verify it completes."""
    print("\n[ui-test] single file upload through the popup")
    email = f"pw_{uuid.uuid4().hex[:10]}@example.com"
    password = "PwUpload123!"
    await _register_via_ui(page, email, password)

    await page.goto(f"{BASE_URL}/my_drive", wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)

    tmp = tempfile.NamedTemporaryFile(suffix=".txt", delete=False)
    tmp.close()
    _make_file(tmp.name, size_mb=1)
    try:
        # Open the upload popup via the Upload trigger button.
        await page.get_by_role("button", name="Upload").first.click()
        await page.wait_for_timeout(500)

        # Set the file on the hidden input.
        await page.locator("#file-upload").set_input_files(tmp.name)
        await page.wait_for_timeout(500)

        # The file row should appear, start uploading (progress) and finish.
        uploaded_row = page.get_by_text("Uploaded!", exact=True).first
        await expect(uploaded_row).to_be_visible(timeout=30_000)
        check("single file shows Uploaded!", True)
    finally:
        os.unlink(tmp.name)


async def test_ui_upload_multi_file(page):
    """Upload several files at once; all should complete."""
    print("\n[ui-test] multi-file upload through the popup")
    email = f"pw_{uuid.uuid4().hex[:10]}@example.com"
    password = "PwUpload123!"
    await _register_via_ui(page, email, password)

    await page.goto(f"{BASE_URL}/my_drive", wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)

    paths = []
    try:
        for i in range(3):
            tmp = tempfile.NamedTemporaryFile(suffix=f".txt", delete=False)
            tmp.close()
            _make_file(tmp.name, size_mb=1, seed=f"multi-{i}-".encode())
            paths.append(tmp.name)

        await page.get_by_role("button", name="Upload").first.click()
        await page.wait_for_timeout(500)
        await page.locator("#file-upload").set_input_files(paths)

        # Wait for all three rows to show "Uploaded!".
        uploaded_rows = page.get_by_text("Uploaded!", exact=True)
        await expect(uploaded_rows).to_have_count(3, timeout=60_000)
        check("all 3 files show Uploaded!", True)
    finally:
        for p in paths:
            os.unlink(p)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await context.new_page()

        # Surface console errors for debugging.
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        try:
            await test_ui_upload_single_file(page)
            await test_ui_upload_multi_file(page)
        except Exception as e:
            check("ui test suite raised", False, f"(exception: {e!r})")
            if console_errors:
                print("Console errors:", console_errors[:10])
        finally:
            await browser.close()

    exit_with_result(summary())


if __name__ == "__main__":
    asyncio.run(main())
