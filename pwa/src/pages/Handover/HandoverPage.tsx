import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  Tooltip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  SmartToy as AIIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { HandoverSummary, ResidentSummary, MedicationSummary, IncidentSummary, AlertSummary } from '../../../shared/types/handover';
import { AIHandoverGenerator } from '../../components/handover/AIHandoverGenerator';
import { HandoverEditor } from '../../components/handover/HandoverEditor';
import { HandoverAnalytics } from '../../components/handover/HandoverAnalytics';

interface HandoverPageProps {
  departmentId?: string;
  shiftType?: 'day' | 'evening' | 'night';
}

export const HandoverPage: React.FC<HandoverPageProps> = ({
  departmentId = 'default',
  shiftType
}) => {
  const [handoverSummaries, setHandoverSummaries] = useState<HandoverSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<HandoverSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingSummary, setEditingSummary] = useState<HandoverSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'day' | 'evening' | 'night'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'quality' | 'confidence'>('date');

  const tabs = [
    { label: 'Recent Summaries', icon: <VisibilityIcon /> },
    { label: 'Analytics', icon: <AIIcon /> },
    { label: 'Templates', icon: <EditIcon /> }
  ];

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
          departmentId: departmentId,
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
              },
              {
                residentId: 'res-2',
                residentName: 'Mary Johnson',
                roomNumber: '102',
                careLevel: 'Medium',
                keyUpdates: ['Stable condition', 'Family visited'],
                concerns: [],
                actionRequired: false
              }
            ],
            medicationChanges: [
              {
                residentId: 'res-1',
                medicationName: 'Paracetamol',
                changeType: 'dose_change',
                details: 'Increased from 500mg to 1000mg',
                prescriber: 'Dr. Smith',
                timeOfChange: new Date('2025-01-15T10:00:00'),
                monitoringRequired: true
              }
            ],
            carePlanUpdates: []
          },
          medications: {
            totalMedications: 45,
            newMedications: 3,
            discontinuedMedications: 1,
            doseChanges: 2,
            prnGiven: 5,
            medicationAlerts: [
              {
                alertId: 'alert-1',
                residentId: 'res-1',
                medicationName: 'Warfarin',
                alertType: 'interaction',
                severity: 'high',
                description: 'Potential interaction with new medication',
                actionRequired: 'Review with pharmacist',
                reportedBy: 'nurse-1',
                reportedAt: new Date('2025-01-15T14:00:00')
              }
            ]
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
              },
              {
                incidentId: 'inc-2',
                incidentType: 'Behavioral',
                residentId: 'res-3',
                description: 'Agitation during evening care',
                severity: 'medium',
                timeOccurred: new Date('2025-01-15T18:00:00'),
                actionsTaken: ['Calming techniques', 'Medication review'],
                followUpRequired: true,
                familyNotified: false
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
              },
              {
                alertId: 'alert-2',
                alertType: 'safety',
                severity: 'low',
                description: 'Call bell not working in Room 105',
                location: 'Room 105',
                timeRaised: new Date('2025-01-15T17:00:00'),
                status: 'acknowledged',
                assignedTo: 'maintenance'
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setShowAIGenerator(true);
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
      console.error('Failed to save changes:', error);
    }
  };

  const handleDownloadSummary = (summary: HandoverSummary) => {
    // In real implementation, this would generate and download a PDF
    console.log('Downloading summary:', summary.summaryId);
  };

  const handleShareSummary = (summary: HandoverSummary) => {
    // In real implementation, this would open share dialog
    console.log('Sharing summary:', summary.summaryId);
  };

  const filteredSummaries = handoverSummaries.filter(summary => {
    const matchesSearch = summary.summaryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         summary.generatedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || summary.shiftType === filterType;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return b.handoverDate.getTime() - a.handoverDate.getTime();
      case 'quality':
        return b.aiProcessing.qualityScore - a.aiProcessing.qualityScore;
      case 'confidence':
        return b.aiProcessing.confidenceScore - a.aiProcessing.confidenceScore;
      default:
        return 0;
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'high': return <WarningIcon color="warning" />;
      case 'medium': return <InfoIcon color="info" />;
      case 'low': return <CheckCircleIcon color="success" />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Daily Handover Summaries
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            AI-powered handover summaries for {shiftType ? `${shiftType} shift` : 'all shifts'}
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={handleGenerateAI}
          >
            Generate AI Summary
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadHandoverSummaries}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search summaries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Shift Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <MenuItem value="all">All Shifts</MenuItem>
              <MenuItem value="day">Day Shift</MenuItem>
              <MenuItem value="evening">Evening Shift</MenuItem>
              <MenuItem value="night">Night Shift</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="quality">Quality Score</MenuItem>
              <MenuItem value="confidence">Confidence Score</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
            >
              More Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} icon={tab.icon} />
          ))}
        </Tabs>
      </Box>

      {/* Content */}
      {activeTab === 0 && (
        <Box>
          {isLoading ? (
            <Box sx={{ width: '100%' }}>
              <LinearProgress />
              <Typography sx={{ mt: 2, textAlign: 'center' }}>
                Loading handover summaries...
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredSummaries.map((summary) => (
                <Grid item xs={12} md={6} lg={4} key={summary.summaryId}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1 }}>
                      {/* Summary Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {summary.handoverDate.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                          <Chip
                            label={summary.shiftType.charAt(0).toUpperCase() + summary.shiftType.slice(1)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditSummary(summary)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedSummary(summary)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Summary Stats */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="primary">
                              {summary.residents.totalResidents}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Residents
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="warning.main">
                              {summary.incidents.totalIncidents}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Incidents
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="error.main">
                              {summary.alerts.totalAlerts}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Alerts
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={3}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="success.main">
                              {summary.medications.totalMedications}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Medications
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Critical Items */}
                      {(summary.residents.criticalUpdates.length > 0 || 
                        summary.incidents.criticalIncidents > 0 || 
                        summary.alerts.criticalAlerts > 0) && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            {summary.residents.criticalUpdates.length + 
                             summary.incidents.criticalIncidents + 
                             summary.alerts.criticalAlerts} critical items require attention
                          </Typography>
                        </Alert>
                      )}

                      {/* AI Processing Info */}
                      <Box sx={{ mt: 'auto' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="textSecondary">
                            AI Quality: {summary.aiProcessing.qualityScore}%
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Confidence: {Math.round(summary.aiProcessing.confidenceScore * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={summary.aiProcessing.qualityScore}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </CardContent>
                    
                    {/* Actions */}
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadSummary(summary)}
                        >
                          Download
                        </Button>
                        <Button
                          size="small"
                          startIcon={<ShareIcon />}
                          onClick={() => handleShareSummary(summary)}
                        >
                          Share
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {filteredSummaries.length === 0 && !isLoading && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <AIIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No Handover Summaries Found
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Generate your first AI-powered handover summary to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AIIcon />}
                  onClick={handleGenerateAI}
                >
                  Generate AI Summary
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <HandoverAnalytics summaries={handoverSummaries} />
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Handover Templates
          </Typography>
          <Typography color="textSecondary">
            Template management coming soon...
          </Typography>
        </Box>
      )}

      {/* AI Generator Dialog */}
      <Dialog
        open={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Generate AI Handover Summary</DialogTitle>
        <DialogContent>
          <AIHandoverGenerator
            departmentId={departmentId}
            shiftType={shiftType}
            onGenerate={(summary) => {
              setHandoverSummaries(prev => [summary, ...prev]);
              setShowAIGenerator(false);
            }}
            onCancel={() => setShowAIGenerator(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Summary Dialog */}
      <Dialog
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Handover Summary</DialogTitle>
        <DialogContent>
          {editingSummary && (
            <HandoverEditor
              summary={editingSummary}
              onUpdate={setEditingSummary}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Summary Details Dialog */}
      <Dialog
        open={!!selectedSummary}
        onClose={() => setSelectedSummary(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Handover Summary Details
          {selectedSummary && (
            <Typography variant="subtitle2" color="textSecondary">
              {selectedSummary.handoverDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} - {selectedSummary.shiftType.charAt(0).toUpperCase() + selectedSummary.shiftType.slice(1)} Shift
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedSummary && (
            <Box>
              {/* Residents Section */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Residents ({selectedSummary.residents.totalResidents})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Room</TableCell>
                          <TableCell>Care Level</TableCell>
                          <TableCell>Updates</TableCell>
                          <TableCell>Action Required</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSummary.residents.criticalUpdates.map((resident) => (
                          <TableRow key={resident.residentId}>
                            <TableCell>{resident.residentName}</TableCell>
                            <TableCell>{resident.roomNumber}</TableCell>
                            <TableCell>
                              <Chip
                                label={resident.careLevel}
                                size="small"
                                color={resident.careLevel === 'High' ? 'error' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Box>
                                {resident.keyUpdates.map((update, index) => (
                                  <Typography key={index} variant="body2">
                                    • {update}
                                  </Typography>
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {resident.actionRequired ? (
                                <Chip label="Yes" size="small" color="warning" />
                              ) : (
                                <Chip label="No" size="small" color="success" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              {/* Incidents Section */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Incidents ({selectedSummary.incidents.totalIncidents})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedSummary.incidents.incidentDetails.map((incident) => (
                    <Card key={incident.incidentId} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="h6">{incident.incidentType}</Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getSeverityIcon(incident.severity)}
                            <Chip
                              label={incident.severity}
                              size="small"
                              sx={{ backgroundColor: getSeverityColor(incident.severity), color: 'white' }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {incident.description}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {incident.timeOccurred.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </AccordionDetails>
              </Accordion>

              {/* Alerts Section */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    Alerts ({selectedSummary.alerts.totalAlerts})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedSummary.alerts.alertDetails.map((alert) => (
                    <Card key={alert.alertId} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="h6">{alert.alertType}</Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getSeverityIcon(alert.severity)}
                            <Chip
                              label={alert.status}
                              size="small"
                              color={alert.status === 'active' ? 'error' : 'default'}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {alert.description}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {alert.timeRaised.toLocaleString()} • {alert.location}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSummary(null)}>Close</Button>
          <Button onClick={() => selectedSummary && handleEditSummary(selectedSummary)} variant="contained">
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB for Quick Actions */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleGenerateAI}
      >
        <AIIcon />
      </Fab>
    </Box>
  );
};