# 🤖 LLM Question & Answer Interface

A **simplified** React + Python FastAPI application with **Zephyr 7B** for AI-powered question answering.

## ✨ What Makes This Simple

- **Minimal Dependencies**: Only essential packages
- **Clean Architecture**: Frontend + Backend, no unnecessary files
- **Easy Setup**: Just 2 terminals needed
- **One Purpose**: Ask questions, get AI answers

## 🏗️ Simplified Project Architecture

```
TestLLM/
├── 📁 src/                     # React Frontend
│   ├── App.tsx                 # Main component with LLM interface
│   ├── index.css              # Tailwind CSS imports
│   └── main.tsx               # React entry point
├── 📁 backend/                 # Python FastAPI Backend
│   ├── main.py                # FastAPI server + Zephyr 7B
│   ├── requirements.txt       # Python dependencies
│   └── venv/                  # Python virtual environment
├── 📁 public/                  # Static assets
├── package.json               # Node.js dependencies
├── tailwind.config.js         # Tailwind CSS config
├── vite.config.ts            # Vite build config
└── PROJECT_GUIDE.md          # This documentation
```
## To start them 
```bash 
Terminal 1
cd backend && source venv/bin/activate && python main.py 

Terminal 2
npm run dev
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (latest version)
- **Python 3.12+** 
- **16GB+ RAM** (for Zephyr 7B model)
- **20GB+ free storage** (for model files)

### 1. Install Dependencies

**Frontend Dependencies:**
```bash
npm install
```

### Backend Dependencies:**
```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the Application

You need **TWO terminals** running simultaneously:

**Terminal 1 - Backend (Python API):**
```bash
cd backend
source venv/bin/activate
python main.py
```
⏳ *Wait for: "Model loaded successfully!" (2-5 minutes first time)*

**Terminal 2 - Frontend (React):**
```bash
npm run dev
```
🚀 *Starts immediately*

### 3. Access the Application

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`

## � Stopping the Application

### Method 1: Graceful Shutdown (Recommended)
In each terminal window, press:
```bash
Ctrl + C
```
This safely stops both servers.

### Method 2: Force Stop All Processes
If terminals are unresponsive or you need to force-stop everything:

**Stop Backend (Python/FastAPI):**
```bash
# Find and kill Python processes
pkill -f "python main.py"
# OR kill by port
lsof -ti:8000 | xargs kill -9
```

**Stop Frontend (Node/Vite):**
```bash
# Find and kill Node processes
pkill -f "vite"
# OR kill by port  
lsof -ti:5173 | xargs kill -9
```

**Stop All at Once:**
```bash
# Emergency stop - kills all Python and Node processes
pkill -f "python main.py" && pkill -f "vite"
```

### Method 3: Check What's Running
```bash
# Check active processes
ps aux | grep -E "(python main.py|vite)" | grep -v grep

# Check ports in use
lsof -i:8000  # Backend
lsof -i:5173  # Frontend
```

## 🔄 Restarting the Application

### Full Restart Process
1. **Stop everything** (using methods above)
2. **Wait 5 seconds** for ports to free up
3. **Start backend first:**
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```
4. **Wait for "Model loaded successfully!"**
5. **Start frontend in new terminal:**
   ```bash
   npm run dev
   ```

### Quick Restart (if having issues)
```bash
# One-liner to stop and restart everything
pkill -f "python main.py" && pkill -f "vite" && sleep 5 && cd backend && source venv/bin/activate && python main.py &
```

### Backend-Only Restart
If only the backend needs restarting:
```bash
# Stop backend
pkill -f "python main.py"
# Wait a moment
sleep 2
# Restart backend
cd backend && source venv/bin/activate && python main.py
```

### Frontend-Only Restart
If only the frontend needs restarting:
```bash
# Stop frontend
pkill -f "vite"
# Wait a moment  
sleep 2
# Restart frontend
npm run dev
```

## 📋 Process Management Checklist

### Before Starting:
- [ ] Check if ports 8000 and 5173 are free
- [ ] Ensure Python virtual environment exists
- [ ] Verify dependencies are installed

### During Operation:
- [ ] Backend shows "Model loaded successfully!"
- [ ] Frontend shows "Local: http://localhost:5173"
- [ ] Both terminals remain active
- [ ] No error messages in either terminal

