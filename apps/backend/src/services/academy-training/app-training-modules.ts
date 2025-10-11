/**
 * @fileoverview Role-Based App Training Modules - Pre-configured training content
 * @module Academy-training/app-training-modules
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance 
 *   - CQC (England)
 *   - Care Inspectorate (Scotland)
 *   - CIW - Care Inspectorate Wales (Wales)
 *   - RQIA - Regulation and Quality Improvement Authority (Northern Ireland)
 *   - Jersey Care Commission (Jersey)
 *   - Guernsey Health Improvement Commission (Guernsey)
 *   - Isle of Man DHSC Registration and Inspection Unit (Isle of Man)
 *   - GDPR & Data Protection Act 2018
 * 
 * @description Pre-built training modules for each user role in WriteCarenotes.
 * Teaches staff how to use the app effectively based on their responsibilities.
 * Covers ALL microservices including self-serve portal, document management, rotas, etc.
 * 
 * Supports care homesacross: England, Scotland, Wales, Northern Ireland, Jersey, 
 * Guernsey, and Isle of Man - all with appropriate regulatory compliance.
 * 
 * @important VIDEOPLACEHOLDERS: Video URLs are placeholders. System will show "Coming soon"
 * until actual videos are recorded. Text/interactive content works without videos.
 * 
 * @note ADDINGCONTENT: Before database seeding, edit this file. After seeding, use admin panel
 * or API to add/update training content and quizzes.
 */

