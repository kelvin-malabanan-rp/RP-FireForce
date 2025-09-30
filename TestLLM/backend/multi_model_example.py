# Example: Two-stage processing for alerts
# Stage 1: Fast triage (1-2 seconds) - determine severity/complexity
# Stage 2: Detailed analysis (5-10 seconds) - full troubleshooting

class AlertProcessor:
    def __init__(self):
        # Fast model for triage
        self.triage_model = "Qwen/Qwen2.5-1.5B-Instruct"  # Very fast
        # Detailed model for complex analysis  
        self.detailed_model = "microsoft/Phi-3-mini-4k-instruct"  # Current
    
    async def process_alert(self, alert_text):
        # Stage 1: Quick triage (1-2 sec)
        triage_prompt = f"Categorize this alert severity (LOW/MEDIUM/HIGH/CRITICAL): {alert_text[:200]}"
        severity = await self.quick_inference(triage_prompt)
        
        # Stage 2: Detailed response based on severity
        if severity in ["CRITICAL", "HIGH"]:
            # Use detailed model for complex issues
            return await self.detailed_analysis(alert_text)
        else:
            # Use fast model for simple issues
            return await self.quick_analysis(alert_text)
