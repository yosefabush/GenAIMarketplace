@echo off
setlocal enabledelayedexpansion

:: Ralph Dev Server Launcher
:: Starts backend (port 8000) and frontend (port 5173)
:: Restarts if already running, logs all activity

set SCRIPT_DIR=%~dp0
set LOG_FILE=%SCRIPT_DIR%dev-server.log
set BACKEND_PORT=8000
set FRONTEND_PORT=5173

:: Initialize log file
echo ============================================== >> "%LOG_FILE%"
echo [%date% %time%] Starting dev servers >> "%LOG_FILE%"
echo ============================================== >> "%LOG_FILE%"

echo.
echo =============================================
echo   Ralph Dev Server Launcher
echo =============================================
echo.

:: Check if Docker is running
echo [%time%] Checking Docker availability...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo =============================================
    echo   ERROR: Docker is not running!
    echo =============================================
    echo.
    echo   Please start Docker Desktop and try again.
    echo.
    echo [%date% %time%] ERROR: Docker not running >> "%LOG_FILE%"
    pause
    exit /b 1
)

set FOUND_PROCESS=0

:: Check for existing backend docker container
echo [%time%] Checking for existing backend container...
cd /d "%SCRIPT_DIR%backend"
for /f "tokens=*" %%a in ('docker compose ps -q 2^>nul') do (
    echo [%time%] Found backend container - stopping...
    echo [%date% %time%] Stopping existing backend container >> "%LOG_FILE%"
    docker compose down >nul 2>&1
    set FOUND_PROCESS=1
)
cd /d "%SCRIPT_DIR%"

:: Check and kill existing frontend process on port 5173
echo [%time%] Checking for existing frontend on port %FRONTEND_PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%FRONTEND_PORT%" ^| findstr "LISTENING"') do (
    echo [%time%] Found frontend process PID: %%a - terminating...
    echo [%date% %time%] Terminating existing frontend process PID: %%a >> "%LOG_FILE%"
    taskkill /F /PID %%a >nul 2>&1
    set FOUND_PROCESS=1
)

:: If processes were found and terminated, abort
if !FOUND_PROCESS!==1 (
    echo.
    echo =============================================
    echo   Existing servers terminated. Aborted.
    echo =============================================
    echo.
    echo   Run again to start fresh servers.
    echo.
    echo [%date% %time%] Aborted - existing processes were terminated >> "%LOG_FILE%"
    pause
    exit /b 1
)

echo [%time%] No existing processes found. Starting servers...
echo.
echo [%time%] Starting backend server (docker compose)...
echo [%date% %time%] Starting backend server via docker compose >> "%LOG_FILE%"

:: Start backend with docker compose in new window
cd /d "%SCRIPT_DIR%backend"
start "Ralph Backend" cmd /k "echo Starting FastAPI backend on port %BACKEND_PORT% via Docker... && docker compose up --build"

:: Wait for backend container to initialize
timeout /t 5 /nobreak >nul

echo [%time%] Starting frontend server...
echo [%date% %time%] Starting frontend server >> "%LOG_FILE%"

:: Start frontend in new window
cd /d "%SCRIPT_DIR%frontend"
start "Ralph Frontend" cmd /k "echo Starting Vite frontend on port %FRONTEND_PORT%... && npm run dev"

:: Return to script directory
cd /d "%SCRIPT_DIR%"

echo.
echo =============================================
echo   Servers started successfully!
echo =============================================
echo.
echo   Backend:  http://localhost:%BACKEND_PORT%
echo   Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo   Log file: %LOG_FILE%
echo.
echo [%date% %time%] Servers started successfully >> "%LOG_FILE%"
echo   Backend: http://localhost:%BACKEND_PORT% >> "%LOG_FILE%"
echo   Frontend: http://localhost:%FRONTEND_PORT% >> "%LOG_FILE%"

pause
