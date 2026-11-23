#!/usr/bin/env bash
# Устанавливает ярлык Must Have на рабочий стол и в меню приложений.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICON_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"
APPS_DIR="$HOME/.local/share/applications"
DESKTOP_DIR="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
[ -n "$DESKTOP_DIR" ] || DESKTOP_DIR="$HOME/Desktop"

mkdir -p "$ICON_DIR" "$APPS_DIR" "$DESKTOP_DIR"
cp "$DIR/assets/icon-512.png" "$ICON_DIR/must-have.png"
chmod +x "$DIR/start.sh" "$DIR/serve-lan.sh" "$DIR/install-desktop.sh"

write_entry() {
  local target="$1"
  cat > "$target" <<DESKTOP
[Desktop Entry]
Type=Application
Version=1.0
Name=Must Have
Name[ru]=Must Have
GenericName=Финансовый план
GenericName[ru]=Финансовый план
Comment=Локальный калькулятор финансов и заметочник для ближайших планов
Comment[ru]=Локальный калькулятор финансов и заметочник для ближайших планов
Exec="$DIR/start.sh"
Path=$DIR
Icon=$ICON_DIR/must-have.png
Terminal=false
Categories=Office;Finance;
StartupWMClass=MustHave
StartupNotify=true
Keywords=must;have;финансы;план;цели;деньги;заработок;
DESKTOP
  chmod +x "$target"
}

write_entry "$APPS_DIR/must-have.desktop"
write_entry "$DESKTOP_DIR/Must Have.desktop"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
fi
if command -v gio >/dev/null 2>&1; then
  gio set "$DESKTOP_DIR/Must Have.desktop" metadata::trusted true >/dev/null 2>&1 || true
fi
if command -v notify-send >/dev/null 2>&1; then
  notify-send "Must Have" "Ярлык установлен на рабочий стол" 2>/dev/null || true
fi

printf 'Готово. Ярлык: %s\n' "$DESKTOP_DIR/Must Have.desktop"
