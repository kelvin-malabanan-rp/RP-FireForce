# 📮 Postman Guide for Real Alert Testing

## 🎯 **Testing Your API with Real Alert Format**

### **Method 1: Direct Alert JSON Testing**

**Request Setup:**
- **Method**: `POST`
- **URL**: `{{base_url}}/ask`
- **Headers**: `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "question": "Alert: TEST-Manual-1759005842061 - test incident\nSeverity: LOW\nSource: AWS CloudWatch\nStatus: open"
}
```

**Alternative with custom settings:**
```json
{
  "question": "Alert: TEST-Manual-1759005842061 - test incident\nSeverity: LOW\nSource: AWS CloudWatch\nStatus: open",
  "temperature": 0.3,
  "max_length": 400
}
```

### **📋 Default Settings Explanation:**

When you omit `temperature` and `max_length`, the API uses these optimized defaults:
- **temperature**: `0.5` (balanced creativity vs consistency)  
- **max_length**: `400` tokens (fast responses, adequate detail)

This gives you **3-8 second response times** with good quality answers!

---

### **Method 2: Using Pre-request Script to Process Alert JSON**

**Pre-request Script:**
```javascript
// Your real alert JSON
const realAlert = {
    "id": "b5461bc6-5fbe-44c5-a14d-0f593bf07891",
    "title": "TEST-Manual-1759005842061", 
    "description": "Manually triggered test incident",
    "severity": "low",
    "status": "open",
    "timestamp": "2025-09-27T20:44:02.061Z",
    "reported_by": "AWS CloudWatch",
    "location": "us-east-1",
    "aws_alarm_name": "TEST-Manual-1759005842061",
    "state_reason": "Manual test trigger via API endpoint",
    "metric_name": null,
    "aws_console_url": ""
};

// Function to format alert for AI (same as your processor)
function formatAlertForAI(alertJson) {
    let alert = `Alert: ${alertJson.title}`;
    
    if (alertJson.description && alertJson.description !== alertJson.title) {
        alert += ` - ${alertJson.description}`;
    }
    
    alert += `\nSeverity: ${alertJson.severity.toUpperCase()}`;
    alert += `\nSource: ${alertJson.reported_by}`;
    
    if (alertJson.location) {
        alert += `\nLocation: ${alertJson.location}`;
    }
    
    if (alertJson.state_reason && alertJson.state_reason !== alertJson.description) {
        alert += `\nReason: ${alertJson.state_reason}`;
    }
    
    if (alertJson.aws_alarm_name && alertJson.aws_alarm_name !== alertJson.title) {
        alert += `\nAWS Alarm: ${alertJson.aws_alarm_name}`;
    }
    
    if (alertJson.metric_name) {
        alert += `\nMetric: ${alertJson.metric_name}`;
    }
    
    alert += `\nStatus: ${alertJson.status}`;
    
    if (alertJson.timestamp) {
        try {
            const dt = new Date(alertJson.timestamp);
            alert += `\nTime: ${dt.toISOString().replace('T', ' ').replace('.000Z', ' UTC')}`;
        } catch (e) {
            alert += `\nTime: ${alertJson.timestamp}`;
        }
    }
    
    return alert;
}

// Format the alert and store in environment variable
const formattedAlert = formatAlertForAI(realAlert);
pm.environment.set("formatted_alert", formattedAlert);

console.log("🤖 Formatted Alert for AI:");
console.log(formattedAlert);
```

**Request Body:**
```json
{
  "question": "{{formatted_alert}}",
  "temperature": 0.5,
  "max_length": 800
}
```

---

### **Method 3: Postman Collection with Multiple Alert Types**

**Environment Variables:**
```json
{
  "base_url": "http://localhost:8000",
  "test_alert": "Alert: TEST-Manual-1759005842061 - Manually triggered test incident\nSeverity: LOW\nSource: AWS CloudWatch\nLocation: us-east-1\nReason: Manual test trigger via API endpoint\nStatus: open",
  "cpu_alert": "Alert: High CPU Usage - prod-web-01 - CPU utilization exceeded 90% for 5 minutes\nSeverity: HIGH\nSource: AWS CloudWatch\nLocation: us-east-1\nReason: CPUUtilization metric exceeded threshold\nStatus: open",
  "db_alert": "Alert: Database Connection Pool Exhausted - RDS connection pool reached maximum capacity\nSeverity: CRITICAL\nSource: AWS RDS\nLocation: us-east-1\nReason: DatabaseConnections exceeded maximum\nStatus: open"
}
```

**Request Examples:**

#### **Test Alert Request**
```json
{
  "question": "{{test_alert}}",
  "temperature": 0.5,
  "max_length": 600
}
```

#### **CPU Alert Request**
```json
{
  "question": "{{cpu_alert}}",
  "temperature": 0.3,
  "max_length": 800
}
```

#### **Database Alert Request**
```json
{
  "question": "{{db_alert}}",
  "temperature": 0.4,
  "max_length": 1000
}
```

---

## 🧪 **Postman Tests for Real Alerts**

