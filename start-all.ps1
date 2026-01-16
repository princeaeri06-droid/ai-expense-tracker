# PowerShell script to start all services for AI Expense Tracker
Write-Host "===========================" -ForegroundColor Cyan
Write-Host "Starting AI Expense Tracker" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

# Start AI Service
Write-Host "`n[1/3] Starting AI Service (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\ai'; .venv\Scripts\activate; uvicorn categorize:app --reload --port 8000"

Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "[2/3] Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm run dev"

Start-Sleep -Seconds 2

# Start Frontend Client
Write-Host "[3/3] Starting Frontend Client (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npm run dev"

Write-Host "`n===========================" -ForegroundColor Green
Write-Host "All services started!" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "AI:       http://localhost:8000" -ForegroundColor Cyan
Write-Host "`nPress any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

