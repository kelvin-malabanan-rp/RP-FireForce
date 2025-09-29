#!/usr/bin/env python3
"""
Model Distillation Script: Generate Fine-tuning Data using Claude/GPT
Uses a high-end model to generate expert responses for alert scenarios
"""

import json
import openai
from typing import List, Dict
import time
import random

class AlertDistillationGenerator:
    def __init__(self, api_key: str = None, model: str = "gpt-4"):
        """Initialize with API key and model choice"""
        self.client = openai.OpenAI(api_key=api_key) if api_key else None
        self.model = model
        
        # Your company-specific context
        self.company_context = """
You are a senior DevOps engineer at a tech company with the following infrastructure:

**Services:**
- user-service (handles user authentication and profiles)
- payment-api (processes payments and billing)
- notification-worker (sends emails/SMS notifications)
- auth-service (OAuth and session management)
- analytics-service (data processing and reporting)

**Infrastructure:**
- Kubernetes cluster with auto-scaling
- PostgreSQL databases with read replicas
- Redis for caching and session storage
- Nginx load balancers
- CI/CD with Jenkins/GitLab
- Monitoring with Prometheus/Grafana

**Server Naming:**
- Production: prod-web-01, prod-db-01, prod-cache-01
- Staging: staging-web-01, staging-db-01
- Development: dev-web-01, dev-db-01

**Your response should be structured as:**
**Immediate Actions:** (what to do right now)
**Investigation:** (how to diagnose root cause)  
**Resolution:** (how to fix the problem)
**Prevention:** (how to prevent recurrence)

Include specific commands, service names, and procedures relevant to this infrastructure.
"""
    
    def generate_alert_scenarios(self) -> List[str]:
        """Generate realistic alert scenarios for your infrastructure"""
        
        alert_templates = [
            # System alerts
            "High CPU usage detected on {server}. CPU utilization: {cpu}% for {duration} minutes. Memory: {memory}%. Recent deployment: {service} v{version} deployed {time_ago}.",
            "Memory usage critical on {server}. Memory utilization: {memory}% for {duration} minutes. Swap usage: {swap}%. Top process: {service}.",
            "Disk space warning on {server}. Disk usage: {disk}% on /var partition. Growth rate: {growth}GB/hour. Logs size: {log_size}GB.",
            
            # Application alerts  
            "Service timeout alert: {service} response time >{timeout} seconds. Success rate: {success_rate}%. Queue backlog: {backlog} items.",
            "API error rate spike: {service} error rate {error_rate}% in last {duration} minutes. Total requests: {requests}. Main error: {error_type}.",
            "Service health check failure: {service} failed health checks for {duration} minutes. Last successful check: {last_success} ago.",
            
            # Database alerts
            "Database connection pool exhausted on {db_server}. Active connections: {connections}/{max_connections}. Application: {service}. Wait time: {wait_time}s.",
            "Slow query detected on {db_server}. Query time: {query_time}s. Query type: {query_type}. Affected tables: {tables}. Lock wait: {lock_wait}s.",
            "Database replication lag on {db_server}. Lag: {lag_seconds} seconds behind master. Replication status: {status}.",
            
            # Security alerts
            "SSL certificate expiring in {days} days for domain {domain}. Certificate expires: {expiry_date}. Issuer: {issuer}.",
            "Multiple failed login attempts detected. IP: {ip}. Failed attempts: {attempts} in {timeframe} minutes. Service: {service}.",
            "Unusual API access pattern: {service} receiving {requests} requests/minute from {ip}. Normal rate: {normal_rate} req/min.",
            
            # Network alerts
            "High network latency detected between {server1} and {server2}. Average latency: {latency}ms (normal: <{normal_latency}ms). Packet loss: {packet_loss}%.",
            "Network bandwidth utilization high on {server}. Inbound: {inbound}Mbps, Outbound: {outbound}Mbps. Interface: {interface}.",
            
            # CI/CD alerts
            "CI/CD pipeline failed: {service} build #{build_number} failed at {stage} step. Error: {error_message}. Branch: {branch}.",
            "Deployment stuck: {service} deployment to {environment} has been running for {duration} minutes. Status: {status}. Pods ready: {ready_pods}/{total_pods}."
        ]
        
        # Sample data for filling templates
        sample_data = {
            "server": ["prod-web-01", "prod-db-01", "prod-cache-01", "staging-web-01"],
            "service": ["user-service", "payment-api", "notification-worker", "auth-service", "analytics-service"],
            "cpu": [85, 92, 78, 95, 88],
            "memory": [76, 89, 82, 94, 71],
            "duration": [5, 8, 12, 3, 15],
            "version": ["2.1.3", "1.8.2", "3.0.1", "2.5.4"],
            "time_ago": ["2 hours ago", "30 minutes ago", "1 hour ago", "4 hours ago"],
            "timeout": [30, 45, 60, 20],
            "success_rate": [65, 78, 82, 55],
            "error_rate": [15, 25, 8, 32],
            "connections": [98, 100, 95, 100],
            "max_connections": [100, 100, 100, 100],
            "domain": ["api.company.com", "app.company.com", "auth.company.com"],
            "days": [7, 14, 3, 30],
            "latency": [250, 180, 320, 150],
            "normal_latency": [10, 15, 8, 12]
        }
        
        scenarios = []
        for template in alert_templates[:10]:  # Generate 10 scenarios
            # Fill template with random sample data
            filled = template
            for key, values in sample_data.items():
                if f"{{{key}}}" in filled:
                    filled = filled.replace(f"{{{key}}}", str(random.choice(values)))
            
            # Fill remaining placeholders with generic values
            remaining_placeholders = {
                "{swap}": "45",
                "{disk}": "87", 
                "{growth}": "2.3",
                "{log_size}": "15.2",
                "{backlog}": "5000",
                "{requests}": "15000", 
                "{error_type}": "500 Internal Server Error",
                "{last_success}": "8 minutes",
                "{wait_time}": "12",
                "{query_time}": "45",
                "{query_type}": "SELECT with JOIN",
                "{tables}": "users, payments",
                "{lock_wait}": "8",
                "{lag_seconds}": "120",
                "{status}": "DELAYED",
                "{expiry_date}": "2025-10-15",
                "{issuer}": "Let's Encrypt",
                "{ip}": "192.168.1.100",
                "{attempts}": "25",
                "{timeframe}": "10",
                "{normal_rate}": "50",
                "{server1}": "prod-web-01",
                "{server2}": "prod-db-01", 
                "{packet_loss}": "2",
                "{inbound}": "850",
                "{outbound}": "320",
                "{interface}": "eth0",
                "{build_number}": "342",
                "{stage}": "Docker build",
                "{error_message}": "'npm install' failed with exit code 1",
                "{branch}": "feature/payment-integration",
                "{environment}": "production",
                "{ready_pods}": "2",
                "{total_pods}": "3"
            }
            
            for placeholder, value in remaining_placeholders.items():
                filled = filled.replace(placeholder, value)
                
            scenarios.append(filled)
        
        return scenarios
    
    def generate_expert_response(self, alert: str) -> str:
        """Use Claude/GPT to generate expert response for an alert"""
        
        if not self.client:
            # Fallback: return a template response
            return self._generate_template_response(alert)
        
        prompt = f"""
{self.company_context}

An alert has been triggered:
"{alert}"

Provide a comprehensive response following the structured format. Include specific commands, service names, and troubleshooting steps relevant to the infrastructure described above.
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a senior DevOps engineer providing expert incident response guidance."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"❌ Error generating response: {e}")
            return self._generate_template_response(alert)
    
    def _generate_template_response(self, alert: str) -> str:
        """Generate a template response when API is not available"""
        return f"""This alert requires immediate investigation:

