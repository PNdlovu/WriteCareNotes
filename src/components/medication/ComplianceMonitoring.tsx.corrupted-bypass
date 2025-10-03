/**
 * @fileoverview Compliance Monitoring Dashboard for WriteCareNotes
 * @module ComplianceMonitoring
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Real-time compliance monitoring system providing continuous
 * oversight of medication management compliance across all regulatory frameworks.
 * Monitors CQC, MHRA, NICE guidelines, and regional healthcare authority requirements.
 * 
 * @example
 * // Usage in medication management system
 * <ComplianceMonitoring
 *   organizationId="org-123"
 *   onComplianceAlert={handleComplianceAlert}
 *   onActionRequired={handleActionRequired}
 * />
 * 
 * @compliance
 * - CQC Fundamental Standards Monitoring
 * - MHRA Good Distribution Practice (GDP)
 * - NICE Medicines Optimization Guidelines
 * - Care Inspectorate Scotland Standards
 * - CIW Wales Regulatory Requirements
 * - RQIA Northern Ireland Standards
 * 
 * @security
 * - Real-time compliance status monitoring
 * - Automated alert generation for violations
 * - Audit trail for all compliance activities
 * - Role-based access to compliance data
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
  Divider
} from '@mui/material';
import {
  Security as ComplianceIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Assignment as TaskIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  NotificationImportant as AlertIcon,
  Shield as ShieldIcon,
  Gavel as RegulatoryIcon,
  LocalHospital as HealthcareIcon
} from '@mui/icons-material';
import { Button } from '../ui/Button';
import { Card as UICard } from '../ui/Card';
import { Badge as UIBadge } from '../ui/Badge';
import { Alert as UIAlert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DataTable } from '../ui/DataTable';

// Types and Interfaces
interface ComplianceStatus {
  id: string;
  framework: 'cqc' | 'mhra' | 'nice' | 'care_inspectorate' | 'ciw' | 'rqia';
  category: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'at_risk' | 'pending' | 'not_applicable';
  score: number;
  maxScore: number;
  lastAssessed: Date;
  nextAssessment: Date;
  assessor: string;
  evidence: ComplianceEvidence[];
  actions: ComplianceAction[];
  trend: 'improving' | 'declining' | 'stable';
}

interface ComplianceEvidence {
  id: string;
  type: 'document' | 'record' | 'audit' | 'training' | 'policy';
  title: string;
  description: string;
  dateCreated: Date;
  validUntil?: Date;
  status: 'valid' | 'expired' | 'pending_review';
  attachments: string[];
}

interface ComplianceAction {
  id: string;
  type: 'corrective' | 'preventive' | 'improvement' | 'monitoring';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  dueDate: Date;
  status: 'open' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ComplianceAlert {
  id: string;
  type: 'violation' | 'risk' | 'expiry' | 'assessment_due' | 'action_overdue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  framework: ComplianceStatus['framework'];
  category: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: Date;
  actions: string[];
}

interface ComplianceMetrics {
  overallScore: number;
  frameworkScores: Record<string, number>;
  totalRequirements: number;
  compliantRequirements: number;
  nonCompliantRequirements: number;
  atRiskRequirements: number;
  pendingAssessments: number;
  overdueActions: number;
  activeAlerts: number;
  trendsData: ComplianceTrend[];
}

interface ComplianceTrend {
  date: Date;
  overallScore: number;
  frameworkScores: Record<string, number>;
  alertCount: number;
  actionCount: number;
}

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  region: 'england' | 'scotland' | 'wales' | 'northern_ireland' | 'uk_wide';
  categories: ComplianceCategory[];
  enabled: boolean;
  lastUpdated: Date;
}

interface ComplianceCategory {
  id: string;
  name: string;
  description: string;
  weight: number;
  requirements: ComplianceRequirement[];
}

interface ComplianceRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  mandatory: boolean;
  assessmentFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  evidenceRequired: string[];
}

interface ComplianceMonitoringProps {
  organizationId: string;
  onComplianceAlert?: (alert: ComplianceAlert) => void;
  onActionRequired?: (action: ComplianceAction) => void;
  showFinancialImpact?: boolean;
  readOnly?: boolean;
}

export const ComplianceMonitoring: React.FC<ComplianceMonitoringProps> = ({
  organizationId,
  onComplianceAlert,
  onActionRequired,
  showFinancialImpact = true,
  readOnly = false
}) => {
  // State Management
  const [complianceStatuses, setComplianceStatuses] = useState<ComplianceStatus[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([]);
  const [complianceActions, setComplianceActions] = useState<ComplianceAction[]>([]);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics | null>(null);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'frameworks' | 'alerts' | 'actions' | 'trends'>('overview');
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load compliance data
  useEffect(() => {
    const loadComplianceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/compliance-monitoring?organizationId=${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load compliance data: ${response.statusText}`);
        }

        const data = await response.json();
        setComplianceStatuses(data.statuses || []);
        setComplianceAlerts(data.alerts || []);
        setComplianceActions(data.actions || []);
        setComplianceMetrics(data.metrics || null);
        setFrameworks(data.frameworks || []);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load compliance data';
        setError(errorMessage);
        console.error('Error loading compliance data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadComplianceData();
    }
  }, [organizationId]);

  // Auto-refresh compliance data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Refresh compliance data every 5 minutes
      window.location.reload();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/v1/compliance-monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
      }

      setComplianceAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledgedAt: new Date(), acknowledgedBy: 'current_user' }
            : alert
        )
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge alert';
      setError(errorMessage);
      console.error('Error acknowledging alert:', err);
    }
  }, []);

  // Update action status
  const updateActionStatus = useCallback(async (actionId: string, status: ComplianceAction['status']) => {
    try {
      const response = await fetch(`/api/v1/compliance-monitoring/actions/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`Failed to update action: ${response.statusText}`);
      }

      setComplianceActions(prev => 
        prev.map(action => 
          action.id === actionId 
            ? { ...action, status, updatedAt: new Date() }
            : action
        )
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update action';
      setError(errorMessage);
      console.error('Error updating action:', err);
    }
  }, []);

  // Filter data by framework
  const filteredData = useMemo(() => {
    if (selectedFramework === 'all') {
      return {
        statuses: complianceStatuses,
        alerts: complianceAlerts,
        actions: complianceActions
      };
    }

    return {
      statuses: complianceStatuses.filter(s => s.framework === selectedFramework),
      alerts: complianceAlerts.filter(a => a.framework === selectedFramework),
      actions: complianceActions.filter(a => 
        complianceStatuses.some(s => s.framework === selectedFramework && s.actions.some(sa => sa.id === a.id))
      )
    };
  }, [complianceStatuses, complianceAlerts, complianceActions, selectedFramework]);

  // Render compliance status badge
  const renderComplianceStatus = (status: ComplianceStatus['status']) => {
    const statusConfig = {
      compliant: { color: 'success' as const, label: 'Compliant', icon: <CheckCircleIcon /> },
      non_compliant: { color: 'error' as const, label: 'Non-Compliant', icon: <ErrorIcon /> },
      at_risk: { color: 'warning' as const, label: 'At Risk', icon: <WarningIcon /> },
      pending: { color: 'info' as const, label: 'Pending', icon: <ScheduleIcon /> },
      not_applicable: { color: 'default' as const, label: 'N/A', icon: null }
    };

    const config = statusConfig[status];
    return (
      <UIBadge variant={config.color} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {config.icon}
        {config.label}
      </UIBadge>
    );
  };

  // Render alert severity
  const renderAlertSeverity = (severity: ComplianceAlert['severity']) => {
    const severityConfig = {
      low: { color: 'info' as const, label: 'Low' },
      medium: { color: 'warning' as const, label: 'Medium' },
      high: { color: 'error' as const, label: 'High' },
      critical: { color: 'error' as const, label: 'Critical' }
    };

    const config = severityConfig[severity];
    return <UIBadge variant={config.color}>{config.label}</UIBadge>;
  };

  // Render framework icon
  const renderFrameworkIcon = (framework: ComplianceStatus['framework']) => {
    const frameworkIcons = {
      cqc: <RegulatoryIcon />,
      mhra: <ShieldIcon />,
      nice: <HealthcareIcon />,
      care_inspectorate: <AssessmentIcon />,
      ciw: <ComplianceIcon />,
      rqia: <SecurityIcon />
    };

    return frameworkIcons[framework] || <ComplianceIcon />;
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
          <ComplianceIcon color="primary" />
          Compliance Monitoring
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label="Auto Refresh"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <UIAlert variant="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </UIAlert>
      )}

      {/* Framework Filter */}
      <Box mb={3}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Framework</InputLabel>
          <Select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            label="Framework"
          >
            <MenuItem value="all">All Frameworks</MenuItem>
            {frameworks.map(framework => (
              <MenuItem key={framework.id} value={framework.id}>
                {framework.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" value="overview" />
        <Tab label="Frameworks" value="frameworks" />
        <Tab 
          label={
            <Badge badgeContent={filteredData.alerts.filter(a => !a.acknowledgedAt).length} color="error">
              Alerts
            </Badge>
          } 
          value="alerts" 
        />
        <Tab 
          label={
            <Badge badgeContent={filteredData.actions.filter(a => a.status === 'overdue').length} color="warning">
              Actions
            </Badge>
          } 
          value="actions" 
        />
        <Tab label="Trends" value="trends" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 'overview' && complianceMetrics && (
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {complianceMetrics.overallScore}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Overall Compliance
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={complianceMetrics.overallScore} 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {complianceMetrics.compliantRequirements}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Compliant Requirements
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  of {complianceMetrics.totalRequirements} total
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h4" color="error.main">
                  {complianceMetrics.activeAlerts}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Alerts
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Require attention
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  {complianceMetrics.overdueActions}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Overdue Actions
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Past due date
                </Typography>
              </CardContent>
            </UICard>
          </Grid>

          {/* Framework Scores */}
          <Grid item xs={12}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Framework Compliance Scores
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(complianceMetrics.frameworkScores).map(([framework, score]) => (
                    <Grid item xs={12} sm={6} md={4} key={framework}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {renderFrameworkIcon(framework as ComplianceStatus['framework'])}
                        <Typography variant="body2" fontWeight="bold">
                          {framework.toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {score}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={score} 
                        color={score >= 90 ? 'success' : score >= 70 ? 'warning' : 'error'}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </UICard>
          </Grid>

          {/* Recent Alerts */}
          <Grid item xs={12} md={6}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Alerts
                </Typography>
                <List dense>
                  {filteredData.alerts.slice(0, 5).map(alert => (
                    <ListItem key={alert.id}>
                      <ListItemIcon>
                        <AlertIcon color={alert.severity === 'critical' ? 'error' : 'warning'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.title}
                        secondary={`${alert.framework.toUpperCase()} • ${new Date(alert.createdAt).toLocaleDateString()}`}
                      />
                      <ListItemSecondaryAction>
                        {renderAlertSeverity(alert.severity)}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </UICard>
          </Grid>

          {/* Pending Actions */}
          <Grid item xs={12} md={6}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Actions
                </Typography>
                <List dense>
                  {filteredData.actions.filter(a => a.status !== 'completed').slice(0, 5).map(action => (
                    <ListItem key={action.id}>
                      <ListItemIcon>
                        <TaskIcon color={action.status === 'overdue' ? 'error' : 'primary'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={action.title}
                        secondary={`Due: ${new Date(action.dueDate).toLocaleDateString()}`}
                      />
                      <ListItemSecondaryAction>
                        <UIBadge variant={action.status === 'overdue' ? 'error' : 'warning'}>
                          {action.status.replace('_', ' ').toUpperCase()}
                        </UIBadge>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </UICard>
          </Grid>
        </Grid>
      )}

      {/* Frameworks Tab */}
      {activeTab === 'frameworks' && (
        <Grid container spacing={3}>
          {filteredData.statuses.map(status => (
            <Grid item xs={12} key={status.id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    {renderFrameworkIcon(status.framework)}
                    <Typography variant="h6">
                      {status.requirement}
                    </Typography>
                    <Box ml="auto" mr={2}>
                      {renderComplianceStatus(status.status)}
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {status.score}/{status.maxScore}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="body2" paragraph>
                        <strong>Category:</strong> {status.category}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Last Assessed:</strong> {new Date(status.lastAssessed).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Next Assessment:</strong> {new Date(status.nextAssessment).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Assessor:</strong> {status.assessor}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Evidence ({status.evidence.length})</strong>
                      </Typography>
                      <List dense>
                        {status.evidence.slice(0, 3).map(evidence => (
                          <ListItem key={evidence.id} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={evidence.title}
                              secondary={evidence.type}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
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
          {selectedAlert && (
            <Typography variant="subtitle2" color="textSecondary">
              {selectedAlert.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body1" paragraph>
                  {selectedAlert.description}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Framework
                </Typography>
                <Typography variant="body1">
                  {selectedAlert.framework.toUpperCase()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Severity
                </Typography>
                {renderAlertSeverity(selectedAlert.severity)}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedAlert.createdAt).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Typography variant="body1">
                  {selectedAlert.acknowledgedAt ? 'Acknowledged' : 'Pending'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowAlertDialog(false)}
          >
            Close
          </Button>
          {selectedAlert && !selectedAlert.acknowledgedAt && !readOnly && (
            <Button
              variant="contained"
              onClick={() => {
                acknowledgeAlert(selectedAlert.id);
                setShowAlertDialog(false);
              }}
            >
              Acknowledge
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceMonitoring;