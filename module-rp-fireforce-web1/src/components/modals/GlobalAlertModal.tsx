import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
// ✅ UPDATED: Added escalationService and onCallService
import { incidentService, escalationService, onCallService } from "@/services";

export function GlobalAlertModal() {
  console.log('🎬 GlobalAlertModal MOUNTED');
  
  const { notifications, refresh, markAsRead } = useNotifications({ enabled: true });
  const [isOpen, setIsOpen] = useState(false);
  const [showEscalateReason, setShowEscalateReason] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const alertAudioRef = typeof window !== "undefined" ? useRef<HTMLAudioElement | null>(new Audio("/sounds/alert.mp3")) : { current: null } as any;

  const activeNotification = useMemo(() => {
    const found = notifications.find(n => n.id === activeId) || null;
    console.log('🔍 Active notification lookup:', activeId, '→', found);
    return found;
  }, [notifications, activeId]);

  // Main logic to detect and show alerts
  useEffect(() => {
    console.log('🔄 useEffect triggered - notifications:', notifications?.length, 'isOpen:', isOpen);
    
    if (!notifications || notifications.length === 0) {
      console.log('⏭️ No notifications, skipping');
      return;
    }

    // Check suppression flag
    if (typeof window !== 'undefined' && (window as any).suppressGlobalAlertModal) {
      console.log('🚫 Suppressed by global flag');
      return;
    }

    // Find ANY unread incident notification (TEMPORARY - ignoring targeted field)
    console.log('🔎 Looking for unread incident notifications...');
    const target = notifications.find(n => {
      const match = n.unread === true && n.category === 'incident';
      console.log(`  - ${n.id}: unread=${n.unread}, category=${n.category}, match=${match}`);
      return match;
    });

    console.log('🎯 Search result:', target ? `FOUND ${target.id}` : 'NONE');

    if (target && !isOpen) {
      console.log('🚨 OPENING MODAL for notification:', target.id);
      setActiveId(target.id);
      setIsOpen(true);
    } else if (target && isOpen) {
      console.log('⏸️ Modal already open');
    }
  }, [notifications, isOpen]);

  // Sound management
  useEffect(() => {
    const audio = alertAudioRef.current;
    if (!audio) return;
    
    console.log('🔊 Sound effect - isOpen:', isOpen);
    
    if (isOpen) {
      audio.loop = true;
      audio.currentTime = 0;
      audio.play().catch((e: any) => console.warn('Sound play failed:', e));
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isOpen]);

  const stopSound = () => {
    const audio = alertAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const handleAcknowledge = async () => {
    console.log('✅ Acknowledging incident');
    stopSound();
    
    const userId = localStorage.getItem('userId') || '';
    const incidentId = activeNotification?.incidentId || activeNotification?.data?.incidentId;
    
    try {
      if (incidentId && userId) {
        await incidentService.respondToIncident({ incidentId, action: 'acknowledge', userId });
        console.log('✅ Incident acknowledged successfully');
      }
    } catch (err) {
      console.error('❌ Acknowledge failed:', err);
    }
    
    // Mark as read and close modal
    if (activeNotification) {
      markAsRead(activeNotification.id);
      setActiveId(null);
      setIsOpen(false);
      refresh();
    }
  };

  // ============================================================================
  // 🆕 UPDATED: handleConfirmEscalate - Now uses proper escalationService
  // ============================================================================
  const handleConfirmEscalate = async () => {
    console.log('🚨 Escalating incident with reason:', escalateReason === 'Other' ? customReason : escalateReason);
    stopSound();
    
    const userId = localStorage.getItem('userId') || '';
    const incidentId = activeNotification?.incidentId || activeNotification?.data?.incidentId;
    const reason = escalateReason === 'Other' ? customReason : escalateReason;
    
    if (!incidentId) {
      console.error('❌ No incident ID found');
      // Still close modal
      if (activeNotification) {
        markAsRead(activeNotification.id);
        setActiveId(null);
        setIsOpen(false);
        setShowEscalateReason(false);
        setEscalateReason("");
        setCustomReason("");
        refresh();
      }
      return;
    }
    
    try {
      // Get team ID from notification data or fetch user's team
      let teamId = activeNotification?.data?.teamId || activeNotification?.data?.team_id;
      
      if (!teamId && userId) {
        // Try to fetch user's team
        try {
          const userTeamResponse = await onCallService.getUserTeam(userId);
          if (userTeamResponse.success && userTeamResponse.data) {
            teamId = userTeamResponse.data.id;
            console.log('✅ Got team ID from user:', teamId);
          }
        } catch (teamError) {
          console.warn('⚠️ Could not fetch user team:', teamError);
        }
      }
      
      // Fallback to default team if still no teamId
      if (!teamId) {
        teamId = 'default-team';
        console.warn('⚠️ Using fallback team ID:', teamId);
      }
      
      // Get user role
      let userRole = 'primary';
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userRole = user.role || 'primary';
        }
      } catch (e) {
        console.warn('Could not parse user role');
      }
      
      // Map severity to priority
      const severity = activeNotification?.data?.severity || 
                       activeNotification?.severity || 
                       'medium';
      
      const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
        'low': 'low',
        'medium': 'medium',
        'high': 'high',
        'critical': 'critical'
      };
      const priority = priorityMap[severity] || 'medium';
      
      console.log('🚨 Escalating with params:', {
        teamId,
        incidentId,
        reason,
        priority,
        userRole
      });
      
      // Call the proper escalation endpoint
      const response = await escalationService.escalateIncident({
        teamId: teamId,
        incidentId: incidentId,
        reason: reason,
        priority: priority,
        userRole: userRole
      });
      
      console.log('✅ Incident escalated successfully:', response);
      
      // Mark as read and close modal
      if (activeNotification) {
        markAsRead(activeNotification.id);
        setActiveId(null);
        setIsOpen(false);
        setShowEscalateReason(false);
        setEscalateReason("");
        setCustomReason("");
        refresh();
      }
    } catch (err: any) {
      console.error('❌ Escalate failed:', err);
      alert(`Failed to escalate: ${err.message || 'Unknown error'}`);
      
      // Still close the modal even if escalation failed
      if (activeNotification) {
        markAsRead(activeNotification.id);
        setActiveId(null);
        setIsOpen(false);
        setShowEscalateReason(false);
        setEscalateReason("");
        setCustomReason("");
        refresh();
      }
    }
  };

  console.log('🎭 Render decision - isOpen:', isOpen, 'activeNotification:', !!activeNotification);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('🔄 Dialog onOpenChange:', open);
      setIsOpen(open);
    }}>
      <DialogContent 
        className="bg-slate-900 border-slate-700 text-white max-w-md" 
        onInteractOutside={e => e.preventDefault()} 
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            Incident Alert
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-slate-400">
          You have been notified of a new incident. Please take action below.
        </DialogDescription>
        
        <div className="space-y-4 py-2">
          {/* Incident Details */}
          <div className="bg-slate-800 rounded-lg p-4 mb-2 border-l-4 border-red-500">
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-lg text-red-400">
                {activeNotification?.title || 'Incident Alert'}
              </div>
              {activeNotification?.data?.severity && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  activeNotification.data.severity === 'critical' ? 'bg-red-600 text-white' :
                  activeNotification.data.severity === 'high' ? 'bg-orange-600 text-white' :
                  activeNotification.data.severity === 'medium' ? 'bg-yellow-600 text-white' :
                  'bg-blue-600 text-white'
                }`}>
                  {activeNotification.data.severity.toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="text-sm text-slate-300 mb-3">
              {activeNotification?.message || 'You have a new incident notification.'}
            </div>
            
            {/* Additional Details */}
            {activeNotification?.data?.location && (
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-2">
                <span className="font-medium">Location:</span>
                <span>{activeNotification.data.location}</span>
              </div>
            )}
            
            {activeNotification?.data?.reportedBy && (
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <span className="font-medium">Reported by:</span>
                <span>{activeNotification.data.reportedBy}</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          {!showEscalateReason ? (
            <div className="flex gap-3 mt-4">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white flex-1" 
                onClick={handleAcknowledge}
              >
                Acknowledge
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white flex-1" 
                onClick={() => setShowEscalateReason(true)}
              >
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
                  <SelectItem value="Out for Vacation">Out for Vacation</SelectItem>
                  <SelectItem value="Currently Unavailable">Currently Unavailable</SelectItem>
                  <SelectItem value="Beyond My Expertise">Beyond My Expertise</SelectItem>
                  <SelectItem value="Requires Team Lead">Requires Team Lead</SelectItem>
                  <SelectItem value="High Severity - Need Support">High Severity - Need Support</SelectItem>
                  <SelectItem value="No Response from Primary">No Response from Primary</SelectItem>
                  <SelectItem value="Off Duty">Off Duty</SelectItem>
                  <SelectItem value="Other">Other (Specify)</SelectItem>
                </SelectContent>
              </Select>
              
              {escalateReason === 'Other' && (
                <Input 
                  value={customReason} 
                  onChange={e => setCustomReason(e.target.value)} 
                  placeholder="Enter specific reason..." 
                  className="bg-slate-800 border-slate-600 text-white" 
                />
              )}
              
              <div className="flex gap-3 mt-2">
                <Button 
                  variant="outline" 
                  className="text-white border-slate-600 hover:bg-slate-800 flex-1" 
                  onClick={() => { 
                    setShowEscalateReason(false); 
                    setEscalateReason(""); 
                    setCustomReason(""); 
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white flex-1" 
                  onClick={handleConfirmEscalate} 
                  disabled={!escalateReason || (escalateReason === 'Other' && !customReason.trim())}
                >
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