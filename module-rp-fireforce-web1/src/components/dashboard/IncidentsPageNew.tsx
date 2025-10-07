import { useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Plus,
  Grid,
  List,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function IncidentsPage() {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const itemsPerPage = 9;

  // Extended incidents data
  const allIncidents = [
    {
      id: "INC-001",
      title: "Database Connection Timeout",
      description: "Users experiencing slow response times due to database connectivity issues",
      severity: "High",
      status: "Open",
      assignee: "John Doe",
      createdAt: "2024-01-15 14:30",
      updatedAt: "2024-01-15 15:45"
    },
    {
      id: "INC-002", 
      title: "API Rate Limiting Issues",
      description: "Third-party API calls failing due to rate limit exceeded",
      severity: "Medium",
      status: "Investigating",
      assignee: "Jane Smith",
      createdAt: "2024-01-15 12:15",
      updatedAt: "2024-01-15 16:20"
    },
    {
      id: "INC-003",
      title: "SSL Certificate Expiry",
      description: "SSL certificate for main domain expired causing security warnings",
      severity: "Critical",
      status: "Resolved",
      assignee: "Mike Johnson",
      createdAt: "2024-01-14 09:00",
      updatedAt: "2024-01-15 11:30"
    },
    {
      id: "INC-004",
      title: "Load Balancer Configuration Error",
      description: "Traffic not properly distributed across server instances",
      severity: "High",
      status: "Open",
      assignee: "Sarah Wilson",
      createdAt: "2024-01-15 10:20",
      updatedAt: "2024-01-15 14:15"
    },
    {
      id: "INC-005",
      title: "Memory Leak in Authentication Service",
      description: "Authentication service consuming excessive memory over time",
      severity: "Medium",
      status: "Investigating",
      assignee: "David Brown",
      createdAt: "2024-01-14 16:45",
      updatedAt: "2024-01-15 09:30"
    },
    {
      id: "INC-006",
      title: "CDN Cache Invalidation Issue",
      description: "Static assets not updating after deployment",
      severity: "Low",
      status: "Open",
      assignee: "Emily Davis",
      createdAt: "2024-01-15 08:00",
      updatedAt: "2024-01-15 12:30"
    },
    {
      id: "INC-007",
      title: "Payment Gateway Timeout",
      description: "Payment processing failing with timeout errors",
      severity: "Critical",
      status: "Investigating",
      assignee: "Alex Chen",
      createdAt: "2024-01-15 13:20",
      updatedAt: "2024-01-15 17:00"
    },
    {
      id: "INC-008",
      title: "Email Service Delivery Delays",
      description: "Transactional emails experiencing significant delays",
      severity: "Medium",
      status: "Resolved",
      assignee: "Lisa Park",
      createdAt: "2024-01-14 11:30",
      updatedAt: "2024-01-15 10:45"
    }
  ];

  // Filter incidents based on search, status, and severity
  const filteredIncidents = allIncidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-500 text-white";
      case "Investigating":
        return "bg-yellow-500 text-white";
      case "Resolved":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "border-red-500 text-red-700 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/20";
      case "High":
        return "border-orange-500 text-orange-700 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950/20";
      case "Medium":
        return "border-yellow-500 text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950/20";
      case "Low":
        return "border-green-500 text-green-700 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/20";
      default:
        return "border-gray-500 text-gray-700 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950/20";
    }
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {currentIncidents.map((incident, index) => (
        <motion.div
          key={incident.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border border-slate-200 dark:border-white/20 h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {incident.id}
                  </h3>
                  <Badge className={getStatusColor(incident.status)}>
                    {incident.status}
                  </Badge>
                </div>
                <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                  {incident.severity}
                </Badge>
              </div>
              
              <h4 className="text-base font-medium text-slate-900 dark:text-white mb-2 line-clamp-1">
                {incident.title}
              </h4>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                {incident.description}
              </p>
              
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="text-slate-600 dark:text-slate-300">{incident.assignee}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-slate-600 dark:text-slate-300">{incident.createdAt}</span>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full text-slate-900 dark:text-white border-slate-200 dark:border-white/20">
                View Details
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/20 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/20 px-6 py-3">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          <div className="col-span-2">ID</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Severity</div>
          <div className="col-span-3">Title</div>
          <div className="col-span-2">Assignee</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y divide-slate-200 dark:divide-white/10">
        {currentIncidents.map((incident, index) => (
          <motion.div
            key={incident.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-2">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {incident.id}
                </span>
              </div>
              
              <div className="col-span-1">
                <Badge className={getStatusColor(incident.status)}>
                  {incident.status}
                </Badge>
              </div>
              
              <div className="col-span-1">
                <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                  {incident.severity}
                </Badge>
              </div>
              
              <div className="col-span-3">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate">
                    {incident.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    {incident.description}
                  </p>
                </div>
              </div>
              
              <div className="col-span-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {incident.assignee}
                </span>
              </div>
              
              <div className="col-span-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {incident.createdAt}
                </span>
              </div>
              
              <div className="col-span-1">
                <Button variant="outline" size="sm" className="text-slate-900 dark:text-white border-slate-200 dark:border-white/20">
                  View
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Incidents</h1>
          <p className="text-slate-600 dark:text-slate-200 mt-1">Manage and track system incidents</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Incident
        </Button>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 text-slate-900 dark:text-white"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-white/20 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
            </select>
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-white/20 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Severity</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-md p-1">
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('card')}
            className={viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-slate-600 dark:text-slate-300"
      >
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredIncidents.length)} of {filteredIncidents.length} incidents
      </motion.div>

      {/* Incidents Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {viewMode === 'card' ? renderCardView() : renderListView()}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="text-slate-900 dark:text-white border-slate-200 dark:border-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={page === currentPage 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' 
                  : 'text-slate-900 dark:text-white border-slate-200 dark:border-white/20'
                }
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="text-slate-900 dark:text-white border-slate-200 dark:border-white/20"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