### When Stopping:
- [ ] Use Ctrl+C first (graceful shutdown)
- [ ] Wait for processes to fully stop
- [ ] Check ports are freed up
- [ ] Close terminal windows if needed

### Troubleshooting Process Issues:
```bash
# If you see "Address already in use" errors:
lsof -ti:8000 | xargs kill -9  # Kill backend
lsof -ti:5173 | xargs kill -9  # Kill frontend

# If models won't load:
pkill -f "python"  # Stop all Python processes
# Then restart backend

# If you lose track of what's running:
ps aux | grep -E "(python|node|vite)" | grep -v grep
```

## �🖥️ User Interface

The React interface provides:
- **Question Input**: Large text area for typing questions
- **Get Answer Button**: Triggers LLM processing
- **Answer Display**: Shows AI-generated responses
- **Loading States**: Visual feedback during processing
- **Error Handling**: User-friendly error messages

## 🤖 LLM Integration Details

### Model Information
- **Model**: HuggingFace H4/zephyr-7b-beta
- **Size**: ~7 billion parameters
- **Storage**: ~15GB cached locally at `~/.cache/huggingface/`
- **Device**: CPU-only (optimized for Mac compatibility)

### API Endpoints

**Health Check:**
```bash
GET http://localhost:8000/health
# Response: {"status":"healthy","model_loaded":true,"tokenizer_loaded":true}
```

**Ask Question:**
```bash
POST http://localhost:8000/ask
Content-Type: application/json

{
  "question": "Your question here",
  "max_length": 512,      # Optional: Response length (50-1000)
  "temperature": 0.7      # Optional: Creativity (0.1-1.0)
}
```

## ⚙️ Configuration

### Model Parameters
- **max_length**: Maximum response length (default: 512)
- **temperature**: Response creativity/randomness (default: 0.7)
  - Lower (0.1-0.3): More focused, deterministic
  - Higher (0.7-1.0): More creative, varied

### Environment Variables (Optional)
```bash
# For private models or faster downloads
export HUGGINGFACE_TOKEN="your_token_here"
```

## 🧪 Testing

### Manual Testing
1. Open `http://localhost:5173`
2. Try these sample questions:
   - "Explain artificial intelligence in simple terms"
   - "What are the benefits of renewable energy?"
   - "How does machine learning work?"
   - "Write a short poem about technology"

### API Testing
```bash
# Test backend health
curl http://localhost:8000/health

# Test question answering
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Python programming?", "max_length": 200}'
```

## 📊 Performance Expectations

### First Run
- **Model Download**: 5-10 minutes (one-time only)
- **Model Loading**: 2-3 minutes
- **First Response**: 30-60 seconds (warmup)

### Subsequent Runs
- **Startup Time**: 2-3 minutes (loading cached model)
- **Response Time**: 10-30 seconds per question
- **Memory Usage**: 8-12GB RAM

## 🔧 Troubleshooting

### Common Issues & Solutions

**Backend Won't Start:**
```bash
# Check if port 8000 is in use
lsof -ti:8000
# Kill conflicting process
kill -9 <process_id>
```

**Frontend Connection Error:**
```bash
# Verify backend is running
curl http://localhost:8000/health
# Check CORS settings in backend/main.py
```

**Out of Memory Error:**
- Ensure 16GB+ RAM available
- Close other applications
- Restart terminals if needed

**Model Loading Issues:**
```bash
# Clear model cache if corrupted
rm -rf ~/.cache/huggingface/
# Restart backend to re-download
```

### Port Conflicts
If default ports are in use:
- **Frontend**: Vite will automatically use next available port (5174, 5175, etc.)
- **Backend**: Manually change port in `main.py`:
  ```python
  if __name__ == "__main__":
      import uvicorn
      uvicorn.run(app, host="0.0.0.0", port=8001)  # Change port here
  ```

## 🛠️ Development

### Adding New Features
1. **Frontend Changes**: Edit `src/App.tsx`
2. **Backend Changes**: Edit `backend/main.py`
3. **Styling**: Modify Tailwind classes in React components

### Deploying to Production
- Use environment variables for configuration
- Add authentication and rate limiting
- Consider using model serving platforms (Hugging Face Inference Endpoints)
- Implement proper logging and monitoring

