import { clsx } from 'clsx';

/**
 * Utility function for conditional class names
 */
export const cn = (...classes) => {
  return clsx(classes);
};

/**
 * Format alert priority based on type and severity
 */
export const getAlertPriority = (type, severity) => {
  if (type === 'critical') return 'high';
  if (type === 'warning' && severity >= 4) return 'medium';
  if (type === 'info' || severity <= 2) return 'low';
  return 'medium';
};

/**
 * Generate color classes based on alert type
 */
export const getAlertColors = (type, variant = 'default') => {
  const colorMap = {
    critical: {
      default: 'text-danger-600 bg-danger-50 border-danger-500',
      solid: 'text-white bg-danger-500 border-danger-500',
      outline: 'text-danger-600 bg-transparent border-danger-500'
    },
    warning: {
      default: 'text-warning-600 bg-warning-50 border-warning-500',
      solid: 'text-white bg-warning-500 border-warning-500',
      outline: 'text-warning-600 bg-transparent border-warning-500'
    },
    success: {
      default: 'text-success-600 bg-success-50 border-success-500',
      solid: 'text-white bg-success-500 border-success-500',
      outline: 'text-success-600 bg-transparent border-success-500'
    },
    info: {
      default: 'text-primary-600 bg-primary-50 border-primary-500',
      solid: 'text-white bg-primary-500 border-primary-500',
      outline: 'text-primary-600 bg-transparent border-primary-500'
    }
  };

  return colorMap[type]?.[variant] || colorMap.info[variant];
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Debounce function for search inputs
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Format numbers with K, M suffixes
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Sort alerts by priority and timestamp
 */
export const sortAlerts = (alerts, sortBy = 'timestamp', order = 'desc') => {
  return [...alerts].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[getAlertPriority(a.type, a.severity)];
        bValue = priorityOrder[getAlertPriority(b.type, b.severity)];
        break;
      case 'severity':
        aValue = a.severity;
        bValue = b.severity;
        break;
      case 'timestamp':
        aValue = new Date(a.timestamp);
        bValue = new Date(b.timestamp);
        break;
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      default:
        aValue = a[sortBy];
        bValue = b[sortBy];
    }
    
    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
};

/**
 * Export alerts to CSV
 */
export const exportToCSV = (alerts, filename = 'alerts.csv') => {
  const headers = ['ID', 'Title', 'Type', 'Severity', 'Status', 'Source', 'Assignee', 'Timestamp', 'Message'];
  const csvContent = [
    headers.join(','),
    ...alerts.map(alert => [
      alert.id,
      `"${alert.title.replace(/"/g, '""')}"`,
      alert.type,
      alert.severity,
      alert.status,
      alert.source,
      alert.assignee || '',
      new Date(alert.timestamp).toISOString(),
      `"${alert.message.replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Local storage helpers
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};
