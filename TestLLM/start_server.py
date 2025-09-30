#!/usr/bin/env python3
"""
🚀 Universal Phi-3 API Starter
Works on Mac, Windows, and Linux
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

def print_banner():
    print("🚀 Phi-3 Mini API Starter")
    print("=" * 30)

def find_python():
    """Find the best Python executable"""
    # Try different Python executables
    python_candidates = ["python3", "python", "py"]
    
    for py in python_candidates:
        try:
            result = subprocess.run([py, "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                return py
        except FileNotFoundError:
            continue
    
    print("❌ Error: Python not found!")
    print("   Please install Python 3.8+ and try again")
    sys.exit(1)

def setup_environment():
    """Set up the virtual environment and dependencies"""
    script_dir = Path(__file__).parent
    backend_dir = script_dir / "backend"
    
    if not backend_dir.exists():
        print("❌ Error: backend directory not found!")
        print(f"   Expected: {backend_dir}")
        print("   Make sure you're running this from the TestLLM directory")
        sys.exit(1)
    
    os.chdir(backend_dir)
    print(f"📁 Working directory: {backend_dir}")
    
    # Find Python
    python_cmd = find_python()
    print(f"🐍 Using Python: {python_cmd}")
    
    # Create virtual environment if it doesn't exist
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print("🔧 Creating virtual environment...")
        subprocess.run([python_cmd, "-m", "venv", "venv"], check=True)
        print("✅ Virtual environment created")
    
    # Determine venv python path
    if os.name == 'nt':  # Windows
        venv_python = venv_dir / "Scripts" / "python.exe"
        activate_script = venv_dir / "Scripts" / "activate.bat"
    else:  # Mac/Linux
        venv_python = venv_dir / "bin" / "python"
        activate_script = venv_dir / "bin" / "activate"
    
    if not venv_python.exists():
        print("❌ Error: Virtual environment Python not found")
        print("   Trying to recreate virtual environment...")
        import shutil
        shutil.rmtree(venv_dir, ignore_errors=True)
        subprocess.run([python_cmd, "-m", "venv", "venv"], check=True)
    
    # Check and install dependencies
    print("🔧 Checking dependencies...")
    try:
        subprocess.run([str(venv_python), "-c", "import fastapi, torch, transformers"], 
                      check=True, capture_output=True)
        print("✅ Dependencies already installed")
    except subprocess.CalledProcessError:
        print("📦 Installing dependencies...")
        subprocess.run([str(venv_python), "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True)
        print("✅ Dependencies installed")
    
    return str(venv_python)

def kill_existing_server():
    """Kill any existing server on port 8000"""
    print("🧹 Checking for existing servers on port 8000...")
    
    if os.name == 'nt':  # Windows
        try:
            # Find process using port 8000
            result = subprocess.run(['netstat', '-ano', '|', 'findstr', ':8000'], 
                                  capture_output=True, text=True, shell=True)
            if result.stdout:
                print("🔄 Found existing server, attempting to stop...")
                # This is a simplified approach for Windows
                pass
        except:
            pass
    else:  # Mac/Linux
        try:
            result = subprocess.run(['lsof', '-ti:8000'], capture_output=True, text=True)
            if result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    try:
                        os.kill(int(pid), signal.SIGTERM)
                        print(f"🔄 Killed process {pid}")
                    except:
                        pass
                time.sleep(2)
        except:
            pass

def start_server(venv_python):
    """Start the API server"""
    print("🚀 Starting Phi-3 Mini API server...")
    print("   Loading model (this may take 10-30 seconds)...")
    print("   Server will be available at: http://localhost:8000")
    print("")
    print("✋ Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        # Start the server
        subprocess.run([venv_python, "main.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Server failed to start: {e}")
        print("\n💡 Troubleshooting tips:")
        print("   1. Make sure you have enough RAM (4GB+ recommended)")
        print("   2. Check if another process is using port 8000")
        print("   3. Try running: python main.py directly in the backend folder")

def main():
    print_banner()
    
    try:
        # Kill existing servers
        kill_existing_server()
        
        # Set up environment
        venv_python = setup_environment()
        
        # Start server
        start_server(venv_python)
        
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("\n💡 Try running the script again or check the error above")

if __name__ == "__main__":
    main()
