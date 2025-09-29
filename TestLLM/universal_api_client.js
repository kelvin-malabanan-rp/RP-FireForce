/**
 * Universal Phi-3 Mini API Client
 * Works from any web project with proper error handling
 */

class UniversalPhi3Client {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Health check error:', error);
            return { 
                error: error.message, 
                status: 'unhealthy',
                suggestion: 'Make sure the API server is running on ' + this.baseUrl
            };
        }
    }

    async askQuestion(question, options = {}) {
        const {
            temperature = 0.7,
            maxLength = 512,
            timeout = 30000
        } = options;

        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`${this.baseUrl}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    temperature: temperature,
                    max_length: maxLength
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error('API request error:', error);
            
            // Provide helpful error messages
            let suggestion = '';
            if (error.name === 'AbortError') {
                suggestion = 'Request timed out. The AI might be processing a complex question.';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
                suggestion = `
Network Error: Cannot connect to your API at ${this.baseUrl}/ask. 

Possible solutions:
1. Make sure your AI API server is running
2. Check if your API supports CORS (Cross-Origin Resource Sharing)  
3. Verify the API URL is correct

Error details: ${error.message}`;
            } else {
                suggestion = `API Error: ${error.message}`;
            }

            return { 
                error: error.message,
                status: 'failed',
                suggestion: suggestion
            };
        }
    }

    // Convenience method with better error handling
    async analyzeAlert(alertMessage, options = {}) {
        // First check if API is healthy
        const health = await this.healthCheck();
        if (health.status !== 'healthy') {
            return {
                error: 'API is not healthy',
                status: 'failed',
                suggestion: 'Start your API server: cd backend && python3 main.py'
            };
        }

        // Then ask the question
        const result = await this.askQuestion(`Alert: ${alertMessage}`, options);
        
        if (result.status === 'success') {
            return {
                answer: result.answer,
                responseTime: result.response_time,
                status: 'success'
            };
        } else {
            return result; // Return error info
        }
    }

    // Test connection method
    async testConnection() {
        console.log('🔍 Testing connection to Phi-3 API...');
        console.log(`🌐 API URL: ${this.baseUrl}`);
        
        const health = await this.healthCheck();
        
        if (health.status === 'healthy') {
            console.log('✅ API is healthy and ready!');
            console.log(`📊 Model: ${health.model}`);
            console.log(`🧠 Model loaded: ${health.model_loaded}`);
            
            // Test a simple question
            console.log('🧪 Testing with a simple question...');
            const testResult = await this.askQuestion('What is 2+2?', { maxLength: 50 });
            
            if (testResult.status === 'success') {
                console.log('✅ API test successful!');
                console.log(`⏱️  Response time: ${testResult.response_time}s`);
                return true;
            } else {
                console.log('❌ API test failed:', testResult.error);
                return false;
            }
        } else {
            console.log('❌ API is not healthy:', health.error);
            console.log('💡 Suggestion:', health.suggestion);
            return false;
        }
    }
}

// Usage Examples
async function exampleUsage() {
    const api = new UniversalPhi3Client();
    
    // Test connection first
    const isWorking = await api.testConnection();
    
    if (!isWorking) {
        console.log('❌ Cannot proceed - API is not working');
        return;
    }
    
    // Example alert analysis
    const alerts = [
        'High CPU usage on prod-server-01, 95% for 10 minutes',
        'Database connection timeout errors increasing',
        'SSL certificate expires in 3 days'
    ];
    
    for (const alert of alerts) {
        console.log(`\n🚨 Testing alert: ${alert}`);
        const result = await api.analyzeAlert(alert, { temperature: 0.5 });
        
        if (result.status === 'success') {
            console.log(`💡 Response: ${result.answer.substring(0, 100)}...`);
            console.log(`⏱️  Time: ${result.responseTime}s`);
        } else {
            console.log(`❌ Error: ${result.error}`);
            console.log(`💡 Suggestion: ${result.suggestion}`);
        }
    }
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalPhi3Client;
}

// For browsers
if (typeof window !== 'undefined') {
    window.UniversalPhi3Client = UniversalPhi3Client;
    
    // Auto-test connection when loaded in browser
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 Universal Phi-3 Client loaded');
        console.log('💡 Usage: const api = new UniversalPhi3Client();');
        console.log('💡 Test: api.testConnection();');
    });
}
