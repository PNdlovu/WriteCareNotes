import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import { useToast } from '../../hooks/useToast';
import { medicationService, MedicationDue } from '../../services/medicationService';
import { formatDateTime } from '../../utils/dateUtils';
import { X, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';

interface MedicationAdministrationModalProps {
  medication: MedicationDue;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AdministrationFormData {
  actualDosage: string;
  notes: string;
  witnessedBy: string;
  administrationTime: string;
}

export const MedicationAdministrationModal: React.FC<MedicationAdministrationModalProps> = ({
  medication,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdministrationFormData>({
    defaultValues: {
      actualDosage: medication.dosage,
      administrationTime: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (data: AdministrationFormData) => {
    setIsSubmitting(true);
    try {
      await medicationService.administerMedication(medication.id, {
        actualDosage: data.actualDosage,
        notes: data.notes,
        witnessedBy: data.witnessedBy,
      });
      
      toast.success(`Medication administered successfully for ${medication.residentName}`);
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to record medication administration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const reason = prompt('Please provide a reason for skipping this medication:');
      if (reason) {
        await medicationService.skipMedication(medication.id, reason);
        toast.success(`Medication skipped for ${medication.residentName}`);
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error('Failed to skip medication');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Medication Administration</CardTitle>
                <p className="text-gray-600 mt-1">{medication.residentName}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Medication Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Medication Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Medication:</span>
                  <p className="font-medium">{medication.medicationName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Prescribed Dosage:</span>
                  <p className="font-medium">{medication.dosage}</p>
                </div>
                <div>
                  <span className="text-gray-500">Route:</span>
                  <p className="font-medium">{medication.route}</p>
                </div>
                <div>
                  <span className="text-gray-500">Scheduled Time:</span>
                  <p className="font-medium">{formatDateTime(medication.scheduledTime)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Priority:</span>
                  <Badge variant={medication.priority === 'high' ? 'danger' : medication.priority === 'medium' ? 'warning' : 'secondary'}>
                    {medication.priority}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <Badge variant={medication.status === 'overdue' ? 'danger' : 'warning'}>
                    {medication.status}
                  </Badge>
                </div>
              </div>
              {medication.notes && (
                <div className="mt-3">
                  <span className="text-gray-500">Notes:</span>
                  <p className="text-sm mt-1">{medication.notes}</p>
                </div>
              )}
            </div>

            {/* Status Alert */}
            {medication.status === 'overdue' && (
              <Alert variant="danger">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This medication is overdue. Please administer as soon as possible and document any delay.
                </AlertDescription>
              </Alert>
            )}

            {/* Administration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Actual Dosage Administered"
                {...register('actualDosage', {
                  required: 'Actual dosage is required',
                })}
                error={errors.actualDosage?.message}
                helperText="Confirm the exact dosage administered"
              />

              <div>
                <label className="form-label">Administration Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  {...register('administrationTime', {
                    required: 'Administration time is required',
                  })}
                />
                {errors.administrationTime && (
                  <p className="text-sm text-danger-600 mt-1">{errors.administrationTime.message}</p>
                )}
              </div>

              <Input
                label="Witnessed By (Optional)"
                {...register('witnessedBy')}
                helperText="Name of staff member who witnessed administration"
              />

              <div>
                <label className="form-label">Administration Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Any observations, resident response, or additional notes..."
                  {...register('notes')}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  variant="success"
                  className="flex-1"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Administration
                </Button>
                
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                >
                  Skip Medication
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};