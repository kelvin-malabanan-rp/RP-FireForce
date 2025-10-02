import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Filter, 
  Search,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Timer,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUp,
  Grid3X3,
  List,
  SortAsc,
  Download,
  RefreshCw,
  Zap,
  Server,
  Database,
  Bug,
  BarChart3,
  Activity,
  Monitor,
  Flame,
  TrendingUp,
  Shield,
  Bell,
  Users,
  Settings,
  PlayCircle,
  PauseCircle,
  Star,
  Bookmark,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';
import IncidentsModal from './incidents_modal';

const IncidentsPage = () => {
  const [viewMode, setViewMode] = useState('cards');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch incidents from API
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://incident-webhook-api.rapidresponse.workers.dev/api/incidents');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const response_data = await response.json();
        
        // Extract the incidents array from the API response
        const incidents_array = response_data.data || [];
        
        // Transform API data to match our component structure
        const transformedIncidents = incidents_array.map(incident => ({
          id: incident.id,
          title: incident.title,
          description: incident.description,
          status: transformStatus(incident.status),
          severity: transformSeverity(incident.severity),
          assignee: incident.assigned_to || 'Unassigned',
          reporter: incident.reported_by,
          created: formatTimestamp(incident.timestamp),
          updated: formatTimestamp(incident.updated_at),
          resolved: incident.resolved_at ? formatTimestamp(incident.resolved_at) : null,
          resolvedBy: incident.resolved_by,
          source: incident.reported_by,
          location: incident.location,
          awsAlarmName: incident.aws_alarm_name,
          awsAccountId: incident.aws_account_id,
          awsConsoleUrl: incident.aws_console_url,
          priority: incident.priority || getPriorityFromSeverity(incident.severity)
        }));
        
        setIncidents(transformedIncidents);
        setError(null);
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError('Failed to fetch incidents. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  // Transform status from API to display format
  const transformStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'Open';
      case 'investigating': return 'Investigating';
      case 'resolved': return 'Resolved';
      case 'escalated': return 'Escalated';
      default: return 'Open';
    }
  };

  // Transform severity from API to display format
  const transformSeverity = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
  };

  // Get priority from severity if not provided
  const getPriorityFromSeverity = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 3;
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (err) {
      return timestamp;
    }
  };

  // Refresh incidents
  const refreshIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://incident-webhook-api.rapidresponse.workers.dev/api/incidents');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const response_data = await response.json();
      
      // Extract the incidents array from the API response
      const incidents_array = response_data.data || [];
      
      const transformedIncidents = incidents_array.map(incident => ({
        id: incident.id,
        title: incident.title,
        description: incident.description,
        status: transformStatus(incident.status),
        severity: transformSeverity(incident.severity),
        assignee: incident.assigned_to || 'Unassigned',
        reporter: incident.reported_by,
        created: formatTimestamp(incident.timestamp),
        updated: formatTimestamp(incident.updated_at),
        resolved: incident.resolved_at ? formatTimestamp(incident.resolved_at) : null,
        resolvedBy: incident.resolved_by,
        source: incident.reported_by,
        location: incident.location,
        awsAlarmName: incident.aws_alarm_name,
        awsAccountId: incident.aws_account_id,
        awsConsoleUrl: incident.aws_console_url,
        priority: incident.priority || getPriorityFromSeverity(incident.severity)
      }));
      
      setIncidents(transformedIncidents);
      setError(null);
    } catch (err) {
      console.error('Error refreshing incidents:', err);
      setError('Failed to refresh incidents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Check if incident is within timeframe
  const isWithinTimeframe = (incident) => {
    if (selectedTimeframe === 'all') return true;
    
    try {
      const now = new Date();
      const incidentDate = new Date(incident.created.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2})/, '$3-$1-$2T$4:$5:00'));
      const timeDiff = now - incidentDate;
      
      switch (selectedTimeframe) {
        case '24h': return timeDiff <= 24 * 60 * 60 * 1000;
        case '7d': return timeDiff <= 7 * 24 * 60 * 60 * 1000;
        case '30d': return timeDiff <= 30 * 24 * 60 * 60 * 1000;
        default: return true;
      }
    } catch (err) {
      console.warn('Error parsing date for timeframe filter:', incident.created);
      return true; // Include incident if date parsing fails
    }
  };

  // Filtering logic
  const filteredIncidents = incidents.filter(incident => {
    const matchesStatus = selectedStatus === 'all' || incident.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || incident.severity === selectedSeverity;
    const matchesTimeframe = isWithinTimeframe(incident);
    const matchesSearch = searchQuery === '' || 
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSeverity && matchesTimeframe && matchesSearch;
  });

  // Filter options based on actual data
  const statusOptions = [
    { value: 'all', label: 'All Status', count: incidents.length },
    { value: 'Open', label: 'Open', count: incidents.filter(i => i.status === 'Open').length },
    { value: 'Investigating', label: 'Investigating', count: incidents.filter(i => i.status === 'Investigating').length },
    { value: 'Resolved', label: 'Resolved', count: incidents.filter(i => i.status === 'Resolved').length },
    { value: 'Escalated', label: 'Escalated', count: incidents.filter(i => i.status === 'Escalated').length }
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severity', count: incidents.length },
    { value: 'Critical', label: 'Critical', count: incidents.filter(i => i.severity === 'Critical').length },
    { value: 'High', label: 'High', count: incidents.filter(i => i.severity === 'High').length },
    { value: 'Medium', label: 'Medium', count: incidents.filter(i => i.severity === 'Medium').length },
    { value: 'Low', label: 'Low', count: incidents.filter(i => i.severity === 'Low').length }
  ];

  // Helper function to check timeframe for counting
  const getTimeframeCount = (timeframe) => {
    if (timeframe === 'all') return incidents.length;
    
    const now = new Date();
    return incidents.filter(incident => {
      try {
        const incidentDate = new Date(incident.created.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2})/, '$3-$1-$2T$4:$5:00'));
        const timeDiff = now - incidentDate;
        
        switch (timeframe) {
          case '24h': return timeDiff <= 24 * 60 * 60 * 1000;
          case '7d': return timeDiff <= 7 * 24 * 60 * 60 * 1000;
          case '30d': return timeDiff <= 30 * 24 * 60 * 60 * 1000;
          default: return false;
        }
      } catch (err) {
        return false;
      }
    }).length;
  };

  const timeframeOptions = [
    { value: 'all', label: 'All Time', count: getTimeframeCount('all') },
    { value: '24h', label: 'Last 24 Hours', count: getTimeframeCount('24h') },
    { value: '7d', label: 'Last 7 Days', count: getTimeframeCount('7d') },
    { value: '30d', label: 'Last 30 Days', count: getTimeframeCount('30d') }
  ];

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
      case 'Open': return <AlertCircle className="w-4 h-4 mr-2" />;
      case 'Investigating': return <Eye className="w-4 h-4 mr-2" />;
      case 'Resolved': return <CheckCircle className="w-4 h-4 mr-2" />;
      case 'Escalated': return <ArrowUp className="w-4 h-4 mr-2" />;
      default: return <AlertTriangle className="w-4 h-4 mr-2" />;
    }
  };

  // Handle view incident
  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incident Management</h1>
            <p className="text-gray-600">Monitor and manage system incidents in real-time</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          
          <select 
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {severityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {timeframeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          
          <button 
            onClick={refreshIncidents}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg font-medium text-gray-600">Loading incidents...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Incidents</h3>
              <p className="text-red-700">{error}</p>
              <button 
                onClick={refreshIncidents}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incidents Display */}
      {!loading && !error && (
        <>
          {/* View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                Showing {filteredIncidents.length} of {incidents.length} incidents
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards View */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredIncidents.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No incidents found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                filteredIncidents.map((incident) => (
                  <div key={incident.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </div>
                        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(incident.status)}`}>
                          {getStatusIcon(incident.status)}
                          <span>{incident.status}</span>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-bold text-gray-900 mb-2">{incident.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{incident.description}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium text-gray-900">{incident.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Assignee:</span>
                        <span className="font-medium text-gray-900">{incident.assignee}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Source:</span>
                        <span className="font-medium text-gray-900">{incident.source}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium text-gray-900">{incident.created}</span>
                      </div>
                      {incident.location && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-900">{incident.location}</span>
                        </div>
                      )}
                      {incident.awsConsoleUrl && (
                        <div className="mt-3">
                          <a
                            href={incident.awsConsoleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View in AWS Console
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleViewIncident(incident)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">Incident</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">Status</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">Severity</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">Assignee</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">Source</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900">Created</th>
                      <th className="text-center py-4 px-6 font-bold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12">
                          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-600 mb-2">No incidents found</h3>
                          <p className="text-gray-500">Try adjusting your filters or search terms</p>
                        </td>
                      </tr>
                    ) : (
                      filteredIncidents.map((incident, index) => (
                        <tr key={incident.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="py-4 px-6">
                            <div>
                              <div className="text-sm text-gray-600 font-medium mb-1">{incident.id}</div>
                              <div className="font-bold text-gray-900">{incident.title}</div>
                              <div className="text-sm text-gray-700 mt-1 truncate max-w-xs">{incident.description}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(incident.status)}`}>
                              {getStatusIcon(incident.status)}
                              <span>{incident.status}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                              {incident.severity}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{incident.assignee}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">{incident.source}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-600">{incident.created}</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button 
                                onClick={() => handleViewIncident(incident)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Incidents Modal */}
      <IncidentsModal 
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default IncidentsPage;
