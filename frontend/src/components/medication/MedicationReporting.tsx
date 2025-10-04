/**
 * @fileoverview Medication Reporting Interface for WriteCareNotes
 * @module MedicationReporting
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive medication reporting system providing advanced
 * analytics, regulatory reports, clinical insights, and performance metrics.
 * Supports CQC, MHRA, and regional healthcare authority reporting requirements.
 * 
 * @example
 * // Usage in medication management dashboard
 * <MedicationReporting
 *   organizationId="org-123"
 *   onReportGenerated={handleReportGenerated}
 *   onExportCompleted={handleExportCompleted}
 * />
 * 
 * @compliance
 * - CQC Medication Management Reporting
 * - MHRA Regulatory Reporting Requirements
 * - NICE Medicines Optimization Metrics
 * - Care Inspectorate Scotland Reporting
 * - CIW Wales Medication Reports
 * 
 * @security
 * - Role-based access to sensitive reporting data
 * - Audit trails for all report generation and access
 * - Secure data export with encryption
 * - Anonymization options for external reporting
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
  Button as MuiButton,
  IconButton,
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
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  Analytics as AnalyticsIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { Button } from '../ui/Button';
import { Card as UICard } from '../ui/Card';
import { Badge as UIBadge } from '../ui/Badge';
import { Alert as UIAlert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DataTable } from '../ui/DataTable';

// Types and Interfaces
interface MedicationReport {
  id: string;
  title: string;
  type: 'regulatory' | 'clinical' | 'operational' | 'financial' | 'quality' | 'safety';
  category: 'cqc' | 'mhra' | 'nice' | 'internal' | 'audit' | 'performance';
  description: string;
  generatedAt: Date;
  generatedBy: string;
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  parameters: ReportParameters;
  data: ReportData;
  exportFormats: ExportFormat[];
  scheduledRun?: ScheduledRun;
}

interface ReportParameters {
  startDate: Date;
  endDate: Date;
  organizationId: string;
  departments?: string[];
  medicationTypes?: string[];
  residentGroups?: string[];
  includeControlledSubstances: boolean;
  includeIncidents: boolean;
  includeCompliance: boolean;
  anonymizeData: boolean;
}

interface ReportData {
  summary: ReportSummary;
  metrics: ReportMetric[];
  charts: ChartData[];
  tables: TableData[];
  insights: ClinicalInsight[];
  recommendations: string[];
}

interface ReportSummary {
  totalMedications: number;
  totalAdministrations: number;
  adherenceRate: number;
  errorRate: number;
  costSavings: number;
  complianceScore: number;
  safetyIncidents: number;
  qualityMetrics: QualityMetric[];
}

interface ReportMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  benchmark?: number;
  target?: number;
  status: 'good' | 'warning' | 'critical';
}

interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: any[];
  xAxis?: string;
  yAxis?: string;
  categories?: string[];
}

interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: any[][];
  sortable: boolean;
  exportable: boolean;
}

interface ClinicalInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionRequired: boolean;
  recommendations: string[];
}

interface QualityMetric {
  name: string;
  score: number;
  maxScore: number;
  category: string;
}

interface ExportFormat {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'xml';
  available: boolean;
  size?: string;
  generatedAt?: Date;
}

interface ScheduledRun {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  nextRun: Date;
  lastRun?: Date;
  enabled: boolean;
  recipients: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: MedicationReport['type'];
  category: MedicationReport['category'];
  defaultParameters: Partial<ReportParameters>;
  requiredPermissions: string[];
}

interface MedicationReportingProps {
  organizationId: string;
  onReportGenerated?: (report: MedicationReport) => void;
  onExportCompleted?: (report: MedicationReport, format: string) => void;
  showFinancialData?: boolean;
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
export const MedicationReporting: React.FC<MedicationReportingProps> = ({
  organizationId,
  onReportGenerated,
  onExportCompleted,
  showFinancialData = true,
  readOnly = false
}) => {
  // State Management
  const [reports, setReports] = useState<MedicationReport[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<MedicationReport | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'templates' | 'scheduled'>('dashboard');
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Report Generation State
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportParameters, setReportParameters] = useState<Partial<ReportParameters>>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    organizationId,
    includeControlledSubstances: true,
    includeIncidents: true,
    includeCompliance: true,
    anonymizeData: false
  });

  // Load reports and templates
  useEffect(() => {
    const loadReportingData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/medication-reporting?organizationId=${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load reporting data: ${response.statusText}`);
        }

        const data = await response.json();
        setReports(data.reports || []);
        setReportTemplates(data.templates || []);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load reporting data';
        setError(errorMessage);
        console.error('Error loading reporting data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadReportingData();
    }
  }, [organizationId]);

  // Generate report
  const generateReport = useCallback(async () => {
    if (!selectedTemplate) return;

    try {
      setGeneratingReport(true);
      setError(null);

      const response = await fetch('/api/v1/medication-reporting/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          parameters: {
            ...selectedTemplate.defaultParameters,
            ...reportParameters
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const result = await response.json();
      const newReport = result.report;
      
      setReports(prev => [newReport, ...prev]);
      onReportGenerated?.(newReport);
      
      setShowGenerateDialog(false);
      setSelectedTemplate(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      console.error('Error generating report:', err);
    } finally {
      setGeneratingReport(false);
    }
  }, [selectedTemplate, reportParameters, onReportGenerated]);

  // Export report
  const exportReport = useCallback(async (report: MedicationReport, format: ExportFormat['format']) => {
    try {
      const response = await fetch(`/api/v1/medication-reporting/${report.id}/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        throw new Error(`Failed to export report: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onExportCompleted?.(report, format);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMessage);
      console.error('Error exporting report:', err);
    }
  }, [onExportCompleted]);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const completedReports = reports.filter(r => r.status === 'completed');
    const recentReports = reports.filter(r => 
      new Date(r.generatedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    return {
      totalReports: reports.length,
      completedReports: completedReports.length,
      recentReports: recentReports.length,
      averageComplianceScore: completedReports.length > 0 
        ? Math.round(completedReports.reduce((sum, r) => sum + (r.data?.summary?.complianceScore || 0), 0) / completedReports.length)
        : 0
    };
  }, [reports]);

  // Render report status badge
  const renderReportStatus = (status: MedicationReport['status']) => {
    const statusConfig = {
      generating: { color: 'info' as const, label: 'Generating' },
      completed: { color: 'success' as const, label: 'Completed' },
      failed: { color: 'error' as const, label: 'Failed' },
      scheduled: { color: 'warning' as const, label: 'Scheduled' }
    };

    const config = statusConfig[status];
    return <UIBadge variant={config.color}>{config.label}</UIBadge>;
  };

  // Render metric trend
  const renderMetricTrend = (metric: ReportMetric) => {
    const trendIcon = metric.trend === 'increasing' ? <TrendingUpIcon /> : 
                     metric.trend === 'decreasing' ? <TrendingDownIcon /> : null;
    const trendColor = metric.trend === 'increasing' ? 'success.main' : 
                      metric.trend === 'decreasing' ? 'error.main' : 'text.secondary';

    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        {trendIcon && (
          <Box sx={{ color: trendColor, display: 'flex', alignItems: 'center' }}>
            {trendIcon}
          </Box>
        )}
        <Typography variant="caption" sx={{ color: trendColor }}>
          {metric.trendPercentage > 0 ? '+' : ''}{metric.trendPercentage}%
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon color="primary" />
          Medication Reporting
        </Typography>
        <Box display="flex" gap={1}>
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
              startIcon={<AnalyticsIcon />}
              onClick={() => setShowGenerateDialog(true)}
            >
              Generate Report
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
        <Tab label="Dashboard" value="dashboard" />
        <Tab label="Reports" value="reports" />
        <Tab label="Templates" value="templates" />
        <Tab label="Scheduled" value="scheduled" />
      </Tabs>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {dashboardMetrics.totalReports}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Reports
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {dashboardMetrics.completedReports}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Completed Reports
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {dashboardMetrics.recentReports}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Recent (7 days)
                </Typography>
              </CardContent>
            </UICard>
          </Grid>
          <Grid item xs={12} md={3}>
            <UICard>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {dashboardMetrics.averageComplianceScore}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Compliance
                </Typography>
              </CardContent>
            </UICard>
          </Grid>

          {/* Recent Reports */}
          <Grid item xs={12}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Reports
                </Typography>
                <DataTable
                  data={reports.slice(0, 10)}
                  columns={[
                    {
                      key: 'title',
                      label: 'Report Title',
                      render: (report: MedicationReport) => (
                        <Typography variant="body2" fontWeight="bold">
                          {report.title}
                        </Typography>
                      )
                    },
                    {
                      key: 'type',
                      label: 'Type',
                      render: (report: MedicationReport) => (
                        <Chip
                          label={report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          size="small"
                        />
                      )
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (report: MedicationReport) => renderReportStatus(report.status)
                    },
                    {
                      key: 'generatedAt',
                      label: 'Generated',
                      render: (report: MedicationReport) => (
                        <Typography variant="body2">
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </Typography>
                      )
                    },
                    {
                      key: 'actions',
                      label: 'Actions',
                      render: (report: MedicationReport) => (
                        <Box display="flex" gap={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedReport(report);
                              setShowReportDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                          {report.status === 'completed' && (
                            <IconButton
                              size="small"
                              onClick={() => exportReport(report, 'pdf')}
                            >
                              <DownloadIcon />
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
        </Grid>
      )}

      {/* Generate Report Dialog */}
      <Dialog
        open={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Generate New Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Report Template</InputLabel>
                <Select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = reportTemplates.find(t => t.id === e.target.value);
                    setSelectedTemplate(template || null);
                  }}
                  label="Report Template"
                >
                  {reportTemplates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {selectedTemplate && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={reportParameters.startDate ? reportParameters.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setReportParameters(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={reportParameters.endDate ? reportParameters.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setReportParameters(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportParameters.includeControlledSubstances || false}
                        onChange={(e) => setReportParameters(prev => ({ ...prev, includeControlledSubstances: e.target.checked }))}
                      />
                    }
                    label="Include Controlled Substances Data"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportParameters.includeIncidents || false}
                        onChange={(e) => setReportParameters(prev => ({ ...prev, includeIncidents: e.target.checked }))}
                      />
                    }
                    label="Include Safety Incidents"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportParameters.anonymizeData || false}
                        onChange={(e) => setReportParameters(prev => ({ ...prev, anonymizeData: e.target.checked }))}
                      />
                    }
                    label="Anonymize Personal Data"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowGenerateDialog(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={generateReport}
            disabled={!selectedTemplate || generatingReport}
            startIcon={generatingReport ? <CircularProgress size={20} /> : <AnalyticsIcon />}
          >
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Details Dialog */}
      <Dialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Report Details
          {selectedReport && (
            <Typography variant="subtitle2" color="textSecondary">
              {selectedReport.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedReport && selectedReport.status === 'completed' && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Report Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Total Medications
                    </Typography>
                    <Typography variant="h6">
                      {selectedReport.data.summary.totalMedications}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Adherence Rate
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {selectedReport.data.summary.adherenceRate}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Error Rate
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {selectedReport.data.summary.errorRate}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Compliance Score
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {selectedReport.data.summary.complianceScore}%
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Export Options
                </Typography>
                <List dense>
                  {selectedReport.exportFormats
                    .filter(format => format.available)
                    .map(format => (
                      <ListItem key={format.format}>
                        <ListItemIcon>
                          <DownloadIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={format.format.toUpperCase()}
                          secondary={format.size || 'Ready to export'}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => exportReport(selectedReport, format.format)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowReportDialog(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicationReporting;