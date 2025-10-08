import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, MapPin, FileText, Loader2, Users, Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { incidentService, auditService } from "../../services";
import type { CreateIncidentData } from "../../types";
import { SuccessModal, ErrorModal } from "./NotificationModal";
import { TeamUserSelector } from "./TeamUserSelector";

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateIncidentModal({ isOpen, onClose, onSuccess }: CreateIncidentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: '',
    notificationMode: 'automatic' as 'automatic' | 'manual',
  });
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Notification modal state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter an incident title');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter an incident description');
      return;
    }
    if (formData.notificationMode === 'manual' && selectedUsers.length === 0) {
      setError('Please select at least one person to notify');
      return;
    }

    setIsLoading(true);

    try {
      // Get user email from localStorage
      const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || 'unknown@example.com';

      // Build incident data according to API specification
      const incidentData: CreateIncidentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        severity: formData.severity,
        location: formData.location.trim() || 'Not specified',
        reportedBy: userEmail,
      };

      // Add selected users if manual mode
      if (formData.notificationMode === 'manual' && selectedUsers.length > 0) {
        incidentData.notifyUsers = selectedUsers;
      }

      console.log('📝 Creating incident:', incidentData);

      const response = await incidentService.createIncident(incidentData);

      if (response.success) {
        // Create audit log entry (following mobile app pattern)
        try {
          const userId = localStorage.getItem('userId') || 'unknown';
          const userName = localStorage.getItem('user') 
            ? JSON.parse(localStorage.getItem('user')!).first_name + ' ' + JSON.parse(localStorage.getItem('user')!).last_name
            : userEmail;

          await auditService.logIncidentCreation(
            response.data,
            userId,
            userName
          );
          console.log('✅ Audit log created for incident creation');
        } catch (auditError) {
          console.warn('⚠️ Failed to create audit log:', auditError);
          // Don't fail the whole operation if audit logging fails
        }

        // Show success notification
        setNotification({
          show: true,
          type: 'success',
          title: 'Incident Created Successfully',
          message: `Incident "${response.data.title}" has been created and the team has been notified.`,
          details: `Incident ID: ${response.data.id}`
        });

        // Defer notifications dispatch until success modal closes to avoid blocking
        ;(window as any).suppressGlobalAlertModal = true;
        
        // Callback to refresh incidents list
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Create Incident',
          message: 'Unable to create the incident. Please try again.',
        });
      }
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Creating Incident',
        message: err.message || 'An unexpected error occurred while creating the incident.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col h-full overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Create New Incident
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Report a new incident for immediate attention
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form - Scrollable */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        Error
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {error}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Incident Title <span className="text-red-500">*</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief description of the incident"
                  className="w-full text-white dark:text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of the incident..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-white dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Severity & Location Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Severity <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-white dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Server Room A"
                      className="pl-10 text-white dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Mode */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Notification Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, notificationMode: 'automatic' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.notificationMode === 'automatic'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className={`h-5 w-5 ${
                        formData.notificationMode === 'automatic'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-slate-400'
                      }`} />
                      <div className="text-left">
                        <p className={`font-medium ${
                          formData.notificationMode === 'automatic'
                            ? 'text-orange-900 dark:text-orange-100'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          Automatic
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Notify on-call team
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, notificationMode: 'manual' }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.notificationMode === 'manual'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={`h-5 w-5 ${
                        formData.notificationMode === 'manual'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-slate-400'
                      }`} />
                      <div className="text-left">
                        <p className={`font-medium ${
                          formData.notificationMode === 'manual'
                            ? 'text-orange-900 dark:text-orange-100'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          Manual
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Select specific users
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Manual Selection */}
              {formData.notificationMode === 'manual' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TeamUserSelector
                    selectedUserIds={selectedUsers}
                    onSelectionChange={setSelectedUsers}
                  />
                </motion.div>
              )}
              </div>

              {/* Action Buttons - Fixed at Bottom */}
              <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Incident
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
      
      {/* Notification Modals */}
      {notification?.type === 'success' && (
        <SuccessModal
          isOpen={notification.show}
          onClose={() => {
            // Re-enable global modal and then notify listeners
            try {
              (window as any).suppressGlobalAlertModal = false;
              window.dispatchEvent(new Event('notifications:refresh'));
            } catch (_) {}
            setNotification(null);
            handleClose();
          }}
          title={notification.title}
          message={notification.message}
          details={notification.details}
        />
      )}
      
      {notification?.type === 'error' && (
        <ErrorModal
          isOpen={notification.show}
          onClose={() => setNotification(null)}
          title={notification.title}
          message={notification.message}
          details={notification.details}
        />
      )}
    </AnimatePresence>
  );
}
