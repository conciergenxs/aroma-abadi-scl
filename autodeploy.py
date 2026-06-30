#!/usr/bin/env python3
"""
autodeploy.py — watches aroma-abadi-scl for file changes and pushes
directly to GitHub via REST API (no git CLI, no lock file issues).

Usage:
    python3 autodeploy.py          # start watcher (debounce 3s)
    python3 autodeploy.py --push   # one-shot push all changes now
"""

import base64
import hashlib
import json
import os
import sys
import time
import threading
from pathlib import Path

import requests

# ── config ──────────────────────────────────────────────────────────────
TOKEN  = os.environ.get("GITHUB_TOKEN", "")
OWNER  = "conciergenxs"
REPO   = "aroma-abadi-scl"
BRANCH = "main"
ROOT   = Path(__file__).parent.resolve()

IGNORE_DIRS  = {".git", "node_modules", ".vercel", "dist", ".cache", "__pycache__"}
IGNORE_EXTS  = {".lock", ".log", ".pyc", ".DS_Store"}
IGNORE_FILES = {"autodeploy.py", ".gitignore"}

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
API = f"https://api.github.com/repos/{OWNER}/{REPO}"
DEBOUNCE = 3.0   # seconds to wait after last change before pushing
# ────────────────────────────────────────────────────────────────────────


def log(msg: str):
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def should_ignore(path: Path) -> bool:
    parts = path.relative_to(ROOT).parts
    if any(p in IGNORE_DIRS for p in parts):
        return True
    if path.name in IGNORE_FILES:
        return True
    if path.suffix in IGNORE_EXTS:
        return True
    return False


def get_local_files() -> dict[str, bytes]:
    """Return {rel_path: content_bytes} for all tracked source files."""
    files = {}
    for p in ROOT.rglob("*"):
        if p.is_file() and not should_ignore(p):
            rel = p.relative_to(ROOT).as_posix()
            files[rel] = p.read_bytes()
    return files


def get_current_commit() -> tuple[str, str]:
    """Return (commit_sha, tree_sha) for HEAD of branch."""
    r = requests.get(f"{API}/git/ref/heads/{BRANCH}", headers=HEADERS)
    r.raise_for_status()
    commit_sha = r.json()["object"]["sha"]

    r2 = requests.get(f"{API}/git/commits/{commit_sha}", headers=HEADERS)
    r2.raise_for_status()
    tree_sha = r2.json()["tree"]["sha"]
    return commit_sha, tree_sha


def get_remote_tree(tree_sha: str) -> dict[str, str]:
    """Return {path: blob_sha} for all files in the remote tree (recursive)."""
    r = requests.get(f"{API}/git/trees/{tree_sha}?recursive=1", headers=HEADERS)
    r.raise_for_status()
    data = r.json()
    return {
        item["path"]: item["sha"]
        for item in data.get("tree", [])
        if item["type"] == "blob"
    }


def sha1_of(content: bytes) -> str:
    """Git blob SHA = sha1('blob <size>\0<content>')."""
    header = f"blob {len(content)}\0".encode()
    return hashlib.sha1(header + content).hexdigest()


def create_blob(content: bytes) -> str:
    payload = {"content": base64.b64encode(content).decode(), "encoding": "base64"}
    r = requests.post(f"{API}/git/blobs", headers=HEADERS, json=payload)
    r.raise_for_status()
    return r.json()["sha"]


def push_changes() -> bool:
    """Diff local vs remote; create a commit for changed/added files. Returns True if pushed."""
    log("Checking for changes…")
    try:
        commit_sha, tree_sha = get_current_commit()
        remote = get_remote_tree(tree_sha)
        local  = get_local_files()

        tree_entries = []
        changed = []

        for rel, content in local.items():
            local_sha = sha1_of(content)
            if remote.get(rel) != local_sha:
                blob_sha = create_blob(content)
                tree_entries.append({
                    "path": rel,
                    "mode": "100644",
                    "type": "blob",
                    "sha": blob_sha,
                })
                changed.append(rel)

        # deleted files
        for rel in remote:
            if rel not in local:
                tree_entries.append({
                    "path": rel,
                    "mode": "100644",
                    "type": "blob",
                    "sha": None,
                })
                changed.append(f"[deleted] {rel}")

        if not tree_entries:
            log("Nothing to push — already up to date.")
            return False

        log(f"Pushing {len(tree_entries)} changed file(s):\n  " + "\n  ".join(changed[:10]))
        if len(changed) > 10:
            log(f"  … and {len(changed)-10} more")

        # create new tree
        r = requests.post(f"{API}/git/trees", headers=HEADERS, json={
            "base_tree": tree_sha,
            "tree": tree_entries,
        })
        r.raise_for_status()
        new_tree_sha = r.json()["sha"]

        # create commit
        msg = f"auto: {len(tree_entries)} file(s) updated"
        r = requests.post(f"{API}/git/commits", headers=HEADERS, json={
            "message": msg,
            "tree": new_tree_sha,
            "parents": [commit_sha],
            "author": {"name": "Concierge NXS", "email": "concierge@nxs.id"},
        })
        r.raise_for_status()
        new_commit_sha = r.json()["sha"]

        # update branch ref
        r = requests.patch(f"{API}/git/refs/heads/{BRANCH}", headers=HEADERS, json={
            "sha": new_commit_sha,
            "force": False,
        })
        r.raise_for_status()

        log(f"✓ Pushed commit {new_commit_sha[:7]} → Vercel will deploy shortly.")
        return True

    except Exception as e:
        log(f"✗ Push failed: {e}")
        return False


# ── file watcher ─────────────────────────────────────────────────────────

def watch():
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler

    _timer: threading.Timer | None = None
    _lock = threading.Lock()

    class Handler(FileSystemEventHandler):
        def on_any_event(self, event):
            nonlocal _timer
            if event.is_directory:
                return
            p = Path(event.src_path)
            if should_ignore(p):
                return
            with _lock:
                if _timer:
                    _timer.cancel()
                _timer = threading.Timer(DEBOUNCE, push_changes)
                _timer.daemon = True
                _timer.start()
                log(f"~ {p.relative_to(ROOT)} changed — deploying in {DEBOUNCE}s…")

    observer = Observer()
    observer.schedule(Handler(), str(ROOT), recursive=True)
    observer.start()
    log(f"👀 Watching {ROOT}  (debounce {DEBOUNCE}s)")
    log(f"   Repo: {OWNER}/{REPO}  Branch: {BRANCH}")
    log(f"   Press Ctrl+C to stop.\n")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    if "--push" in sys.argv:
        push_changes()
    else:
        watch()
