# 프로젝트 루트에서 백엔드(8000)·프론트(80) 재기동
$ErrorActionPreference = "SilentlyContinue"
$Root = $PSScriptRoot
Set-Location $Root

function Stop-Port {
    param([int]$Port)
    Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object {
            if ($_) { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
        }
}

Write-Host "Stopping listeners on ports 8000, 80..."
Stop-Port 8000
Stop-Port 80
Start-Sleep -Milliseconds 500

$VenvPython = Join-Path $Root ".venv\Scripts\python.exe"
$Uvicorn = Join-Path $Root ".venv\Scripts\uvicorn.exe"
if (-not (Test-Path $Uvicorn)) {
    Write-Error "uvicorn not found at $Uvicorn — run: python -m venv .venv && .\.venv\Scripts\pip install -r backend\requirements.txt"
    exit 1
}

$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"

Write-Host "Starting backend: http://127.0.0.1:8000 (reload)"
Start-Process powershell -WorkingDirectory $BackendDir -ArgumentList @(
    "-NoExit",
    "-Command",
    "& '$Uvicorn' main:app --host 127.0.0.1 --port 8000 --reload"
)

Write-Host "Starting frontend: http://localhost/ (port 80)"
Start-Process powershell -WorkingDirectory $FrontendDir -ArgumentList @(
    "-NoExit",
    "-Command",
    "npm run dev"
)

Write-Host "Done. Two new PowerShell windows should show logs."
