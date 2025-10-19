// src/components/dashboard/AuditTrailPage.tsx - UPDATED WITH WORKING EXPORT

import { useState, useEffect } from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { auditService } from '../../services/auditService';
import { exportService } from '../../services/exportService'; // ✅ NEW IMPORT
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
    PlusCircle,
    ArrowRightCircle,
    AlertTriangle,
    FileSpreadsheet, // ✅ NEW ICON
    ChevronRight,
    PlusCircle,
    ArrowRightCircle,
    AlertTriangle,
    Globe,
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

interface AuditLog {
    id: string;
    incident_id?: string;
    user_id?: string;
    action: string;
    description?: string;
    details?: string | any;
    old_value?: string | null;
    new_value?: string | null;
    metadata?: string | any;
    ip_address?: string | null;
    user_agent?: string | null;
    created_at: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    user_name?: string;
    incident_title?: string;
}

// ✅ Timezone options
const timezoneOptions = [
    { value: 'America/New_York', label: 'Atlanta', shortLabel: 'EST/EDT', flag: '🇺🇸', offset: 'UTC-5/-4' },
    { value: 'Europe/Madrid', label: 'Spain', shortLabel: 'CET/CEST', flag: '🇪🇸', offset: 'UTC+1/+2' },
    { value: 'Asia/Manila', label: 'Philippines', shortLabel: 'PHT', flag: '🇵🇭', offset: 'UTC+8' },
];

