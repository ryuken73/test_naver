#!/usr/bin/env bash
# 프로젝트 루트에서 실행: ./restart.sh
# Windows(Git Bash 등): restart.ps1 호출
# Linux / macOS / WSL: 포트 정리 후 백그라운드 기동

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if command -v powershell.exe >/dev/null 2>&1 && [[ -f "$ROOT/restart.ps1" ]]; then
  # Git Bash / Windows: PowerShell 스크립트 사용
  exec powershell.exe -ExecutionPolicy Bypass -File "$ROOT/restart.ps1"
fi

kill_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti:"$port" | xargs -r kill -9 2>/dev/null || true
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  else
    echo "lsof 또는 fuser가 필요합니다. 포트 ${port}를 수동으로 종료하세요."
  fi
}

echo "Stopping ports 8000, 80..."
kill_port 8000
kill_port 80
sleep 0.5

VENV="$ROOT/.venv"
if [[ ! -x "$VENV/bin/uvicorn" ]]; then
  echo "가상환경을 찾을 수 없습니다: $VENV — python -m venv .venv && pip install -r backend/requirements.txt"
  exit 1
fi

echo "Starting backend (8000)..."
(
  cd "$ROOT/backend"
  exec "$VENV/bin/uvicorn" main:app --host 127.0.0.1 --port 8000 --reload
) &
BACK_PID=$!

echo "Starting frontend (80)..."
(
  cd "$ROOT/frontend"
  exec npm run dev
) &
FRONT_PID=$!

echo "Backend PID: $BACK_PID, Frontend PID: $FRONT_PID"
echo "URLs: http://127.0.0.1:8000  |  http://localhost/"
echo "종료: kill $BACK_PID $FRONT_PID"
