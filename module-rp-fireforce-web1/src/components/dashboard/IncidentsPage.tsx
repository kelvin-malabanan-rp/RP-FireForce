import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Flame, 
  Plus, 
  Search, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  MapPin,
  Calendar,
  Activity,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { incidentService } from "../../services";
import type { Incident } from "../../types";
import { CreateIncidentModal } from "../modals/CreateIncidentModal";
import { IncidentDetailsPage } from "./IncidentDetailsPage";

// Extended Incident type to include email fields
interface ExtendedIncident extends Incident {
  assigned_to_email?: string;
  assignedToEmail?: string;
  reported_by?: string;
  reportedBy?: string;
  acknowledged_by?: string;
  acknowledged_by_name?: string;
}

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'open' | 'investigating' | 'acknowledged' | 'resolved' | 'escalated';
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type TimeframeFilter = 'all' | '24h' | '7d' | '30d';

export function IncidentsPage() {
  // State management
  const [incidents, setIncidents] = useState<ExtendedIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Load selected incident from localStorage
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(() => {
    return localStorage.getItem('selectedIncidentId');
  });
  
  // Check URL for incident ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const incidentIdFromUrl = urlParams.get('id');
    
    if (incidentIdFromUrl) {
      console.log('📧 Opening incident from URL:', incidentIdFromUrl);
      setSelectedIncidentId(incidentIdFromUrl);
      // Optional: Clean up URL
      window.history.replaceState({}, '', '/incidents');
    }
  }, []);

  // Save selected incident ID to localStorage whenever it changes
  useEffect(() => {
    if (selectedIncidentId) {
      localStorage.setItem('selectedIncidentId', selectedIncidentId);
    } else {
      localStorage.removeItem('selectedIncidentId');
    }
  }, [selectedIncidentId]);

  // Filter & view state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 9 : 10;

  // Load incidents from API
  const loadIncidents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('📊 Loading incidents...');
      const response = await incidentService.getAllIncidents();
      
      console.log('✅ Incidents loaded:', response.data?.length || 0);
      setIncidents(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('❌ Error loading incidents:', err);
      setError(err.message || 'Failed to load incidents');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load incidents on mount
  useEffect(() => {
    loadIncidents();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadIncidents(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper: Check if incident is within timeframe
  const isWithinTimeframe = (incident: Incident): boolean => {
    if (timeframeFilter === 'all') return true;

    try {
      const now = new Date();
      const incidentDate = new Date(incident.timestamp || incident.created_at || '');
      const timeDiff = now.getTime() - incidentDate.getTime();

      switch (timeframeFilter) {
        case '24h':
          return timeDiff <= 24 * 60 * 60 * 1000;
        case '7d':
          return timeDiff <= 7 * 24 * 60 * 60 * 1000;
        case '30d':
          return timeDiff <= 30 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    } catch {
      return true;
    }
  };

  // Filtered incidents with memoization
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        incident.status?.toLowerCase() === statusFilter.toLowerCase();

      // Severity filter
      const matchesSeverity =
        severityFilter === 'all' ||
        incident.severity?.toLowerCase() === severityFilter.toLowerCase();

      // Timeframe filter
      const matchesTimeframe = isWithinTimeframe(incident);

      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        incident.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.location?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSeverity && matchesTimeframe && matchesSearch;
    });
  }, [incidents, statusFilter, severityFilter, timeframeFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, severityFilter, timeframeFilter, searchQuery, viewMode]);

  // Statistics
  const stats = useMemo(() => {
    const statusCounts = incidents.reduce((acc, incident) => {
      const status = incident.status?.toLowerCase() || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityCounts = incidents.reduce((acc, incident) => {
      const severity = incident.severity?.toLowerCase() || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: incidents.length,
      open: statusCounts['open'] || 0,
      investigating: statusCounts['investigating'] || 0,
      resolved: statusCounts['resolved'] || 0,
      critical: severityCounts['critical'] || 0,
      high: severityCounts['high'] || 0,
      active: (statusCounts['open'] || 0) + (statusCounts['investigating'] || 0) + (statusCounts['acknowledged'] || 0),
    };
  }, [incidents]);

  // Helper: Get assigned person (email or name, not user ID)
  const getAssignedPerson = (incident: ExtendedIncident): string | null => {
    // First check for explicit email fields
    if (incident.assigned_to_email) return incident.assigned_to_email;
    if (incident.assignedToEmail) return incident.assignedToEmail;
    
    // If acknowledged, use that person's info
    if (incident.acknowledged_by_name) return incident.acknowledged_by_name;
    if (incident.acknowledged_by && !incident.acknowledged_by.startsWith('user-')) {
      return incident.acknowledged_by;
    }
    
    // Only use assigned_to if it's not a user ID format
    if (incident.assigned_to && !incident.assigned_to.startsWith('user-')) {
      return incident.assigned_to;
    }
    
    return null;
  };

  // Helper: Get status badge styling
  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'open':
        return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'investigating':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'acknowledged':
        return 'bg-purple-500 text-white hover:bg-purple-600';
      case 'resolved':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'escalated':
        return 'bg-red-500 text-white hover:bg-red-600';
      default:
        return 'bg-slate-500 text-white hover:bg-slate-600';
    }
  };

  // Helper: Get severity badge styling
  const getSeverityBadge = (severity: string) => {
    const severityLower = severity?.toLowerCase() || '';
    switch (severityLower) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-600';
    }
  };

  // Helper: Get severity icon
  const getSeverityIcon = (severity: string) => {
    const severityLower = severity?.toLowerCase() || '';
    switch (severityLower) {
      case 'critical':
        return <Flame className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      case 'low':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Helper: Format timestamp
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return timestamp;
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-64 animate-pulse" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-96 animate-pulse" />
          </div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-40 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 h-32 border border-slate-200 dark:border-slate-700 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 h-64 border border-slate-200 dark:border-slate-700 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error && incidents.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Incidents</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <Button
                  onClick={() => loadIncidents()}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show incident details page if an incident is selected
  if (selectedIncidentId) {
    return (
      <IncidentDetailsPage 
        incidentId={selectedIncidentId} 
        onBack={() => setSelectedIncidentId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            Incidents
          </h1>
          <p className="text-slate-700 dark:text-slate-200 mt-2 text-lg">
            Manage and track incident resolution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => loadIncidents(true)}
            variant="outline"
            disabled={isRefreshing}
            className="gap-2 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Incident
          </Button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Incidents</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.total}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {stats.active} active
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Open</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.open}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Awaiting action
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Investigating</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.investigating}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    In progress
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Resolved</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.resolved}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {stats.critical} critical
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search incidents by title, description, ID, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value: string) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({incidents.length})</SelectItem>
                  <SelectItem value="open">Open ({stats.open})</SelectItem>
                  <SelectItem value="investigating">Investigating ({stats.investigating})</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved ({stats.resolved})</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>

              {/* Severity Filter */}
              <Select
                value={severityFilter}
                onValueChange={(value: string) => setSeverityFilter(value as SeverityFilter)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical ({stats.critical})</SelectItem>
                  <SelectItem value="high">High ({stats.high})</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Timeframe Filter */}
              <Select
                value={timeframeFilter}
                onValueChange={(value: string) => setTimeframeFilter(value as TimeframeFilter)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-900 dark:text-white'}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-900 dark:text-white'}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(statusFilter !== 'all' || severityFilter !== 'all' || timeframeFilter !== 'all' || searchQuery) && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    Status: {statusFilter}
                  </Badge>
                )}
                {severityFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                    Severity: {severityFilter}
                  </Badge>
                )}
                {timeframeFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                    Time: {timeframeFilter}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    Search: "{searchQuery}"
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setSeverityFilter('all');
                    setTimeframeFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Count */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span> to{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {Math.min(startIndex + itemsPerPage, filteredIncidents.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-900 dark:text-white">{filteredIncidents.length}</span> incidents
        </p>
      </motion.div>

      {/* Incidents Grid/List */}
      {paginatedIncidents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                <AlertCircle className="h-16 w-16 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No incidents found</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
                {searchQuery || statusFilter !== 'all' || severityFilter !== 'all' || timeframeFilter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'No incidents have been reported yet'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {paginatedIncidents.map((incident, index) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05, duration: 0.4 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20 transition-all h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle 
                        onClick={() => setSelectedIncidentId(incident.id)}
                        className="text-lg font-semibold text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {incident.title || 'Untitled Incident'}
                      </CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {incident.reported_by || incident.reportedBy || 'Unknown Reporter'}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(incident.status || 'unknown')}>
                      {incident.status || 'Unknown'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {incident.description || 'No description available'}
                  </p>

                  {/* Severity */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${getSeverityBadge(incident.severity || 'unknown')} flex items-center gap-1`}>
                      {getSeverityIcon(incident.severity || 'unknown')}
                      <span className="capitalize">{incident.severity || 'Unknown'}</span>
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {getAssignedPerson(incident) && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Users className="h-4 w-4" />
                        <span className="truncate">Assigned to: {getAssignedPerson(incident)}</span>
                      </div>
                    )}
                    {incident.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{incident.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatTimestamp(incident.timestamp || incident.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIncidentId(incident.id)}
                      className="w-full text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-700 hover:bg-transparent">
                  <TableHead className="w-[50px]">
                    <div className="flex items-center justify-center">
                      <Activity className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-white">Incident</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Severity</TableHead>
                  <TableHead className="text-white">Location</TableHead>
                  <TableHead className="text-white">Assigned To</TableHead>
                  <TableHead className="text-white">Time</TableHead>
                  <TableHead className="text-right text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIncidents.map((incident, index) => (
                  <motion.tr
                    key={incident.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedIncidentId(incident.id)}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <div className={`p-2 rounded-lg ${getSeverityBadge(incident.severity || 'unknown')}`}>
                          {getSeverityIcon(incident.severity || 'unknown')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-md">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {incident.title || 'Untitled Incident'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          Reported by: {incident.reported_by || incident.reportedBy || 'Unknown Reporter'}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                          {incident.description || 'No description available'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(incident.status || 'unknown')}>
                        {incident.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSeverityBadge(incident.severity || 'unknown')}>
                        <span className="capitalize">{incident.severity || 'Unknown'}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        {incident.location ? (
                          <>
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{incident.location}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        {getAssignedPerson(incident) ? (
                          <>
                            <Users className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{getAssignedPerson(incident)}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">{formatTimestamp(incident.timestamp || incident.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncidentId(incident.id);
                        }}
                        className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={
                    currentPage === pageNum
                      ? 'w-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                      : 'w-10 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadIncidents(true); // Refresh incidents list
        }}
      />
    </div>
  );
}