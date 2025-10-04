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
  ExternalLink,
  X
} from 'lucide-react';
import IncidentsModal from './incidents_modal';
import Pagination from '../../components/Pagination';

const IncidentsPage = ({ onViewIncident }) => {
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 9 items for 3x3 grid

  // Create incident form state
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    location: '',
    severity: 'medium'
  });
  const [isCreating, setIsCreating] = useState(false);

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedSeverity, selectedTimeframe, searchQuery]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Handle view incident - navigate within the app
  const handleViewIncident = (incident) => {
    // Use the callback from DashboardLayout to navigate to details page
    if (onViewIncident) {
      onViewIncident(incident.id);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  };

  // Create incident
  const handleCreateIncident = async () => {
    if (!newIncident.title.trim() || !newIncident.description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    setIsCreating(true);
    try {
      const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
      
      const response = await fetch(
        'https://incident-webhook-api.rapidresponse.workers.dev/api/incidents',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newIncident.title,
            description: newIncident.description,
            location: newIncident.location,
            reportedBy: userEmail,
            severity: newIncident.severity
          })
        }
      );

      if (response.ok) {
        alert('Incident created successfully');
        setNewIncident({
          title: '',
          description: '',
          location: '',
          severity: 'medium'
        });
        setIsCreateModalOpen(false);
        await refreshIncidents(); // Refresh incidents list
      } else {
        alert('Failed to create incident');
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      alert('Error creating incident');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Incident Management</h1>
              <p className="text-gray-500 mt-1">Monitor and manage system incidents in real-time</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Incident
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Critical</p>
                <p className="text-2xl font-bold text-red-600">{incidents.filter(i => i.severity === 'Critical').length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Open</p>
                <p className="text-2xl font-bold text-yellow-600">{incidents.filter(i => i.status === 'Open').length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{incidents.filter(i => i.status === 'Resolved').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, description, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-black"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
              
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 transition-colors ${
                    viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 transition-colors border-l border-gray-300 ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
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
          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600">
              Showing <span className="text-gray-900 font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredIncidents.length)}</span> of <span className="text-gray-900 font-semibold">{filteredIncidents.length}</span> incidents
              {filteredIncidents.length !== incidents.length && (
                <span className="text-gray-500"> (filtered from {incidents.length} total)</span>
              )}
            </p>
          </div>

          {/* Cards View */}
          {viewMode === 'cards' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginatedIncidents.length === 0 ? (
                  <div className="col-span-full bg-white rounded-xl p-12 text-center border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No incidents found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  paginatedIncidents.map((incident) => (
                  <div key={incident.id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                          <span className={`flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(incident.status)}`}>
                            {getStatusIcon(incident.status)}
                            {incident.status}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{incident.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{incident.description}</p>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-auto font-medium text-gray-900">{incident.created}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Reporter:</span>
                        <span className="ml-auto font-medium text-gray-900">{incident.reporter}</span>
                      </div>
                      
                      {incident.assignee && incident.assignee !== 'Unassigned' && (
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">Assignee:</span>
                          <span className="ml-auto font-medium text-gray-900">{incident.assignee}</span>
                        </div>
                      )}
                      
                      {incident.location && (
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">Location:</span>
                          <span className="ml-auto font-medium text-gray-900 truncate max-w-[150px]">{incident.location}</span>
                        </div>
                      )}
                      
                      {incident.awsAlarmName && (
                        <div className="flex items-center text-sm">
                          <Server className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">AWS Alarm:</span>
                          <span className="ml-auto font-medium text-gray-900 truncate max-w-[130px]">{incident.awsAlarmName}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleViewIncident(incident)}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                        {incident.awsConsoleUrl && (
                          <a
                            href={incident.awsConsoleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Open AWS Console"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination for Cards View */}
            {paginatedIncidents.length > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredIncidents.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
          ) : (
            /* List View */
            <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {paginatedIncidents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No incidents found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Incident Details</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Severity</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Reporter</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Location</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Created</th>
                        <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedIncidents.map((incident) => (
                        <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="max-w-md">
                              <div className="font-bold text-gray-900 mb-1">{incident.title}</div>
                              <div className="text-sm text-gray-600 line-clamp-1">{incident.description}</div>
                              <div className="text-xs text-gray-400 mt-1 font-mono">ID: {incident.id}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(incident.status)}`}>
                              {getStatusIcon(incident.status)}
                              {incident.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                              {incident.severity}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center text-sm">
                              <User className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900">{incident.reporter}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center text-sm">
                              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900 max-w-[150px] truncate">{incident.location || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400 mr-2" />
                              <span>{incident.created}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleViewIncident(incident)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {incident.awsConsoleUrl && (
                                <a
                                  href={incident.awsConsoleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                  title="Open AWS Console"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Pagination for List View */}
            {paginatedIncidents.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredIncidents.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            )}
            </>
          )}
        </>
      )}

      {/* Incidents Modal */}
      <IncidentsModal 
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={closeModal}
        onRefresh={refreshIncidents}
      />

      {/* Create Incident Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Incident</h2>
                  <p className="text-gray-600">Report a new system incident</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Incident Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black placeholder:text-gray-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Detailed description of the incident..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black placeholder:text-gray-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                  placeholder="Where is the incident occurring?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black placeholder:text-gray-500"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                >
                  <option value="low">Low - Minor issue, minimal impact</option>
                  <option value="medium">Medium - Moderate issue, some impact</option>
                  <option value="high">High - Serious issue, significant impact</option>
                  <option value="critical">Critical - Severe issue, major impact</option>
                </select>
              </div>

              {/* Severity Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Selected Severity:</p>
                <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-bold ${
                  newIncident.severity === 'critical' ? 'bg-red-600 text-white' :
                  newIncident.severity === 'high' ? 'bg-orange-500 text-white' :
                  newIncident.severity === 'medium' ? 'bg-yellow-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {newIncident.severity.charAt(0).toUpperCase() + newIncident.severity.slice(1)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIncident}
                disabled={isCreating || !newIncident.title.trim() || !newIncident.description.trim()}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Create Incident
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;
