import { motion, AnimatePresence } from "framer-motion";
import { X, User, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { TeamMember } from "../../services/oncallService";

interface EditingSchedule {
  date: Date;
  team: string;
  primary: string | null;
  backup: string | null;
  escalation: string | null;
}

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedDate: Date | null;
  editingSchedule: EditingSchedule | null;
  setEditingSchedule: (schedule: EditingSchedule) => void;
  teamMembers: TeamMember[];
}

export function EditScheduleModal({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedDate,
  editingSchedule,
  setEditingSchedule,
  teamMembers
}: EditScheduleModalProps) {
  if (!selectedDate || !editingSchedule) return null;

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
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Edit Schedule
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'short', 
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
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Primary */}
              <div>
                <Label className="text-white flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Primary On-Call
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
                      {editingSchedule.primary 
                        ? `${teamMembers.find(m => m.id === editingSchedule.primary)?.firstName} ${teamMembers.find(m => m.id === editingSchedule.primary)?.lastName}`
                        : "Select member"
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-600 w-full">
                    {teamMembers.map((member) => (
                      <DropdownMenuItem 
                        key={member.id}
                        onClick={() => setEditingSchedule({...editingSchedule, primary: member.id})}
                        className="text-white hover:bg-slate-700"
                      >
                        <User className="h-4 w-4 mr-2" />
                        {member.firstName} {member.lastName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Backup */}
              <div>
                <Label className="text-white flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  Backup On-Call
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
                      {editingSchedule.backup 
                        ? `${teamMembers.find(m => m.id === editingSchedule.backup)?.firstName} ${teamMembers.find(m => m.id === editingSchedule.backup)?.lastName}`
                        : "Select member"
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-600 w-full">
                    {teamMembers.map((member) => (
                      <DropdownMenuItem 
                        key={member.id}
                        onClick={() => setEditingSchedule({...editingSchedule, backup: member.id})}
                        className="text-white hover:bg-slate-700"
                      >
                        <User className="h-4 w-4 mr-2" />
                        {member.firstName} {member.lastName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Escalation */}
              <div>
                <Label className="text-white flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Escalation Contact
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
                      {editingSchedule.escalation 
                        ? `${teamMembers.find(m => m.id === editingSchedule.escalation)?.firstName} ${teamMembers.find(m => m.id === editingSchedule.escalation)?.lastName}`
                        : "Select member"
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-600 w-full">
                    {teamMembers.map((member) => (
                      <DropdownMenuItem 
                        key={member.id}
                        onClick={() => setEditingSchedule({...editingSchedule, escalation: member.id})}
                        className="text-white hover:bg-slate-700"
                      >
                        <User className="h-4 w-4 mr-2" />
                        {member.firstName} {member.lastName}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={onSave}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}