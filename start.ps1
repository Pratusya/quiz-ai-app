# Quiz AI - Start Both Servers
# Run: .\START.ps1 (or double-click in Windows Explorer)

$Host.UI.RawUI.WindowTitle = "Quiz AI Launcher"
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       QUIZ AI APPLICATION LAUNCHER        " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Check if Backend AI folder exists
$BackendPath = Join-Path $ScriptDir "Backend AI"
if (-not (Test-Path $BackendPath)) {
    Write-Host "[ERROR] Backend AI folder not found!" -ForegroundColor Red
    Write-Host "Expected path: $BackendPath" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Quiz AI folder exists
$FrontendPath = Join-Path $ScriptDir "Quiz AI"
if (-not (Test-Path $FrontendPath)) {
    Write-Host "[ERROR] Quiz AI folder not found!" -ForegroundColor Red
    Write-Host "Expected path: $FrontendPath" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "[OK] Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[1/2] Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
$BackendCmd = "cd '$BackendPath'; Write-Host ''; Write-Host 'BACKEND SERVER' -ForegroundColor Cyan; Write-Host '==============' -ForegroundColor Cyan; Write-Host ''; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCmd

# Wait for backend to initialize
Write-Host "      Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "[2/2] Starting Frontend Server (Port 5173)..." -ForegroundColor Yellow
$FrontendCmd = "cd '$FrontendPath'; Write-Host ''; Write-Host 'FRONTEND SERVER' -ForegroundColor Cyan; Write-Host '===============' -ForegroundColor Cyan; Write-Host ''; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCmd

# Wait for frontend to start
Write-Host "      Waiting for frontend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "         SERVERS STARTED SUCCESSFULLY       " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "  Frontend App:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Health Check:  http://localhost:5000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "  [!] Keep the two server windows open" -ForegroundColor Yellow
Write-Host ""

# Open browser
Write-Host "Opening application in browser..." -ForegroundColor Gray
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Press Enter to close this launcher window..." -ForegroundColor DarkGray
Read-Host
