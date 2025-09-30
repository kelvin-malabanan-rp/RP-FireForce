#!/usr/bin/env python3
"""
Real Alert JSON Processor for Phi-3 Fine-tuning
Converts your actual alert JSON format to AI training data
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

class RealAlertProcessor:
    """Process real alert JSON for fine-tuning"""
    
    # Important fields to extract for AI analysis
    IMPORTANT_FIELDS = [
        'title', 'description', 'severity', 'status', 'timestamp',
        'reported_by', 'location', 'state_reason', 'aws_alarm_name',
        'metric_name', 'aws_console_url'
    ]
    
    @staticmethod
    def extract_important_fields(alert_json: Dict) -> Dict:
        """Extract only the fields AI needs to analyze"""
        return {
            field: alert_json.get(field, '')
            for field in RealAlertProcessor.IMPORTANT_FIELDS
            if alert_json.get(field) is not None
        }
    
    @staticmethod
    def format_alert_for_ai(alert_json: Dict) -> str:
        """Convert alert JSON to natural language for AI"""
        # Extract important fields
        data = RealAlertProcessor.extract_important_fields(alert_json)
        
        # Build natural language alert
        alert_text = f"Alert: {data.get('title', 'Unknown Alert')}"
        
        # Add description if different from title
        desc = data.get('description', '')
        if desc and desc != data.get('title', ''):
            alert_text += f" - {desc}"
        
        # Add severity
        severity = data.get('severity', 'unknown').upper()
        alert_text += f"\nSeverity: {severity}"
        
        # Add source
        source = data.get('reported_by', 'Unknown Source')
        alert_text += f"\nSource: {source}"
        
        # Add location if available
        location = data.get('location', '')
        if location and location != 'Unknown Location':
            alert_text += f"\nLocation: {location}"
        
        # Add state reason if available and different from description
        reason = data.get('state_reason', '')
        if reason and reason != desc:
            alert_text += f"\nReason: {reason}"
        
        # Add AWS alarm name if available
        alarm = data.get('aws_alarm_name', '')
        if alarm and alarm != data.get('title', ''):
            alert_text += f"\nAWS Alarm: {alarm}"
        
        # Add metric if available
        metric = data.get('metric_name', '')
        if metric:
            alert_text += f"\nMetric: {metric}"
        
        # Add status
        status = data.get('status', 'unknown')
        alert_text += f"\nStatus: {status}"
        
        # Add timestamp
        timestamp = data.get('timestamp', '')
        if timestamp:
            try:
                # Parse and format timestamp
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                alert_text += f"\nTime: {dt.strftime('%Y-%m-%d %H:%M:%S UTC')}"
            except:
                alert_text += f"\nTime: {timestamp}"
        
        return alert_text
    
    @staticmethod
    def create_training_example(alert_json: Dict, expert_response: str) -> Dict:
        """Create training format for fine-tuning"""
        formatted_alert = RealAlertProcessor.format_alert_for_ai(alert_json)
        
        return {
            "messages": [
                {
                    "role": "user",
                    "content": formatted_alert
                },
                {
                    "role": "assistant",
                    "content": expert_response
                }
            ]
        }
    
    @staticmethod
    def process_real_alerts(alerts_file: str = "real_alerts.json", 
                          output_file: str = "processed_training_data.jsonl"):
        """
        Process your real alert JSON file and convert to training data
        
        Expected input format:
        {
            "alerts": [
                {
                    "alert": { your alert JSON },
                    "expert_response": "Expert troubleshooting response..."
                },
                ...
            ]
        }
        """
        
        # Load alerts
        with open(alerts_file, 'r') as f:
            data = json.load(f)
        
        training_examples = []
        
        for item in data.get('alerts', []):
            alert_json = item.get('alert', {})
            expert_response = item.get('expert_response', '')
            
            if alert_json and expert_response:
                example = RealAlertProcessor.create_training_example(
                    alert_json, expert_response
                )
                training_examples.append(example)
        
        # Save as JSONL for training
        with open(output_file, 'w') as f:
            for example in training_examples:
                f.write(json.dumps(example) + '\n')
        
        print(f"✅ Processed {len(training_examples)} alerts")
        print(f"📄 Saved to: {output_file}")
        
        return training_examples

def demo_with_your_alert():
    """Demo with your actual alert format"""
    
    # Your actual alert format
    real_alert = {
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
        "metric_name": None,
        "aws_console_url": "",
        "resolved_at": None,
        "created_at": "2025-09-27T20:44:02.061Z",
        "updated_at": "2025-09-27T20:44:02.061Z",
        "assigned_to": None,
        "resolved_by": None
    }
    
    print("🔍 Original Alert JSON:")
    print(json.dumps(real_alert, indent=2))
    print("\n" + "="*60)
    
    # Extract important fields
    important = RealAlertProcessor.extract_important_fields(real_alert)
    print("\n📋 Important Fields for AI:")
    print(json.dumps(important, indent=2))
    print("\n" + "="*60)
    
    # Format for AI
    formatted = RealAlertProcessor.format_alert_for_ai(real_alert)
    print("\n🤖 AI-Formatted Alert:")
    print(formatted)
    print("\n" + "="*60)
    
    # Create training example
    expert_response = """This is a manual test alert with LOW severity from AWS CloudWatch in us-east-1.

**Immediate Actions:**
1. Verify this is indeed a test alert by checking the title "TEST-Manual"
2. Confirm with the team who triggered this manual test
3. Document the test results if this was planned

**Investigation:**
- Check if this is part of scheduled testing procedures
- Verify AWS CloudWatch alarm configuration is working correctly
- Review if the alert routing and notification systems are functioning

**Resolution:**
- Since this is a test alert with LOW severity, acknowledge and close
- Update test documentation with results
- Consider scheduling regular test alerts during maintenance windows

**Prevention:**
- Implement clear naming conventions for test alerts
- Set up separate test alert channels to avoid confusion
- Document all manual test procedures"""

    training_example = RealAlertProcessor.create_training_example(
        real_alert, expert_response
    )
    
    print("\n📚 Training Example:")
    print(json.dumps(training_example, indent=2))

if __name__ == "__main__":
    print("🚀 Real Alert JSON Processor Demo")
    print("="*50)
    demo_with_your_alert()
    
    # Instructions for processing your real alerts
    print(f"\n💡 To process your real alerts:")
    print(f"1. Create a file 'real_alerts.json' with this format:")
    print(f"""{{
    "alerts": [
        {{
            "alert": {{ your alert JSON here }},
            "expert_response": "Expert troubleshooting response..."
        }},
        ...
    ]
}}""")
    print(f"2. Run: python {__file__}")
    print(f"3. Your training data will be saved as 'processed_training_data.jsonl'")
