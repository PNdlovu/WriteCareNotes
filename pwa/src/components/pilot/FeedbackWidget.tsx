import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { pilotService } from '../../services/pilotService';

interface FeedbackWidgetProps {
  className?: string;
}

interface FeedbackFormData {
  module: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
}

const MODULES = [
  'Medication Management',
  'Consent Tracking',
  'NHS Integration',
  'Care Planning',
  'Resident Management',
  'Family Communication',
  'Financial Analytics',
  'Workforce Management',
  'Other'
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' }
];

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState<FeedbackFormData>({
    module: '',
    description: '',
    severity: 'low',
    suggestedFix: ''
  });

  const { user, tenantId } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await pilotService.submitFeedback({
        tenantId,
        module: formData.module,
        description: formData.description,
        severity: formData.severity,
        suggestedFix: formData.suggestedFix || undefined,
        submittedBy: user.name || user.email
      });

      setSubmitStatus('success');
      setFormData({
        module: '',
        description: '',
        severity: 'low',
        suggestedFix: ''
      });

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.module && formData.description.trim().length > 10;

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg ${className}`}
        aria-label="Submit Feedback"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </Button>

      {/* Feedback Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Submit Feedback"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitStatus === 'success' && (
            <Alert type="success">
              Thank you for your feedback! We'll review it and get back to you soon.
            </Alert>
          )}

          {submitStatus === 'error' && (
            <Alert type="error">
              Failed to submit feedback. Please try again or contact support.
            </Alert>
          )}

          <div>
            <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
              Module/Feature *
            </label>
            <Select
              id="module"
              value={formData.module}
              onChange={(value) => handleInputChange('module', value)}
              options={MODULES.map(module => ({ value: module, label: module }))}
              placeholder="Select a module"
              required
            />
          </div>

          <div>
            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
              Severity *
            </label>
            <Select
              id="severity"
              value={formData.severity}
              onChange={(value) => handleInputChange('severity', value)}
              options={SEVERITY_OPTIONS}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Please describe the issue or improvement suggestion in detail..."
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters ({formData.description.length}/10)
            </p>
          </div>

          <div>
            <label htmlFor="suggestedFix" className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Fix/Enhancement (Optional)
            </label>
            <Textarea
              id="suggestedFix"
              value={formData.suggestedFix}
              onChange={(e) => handleInputChange('suggestedFix', e.target.value)}
              placeholder="If you have suggestions for how to fix or improve this, please share them..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default FeedbackWidget;