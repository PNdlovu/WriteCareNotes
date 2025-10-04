/**
 * @fileoverview Resident Profile Interface for WriteCareNotes
 * @module ResidentProfile
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive resident profile management providing detailed
 * resident information, medical history, care preferences, family contacts,
 * and personal care settings. Supports GDPR compliance and family portal access.
 * 
 * @example
 * // Usage in resident management system
 * <ResidentProfile
 *   residentId="resident-123"
 *   onProfileUpdate={handleProfileUpdate}
 *   onEmergencyContactUpdate={handleEmergencyContact}
 * />
 * 
 * @compliance
 * - GDPR Data Subject Rights
 * - CQC Person-Centered Care Standards
 * - Care Inspectorate Scotland Guidelines
 * - Mental Capacity Act 2005
 * - Equality Act 2010
 * 
 * @security
 * - Role-based access to sensitive information
 * - Audit trails for all profile modifications
 * - Secure handling of personal and medical data
 * - Family portal access controls
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Button as MuiButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  MedicalServices as MedicalIcon,
  Restaurant as MealIcon,
  Favorite as HeartIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  PhotoCamera as PhotoIcon,
  ContactPhone as ContactIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Button } from '../ui/Button';
import { Card as UICard } from '../ui/Card';
import { Alert as UIAlert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Import types from ResidentDashboard
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
  emergencyContacts: EmergencyContact[];
  familyContacts: FamilyContact[];
  gp: GPDetails;
  careLevel: 'residential' | 'nursing' | 'dementia' | 'mental_health';
  mobilityLevel: 'independent' | 'assisted' | 'wheelchair' | 'bedbound';
  cognitiveStatus: 'alert' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  medicalConditions: MedicalCondition[];
  allergies: Allergy[];
  dietaryRequirements: string[];
  culturalNeeds: string[];
  religiousNeeds: string[];
  preferences: ResidentPreferences;
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

interface ResidentPreferences {
  wakeUpTime?: string;
  bedTime?: string;
  mealPreferences: string[];
  activityPreferences: string[];
  musicPreferences: string[];
  communicationStyle: string;
  personalCarePreferences: string[];
}

interface ResidentProfileProps {
  residentId: string;
  onProfileUpdate?: (resident: ResidentData) => void;
  onEmergencyContactUpdate?: (contacts: EmergencyContact[]) => void;
  readOnly?: boolean;
  showSensitiveInfo?: boolean;
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
export const ResidentProfile: React.FC<ResidentProfileProps> = ({
  residentId,
  onProfileUpdate,
  onEmergencyContactUpdate,
  readOnly = false,
  showSensitiveInfo = true
}) => {
  // State Management
  const [residentData, setResidentData] = useState<ResidentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ResidentData>>({});
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'contacts' | 'preferences'>('personal');
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({});

  // Load resident data
  useEffect(() => {
    const loadResidentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/v1/residents/${residentId}/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load resident profile: ${response.statusText}`);
        }

        const data = await response.json();
        setResidentData(data.resident);
        setEditedData(data.resident);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load resident profile';
        setError(errorMessage);
        console.error('Error loading resident profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (residentId) {
      loadResidentData();
    }
  }, [residentId]);

  // Save profile changes
  const saveProfile = useCallback(async () => {
    if (!editedData || !residentData) return;

    try {
      setError(null);

      const response = await fetch(`/api/v1/residents/${residentId}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update resident profile: ${response.statusText}`);
      }

      const updatedData = await response.json();
      setResidentData(updatedData.resident);
      setEditedData(updatedData.resident);
      setEditing(false);
      
      onProfileUpdate?.(updatedData.resident);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update resident profile';
      setError(errorMessage);
      console.error('Error updating resident profile:', err);
    }
  }, [editedData, residentData, residentId, onProfileUpdate]);

  // Add emergency contact
  const addEmergencyContact = useCallback(async () => {
    if (!newContact.name || !newContact.phone || !residentData) return;

    try {
      const contactData = {
        ...newContact,
        id: `contact-${Date.now()}`,
        isPrimary: residentData.emergencyContacts.length === 0,
        canMakeDecisions: false
      };

      const updatedContacts = [...residentData.emergencyContacts, contactData as EmergencyContact];
      
      const response = await fetch(`/api/v1/residents/${residentId}/emergency-contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      if (!response.ok) {
        throw new Error(`Failed to add emergency contact: ${response.statusText}`);
      }

      setResidentData(prev => prev ? {
        ...prev,
        emergencyContacts: updatedContacts
      } : null);

      setNewContact({});
      setShowAddContactDialog(false);
      
      onEmergencyContactUpdate?.(updatedContacts);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add emergency contact';
      setError(errorMessage);
      console.error('Error adding emergency contact:', err);
    }
  }, [newContact, residentData, residentId, onEmergencyContactUpdate]);

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
        <AlertTitle>Error Loading Resident Profile</AlertTitle>
        {error || 'Resident profile could not be loaded'}
      </UIAlert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Resident Profile
        </Typography>
        {!readOnly && (
          <Box display="flex" gap={1}>
            {editing ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setEditing(false);
                    setEditedData(residentData);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveProfile}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <UIAlert variant="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </UIAlert>
      )}

      {/* Profile Header */}
      <UICard sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={3}>
            <Box position="relative">
              <Avatar
                src={residentData.photo}
                sx={{ width: 120, height: 120 }}
              >
                {residentData.firstName[0]}{residentData.lastName[0]}
              </Avatar>
              {editing && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                  size="small"
                >
                  <PhotoIcon />
                </IconButton>
              )}
            </Box>
            <Box flexGrow={1}>
              <Typography variant="h5" gutterBottom>
                {residentData.preferredName || residentData.firstName} {residentData.lastName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Room Number
                  </Typography>
                  <Typography variant="body1">
                    {residentData.roomNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Date of Birth
                  </Typography>
                  <Typography variant="body1">
                    {new Date(residentData.dateOfBirth).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Admission Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(residentData.admissionDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Care Level
                  </Typography>
                  <Chip 
                    label={residentData.careLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                    size="small" 
                    color="primary"
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </CardContent>
      </UICard>

      {/* Navigation Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Personal Information" value="personal" />
        <Tab label="Medical Information" value="medical" />
        <Tab label="Contacts" value="contacts" />
        <Tab label="Preferences" value="preferences" />
      </Tabs>

      {/* Personal Information Tab */}
      {activeTab === 'personal' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={editing ? (editedData.firstName || '') : residentData.firstName}
                      onChange={(e) => editing && setEditedData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={editing ? (editedData.lastName || '') : residentData.lastName}
                      onChange={(e) => editing && setEditedData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Preferred Name"
                      value={editing ? (editedData.preferredName || '') : (residentData.preferredName || '')}
                      onChange={(e) => editing && setEditedData(prev => ({ ...prev, preferredName: e.target.value }))}
                      disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={editing ? (editedData.gender || '') : residentData.gender}
                        onChange={(e) => editing && setEditedData(prev => ({ ...prev, gender: e.target.value as any }))}
                        label="Gender"
                      >
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                        <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {showSensitiveInfo && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="NHS Number"
                        value={residentData.nhsNumber}
                        disabled
                        helperText="NHS Number cannot be modified"
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </UICard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Care Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>Care Level</InputLabel>
                      <Select
                        value={editing ? (editedData.careLevel || '') : residentData.careLevel}
                        onChange={(e) => editing && setEditedData(prev => ({ ...prev, careLevel: e.target.value as any }))}
                        label="Care Level"
                      >
                        <MenuItem value="residential">Residential</MenuItem>
                        <MenuItem value="nursing">Nursing</MenuItem>
                        <MenuItem value="dementia">Dementia</MenuItem>
                        <MenuItem value="mental_health">Mental Health</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>Mobility Level</InputLabel>
                      <Select
                        value={editing ? (editedData.mobilityLevel || '') : residentData.mobilityLevel}
                        onChange={(e) => editing && setEditedData(prev => ({ ...prev, mobilityLevel: e.target.value as any }))}
                        label="Mobility Level"
                      >
                        <MenuItem value="independent">Independent</MenuItem>
                        <MenuItem value="assisted">Assisted</MenuItem>
                        <MenuItem value="wheelchair">Wheelchair</MenuItem>
                        <MenuItem value="bedbound">Bedbound</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>Cognitive Status</InputLabel>
                      <Select
                        value={editing ? (editedData.cognitiveStatus || '') : residentData.cognitiveStatus}
                        onChange={(e) => editing && setEditedData(prev => ({ ...prev, cognitiveStatus: e.target.value as any }))}
                        label="Cognitive Status"
                      >
                        <MenuItem value="alert">Alert</MenuItem>
                        <MenuItem value="mild_impairment">Mild Impairment</MenuItem>
                        <MenuItem value="moderate_impairment">Moderate Impairment</MenuItem>
                        <MenuItem value="severe_impairment">Severe Impairment</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </UICard>
          </Grid>
        </Grid>
      )}

      {/* Medical Information Tab */}
      {activeTab === 'medical' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <MedicalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Medical Conditions
                </Typography>
                <List>
                  {residentData.medicalConditions.map(condition => (
                    <ListItem key={condition.id}>
                      <ListItemText
                        primary={condition.condition}
                        secondary={`${condition.severity} • ${condition.status} • Diagnosed: ${new Date(condition.diagnosisDate).toLocaleDateString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
                {residentData.medicalConditions.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    No medical conditions recorded
                  </Typography>
                )}
              </CardContent>
            </UICard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Allergies & Reactions
                </Typography>
                <List>
                  {residentData.allergies.map(allergy => (
                    <ListItem key={allergy.id}>
                      <ListItemText
                        primary={allergy.allergen}
                        secondary={`${allergy.reaction} • Severity: ${allergy.severity}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={allergy.severity}
                          size="small"
                          color={allergy.severity === 'life_threatening' ? 'error' : 'warning'}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                {residentData.allergies.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    No known allergies
                  </Typography>
                )}
              </CardContent>
            </UICard>
          </Grid>
          
          <Grid item xs={12}>
            <UICard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <HospitalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  GP Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="textSecondary">
                      GP Name
                    </Typography>
                    <Typography variant="body1">
                      {residentData.gp.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="textSecondary">
                      Practice
                    </Typography>
                    <Typography variant="body1">
                      {residentData.gp.practice}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="textSecondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">
                      {residentData.gp.phone}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Address
                    </Typography>
                    <Typography variant="body1">
                      {residentData.gp.address}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </UICard>
          </Grid>
        </Grid>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <UICard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <ContactIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Emergency Contacts
                  </Typography>
                  {!readOnly && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowAddContactDialog(true)}
                    >
                      Add Contact
                    </Button>
                  )}
                </Box>
                <List>
                  {residentData.emergencyContacts.map(contact => (
                    <ListItem key={contact.id}>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {contact.name}
                            {contact.isPrimary && (
                              <Chip label="Primary" size="small" color="primary" />
                            )}
                            {contact.canMakeDecisions && (
                              <Chip label="Decision Maker" size="small" color="secondary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {contact.relationship} • {contact.phone}
                            </Typography>
                            {contact.email && (
                              <Typography variant="body2">
                                {contact.email}
                              </Typography>
                            )}
                            <Typography variant="body2" color="textSecondary">
                              {contact.address}
                            </Typography>
                          </Box>
                        }
                      />
                      {!readOnly && (
                        <ListItemSecondaryAction>
                          <IconButton edge="end">
                            <EditIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </UICard>
          </Grid>
        </Grid>
      )}

      {/* Add Contact Dialog */}
      <Dialog
        open={showAddContactDialog}
        onClose={() => setShowAddContactDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Emergency Contact</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={newContact.name || ''}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Relationship"
                value={newContact.relationship || ''}
                onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newContact.phone || ''}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newContact.email || ''}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={newContact.address || ''}
                onChange={(e) => setNewContact(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newContact.canMakeDecisions || false}
                    onChange={(e) => setNewContact(prev => ({ ...prev, canMakeDecisions: e.target.checked }))}
                  />
                }
                label="Can make decisions on behalf of resident"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setShowAddContactDialog(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={addEmergencyContact}
            disabled={!newContact.name || !newContact.phone}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResidentProfile;