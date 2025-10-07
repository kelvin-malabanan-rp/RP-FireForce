import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
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
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";

export function SettingsPage() {
  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@company.com",
    phone: "+1 (555) 123-4567",
    role: "Senior SRE",
    department: "Platform Engineering"
  });

  // Password change state
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
  const [systemStatus, setSystemStatus] = useState({
    backendHealth: "healthy",
    deviceRegistered: true,
    lastSync: "2 minutes ago",
    connectionStatus: "connected"
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setIsSaving(false);
    alert("Password changed successfully!");
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

  return (
    <div className="space-y-6">
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
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-slate-600 text-white text-lg">
                    {profileData.firstName[0]}{profileData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                )}
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">First Name</Label>
                  <Input
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-300"
                  />
                </div>
                <div>
                  <Label className="text-white">Last Name</Label>
                  <Input
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-300"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-300"
                  />
                </div>
                <div>
                  <Label className="text-white">Phone</Label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-300"
                  />
                </div>
                <div>
                  <Label className="text-white">Role</Label>
                  <Input
                    value={profileData.role}
                    disabled
                    className="bg-slate-800 border-slate-600 text-slate-300"
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
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
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
              >
                <Server className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Password Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white pr-10"
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-white">New Password</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white pr-10"
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-white">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white pr-10"
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || isSaving}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isSaving ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                    <div>
                      <h4 className="text-white font-medium">Enable Alerts</h4>
                      <p className="text-sm text-slate-400">Receive incident and system alerts</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.enableAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, enableAlerts: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-red-400" />
                    <div>
                      <h4 className="text-white font-medium">Critical Only</h4>
                      <p className="text-sm text-slate-400">Only receive critical severity alerts</p>
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notificationSettings.soundEnabled ? 
                      <Volume2 className="h-5 w-5 text-blue-400" /> : 
                      <VolumeX className="h-5 w-5 text-slate-400" />
                    }
                    <div>
                      <h4 className="text-white font-medium">Sound Notifications</h4>
                      <p className="text-sm text-slate-400">Play sound for new alerts</p>
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
              </div>

              <Separator className="bg-slate-600" />

              {/* Channel Settings */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Notification Channels</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-green-400" />
                    <div>
                      <h4 className="text-white font-medium">Email</h4>
                      <p className="text-sm text-slate-400">Send alerts to email</p>
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-yellow-400" />
                    <div>
                      <h4 className="text-white font-medium">SMS</h4>
                      <p className="text-sm text-slate-400">Send alerts via SMS</p>
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-purple-400" />
                    <div>
                      <h4 className="text-white font-medium">Push Notifications</h4>
                      <p className="text-sm text-slate-400">Browser push notifications</p>
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
