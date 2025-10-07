import React, { useState, useEffect } from 'react';
import AlertManager from './components/AlertManager';
import { 
  Settings, 
  Shield, 
  Bell, 
  User,
  Mail,
  Phone,
  MapPin,
  Key,
  Eye,
  EyeOff,
  Camera,
  Save,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  UserCheck,
  Database,
  Wifi,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  Calendar,
  Clock,
  Target,
  Zap
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Account settings state
  const [accountData, setAccountData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phoneNumber: '',
    role: '',
    isActive: true,
    isVerified: false,
    lastLogin: null,
    createdAt: '',
    updatedAt: '',
    // Additional fields for UI
    location: '',
    timezone: 'America/New_York',
    department: '',
    jobTitle: '',
    avatar: ''
  });

  // Get current user ID from localStorage or props
  const getCurrentUserId = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      return userData.id;
    }
    return 'user-1'; // fallback
  };
  
  const [currentUserId] = useState(getCurrentUserId());

  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    pushNotifications: true,
    weekendAlerts: false,
    escalationAlerts: true,
    maintenanceAlerts: true,
    soundEnabled: true,
    desktopNotifications: true
  });

  // Security settings state
  const [security, setSecurity] = useState({
    twoFactorAuth: true,
    sessionTimeout: '30',
    loginAlerts: true,
    deviceTrust: false,
    passwordExpiry: '90',
    loginHistory: true
  });

  // System settings state
  const [system, setSystem] = useState({
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    autoRefresh: true,
    compactMode: false,
    showTooltips: true,
    animationsEnabled: true
  });

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Settings }
  ];

  const handleAccountChange = (field, value) => {
    setAccountData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleNotificationChange = (field) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
    setIsDirty(true);
  };

  const handleSecurityChange = (field, value) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSystemChange = (field, value) => {
    setSystem(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Fetch user data from API
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`https://incident-webhook-api.rapidresponse.workers.dev/api/users/by-id?userId=${currentUserId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.httpStatus === 'OK' && result.data) {
        const currentUser = result.data;
        
        // Generate avatar initials
        const avatar = `${currentUser.firstName?.charAt(0) || ''}${currentUser.lastName?.charAt(0) || ''}`.toUpperCase();
        
        // Map department and job title based on role
        const getDepartment = (role) => {
          switch (role?.toLowerCase()) {
            case 'admin': return 'Administration';
            case 'operator': return 'Operations';
            case 'viewer': return 'Support';
            case 'manager': return 'Management';
            case 'lead': return 'Engineering';
            default: return 'Infrastructure';
          }
        };

        const getJobTitle = (role) => {
          switch (role?.toLowerCase()) {
            case 'admin': return 'System Administrator';
            case 'operator': return 'Operations Engineer';
            case 'viewer': return 'Support Specialist';
            case 'manager': return 'Engineering Manager';
            case 'lead': return 'Technical Lead';
            default: return 'Infrastructure Engineer';
          }
        };
        
        setAccountData({
          id: currentUser.id,
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          username: currentUser.username || '',
          phoneNumber: currentUser.phoneNumber || '',
          role: currentUser.role || '',
          isActive: currentUser.isActive,
          isVerified: currentUser.isVerified,
          lastLogin: currentUser.lastLogin,
          createdAt: currentUser.createdAt,
          updatedAt: currentUser.updatedAt,
          // Default values for additional fields
          location: 'San Francisco, CA',
          timezone: 'America/New_York',
          department: getDepartment(currentUser.role),
          jobTitle: getJobTitle(currentUser.role),
          avatar: avatar
        });
      } else {
        setError('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error.message || 'Failed to fetch user data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [currentUserId]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call to update user data
      // const response = await fetch(`https://incident-webhook-api.rapidresponse.workers.dev/api/users/${accountData.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(accountData)
      // });
      
      // For now, just simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsDirty(false);
      // Show success notification (you can implement toast notifications)
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAccountSettings = () => (
    <div className="space-y-8">
      {/* Profile Picture Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
        <div className="flex items-center space-x-6">
          <div className="relative group">
            <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">{accountData.avatar}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 w-10 h-10 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center hover:bg-blue-50 transition-all duration-200 shadow-md group-hover:scale-105">
              <Camera className="w-5 h-5 text-blue-600" />
            </button>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-black mb-1">Profile Picture</h3>
            <p className="text-black mb-4">Update your profile photo to personalize your account</p>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
                <Upload className="w-4 h-4 mr-2" />
                Upload New
              </button>
              <button className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-black">Account Status</h3>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              accountData.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {accountData.isActive ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Inactive
                </>
              )}
            </div>
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              accountData.isVerified 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {accountData.isVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Unverified
                </>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-black font-semibold">User ID</p>
            <p className="font-semibold text-black">{accountData.id}</p>
          </div>
          <div>
            <p className="text-black font-semibold">Username</p>
            <p className="font-semibold text-black">{accountData.username}</p>
          </div>
          <div>
            <p className="text-black font-semibold">Created</p>
            <p className="font-semibold text-black">{accountData.createdAt ? new Date(accountData.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <p className="text-black font-semibold">Last Login</p>
            <p className="font-semibold text-black">{accountData.lastLogin ? new Date(accountData.lastLogin).toLocaleDateString() : 'Never'}</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center mb-6">
          <User className="w-5 h-5 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-black">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black mb-2">First Name</label>
            <input
              type="text"
              value={accountData.firstName}
              onChange={(e) => handleAccountChange('firstName', e.target.value)}
              placeholder="Enter your first name"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black mb-2">Last Name</label>
            <input
              type="text"
              value={accountData.lastName}
              onChange={(e) => handleAccountChange('lastName', e.target.value)}
              placeholder="Enter your last name"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-black mb-2">
              <Mail className="w-4 h-4 mr-2 text-blue-600" />
              Email Address
            </label>
            <input
              type="email"
              value={accountData.email}
              onChange={(e) => handleAccountChange('email', e.target.value)}
              placeholder="Enter your email address"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-black mb-2">
              <Phone className="w-4 h-4 mr-2 text-blue-600" />
              Phone Number
            </label>
            <input
              type="tel"
              value={accountData.phoneNumber}
              onChange={(e) => handleAccountChange('phoneNumber', e.target.value)}
              placeholder="Enter your phone number"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-black mb-2">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              Location
            </label>
            <input
              type="text"
              value={accountData.location}
              onChange={(e) => handleAccountChange('location', e.target.value)}
              placeholder="Enter your location"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-black mb-2">
              <Globe className="w-4 h-4 mr-2 text-blue-600" />
              Timezone
            </label>
            <select
              value={accountData.timezone}
              onChange={(e) => handleAccountChange('timezone', e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="America/New_York">Eastern Time (America/New_York)</option>
              <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
              <option value="America/Chicago">Central Time (America/Chicago)</option>
              <option value="America/Denver">Mountain Time (America/Denver)</option>
              <option value="UTC">Coordinated Universal Time (UTC)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Information */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center mb-6">
          <UserCheck className="w-5 h-5 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-black">Work Information</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black mb-2">Job Title</label>
            <input
              type="text"
              value={accountData.jobTitle}
              onChange={(e) => handleAccountChange('jobTitle', e.target.value)}
              placeholder="Enter your job title"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black mb-2">Department</label>
            <select
              value={accountData.department}
              onChange={(e) => handleAccountChange('department', e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="Administration">Administration</option>
              <option value="Operations">Operations</option>
              <option value="Support">Support</option>
              <option value="Engineering">Engineering</option>
              <option value="Management">Management</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="DevOps">DevOps</option>
              <option value="Quality Assurance">Quality Assurance</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black mb-2">System Role</label>
            <input
              type="text"
              value={accountData.role}
              onChange={(e) => handleAccountChange('role', e.target.value)}
              placeholder="Enter your system role"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-black mb-2">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Member Since
            </label>
            <input
              type="text"
              value={accountData.createdAt ? new Date(accountData.createdAt).toLocaleDateString() : 'N/A'}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center mb-6">
          <Key className="w-5 h-5 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-black">Security & Password</h3>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">Security Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                For your security, we recommend changing your password regularly and using a strong, unique password.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-500 bg-white hover:bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-500 bg-white hover:bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-black">
            <p className="font-medium mb-2">Password requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-black">
              <li>At least 8 characters long</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Include at least one number</li>
              <li>Include at least one special character</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
            <Lock className="w-4 h-4 mr-2" />
            Update Password
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {/* Alert Manager Component - Mobile-style comprehensive alert management */}
      <div className="mb-6">
        <AlertManager 
          userId={accountData.id} 
          userEmail={accountData.email} 
        />
      </div>

      {/* Legacy Notification Settings - Keep for backward compatibility */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-black mb-4">Additional Notification Preferences</h3>
        <div className="space-y-4">
          {[
            { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive alerts via email' },
            { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive critical alerts via SMS' },
            { key: 'weekendAlerts', label: 'Weekend Alerts', desc: 'Receive alerts during weekends' },
            { key: 'escalationAlerts', label: 'Escalation Alerts', desc: 'Notify when incidents are escalated' },
            { key: 'maintenanceAlerts', label: 'Maintenance Alerts', desc: 'System maintenance notifications' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-black">{label}</h4>
                <p className="text-sm text-gray-700">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={() => handleNotificationChange(key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-black">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-700">Add an extra layer of security to your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={security.twoFactorAuth}
                onChange={() => handleSecurityChange('twoFactorAuth', !security.twoFactorAuth)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-black">Session Timeout</h4>
            </div>
            <p className="text-sm text-gray-700 mb-4">Automatically sign out after inactivity</p>
            <select
              value={security.sessionTimeout}
              onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="240">4 hours</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-black mb-4">Account Security</h3>
        <div className="space-y-4">
          {[
            { key: 'loginAlerts', label: 'Login Alerts', desc: 'Get notified of new sign-ins' },
            { key: 'deviceTrust', label: 'Device Trust', desc: 'Remember trusted devices' },
            { key: 'loginHistory', label: 'Login History', desc: 'Track account access history' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-black">{label}</h4>
                <p className="text-sm text-gray-700">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security[key]}
                  onChange={() => handleSecurityChange(key, !security[key])}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-black">Password Expiry</h4>
            </div>
            <p className="text-sm text-gray-700 mb-4">Require password change after specified days</p>
            <select
              value={security.passwordExpiry}
              onChange={(e) => handleSecurityChange('passwordExpiry', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-black mb-2">Theme</h4>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={system.theme === 'light'}
                  onChange={(e) => handleSystemChange('theme', e.target.value)}
                  className="mr-2"
                />
                <Sun className="w-4 h-4 mr-2" />
                Light
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={system.theme === 'dark'}
                  onChange={(e) => handleSystemChange('theme', e.target.value)}
                  className="mr-2"
                />
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </label>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-black mb-2">Language</h4>
            <select
              value={system.language}
              onChange={(e) => handleSystemChange('language', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-black mb-4">Display Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">Date Format</h4>
              <select
                value={system.dateFormat}
                onChange={(e) => handleSystemChange('dateFormat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
              </select>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-black mb-2">Time Format</h4>
              <select
                value={system.timeFormat}
                onChange={(e) => handleSystemChange('timeFormat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12h">12 Hour</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>
          </div>

          {[
            { key: 'autoRefresh', label: 'Auto Refresh', desc: 'Automatically refresh data' },
            { key: 'compactMode', label: 'Compact Mode', desc: 'Use compact layout for lists' },
            { key: 'showTooltips', label: 'Show Tooltips', desc: 'Display helpful tooltips' },
            { key: 'animationsEnabled', label: 'Animations', desc: 'Enable UI animations' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-black">{label}</h4>
                <p className="text-sm text-gray-700">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={system[key]}
                  onChange={() => handleSystemChange(key, !system[key])}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
            <p className="text-black text-lg">Manage your account and system preferences</p>
          </div>
        </div>
        
        {isDirty && (
          <div className="flex items-center space-x-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800 font-medium">You have unsaved changes</span>
            <button
              onClick={handleSave}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="xl:w-80">
          <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-4 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-black hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-4 ${activeTab === tab.id ? 'text-white' : 'text-black'}`} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800">Error Loading Data</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                      <button
                        onClick={fetchUserData}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {isLoading && !error && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-gray-600">Loading user data...</span>
                  </div>
                </div>
              )}
              
              {!isLoading && !error && (
                <>
                  {activeTab === 'account' && renderAccountSettings()}
                  {activeTab === 'notifications' && renderNotificationSettings()}
                  {activeTab === 'security' && renderSecuritySettings()}
                  {activeTab === 'system' && renderSystemSettings()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
