# Starts backend (port 8000) and frontend (port 5173)
# Restarts if already running, logs all activity
# Press Ctrl+C to stop both servers

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$LOG_FILE = Join-Path $SCRIPT_DIR "dev-server.log"
$BACKEND_PORT = 8000
$FRONTEND_PORT = 5173

# Initialize log file
"=" * 50 | Out-File -Append $LOG_FILE
"[$(Get-Date)] Starting dev servers" | Out-File -Append $LOG_FILE
"=" * 50 | Out-File -Append $LOG_FILE

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  GenAI Marketplace Launcher" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking Docker availability..."
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host "  ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please start Docker Desktop and try again."
    Write-Host ""
    "[$(Get-Date)] ERROR: Docker not running" | Out-File -Append $LOG_FILE
    Read-Host "Press Enter to exit"
    exit 1
}

$FOUND_PROCESS = $false

# Check for existing backend docker container
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking for existing backend container..."
Push-Location (Join-Path $SCRIPT_DIR "backend")
$containers = docker compose ps -q 2>$null
if ($containers) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Found backend container - stopping..."
    "[$(Get-Date)] Stopping existing backend container" | Out-File -Append $LOG_FILE
    docker compose down 2>&1 | Out-Null
    $FOUND_PROCESS = $true
}
Pop-Location

# Check and kill existing frontend process on port 5173
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Checking for existing frontend on port $FRONTEND_PORT..."
$frontendPids = Get-NetTCPConnection -LocalPort $FRONTEND_PORT -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($frontendPids) {
    foreach ($pid in $frontendPids) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Found frontend process PID: $pid - terminating..."
        "[$(Get-Date)] Terminating existing frontend process PID: $pid" | Out-File -Append $LOG_FILE
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        $FOUND_PROCESS = $true
    }
}

# If processes were found and terminated, continue automatically
if ($FOUND_PROCESS) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Yellow
    Write-Host "  Existing servers terminated." -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Yellow
    Write-Host ""
    "[$(Get-Date)] Existing processes were terminated, restarting..." | Out-File -Append $LOG_FILE
    Start-Sleep -Seconds 2
}

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting servers..."
Write-Host ""
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting backend server (docker compose)..."
"[$(Get-Date)] Starting backend server via docker compose" | Out-File -Append $LOG_FILE

# Start backend with docker compose
Push-Location (Join-Path $SCRIPT_DIR "backend")
Write-Host "Starting GenAI Marketplace backend on port $BACKEND_PORT via Docker..." -ForegroundColor Green

$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    docker compose up --build
} -ArgumentList (Get-Location).Path

# Wait for backend to be ready (poll /docs endpoint)
$BACKEND_READY = $false
$WAIT_COUNT = 0
$MAX_WAIT = 60
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Waiting for backend to be ready on port $BACKEND_PORT..."
"[$(Get-Date)] Waiting for backend to be ready on port $BACKEND_PORT" | Out-File -Append $LOG_FILE

while (-not $BACKEND_READY -and $WAIT_COUNT -lt $MAX_WAIT) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BACKEND_PORT/docs" -TimeoutSec 1 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $BACKEND_READY = $true
        }
    } catch {
        # Backend not ready yet
    }
    
    if (-not $BACKEND_READY) {
        $WAIT_COUNT++
        Start-Sleep -Seconds 1
    }
}

Pop-Location

if (-not $BACKEND_READY) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ERROR: Backend did not start within $MAX_WAIT seconds." -ForegroundColor Red
    "[$(Get-Date)] ERROR: Backend did not start within $MAX_WAIT seconds." | Out-File -Append $LOG_FILE
    Stop-Job -Job $backendJob
    Remove-Job -Job $backendJob
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Backend is ready!" -ForegroundColor Green
"[$(Get-Date)] Backend is ready" | Out-File -Append $LOG_FILE

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Starting frontend server..."
"[$(Get-Date)] Starting frontend server" | Out-File -Append $LOG_FILE

# Start frontend in current window
Push-Location (Join-Path $SCRIPT_DIR "frontend")
Write-Host "Starting GenAI Marketplace frontend on port $FRONTEND_PORT..." -ForegroundColor Green
Start-Process "http://localhost:$FRONTEND_PORT"

try {
    # Run npm in foreground - Ctrl+C will stop this
    npm run dev
} finally {
    # Clean up backend
    Write-Host "`n`nShutting down backend..." -ForegroundColor Yellow
    
    if ($backendJob) {
        Write-Host "Stopping backend job..." -ForegroundColor Yellow
        Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    }
    
    Pop-Location
    Push-Location (Join-Path $SCRIPT_DIR "backend")
    Write-Host "Running docker compose down..." -ForegroundColor Yellow
    docker compose down
    Pop-Location
    
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "  GenAI Marketplace servers stopped." -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Log file: $LOG_FILE"
    Write-Host ""
    "[$(Get-Date)] GenAI Marketplace servers stopped" | Out-File -Append $LOG_FILE
}
