import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  Send, 
  Loader2,
  Users,
  Bell,
  BellOff,
  CheckCircle,
  Info
} from 'lucide-react';
import OnCallTeamDisplay from './OnCallTeamDisplay';
import TeamMemberSelector from './TeamMemberSelector';

const CreateIncidentModal = ({ isOpen, onClose, onIncidentCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    location: '',
    bypassRotation: false,
  });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [onCallTeam, setOnCallTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Team Selection

  const API_BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

  // Fetch on-call team and all available team members
  useEffect(() => {
    if (isOpen) {
      fetchOnCallTeam();
      fetchAllTeamMembers();
      // Clear any previously selected users when modal opens
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const fetchOnCallTeam = async () => {
    try {
      setIsLoadingTeams(true);
      // Default to team-1, you can make this dynamic based on user preference
      const response = await fetch(`${API_BASE_URL}/api/oncall/current?teamId=team-1`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch on-call team');
      }

      const data = await response.json();
      
      if (data.success && data.object) {
        setOnCallTeam(data.object);
      }
    } catch (error) {
      console.error('Error fetching on-call team:', error);
      setError('Failed to load on-call team data');
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchAllTeamMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/oncall/teams`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      
      if (data.success && data.object) {
        // Flatten all team members from all teams
        const allMembers = [];
        data.object.forEach(team => {
          team.members.forEach(member => {
            // Avoid duplicates
            if (!allMembers.find(m => m.id === member.id)) {
              allMembers.push({
                id: member.id,
                email: member.email,
                firstName: member.firstName,
                lastName: member.lastName,
                role: member.role
              });
            }
          });
        });
        
        setAvailableUsers(allMembers);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggleUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(availableUsers.map(user => user.id));
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter an incident title');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please enter an incident description');
      return false;
    }
    if (formData.bypassRotation && selectedUsers.length === 0) {
      setError('Please select at least one team member to notify');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get user info from localStorage
      let reportedBy = 'admin@rocketpartners.io'; // Fallback to a known valid email
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          // Use email from localStorage if available
          // Backend validates this email exists in database
          reportedBy = user.email || user.username || 'admin@rocketpartners.io';
          console.log('User from localStorage:', user);
          console.log('Using reportedBy email:', reportedBy);
        }
      } catch (e) {
        console.warn('Could not parse user from localStorage, using fallback:', e);
      }

      // Ensure all required fields are strings (backend calls .trim() without checking)
      const incidentData = {
        title: String(formData.title || '').trim(),
        description: String(formData.description || '').trim(),
        severity: formData.severity || 'medium',
        location: formData.location ? String(formData.location).trim() : null,
        reportedBy: String(reportedBy).trim() || 'admin@rocketpartners.io',
      };

      // Validate that required fields are not empty after trimming
      if (!incidentData.title) {
        setError('Title is required');
        setIsLoading(false);
        return;
      }

      if (!incidentData.description) {
        setError('Description is required');
        setIsLoading(false);
        return;
      }

      if (!incidentData.reportedBy || incidentData.reportedBy === '') {
        incidentData.reportedBy = 'Web User';
      }

      // Add selected users if bypassing rotation
      if (formData.bypassRotation && selectedUsers.length > 0) {
        // Validate that all selected users exist in availableUsers
        const validUserIds = availableUsers.map(u => u.id);
        const invalidUsers = selectedUsers.filter(id => !validUserIds.includes(id));
        
        if (invalidUsers.length > 0) {
          console.error('Invalid user IDs selected:', invalidUsers);
          setError(`Invalid users selected: ${invalidUsers.join(', ')}. Please refresh and try again.`);
          setIsLoading(false);
          return;
        }
        
        incidentData.notify_users = selectedUsers;
      }

      console.log('Creating incident with data:', JSON.stringify(incidentData, null, 2));
      console.log('Bypass rotation enabled:', formData.bypassRotation);
      console.log('Selected users count:', selectedUsers.length);
      if (formData.bypassRotation) {
        console.log('Selected user IDs:', selectedUsers);
        console.log('Available user IDs:', availableUsers.map(u => u.id));
      }

      const response = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error details
        let errorMessage = 'Failed to create incident';
        try {
          const errorData = await response.json();
          console.error('Error response (JSON):', JSON.stringify(errorData, null, 2));
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            console.error('Error response (text):', errorText);
            errorMessage = errorText || errorMessage;
          } catch (e2) {
            console.error('Could not parse error response');
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Success response:', result);

      if (result.httpStatus === 'OK' && result.data) {
        // Success notification
        const notifyCount = formData.bypassRotation 
          ? selectedUsers.length 
          : 'on-call team members';
        
        // Show success message
        alert(`Incident created successfully! ${notifyCount} team member(s) will be notified.`);
        
        // Callback to parent to refresh incidents list
        if (onIncidentCreated) {
          onIncidentCreated(result.data);
        }
        
        // Reset form and close modal
        handleClose();
      } else {
        console.error('Unexpected response format:', result);
        throw new Error(result.message || 'Unexpected response format');
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      setError(error.message || 'Failed to create incident. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      location: '',
      bypassRotation: false,
    });
    setSelectedUsers([]);
    setError('');
    setCurrentStep(1);
    onClose();
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 hover:bg-red-600 border-red-600';
      case 'high': return 'bg-orange-500 hover:bg-orange-600 border-orange-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600';
      case 'low': return 'bg-blue-500 hover:bg-blue-600 border-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600 border-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create New Incident</h2>
                  <p className="text-sm text-indigo-100">
                    {currentStep === 1 ? 'Step 1: Incident Details' : 'Step 2: Team Notification'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="bg-gray-100 px-6 py-3">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <span className="font-medium">Details</span>
              </div>
              <div className="w-16 h-1 bg-gray-300"></div>
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <span className="font-medium">Team</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {currentStep === 1 ? (
              /* Step 1: Incident Form */
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Incident Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief description of the incident"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description of the incident"
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Severity Level
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {['low', 'medium', 'high', 'critical'].map((severity) => (
                      <button
                        key={severity}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, severity }))}
                        className={`px-4 py-3 rounded-lg font-medium text-white border-2 transition-all ${
                          formData.severity === severity
                            ? getSeverityColor(severity) + ' ring-2 ring-offset-2 ring-indigo-500'
                            : 'bg-gray-300 border-gray-300 hover:bg-gray-400'
                        }`}
                      >
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Service, server, or location"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Default Notification Behavior:</p>
                      <p className="text-blue-700">
                        By default, the current on-call team will be automatically notified. 
                        You can manually select specific team members in the next step if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2: Team Selection */
              <div className="space-y-6">
                {/* On-Call Team Display */}
                <OnCallTeamDisplay 
                  teamData={onCallTeam} 
                  loading={isLoadingTeams}
                  teamName="Platform Engineering"
                />

                {/* Manual Override Toggle */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center space-x-3">
                      {formData.bypassRotation ? (
                        <BellOff className="w-6 h-6 text-orange-600" />
                      ) : (
                        <Bell className="w-6 h-6 text-green-600" />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">
                          {formData.bypassRotation ? 'Manual Team Selection' : 'Automatic Rotation'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formData.bypassRotation 
                            ? 'Select specific team members to notify' 
                            : 'Notify the current on-call team automatically'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      name="bypassRotation"
                      checked={formData.bypassRotation}
                      onChange={handleInputChange}
                      className="w-6 h-6 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </label>
                </div>

                {/* Team Member Selector (only if bypassRotation is true) */}
                {formData.bypassRotation && (
                  <TeamMemberSelector
                    availableUsers={availableUsers}
                    selectedUsers={selectedUsers}
                    onToggleUser={handleToggleUser}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {currentStep === 1 ? (
                <>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (validateForm()) {
                        setCurrentStep(2);
                      }
                    }}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Next: Select Team</span>
                    <Users className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Create Incident</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateIncidentModal;
