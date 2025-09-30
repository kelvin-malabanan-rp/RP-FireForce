#!/usr/bin/env python3
"""
Phi-3 Alert Analysis API Client
Easy integration for other projects
"""

import requests
import json
from typing import Optional, Dict, Any
import time

class Phi3AlertAPI:
    """Client for Phi-3 Alert Analysis API"""
    
    def __init__(self, base_url: str = "http://localhost:8000", timeout: int = 60):
        """
        Initialize API client
        
        Args:
            base_url: API base URL (e.g., "https://your-api.com")
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        
    def health_check(self) -> Dict[str, Any]:
        """Check API health status"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"status": "error", "error": str(e)}
    
    def ask_alert(self, 
                  alert: str, 
                  max_length: int = 512, 
                  temperature: float = 0.7) -> Dict[str, Any]:
        """
        Ask the API to analyze an alert
        
        Args:
            alert: Alert message to analyze
            max_length: Maximum response length
            temperature: Response creativity (0.1-1.0)
            
        Returns:
            Dict with 'answer', 'status', and 'response_time'
        """
        try:
            payload = {
                "question": alert,
                "max_length": max_length,
                "temperature": temperature
            }
            
            response = requests.post(
                f"{self.base_url}/ask",
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            return {
                "answer": f"API Error: {str(e)}",
                "status": "error",
                "response_time": 0
            }
    
    def ask_alert_simple(self, alert: str) -> str:
        """
        Simple interface - just returns the answer text
        
        Args:
            alert: Alert message to analyze
            
        Returns:
            Answer text or error message
        """
        result = self.ask_alert(alert)
        return result.get("answer", f"Error: {result.get('status', 'unknown')}")
    
    def is_healthy(self) -> bool:
        """Check if API is healthy"""
        health = self.health_check()
        return health.get("status") == "healthy"
    
    def wait_for_ready(self, max_wait: int = 300) -> bool:
        """
        Wait for API to become ready
        
        Args:
            max_wait: Maximum seconds to wait
            
        Returns:
            True if API becomes ready, False if timeout
        """
        start_time = time.time()
        while time.time() - start_time < max_wait:
            if self.is_healthy():
                return True
            print(f"⏳ Waiting for API to be ready...")
            time.sleep(5)
        return False

# Convenience functions for quick usage
def ask_phi3(alert: str, api_url: str = "http://localhost:8000") -> str:
    """Quick function to ask Phi-3 API a question"""
    client = Phi3AlertAPI(api_url)
    return client.ask_alert_simple(alert)

def check_phi3_health(api_url: str = "http://localhost:8000") -> bool:
    """Quick function to check API health"""
    client = Phi3AlertAPI(api_url)
    return client.is_healthy()

# Example usage and testing
if __name__ == "__main__":
    import sys
    
    # Configuration
    API_URL = "http://localhost:8000"  # Change this to your deployed API URL
    
    print("🧪 Testing Phi-3 Alert Analysis API Client")
    
    # Initialize client
    client = Phi3AlertAPI(API_URL)
    
    # Check health
    print(f"🔍 Checking API health at {API_URL}...")
    health = client.health_check()
    print(f"   Status: {health}")
    
    if not client.is_healthy():
        print("❌ API is not healthy. Make sure it's running!")
        print("   Start with: python backend/main.py")
        sys.exit(1)
    
    # Test questions
    test_alerts = [
        "High CPU usage detected on server prod-web-01. CPU utilization: 92% for 5 minutes.",
        "Database connection pool exhausted on prod-db-01. Active connections: 100/100.",
        "SSL certificate expiring in 7 days for domain api.company.com."
    ]
    
    for i, alert in enumerate(test_alerts, 1):
        print(f"\n🧪 Test {i}: {alert[:50]}...")
        
        start_time = time.time()
        result = client.ask_alert(alert)
        elapsed = time.time() - start_time
        
        print(f"   ⏱️  Response time: {elapsed:.1f}s")
        print(f"   📊 API response time: {result.get('response_time', 'N/A')}s")
        print(f"   🎯 Status: {result.get('status', 'unknown')}")
        print(f"   💬 Answer preview: {result.get('answer', 'No answer')[:100]}...")
    
    print(f"\n✅ API client testing complete!")
    print(f"🔗 You can now use this client in other projects:")
    print(f"")
    print(f"   from phi3_client import ask_phi3")
    print(f"   answer = ask_phi3('Your alert here...')")
    print(f"   print(answer)")
