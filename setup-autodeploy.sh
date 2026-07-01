#!/usr/bin/env bash
# setup-autodeploy.sh
# Jalankan SEKALI untuk install autodeploy sebagai background service.
# Setelah ini, setiap ada perubahan file akan otomatis push ke GitHub.

PLIST="$HOME/Library/LaunchAgents/id.nxs.aroma-abadi-scl.autodeploy.plist"

cat > "$PLIST" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>id.nxs.aroma-abadi-scl.autodeploy</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>/Users/nxs_ilham/aroma-abadi-scl/autodeploy.sh</string>
  </array>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>/tmp/aroma-abadi-scl-autodeploy.log</string>

  <key>StandardErrorPath</key>
  <string>/tmp/aroma-abadi-scl-autodeploy.log</string>

  <key>WorkingDirectory</key>
  <string>/Users/nxs_ilham/aroma-abadi-scl</string>
</dict>
</plist>
EOF

# install fswatch kalau belum ada
if ! command -v fswatch &>/dev/null; then
  echo "Installing fswatch..."
  brew install fswatch
fi

# load service
launchctl unload "$PLIST" 2>/dev/null
launchctl load "$PLIST"

echo ""
echo "✓ Autodeploy service aktif!"
echo "  Setiap perubahan file di ~/aroma-abadi-scl akan otomatis push ke GitHub."
echo ""
echo "  Cek log: tail -f /tmp/aroma-abadi-scl-autodeploy.log"
echo "  Stop:    launchctl unload $PLIST"
echo "  Start:   launchctl load $PLIST"
