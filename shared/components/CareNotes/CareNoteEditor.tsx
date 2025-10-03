/**
 * @fileoverview Care Note Editor Component
 * @module CareNoteEditor
 * @version 1.0.0
 * @description Shared care note editor with rich text and healthcare-specific features
 */

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { format } from 'date-fns'

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  FormHelperText,
  Switch,
  FormControlLabel,
  Autocomplete,
  Alert,
  Divider
} from '@mui/material'

import { healthcareServices, CareNote, Resident } from '../../services/healthcareServices'
import { RichTextEditor } from '../RichTextEditor/RichTextEditor'
import { AttachmentUpload } from '../AttachmentUpload/AttachmentUpload'
import { VitalSignsInput } from '../VitalSigns/VitalSignsInput'
import { TemplateSelector } from '../Templates/TemplateSelector'

// Validation schema
const careNoteSchema = yup.object({
  residentId: yup.string().required('Resident is required'),
  type: yup.string().oneOf(['general', 'medical', 'behavioral', 'social', 'incident', 'medication']).required('Type is required'),
  title: yup.string().required('Title is required').max(200, 'Title must be less than 200 characters'),
  content: yup.string().required('Content is required').min(10, 'Content must be at least 10 characters'),
  priority: yup.string().oneOf(['low', 'medium', 'high', 'urgent']).required('Priority is required'),
  category: yup.string().required('Category is required'),
  tags: yup.array().of(yup.string()),
  followUpRequired: yup.boolean(),
  followUpDate: yup.string().when('followUpRequired', {
    is: true,
    then: yup.string().required('Follow-up date is required when follow-up is needed')
  }),
  isConfidential: yup.boolean(),
  attachments: yup.array().of(yup.string()),
  vitalSigns: yup.object().nullable()
})

type CareNoteFormData = yup.InferType<typeof careNoteSchema>

interface CareNoteEditorProps {
  resident?: Resident
  existingNote?: CareNote
  onSubmit: (data: Omit<CareNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCancel: () => void
  templates?: any[]
}

export const CareNoteEditor: React.FC<CareNoteEditorProps> = ({
  resident,
  existingNote,
  onSubmit,
  onCancel,
  templates = []
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [residents, setResidents] = useState<Resident[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(existingNote?.tags || [])
  const [attachments, setAttachments] = useState<string[]>(existingNote?.attachments || [])
  const [vitalSigns, setVitalSigns] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<CareNoteFormData>({
    resolver: yupResolver(careNoteSchema),
    defaultValues: {
      residentId: resident?.id || existingNote?.residentId || '',
      type: existingNote?.type || 'general',
      title: existingNote?.title || '',
      content: existingNote?.content || '',
      priority: existingNote?.priority || 'medium',
      category: existingNote?.category || '',
      tags: existingNote?.tags || [],
      followUpRequired: existingNote?.followUpRequired || false,
      followUpDate: existingNote?.followUpDate || '',
      isConfidential: existingNote?.isConfidential || false,
      attachments: existingNote?.attachments || [],
      vitalSigns: null
    },
    mode: 'onChange'
  })

  const watchedType = watch('type')
  const watchedFollowUp = watch('followUpRequired')

  // Load residents if not provided
  useEffect(() => {
    if (!resident) {
      loadResidents()
    }
  }, [resident])

  const loadResidents = async () => {
    try {
      const response = await healthcareServices.getResidents({ limit: 1000 })
      setResidents(response.data.residents.filter(r => r.status === 'active'))
    } catch (error) {
      console.error('Failed to load residents:', error)
    }
  }

  // Update form when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setValue('title', selectedTemplate.title)
      setValue('content', selectedTemplate.content)
      setValue('category', selectedTemplate.category)
      setValue('type', selectedTemplate.type)
      setSelectedTags(selectedTemplate.tags || [])
    }
  }, [selectedTemplate, setValue])

  // Update form values from state
  useEffect(() => {
    setValue('tags', selectedTags)
    setValue('attachments', attachments)
    setValue('vitalSigns', vitalSigns)
  }, [selectedTags, attachments, vitalSigns, setValue])

