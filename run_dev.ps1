Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  FootLogic V2 - Development Mode" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Activating virtual environment..." -ForegroundColor Yellow
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    . ".\venv\Scripts\Activate.ps1"
} else {
    Write-Host "[ERROR] Virtual environment not found at .\venv" -ForegroundColor Red
    Write-Host "Please create it using: python -m venv venv" -ForegroundColor Red
    exit 1
}

Write-Host "[2/2] Starting application..." -ForegroundColor Yellow
Write-Host ""
python run.py