## 📁 Key Files Explained

### Frontend Files
- **`src/App.tsx`**: Main React component with LLM interface
- **`src/index.css`**: Tailwind CSS imports
- **`package.json`**: Node.js dependencies (React, Vite, Tailwind)

### Backend Files
- **`backend/main.py`**: FastAPI server with Zephyr 7B integration
- **`backend/requirements.txt`**: Python dependencies (FastAPI, PyTorch, Transformers)
- **`backend/venv/`**: Isolated Python environment

## 🌟 Features

### Current Features
- ✅ Clean, responsive UI with Tailwind CSS
- ✅ Real-time LLM integration with Zephyr 7B
- ✅ Loading states and error handling
- ✅ Configurable model parameters
- ✅ CORS-enabled API
- ✅ Health check endpoints
- ✅ CPU-optimized for Mac compatibility

### Future Enhancements
- 🔄 Chat history/conversation memory
- 🎨 Custom themes and styling options
- 📊 Response analytics and metrics
- 🔐 User authentication
- 💾 Database integration for storing conversations
- 🌐 Multi-model support (GPT, Claude, etc.)

## 📚 Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **PostCSS** for CSS processing

### Backend
- **Python 3.12**
- **FastAPI** for API framework
- **Uvicorn** for ASGI server
- **PyTorch 2.5.1** for ML framework
- **Transformers 4.47.1** for model loading
- **Zephyr 7B** language model

## �️ Model Management & Storage

### Understanding Model Storage

**Where Models Are Stored:**
```bash
~/.cache/huggingface/transformers/
# This is where ALL HuggingFace models are cached on your system
```

**Current Storage Usage:**
```bash
# Check total HuggingFace cache size
du -sh ~/.cache/huggingface/

# List all cached models with sizes
du -sh ~/.cache/huggingface/hub/models--*/ | sort -hr
```

### Available Models in This Project

| Model Name | HuggingFace ID | Size | Status |
|------------|----------------|------|--------|
| **Qwen2.5 7B** | `Qwen/Qwen2.5-7B-Instruct` | ~15GB | Default (Fast) |
| **Zephyr 7B** | `HuggingFaceH4/zephyr-7b-beta` | ~15GB | Original |
| **Phi-3 Mini** | `microsoft/Phi-3-mini-4k-instruct` | ~8GB | Fastest |

### 🔍 Check Which Models You Have

**List All Cached Models:**
```bash
# See all HuggingFace models on your system
ls ~/.cache/huggingface/hub/ | grep "models--" | head -10

# Check specific project models
ls ~/.cache/huggingface/hub/ | grep -E "(Qwen|zephyr|Phi-3)"
```

**Check Storage Usage by Model:**
```bash
# Qwen2.5 7B Instruct
du -sh ~/.cache/huggingface/hub/models--Qwen--Qwen2.5-7B-Instruct/ 2>/dev/null || echo "Not cached"

# Zephyr 7B
du -sh ~/.cache/huggingface/hub/models--HuggingFaceH4--zephyr-7b-beta/ 2>/dev/null || echo "Not cached"

# Phi-3 Mini
du -sh ~/.cache/huggingface/hub/models--microsoft--Phi-3-mini-4k-instruct/ 2>/dev/null || echo "Not cached"
```

### 🗑️ Delete Specific Models

**⚠️ Important:** Always stop your backend before deleting models!

**Stop Backend First:**
```bash
# Stop Python backend
pkill -f "python main.py"
```

#### Delete Individual Models

**Delete Qwen2.5 7B Instruct (~15GB):**
```bash
rm -rf ~/.cache/huggingface/hub/models--Qwen--Qwen2.5-7B-Instruct/
echo "Qwen2.5 7B deleted"
```

**Delete Zephyr 7B (~15GB):**
```bash
rm -rf ~/.cache/huggingface/hub/models--HuggingFaceH4--zephyr-7b-beta/
echo "Zephyr 7B deleted"
```

**Delete Phi-3 Mini (~8GB):**
```bash
rm -rf ~/.cache/huggingface/hub/models--microsoft--Phi-3-mini-4k-instruct/
echo "Phi-3 Mini deleted"
```

#### Delete Multiple Models at Once

