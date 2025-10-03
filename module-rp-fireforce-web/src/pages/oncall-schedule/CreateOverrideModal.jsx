import React, { useState } from 'react';
import { X, Calendar, Clock, User, AlertCircle } from 'lucide-react';

const CreateOverrideModal = ({ isOpen, onClose, teams, onSubmit }) => {
  const [formData, setFormData] = useState({
    teamId: '',
    startTime: '',
    endTime: '',
    userId: '',
    role: 'primary',
    reason: '',
    originalUserId: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.teamId) newErrors.teamId = 'Team is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.userId) newErrors.userId = 'Replacement user is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    
    // Validate end time is after start time
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        teamId: '',
        startTime: '',
        endTime: '',
        userId: '',
        role: 'primary',
        reason: '',
        originalUserId: ''
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create override' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTeam = teams.find(t => t.id === formData.teamId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Schedule Override</h2>
              <p className="text-sm text-gray-600">Temporarily replace an on-call assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Team Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Team *
            </label>
            <select
              value={formData.teamId}
              onChange={(e) => handleChange('teamId', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.teamId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.timezone})
                </option>
              ))}
            </select>
            {errors.teamId && (
              <p className="text-sm text-red-600 mt-1">{errors.teamId}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="primary">Primary</option>
              <option value="backup">Backup</option>
              <option value="escalation">Escalation</option>
            </select>
          </div>

          {/* Replacement User */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Replacement User *
            </label>
            <select
              value={formData.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.userId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={!selectedTeam}
            >
              <option value="">Select replacement user...</option>
              {selectedTeam?.members?.map(member => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} - {member.role}
                </option>
              ))}
            </select>
            {errors.userId && (
              <p className="text-sm text-red-600 mt-1">{errors.userId}</p>
            )}
          </div>

          {/* Original User (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Original User (Optional)
            </label>
            <select
              value={formData.originalUserId}
              onChange={(e) => handleChange('originalUserId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedTeam}
            >
              <option value="">None specified...</option>
              {selectedTeam?.members?.map(member => (
                <option key={member.id} value={member.id}>
                  {member.firstName} {member.lastName} - {member.role}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Who is being replaced (if applicable)
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 mt-1">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Reason *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              placeholder="e.g., Vacation coverage, Emergency replacement, Shift swap"
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.reason && (
              <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOverrideModal;
