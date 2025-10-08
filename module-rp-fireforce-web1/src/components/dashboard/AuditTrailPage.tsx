import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  User,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";

// API Base URL
const BASE_URL = "https://incident-webhook-api.rapidresponse.workers.dev";

interface AuditLog {
  id: string;
  incident_id?: string;
  user_id?: string;
  action: string;
  description?: string;
  details?: string | any; // Can be JSON string or object
  old_value?: string | null;
  new_value?: string | null;
  metadata?: string | any; // Can be JSON string or object
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  // Populated fields from API
  first_name?: string;
  last_name?: string;
  email?: string;
  user_name?: string;
  incident_title?: string;
}

interface NotificationResponse {
  id: string;
  notification_id: string;
  incident_id: string;
  user_id: string;
  response: string;
  response_time: number;
  responded_at: string;
  // Populated fields
  user_name?: string;
}

interface AuditStats {
  total_logs: number;
  unique_users: number;
  unique_incidents: number;
  action_breakdown: Record<string, number>;
  recent_activity_trend: number;
}

export function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [incidentFilter, setIncidentFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exportActionFilter, setExportActionFilter] = useState<string>("all");
  const [exportUserFilter, setExportUserFilter] = useState<string>("all");
  const [exportIncidentFilter, setExportIncidentFilter] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadAuditLogs();
    loadStats();
  }, [offset, actionFilter, incidentFilter, userFilter, startDate, endDate]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      let queryParams = `limit=${limit}&offset=${offset}`;
      
      if (incidentFilter) {
        queryParams += `&incidentId=${incidentFilter}`;
      }
      
      if (userFilter && userFilter !== 'all') {
        queryParams += `&userId=${userFilter}`;
      }
      
      if (actionFilter && actionFilter !== 'all') {
        queryParams += `&action=${actionFilter}`;
      }
      
      if (startDate) {
        queryParams += `&startDate=${startDate}`;
      }
      
      if (endDate) {
        queryParams += `&endDate=${endDate}`;
      }
      
      const response = await fetch(
        `${BASE_URL}/api/audit/logs?${queryParams}`
      );
      
      if (!response.ok) {
        console.error("Failed to fetch audit logs:", response.status);
        setAuditLogs([]);
        setIsLoading(false);
        return;
      }
      
      const result = await response.json();
      // API returns logs directly in the response, not nested in data
      setAuditLogs(result.logs || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      setAuditLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/audit/stats`);
      
      if (!response.ok) {
        console.warn("Failed to fetch audit stats:", response.status);
        return;
      }
      
      const result = await response.json();
      if (result.success && result.stats) {
        setStats(result.stats);
        setTopUsers(result.stats.top_users || []);
      }
    } catch (error) {
      console.warn("Error loading stats:", error);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Build query parameters for export
      let queryParams = [];
      
      if (exportIncidentFilter) {
        queryParams.push(`incidentId=${exportIncidentFilter}`);
      }
      
      if (exportUserFilter && exportUserFilter !== 'all') {
        queryParams.push(`userId=${exportUserFilter}`);
      }
      
      if (exportActionFilter && exportActionFilter !== 'all') {
        queryParams.push(`action=${exportActionFilter}`);
      }
      
      if (exportStartDate) {
        queryParams.push(`startDate=${exportStartDate}`);
      }
      
      if (exportEndDate) {
        queryParams.push(`endDate=${exportEndDate}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const url = `${BASE_URL}/api/audit/logs/export/csv${queryString}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        alert("Failed to export CSV. The endpoint may not be available yet.");
        setIsExporting(false);
        return;
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Generate filename with filters
      const filters = [];
      if (exportStartDate) filters.push(`from-${exportStartDate}`);
      if (exportEndDate) filters.push(`to-${exportEndDate}`);
      if (exportActionFilter !== 'all') filters.push(exportActionFilter);
      const filterString = filters.length > 0 ? `-${filters.join('-')}` : '';
      
      a.download = `audit-trail${filterString}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      // Close modal and reset filters
      setIsExportModalOpen(false);
      alert("CSV export completed successfully!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export CSV. Please try again later.");
    } finally {
      setIsExporting(false);
    }
  };

  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    
    if (lowerAction.includes('create')) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return <XCircle className="h-5 w-5 text-red-500" />;
    if (lowerAction.includes('update') || lowerAction.includes('change')) return <AlertCircle className="h-5 w-5 text-orange-500" />;
    if (lowerAction.includes('acknowledge')) return <CheckCircle className="h-5 w-5 text-blue-500" />;
    if (lowerAction.includes('escalate')) return <AlertCircle className="h-5 w-5 text-red-500" />;
    
    return <Info className="h-5 w-5 text-blue-500" />;
  };

  const getActionBadgeColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    
    if (lowerAction.includes('create')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (lowerAction.includes('update') || lowerAction.includes('change')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    if (lowerAction.includes('acknowledge')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (lowerAction.includes('escalate')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.incident_title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesFilter;
  });

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Audit Trail</h1>
            <p className="text-slate-300 mt-1">
              Track all system activities and incident changes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 text-white border-slate-600 hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={loadAuditLogs}
            disabled={isLoading}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="pb-2 flex items-center gap-2">
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col gap-6">
              {/* Main Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-slate-400 mb-1">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search audit logs..."
                      className="pl-10 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-slate-400 mb-1">Action</Label>
                  <Select
                    value={actionFilter}
                    onValueChange={(value: string) => {
                      setActionFilter(value);
                      setOffset(0);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {uniqueActions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-slate-400 mb-1">User</Label>
                  <Select
                    value={userFilter}
                    onValueChange={(value: string) => {
                      setUserFilter(value);
                      setOffset(0);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {topUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.action_count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-slate-400 mb-1">Incident ID</Label>
                  <Input
                    value={incidentFilter}
                    onChange={(e) => {
                      setIncidentFilter(e.target.value);
                      setOffset(0);
                    }}
                    placeholder="Incident ID..."
                    className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 text-white"
                  />
                </div>
              </div>

              {/* Date Range & Clear Button Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div>
                  <Label className="text-sm text-slate-400 mb-1">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setOffset(0);
                    }}
                    className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-400 mb-1">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setOffset(0);
                    }}
                    className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 text-white"
                  />
                </div>
                <div className="flex justify-end">
                  {(actionFilter !== 'all' || userFilter !== 'all' || incidentFilter || startDate || endDate) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionFilter('all');
                        setUserFilter('all');
                        setIncidentFilter('');
                        setSearchQuery('');
                        setStartDate('');
                        setEndDate('');
                        setOffset(0);
                      }}
                      className="text-white border-slate-600 hover:bg-slate-800"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Audit Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Activity Log
              <Badge variant="secondary" className="ml-2">
                {filteredLogs.length} events
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-300">No audit logs found</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(log.action)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-sm font-semibold text-white">
                                {log.action}
                              </h3>
                              <Badge className={getActionBadgeColor(log.action)}>
                                {log.action}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                              {log.description || 'No description'}
                            </p>

                            {log.incident_id && (
                              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Activity className="h-3 w-3" />
                                  {log.incident_id}
                                </span>
                                {log.incident_title && (
                                  <>
                                    <span className="text-slate-400 dark:text-slate-500">•</span>
                                    <span>{log.incident_title}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-col items-end gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>
                                {log.first_name && log.last_name 
                                  ? `${log.first_name} ${log.last_name}`
                                  : log.user_name || log.user_id || 'System'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1" title={formatDate(log.created_at)}>
                              <Clock className="h-3 w-3" />
                              <span>{getRelativeTime(log.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination Controls */}
      {!isLoading && filteredLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {offset + 1} - {Math.min(offset + limit, total)} of {total} logs
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="text-white border-slate-600 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="text-white border-slate-600 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Export CSV Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Download className="h-6 w-6 text-purple-500" />
              Export Audit Logs to CSV
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure filters to export specific audit logs. Leave filters empty to export all logs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Start Date</Label>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">End Date</Label>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white focus:border-purple-500"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Filter by Action</Label>
              <Select
                value={exportActionFilter}
                onValueChange={setExportActionFilter}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Filter */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Filter by User</Label>
              <Select
                value={exportUserFilter}
                onValueChange={setExportUserFilter}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {topUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.action_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Incident ID Filter */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Filter by Incident ID (Optional)</Label>
              <Input
                value={exportIncidentFilter}
                onChange={(e) => setExportIncidentFilter(e.target.value)}
                placeholder="Enter incident ID..."
                className="bg-slate-800 border-slate-600 text-white focus:border-purple-500"
              />
            </div>

            {/* Preview Info */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Export Information</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>The CSV will include all matching audit logs based on your filters</li>
                    <li>Date range is optional - leave empty to export all dates</li>
                    <li>Large exports may take a few moments to process</li>
                    <li>The file will be downloaded automatically when ready</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsExportModalOpen(false);
                // Reset export filters
                setExportStartDate('');
                setExportEndDate('');
                setExportActionFilter('all');
                setExportUserFilter('all');
                setExportIncidentFilter('');
              }}
              className="text-white border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