export const APP_TRAINING_MODULES = {
  
  // ============================================================================
  // CARE ASSISTANT TRAINING
  // ============================================================================
  
  care_assistant_onboarding: {
    title: 'WriteCarenotes for Care Assistants - Getting Started',
    description: 'Learn how to use WriteCarenotes in your daily care work. This module covers resident records, medication, care notes, and handovers.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'beginner' as const,
    duration: 45, // minutes
    credits: 0,
    targetAudience: ['care_assistant'],
    isMandatory: true,
    learningObjectives: [
      'Log in securely and navigate the mobile app',
      'View resident profiles and care plans',
      'Record care notes and observations',
      'Complete medication administration records (MAR)',
      'Use the handover system',
      'Raise concerns and incidents'
    ],
    content: [
      {
        id: 'ca-intro',
        type: 'video' as const,
        title: 'Welcome to WriteCarenotes',
        description: 'Overview of the app and how it helps you deliver great care',
        content: { videoUrl: '/training/videos/ca-welcome.mp4' },
        duration: 5,
        order: 1,
        isRequired: true
      },
      {
        id: 'ca-login',
        type: 'interactive' as const,
        title: 'Logging In & Security',
        description: 'How to access the app securely on any device',
        content: {
          steps: [
            'Open the WriteCarenotes app',
            'Enter your email and password',
            'Complete two-factor authentication (if enabled)',
            'Navigate to your dashboard'
          ],
          tips: [
            'Never share your password',
            'Always log out when finished',
            'Report lost devices immediately'
          ]
        },
        duration: 5,
        order: 2,
        isRequired: true
      },
      {
        id: 'ca-residents',
        type: 'video' as const,
        title: 'Viewing Resident Information',
        description: 'Access resident profiles, care plans, and preferences',
        content: { videoUrl: '/training/videos/ca-residents.mp4' },
        duration: 10,
        order: 3,
        isRequired: true
      },
      {
        id: 'ca-care-notes',
        type: 'interactive' as const,
        title: 'Recording Care Notes',
        description: 'Document care activities and observations',
        content: {
          steps: [
            'Select the resident',
            'Tap "Add Care Note"',
            'Choose note type (personal care, meals, activities, etc.)',
            'Write clear, factual observations',
            'Add photos if needed (with consent)',
            'Save and notify relevant staff'
          ],
          examples: [
            'Good: "Mrs Smith ate 75% of lunch, enjoyed fruit salad. Mood cheerful."',
            'Bad: "Had lunch, seemed fine."'
          ]
        },
        duration: 10,
        order: 4,
        isRequired: true
      },
      {
        id: 'ca-medication',
        type: 'video' as const,
        title: 'Medication Administration',
        description: 'Using the digital MAR chart safely',
        content: { videoUrl: '/training/videos/ca-medication.mp4' },
        duration: 10,
        order: 5,
        isRequired: true
      },
      {
        id: 'ca-handover',
        type: 'interactive' as const,
        title: 'Shift Handover',
        description: 'Effective communication between shifts',
        content: {
          steps: [
            'Review handover notes from previous shift',
            'Add your own notes for next shift',
            'Flag urgent items',
            'Check action items assigned to you'
          ]
        },
        duration: 5,
        order: 6,
        isRequired: true
      }
    ],
    assessments: [
      {
        id: 'ca-quiz',
        title: 'Care Assistant App Knowledge Check',
        description: 'Quick quiz to confirm understanding',
        type: 'quiz' as const,
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice' as const,
            question: 'When should you record a carenote?',
            options: [
              'Only at the end of your shift',
              'Immediately after providing care',
              'Once per week',
              'Only for incidents'
            ],
            correctAnswer: 'Immediately after providing care',
            explanation: 'Real-time recording ensures accuracy and helps other staff provide continuous care.',
            points: 10,
            order: 1
          },
          {
            id: 'q2',
            type: 'multiple_choice' as const,
            question: 'What should you do if you spot a medicationerror?',
            options: [
              'Ignore it if it\'s minor',
              'Report it immediately through the app',
              'Tell a colleague verbally only',
              'Wait until the end of shift'
            ],
            correctAnswer: 'Report it immediately through the app',
            explanation: 'All medication errors must be reported immediately for resident safety.',
            points: 10,
            order: 2
          }
        ],
        passingScore: 80,
        timeLimit: 10,
        attemptsAllowed: 3,
        isRequired: true,
        order: 1
      }
    ],
    tags: ['onboarding', 'mobile_app', 'care_assistant', 'mandatory'],
    isActive: true
  },

  // ============================================================================
  // NURSE TRAINING
  // ============================================================================
  
  nurse_clinical_features: {
    title: 'WriteCarenotes for Nurses - Clinical Features',
    description: 'Master clinical documentation, medication management, and healthcare integrations.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'intermediate' as const,
    duration: 60,
    credits: 0,
    targetAudience: ['nurse', 'senior_nurse'],
    isMandatory: true,
    learningObjectives: [
      'Complete clinical assessments digitally',
      'Manage complex medication schedules',
      'Use GP Connect for resident health data',
      'Review and update care plans',
      'Monitor vital signs and trends',
      'Generate clinical reports for CQC'
    ],
    content: [
      {
        id: 'nurse-assessments',
        type: 'video' as const,
        title: 'Digital Clinical Assessments',
        description: 'Completing Waterlow, MUST, and other assessments',
        content: { videoUrl: '/training/videos/nurse-assessments.mp4' },
        duration: 15,
        order: 1,
        isRequired: true
      },
      {
        id: 'nurse-medications',
        type: 'interactive' as const,
        title: 'Advanced Medication Management',
        description: 'Complex regimens, PRN medications, and controlled drugs',
        content: {
          topics: [
            'variable dose medications',
            'PRN administration and recording',
            'Controlled drug management',
            'Medication reviews and interactions',
            'Ordering and stock management'
          ]
        },
        duration: 20,
        order: 2,
        isRequired: true
      },
      {
        id: 'nurse-gp-connect',
        type: 'video' as const,
        title: 'GP Connect Integration',
        description: 'Accessing NHS records and sharing information',
        content: { videoUrl: '/training/videos/nurse-gp-connect.mp4' },
        duration: 10,
        order: 3,
        isRequired: true
      },
      {
        id: 'nurse-care-plans',
        type: 'interactive' as const,
        title: 'Care Plan Management',
        description: 'Creating and updating person-centered care plans',
        content: {
          steps: [
            'Review resident needs assessment',
            'Set SMART goals with resident/family',
            'Document interventions and rationale',
            'Schedule reviews',
            'Track outcomes and adjust as needed'
          ]
        },
        duration: 15,
        order: 4,
        isRequired: true
      }
    ],
    assessments: [
      {
        id: 'nurse-quiz',
        title: 'Nurse Clinical Features Assessment',
        description: 'Verify competency with clinical tools',
        type: 'quiz' as const,
        questions: [
          {
            id: 'nq1',
            type: 'scenario' as const,
            question: 'A resident shows signs of deterioration. What should you do first in theapp?',
            options: [
              'Record observations and raise an alert',
              'Wait for the doctor\'s visit',
              'Tell a care assistant',
              'Update the care plan'
            ],
            correctAnswer: 'Record observations and raise an alert',
            explanation: 'Immediate recording and alerting ensures prompt clinical response.',
            points: 10,
            order: 1
          }
        ],
        passingScore: 80,
        timeLimit: 15,
        attemptsAllowed: 2,
        isRequired: true,
        order: 1
      }
    ],
    tags: ['clinical', 'nurse', 'medication', 'gp_connect', 'mandatory'],
    isActive: true
  },

  // ============================================================================
  // CARE MANAGER TRAINING
  // ============================================================================
  
  care_manager_oversight: {
    title: 'WriteCarenotes for Care Managers - Oversight & Compliance',
    description: 'Manage your team, monitor compliance, and prepare for CQC inspections.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'advanced' as const,
    duration: 90,
    credits: 0,
    targetAudience: ['care_manager', 'deputy_manager', 'registered_manager'],
    isMandatory: true,
    learningObjectives: [
      'Monitor team performance and compliance',
      'Generate CQC-ready reports',
      'Manage incidents and safeguarding',
      'Oversee training and competency',
      'Use analytics and dashboards',
      'Conduct digital audits and supervisions'
    ],
    content: [
      {
        id: 'cm-dashboard',
        type: 'video' as const,
        title: 'Manager Dashboard Overview',
        description: 'Your control center for home oversight',
        content: { videoUrl: '/training/videos/cm-dashboard.mp4' },
        duration: 10,
        order: 1,
        isRequired: true
      },
      {
        id: 'cm-compliance',
        type: 'interactive' as const,
        title: 'Compliance Monitoring',
        description: 'Track medication, care plans, and regulatory requirements',
        content: {
          features: [
            'Real-time compliance dashboard',
            'Overdue care plans and reviews',
            'Medication errors and near-misses',
            'Training matrix and expiry alerts',
            'Document management'
          ]
        },
        duration: 20,
        order: 2,
        isRequired: true
      },
      {
        id: 'cm-cqc-reports',
        type: 'video' as const,
        title: 'CQC Inspection Reports',
        description: 'Generate evidence for the 5 key questions',
        content: { videoUrl: '/training/videos/cm-cqc-reports.mp4' },
        duration: 15,
        order: 3,
        isRequired: true
      },
      {
        id: 'cm-incidents',
        type: 'interactive' as const,
        title: 'Incident Management',
        description: 'Record, investigate, and prevent incidents',
        content: {
          workflow: [
            'Receive incident notification',
            'Review initial report',
            'Assign investigation',
            'Document findings and actions',
            'Implement preventive measures',
            'Report to authorities if needed',
            'Monitor trends'
          ]
        },
        duration: 20,
        order: 4,
        isRequired: true
      },
      {
        id: 'cm-supervision',
        type: 'video' as const,
        title: 'Digital Supervision Records',
        description: 'Conduct and document staff supervisions',
        content: { videoUrl: '/training/videos/cm-supervision.mp4' },
        duration: 15,
        order: 5,
        isRequired: true
      },
      {
        id: 'cm-analytics',
        type: 'interactive' as const,
        title: 'Analytics & Business Intelligence',
        description: 'Use data to drive improvements',
        content: {
          reports: [
            'Occupancy and admissions trends',
            'Staff performance metrics',
            'Medication safety analytics',
            'Care quality indicators',
            'Financial performance'
          ]
        },
        duration: 10,
        order: 6,
        isRequired: true
      }
    ],
    assessments: [
      {
        id: 'cm-case-study',
        title: 'Manager Scenario Assessment',
        description: 'Apply knowledge to realistic scenarios',
        type: 'case_study' as const,
        questions: [
          {
            id: 'cm1',
            type: 'scenario' as const,
            question: 'CQC inspection in 2 days. How do you use WriteCarenotes toprepare?',
            options: [
              'Generate all reports last minute',
              'Run compliance dashboard, review red flags, generate evidence reports, brief team',
              'Panic and hide',
              'Just wing it'
            ],
            correctAnswer: 'Run compliance dashboard, review red flags, generate evidence reports, brief team',
            explanation: 'The app provides continuous compliance monitoring - use itproactively!',
            points: 20,
            order: 1
          }
        ],
        passingScore: 85,
        timeLimit: 30,
        attemptsAllowed: 2,
        isRequired: true,
        order: 1
      }
    ],
    tags: ['management', 'compliance', 'cqc', 'oversight', 'mandatory'],
    isActive: true
  },

  // ============================================================================
  // ACTIVITIES COORDINATOR TRAINING
  // ============================================================================
  
  activities_coordinator_features: {
    title: 'WriteCarenotes for Activities Coordinators',
    description: 'Plan, deliver, and record meaningful activities for residents.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'beginner' as const,
    duration: 30,
    credits: 0,
    targetAudience: ['activities_coordinator'],
    isMandatory: true,
    learningObjectives: [
      'Create activity schedules',
      'Record resident participation',
      'Track resident preferences and interests',
      'Use the activities calendar',
      'Generate engagement reports',
      'Involve families in activities'
    ],
    content: [
      {
        id: 'ac-planning',
        type: 'interactive' as const,
        title: 'Activity Planning',
        description: 'Create person-centered activity schedules',
        content: {
          steps: [
            'Review resident preferences',
            'Plan weekly activity schedule',
            'Invite residents and families',
            'Prepare resources',
            'Send reminders'
          ]
        },
        duration: 10,
        order: 1,
        isRequired: true
      },
      {
        id: 'ac-recording',
        type: 'video' as const,
        title: 'Recording Participation',
        description: 'Document engagement and outcomes',
        content: { videoUrl: '/training/videos/ac-recording.mp4' },
        duration: 10,
        order: 2,
        isRequired: true
      },
      {
        id: 'ac-reporting',
        type: 'interactive' as const,
        title: 'Activity Reports',
        description: 'Show impact of your activities program',
        content: {
          reports: [
            'Individual participation rates',
            'Activity type breakdown',
            'Engagement trends',
            'Family involvement',
            'Wellbeing outcomes'
          ]
        },
        duration: 10,
        order: 3,
        isRequired: true
      }
    ],
    assessments: [],
    tags: ['activities', 'engagement', 'wellbeing'],
    isActive: true
  },

  // ============================================================================
  // FAMILY PORTAL TRAINING
  // ============================================================================
  
  family_portal_access: {
    title: 'WriteCarenotes for Families - Staying Connected',
    description: 'Access your loved one\'s care information and communicate with the care team.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'beginner' as const,
    duration: 20,
    credits: 0,
    targetAudience: ['family_member'],
    isMandatory: false,
    learningObjectives: [
      'Access the family portal securely',
      'View care notes and photos',
      'Communicate with care staff',
      'Update resident preferences',
      'View activity participation',
      'Provide feedback'
    ],
    content: [
      {
        id: 'fp-access',
        type: 'interactive' as const,
        title: 'Accessing the Family Portal',
        description: 'Secure login and navigation',
        content: {
          steps: [
            'Receive invitation email from care home',
            'Create your account',
            'Set up two-factor authentication',
            'Download mobile app (optional)',
            'Explore your dashboard'
          ]
        },
        duration: 5,
        order: 1,
        isRequired: true
      },
      {
        id: 'fp-viewing',
        type: 'video' as const,
        title: 'Viewing Care Information',
        description: 'See how your loved one is doing',
        content: { videoUrl: '/training/videos/fp-viewing.mp4' },
        duration: 10,
        order: 2,
        isRequired: true
      },
      {
        id: 'fp-communication',
        type: 'interactive' as const,
        title: 'Communicating with Staff',
        description: 'Ask questions and share information',
        content: {
          features: [
            'Send messages to care team',
            'Update resident preferences',
            'Report concerns',
            'Provide feedback',
            'Book visits'
          ]
        },
        duration: 5,
        order: 3,
        isRequired: true
      }
    ],
    assessments: [],
    tags: ['family', 'portal', 'communication'],
    isActive: true
  },

  // ============================================================================
  // SELF-SERVE PORTAL - ESSENTIAL FOR ALL USERS
  // ============================================================================
  
  self_serve_portal_complete: {
    title: 'Your Self-Serve Portal - Profile, Preferences & Personal Settings',
    description: 'Learn how to manage your personal profile, update preferences, view your training history, and control your account settings.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'beginner' as const,
    duration: 20,
    credits: 0,
    targetAudience: ['all'],
    isMandatory: true,
    learningObjectives: [
      'Access and navigate your self-serve portal',
      'Update your personal profile and contact details',
      'Change your password and security settings',
      'Set notification preferences',
      'View your training history and certificates',
      'Manage time-off requests and availability',
      'Update emergency contact information'
    ],
    content: [
      {
        id: 'ssp-access',
        type: 'interactive' as const,
        title: 'Accessing Your Self-Serve Portal',
        description: 'How to find and navigate your personal settings',
        content: {
          steps: [
            'Tap your profile photo/initials in top-right corner',
            'Select "My Profile" from dropdown menu',
            'Explore the differentsections: Profile, Security, Preferences, Training, Documents',
            'Bookmark this page for quick access'
          ],
          tips: [
            'Your self-serve portal is accessible from any page',
            'Changes are saved automatically',
            'Some changes may require manager approval'
          ]
        },
        duration: 3,
        order: 1,
        isRequired: true
      },
      {
        id: 'ssp-profile',
        type: 'interactive' as const,
        title: 'Managing Your Profile',
        description: 'Update your personal information',
        content: {
          sections: [
            {
              name: 'Personal Details',
              fields: ['Name', 'Email', 'Phone', 'Address', 'Emergency contacts']
            },
            {
              name: 'Professional Info',
              fields: ['Job title', 'Department', 'Qualifications', 'Registration numbers (NMC, etc.)']
            },
            {
              name: 'Profile Photo',
              fields: ['Upload professional photo', 'Helps residents and families recognize you']
            }
          ],
          important: 'Keep your contact details up-to-date - especially emergencycontacts!'
        },
        duration: 5,
        order: 2,
        isRequired: true
      },
      {
        id: 'ssp-security',
        type: 'interactive' as const,
        title: 'Security & Password Management',
        description: 'Protect your account and patient data',
        content: {
          steps: [
            'Navigate to Security tab',
            'Click "Change Password"',
            'Enter current password + new password (min 12 characters)',
            'Enable two-factor authentication (2FA) for extra security',
            'Review active sessions and logout unused devices'
          ],
          passwordRequirements: [
            'Minimum 12 characters',
            'Mix of uppercase, lowercase, numbers, symbols',
            'No common words or personal information',
            'Change every 90 days (system will remind you)'
          ],
          gdprNote: 'Strong passwords protect resident data under GDPR/Data Protection Act'
        },
        duration: 4,
        order: 3,
        isRequired: true
      },
      {
        id: 'ssp-notifications',
        type: 'interactive' as const,
        title: 'Notification Preferences',
        description: 'Control how and when you receive updates',
        content: {
          notificationTypes: [
            {
              type: 'Email Notifications',
              options: ['Incidents', 'Training reminders', 'Rota changes', 'Messages']
            },
            {
              type: 'Push Notifications',
              options: ['Urgent alerts', 'Handover updates', 'Task assignments']
            },
            {
              type: 'SMS Notifications',
              options: ['Emergency calls', 'Shift reminders']
            }
          ],
          tip: 'Set quiet hours to avoid notifications during sleep'
        },
        duration: 3,
        order: 4,
        isRequired: true
      },
      {
        id: 'ssp-training',
        type: 'interactive' as const,
        title: 'Your Training History',
        description: 'View completed training and certificates',
        content: {
          features: [
            'View all completed training courses',
            'Download completion certificates (internal training)',
            'See training expiry dates',
            'Enroll in optional courses',
            'Track your CPD (Continuing Professional Development) hours',
            'Print training matrix for revalidation (nurses)'
          ],
          regulatoryNote: 'Required for inspections by CQC (England), Care Inspectorate (Scotland), CIW (Wales), RQIA (Northern Ireland), Jersey Care Commission, Guernsey Health Improvement Commission, and Isle of Man DHSC'
        },
        duration: 3,
        order: 5,
        isRequired: true
      },
      {
        id: 'ssp-availability',
        type: 'interactive' as const,
        title: 'Time-Off & Availability',
        description: 'Request annual leave and update your availability',
        content: {
          steps: [
            'Go to Availability tab',
            'Submit time-off request (annual leave, sick leave)',
            'View request status (pending/approved/rejected)',
            'Set regular unavailable days',
            'Update preferred shift patterns'
          ],
          note: 'Manager approval required for time-off requests'
        },
        duration: 2,
        order: 6,
        isRequired: false
      }
    ],
    assessments: [],
    tags: ['self_serve', 'profile', 'settings', 'mandatory', 'all_roles'],
    isActive: true
  },

  // ============================================================================
  // DOCUMENT MANAGEMENT - ALL ROLES
  // ============================================================================
  
  document_management_basics: {
    title: 'Document Management - Finding, Uploading & Organizing Files',
    description: 'Learn how to access policies, upload documents, and manage the document library.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'beginner' as const,
    duration: 25,
    credits: 0,
    targetAudience: ['care_assistant', 'nurse', 'care_manager', 'activities_coordinator'],
    isMandatory: true,
    learningObjectives: [
      'Navigate the document library',
      'Find policies and procedures quickly',
      'Upload new documents',
      'Version control and document approval',
      'Access resident-specific documents',
      'Understand document retention requirements (GDPR)'
    ],
    content: [
      {
        id: 'dm-navigation',
        type: 'interactive' as const,
        title: 'Navigating the Document Library',
        description: 'Find what you need quickly',
        content: {
          documentCategories: [
            'Policies & Procedures',
            'Care Plans',
            'Risk Assessments',
            'Resident Documents (admission, health records)',
            'Staff Documents (contracts, qualifications)',
            'Regulatory Documents (inspection reports from all regulators)',
            'Training Materials',
            'Forms & Templates'
          ],
          searchTips: [
            'Use search bar for quick access',
            'Filter by category, date, or author',
            'Star frequently used documents'
          ]
        },
        duration: 5,
        order: 1,
        isRequired: true
      },
      {
        id: 'dm-policies',
        type: 'interactive' as const,
        title: 'Accessing Policies & Procedures',
        description: 'Stay up-to-date with home policies',
        content: {
          steps: [
            'Go to Documents → Policies & Procedures',
            'Browse by category or search',
            'Click to view policy',
            'Check "Last Reviewed" date',
            'Acknowledge you\'ve read it (if required)',
            'Download PDF if needed'
          ],
          complianceNote: 'All care homes across the British Isles must have accessible policies for staff (regulatory requirement)'
        },
        duration: 5,
        order: 2,
        isRequired: true
      },
      {
        id: 'dm-uploading',
        type: 'interactive' as const,
        title: 'Uploading Documents',
        description: 'Add new files to the system',
        content: {
          steps: [
            'Navigate to appropriate category',
            'Click "Upload Document" button',
            'Select file from device (or drag & drop)',
            'Add document name and description',
            'Choose access permissions (who can view)',
            'Submit for approval (if required)'
          ],
          allowedFormats: ['PDF', 'Word', 'Excel', 'Images (JPG, PNG)', 'Videos (MP4)'],
          restrictions: [
            'Max filesize: 50MB',
            'Sensitive documents require encryption',
            'Manager approval needed for policies'
          ]
        },
        duration: 8,
        order: 3,
        isRequired: true
      },
      {
        id: 'dm-versions',
        type: 'interactive' as const,
        title: 'Version Control',
        description: 'Manage document updates',
        content: {
          features: [
            'System tracks all document versions',
            'View version history',
            'Restore previous versions if needed',
            'See who made changes and when',
            'Compare versions side-by-side'
          ],
          auditTrail: 'Required for regulatory compliance across all British Isles jurisdictions'
        },
        duration: 4,
        order: 4,
        isRequired: false
      },
      {
        id: 'dm-gdpr',
        type: 'interactive' as const,
        title: 'GDPR & Document Retention',
        description: 'Legal requirements for document storage',
        content: {
          retentionPeriods: [
            'Resident carerecords: 7 years after last contact',
            'Staff records: 6 years after employment ends',
            'Incident reports: Permanently (or as required by regulator)',
            'Training records: 3 years minimum'
          ],
          gdprPrinciples: [
            'Only store necessary documents',
            'Secure storage (encryption)',
            'Access controls (who can view)',
            'Regular review and deletion',
            'Audit trail of all access'
          ]
        },
        duration: 3,
        order: 5,
        isRequired: true
      }
    ],
    assessments: [],
    tags: ['documents', 'policies', 'gdpr', 'compliance', 'mandatory'],
    isActive: true
  },

  // ============================================================================
  // ROTA & SCHEDULING
  // ============================================================================
  
  rota_scheduling_staff: {
    title: 'Rota & Scheduling - View Your Shifts & Manage Availability',
    description: 'Learn how to view your rota, swap shifts, and manage your availability.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'beginner' as const,
    duration: 15,
    credits: 0,
    targetAudience: ['care_assistant', 'nurse', 'activities_coordinator'],
    isMandatory: true,
    learningObjectives: [
      'View your upcoming shifts',
      'Request shift swaps',
      'Update your availability',
      'Clock in/out for shifts',
      'View shift handover notes',
      'Request additional shifts'
    ],
    content: [
      {
        id: 'rota-viewing',
        type: 'interactive' as const,
        title: 'Viewing Your Rota',
        description: 'See your schedule at a glance',
        content: {
          steps: [
            'Go to "My Rota" from main menu',
            'View calendar showing your shifts',
            'Tap any shift for details (time, location, colleagues)',
            'See color-coded shift types (early, late, night, on-call)',
            'Export to personal calendar (Google/Outlook)'
          ],
          views: ['Day', 'Week', 'Month', 'List']
        },
        duration: 5,
        order: 1,
        isRequired: true
      },
      {
        id: 'rota-shifts',
        type: 'interactive' as const,
        title: 'Managing Shift Swaps',
        description: 'Exchange shifts with colleagues',
        content: {
          steps: [
            'Select shift you want to swap',
            'Tap "Request Swap"',
            'System shows eligible staff (same role, available)',
            'Select colleague and add message',
            'Colleague approves/declines',
            'Manager gives final approval',
            'Both rotas update automatically'
          ],
          rules: [
            'Minimum 48 hours notice (unless emergency)',
            'Must be same role/qualification level',
            'Manager approval required',
            'Maximum 2 swaps per month'
          ]
        },
        duration: 6,
        order: 2,
        isRequired: true
      },
      {
        id: 'rota-clock',
        type: 'interactive' as const,
        title: 'Clocking In/Out',
        description: 'Record your attendance',
        content: {
          steps: [
            'Open app when arriving for shift',
            'Tap "Clock In" button',
            'System records time and location',
            'At end of shift, tap "Clock Out"',
            'Review hours worked',
            'Add notes if needed (late arrival reason, etc.)'
          ],
          compliance: 'Required for payroll and compliance with Working Time Regulations (applies across British Isles with local var iations)'
        },
        duration: 4,
        order: 3,
        isRequired: true
      }
    ],
    assessments: [],
    tags: ['rota', 'scheduling', 'shifts', 'mandatory'],
    isActive: true
  },

  // ============================================================================
  // COMMUNICATION HUB
  // ============================================================================
  
  communication_hub_essentials: {
    title: 'Communication Hub - Messages, Announcements & Team Chat',
    description: 'Stay connected with your team through secure messaging and announcements.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'beginner' as const,
    duration: 15,
    credits: 0,
    targetAudience: ['all'],
    isMandatory: true,
    learningObjectives: [
      'Send and receive secure messages',
      'View home-wide announcements',
      'Use team chat for shift communication',
      'Share photos and files securely',
      'Understand message confidentiality (GDPR)'
    ],
    content: [
      {
        id: 'comm-messages',
        type: 'interactive' as const,
        title: 'Secure Messaging',
        description: 'Communicate safely with colleagues',
        content: {
          steps: [
            'Go to Messages tab',
            'Tap "New Message" button',
            'Select recipient (individual or group)',
            'Type message (avoid resident identifiable info)',
            'Attach files if needed',
            'Send - recipient gets notification'
          ],
          security: [
            'All messages encrypted end-to-end',
            'Cannot forward outside organization',
            'Auto-delete after 90 days (configurable)',
            'Audit trail for compliance'
          ],
          gdprWarning: 'Never include resident names in messages - use room numbers/initials'
        },
        duration: 6,
        order: 1,
        isRequired: true
      },
      {
        id: 'comm-announcements',
        type: 'interactive' as const,
        title: 'Home-Wide Announcements',
        description: 'Stay informed about important updates',
        content: {
          types: [
            'Policy updates',
            'Training reminders',
            'Event notifications',
            'Emergency procedures',
            'Regulatory inspection notices'
          ],
          actions: [
            'Read announcements on dashboard',
            'Acknowledge important notices',
            'Comment or ask questions',
            'Set notification preferences'
          ]
        },
        duration: 4,
        order: 2,
        isRequired: true
      },
      {
        id: 'comm-team-chat',
        type: 'interactive' as const,
        title: 'Team Chat for Shifts',
        description: 'Real-time communication during shifts',
        content: {
          features: [
            'Shift-specific chat rooms (auto-created)',
            'Quick updates and questions',
            'Share handover notes',
            'Request assistance',
            'Tag specific team members (@mention)'
          ],
          bestPractices: [
            'Use for quick operational updates',
            'Log formal concerns in incident system',
            'Be professional - chats are monitored',
            'Respect colleagues\' time'
          ]
        },
        duration: 5,
        order: 3,
        isRequired: true
      }
    ],
    assessments: [],
    tags: ['communication', 'messaging', 'announcements', 'mandatory'],
    isActive: true
  },

  // ============================================================================
  // INCIDENT REPORTING (DETAILED)
  // ============================================================================
  
  incident_reporting_comprehensive: {
    title: 'Incident Reporting - Complete Guide for All Staff',
    description: 'Learn how to report incidents, accidents, near-misses, and safeguarding concerns properly.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'intermediate' as const,
    duration: 30,
    credits: 0,
    targetAudience: ['care_assistant', 'nurse', 'care_manager'],
    isMandatory: true,
    learningObjectives: [
      'Recognize what const itutes an incident',
      'Report incidents immediately using the app',
      'Complete incident forms correctly',
      'Understand safeguarding reporting requirements',
      'Know when to escalate to managers/authorities',
      'Follow up on incident investigations'
    ],
    content: [
      {
        id: 'inc-types',
        type: 'interactive' as const,
        title: 'Types of Incidents to Report',
        description: 'What must be reported',
        content: {
          categories: [
            {
              type: 'Accidents & Injuries',
              examples: ['Falls', 'Skin tears', 'Burns', 'Choking', 'Head injuries']
            },
            {
              type: 'Medication Errors',
              examples: ['Wrong dose', 'Missed dose', 'Wrong resident', 'Wrong time']
            },
            {
              type: 'Safeguarding Concerns',
              examples: ['Suspected abuse', 'Neglect', 'Financial exploitation', 'Self-neglect']
            },
            {
              type: 'Near Misses',
              examples: ['Almost fell', 'Wrong medication caught before given', 'Equipment malfunction']
            },
            {
              type: 'Environmental',
              examples: ['Broken equipment', 'Hazards', 'Security breaches']
            },
            {
              type: 'Behavior',
              examples: ['Aggression', 'Self-harm', 'Absconding attempts']
            }
          ],
          rule: 'If in doubt, reportit! Better to over-report than miss something important.'
        },
        duration: 8,
        order: 1,
        isRequired: true
      },
      {
        id: 'inc-reporting',
        type: 'interactive' as const,
        title: 'How to Report an Incident',
        description: 'Step-by-step reporting process',
        content: {
          immediateActions: [
            '1. Ensure safety (resident, yourself, others)',
            '2. Provide first aid/call 999 if needed',
            '3. Inform senior staff immediately',
            '4. Preserve evidence (don\'t move items, take photos if safe)'
          ],
          reportingSteps: [
            '1. Open app and go to "Incidents"',
            '2. Tap "New Incident Report"',
            '3. Select incident type and severity',
            '4. Complete all requiredfields:',
            '   - Date/time (exact)',
            '   - Location (specific room/area)',
            '   - People involved',
            '   - Detailed description (what you saw/heard)',
            '   - Immediate actions taken',
            '   - Injuries/outcomes',
            '5. Add photos if relevant (wounds, hazards)',
            '6. Submit report',
            '7. Notify manager verbally as well'
          ],
          timing: 'Report immediately - within 1 hour of incident for serious events'
        },
        duration: 10,
        order: 2,
        isRequired: true
      },
      {
        id: 'inc-safeguarding',
        type: 'interactive' as const,
        title: 'Safeguarding Reporting',
        description: 'Special requirements for safeguarding',
        content: {
          definition: 'Safeguarding = protecting adults at risk from abuse and neglect',
          mustReport: [
            'Any suspicion of abuse (physical, emotional, sexual, financial)',
            'Neglect or acts of omission',
            'Discriminatory abuse',
            'Domestic violence',
            'Modern slavery',
            'Self-neglect',
            'Organizational abuse'
          ],
          process: [
            '1. Report to manager immediately (do not confront alleged abuser)',
            '2. Complete safeguarding form in app (separate from incident report)',
            '3. Manager contacts local authority safeguarding team',
            '4. Manager notifies relevant regulator within required timeframe (24 hours in most jurisdictions)',
            '5. Cooperate with investigation',
            '6. Maintain confidentiality'
          ],
          legal: 'Failure to report safeguarding concerns is a serious offence - legal requirements apply across all British Isles jurisdictions'
        },
        duration: 8,
        order: 3,
        isRequired: true
      },
      {
        id: 'inc-followup',
        type: 'interactive' as const,
        title: 'Incident Follow-Up',
        description: 'What happens after you report',
        content: {
          workflow: [
            'Manager reviews report within 4 hours',
            'Investigation assigned if needed',
            'You may be interviewed for details',
            'Root cause analysis conducted',
            'Preventive measures identified',
            'Staff training/policy updates if needed',
            'Report outcome communicated to you',
            'Incident closed with lessons learned'
          ],
          yourRole: [
            'Provide honest, detailed information',
            'Cooperate with investigation',
            'Maintain confidentiality',
            'Learn from outcome',
            'Implement any changes identified'
          ]
        },
        duration: 4,
        order: 4,
        isRequired: true
      }
    ],
    assessments: [
      {
        id: 'inc-quiz',
        title: 'Incident Reporting Knowledge Check',
        description: 'Test your understanding of incident reporting',
        type: 'quiz' as const,
        questions: [
          {
            id: 'iq1',
            type: 'multiple_choice' as const,
            question: 'A resident has a minor fall with no injuries. What should youdo?',
            options: [
              'Ignore it - no harm done',
              'Report it immediately using the app',
              'Wait until end of shift to report',
              'Tell a colleague but don\'t report formally'
            ],
            correctAnswer: 'Report it immediately using the app',
            explanation: 'All falls must be reported immediately, even without injury, to identify patterns and prevent future falls.',
            points: 10,
            order: 1
          },
          {
            id: 'iq2',
            type: 'multiple_choice' as const,
            question: 'You suspect a resident is being financially exploited by a family member. What do youdo?',
            options: [
              'Confront the family member',
              'Tell other staff members',
              'Report to manager immediately as safeguarding concern',
              'Mind your own business'
            ],
            correctAnswer: 'Report to manager immediately as safeguarding concern',
            explanation: 'Financial abuse is a safeguarding issue requiring immediate reporting to manager who will contact local authority.',
            points: 10,
            order: 2
          }
        ],
        passingScore: 80,
        timeLimit: 10,
        attemptsAllowed: 3,
        isRequired: true,
        order: 1
      }
    ],
    tags: ['incidents', 'safeguarding', 'compliance', 'mandatory', 'safety'],
    isActive: true
  },

  // ============================================================================
  // SYSTEM UPDATE NOTIFICATIONS
  // ============================================================================
  
  app_update_template: {
    title: '[AUTO-GENERATED] New Features Available',
    description: 'Learn about the latest WriteCarenotes updates and how they improve your workflow.',
    category: 'app_usage' as const,
    trainingType: 'internal_app' as const,
    level: 'beginner' as const,
    duration: 10,
    credits: 0,
    targetAudience: ['all'],
    isMandatory: false,
    learningObjectives: [
      'Understand new features released',
      'Learn how to use updated functionality',
      'Adapt workflows to take advantage of improvements'
    ],
    content: [
      {
        id: 'update-overview',
        type: 'text' as const,
        title: 'What\'s New',
        description: 'Summary of recent updates',
        content: {
          markdown: `
# Latest Updates to WriteCarenotes

## [Release Date: Auto-populated]

### New Features
- Feature 1: Description
- Feature 2: Description  
- Feature 3: Description

### Improvements
- Improvement 1
- Improvement 2

### Bug Fixes
- Fix 1
- Fix 2

### What This Means for You
- Benefit 1
- Benefit 2

### How to Get Started
1. Step 1
2. Step 2
3. Step 3

### NeedHelp?
Contact your manager or email support@writecarenotes.com
          `
        },
        duration: 10,
        order: 1,
        isRequired: false
      }
    ],
    assessments: [],
    tags: ['updates', 'features', 'changelog'],
    isActive: false // Activated when updates are released
  }
};

