import { DataSource } from 'typeorm';
import { logger } from '../src/utils/logger';

/**
 * Comprehensive Demo Data Seeder
 * Creates realistic demo data for WriteCareNotes platform
 */
export class ComprehensiveDemoDataSeeder {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async seed(): Promise<void> {
    logger.info('Starting comprehensive demo data seeding...');

    try {
      // Seed organizations
      await this.seedOrganizations();
      
      // Seed users
      await this.seedUsers();
      
      // Seed residents
      await this.seedResidents();
      
      // Seed care plans
      await this.seedCarePlans();
      
      // Seed medications
      await this.seedMedications();
      
      // Seed incidents
      await this.seedIncidents();
      
      // Seed compliance data
      await this.seedComplianceData();
      
      // Seed financial data
      await this.seedFinancialData();
      
      // Seed workforce data
      await this.seedWorkforceData();
      
      // Seed facilities data
      await this.seedFacilitiesData();
      
      // Seed AI agent data
      await this.seedAIAgentData();

      logger.info('Comprehensive demo data seeding completed successfully');
    } catch (error) {
      logger.error('Failed to seed demo data', { error });
      throw error;
    }
  }

  private async seedOrganizations(): Promise<void> {
    logger.info('Seeding organizations...');

    const organizations = [
      {
        id: 'org-1',
        name: 'Sunrise Care Home',
        type: 'care_home',
        address: {
          line1: '123 Care Street',
          line2: 'Sunrise District',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom'
        },
        contactDetails: {
          phone: '+44 20 7123 4567',
          email: 'info@sunrisecare.co.uk',
          website: 'https://www.sunrisecare.co.uk'
        },
        registrationNumber: 'CQC-123456',
        cqcRating: 'Outstanding',
        capacity: 50,
        currentOccupancy: 42,
        establishedDate: new Date('2010-05-15'),
        jurisdiction: 'England',
        complianceStatus: 'compliant',
        features: ['dementia_care', 'palliative_care', 'respite_care', 'day_care'],
        services: ['nursing_care', 'personal_care', 'medication_management', 'meal_provision'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'org-2',
        name: 'Highland Manor',
        type: 'care_home',
        address: {
          line1: '456 Highland Road',
          line2: 'Rural Area',
          city: 'Edinburgh',
          postcode: 'EH1 1AA',
          country: 'Scotland'
        },
        contactDetails: {
          phone: '+44 131 123 4567',
          email: 'info@highlandmanor.co.uk',
          website: 'https://www.highlandmanor.co.uk'
        },
        registrationNumber: 'CIW-789012',
        cqcRating: 'Good',
        capacity: 30,
        currentOccupancy: 28,
        establishedDate: new Date('2015-03-20'),
        jurisdiction: 'Scotland',
        complianceStatus: 'compliant',
        features: ['dementia_care', 'respite_care'],
        services: ['personal_care', 'medication_management', 'meal_provision'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'org-3',
        name: 'Welsh Valley Care',
        type: 'care_home',
        address: {
          line1: '789 Valley View',
          line2: 'Cardiff District',
          city: 'Cardiff',
          postcode: 'CF1 1AA',
          country: 'Wales'
        },
        contactDetails: {
          phone: '+44 29 123 4567',
          email: 'info@welshvalleycare.co.uk',
          website: 'https://www.welshvalleycare.co.uk'
        },
        registrationNumber: 'CIW-345678',
        cqcRating: 'Good',
        capacity: 40,
        currentOccupancy: 35,
        establishedDate: new Date('2018-08-10'),
        jurisdiction: 'Wales',
        complianceStatus: 'compliant',
        features: ['dementia_care', 'palliative_care', 'respite_care'],
        services: ['nursing_care', 'personal_care', 'medication_management', 'meal_provision'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert organizations (assuming you have an Organization entity)
    for (const org of organizations) {
      await this.dataSource.query(`
        INSERT INTO organizations (id, name, type, address, contact_details, registration_number, cqc_rating, capacity, current_occupancy, established_date, jurisdiction, compliance_status, features, services, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          address = EXCLUDED.address,
          contact_details = EXCLUDED.contact_details,
          registration_number = EXCLUDED.registration_number,
          cqc_rating = EXCLUDED.cqc_rating,
          capacity = EXCLUDED.capacity,
          current_occupancy = EXCLUDED.current_occupancy,
          established_date = EXCLUDED.established_date,
          jurisdiction = EXCLUDED.jurisdiction,
          compliance_status = EXCLUDED.compliance_status,
          features = EXCLUDED.features,
          services = EXCLUDED.services,
          updated_at = EXCLUDED.updated_at
      `, [
        org.id, org.name, org.type, JSON.stringify(org.address), JSON.stringify(org.contactDetails),
        org.registrationNumber, org.cqcRating, org.capacity, org.currentOccupancy, org.establishedDate,
        org.jurisdiction, org.complianceStatus, JSON.stringify(org.features), JSON.stringify(org.services),
        org.createdAt, org.updatedAt
      ]);
    }

    logger.info(`Seeded ${organizations.length} organizations`);
  }

  private async seedUsers(): Promise<void> {
    logger.info('Seeding users...');

    const users = [
      {
        id: 'user-1',
        email: 'admin@sunrisecare.co.uk',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'admin',
        organizationId: 'org-1',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-2',
        email: 'nurse@sunrisecare.co.uk',
        firstName: 'Michael',
        lastName: 'Brown',
        role: 'nurse',
        organizationId: 'org-1',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-3',
        email: 'carer@sunrisecare.co.uk',
        firstName: 'Emma',
        lastName: 'Wilson',
        role: 'carer',
        organizationId: 'org-1',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-4',
        email: 'manager@highlandmanor.co.uk',
        firstName: 'David',
        lastName: 'Smith',
        role: 'manager',
        organizationId: 'org-2',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-5',
        email: 'nurse@welshvalleycare.co.uk',
        firstName: 'Lisa',
        lastName: 'Davis',
        role: 'nurse',
        organizationId: 'org-3',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const user of users) {
      await this.dataSource.query(`
        INSERT INTO users (id, email, first_name, last_name, role, organization_id, is_active, last_login, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          organization_id = EXCLUDED.organization_id,
          is_active = EXCLUDED.is_active,
          last_login = EXCLUDED.last_login,
          updated_at = EXCLUDED.updated_at
      `, [
        user.id, user.email, user.firstName, user.lastName, user.role,
        user.organizationId, user.isActive, user.lastLogin, user.createdAt, user.updatedAt
      ]);
    }

    logger.info(`Seeded ${users.length} users`);
  }

  private async seedResidents(): Promise<void> {
    logger.info('Seeding residents...');

    const residents = [
      {
        id: 'resident-1',
        nhsNumber: '1234567890',
        firstName: 'Margaret',
        lastName: 'Thompson',
        dateOfBirth: new Date('1935-03-15'),
        gender: 'female',
        organizationId: 'org-1',
        roomNumber: '101',
        careLevel: 'nursing',
        admissionDate: new Date('2023-01-15'),
        status: 'active',
        medicalConditions: ['dementia', 'hypertension', 'diabetes'],
        allergies: ['penicillin', 'shellfish'],
        emergencyContact: {
          name: 'John Thompson',
          relationship: 'son',
          phone: '+44 7700 900123',
          email: 'john.thompson@email.com'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'resident-2',
        nhsNumber: '2345678901',
        firstName: 'Robert',
        lastName: 'Williams',
        dateOfBirth: new Date('1940-07-22'),
        gender: 'male',
        organizationId: 'org-1',
        roomNumber: '102',
        careLevel: 'personal',
        admissionDate: new Date('2023-02-10'),
        status: 'active',
        medicalConditions: ['arthritis', 'heart_disease'],
        allergies: ['aspirin'],
        emergencyContact: {
          name: 'Mary Williams',
          relationship: 'daughter',
          phone: '+44 7700 900234',
          email: 'mary.williams@email.com'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'resident-3',
        nhsNumber: '3456789012',
        firstName: 'Dorothy',
        lastName: 'Brown',
        dateOfBirth: new Date('1938-11-08'),
        gender: 'female',
        organizationId: 'org-2',
        roomNumber: '201',
        careLevel: 'nursing',
        admissionDate: new Date('2023-03-05'),
        status: 'active',
        medicalConditions: ['dementia', 'parkinsons'],
        allergies: [],
        emergencyContact: {
          name: 'James Brown',
          relationship: 'son',
          phone: '+44 7700 900345',
          email: 'james.brown@email.com'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const resident of residents) {
      await this.dataSource.query(`
        INSERT INTO residents (id, nhs_number, first_name, last_name, date_of_birth, gender, organization_id, room_number, care_level, admission_date, status, medical_conditions, allergies, emergency_contact, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          nhs_number = EXCLUDED.nhs_number,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          date_of_birth = EXCLUDED.date_of_birth,
          gender = EXCLUDED.gender,
          organization_id = EXCLUDED.organization_id,
          room_number = EXCLUDED.room_number,
          care_level = EXCLUDED.care_level,
          admission_date = EXCLUDED.admission_date,
          status = EXCLUDED.status,
          medical_conditions = EXCLUDED.medical_conditions,
          allergies = EXCLUDED.allergies,
          emergency_contact = EXCLUDED.emergency_contact,
          updated_at = EXCLUDED.updated_at
      `, [
        resident.id, resident.nhsNumber, resident.firstName, resident.lastName, resident.dateOfBirth,
        resident.gender, resident.organizationId, resident.roomNumber, resident.careLevel,
        resident.admissionDate, resident.status, JSON.stringify(resident.medicalConditions),
        JSON.stringify(resident.allergies), JSON.stringify(resident.emergencyContact),
        resident.createdAt, resident.updatedAt
      ]);
    }

    logger.info(`Seeded ${residents.length} residents`);
  }

  private async seedCarePlans(): Promise<void> {
    logger.info('Seeding care plans...');

    const carePlans = [
      {
        id: 'careplan-1',
        residentId: 'resident-1',
        organizationId: 'org-1',
        title: 'Dementia Care Plan',
        type: 'dementia',
        status: 'active',
        startDate: new Date('2023-01-15'),
        endDate: null,
        goals: [
          'Maintain cognitive function',
          'Ensure safety and security',
          'Promote independence where possible'
        ],
        interventions: [
          'Daily cognitive stimulation activities',
          'Regular safety checks',
          'Medication management support'
        ],
        createdBy: 'user-2',
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'careplan-2',
        residentId: 'resident-2',
        organizationId: 'org-1',
        title: 'Personal Care Plan',
        type: 'personal',
        status: 'active',
        startDate: new Date('2023-02-10'),
        endDate: null,
        goals: [
          'Maintain mobility',
          'Manage pain effectively',
          'Promote social engagement'
        ],
        interventions: [
          'Daily physiotherapy exercises',
          'Pain management medication',
          'Social activities participation'
        ],
        createdBy: 'user-2',
        lastReviewed: new Date(),
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const carePlan of carePlans) {
      await this.dataSource.query(`
        INSERT INTO care_plans (id, resident_id, organization_id, title, type, status, start_date, end_date, goals, interventions, created_by, last_reviewed, next_review, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          resident_id = EXCLUDED.resident_id,
          organization_id = EXCLUDED.organization_id,
          title = EXCLUDED.title,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          goals = EXCLUDED.goals,
          interventions = EXCLUDED.interventions,
          created_by = EXCLUDED.created_by,
          last_reviewed = EXCLUDED.last_reviewed,
          next_review = EXCLUDED.next_review,
          updated_at = EXCLUDED.updated_at
      `, [
        carePlan.id, carePlan.residentId, carePlan.organizationId, carePlan.title, carePlan.type,
        carePlan.status, carePlan.startDate, carePlan.endDate, JSON.stringify(carePlan.goals),
        JSON.stringify(carePlan.interventions), carePlan.createdBy, carePlan.lastReviewed,
        carePlan.nextReview, carePlan.createdAt, carePlan.updatedAt
      ]);
    }

    logger.info(`Seeded ${carePlans.length} care plans`);
  }

  private async seedMedications(): Promise<void> {
    logger.info('Seeding medications...');

    const medications = [
      {
        id: 'med-1',
        residentId: 'resident-1',
        organizationId: 'org-1',
        name: 'Donepezil',
        dosage: '5mg',
        frequency: 'once daily',
        route: 'oral',
        prescribedBy: 'Dr. Smith',
        startDate: new Date('2023-01-15'),
        endDate: null,
        status: 'active',
        purpose: 'Dementia treatment',
        sideEffects: ['nausea', 'diarrhea'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'med-2',
        residentId: 'resident-1',
        organizationId: 'org-1',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily',
        route: 'oral',
        prescribedBy: 'Dr. Smith',
        startDate: new Date('2023-01-15'),
        endDate: null,
        status: 'active',
        purpose: 'Diabetes management',
        sideEffects: ['stomach upset'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'med-3',
        residentId: 'resident-2',
        organizationId: 'org-1',
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'three times daily',
        route: 'oral',
        prescribedBy: 'Dr. Jones',
        startDate: new Date('2023-02-10'),
        endDate: null,
        status: 'active',
        purpose: 'Pain management',
        sideEffects: ['stomach irritation'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const medication of medications) {
      await this.dataSource.query(`
        INSERT INTO medications (id, resident_id, organization_id, name, dosage, frequency, route, prescribed_by, start_date, end_date, status, purpose, side_effects, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          resident_id = EXCLUDED.resident_id,
          organization_id = EXCLUDED.organization_id,
          name = EXCLUDED.name,
          dosage = EXCLUDED.dosage,
          frequency = EXCLUDED.frequency,
          route = EXCLUDED.route,
          prescribed_by = EXCLUDED.prescribed_by,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          status = EXCLUDED.status,
          purpose = EXCLUDED.purpose,
          side_effects = EXCLUDED.side_effects,
          updated_at = EXCLUDED.updated_at
      `, [
        medication.id, medication.residentId, medication.organizationId, medication.name,
        medication.dosage, medication.frequency, medication.route, medication.prescribedBy,
        medication.startDate, medication.endDate, medication.status, medication.purpose,
        JSON.stringify(medication.sideEffects), medication.createdAt, medication.updatedAt
      ]);
    }

    logger.info(`Seeded ${medications.length} medications`);
  }

  private async seedIncidents(): Promise<void> {
    logger.info('Seeding incidents...');

    const incidents = [
      {
        id: 'incident-1',
        residentId: 'resident-1',
        organizationId: 'org-1',
        type: 'fall',
        severity: 'medium',
        description: 'Resident fell in bathroom, no injury sustained',
        location: 'Bathroom - Room 101',
        reportedBy: 'user-3',
        reportedAt: new Date('2023-12-01T14:30:00Z'),
        status: 'resolved',
        actions: [
          'Assisted resident to bed',
          'Checked for injuries',
          'Updated care plan'
        ],
        followUpRequired: true,
        followUpDate: new Date('2023-12-08T14:30:00Z'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'incident-2',
        residentId: 'resident-2',
        organizationId: 'org-1',
        type: 'medication_error',
        severity: 'low',
        description: 'Medication given 30 minutes late',
        location: 'Medication Room',
        reportedBy: 'user-2',
        reportedAt: new Date('2023-12-02T09:15:00Z'),
        status: 'resolved',
        actions: [
          'Administered correct medication',
          'Updated medication schedule',
          'Reviewed procedures with staff'
        ],
        followUpRequired: false,
        followUpDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const incident of incidents) {
      await this.dataSource.query(`
        INSERT INTO incidents (id, resident_id, organization_id, type, severity, description, location, reported_by, reported_at, status, actions, follow_up_required, follow_up_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          resident_id = EXCLUDED.resident_id,
          organization_id = EXCLUDED.organization_id,
          type = EXCLUDED.type,
          severity = EXCLUDED.severity,
          description = EXCLUDED.description,
          location = EXCLUDED.location,
          reported_by = EXCLUDED.reported_by,
          reported_at = EXCLUDED.reported_at,
          status = EXCLUDED.status,
          actions = EXCLUDED.actions,
          follow_up_required = EXCLUDED.follow_up_required,
          follow_up_date = EXCLUDED.follow_up_date,
          updated_at = EXCLUDED.updated_at
      `, [
        incident.id, incident.residentId, incident.organizationId, incident.type, incident.severity,
        incident.description, incident.location, incident.reportedBy, incident.reportedAt,
        incident.status, JSON.stringify(incident.actions), incident.followUpRequired,
        incident.followUpDate, incident.createdAt, incident.updatedAt
      ]);
    }

    logger.info(`Seeded ${incidents.length} incidents`);
  }

  private async seedComplianceData(): Promise<void> {
    logger.info('Seeding compliance data...');

    const complianceRecords = [
      {
        id: 'compliance-1',
        organizationId: 'org-1',
        type: 'cqc_inspection',
        status: 'compliant',
        score: 95,
        inspectionDate: new Date('2023-11-15'),
        inspector: 'CQC Inspector',
        findings: [
          'Excellent care standards',
          'Good medication management',
          'Outstanding staff training'
        ],
        recommendations: [
          'Continue current practices',
          'Consider additional staff training'
        ],
        nextInspection: new Date('2024-11-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'compliance-2',
        organizationId: 'org-1',
        type: 'gdpr_audit',
        status: 'compliant',
        score: 98,
        auditDate: new Date('2023-10-20'),
        auditor: 'Data Protection Officer',
        findings: [
          'Excellent data protection measures',
          'Good consent management',
          'Secure data storage'
        ],
        recommendations: [
          'Review data retention policies',
          'Update privacy notices'
        ],
        nextAudit: new Date('2024-10-20'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const record of complianceRecords) {
      await this.dataSource.query(`
        INSERT INTO compliance_records (id, organization_id, type, status, score, inspection_date, inspector, findings, recommendations, next_inspection, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          score = EXCLUDED.score,
          inspection_date = EXCLUDED.inspection_date,
          inspector = EXCLUDED.inspector,
          findings = EXCLUDED.findings,
          recommendations = EXCLUDED.recommendations,
          next_inspection = EXCLUDED.next_inspection,
          updated_at = EXCLUDED.updated_at
      `, [
        record.id, record.organizationId, record.type, record.status, record.score,
        record.inspectionDate, record.inspector, JSON.stringify(record.findings),
        JSON.stringify(record.recommendations), record.nextInspection, record.createdAt, record.updatedAt
      ]);
    }

    logger.info(`Seeded ${complianceRecords.length} compliance records`);
  }

  private async seedFinancialData(): Promise<void> {
    logger.info('Seeding financial data...');

    const financialRecords = [
      {
        id: 'financial-1',
        organizationId: 'org-1',
        type: 'revenue',
        amount: 125000.00,
        currency: 'GBP',
        description: 'Monthly care fees',
        category: 'care_fees',
        period: '2023-12',
        status: 'received',
        dueDate: new Date('2023-12-01'),
        paidDate: new Date('2023-12-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'financial-2',
        organizationId: 'org-1',
        type: 'expense',
        amount: 45000.00,
        currency: 'GBP',
        description: 'Staff salaries',
        category: 'staffing',
        period: '2023-12',
        status: 'paid',
        dueDate: new Date('2023-12-31'),
        paidDate: new Date('2023-12-31'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'financial-3',
        organizationId: 'org-1',
        type: 'expense',
        amount: 15000.00,
        currency: 'GBP',
        description: 'Food and supplies',
        category: 'supplies',
        period: '2023-12',
        status: 'paid',
        dueDate: new Date('2023-12-15'),
        paidDate: new Date('2023-12-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const record of financialRecords) {
      await this.dataSource.query(`
        INSERT INTO financial_records (id, organization_id, type, amount, currency, description, category, period, status, due_date, paid_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          type = EXCLUDED.type,
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          period = EXCLUDED.period,
          status = EXCLUDED.status,
          due_date = EXCLUDED.due_date,
          paid_date = EXCLUDED.paid_date,
          updated_at = EXCLUDED.updated_at
      `, [
        record.id, record.organizationId, record.type, record.amount, record.currency,
        record.description, record.category, record.period, record.status, record.dueDate,
        record.paidDate, record.createdAt, record.updatedAt
      ]);
    }

    logger.info(`Seeded ${financialRecords.length} financial records`);
  }

  private async seedWorkforceData(): Promise<void> {
    logger.info('Seeding workforce data...');

    const workforceRecords = [
      {
        id: 'workforce-1',
        organizationId: 'org-1',
        employeeId: 'EMP001',
        firstName: 'Michael',
        lastName: 'Brown',
        role: 'nurse',
        department: 'nursing',
        startDate: new Date('2022-01-15'),
        status: 'active',
        qualifications: ['RN', 'Dementia Care Certificate'],
        certifications: ['CPR', 'First Aid', 'Medication Administration'],
        shiftPattern: 'day_shift',
        hourlyRate: 25.50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'workforce-2',
        organizationId: 'org-1',
        employeeId: 'EMP002',
        firstName: 'Emma',
        lastName: 'Wilson',
        role: 'carer',
        department: 'care',
        startDate: new Date('2022-03-20'),
        status: 'active',
        qualifications: ['NVQ Level 3 Health and Social Care'],
        certifications: ['CPR', 'First Aid', 'Moving and Handling'],
        shiftPattern: 'night_shift',
        hourlyRate: 18.75,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const record of workforceRecords) {
      await this.dataSource.query(`
        INSERT INTO workforce (id, organization_id, employee_id, first_name, last_name, role, department, start_date, status, qualifications, certifications, shift_pattern, hourly_rate, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          employee_id = EXCLUDED.employee_id,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          start_date = EXCLUDED.start_date,
          status = EXCLUDED.status,
          qualifications = EXCLUDED.qualifications,
          certifications = EXCLUDED.certifications,
          shift_pattern = EXCLUDED.shift_pattern,
          hourly_rate = EXCLUDED.hourly_rate,
          updated_at = EXCLUDED.updated_at
      `, [
        record.id, record.organizationId, record.employeeId, record.firstName, record.lastName,
        record.role, record.department, record.startDate, record.status, JSON.stringify(record.qualifications),
        JSON.stringify(record.certifications), record.shiftPattern, record.hourlyRate, record.createdAt, record.updatedAt
      ]);
    }

    logger.info(`Seeded ${workforceRecords.length} workforce records`);
  }

  private async seedFacilitiesData(): Promise<void> {
    logger.info('Seeding facilities data...');

    const facilitiesRecords = [
      {
        id: 'facility-1',
        organizationId: 'org-1',
        name: 'Main Building',
        type: 'residential',
        capacity: 50,
        currentOccupancy: 42,
        status: 'operational',
        lastInspection: new Date('2023-11-01'),
        nextInspection: new Date('2024-05-01'),
        maintenanceRequired: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'facility-2',
        organizationId: 'org-1',
        name: 'Dining Room',
        type: 'common_area',
        capacity: 30,
        currentOccupancy: 0,
        status: 'operational',
        lastInspection: new Date('2023-10-15'),
        nextInspection: new Date('2024-04-15'),
        maintenanceRequired: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const record of facilitiesRecords) {
      await this.dataSource.query(`
        INSERT INTO facilities (id, organization_id, name, type, capacity, current_occupancy, status, last_inspection, next_inspection, maintenance_required, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          capacity = EXCLUDED.capacity,
          current_occupancy = EXCLUDED.current_occupancy,
          status = EXCLUDED.status,
          last_inspection = EXCLUDED.last_inspection,
          next_inspection = EXCLUDED.next_inspection,
          maintenance_required = EXCLUDED.maintenance_required,
          updated_at = EXCLUDED.updated_at
      `, [
        record.id, record.organizationId, record.name, record.type, record.capacity,
        record.currentOccupancy, record.status, record.lastInspection, record.nextInspection,
        record.maintenanceRequired, record.createdAt, record.updatedAt
      ]);
    }

    logger.info(`Seeded ${facilitiesRecords.length} facilities records`);
  }

  private async seedAIAgentData(): Promise<void> {
    logger.info('Seeding AI agent data...');

    const aiAgentRecords = [
      {
        id: 'ai-agent-1',
        organizationId: 'org-1',
        name: 'Care Assistant AI',
        type: 'tenant_care_assistant',
        status: 'active',
        capabilities: ['care_planning', 'medication_reminders', 'incident_analysis'],
        lastTraining: new Date('2023-11-01'),
        accuracy: 94.5,
        totalInteractions: 1250,
        successfulInteractions: 1181,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'ai-agent-2',
        organizationId: 'org-1',
        name: 'Compliance Monitor AI',
        type: 'compliance_monitor',
        status: 'active',
        capabilities: ['compliance_checking', 'audit_preparation', 'regulatory_updates'],
        lastTraining: new Date('2023-11-15'),
        accuracy: 97.2,
        totalInteractions: 850,
        successfulInteractions: 826,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const record of aiAgentRecords) {
      await this.dataSource.query(`
        INSERT INTO ai_agents (id, organization_id, name, type, status, capabilities, last_training, accuracy, total_interactions, successful_interactions, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          capabilities = EXCLUDED.capabilities,
          last_training = EXCLUDED.last_training,
          accuracy = EXCLUDED.accuracy,
          total_interactions = EXCLUDED.total_interactions,
          successful_interactions = EXCLUDED.successful_interactions,
          updated_at = EXCLUDED.updated_at
      `, [
        record.id, record.organizationId, record.name, record.type, record.status,
        JSON.stringify(record.capabilities), record.lastTraining, record.accuracy,
        record.totalInteractions, record.successfulInteractions, record.createdAt, record.updatedAt
      ]);
    }

    logger.info(`Seeded ${aiAgentRecords.length} AI agent records`);
  }
}

export default ComprehensiveDemoDataSeeder;