/**
 * @fileoverview Care Note Editor Component
 * @module CareNoteEditor
 * @version 2.0.0
 * @description Shared care note editor with rich text and healthcare-specific features (Tailwind + shadcn/ui)
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { Switch } from '../ui/Switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/Select';
import { FileText, AlertCircle, Calendar, Tag } from ''lucide-react'';

import { healthcareServices, CareNote, Resident } from ''../../services/healthcareServices'';
import { RichTextEditor } from ''../RichTextEditor/RichTextEditor'';
import { AttachmentUpload } from ''../AttachmentUpload/AttachmentUpload'';
import { VitalSignsInput } from ''../VitalSigns/VitalSignsInput'';
import { TemplateSelector } from ''../Templates/TemplateSelector'';

// Validation schema
const careNoteSchema = yup.object({
  residentId: yup.string().required(''Resident is required''),
  type: yup.string().oneOf([''general'', ''medical'', ''behavioral'', ''social'', ''incident'', ''medication'']).required(''Type is required''),
  title: yup.string().required(''Title is required'').max(200, ''Title must be less than 200 characters''),
  content: yup.string().required(''Content is required'').min(10, ''Content must be at least 10 characters''),
  priority: yup.string().oneOf([''low'', ''medium'', ''high'', ''urgent'']).required(''Priority is required''),
  category: yup.string().required(''Category is required''),
  tags: yup.array().of(yup.string()),
  followUpRequired: yup.boolean(),
  followUpDate: yup.string().when(''followUpRequired'', {
    is: true,
    then: yup.string().required(''Follow-up date is required when follow-up is needed'')
  }),
  isConfidential: yup.boolean(),
  attachments: yup.array().of(yup.string()),
  vitalSigns: yup.object().nullable()
});

type CareNoteFormData = yup.InferType<typeof careNoteSchema>;

interface CareNoteEditorProps {
  resident?: Resident;
  existingNote?: CareNote;
  onSubmit: (data: Omit<CareNote, ''id'' | ''createdAt'' | ''updatedAt''>) => Promise<void>;
  onCancel: () => void;
  templates?: any[];
}

export const CareNoteEditor: React.FC<CareNoteEditorProps> = ({
  resident,
  existingNote,
  onSubmit,
  onCancel,
  templates = []
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(existingNote?.tags || []);
  const [attachments, setAttachments] = useState<string[]>(existingNote?.attachments || []);
  const [vitalSigns, setVitalSigns] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [tagInput, setTagInput] = useState('''');

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
      residentId: resident?.id || existingNote?.residentId || '''',
      type: existingNote?.type || ''general'',
      title: existingNote?.title || '''',
      content: existingNote?.content || '''',
      priority: existingNote?.priority || ''medium'',
      category: existingNote?.category || '''',
      tags: existingNote?.tags || [],
      followUpRequired: existingNote?.followUpRequired || false,
      followUpDate: existingNote?.followUpDate || '''',
      isConfidential: existingNote?.isConfidential || false,
      attachments: existingNote?.attachments || [],
      vitalSigns: null
    },
    mode: ''onChange''
  });

  const watchedType = watch(''type'');
  const watchedFollowUp = watch(''followUpRequired'');
  const watchedConfidential = watch(''isConfidential'');

  // Load residents if not provided
  useEffect(() => {
    if (!resident) {
      loadResidents();
    }
  }, [resident]);

  const loadResidents = async () => {
    try {
      const response = await healthcareServices.getResidents({ limit: 1000 });
      setResidents(response.data.residents.filter(r => r.status === ''active''));
    } catch (error) {
      console.error(''Failed to load residents:'', error);
    }
  };

  // Update form when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setValue(''title'', selectedTemplate.title);
      setValue(''content'', selectedTemplate.content);
      setValue(''category'', selectedTemplate.category);
      setValue(''type'', selectedTemplate.type);
      setSelectedTags(selectedTemplate.tags || []);
    }
  }, [selectedTemplate, setValue]);

  // Update form values from state
  useEffect(() => {
    setValue(''tags'', selectedTags);
    setValue(''attachments'', attachments);
    setValue(''vitalSigns'', vitalSigns);
  }, [selectedTags, attachments, vitalSigns, setValue]);

  const handleFormSubmit = async (data: CareNoteFormData) => {
    setIsSubmitting(true);
    
    try {
      const noteData: Omit<CareNote, ''id'' | ''createdAt'' | ''updatedAt''> = {
        residentId: data.residentId,
        type: data.type as CareNote[''type''],
        title: data.title,
        content: data.content,
        priority: data.priority as CareNote[''priority''],
        category: data.category,
        tags: selectedTags,
        attachments,
        createdBy: '''', // Would be populated from current user
        followUpRequired: data.followUpRequired,
        followUpDate: data.followUpDate,
        isConfidential: data.isConfidential,
        acknowledgedBy: []
      };

      await onSubmit(noteData);
    } catch (error) {
      console.error(''Care note submission failed:'', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const careNoteTypes = [
    { value: ''general'', label: ''General Care'' },
    { value: ''medical'', label: ''Medical'' },
    { value: ''behavioral'', label: ''Behavioral'' },
    { value: ''social'', label: ''Social'' },
    { value: ''incident'', label: ''Incident'' },
    { value: ''medication'', label: ''Medication'' }
  ];

  const priorities = [
    { value: ''low'', label: ''Low'', color: ''bg-green-100 text-green-800'' },
    { value: ''medium'', label: ''Medium'', color: ''bg-yellow-100 text-yellow-800'' },
    { value: ''high'', label: ''High'', color: ''bg-red-100 text-red-800'' },
    { value: ''urgent'', label: ''Urgent'', color: ''bg-red-200 text-red-900'' }
  ];

  const commonCategories = [
    ''Activities of Daily Living'',
    ''Mobility'',
    ''Nutrition'',
    ''Hydration'',
    ''Personal Care'',
    ''Medication'',
    ''Mental Health'',
    ''Social Interaction'',
    ''Sleep'',
    ''Behavior'',
    ''Pain Management'',
    ''Wound Care'',
    ''Infection Control'',
    ''Falls Risk'',
    ''Safeguarding''
  ];

  const commonTags = [
    ''assistance-required'',
    ''independent'',
    ''improvement'',
    ''concern'',
    ''follow-up'',
    ''family-contact'',
    ''doctor-review'',
    ''care-plan-update'',
    ''risk-assessment'',
    ''medication-review'',
    ''physiotherapy'',
    ''occupational-therapy'',
    ''dietitian'',
    ''mental-health'',
    ''social-services''
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setTagInput('''');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {existingNote ? ''Edit Care Note'' : ''New Care Note''}
          </CardTitle>
          
          {templates.length > 0 && (
            <TemplateSelector
              templates={templates}
              onSelect={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
            />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Resident Selection */}
          {!resident && (
            <div className="space-y-2">
              <Label htmlFor="residentId">Resident *</Label>
              <Controller
                name="residentId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.residentId ? ''border-red-500'' : ''''}>
                      <SelectValue placeholder="Select resident..." />
                    </SelectTrigger>
                    <SelectContent>
                      {residents.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.firstName} {r.lastName} (Room {r.roomNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.residentId && (
                <p className="text-sm text-red-500">{errors.residentId.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Care Note Type *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.type ? ''border-red-500'' : ''''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {careNoteTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.priority ? ''border-red-500'' : ''''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={priority.color}>{priority.label}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && (
                <p className="text-sm text-red-500">{errors.priority.message}</p>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter care note title..."
                  className={errors.title ? ''border-red-500'' : ''''}
                />
              )}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.category ? ''border-red-500'' : ''''}>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {commonCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={(e) => {
                    if (e.key === ''Enter'') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Tag className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} 
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonTags.filter(t => !selectedTags.includes(t)).slice(0, 5).map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedTags([...selectedTags, tag])}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
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
          </div>

          {/* Vital Signs (for medical notes) */}
          {watchedType === ''medical'' && (
            <div className="space-y-2">
              <Label>Vital Signs (Optional)</Label>
              <VitalSignsInput
                value={vitalSigns}
                onChange={setVitalSigns}
              />
            </div>
          )}

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <AttachmentUpload
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              maxFiles={5}
              acceptedTypes={[''image/*'', ''application/pdf'', ''.doc'', ''.docx'']}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Follow-up */}
            <div className="flex items-center space-x-2">
              <Controller
                name="followUpRequired"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="followUp"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="followUp" className="cursor-pointer">
                Follow-up Required
              </Label>
            </div>

            {watchedFollowUp && (
              <div className="space-y-2">
                <Label htmlFor="followUpDate">Follow-up Date *</Label>
                <Controller
                  name="followUpDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="date"
                      className={errors.followUpDate ? ''border-red-500'' : ''''}
                    />
                  )}
                />
                {errors.followUpDate && (
                  <p className="text-sm text-red-500">{errors.followUpDate.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Confidential */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Controller
                name="isConfidential"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="confidential"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="confidential" className="cursor-pointer">
                Mark as Confidential
              </Label>
            </div>
            
            {watchedConfidential && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  This note will only be visible to authorized healthcare professionals.
                </p>
              </Alert>
            )}
          </div>

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
              {isSubmitting ? ''Saving...'' : existingNote ? ''Update Note'' : ''Create Note''}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};