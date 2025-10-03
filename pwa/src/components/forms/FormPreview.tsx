import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Slider,
  Rating,
  Switch,
  Chip,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

import { FormDefinition, FormField, FormFieldType } from '../../../shared/types/forms';

interface FormPreviewProps {
  form: FormDefinition;
  onFieldSelect: (field: FormField) => void;
  selectedFieldId?: string;
  mode?: 'preview' | 'edit';
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  form,
  onFieldSelect,
  selectedFieldId,
  mode = 'preview'
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showFieldIds, setShowFieldIds] = useState(false);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderField = (field: FormField, pageIndex: number) => {
    const isSelected = selectedFieldId === field.fieldId;
    const fieldValue = formData[field.fieldId] || field.defaultValue || '';

    const fieldProps = {
      fullWidth: true,
      value: fieldValue,
      onChange: (e: any) => handleFieldChange(field.fieldId, e.target.value),
      label: field.fieldLabel,
      placeholder: field.placeholder,
      disabled: mode === 'preview',
      error: false, // Would be calculated based on validation
      helperText: field.description,
      sx: {
        border: isSelected ? '2px solid #1976d2' : '1px solid transparent',
        borderRadius: isSelected ? '4px' : '4px',
        '&:hover': mode === 'edit' ? { border: '1px solid #1976d2' } : {}
      }
    };

    const fieldContainer = (
      <Box
        key={field.fieldId}
        sx={{
          mb: 2,
          position: 'relative',
          cursor: mode === 'edit' ? 'pointer' : 'default'
        }}
        onClick={() => mode === 'edit' && onFieldSelect(field)}
      >
        {/* Field ID Overlay */}
        {showFieldIds && (
          <Chip
            label={field.fieldId}
            size="small"
            color="primary"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              zIndex: 1,
              fontSize: '0.7rem'
          }}
          />
        )}

        {/* Field Actions */}
        {mode === 'edit' && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              zIndex: 1,
              display: 'flex',
              gap: 0.5,
              opacity: isSelected ? 1 : 0,
              transition: 'opacity 0.2s'
            }}
          >
            <Tooltip title="Edit Field">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onFieldSelect(field);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Drag to Reorder">
              <IconButton size="small" color="default">
                <DragIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Field Rendering */}
        {renderFieldByType(field, fieldProps)}

        {/* Field Info */}
        {mode === 'edit' && (
          <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="textSecondary">
              {field.fieldType} • {field.gdprCategory} • {field.encrypted ? 'Encrypted' : 'Plain'}
            </Typography>
            
            {field.validationRules.length > 0 && (
              <Chip
                label={`${field.validationRules.length} rules`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Box>
    );

    return fieldContainer;
  };

  const renderFieldByType = (field: FormField, props: any) => {
    switch (field.fieldType) {
      case FormFieldType.TEXT:
        return <TextField {...props} />;

      case FormFieldType.EMAIL:
        return <TextField {...props} type="email" />;

      case FormFieldType.NUMBER:
        return <TextField {...props} type="number" />;

      case FormFieldType.DATE:
        return <TextField {...props} type="date" InputLabelProps={{ shrink: true }} />;

      case FormFieldType.DATETIME:
        return <TextField {...props} type="datetime-local" InputLabelProps={{ shrink: true }} />;

      case FormFieldType.TEXTAREA:
        return <TextField {...props} multiline rows={4} />;

      case FormFieldType.SELECT:
        return (
          <FormControl fullWidth>
            <InputLabel>{field.fieldLabel}</InputLabel>
            <Select {...props} label={field.fieldLabel}>
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case FormFieldType.MULTISELECT:
        return (
          <FormControl fullWidth>
            <InputLabel>{field.fieldLabel}</InputLabel>
            <Select
              {...props}
              multiple
              label={field.fieldLabel}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case FormFieldType.RADIO:
        return (
          <FormControl component="fieldset">
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.fieldLabel}
            </Typography>
            <RadioGroup {...props}>
              {field.options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case FormFieldType.CHECKBOX:
        return (
          <FormControl component="fieldset">
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.fieldLabel}
            </Typography>
            <Box>
              {field.options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      checked={Array.isArray(props.value) ? props.value.includes(option.value) : false}
                      onChange={(e) => {
                        const currentValue = Array.isArray(props.value) ? props.value : [];
                        const newValue = e.target.checked
                          ? [...currentValue, option.value]
                          : currentValue.filter((v: string) => v !== option.value);
                        props.onChange({ target: { value: newValue } });
                      }}
                    />
                  }
                  label={option.label}
                />
              ))}
            </Box>
          </FormControl>
        );

      case FormFieldType.RATING:
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.fieldLabel}
            </Typography>
            <Rating
              value={props.value || 0}
              onChange={(_, value) => props.onChange({ target: { value } })}
            />
          </Box>
        );

      case FormFieldType.SLIDER:
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.fieldLabel}
            </Typography>
            <Slider
              value={props.value || 0}
              onChange={(_, value) => props.onChange({ target: { value } })}
              valueLabelDisplay="auto"
              min={0}
              max={100}
            />
          </Box>
        );

      case FormFieldType.SWITCH:
        return (
          <FormControlLabel
            control={
              <Switch
                checked={props.value || false}
                onChange={(e) => props.onChange({ target: { value: e.target.checked } })}
              />
            }
            label={field.fieldLabel}
          />
        );

      case FormFieldType.FILE_UPLOAD:
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.fieldLabel}
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ py: 2 }}
            >
              Choose File
              <input
                type="file"
                hidden
                onChange={(e) => props.onChange({ target: { value: e.target.files?.[0] } })}
              />
            </Button>
          </Box>
        );

      case FormFieldType.SIGNATURE:
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.fieldLabel}
            </Typography>
            <Paper
              sx={{
                height: 100,
                border: '2px dashed #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Typography variant="body2" color="textSecondary">
                Click to sign
              </Typography>
            </Paper>
          </Box>
        );

      default:
        return (
          <Alert severity="warning">
            Unknown field type: {field.fieldType}
          </Alert>
        );
    }
  };

  if (!form || form.pages.length === 0) {
    return (
      <Box
        sx={{
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #ccc',
          borderRadius: 1
        }}
      >
        <Typography color="textSecondary">
          No form structure defined. Add some fields to see the preview.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Form Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{form.formTitle || 'Untitled Form'}</Typography>
          
          {mode === 'edit' && (
            <IconButton
              size="small"
              onClick={() => setShowFieldIds(!showFieldIds)}
              color={showFieldIds ? 'primary' : 'default'}
            >
              {showFieldIds ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          )}
        </Box>
        
        {form.description && (
          <Typography variant="body2" color="textSecondary">
            {form.description}
          </Typography>
        )}
        
        <Box display="flex" gap={1} mt={1}>
          <Chip
            label={form.multiPage ? 'Multi-page' : 'Single page'}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={form.requiresAuthentication ? 'Auth Required' : 'Public'}
            size="small"
            color="secondary"
            variant="outlined"
          />
          {form.complianceSettings.gdprCompliant && (
            <Chip
              label="GDPR Compliant"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
      </Paper>

      {/* Form Pages */}
      {form.pages.map((page, pageIndex) => (
        <Card key={page.pageId} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {page.pageTitle}
            </Typography>
            
            {page.pageDescription && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {page.pageDescription}
              </Typography>
            )}

            <Grid container spacing={2}>
              {page.fields.map((field) => (
                <Grid
                  key={field.fieldId}
                  item
                  xs={12}
                  sm={field.layout.width === 12 ? 12 : 6}
                  md={field.layout.width === 12 ? 12 : field.layout.width === 6 ? 6 : 4}
                >
                  {renderField(field, pageIndex)}
                </Grid>
              ))}
            </Grid>

            {page.fields.length === 0 && (
              <Box
                sx={{
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #ccc',
                  borderRadius: 1
                }}
              >
                <Typography color="textSecondary">
                  No fields in this page
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Form Actions */}
      {mode === 'preview' && (
        <Box mt={3} display="flex" gap={2} justifyContent="flex-end">
          <Button variant="outlined">
            Save Draft
          </Button>
          <Button variant="contained">
            Submit Form
          </Button>
        </Box>
      )}

      {/* Form Stats */}
      {mode === 'edit' && (
        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Form Statistics
          </Typography>
          
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              label={`${form.pages.length} page${form.pages.length !== 1 ? 's' : ''}`}
              size="small"
            />
            <Chip
              label={`${form.pages.reduce((total, page) => total + page.fields.length, 0)} field${form.pages.reduce((total, page) => total + page.fields.length, 0) !== 1 ? 's' : ''}`}
              size="small"
            />
            <Chip
              label={`${form.pages.reduce((total, page) => total + page.fields.filter(f => f.encrypted).length, 0)} encrypted`}
              size="small"
              color="warning"
            />
            <Chip
              label={`${form.pages.reduce((total, page) => total + page.fields.filter(f => f.validationRules.length > 0).length, 0)} validated`}
              size="small"
              color="success"
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};