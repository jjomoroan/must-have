#!/usr/bin/env bash
# Must Have — запуск локального приложения в отдельном окне Chrome.
# Сервер слушает только 127.0.0.1. Данные остаются в профиле браузера.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/must-have"
mkdir -p "$STATE_DIR"
LOG="$STATE_DIR/server.log"
URL_FILE="$STATE_DIR/url"
PORT=""

if ! command -v python3 >/dev/null 2>&1; then
  MSG="Не найден python3. Установите Python 3 и запустите снова."
  if command -v zenity >/dev/null 2>&1; then zenity --error --title="Must Have" --text="$MSG" 2>/dev/null || true
  elif command -v notify-send >/dev/null 2>&1; then notify-send "Must Have" "$MSG" 2>/dev/null || true
  else echo "$MSG" >&2; fi
  exit 1
fi

health_ok() {
  local port="$1"
  curl -fsS --max-time 1 "http://127.0.0.1:${port}/__heartbeat" 2>/dev/null | grep -q "must-have"
}

for CANDIDATE in 41777 41778 41779 41780 41781; do
  if health_ok "$CANDIDATE"; then
    PORT="$CANDIDATE"
    break
  fi
  if (echo >"/dev/tcp/127.0.0.1/$CANDIDATE") >/dev/null 2>&1; then
    continue
  fi
  nohup python3 -m http.server "$CANDIDATE" --bind 127.0.0.1 --directory "$DIR" >"$LOG" 2>&1 &
  echo $! > "$STATE_DIR/server.pid"
  for _ in $(seq 1 40); do
    if health_ok "$CANDIDATE"; then
      PORT="$CANDIDATE"
      break
    fi
    sleep 0.1
  done
  [ -n "$PORT" ] && break
done

if [ -z "$PORT" ]; then
  MSG="Не удалось запустить локальный сервер Must Have. Подробности: $LOG"
  if command -v zenity >/dev/null 2>&1; then zenity --error --title="Must Have" --text="$MSG" 2>/dev/null || true
  elif command -v notify-send >/dev/null 2>&1; then notify-send "Must Have" "$MSG" 2>/dev/null || true
  else echo "$MSG" >&2; fi
  exit 1
fi

URL="http://127.0.0.1:${PORT}/"
printf '%s\n' "$URL" > "$URL_FILE"

for CANDIDATE in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge brave-browser; do
  if command -v "$CANDIDATE" >/dev/null 2>&1; then
    exec "$CANDIDATE" \
      --app="$URL" \
      --class=MustHave \
      --window-size=1440,960 \
      --disable-popup-blocking \
      --no-first-run \
      --no-default-browser-check >/dev/null 2>&1
  fi
done

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 &
else
  printf 'Откройте в браузере: %s\n' "$URL"
fi
