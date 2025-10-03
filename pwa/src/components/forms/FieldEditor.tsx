import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';

import { FormField, FormFieldType, ValidationRule } from '../../../shared/types/forms';

interface FieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  onUpdate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [localField, setLocalField] = useState<FormField>(field);

  useEffect(() => {
    setLocalField(field);
  }, [field]);

  const handleUpdate = (updates: Partial<FormField>) => {
    const updatedField = { ...localField, ...updates };
    setLocalField(updatedField);
    onUpdate(updates);
  };

  const handleSave = () => {
    onUpdate(localField);
    onClose();
  };

  const tabs = [
    { label: 'Basic', icon: <EditIcon /> },
    { label: 'Validation', icon: <SaveIcon /> },
    { label: 'Layout', icon: <EditIcon /> },
    { label: 'Security', icon: <AIIcon /> }
  ];

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Edit Field: {localField.fieldLabel || 'Untitled Field'}
          </Typography>
          <Box>
            <IconButton size="small" onClick={handleSave} color="primary">
              <SaveIcon />
            </IconButton>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} icon={tab.icon} />
          ))}
        </Tabs>

        <Box mt={2}>
          {/* Basic Tab */}
          {activeTab === 0 && (
            <BasicFieldSettings
              field={localField}
              onUpdate={handleUpdate}
            />
          )}

          {/* Validation Tab */}
          {activeTab === 1 && (
            <ValidationSettings
              field={localField}
              onUpdate={handleUpdate}
            />
          )}

          {/* Layout Tab */}
          {activeTab === 2 && (
            <LayoutSettings
              field={localField}
              onUpdate={handleUpdate}
            />
          )}

          {/* Security Tab */}
          {activeTab === 3 && (
            <SecuritySettings
              field={localField}
              onUpdate={handleUpdate}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Basic Field Settings Component
const BasicFieldSettings: React.FC<{
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}> = ({ field, onUpdate }) => (
  <Box>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Field Name"
          value={field.fieldName}
          onChange={(e) => onUpdate({ fieldName: e.target.value })}
          helperText="Internal field name (used in code)"
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Field Label"
          value={field.fieldLabel}
          onChange={(e) => onUpdate({ fieldLabel: e.target.value })}
          helperText="Display label for users"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Description"
          value={field.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          multiline
          rows={2}
          helperText="Help text shown to users"
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Placeholder"
          value={field.placeholder || ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          helperText="Placeholder text"
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Field Type</InputLabel>
          <Select
            value={field.fieldType}
            onChange={(e) => onUpdate({ fieldType: e.target.value as FormFieldType })}
            label="Field Type"
          >
            {Object.values(FormFieldType).map(type => (
              <MenuItem key={type} value={type}>
                {type.replace('_', ' ').toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Default Value"
          value={field.defaultValue || ''}
          onChange={(e) => onUpdate({ defaultValue: e.target.value })}
          helperText="Default value for the field"
        />
      </Grid>
    </Grid>

    {/* Field-specific options */}
    {(field.fieldType === FormFieldType.SELECT || 
      field.fieldType === FormFieldType.MULTISELECT || 
      field.fieldType === FormFieldType.RADIO) && (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Field Options
        </Typography>
        <FieldOptionsEditor
          options={field.options || []}
          onChange={(options) => onUpdate({ options })}
        />
      </Box>
    )}
  </Box>
);

// Validation Settings Component
const ValidationSettings: React.FC<{
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}> = ({ field, onUpdate }) => {
  const addValidationRule = () => {
    const newRule = {
      rule: ValidationRule.REQUIRED,
      value: '',
      message: 'This field is required'
    };
    onUpdate({
      validationRules: [...field.validationRules, newRule]
    });
  };

  const updateValidationRule = (index: number, updates: Partial<any>) => {
    const newRules = [...field.validationRules];
    newRules[index] = { ...newRules[index], ...updates };
    onUpdate({ validationRules: newRules });
  };

  const removeValidationRule = (index: number) => {
    const newRules = field.validationRules.filter((_, i) => i !== index);
    onUpdate({ validationRules: newRules });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Validation Rules</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addValidationRule}
        >
          Add Rule
        </Button>
      </Box>

      {field.validationRules.length === 0 ? (
        <Alert severity="info">
          No validation rules defined. Add rules to ensure data quality.
        </Alert>
      ) : (
        <List>
          {field.validationRules.map((rule, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={rule.rule.replace('_', ' ').toUpperCase()}
                secondary={rule.message}
              />
              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => removeValidationRule(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Quick validation presets */}
      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Quick Presets
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip
            label="Required Field"
            onClick={() => {
              if (!field.validationRules.some(r => r.rule === ValidationRule.REQUIRED)) {
                addValidationRule();
              }
            }}
            color={field.validationRules.some(r => r.rule === ValidationRule.REQUIRED) ? 'primary' : 'default'}
          />
          <Chip
            label="Email Format"
            onClick={() => {
              if (!field.validationRules.some(r => r.rule === ValidationRule.EMAIL_FORMAT)) {
                onUpdate({
                  validationRules: [...field.validationRules, {
                    rule: ValidationRule.EMAIL_FORMAT,
                    message: 'Please enter a valid email address'
                  }]
                });
              }
            }}
            color={field.validationRules.some(r => r.rule === ValidationRule.EMAIL_FORMAT) ? 'primary' : 'default'}
          />
          <Chip
            label="NHS Number"
            onClick={() => {
              if (!field.validationRules.some(r => r.rule === ValidationRule.NHS_NUMBER_FORMAT)) {
                onUpdate({
                  validationRules: [...field.validationRules, {
                    rule: ValidationRule.NHS_NUMBER_FORMAT,
                    message: 'Please enter a valid NHS number'
                  }]
                });
              }
            }}
            color={field.validationRules.some(r => r.rule === ValidationRule.NHS_NUMBER_FORMAT) ? 'primary' : 'default'}
          />
        </Box>
      </Box>
    </Box>
  );
};

// Layout Settings Component
const LayoutSettings: React.FC<{
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}> = ({ field, onUpdate }) => (
  <Box>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Row"
          type="number"
          value={field.layout.row}
          onChange={(e) => onUpdate({
            layout: { ...field.layout, row: parseInt(e.target.value) }
          })}
        />
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          label="Column"
          type="number"
          value={field.layout.column}
          onChange={(e) => onUpdate({
            layout: { ...field.layout, column: parseInt(e.target.value) }
          })}
        />
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth>
          <InputLabel>Width</InputLabel>
          <Select
            value={field.layout.width}
            onChange={(e) => onUpdate({
              layout: { ...field.layout, width: parseInt(e.target.value) }
            })}
            label="Width"
          >
            <MenuItem value={12}>Full Width (12)</MenuItem>
            <MenuItem value={6}>Half Width (6)</MenuItem>
            <MenuItem value={4}>One Third (4)</MenuItem>
            <MenuItem value={3}>One Quarter (3)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>

    <Box mt={3}>
      <Typography variant="subtitle2" gutterBottom>
        CSS Classes
      </Typography>
      <TextField
        fullWidth
        label="Custom CSS Classes"
        value={field.layout.cssClasses?.join(' ') || ''}
        onChange={(e) => onUpdate({
          layout: { ...field.layout, cssClasses: e.target.value.split(' ').filter(c => c.trim()) }
        })}
        helperText="Space-separated CSS class names"
      />
    </Box>
  </Box>
);

// Security Settings Component
const SecuritySettings: React.FC<{
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}> = ({ field, onUpdate }) => (
  <Box>
    <FormControlLabel
      control={
        <Switch
          checked={field.encrypted}
          onChange={(e) => onUpdate({ encrypted: e.target.checked })}
        />
      }
      label="Encrypt this field"
    />
    
    <FormControl fullWidth sx={{ mt: 2 }}>
      <InputLabel>GDPR Category</InputLabel>
      <Select
        value={field.gdprCategory}
        onChange={(e) => onUpdate({ gdprCategory: e.target.value as any })}
        label="GDPR Category"
      >
        <MenuItem value="personal">Personal Data</MenuItem>
        <MenuItem value="sensitive">Sensitive Data</MenuItem>
        <MenuItem value="clinical">Clinical Data</MenuItem>
        <MenuItem value="financial">Financial Data</MenuItem>
      </Select>
    </FormControl>
    
    <TextField
      fullWidth
      label="Data Retention Period (days)"
      type="number"
      value={field.retentionPeriod}
      onChange={(e) => onUpdate({ retentionPeriod: parseInt(e.target.value) })}
      sx={{ mt: 2 }}
      helperText="How long to keep this data (0 = indefinite)"
    />

    <Alert severity="info" sx={{ mt: 2 }}>
      <Typography variant="body2">
        <strong>Encryption:</strong> Encrypted fields are stored securely and require decryption to read.
        <br />
        <strong>GDPR Category:</strong> Determines data handling requirements and access controls.
        <br />
        <strong>Retention:</strong> Data will be automatically deleted after this period.
      </Typography>
    </Alert>
  </Box>
);

// Field Options Editor Component
const FieldOptionsEditor: React.FC<{
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onChange: (options: Array<{ value: string; label: string; disabled?: boolean }>) => void;
}> = ({ options, onChange }) => {
  const addOption = () => {
    const newOption = {
      value: `option_${Date.now()}`,
      label: 'New Option',
      disabled: false
    };
    onChange([...options, newOption]);
  };

  const updateOption = (index: number, updates: Partial<{ value: string; label: string; disabled?: boolean }>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2">Options</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addOption}>
          Add Option
        </Button>
      </Box>

      {options.map((option, index) => (
        <Box key={index} display="flex" gap={1} mb={1} alignItems="center">
          <TextField
            size="small"
            label="Value"
            value={option.value}
            onChange={(e) => updateOption(index, { value: e.target.value })}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Label"
            value={option.label}
            onChange={(e) => updateOption(index, { label: e.target.value })}
            sx={{ flex: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={option.disabled || false}
                onChange={(e) => updateOption(index, { disabled: e.target.checked })}
                size="small"
              />
            }
            label="Disabled"
          />
          <IconButton
            size="small"
            onClick={() => removeOption(index)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      {options.length === 0 && (
        <Alert severity="info">
          No options defined. Add options for select, radio, or checkbox fields.
        </Alert>
      )}
    </Box>
  );
};