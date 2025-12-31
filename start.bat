@echo off
title Quiz AI Application Launcher
cls
echo.
echo ============================================
echo        QUIZ AI APPLICATION LAUNCHER
echo ============================================
echo.

:: Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"

:: Remove trailing backslash
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: Check if Backend AI folder exists
if not exist "%SCRIPT_DIR%\Backend AI" (
    echo [ERROR] Backend AI folder not found!
    echo Expected path: %SCRIPT_DIR%\Backend AI
    pause
    exit /b 1
)

:: Check if Quiz AI folder exists
if not exist "%SCRIPT_DIR%\Quiz AI" (
    echo [ERROR] Quiz AI folder not found!
    echo Expected path: %SCRIPT_DIR%\Quiz AI
    pause
    exit /b 1
)

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js detected: %NODE_VERSION%
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "Quiz AI - Backend Server" cmd /k "cd /d "%SCRIPT_DIR%\Backend AI" && echo. && echo BACKEND SERVER && echo ============== && echo. && node server.js"

:: Wait for backend to initialize
echo       Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 5173)...
start "Quiz AI - Frontend Server" cmd /k "cd /d "%SCRIPT_DIR%\Quiz AI" && echo. && echo FRONTEND SERVER && echo =============== && echo. && npm run dev"

:: Wait for frontend to start
echo       Waiting for frontend to initialize...
timeout /t 4 /nobreak >nul

echo.
echo ============================================
echo         SERVERS STARTED SUCCESSFULLY
echo ============================================
echo.
echo   Backend API:   http://localhost:5000
echo   Frontend App:  http://localhost:5173
echo   Health Check:  http://localhost:5000/health
echo.
echo   [!] Keep the two server windows open
echo.

:: Open browser
echo Opening application in browser...
start "" http://localhost:5173

echo.
echo Press any key to close this launcher window...
pause >nul
