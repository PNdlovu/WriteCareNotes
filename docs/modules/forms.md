# Forms Module Documentation

## Overview

The Forms module provides a comprehensive, AI-powered form building and management system for WriteCareNotes. It enables administrators and users to create compliant, accessible forms across mobile interfaces with advanced features including dynamic field rendering, conditional logic, validation schemas, and AI-assisted form generation.

## Features

### Core Form Builder
- **Config-driven Form Builder**: JSON schema-based form generation
- **Drag-and-drop Interface**: Intuitive form building experience
- **Multi-page Forms**: Support for complex, multi-step forms
- **Real-time Preview**: Live form preview with instant updates
- **Template System**: Pre-built form templates for common use cases

### Field Types
- **Text Fields**: Single-line text input
- **Email Fields**: Email validation and formatting
- **Number Fields**: Numeric input with range validation
- **Date/DateTime Fields**: Date and time pickers
- **Textarea**: Multi-line text input
- **Select/Multi-select**: Dropdown and multi-selection fields
- **Radio/Checkbox**: Single and multiple choice options
- **File Upload**: Document and image upload
- **Digital Signature**: Electronic signature capture
- **Rating/Slider**: Interactive rating and range inputs
- **Address Fields**: Structured address input
- **Phone Fields**: Phone number validation
- **NHS Number**: NHS number format validation
- **Medical Condition**: Medical terminology support

### Validation System
- **Built-in Validators**: Email, phone, NHS number, UK postcode
- **Custom Validation**: User-defined validation rules
- **Real-time Validation**: Instant feedback during form completion
- **Conditional Validation**: Context-dependent validation rules
- **Error Handling**: Comprehensive error messaging and recovery

### Conditional Logic
- **Show/Hide Fields**: Dynamic field visibility based on user input
- **Required Fields**: Conditional requirement based on other fields
- **Field Dependencies**: Complex field relationships and dependencies
- **Page Navigation**: Dynamic page flow based on user responses

### AI-Powered Features
- **Field Suggestions**: AI-generated field recommendations based on form purpose
- **Validation Rules**: Intelligent validation rule suggestions
- **Form Optimization**: AI-driven form performance and usability improvements
- **Code Generation**: Automated form code generation
- **Template Recommendations**: Smart template suggestions based on context

### Accessibility
- **ARIA Support**: Full ARIA label and description support
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader**: Optimized for screen reader compatibility
- **High Contrast**: High contrast mode support
- **Large Text**: Scalable text and interface elements

### Multi-language Support
- **Internationalization**: Full i18n support for multiple languages
- **Localization**: Region-specific formatting and validation
- **Translation Management**: Easy translation updates and management
- **Cultural Adaptation**: Region-specific form behavior

### Compliance & Security
- **GDPR Compliance**: Full GDPR compliance with data protection
- **Data Encryption**: Field-level encryption for sensitive data
- **Audit Logging**: Comprehensive audit trail for all form activities
- **Access Control**: Role-based access to forms and data
- **Data Retention**: Configurable data retention policies

## Architecture

### Components

#### AdvancedFormBuilder
Main form builder component with drag-and-drop interface.

```typescript
interface AdvancedFormBuilderProps {
  initialForm?: FormDefinition;
  onSave: (form: FormDefinition) => Promise<void>;
  onPreview: (form: FormDefinition) => void;
  templates?: FormDefinition[];
  aiEnabled?: boolean;
}
```

#### AIFormAssistant
AI-powered assistant for form building and optimization.

```typescript
interface AIFormAssistantProps {
  open: boolean;
  onClose: () => void;
  onApplySuggestion: (suggestion: any) => void;
  suggestions: any[];
  context: any;
}
```

#### FormPreview
Real-time form preview with interactive editing.

```typescript
interface FormPreviewProps {
  form: FormDefinition;
  onFieldSelect: (field: FormField) => void;
  selectedFieldId?: string;
  mode?: 'preview' | 'edit';
}
```

#### FieldEditor
Comprehensive field editing interface.

```typescript
interface FieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}
```

### Services

#### AdvancedFormsService
Core form management service with CRUD operations.

