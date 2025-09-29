#!/bin/bash
# 🚀 Easy API Starter Script
# This script handles all the complexity of starting your Phi-3 API

set -e  # Exit on any error

echo "🚀 Starting Phi-3 Mini API Server..."
echo "=================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: backend directory not found!"
    echo "   Make sure you're running this from the TestLLM directory"
    exit 1
fi

# Navigate to backend directory
cd "$BACKEND_DIR"
echo "📁 Working directory: $BACKEND_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧 Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Check if venv/bin/python exists
if [ ! -f "venv/bin/python" ]; then
    echo "❌ Error: Python executable not found in virtual environment"
    echo "   Trying to recreate virtual environment..."
    rm -rf venv
    python3 -m venv venv
fi

# Activate virtual environment and check dependencies
echo "🔧 Checking dependencies..."
source venv/bin/activate

# Check if required packages are installed
if ! python -c "import fastapi, torch, transformers" 2>/dev/null; then
    echo "📦 Installing required dependencies..."
    pip install -r requirements.txt
    echo "✅ Dependencies installed"
fi

# Kill any existing process on port 8000
echo "🧹 Checking for existing servers on port 8000..."
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "🔄 Killing existing process on port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start the server
echo "🚀 Starting Phi-3 Mini API server..."
echo "   Loading model (this may take 10-30 seconds)..."
echo "   Server will be available at: http://localhost:8000"
echo ""
echo "✋ Press Ctrl+C to stop the server"
echo "=================================="

# Start the server with proper error handling
python main.py
