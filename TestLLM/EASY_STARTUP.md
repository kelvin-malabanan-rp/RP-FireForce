# ⚡ SUPER EASY API STARTUP

**No more complex commands! Just run ONE simple command to start your AI API.**

## 🚀 **ONE-COMMAND STARTUP** 

### **Option 1: Python Script (Recommended - Works Everywhere)**
```bash
python3 start_server.py
```
**That's it!** ✨

### **Option 2: Bash Script (Mac/Linux)**  
```bash
./start_api.sh
```

### **Option 3: Batch File (Windows)**
```bash
start_api.bat
```

## 🎯 **What These Scripts Do Automatically**

✅ **Find Python** - Works with python3, python, or py  
✅ **Create virtual environment** - If missing  
✅ **Install dependencies** - Automatically installs requirements  
✅ **Kill old servers** - Clears port 8000  
✅ **Start your API** - Loads Phi-3 model with GPU acceleration  
✅ **Handle errors** - Shows helpful error messages  

## 📊 **What You'll See**

```
🚀 Phi-3 Mini API Starter
==============================
🧹 Checking for existing servers on port 8000...
📁 Working directory: /path/to/backend
🐍 Using Python: python3
🔧 Checking dependencies...
✅ Dependencies already installed
🚀 Starting Phi-3 Mini API server...
   Loading model (this may take 10-30 seconds)...
   Server will be available at: http://localhost:8000

✋ Press Ctrl+C to stop the server
```

## 🧪 **Test Your API**

Once the server says `"Model Phi-3 Mini loaded successfully"`, test it:

```bash
# Health check
curl http://localhost:8000/health

# Ask a question
curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question": "High CPU usage alert. What should I check?"}'
```

## 🛠️ **Troubleshooting**

### **If you get "command not found":**
```bash
# Make scripts executable (Mac/Linux)
chmod +x start_api.sh start_server.py

# Then run
./start_api.sh
# or
python3 start_server.py
```

### **If you get "Python not found":**
- **Mac**: `brew install python3`
- **Windows**: Download from python.org
- **Linux**: `sudo apt install python3`

### **If port 8000 is busy:**
The script automatically kills old processes, but if it doesn't work:
```bash
# Mac/Linux
sudo lsof -ti:8000 | xargs kill -9

# Windows  
netstat -ano | findstr :8000
# Then kill the process ID shown
```

## 🎯 **From Other Projects**

Once your server is running, use from any project:

```javascript
// JavaScript
const response = await fetch('http://localhost:8000/ask', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({question: "Your alert here"})
});
```

```python
# Python
import requests
response = requests.post('http://localhost:8000/ask', 
                        json={'question': 'Your alert here'})
```

## 🎉 **That's It!**

**No more setup headaches!** Just run `python3 start_server.py` and you're ready to go! 🚀

---

### **Files Created:**
- `start_server.py` - Universal Python starter (recommended)
- `start_api.sh` - Bash script for Mac/Linux  
- `start_api.bat` - Batch script for Windows
