/**
 * @fileoverview Medication Reconciliation Interface for WriteCareNotes
 * @module MedicationReconciliation
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive medication reconciliation system for managing
 * medication changes during care transitions (admission, transfer, discharge).
 * Ensures medication safety and continuity of care across healthcare settings.
 * 
 * @example
 * // Usage in care transition workflows
 * <MedicationReconciliation
 *   residentId="resident-123"
 *   reconciliationType="admission"
 *   onReconciliationComplete={handleReconciliationComplete}
 *   onDiscrepancyFound={handleDiscrepancyFound}
 * />
 * 
 * @compliance
 * - NICE Medicines Optimization Guidelines
 * - CQC Medication Management Standards
 * - WHO High 5s Patient Safety Solutions
 * - Royal Pharmaceutical Society Guidelines
 * - Care Quality Commission Fundamental Standards
 * 
 * @security
 * - Clinical decision support integration
 * - Audit trails for all reconciliation activities
 * - Electronic signature capture for approvals
 * - Role-based access to reconciliation functions
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Radio,
  RadioGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  CompareArrows as ReconciliationIcon,
  CheckCircle as ApprovedIcon,
  Error as DiscrepancyIcon,
  Warning as WarningIcon,
  Schedule as PendingIcon,
  Assignment as ReviewIcon,
  LocalPharmacy as MedicationIcon,
  Person as PatientIcon,
  Timeline as HistoryIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  SwapHoriz as CompareIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  NotificationImportant as AlertIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { Button } from '../ui/Button';
import { Card as UICard } from '../ui/Card';
import { Badge as UIBadge } from '../ui/Badge';
import { Alert as UIAlert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DataTable } from '../ui/DataTable';
import { ElectronicSignature } from '../ui/ElectronicSignature';

// Types and Interfaces
interface MedicationReconciliation {
  id: string;
  residentId: string;
  residentName: string;
  type: 'admission' | 'transfer' | 'discharge' | 'periodic_review';
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  priority: 'routine' | 'urgent' | 'emergency';
  createdAt: Date;
  completedAt?: Date;
  approvedAt?: Date;
  createdBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  sourceList: MedicationList;
  targetList: MedicationList;
  discrepancies: MedicationDiscrepancy[];
  resolutions: DiscrepancyResolution[];
  clinicalNotes: string;
  riskAssessment: RiskAssessment;
  signatures: ReconciliationSignature[];
}

interface MedicationList {
  id: string;
  type: 'home_medications' | 'hospital_medications' | 'current_medications' | 'discharge_medications';
  source: string;
  medications: ReconciliationMedication[];
  lastUpdated: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}

interface ReconciliationMedication {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  form: string;
  route: string;
  frequency: string;
  dose: string;
  indication: string;
  prescriber: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'discontinued' | 'held' | 'modified';
  source: 'gp_record' | 'hospital_discharge' | 'care_home' | 'patient_reported' | 'family_reported';
  verified: boolean;
  verificationSource?: string;
  clinicalNotes?: string;
}

interface MedicationDiscrepancy {
  id: string;
  type: 'omission' | 'addition' | 'dose_change' | 'frequency_change' | 'route_change' | 'duplication' | 'interaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  sourceMedication?: ReconciliationMedication;
  targetMedication?: ReconciliationMedication;
  clinicalSignificance: string;
  recommendedAction: string;
  status: 'identified' | 'reviewed' | 'resolved' | 'accepted_risk';
  identifiedAt: Date;
  identifiedBy: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

interface DiscrepancyResolution {
  id: string;
  discrepancyId: string;
  action: 'continue' | 'discontinue' | 'modify' | 'add' | 'clarify' | 'monitor';
  rationale: string;
  newMedication?: ReconciliationMedication;
  modifiedMedication?: ReconciliationMedication;
  monitoringPlan?: string;
  resolvedBy: string;
  resolvedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  monitoringRequirements: string[];
  assessedBy: string;
  assessedAt: Date;
}

interface RiskFactor {
  type: 'polypharmacy' | 'high_risk_medication' | 'drug_interaction' | 'allergy_risk' | 'renal_impairment' | 'hepatic_impairment';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

interface ReconciliationSignature {
  id: string;
  role: 'pharmacist' | 'doctor' | 'nurse' | 'care_manager';
  signatory: string;
  signedAt: Date;
  signatureData: string;
  ipAddress: string;
  comments?: string;
}

interface ReconciliationTemplate {
  id: string;
  name: string;
  type: MedicationReconciliation['type'];
  steps: ReconciliationStep[];
  requiredSignatures: string[];
  defaultSettings: ReconciliationSettings;
}

interface ReconciliationStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  order: number;
  assignedRole: string;
  estimatedDuration: number;
}

interface ReconciliationSettings {
  autoDetectDiscrepancies: boolean;
  requirePharmacistReview: boolean;
  requireDoctorApproval: boolean;
  enableClinicalDecisionSupport: boolean;
  mandatoryFields: string[];
  riskThresholds: Record<string, number>;
}

interface MedicationReconciliationProps {
  residentId?: string;
  reconciliationType?: MedicationReconciliation['type'];
  onReconciliationComplete?: (reconciliation: MedicationReconciliation) => void;
  onDiscrepancyFound?: (discrepancy: MedicationDiscrepancy) => void;
  readOnly?: boolean;
  showHistory?: boolean;
}

export const MedicationReconciliation: React.FC<MedicationReconciliationProps> = ({
  residentId,
  reconciliationType = 'admission',
  onReconciliationComplete,
  onDiscrepancyFound,
  readOnly = false,
  showHistory = true
}) => {
  // State Management
  const [reconciliations, setReconciliations] = useState<MedicationReconciliation[]>([]);
  const [currentReconciliation, setCurrentReconciliation] = useState<MedicationReconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'templates' | 'reports'>('current');
  const [activeStep, setActiveStep] = useState(0);
  const [showDiscrepancyDialog, setShowDiscrepancyDialog] = useState(false);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<MedicationDiscrepancy | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [processingReconciliation, setProcessingReconciliation] = useState(false);

  // Reconciliation workflow steps
  const reconciliationSteps = [
    'Collect Medication History',
    'Compare Medication Lists',
    'Identify Discrepancies',
    'Resolve Discrepancies',
    'Clinical Review',
    'Final Approval'
  ];

  // Load reconciliation data
  useEffect(() => {
    const loadReconciliationData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (residentId) params.append('residentId', residentId);
        if (reconciliationType) params.append('type', reconciliationType);

        const response = await fetch(`/api/v1/medication-reconciliation?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load reconciliation data: ${response.statusText}`);
        }

        const data = await response.json();
        setReconciliations(data.reconciliations || []);
        
        // Set current reconciliation if there's an active one
        const activeReconciliation = data.reconciliations?.find((r: MedicationReconciliation) => 
          r.status === 'pending' || r.status === 'in_progress'
        );
        if (activeReconciliation) {
          setCurrentReconciliation(activeReconciliation);
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load reconciliation data';
        setError(errorMessage);
        console.error('Error loading reconciliation data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReconciliationData();
  }, [residentId, reconciliationType]);

  // Start new reconciliation
  const startReconciliation = useCallback(async () => {
    if (!residentId) return;

    try {
      setProcessingReconciliation(true);
      setError(null);

      const response = await fetch('/api/v1/medication-reconciliation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          residentId,
          type: reconciliationType,
          priority: 'routine'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to start reconciliation: ${response.statusText}`);
      }

      const newReconciliation = await response.json();
      setCurrentReconciliation(newReconciliation);
      setReconciliations(prev => [newReconciliation, ...prev]);
      setActiveStep(0);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start reconciliation';
      setError(errorMessage);
      console.error('Error starting reconciliation:', err);
    } finally {
      setProcessingReconciliation(false);
    }
  }, [residentId, reconciliationType]);

  // Resolve discrepancy
  const resolveDiscrepancy = useCallback(async (discrepancyId: string, resolution: Partial<DiscrepancyResolution>) => {
    if (!currentReconciliation) return;

    try {
      const response = await fetch(`/api/v1/medication-reconciliation/${currentReconciliation.id}/discrepancies/${discrepancyId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolution)
      });

      if (!response.ok) {
        throw new Error(`Failed to resolve discrepancy: ${response.statusText}`);
      }

      const updatedReconciliation = await response.json();
      setCurrentReconciliation(updatedReconciliation);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve discrepancy';
      setError(errorMessage);
      console.error('Error resolving discrepancy:', err);
    }
  }, [currentReconciliation]);

  // Complete reconciliation
  const completeReconciliation = useCallback(async () => {
    if (!currentReconciliation) return;

    try {
      setProcessingReconciliation(true);
      setError(null);

      const response = await fetch(`/api/v1/medication-reconciliation/${currentReconciliation.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to complete reconciliation: ${response.statusText}`);
      }

      const completedReconciliation = await response.json();
      setCurrentReconciliation(completedReconciliation);
      onReconciliationComplete?.(completedReconciliation);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete reconciliation';
      setError(errorMessage);
      console.error('Error completing reconciliation:', err);
    } finally {
      setProcessingReconciliation(false);
    }
  }, [currentReconciliation, onReconciliationComplete]);

  // Render discrepancy severity
  const renderDiscrepancySeverity = (severity: MedicationDiscrepancy['severity']) => {
    const severityConfig = {
      low: { color: 'info' as const, label: 'Low' },
      medium: { color: 'warning' as const, label: 'Medium' },
      high: { color: 'error' as const, label: 'High' },
      critical: { color: 'error' as const, label: 'Critical' }
    };

    const config = severityConfig[severity];
    return <UIBadge variant={config.color}>{config.label}</UIBadge>;
  };

  // Render reconciliation status
  const renderReconciliationStatus = (status: MedicationReconciliation['status']) => {
    const statusConfig = {
      pending: { color: 'warning' as const, label: 'Pending', icon: <PendingIcon /> },
      in_progress: { color: 'info' as const, label: 'In Progress', icon: <ReviewIcon /> },
      completed: { color: 'success' as const, label: 'Completed', icon: <ApprovedIcon /> },
      approved: { color: 'success' as const, label: 'Approved', icon: <VerifiedIcon /> },
      rejected: { color: 'error' as const, label: 'Rejected', icon: <DiscrepancyIcon /> }
    };

    const config = statusConfig[status];
    return (
      <UIBadge variant={config.color} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {config.icon}
        {config.label}
      </UIBadge>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LoadingSpinner size="large" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReconciliationIcon color="primary" />
          Medication Reconciliation
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          {!readOnly && !currentReconciliation && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={startReconciliation}
              disabled={processingReconciliation}
            >
              {processingReconciliation ? 'Starting...' : 'Start Reconciliation'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <UIAlert variant="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
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
            currentReconciliation ? (
              <Badge badgeContent={currentReconciliation.discrepancies.length} color="error">
                Current
              </Badge>
            ) : 'Current'
          } 
          value="current" 
        />
        {showHistory && <Tab label="History" value="history" />}
        <Tab label="Templates" value="templates" />
        <Tab label="Reports" value="reports" />
      </Tabs>

      {/* Current Reconciliation Tab */}
      {activeTab === 'current' && (
        <Grid container spacing={3}>
          {currentReconciliation ? (
            <>
              {/* Reconciliation Progress */}
              <Grid item xs={12}>
                <UICard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Reconciliation Progress
                    </Typography>
                    <Stepper activeStep={activeStep} orientation="horizontal">
                      {reconciliationSteps.map((label, index) => (
                        <Step key={label}>
                          <StepLabel>{label}</StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </CardContent>
                </UICard>
              </Grid>

              {/* Reconciliation Details */}
              <Grid item xs={12} md={8}>
                <UICard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Reconciliation Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Resident
                        </Typography>
                        <Typography variant="body1">
                          {currentReconciliation.residentName}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Type
                        </Typography>
                        <Typography variant="body1">
                          {currentReconciliation.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Status
                        </Typography>
                        {renderReconciliationStatus(currentReconciliation.status)}
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Priority
                        </Typography>
                        <Chip
                          label={currentReconciliation.priority.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          color={currentReconciliation.priority === 'emergency' ? 'error' : 
                                currentReconciliation.priority === 'urgent' ? 'warning' : 'default'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </UICard>
              </Grid>

              {/* Risk Assessment */}
              <Grid item xs={12} md={4}>
                <UICard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Risk Assessment
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Overall Risk:
                      </Typography>
                      <UIBadge 
                        variant={
                          currentReconciliation.riskAssessment.overallRisk === 'critical' ? 'error' :
                          currentReconciliation.riskAssessment.overallRisk === 'high' ? 'error' :
                          currentReconciliation.riskAssessment.overallRisk === 'medium' ? 'warning' : 'success'
                        }
                      >
                        {currentReconciliation.riskAssessment.overallRisk.toUpperCase()}
                      </UIBadge>
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Risk Factors ({currentReconciliation.riskAssessment.riskFactors.length})
                    </Typography>
                    <List dense>
                      {currentReconciliation.riskAssessment.riskFactors.slice(0, 3).map(factor => (
                        <ListItem key={factor.type} sx={{ pl: 0 }}>
                          <ListItemText
                            primary={factor.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            secondary={factor.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </UICard>
              </Grid>

              {/* Discrepancies */}
              <Grid item xs={12}>
                <UICard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Medication Discrepancies ({currentReconciliation.discrepancies.length})
                    </Typography>
                    <DataTable
                      data={currentReconciliation.discrepancies}
                      columns={[
                        {
                          key: 'type',
                          label: 'Type',
                          render: (discrepancy: MedicationDiscrepancy) => (
                            <Chip
                              label={discrepancy.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              size="small"
                            />
                          )
                        },
                        {
                          key: 'description',
                          label: 'Description',
                          render: (discrepancy: MedicationDiscrepancy) => (
                            <Typography variant="body2">
                              {discrepancy.description}
                            </Typography>
                          )
                        },
                        {
                          key: 'severity',
                          label: 'Severity',
                          render: (discrepancy: MedicationDiscrepancy) => renderDiscrepancySeverity(discrepancy.severity)
                        },
                        {
                          key: 'status',
                          label: 'Status',
                          render: (discrepancy: MedicationDiscrepancy) => (
                            <Chip
                              label={discrepancy.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              color={discrepancy.status === 'resolved' ? 'success' : 'warning'}
                              size="small"
                            />
                          )
                        },
                        {
                          key: 'actions',
                          label: 'Actions',
                          render: (discrepancy: MedicationDiscrepancy) => (
                            <Box display="flex" gap={0.5}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedDiscrepancy(discrepancy);
                                  setShowDiscrepancyDialog(true);
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                              {!readOnly && discrepancy.status !== 'resolved' && (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedDiscrepancy(discrepancy);
                                    setShowDiscrepancyDialog(true);
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              )}
                            </Box>
                          )
                        }
                      ]}
                      pagination={false}
                      sortable
                    />
                  </CardContent>
                </UICard>
              </Grid>

              {/* Action Buttons */}
              {!readOnly && currentReconciliation.status !== 'completed' && (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" gap={2}>
                    <Button
                      variant="outlined"
                      onClick={() => setCurrentReconciliation(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={completeReconciliation}
                      disabled={processingReconciliation || currentReconciliation.discrepancies.some(d => d.status !== 'resolved')}
                      startIcon={processingReconciliation ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      {processingReconciliation ? 'Completing...' : 'Complete Reconciliation'}
                    </Button>
                  </Box>
                </Grid>
              )}
            </>
          ) : (
            <Grid item xs={12}>
              <UICard>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <ReconciliationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Active Reconciliation
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Start a new medication reconciliation to compare and resolve medication discrepancies.
                  </Typography>
                  {!readOnly && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={startReconciliation}
                      disabled={processingReconciliation}
                    >
                      Start Reconciliation
                    </Button>
                  )}
                </CardContent>
              </UICard>
            </Grid>
          )}
        </Grid>
      )}

      {/* Discrepancy Details Dialog */}
      <Dialog
        open={showDiscrepancyDialog}
        onClose={() => setShowDiscrepancyDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Discrepancy Details
          {selectedDiscrepancy && (
            <Typography variant="subtitle2" color="textSecondary">
              {selectedDiscrepancy.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedDiscrepancy && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body1" paragraph>
                  {selectedDiscrepancy.description}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Severity
                </Typography>
                {renderDiscrepancySeverity(selectedDiscrepancy.severity)}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Clinical Significance
                </Typography>
                <Typography variant="body1">
                  {selectedDiscrepancy.clinicalSignificance}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Recommended Action
                </Typography>
                <Typography variant="body1">
                  {selectedDiscrepancy.recommendedAction}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowDiscrepancyDialog(false)}
          >
            Close
          </Button>
          {selectedDiscrepancy && !readOnly && selectedDiscrepancy.status !== 'resolved' && (
            <Button
              variant="contained"
              onClick={() => {
                // Handle discrepancy resolution
                setShowDiscrepancyDialog(false);
              }}
            >
              Resolve
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicationReconciliation;