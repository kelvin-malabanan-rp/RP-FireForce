/**
 * Phi-3 Mini API Client for Node.js/JavaScript
 * How to call your API from JavaScript projects
 */

// For Node.js - install with: npm install node-fetch
// const fetch = require('node-fetch');

// For browsers - use built-in fetch

class Phi3AlertAPI {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return await response.json();
        } catch (error) {
            return { error: error.message, status: 'unhealthy' };
        }
    }

    async askQuestion(question, temperature = 0.7, maxLength = 512) {
        try {
            const response = await fetch(`${this.baseUrl}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    temperature: temperature,
                    max_length: maxLength
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            return { error: error.message, status: 'failed' };
        }
    }

    async analyzeAlert(alertMessage) {
        const result = await this.askQuestion(`Alert: ${alertMessage}`);
        
        if (result.status === 'success') {
            return result.answer;
        } else {
            return `Error: ${result.error || 'Unknown error'}`;
        }
    }
}

// Usage Examples
async function main() {
    const api = new Phi3AlertAPI();
    
    // 1. Check API health
    console.log('🔍 Checking API health...');
    const health = await api.healthCheck();
    console.log('Status:', health);
    console.log();

    if (health.status !== 'healthy') {
        console.log('❌ API is not healthy. Make sure the server is running!');
        return;
    }

    // 2. Test alert analysis
    const alerts = [
        'High memory usage on web-server-01, 96% utilized',
        'Database query timeout on prod-mysql-01',
        'Disk space critical: 95% full on /var/log',
        'Network latency spike: 500ms average response time'
    ];

    for (let i = 0; i < alerts.length; i++) {
        const alert = alerts[i];
        console.log(`🚨 Alert ${i + 1}: ${alert}`);
        console.log('-'.repeat(50));

        const response = await api.askQuestion(alert, 0.5, 200);
        
        if (response.status === 'success') {
            console.log(`💡 Response: ${response.answer.substring(0, 200)}...`);
            console.log(`⏱️  Time: ${response.response_time}s`);
        } else {
            console.log(`❌ Error: ${response.error}`);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Phi3AlertAPI;
    
    // Run examples if this file is executed directly
    if (require.main === module) {
        main().catch(console.error);
    }
}

// For browsers - attach to window
if (typeof window !== 'undefined') {
    window.Phi3AlertAPI = Phi3AlertAPI;
}
