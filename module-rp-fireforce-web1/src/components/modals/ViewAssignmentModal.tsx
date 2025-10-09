import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Phone } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Assignment } from "../../services/oncallService";

interface ViewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  assignment: Assignment | null;
  selectedDate: Date | null;
}

export function ViewAssignmentModal({ 
  isOpen, 
  onClose, 
  onEdit, 
  assignment, 
  selectedDate 
}: ViewAssignmentModalProps) {
  if (!assignment || !selectedDate) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    On-Call Schedule
                  </h3>
                  <p className="text-slate-400">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Primary */}
              {assignment.primary && (
                <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-green-500/50">
                      <AvatarFallback className="bg-green-600 text-white text-lg font-bold">
                        {assignment.primary.firstName[0]}{assignment.primary.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Badge className="bg-green-500 text-white mb-2">Primary On-Call</Badge>
                      <h4 className="text-lg font-bold text-white">
                        {assignment.primary.firstName} {assignment.primary.lastName}
                      </h4>
                      <p className="text-sm text-slate-400">{assignment.primary.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="h-4 w-4 text-green-400" />
                      {assignment.primary.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-4 w-4 text-green-400" />
                      {assignment.primary.phoneNumber || 'No phone number'}
                    </div>
                  </div>
                </div>
              )}

              {/* Backup */}
              {assignment.backup && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 rounded-xl p-4 border border-yellow-500/30">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-yellow-500/50">
                      <AvatarFallback className="bg-yellow-600 text-white text-lg font-bold">
                        {assignment.backup.firstName[0]}{assignment.backup.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Badge className="bg-yellow-500 text-white mb-2">Backup On-Call</Badge>
                      <h4 className="text-lg font-bold text-white">
                        {assignment.backup.firstName} {assignment.backup.lastName}
                      </h4>
                      <p className="text-sm text-slate-400">{assignment.backup.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="h-4 w-4 text-yellow-400" />
                      {assignment.backup.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-4 w-4 text-yellow-400" />
                      {assignment.backup.phoneNumber || 'No phone number'}
                    </div>
                  </div>
                </div>
              )}

              {/* Escalation */}
              {assignment.escalation.map((person, idx) => (
                <div key={idx} className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/30">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-blue-500/50">
                      <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                        {person.firstName[0]}{person.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Badge className="bg-blue-500 text-white mb-2">Escalation Contact</Badge>
                      <h4 className="text-lg font-bold text-white">
                        {person.firstName} {person.lastName}
                      </h4>
                      <p className="text-sm text-slate-400">{person.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="h-4 w-4 text-blue-400" />
                      {person.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="h-4 w-4 text-blue-400" />
                      {person.phoneNumber || 'No phone number'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-700 flex gap-3">
              <Button
                onClick={onEdit}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
              >
                <User className="h-4 w-4 mr-2" />
                Edit Assignment
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}