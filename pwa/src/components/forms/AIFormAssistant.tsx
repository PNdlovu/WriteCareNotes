import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  AutoFixHigh as AutoFixIcon,
  Psychology as PsychologyIcon,
  Code as CodeIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';

interface AIFormAssistantProps {
  open: boolean;
  onClose: () => void;
  onApplySuggestion: (suggestion: any) => void;
  suggestions: any[];
  context: any;
}

export const AIFormAssistant: React.FC<AIFormAssistantProps> = ({
  open,
  onClose,
  onApplySuggestion,
  suggestions,
  context
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);

  const tabs = [
    { label: 'Field Suggestions', icon: <AddIcon /> },
    { label: 'Validation Rules', icon: <CheckIcon /> },
    { label: 'Form Optimization', icon: <AutoFixIcon /> },
    { label: 'Code Generation', icon: <CodeIcon /> }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI response based on prompt
      const response = generateMockAIResponse(prompt, context);
      setAiResponse(response);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    onApplySuggestion(suggestion);
    setSelectedSuggestion(suggestion);
  };

  const handleClose = () => {
    setPrompt('');
    setAiResponse(null);
    setSelectedSuggestion(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AIIcon color="primary" />
          <Typography variant="h6">AI Form Assistant</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} icon={tab.icon} />
          ))}
        </Tabs>

        <Box mt={2}>
          {/* Prompt Input */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Describe what you need help with..."
            placeholder="e.g., 'Add fields for medication administration form' or 'Create validation rules for NHS numbers'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />

          <Box mt={2} display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <AIIcon />}
            >
              {isGenerating ? 'Generating...' : 'Generate Suggestions'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setPrompt('')}
              disabled={isGenerating}
            >
              Clear
            </Button>
          </Box>

          {/* AI Response */}
          {aiResponse && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                AI Suggestions
              </Typography>
              
              {aiResponse.type === 'field_suggestions' && (
                <FieldSuggestions
                  suggestions={aiResponse.suggestions}
                  onApply={handleApplySuggestion}
                />
              )}
              
              {aiResponse.type === 'validation_suggestions' && (
                <ValidationSuggestions
                  suggestions={aiResponse.suggestions}
                  onApply={handleApplySuggestion}
                />
              )}
              
              {aiResponse.type === 'optimization_suggestions' && (
                <OptimizationSuggestions
                  suggestions={aiResponse.suggestions}
                  onApply={handleApplySuggestion}
                />
              )}
            </Box>
          )}

          {/* Pre-built Suggestions */}
          {suggestions.length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Pre-built Suggestions
              </Typography>
              
              {suggestions.map((suggestion, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{suggestion.title}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {suggestion.description}
                    </Typography>
                    
                    {suggestion.fields && (
                      <Box mt={2}>
                        <Typography variant="subtitle2">Suggested Fields:</Typography>
                        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                          {suggestion.fields.map((field: any, fieldIndex: number) => (
                            <Chip
                              key={fieldIndex}
                              label={`${field.fieldLabel} (${field.fieldType})`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleApplySuggestion(suggestion)}
                    >
                      Apply Suggestion
                    </Button>
                    <Button
                      size="small"
                      startIcon={<PreviewIcon />}
                      onClick={() => setSelectedSuggestion(suggestion)}
                    >
                      Preview
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}

          {/* Selected Suggestion Preview */}
          {selectedSuggestion && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Preview: {selectedSuggestion.title}
              </Typography>
              
              <Card>
                <CardContent>
                  <Typography variant="body2">
                    {selectedSuggestion.description}
                  </Typography>
                  
                  {selectedSuggestion.fields && (
                    <Box mt={2}>
                      <Typography variant="subtitle2">Fields to be added:</Typography>
                      <List dense>
                        {selectedSuggestion.fields.map((field: any, index: number) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={field.fieldLabel}
                              secondary={`Type: ${field.fieldType} | Validation: ${field.validation?.join(', ') || 'None'}`}
                            />
                            <ListItemSecondaryAction>
                              <Chip
                                label={field.gdprCategory || 'personal'}
                                size="small"
                                color="secondary"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
        {selectedSuggestion && (
          <Button
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={() => {
              handleApplySuggestion(selectedSuggestion);
              handleClose();
            }}
          >
            Apply & Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Helper Components
const FieldSuggestions: React.FC<{
  suggestions: any[];
  onApply: (suggestion: any) => void;
}> = ({ suggestions, onApply }) => (
  <Box>
    {suggestions.map((suggestion, index) => (
      <Card key={index} sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">{suggestion.title}</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {suggestion.description}
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={1}>
            {suggestion.fields.map((field: any, fieldIndex: number) => (
              <Chip
                key={fieldIndex}
                label={`${field.fieldLabel} (${field.fieldType})`}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </CardContent>
        
        <CardActions>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => onApply(suggestion)}
          >
            Add Fields
          </Button>
        </CardActions>
      </Card>
    ))}
  </Box>
);

const ValidationSuggestions: React.FC<{
  suggestions: any[];
  onApply: (suggestion: any) => void;
}> = ({ suggestions, onApply }) => (
  <Box>
    {suggestions.map((suggestion, index) => (
      <Accordion key={index}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">{suggestion.fieldType} Validation</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {suggestion.description}
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={1}>
            {suggestion.rules.map((rule: any, ruleIndex: number) => (
              <Chip
                key={ruleIndex}
                label={rule.name}
                size="small"
                color="secondary"
                variant="outlined"
              />
            ))}
          </Box>
          
          <Box mt={2}>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onApply(suggestion)}
            >
              Apply Validation Rules
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    ))}
  </Box>
);

const OptimizationSuggestions: React.FC<{
  suggestions: any[];
  onApply: (suggestion: any) => void;
}> = ({ suggestions, onApply }) => (
  <Box>
    {suggestions.map((suggestion, index) => (
      <Alert key={index} severity={suggestion.severity} sx={{ mb: 2 }}>
        <Typography variant="h6">{suggestion.title}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {suggestion.description}
        </Typography>
        
        <Box display="flex" gap={1}>
          <Button
            size="small"
            startIcon={<AutoFixIcon />}
            onClick={() => onApply(suggestion)}
          >
            Apply Fix
          </Button>
        </Box>
      </Alert>
    ))}
  </Box>
);

// Mock AI response generator
function generateMockAIResponse(prompt: string, context: any): any {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('field') || lowerPrompt.includes('add')) {
    return {
      type: 'field_suggestions',
      suggestions: [
        {
          title: 'Resident Information Fields',
          description: 'Essential fields for collecting resident data',
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
            },
            {
              fieldType: 'select',
              fieldLabel: 'Care Level',
              fieldName: 'care_level',
              options: ['Low', 'Medium', 'High', 'Critical'],
              validation: ['required'],
              gdprCategory: 'clinical'
            }
          ]
        }
      ]
    };
  }
  
  if (lowerPrompt.includes('validation') || lowerPrompt.includes('rule')) {
    return {
      type: 'validation_suggestions',
      suggestions: [
        {
          fieldType: 'NHS Number',
          description: 'Validation rules for NHS numbers',
          rules: [
            { name: 'Required', description: 'Field is mandatory' },
            { name: 'NHS Format', description: 'Must match NHS number format' },
            { name: 'Unique', description: 'Must be unique across residents' }
          ]
        }
      ]
    };
  }
  
  if (lowerPrompt.includes('optimize') || lowerPrompt.includes('improve')) {
    return {
      type: 'optimization_suggestions',
      suggestions: [
        {
          title: 'Form Performance',
          description: 'Consider grouping related fields together to improve user experience',
          severity: 'info'
        },
        {
          title: 'Accessibility',
          description: 'Add ARIA labels to improve screen reader compatibility',
          severity: 'warning'
        }
      ]
    };
  }
  
  return {
    type: 'general',
    message: 'I can help you with field suggestions, validation rules, form optimization, and code generation. Please be more specific about what you need.'
  };
}