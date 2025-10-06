import React, { useState } from 'react';
import { X, AlertTriangle, ArrowUp, Clock, User } from 'lucide-react';

export default function EscalateIncidentModal({ incident, onClose, onEscalate }) {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState(incident?.severity || 'critical');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for escalation');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onEscalate({
        teamId: incident.teamId || incident.team_id,
        incidentId: incident.id,
        reason: reason,
        priority: priority,
        currentLevel: incident.escalationLevel || incident.escalation_level || 1
      });
      
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to escalate incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'high', label: 'High Priority', color: 'orange', icon: '🟠' },
    { value: 'critical', label: 'Critical Priority', color: 'red', icon: '🔴' }
  ];

  const reasonSuggestions = [
    'Unable to resolve at current level',
    'Requires specialized expertise',
    'No response from primary on-call',
    'Incident severity has increased',
    'Executive/Management awareness required',
    'Multiple systems affected',
    'Customer-facing impact'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Escalate Incident</h2>
                <p className="text-orange-100 text-sm">
                  Alert next level on-call personnel
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Incident Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">Incident Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 font-semibold">Title:</span>{' '}
                <span className="text-gray-900 font-bold">{incident?.title}</span>
              </div>
              <div>
                <span className="text-gray-600 font-semibold">Current Severity:</span>{' '}
                <span className={`font-bold ${
                  incident?.severity === 'critical' ? 'text-red-600' :
                  incident?.severity === 'high' ? 'text-orange-600' :
                  'text-yellow-600'
                }`}>
                  {incident?.severity?.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-600 font-semibold">Current Level:</span>{' '}
                <span className="text-gray-900 font-bold">
                  Level {incident?.escalationLevel || incident?.escalation_level || 1}
                </span>
              </div>
              <div>
                <span className="text-gray-600 font-semibold">Time Elapsed:</span>{' '}
                <span className="text-gray-900 font-bold">
                  {incident?.timestamp ? 
                    Math.floor((Date.now() - new Date(incident.timestamp).getTime()) / 60000) + ' minutes' :
                    'Unknown'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Escalation Priority
            </label>
            <div className="grid grid-cols-2 gap-3">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                    priority === option.value
                      ? `bg-${option.color}-100 border-${option.color}-500 shadow-lg`
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-bold text-sm text-gray-900">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Reason for Escalation <span className="text-red-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this incident needs to be escalated..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500"
              rows="4"
              disabled={isSubmitting}
              required
            />
            
            {/* Quick Suggestions */}
            <div className="mt-2">
              <p className="text-xs text-gray-600 font-semibold mb-2">Quick suggestions (click to use):</p>
              <div className="flex flex-wrap gap-2">
                {reasonSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setReason(suggestion)}
                    className="px-3 py-1 bg-gray-100 text-gray-900 text-xs rounded-full hover:bg-gray-200 transition-colors font-semibold"
                    disabled={isSubmitting}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex gap-3">
            <ArrowUp className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-900 font-bold">Escalation Impact</p>
              <p className="text-sm text-orange-800 mt-1">
                This will immediately notify the <strong>next level on-call person</strong> with 
                an urgent alert. They will receive push notifications, emails, and SMS messages 
                (if configured). The incident will be marked as escalated in the audit trail.
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-bold mb-2">What happens next:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Next level on-call person receives urgent notification</li>
              <li>✅ Incident priority updated to {priority.toUpperCase()}</li>
              <li>✅ Escalation logged in audit trail</li>
              <li>✅ All stakeholders notified of escalation</li>
              <li>✅ Response time counter resets</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-bold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 font-bold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Escalating...
                </>
              ) : (
                <>
                  <ArrowUp className="w-5 h-5" />
                  Escalate to Level {(incident?.escalationLevel || incident?.escalation_level || 1) + 1}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
