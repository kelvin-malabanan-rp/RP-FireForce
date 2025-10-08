import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ArrowUpCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface IncidentAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentTitle: string;
  incidentDescription: string;
  onEscalate: () => void;
}

export function IncidentAlertModal({ isOpen, onClose, incidentTitle, incidentDescription, onEscalate }: IncidentAlertModalProps) {
  useEffect(() => {
    if (isOpen) {
      const audio = new Audio("/alert.mp3"); // Place alert.mp3 in public folder
      audio.play();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Incident Alert
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-2">{incidentTitle}</h3>
                <p className="text-slate-700 dark:text-slate-300">{incidentDescription}</p>
              </div>
              <div className="flex flex-col gap-2 mt-6">
                <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700" onClick={onEscalate}>
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Escalate Incident
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
