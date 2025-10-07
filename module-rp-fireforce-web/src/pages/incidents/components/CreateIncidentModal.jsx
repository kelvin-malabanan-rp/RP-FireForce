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
    notificationMode: 'automatic', // 'automatic' or 'manual'
  });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [emergencyUsers, setEmergencyUsers] = useState([]); // Users with push token info
  const [onCallTeam, setOnCallTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingEmergency, setIsLoadingEmergency] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Personnel Selection

  const API_BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

  // Fetch on-call team and all available team members
  useEffect(() => {
    if (isOpen) {
      fetchOnCallTeam();
      fetchAllTeamMembers();
      // Clear any previously selected users when modal opens
      setSelectedUsers([]);
      setEmergencyUsers([]);
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

  const handleNotificationModeChange = (mode) => {
    setFormData(prev => ({ ...prev, notificationMode: mode }));
    setSelectedUsers([]); // Clear selection when switching modes
    setEmergencyUsers([]);
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

  // Fetch emergency override users when proceeding to step 2 in manual mode
  const fetchEmergencyUsers = async () => {
    if (formData.notificationMode !== 'manual' || selectedUsers.length === 0) {
      return;
    }

    try {
      setIsLoadingEmergency(true);
      const selectedEmails = availableUsers
        .filter(u => selectedUsers.includes(u.id))
        .map(u => u.email);

      const response = await fetch(`${API_BASE_URL}/api/users/emergency-override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: selectedEmails })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch emergency override users');
      }

      const data = await response.json();
      if (data.httpStatus === 'OK' && data.data) {
        setEmergencyUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching emergency users:', error);
      setError('Failed to load emergency override user details');
    } finally {
      setIsLoadingEmergency(false);
    }
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
    if (formData.notificationMode === 'manual' && selectedUsers.length === 0) {
      setError('Please select at least one person to notify');
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
      let reportedBy = 'admin@rocketpartners.io';
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          reportedBy = user.email || user.username || 'admin@rocketpartners.io';
        }
      } catch (e) {
        console.warn('Could not parse user from localStorage, using fallback:', e);
      }

      // Build incident data
      const incidentData = {
        title: String(formData.title || '').trim(),
        description: String(formData.description || '').trim(),
        severity: formData.severity || 'medium',
        location: formData.location ? String(formData.location).trim() : null,
        reportedBy: String(reportedBy).trim() || 'admin@rocketpartners.io',
      };

      // Validate required fields
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

      // Add selected users if manual mode
      if (formData.notificationMode === 'manual' && selectedUsers.length > 0) {
        incidentData.notify_users = selectedUsers;
      }

      console.log('Creating incident:', {
        ...incidentData,
        notificationMode: formData.notificationMode,
        selectedUserCount: selectedUsers.length
      });

      const response = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create incident';
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          const errorText = await response.text().catch(() => '');
          console.error('Error response (text):', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Success response:', result);

      if (result.httpStatus === 'OK' && result.data) {
        // Success notification with detailed info
        let successMessage = 'Incident created successfully!\n\n';
        
        if (formData.notificationMode === 'manual') {
          const notifiedUsers = emergencyUsers.length > 0 ? emergencyUsers : availableUsers.filter(u => selectedUsers.includes(u.id));
          const usersWithTokens = notifiedUsers.filter(u => u.pushToken || u.pushTokenId);
          
          successMessage += `📱 Push notifications sent to ${usersWithTokens.length} of ${selectedUsers.length} selected personnel:\n`;
          usersWithTokens.forEach(u => {
            successMessage += `  ✓ ${u.firstName} ${u.lastName}\n`;
          });
          
          if (usersWithTokens.length < selectedUsers.length) {
            successMessage += `\n⚠️ ${selectedUsers.length - usersWithTokens.length} personnel have no registered push tokens`;
          }
        } else {
          const onCallCount = onCallTeam?.primary ? 1 : 0 + (onCallTeam?.backup ? 1 : 0) + (onCallTeam?.escalation?.length || 0);
          successMessage += `📱 Push notifications sent to ${onCallCount} on-call personnel`;
        }
        
        alert(successMessage);
        
        // Dispatch custom event to notify the incident badge
        window.dispatchEvent(new CustomEvent('incidentCreated', { 
          detail: { incident: result.data } 
        }));
        
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
      notificationMode: 'automatic',
    });
    setSelectedUsers([]);
    setEmergencyUsers([]);
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
                    {currentStep === 1 ? 'Step 1: Incident Details' : 'Step 2: Personnel Notification'}
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
                <span className="font-medium">Personnel</span>
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
                  <label className="block text-sm font-semibold text-black mb-2">
                    Incident Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief description of the incident"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-700 text-black"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description of the incident"
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder-gray-700 text-black"
                    required
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
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
                  <label className="block text-sm font-semibold text-black mb-2">
                    Location <span className="text-black text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Service, server, or location"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-700 text-black"
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
              /* Step 2: Personnel Selection */
              <div className="space-y-6">
                {/* Notification Mode - Radio Buttons */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Notification Mode
                  </label>
                  
                  <div className="space-y-3">
                    {/* Automatic Rotation Option */}
                    <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50"
                           style={{ borderColor: formData.notificationMode === 'automatic' ? '#4F46E5' : '#E5E7EB', backgroundColor: formData.notificationMode === 'automatic' ? '#EEF2FF' : 'white' }}>
                      <input
                        type="radio"
                        name="notificationMode"
                        value="automatic"
                        checked={formData.notificationMode === 'automatic'}
                        onChange={() => handleNotificationModeChange('automatic')}
                        className="mt-1 w-5 h-5 text-indigo-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-gray-900">Automatic Rotation</span>
                        </div>
                        <p className="text-sm text-black mt-1">
                          Notify current on-call team members automatically based on the rotation schedule
                        </p>
                      </div>
                    </label>

                    {/* Manual Personnel Selection Option */}
                    <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-orange-300 hover:bg-orange-50"
                           style={{ borderColor: formData.notificationMode === 'manual' ? '#F97316' : '#E5E7EB', backgroundColor: formData.notificationMode === 'manual' ? '#FFF7ED' : 'white' }}>
                      <input
                        type="radio"
                        name="notificationMode"
                        value="manual"
                        checked={formData.notificationMode === 'manual'}
                        onChange={() => handleNotificationModeChange('manual')}
                        className="mt-1 w-5 h-5 text-orange-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-orange-600" />
                          <span className="font-semibold text-gray-900">Manual Personnel Selection</span>
                        </div>
                        <p className="text-sm text-black mt-1">
                          Select specific personnel to notify regardless of on-call schedule
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* On-Call Team Display (for automatic mode) */}
                {formData.notificationMode === 'automatic' && (
                  <OnCallTeamDisplay 
                    teamData={onCallTeam} 
                    loading={isLoadingTeams}
                    teamName="Platform Engineering"
                  />
                )}

                {/* Personnel Selector (for manual mode) */}
                {formData.notificationMode === 'manual' && (
                  <TeamMemberSelector
                    availableUsers={availableUsers}
                    selectedUsers={selectedUsers}
                    onToggleUser={handleToggleUser}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                  />
                )}

                {/* Notification Preview */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-5">
                  <div className="flex items-start space-x-3">
                    <Bell className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-indigo-900 mb-2">
                        📱 Push Notifications Will Be Sent To:
                      </h3>
                      
                      {formData.notificationMode === 'manual' ? (
                        // Manual mode - show selected users
                        selectedUsers.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-indigo-700 font-medium">
                              {selectedUsers.length} selected personnel:
                            </p>
                            <div className="bg-white rounded-lg p-3 max-h-40 overflow-y-auto">
                              <ul className="space-y-2">
                                {selectedUsers.map(userId => {
                                  const user = availableUsers.find(u => u.id === userId);
                                  return user ? (
                                    <li key={userId} className="flex items-center space-x-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="font-medium text-black">
                                        {user.firstName} {user.lastName}
                                      </span>
                                      <span className="text-black">({user.email})</span>
                                    </li>
                                  ) : null;
                                })}
                              </ul>
                            </div>
                            <p className="text-xs text-indigo-600 italic mt-2">
                              💡 Only these selected personnel will receive push notifications
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                              ⚠️ No personnel selected. Please select at least one person to notify.
                            </p>
                          </div>
                        )
                      ) : (
                        // Automatic mode - show on-call team
                        onCallTeam ? (
                          <div className="space-y-2">
                            <p className="text-sm text-indigo-700 font-medium">
                              Current on-call team:
                            </p>
                            <div className="bg-white rounded-lg p-3">
                              <ul className="space-y-2">
                                {onCallTeam.primary && (
                                  <li className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-black">
                                      {onCallTeam.primary.firstName} {onCallTeam.primary.lastName}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">
                                      Primary
                                    </span>
                                  </li>
                                )}
                                {onCallTeam.backup && (
                                  <li className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-black">
                                      {onCallTeam.backup.firstName} {onCallTeam.backup.lastName}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                                      Backup
                                    </span>
                                  </li>
                                )}
                                {onCallTeam.escalation && onCallTeam.escalation.map((member, idx) => (
                                  <li key={idx} className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-black">
                                      {member.firstName} {member.lastName}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                                      Escalation
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <p className="text-xs text-indigo-600 italic mt-2">
                              💡 All current on-call members will receive push notifications
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                              ⚠️ No on-call team found.
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
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
                    className="px-6 py-2 border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
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
                    <span>Next: Select Personnel</span>
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
