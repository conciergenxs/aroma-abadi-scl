#!/bin/bash
# Auto-push watcher for aroma-abadi-scl
# Runs in background via LaunchAgent — do not close manually

REPO="$HOME/aroma-abadi-scl"
LOG="$REPO/auto-push.log"
LAST_HASH=""

cd "$REPO" || exit 1

echo "[$(date)] Auto-push watcher started" >> "$LOG"

while true; do
  # Get current hash of working tree (tracked files)
  CURRENT_HASH=$(git status --porcelain | md5sum 2>/dev/null || git status --porcelain | md5)

  if [ "$CURRENT_HASH" != "$LAST_HASH" ] && [ -n "$(git status --porcelain)" ]; then
    LAST_HASH="$CURRENT_HASH"
    sleep 3  # debounce — wait for rapid saves to settle

    # Re-check after debounce
    if [ -n "$(git status --porcelain)" ]; then
      git add -A
      git commit -m "auto: save changes [$(date '+%H:%M:%S')]"
      git push origin main >> "$LOG" 2>&1 && \
        echo "[$(date)] Pushed OK" >> "$LOG" || \
        echo "[$(date)] Push failed" >> "$LOG"
    fi
  fi

  LAST_HASH="$CURRENT_HASH"
  sleep 5
done
