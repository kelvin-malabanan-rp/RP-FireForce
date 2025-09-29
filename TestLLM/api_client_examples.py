#!/usr/bin/env python3
"""
Phi-3 Mini API Client Examples
How to call your API from other Python projects
"""

import requests
import json
from typing import Optional

class Phi3AlertAPI:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
    
    def health_check(self) -> dict:
        """Check if API is healthy"""
        try:
            response = requests.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status": "unhealthy"}
    
    def ask_question(self, question: str, temperature: float = 0.7, max_length: int = 512) -> dict:
        """Ask a question to the Phi-3 model"""
        try:
            payload = {
                "question": question,
                "temperature": temperature,
                "max_length": max_length
            }
            
            response = requests.post(
                f"{self.base_url}/ask",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30  # 30 second timeout
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status": "failed"}
    
    def analyze_alert(self, alert_message: str) -> str:
        """Convenience method for alert analysis"""
        result = self.ask_question(f"Alert: {alert_message}")
        
        if result.get("status") == "success":
            return result["answer"]
        else:
            return f"Error: {result.get('error', 'Unknown error')}"

# Usage Examples
def main():
    # Create API client
    api = Phi3AlertAPI()
    
    # 1. Check if API is running
    print("🔍 Checking API health...")
    health = api.health_check()
    print(f"Status: {health}")
    print()
    
    if health.get("status") != "healthy":
        print("❌ API is not healthy. Make sure the server is running!")
        return
    
    # 2. Test alert questions
    alerts = [
        "High CPU usage on prod-web-01, 95% for 10 minutes",
        "Database connection timeout on prod-db-01", 
        "SSL certificate expiring in 3 days for api.company.com",
        "Memory usage at 98% on payment-service pod"
    ]
    
    for i, alert in enumerate(alerts, 1):
        print(f"🚨 Alert {i}: {alert}")
        print("-" * 50)
        
        # Get response
        response = api.ask_question(alert, temperature=0.5, max_length=200)
        
        if response.get("status") == "success":
            print(f"💡 Response: {response['answer'][:200]}...")
            print(f"⏱️  Time: {response['response_time']}s")
        else:
            print(f"❌ Error: {response}")
        
        print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()
