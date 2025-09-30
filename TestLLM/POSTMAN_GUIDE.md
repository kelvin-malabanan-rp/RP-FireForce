# 📮 Postman Integration Guide for Phi-3 Mini API

## 🚀 **Postman Collection Setup**

### **1. Health Check Request**

**Method**: `GET`
**URL**: `http://localhost:8000/health`
**Headers**: None required

**Expected Response**:
```json
{
    "status": "healthy",
    "model_loaded": true,
    "tokenizer_loaded": true,
    "model": "Phi-3 Mini"
}
```

---

### **2. Root Info Request**

**Method**: `GET`
**URL**: `http://localhost:8000/`
**Headers**: None required

**Expected Response**:
```json
{
    "message": "Phi-3 Mini LLM API is running!",
    "model": "Phi-3 Mini"
}
```

---

### **3. Ask Question Request (Main Endpoint)**

**Method**: `POST`
**URL**: `http://localhost:8000/ask`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
    "question": "Alert: High CPU usage detected on prod-web-01. CPU utilization: 92% for 5 minutes. What should I do?",
    "temperature": 0.7,
    "max_length": 300
}
```

**Expected Response**:
```json
{
    "answer": "To address the high CPU usage issue...",
    "status": "success", 
    "response_time": 8.45
}
```

---

## 📋 **Pre-built Postman Requests**

### **Request 1: System Alert**
```json
{
    "question": "Alert: High memory usage on web-server-01, 96% utilized. Recent deployment: user-auth-service v3.2.1 deployed 1 hour ago.",
    "temperature": 0.5,
    "max_length": 250
}
```

### **Request 2: Database Alert**  
```json
{
    "question": "Alert: Database connection pool exhausted on prod-db-01. Active connections: 100/100. Application: payment-api. Error rate: 15% in last 5 minutes.",
    "temperature": 0.3,
    "max_length": 400
}
```

### **Request 3: Security Alert**
```json
{
    "question": "Alert: SSL certificate expiring in 7 days for api.company.com. Issuer: Let's Encrypt. Auto-renewal failed.",
    "temperature": 0.4,
    "max_length": 200
}
```

### **Request 4: Network Alert**
```json
{
    "question": "Alert: High network latency detected between prod-web-01 and prod-db-01. Average latency: 250ms (normal: <10ms). Packet loss: 2%.",
    "temperature": 0.5,
    "max_length": 300
}
```

### **Request 5: CI/CD Alert**
```json
{
    "question": "Alert: CI/CD pipeline failed: user-service build #342 failed at Docker build step. Error: 'npm install' failed with exit code 1. Branch: feature/payment-integration.",
    "temperature": 0.6,
    "max_length": 250
}
```

---

## 🛠️ **Postman Environment Setup**

Create a Postman Environment with these variables:

| Variable Name | Initial Value | Current Value |
|---------------|---------------|---------------|
| `base_url` | `http://localhost:8000` | `http://localhost:8000` |
| `temperature` | `0.7` | `0.7` |
| `max_length` | `300` | `300` |

**Then use in requests**:
- URL: `{{base_url}}/ask`
- Body: `"temperature": {{temperature}}`

---

## 📊 **Postman Tests Script**

Add this to your **Tests** tab in Postman to validate responses:

```javascript
// Test for successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('answer');
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData).to.have.property('response_time');
});

// Test successful status
pm.test("API call was successful", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("success");
});

// Test response time is reasonable
pm.test("Response time is under 30 seconds", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.response_time).to.be.below(30);
});

// Test answer is not empty
pm.test("Answer is not empty", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.answer).to.not.be.empty;
});

// Save response time for monitoring
pm.test("Save response time", function () {
    const jsonData = pm.response.json();
    pm.environment.set("last_response_time", jsonData.response_time);
});
```

---

## 🎯 **Quick Postman Setup Steps**

1. **Open Postman**
2. **Create New Collection**: "Phi-3 Mini API"
3. **Add Environment**: Create variables for base_url, etc.
4. **Create 5 requests** using the examples above
5. **Add Tests** to validate responses
6. **Run Collection** to test all endpoints

---

## 🔧 **Postman Pre-request Script**

Add this to **Pre-request Script** tab to check if API is running:

```javascript
// Check if API is healthy before making request
const healthUrl = pm.environment.get("base_url") + "/health";

pm.sendRequest(healthUrl, function (err, response) {
    if (err) {
        console.log("API server is not running!");
        pm.test("API server is running", function() {
            pm.expect.fail("API server is not accessible");
        });
    } else {
        const health = response.json();
        if (health.status !== "healthy") {
            console.log("API is not healthy:", health);
            pm.test("API is healthy", function() {
                pm.expect(health.status).to.eql("healthy");
            });
        }
    }
});
```

---

## 📋 **Postman Collection JSON**

Copy this JSON to import the complete collection:

```json
{
    "info": {
        "name": "Phi-3 Mini Alert API",
        "description": "Testing Phi-3 Mini API for alert analysis",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Health Check",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/health",
                    "host": ["{{base_url}}"],
                    "path": ["health"]
                }
            }
        },
        {
            "name": "CPU Alert",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"question\": \"Alert: High CPU usage detected on prod-web-01. CPU utilization: 92% for 5 minutes. What should I do?\",\n    \"temperature\": 0.7,\n    \"max_length\": 300\n}"
                },
                "url": {
                    "raw": "{{base_url}}/ask",
                    "host": ["{{base_url}}"],
                    "path": ["ask"]
                }
            }
        },
        {
            "name": "Database Alert",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"question\": \"Alert: Database connection pool exhausted on prod-db-01. Active connections: 100/100. Application: payment-api. Error rate: 15% in last 5 minutes.\",\n    \"temperature\": 0.3,\n    \"max_length\": 400\n}"
                },
                "url": {
                    "raw": "{{base_url}}/ask",
                    "host": ["{{base_url}}"],
                    "path": ["ask"]
                }
            }
        }
    ],
    "variable": [
        {
            "key": "base_url",
            "value": "http://localhost:8000"
        }
    ]
}
```

---

## 🎯 **Pro Tips for Postman Testing**

1. **Use Variables**: Set `{{base_url}}` for easy environment switching
2. **Add Tests**: Validate response structure and timing
3. **Create Collections**: Organize different alert types
4. **Use Runner**: Test multiple scenarios automatically
5. **Monitor Performance**: Track response times over time
6. **Save Examples**: Store good responses as examples

**Ready to test in Postman!** 🚀
