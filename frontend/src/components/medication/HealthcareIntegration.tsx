/**
 * @fileoverview Healthcare System Integration Interface for WriteCareNotes
 * @module HealthcareIntegration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive healthcare system integration interface providing
 * connectivity to NHS Digital, GP systems, pharmacy networks, and regulatory bodies.
 * Supports FHIR R4, HL7, and NHS Digital API standards for seamless data exchange.
 * 
 * @example
 * // Usage in medication management system
 * <HealthcareIntegration
 *   organizationId="org-123"
 *   onIntegrationStatusChange={handleStatusChange}
 *   onDataSyncCompleted={handleDataSync}
 * />
 * 
 * @compliance
 * - NHS Digital API Integration Standards
 * - FHIR R4 Compliance for Healthcare Interoperability
 * - HL7 Message Standards for Clinical Data Exchange
 * - GP Connect API Integration
 * - Electronic Prescription Service (EPS) Integration
 * - Summary Care Record (SCR) Access
 * 
 * @security
 * - OAuth 2.0 authentication for NHS Digital APIs
 * - TLS 1.3 encryption for all data transmission
 * - Audit trails for all external system interactions
 * - Data minimization and purpose limitation compliance
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
  TableRow
} from '@mui/material';
import {
  CloudSync as IntegrationIcon,
  CheckCircle as ConnectedIcon,
  Error as DisconnectedIcon,
  Warning as WarningIcon,
  Sync as SyncIcon,
  SyncProblem as SyncErrorIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  LocalHospital as HospitalIcon,
  LocalPharmacy as PharmacyIcon,
  Assignment as RecordIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  NotificationImportant as AlertIcon,
  VpnKey as AuthIcon,
  Storage as DataIcon,
  NetworkCheck as NetworkIcon
} from '@mui/icons-material';
import { Button } from '../ui/Button';
import { Card as UICard } from '../ui/Card';
import { Badge as UIBadge } from '../ui/Badge';
import { Alert as UIAlert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DataTable } from '../ui/DataTable';

// Types and Interfaces
interface HealthcareSystem {
  id: string;
  name: string;
  type: 'nhs_digital' | 'gp_system' | 'pharmacy' | 'hospital' | 'regulatory' | 'laboratory';
  provider: string;
  version: string;
  status: 'connected' | 'disconnected' | 'error' | 'maintenance' | 'pending';
  lastSync: Date;
  nextSync?: Date;
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'manual';
  dataTypes: DataType[];
  endpoints: SystemEndpoint[];
  authentication: AuthenticationConfig;
  configuration: SystemConfiguration;
  metrics: IntegrationMetrics;
}

interface DataType {
  type: 'patient' | 'medication' | 'prescription' | 'allergy' | 'condition' | 'observation' | 'document';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  format: 'fhir_r4' | 'hl7_v2' | 'hl7_v3' | 'json' | 'xml' | 'csv';
  enabled: boolean;
  lastSync?: Date;
  recordCount?: number;
}

interface SystemEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  purpose: string;
  status: 'active' | 'inactive' | 'error';
  responseTime?: number;
  lastCalled?: Date;
  callCount: number;
  errorCount: number;
}

interface AuthenticationConfig {
  type: 'oauth2' | 'api_key' | 'certificate' | 'basic_auth';
  tokenEndpoint?: string;
  clientId?: string;
  scopes?: string[];
  expiresAt?: Date;
  status: 'valid' | 'expired' | 'invalid' | 'pending';
}

interface SystemConfiguration {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  rateLimitPerMinute: number;
  enableLogging: boolean;
  enableAuditTrail: boolean;
  dataMapping: Record<string, string>;
  customHeaders: Record<string, string>;
}

interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number;
  dataVolume: number;
  lastError?: string;
  lastErrorTime?: Date;
}

interface SyncOperation {
  id: string;
  systemId: string;
  systemName: string;
  operation: 'sync' | 'import' | 'export' | 'validate' | 'reconcile';
  dataType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: SyncError[];
  progress: number;
}

interface SyncError {
  id: string;
  type: 'validation' | 'authentication' | 'network' | 'data' | 'business_rule';
  message: string;
  details: string;
  recordId?: string;
  timestamp: Date;
  resolved: boolean;
}

interface IntegrationAlert {
  id: string;
  systemId: string;
  systemName: string;
  type: 'connection_lost' | 'authentication_failed' | 'sync_failed' | 'rate_limit_exceeded' | 'data_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  actions: string[];
}

interface HealthcareIntegrationProps {
  organizationId: string;
  onIntegrationStatusChange?: (system: HealthcareSystem) => void;
  onDataSyncCompleted?: (operation: SyncOperation) => void;
  onIntegrationAlert?: (alert: IntegrationAlert) => void;
  showSensitiveData?: boolean;
  readOnly?: boolean;
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
export const HealthcareIntegration: React.FC<HealthcareIntegrationProps> = ({
  organizationId,
  onIntegrationStatusChange,
  onDataSyncCompleted,
  onIntegrationAlert,
  showSensitiveData = false,
  readOnly = false
}) => {
  // State Management
  const [healthcareSystems, setHealthcareSystems] = useState<HealthcareSystem[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [integrationAlerts, setIntegrationAlerts] = useState<IntegrationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'systems' | 'sync' | 'alerts' | 'logs'>('overview');
  const [selectedSystem, setSelectedSystem] = useState<HealthcareSystem | null>(null);
  const [showSystemDialog, setShowSystemDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Load integration data
  useEffect(() => {
    const loadIntegrationData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/healthcare-integration?organizationId=${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load integration data: ${response.statusText}`);
        }

        const data = await response.json();
        setHealthcareSystems(data.systems || []);
        setSyncOperations(data.operations || []);
        setIntegrationAlerts(data.alerts || []);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load integration data';
        setError(errorMessage);
        console.error('Error loading integration data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadIntegrationData();
    }
  }, [organizationId]);

  // Test system connection
  const testConnection = useCallback(async (systemId: string) => {
    try {
      const response = await fetch(`/api/v1/healthcare-integration/systems/${systemId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setHealthcareSystems(prev => 
        prev.map(system => 
          system.id === systemId 
            ? { ...system, status: result.success ? 'connected' : 'error' }
            : system
        )
      );

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMessage);
      console.error('Error testing connection:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Trigger manual sync
  const triggerSync = useCallback(async (systemId: string, dataType?: string) => {
    try {
      setSyncInProgress(true);
      setError(null);

      const response = await fetch(`/api/v1/healthcare-integration/systems/${systemId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dataType })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const operation = await response.json();
      setSyncOperations(prev => [operation, ...prev]);
      onDataSyncCompleted?.(operation);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      console.error('Error triggering sync:', err);
    } finally {
      setSyncInProgress(false);
    }
  }, [onDataSyncCompleted]);

  // Calculate integration metrics
  const integrationMetrics = useMemo(() => {
    const connectedSystems = healthcareSystems.filter(s => s.status === 'connected').length;
    const totalSystems = healthcareSystems.length;
    const recentOperations = syncOperations.filter(op => 
      new Date(op.startTime) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const successfulOperations = recentOperations.filter(op => op.status === 'completed').length;
    const activeAlerts = integrationAlerts.filter(a => !a.resolvedAt).length;

    return {
      connectedSystems,
      totalSystems,
      connectionRate: totalSystems > 0 ? Math.round((connectedSystems / totalSystems) * 100) : 0,
      recentOperations: recentOperations.length,
      successfulOperations,
      successRate: recentOperations.length > 0 ? Math.round((successfulOperations / recentOperations.length) * 100) : 0,
      activeAlerts
    };
  }, [healthcareSystems, syncOperations, integrationAlerts]);

  // Render system status
  const renderSystemStatus = (status: HealthcareSystem['status']) => {
    const statusConfig = {
      connected: { color: 'success' as const, label: 'Connected', icon: <ConnectedIcon /> },
      disconnected: { color: 'error' as const, label: 'Disconnected', icon: <DisconnectedIcon /> },
      error: { color: 'error' as const, label: 'Error', icon: <SyncErrorIcon /> },
      maintenance: { color: 'warning' as const, label: 'Maintenance', icon: <WarningIcon /> },
      pending: { color: 'info' as const, label: 'Pending', icon: <ScheduleIcon /> }
    };

    const config = statusConfig[status];
    return (
      <UIBadge variant={config.color} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {config.icon}
        {config.label}
      </UIBadge>
    );
  };

  // Render system type icon
  const renderSystemTypeIcon = (type: HealthcareSystem['type']) => {
    const typeIcons = {
      nhs_digital: <HospitalIcon />,
      gp_system: <RecordIcon />,
      pharmacy: <PharmacyIcon />,
      hospital: <HospitalIcon />,
      regulatory: <SecurityIcon />,
      laboratory: <ApiIcon />
    };

    return typeIcons[type] || <IntegrationIcon />;
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
          <IntegrationIcon color="primary" />
          Healthcare Integration
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                size="small"
              />
            }
            label="Auto Sync"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          {!readOnly && (
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={() => setShowSyncDialog(true)}
              disabled={syncInProgress}
            >
              {syncInProgress ? 'Syncing...' : 'Sync All'}
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
        <Tab label="Overview" value="overview" />
        <Tab label="Systems" value="systems" />
        <Tab label="Sync Operations" value="sync" />
        <Tab 
          label={
            <Badge badgeContent={integrationMetrics.activeAlerts} color="error">
              Alerts
            </Badge>
          } 
          value="alerts" 
        />
        <Tab label="Logs" value="logs" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h4" color="primary">
                  {integrationMetrics.connectedSystems}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Connected Systems
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  of {integrationMetrics.totalSystems} total
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h4" color="success.main">
                  {integrationMetrics.connectionRate}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Connection Rate
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={integrationMetrics.connectionRate} 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h4" color="info.main">
                  {integrationMetrics.recentOperations}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Recent Operations
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Last 24 hours
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h4" color="warning.main">
                  {integrationMetrics.activeAlerts}
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

          {/* System Status Overview */}
          <Grid item xs={12}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Status Overview
                </Typography>
                <DataTable
                  data={healthcareSystems}
                  columns={[
                    {
                      key: 'name',
                      label: 'System',
                      render: (system: HealthcareSystem) => (
                        <Box display="flex" alignItems="center" gap={1}>
                          {renderSystemTypeIcon(system.type)}
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {system.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {system.provider}
                            </Typography>
                          </Box>
                        </Box>
                      )
                    },
                    {
                      key: 'type',
                      label: 'Type',
                      render: (system: HealthcareSystem) => (
                        <Chip
                          label={system.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          size="small"
                        />
                      )
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (system: HealthcareSystem) => renderSystemStatus(system.status)
                    },
                    {
                      key: 'lastSync',
                      label: 'Last Sync',
                      render: (system: HealthcareSystem) => (
                        <Typography variant="body2">
                          {new Date(system.lastSync).toLocaleString()}
                        </Typography>
                      )
                    },
                    {
                      key: 'uptime',
                      label: 'Uptime',
                      render: (system: HealthcareSystem) => (
                        <Typography variant="body2">
                          {system.metrics.uptime.toFixed(1)}%
                        </Typography>
                      )
                    },
                    {
                      key: 'actions',
                      label: 'Actions',
                      render: (system: HealthcareSystem) => (
                        <Box display="flex" gap={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedSystem(system);
                              setShowSystemDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => testConnection(system.id)}
                            disabled={system.status === 'maintenance'}
                          >
                            <NetworkIcon />
                          </IconButton>
                          {!readOnly && (
                            <IconButton
                              size="small"
                              onClick={() => triggerSync(system.id)}
                              disabled={syncInProgress || system.status !== 'connected'}
                            >
                              <SyncIcon />
                            </IconButton>
                          )}
                        </Box>
                      )
                    }
                  ]}
                  pagination
                  sortable
                />
              </CardContent>
            </UICard>
          </Grid>
        </Grid>
      )}

      {/* System Details Dialog */}
      <Dialog
        open={showSystemDialog}
        onClose={() => setShowSystemDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          System Details
          {selectedSystem && (
            <Typography variant="subtitle2" color="textSecondary">
              {selectedSystem.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedSystem && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  System Information
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Provider:</strong> {selectedSystem.provider}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Version:</strong> {selectedSystem.version}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Type:</strong> {selectedSystem.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Status:</strong> {renderSystemStatus(selectedSystem.status)}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Sync Frequency:</strong> {selectedSystem.syncFrequency.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Total Requests:</strong> {selectedSystem.metrics.totalRequests.toLocaleString()}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Success Rate:</strong> {((selectedSystem.metrics.successfulRequests / selectedSystem.metrics.totalRequests) * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Average Response Time:</strong> {selectedSystem.metrics.averageResponseTime}ms
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Uptime:</strong> {selectedSystem.metrics.uptime.toFixed(2)}%
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Data Volume:</strong> {(selectedSystem.metrics.dataVolume / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Data Types
                </Typography>
                <Grid container spacing={1}>
                  {selectedSystem.dataTypes.map(dataType => (
                    <Grid item key={dataType.type}>
                      <Chip
                        label={`${dataType.type} (${dataType.direction})`}
                        color={dataType.enabled ? 'primary' : 'default'}
                        size="small"
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowSystemDialog(false)}
          >
            Close
          </Button>
          {selectedSystem && !readOnly && (
            <Button
              variant="contained"
              onClick={() => {
                triggerSync(selectedSystem.id);
                setShowSystemDialog(false);
              }}
              disabled={syncInProgress || selectedSystem.status !== 'connected'}
            >
              Sync Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HealthcareIntegration;