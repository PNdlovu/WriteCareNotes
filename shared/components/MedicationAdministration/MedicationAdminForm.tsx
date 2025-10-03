/**
 * @fileoverview Medication Administration Form
 * @module MedicationAdminForm
 * @version 1.0.0
 * @description Shared form component for medication administration across PWA and mobile
 */

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { format } from 'date-fns'

// Platform-specific imports (will be resolved differently in PWA vs mobile)
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  FormHelperText,
  Switch,
  FormControlLabel
} from '@mui/material' // PWA
// For mobile, these would be React Native components

import { healthcareServices, Medication, MedicationAdministration } from '../../services/healthcareServices'
import { BiometricVerification } from '../BiometricVerification/BiometricVerification'
import { PhotoCapture } from '../PhotoCapture/PhotoCapture'
import { SignatureCapture } from '../SignatureCapture/SignatureCapture'

// Validation schema
const administrationSchema = yup.object({
  medicationId: yup.string().required('Medication is required'),
  residentId: yup.string().required('Resident is required'),
  scheduledTime: yup.string().required('Scheduled time is required'),
  actualTime: yup.string().required('Actual administration time is required'),
  dosageGiven: yup.string().required('Dosage given is required'),
  status: yup.string().oneOf(['given', 'missed', 'refused', 'not_required']).required('Status is required'),
  administeredBy: yup.string().required('Administrator is required'),
  witnessedBy: yup.string().when('requiresWitness', {
    is: true,
    then: yup.string().required('Witness is required for this medication')
  }),
  notes: yup.string(),
  sideEffectsObserved: yup.array().of(yup.string()),
  refusalReason: yup.string().when('status', {
    is: 'refused',
    then: yup.string().required('Refusal reason is required')
  }),
  biometricVerified: yup.boolean(),
  photoEvidence: yup.string(),
  signature: yup.string()
})

type AdminFormData = yup.InferType<typeof administrationSchema>

