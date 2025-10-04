import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Brain,
  FileText,
  AlertTriangle,
  Tags,
  Hash
} from 'lucide-react';

const SaveResolutionModal = ({ isOpen, onClose, incident, onSuccess }) => {
  const [formData, setFormData] = useState({
    incidentId: '',
    title: '',
    description: '',
    service: '',
    rootCause: '',
    resolution: '',
    severity: 'medium',
    tags: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Pre-fill form when incident changes
  useEffect(() => {
    if (incident && isOpen) {
      setFormData({
        incidentId: incident.id || generateIncidentId(),
        title: incident.title || '',
        description: incident.description || '',
        service: incident.source || incident.location || 'system',
        rootCause: '',
        resolution: '',
        severity: mapSeverity(incident.severity) || 'medium',
        tags: ''
      });
    }
  }, [incident, isOpen]);

  // Generate a simple incident ID if none exists
  const generateIncidentId = () => {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  // Map incident severity to our dropdown values
  const mapSeverity = (incidentSeverity) => {
    if (!incidentSeverity) return 'medium';
    const severity = incidentSeverity.toLowerCase();
    if (severity.includes('crit')) return 'critical';
    if (severity.includes('high')) return 'high';
    if (severity.includes('low')) return 'low';
    return 'medium';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.incidentId.trim()) {
      setError('Incident ID is required');
      return false;
    }
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.service.trim()) {
      setError('Service is required');
      return false;
    }
    if (!formData.rootCause.trim()) {
      setError('Root Cause is required');
      return false;
    }
    if (!formData.resolution.trim()) {
      setError('Resolution is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        incident_id: formData.incidentId,
        title: formData.title,
        description: formData.description,
        service: formData.service,
        root_cause: formData.rootCause,
        resolution: formData.resolution,
        severity: formData.severity,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await fetch('http://localhost:8000/incidents/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resolution saved successfully:', result);

      // Show success message
      setShowSuccess(true);
      
      // Wait 2 seconds, then close modal
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (onSuccess) onSuccess(result);
      }, 2000);

    } catch (err) {
      console.error('Error saving resolution:', err);
      setError('Failed to save resolution. Please ensure the AI service is running on port 8000.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError('');
      setShowSuccess(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center">
            <Brain className="w-6 h-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Save Incident Resolution</h2>
              <p className="text-purple-100 text-sm">Log this resolution for AI learning</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mx-6 mt-6 bg-green-50 border-2 border-green-500 rounded-lg p-4 flex items-start">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-900 text-lg">✅ Saved Successfully!</h3>
              <p className="text-green-700 mt-1">
                AI will learn from this incident and improve future recommendations.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Incident ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Hash className="w-4 h-4 mr-2 text-gray-600" />
              Incident ID
            </label>
            <input
              type="text"
              name="incidentId"
              value={formData.incidentId}
              onChange={handleChange}
              placeholder="e.g., INC-2024-001 or auto-generated"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 placeholder-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-generated if not provided
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              Title <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief title of the incident"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              Description <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of what happened"
              required
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-gray-600" />
              Service <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="service"
              value={formData.service}
              onChange={handleChange}
              placeholder="e.g., API Server, Database, Frontend"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Root Cause */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
              Root Cause <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              name="rootCause"
              value={formData.rootCause}
              onChange={handleChange}
              placeholder="What was the underlying cause of this incident?"
              required
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none text-gray-900 placeholder-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Be specific - this helps AI understand similar issues in the future
            </p>
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Resolution <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              name="resolution"
              value={formData.resolution}
              onChange={handleChange}
              placeholder="How was this incident resolved? What steps were taken?"
              required
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none text-gray-900 placeholder-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Include step-by-step actions for future reference
            </p>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
              Severity <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white text-gray-900"
            >
              <option value="low">🟢 Low - Minor issue with minimal impact</option>
              <option value="medium">🟡 Medium - Moderate impact, some users affected</option>
              <option value="high">🟠 High - Significant impact, many users affected</option>
              <option value="critical">🔴 Critical - Severe impact, service down</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Tags className="w-4 h-4 mr-2 text-gray-600" />
              Tags <span className="text-gray-500 text-xs font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., database, timeout, memory-leak"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 placeholder-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Comma-separated tags for categorization
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Resolution
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveResolutionModal;