```typescript
class AdvancedFormsService {
  async createForm(formData: Partial<FormDefinition>): Promise<FormDefinition>;
  async submitForm(formId: string, submissionData: any, submittedBy: string): Promise<FormSubmission>;
  async generateFormAnalytics(formId: string): Promise<FormAnalytics>;
  async createCareHomeFormTemplates(): Promise<FormDefinition[]>;
  async processDigitalSignature(submissionId: string, signatureData: any): Promise<void>;
}
```

### Data Models

#### FormDefinition
Complete form structure definition.

```typescript
interface FormDefinition {
  formId: string;
  formName: string;
  formTitle: string;
  description: string;
  version: string;
  isActive: boolean;
  isPublished: boolean;
  multiPage: boolean;
  allowSaveDraft: boolean;
  requiresAuthentication: boolean;
  pages: FormPage[];
  submissionSettings: SubmissionSettings;
  workflowIntegration?: WorkflowIntegration;
  complianceSettings: ComplianceSettings;
  analyticsEnabled: boolean;
  trackingEvents: string[];
}
```

#### FormField
Individual field definition with validation and styling.

```typescript
interface FormField {
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: FormFieldType;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  validationRules: ValidationRule[];
  options?: FieldOption[];
  conditionalLogic?: ConditionalLogic;
  layout: FieldLayout;
  dataBinding?: DataBinding;
  encrypted: boolean;
  gdprCategory: 'personal' | 'sensitive' | 'clinical' | 'financial';
  retentionPeriod: number;
}
```

## API Endpoints

### Form Management
- `POST /api/forms` - Create new form
- `GET /api/forms` - List forms
- `GET /api/forms/:id` - Get form details
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/forms/:id/publish` - Publish form
- `POST /api/forms/:id/unpublish` - Unpublish form

### Form Submission
- `POST /api/forms/submit` - Submit form data
- `GET /api/forms/:id/submissions` - Get form submissions
- `GET /api/forms/submissions/:id` - Get submission details
- `PUT /api/forms/submissions/:id` - Update submission
- `DELETE /api/forms/submissions/:id` - Delete submission

### Form Templates
- `GET /api/forms/templates` - List form templates
- `POST /api/forms/templates` - Create template
- `GET /api/forms/templates/:id` - Get template details
- `PUT /api/forms/templates/:id` - Update template
- `DELETE /api/forms/templates/:id` - Delete template

### AI Services
- `POST /api/forms/ai/suggest` - Get AI field suggestions
- `POST /api/forms/ai/optimize` - Optimize form with AI
- `POST /api/forms/ai/validate` - AI-powered form validation
- `POST /api/forms/ai/generate` - Generate form from description

### Analytics
- `GET /api/forms/:id/analytics` - Get form analytics
- `GET /api/forms/analytics/overview` - Get overall analytics
- `GET /api/forms/analytics/export` - Export analytics data

## Usage Examples

### Creating a Form

```typescript
import { AdvancedFormsService } from '@/services/forms/AdvancedFormsService';

const formsService = new AdvancedFormsService();

const formData = {
  formName: 'Resident Admission Form',
  formTitle: 'New Resident Admission',
  description: 'Comprehensive admission form for new residents',
  multiPage: true,
  pages: [
    {
      pageId: 'personal-details',
      pageTitle: 'Personal Details',
      fields: [
        {
          fieldId: 'first_name',
          fieldName: 'firstName',
          fieldLabel: 'First Name',
          fieldType: FormFieldType.TEXT,
          validationRules: [
            { rule: ValidationRule.REQUIRED, message: 'First name is required' }
          ],
          layout: { row: 1, column: 1, width: 6 },
          encrypted: true,
          gdprCategory: 'personal',
          retentionPeriod: 2555
        }
      ]
    }
  ],
  complianceSettings: {
    gdprCompliant: true,
    dataRetentionDays: 2555,
    consentRequired: true,
    auditTrail: true,
    digitalSignatureRequired: true
  }
};

const form = await formsService.createForm(formData);
```

### Submitting Form Data

```typescript
const submissionData = {
  firstName: 'John',
  lastName: 'Smith',
  dateOfBirth: '1950-01-01',
  nhsNumber: '123 456 7890'
};

const submission = await formsService.submitForm(
  form.formId,
  submissionData,
  'user-123'
);
```

### Using AI Assistant

```typescript
import { AIFormAssistant } from '@/components/forms/AIFormAssistant';