  const handleFormSubmit = async (data: CareNoteFormData) => {
    setIsSubmitting(true)
    
    try {
      const noteData: Omit<CareNote, 'id' | 'createdAt' | 'updatedAt'> = {
        residentId: data.residentId,
        type: data.type as CareNote['type'],
        title: data.title,
        content: data.content,
        priority: data.priority as CareNote['priority'],
        category: data.category,
        tags: selectedTags,
        attachments,
        createdBy: '', // Would be populated from current user
        followUpRequired: data.followUpRequired,
        followUpDate: data.followUpDate,
        isConfidential: data.isConfidential,
        acknowledgedBy: []
      }

      await onSubmit(noteData)
    } catch (error) {
      console.error('Care note submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const careNoteTypes = [
    { value: 'general', label: 'General Care' },
    { value: 'medical', label: 'Medical' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'social', label: 'Social' },
    { value: 'incident', label: 'Incident' },
    { value: 'medication', label: 'Medication' }
  ]

  const priorities = [
    { value: 'low', label: 'Low', color: '#4caf50' },
    { value: 'medium', label: 'Medium', color: '#ff9800' },
    { value: 'high', label: 'High', color: '#f44336' },
    { value: 'urgent', label: 'Urgent', color: '#d32f2f' }
  ]

  const commonCategories = [
    'Activities of Daily Living',
    'Mobility',
    'Nutrition',
    'Hydration',
    'Personal Care',
    'Medication',
    'Mental Health',
    'Social Interaction',
    'Sleep',
    'Behavior',
    'Pain Management',
    'Wound Care',
    'Infection Control',
    'Falls Risk',
    'Safeguarding'
  ]

  const commonTags = [
    'assistance-required',
    'independent',
    'improvement',
    'concern',
    'follow-up',
    'family-contact',
    'doctor-review',
    'care-plan-update',
    'risk-assessment',
    'medication-review',
    'physiotherapy',
    'occupational-therapy',
    'dietitian',
    'mental-health',
    'social-services'
  ]

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            {existingNote ? 'Edit Care Note' : 'New Care Note'}
          </Typography>
          
          {templates.length > 0 && (
            <TemplateSelector
              templates={templates}
              onSelect={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
            />
          )}
        </Box>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={3}>
            {/* Resident Selection */}
            {!resident && (
              <Grid item xs={12}>
                <Controller
                  name="residentId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={residents}
                      getOptionLabel={(option) => `${option.firstName} ${option.lastName} (Room ${option.roomNumber})`}
                      value={residents.find(r => r.id === field.value) || null}
                      onChange={(_, value) => field.onChange(value?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Resident"
                          error={!!errors.residentId}
                          helperText={errors.residentId?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Type and Priority */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Care Note Type</InputLabel>
                    <Select {...field} label="Care Note Type">
                      {careNoteTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.type && (
                      <FormHelperText>{errors.type.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.priority}>
                    <InputLabel>Priority</InputLabel>
                    <Select {...field} label="Priority">
                      {priorities.map(priority => (
                        <MenuItem key={priority.value} value={priority.value}>
                          <Box display="flex" alignItems="center">
                            <Box
                              width={12}
                              height={12}
                              borderRadius="50%"
                              bgcolor={priority.color}
                              mr={1}
                            />
                            {priority.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.priority && (
                      <FormHelperText>{errors.priority.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Title */}
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Title"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={commonCategories}
                    value={field.value}
                    onChange={(_, value) => field.onChange(value || '')}
                    freeSolo
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Category"
                        error={!!errors.category}
                        helperText={errors.category?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={commonTags}
                value={selectedTags}
                onChange={(_, value) => setSelectedTags(value)}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags..."
                  />
                )}
              />
            </Grid>

            {/* Content */}
            <Grid item xs={12}>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter care note details..."
                    error={!!errors.content}
                    helperText={errors.content?.message}
                  />
                )}
              />
            </Grid>

            {/* Vital Signs (for medical notes) */}
            {watchedType === 'medical' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Vital Signs (Optional)
                </Typography>
                <VitalSignsInput
                  value={vitalSigns}
                  onChange={setVitalSigns}
                />
              </Grid>
            )}

            {/* Attachments */}
            <Grid item xs={12}>
              <AttachmentUpload
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                maxFiles={5}
                acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
              />
            </Grid>

            {/* Follow-up */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="followUpRequired"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    }
                    label="Follow-up Required"
                  />
                )}
              />
            </Grid>

            {watchedFollowUp && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="followUpDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Follow-up Date"
                      type="date"
                      fullWidth
                      error={!!errors.followUpDate}
                      helperText={errors.followUpDate?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Confidential */}
            <Grid item xs={12}>
              <Controller
                name="isConfidential"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    }
                    label="Mark as Confidential"
                  />
                )}
              />
              {watch('isConfidential') && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  This note will only be visible to authorized healthcare professionals.
                </Alert>
              )}
            </Grid>
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
              {isSubmitting ? 'Saving...' : existingNote ? 'Update Note' : 'Create Note'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  )
}