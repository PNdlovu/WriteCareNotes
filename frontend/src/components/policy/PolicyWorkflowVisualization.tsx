/**
 * @fileoverview Policy Workflow Visualization Component
 * @module PolicyWorkflowVisualization
 * @version 1.0.0
 * @description Interactive workflow visualization for policy progression tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  Avatar,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Paper,
  Grid,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Person,
  Comment,
  PlayArrow,
  Pause,
  Edit,
  Visibility,
  Flag,
  Warning,
  Info,
  Assignment,
  Gavel,
  Publish,
  Archive,
  Refresh,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from 'react-query';

import { PolicyTrackerService, PolicyStatus, WorkflowStage, PolicyTrackingData } from '../../services/policy-tracking/PolicyTrackerService';

/**
 * Interface for workflow props
 */
interface PolicyWorkflowVisualizationProps {
  policyId: string;
  organizationId: string;
  onStatusUpdate?: (newStatus: PolicyStatus) => void;
  readOnly?: boolean;
}

/**
 * Interface for workflow step data
 */
interface WorkflowStep {
  stage: WorkflowStage;
  status: 'completed' | 'active' | 'pending' | 'skipped';
  title: string;
  description: string;
  icon: React.ReactElement;
  completedAt?: Date;
  assignee?: string;
  notes?: string;
  estimatedDuration?: string;
  dependencies?: WorkflowStage[];
}

/**
 * Policy Workflow Visualization Component
 */
