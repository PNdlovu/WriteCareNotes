/**
 * @fileoverview Resident Dashboard Interface for WriteCareNotes
 * @module ResidentDashboard
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive resident overview dashboard providing real-time
 * resident information, care plan status, medication summary, activity timeline,
 * and alert management. Central hub for all resident-related information.
 * 
 * @example
 * // Usage in care home management system
 * <ResidentDashboard
 *   residentId="resident-123"
 *   onAlertTriggered={handleAlert}
 *   onCareTaskUpdate={handleTaskUpdate}
 * />
 * 
 * @compliance
 * - CQC Person-Centered Care Standards
 * - Care Inspectorate Scotland Guidelines
 * - CIW Wales Care Standards
 * - RQIA Northern Ireland Standards
 * - GDPR Data Protection Requirements
 * 
 * @security
 * - Role-based access to resident information
 * - Audit trails for all resident data access
 * - Secure handling of sensitive personal data
 * - Family access controls and permissions
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  Tooltip
} from '@mui/material';im
port {
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Assignment as CareIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  LocalPharmacy as PharmacyIcon,
  Restaurant as MealIcon,
  DirectionsWalk as ActivityIcon,
  Favorite as HealthIcon,
  Family as FamilyIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { Button } from '../ui/Button';
import { Card as UICard } from '../ui/Card';
import { Badge as UIBadge } from '../ui/Badge';
import { Alert as UIAlert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Types and Interfaces
interface ResidentData {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  nhsNumber: string;
  roomNumber: string;
  admissionDate: Date;
  photo?: string;
  
  // Contact Information
  emergencyContacts: EmergencyContact[];
  familyContacts: FamilyContact[];
  gp: GPDetails;
  
  // Care Information
  careLevel: 'residential' | 'nursing' | 'dementia' | 'mental_health';
  mobilityLevel: 'independent' | 'assisted' | 'wheelchair' | 'bedbound';
  cognitiveStatus: 'alert' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  
  // Medical Information
  medicalConditions: MedicalCondition[];
  allergies: Allergy[];
  currentMedications: ResidentMedication[];
  
  // Care Plan
  carePlan: CarePlan;
  riskAssessments: RiskAssessment[];
  
  // Status and Alerts
  currentAlerts: ResidentAlert[];
  wellbeingScore: number; // 0-100
  lastAssessment: Date;
  
  // Preferences
  dietaryRequirements: string[];
  culturalNeeds: string[];
  religiousNeeds: string[];
  preferences: ResidentPreferences;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'discharged' | 'deceased' | 'temporary_absence';
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address: string;
  isPrimary: boolean;
  canMakeDecisions: boolean;
}

interface FamilyContact {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  visitingPreferences: string;
  communicationPreferences: string[];
  hasPortalAccess: boolean;
}

interface GPDetails {
  name: string;
  practice: string;
  phone: string;
  email?: string;
  address: string;
}

interface MedicalCondition {
  id: string;
  condition: string;
  diagnosisDate: Date;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'managed';
  notes?: string;
}

interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  notes?: string;
}

interface ResidentMedication {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  indication: string;
  prescriber: string;
  adherenceRate: number; // 0-100
  lastAdministered?: Date;
  nextDue?: Date;
}

interface CarePlan {
  id: string;
  planType: 'admission' | 'ongoing' | 'discharge' | 'end_of_life';
  goals: CareGoal[];
  interventions: CareIntervention[];
  lastReview: Date;
  nextReview: Date;
  reviewedBy: string;
  status: 'active' | 'under_review' | 'completed';
}

interface CareGoal {
  id: string;
  description: string;
  targetDate: Date;
  status: 'not_started' | 'in_progress' | 'achieved' | 'not_achieved';
  progress: number; // 0-100
  notes?: string;
}

interface CareIntervention {
  id: string;
  intervention: string;
  frequency: string;
  assignedTo: string;
  status: 'active' | 'completed' | 'discontinued';
  lastCompleted?: Date;
  nextDue?: Date;
}

interface RiskAssessment {
  id: string;
  riskType: 'falls' | 'pressure_ulcers' | 'malnutrition' | 'infection' | 'mental_health' | 'safeguarding';
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  score: number;
  assessmentDate: Date;
  assessedBy: string;
  mitigationMeasures: string[];
  nextReview: Date;
}

interface ResidentAlert {
  id: string;
  type: 'medical' | 'care' | 'safety' | 'medication' | 'family' | 'administrative';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actionRequired: string;
}

interface ResidentPreferences {
  wakeUpTime?: string;
  bedTime?: string;
  mealPreferences: string[];
  activityPreferences: string[];
  musicPreferences: string[];
  communicationStyle: string;
  personalCarePreferences: string[];
}

interface ActivityRecord {
  id: string;
  activityType: 'personal_care' | 'medication' | 'meal' | 'social' | 'therapy' | 'medical' | 'family_visit';
  description: string;
  timestamp: Date;
  performedBy: string;
  duration?: number;
  notes?: string;
  outcome?: string;
}

interface ResidentDashboardProps {
  residentId: string;
  onAlertTriggered?: (alert: ResidentAlert) => void;
  onCareTaskUpdate?: (task: CareIntervention) => void;
  onMedicationDue?: (medication: ResidentMedication) => void;
  showFamilyInformation?: boolean;
  readOnly?: boolean;
  compactView?: boolean;
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({
  residentId,
  onAlertTriggered,
  onCareTaskUpdate,
  onMedicationDue,
  showFamilyInformation = true,
  readOnly = false,
  compactView = false
}) => {
  // State Management
  const [residentData, setResidentData] = useState<ResidentData | null>(null);
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ResidentAlert | null>(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'care' | 'medical' | 'family' | 'activity'>('overview');

  // Load resident data
  useEffect(() => {
    const loadResidentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/residents/${residentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load resident data: ${response.statusText}`);
        }

        const data = await response.json();
        setResidentData(data.resident);
        setActivityRecords(data.activityRecords || []);

        // Process alerts
        const criticalAlerts = data.resident.currentAlerts?.filter((alert: ResidentAlert) => 
          alert.severity === 'critical' && !alert.acknowledged
        ) || [];

        criticalAlerts.forEach((alert: ResidentAlert) => {
          onAlertTriggered?.(alert);
        });

        // Check for due medications
        const dueMedications = data.resident.currentMedications?.filter((med: ResidentMedication) =>
          med.nextDue && new Date(med.nextDue) <= new Date()
        ) || [];

        dueMedications.forEach((medication: ResidentMedication) => {
          onMedicationDue?.(medication);
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load resident data';
        setError(errorMessage);
        console.error('Error loading resident data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (residentId) {
      loadResidentData();
    }
  }, [residentId, onAlertTriggered, onMedicationDue]);

  // Calculate age from date of birth
  const calculateAge = useCallback((dateOfBirth: Date): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }, []);

  // Render alert severity badge
  const renderAlertSeverity = (severity: ResidentAlert['severity']) => {
    const severityConfig = {
      low: { color: 'info' as const, label: 'Low' },
      medium: { color: 'warning' as const, label: 'Medium' },
      high: { color: 'error' as const, label: 'High' },
      critical: { color: 'error' as const, label: 'Critical' }
    };

    const config = severityConfig[severity];
    return <UIBadge variant={config.color}>{config.label}</UIBadge>;
  };

  // Render wellbeing score
  const renderWellbeingScore = (score: number) => {
    const getColor = (score: number) => {
      if (score >= 80) return 'success';
      if (score >= 60) return 'info';
      if (score >= 40) return 'warning';
      return 'error';
    };

    return (
      <Box display="flex" alignItems="center" gap={1}>
        <LinearProgress
          variant="determinate"
          value={score}
          color={getColor(score) as any}
          sx={{ width: 100, height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" color={`${getColor(score)}.main`}>
          {score}%
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LoadingSpinner size="large" />
      </Box>
    );
  }

  if (error || !residentData) {
    return (
      <UIAlert variant="error">
        <AlertTitle>Error Loading Resident Data</AlertTitle>
        {error || 'Resident data could not be loaded'}
      </UIAlert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Resident Information */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <UICard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  src={residentData.photo}
                  sx={{ width: 80, height: 80 }}
                >
                  {residentData.firstName[0]}{residentData.lastName[0]}
                </Avatar>
                <Box flexGrow={1}>
                  <Typography variant="h4" component="h1">
                    {residentData.preferredName || residentData.firstName} {residentData.lastName}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    Room {residentData.roomNumber} • Age {calculateAge(residentData.dateOfBirth)} • {residentData.gender}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip label={residentData.careLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} size="small" />
                    <Chip label={residentData.mobilityLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} size="small" />
                    <Chip 
                      label={`NHS: ${residentData.nhsNumber}`} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Box>
                </Box>
                {!readOnly && (
                  <Box>
                    <IconButton>
                      <EditIcon />
                    </IconButton>
                    <IconButton>
                      <ViewIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </CardContent>
          </UICard>
        </Grid>
        <Grid item xs={12} md={4}>
          <UICard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Wellbeing Score
              </Typography>
              {renderWellbeingScore(residentData.wellbeingScore)}
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Last assessed: {new Date(residentData.lastAssessment).toLocaleDateString()}
              </Typography>
            </CardContent>
          </UICard>
        </Grid>
      </Grid>

      {/* Critical Alerts */}
      {residentData.currentAlerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged).length > 0 && (
        <UIAlert variant="error" sx={{ mb: 3 }}>
          <AlertTitle>Critical Alerts Require Immediate Attention</AlertTitle>
          <List dense>
            {residentData.currentAlerts
              .filter(alert => alert.severity === 'critical' && !alert.acknowledged)
              .map(alert => (
                <ListItem key={alert.id}>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.title}
                    secondary={alert.message}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowAlertDialog(true);
                      }}
                    >
                      View
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        </UIAlert>
      )}

      {/* Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab
          label={
            <Badge badgeContent={residentData.currentAlerts.filter(a => !a.acknowledged).length} color="error">
              Overview
            </Badge>
          }
          value="overview"
        />
        <Tab label="Care Plan" value="care" />
        <Tab label="Medical" value="medical" />
        {showFamilyInformation && <Tab label="Family" value="family" />}
        <Tab label="Activity" value="activity" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Current Medications
                </Typography>
                <List dense>
                  {residentData.currentMedications.slice(0, 5).map(medication => (
                    <ListItem key={medication.id}>
                      <ListItemText
                        primary={medication.medicationName}
                        secondary={`${medication.dosage} ${medication.frequency} - ${medication.route}`}
                      />
                      <ListItemSecondaryAction>
                        {medication.nextDue && new Date(medication.nextDue) <= new Date() && (
                          <UIBadge variant="warning">Due</UIBadge>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                {residentData.currentMedications.length > 5 && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    And {residentData.currentMedications.length - 5} more medications...
                  </Typography>
                )}
              </CardContent>
            </UICard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Care Goals Progress
                </Typography>
                <List dense>
                  {residentData.carePlan.goals.slice(0, 4).map(goal => (
                    <ListItem key={goal.id}>
                      <ListItemText
                        primary={goal.description}
                        secondary={
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <LinearProgress
                              variant="determinate"
                              value={goal.progress}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption">
                              {goal.progress}%
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </UICard>
          </Grid>

          <Grid item xs={12}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Activity
                </Typography>
                <Timeline>
                  {activityRecords.slice(0, 6).map((activity, index) => (
                    <TimelineItem key={activity.id}>
                      <TimelineSeparator>
                        <TimelineDot color={
                          activity.activityType === 'medication' ? 'primary' :
                          activity.activityType === 'medical' ? 'error' :
                          activity.activityType === 'personal_care' ? 'success' : 'info'
                        }>
                          {activity.activityType === 'medication' && <PharmacyIcon />}
                          {activity.activityType === 'medical' && <MedicalIcon />}
                          {activity.activityType === 'personal_care' && <PersonIcon />}
                          {activity.activityType === 'meal' && <MealIcon />}
                          {activity.activityType === 'social' && <ActivityIcon />}
                          {activity.activityType === 'family_visit' && <FamilyIcon />}
                        </TimelineDot>
                        {index < activityRecords.slice(0, 6).length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body2" fontWeight="bold">
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(activity.timestamp).toLocaleString()} • {activity.performedBy}
                        </Typography>
                        {activity.notes && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {activity.notes}
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </UICard>
          </Grid>
        </Grid>
      )}

      {/* Alert Details Dialog */}
      <Dialog
        open={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Alert Details
          {selectedAlert && renderAlertSeverity(selectedAlert.severity)}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedAlert.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedAlert.message}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Action Required:</strong> {selectedAlert.actionRequired}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                <strong>Reported:</strong> {new Date(selectedAlert.timestamp).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowAlertDialog(false)}
          >
            Close
          </Button>
          {selectedAlert && !selectedAlert.acknowledged && !readOnly && (
            <Button
              variant="contained"
              onClick={() => {
                // Acknowledge alert logic would go here
                setShowAlertDialog(false);
              }}
            >
              Acknowledge Alert
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResidentDashboard;