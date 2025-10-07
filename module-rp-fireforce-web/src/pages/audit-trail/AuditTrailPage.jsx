import React, { useState, useEffect } from 'react';
import { FileDown, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import AuditEventCard from './components/AuditEventCard';
import AuditFilters from './components/AuditFilters';
import AuditEventDetails from './components/AuditEventDetails';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { auditTrailService } from '../../services/api';

const AuditTrailPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const itemsPerPage = 20;

  // Filters
  const [filters, setFilters] = useState({
    dateRange: '7days',
    eventType: '',
    severity: '',
    deliveryStatus: '',
    searchQuery: '',
    userId: '',
    incidentId: '',
    startDate: '',
    endDate: '',
  });

  // Fetch audit trail events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters,
      };

      const response = await auditTrailService.getAuditTrail(params);
      
      if (response.success) {
        setEvents(response.data.events || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalEvents(response.data.pagination?.total || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch audit trail');
      }
    } catch (err) {
      console.error('Error fetching audit trail:', err);
      setError(err.message || 'Failed to load audit trail events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters/page change
  useEffect(() => {
    fetchEvents();
  }, [currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      dateRange: '7days',
      eventType: '',
      severity: '',
      deliveryStatus: '',
      searchQuery: '',
      userId: '',
      incidentId: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  // Toggle event expansion
  const handleToggleExpand = (eventId) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  // View event details in modal
  const handleViewDetails = (event) => {
    setSelectedEvent(event);
  };

  // Export audit trail
  const handleExport = async () => {
    try {
      setExporting(true);
      
      const params = {
        ...filters,
        format: 'csv', // or 'json', 'pdf'
      };

      const response = await auditTrailService.exportAuditTrail(params);
      
      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting audit trail:', err);
      alert('Failed to export audit trail. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchEvents();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-8 h-8 text-blue-600" />
                Audit Trail
              </h1>
              <p className="text-gray-600 mt-1">
                Complete history of notifications and user actions
              </p>
              {!loading && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {events.length} of {totalEvents.toLocaleString()} events
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileDown className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <AuditFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Audit Trail</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Audit Events Found"
            description="No events match your current filters. Try adjusting your search criteria."
            action={
              <button
                onClick={handleResetFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reset Filters
              </button>
            }
          />
        ) : (
          <>
            {/* Events List */}
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id}>
                  <AuditEventCard
                    event={event}
                    expanded={expandedEventId === event.id}
                    onToggle={() => handleToggleExpand(event.id)}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <AuditEventDetails
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AuditTrailPage;
