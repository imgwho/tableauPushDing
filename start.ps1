$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host "=== Starting Tableau Push Ding Service (PowerShell) ==="

if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Error "Bun is not installed. Please install Bun first: https://bun.sh"
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..."
    bun install
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..."
    Push-Location "frontend"
    bun install
    Pop-Location
}

Write-Host "Starting Backend (Elysia)..."
$backendLog = Join-Path $PSScriptRoot "backend.log"
$backend = Start-Process -FilePath "bun" `
    -ArgumentList @("run", "index.ts") `
    -RedirectStandardOutput $backendLog `
    -RedirectStandardError $backendLog `
    -PassThru
Write-Host "Backend PID: $($backend.Id)"

Start-Sleep -Seconds 2

Write-Host "Starting Frontend (Vite)..."
$frontendLog = Join-Path $PSScriptRoot "frontend.log"
$frontend = Start-Process -FilePath "bun" `
    -ArgumentList @("run", "dev", "--host") `
    -WorkingDirectory (Join-Path $PSScriptRoot "frontend") `
    -RedirectStandardOutput $frontendLog `
    -RedirectStandardError $frontendLog `
    -PassThru
Write-Host "Frontend PID: $($frontend.Id)"

Write-Host "========================================"
Write-Host "Service is running!"
Write-Host "Backend Logs: Get-Content backend.log -Wait"
Write-Host "Frontend Logs: Get-Content frontend.log -Wait"
Write-Host "Access Frontend at: http://<YOUR_SERVER_IP>:5173"
Write-Host "Press Ctrl+C to stop both services."
Write-Host "========================================"

try {
    Wait-Process -Id @($backend.Id, $frontend.Id)
}
finally {
    foreach ($proc in @($backend, $frontend)) {
        if ($null -ne $proc -and -not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}
