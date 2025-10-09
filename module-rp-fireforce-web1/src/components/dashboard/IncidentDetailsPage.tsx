import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { incidentService } from "incidents-service";

import {
  ArrowLeft,
  User,
  Clock,
  MapPin,
  MessageSquare,
  Send,
  Loader2,
  Bot,
  Brain,
  Sparkles,
  X,
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Zap
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { incidentService, auditService } from "../../services";
import type { Incident, IncidentComment } from "../../types";
import { SaveResolutionModal } from "../modals/SaveResolutionModal";
import { ResolveIncidentModal } from "../modals/ResolveIncidentModal";
import { SuccessModal, ErrorModal, WarningModal } from "../modals/NotificationModal";
import { MarkdownContent } from "../../utils/markdownRenderer";

interface IncidentDetailsPageProps {
  incidentId: string;
  onBack: () => void;
}

interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  similarIncidents?: any[];
}

// Extended Incident type with new fields
interface ExtendedIncident extends Incident {
  acknowledged_by?: string;
  acknowledged_by_name?: string;
  acknowledged_at?: string;
  escalated_by?: string;
  escalated_by_name?: string;
  escalated_at?: string;
  escalation_reason?: string;
  escalation_level?: number;
}

export function IncidentDetailsPage({ incidentId, onBack }: IncidentDetailsPageProps) {
  // State management
  const [incident, setIncident] = useState<ExtendedIncident | null>(null);
  const [comments, setComments] = useState<IncidentComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Status update state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  // Save Resolution Modal state
  const [showSaveResolutionModal, setShowSaveResolutionModal] = useState(false);
  
  // Resolve Incident Modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  
  // Notification modal state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  // AI Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load incident details
  useEffect(() => {
    loadIncident();
    loadComments();
  }, [incidentId]);

  // Initialize AI chat with welcome message
  useEffect(() => {
    if (incident && messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          type: 'bot',
          content: `Hello! I'm your AI assistant for this incident.\n\n**${incident.title}**\n\nI can help you with:\n• Root cause analysis\n• Similar past incidents\n• Recommended actions\n• Impact assessment\n\nAsk me anything!`,
          timestamp: new Date()
        }
      ]);
    }
  }, [incident]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const loadIncident = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await incidentService.getIncidentById(incidentId);
      if (response.success && response.data) {
        setIncident(response.data);
      } else {
        setError('Incident not found');
      }
    } catch (err: any) {
      console.error('Error loading incident:', err);
      setError(err.message || 'Failed to load incident');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await incidentService.getIncidentComments(incidentId);
      if (response.success && response.data) {
        setComments(response.data);
      }
    } catch (err: any) {
      console.error('Error loading comments:', err);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const userId = localStorage.getItem('userId') || 'user-unknown';
      
      await incidentService.postIncidentComment({
        incidentId: incidentId,
        userId: userId,
        comment: newComment.trim()
      });

      setNewComment('');
      await loadComments();

      // Create audit log for comment addition
      try {
        const userName = localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user')!).first_name + ' ' + JSON.parse(localStorage.getItem('user')!).last_name
          : 'Unknown User';
        
        await auditService.logCommentAdded(incident!, newComment.trim(), userId, userName);
        console.log('✅ Audit log created for comment addition');
      } catch (auditError) {
        console.warn('⚠️ Failed to create audit log for comment:', auditError);
      }
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Post Comment',
        message: 'Unable to add your comment. Please try again.',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === incident?.status) {
      setNotification({
        show: true,
        type: 'warning',
        title: 'Invalid Status Selection',
        message: 'Please select a different status from the current one.',
      });
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const oldStatus = incident?.status || 'Unknown';
      const resolvedBy = localStorage.getItem('userEmail') || undefined;
      console.log('[DEBUG] Update Incident Status Payload:', {
        incidentId,
        newStatus,
        resolvedBy
      });
      const response = await incidentService.updateIncidentStatus(incidentId, newStatus, resolvedBy);
      if (response.success && response.data) {
        setIncident(response.data);
        setNewStatus('');
        
        // Create audit log for status update
        try {
          const userId = localStorage.getItem('userId') || 'unknown';
          const userName = localStorage.getItem('user') 
            ? JSON.parse(localStorage.getItem('user')!).first_name + ' ' + JSON.parse(localStorage.getItem('user')!).last_name
            : 'Unknown User';

          await auditService.logStatusUpdate(
            response.data,
            oldStatus,
            newStatus,
            userId,
            userName
          );
          console.log('✅ Audit log created for status update');
        } catch (auditError) {
          console.warn('⚠️ Failed to create audit log:', auditError);
        }
        
        setNotification({
          show: true,
          type: 'success',
          title: 'Status Updated',
          message: `Incident status has been changed to "${newStatus}".`,
        });
        await loadIncident();
      }
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Update Status',
        message: err.message || 'Unable to update incident status. Please try again.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAcknowledge = async () => {
    setIsUpdatingStatus(true);
    try {
      const userId = localStorage.getItem('userId') || 'user-unknown';
      
      // Use the new respond API
      const response = await incidentService.respondToIncident({
        incidentId: incidentId,
        action: 'acknowledge',
        userId: userId
      });
      
      if (response.success) {
        // Create audit log for acknowledgment
        try {
          const userName = localStorage.getItem('user') 
            ? JSON.parse(localStorage.getItem('user')!).first_name + ' ' + JSON.parse(localStorage.getItem('user')!).last_name
            : 'Unknown User';

          await auditService.logIncidentAcknowledgment(
            incident!,
            userId,
            userName
          );
          console.log('✅ Audit log created for incident acknowledgment');
        } catch (auditError) {
          console.warn('⚠️ Failed to create audit log:', auditError);
        }

        setNotification({
          show: true,
          type: 'success',
          title: 'Incident Acknowledged',
          message: 'You have successfully acknowledged this incident.',
        });
        await loadIncident();
      }
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Acknowledge',
        message: err.message || 'Unable to acknowledge the incident. Please try again.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleEscalate = async () => {
    setIsUpdatingStatus(true);
    try {
      const userId = localStorage.getItem('userId') || 'user-unknown';
      
      // Use the new respond API
      const response = await incidentService.respondToIncident({
        incidentId: incidentId,
        action: 'escalate',
        userId: userId
      });
      
      if (response.success) {
        setNotification({
          show: true,
          type: 'success',
          title: 'Incident Escalated',
          message: 'This incident has been escalated to the next level.',
        });
        await loadIncident();

        // Create audit log for escalation
        try {
          const userName = localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user')!).first_name + ' ' + JSON.parse(localStorage.getItem('user')!).last_name
            : 'Unknown User';
          
          await auditService.logIncidentEscalation(incident!, 1, 2, userId, userName);
          console.log('✅ Audit log created for incident escalation');
        } catch (auditError) {
          console.warn('⚠️ Failed to create audit log for escalation:', auditError);
        }
      }
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Escalate',
        message: err.message || 'Unable to escalate the incident. Please try again.',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendAIMessage = async () => {
    if (!inputMessage.trim() || isStreaming || !incident) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('http://localhost:8000/analyze/agentic-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: incident.title,
          description: `${incident.description}\n\nUser Question: ${inputMessage}`,
          service: incident.location || 'system'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let similarIncidents: any[] = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: false });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.token !== undefined) {
                accumulatedText += parsed.token;
                setStreamingMessage(accumulatedText);
              }
              
              if (parsed.done === true && parsed.similar_incidents) {
                similarIncidents = parsed.similar_incidents;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: accumulatedText || 'I received your message but couldn\'t generate a response.',
        timestamp: new Date(),
        similarIncidents: similarIncidents.length > 0 ? similarIncidents : undefined
      };

      setMessages(prev => [...prev, botMessage]);
      setStreamingMessage('');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('AI Error:', err);
        const errorMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: `Sorry, I encountered an error: ${err.message || 'Unable to connect to AI service'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'investigating': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'acknowledged': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'open': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateString);
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string | undefined) => {
    if (!name) return 'from-gray-500 to-gray-600';
    
    const colors = [
      'from-orange-500 to-red-600',
      'from-blue-500 to-indigo-600',
      'from-green-500 to-emerald-600',
      'from-purple-500 to-pink-600',
      'from-yellow-500 to-orange-600',
      'from-teal-500 to-cyan-600',
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-slate-700 dark:text-slate-300">{error || 'Incident not found'}</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Incidents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
            <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            className="gap-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 shadow-md hover:shadow-lg transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  {incident.title}
                  {(incident.status === 'investigating' || incident.acknowledged_by) && (
                    <Badge className="bg-green-600 text-white border-none">Acknowledged</Badge>
                  )}
                </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={getSeverityColor(incident.severity)}>
                {incident.severity}
              </Badge>
              <Badge className={getStatusColor(incident.status)}>
                {incident.status}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Incident Details */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Incident Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  Incident Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Quick Actions */}
                {incident.status !== 'resolved' && incident.status !== 'closed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-semibold text-white">
                        Quick Actions
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {incident.status === 'open' && (
                        <Button
                          onClick={handleAcknowledge}
                          disabled={isUpdatingStatus}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Acknowledge Incident
                        </Button>
                      )}
                      <Button
                        onClick={handleEscalate}
                        disabled={isUpdatingStatus}
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-900/20"
                      >
                        {isUpdatingStatus ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                        )}
                        Escalate Incident
                      </Button>
                      {(incident.status === 'acknowledged' || incident.status === 'open') && (
                        <Button
                          onClick={() => setShowResolveModal(true)}
                          disabled={isUpdatingStatus}
                          className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all md:col-span-2"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Resolved
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Status Update Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <h3 className="text-sm font-semibold text-white mb-3">Update Status</h3>
                  <div className="flex gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select status...</option>
                      <option value="open">Open</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={!newStatus || isUpdatingStatus}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Update'
                      )}
                    </Button>
                  </div>
                </motion.div>

                {/* Add Documentation Button (if resolved) */}
                {incident.status === 'resolved' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      onClick={() => setShowSaveResolutionModal(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Add Documentation
                    </Button>
                  </motion.div>
                )}

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-white">Description</label>
                  <p className="mt-2 text-white leading-relaxed">{incident.description}</p>
                </motion.div>

                {/* Incident Metadata Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-500" />
                      Reported By
                    </label>
                    <p className="text-white font-medium">{incident.reported_by || 'Unknown'}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Timestamp
                    </label>
                    <p className="text-white font-medium">{formatDate(incident.timestamp)}</p>
                  </motion.div>

                  {/* NEW: Assigned To / Handled By Section */}
                  {(incident.acknowledged_by || incident.escalated_by) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.52 }}
                      className="col-span-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <label className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {incident.escalated_by ? 'Escalated By' : 'Handled By'}
                      </label>
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                          incident.acknowledged_by_name || incident.escalated_by_name || 
                          incident.acknowledged_by || incident.escalated_by
                        )} flex items-center justify-center shadow-md`}>
                          <span className="text-sm font-bold text-white">
                            {getInitials(
                              incident.acknowledged_by_name || incident.escalated_by_name || 
                              incident.acknowledged_by || incident.escalated_by
                            )}
                          </span>
                        </div>
                        
                        {/* User Info */}
                        <div className="flex flex-col">
                          <span className="text-white font-semibold">
                            {incident.acknowledged_by_name || incident.escalated_by_name || 
                             incident.acknowledged_by || incident.escalated_by || 'Unknown User'}
                          </span>
                          {(incident.acknowledged_at || incident.escalated_at) && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {incident.escalated_by ? 'Escalated' : 'Acknowledged'} {getRelativeTime(incident.acknowledged_at || incident.escalated_at || '')}
                            </span>
                          )}
                          {incident.escalation_reason && (
                            <span className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                              <span className="font-medium">Reason:</span> {incident.escalation_reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {incident.location && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        Location
                      </label>
                      <p className="text-white font-medium">{incident.location}</p>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  Comments
                  <Badge variant="secondary" className="ml-2">
                    {comments.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Comment Input */}
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                      disabled={isSubmittingComment}
                      className="flex-1 border-slate-200 dark:border-slate-700 focus:border-orange-500 dark:focus:border-orange-400 transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400"
                    />
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {comments.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <MessageSquare className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="text-slate-600 dark:text-slate-300">
                          No comments yet. Be the first to comment!
                        </p>
                      </motion.div>
                    ) : (
                      comments.map((comment, index) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar with initials */}
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(comment.userFullname || comment.user_email)} flex items-center justify-center flex-shrink-0 shadow-md`}>
                              <span className="text-sm font-bold text-white">
                                {getInitials(comment.userFullname || comment.user_email || comment.user_id)}
                              </span>
                            </div>
                            
                            {/* Comment content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {comment.userFullname || comment.user_email || comment.user_id}
                                  </span>
                                  {comment.userFullname && (comment.userEmail || comment.user_email) && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {comment.userEmail || comment.user_email}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap" title={formatDate(comment.createdAt || comment.created_at || comment.timestamp || '')}>
                                  {getRelativeTime(comment.createdAt || comment.created_at || comment.timestamp || '')}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words">{comment.comment}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Right Column - AI Assistant */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card className="sticky top-6 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 shadow-md">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span>AI Assistant</span>
                    <span className="text-xs font-normal text-slate-300">Powered by Ollama</span>
                  </div>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {isChatOpen ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>

            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="p-4 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/30 dark:to-transparent">
                    {/* Chat Messages */}
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
                      {messages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.type === 'bot' && (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-purple-500/20">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div
                            className={`p-3.5 rounded-2xl max-w-[80%] shadow-md transition-all hover:shadow-lg ${
                              msg.type === 'user'
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-br-sm'
                                : 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/50 rounded-bl-sm'
                            }`}
                          >
                            <div className="text-sm leading-relaxed">
                              {msg.type === 'bot' ? (
                                <MarkdownContent content={msg.content} />
                              ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>
                            {msg.similarIncidents && msg.similarIncidents.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ delay: 0.2 }}
                                className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600/50"
                              >
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Similar Past Incidents
                                </p>
                                <div className="space-y-1.5">
                                  {msg.similarIncidents.map((inc, idx) => (
                                    <motion.p
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.3 + idx * 0.1 }}
                                      className="text-xs text-slate-700 dark:text-slate-300 pl-3 border-l-2 border-purple-500/40 hover:border-purple-500 transition-colors"
                                    >
                                      • {inc.title} <span className="text-purple-600 dark:text-purple-400 font-semibold">({(inc.similarity * 100).toFixed(0)}% match)</span>
                                    </motion.p>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </div>
                          {msg.type === 'user' && (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-orange-500/20">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {/* Streaming Message */}
                      {streamingMessage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex gap-3"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-purple-500/20">
                            <Sparkles className="h-4 w-4 text-white animate-pulse" />
                          </div>
                          <div className="p-3.5 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white max-w-[80%] shadow-md border border-purple-500/40">
                            <div className="text-sm leading-relaxed">
                              <MarkdownContent content={streamingMessage} />
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-600 dark:text-purple-400">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span className="animate-pulse">AI is thinking...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex gap-2"
                    >
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask AI for help..."
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAIMessage()}
                        disabled={isStreaming}
                        className="flex-1 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 transition-colors bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <Button
                        onClick={handleSendAIMessage}
                        disabled={!inputMessage.trim() || isStreaming}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {isStreaming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>

      {/* Save Resolution Modal */}
      <SaveResolutionModal
        isOpen={showSaveResolutionModal}
        onClose={() => setShowSaveResolutionModal(false)}
        incident={incident}
        onSuccess={(result) => {
          console.log('Resolution saved successfully:', result);
        }}
      />

      {/* Resolve Incident Modal */}
      <ResolveIncidentModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        incident={incident}
        onSuccess={() => {
          loadIncident();
        }}
      />
      
      {/* Notification Modals */}
      {notification?.type === 'success' && (
        <SuccessModal
          isOpen={notification.show}
          onClose={() => setNotification(null)}
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
      
      {notification?.type === 'warning' && (
        <WarningModal
          isOpen={notification.show}
          onClose={() => setNotification(null)}
          title={notification.title}
          message={notification.message}
          details={notification.details}
        />
      )}
    </div>
  );
}