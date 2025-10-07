import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  ArrowLeft,
  User,
  Clock,
  MapPin,
  Server,
  Database,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowUp,
  Activity,
  Zap,
  MessageSquare,
  UserCheck,
  Edit3,
  Loader2,
  Send,
  Bot,
  Brain,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import StreamingChatbot from './components/StreamingChatbot';
import SaveResolutionModal from './components/SaveResolutionModal';
import IncidentAuditTimeline from './components/IncidentAuditTimeline';
import NotificationHistoryPanel from './components/NotificationHistoryPanel';
import { auditTrailService } from '../../services/api';

const IncidentDetailsPage = ({ incidentId, onBack }) => {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  // Action states
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  
  // Save Resolution Modal state
  const [showSaveResolutionModal, setShowSaveResolutionModal] = useState(false);
  const [showResolutionButton, setShowResolutionButton] = useState(false);

  useEffect(() => {
    if (incidentId) {
      fetchIncident();
      fetchComments();
    } else {
      // If no incidentId is provided, show error
      setLoading(false);
      setError('No incident ID provided. Please select an incident from the incidents page.');
    }
  }, [incidentId]);

  // Check if incident is already resolved on load
  useEffect(() => {
    if (incident && incident.status === 'Resolved') {
      setShowResolutionButton(true);
    }
  }, [incident]);

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://incident-webhook-api.rapidresponse.workers.dev/api/incidents');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const incidents = data.data || [];
      const found = incidents.find(inc => inc.id === incidentId);
      
      if (found) {
        setIncident({
          id: found.id,
          title: found.title,
          description: found.description,
          status: transformStatus(found.status),
          severity: transformSeverity(found.severity),
          assignee: found.assigned_to || 'Unassigned',
          reporter: found.reported_by,
          created: formatTimestamp(found.timestamp),
          updated: formatTimestamp(found.updated_at),
          resolved: found.resolved_at ? formatTimestamp(found.resolved_at) : null,
          resolvedBy: found.resolved_by,
          source: found.reported_by,
          location: found.location,
          awsAlarmName: found.aws_alarm_name,
          awsAccountId: found.aws_account_id,
          awsConsoleUrl: found.aws_console_url,
          priority: found.priority || getPriorityFromSeverity(found.severity)
        });
        setSelectedStatus(transformStatus(found.status));
      } else {
        setError('Incident not found');
      }
    } catch (err) {
      console.error('Error fetching incident:', err);
      setError('Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!incidentId) return;
    
    setIsLoadingComments(true);
    try {
      const response = await fetch(
        `https://incident-webhook-api.rapidresponse.workers.dev/api/incidents-comment?incidentId=${incidentId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const userId = localStorage.getItem('userId') || 'user-4';
      const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
      
      const response = await fetch(
        'https://incident-webhook-api.rapidresponse.workers.dev/api/incidents-comment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId: incident.id,
            userId: userId,
            comment: newComment
          })
        }
      );

      if (response.ok) {
        // Create audit log
        await auditTrailService.createAuditLog({
          action: 'comment_added',
          details: {
            comment: newComment.substring(0, 200), // Limit comment length in audit
            addedBy: userEmail
          },
          incidentId: incident.id,
          userId: userId
        });
        
        setNewComment('');
        await fetchComments();
      } else {
        alert('Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Error posting comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAcknowledge = async () => {
    setIsUpdating(true);
    try {
      const userId = localStorage.getItem('userId') || 'user-4';
      const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
      
      const response = await fetch(
        'https://incident-webhook-api.rapidresponse.workers.dev/api/incidents',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId: incident.id,
            action: 'acknowledge',
            userId: userId
          })
        }
      );

      if (response.ok) {
        // Create audit log
        await auditTrailService.createAuditLog({
          action: 'incident_acknowledged',
          details: {
            severity: incident.severity,
            description: incident.description,
            triggeredBy: userEmail,
            previousStatus: incident.status
          },
          incidentId: incident.id,
          userId: userId
        });
        
        alert('Incident acknowledged successfully');
        fetchIncident();
      } else {
        alert('Failed to acknowledge incident');
      }
    } catch (error) {
      console.error('Error acknowledging incident:', error);
      alert('Error acknowledging incident');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNote.trim()) {
      alert('Please provide a resolution note');
      return;
    }

    setIsUpdating(true);
    try {
      const userId = localStorage.getItem('userId') || 'user-4';
      const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
      
      const response = await fetch(
        `https://incident-webhook-api.rapidresponse.workers.dev/api/incidents/${incident.id}/resolve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId: incident.id,
            resolvedBy: userEmail,
            resolution: resolutionNote
          })
        }
      );

      if (response.ok) {
        // Create audit log
        await auditTrailService.createAuditLog({
          action: 'incident_resolved',
          details: {
            severity: incident.severity,
            description: incident.description,
            resolution: resolutionNote,
            resolvedBy: userEmail,
            previousStatus: incident.status
          },
          incidentId: incident.id,
          userId: userId
        });
        
        alert('Incident resolved successfully! ✅');
        
        // Update local incident state immediately
        setIncident(prev => ({
          ...prev,
          status: 'Resolved',
          resolved: new Date().toLocaleString(),
          resolvedBy: userEmail
        }));
        
        setResolutionNote('');
        setShowResolutionButton(true); // Show the "Save This Resolution" button
        
        // Fetch updated incident data
        setTimeout(() => {
          fetchIncident();
        }, 500);
      } else {
        // Try to get error message from response
        let errorMessage = 'Failed to resolve incident';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If can't parse JSON, use status text
          errorMessage = `Failed to resolve incident (${response.status} ${response.statusText})`;
        }
        
        console.error('Resolve error:', errorMessage);
        alert(`❌ ${errorMessage}\n\nThe backend may have an issue with the /resolve endpoint. However, you can still use the "Update Status" dropdown to change the status to "Resolved".`);
      }
    } catch (error) {
      console.error('Error resolving incident:', error);
      alert(`❌ Error resolving incident: ${error.message}\n\nTip: You can use the "Update Status" dropdown to manually set status to "Resolved".`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (selectedStatus === incident.status) {
      alert('Please select a different status');
      return;
    }

    setIsUpdating(true);
    try {
      const userId = localStorage.getItem('userId') || 'user-4';
      const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
      
      const response = await fetch(
        'https://incident-webhook-api.rapidresponse.workers.dev/api/incidents-status',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId: incident.id,
            newStatus: selectedStatus.toLowerCase(),
            resolvedBy: userEmail
          })
        }
      );

      if (response.ok) {
        // Create audit log
        await auditTrailService.createAuditLog({
          action: 'status_updated',
          details: {
            severity: incident.severity,
            previousStatus: incident.status,
            newStatus: selectedStatus,
            updatedBy: userEmail
          },
          incidentId: incident.id,
          userId: userId
        });
        
        alert('Incident status updated successfully! ✅');
        
        // Update local incident state immediately
        setIncident(prev => ({
          ...prev,
          status: selectedStatus,
          ...(selectedStatus === 'Resolved' ? {
            resolved: new Date().toLocaleString(),
            resolvedBy: userEmail
          } : {})
        }));
        
        setShowStatusUpdate(false);
        
        // If status changed to Resolved, show the Save Resolution button
        if (selectedStatus === 'Resolved') {
          setShowResolutionButton(true);
        }
        
        // Fetch updated incident data
        setTimeout(() => {
          fetchIncident();
        }, 500);
      } else {
        alert('Failed to update incident status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating incident status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper functions
  const transformStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'Open';
      case 'investigating': return 'Investigating';
      case 'resolved': return 'Resolved';
      case 'escalated': return 'Escalated';
      default: return 'Open';
    }
  };

  const transformSeverity = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getPriorityFromSeverity = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 3;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-900 border-red-200';
      case 'Investigating': return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Resolved': return 'bg-green-100 text-green-900 border-green-200';
      case 'Escalated': return 'bg-purple-100 text-purple-900 border-purple-200';
      default: return 'bg-gray-100 text-gray-900 border-gray-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return <AlertCircle className="w-4 h-4" />;
      case 'Investigating': return <Eye className="w-4 h-4" />;
      case 'Resolved': return <CheckCircle className="w-4 h-4" />;
      case 'Escalated': return <ArrowUp className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Error</p>
          <p className="text-gray-600 mb-4">{error || 'Incident not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Incidents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Incident Details</h1>
                <p className="text-sm text-gray-600">ID: {incident.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`flex items-center px-3 py-1.5 rounded-full border text-sm ${getStatusColor(incident.status)}`}>
                {getStatusIcon(incident.status)}
                <span className="ml-1.5 font-semibold">{incident.status}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-full font-semibold text-sm ${getSeverityColor(incident.severity)}`}>
                {incident.severity}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className={`${isChatOpen && !isChatExpanded ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            {/* Incident Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{incident.title}</h2>
              <p className="text-gray-700 leading-relaxed mb-6">{incident.description}</p>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment & Reporting */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Assignment & Reporting
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned to:</span>
                      <span className="font-medium text-gray-900">{incident.assignee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reported by:</span>
                      <span className="font-medium text-gray-900">{incident.reporter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Source:</span>
                      <span className="font-medium text-gray-900">{incident.source}</span>
                    </div>
                    {incident.resolvedBy && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resolved by:</span>
                        <span className="font-medium text-gray-900">{incident.resolvedBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    Timeline
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">{incident.created}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last updated:</span>
                      <span className="font-medium text-gray-900">{incident.updated}</span>
                    </div>
                    {incident.resolved && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Resolved:</span>
                        <span className="font-medium text-gray-900">{incident.resolved}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Information */}
              {(incident.location || incident.awsAlarmName || incident.awsAccountId) && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Server className="w-4 h-4 mr-2 text-blue-600" />
                    System Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    {incident.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          Location:
                        </span>
                        <span className="font-medium text-gray-900">{incident.location}</span>
                      </div>
                    )}
                    {incident.awsAlarmName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Database className="w-3 h-3 mr-1" />
                          AWS Alarm:
                        </span>
                        <span className="font-medium text-gray-900">{incident.awsAlarmName}</span>
                      </div>
                    )}
                    {incident.awsAccountId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">AWS Account ID:</span>
                        <span className="font-medium text-gray-900">{incident.awsAccountId}</span>
                      </div>
                    )}
                    {incident.awsConsoleUrl && (
                      <div className="pt-2 border-t border-gray-200">
                        <a
                          href={incident.awsConsoleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View in AWS Console
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <Zap className="w-5 h-5 mr-2 text-orange-600" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incident.status !== 'Resolved' && (
                  <button
                    onClick={handleAcknowledge}
                    disabled={isUpdating}
                    className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Acknowledge Incident
                  </button>
                )}
                
                <button
                  onClick={() => setShowStatusUpdate(!showStatusUpdate)}
                  className="flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Update Status
                </button>
              </div>

              {showStatusUpdate && (
                <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    Select New Status:
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="Open">Open</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdating || selectedStatus === incident.status}
                    className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Update Status
                      </>
                    )}
                  </button>
                </div>
              )}

              {incident.status !== 'Resolved' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    Resolve Incident:
                  </label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Enter resolution details..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-900 placeholder-gray-400"
                  />
                  <button
                    onClick={handleResolve}
                    disabled={isUpdating || !resolutionNote.trim()}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Resolving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve Incident
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Save Resolution Button - Shows after resolving incident */}
            {showResolutionButton && incident.status === 'Resolved' && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Brain className="w-6 h-6 mr-2 text-purple-600" />
                      <h3 className="text-lg font-bold text-gray-900">
                        Save This Resolution for AI Learning
                      </h3>
                    </div>
                    <p className="text-gray-700 text-sm mb-4">
                      Log this incident resolution so our AI can learn from it and provide better 
                      recommendations for similar incidents in the future.
                    </p>
                    <button
                      onClick={() => setShowSaveResolutionModal(true)}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                      <Brain className="w-5 h-5 mr-2" />
                      Save This Resolution
                    </button>
                  </div>
                  <button
                    onClick={() => setShowResolutionButton(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                Comments & Activity
                {comments.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                    {comments.length}
                  </span>
                )}
              </h3>

              <div className="mb-4 space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder-gray-400"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {isSubmittingComment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No comments yet</p>
                  </div>
                ) : (
                  comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900 text-sm">
                              {comment.userId || 'User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comment.timestamp ? new Date(comment.timestamp).toLocaleString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{comment.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Audit Timeline Section */}
            <IncidentAuditTimeline incidentId={incidentId} />

            {/* Notification History Section */}
            <NotificationHistoryPanel incidentId={incidentId} />
          </div>

          {/* Right Column - AI Chatbot */}
          {isChatOpen && !isChatExpanded && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <StreamingChatbot incident={incident} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Button (when closed) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Open AI Assistant
          </span>
        </button>
      )}

      {/* Save Resolution Modal */}
      <SaveResolutionModal
        isOpen={showSaveResolutionModal}
        onClose={() => setShowSaveResolutionModal(false)}
        incident={incident}
        onSuccess={(result) => {
          console.log('Resolution saved successfully:', result);
          setShowResolutionButton(false);
        }}
      />
    </div>
  );
};

export default IncidentDetailsPage;
