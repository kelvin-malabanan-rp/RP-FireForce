import { useState, useEffect } from 'react';
import {
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  View,
  Text,
  StyleSheet
} from 'react-native';
import { getAllIncidents, getIncidentStats } from '@/api/incident-controller';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import IncidentSummary from '@/components/incident-summary';
import { Incident } from '@/types/incident-types';
import {getStatusColor} from "@/constants/colors";

export default function HomeScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'open' | 'investigating' | 'resolved'>('open');
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({
    open: 0,
    investigating: 0,
    resolved: 0,
  });

  const ITEMS_PER_PAGE = 3;

  // Auto-refresh interval (30 seconds)
  const AUTO_REFRESH_INTERVAL = 30000;

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Set up auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing incidents...');
      loadData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [timeframe]);

  const loadData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setError(null);
      }

      // Fetch both incidents and stats in parallel
      const [incidentsResponse, statsResponse] = await Promise.all([
        getAllIncidents(),
        getIncidentStats(timeframe)
      ]);

      // Extract incidents - they're directly in data array
      if (incidentsResponse.data && Array.isArray(incidentsResponse.data)) {
        setIncidents(incidentsResponse.data);
      } else if (incidentsResponse.data?.incidents) {
        setIncidents(incidentsResponse.data.incidents);
      }

      // Extract stats from the wrapped response
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      if (!isAutoRefresh) {
        setError('Failed to load incidents. Pull to refresh.');
      }
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setError(null);
      await loadData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError('Failed to refresh incidents.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTimeframeChange = (newTimeframe: '24h' | '7d' | '30d') => {
    setTimeframe(newTimeframe);
  };

  // Temporary incident card renderer (use until AlarmCard is fixed)
  const renderIncidentCard = (incident: Incident) => {
    const severityColors = {
      critical: '#DC2626',
      high: '#EA580C',
      medium: '#D97706',
      low: '#16A34A',
    };

    return (
        <View style={styles.incidentCard}>
          <View style={styles.incidentHeader}>
            <Text style={styles.incidentTitle} numberOfLines={1}>
              {incident.title || incident.aws_alarm_name || 'Untitled Incident'}
            </Text>
            <View style={[styles.severityBadge, { backgroundColor: severityColors[incident.severity] }]}>
              <Text style={styles.severityText}>{incident.severity.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.incidentDescription} numberOfLines={2}>
            {incident.description || incident.state_reason || 'No description available'}
          </Text>
          <View style={styles.incidentFooter}>
            <Text style={styles.incidentLocation}>
              {incident.location || 'Unknown Location'}
            </Text>
            <Text style={styles.incidentTime}>
              {new Date(incident.timestamp || incident.created_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>
    );
  };

  // Convert incident to alarm format for AlarmCard compatibility
  const incidentToAlarm = (incident: Incident) => ({
    alarmName: incident.aws_alarm_name || incident.title || 'Untitled Incident',
    stateValue: incident.status?.toUpperCase() || 'OPEN',
    stateReason: incident.state_reason || incident.description || 'No description available',
    stateUpdatedTimestamp: incident.updated_at || incident.created_at || new Date().toISOString(),
    metricName: incident.metric_name || 'Incident',
    namespace: incident.location || 'General',
    statistic: incident.severity || 'medium',
    threshold: incident.severity || 'medium',
    comparisonOperator: '',
    evaluationPeriods: 0,
    period: 0,
    unit: '',
    dimensions: [],
    // Additional incident-specific fields
    id: incident.id,
    assigned_to: incident.assigned_to,
    resolved_at: incident.resolved_at,
    resolved_by: incident.resolved_by,
    reported_by: incident.reported_by,
    timestamp: incident.timestamp,
    aws_account_id: incident.aws_account_id,
    aws_console_url: incident.aws_console_url,
    statusColor: getStatusColor(incident.status),
  });

  // Group incidents by status
  const groupedIncidents = incidents.reduce((acc, incident) => {
    const status = incident.status || 'open';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(incident);
    return acc;
  }, {} as Record<string, Incident[]>);

  // Map incident status to display info
  const statusTabs = [
    {
      key: 'open',
      label: 'Open',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      count: groupedIncidents.open?.length || 0
    },
    {
      key: 'investigating',
      label: 'Investigating',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      count: groupedIncidents.investigating?.length || 0
    },
    {
      key: 'resolved',
      label: 'Resolved',
      color: '#10B981',
      bgColor: '#D1FAE5',
      count: groupedIncidents.resolved?.length || 0
    },
  ];

  // Get current status incidents with pagination
  const getAllStatusIncidents = groupedIncidents[selectedStatusTab] || [];

  const totalPages = Math.ceil(getAllStatusIncidents.length / ITEMS_PER_PAGE) || 1;
  const currentPageNum = currentPage[selectedStatusTab] || 0;

  // Get paginated incidents for current status
  const startIndex = currentPageNum * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentStatusIncidents = getAllStatusIncidents.slice(startIndex, endIndex);

  // Handle page navigation
  const handlePageChange = (direction: 'prev' | 'next') => {
    const newPage = direction === 'next'
        ? Math.min(currentPageNum + 1, totalPages - 1)
        : Math.max(currentPageNum - 1, 0);

    setCurrentPage(prev => ({
      ...prev,
      [selectedStatusTab]: newPage
    }));
  };

  // Reset page when switching tabs
  const handleTabChange = (tab: 'open' | 'investigating' | 'resolved') => {
    setSelectedStatusTab(tab);
    // Don't reset if already on page 0
    if (currentPage[tab] > 0 && currentPage[tab] >= Math.ceil((groupedIncidents[tab]?.length || 0) / ITEMS_PER_PAGE)) {
      setCurrentPage(prev => ({
        ...prev,
        [tab]: 0
      }));
    }
  };

  if (loading) {
    return (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <ThemedText style={styles.loadingText}>Loading incidents...</ThemedText>
        </ThemedView>
    );
  }

  return (
      <ThemedView style={styles.container}>
        <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#6366F1']} // Android
                  tintColor="#6366F1" // iOS
              />
            }
            showsVerticalScrollIndicator={false}
        >
          {/* Incident Summary Component */}
          <IncidentSummary
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
          />

          {/* Incidents Section */}
          <ThemedView style={styles.incidentsSection}>
            <ThemedText style={styles.sectionTitle}>
              Incidents & AWS Alarms
            </ThemedText>

            {error && (
                <ThemedView style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>
                    {error}
                  </ThemedText>
                </ThemedView>
            )}

            {/* Status Tabs */}
            <View style={styles.tabContainer}>
              {statusTabs.map((tab) => (
                  <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.tab,
                        selectedStatusTab === tab.key && styles.activeTab,
                        { borderBottomColor: selectedStatusTab === tab.key ? tab.color : 'transparent' }
                      ]}
                      onPress={() => handleTabChange(tab.key as any)}
                  >
                    <Text
                        style={[
                          styles.tabText,
                          selectedStatusTab === tab.key && styles.activeTabText,
                          { color: selectedStatusTab === tab.key ? tab.color : '#6B7280' }
                        ]}
                    >
                      {tab.label}
                    </Text>
                    <View
                        style={[
                          styles.badge,
                          { backgroundColor: tab.bgColor }
                        ]}
                    >
                      <Text style={[styles.badgeText, { color: tab.color }]}>
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
              ))}
            </View>

            {/* Incident Cards */}
            <View style={styles.cardsContainer}>
              {currentStatusIncidents.map((incident) => {
                console.log('Incident data:', incident);
                console.log('Alarm data:', incidentToAlarm(incident));
                return (
                    <View key={incident.id} style={styles.cardWrapper}>
                      {/* Temporary: Use custom renderer until AlarmCard is fixed */}
                      {renderIncidentCard(incident)}
                      {/* <AlarmCard alarm={incidentToAlarm(incident)} /> */}
                    </View>
                );
              })}

              {getAllStatusIncidents.length === 0 && (
                  <ThemedView style={styles.emptyState}>
                    <ThemedText style={styles.emptyText}>
                      No {statusTabs.find(tab => tab.key === selectedStatusTab)?.label.toLowerCase()} incidents
                    </ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                      {selectedStatusTab === 'open' ? 'All systems operational' :
                          selectedStatusTab === 'investigating' ? 'No ongoing investigations' :
                              'No recently resolved incidents'}
                    </ThemedText>
                  </ThemedView>
              )}

              {/* Pagination Controls */}
              {getAllStatusIncidents.length > ITEMS_PER_PAGE && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          currentPageNum === 0 && styles.paginationButtonDisabled
                        ]}
                        onPress={() => handlePageChange('prev')}
                        disabled={currentPageNum === 0}
                    >
                      <Text style={[
                        styles.paginationButtonText,
                        currentPageNum === 0 && styles.paginationButtonTextDisabled
                      ]}>Previous</Text>
                    </TouchableOpacity>

                    <View style={styles.paginationInfo}>
                      <Text style={styles.paginationText}>
                        Page {currentPageNum + 1} of {totalPages}
                      </Text>
                      <Text style={styles.paginationSubtext}>
                        {startIndex + 1}-{Math.min(endIndex, getAllStatusIncidents.length)} of {getAllStatusIncidents.length}
                      </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          currentPageNum >= totalPages - 1 && styles.paginationButtonDisabled
                        ]}
                        onPress={() => handlePageChange('next')}
                        disabled={currentPageNum >= totalPages - 1}
                    >
                      <Text style={[
                        styles.paginationButtonText,
                        currentPageNum >= totalPages - 1 && styles.paginationButtonTextDisabled
                      ]}>Next</Text>
                    </TouchableOpacity>
                  </View>
              )}
            </View>

            {/* Stats Summary */}
            {stats && incidents.length > 0 && (
                <ThemedView style={styles.statsFooter}>
                  <ThemedText style={styles.statsText}>
                    Total incidents in last {timeframe}: {incidents.length}
                  </ThemedText>
                </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  incidentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 6,
  },
  activeTabText: {
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardsContainer: {
    marginHorizontal: -4,
  },
  cardWrapper: {
    marginBottom: 12,
    marginHorizontal: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  statsFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  paginationButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paginationSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  incidentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  incidentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});