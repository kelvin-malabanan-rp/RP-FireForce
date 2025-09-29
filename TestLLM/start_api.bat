@echo off
REM 🚀 Easy API Starter Script for Windows
REM This script handles all the complexity of starting your Phi-3 API

echo 🚀 Starting Phi-3 Mini API Server...
echo ==================================

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%backend

REM Check if backend directory exists
if not exist "%BACKEND_DIR%" (
    echo ❌ Error: backend directory not found!
    echo    Make sure you're running this from the TestLLM directory
    pause
    exit /b 1
)

REM Navigate to backend directory
cd /d "%BACKEND_DIR%"
echo 📁 Working directory: %BACKEND_DIR%

REM Check if virtual environment exists
if not exist "venv" (
    echo 🔧 Virtual environment not found. Creating one...
    python -m venv venv
    echo ✅ Virtual environment created
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Check dependencies
echo 🔧 Checking dependencies...
python -c "import fastapi, torch, transformers" 2>nul
if errorlevel 1 (
    echo 📦 Installing required dependencies...
    pip install -r requirements.txt
    echo ✅ Dependencies installed
)

REM Start the server
echo 🚀 Starting Phi-3 Mini API server...
echo    Loading model (this may take 10-30 seconds)...
echo    Server will be available at: http://localhost:8000
echo.
echo ✋ Press Ctrl+C to stop the server
echo ==================================

python main.py
