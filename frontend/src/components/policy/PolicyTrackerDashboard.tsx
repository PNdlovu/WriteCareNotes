/**
 * @fileoverview Policy Tracker Dashboard - Comprehensive policy management interface
 * @module PolicyTrackerDashboard
 * @version 1.0.0
 * @description Color-coded policy tracking dashboard with workflow visualization
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  FilterList,
  Search,
  Add,
  Edit,
  Visibility,
  Timeline,
  Assignment,
  CheckCircle,
  Warning,
  Error,
  Schedule,
  TrendingUp,
  GetApp,
  Refresh,
  MoreVert,
  PlayArrow,
  Pause,
  Archive,
  Flag
} from '@mui/icons-material';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from 'react-query';

import { PolicyTrackerService, PolicyTrackingData, PolicyDashboardMetrics, PolicyStatus, PolicyPriority, PolicyCategory } from '../../services/policy-tracking/PolicyTrackerService';

/**
 * Interface for dashboard props
 */
interface PolicyTrackerDashboardProps {
  organizationId: string;
  userRole: 'admin' | 'manager' | 'user';
  onPolicySelect?: (policy: PolicyTrackingData) => void;
}

/**
 * Interface for filter state
 */
interface FilterState {
  status: PolicyStatus[];
  category: PolicyCategory[];
  priority: PolicyPriority[];
  assignee: string[];
  searchTerm: string;
  showOverdue: boolean;
  showUpcoming: boolean;
}

/**
 * Policy Tracker Dashboard Component
 */
