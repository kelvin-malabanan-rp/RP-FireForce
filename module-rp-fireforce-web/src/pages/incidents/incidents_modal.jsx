import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  User, 
  MapPin, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  ArrowUp,
  Bot,
  MessageSquare,
  Database,
  Server,
  Activity,
  Brain,
  Loader2,
  TrendingUp,
  Shield,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

const IncidentsModal = ({ incident, isOpen, onClose }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [showAiResponse, setShowAiResponse] = useState(false);

  if (!isOpen || !incident) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-900 border-red-200';
      case 'Investigating': return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Resolved': return 'bg-green-100 text-green-900 border-green-200';
      case 'Escalated': return 'bg-purple-100 text-purple-900 border-purple-200';
      default: return 'bg-gray-100 text-gray-900 border-gray-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return <AlertCircle className="w-5 h-5" />;
      case 'Investigating': return <Eye className="w-5 h-5" />;
      case 'Resolved': return <CheckCircle className="w-5 h-5" />;
      case 'Escalated': return <ArrowUp className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const handleAskAI = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setShowAiResponse(false);
    
    try {
      // Prepare the alert data from the incident
      const alertData = `
Incident: ${incident.title}
Description: ${incident.description}
Source: ${incident.source || 'Unknown'}
Location: ${incident.location || 'Unknown'}
AWS Alarm: ${incident.awsAlarmName || 'N/A'}
Status: ${incident.status}
Created: ${incident.created}
${incident.awsAccountId ? `AWS Account: ${incident.awsAccountId}` : ''}
      `.trim();

      const response = await fetch('http://localhost:8001/complete-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert_data: alertData,
          severity: incident.severity?.toLowerCase() || 'medium'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const aiData = await response.json();
      setAiResponse(aiData);
      setShowAiResponse(true);
    } catch (error) {
      console.error('Error calling AI API:', error);
      setAiError('Failed to get AI analysis. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatAnalysis = (analysis) => {
    // Split by **SECTION** headers and format
    const sections = analysis.split(/\*\*(.*?)\*\*/g);
    return sections.map((section, index) => {
      if (index % 2 === 1) {
        // This is a header
        return (
          <h3 key={index} className="text-lg font-bold text-gray-900 mt-4 mb-2 flex items-center">
            {section.includes('RISK') && <Shield className="w-5 h-5 mr-2 text-red-500" />}
            {section.includes('ACTION') && <Zap className="w-5 h-5 mr-2 text-orange-500" />}
            {section.includes('IMPACT') && <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />}
            {section}
          </h3>
        );
      } else {
        // This is content
        return (
          <div key={index} className="text-gray-700 leading-relaxed mb-3">
            {section.split('\n').map((line, lineIndex) => {
              if (line.trim().startsWith('- ')) {
                return (
                  <div key={lineIndex} className="flex items-start mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{line.substring(2)}</span>
                  </div>
                );
              }
              return line.trim() ? <p key={lineIndex} className="mb-2">{line}</p> : null;
            })}
          </div>
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Incident Details</h2>
              <p className="text-gray-600">ID: {incident.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Status and Severity */}
          <div className="flex flex-wrap items-center gap-4">
            <div className={`flex items-center px-4 py-2 rounded-full border ${getStatusColor(incident.status)}`}>
              {getStatusIcon(incident.status)}
              <span className="ml-2 font-semibold">{incident.status}</span>
            </div>
            <div className={`px-4 py-2 rounded-full font-semibold ${getSeverityColor(incident.severity)}`}>
              {incident.severity} Priority
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{incident.title}</h3>
              <p className="text-gray-700 leading-relaxed">{incident.description}</p>
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Assignment & Reporting
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned to:</span>
                  <span className="font-medium text-gray-900">{incident.assignee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reported by:</span>
                  <span className="font-medium text-gray-900">{incident.reporter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Source:</span>
                  <span className="font-medium text-gray-900">{incident.source}</span>
                </div>
                {incident.resolvedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved by:</span>
                    <span className="font-medium text-gray-900">{incident.resolvedBy}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Timeline
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">{incident.created}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last updated:</span>
                  <span className="font-medium text-gray-900">{incident.updated}</span>
                </div>
                {incident.resolved && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolved:</span>
                    <span className="font-medium text-gray-900">{incident.resolved}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location and AWS Details */}
          {(incident.location || incident.awsAlarmName || incident.awsAccountId) && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Server className="w-5 h-5 mr-2 text-blue-600" />
                System Information
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {incident.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Location:
                    </span>
                    <span className="font-medium text-gray-900">{incident.location}</span>
                  </div>
                )}
                {incident.awsAlarmName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Database className="w-4 h-4 mr-1" />
                      AWS Alarm:
                    </span>
                    <span className="font-medium text-gray-900">{incident.awsAlarmName}</span>
                  </div>
                )}
                {incident.awsAccountId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">AWS Account ID:</span>
                    <span className="font-medium text-gray-900">{incident.awsAccountId}</span>
                  </div>
                )}
                {incident.awsConsoleUrl && (
                  <div className="pt-2 border-t border-gray-200">
                    <a
                      href={incident.awsConsoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in AWS Console
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Ask AI Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              AI Analysis & Recommendations
            </h4>
            
            {!showAiResponse ? (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">Get Intelligent Analysis</h5>
                    <p className="text-gray-700 text-sm">
                      Get AI-powered risk assessment, impact analysis, and actionable recommendations for resolving this incident.
                    </p>
                  </div>
                  <button
                    onClick={handleAskAI}
                    disabled={isAiLoading}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-purple-400 transition-colors font-medium flex items-center space-x-2"
                  >
                    {isAiLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                    <span>{isAiLoading ? 'Analyzing...' : 'Ask AI'}</span>
                  </button>
                </div>
                
                {aiError && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{aiError}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* AI Response Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-6 h-6" />
                      <div>
                        <h5 className="font-bold">AI Analysis Complete</h5>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAiResponse(false)}
                      className="text-purple-200 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* AI Analysis Content */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="prose max-w-none">
                    {formatAnalysis(aiResponse.analysis)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleAskAI}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-2"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Re-analyze</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Additional Metrics */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Additional Details
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Priority Level:</span>
                <span className="font-medium text-gray-900">P{incident.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Incident Type:</span>
                <span className="font-medium text-gray-900">System Alert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Edit Incident
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentsModal;
