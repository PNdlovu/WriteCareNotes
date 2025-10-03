import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  List,
  IconButton,
  FAB,
  Portal,
  Dialog,
  TextInput as PaperTextInput,
  Switch as PaperSwitch
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { HandoverSummary, ResidentSummary, MedicationSummary, IncidentSummary, AlertSummary } from '../../../shared/types/handover';

interface HandoverScreenProps {
  navigation: any;
  route: any;
}

export const HandoverScreen: React.FC<HandoverScreenProps> = ({ navigation, route }) => {
  const [handoverSummaries, setHandoverSummaries] = useState<HandoverSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<HandoverSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSummary, setEditingSummary] = useState<HandoverSummary | null>(null);

  const { departmentId, shiftType } = route.params || {};

  useEffect(() => {
    loadHandoverSummaries();
  }, [departmentId, shiftType]);

  const loadHandoverSummaries = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real implementation, this would call the API
      const mockSummaries: HandoverSummary[] = [
        {
          summaryId: 'summary-1',
          handoverDate: new Date('2025-01-15'),
          shiftType: 'day',
          departmentId: departmentId || 'dept-1',
          generatedBy: 'nurse-1',
          residents: {
            totalResidents: 25,
            newAdmissions: 2,
            discharges: 1,
            criticalUpdates: [
              {
                residentId: 'res-1',
                residentName: 'John Smith',
                roomNumber: '101',
                careLevel: 'High',
                keyUpdates: ['Improved mobility', 'Medication adjusted'],
                concerns: ['Requires assistance with walking'],
                actionRequired: true,
                followUpDate: new Date('2025-01-16')
              }
            ],
            medicationChanges: [],
            carePlanUpdates: []
          },
          medications: {
            totalMedications: 45,
            newMedications: 3,
            discontinuedMedications: 1,
            doseChanges: 2,
            prnGiven: 5,
            medicationAlerts: []
          },
          incidents: {
            totalIncidents: 2,
            criticalIncidents: 0,
            falls: 1,
            medicationErrors: 0,
            behavioralIncidents: 1,
            incidentDetails: [
              {
                incidentId: 'inc-1',
                incidentType: 'Fall',
                residentId: 'res-2',
                description: 'Minor fall in bathroom, no injury',
                severity: 'low',
                timeOccurred: new Date('2025-01-15T14:30:00'),
                actionsTaken: ['Assessed resident', 'Documented incident'],
                followUpRequired: false,
                familyNotified: true
              }
            ]
          },
          alerts: {
            totalAlerts: 3,
            criticalAlerts: 0,
            medicalAlerts: 2,
            safetyAlerts: 1,
            familyAlerts: 0,
            alertDetails: [
              {
                alertId: 'alert-1',
                alertType: 'medical',
                severity: 'medium',
                description: 'Blood pressure elevated',
                residentId: 'res-3',
                location: 'Room 103',
                timeRaised: new Date('2025-01-15T16:00:00'),
                status: 'active',
                assignedTo: 'nurse-2'
              }
            ]
          },
          aiProcessing: {
            processingTime: 2500,
            confidenceScore: 0.92,
            dataSources: ['shift_notes', 'incidents', 'medications'],
            modelVersion: '1.0.0',
            qualityScore: 88
          },
          gdprCompliant: true,
          piiMasked: true,
          auditTrail: [],
          createdAt: new Date('2025-01-15T18:00:00'),
          updatedAt: new Date('2025-01-15T18:00:00')
        }
      ];

      setHandoverSummaries(mockSummaries);
    } catch (error) {
      console.error('Failed to load handover summaries:', error);
      Alert.alert('Error', 'Failed to load handover summaries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHandoverSummaries();
    setIsRefreshing(false);
  };

  const handleGenerateAI = async () => {
    try {
      // Mock AI generation
      Alert.alert('AI Generation', 'Generating handover summary...');
      // In real implementation, this would call the AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadHandoverSummaries();
      setShowAIGenerator(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate AI summary');
    }
  };

  const handleEditSummary = (summary: HandoverSummary) => {
    setEditingSummary(summary);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      // In real implementation, this would call the update API
      console.log('Saving edited summary:', editingSummary);
      setShowEditModal(false);
      setEditingSummary(null);
      await loadHandoverSummaries();
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading handover summaries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Daily Handover</Text>
          <Text style={styles.headerSubtitle}>
            {shiftType ? `${shiftType.charAt(0).toUpperCase() + shiftType.slice(1)} Shift` : 'All Shifts'}
          </Text>
        </View>

        {/* AI Generation Button */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.aiGenerationCard}>
              <Icon name="smart-toy" size={24} color="#1976d2" />
              <View style={styles.aiGenerationText}>
                <Text style={styles.aiGenerationTitle}>AI-Powered Summary</Text>
                <Text style={styles.aiGenerationSubtitle}>
                  Generate intelligent handover summary from shift data
                </Text>
              </View>
              <Button
                mode="contained"
                onPress={() => setShowAIGenerator(true)}
                style={styles.generateButton}
              >
                Generate
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Handover Summaries */}
        {handoverSummaries.map((summary) => (
          <Card key={summary.summaryId} style={styles.card}>
            <Card.Content>
              <View style={styles.summaryHeader}>
                <View>
                  <Title style={styles.summaryTitle}>
                    {formatDate(summary.handoverDate)}
                  </Title>
                  <Paragraph style={styles.summarySubtitle}>
                    {summary.shiftType.charAt(0).toUpperCase() + summary.shiftType.slice(1)} Shift
                  </Paragraph>
                </View>
                <View style={styles.summaryActions}>
                  <IconButton
                    icon="edit"
                    size={20}
                    onPress={() => handleEditSummary(summary)}
                  />
                  <IconButton
                    icon="eye"
                    size={20}
                    onPress={() => setSelectedSummary(summary)}
                  />
                </View>
              </View>

              {/* Summary Stats */}
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{summary.residents.totalResidents}</Text>
                  <Text style={styles.statLabel}>Residents</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{summary.incidents.totalIncidents}</Text>
                  <Text style={styles.statLabel}>Incidents</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{summary.alerts.totalAlerts}</Text>
                  <Text style={styles.statLabel}>Alerts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{summary.medications.totalMedications}</Text>
                  <Text style={styles.statLabel}>Medications</Text>
                </View>
              </View>

              {/* Critical Items */}
              {(summary.residents.criticalUpdates.length > 0 || 
                summary.incidents.criticalIncidents > 0 || 
                summary.alerts.criticalAlerts > 0) && (
                <View style={styles.criticalSection}>
                  <Text style={styles.criticalTitle}>Critical Items</Text>
                  {summary.residents.criticalUpdates.map((resident) => (
                    <Chip
                      key={resident.residentId}
                      style={[styles.criticalChip, { backgroundColor: '#ffebee' }]}
                      textStyle={{ color: '#c62828' }}
                    >
                      {resident.residentName} - {resident.roomNumber}
                    </Chip>
                  ))}
                  {summary.incidents.criticalIncidents > 0 && (
                    <Chip
                      style={[styles.criticalChip, { backgroundColor: '#fff3e0' }]}
                      textStyle={{ color: '#ef6c00' }}
                    >
                      {summary.incidents.criticalIncidents} Critical Incidents
                    </Chip>
                  )}
                  {summary.alerts.criticalAlerts > 0 && (
                    <Chip
                      style={[styles.criticalChip, { backgroundColor: '#fce4ec' }]}
                      textStyle={{ color: '#ad1457' }}
                    >
                      {summary.alerts.criticalAlerts} Critical Alerts
                    </Chip>
                  )}
                </View>
              )}

              {/* AI Processing Info */}
              <View style={styles.aiInfo}>
                <Text style={styles.aiInfoText}>
                  AI Quality: {summary.aiProcessing.qualityScore}% | 
                  Confidence: {Math.round(summary.aiProcessing.confidenceScore * 100)}%
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}

        {handoverSummaries.length === 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.emptyState}>
                <Icon name="assignment" size={48} color="#757575" />
                <Text style={styles.emptyStateTitle}>No Handover Summaries</Text>
                <Text style={styles.emptyStateText}>
                  Generate your first AI-powered handover summary
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setShowAIGenerator(true)}
                  style={styles.emptyStateButton}
                >
                  Generate Summary
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* FAB for Quick Actions */}
      <FAB
        icon="add"
        style={styles.fab}
        onPress={() => setShowAIGenerator(true)}
      />

      {/* AI Generator Modal */}
      <Modal
        visible={showAIGenerator}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate AI Summary</Text>
            <TouchableOpacity onPress={() => setShowAIGenerator(false)}>
              <Icon name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.modalSectionTitle}>Data Sources</Text>
                <List.Item
                  title="Shift Notes"
                  left={() => <Icon name="note" size={20} color="#1976d2" />}
                  right={() => <Switch value={true} />}
                />
                <List.Item
                  title="Incident Reports"
                  left={() => <Icon name="warning" size={20} color="#f57c00" />}
                  right={() => <Switch value={true} />}
                />
                <List.Item
                  title="Medication Changes"
                  left={() => <Icon name="medication" size={20} color="#388e3c" />}
                  right={() => <Switch value={true} />}
                />
                <List.Item
                  title="Resident Updates"
                  left={() => <Icon name="person" size={20} color="#9c27b0" />}
                  right={() => <Switch value={true} />}
                />
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.modalSectionTitle}>Summary Options</Text>
                <List.Item
                  title="Include PII"
                  description="Include personally identifiable information"
                  left={() => <Icon name="security" size={20} color="#757575" />}
                  right={() => <Switch value={false} />}
                />
                <List.Item
                  title="Detail Level"
                  description="Comprehensive"
                  left={() => <Icon name="details" size={20} color="#757575" />}
                  right={() => <Icon name="chevron-right" size={20} color="#757575" />}
                />
              </Card.Content>
            </Card>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowAIGenerator(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleGenerateAI}
              style={styles.modalButton}
            >
              Generate Summary
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Summary Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Summary</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Icon name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {editingSummary && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.modalSectionTitle}>Residents</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingSummary.residents.totalResidents.toString()}
                    onChangeText={(text) => {
                      setEditingSummary({
                        ...editingSummary,
                        residents: {
                          ...editingSummary.residents,
                          totalResidents: parseInt(text) || 0
                        }
                      });
                    }}
                    keyboardType="numeric"
                    label="Total Residents"
                  />
                  
                  <Text style={styles.modalSectionTitle}>Incidents</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editingSummary.incidents.totalIncidents.toString()}
                    onChangeText={(text) => {
                      setEditingSummary({
                        ...editingSummary,
                        incidents: {
                          ...editingSummary.incidents,
                          totalIncidents: parseInt(text) || 0
                        }
                      });
                    }}
                    keyboardType="numeric"
                    label="Total Incidents"
                  />
                </Card.Content>
              </Card>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowEditModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveEdit}
              style={styles.modalButton}
            >
              Save Changes
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    padding: 16,
    backgroundColor: '#1976d2',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  aiGenerationCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiGenerationText: {
    flex: 1,
    marginLeft: 16,
  },
  aiGenerationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  aiGenerationSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  generateButton: {
    marginLeft: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  summaryActions: {
    flexDirection: 'row',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  criticalSection: {
    marginBottom: 16,
  },
  criticalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  criticalChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  aiInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  aiInfoText: {
    fontSize: 12,
    color: '#757575',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  textInput: {
    marginBottom: 16,
  },
});