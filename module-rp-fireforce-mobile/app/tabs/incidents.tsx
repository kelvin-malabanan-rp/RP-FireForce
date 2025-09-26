import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import {
    createIncident, getAllIncidents
} from "@/api/incident-controller";
import {
} from "@/types/response-types";
import {getSeverityColor, getStatusColor} from "@/constants/colors";
import {CreateIncidentData, Incident, IncidentUI, Stats} from "@/types/incident-types";

export default function IncidentsScreen() {
  const [incidents, setIncidents] = useState<IncidentUI[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    open: 0,
    investigating: 0,
    resolved: 0,
    critical: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [timeframe, setTimeframe] = useState<string>("24h");
  const [newIncident, setNewIncident] = useState({
        title: "",
        description: "",
        severity: "medium" as "low" | "medium" | "high" | "critical",
        location: "",
  });

  // Helper function to parse API datetime format "2025-09-23 10:58:35"
  const parseApiDateTime = (dateTimeString: string): Date => {
    const isoString = dateTimeString.replace(' ', 'T') + 'Z';
    return new Date(isoString);
  };

  // Transform API incident to UI incident format
  const transformApiIncident = (apiIncident: Incident): IncidentUI => ({
    id: apiIncident.id,
    title: apiIncident.title,
    description: apiIncident.description,
    severity: apiIncident.severity,
    status: apiIncident.status,
    timestamp: parseApiDateTime(apiIncident.timestamp),
    reportedBy: apiIncident.reported_by,
    location: apiIncident.location || undefined,
    assignedTo: apiIncident.assigned_to || undefined,
    resolvedBy: apiIncident.resolved_by || undefined,
    resolvedAt: apiIncident.resolved_at ? parseApiDateTime(apiIncident.resolved_at) : undefined,
    awsAlarmName: apiIncident.aws_alarm_name || undefined,
  });

    // Fetch incidents from API
    const fetchAllIncidents = async () => {
        try {
            console.log('Fetching incidents...'); // Debug log
            const response = await getAllIncidents();

            if (response.httpStatus === "OK" && response.data) {
                const transformedIncidents = response.data.map(transformApiIncident);
                setIncidents(transformedIncidents);
            }
        } catch (error) {
            console.error('Failed to fetch incidents:', error);
            Alert.alert(
                "Error",
                "Failed to load incidents. Please check your connection and try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

  // Initial data load - FIX: Remove functions from dependency array
  useEffect(() => {
    console.log('useEffect triggered - loading initial data'); // Debug log
    fetchAllIncidents();
  }, []); // ✅ Only depend on timeframe, not the functions

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchAllIncidents()]);
  }, [fetchAllIncidents]);

  const filteredIncidents = incidents.filter(
      (incident) => filterStatus === "all" || incident.status === filterStatus
  );

  const createNewIncident = async () => {
    if (!newIncident.title || !newIncident.description) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setCreating(true);
      try {
          const incidentData: CreateIncidentData = {
              title: newIncident.title,
              description: newIncident.description,
              severity: newIncident.severity,
              location: newIncident.location || null,
              reportedBy: "Mobile App User", // You can get this from auth context
          };

          const response = await createIncident(incidentData);

          // Check for successful response
          if (response.httpStatus === "OK" && response.data) {
              const transformedIncident = transformApiIncident(response.data);

              // Add to local state for immediate UI update
              setIncidents((prev) => [transformedIncident, ...prev]);

              // Update stats
              setStats(prev => ({
                  ...prev,
                  total: prev.total + 1,
                  open: prev.open + 1,
                  ...(newIncident.severity === 'critical' && { critical: prev.critical + 1 }),
              }));

              // Reset form
              setNewIncident({
                  title: "",
                  description: "",
                  severity: "medium",
                  location: "",
              });
              setModalVisible(false);
              Alert.alert("Success", response.message || "Incident created successfully");
          } else {
              // Handle API error response (httpStatus === "ERROR")
              throw new Error(response.message || "Failed to create incident");
          }
      } catch (error) {
          console.error('Failed to create incident:', error);
      } finally {
          setCreating(false);
      }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString();
  };

  // Show loading spinner on initial load
  if (loading) {
    return (
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading incidents...</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Incident Management</Text>
          <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
          >
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["all", "open", "investigating", "resolved"].map((status) => (
                <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterButton,
                      filterStatus === status && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterStatus(status)}
                >
                  <Text
                      style={[
                        styles.filterText,
                        filterStatus === status && styles.filterTextActive,
                      ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Incidents List */}
        <ScrollView
            style={styles.incidentsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
          {filteredIncidents.map((incident) => (
              <View key={incident.id} style={styles.incidentCard}>
                <View style={styles.incidentHeader}>
                  <View style={styles.incidentTitleRow}>
                    <Text style={styles.incidentTitle}>{incident.title}</Text>
                    <View
                        style={[
                          styles.severityBadge,
                          { backgroundColor: getSeverityColor(incident.severity) },
                        ]}
                    >
                      <Text style={styles.severityText}>
                        {incident.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.incidentMeta}>
                    <Text style={styles.incidentTime}>
                      {formatTimestamp(incident.timestamp)}
                    </Text>
                    <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(incident.status) },
                        ]}
                    >
                      <Text style={styles.statusText}>
                        {incident.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.incidentDescription}>
                  {incident.description}
                </Text>

                <View style={styles.incidentFooter}>
                  <Text style={styles.reportedBy}>
                    Reported by: {incident.reportedBy}
                  </Text>
                  {incident.location && (
                      <Text style={styles.location}>📍 {incident.location}</Text>
                  )}
                </View>

                {/* Additional info from API */}
                {incident.assignedTo && (
                    <Text style={styles.assignedTo}>
                      Assigned to: {incident.assignedTo}
                    </Text>
                )}
                {incident.awsAlarmName && (
                    <Text style={styles.awsInfo}>
                      AWS Alarm: {incident.awsAlarmName}
                    </Text>
                )}
              </View>
          ))}

          {filteredIncidents.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <IconSymbol
                    name="exclamationmark.triangle"
                    size={48}
                    color="#9CA3AF"
                />
                <Text style={styles.emptyText}>No incidents found</Text>
                <Text style={styles.emptySubtext}>
                  {filterStatus === "all"
                      ? "All systems are operational"
                      : `No incidents with status: ${filterStatus}`}
                </Text>
              </View>
          )}
        </ScrollView>

        {/* Create Incident Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Report New Incident</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <IconSymbol name="xmark" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TextInput
                  style={styles.input}
                  placeholder="Incident Title"
                  value={newIncident.title}
                  onChangeText={(text) =>
                      setNewIncident((prev) => ({ ...prev, title: text }))
                  }
              />

              <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description"
                  value={newIncident.description}
                  onChangeText={(text) =>
                      setNewIncident((prev) => ({ ...prev, description: text }))
                  }
                  multiline
                  numberOfLines={4}
              />

              <TextInput
                  style={styles.input}
                  placeholder="Location (optional)"
                  value={newIncident.location}
                  onChangeText={(text) =>
                      setNewIncident((prev) => ({ ...prev, location: text }))
                  }
              />

              <View style={styles.severitySelector}>
                <Text style={styles.severityLabel}>Severity:</Text>
                {["low", "medium", "high", "critical"].map((sev) => (
                    <TouchableOpacity
                        key={sev}
                        style={[
                          styles.severityOption,
                          newIncident.severity === sev && styles.severityOptionActive,
                          { borderColor: getSeverityColor(sev) },
                        ]}
                        onPress={() =>
                            setNewIncident((prev) => ({
                              ...prev,
                              severity: sev as "low" | "medium" | "high" | "critical",
                            }))
                        }
                    >
                      <Text
                          style={[
                            styles.severityOptionText,
                            newIncident.severity === sev && {
                              color: getSeverityColor(sev),
                            },
                          ]}
                      >
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </Text>
                    </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                  style={[styles.createButton, creating && styles.createButtonDisabled]}
                  onPress={createNewIncident}
                  disabled={creating}
              >
                {creating ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.createButtonText}>Create Incident</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#3B82F6",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statCard: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 80,
  },
  totalCard: { backgroundColor: "#EFF6FF" },
  openCard: { backgroundColor: "#FEF2F2" },
  investigatingCard: { backgroundColor: "#FEF3C7" },
  resolvedCard: { backgroundColor: "#F0FDF4" },
  criticalCard: { backgroundColor: "#FEE2E2" },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#3B82F6",
  },
  filterText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  incidentsList: {
    flex: 1,
    padding: 20,
  },
  incidentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  incidentHeader: {
    marginBottom: 12,
  },
  incidentTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  incidentMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  incidentTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  incidentDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  incidentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportedBy: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  assignedTo: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  awsInfo: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  severitySelector: {
    marginBottom: 20,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  severityOption: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  severityOptionActive: {
    backgroundColor: "#F9FAFB",
  },
  severityOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  createButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});