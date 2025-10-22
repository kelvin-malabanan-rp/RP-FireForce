import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { incidentService, auditService } from "../../services";
import type { Incident } from "../../types";
import { SuccessModal, ErrorModal } from "./NotificationModal";

interface ResolveIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  onSuccess?: () => void;
}

export function ResolveIncidentModal({ isOpen, onClose, incident, onSuccess }: ResolveIncidentModalProps) {
  const [resolution, setResolution] = useState('');
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

  const handleClose = () => {
    setResolution('');
    setError(null);
    onClose();
  };

  // ✅ NEW: Handle success modal close with proper order
  const handleSuccessClose = () => {
    setNotification(null); // Clear notification
    handleClose();         // Close resolve modal

    // ✅ CRITICAL FIX: Call onSuccess AFTER modal is closed
    if (onSuccess) {
      // Small delay to ensure modal is fully closed before reload
      setTimeout(() => {
        onSuccess();
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resolution.trim()) {
      setError('Please enter resolution details');
      return;
    }

    if (!incident) {
      setError('No incident selected');
      return;
    }

    setIsLoading(true);

    try {
      // Get user email from localStorage
      const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || 'unknown@example.com';

      const response = await incidentService.resolveIncident(incident.id, {
        resolvedBy: userEmail,
        resolution: resolution.trim()
      });

      if (response.success) {
        // ✅ Show success notification (onSuccess will be called when this closes)
        setNotification({
          show: true,
          type: 'success',
          title: 'Incident Resolved Successfully',
          message: `Incident "${incident.title}" has been marked as resolved.`,
          details: `Incident ID: ${incident.id}`
        });

        // Create audit log for resolution
        try {
          const userId = localStorage.getItem('userId') || 'unknown';
          const userName = localStorage.getItem('user')
              ? JSON.parse(localStorage.getItem('user')!).first_name + ' ' + JSON.parse(localStorage.getItem('user')!).last_name
              : 'Unknown User';

          await auditService.logIncidentResolution(incident, userId, userName, resolution.trim());
          console.log('✅ Audit log created for incident resolution');
        } catch (auditError) {
          console.warn('⚠️ Failed to create audit log for resolution:', auditError);
        }

        // ✅ REMOVED: Don't call onSuccess here - it will be called when success modal closes
        // if (onSuccess) {
        //   onSuccess();
        // }
      } else {
        setNotification({
          show: true,
          type: 'error',
          title: 'Failed to Resolve Incident',
          message: 'Unable to resolve the incident. Please try again.',
        });
      }
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Error Resolving Incident',
        message: err.message || 'An unexpected error occurred while resolving the incident.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !incident) return null;

  return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl"
          >
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Resolve Incident
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {incident.title}
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
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

                {/* Incident Details */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Incident ID:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{incident.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Severity:</span>
                      <span className="font-medium text-slate-900 dark:text-white capitalize">{incident.severity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Status:</span>
                      <span className="font-medium text-slate-900 dark:text-white capitalize">{incident.status}</span>
                    </div>
                  </div>
                </div>

                {/* Resolution Details */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Resolution Details <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Describe how the incident was resolved..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-white dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-all resize-none"
                        rows={6}
                        required
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Provide details about the root cause and steps taken to resolve the incident.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="flex-1 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                      type="submit"
                      disabled={isLoading || !resolution.trim()}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                  >
                    {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Resolving...
                        </>
                    ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve Incident
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
                onClose={handleSuccessClose}
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