interface MedicationAdminFormProps {
  medication: Medication
  residentId: string
  scheduledTime: string
  onSubmit: (data: MedicationAdministration) => Promise<void>
  onCancel: () => void
  requiresBiometric?: boolean
  requiresWitness?: boolean
  requiresPhoto?: boolean
  requiresSignature?: boolean
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [biometricVerified, setBiometricVerified] = useState(false)
  const [photoEvidence, setPhotoEvidence] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [sideEffects, setSideEffects] = useState<string[]>([])

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
      actualTime: format(new Date(), 'yyyy-MM-dd HH:mm'),
      dosageGiven: medication.dosage,
      status: 'given',
      administeredBy: '', // Would be populated from current user
      witnessedBy: '',
      notes: '',
      sideEffectsObserved: [],
      biometricVerified: false,
      photoEvidence: '',
      signature: ''
    },
    mode: 'onChange'
  })

  const watchedStatus = watch('status')

  useEffect(() => {
    setValue('biometricVerified', biometricVerified)
    setValue('photoEvidence', photoEvidence || '')
    setValue('signature', signature || '')
    setValue('sideEffectsObserved', sideEffects)
  }, [biometricVerified, photoEvidence, signature, sideEffects, setValue])

  const handleFormSubmit = async (data: AdminFormData) => {
    setIsSubmitting(true)
    
    try {
      // Validate required verifications
      if (requiresBiometric && !biometricVerified) {
        throw new Error('Biometric verification is required')
      }
      
      if (requiresPhoto && !photoEvidence) {
        throw new Error('Photo evidence is required')
      }
      
      if (requiresSignature && !signature) {
        throw new Error('Signature is required')
      }

      const administrationData: Omit<MedicationAdministration, 'id'> = {
        medicationId: data.medicationId,
        scheduledTime: data.scheduledTime,
        actualTime: data.actualTime,
        dosageGiven: data.dosageGiven,
        administeredBy: data.administeredBy,
        status: data.status as 'scheduled' | 'given' | 'missed' | 'refused' | 'not_required',
        notes: data.notes,
        witnessedBy: data.witnessedBy,
        sideEffectsObserved: data.sideEffectsObserved
      }

      await onSubmit(administrationData as MedicationAdministration)
    } catch (error) {
      console.error('Administration submission failed:', error)
      // Handle error display
    } finally {
      setIsSubmitting(false)
    }
  }

  const commonSideEffects = [
    'Nausea',
    'Dizziness',
    'Drowsiness',
    'Headache',
    'Rash',
    'Vomiting',
    'Diarrhea',
    'Constipation',
    'Loss of appetite',
    'Fatigue'
  ]

  const refusalReasons = [
    'Resident refused',
    'Resident asleep',
    'Resident not present',
    'Medical contraindication',
    'Medication unavailable',
    'Doctor\'s instruction',
    'Other'
  ]

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Medication Administration
        </Typography>
        
        {/* Medication Info */}
        <Box mb={3} p={2} bgcolor="background.paper" borderRadius={1}>
          <Typography variant="subtitle1" fontWeight="bold">
            {medication.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {medication.genericName && `Generic: ${medication.genericName}`}
          </Typography>
          <Typography variant="body2">
            Prescribed Dosage: {medication.dosage}
          </Typography>
          <Typography variant="body2">
            Route: {medication.route}
          </Typography>
          <Typography variant="body2">
            Indication: {medication.indication}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={3}>
            {/* Administration Status */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel>Administration Status</InputLabel>
                    <Select {...field} label="Administration Status">
                      <MenuItem value="given">Given</MenuItem>
                      <MenuItem value="refused">Refused</MenuItem>
                      <MenuItem value="missed">Missed</MenuItem>
                      <MenuItem value="not_required">Not Required</MenuItem>
                    </Select>
                    {errors.status && (
                      <FormHelperText>{errors.status.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Actual Time */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="actualTime"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Actual Administration Time"
                    type="datetime-local"
                    fullWidth
                    error={!!errors.actualTime}
                    helperText={errors.actualTime?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            {/* Dosage Given */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="dosageGiven"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Dosage Given"
                    fullWidth
                    error={!!errors.dosageGiven}
                    helperText={errors.dosageGiven?.message}
                  />
                )}
              />
            </Grid>

            {/* Administrator */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="administeredBy"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Administered By"
                    fullWidth
                    error={!!errors.administeredBy}
                    helperText={errors.administeredBy?.message}
                  />
                )}
              />
            </Grid>

            {/* Witness (if required) */}
            {requiresWitness && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="witnessedBy"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Witnessed By"
                      fullWidth
                      error={!!errors.witnessedBy}
                      helperText={errors.witnessedBy?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Refusal Reason (if refused) */}
            {watchedStatus === 'refused' && (
              <Grid item xs={12}>
                <Controller
                  name="refusalReason"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.refusalReason}>
                      <InputLabel>Refusal Reason</InputLabel>
                      <Select {...field} label="Refusal Reason">
                        {refusalReasons.map(reason => (
                          <MenuItem key={reason} value={reason}>
                            {reason}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.refusalReason && (
                        <FormHelperText>{errors.refusalReason.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            )}

            {/* Side Effects */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Side Effects Observed
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {commonSideEffects.map(effect => (
                  <Chip
                    key={effect}
                    label={effect}
                    clickable
                    color={sideEffects.includes(effect) ? 'primary' : 'default'}
                    onClick={() => {
                      setSideEffects(prev => 
                        prev.includes(effect)
                          ? prev.filter(e => e !== effect)
                          : [...prev, effect]
                      )
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Additional Notes"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </Grid>

            {/* Biometric Verification */}
            {requiresBiometric && (
              <Grid item xs={12}>
                <BiometricVerification
                  onVerified={() => setBiometricVerified(true)}
                  onError={(error) => console.error('Biometric verification failed:', error)}
                />
              </Grid>
            )}

            {/* Photo Evidence */}
            {requiresPhoto && (
              <Grid item xs={12}>
                <PhotoCapture
                  onPhotoTaken={setPhotoEvidence}
                  label="Photo Evidence"
                />
              </Grid>
            )}

            {/* Signature */}
            {requiresSignature && (
              <Grid item xs={12}>
                <SignatureCapture
                  onSignature={setSignature}
                  label="Administrator Signature"
                />
              </Grid>
            )}
          </Grid>

          {/* Action Buttons */}
          <Box mt={3} display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Recording...' : 'Record Administration'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  )
}