**Delete All Project Models (~38GB total):**
```bash
# Delete all models used in this project
rm -rf ~/.cache/huggingface/hub/models--Qwen--Qwen2.5-7B-Instruct/
rm -rf ~/.cache/huggingface/hub/models--HuggingFaceH4--zephyr-7b-beta/
rm -rf ~/.cache/huggingface/hub/models--microsoft--Phi-3-mini-4k-instruct/
echo "All project models deleted"
```

**Delete ALL HuggingFace Models (Nuclear Option):**
```bash
# ⚠️ WARNING: This deletes EVERYTHING from HuggingFace cache
rm -rf ~/.cache/huggingface/
echo "All HuggingFace models deleted"
```

### 🔄 Model Re-download

When you delete a model and try to use it again:

1. **Backend will automatically re-download** the model
2. **Download time**: 5-10 minutes (depending on internet speed)
3. **No code changes needed** - everything happens automatically

**Example Workflow:**
```bash
# 1. Delete Zephyr to save space
rm -rf ~/.cache/huggingface/hub/models--HuggingFaceH4--zephyr-7b-beta/

# 2. Start backend (will use Qwen2.5 by default)
cd backend && source venv/bin/activate && python main.py

# 3. If you switch to Zephyr later, it will re-download automatically
```

### 💾 Storage Management Tips

#### Smart Storage Strategy

**Keep Only What You Need:**
```bash
# If you prefer speed: Keep only Phi-3 Mini (8GB)
rm -rf ~/.cache/huggingface/hub/models--Qwen--Qwen2.5-7B-Instruct/
rm -rf ~/.cache/huggingface/hub/models--HuggingFaceH4--zephyr-7b-beta/

# If you prefer quality: Keep only Qwen2.5 (15GB)  
rm -rf ~/.cache/huggingface/hub/models--HuggingFaceH4--zephyr-7b-beta/
rm -rf ~/.cache/huggingface/hub/models--microsoft--Phi-3-mini-4k-instruct/
```

#### Monitor Storage Usage

**Create a Storage Check Script:**
```bash
# Create a quick storage check command
echo 'alias check-models="echo \"Total HF Cache:\" && du -sh ~/.cache/huggingface/ && echo \"\\nProject Models:\" && du -sh ~/.cache/huggingface/hub/models--Qwen* ~/.cache/huggingface/hub/models--HuggingFaceH4* ~/.cache/huggingface/hub/models--microsoft--Phi* 2>/dev/null || echo \"Some models not cached\""' >> ~/.zshrc

# Reload shell
source ~/.zshrc

# Use the command
check-models
```

### 🚨 Emergency Storage Cleanup

**If you're running out of disk space:**

```bash
# 1. Check current usage
df -h

# 2. See what's using space in HuggingFace cache
du -sh ~/.cache/huggingface/hub/models--*/ | sort -hr | head -10

# 3. Delete largest models you don't need
# (Replace with actual model names from step 2)
rm -rf ~/.cache/huggingface/hub/models--[LARGE_MODEL_NAME]/

# 4. Verify space freed
df -h
```

### 🔧 Troubleshooting Model Issues

**Model Won't Load After Deletion:**
```bash
# Clear any corrupted cache
rm -rf ~/.cache/huggingface/hub/models--[MODEL_NAME]/

# Restart backend - it will re-download automatically
cd backend && source venv/bin/activate && python main.py
```

**Out of Disk Space During Download:**
```bash
# Stop download
pkill -f "python main.py"

# Free up space by deleting other models
rm -rf ~/.cache/huggingface/hub/models--[OLD_MODEL]/

# Restart download
cd backend && source venv/bin/activate && python main.py
```

**Check If Model Exists Before Using:**
```bash
# Check if a model is cached before starting backend
if [ -d ~/.cache/huggingface/hub/models--Qwen--Qwen2.5-7B-Instruct/ ]; then
    echo "✅ Qwen2.5 is cached"
else
    echo "❌ Qwen2.5 will need to download (~15GB, 5-10 min)"
fi
```

## �📄 License

This project is for educational and development purposes. Please respect the licenses of the included libraries and models.

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure sufficient RAM and storage space
4. Check terminal outputs for specific error messages

---

**🎉 Congratulations!** You now have a fully functional LLM-powered question and answer application running locally!