**Immediate Actions:**
1. Check system status and logs
2. Identify affected services  
3. Monitor key metrics
4. Consider scaling if needed

**Investigation:**
- Review recent changes and deployments
- Check application and system logs
- Monitor performance metrics
- Verify external dependencies

**Resolution:**
- Apply appropriate fixes based on findings
- Scale resources if capacity issue
- Restart services if necessary
- Monitor for stability

**Prevention:**
- Implement monitoring improvements
- Add automated responses where possible
- Document incident for future reference
- Review and update procedures

Note: This is a template response. For better results, configure with Claude/GPT API key."""
    
    def generate_training_dataset(self, num_examples: int = 20, output_file: str = "distilled_training_data.json") -> str:
        """Generate a complete training dataset using model distillation"""
        
        print(f"🧠 Generating {num_examples} training examples using {self.model} distillation...")
        
        scenarios = self.generate_alert_scenarios()
        training_data = {"alert_examples": []}
        
        categories = ["system", "application", "database", "security", "network", "cicd"]
        
        for i in range(num_examples):
            # Select scenario (cycle through available ones)
            scenario = scenarios[i % len(scenarios)]
            category = categories[i % len(categories)]
            
            print(f"📝 Generating example {i+1}/{num_examples} - Category: {category}")
            
            # Generate expert response using the teacher model
            expert_response = self.generate_expert_response(scenario)
            
            # Add to training data
            training_data["alert_examples"].append({
                "id": i + 1,
                "category": category,
                "alert": scenario,
                "expert_response": expert_response,
                "generated_by": self.model,
                "distillation": True
            })
            
            # Add delay to avoid rate limits
            if self.client:
                time.sleep(1)
        
        # Save to file
        with open(output_file, 'w') as f:
            json.dump(training_data, f, indent=2)
        
        print(f"✅ Generated {num_examples} examples using model distillation")
        print(f"📁 Saved to: {output_file}")
        print(f"🎯 Ready for fine-tuning!")
        
        return output_file

# Example usage
if __name__ == "__main__":
    import os
    
    # Option 1: Use with OpenAI API (requires API key)
    api_key = os.getenv("OPENAI_API_KEY")  # Set your API key in environment
    
    if api_key:
        print("🔑 Using OpenAI API for high-quality distillation")
        generator = AlertDistillationGenerator(api_key=api_key, model="gpt-4")
    else:
        print("⚠️  No API key found. Using template responses.")
        print("💡 Set OPENAI_API_KEY environment variable for better results")
        generator = AlertDistillationGenerator()
    
    # Generate training dataset
    output_file = generator.generate_training_dataset(
        num_examples=15,
        output_file="distilled_finetune_data.json"
    )
    
    print(f"\n🎯 Next steps:")
    print(f"1. Review generated data in {output_file}")
    print(f"2. Run: python3 json_to_training.py convert")  
    print(f"3. Run: python3 finetune_phi3.py")
    print(f"4. Enjoy your distilled Phi-3 Mini! 🚀")
