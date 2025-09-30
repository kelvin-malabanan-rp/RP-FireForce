/**
 * Alert Data Extractor for Phi-3 Fine-tuning
 * Converts your real alert JSON to AI-friendly format
 */

class AlertExtractor {
    /**
     * Extract only the important fields that the AI needs
     * @param {Object} alertJson - Your full alert JSON
     * @returns {String} - Formatted alert for AI processing
     */
    static extractForAI(alertJson) {
        // Extract key fields for AI analysis
        const important = {
            title: alertJson.title || 'Unknown Alert',
            description: alertJson.description || '',
            severity: alertJson.severity || 'unknown',
            status: alertJson.status || 'open',
            source: alertJson.reported_by || 'Unknown Source',
            location: alertJson.location || 'Unknown Location',
            reason: alertJson.state_reason || '',
            timestamp: alertJson.timestamp || new Date().toISOString()
        };

        // Format as natural language for the AI
        return this.formatAlertForAI(important);
    }

    /**
     * Format extracted data as natural language
     * @param {Object} data - Extracted important fields
     * @returns {String} - Human-readable alert description
     */
    static formatAlertForAI(data) {
        let alert = `Alert: ${data.title}`;
        
        if (data.description && data.description !== data.title) {
            alert += ` - ${data.description}`;
        }
        
        alert += `\nSeverity: ${data.severity.toUpperCase()}`;
        alert += `\nSource: ${data.source}`;
        
        if (data.location && data.location !== 'Unknown Location') {
            alert += `\nLocation: ${data.location}`;
        }
        
        if (data.reason && data.reason !== data.description) {
            alert += `\nReason: ${data.reason}`;
        }
        
        alert += `\nStatus: ${data.status}`;
        
        return alert;
    }

    /**
     * Create training data format for fine-tuning
     * @param {Object} alertJson - Your alert JSON
     * @param {String} expertResponse - The expert response for this alert
     * @returns {Object} - Training format for fine-tuning
     */
    static createTrainingExample(alertJson, expertResponse) {
        const formattedAlert = this.extractForAI(alertJson);
        
        return {
            "messages": [
                {
                    "role": "user",
                    "content": formattedAlert
                },
                {
                    "role": "assistant",
                    "content": expertResponse
                }
            ]
        };
    }

    /**
     * Process multiple alerts for fine-tuning
     * @param {Array} alerts - Array of {alert: alertJson, response: expertResponse}
     * @returns {Array} - Array of training examples
     */
    static processAlertsForTraining(alerts) {
        return alerts.map(item => 
            this.createTrainingExample(item.alert, item.response)
        );
    }
}

// Example usage with your alert format
const exampleAlert = {
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
    "metric_name": null,
    "aws_console_url": "",
    "resolved_at": null,
    "created_at": "2025-09-27T20:44:02.061Z",
    "updated_at": "2025-09-27T20:44:02.061Z",
    "assigned_to": null,
    "resolved_by": null
};

// Demo: Extract for AI
console.log("🔍 AI-Ready Alert Format:");
console.log("=" * 40);
console.log(AlertExtractor.extractForAI(exampleAlert));
console.log("=" * 40);

// Demo: Create training example
const expertResponse = `This is a manual test alert with LOW severity from AWS CloudWatch in us-east-1.

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
- Document all manual test procedures`;

const trainingExample = AlertExtractor.createTrainingExample(exampleAlert, expertResponse);
console.log("\n📚 Training Example:");
console.log(JSON.stringify(trainingExample, null, 2));

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlertExtractor;
}

// For browsers
if (typeof window !== 'undefined') {
    window.AlertExtractor = AlertExtractor;
}
