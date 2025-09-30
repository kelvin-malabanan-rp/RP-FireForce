# 🚀 Phi-3 Mini Alert Analysis API

A **production-ready API** powered by fine-tuned Phi-3 Mini for intelligent alert analysis and incident response.

## ✨ What This Is

- **� API-first Design**: Deploy once, use everywhere
- **🧠 Fine-tuned Model**: Phi-3 Mini specialized for alert analysis  
- **⚡ GPU Accelerated**: Optimized for Mac M-series chips
- **🔧 Easy Integration**: Simple HTTP API for any project
- **📊 Customizable**: Train on your own alert data

## 🏗️ Project Structure

```
TestLLM/
├── 📁 backend/                    # FastAPI server + Phi-3 model
│   ├── main.py                    # API server with optimized inference
│   ├── requirements.txt           # Core dependencies
│   └── requirements_finetuning.txt # Fine-tuning dependencies
├── 📁 finetuning_data/           # Model fine-tuning toolkit
│   ├── finetune_data.json        # Your training data (EDIT THIS!)
│   ├── json_to_training.py       # Convert JSON to training format
│   ├── finetune_phi3.py          # Main fine-tuning script
│   ├── integrate_finetuned_model.py # Update API with fine-tuned model
│   ├── create_deployment.py      # Generate deployment package
│   └── phi3_client.py            # Python client library
└── 📁 .github/                   # GitHub configuration
    └── copilot-instructions.md   # AI assistant instructions
```

## 🚀 Quick Start

### 1. **Start the API**
```bash
cd backend
source venv/bin/activate  
python main.py
```

### 2. **Test the API**
```bash
# Health check
curl http://localhost:8000/health

# Ask a question
curl -X POST "http://localhost:8000/ask" 
  -H "Content-Type: application/json" 
  -d '{"question": "Alert: High CPU usage on prod-web-01. What should I do?"}'
```

### 3. **Use from Other Projects**
```python
# Python integration
import requests

def ask_alert_api(alert_text):
    response = requests.post("http://localhost:8000/ask", 
                           json={"question": alert_text})
    return response.json()["answer"]

# Usage
answer = ask_alert_api("Database connection pool exhausted on prod-db-01")
print(answer)
```

## 🤖 LLM Integration Details

### Zephyr 7B Model
- **Model:** HuggingFace H4/zephyr-7b-beta
- **Size:** ~7 billion parameters
- **Memory:** 16GB+ RAM recommended
- **Features:** Optimized with 8-bit quantization

### API Endpoints
- `POST /ask` - Ask a question to the model
- `GET /health` - Check service status

## ⚙️ Configuration

### React Frontend (src/App.tsx)
```typescript
// Switch backend endpoints
const API_URL = 'http://localhost:8000';  // Python FastAPI
// const API_URL = 'http://localhost:8080/api';  // Spring Boot
```

### Model Parameters
- `max_length`: Maximum response length (default: 512)
- `temperature`: Response creativity (0.1-1.0, default: 0.7)

## 🔧 System Requirements

### Minimum:
- **RAM:** 16GB (8GB may work with reduced performance)
- **Storage:** 15GB for model files
- **CPU:** Modern multi-core processor

### Recommended:
- **RAM:** 32GB+
- **GPU:** NVIDIA with 8GB+ VRAM
- **Storage:** SSD with 20GB+ free space

## 🐳 Docker Alternative (Coming Soon)

For easier deployment, consider containerizing the backend:

```dockerfile
# Future: Docker setup for Python backend
FROM python:3.11-slim
# ... setup instructions
```

## 🔐 Production Considerations

- Add authentication (JWT tokens)
- Implement rate limiting
- Use model serving platforms (Hugging Face Inference Endpoints)
- Add monitoring and logging
- Consider model quantization for production

## 🚨 Troubleshooting

### Common Issues:

1. **Out of Memory Error:**
   - Reduce `max_length` parameter
   - Ensure 16GB+ RAM available
   - Close other applications

2. **Model Loading Slow:**
   - First load takes 2-5 minutes
   - Subsequent requests are faster
   - Consider keeping backend running

3. **CORS Errors:**
   - Ensure backend CORS settings include frontend URL
   - Check browser console for specific errors

## 📚 Technologies Used

### Frontend:
- React 18+ with TypeScript
- Tailwind CSS
- Vite

### Backend Options:
- **Python:** FastAPI, Transformers, PyTorch
- **Java:** Spring Boot, WebFlux

### AI/ML:
- Zephyr 7B (HuggingFace)
- Transformers library
- 8-bit quantization

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
