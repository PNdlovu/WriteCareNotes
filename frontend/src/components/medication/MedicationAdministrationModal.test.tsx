/**
 * @fileoverview MedicationAdministrationModal Component Test Suite
 * @module MedicationAdministrationModal.test
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for MedicationAdministrationModal component covering:
 * - Modal rendering and accessibility
 * - Safety checks and clinical validation
 * - Barcode scanning and verification
 * - Electronic signature capture
 * - Medication administration workflow
 * - Error handling and edge cases
 * - Audit logging and compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MedicationAdministrationModal } from './MedicationAdministrationModal';
import { medicationService } from '../../services/medicationService';
import { auditLogger } from '../../utils/auditLogger';
import { validateMedicationBarcode } from '../../utils/barcodeValidation';
import { useToast } from '../../hooks/useToast';
import { useAudit } from '../../hooks/useAudit';
import { useClinicalSafety } from '../../hooks/useClinicalSafety';
import { usePermissions } from '../../hooks/usePermissions';

// Mock dependencies
vi.mock('../../services/medicationService');
vi.mock('../../utils/auditLogger');
vi.mock('../../utils/barcodeValidation');
vi.mock('../../hooks/useToast');
vi.mock('../../hooks/useAudit');
vi.mock('../../hooks/useClinicalSafety');
vi.mock('../../hooks/usePermissions');
vi.mock('../ui/BarcodeScanner', () => ({
  BarcodeScanner: ({ onScan, onError }: any) => (
    <div data-testid="barcode-scanner">
      <button onClick={() => onScan('12345')}>Scan Success</button>
      <button onClick={() => onError('Scan failed')}>Scan Error</button>
    </div>
  )
}));
vi.mock('../ui/ElectronicSignature', () => ({
  ElectronicSignature: ({ onSignature, onCancel }: any) => (
    <div data-testid="electronic-signature">
      <button onClick={() => onSignature('test-signature')}>Sign</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

// Mock data
const mockMedication = {
  id: 'med-123',
  residentId: 'resident-456',
  residentName: 'John Smith',
  medicationName: 'Paracetamol 500mg',
  dosage: '500mg',
  route: 'Oral',
  scheduledTime: new Date('2025-01-01T10:00:00Z'),
  priority: 'medium',
  status: 'due',
  notes: 'Take with food',
  controlled: false,
  riskLevel: 'low'
};

const mockControlledMedication = {
  ...mockMedication,
  id: 'med-controlled-123',
  medicationName: 'Morphine 10mg',
  dosage: '10mg',
  controlled: true,
  riskLevel: 'high',
  priority: 'high'
};

const mockSafetyCheckResult = {
  safe: true,
  safetyScore: 95,
  alerts: [],
  recommendations: ['Monitor for side effects'],
  escalationRequired: false,
  approvalRequired: false
};

const mockSafetyCheckWithAlerts = {
  safe: false,
  safetyScore: 60,
  alerts: [
    {
      id: 'alert-1',
      type: 'interaction',
      severity: 'high',
      message: 'Drug interaction detected',
      recommendation: 'Consult pharmacist',
      requiresAction: true,
      escalationRequired: true
    }
  ],
  recommendations: ['Review current medications', 'Consider alternative'],
  escalationRequired: true,
  approvalRequired: true
};

const mockToast = vi.fn();
const mockLogAuditEvent = vi.fn();
const mockPerformSafetyCheck = vi.fn();

describe('MedicationAdministrationModal Component', () => {
  const defaultProps = {
    medication: mockMedication,
    isOpen: true,
    organizationId: 'org-123',
    userPermissions: ['medication:administer', 'medication:skip', 'medication:witness'],
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    // Setup mocks
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });
    vi.mocked(useAudit).mockReturnValue({ logAuditEvent: mockLogAuditEvent });
    vi.mocked(useClinicalSafety).mockReturnValue({
      performSafetyCheck: mockPerformSafetyCheck,
      safetyCheckResult: mockSafetyCheckResult,
      loading: false
    });
    vi.mocked(usePermissions).mockReturnValue({
      hasPermission: (permission: string) => defaultProps.userPermissions.includes(permission)
    });

    vi.mocked(validateMedicationBarcode).mockResolvedValue(true);
    vi.mocked(medicationService.administerMedication).mockResolvedValue({
      id: 'admin-123',
      status: 'administered',
      timestamp: new Date()
    });

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should render modal when open', () => {
      render(<MedicationAdministrationModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Medication Administration')).toBeInTheDocument();
      expect(screen.getByText('John Smith • Paracetamol 500mg')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<MedicationAdministrationModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display medication details correctly', () => {
      render(<MedicationAdministrationModal {...defaultProps} />);

      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      expect(screen.getByText('500mg')).toBeInTheDocument();
      expect(screen.getByText('Oral')).toBeInTheDocument();
      expect(screen.getByText('Take with food')).toBeInTheDocument();
    });

    it('should show controlled substance badge for controlled medications', () => {
      render(
        <MedicationAdministrationModal 
          {...defaultProps} 
          medication={mockControlledMedication}
        />
      );

      expect(screen.getByText('Controlled Substance')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });

    it('should be accessible with proper ARIA attributes', () => {
      render(<MedicationAdministrationModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Safety Checks', () => {
    it('should perform safety check on modal open', async () => {
      render(<MedicationAdministrationModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockPerformSafetyCheck).toHaveBeenCalledWith({
          residentId: 'resident-456',
          medicationId: 'med-123',
          dosage: '500mg',
          route: 'Oral',
          scheduledTime: mockMedication.scheduledTime,
          organizationId: 'org-123'
        });
      });
    });

    it('should display safety check results', async () => {
      render(<MedicationAdministrationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No safety concerns identified. Safe to administer.')).toBeInTheDocument();
      });
    });

    it('should display safety alerts when present', async () => {
      vi.mocked(useClinicalSafety).mockReturnValue({
        performSafetyCheck: mockPerformSafetyCheck,
        safetyCheckResult: mockSafetyCheckWithAlerts,
        loading: false
      });

      render(<MedicationAdministrationModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('INTERACTION: Drug interaction detected')).toBeInTheDocument();
        expect(screen.getByText('Consult pharmacist')).toBeInTheDocument();
        expect(screen.getByText('Action Required')).toBeInTheDocument();
        expect(screen.getByText('Escalation Required')).toBeInTheDocument();
      });
    });

    it('should prevent administration when safety check fails', async () => {
      vi.mocked(useClinicalSafety).mockReturnValue({
        performSafetyCheck: mockPerformSafetyCheck,
        safetyCheckResult: mockSafetyCheckWithAlerts,
        loading: false
      });

      render(<MedicationAdministrationModal {...defaultProps} />);

      await waitFor(() => {
        const proceedButton = screen.getByText('Proceed to Administration');
        expect(proceedButton).toBeDisabled();
      });
    });
  });

  describe('Barcode Scanning', () => {
    it('should show barcode scanner for controlled substances', () => {
      render(
        <MedicationAdministrationModal 
          {...defaultProps} 
          medication={mockControlledMedication}
        />
      );

      expect(screen.getByText('Barcode Verification Required')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Scan Barcode/i })).toBeInTheDocument();
    });

    it('should handle successful barcode scan', async () => {
      const user = userEvent.setup();
      render(
        <MedicationAdministrationModal 
          {...defaultProps} 
          medication={mockControlledMedication}
        />
      );

      // Open barcode scanner
      const scanButton = screen.getByRole('button', { name: /Scan Barcode/i });
      await user.click(scanButton);

      await waitFor(() => {
        expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument();
      });

      // Simulate successful scan
      const scanSuccessButton = screen.getByText('Scan Success');
      await user.click(scanSuccessButton);

      await waitFor(() => {
        expect(validateMedicationBarcode).toHaveBeenCalledWith('12345', 'med-controlled-123');
        expect(mockToast).toHaveBeenCalledWith('Medication barcode successfully verified');
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'medication_barcode_verified',
          resourceType: 'medication_administration',
          resourceId: 'med-controlled-123',
          details: expect.objectContaining({
            barcode: '12345'
          })
        });
      });
    });

    it('should handle barcode validation failure', async () => {
      const user = userEvent.setup();
      vi.mocked(validateMedicationBarcode).mockResolvedValue(false);

      render(
        <MedicationAdministrationModal 
          {...defaultProps} 
          medication={mockControlledMedication}
        />
      );

      // Open scanner and scan
      const scanButton = screen.getByRole('button', { name: /Scan Barcode/i });
      await user.click(scanButton);

      const scanSuccessButton = screen.getByText('Scan Success');
      await user.click(scanSuccessButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Scanned barcode does not match the prescribed medication');
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'medication_barcode_mismatch',
          resourceType: 'medication_administration',
          resourceId: 'med-controlled-123',
          details: expect.objectContaining({
            barcode: '12345'
          })
        });
      });
    });
  });

  describe('Medication Administration', () => {
    it('should handle successful medication administration', async () => {
      const user = userEvent.setup();
      render(<MedicationAdministrationModal {...defaultProps} />);

      // Navigate to administration tab
      await waitFor(() => {
        const adminTab = screen.getByRole('tab', { name: /Administration/i });
        user.click(adminTab);
      });

      // Fill form
      const dosageInput = screen.getByLabelText(/Actual Dosage Administered/i);
      await user.clear(dosageInput);
      await user.type(dosageInput, '500mg');

      const notesTextarea = screen.getByPlaceholderText(/Any observations, resident response/i);
      await user.type(notesTextarea, 'Patient took medication well');

      // Submit
      const submitButton = screen.getByRole('button', { name: /Confirm Administration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(medicationService.administerMedication).toHaveBeenCalledWith(
          'med-123',
          expect.objectContaining({
            actualDosage: '500mg',
            notes: 'Patient took medication well'
          })
        );
        expect(mockToast).toHaveBeenCalledWith('Paracetamol 500mg administered successfully for John Smith');
        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should require witness for high-risk medications', async () => {
      render(
        <MedicationAdministrationModal 
          {...defaultProps} 
          medication={mockControlledMedication}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Witnessed By/i)).toBeInTheDocument();
      });
    });

    it('should handle medication refusal', async () => {
      const user = userEvent.setup();
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Patient refused medication');
      vi.mocked(medicationService.skipMedication).mockResolvedValue({ id: 'skip-123' });

      render(<MedicationAdministrationModal {...defaultProps} />);

      const skipButton = screen.getByRole('button', { name: /Skip Medication/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(medicationService.skipMedication).toHaveBeenCalledWith('med-123', 'Patient refused medication');
        expect(mockToast).toHaveBeenCalledWith('Paracetamol 500mg skipped for John Smith');
      });

      promptSpy.mockRestore();
    });

    it('should validate form fields', async () => {
      const user = userEvent.setup();
      render(<MedicationAdministrationModal {...defaultProps} />);

      // Clear required field
      const dosageInput = screen.getByLabelText(/Actual Dosage Administered/i);
      await user.clear(dosageInput);

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /Confirm Administration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Actual dosage is required')).toBeInTheDocument();
      });
    });
  });

  describe('Electronic Signatures', () => {
    it('should require signature for controlled substances', () => {
      render(
        <MedicationAdministrationModal 
          {...defaultProps} 
          medication={mockControlledMedication}
        />
      );

      expect(screen.getByRole('button', { name: /Sign & Administer/i })).toBeInTheDocument();
    });

    it('should handle electronic signature process', async () => {
      const user = userEvent.setup();
      render(
        <MedicationAdministrationModal 
          {...defaultProps} 
          medication={mockControlledMedication}
        />
      );

      // Fill form and click sign
      const signButton = screen.getByRole('button', { name: /Sign & Administer/i });
      await user.click(signButton);

      await waitFor(() => {
        expect(screen.getByTestId('electronic-signature')).toBeInTheDocument();
      });

      // Complete signature
      const signatureButton = screen.getByText('Sign');
      await user.click(signatureButton);

      await waitFor(() => {
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'medication_signature_administrator',
          resourceType: 'medication_administration',
          resourceId: 'med-controlled-123',
          details: expect.objectContaining({
            signatureType: 'administrator'
          })
        });
      });
    });
  });

  describe('Permissions and Access Control', () => {
    it('should prevent administration without permission', async () => {
      const limitedProps = {
        ...defaultProps,
        userPermissions: ['medication:view']
      };

      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: (permission: string) => limitedProps.userPermissions.includes(permission)
      });

      const user = userEvent.setup();
      render(<MedicationAdministrationModal {...limitedProps} />);

      const submitButton = screen.getByRole('button', { name: /Confirm Administration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('You do not have permission to administer medications');
      });
    });

    it('should hide skip button without skip permission', () => {
      const limitedProps = {
        ...defaultProps,
        userPermissions: ['medication:administer']
      };

      vi.mocked(usePermissions).mockReturnValue({
        hasPermission: (permission: string) => limitedProps.userPermissions.includes(permission)
      });

      render(<MedicationAdministrationModal {...limitedProps} />);

      expect(screen.queryByRole('button', { name: /Skip Medication/i })).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle administration errors gracefully', async () => {
      const user = userEvent.setup();
      const error = new Error('Administration failed');
      vi.mocked(medicationService.administerMedication).mockRejectedValue(error);

      render(<MedicationAdministrationModal {...defaultProps} />);

      // Fill and submit form
      const dosageInput = screen.getByLabelText(/Actual Dosage Administered/i);
      await user.type(dosageInput, '500mg');

      const submitButton = screen.getByRole('button', { name: /Confirm Administration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Administration Failed: Administration failed');
        expect(defaultProps.onError).toHaveBeenCalledWith('Administration failed');
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'medication_administration_failed',
          resourceType: 'medication_administration',
          resourceId: 'med-123',
          details: expect.objectContaining({
            error: 'Administration failed'
          })
        });
      });
    });

    it('should handle safety check errors', async () => {
      const error = new Error('Safety check failed');
      vi.mocked(useClinicalSafety).mockReturnValue({
        performSafetyCheck: vi.fn().mockRejectedValue(error),
        safetyCheckResult: null,
        loading: false
      });

      render(<MedicationAdministrationModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Safety Check Failed: Safety check failed');
        expect(defaultProps.onError).toHaveBeenCalledWith('Safety check failed');
      });
    });
  });

  describe('Audit Logging', () => {
    it('should log all major actions', async () => {
      render(<MedicationAdministrationModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'medication_safety_check',
          resourceType: 'medication_administration',
          resourceId: 'med-123',
          details: expect.objectContaining({
            medicationName: 'Paracetamol 500mg',
            residentName: 'John Smith'
          })
        });
      });
    });

    it('should log administration completion', async () => {
      const user = userEvent.setup();
      render(<MedicationAdministrationModal {...defaultProps} />);

      // Submit administration
      const submitButton = screen.getByRole('button', { name: /Confirm Administration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogAuditEvent).toHaveBeenCalledWith({
          action: 'medication_administered',
          resourceType: 'medication_administration',
          resourceId: 'med-123',
          details: expect.objectContaining({
            medicationName: 'Paracetamol 500mg',
            residentName: 'John Smith'
          })
        });
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MedicationAdministrationModal {...defaultProps} />);

      // Test tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: /Close modal/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /Safety Check/i })).toHaveFocus();
    });

    it('should handle escape key to close modal', async () => {
      const user = userEvent.setup();
      render(<MedicationAdministrationModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});