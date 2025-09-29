#!/usr/bin/env python3
"""
Deployment Preparation Script
Prepares your Phi-3 API for production deployment
"""

import os
import shutil
from pathlib import Path

def create_deployment_package():
    """Create a clean deployment package"""
    
    print("📦 Creating deployment package...")
    
    # Create deployment directory
    deploy_dir = Path("../phi3-alert-api-deploy")
    if deploy_dir.exists():
        shutil.rmtree(deploy_dir)
    
    deploy_dir.mkdir()
    
    # Copy essential backend files
    backend_files = [
        "main.py",
        "requirements.txt",
        "requirements_finetuning.txt"
    ]
    
    backend_dir = deploy_dir / "backend"
    backend_dir.mkdir()
    
    for file in backend_files:
        if Path(f"../backend/{file}").exists():
            shutil.copy(f"../backend/{file}", backend_dir / file)
    
    # Copy finetuning files
    finetuning_files = [
        "finetune_data.json",
        "json_to_training.py", 
        "finetune_phi3.py",
        "integrate_finetuned_model.py",
        "WORKFLOW.md"
    ]
    
    finetuning_dir = deploy_dir / "finetuning"
    finetuning_dir.mkdir()
    
    for file in finetuning_files:
        if Path(file).exists():
            shutil.copy(file, finetuning_dir / file)
    
    # Create training directory
    (finetuning_dir / "training").mkdir()
    
    # Copy training files if they exist
    if Path("training").exists():
        for file in Path("training").glob("*.jsonl"):
            shutil.copy(file, finetuning_dir / "training" / file.name)
    
    return deploy_dir

def create_dockerfile(deploy_dir: Path):
    """Create Dockerfile for containerized deployment"""
    
    dockerfile_content = '''# Phi-3 Alert Analysis API
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt backend/requirements_finetuning.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r requirements_finetuning.txt

# Copy application code
COPY backend/ ./backend/
COPY finetuning/ ./finetuning/

# Create directories for models and data
RUN mkdir -p /app/models /app/data

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["python", "backend/main.py"]
'''
    
    with open(deploy_dir / "Dockerfile", 'w') as f:
        f.write(dockerfile_content)
    
    print(f"✅ Created Dockerfile")

def create_docker_compose(deploy_dir: Path):
    """Create docker-compose for easy deployment"""
    
    compose_content = '''version: '3.8'

services:
  phi3-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MODEL_PATH=/app/models
      - DATA_PATH=/app/data
    volumes:
      - ./models:/app/models
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: Add nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - phi3-api
    restart: unless-stopped
'''
    
    with open(deploy_dir / "docker-compose.yml", 'w') as f:
        f.write(compose_content)
    
    print(f"✅ Created docker-compose.yml")

def create_deployment_readme(deploy_dir: Path):
    """Create deployment instructions"""
    
    readme_content = '''# 🚀 Phi-3 Alert Analysis API - Deployment Guide

## 📋 What This Is
A production-ready API service running your fine-tuned Phi-3 Mini model for alert analysis.

## 🛠️ Deployment Options

### Option 1: Docker (Recommended)
```bash
# Build and start
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f phi3-api
```

### Option 2: Direct Python
```bash
# Install dependencies
pip install -r backend/requirements.txt
pip install -r backend/requirements_finetuning.txt

# Start API
python backend/main.py
```

### Option 3: Cloud Deployment
- **AWS**: Deploy to ECS/EKS
- **Google Cloud**: Deploy to Cloud Run/GKE  
- **Azure**: Deploy to Container Instances/AKS
- **Digital Ocean**: Deploy to App Platform

## 🔧 Configuration

### Environment Variables
```bash
export MODEL_PATH="/path/to/your/finetuned/model"
export API_PORT="8000"
export WORKERS="1"  # Increase for production
```

### Production Settings
- Use a reverse proxy (nginx) for HTTPS
- Set up proper logging
- Configure monitoring and alerts
- Use a process manager (PM2, systemd)

## 📡 API Usage

### Health Check
```bash
GET http://your-api-url:8000/health
```

### Ask Question
```bash
POST http://your-api-url:8000/ask
Content-Type: application/json

{
  "question": "Alert: High CPU usage on prod-web-01...",
  "max_length": 500,
  "temperature": 0.7
}
```

## 🔗 Client Integration

### Python Client
```python
import requests

def ask_phi3_api(question, api_url="http://your-api-url:8000"):
    response = requests.post(
        f"{api_url}/ask",
        json={"question": question}
    )
    return response.json()["answer"]

# Usage
answer = ask_phi3_api("Alert: Database connection pool exhausted...")
print(answer)
```

### JavaScript Client
```javascript
async function askPhi3API(question, apiUrl = 'http://your-api-url:8000') {
    const response = await fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
    });
    const data = await response.json();
    return data.answer;
}

// Usage
const answer = await askPhi3API('Alert: High memory usage...');
console.log(answer);
```

## 📊 Monitoring

### Key Metrics to Track
- Response time (target: <10 seconds)
- Error rate (target: <1%)
- Memory usage
- CPU utilization
- Request volume

### Logging
Logs are available via:
```bash
docker-compose logs -f phi3-api
```

## 🔄 Updates

### Update Model
1. Train new model in `finetuning/` directory
2. Copy fine-tuned model to deployment
3. Restart service

### Update Code
1. Update code in deployment directory
2. Rebuild container: `docker-compose up --build -d`

## 🆘 Troubleshooting

### Common Issues
- **Model not loading**: Check model path and permissions
- **High memory usage**: Reduce batch size or use smaller model
- **Slow responses**: Check CPU/memory resources
- **Connection errors**: Verify port and firewall settings

### Support
- Check logs: `docker-compose logs phi3-api`
- Health status: `curl http://localhost:8000/health`
- Resource usage: `docker stats`
'''
    
    with open(deploy_dir / "README.md", 'w') as f:
        f.write(readme_content)
    
    print(f"✅ Created deployment README.md")

def create_nginx_config(deploy_dir: Path):
    """Create nginx configuration for production"""
    
    nginx_content = '''events {
    worker_connections 1024;
}

http {
    upstream phi3_api {
        server phi3-api:8000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";

        # API proxy
        location / {
            proxy_pass http://phi3_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts for ML inference
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://phi3_api/health;
            access_log off;
        }
    }
}'''
    
    with open(deploy_dir / "nginx.conf", 'w') as f:
        f.write(nginx_content)
    
    print(f"✅ Created nginx.conf")

if __name__ == "__main__":
    print("🚀 Preparing Phi-3 API for deployment...")
    
    # Create deployment package
    deploy_dir = create_deployment_package()
    print(f"📦 Created deployment package: {deploy_dir}")
    
    # Create deployment files
    create_dockerfile(deploy_dir)
    create_docker_compose(deploy_dir)
    create_deployment_readme(deploy_dir)
    create_nginx_config(deploy_dir)
    
    print(f"\n✅ Deployment package ready!")
    print(f"📁 Location: {deploy_dir.absolute()}")
    print(f"🚀 Next steps:")
    print(f"   1. cd {deploy_dir}")
    print(f"   2. Review and customize configuration")
    print(f"   3. docker-compose up --build -d")
    print(f"   4. Test: curl http://localhost:8000/health")
    print(f"\n🌐 Your API will be available at: http://localhost:8000")
