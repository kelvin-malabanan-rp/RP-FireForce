# 🎯 Phi-3 Mini Fine-tuning for Alert Analysis - Complete Guide

## 🚀 Quick Start (Step-by-Step)

### **Phase 1: Data Collection**

#### Step 1: Collect Your Alert Data
```bash
cd finetuning_data
python collect_data.py
```

This will help you collect:
- System alerts (CPU, memory, disk)
- Application alerts (service failures, timeouts)
- Security alerts (unauthorized access)
- Network alerts (connectivity issues)
- Database alerts (connection failures)
- CI/CD alerts (build failures)

**Target: 50-200 high-quality examples** (minimum 20 per category)

#### Step 2: Data Quality Guidelines

**Good Example:**
```json
{
  "messages": [
    {
      "role": "user", 
      "content": "Alert: High CPU usage on prod-web-01. CPU: 89% for 8 minutes. Memory: 76%. Recent deployment: user-service v2.1.3"
    },
    {
      "role": "assistant", 
      "content": "Critical CPU alert requiring immediate investigation:\n\n**Immediate Actions:**\n1. Check processes: `htop` or `ps aux --sort=-%cpu`\n2. Identify if user-service v2.1.3 is causing high CPU\n3. Review deployment logs for errors\n4. Consider rolling back if performance regression confirmed\n\n**Investigation:**\n- Check user-service logs for errors or infinite loops\n- Monitor memory usage trend\n- Verify application performance metrics\n\n**Resolution:**\n- Restart user-service if safe to do so\n- Scale horizontally if load is legitimate\n- Rollback deployment if performance regression"
    }
  ]
}
```

**What Makes This Good:**
- ✅ Specific alert with context (server name, metrics, recent changes)
- ✅ Structured response with clear sections
- ✅ Actionable commands and steps
- ✅ Company-specific service names (user-service)
- ✅ Realistic troubleshooting flow

### **Phase 2: Fine-tuning**

#### Step 3: Install Dependencies
```bash
cd backend
source venv/bin/activate
pip install -r requirements_finetuning.txt
```

#### Step 4: Run Fine-tuning
```bash
cd finetuning_data
python finetune_phi3.py
```

**Expected Time:** 1-3 hours depending on dataset size

**What Happens:**
- ✅ Loads Phi-3 Mini base model
- ✅ Sets up LoRA (Low-Rank Adaptation) for efficient training
- ✅ Trains on your alert data
- ✅ Saves fine-tuned model to `./phi3_alert_finetuned/`

#### Step 5: Integrate Fine-tuned Model
```bash
python integrate_finetuned_model.py
```

This updates your backend to use the fine-tuned model.

#### Step 6: Test Fine-tuned Model
```bash
cd ../backend
source venv/bin/activate
python main.py
```

Test with company-specific alerts!

### **Phase 3: Optimization & Iteration**

#### Step 7: Evaluate Performance
Test the model with:
- **Real alerts from your systems**
- **Edge cases and complex scenarios**  
- **Different alert types and severity levels**

#### Step 8: Iterate and Improve
- **Collect more data** for poorly performing alert types
- **Refine responses** based on team feedback
- **Add new alert categories** as they emerge

## 📊 **Expected Improvements After Fine-tuning**

### **Before Fine-tuning (Generic Phi-3):**
```
User: "Alert: High CPU on prod-web-01, what should I do?"

Response: "High CPU usage can be caused by various factors. You should check running processes, monitor system resources, and consider restarting services if necessary. It's also good to investigate the root cause."
```
**Issues:** Generic, vague, no specific commands, no company context

### **After Fine-tuning (Your Alert-Trained Model):**
```
User: "Alert: High CPU on prod-web-01, what should I do?"

Response: "Critical CPU alert on prod-web-01 requiring immediate action:

**Immediate Steps:**
1. Check processes: `htop` or `ps aux --sort=-%cpu | head -20`
2. Identify resource-heavy applications
3. Review recent deployments in your CI/CD system
4. Check if auto-scaling is available for this server

**Investigation:**
- Examine application logs: `/var/log/applications/`
- Monitor memory usage: `free -h`
- Check for memory leaks in services
- Verify database connection pools aren't exhausted

**Resolution:**
- Restart affected services if safe to do so
- Scale horizontally using your load balancer
- Consider emergency rollback if related to recent deployment
- Document findings for post-incident review"
```
**Improvements:** Specific commands, company-aware responses, structured approach, actionable steps

## 🎯 **Key Success Factors**

### **1. Data Quality Over Quantity**
- **50 high-quality examples > 200 poor examples**
- Include **real company terminology** (service names, server names)
- Cover **different severity levels** (critical, warning, info)
- Add **context** (recent deployments, related alerts)

### **2. Company-Specific Training Data**
Include alerts mentioning:
- ✅ Your actual service names (`user-service`, `payment-api`, `notification-worker`)
- ✅ Your server naming conventions (`prod-web-01`, `staging-db-02`)
- ✅ Your tools and processes (`kubectl`, `docker-compose`, your monitoring stack)
- ✅ Your incident response procedures

### **3. Structured Response Format**
Train the model to always respond with:
```
**Immediate Actions:** (what to do right now)
**Investigation:** (how to diagnose the root cause)
**Resolution:** (how to fix the problem)
**Prevention:** (how to prevent recurrence)
```

### **4. Iterative Improvement**
- **Week 1:** Basic fine-tuning with initial dataset
- **Week 2:** Test with real alerts, collect feedback
- **Week 3:** Add more examples for poorly performing cases
- **Week 4:** Re-fine-tune with expanded dataset

## 🔧 **Troubleshooting Fine-tuning**

### **Common Issues:**

#### **"Out of Memory" Error**
```python
# In finetune_phi3.py, reduce batch size:
batch_size=1,  # Instead of 2 or 4
gradient_accumulation_steps=8,  # Increase to maintain effective batch size
```

#### **"Model Not Learning"**
- **Check data format:** Ensure JSONL is correctly formatted
- **Increase learning rate:** Try `3e-4` instead of `2e-4`
- **More epochs:** Try 5-10 epochs instead of 3
- **Better data:** More diverse, high-quality examples

#### **"Responses Too Generic"**
- **Add more specific examples** with company terminology
- **Include edge cases** and complex scenarios
- **Train longer** with more epochs

### **Performance Monitoring**

Track these metrics:
- **Response relevance:** Does it address the specific alert?
- **Action accuracy:** Are the suggested commands correct?
- **Company context:** Does it use your terminology?
- **Response structure:** Does it follow your preferred format?

## 🎉 **Expected Timeline**

- **Day 1-2:** Data collection (2-4 hours)
- **Day 3:** Fine-tuning setup and first run (1-3 hours)
- **Day 4:** Testing and integration (1 hour)
- **Week 2:** Real-world testing and feedback collection
- **Week 3-4:** Iteration and improvement

## 📈 **ROI Expectations**

After successful fine-tuning:
- **⚡ 60-80% faster incident response** (specific actions vs generic advice)
- **🎯 90% accuracy** on company-specific alerts
- **📚 Consistent responses** across team members
- **🧠 Knowledge retention** of your processes and tools
- **🔄 Reduced onboarding time** for new team members

Ready to start? Begin with data collection! 🚀
