#!/usr/bin/env python3
"""Minimal reference answering agent for RepairBench.

Drives a messages-style model endpoint with list_dir, read_file, write_file and
finish tools, sandboxed to the working copy of a single seed tree. The endpoint,
model and credential are configuration; grading does not depend on them."""
from __future__ import annotations
import datetime as dt
import json
import os
import sys
import httpx
from pathlib import Path

BASE_URL = "https://dashscope.aliyuncs.com/apps/anthropic"
MODEL = "qwen3.8-max"
KEY = os.environ["DASHSCOPE_KEY"]
RUN_DIR = Path(__file__).resolve().parent
APP_DIR = RUN_DIR / "app"
INSTRUCTION = (RUN_DIR / "instruction.md").read_text(encoding="utf-8")
MAX_TURNS = 1000  # effectively unlimited: the answering protocol imposes no turn limit
MAX_TOKENS = 16384
log_fh = (RUN_DIR / "agent.log").open("w", encoding="utf-8")

def log(msg: str) -> None:
    line = f"[{dt.datetime.now().strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    log_fh.write(line + "\n"); log_fh.flush()

TOOLS = [
    {"name": "list_dir", "description": "List files under a path (relative to the app root, '.' for root). Returns file names, dirs suffixed with /.",
     "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}},
    {"name": "read_file", "description": "Read a text file (relative to the app root). Returns up to 40000 chars.",
     "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}},
    {"name": "write_file", "description": "Overwrite a text file (relative to the app root) with the full given content.",
     "input_schema": {"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path", "content"]}},
    {"name": "finish", "description": "Call when the fix is complete. Provide a short summary of the root cause and the change.",
     "input_schema": {"type": "object", "properties": {"summary": {"type": "string"}}, "required": ["summary"]}},
]

def resolve(rel: str) -> Path | None:
    p = (APP_DIR / rel).resolve() if not Path(rel).is_absolute() else Path(rel).resolve()
    try:
        p.relative_to(APP_DIR.resolve())
    except ValueError:
        return None
    return p

def exec_tool(name: str, inp: dict) -> str:
    try:
        if name == "list_dir":
            p = resolve(inp.get("path", "."))
            if p is None: return "ERROR: path outside workspace"
            if not p.is_dir(): return f"ERROR: not a directory: {inp.get('path')}"
            names = sorted(e.name + ("/" if e.is_dir() else "") for e in p.iterdir())
            return "\n".join(names) if names else "(empty)"
        if name == "read_file":
            p = resolve(inp.get("path", ""))
            if p is None: return "ERROR: path outside workspace"
            if not p.is_file(): return f"ERROR: no such file: {inp.get('path')}"
            if p.suffix in {".mp3", ".jpg", ".png", ".db"}: return f"ERROR: binary file ({p.suffix}), not readable as text"
            data = p.read_text(encoding="utf-8", errors="replace")
            return data[:40000] + ("\n...[truncated]" if len(data) > 40000 else "")
        if name == "write_file":
            p = resolve(inp.get("path", ""))
            if p is None: return "ERROR: path outside workspace"
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(inp.get("content", ""), encoding="utf-8")
            return f"OK: wrote {len(inp.get('content',''))} chars to {inp.get('path')}"
        if name == "finish":
            return "FINISH"
        return f"ERROR: unknown tool {name}"
    except Exception as exc:  # noqa: BLE001
        return f"ERROR: {exc}"

SYSTEM = (
    "You are a careful bug-fix agent. You receive the source code of a web app with ONE bug. "
    "Use the tools to inspect files, find the root cause, and apply a minimal fix by rewriting files. "
    "All paths are relative to the app root. Do not touch data-testid attributes. "
    "Keep the app pure static (no build step, no network requests, no new dependencies). "
    "When the fix is complete, call the finish tool exactly once."
)

def main() -> None:
    user = (INSTRUCTION + "\n\n---\n\nThe application source code is in your workspace (paths relative to the app root: "
            "'. ' = app root). Start by listing the files, then locate and fix the defect described above. "
            "Call finish when done.")
    messages: list[dict] = [{"role": "user", "content": user}]
    headers = {"Content-Type": "application/json", "x-api-key": KEY,
               "Authorization": f"Bearer {KEY}", "anthropic-version": "2023-06-01"}
    finished = False
    for turn in range(1, MAX_TURNS + 1):
        body = {"model": MODEL, "max_tokens": MAX_TOKENS, "system": SYSTEM,
                "messages": messages, "tools": TOOLS}
        data = None
        for attempt in range(1, 7):
            try:
                resp = httpx.post(f"{BASE_URL}/v1/messages", headers=headers, json=body, timeout=1200)
                if resp.status_code == 200:
                    data = resp.json(); break
                log(f"turn {turn}: HTTP {resp.status_code} (attempt {attempt}): {resp.text[:200]}")
            except Exception as exc:  # noqa: BLE001
                log(f"turn {turn}: request error (attempt {attempt}): {str(exc)[:200]}")
            import time
            time.sleep(min(20 * attempt, 60))
        if data is None:
            log(f"turn {turn}: API failed 6 consecutive times, exiting"); sys.exit(1)
        content = data.get("content", [])
        usage = data.get("usage", {})
        kept = [b for b in content if b.get("type") in ("text", "tool_use")]
        for b in kept:
            if b["type"] == "text":
                log(f"turn {turn} text: {b['text'][:400]}")
            else:
                argpreview = json.dumps(b["input"], ensure_ascii=False)[:180]
                log(f"turn {turn} tool: {b['name']} {argpreview}")
        messages.append({"role": "assistant", "content": kept})
        tool_uses = [b for b in kept if b["type"] == "tool_use"]
        if data.get("stop_reason") == "end_turn" and not tool_uses:
            log(f"turn {turn}: end_turn without tools -> treat as finished")
            finished = True
            break
        if not tool_uses:
            empty_streak = locals().get("empty_streak", 0) + 1
            if empty_streak >= 3:
                log(f"turn {turn}: 3 consecutive truncated/no-tool turns, giving up"); break
            log(f"turn {turn}: no tool call (stop_reason={data.get('stop_reason')}); nudging")
            messages.append({"role": "user", "content": [
                {"type": "text", "text": "Your previous response was truncated before any tool call was made. "
                 "Continue the task right now by calling a tool (list_dir / read_file / write_file / finish)."}]})
            continue
        empty_streak = 0
        results = []
        for b in tool_uses:
            out = exec_tool(b["name"], b.get("input", {}))
            if b["name"] == "finish":
                log(f"turn {turn}: FINISH — {b.get('input',{}).get('summary','')[:300]}")
                finished = True
            results.append({"type": "tool_result", "tool_use_id": b["id"], "content": out})
        messages.append({"role": "user", "content": results})
        log(f"turn {turn}: usage in={usage.get('input_tokens')} out={usage.get('output_tokens')}")
        if finished:
            break
    log(f"done. finished={finished}, turns used={turn}")

if __name__ == "__main__":
    main()