const handleAIAssistance = async (request: string) => {
  const suggestions = await generateAISuggestions(request, form);
  setAISuggestions(suggestions);
  setShowAIAssistant(true);
};

// Generate field suggestions
await handleAIAssistance('Add fields for medication administration form');
```

## Configuration

### Form Builder Configuration

```typescript
const formBuilderConfig = {
  aiEnabled: true,
  templates: [
    'resident-admission',
    'medication-administration',
    'incident-report',
    'care-plan-review'
  ],
  validationRules: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^(\+44|0)[0-9]{10}$/,
    nhsNumber: /^\d{3}\s?\d{3}\s?\d{4}$/
  },
  accessibility: {
    screenReaderSupport: true,
    keyboardNavigation: true,
    highContrastMode: true
  }
};
```

### AI Configuration

```typescript
const aiConfig = {
  modelVersion: '1.0.0',
  confidenceThreshold: 0.8,
  maxSuggestions: 10,
  supportedLanguages: ['en', 'cy', 'gd', 'ga'],
  fieldSuggestions: {
    enabled: true,
    contextAware: true,
    learningEnabled: true
  }
};
```

## Best Practices

### Form Design
1. **Keep forms simple**: Use clear, concise language
2. **Logical grouping**: Group related fields together
3. **Progressive disclosure**: Show fields as needed
4. **Clear validation**: Provide helpful error messages
5. **Mobile-first**: Design for mobile devices first

### Accessibility
1. **Use semantic HTML**: Proper form elements and labels
2. **ARIA labels**: Provide descriptive labels for screen readers
3. **Keyboard navigation**: Ensure all functionality is keyboard accessible
4. **Color contrast**: Maintain sufficient color contrast
5. **Focus management**: Clear focus indicators and logical tab order

### Security
1. **Validate server-side**: Never trust client-side validation alone
2. **Encrypt sensitive data**: Use field-level encryption for PII
3. **Audit logging**: Log all form activities
4. **Access control**: Implement proper role-based access
5. **Data retention**: Follow data retention policies

### Performance
1. **Lazy loading**: Load form components as needed
2. **Optimize images**: Compress and optimize uploaded files
3. **Caching**: Cache form definitions and templates
4. **Minimize requests**: Batch API calls when possible
5. **Progressive enhancement**: Ensure basic functionality without JavaScript

## Troubleshooting

### Common Issues

#### Form Not Saving
- Check form validation errors
- Verify user permissions
- Ensure all required fields are completed
- Check network connectivity

#### AI Suggestions Not Working
- Verify AI service is enabled
- Check API credentials
- Ensure sufficient context is provided
- Check confidence threshold settings

#### Validation Errors
- Review validation rules
- Check field types and formats
- Verify custom validation logic
- Test with sample data

#### Accessibility Issues
- Test with screen readers
- Verify keyboard navigation
- Check color contrast ratios
- Validate ARIA labels

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const formsService = new AdvancedFormsService({
  debug: true,
  logLevel: 'verbose'
});
```

## Migration Guide

### From Legacy Forms

1. **Export existing forms**: Use the migration tool to export current forms
2. **Convert to new format**: Transform to new FormDefinition structure
3. **Update validation**: Migrate validation rules to new system
4. **Test thoroughly**: Validate all forms work correctly
5. **Deploy gradually**: Roll out new forms incrementally

### Version Updates

1. **Backup data**: Always backup form data before updates
2. **Review changelog**: Check for breaking changes
3. **Test in staging**: Test updates in staging environment
4. **Update dependencies**: Ensure all dependencies are compatible
5. **Monitor performance**: Watch for performance impacts

## Support

For technical support and questions:

- **Documentation**: [Forms Module Docs](./forms.md)
- **API Reference**: [Forms API Reference](../api/forms.md)
- **Examples**: [Form Examples](../examples/forms.md)
- **Issues**: [GitHub Issues](https://github.com/writecarenotes/forms/issues)
- **Community**: [Discord Community](https://discord.gg/writecarenotes)

## Changelog

### Version 1.0.0
- Initial release
- Advanced form builder
- AI-powered assistance
- Multi-language support
- GDPR compliance
- Accessibility features
- Template system
- Analytics dashboard