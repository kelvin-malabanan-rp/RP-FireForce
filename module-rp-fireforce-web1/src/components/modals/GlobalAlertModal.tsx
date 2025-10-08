import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { incidentService } from "@/services";

export function GlobalAlertModal() {
  const { notifications, refresh, markAsRead } = useNotifications({ enabled: true });
  const [isOpen, setIsOpen] = useState(false);
  const [showEscalateReason, setShowEscalateReason] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const alertAudioRef = typeof window !== "undefined" ? useRef<HTMLAudioElement | null>(new Audio("/sounds/alert.mp3")) : { current: null } as any;

  const activeNotification = useMemo(() => notifications.find(n => n.id === activeId) || null, [notifications, activeId]);

  // Determine the latest targeted critical/high incident (only open for targeted)
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    // Defer opening if a local modal (e.g., success modal) is active
    if (typeof window !== 'undefined' && (window as any).suppressGlobalAlertModal) return;
    const targeted = notifications.find(n => n.unread && n.category === 'incident' && (n.type === 'critical' || n.type === 'warning') && n.targeted === true);
    if (targeted && !isOpen) { setActiveId(targeted.id); setIsOpen(true); }
  }, [notifications]);

  // Play/pause sound with modal
  useEffect(() => {
    const audio = alertAudioRef.current;
    if (!audio) return;
    if (isOpen) {
      try {
        audio.loop = true;
        audio.currentTime = 0;
        audio.play();
      } catch (_) {}
    } else {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    }
  }, [isOpen]);

  const stopSound = () => {
    const audio = alertAudioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (_) {}
  };

  const handleAcknowledge = async () => {
    stopSound();
    setIsOpen(false);
    setShowEscalateReason(false);
    setEscalateReason("");
    setCustomReason("");
    const userId = localStorage.getItem('userId') || '';
    const incidentId = activeNotification?.incidentId || activeNotification?.data?.incidentId;
    try {
      if (incidentId && userId) {
        await incidentService.respondToIncident({ incidentId, action: 'acknowledge', userId });
      }
    } catch (_) {}
    if (activeNotification) {
      markAsRead(activeNotification.id);
      refresh();
      setActiveId(null);
    }
  };

  const handleConfirmEscalate = async () => {
    stopSound();
    setIsOpen(false);
    const userId = localStorage.getItem('userId') || '';
    const incidentId = activeNotification?.incidentId || activeNotification?.data?.incidentId;
    try {
      if (incidentId && userId) {
        await incidentService.respondToIncident({ incidentId, action: 'escalate', userId });
      }
    } catch (_) {}
    if (activeNotification) {
      markAsRead(activeNotification.id);
      refresh();
      setActiveId(null);
    }
    setShowEscalateReason(false);
    setEscalateReason("");
    setCustomReason("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md" onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            Notification Alert
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-slate-400">
          You have a new notification/alert. Please take action below.
        </DialogDescription>
        <div className="space-y-4 py-2">
          <div className="bg-slate-800 rounded-lg p-3 mb-2">
            <div className="font-semibold text-lg text-red-400 mb-1">
              {activeNotification ? `Incident: ${activeNotification.title}` : 'Incident Alert'}
            </div>
            <div className="text-sm text-slate-300">
              {activeNotification ? activeNotification.message : 'You have a new incident notification. Please acknowledge or escalate.'}
            </div>
          </div>
          {!showEscalateReason ? (
            <div className="flex gap-3 mt-4">
              <Button className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={handleAcknowledge}>
                Acknowledge
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={() => setShowEscalateReason(true)}>
                Escalate
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm text-slate-300">Select Escalation Reason</Label>
              <Select value={escalateReason} onValueChange={setEscalateReason}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Choose reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High Severity">High Severity</SelectItem>
                  <SelectItem value="No Response">No Response</SelectItem>
                  <SelectItem value="Requires Team Lead">Requires Team Lead</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {escalateReason === 'Other' && (
                <Input value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Enter specific reason..." className="bg-slate-800 border-slate-600 text-white" />
              )}
              <div className="flex gap-3 mt-2">
                <Button variant="outline" className="text-white border-slate-600 hover:bg-slate-800 flex-1" onClick={() => { setShowEscalateReason(false); setEscalateReason(""); setCustomReason(""); }}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white flex-1" onClick={handleConfirmEscalate} disabled={!escalateReason || (escalateReason === 'Other' && !customReason)}>
                  Confirm Escalate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GlobalAlertModal;

