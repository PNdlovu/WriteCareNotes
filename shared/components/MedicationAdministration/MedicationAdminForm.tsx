/**
 * @fileoverview Medication Administration Form
 * @module MedicationAdminForm
 * @version 2.0.0
 * @description Shared form component for medication administration (Tailwind + shadcn/ui)
 */

import React, { useState, useEffect } from ''react'';
import { useForm, Controller } from ''react-hook-form'';
import { yupResolver } from ''@hookform/resolvers/yup'';
import * as yup from ''yup'';
import { format } from ''date-fns'';

import { Card, CardContent, CardHeader, CardTitle } from ''../ui/Card'';
import { Button } from ''../ui/Button'';
import { Input } from ''../ui/Input'';
import { Label } from ''../ui/Label'';
import { Badge } from ''../ui/Badge'';
import { Alert } from ''../ui/Alert'';
import { Textarea } from ''../ui/Textarea'';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from ''../ui/Select'';
import {
  Pill, Clock, User, UserCheck, AlertTriangle, Camera, FileSignature
} from ''lucide-react'';

import { healthcareServices, Medication, MedicationAdministration } from ''../../services/healthcareServices'';
import { BiometricVerification } from ''../BiometricVerification/BiometricVerification'';
import { PhotoCapture } from ''../PhotoCapture/PhotoCapture'';
import { SignatureCapture } from ''../SignatureCapture/SignatureCapture'';

// Validation schema
const administrationSchema = yup.object({
  medicationId: yup.string().required(''Medication is required''),
  residentId: yup.string().required(''Resident is required''),
  scheduledTime: yup.string().required(''Scheduled time is required''),
  actualTime: yup.string().required(''Actual administration time is required''),
  dosageGiven: yup.string().required(''Dosage given is required''),
  status: yup.string().oneOf([''given'', ''missed'', ''refused'', ''not_required'']).required(''Status is required''),
  administeredBy: yup.string().required(''Administrator is required''),
  witnessedBy: yup.string().when(''requiresWitness'', {
    is: true,
    then: yup.string().required(''Witness is required for this medication'')
  }),
  notes: yup.string(),
  sideEffectsObserved: yup.array().of(yup.string()),
  refusalReason: yup.string().when(''status'', {
    is: ''refused'',
    then: yup.string().required(''Refusal reason is required'')
  }),
  biometricVerified: yup.boolean(),
  photoEvidence: yup.string(),
  signature: yup.string()
});

type AdminFormData = yup.InferType<typeof administrationSchema>;

interface MedicationAdminFormProps {
  medication: Medication;
  residentId: string;
  scheduledTime: string;
  onSubmit: (data: MedicationAdministration) => Promise<void>;
  onCancel: () => void;
  requiresBiometric?: boolean;
  requiresWitness?: boolean;
  requiresPhoto?: boolean;
  requiresSignature?: boolean;
}

