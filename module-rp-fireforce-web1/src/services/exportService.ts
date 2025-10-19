// src/services/exportService.ts

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  action?: string;
  userId?: string;
  incidentId?: string;
}

class ExportService {
  /**
   * Convert audit logs to CSV format
   */
  convertToCSV(logs: any[]): string {
    if (!logs || logs.length === 0) {
      return 'No data to export';
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Action',
      'Description',
      'User Name',
      'User Email',
      'Incident ID',
      'Incident Title',
      'Timestamp',
      'Details'
    ];

    // Convert headers to CSV row
    const csvHeaders = headers.map(h => `"${h}"`).join(',');

    // Convert each log to CSV row
    const csvRows = logs.map(log => {
      const row = [
        log.id || '',
        log.action || '',
        (log.description || '').replace(/"/g, '""'), // Escape quotes
        `${log.first_name || ''} ${log.last_name || ''}`.trim() || log.user_name || '',
        log.email || '',
        log.incident_id || '',
        (log.incident_title || '').replace(/"/g, '""'), // Escape quotes
        log.created_at || '',
        JSON.stringify(log.details || {}).replace(/"/g, '""') // Escape JSON
      ];

      // Wrap each field in quotes and join with comma
      return row.map(field => `"${field}"`).join(',');
    });

    // Combine headers and rows
    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Download CSV file
   */
  downloadCSV(csvContent: string, filename: string = 'audit-trail.csv'): void {
    // Create blob from CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  /**
   * Convert to Excel-compatible CSV (with UTF-8 BOM)
   */
  convertToExcelCSV(logs: any[]): string {
    const csv = this.convertToCSV(logs);
    // Add UTF-8 BOM for Excel compatibility
    return '\uFEFF' + csv;
  }

  /**
   * Download Excel file
   */
  downloadExcel(csvContent: string, filename: string = 'audit-trail.xlsx'): void {
    // For Excel, we use UTF-8 BOM and .xlsx extension (it will still be CSV format)
    const excelContent = '\uFEFF' + csvContent;
    const blob = new Blob([excelContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Generate filename with filters and date
   */
  generateFilename(filters: ExportFilters, extension: 'csv' | 'xlsx' = 'csv'): string {
    const parts: string[] = ['audit-trail'];
    
    if (filters.startDate) {
      parts.push(`from-${filters.startDate}`);
    }
    if (filters.endDate) {
      parts.push(`to-${filters.endDate}`);
    }
    if (filters.action && filters.action !== 'all') {
      parts.push(filters.action.toLowerCase().replace(/_/g, '-'));
    }
    if (filters.incidentId) {
      parts.push(`incident-${filters.incidentId}`);
    }
    
    // Add current date
    const today = new Date().toISOString().split('T')[0];
    parts.push(today);
    
    return `${parts.join('-')}.${extension}`;
  }

  /**
   * Export audit logs with filters
   */
  async exportAuditLogs(
    logs: any[], 
    filters: ExportFilters, 
    format: 'csv' | 'excel' = 'csv'
  ): Promise<void> {
    if (!logs || logs.length === 0) {
      throw new Error('No data to export');
    }

    console.log(`📥 Exporting ${logs.length} audit logs as ${format.toUpperCase()}...`);

    const csvContent = format === 'excel' 
      ? this.convertToExcelCSV(logs)
      : this.convertToCSV(logs);

    const filename = this.generateFilename(filters, format === 'excel' ? 'xlsx' : 'csv');

    if (format === 'excel') {
      this.downloadExcel(csvContent, filename);
    } else {
      this.downloadCSV(csvContent, filename);
    }

    console.log(`✅ Export complete: ${filename}`);
  }

  /**
   * Export with client-side filtering
   * This applies filters to the logs before exporting
   */
  applyFiltersAndExport(
    allLogs: any[],
    filters: ExportFilters,
    format: 'csv' | 'excel' = 'csv'
  ): void {
    let filtered = [...allLogs];

    // Apply filters
    if (filters.action && filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.userId && filters.userId !== 'all') {
      filtered = filtered.filter(log => log.user_id === filters.userId);
    }

    if (filters.incidentId) {
      filtered = filtered.filter(log => 
        log.incident_id?.toLowerCase().includes(filters.incidentId!.toLowerCase())
      );
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= start;
      });
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate <= end;
      });
    }

    // Export filtered logs
    this.exportAuditLogs(filtered, filters, format);
  }
}

// Export singleton instance
export const exportService = new ExportService();
export default exportService;