export const PolicyWorkflowVisualization: React.FC<PolicyWorkflowVisualizationProps> = ({
  policyId,
  organizationId,
  onStatusUpdate,
  readOnly = false
}) => {
  // State management
  const [viewMode, setViewMode] = useState<'stepper' | 'timeline' | 'kanban'>('stepper');
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<PolicyStatus>(PolicyStatus.DRAFT);
  const [updateReason, setUpdateReason] = useState('');

  const queryClient = useQueryClient();
  const policyService = new PolicyTrackerService();

  // Data fetching
  const { data: policy, isLoading } = useQuery(
    ['policy-workflow', policyId],
    () => policyService.getPolicyById(policyId, organizationId),
    { refetchInterval: 30000 }
  );

  const { data: workflowData } = useQuery(
    ['policy-workflow-data', policyId],
    () => policyService.getPolicyWorkflow(policyId, organizationId),
    { enabled: !!policy }
  );

  // Status update mutation
  const statusUpdateMutation = useMutation(
    ({ status, reason, notes }: { status: PolicyStatus; reason: string; notes?: string }) =>
      policyService.updatePolicyStatus(policyId, status, 'current-user-id', reason, notes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['policy-workflow', policyId]);
        setStatusUpdateDialog(false);
        setUpdateReason('');
        if (onStatusUpdate) {
          onStatusUpdate(newStatus);
        }
      }
    }
  );

  /**
   * Define workflow steps with visual properties
   */
  const getWorkflowSteps = (): WorkflowStep[] => {
    if (!policy) return [];

    const baseSteps: WorkflowStep[] = [
      {
        stage: WorkflowStage.INITIATION,
        status: 'completed',
        title: 'Policy Initiation',
        description: 'Policy creation and initial setup',
        icon: <Assignment />,
        completedAt: policy.createdAt,
        assignee: policy.authorName,
        estimatedDuration: '1-2 days'
      },
      {
        stage: WorkflowStage.DRAFTING,
        status: policy.status === PolicyStatus.DRAFT ? 'active' : 'completed',
        title: 'Content Drafting',
        description: 'Writing and structuring policy content',
        icon: <Edit />,
        assignee: policy.assigneeName || policy.authorName,
        estimatedDuration: '3-5 days',
        dependencies: [WorkflowStage.INITIATION]
      },
      {
        stage: WorkflowStage.STAKEHOLDER_REVIEW,
        status: policy.status === PolicyStatus.UNDER_REVIEW ? 'active' : 
                policy.status === PolicyStatus.DRAFT ? 'pending' : 'completed',
        title: 'Stakeholder Review',
        description: 'Review by relevant stakeholders and subject matter experts',
        icon: <Visibility />,
        estimatedDuration: '5-7 days',
        dependencies: [WorkflowStage.DRAFTING]
      },
      {
        stage: WorkflowStage.COMPLIANCE_CHECK,
        status: policy.status === PolicyStatus.UNDER_REVIEW ? 'active' : 
                [PolicyStatus.DRAFT, PolicyStatus.UNDER_REVIEW].includes(policy.status) ? 'pending' : 'completed',
        title: 'Compliance Verification',
        description: 'Ensuring compliance with regulatory requirements',
        icon: <CheckCircle />,
        estimatedDuration: '2-3 days',
        dependencies: [WorkflowStage.STAKEHOLDER_REVIEW]
      },
      {
        stage: WorkflowStage.MANAGEMENT_APPROVAL,
        status: policy.status === PolicyStatus.APPROVED ? 'completed' :
                policy.status === PolicyStatus.UNDER_REVIEW ? 'active' : 'pending',
        title: 'Management Approval',
        description: 'Final approval from management team',
        icon: <Gavel />,
        estimatedDuration: '1-2 days',
        dependencies: [WorkflowStage.COMPLIANCE_CHECK]
      },
      {
        stage: WorkflowStage.PUBLICATION,
        status: policy.status === PolicyStatus.PUBLISHED ? 'completed' :
                policy.status === PolicyStatus.APPROVED ? 'active' : 'pending',
        title: 'Policy Publication',
        description: 'Publishing policy and making it available to staff',
        icon: <Publish />,
        completedAt: policy.publishedAt,
        estimatedDuration: '1 day',
        dependencies: [WorkflowStage.MANAGEMENT_APPROVAL]
      },
      {
        stage: WorkflowStage.IMPLEMENTATION,
        status: policy.status === PolicyStatus.PUBLISHED ? 'active' : 'pending',
        title: 'Implementation',
        description: 'Rolling out policy and training staff',
        icon: <PlayArrow />,
        estimatedDuration: '2-4 weeks',
        dependencies: [WorkflowStage.PUBLICATION]
      },
      {
        stage: WorkflowStage.MONITORING,
        status: policy.status === PolicyStatus.PUBLISHED ? 'active' : 'pending',
        title: 'Ongoing Monitoring',
        description: 'Monitoring compliance and effectiveness',
        icon: <TimelineIcon />,
        estimatedDuration: 'Ongoing',
        dependencies: [WorkflowStage.IMPLEMENTATION]
      }
    ];

    // Add conditional steps based on policy requirements
    if (policy.requiresLegalReview) {
      baseSteps.splice(4, 0, {
        stage: WorkflowStage.LEGAL_REVIEW,
        status: 'pending',
        title: 'Legal Review',
        description: 'Legal team review for compliance and risk assessment',
        icon: <Gavel />,
        estimatedDuration: '3-5 days',
        dependencies: [WorkflowStage.COMPLIANCE_CHECK]
      });
    }

    return baseSteps;
  };

  /**
   * Get step status color
   */
  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'pending': return 'default';
      case 'skipped': return 'secondary';
      default: return 'default';
    }
  };

  /**
   * Get step status icon
   */
  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'active': return <RadioButtonUnchecked color="primary" />;
      case 'pending': return <Schedule color="disabled" />;
      case 'skipped': return <RadioButtonUnchecked color="secondary" />;
      default: return <RadioButtonUnchecked />;
    }
  };

  /**
   * Stepper View Component
   */
  const StepperView = () => {
    const steps = getWorkflowSteps();
    const activeStep = steps.findIndex(step => step.status === 'active');

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Policy Workflow Progress
          </Typography>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.stage} completed={step.status === 'completed'}>
                <StepLabel
                  StepIconComponent={() => getStepStatusIcon(step.status)}
                  onClick={() => setSelectedStep(step)}
                  sx={{ cursor: 'pointer' }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {step.title}
                    </Typography>
                    <Chip
                      label={step.status.toUpperCase()}
                      size="small"
                      color={getStepStatusColor(step.status) as any}
                    />
                  </Box>
                </StepLabel>
                <StepContent>
                  <Box sx={{ pl: 2, pb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {step.description}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {step.assignee && (
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="caption">
                              {step.assignee}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="caption">
                            {step.estimatedDuration}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {step.completedAt && (
                        <Grid item xs={12}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CheckCircle fontSize="small" color="success" />
                            <Typography variant="caption" color="success.main">
                              Completed {format(step.completedAt, 'MMM dd, yyyy')}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>

                    {step.status === 'active' && !readOnly && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => setStatusUpdateDialog(true)}
                        >
                          Update Status
                        </Button>
                      </Box>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
    );
  };

  /**
   * Timeline View Component
   */
  const TimelineView = () => {
    const steps = getWorkflowSteps();

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🕐 Policy Timeline
          </Typography>
          <Timeline>
            {steps.map((step, index) => (
              <TimelineItem key={step.stage}>
                <TimelineOppositeContent color="textSecondary">
                  {step.completedAt ? format(step.completedAt, 'MMM dd') : 'Pending'}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={getStepStatusColor(step.status) as any}>
                    {step.icon}
                  </TimelineDot>
                  {index < steps.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {step.description}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <Chip
                        label={step.status.toUpperCase()}
                        size="small"
                        color={getStepStatusColor(step.status) as any}
                      />
                      {step.assignee && (
                        <Chip
                          label={step.assignee}
                          size="small"
                          variant="outlined"
                          avatar={<Avatar sx={{ width: 20, height: 20 }}>
                            {step.assignee.charAt(0)}
                          </Avatar>}
                        />
                      )}
                    </Box>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
      </Card>
    );
  };

  /**
   * Progress Overview Component
   */
  const ProgressOverview = () => {
    if (!policy) return null;

    const steps = getWorkflowSteps();
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const totalSteps = steps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">
              📊 Overall Progress
            </Typography>
            <Typography variant="h4" color="primary">
              {progressPercentage.toFixed(0)}%
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{ height: 10, borderRadius: 5, mb: 2 }}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" color="success.main">
                  {completedSteps}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary.main">
                  {steps.filter(s => s.status === 'active').length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  In Progress
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" color="text.secondary">
                  {steps.filter(s => s.status === 'pending').length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Pending
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  /**
   * Status Update Dialog
   */
  const StatusUpdateDialog = () => (
    <Dialog open={statusUpdateDialog} onClose={() => setStatusUpdateDialog(false)}>
      <DialogTitle>Update Policy Status</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>New Status</InputLabel>
          <Select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as PolicyStatus)}
            label="New Status"
          >
            {Object.values(PolicyStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {status.replace('_', ' ').toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          margin="normal"
          label="Reason for Change"
          value={updateReason}
          onChange={(e) => setUpdateReason(e.target.value)}
          required
          multiline
          rows={3}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setStatusUpdateDialog(false)}>Cancel</Button>
        <Button
          onClick={() => statusUpdateMutation.mutate({
            status: newStatus,
            reason: updateReason
          })}
          variant="contained"
          disabled={!updateReason.trim() || statusUpdateMutation.isLoading}
        >
          {statusUpdateMutation.isLoading ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (isLoading) {
    return <LinearProgress />;
  }

  if (!policy) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Policy not found</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* View Mode Selector */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          🔄 Policy Workflow
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant={viewMode === 'stepper' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('stepper')}
            size="small"
          >
            Stepper
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('timeline')}
            size="small"
          >
            Timeline
          </Button>
        </Box>
      </Box>

      {/* Progress Overview */}
      <ProgressOverview />

      {/* Main Content */}
      {viewMode === 'stepper' && <StepperView />}
      {viewMode === 'timeline' && <TimelineView />}

      {/* Status Update Dialog */}
      <StatusUpdateDialog />
    </Box>
  );
};

export default PolicyWorkflowVisualization;