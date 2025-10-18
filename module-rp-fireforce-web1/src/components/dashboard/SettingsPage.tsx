// src/components/pages/settings-page.tsx

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Key,
  Mail,
  Phone,
  Camera,
  Save,
  Edit,
  Volume2,
  VolumeX,
  Smartphone,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { userService, UserProfile } from "@/services/userService";
import { toast } from "sonner";

export function SettingsPage() {
  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    department: "Platform Engineering",
    avatarUrl: "",
    displayName: "",
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Password display state
  const [showPassword, setShowPassword] = useState(false);

  /* ========================================
   * PASSWORD CHANGE - COMMENTED OUT
   * Uncomment when ready to implement
   * ========================================

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords don\'t match', {
        description: 'Please make sure both passwords are the same',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password too short', {
        description: 'Password must be at least 8 characters',
      });
      return;
    }

    try {
      setIsSaving(true);
      console.log('🔐 Changing password...');

      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success('Password changed', {
        description: 'Your password has been changed successfully',
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      console.log('✅ Password changed successfully');
    } catch (error: any) {
      console.error('❌ Failed to change password:', error);
      toast.error('Password change failed', {
        description: error.message || 'Please check your current password',
      });
    } finally {
      setIsSaving(false);
    }
  };

  ======================================== */

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    enableAlerts: true,
    criticalOnly: false,
    soundEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  // System status
  const [systemStatus] = useState({
    backendHealth: "healthy",
    deviceRegistered: true,
    lastSync: "2 minutes ago",
    connectionStatus: "connected"
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Load user profile on mount
  useEffect(() => {
    loadUserProfile();
    checkOAuthStatus();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Loading user profile...');

      const response = await userService.getProfile();

      if (response) {
        const user = response;
        console.log(user);
        setUserProfile(user);

        setProfileData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email,
          phone: user.phoneNumber || "",
          role: user.userRole || "user",
          department: "Platform Engineering",
          avatarUrl: user.avatarUrl || "",
          displayName: user.displayName || "",
        });

        console.log('✅ User profile loaded:', user.email);
      }
    } catch (error: any) {
      console.error('❌ Failed to load profile:', error);
      toast.error('Failed to load profile', {
        description: error.message || 'Please try refreshing the page',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkOAuthStatus = () => {
    const isOAuth = userService.isOAuthUser();
    setIsOAuthUser(isOAuth);
    console.log('OAuth user:', isOAuth);
  };

  const handleProfileSave = async () => {
    try {
      setIsSaving(true);
      console.log('💾 Saving profile...');

      await userService.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phone,
        displayName: profileData.displayName,
      });

      toast.success('Profile updated', {
        description: 'Your profile has been updated successfully',
      });

      setIsEditing(false);
      await loadUserProfile();

      console.log('✅ Profile saved successfully');
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      toast.error('Update failed', {
        description: error.message || 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file', {
        description: 'Please select an image file',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please select an image under 5MB',
      });
      return;
    }

    try {
      setIsSaving(true);
      console.log('📸 Uploading avatar...');

      const result = await userService.uploadAvatar(file);

      setProfileData({
        ...profileData,
        avatarUrl: result.avatarUrl,
      });

      toast.success('Avatar updated', {
        description: 'Your profile picture has been updated',
      });

      await loadUserProfile();
      console.log('✅ Avatar uploaded successfully');
    } catch (error: any) {
      console.error('❌ Failed to upload avatar:', error);
      toast.error('Upload failed', {
        description: error.message || 'Failed to upload avatar',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-400";
      case "unhealthy":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "unhealthy":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getInitials = () => {
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName[0]}${profileData.lastName[0]}`.toUpperCase();
    }
    if (profileData.displayName) {
      return profileData.displayName.substring(0, 2).toUpperCase();
    }
    if (profileData.email) {
      return profileData.email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-white text-lg">Loading profile...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-900 p-6 space-y-6">
        {/* Header */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-slate-300 mt-1">Manage your profile, notifications, and system preferences</p>
          </div>
          {isOAuthUser && (
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                <Shield className="h-3 w-3 mr-1" />
                OAuth Account
              </Badge>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <User className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-white hover:bg-slate-700"
                      disabled={isSaving}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileData.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-lg font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                      <div>
                        <input
                            type="file"
                            id="avatar-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                            disabled={isSaving}
                        />
                        <Button
                            variant="outline"
                            className="border-slate-600 text-white hover:bg-slate-700"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            disabled={isSaving}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Change Photo
                        </Button>
                      </div>
                  )}
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">First Name</Label>
                    <Input
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        disabled={!isEditing || isSaving}
                        className="bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-300"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Last Name</Label>
                    <Input
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        disabled={!isEditing || isSaving}
                        className="bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-white">Email</Label>
                    <Input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-slate-800 border-slate-600 text-slate-300"
                    />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <Label className="text-white">Phone</Label>
                    <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        disabled={!isEditing || isSaving}
                        placeholder="+63 917 123 4567"
                        className="bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-300"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Role</Label>
                    <Input
                        value={profileData.role}
                        disabled
                        className="bg-slate-800 border-slate-600 text-slate-300 capitalize"
                    />
                  </div>
                </div>

                {isEditing && (
                    <div className="flex gap-3 pt-4">
                      <Button
                          onClick={handleProfileSave}
                          disabled={isSaving}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                        ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                        )}
                      </Button>
                    </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* System Status */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Server className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.backendHealth)}
                      <span className="text-white">Backend Health</span>
                    </div>
                    <Badge
                        variant="outline"
                        className={`${getStatusColor(systemStatus.backendHealth)} border-current capitalize`}
                    >
                      {systemStatus.backendHealth}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-400" />
                      <span className="text-white">Device Status</span>
                    </div>
                    <Badge
                        variant="outline"
                        className={`${systemStatus.deviceRegistered ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}`}
                    >
                      {systemStatus.deviceRegistered ? 'Registered' : 'Unregistered'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-white">Connection</span>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400 capitalize">
                      {systemStatus.connectionStatus}
                    </Badge>
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="text-sm text-slate-400">
                    Last sync: {systemStatus.lastSync}
                  </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full border-slate-600 text-white hover:bg-slate-700"
                    onClick={() => toast.info('Testing connection...', { description: 'Feature coming soon' })}
                >
                  <Server className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Password Display - Only show for non-OAuth users */}
          {!isOAuthUser ? (
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Key className="h-5 w-5" />
                      Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Password Display */}
                    <div>
                      <Label className="text-white">Current Password</Label>
                      <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            value="••••••••••••"
                            disabled
                            className="bg-slate-700 border-slate-600 text-white pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {showPassword ? "Password is hidden for security" : "Click the eye icon to toggle"}
                      </p>
                    </div>

                    {/* Coming Soon Message */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="text-white font-medium mb-1">Password Management</h4>
                          <p className="text-sm text-slate-400">
                            Password change functionality is coming soon. For now, contact your administrator to reset your password.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Disabled Change Password Button */}
                    <Button
                        disabled
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-50 cursor-not-allowed text-white"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
          ) : (
              // OAuth Info Card - Show for OAuth users
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Shield className="h-5 w-5" />
                      OAuth Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-400" />
                      <div>
                        <h4 className="text-white font-medium">
                          Signed in with {userProfile?.oauthProvider === 'google' ? 'Google' : 'GitHub'}
                        </h4>
                        <p className="text-sm text-slate-400">
                          Your password is managed by your OAuth provider
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">
                      To change your password, please visit your {userProfile?.oauthProvider === 'google' ? 'Google' : 'GitHub'} account settings.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
          )}

          {/* Notification Settings */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Alert Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                      <div>
                        <h4 className="text-white font-medium">Enable Alerts</h4>
                        <p className="text-sm text-slate-400">Receive incident alerts</p>
                      </div>
                    </div>
                    <Switch
                        checked={notificationSettings.enableAlerts}
                        onCheckedChange={(checked) =>
                            setNotificationSettings({...notificationSettings, enableAlerts: checked})
                        }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-red-400" />
                      <div>
                        <h4 className="text-white font-medium">Critical Only</h4>
                        <p className="text-sm text-slate-400">Critical alerts only</p>
                      </div>
                    </div>
                    <Switch
                        checked={notificationSettings.criticalOnly}
                        onCheckedChange={(checked) =>
                            setNotificationSettings({...notificationSettings, criticalOnly: checked})
                        }
                        disabled={!notificationSettings.enableAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {notificationSettings.soundEnabled ?
                          <Volume2 className="h-5 w-5 text-blue-400" /> :
                          <VolumeX className="h-5 w-5 text-slate-400" />
                      }
                      <div>
                        <h4 className="text-white font-medium">Sound</h4>
                        <p className="text-sm text-slate-400">Play alert sounds</p>
                      </div>
                    </div>
                    <Switch
                        checked={notificationSettings.soundEnabled}
                        onCheckedChange={(checked) =>
                            setNotificationSettings({...notificationSettings, soundEnabled: checked})
                        }
                        disabled={!notificationSettings.enableAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-green-400" />
                      <div>
                        <h4 className="text-white font-medium">Email</h4>
                        <p className="text-sm text-slate-400">Email alerts</p>
                      </div>
                    </div>
                    <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                            setNotificationSettings({...notificationSettings, emailNotifications: checked})
                        }
                        disabled={!notificationSettings.enableAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-yellow-400" />
                      <div>
                        <h4 className="text-white font-medium">SMS</h4>
                        <p className="text-sm text-slate-400">SMS alerts</p>
                      </div>
                    </div>
                    <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) =>
                            setNotificationSettings({...notificationSettings, smsNotifications: checked})
                        }
                        disabled={!notificationSettings.enableAlerts}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-purple-400" />
                      <div>
                        <h4 className="text-white font-medium">Push</h4>
                        <p className="text-sm text-slate-400">Push notifications</p>
                      </div>
                    </div>
                    <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) =>
                            setNotificationSettings({...notificationSettings, pushNotifications: checked})
                        }
                        disabled={!notificationSettings.enableAlerts}
                    />
                  </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full border-slate-600 text-white hover:bg-slate-700"
                    onClick={() => toast.info('Sending test notification...', { description: 'Feature coming soon' })}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Test Notifications
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
  );
}