export const MedicationAdminForm: React.FC<MedicationAdminFormProps> = ({
  medication,
  residentId,
  scheduledTime,
  onSubmit,
  onCancel,
  requiresBiometric = false,
  requiresWitness = false,
  requiresPhoto = false,
  requiresSignature = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [photoEvidence, setPhotoEvidence] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [sideEffects, setSideEffects] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<AdminFormData>({
    resolver: yupResolver(administrationSchema),
    defaultValues: {
      medicationId: medication.id,
      residentId,
      scheduledTime,
      actualTime: format(new Date(), ''yyyy-MM-dd HH:mm''),
      dosageGiven: medication.dosage,
      status: ''given'',
      administeredBy: '''', // Would be populated from current user
      witnessedBy: '''',
      notes: '''',
      sideEffectsObserved: [],
      biometricVerified: false,
      photoEvidence: '''',
      signature: ''''
    },
    mode: ''onChange''
  });

  const watchedStatus = watch(''status'');

  useEffect(() => {
    setValue(''biometricVerified'', biometricVerified);
    setValue(''photoEvidence'', photoEvidence || '''');
    setValue(''signature'', signature || '''');
    setValue(''sideEffectsObserved'', sideEffects);
  }, [biometricVerified, photoEvidence, signature, sideEffects, setValue]);

  const handleFormSubmit = async (data: AdminFormData) => {
    setIsSubmitting(true);
    
    try {
      // Validate required verifications
      if (requiresBiometric && !biometricVerified) {
        throw new Error(''Biometric verification is required'');
      }
      
      if (requiresPhoto && !photoEvidence) {
        throw new Error(''Photo evidence is required'');
      }
      
      if (requiresSignature && !signature) {
        throw new Error(''Signature is required'');
      }

      const administrationData: Omit<MedicationAdministration, ''id''> = {
        medicationId: data.medicationId,
        scheduledTime: data.scheduledTime,
        actualTime: data.actualTime,
        dosageGiven: data.dosageGiven,
        administeredBy: data.administeredBy,
        status: data.status as ''scheduled'' | ''given'' | ''missed'' | ''refused'' | ''not_required'',
        notes: data.notes,
        witnessedBy: data.witnessedBy,
        sideEffectsObserved: data.sideEffectsObserved
      };

      await onSubmit(administrationData as MedicationAdministration);
    } catch (error) {
      console.error(''Administration submission failed:'', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonSideEffects = [
    ''Nausea'', ''Dizziness'', ''Drowsiness'', ''Headache'', ''Rash'',
    ''Vomiting'', ''Diarrhea'', ''Constipation'', ''Loss of appetite'', ''Fatigue''
  ];

  const refusalReasons = [
    ''Resident refused'', ''Resident asleep'', ''Resident not present'',
    ''Medical contraindication'', ''Medication unavailable'',
    ''Doctor\''s instruction'', ''Other''
  ];

  const toggleSideEffect = (effect: string) => {
    setSideEffects(prev => 
      prev.includes(effect)
        ? prev.filter(e => e !== effect)
        : [...prev, effect]
    );
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-600" />
          Medication Administration
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Medication Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {medication.name}
          </h3>
          {medication.genericName && (
            <p className="text-sm text-gray-600">Generic: {medication.genericName}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Prescribed Dosage:</span> {medication.dosage}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Route:</span> {medication.route}
            </p>
            <p className="text-gray-700 col-span-2">
              <span className="font-medium">Indication:</span> {medication.indication}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Administration Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Administration Status *
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.status ? ''border-red-500'' : ''''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="given">Given</SelectItem>
                      <SelectItem value="refused">Refused</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                      <SelectItem value="not_required">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>

            {/* Actual Time */}
            <div className="space-y-2">
              <Label htmlFor="actualTime" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Actual Administration Time *
              </Label>
              <Controller
                name="actualTime"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    className={errors.actualTime ? ''border-red-500'' : ''''}
                  />
                )}
              />
              {errors.actualTime && (
                <p className="text-sm text-red-500">{errors.actualTime.message}</p>
              )}
            </div>

            {/* Dosage Given */}
            <div className="space-y-2">
              <Label htmlFor="dosageGiven">Dosage Given *</Label>
              <Controller
                name="dosageGiven"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., 500mg"
                    className={errors.dosageGiven ? ''border-red-500'' : ''''}
                  />
                )}
              />
              {errors.dosageGiven && (
                <p className="text-sm text-red-500">{errors.dosageGiven.message}</p>
              )}
            </div>

            {/* Administrator */}
            <div className="space-y-2">
              <Label htmlFor="administeredBy" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Administered By *
              </Label>
              <Controller
                name="administeredBy"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Staff name"
                    className={errors.administeredBy ? ''border-red-500'' : ''''}
                  />
                )}
              />
              {errors.administeredBy && (
                <p className="text-sm text-red-500">{errors.administeredBy.message}</p>
              )}
            </div>

            {/* Witness (if required) */}
            {requiresWitness && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="witnessedBy" className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Witnessed By *
                </Label>
                <Controller
                  name="witnessedBy"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Witness name"
                      className={errors.witnessedBy ? ''border-red-500'' : ''''}
                    />
                  )}
                />
                {errors.witnessedBy && (
                  <p className="text-sm text-red-500">{errors.witnessedBy.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Refusal Reason (if refused) */}
          {watchedStatus === ''refused'' && (
            <div className="space-y-2">
              <Label htmlFor="refusalReason">Refusal Reason *</Label>
              <Controller
                name="refusalReason"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.refusalReason ? ''border-red-500'' : ''''}>
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      {refusalReasons.map(reason => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.refusalReason && (
                <p className="text-sm text-red-500">{errors.refusalReason.message}</p>
              )}
            </div>
          )}

          {/* Side Effects */}
          <div className="space-y-3">
            <Label>Side Effects Observed</Label>
            <div className="flex flex-wrap gap-2">
              {commonSideEffects.map(effect => (
                <Badge
                  key={effect}
                  variant={sideEffects.includes(effect) ? ''default'' : ''outline''}
                  className="cursor-pointer"
                  onClick={() => toggleSideEffect(effect)}
                >
                  {effect}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Enter any additional observations or notes..."
                  rows={3}
                  className={errors.notes ? ''border-red-500'' : ''''}
                />
              )}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>

          {/* Biometric Verification */}
          {requiresBiometric && (
            <div className="border border-gray-200 rounded-lg p-4">
              <BiometricVerification
                onVerified={() => setBiometricVerified(true)}
                onError={(error) => console.error(''Biometric verification failed:'', error)}
              />
            </div>
          )}

          {/* Photo Evidence */}
          {requiresPhoto && (
            <div className="border border-gray-200 rounded-lg p-4">
              <Label className="flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4" />
                Photo Evidence
              </Label>
              <PhotoCapture
                onPhotoTaken={setPhotoEvidence}
                label="Take Photo"
              />
            </div>
          )}

          {/* Signature */}
          {requiresSignature && (
            <div className="border border-gray-200 rounded-lg p-4">
              <Label className="flex items-center gap-2 mb-3">
                <FileSignature className="w-4 h-4" />
                Administrator Signature
              </Label>
              <SignatureCapture
                onSignature={setSignature}
                label="Sign Here"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? ''Recording...'' : ''Record Administration''}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};