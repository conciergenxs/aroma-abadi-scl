#!/usr/bin/env bash
# autodeploy.sh — auto git push saat ada perubahan file, dengan throttle
# supaya tidak nge-spam Vercel (free tier: 100 deploy/hari).
# Jalankan sekali dari terminal lokal: bash ~/aroma-abadi-scl/autodeploy.sh
#
# 2026-09-04: ditambah MIN_INTERVAL setelah kena limit "100 deploy/hari" —
# sebelumnya setiap save (walau cuma jeda 3 detik) langsung push+deploy baru,
# jadi satu sesi edit cepat bisa gampang tembus 50-60+ deploy dalam 2 jam.
# Sekarang push actual dibatasi maksimal 1x per MIN_INTERVAL; perubahan yang
# masuk saat "ditahan" tetap ke-flush otomatis lewat loop periodik di bawah,
# jadi tidak ada perubahan yang ketinggalan/hilang, cuma jadi lebih jarang push.

REPO="$HOME/aroma-abadi-scl"
DEBOUNCE=3          # detik tunggu setelah perubahan terakhir sebelum dicoba push
MIN_INTERVAL=300    # jarak minimum antar push actual (detik) — 1x per 5 menit
LOCK_DIR="$REPO/.autodeploy.lock"
LAST_PUSH_FILE="$REPO/.autodeploy.last-push"

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

# hapus lock file lama kalau ada (dari proses sebelumnya yang crash/mati paksa)
rm -f .git/index.lock .git/HEAD.lock 2>/dev/null
rmdir "$LOCK_DIR" 2>/dev/null

last_push_ts() {
  [ -f "$LAST_PUSH_FILE" ] && cat "$LAST_PUSH_FILE" || echo 0
}

push_changes() {
  # cegah dua panggilan push_changes jalan bersamaan (fswatch event vs. loop periodik)
  mkdir "$LOCK_DIR" 2>/dev/null || return
  trap 'rmdir "$LOCK_DIR" 2>/dev/null' RETURN

  rm -f .git/index.lock .git/HEAD.lock 2>/dev/null
  if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
    return
  fi

  local now elapsed
  now=$(date +%s)
  elapsed=$(( now - $(last_push_ts) ))
  if [ "$elapsed" -lt "$MIN_INTERVAL" ]; then
    log "Ada perubahan, ditahan $(( MIN_INTERVAL - elapsed ))s lagi (throttle ${MIN_INTERVAL}s) — akan ke-flush otomatis."
    return
  fi

  log "Pushing ke GitHub…"
  if git add -A && \
     git commit -m "auto: $(git diff --cached --name-only | head -3 | tr '\n' ', ' | sed 's/,$//') [autodeploy]" && \
     git push; then
    echo "$now" > "$LAST_PUSH_FILE"
    log "✓ Push berhasil — Vercel sedang deploy."
  else
    log "✗ Push gagal."
  fi
}

# loop periodik: jaring pengaman supaya perubahan yang sempat "ditahan" oleh
# throttle tetap ke-push begitu MIN_INTERVAL lewat, walau tidak ada save baru.
(
  while true; do
    sleep "$MIN_INTERVAL"
    push_changes
  done
) &
SAFETY_NET_PID=$!
trap 'kill "$SAFETY_NET_PID" 2>/dev/null' EXIT

# gunakan fswatch kalau tersedia (brew install fswatch), fallback ke polling
if command -v fswatch &>/dev/null; then
  log "👀 Watching $REPO dengan fswatch (debounce ${DEBOUNCE}s, throttle ${MIN_INTERVAL}s)…"
  log "   Ctrl+C untuk berhenti."
  echo ""
  fswatch -r -e "\.git" -e "node_modules" -e "\.lock$" -e "\.log$" \
          -e "/dist" -e "/dist-ssr" -e "/\.output" -e "/\.vinxi" \
          -e "/\.tanstack" -e "/\.nitro" -e "/\.wrangler" \
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
