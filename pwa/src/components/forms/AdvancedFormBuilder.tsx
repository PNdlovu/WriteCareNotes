import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  SmartToy as AIIcon,
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Code as CodeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import { FormDefinition, FormField, FormFieldType, ValidationRule } from '../../../shared/types/forms';
import { AIFormAssistant } from './AIFormAssistant';
import { FormPreview } from './FormPreview';
import { FieldEditor } from './FieldEditor';
import { ValidationEditor } from './ValidationEditor';
import { ConditionalLogicEditor } from './ConditionalLogicEditor';

interface AdvancedFormBuilderProps {
  initialForm?: FormDefinition;
  onSave: (form: FormDefinition) => Promise<void>;
  onPreview: (form: FormDefinition) => void;
  templates?: FormDefinition[];
  aiEnabled?: boolean;
}

export const AdvancedFormBuilder: React.FC<AdvancedFormBuilderProps> = ({
  initialForm,
  onSave,
  onPreview,
  templates = [],
  aiEnabled = true
}) => {
  const [form, setForm] = useState<FormDefinition>(initialForm || createEmptyForm());
  const [activeStep, setActiveStep] = useState(0);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    'Basic Information',
    'Form Structure',
    'Field Configuration',
    'Validation Rules',
    'Conditional Logic',
    'Compliance Settings',
    'Review & Publish'
  ];

  // AI Assistant Integration
  const handleAIAssistance = useCallback(async (request: string) => {
    if (!aiEnabled) return;

    setIsGenerating(true);
    try {
      // Simulate AI assistance - in real implementation, this would call the AI service
      const suggestions = await generateAISuggestions(request, form);
      setAISuggestions(suggestions);
      setShowAIAssistant(true);
    } catch (error) {
      console.error('AI assistance failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [form, aiEnabled]);

  // Form Management
  const updateForm = useCallback((updates: Partial<FormDefinition>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const addField = useCallback((field: FormField) => {
    const newField = {
      ...field,
      fieldId: `field-${Date.now()}`,
      layout: {
        row: 1,
        column: 1,
        width: 12,
        cssClasses: []
      }
    };

    setForm(prev => ({
      ...prev,
      pages: prev.pages.map((page, index) => 
        index === activeStep - 1 ? { ...page, fields: [...page.fields, newField] } : page
      )
    }));
  }, [activeStep]);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setForm(prev => ({
      ...prev,
      pages: prev.pages.map(page => ({
        ...page,
        fields: page.fields.map(field => 
          field.fieldId === fieldId ? { ...field, ...updates } : field
        )
      }))
    }));
  }, []);

  const deleteField = useCallback((fieldId: string) => {
    setForm(prev => ({
      ...prev,
      pages: prev.pages.map(page => ({
        ...page,
        fields: page.fields.filter(field => field.fieldId !== fieldId)
      }))
    }));
  }, []);

  const addPage = useCallback(() => {
    const newPage = {
      pageId: `page-${Date.now()}`,
      pageTitle: `Page ${form.pages.length + 1}`,
      pageDescription: '',
      fields: []
    };

    setForm(prev => ({
      ...prev,
      pages: [...prev.pages, newPage],
      multiPage: true
    }));
  }, [form.pages.length]);

  const removePage = useCallback((pageIndex: number) => {
    if (form.pages.length <= 1) return;

    setForm(prev => ({
      ...prev,
      pages: prev.pages.filter((_, index) => index !== pageIndex),
      multiPage: prev.pages.length > 2
    }));
  }, [form.pages.length]);

  // AI-powered field suggestions
  const generateFieldSuggestions = useCallback(async (context: string) => {
    if (!aiEnabled) return [];

    // Simulate AI field suggestions based on context
    const suggestions = [
      {
        type: 'text',
        label: 'Resident Name',
        description: 'Full name of the resident',
        validation: ['required'],
        gdprCategory: 'personal'
      },
      {
        type: 'date',
        label: 'Date of Birth',
        description: 'Resident\'s date of birth',
        validation: ['required'],
        gdprCategory: 'personal'
      },
      {
        type: 'select',
        label: 'Care Level',
        description: 'Level of care required',
        options: ['Low', 'Medium', 'High', 'Critical'],
        validation: ['required'],
        gdprCategory: 'clinical'
      }
    ];

    return suggestions.filter(s => 
      s.label.toLowerCase().includes(context.toLowerCase()) ||
      s.description.toLowerCase().includes(context.toLowerCase())
    );
  }, [aiEnabled]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors: string[] = [];

    if (!form.formName || form.formName.length < 3) {
      errors.push('Form name must be at least 3 characters');
    }

    if (form.pages.length === 0) {
      errors.push('Form must have at least one page');
    }

    form.pages.forEach((page, pageIndex) => {
      if (!page.pageTitle) {
        errors.push(`Page ${pageIndex + 1} must have a title`);
      }

      if (page.fields.length === 0) {
        errors.push(`Page ${pageIndex + 1} must have at least one field`);
      }

      page.fields.forEach((field, fieldIndex) => {
        if (!field.fieldName || !field.fieldLabel) {
          errors.push(`Field ${fieldIndex + 1} in page ${pageIndex + 1} must have name and label`);
        }

        if (field.fieldType === FormFieldType.SELECT && (!field.options || field.options.length === 0)) {
          errors.push(`Select field ${fieldIndex + 1} in page ${pageIndex + 1} must have options`);
        }
      });
    });

    return errors;
  }, [form]);

  const handleSave = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    try {
      await onSave(form);
    } catch (error) {
      console.error('Failed to save form:', error);
      alert('Failed to save form. Please try again.');
    }
  }, [form, onSave, validateForm]);

  const handlePreview = useCallback(() => {
    onPreview(form);
    setShowPreview(true);
  }, [form, onPreview]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            Advanced Form Builder
            {aiEnabled && (
              <Chip 
                icon={<AIIcon />} 
                label="AI-Powered" 
                color="primary" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
          
          <Box display="flex" gap={1}>
            {aiEnabled && (
              <Button
                variant="outlined"
                startIcon={<AIIcon />}
                onClick={() => setShowAIAssistant(true)}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'AI Assistant'}
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
            >
              Preview
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={() => setShowCodeView(!showCodeView)}
            >
              {showCodeView ? 'Hide Code' : 'Show Code'}
            </Button>
            
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Form
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ flex: 1 }}>
        {/* Left Panel - Form Structure */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Form Structure
              </Typography>
              
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                    <StepContent>
                      {index === 0 && (
                        <BasicInfoEditor
                          form={form}
                          onUpdate={updateForm}
                        />
                      )}
                      {index === 1 && (
                        <FormStructureEditor
                          form={form}
                          onUpdate={updateForm}
                          onAddPage={addPage}
                          onRemovePage={removePage}
                        />
                      )}
                      {index === 2 && (
                        <FieldConfigurationEditor
                          form={form}
                          onAddField={addField}
                          onUpdateField={updateField}
                          onDeleteField={deleteField}
                          onAIAssistance={handleAIAssistance}
                          aiEnabled={aiEnabled}
                        />
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Center Panel - Field Editor */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Field Editor
              </Typography>
              
              {selectedField ? (
                <FieldEditor
                  field={selectedField}
                  onUpdate={(updates) => updateField(selectedField.fieldId, updates)}
                  onClose={() => setSelectedField(null)}
                />
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">
                    Select a field to edit its properties
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Live Preview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Preview
              </Typography>
              
              <FormPreview
                form={form}
                onFieldSelect={setSelectedField}
                selectedFieldId={selectedField?.fieldId}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Assistant Dialog */}
      {showAIAssistant && (
        <AIFormAssistant
          open={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          onApplySuggestion={(suggestion) => {
            // Apply AI suggestion to form
            console.log('Applying suggestion:', suggestion);
            setShowAIAssistant(false);
          }}
          suggestions={aiSuggestions}
          context={form}
        />
      )}

      {/* Code View Dialog */}
      {showCodeView && (
        <Dialog open={showCodeView} onClose={() => setShowCodeView(false)} maxWidth="md" fullWidth>
          <DialogTitle>Form JSON Schema</DialogTitle>
          <DialogContent>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(form, null, 2)}
            </pre>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCodeView(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// Helper Components
const BasicInfoEditor: React.FC<{
  form: FormDefinition;
  onUpdate: (updates: Partial<FormDefinition>) => void;
}> = ({ form, onUpdate }) => (
  <Box>
    <TextField
      fullWidth
      label="Form Name"
      value={form.formName}
      onChange={(e) => onUpdate({ formName: e.target.value })}
      margin="normal"
    />
    <TextField
      fullWidth
      label="Form Title"
      value={form.formTitle}
      onChange={(e) => onUpdate({ formTitle: e.target.value })}
      margin="normal"
    />
    <TextField
      fullWidth
      label="Description"
      value={form.description}
      onChange={(e) => onUpdate({ description: e.target.value })}
      margin="normal"
      multiline
      rows={3}
    />
    <FormControlLabel
      control={
        <Switch
          checked={form.multiPage}
          onChange={(e) => onUpdate({ multiPage: e.target.checked })}
        />
      }
      label="Multi-page Form"
    />
  </Box>
);

const FormStructureEditor: React.FC<{
  form: FormDefinition;
  onUpdate: (updates: Partial<FormDefinition>) => void;
  onAddPage: () => void;
  onRemovePage: (index: number) => void;
}> = ({ form, onUpdate, onAddPage, onRemovePage }) => (
  <Box>
    {form.pages.map((page, index) => (
      <Accordion key={page.pageId}>
        <AccordionSummary>
          <Typography>{page.pageTitle || `Page ${index + 1}`}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            label="Page Title"
            value={page.pageTitle}
            onChange={(e) => {
              const newPages = [...form.pages];
              newPages[index].pageTitle = e.target.value;
              onUpdate({ pages: newPages });
            }}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Page Description"
            value={page.pageDescription || ''}
            onChange={(e) => {
              const newPages = [...form.pages];
              newPages[index].pageDescription = e.target.value;
              onUpdate({ pages: newPages });
            }}
            margin="normal"
            multiline
            rows={2}
          />
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <IconButton
              color="error"
              onClick={() => onRemovePage(index)}
              disabled={form.pages.length <= 1}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </AccordionDetails>
      </Accordion>
    ))}
    
    <Button
      fullWidth
      startIcon={<AddIcon />}
      onClick={onAddPage}
      sx={{ mt: 2 }}
    >
      Add Page
    </Button>
  </Box>
);

const FieldConfigurationEditor: React.FC<{
  form: FormDefinition;
  onAddField: (field: FormField) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
  onAIAssistance: (request: string) => void;
  aiEnabled: boolean;
}> = ({ form, onAddField, onUpdateField, onDeleteField, onAIAssistance, aiEnabled }) => {
  const [newFieldType, setNewFieldType] = useState<FormFieldType>(FormFieldType.TEXT);

  const handleAddField = () => {
    const field: FormField = {
      fieldId: `field-${Date.now()}`,
      fieldName: `field_${Date.now()}`,
      fieldLabel: 'New Field',
      fieldType: newFieldType,
      validationRules: [],
      layout: { row: 1, column: 1, width: 12, cssClasses: [] },
      encrypted: false,
      gdprCategory: 'personal',
      retentionPeriod: 2555
    };
    onAddField(field);
  };

  return (
    <Box>
      <Box display="flex" gap={1} mb={2}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Field Type</InputLabel>
          <Select
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value as FormFieldType)}
          >
            {Object.values(FormFieldType).map(type => (
              <MenuItem key={type} value={type}>
                {type.replace('_', ' ').toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleAddField} startIcon={<AddIcon />}>
          Add Field
        </Button>
      </Box>

      {aiEnabled && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AIIcon />}
          onClick={() => onAIAssistance('suggest fields for care home form')}
          sx={{ mb: 2 }}
        >
          AI Field Suggestions
        </Button>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Form Fields
      </Typography>
      
      {form.pages.map((page, pageIndex) => (
        <Box key={page.pageId} mb={2}>
          <Typography variant="caption" color="textSecondary">
            {page.pageTitle} ({page.fields.length} fields)
          </Typography>
          {page.fields.map((field) => (
            <Box
              key={field.fieldId}
              display="flex"
              alignItems="center"
              p={1}
              border={1}
              borderColor="divider"
              borderRadius={1}
              mb={1}
            >
              <DragIcon sx={{ mr: 1, cursor: 'move' }} />
              <Box flex={1}>
                <Typography variant="body2">{field.fieldLabel}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {field.fieldType}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => onUpdateField(field.fieldId, {})}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={() => onDeleteField(field.fieldId)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Helper function to create empty form
function createEmptyForm(): FormDefinition {
  return {
    formId: '',
    formName: '',
    formTitle: '',
    description: '',
    version: '1.0.0',
    isActive: true,
    isPublished: false,
    multiPage: false,
    allowSaveDraft: true,
    requiresAuthentication: true,
    pages: [{
      pageId: 'page-1',
      pageTitle: 'Page 1',
      pageDescription: '',
      fields: []
    }],
    submissionSettings: {
      allowMultipleSubmissions: false,
      confirmationMessage: 'Form submitted successfully',
      emailConfirmation: true,
      autoSave: true,
      autoSaveInterval: 30
    },
    complianceSettings: {
      gdprCompliant: true,
      dataRetentionDays: 2555,
      consentRequired: true,
      auditTrail: true,
      digitalSignatureRequired: false
    },
    analyticsEnabled: true,
    trackingEvents: ['form_started', 'form_submitted']
  };
}

// Mock AI suggestions function
async function generateAISuggestions(request: string, form: FormDefinition): Promise<any[]> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    {
      type: 'field_suggestion',
      title: 'Resident Information Fields',
      description: 'Essential fields for resident data collection',
      fields: [
        {
          fieldType: 'text',
          fieldLabel: 'Resident Name',
          fieldName: 'resident_name',
          validation: ['required'],
          gdprCategory: 'personal'
        },
        {
          fieldType: 'date',
          fieldLabel: 'Date of Birth',
          fieldName: 'date_of_birth',
          validation: ['required'],
          gdprCategory: 'personal'
        }
      ]
    }
  ];
}