**Add to Tests Tab:**
```javascript
// Test response structure
pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('answer');
    pm.expect(jsonData).to.have.property('status');
    pm.expect(jsonData).to.have.property('response_time');
});

// Test response quality for alerts
pm.test("Response contains troubleshooting structure", function () {
    const jsonData = pm.response.json();
    const answer = jsonData.answer.toLowerCase();
    
    // Check for structured response sections
    const hasImmediateActions = answer.includes('immediate') || answer.includes('actions');
    const hasInvestigation = answer.includes('investigation') || answer.includes('check');
    const hasResolution = answer.includes('resolution') || answer.includes('fix');
    
    pm.expect(hasImmediateActions || hasInvestigation || hasResolution).to.be.true;
});

// Test response time is reasonable
pm.test("Response time is acceptable", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.response_time).to.be.below(120); // 2 minutes max
});

// Test response length is substantial
pm.test("Response is detailed enough", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.answer.length).to.be.above(200); // At least 200 characters
});

// Save metrics for monitoring
pm.test("Save response metrics", function () {
    const jsonData = pm.response.json();
    pm.environment.set("last_response_time", jsonData.response_time);
    pm.environment.set("last_response_length", jsonData.answer.length);
    pm.environment.set("last_word_count", jsonData.answer.split(' ').length);
    
    console.log(`📊 Response Time: ${jsonData.response_time}s`);
    console.log(`📝 Response Length: ${jsonData.answer.length} chars`);
    console.log(`📄 Word Count: ${jsonData.answer.split(' ').length} words`);
});
```

---

## 🔄 **Dynamic Alert Testing with Collection Runner**

**Data File (CSV format) - `alert_test_data.csv`:**
```csv
alert_type,question,expected_severity,temperature
test_alert,"Alert: TEST-Manual - Manually triggered test\nSeverity: LOW\nSource: AWS CloudWatch\nStatus: open",low,0.5
cpu_high,"Alert: High CPU Usage - prod-web-01\nSeverity: HIGH\nSource: AWS CloudWatch\nStatus: open",high,0.3
db_error,"Alert: Database Connection Pool Exhausted\nSeverity: CRITICAL\nSource: AWS RDS\nStatus: open",critical,0.4
ssl_expiry,"Alert: SSL Certificate Expiring Soon\nSeverity: MEDIUM\nSource: Certificate Monitor\nStatus: open",medium,0.6
```

**Request Body (using CSV data):**
```json
{
  "question": "{{question}}",
  "temperature": {{temperature}},
  "max_length": 800
}
```

---

## ⚡ **Performance Optimization for Faster Responses**

### **🚀 Speed-Optimized Settings:**

**✅ Recommended: Use defaults** (3-8 seconds):

```json
{
  "question": "Alert: High CPU - prod-web-01 - CPU 95% for 5min\nSeverity: HIGH\nSource: AWS CloudWatch\nStatus: open"
}
```

**For extra speed** (2-5 seconds):

```json
{
  "question": "Alert: High CPU - prod-web-01 - CPU 95% for 5min\nSeverity: HIGH\nSource: AWS CloudWatch\nStatus: open",
  "temperature": 0.1,
  "max_length": 200
}
```

**For detailed responses** (8-15 seconds):

```json
{
  "question": "Alert: Database Connection Pool Exhausted - RDS connection pool reached maximum capacity\nSeverity: CRITICAL\nSource: AWS RDS\nLocation: us-east-1\nReason: DatabaseConnections exceeded maximum\nStatus: open",
  "temperature": 0.6,
  "max_length": 600
}
```

### **📊 Performance Guidelines:**

| Setting | Speed | Quality | Use Case |
|---------|--------|---------|----------|
| **Default (no params)** | 🚀 **Recommended** | � **Balanced** | **Most alerts - just use question only!** |
| `temperature: 0.1, max_length: 200` | ⚡ Fastest | � Good | Quick alerts, simple questions |
| `temperature: 0.6, max_length: 600` | 🐌 Slower | 🔴 Best | Complex incidents, detailed analysis |

### **🎯 Alert Format Optimization:**

**❌ Slower (verbose format):**
```
Alert: TEST-Manual-1759005842061 - Manually triggered test incident
Severity: LOW
Source: AWS CloudWatch
Location: us-east-1
Reason: Manual test trigger via API endpoint
Status: open
Time: 2025-09-27 20:44:02 UTC
```

**✅ Faster (concise format):**
```
Alert: High CPU - prod-web-01 - CPU 95% for 5min
Severity: HIGH
Source: AWS CloudWatch
Status: open
```

---

## 🎯 **Complete Postman Collection JSON**

```json
{
  "info": {
    "name": "Phi-3 Real Alert Testing",
    "description": "Test Phi-3 API with real alert formats"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Process Real Alert JSON",
      "event": [
        {
          "listen": "prerequest",
          "script": {
            "exec": [
              "// Your alert processing script here",
              "const realAlert = {",
              "  'title': 'High CPU Usage - prod-web-01',",
              "  'description': 'CPU exceeded 90% for 5 minutes',",
              "  'severity': 'high',",
              "  'reported_by': 'AWS CloudWatch',",
              "  'location': 'us-east-1',",
              "  'status': 'open'",
              "};",
              "",
              "// Format for AI",
              "let formatted = `Alert: ${realAlert.title}`;",
              "if (realAlert.description) formatted += ` - ${realAlert.description}`;",
              "formatted += `\\nSeverity: ${realAlert.severity.toUpperCase()}`;",
              "formatted += `\\nSource: ${realAlert.reported_by}`;",
              "formatted += `\\nLocation: ${realAlert.location}`;",
              "formatted += `\\nStatus: ${realAlert.status}`;",
              "",
              "pm.environment.set('processed_alert', formatted);"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"question\": \"{{processed_alert}}\",\n  \"temperature\": 0.5,\n  \"max_length\": 800\n}"
        },
        "url": "{{base_url}}/ask"
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

## 🚀 **Quick Setup Steps**

1. **Import Collection**: Copy the JSON above into Postman
2. **Set Environment**: Create environment with `base_url = http://localhost:8000`
3. **Start Your API**: `python3 start_server.py`
4. **Test Real Alerts**: Use the "Process Real Alert JSON" request
5. **Run Collection**: Use Collection Runner for bulk testing

**Now you can test your API with your exact alert JSON format in Postman!** 🎯
