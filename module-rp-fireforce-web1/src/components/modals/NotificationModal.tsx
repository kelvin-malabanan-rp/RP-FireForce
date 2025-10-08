import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  details?: string;
}

export function NotificationModal({ isOpen, onClose, type, title, message, details }: NotificationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-12 w-12 text-orange-500" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'success':
        return 'from-green-500 to-emerald-600';
      case 'error':
        return 'from-red-500 to-pink-600';
      case 'warning':
        return 'from-orange-500 to-red-600';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="p-6">
              {/* Close Button */}
              <div className="flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  {getIcon()}
                </motion.div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-center text-white mb-2">
                {title}
              </h3>

              {/* Message */}
              <p className="text-center text-slate-600 dark:text-slate-300 mb-4">
                {message}
              </p>

              {/* Details */}
              {details && (
                <div className={`p-3 rounded-lg border ${getBgColor()} mb-4`}>
                  <p className="text-sm text-slate-700 dark:text-slate-200 break-words">
                    {details}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={onClose}
                className={`w-full bg-gradient-to-r ${getGradient()} text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all`}
              >
                Got it
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Convenience components
export function SuccessModal(props: Omit<NotificationModalProps, 'type'>) {
  return <NotificationModal {...props} type="success" />;
}

export function ErrorModal(props: Omit<NotificationModalProps, 'type'>) {
  return <NotificationModal {...props} type="error" />;
}

export function WarningModal(props: Omit<NotificationModalProps, 'type'>) {
  return <NotificationModal {...props} type="warning" />;
}
