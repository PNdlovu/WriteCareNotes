import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FamilyPortalService } from '../../services/family-portal.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

describe('FamilyPortalService', () => {
  letservice: FamilyPortalService;
  letmockRepository: any;
  letmockEventEmitter: any;
  letmockAuditService: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockAuditService = {
      logEvent: jest.fn(),
    };

    constmodule: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyPortalService,
        {
          provide: getRepositoryToken('FamilyPortal'),
          useValue: mockRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<FamilyPortalService>(FamilyPortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFamilyDashboard', () => {
    it('should return family dashboard for resident', async () => {
      const residentId = 'resident_001';
      const dashboard = await service.getFamilyDashboard(residentId);

      expect(dashboard).toEqual({
        residentId,
        healthSummary: {
          currentStatus: 'stable',
          lastAssessment: new Date(),
          vitalSigns: {
            bloodPressure: '120/80',
            heartRate: 72,
            temperature: 36.5,
            oxygenSaturation: 98,
          },
          medications: [
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
              lastTaken: new Date(),
              nextDue: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          ],
          upcomingAppointments: [
            {
              id: 'appt_001',
              type: 'General Checkup',
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              doctor: 'Dr. Smith',
              location: 'Medical Center',
            },
          ],
        },
        carePlanSummary: {
          currentGoals: [
            'Maintain independence in daily activities',
            'Improve mobility and strength',
            'Manage chronic conditions effectively',
          ],
          careTeam: [
            { name: 'Dr. Smith', role: 'Primary Physician', contact: 'dr.smith@carehome.com' },
            { name: 'Nurse Johnson', role: 'Primary Nurse', contact: 'nurse.johnson@carehome.com' },
            { name: 'Therapist Brown', role: 'Physical Therapist', contact: 'therapist.brown@carehome.com' },
          ],
          nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        recentUpdates: [
          {
            id: 'update_001',
            residentId,
            updateType: 'care_plan_change',
            title: 'Updated Care Plan',
            description: 'Care plan has been updated with new therapy sessions',
            priority: 'medium',
            effectiveDate: new Date(),
            isRead: false,
            createdAt: new Date(),
          },
        ],
        upcomingEvents: [
          {
            id: 'event_001',
            title: 'Family Visit',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            type: 'family_visit',
            description: 'Scheduled family visit with John and Sarah',
          },
        ],
        photoUpdates: [
          {
            id: 'photo_001',
            residentId,
            photos: [
              {
                id: 'photo_001_1',
                url: 'https://example.com/photo1.jpg',
                caption: 'Enjoying the garden',
                takenBy: 'Nurse Johnson',
                tags: ['garden', 'outdoor', 'happy'],
              },
            ],
            eventType: 'daily_activity',
            description: 'Resident enjoying time in the garden',
            isShared: true,
            createdAt: new Date(),
          },
        ],
        messages: [
          {
            id: 'msg_001',
            from: 'Dr. Smith',
            subject: 'Medication Update',
            content: 'Medication dosage has been adjusted as discussed',
            timestamp: new Date(),
            isRead: false,
          },
        ],
        surveys: [
          {
            id: 'survey_001',
            title: 'Care Quality Survey',
            description: 'Please share your feedback about the care provided',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isCompleted: false,
          },
        ],
        quickActions: [
          {
            id: 'action_001',
            title: 'Schedule Visit',
            description: 'Schedule a family visit',
            actionType: 'schedule_visit',
            isAvailable: true,
          },
          {
            id: 'action_002',
            title: 'Send Message',
            description: 'Send a message to the care team',
            actionType: 'send_message',
            isAvailable: true,
          },
        ],
        emergencyContacts: [
          {
            id: 'contact_001',
            name: 'John Smith',
            relationship: 'Son',
            phone: '+44 7700 900123',
            isPrimary: true,
            isAvailable: true,
          },
        ],
        lastUpdated: new Date(),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.dashboard.accessed', {
        residentId,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('shareCarePlanUpdate', () => {
    it('should share care plan update successfully', async () => {
      const update = {
        id: 'update_001',
        residentId: 'resident_001',
        updateType: 'care_plan_change' as const,
        title: 'Updated Care Plan',
        description: 'Care plan has been updated with new therapy sessions',
        priority: 'medium' as const,
        effectiveDate: new Date(),
        careTeamNotes: 'Resident is responding well to new therapy',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.shareCarePlanUpdate(update);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.care_plan_update.shared', {
        updateId: update.id,
        residentId: update.residentId,
        updateType: update.updateType,
        title: update.title,
        priority: update.priority,
        timestamp: expect.any(Date),
      });
    });

    it('should handle care plan update sharing failure', async () => {
      const update = {
        id: 'update_001',
        residentId: 'invalid_resident',
        updateType: 'care_plan_change' as const,
        title: 'Updated Care Plan',
        description: 'Care plan has been updated with new therapy sessions',
        priority: 'medium' as const,
        effectiveDate: new Date(),
        careTeamNotes: 'Resident is responding well to new therapy',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.shareCarePlanUpdate(update);

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.care_plan_update.failed', {
        updateId: update.id,
        residentId: update.residentId,
        error: 'Resident not found',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('sharePhotos', () => {
    it('should share photos successfully', async () => {
      const photoUpdate = {
        id: 'photo_update_001',
        residentId: 'resident_001',
        photos: [
          {
            id: 'photo_001',
            url: 'https://example.com/photo1.jpg',
            caption: 'Enjoying the garden',
            takenBy: 'Nurse Johnson',
            tags: ['garden', 'outdoor', 'happy'],
          },
        ],
        eventType: 'daily_activity' as const,
        description: 'Resident enjoying time in the garden',
        isShared: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.sharePhotos(photoUpdate);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.photos.shared', {
        photoUpdateId: photoUpdate.id,
        residentId: photoUpdate.residentId,
        photoCount: photoUpdate.photos.length,
        eventType: photoUpdate.eventType,
        timestamp: expect.any(Date),
      });
    });

    it('should handle photo sharing failure', async () => {
      const photoUpdate = {
        id: 'photo_update_001',
        residentId: 'invalid_resident',
        photos: [],
        eventType: 'daily_activity' as const,
        description: 'Resident enjoying time in the garden',
        isShared: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.sharePhotos(photoUpdate);

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.photos.failed', {
        photoUpdateId: photoUpdate.id,
        residentId: photoUpdate.residentId,
        error: 'Resident not found',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('enableRealTimeUpdates', () => {
    it('should enable real-time updates successfully', async () => {
      const residentId = 'resident_001';
      const updateTypes = ['care_plan', 'health_status', 'activities'];
      const notificationMethods = ['email', 'sms', 'portal'];
      const frequency = 'immediate';

      const result = await service.enableRealTimeUpdates(
        residentId,
        updateTypes,
        notificationMethods,
        frequency,
      );

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.real_time_updates.enabled', {
        residentId,
        updateTypes,
        notificationMethods,
        frequency,
        timestamp: expect.any(Date),
      });
    });

    it('should handle real-time updates enabling failure', async () => {
      const residentId = 'invalid_resident';
      const updateTypes = ['care_plan'];
      const notificationMethods = ['email'];
      const frequency = 'immediate';

      const result = await service.enableRealTimeUpdates(
        residentId,
        updateTypes,
        notificationMethods,
        frequency,
      );

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.real_time_updates.failed', {
        residentId,
        error: 'Resident not found',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('sendEmergencyNotification', () => {
    it('should send emergency notification successfully', async () => {
      const residentId = 'resident_001';
      const emergencyType = 'medical_emergency';
      const severity = 'high';
      const description = 'Resident experienced chest pain';
      const location = 'Room 101';
      const immediateAction = 'Called emergency services';
      const contactInfo = 'Emergency services: 999';

      const result = await service.sendEmergencyNotification(
        residentId,
        emergencyType,
        severity,
        description,
        location,
        immediateAction,
        contactInfo,
      );

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.emergency_notification.sent', {
        residentId,
        emergencyType,
        severity,
        description,
        location,
        immediateAction,
        contactInfo,
        timestamp: expect.any(Date),
      });
    });

    it('should handle emergency notification failure', async () => {
      const residentId = 'invalid_resident';
      const emergencyType = 'medical_emergency';
      const severity = 'high';
      const description = 'Resident experienced chest pain';

      const result = await service.sendEmergencyNotification(
        residentId,
        emergencyType,
        severity,
        description,
      );

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.emergency_notification.failed', {
        residentId,
        emergencyType,
        severity,
        error: 'Resident not found',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('collectFeedback', () => {
    it('should collect feedback successfully', async () => {
      const residentId = 'resident_001';
      const feedbackType = 'care_quality';
      const rating = 5;
      const comments = 'Excellent care provided';
      const suggestions = 'Keep up the great work';
      const anonymous = false;

      const result = await service.collectFeedback(
        residentId,
        feedbackType,
        rating,
        comments,
        suggestions,
        anonymous,
      );

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.feedback.collected', {
        residentId,
        feedbackType,
        rating,
        comments,
        suggestions,
        anonymous,
        timestamp: expect.any(Date),
      });
    });

    it('should handle feedback collection failure', async () => {
      const residentId = 'invalid_resident';
      const feedbackType = 'care_quality';
      const rating = 5;
      const comments = 'Excellent care provided';

      const result = await service.collectFeedback(
        residentId,
        feedbackType,
        rating,
        comments,
      );

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.feedback.failed', {
        residentId,
        feedbackType,
        rating,
        error: 'Resident not found',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('scheduleFamilyMeeting', () => {
    it('should schedule family meeting successfully', async () => {
      const residentId = 'resident_001';
      const meetingType = 'care_plan_review';
      const scheduledDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const duration = 60;
      const attendees = [
        {
          name: 'John Smith',
          relationship: 'Son',
          email: 'john.smith@email.com',
          phone: '+44 7700 900123',
        },
      ];
      const agenda = ['Review care plan', 'Discuss health status', 'Address concerns'];
      const location = 'video_call';
      const meetingLink = 'https://meet.example.com/meeting123';
      const notes = 'Important meeting to discuss care plan updates';

      const result = await service.scheduleFamilyMeeting(
        residentId,
        meetingType,
        scheduledDate,
        duration,
        attendees,
        agenda,
        location,
        meetingLink,
        notes,
      );

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.meeting.scheduled', {
        residentId,
        meetingType,
        scheduledDate,
        duration,
        attendees: attendees.length,
        location,
        meetingLink,
        timestamp: expect.any(Date),
      });
    });

    it('should handle family meeting scheduling failure', async () => {
      const residentId = 'invalid_resident';
      const meetingType = 'care_plan_review';
      const scheduledDate = new Date();
      const duration = 60;
      const attendees = [];
      const agenda = [];
      const location = 'video_call';

      const result = await service.scheduleFamilyMeeting(
        residentId,
        meetingType,
        scheduledDate,
        duration,
        attendees,
        agenda,
        location,
      );

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.meeting.failed', {
        residentId,
        meetingType,
        error: 'Resident not found',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('updateFamilyPreferences', () => {
    it('should update family preferences successfully', async () => {
      const preferences = {
        residentId: 'resident_001',
        communicationPreferences: {
          preferredMethod: 'email' as const,
          frequency: 'weekly' as const,
          emergencyOnly: false,
        },
        notificationSettings: {
          carePlanUpdates: true,
          healthStatusChanges: true,
          medicationChanges: true,
          appointmentReminders: true,
          emergencyAlerts: true,
          photoUpdates: true,
          activityUpdates: true,
        },
        privacySettings: {
          sharePhotos: true,
          shareHealthData: true,
          shareActivityData: true,
          shareLocationData: false,
          allowStaffContact: true,
        },
        meetingPreferences: {
          preferredTime: 'afternoon' as const,
          preferredDay: 'weekday' as const,
          preferredLocation: 'video_call' as const,
          advanceNotice: 24,
        },
        updatedAt: new Date(),
      };

      const result = await service.updateFamilyPreferences(preferences);

      expect(result).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.preferences.updated', {
        residentId: preferences.residentId,
        communicationMethod: preferences.communicationPreferences.preferredMethod,
        notificationCount: Object.values(preferences.notificationSettings).filter(Boolean).length,
        timestamp: expect.any(Date),
      });
    });

    it('should handle family preferences update failure', async () => {
      const preferences = {
        residentId: 'invalid_resident',
        communicationPreferences: {
          preferredMethod: 'email' as const,
          frequency: 'weekly' as const,
          emergencyOnly: false,
        },
        notificationSettings: {
          carePlanUpdates: true,
          healthStatusChanges: true,
          medicationChanges: true,
          appointmentReminders: true,
          emergencyAlerts: true,
          photoUpdates: true,
          activityUpdates: true,
        },
        privacySettings: {
          sharePhotos: true,
          shareHealthData: true,
          shareActivityData: true,
          shareLocationData: false,
          allowStaffContact: true,
        },
        meetingPreferences: {
          preferredTime: 'afternoon' as const,
          preferredDay: 'weekday' as const,
          preferredLocation: 'video_call' as const,
          advanceNotice: 24,
        },
        updatedAt: new Date(),
      };

      const result = await service.updateFamilyPreferences(preferences);

      expect(result).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.preferences.failed', {
        residentId: preferences.residentId,
        error: 'Resident not found',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('getFamilyPreferences', () => {
    it('should return family preferences for resident', async () => {
      const residentId = 'resident_001';
      const preferences = await service.getFamilyPreferences(residentId);

      expect(preferences).toEqual({
        residentId,
        communicationPreferences: {
          preferredMethod: 'email',
          frequency: 'weekly',
          emergencyOnly: false,
        },
        notificationSettings: {
          carePlanUpdates: true,
          healthStatusChanges: true,
          medicationChanges: true,
          appointmentReminders: true,
          emergencyAlerts: true,
          photoUpdates: true,
          activityUpdates: true,
        },
        privacySettings: {
          sharePhotos: true,
          shareHealthData: true,
          shareActivityData: true,
          shareLocationData: false,
          allowStaffContact: true,
        },
        meetingPreferences: {
          preferredTime: 'afternoon',
          preferredDay: 'weekday',
          preferredLocation: 'video_call',
          advanceNotice: 24,
        },
        updatedAt: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.preferences.accessed', {
        residentId,
        timestamp: expect.any(Date),
      });
    });

    it('should handle family preferences retrieval failure', async () => {
      const residentId = 'invalid_resident';
      const preferences = await service.getFamilyPreferences(residentId);

      expect(preferences).toBeNull();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('family.portal.preferences.failed', {
        residentId,
        error: 'Resident not found',
        timestamp: expect.any(Date),
      });
    });
  });
});
