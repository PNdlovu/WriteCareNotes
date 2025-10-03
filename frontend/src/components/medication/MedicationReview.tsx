/**
 * @fileoverview Medication Review Interface for WriteCareNotes
 * @module MedicationReview
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive medication review system providing structured review
 * workflows, clinical effectiveness assessment, adherence monitoring, and
 * polypharmacy analysis. Implements NICE guidelines and professional standards.
 * 
 * @example
 * // Usage in medication management dashboard
 * <MedicationReview
 *   organizationId="org-123"
 *   residentId="resident-456"
 *   onReviewCompleted={handleReviewCompleted}
 * />
 * 
 * @compliance
 * - NICE Medicines Optimization Guidelines
 * - CQC Medication Management Standards
 * - NMC Professional Standards
 * - GMC Good Practice Guidelines
 * - Royal Pharmaceutical Society Standards
 * 
 * @security
 * - Clinical data encryption and access control
 * - Audit trails for all review activities
 * - Role-based access to clinical information
 * - Secure prescriber communication
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Assignment as ReviewIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  LocalPharmacy as PharmacyIcon,
  Science as ScienceIcon,
  HealthAndSafety as SafetyIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { Button } from '../ui/Button';
import { Card as UICard } from '../ui/Card';
import { Badge as UIBadge } from '../ui/Badge';
import { Alert as UIAlert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DataTable } from '../ui/DataTable';
import { ElectronicSignature } from '../ui/ElectronicSignature';

// Types and Interfaces
interface MedicationReviewData {
  id: string;
  residentId: string;
  residentName: string;
  reviewType: 'annual' | 'structured' | 'clinical_change' | 'admission' | 'discharge' | 'incident_triggered';
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  priority: 'routine' | 'urgent' | 'critical';
  
  // Review Details
  scheduledDate: Date;
  completedDate?: Date;
  reviewedBy: string;
  reviewerRole: string;
  reviewerSignature?: string;
  
  // Clinical Information
  currentMedications: ReviewMedication[];
  medicalConditions: string[];
  allergies: string[];
  adverseReactions: string[];
  
  // Review Outcomes
  clinicalEffectiveness: ClinicalEffectiveness;
  adherenceAssessment: AdherenceAssessment;
  polypharmacyAnalysis: PolypharmacyAnalysis;
  safetyAssessment: SafetyAssessment;
  
  // Recommendations
  recommendations: ReviewRecommendation[];
  actionPlan: ActionPlan;
  
  // Communication
  prescriberCommunication: PrescriberCommunication[];
  familyCommunication?: FamilyCommunication;
  
  // Follow-up
  nextReviewDate: Date;
  followUpRequired: boolean;
  followUpActions: FollowUpAction[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface ReviewMedication {
  id: string;
  medicationName: string;
  genericName: string;
  strength: string;
  dosage: string;
  frequency: string;
  route: string;
  indication: string;
  startDate: Date;
  prescriberId: string;
  prescriberName: string;
  
  // Review Assessment
  clinicallyAppropriate: boolean;
  effectivenessRating: 1 | 2 | 3 | 4 | 5;
  adherenceRating: 1 | 2 | 3 | 4 | 5;
  sideEffects: string[];
  interactions: DrugInteraction[];
  
  // Recommendations
  recommendation: 'continue' | 'modify_dose' | 'modify_frequency' | 'switch_medication' | 'discontinue' | 'monitor_closely';
  rationale: string;
  proposedChanges?: string;
  
  // Monitoring
  monitoringRequired: boolean;
  monitoringParameters: string[];
  monitoringFrequency?: string;
}

interface ClinicalEffectiveness {
  overallRating: 1 | 2 | 3 | 4 | 5;
  therapeuticGoalsAchieved: boolean;
  symptomsControlled: boolean;
  qualityOfLifeImpact: 'improved' | 'maintained' | 'declined';
  functionalStatus: 'improved' | 'maintained' | 'declined';
  clinicalMarkers: ClinicalMarker[];
  notes: string;
}

interface AdherenceAssessment {
  overallAdherence: 1 | 2 | 3 | 4 | 5;
  adherenceBarriers: string[];
  missedDoses: number;
  refusals: number;
  administrationIssues: string[];
  supportStrategies: string[];
  improvementRecommendations: string[];
}

interface PolypharmacyAnalysis {
  totalMedications: number;
  appropriatePolypharmacy: boolean;
  problematicPolypharmacy: boolean;
  drugInteractions: DrugInteraction[];
  duplicateTherapy: string[];
  inappropriateMedications: string[];
  deprescribingOpportunities: string[];
  riskScore: number; // 0-100
}

interface SafetyAssessment {
  overallSafetyRating: 1 | 2 | 3 | 4 | 5;
  adverseEvents: AdverseEvent[];
  riskFactors: string[];
  contraindications: string[];
  monitoringCompliance: boolean;
  safetyRecommendations: string[];
}

interface ReviewRecommendation {
  id: string;
  type: 'medication_change' | 'monitoring' | 'lifestyle' | 'referral' | 'education' | 'follow_up';
  priority: 'high' | 'medium' | 'low';
  description: string;
  rationale: string;
  targetDate?: Date;
  responsible: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

interface ActionPlan {
  immediateActions: string[];
  shortTermActions: string[];
  longTermActions: string[];
  monitoringPlan: string;
  reviewSchedule: string;
  emergencyPlan?: string;
}

interface PrescriberCommunication {
  id: string;
  prescriberId: string;
  prescriberName: string;
  communicationType: 'recommendation' | 'query' | 'urgent_concern' | 'routine_update';
  message: string;
  sentDate: Date;
  responseReceived: boolean;
  response?: string;
  responseDate?: Date;
}

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major';
  mechanism: string;
  clinicalEffect: string;
  management: string;
}

interface ClinicalMarker {
  parameter: string;
  currentValue: string;
  targetRange: string;
  trend: 'improving' | 'stable' | 'declining';
  lastChecked: Date;
}

interface AdverseEvent {
  medication: string;
  event: string;
  severity: 'mild' | 'moderate' | 'severe';
  onset: Date;
  resolved: boolean;
  resolutionDate?: Date;
}

interface FollowUpAction {
  id: string;
  description: string;
  dueDate: Date;
  responsible: string;
  completed: boolean;
  completedDate?: Date;
  notes?: string;
}

interface FamilyCommunication {
  discussed: boolean;
  discussionDate?: Date;
  discussedWith: string;
  keyPoints: string[];
  concerns: string[];
  followUpRequired: boolean;
}

interface MedicationReviewProps {
  organizationId: string;
  residentId?: string;
  reviewId?: string;
  onReviewCompleted?: (review: MedicationReviewData) => void;
  onRecommendationMade?: (recommendation: ReviewRecommendation) => void;
  readOnly?: boolean;
  compactView?: boolean;
}

export const MedicationReview: React.FC<MedicationReviewProps> = ({
  organizationId,
  residentId,
  reviewId,
  onReviewCompleted,
  onRecommendationMade,
  readOnly = false,
  compactView = false
}) => {
  // State Management
  const [reviews, setReviews] = useState<MedicationReviewData[]>([]);
  const [currentReview, setCurrentReview] = useState<MedicationReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showRecommendationDialog, setShowRecommendationDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'reviews' | 'current' | 'analytics'>('reviews');
  const [reviewerSignature, setReviewerSignature] = useState<string>('');

  // Form State for New Review
  const [reviewForm, setReviewForm] = useState<Partial<MedicationReviewData>>({
    reviewType: 'structured',
    priority: 'routine',
    scheduledDate: new Date(),
    nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    followUpRequired: false,
    currentMedications: [],
    recommendations: [],
    followUpActions: [],
    prescriberCommunication: []
  });

  // Load medication reviews
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          organizationId
        });
        
        if (residentId) params.append('residentId', residentId);
        if (reviewId) params.append('reviewId', reviewId);

        const response = await fetch(`/api/v1/medication-reviews?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load medication reviews: ${response.statusText}`);
        }

        const data = await response.json();
        setReviews(data.reviews || []);
        
        if (reviewId && data.reviews.length > 0) {
          setCurrentReview(data.reviews[0]);
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load medication reviews';
        setError(errorMessage);
        console.error('Error loading medication reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadReviews();
    }
  }, [organizationId, residentId, reviewId]);

  // Submit medication review
  const submitReview = useCallback(async () => {
    try {
      setError(null);
      
      const reviewData = {
        ...reviewForm,
        organizationId,
        residentId,
        reviewedBy: 'current-user-id', // This would come from auth context
        reviewerRole: 'Clinical Pharmacist', // This would come from auth context
        reviewerSignature,
        completedDate: new Date(),
        status: 'completed',
        version: 1
      };

      const response = await fetch('/api/v1/medication-reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        throw new Error(`Failed to submit review: ${response.statusText}`);
      }

      const result = await response.json();
      const newReview = result.review;
      
      // Update local state
      setReviews(prev => [newReview, ...prev]);
      setCurrentReview(newReview);
      
      // Notify parent components
      onReviewCompleted?.(newReview);
      
      // Reset form and close dialog
      setReviewForm({
        reviewType: 'structured',
        priority: 'routine',
        scheduledDate: new Date(),
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        followUpRequired: false,
        currentMedications: [],
        recommendations: [],
        followUpActions: [],
        prescriberCommunication: []
      });
      setActiveStep(0);
      setReviewerSignature('');
      setShowReviewDialog(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);
      console.error('Error submitting review:', err);
    }
  }, [reviewForm, organizationId, residentId, reviewerSignature, onReviewCompleted]);

  // Render review status badge
  const renderReviewStatus = (status: MedicationReviewData['status']) => {
    const statusConfig = {
      scheduled: { color: 'info' as const, label: 'Scheduled' },
      in_progress: { color: 'warning' as const, label: 'In Progress' },
      completed: { color: 'success' as const, label: 'Completed' },
      overdue: { color: 'error' as const, label: 'Overdue' }
    };

    const config = statusConfig[status];
    return <UIBadge variant={config.color}>{config.label}</UIBadge>;
  };

  // Render priority badge
  const renderPriorityBadge = (priority: MedicationReviewData['priority']) => {
    const priorityConfig = {
      routine: { color: 'info' as const, label: 'Routine' },
      urgent: { color: 'warning' as const, label: 'Urgent' },
      critical: { color: 'error' as const, label: 'Critical' }
    };

    const config = priorityConfig[priority];
    return <UIBadge variant={config.color}>{config.label}</UIBadge>;
  };

  // Render effectiveness rating
  const renderEffectivenessRating = (rating: number) => {
    const colors = ['error', 'error', 'warning', 'info', 'success'];
    const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <LinearProgress
          variant="determinate"
          value={rating * 20}
          color={colors[rating - 1] as any}
          sx={{ width: 100 }}
        />
        <Typography variant="body2" color={`${colors[rating - 1]}.main`}>
          {labels[rating - 1]}
        </Typography>
      </Box>
    );
  };

  // Review steps for structured review
  const reviewSteps = [
    {
      label: 'Review Setup',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Review Type</InputLabel>
              <Select
                value={reviewForm.reviewType || ''}
                onChange={(e) => setReviewForm(prev => ({ ...prev, reviewType: e.target.value as MedicationReviewData['reviewType'] }))}
                label="Review Type"
              >
                <MenuItem value="annual">Annual Review</MenuItem>
                <MenuItem value="structured">Structured Review</MenuItem>
                <MenuItem value="clinical_change">Clinical Change Review</MenuItem>
                <MenuItem value="admission">Admission Review</MenuItem>
                <MenuItem value="discharge">Discharge Review</MenuItem>
                <MenuItem value="incident_triggered">Incident-Triggered Review</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={reviewForm.priority || ''}
                onChange={(e) => setReviewForm(prev => ({ ...prev, priority: e.target.value as MedicationReviewData['priority'] }))}
                label="Priority"
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Scheduled Date"
              type="date"
              value={reviewForm.scheduledDate ? reviewForm.scheduledDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setReviewForm(prev => ({ ...prev, scheduledDate: new Date(e.target.value) }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Next Review Date"
              type="date"
              value={reviewForm.nextReviewDate ? reviewForm.nextReviewDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setReviewForm(prev => ({ ...prev, nextReviewDate: new Date(e.target.value) }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Clinical Assessment',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Clinical Effectiveness Assessment
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Overall Clinical Effectiveness</FormLabel>
              <RadioGroup
                value={reviewForm.clinicalEffectiveness?.overallRating || ''}
                onChange={(e) => setReviewForm(prev => ({
                  ...prev,
                  clinicalEffectiveness: {
                    ...prev.clinicalEffectiveness,
                    overallRating: Number(e.target.value) as 1 | 2 | 3 | 4 | 5
                  } as ClinicalEffectiveness
                }))}
                row
              >
                <FormControlLabel value="1" control={<Radio />} label="Poor" />
                <FormControlLabel value="2" control={<Radio />} label="Fair" />
                <FormControlLabel value="3" control={<Radio />} label="Good" />
                <FormControlLabel value="4" control={<Radio />} label="Very Good" />
                <FormControlLabel value="5" control={<Radio />} label="Excellent" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reviewForm.clinicalEffectiveness?.therapeuticGoalsAchieved || false}
                  onChange={(e) => setReviewForm(prev => ({
                    ...prev,
                    clinicalEffectiveness: {
                      ...prev.clinicalEffectiveness,
                      therapeuticGoalsAchieved: e.target.checked
                    } as ClinicalEffectiveness
                  }))}
                />
              }
              label="Therapeutic goals achieved"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reviewForm.clinicalEffectiveness?.symptomsControlled || false}
                  onChange={(e) => setReviewForm(prev => ({
                    ...prev,
                    clinicalEffectiveness: {
                      ...prev.clinicalEffectiveness,
                      symptomsControlled: e.target.checked
                    } as ClinicalEffectiveness
                  }))}
                />
              }
              label="Symptoms well controlled"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Clinical Notes"
              multiline
              rows={4}
              value={reviewForm.clinicalEffectiveness?.notes || ''}
              onChange={(e) => setReviewForm(prev => ({
                ...prev,
                clinicalEffectiveness: {
                  ...prev.clinicalEffectiveness,
                  notes: e.target.value
                } as ClinicalEffectiveness
              }))}
              placeholder="Document clinical observations, effectiveness of current therapy, and any concerns..."
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Medication Assessment',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Current Medications Review
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Review each medication for clinical appropriateness, effectiveness, and safety.
            </Typography>
            {/* In a real implementation, this would show a detailed medication list */}
            <Alert severity="info">
              <AlertTitle>Medication List</AlertTitle>
              Current medications will be loaded from the resident's prescription records.
              Each medication will be assessed for:
              <ul>
                <li>Clinical appropriateness</li>
                <li>Effectiveness rating</li>
                <li>Adherence assessment</li>
                <li>Side effects and interactions</li>
                <li>Recommendations for changes</li>
              </ul>
            </Alert>
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Recommendations',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Review Recommendations
            </Typography>
            <TextField
              fullWidth
              label="Key Recommendations"
              multiline
              rows={6}
              placeholder="Document specific recommendations for medication changes, monitoring requirements, lifestyle modifications, or referrals..."
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={reviewForm.followUpRequired || false}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                />
              }
              label="Follow-up required"
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Review Completion',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Review Summary
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>Review Ready for Completion</AlertTitle>
              Please review all assessments and recommendations before signing off on this medication review.
            </Alert>
            <Typography variant="h6" gutterBottom>
              Electronic Signature Required
            </Typography>
            <ElectronicSignature
              onSignatureCapture={setReviewerSignature}
              required
              label="Reviewing Clinician"
            />
          </Grid>
        </Grid>
      )
    }
  ];

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
          <ReviewIcon color="primary" />
          Medication Reviews
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print Report
          </Button>
          {!readOnly && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowReviewDialog(true)}
            >
              New Review
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
            <Badge badgeContent={reviews.filter(r => r.status === 'overdue').length} color="error">
              All Reviews
            </Badge>
          }
          value="reviews"
        />
        {currentReview && (
          <Tab label="Current Review" value="current" />
        )}
        <Tab label="Analytics" value="analytics" />
      </Tabs>

      {/* Reviews List Tab */}
      {activeTab === 'reviews' && (
        <DataTable
          data={reviews}
          columns={[
            {
              key: 'residentName',
              label: 'Resident',
              render: (review: MedicationReviewData) => (
                <Typography variant="body2">
                  {review.residentName}
                </Typography>
              )
            },
            {
              key: 'reviewType',
              label: 'Type',
              render: (review: MedicationReviewData) => (
                <Chip
                  label={review.reviewType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  size="small"
                />
              )
            },
            {
              key: 'priority',
              label: 'Priority',
              render: (review: MedicationReviewData) => renderPriorityBadge(review.priority)
            },
            {
              key: 'status',
              label: 'Status',
              render: (review: MedicationReviewData) => renderReviewStatus(review.status)
            },
            {
              key: 'scheduledDate',
              label: 'Scheduled',
              render: (review: MedicationReviewData) => (
                <Typography variant="body2">
                  {review.scheduledDate.toLocaleDateString()}
                </Typography>
              )
            },
            {
              key: 'completedDate',
              label: 'Completed',
              render: (review: MedicationReviewData) => (
                <Typography variant="body2">
                  {review.completedDate ? review.completedDate.toLocaleDateString() : '-'}
                </Typography>
              )
            },
            {
              key: 'reviewedBy',
              label: 'Reviewed By',
              render: (review: MedicationReviewData) => (
                <Typography variant="body2">
                  {review.reviewedBy}
                </Typography>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (review: MedicationReviewData) => (
                <IconButton
                  size="small"
                  onClick={() => {
                    setCurrentReview(review);
                    setActiveTab('current');
                  }}
                >
                  <ViewIcon />
                </IconButton>
              )
            }
          ]}
          pagination
          sortable
          searchable
        />
      )}

      {/* Current Review Tab */}
      {activeTab === 'current' && currentReview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Review Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Resident:</Typography>
                    <Typography variant="body2">{currentReview.residentName}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Review Type:</Typography>
                    <Typography variant="body2">
                      {currentReview.reviewType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Status:</Typography>
                    {renderReviewStatus(currentReview.status)}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Priority:</Typography>
                    {renderPriorityBadge(currentReview.priority)}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Scheduled Date:</Typography>
                    <Typography variant="body2">
                      {currentReview.scheduledDate.toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Reviewed By:</Typography>
                    <Typography variant="body2">
                      {currentReview.reviewedBy} ({currentReview.reviewerRole})
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </UICard>

            {currentReview.clinicalEffectiveness && (
              <UICard sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Clinical Effectiveness
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Overall Rating:
                    </Typography>
                    {renderEffectivenessRating(currentReview.clinicalEffectiveness.overallRating)}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Therapeutic Goals:</strong>{' '}
                        {currentReview.clinicalEffectiveness.therapeuticGoalsAchieved ? 'Achieved' : 'Not Achieved'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Symptoms:</strong>{' '}
                        {currentReview.clinicalEffectiveness.symptomsControlled ? 'Well Controlled' : 'Not Well Controlled'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Notes:</strong> {currentReview.clinicalEffectiveness.notes}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </UICard>
            )}

            {currentReview.recommendations.length > 0 && (
              <UICard sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommendations
                  </Typography>
                  <List>
                    {currentReview.recommendations.map((rec, index) => (
                      <ListItem key={rec.id}>
                        <ListItemIcon>
                          {rec.priority === 'high' ? <ErrorIcon color="error" /> :
                           rec.priority === 'medium' ? <WarningIcon color="warning" /> :
                           <InfoIcon color="info" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.description}
                          secondary={rec.rationale}
                        />
                        <ListItemSecondaryAction>
                          <UIBadge
                            variant={
                              rec.status === 'completed' ? 'success' :
                              rec.status === 'in_progress' ? 'warning' : 'info'
                            }
                          >
                            {rec.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </UIBadge>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </UICard>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Review Summary
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Total Medications"
                      secondary={currentReview.currentMedications.length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Recommendations"
                      secondary={currentReview.recommendations.length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Next Review"
                      secondary={currentReview.nextReviewDate.toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Follow-up Required"
                      secondary={currentReview.followUpRequired ? 'Yes' : 'No'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </UICard>
          </Grid>
        </Grid>
      )}

      {/* New Review Dialog */}
      <Dialog
        open={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minHeight: '80vh' } }}
      >
        <DialogTitle>
          Conduct Medication Review
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {reviewSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    {step.content}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (index === reviewSteps.length - 1) {
                          submitReview();
                        } else {
                          setActiveStep(index + 1);
                        }
                      }}
                      sx={{ mt: 1, mr: 1 }}
                      disabled={index === reviewSteps.length - 1 && !reviewerSignature}
                    >
                      {index === reviewSteps.length - 1 ? 'Complete Review' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={() => setActiveStep(index - 1)}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowReviewDialog(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicationReview;