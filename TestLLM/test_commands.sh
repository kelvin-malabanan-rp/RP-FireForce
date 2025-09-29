#!/bin/bash
# Phi-3 Mini API Test Commands
# Copy and paste these commands to test your API

echo "🚀 Phi-3 Mini API Test Commands"
echo "================================="

# 1. Health Check
echo "1️⃣  Health Check:"
echo "curl -s http://localhost:8000/health | python3 -m json.tool"
echo

# 2. Root endpoint
echo "2️⃣  Root Info:"
echo "curl -s http://localhost:8000/"
echo

# 3. Simple question
echo "3️⃣  Simple Alert Question:"
echo 'curl -X POST "http://localhost:8000/ask" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"question": "High CPU usage detected. What should I check?"}'"'"' \'
echo '  | python3 -m json.tool'
echo

# 4. Complex alert with parameters
echo "4️⃣  Complex Alert with Parameters:"
echo 'curl -X POST "http://localhost:8000/ask" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
echo '    "question": "Alert: Database connection pool exhausted on prod-db-01. Active connections: 100/100. Application: payment-api. Error rate: 15% in last 5 minutes.",
echo '    "temperature": 0.5,
echo '    "max_length": 300
echo '  }'"'"' \'
echo '  | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'"'"'Answer: {data[\"answer\"]}\nTime: {data[\"response_time\"]}s'"'"')"'
echo

# 5. Network alert
echo "5️⃣  Network Latency Alert:"
echo 'curl -X POST "http://localhost:8000/ask" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"question": "Network latency between servers increased to 250ms. Packet loss: 2%. What to investigate?"}'"'"' \'
echo '  | python3 -m json.tool'
echo

# 6. SSL Certificate alert
echo "6️⃣  SSL Certificate Alert:"
echo 'curl -X POST "http://localhost:8000/ask" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"question": "SSL certificate expiring in 7 days for api.company.com. What steps should I take?"}'"'"
echo

echo "================================="
echo "💡 Pro Tips:"
echo "- Use temperature 0.3-0.5 for more focused responses"
echo "- Use temperature 0.7-0.9 for more creative responses"
echo "- Adjust max_length to control response size"
echo "- Always check response_time to monitor performance"
echo "================================="
