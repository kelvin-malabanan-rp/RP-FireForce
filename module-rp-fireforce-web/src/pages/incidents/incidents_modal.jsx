import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  User, 
  MapPin, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  ArrowUp,
  Bot,
  MessageSquare,
  Database,
  Server,
  Activity,
  Brain,
  Loader2,
  TrendingUp,
  Shield,
  Zap,
  Target,
  BarChart3,
  Send,
  UserCheck,
  XCircle,
  Edit3,
  Play,
  Pause
} from 'lucide-react';
import AIChatbot from './components/AIChatbot';

const IncidentsModal = ({ incident, isOpen, onClose, onRefresh }) => {
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

  // Fetch comments when modal opens - MUST be declared before any conditional returns
  useEffect(() => {
    if (isOpen && incident) {
      fetchComments();
      setSelectedStatus(incident.status);
    }
  }, [isOpen, incident]);

  // Fetch comments from API
  const fetchComments = async () => {
    if (!incident) return;
    
    setIsLoadingComments(true);
    try {
      const response = await fetch(
        `https://incident-webhook-api.rapidresponse.workers.dev/api/incidents-comment?incidentId=${incident.id}`
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

  // Submit new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const userId = localStorage.getItem('userId') || 'user-4';
      
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
        setNewComment('');
        await fetchComments(); // Refresh comments
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

  // Acknowledge incident
  const handleAcknowledge = async () => {
    setIsUpdating(true);
    try {
      const userId = localStorage.getItem('userId') || 'user-4';
      
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
        alert('Incident acknowledged successfully');
        if (onRefresh) onRefresh();
        onClose();
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

  // Resolve incident
  const handleResolve = async () => {
    if (!resolutionNote.trim()) {
      alert('Please provide a resolution note');
      return;
    }

    setIsUpdating(true);
    try {
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
        alert('Incident resolved successfully');
        setResolutionNote('');
        if (onRefresh) onRefresh();
        onClose();
      } else {
        alert('Failed to resolve incident');
      }
    } catch (error) {
      console.error('Error resolving incident:', error);
      alert('Error resolving incident');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update incident status
  const handleUpdateStatus = async () => {
    if (selectedStatus === incident.status) {
      alert('Please select a different status');
      return;
    }

    setIsUpdating(true);
    try {
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
        alert('Incident status updated successfully');
        setShowStatusUpdate(false);
        if (onRefresh) onRefresh();
        onClose();
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

  // Early return AFTER all hooks are declared
  if (!isOpen || !incident) return null;

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
      case 'Open': return <AlertCircle className="w-5 h-5" />;
      case 'Investigating': return <Eye className="w-5 h-5" />;
      case 'Resolved': return <CheckCircle className="w-5 h-5" />;
      case 'Escalated': return <ArrowUp className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Incident Details</h2>
              <p className="text-gray-600">ID: {incident.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Status and Severity */}
          <div className="flex flex-wrap items-center gap-4">
            <div className={`flex items-center px-4 py-2 rounded-full border ${getStatusColor(incident.status)}`}>
              {getStatusIcon(incident.status)}
              <span className="ml-2 font-semibold">{incident.status}</span>
            </div>
            <div className={`px-4 py-2 rounded-full font-semibold ${getSeverityColor(incident.severity)}`}>
              {incident.severity} Priority
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{incident.title}</h3>
              <p className="text-gray-700 leading-relaxed">{incident.description}</p>
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Assignment & Reporting
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
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

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Timeline
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
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

          {/* Location and AWS Details */}
          {(incident.location || incident.awsAlarmName || incident.awsAccountId) && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Server className="w-5 h-5 mr-2 text-blue-600" />
                System Information
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {incident.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Location:
                    </span>
                    <span className="font-medium text-gray-900">{incident.location}</span>
                  </div>
                )}
                {incident.awsAlarmName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center">
                      <Database className="w-4 h-4 mr-1" />
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
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in AWS Console
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Chatbot Section */}
          <AIChatbot incident={incident} />

          {/* Additional Metrics */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Additional Details
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Priority Level:</span>
                <span className="font-medium text-gray-900">P{incident.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Incident Type:</span>
                <span className="font-medium text-gray-900">System Alert</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-orange-600" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Acknowledge Button */}
              {incident.status !== 'Resolved' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={isUpdating}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck className="w-5 h-5 mr-2" />
                  Acknowledge Incident
                </button>
              )}
              
              {/* Update Status Button */}
              <button
                onClick={() => setShowStatusUpdate(!showStatusUpdate)}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit3 className="w-5 h-5 mr-2" />
                Update Status
              </button>
            </div>

            {/* Status Update Form */}
            {showStatusUpdate && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Select New Status:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                >
                  <option value="Open">Open</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Escalated">Escalated</option>
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || selectedStatus === incident.status}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Resolve Incident Form */}
            {incident.status !== 'Resolved' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Resolve Incident:
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Enter resolution details..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder:text-gray-500"
                />
                <button
                  onClick={handleResolve}
                  disabled={isUpdating || !resolutionNote.trim()}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Comments Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Comments & Activity
              {comments.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                  {comments.length}
                </span>
              )}
            </h4>

            {/* New Comment Input */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Add a comment:
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share updates, ask questions, or provide additional context..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-500"
              />
              <button
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || !newComment.trim()}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Comments List */}
            <div className="space-y-3">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No comments yet</p>
                  <p className="text-sm text-gray-500 mt-1">Be the first to comment on this incident</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments.map((comment, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">
                              {comment.userId || 'User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comment.timestamp ? new Date(comment.timestamp).toLocaleString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{comment.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentsModal;
