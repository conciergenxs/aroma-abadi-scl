#!/usr/bin/env bash
# autodeploy.sh — auto git push setiap ada perubahan file
# Jalankan sekali dari terminal lokal: bash ~/aroma-abadi-scl/autodeploy.sh

REPO="$HOME/aroma-abadi-scl"
DEBOUNCE=3        # detik tunggu setelah perubahan terakhir sebelum push
PENDING=0
LAST_CHANGE=0

# launchd runs this with a bare-bones PATH (no /opt/homebrew/bin), so `git`
# would otherwise silently resolve to Xcode's /usr/bin/git instead of the
# Homebrew git used interactively. Two different git binaries means two
# different bundled git-credential-osxkeychain helpers, so macOS Keychain's
# "Always Allow" (tied to the binary's identity) never sticks — it keeps
# alternating between the two, prompting again each time. Pinning PATH here
# keeps every push using the same git/credential-helper as the terminal.
export PATH="/opt/homebrew/bin:$PATH"

log() { echo "[$(date +%H:%M:%S)] $1"; }

cd "$REPO" || { echo "Folder tidak ditemukan: $REPO"; exit 1; }

# hapus lock file lama kalau ada
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null

push_changes() {
  rm -f .git/index.lock .git/HEAD.lock 2>/dev/null
  if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
    log "Tidak ada perubahan."
    return
  fi
  log "Pushing ke GitHub…"
  git add -A && \
  git commit -m "auto: $(git diff --cached --name-only | head -3 | tr '\n' ', ' | sed 's/,$//') [autodeploy]" && \
  git push && \
  log "✓ Push berhasil — Vercel sedang deploy." || \
  log "✗ Push gagal."
}

# gunakan fswatch kalau tersedia (brew install fswatch), fallback ke polling
if command -v fswatch &>/dev/null; then
  log "👀 Watching $REPO dengan fswatch (debounce ${DEBOUNCE}s)…"
  log "   Ctrl+C untuk berhenti."
  echo ""
  fswatch -r -e "\.git" -e "node_modules" -e "\.lock$" -e "\.log$" \
          --latency "$DEBOUNCE" "$REPO" | while read -r _; do
    push_changes
  done
else
  log "👀 Watching $REPO dengan polling setiap ${DEBOUNCE}s…"
  log "   (install fswatch untuk respons lebih cepat: brew install fswatch)"
  log "   Ctrl+C untuk berhenti."
  echo ""
  PREV=$(find "$REPO/src" "$REPO/public" -newer "$REPO/.git/COMMIT_EDITMSG" 2>/dev/null | wc -l)
  while true; do
    sleep "$DEBOUNCE"
    CURR=$(find "$REPO/src" "$REPO/public" -newer "$REPO/.git/COMMIT_EDITMSG" 2>/dev/null | wc -l)
    if [ "$CURR" -ne "$PREV" ]; then
      PREV=$CURR
      push_changes
      PREV=0
    fi
  done
fi
