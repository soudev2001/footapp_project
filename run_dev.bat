@echo off
echo ===================================================
echo   FootLogic V2 - Development Mode
echo ===================================================
echo.

echo [1/2] Activating virtual environment...
if exist ".\venv\Scripts\activate.bat" (
    call ".\venv\Scripts\activate.bat"
) else (
    echo [ERROR] Virtual environment not found at .\venv
    echo Please create it using: python -m venv venv
    pause
    exit /b 1
)

echo [2/2] Starting application...
echo.
python run.py

pause