export const PolicyTrackerDashboard: React.FC<PolicyTrackerDashboardProps> = ({
  organizationId,
  userRole,
  onPolicySelect
}) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    category: [],
    priority: [],
    assignee: [],
    searchTerm: '',
    showOverdue: false,
    showUpcoming: false
  });
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyTrackingData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);

  const queryClient = useQueryClient();
  const policyService = new PolicyTrackerService();

  // Data fetching
  const { data: dashboardMetrics, isLoading: metricsLoading } = useQuery(
    ['policy-dashboard-metrics', organizationId, filters],
    () => policyService.getPolicyDashboard(organizationId, filters),
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const { data: policies, isLoading: policiesLoading } = useQuery(
    ['policies', organizationId, filters],
    () => policyService.getAllPolicies(organizationId, filters),
    { refetchInterval: 30000 }
  );

  // Color mappings
  const statusColors = policyService.getStatusColorMapping();
  const priorityColors = policyService.getPriorityColorMapping();

  /**
   * Helper function to get status chip props
   */
  const getStatusChipProps = (status: PolicyStatus) => {
    const colors = statusColors[status];
    return {
      label: `${colors.icon} ${status.replace('_', ' ').toUpperCase()}`,
      style: {
        backgroundColor: colors.bgColor,
        color: colors.textColor,
        fontWeight: 'bold',
        borderRadius: '16px'
      }
    };
  };

  /**
   * Helper function to get priority chip props
   */
  const getPriorityChipProps = (priority: PolicyPriority) => {
    const colors = priorityColors[priority];
    return {
      label: `${colors.icon} ${priority.toUpperCase()}`,
      style: {
        backgroundColor: colors.bgColor,
        color: colors.textColor,
        fontWeight: 'bold',
        borderRadius: '16px'
      }
    };
  };

  /**
   * Get status indicator for overview cards
   */
  const getStatusIcon = (status: PolicyStatus) => {
    const iconMap = {
      [PolicyStatus.DRAFT]: <Edit color="primary" />,
      [PolicyStatus.UNDER_REVIEW]: <Visibility color="warning" />,
      [PolicyStatus.APPROVED]: <CheckCircle color="success" />,
      [PolicyStatus.PUBLISHED]: <PlayArrow color="success" />,
      [PolicyStatus.REQUIRES_UPDATE]: <Warning color="warning" />,
      [PolicyStatus.SUSPENDED]: <Pause color="error" />,
      [PolicyStatus.ARCHIVED]: <Archive color="disabled" />,
      [PolicyStatus.REJECTED]: <Error color="error" />
    };
    return iconMap[status] || <Assignment />;
  };

  /**
   * Dashboard Overview Cards
   */
  const DashboardOverview = () => {
    if (metricsLoading || !dashboardMetrics) {
      return <LinearProgress />;
    }

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Total Policies */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Policies
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {dashboardMetrics.totalPolicies}
                  </Typography>
                </Box>
                <Assignment color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Compliance Rate
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {dashboardMetrics.complianceRate.toFixed(1)}%
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={dashboardMetrics.complianceRate} 
                color="success"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Reviews */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Pending Reviews
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {dashboardMetrics.pendingReviews}
                  </Typography>
                </Box>
                <Badge badgeContent={dashboardMetrics.pendingReviews} color="warning">
                  <Visibility color="warning" sx={{ fontSize: 40 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Policies */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Overdue
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {dashboardMetrics.overduePolicies}
                  </Typography>
                </Box>
                <Badge badgeContent={dashboardMetrics.overduePolicies} color="error">
                  <Schedule color="error" sx={{ fontSize: 40 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  /**
   * Status Breakdown Chart
   */
  const StatusBreakdown = () => {
    if (!dashboardMetrics) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader title="📊 Status Breakdown" />
        <CardContent>
          <Grid container spacing={2}>
            {Object.entries(dashboardMetrics.statusBreakdown).map(([status, count]) => {
              const statusKey = status as PolicyStatus;
              const colors = statusColors[statusKey];
              
              return (
                <Grid item xs={6} sm={4} md={3} key={status}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: colors.bgColor,
                      border: `1px solid ${colors.color}`,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: colors.textColor }}>
                      {colors.icon}
                    </Typography>
                    <Typography variant="h4" sx={{ color: colors.textColor, fontWeight: 'bold' }}>
                      {count}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textColor }}>
                      {status.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  /**
   * Policy Progress Stepper
   */
  const PolicyProgressStepper: React.FC<{ policy: PolicyTrackingData }> = ({ policy }) => {
    const steps = [
      { status: PolicyStatus.DRAFT, label: 'Draft Created' },
      { status: PolicyStatus.UNDER_REVIEW, label: 'Under Review' },
      { status: PolicyStatus.APPROVED, label: 'Approved' },
      { status: PolicyStatus.PUBLISHED, label: 'Published' }
    ];

    const currentStepIndex = steps.findIndex(step => step.status === policy.status);

    return (
      <Stepper activeStep={currentStepIndex} orientation="horizontal">
        {steps.map((step, index) => (
          <Step key={step.status}>
            <StepLabel 
              icon={getStatusIcon(step.status)}
              StepIconProps={{
                style: {
                  color: index <= currentStepIndex ? statusColors[step.status].color : '#ccc'
                }
              }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    );
  };

  /**
   * Policy Table
   */
  const PolicyTable = () => {
    if (policiesLoading || !policies) {
      return <LinearProgress />;
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Policy</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {policy.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      v{policy.version} • {policy.category}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip {...getStatusChipProps(policy.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip {...getPriorityChipProps(policy.priority)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={policy.category.replace('_', ' ')} 
                    variant="outlined" 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ width: '100px' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={policy.progress.percentage} 
                      color={policy.progress.percentage > 75 ? 'success' : policy.progress.percentage > 50 ? 'warning' : 'error'}
                    />
                    <Typography variant="caption">
                      {policy.progress.percentage.toFixed(0)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {policy.assignee ? (
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        {policy.assignee.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="caption">
                        {policy.assignee}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      Unassigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {policy.dueDate ? (
                    <Typography 
                      variant="caption" 
                      color={isAfter(new Date(), policy.dueDate) ? 'error' : 'textSecondary'}
                    >
                      {format(policy.dueDate, 'MMM dd, yyyy')}
                      {isAfter(new Date(), policy.dueDate) && ' (Overdue)'}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      No deadline
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => setSelectedPolicy(policy)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {userRole !== 'user' && (
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Timeline">
                      <IconButton size="small">
                        <Timeline />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  /**
   * Recent Activity Timeline
   */
  const RecentActivity = () => {
    if (!dashboardMetrics?.recentActivity) return null;

    return (
      <Card>
        <CardHeader title="🕐 Recent Activity" />
        <CardContent>
          {dashboardMetrics.recentActivity.map((activity, index) => (
            <Box key={index} display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                {activity.userName.charAt(0)}
              </Avatar>
              <Box flex={1}>
                <Typography variant="body2">
                  <strong>{activity.userName}</strong> changed status from{' '}
                  <Chip {...getStatusChipProps(activity.fromStatus)} size="small" sx={{ mx: 0.5 }} /> to{' '}
                  <Chip {...getStatusChipProps(activity.toStatus)} size="small" sx={{ mx: 0.5 }} />
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  /**
   * Main render
   */
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          📋 Policy Tracker Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            variant="outlined"
          >
            Filters
          </Button>
          <Button
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries(['policies', 'policy-dashboard-metrics'])}
            variant="outlined"
          >
            Refresh
          </Button>
          {userRole !== 'user' && (
            <Button
              startIcon={<Add />}
              variant="contained"
              color="primary"
            >
              New Policy
            </Button>
          )}
        </Box>
      </Box>

      {/* Dashboard Overview */}
      <DashboardOverview />

      {/* Status Breakdown */}
      <StatusBreakdown />

      {/* Main Content Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="📊 All Policies" />
          <Tab label="⏰ Recent Activity" />
          <Tab label="📈 Analytics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && <PolicyTable />}
      {activeTab === 1 && <RecentActivity />}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📈 Policy Analytics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Completion Trends
                </Typography>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2">
                    Average completion time: {dashboardMetrics?.averageCompletionTime || 0} days
                  </Typography>
                  <Typography variant="body2">
                    Success rate: {((dashboardMetrics?.totalPolicies - dashboardMetrics?.overduePolicies) / (dashboardMetrics?.totalPolicies || 1) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Workflow Efficiency
                </Typography>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2">
                    Policies in review: {dashboardMetrics?.pendingReviews || 0}
                  </Typography>
                  <Typography variant="body2">
                    Overdue items: {dashboardMetrics?.overduePolicies || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Policy Detail Dialog */}
      <Dialog 
        open={!!selectedPolicy} 
        onClose={() => setSelectedPolicy(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedPolicy && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="between" alignItems="center">
                <Typography variant="h6">
                  {selectedPolicy.title}
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip {...getStatusChipProps(selectedPolicy.status)} />
                  <Chip {...getPriorityChipProps(selectedPolicy.priority)} />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <PolicyProgressStepper policy={selectedPolicy} />
              
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Progress: {selectedPolicy.progress.currentStage}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={selectedPolicy.progress.percentage} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="textSecondary">
                  Next: {selectedPolicy.progress.nextMilestone}
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Author</Typography>
                  <Typography variant="body2">{selectedPolicy.author}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Assignee</Typography>
                  <Typography variant="body2">{selectedPolicy.assignee || 'Unassigned'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Created</Typography>
                  <Typography variant="body2">
                    {format(selectedPolicy.createdAt, 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Last Updated</Typography>
                  <Typography variant="body2">
                    {format(selectedPolicy.updatedAt, 'MMM dd, yyyy')}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPolicy(null)}>Close</Button>
              {userRole !== 'user' && (
                <Button variant="contained" color="primary">
                  Update Status
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PolicyTrackerDashboard;