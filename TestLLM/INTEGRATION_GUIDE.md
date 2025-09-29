# 🚀 Phi-3 Mini API Integration Guide

## 📡 **API Connection Info**

- **Local URL**: `http://localhost:8000`
- **Production URL**: `http://your-server-ip:8000` (when deployed)
- **Health Check**: `GET /health`
- **Main Endpoint**: `POST /ask`

## 🔧 **Quick Integration Steps**

### **1. Start Your API Server**
```bash
cd /Users/seanreptimiguell.ticzon/TestLLM/backend
python3 main.py
```
**Wait for**: `"Model Phi-3 Mini loaded successfully on mps!"`

### **2. Test Connection**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","model_loaded":true,...}
```

### **3. Use in Your Projects**

#### **Python Project Integration**
```python
import requests

def ask_ai_assistant(alert_text):
    response = requests.post("http://localhost:8000/ask", 
                           json={"question": alert_text})
    return response.json()["answer"]

# Usage
answer = ask_ai_assistant("Database timeout on prod server")
print(answer)
```

#### **JavaScript/React Project**
```javascript
async function askAIAssistant(alertText) {
    const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({question: alertText})
    });
    const data = await response.json();
    return data.answer;
}

// Usage
const answer = await askAIAssistant("High CPU usage detected");
```

#### **Shell Script Integration**
```bash
#!/bin/bash
ask_ai() {
    local question="$1"
    curl -s -X POST "http://localhost:8000/ask" \
        -H "Content-Type: application/json" \
        -d "{\"question\": \"$question\"}" \
        | python3 -c "import sys, json; print(json.load(sys.stdin)['answer'])"
}

# Usage
answer=$(ask_ai "Server memory at 95%")
echo "$answer"
```

## 📊 **Request/Response Format**

### **Request Structure**
```json
{
    "question": "Your alert or question here",
    "temperature": 0.7,
    "max_length": 512
}
```

### **Response Structure** 
```json
{
    "answer": "AI response here...",
    "status": "success",
    "response_time": 8.45
}
```

## ⚡ **Performance Tips**

- **Temperature**: 0.3-0.5 for focused responses, 0.7-0.9 for creative
- **Max Length**: 150-300 for quick responses, 500+ for detailed
- **Timeout**: Set 30+ second timeout for complex questions
- **Error Handling**: Always check `status` field in response

## 🛠️ **Integration Examples**

### **Monitoring System Integration**
```python
import requests

class AlertProcessor:
    def __init__(self):
        self.ai_api = "http://localhost:8000/ask"
    
    def process_alert(self, alert_data):
        # Format alert for AI
        alert_text = f"Alert: {alert_data['message']} on {alert_data['server']}"
        
        # Get AI recommendation
        response = requests.post(self.ai_api, json={"question": alert_text})
        recommendation = response.json()["answer"]
        
        # Log or send to team
        self.send_to_team(alert_data, recommendation)
```

### **DevOps Dashboard Integration**
```javascript
// In your React/Vue component
const [aiSuggestion, setAiSuggestion] = useState('');

const getAISuggestion = async (alertData) => {
    const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            question: `Alert: ${alertData.description}`,
            temperature: 0.5
        })
    });
    const data = await response.json();
    setAiSuggestion(data.answer);
};
```

## 🔒 **Security Notes for Local Testing**

- API runs on `localhost:8000` - only accessible from your machine
- No authentication required for local testing  
- For production: add API keys, CORS restrictions, HTTPS

## 🚀 **Next Steps**

1. **Test locally** with the provided examples
2. **Integrate** into your existing projects
3. **Fine-tune** the model with your data when ready
4. **Deploy** to production server when satisfied

Your API is ready to use! 🎯
