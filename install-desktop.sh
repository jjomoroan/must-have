#!/usr/bin/env bash
# Устанавливает ярлык Must Have на рабочий стол и в меню приложений.
# Chrome --app на Wayland публикует окно с app_id chrome-127.0.0.1__-Default,
# поэтому для дока нужен .desktop с точно таким же basename.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$HOME/.local/share/applications"
ICON_ROOT="$HOME/.local/share/icons/hicolor"
ICON_DIR="$ICON_ROOT/512x512/apps"
DESKTOP_DIR="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
[ -n "$DESKTOP_DIR" ] || DESKTOP_DIR="$HOME/Desktop"
APP_ID="chrome-127.0.0.1__-Default"

mkdir -p "$ICON_DIR" "$ICON_ROOT/192x192/apps" "$APPS_DIR" "$DESKTOP_DIR"
cp "$DIR/assets/icon-512.png" "$ICON_DIR/must-have.png"
cp "$DIR/assets/icon-192.png" "$ICON_ROOT/192x192/apps/must-have.png"
chmod +x "$DIR/start.sh" "$DIR/serve-lan.sh" "$DIR/install-desktop.sh"

write_entry() {
  local target="$1" hidden="${2:-false}" extra=""
  if [ "$hidden" = "true" ]; then
    extra="NoDisplay=true"
  fi
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
Icon=must-have
Terminal=false
Categories=Office;Finance;
StartupWMClass=$APP_ID
StartupNotify=true
$extra
Keywords=must;have;финансы;план;цели;деньги;заработок;
DESKTOP
  chmod +x "$target"
}

# Основная запись: basename совпадает с Wayland app_id открытого окна.
write_entry "$APPS_DIR/$APP_ID.desktop"
# Старую запись оставляем скрытой, чтобы не дублировать приложение в меню
# и не ломать уже закреплённый пользователем ярлык.
write_entry "$APPS_DIR/must-have.desktop" true
# Ярлык на рабочем столе — та же иконка и тот же запуск.
write_entry "$DESKTOP_DIR/Must Have.desktop" false

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t "$ICON_ROOT" >/dev/null 2>&1 || true
fi
if command -v gio >/dev/null 2>&1; then
  gio set "$DESKTOP_DIR/Must Have.desktop" metadata::trusted true >/dev/null 2>&1 || true
fi
if command -v notify-send >/dev/null 2>&1; then
  notify-send "Must Have" "Иконка приложения обновлена для дока" 2>/dev/null || true
fi

printf 'Готово. App ID: %s\n' "$APP_ID"
printf 'Ярлык: %s\n' "$DESKTOP_DIR/Must Have.desktop"