/**
 * Role-based training assignment rules
 * Updated to include ALL microservices and self-serve portal
 */
export const ROLE_TRAINING_REQUIREMENTS = {
  care_assistant: [
    'self_serve_portal_complete',        // NEW - Essential for all
    'care_assistant_onboarding',
    'document_management_basics',         // NEW - Find policies
    'rota_scheduling_staff',              // NEW - View shifts
    'communication_hub_essentials',       // NEW - Team messaging
    'incident_reporting_comprehensive'    // NEW - Safety critical
  ],
  nurse: [
    'self_serve_portal_complete',        // NEW
    'care_assistant_onboarding',         // Nurses do care work too
    'nurse_clinical_features',
    'document_management_basics',         // NEW
    'rota_scheduling_staff',              // NEW
    'communication_hub_essentials',       // NEW
    'incident_reporting_comprehensive'    // NEW
  ],
  senior_nurse: [
    'self_serve_portal_complete',        // NEW
    'care_assistant_onboarding',
    'nurse_clinical_features',
    'document_management_basics',         // NEW
    'rota_scheduling_staff',              // NEW
    'communication_hub_essentials',       // NEW
    'incident_reporting_comprehensive'    // NEW
  ],
  care_manager: [
    'self_serve_portal_complete',        // NEW
    'care_assistant_onboarding',         // Understand frontline work
    'nurse_clinical_features',           // Oversee clinical care
    'care_manager_oversight',
    'document_management_basics',         // NEW
    'communication_hub_essentials',       // NEW
    'incident_reporting_comprehensive'    // NEW
  ],
  deputy_manager: [
    'self_serve_portal_complete',        // NEW
    'care_assistant_onboarding',
    'nurse_clinical_features',
    'care_manager_oversight',
    'document_management_basics',         // NEW
    'communication_hub_essentials',       // NEW
    'incident_reporting_comprehensive'    // NEW
  ],
  registered_manager: [
    'self_serve_portal_complete',        // NEW
    'care_assistant_onboarding',
    'nurse_clinical_features',
    'care_manager_oversight',
    'document_management_basics',         // NEW
    'communication_hub_essentials',       // NEW
    'incident_reporting_comprehensive'    // NEW
  ],
  activities_coordinator: [
    'self_serve_portal_complete',        // NEW
    'care_assistant_onboarding',         // Understand care context
    'activities_coordinator_features',
    'document_management_basics',         // NEW
    'rota_scheduling_staff',              // NEW
    'communication_hub_essentials'        // NEW
  ],
  maintenance: [
    'self_serve_portal_complete',        // NEW
    'care_assistant_onboarding',         // Basic app usage
    'communication_hub_essentials'        // NEW
  ],
  kitchen_staff: [
    'self_serve_portal_complete',        // NEW
    'care_assistant_onboarding',         // Basic app usage
    'rota_scheduling_staff',              // NEW
    'communication_hub_essentials'        // NEW
  ],
  family_member: [
    'family_portal_access'
  ]
};

/**
 * Auto-assign training when user role changes or new modules are added
 */
export function getRequiredTrainingForRole(role: string): string[] {
  return ROLE_TRAINING_REQUIREMENTS[role as keyof typeof ROLE_TRAINING_REQUIREMENTS] || [];
}

/**
 * Check if user needs update training
 */
export function shouldAssignUpdateTraining(lastLoginDate: Date, lastUpdateReleaseDate: Date): boolean {
  return lastLoginDate < lastUpdateReleaseDate;
}