export function AuditTrailPage() {
    const [allAuditLogs, setAllAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ REMOVED showAbsoluteTime state - always show absolute time
    const [selectedTimezone, setSelectedTimezone] = useState<string>('Asia/Manila');

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [incidentFilter, setIncidentFilter] = useState<string>("");
    const [userFilter, setUserFilter] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Stats
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [uniqueActions, setUniqueActions] = useState<string[]>([]);

    // Export Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState<string>("");
    const [exportEndDate, setExportEndDate] = useState<string>("");
    const [exportActionFilter, setExportActionFilter] = useState<string>("all");
    const [exportUserFilter, setExportUserFilter] = useState<string>("all");
    const [exportIncidentFilter, setExportIncidentFilter] = useState<string>("");
    const [isExporting, setIsExporting] = useState(false);
  // All audit logs from API
  const [allAuditLogs, setAllAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [incidentFilter, setIncidentFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Stats
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exportActionFilter, setExportActionFilter] = useState<string>("all");
  const [exportUserFilter, setExportUserFilter] = useState<string>("all");
  const [exportIncidentFilter, setExportIncidentFilter] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv'); // ✅ NEW STATE
  const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadAuditLogs();
        loadStats();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [actionFilter, incidentFilter, userFilter, startDate, endDate, searchQuery]);

    const loadAuditLogs = async () => {
        setIsLoading(true);
        try {
            const result = await auditService.getAuditLogs({});
            setAllAuditLogs(result.logs || []);

            if (result.logs && result.logs.length > 0) {
                const actions = Array.from(new Set(result.logs.map(log => log.action)));
                setUniqueActions(actions);
            }
        } catch (error) {
            console.error("Error loading audit logs:", error);
            setAllAuditLogs([]);
        } finally {
            setIsLoading(false);
        }
    };
  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const result = await auditService.getAuditLogs({});
      setAllAuditLogs(result.logs || []);

      if (result.logs && result.logs.length > 0) {
        const actions = Array.from(new Set(result.logs.map(log => log.action)));
        setUniqueActions(actions);
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
      setAllAuditLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

    const loadStats = async () => {
        try {
            const stats = await auditService.getAuditStats(startDate, endDate);
            if (stats && stats.top_users) {
                setTopUsers(stats.top_users || []);
            }

            if (stats && stats.action_breakdown) {
                const actions = Object.keys(stats.action_breakdown);
                if (actions.length > 0) {
                    setUniqueActions(prev => {
                        const combined = Array.from(new Set([...prev, ...actions]));
                        return combined;
                    });
                }
            }
        } catch (error) {
            console.warn("Error loading stats:", error);
        }
    };

    // ✅ Format timestamp in selected timezone - ALWAYS ABSOLUTE
    const formatInTimezone = useCallback((dateString: string, format: 'full' | 'short') => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';

            if (format === 'full') {
                return date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                    timeZone: selectedTimezone,
                    timeZoneName: 'short'
                });
            } else {
                // Short format for display
                return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: selectedTimezone,
                });
            }
        } catch (error) {
            return dateString;
        }
    }, [selectedTimezone]);

    const filteredLogs = useMemo(() => {
        let filtered = [...allAuditLogs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(query) ||
        log.description?.toLowerCase().includes(query) ||
        log.user_name?.toLowerCase().includes(query) ||
        log.first_name?.toLowerCase().includes(query) ||
        log.last_name?.toLowerCase().includes(query) ||
        log.incident_title?.toLowerCase().includes(query)
      );
    }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(log =>
                log.action.toLowerCase().includes(query) ||
                log.description?.toLowerCase().includes(query) ||
                log.user_name?.toLowerCase().includes(query) ||
                log.first_name?.toLowerCase().includes(query) ||
                log.last_name?.toLowerCase().includes(query) ||
                log.incident_title?.toLowerCase().includes(query)
            );
        }

    if (actionFilter && actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
        if (actionFilter && actionFilter !== 'all') {
            filtered = filtered.filter(log => log.action === actionFilter);
        }

    if (userFilter && userFilter !== 'all') {
      filtered = filtered.filter(log => log.user_id === userFilter);
    }
        if (userFilter && userFilter !== 'all') {
            filtered = filtered.filter(log => log.user_id === userFilter);
        }

    if (incidentFilter) {
      filtered = filtered.filter(log => 
        log.incident_id?.toLowerCase().includes(incidentFilter.toLowerCase())
      );
    }
        if (incidentFilter) {
            filtered = filtered.filter(log =>
                log.incident_id?.toLowerCase().includes(incidentFilter.toLowerCase())
            );
        }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= start;
      });
    }
        if (startDate) {
            const start = new Date(startDate + 'T00:00:00');
            filtered = filtered.filter(log => new Date(log.created_at) >= start);
        }

        if (endDate) {
            const end = new Date(endDate + 'T23:59:59');
            filtered = filtered.filter(log => new Date(log.created_at) <= end);
        }

        return filtered;
    }, [allAuditLogs, searchQuery, actionFilter, userFilter, incidentFilter, startDate, endDate]);

    const displayedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);
  const getPaginatedLogs = () => {
    const filtered = getFilteredLogs();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // ✅ UPDATED: Client-side CSV/Excel export
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      console.log('📊 Starting export...');
      console.log('📋 Export filters:', {
        startDate: exportStartDate,
        endDate: exportEndDate,
        action: exportActionFilter,
        userId: exportUserFilter,
        incidentId: exportIncidentFilter,
        format: exportFormat
      });

      // Apply export filters to all logs
      const filters = {
        startDate: exportStartDate,
        endDate: exportEndDate,
        action: exportActionFilter,
        userId: exportUserFilter,
        incidentId: exportIncidentFilter,
      };

      // Use the export service to filter and download
      exportService.applyFiltersAndExport(allAuditLogs, filters, exportFormat);

      console.log('✅ Export successful!');

      // Close modal and reset
      setIsExportModalOpen(false);
      setExportStartDate('');
      setExportEndDate('');
      setExportActionFilter('all');
      setExportUserFilter('all');
      setExportIncidentFilter('');

    } catch (error: any) {
      console.error("❌ Export error:", error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };
    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            let queryParams = [];
            if (exportIncidentFilter) queryParams.push(`incidentId=${exportIncidentFilter}`);
            if (exportUserFilter && exportUserFilter !== 'all') queryParams.push(`userId=${exportUserFilter}`);
            if (exportActionFilter && exportActionFilter !== 'all') queryParams.push(`action=${exportActionFilter}`);
            if (exportStartDate) queryParams.push(`startDate=${exportStartDate}`);
            if (exportEndDate) queryParams.push(`endDate=${exportEndDate}`);
            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const url = `/api/audit/logs/export/csv${queryString}`;

            const token = localStorage.getItem('authToken');
            const headers = new Headers();
            if (token) headers.append('Authorization', `Bearer ${token}`);
            const response = await fetch(`${API_BASE_URL}${url}`, { method: 'GET', headers });

            if (!response.ok) {
                alert("Failed to export CSV.");
                return;
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;

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
            setIsExportModalOpen(false);
            alert("CSV exported successfully!");
        } catch (error) {
            console.error("Error exporting CSV:", error);
            alert("Failed to export CSV.");
        } finally {
            setIsExporting(false);
        }
    };

    const getActionIcon = (action: string) => {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes("create")) return <PlusCircle className="h-5 w-5 text-green-500" />;
        if (lowerAction.includes("resolve")) return <CheckCircle className="h-5 w-5 text-emerald-400" />;
        if (lowerAction.includes("accept") || lowerAction.includes("acknowledge")) return <ArrowRightCircle className="h-5 w-5 text-blue-400" />;
        if (lowerAction.includes("update") || lowerAction.includes("change")) return <RefreshCw className="h-5 w-5 text-yellow-400" />;
        if (lowerAction.includes("escalate")) return <AlertTriangle className="h-5 w-5 text-orange-500" />;
        if (lowerAction.includes("delete") || lowerAction.includes("remove")) return <XCircle className="h-5 w-5 text-red-500" />;
        return <Info className="h-5 w-5 text-slate-400" />;
    };
  // ✅ NEW: Quick export current view
  const handleQuickExport = () => {
    try {
      const filters = {
        startDate,
        endDate,
        action: actionFilter,
        userId: userFilter,
        incidentId: incidentFilter,
      };

      exportService.applyFiltersAndExport(filteredLogs, filters, 'csv');

      console.log('✅ Quick export successful!');
    } catch (error: any) {
      console.error("❌ Quick export error:", error);
      alert(`Export failed: ${error.message}`);
    }
  };

  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes("create"))
      return <PlusCircle className="h-5 w-5 text-green-500" />;

    if (lowerAction.includes("resolve"))
      return <CheckCircle className="h-5 w-5 text-emerald-400" />;

    if (lowerAction.includes("accept") || lowerAction.includes("acknowledge"))
      return <ArrowRightCircle className="h-5 w-5 text-blue-400" />;

    if (lowerAction.includes("update") || lowerAction.includes("change"))
      return <RefreshCw className="h-5 w-5 text-yellow-400" />;

    if (lowerAction.includes("escalate"))
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;

    if (lowerAction.includes("delete") || lowerAction.includes("remove"))
      return <XCircle className="h-5 w-5 text-red-500" />;

    return <Info className="h-5 w-5 text-slate-400" />;
  };

    const getActionBadgeColor = (action: string) => {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes("create")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        if (lowerAction.includes("resolve")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
        if (lowerAction.includes("accept") || lowerAction.includes("acknowledge")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        if (lowerAction.includes("update") || lowerAction.includes("change")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
        if (lowerAction.includes("escalate")) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
        if (lowerAction.includes("delete") || lowerAction.includes("remove")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    };
  const getActionBadgeColor = (action: string) => {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes("create"))
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";

    if (lowerAction.includes("resolve"))
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";

    if (lowerAction.includes("accept") || lowerAction.includes("acknowledge"))
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";

    if (lowerAction.includes("update") || lowerAction.includes("change"))
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";

    if (lowerAction.includes("escalate"))
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";

    if (lowerAction.includes("delete") || lowerAction.includes("remove"))
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  };

    const clearFilters = useCallback(() => {
        setActionFilter('all');
        setUserFilter('all');
        setIncidentFilter('');
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    }, []);

    const currentTz = timezoneOptions.find(tz => tz.value === selectedTimezone);

    return (
        <div className="space-y-6 p-6">
            {/* Header - REMOVED TOGGLE BUTTON */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                        <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Audit Trail</h1>
                        <p className="text-slate-300 mt-1">Track all system activities and incident changes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* ✅ Timezone selector only - no toggle button */}
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 min-w-[320px]">
                        <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                            <SelectTrigger className="bg-transparent border-none text-white h-8 flex-1">
                                <SelectValue>
                                    <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      <span>{currentTz?.flag}</span>
                      <span>{currentTz?.label} ({currentTz?.shortLabel})</span>
                    </span>
                                        <span className="text-slate-400 text-xs ml-2">{currentTz?.offset}</span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {timezoneOptions.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        <div className="flex items-center justify-between w-full min-w-[250px]">
                      <span className="flex items-center gap-2">
                        <span>{tz.flag}</span>
                        <span>{tz.label} ({tz.shortLabel})</span>
                      </span>
                                            <span className="text-xs text-slate-400 ml-4">{tz.offset}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline" onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 text-white border-slate-600 hover:bg-slate-800">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <Button onClick={loadAuditLogs} disabled={isLoading} className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700">
                        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Refresh
                    </Button>
                </div>
            </motion.div>
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
          {/* ✅ UPDATED: Quick Export Button */}
          <Button
            variant="outline"
            onClick={handleQuickExport}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 text-white border-slate-600 hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Quick Export ({filteredLogs.length})
          </Button>

          {/* Advanced Export Button */}
          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 text-white border-slate-600 hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Options
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
                  <Select value={actionFilter} onValueChange={setActionFilter}>
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
                  <Select value={userFilter} onValueChange={setUserFilter}>
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
                    onChange={(e) => setIncidentFilter(e.target.value)}
                    placeholder="Incident ID..."
                    className="border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 text-white"
                  />
                </div>
              </div>
            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-sm text-slate-400 mb-1">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-10 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-slate-400 mb-1">Action</Label>
                                    <Select value={actionFilter} onValueChange={setActionFilter}>
                                        <SelectTrigger><SelectValue placeholder="All Actions" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Actions</SelectItem>
                                            {uniqueActions.map((action) => <SelectItem key={action} value={action}>{action}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm text-slate-400 mb-1">User</Label>
                                    <Select value={userFilter} onValueChange={setUserFilter}>
                                        <SelectTrigger><SelectValue placeholder="All Users" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            {topUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.action_count})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm text-slate-400 mb-1">Incident ID</Label>
                                    <Input value={incidentFilter} onChange={(e) => setIncidentFilter(e.target.value)} placeholder="Incident ID..." className="text-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                                <div>
                                    <Label className="text-sm text-slate-400 mb-1">Start Date</Label>
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-white" />
                                </div>
                                <div>
                                    <Label className="text-sm text-slate-400 mb-1">End Date</Label>
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-white" />
                                </div>
                                <div className="flex justify-end">
                                    {(actionFilter !== 'all' || userFilter !== 'all' || incidentFilter || startDate || endDate || searchQuery) && (
                                        <Button variant="outline" onClick={clearFilters} className="text-white border-slate-600 hover:bg-slate-800">
                                            <XCircle className="h-4 w-4 mr-2" />Clear Filters
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Logs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-white flex-wrap">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            Activity Log
                            <Badge variant="secondary" className="ml-2">{filteredLogs.length} {filteredLogs.length === 1 ? 'event' : 'events'}</Badge>
                            <Badge className="ml-auto bg-slate-700 text-slate-300 flex items-center gap-1.5">
                                {currentTz?.flag} {currentTz?.label} ({currentTz?.shortLabel})
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>
                        ) : displayedLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                                <p className="text-slate-600 dark:text-slate-300">No audit logs found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {displayedLogs.map((log, index) => (
                                    <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 mt-1">{getActionIcon(log.action)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="text-sm font-semibold text-white">{log.action}</h3>
                                                            <Badge className={getActionBadgeColor(log.action)}>{log.action}</Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{log.description || 'No description'}</p>
                                                        {log.incident_id && (
                                                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                                                <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{log.incident_id}</span>
                                                                {log.incident_title && (<><span>•</span><span>{log.incident_title}</span></>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            <span>{log.first_name && log.last_name ? `${log.first_name} ${log.last_name}` : log.user_name || log.user_id || 'System'}</span>
                                                        </div>
                                                        {/* ✅ ALWAYS SHOW ABSOLUTE TIME */}
                                                        <div className="flex items-center gap-1 cursor-help" title={formatInTimezone(log.created_at, 'full')}>
                                                            <Clock className="h-3 w-3" />
                                                            <span className="font-mono">{formatInTimezone(log.created_at, 'short')}</span>
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

            {/* Pagination */}
            {!isLoading && displayedLogs.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="text-white border-slate-600 hover:bg-slate-800">
                            <ChevronLeft className="h-4 w-4 mr-1" />Previous
                        </Button>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Page {currentPage} of {totalPages || 1}</div>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="text-white border-slate-600 hover:bg-slate-800">
                            Next<ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Export Modal */}
            <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2"><Download className="h-6 w-6 text-purple-500" />Export Audit Logs</DialogTitle>
                        <DialogDescription className="text-slate-400">Configure filters to export specific logs</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label className="text-sm text-slate-300">Start Date</Label><Input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
                            <div><Label className="text-sm text-slate-300">End Date</Label><Input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="bg-slate-800 border-slate-600 text-white" /></div>
                        </div>
                        <div><Label className="text-sm text-slate-300">Action</Label>
                            <Select value={exportActionFilter} onValueChange={setExportActionFilter}>
                                <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All</SelectItem>{uniqueActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsExportModalOpen(false)} className="text-white border-slate-600">Cancel</Button>
                        <Button onClick={handleExportCSV} disabled={isExporting} className="bg-gradient-to-r from-purple-500 to-blue-600">
                            {isExporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting...</> : <><Download className="h-4 w-4 mr-2" />Export</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
      {/* ✅ UPDATED: Export Modal with Format Selection */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Download className="h-6 w-6 text-purple-500" />
              Export Audit Logs
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure filters and format to export specific audit logs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* ✅ NEW: Format Selection */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Export Format</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportFormat === 'csv'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Download className={`h-5 w-5 ${
                      exportFormat === 'csv' ? 'text-purple-400' : 'text-slate-400'
                    }`} />
                    <div className="text-left">
                      <p className={`font-medium ${
                        exportFormat === 'csv' ? 'text-white' : 'text-slate-300'
                      }`}>
                        CSV
                      </p>
                      <p className="text-xs text-slate-400">
                        Excel, Sheets compatible
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    exportFormat === 'excel'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className={`h-5 w-5 ${
                      exportFormat === 'excel' ? 'text-green-400' : 'text-slate-400'
                    }`} />
                    <div className="text-left">
                      <p className={`font-medium ${
                        exportFormat === 'excel' ? 'text-white' : 'text-slate-300'
                      }`}>
                        Excel
                      </p>
                      <p className="text-xs text-slate-400">
                        Native .xlsx format
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

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

            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Filter by Action</Label>
              <Select value={exportActionFilter} onValueChange={setExportActionFilter}>
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

            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Filter by User</Label>
              <Select value={exportUserFilter} onValueChange={setExportUserFilter}>
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

            <div className="space-y-2">
              <Label className="text-sm text-slate-300">Filter by Incident ID (Optional)</Label>
              <Input
                value={exportIncidentFilter}
                onChange={(e) => setExportIncidentFilter(e.target.value)}
                placeholder="Enter incident ID..."
                className="bg-slate-800 border-slate-600 text-white focus:border-purple-500"
              />
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Export Information</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>The file will include all matching audit logs based on your filters</li>
                    <li>Date range is optional - leave empty to export all dates</li>
                    <li>{exportFormat === 'excel' ? 'Excel format (.xlsx) works with Microsoft Excel' : 'CSV format (.csv) works with Excel, Google Sheets, etc.'}</li>
                    <li>The file will download automatically when ready</li>
                    <li>Total logs to export: <strong className="text-blue-200">{allAuditLogs.length}</strong></li>
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
              className={`${
                exportFormat === 'excel'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700'
              } text-white`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  {exportFormat === 'excel' ? (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export {exportFormat === 'excel' ? 'Excel' : 'CSV'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}