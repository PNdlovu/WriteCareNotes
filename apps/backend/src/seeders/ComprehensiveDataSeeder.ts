
import AppDataSource from '../config/database';

import { ResidentStatus } from '../entities/Resident';

import { Employee, EmploymentStatus, ContractType, PayrollFrequency, RightToWorkStatus } from '../entities/hr/Employee';
import { ServiceUser, ServiceUserStatus, CareLevel, MobilityLevel } from '../entities/domiciliary/ServiceUser';
import { UniversalUser, UniversalUserType, UserStatus, RelationshipType } from '../entities/auth/UniversalUser';
import { TimeEntry, TimeEntryType, TimeEntryStatus } from '../entities/workforce/TimeEntry';
import { CareVisit, VisitType, VisitStatus } from '../entities/domiciliary/CareVisit';
import { PayrollRecord, PayrollStatus } from '../entities/workforce/PayrollRecord';
import { Holiday, HolidayType, HolidayStatus, HolidayDuration } from '../entities/workforce/Holiday';
import { Shift, ShiftType, ShiftStatus } from '../entities/workforce/Shift';

export class ComprehensiveDataSeeder {
  private employeeRepository = AppDataSource.getRepository(Employee);
  private serviceUserRepository = AppDataSource.getRepository(ServiceUser);
  private universalUserRepository = AppDataSource.getRepository(UniversalUser);
  private timeEntryRepository = AppDataSource.getRepository(TimeEntry);
  private careVisitRepository = AppDataSource.getRepository(CareVisit);
  private payrollRepository = AppDataSource.getRepository(PayrollRecord);
  private holidayRepository = AppDataSource.getRepository(Holiday);
  private shiftRepository = AppDataSource.getRepository(Shift);

  public async seedAllData(): Promise<void> {
    console.log('🌱 Starting comprehensive data seeding...');

    try {
      // Seed in order of dependencies
      const employees = await this.seedEmployees();
      const serviceUsers = await this.seedServiceUsers();
      const universalUsers = await this.seedUniversalUsers(employees, serviceUsers);
      const shifts = await this.seedShifts(employees);
      const timeEntries = await this.seedTimeEntries(employees, shifts);
      const careVisits = await this.seedCareVisits(employees, serviceUsers);
      const payrollRecords = await this.seedPayrollRecords(employees);
      const holidays = await this.seedHolidays(employees);

      console.log('✅ Comprehensive data seeding completed successfully!');
      console.log(`📊 Seeded:
        - ${employees.length} Employees
        - ${serviceUsers.length} Service Users
        - ${universalUsers.length} Universal Users
        - ${shifts.length} Shifts
        - ${timeEntries.length} Time Entries
        - ${careVisits.length} Care Visits
        - ${payrollRecords.length} Payroll Records
        - ${holidays.length} Holiday Requests`);

    } catch (error: unknown) {
      console.error('❌ Error during data seeding:', error);
      throw error;
    }
  }

  private async seedEmployees(): Promise<Employee[]> {
    console.log('👥 Seeding employees...');

    const employeeData = [
      {
        personalDetails: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          dateOfBirth: new Date('1985-03-15'),
          nationalInsuranceNumber: 'AB123456C',
          address: {
            line1: '123 Care Street',
            city: 'Manchester',
            county: 'Greater Manchester',
            postcode: 'M1 2AB',
            country: 'England',
          },
        },
        contactInformation: {
          primaryPhone: '+447123456789',
          email: 'sarah.johnson@writecarenotes.com',
          emergencyContact: {
            name: 'John Johnson',
            relationship: 'Spouse',
            phone: '+447123456790',
            email: 'john.johnson@email.com',
          },
        },
        employmentInformation: {
          startDate: new Date('2020-01-15'),
          department: 'Care Services',
          location: 'Manchester Central',
          reportsTo: 'Care Manager',
          employmentStatus: EmploymentStatus.ACTIVE,
        },
        jobDetails: {
          jobTitle: 'Senior Care Worker',
          jobDescription: 'Experienced care worker specializing in dementia care',
          payGrade: 'Grade 5',
          salaryBand: 'Band B',
          baseSalary: 25000,
          currency: 'GBP',
          workingHours: 37.5,
          contractType: ContractType.PERMANENT,
          payrollFrequency: PayrollFrequency.MONTHLY,
        },
        contractInformation: {
          contractNumber: 'EMP2020001',
          contractStartDate: new Date('2020-01-15'),
          noticePeriod: 28,
          holidayEntitlement: 28,
          pensionScheme: 'NHS Pension Scheme',
          benefits: ['Healthcare', 'Life Insurance', 'Training Budget'],
          restrictiveCovenants: ['Non-compete 6 months'],
        },
        rightToWorkStatus: RightToWorkStatus.VERIFIED,
        qualifications: [
          {
            id: '1',
            qualificationType: 'NVQ',
            qualificationName: 'NVQ Level 3 Health and Social Care',
            institution: 'Manchester College',
            dateObtained: new Date('2019-06-01'),
            verificationStatus: 'verified',
          },
        ],
        certifications: [
          {
            id: '1',
            certificationName: 'First Aid at Work',
            certifyingBody: 'St John Ambulance',
            certificationNumber: 'FAW2023001',
            dateObtained: new Date('2023-01-15'),
            expiryDate: new Date('2026-01-15'),
            renewalRequired: true,
            status: ResidentStatus.ACTIVE,
          },
        ],
        skills: [
          {
            id: '1',
            skillName: 'Dementia Care',
            skillCategory: 'Specialized Care',
            proficiencyLevel: 'expert',
            lastAssessed: new Date('2023-06-01'),
            certificationRequired: true,
          },
        ],
      },
      {
        personalDetails: {
          firstName: 'Michael',
          lastName: 'Chen',
          dateOfBirth: new Date('1990-07-22'),
          nationalInsuranceNumber: 'CD789012E',
          address: {
            line1: '456 Healthcare Avenue',
            city: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B2 4CD',
            country: 'England',
          },
        },
        contactInformation: {
          primaryPhone: '+447234567890',
          email: 'michael.chen@writecarenotes.com',
          emergencyContact: {
            name: 'Lisa Chen',
            relationship: 'Wife',
            phone: '+447234567891',
            email: 'lisa.chen@email.com',
          },
        },
        employmentInformation: {
          startDate: new Date('2021-06-01'),
          department: 'Care Services',
          location: 'Birmingham North',
          reportsTo: 'Area Manager',
          employmentStatus: EmploymentStatus.ACTIVE,
        },
        jobDetails: {
          jobTitle: 'Care Manager',
          jobDescription: 'Manages care delivery and team coordination',
          payGrade: 'Grade 7',
          salaryBand: 'Band D',
          baseSalary: 35000,
          currency: 'GBP',
          workingHours: 37.5,
          contractType: ContractType.PERMANENT,
          payrollFrequency: PayrollFrequency.MONTHLY,
        },
        contractInformation: {
          contractNumber: 'EMP2021015',
          contractStartDate: new Date('2021-06-01'),
          noticePeriod: 56,
          holidayEntitlement: 30,
          pensionScheme: 'NHS Pension Scheme',
          benefits: ['Healthcare', 'Life Insurance', 'Car Allowance', 'Training Budget'],
          restrictiveCovenants: ['Non-compete 12 months'],
        },
        rightToWorkStatus: RightToWorkStatus.VERIFIED,
      },
      {
        personalDetails: {
          firstName: 'Emma',
          lastName: 'Williams',
          dateOfBirth: new Date('1975-11-08'),
          nationalInsuranceNumber: 'EF345678G',
          address: {
            line1: '789 Executive Close',
            city: 'London',
            county: 'Greater London',
            postcode: 'SW1A 1AA',
            country: 'England',
          },
        },
        contactInformation: {
          primaryPhone: '+447345678901',
          email: 'emma.williams@writecarenotes.com',
          emergencyContact: {
            name: 'David Williams',
            relationship: 'Husband',
            phone: '+447345678902',
            email: 'david.williams@email.com',
          },
        },
        employmentInformation: {
          startDate: new Date('2018-03-01'),
          department: 'Executive',
          location: 'Head Office',
          reportsTo: 'Board of Directors',
          employmentStatus: EmploymentStatus.ACTIVE,
        },
        jobDetails: {
          jobTitle: 'Chief Executive Officer',
          jobDescription: 'Strategic leadership and organizational management',
          payGrade: 'Executive',
          salaryBand: 'Executive',
          baseSalary: 85000,
          currency: 'GBP',
          workingHours: 40,
          contractType: ContractType.PERMANENT,
          payrollFrequency: PayrollFrequency.MONTHLY,
        },
        contractInformation: {
          contractNumber: 'EXE2018001',
          contractStartDate: new Date('2018-03-01'),
          noticePeriod: 90,
          holidayEntitlement: 35,
          pensionScheme: 'Executive Pension Scheme',
          benefits: ['Healthcare', 'Life Insurance', 'Car Allowance', 'Executive Benefits'],
          restrictiveCovenants: ['Non-compete 24 months'],
        },
        rightToWorkStatus: RightToWorkStatus.VERIFIED,
      },
    ];

    constemployees: Employee[] = [];
    let employeeCounter = 1;

    for (const data of employeeData) {
      const employee = this.employeeRepository.create({
        ...data,
        employeeNumber: `EMP${new Date().getFullYear()}${String(employeeCounter).padStart(4, '0')}`,
        rightToWorkDocuments: [],
        performanceHistory: [],
        trainingRecords: [],
        disciplinaryRecords: [],
        competencies: [],
      });

      const savedEmployee = await this.employeeRepository.save(employee);
      employees.push(savedEmployee);
      employeeCounter++;
    }

    return employees;
  }

  private async seedServiceUsers(): Promise<ServiceUser[]> {
    console.log('🏠 Seeding service users...');

    const serviceUserData = [
      {
        personalDetails: {
          firstName: 'Margaret',
          lastName: 'Thompson',
          dateOfBirth: new Date('1935-05-12'),
          nhsNumber: '123 456 7890',
          address: {
            line1: '15 Rosewood Gardens',
            city: 'Manchester',
            county: 'Greater Manchester',
            postcode: 'M20 3EF',
            country: 'England',
            coordinates: {
              latitude: 53.4084,
              longitude: -2.2374,
            },
            accessInstructions: 'Key safe by front door, code 1234. Ring doorbell twice.',
            parkingInfo: 'Parking available on street, no restrictions',
          },
        },
        contactInformation: {
          primaryPhone: '+447456789012',
          preferredContactMethod: 'phone',
          emergencyContacts: [
            {
              id: '1',
              name: 'Robert Thompson',
              relationship: 'Son',
              phone: '+447456789013',
              email: 'robert.thompson@email.com',
              isPrimary: true,
              hasKeyAccess: true,
              canMakeDecisions: true,
            },
            {
              id: '2',
              name: 'Susan Thompson',
              relationship: 'Daughter',
              phone: '+447456789014',
              email: 'susan.thompson@email.com',
              isPrimary: false,
              hasKeyAccess: false,
              canMakeDecisions: false,
            },
          ],
          familyContacts: [
            {
              id: '1',
              name: 'Robert Thompson',
              relationship: 'Son',
              phone: '+447456789013',
              email: 'robert.thompson@email.com',
              receiveUpdates: true,
              canViewReports: true,
              hasPortalAccess: true,
            },
          ],
        },
        medicalInformation: {
          conditions: [
            {
              id: '1',
              condition: 'Dementia (Alzheimer\'s type)',
              diagnosedDate: new Date('2020-03-15'),
              severity: 'moderate',
              status: ResidentStatus.ACTIVE,
              notes: 'Progressive decline in memory and cognitive function',
            },
            {
              id: '2',
              condition: 'Type 2 Diabetes',
              diagnosedDate: new Date('2015-08-20'),
              severity: 'mild',
              status: 'managed',
              notes: 'Well controlled with medication',
            },
          ],
          medications: [
            {
              id: '1',
              name: 'Donepezil',
              dosage: '10mg',
              frequency: 'Once daily',
              route: 'Oral',
              startDate: new Date('2020-04-01'),
              prescribedBy: 'Dr. Smith',
              purpose: 'Dementia management',
              requiresSupervision: true,
              timesCritical: false,
            },
            {
              id: '2',
              name: 'Metformin',
              dosage: '500mg',
              frequency: 'Twice daily',
              route: 'Oral',
              startDate: new Date('2015-09-01'),
              prescribedBy: 'Dr. Jones',
              purpose: 'Diabetes management',
              requiresSupervision: false,
              timesCritical: false,
            },
          ],
          allergies: [
            {
              id: '1',
              allergen: 'Penicillin',
              severity: 'severe',
              reactions: ['Rash', 'Swelling'],
              treatment: 'Avoid penicillin-based antibiotics',
              dateIdentified: new Date('1965-01-01'),
            },
          ],
          mobilityLevel: MobilityLevel.WALKING_AID,
          cognitiveStatus: 'Mild to moderate cognitive impairment',
          riskAssessments: [
            {
              id: '1',
              type: 'falls',
              level: 'medium',
              factors: ['Uses walking frame', 'Occasional confusion', 'Lives alone'],
              mitigations: ['Clear pathways', 'Regular safety checks', 'Emergency pendant'],
              lastAssessed: new Date('2023-11-01'),
              nextReview: new Date('2024-05-01'),
              assessedBy: 'Care Manager',
            },
          ],
          lastMedicalReview: new Date('2023-10-15'),
          nextMedicalReview: new Date('2024-04-15'),
        },
        careRequirements: {
          careLevel: CareLevel.MEDIUM,
          hoursPerWeek: 14,
          preferredTimes: [
            {
              dayOfWeek: 1, // Monday
              startTime: '09:00',
              endTime: '11:00',
              priority: 'essential',
            },
            {
              dayOfWeek: 3, // Wednesday
              startTime: '09:00',
              endTime: '11:00',
              priority: 'essential',
            },
            {
              dayOfWeek: 5, // Friday
              startTime: '09:00',
              endTime: '11:00',
              priority: 'essential',
            },
          ],
          careNeeds: [
            {
              id: '1',
              category: 'personal_care',
              task: 'Assistance with washing and dressing',
              frequency: 'Daily',
              duration: 30,
              priority: 'important',
              requiresTraining: false,
              riskLevel: 'low',
            },
            {
              id: '2',
              category: 'medication',
              task: 'Medication prompting and supervision',
              frequency: 'Twice daily',
              duration: 15,
              priority: 'critical',
              requiresTraining: true,
              riskLevel: 'medium',
            },
            {
              id: '3',
              category: 'domestic',
              task: 'Light housekeeping and meal preparation',
              frequency: 'Three times weekly',
              duration: 45,
              priority: 'routine',
              requiresTraining: false,
              riskLevel: 'low',
            },
          ],
          equipmentNeeded: [
            {
              id: '1',
              name: 'Walking Frame',
              type: 'mobility',
              location: 'Hallway',
              instructions: 'Ensure brakes are working',
            },
            {
              id: '2',
              name: 'Emergency Pendant',
              type: 'safety',
              location: 'Worn by service user',
              instructions: 'Check battery monthly',
            },
          ],
          accessRequirements: ['Key safe access', 'Ring doorbell twice'],
        },
        status: ServiceUserStatus.ACTIVE,
        careStartDate: new Date('2023-01-15'),
        fundingSource: 'local_authority',
        hourlyRate: 18.50,
        weeklyBudget: 259,
        localAuthorityRef: 'LA2023001',
        socialWorker: 'Jane Smith',
        careManager: 'Michael Chen',
        requiresKeyHolder: true,
        hasSecuritySystem: false,
        hasPets: true,
        petInformation: 'Small cat named Whiskers - very friendly',
      },
      {
        personalDetails: {
          firstName: 'James',
          lastName: 'Robertson',
          dateOfBirth: new Date('1942-12-03'),
          nhsNumber: '234 567 8901',
          address: {
            line1: '67 Oakfield Road',
            city: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 2TG',
            country: 'England',
            coordinates: {
              latitude: 52.4862,
              longitude: -1.8904,
            },
            accessInstructions: 'Key with neighbor at number 65. Press buzzer for flat 2.',
            parkingInfo: 'Resident parking only, visitor spaces at rear',
          },
        },
        contactInformation: {
          primaryPhone: '+447567890123',
          preferredContactMethod: 'phone',
          emergencyContacts: [
            {
              id: '1',
              name: 'Helen Robertson',
              relationship: 'Daughter',
              phone: '+447567890124',
              email: 'helen.robertson@email.com',
              isPrimary: true,
              hasKeyAccess: false,
              canMakeDecisions: true,
            },
          ],
          familyContacts: [
            {
              id: '1',
              name: 'Helen Robertson',
              relationship: 'Daughter',
              phone: '+447567890124',
              email: 'helen.robertson@email.com',
              receiveUpdates: true,
              canViewReports: true,
              hasPortalAccess: true,
            },
          ],
        },
        medicalInformation: {
          conditions: [
            {
              id: '1',
              condition: 'Chronic Obstructive Pulmonary Disease (COPD)',
              diagnosedDate: new Date('2018-05-10'),
              severity: 'moderate',
              status: ResidentStatus.ACTIVE,
              notes: 'Requires oxygen therapy',
            },
          ],
          medications: [
            {
              id: '1',
              name: 'Salbutamol Inhaler',
              dosage: '100mcg',
              frequency: 'As required',
              route: 'Inhalation',
              startDate: new Date('2018-06-01'),
              prescribedBy: 'Dr. Brown',
              purpose: 'Bronchodilator',
              requiresSupervision: false,
              timesCritical: true,
            },
          ],
          allergies: [],
          mobilityLevel: MobilityLevel.INDEPENDENT,
          cognitiveStatus: 'Cognitively intact',
          riskAssessments: [
            {
              id: '1',
              type: 'medication',
              level: 'high',
              factors: ['Multiple medications', 'Respiratory condition'],
              mitigations: ['Medication compliance monitoring', 'Regular health checks'],
              lastAssessed: new Date('2023-09-01'),
              nextReview: new Date('2024-03-01'),
              assessedBy: 'Clinical Lead',
            },
          ],
          lastMedicalReview: new Date('2023-11-15'),
          nextMedicalReview: new Date('2024-05-15'),
        },
        careRequirements: {
          careLevel: CareLevel.HIGH,
          hoursPerWeek: 21,
          preferredTimes: [
            {
              dayOfWeek: 1, // Monday
              startTime: '08:00',
              endTime: '11:00',
              priority: 'essential',
            },
            {
              dayOfWeek: 2, // Tuesday
              startTime: '08:00',
              endTime: '11:00',
              priority: 'essential',
            },
            {
              dayOfWeek: 4, // Thursday
              startTime: '08:00',
              endTime: '11:00',
              priority: 'essential',
            },
            {
              dayOfWeek: 6, // Saturday
              startTime: '10:00',
              endTime: '13:00',
              priority: 'preferred',
            },
          ],
          careNeeds: [
            {
              id: '1',
              category: 'healthcare',
              task: 'Oxygen therapy monitoring',
              frequency: 'Daily',
              duration: 20,
              priority: 'critical',
              specialInstructions: 'Check oxygen levels and equipment',
              requiresTraining: true,
              riskLevel: 'high',
            },
            {
              id: '2',
              category: 'medication',
              task: 'Medication administration and monitoring',
              frequency: 'Multiple times daily',
              duration: 15,
              priority: 'critical',
              requiresTraining: true,
              riskLevel: 'high',
            },
          ],
          equipmentNeeded: [
            {
              id: '1',
              name: 'Oxygen Concentrator',
              type: 'medical',
              location: 'Living room',
              instructions: 'Check daily operation and alarms',
              lastServiced: new Date('2023-10-01'),
              nextService: new Date('2024-04-01'),
              supplier: 'Medical Equipment Services Ltd',
            },
          ],
          accessRequirements: ['Neighbor key holder', 'Medical equipment present'],
        },
        status: ServiceUserStatus.ACTIVE,
        careStartDate: new Date('2022-08-01'),
        fundingSource: 'nhs',
        hourlyRate: 22.00,
        weeklyBudget: 462,
        localAuthorityRef: 'NHS2022045',
        careManager: 'Sarah Johnson',
        requiresKeyHolder: true,
        hasSecuritySystem: true,
        hasPets: false,
      },
    ];

    constserviceUsers: ServiceUser[] = [];
    let serviceUserCounter = 1;

    for (const data of serviceUserData) {
      const serviceUser = this.serviceUserRepository.create({
        ...data,
        serviceUserNumber: `SU${new Date().getFullYear()}${String(serviceUserCounter).padStart(4, '0')}`,
      });

      const savedServiceUser = await this.serviceUserRepository.save(serviceUser);
      serviceUsers.push(savedServiceUser);
      serviceUserCounter++;
    }

    return serviceUsers;
  }

  private async seedUniversalUsers(employees: Employee[], serviceUsers: ServiceUser[]): Promise<UniversalUser[]> {
    console.log('👨‍👩‍👧‍👦 Seeding universal users...');

    const universalUserData = [
      // Family member for Margaret Thompson
      {
        userType: UniversalUserType.FAMILY_MEMBER,
        personalDetails: {
          firstName: 'Robert',
          lastName: 'Thompson',
          preferredName: 'Rob',
          phone: '+447456789013',
          email: 'robert.thompson@email.com',
          dateOfBirth: new Date('1965-08-15'),
          address: {
            line1: '42 Family Lane',
            city: 'Manchester',
            county: 'Greater Manchester',
            postcode: 'M21 4GH',
            country: 'England',
          },
        },
        familyMemberDetails: {
          relationshipType: RelationshipType.CHILD,
          serviceUserIds: [serviceUsers[0].id],
          emergencyContact: true,
          hasDecisionMakingAuthority: true,
          canViewMedicalInfo: true,
          canViewFinancialInfo: false,
          receiveEmergencyAlerts: true,
          receiveVisitUpdates: true,
          receiveCareReports: true,
          preferredContactMethod: 'app',
          contactTimePreferences: {
            startTime: '08:00',
            endTime: '22:00',
            timezone: 'Europe/London',
          },
        },
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
      },
      // Family member for James Robertson
      {
        userType: UniversalUserType.FAMILY_MEMBER,
        personalDetails: {
          firstName: 'Helen',
          lastName: 'Robertson',
          phone: '+447567890124',
          email: 'helen.robertson@email.com',
          dateOfBirth: new Date('1975-04-22'),
        },
        familyMemberDetails: {
          relationshipType: RelationshipType.CHILD,
          serviceUserIds: [serviceUsers[1].id],
          emergencyContact: true,
          hasDecisionMakingAuthority: true,
          canViewMedicalInfo: true,
          canViewFinancialInfo: true,
          receiveEmergencyAlerts: true,
          receiveVisitUpdates: true,
          receiveCareReports: true,
          preferredContactMethod: 'app',
          contactTimePreferences: {
            startTime: '07:00',
            endTime: '23:00',
            timezone: 'Europe/London',
          },
        },
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
      },
      // Staff users based on employees
      {
        userType: UniversalUserType.CARE_WORKER,
        personalDetails: {
          firstName: employees[0].personalDetails.firstName,
          lastName: employees[0].personalDetails.lastName,
          phone: employees[0].contactInformation.primaryPhone,
          email: employees[0].contactInformation.email,
        },
        staffDetails: {
          employeeId: employees[0].id,
          department: employees[0].employmentInformation.department,
          jobTitle: employees[0].jobDetails.jobTitle,
          startDate: employees[0].employmentInformation.startDate,
          qualifications: employees[0].qualifications.map(q => q.qualificationName),
          certifications: employees[0].certifications.map(c => c.certificationName),
          specializations: ['Dementia Care', 'Medication Management'],
          workingPattern: {
            hoursPerWeek: employees[0].jobDetails.workingHours,
            shiftPattern: 'Days',
            availableDays: [1, 2, 3, 4, 5], // Monday to Friday
          },
        },
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
      },
      {
        userType: UniversalUserType.MANAGER,
        personalDetails: {
          firstName: employees[1].personalDetails.firstName,
          lastName: employees[1].personalDetails.lastName,
          phone: employees[1].contactInformation.primaryPhone,
          email: employees[1].contactInformation.email,
        },
        staffDetails: {
          employeeId: employees[1].id,
          department: employees[1].employmentInformation.department,
          jobTitle: employees[1].jobDetails.jobTitle,
          startDate: employees[1].employmentInformation.startDate,
          qualifications: [],
          certifications: [],
          specializations: ['Team Management', 'Care Coordination'],
          workingPattern: {
            hoursPerWeek: employees[1].jobDetails.workingHours,
            shiftPattern: 'Office Hours',
            availableDays: [1, 2, 3, 4, 5],
          },
        },
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
      },
      {
        userType: UniversalUserType.EXECUTIVE,
        personalDetails: {
          firstName: employees[2].personalDetails.firstName,
          lastName: employees[2].personalDetails.lastName,
          phone: employees[2].contactInformation.primaryPhone,
          email: employees[2].contactInformation.email,
        },
        staffDetails: {
          employeeId: employees[2].id,
          department: employees[2].employmentInformation.department,
          jobTitle: employees[2].jobDetails.jobTitle,
          startDate: employees[2].employmentInformation.startDate,
          qualifications: [],
          certifications: [],
          specializations: ['Strategic Leadership', 'Healthcare Management'],
          workingPattern: {
            hoursPerWeek: employees[2].jobDetails.workingHours,
            shiftPattern: 'Flexible',
            availableDays: [1, 2, 3, 4, 5, 6, 0],
          },
        },
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
      },
    ];

    constuniversalUsers: UniversalUser[] = [];
    let userCounter = 1;

    for (const data of universalUserData) {
      // Set default permissions based on user type
      const accessPermissions = this.getDefaultAccessPermissions(data.userType, data.familyMemberDetails?.serviceUserIds);
      const notificationPreferences = this.getDefaultNotificationPreferences(data.userType);
      const appPreferences = this.getDefaultAppPreferences();

      const universalUser = this.universalUserRepository.create({
        ...data,
        userNumber: `USR${new Date().getFullYear()}${String(userCounter).padStart(4, '0')}`,
        accessPermissions,
        notificationPreferences,
        appPreferences,
      });

      const savedUser = await this.universalUserRepository.save(universalUser);
      universalUsers.push(savedUser);
      userCounter++;
    }

    return universalUsers;
  }

  private async seedTimeEntries(employees: Employee[], shifts: Shift[]): Promise<TimeEntry[]> {
    console.log('⏰ Seeding time entries...');

    consttimeEntries: TimeEntry[] = [];
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Create realistic time entries for the past few days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const entryDate = new Date(today.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      
      for (const employee of employees.slice(0, 2)) { // First 2 employees (care workers)
        // Morning clock in
        const clockInTime = new Date(entryDate);
        clockInTime.setHours(8, Math.floor(Math.random() * 30), 0, 0); // 8:00-8:30 AM

        const clockIn = this.timeEntryRepository.create({
          employeeId: employee.id,
          type: TimeEntryType.CLOCK_IN,
          timestamp: clockInTime,
          status: TimeEntryStatus.COMPLETED,
          location: {
            latitude: 53.4084 + (Math.random() - 0.5) * 0.01,
            longitude: -2.2374 + (Math.random() - 0.5) * 0.01,
            address: 'Manchester Care Services',
            accuracy: 10,
            timestamp: clockInTime,
          },
          deviceInfo: {
            deviceId: `device_${employee.id.substring(0, 8)}`,
            deviceType: 'mobile',
            platform: Math.random() > 0.5 ? 'ios' : 'android',
            appVersion: '1.0.0',
            userAgent: 'WriteCareNotes Mobile App',
          },
          shiftId: shifts.find(s => s.employeeId === employee.id)?.id,
          isManualEntry: false,
        });

        const savedClockIn = await this.timeEntryRepository.save(clockIn);
        timeEntries.push(savedClockIn);

        // Evening clock out
        const clockOutTime = new Date(entryDate);
        clockOutTime.setHours(16, 30 + Math.floor(Math.random() * 60), 0, 0); // 4:30-5:30 PM

        const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        const overtimeHours = Math.max(0, hoursWorked - 8);

        const clockOut = this.timeEntryRepository.create({
          employeeId: employee.id,
          type: TimeEntryType.CLOCK_OUT,
          timestamp: clockOutTime,
          status: TimeEntryStatus.COMPLETED,
          location: {
            latitude: 53.4084 + (Math.random() - 0.5) * 0.01,
            longitude: -2.2374 + (Math.random() - 0.5) * 0.01,
            address: 'Manchester Care Services',
            accuracy: 10,
            timestamp: clockOutTime,
          },
          deviceInfo: {
            deviceId: `device_${employee.id.substring(0, 8)}`,
            deviceType: 'mobile',
            platform: Math.random() > 0.5 ? 'ios' : 'android',
            appVersion: '1.0.0',
            userAgent: 'WriteCareNotes Mobile App',
          },
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          isManualEntry: false,
        });

        const savedClockOut = await this.timeEntryRepository.save(clockOut);
        timeEntries.push(savedClockOut);
      }
    }

    return timeEntries;
  }

  private async seedCareVisits(employees: Employee[], serviceUsers: ServiceUser[]): Promise<CareVisit[]> {
    console.log('🏠 Seeding care visits...');

    constcareVisits: CareVisit[] = [];
    const today = new Date();

    // Create visits for the past week and upcoming week
    for (let dayOffset = -7; dayOffset <= 7; dayOffset++) {
      const visitDate = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      
      for (const serviceUser of serviceUsers) {
        // Create visits based on preferred times
        for (const preferredTime of serviceUser.careRequirements.preferredTimes) {
          if (preferredTime.dayOfWeek === visitDate.getDay()) {
            const startTime = new Date(visitDate);
            const [startHour, startMinute] = preferredTime.startTime.split(':');
            startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

            const endTime = new Date(visitDate);
            const [endHour, endMinute] = preferredTime.endTime.split(':');
            endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

            const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

            let status = VisitStatus.SCHEDULED;
            letactualStartTime: Date | undefined;
            letactualEndTime: Date | undefined;
            letactualDuration: number | undefined;

            // Set realistic statuses based on date
            if (visitDate < today) {
              status = Math.random() > 0.1 ? VisitStatus.COMPLETED : VisitStatus.MISSED;
              if (status === VisitStatus.COMPLETED) {
                actualStartTime = new Date(startTime.getTime() + (Math.random() - 0.5) * 10 * 60 * 1000); // ±10 minutes
                actualEndTime = new Date(endTime.getTime() + (Math.random() - 0.5) * 15 * 60 * 1000); // ±15 minutes
                actualDuration = (actualEndTime.getTime() - actualStartTime.getTime()) / (1000 * 60);
              }
            } else if (visitDate.toDateString() === today.toDateString()) {
              if (startTime < new Date()) {
                status = Math.random() > 0.3 ? VisitStatus.COMPLETED : VisitStatus.IN_PROGRESS;
                actualStartTime = startTime;
                if (status === VisitStatus.COMPLETED) {
                  actualEndTime = endTime;
                  actualDuration = duration;
                }
              }
            }

            const visit = this.careVisitRepository.create({
              visitNumber: `V${visitDate.getFullYear()}${String(visitDate.getMonth() + 1).padStart(2, '0')}${String(careVisits.length + 1).padStart(4, '0')}`,
              serviceUserId: serviceUser.id,
              careWorkerId: employees[0].id, // Assign to first care worker
              type: this.getVisitTypeForServiceUser(serviceUser),
              status,
              scheduledStartTime: startTime,
              scheduledEndTime: endTime,
              actualStartTime,
              actualEndTime,
              plannedDuration: duration,
              actualDuration,
              scheduledTasks: this.generateTasksForVisit(serviceUser),
              completedTasks: status === VisitStatus.COMPLETED ? this.generateCompletedTasks(serviceUser) : undefined,
              arrivalVerification: actualStartTime ? {
                method: 'gps',
                timestamp: actualStartTime,
                data: { accuracy: 8 },
                verified: true,
              } : undefined,
              location: actualStartTime ? {
                address: serviceUser.getFullAddress(),
                coordinates: serviceUser.personalDetails.address.coordinates!,
                timestamp: actualStartTime,
                method: 'gps',
              } : undefined,
              visitNotes: status === VisitStatus.COMPLETED ? this.generateVisitNotes(serviceUser) : undefined,
            });

            const savedVisit = await this.careVisitRepository.save(visit);
            careVisits.push(savedVisit);
          }
        }
      }
    }

    return careVisits;
  }

  private async seedPayrollRecords(employees: Employee[]): Promise<PayrollRecord[]> {
    console.log('💰 Seeding payroll records...');

    constpayrollRecords: PayrollRecord[] = [];
    const currentDate = new Date();

    // Generate payroll for last 3 months
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const payPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 0);
      const payPeriodStart = new Date(payPeriodEnd.getFullYear(), payPeriodEnd.getMonth(), 1);
      const payDate = new Date(payPeriodEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

      for (const employee of employees) {
        const baseSalary = employee.jobDetails.baseSalary;
        const monthlyHours = employee.jobDetails.workingHours * 4.33; // Average weeks per month
        const hourlyRate = baseSalary / monthlyHours;

        const regularHours = monthlyHours + (Math.random() - 0.5) * 10; // ±5 hours variance
        const overtimeHours = Math.random() * 20; // 0-20 overtime hours
        const holidayHours = Math.random() * 16; // 0-2 days holiday

        const basicPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * 1.5;
        const holidayPay = holidayHours * hourlyRate;
        const grossPay = basicPay + overtimePay + holidayPay;

        // Calculate UK tax and NI (simplified)
        const taxableIncome = Math.max(0, grossPay - (12570 / 12)); // Personal allowance
        const incomeTax = taxableIncome * 0.20; // Basic rate
        const nationalInsurance = Math.max(0, grossPay - (12570 / 12)) * 0.12;
        const pensionContribution = grossPay * 0.05; // 5% employee contribution

        const totalDeductions = incomeTax + nationalInsurance + pensionContribution;
        const netPay = grossPay - totalDeductions;

        const payroll = this.payrollRepository.create({
          employeeId: employee.id,
          payrollNumber: `PR${payPeriodEnd.getFullYear()}${String(payPeriodEnd.getMonth() + 1).padStart(2, '0')}${String(payrollRecords.length + 1).padStart(4, '0')}`,
          frequency: employee.jobDetails.payrollFrequency,
          payPeriodStart,
          payPeriodEnd,
          payDate,
          status: monthOffset === 0 ? PayrollStatus.CALCULATED : PayrollStatus.PAID,
          hours: {
            regularHours: Math.round(regularHours * 100) / 100,
            overtimeHours: Math.round(overtimeHours * 100) / 100,
            doubleTimeHours: 0,
            holidayHours: Math.round(holidayHours * 100) / 100,
            sickHours: 0,
            totalHours: Math.round((regularHours + overtimeHours + holidayHours) * 100) / 100,
          },
          earnings: {
            basicPay: Math.round(basicPay * 100) / 100,
            overtimePay: Math.round(overtimePay * 100) / 100,
            holidayPay: Math.round(holidayPay * 100) / 100,
            sickPay: 0,
            bonuses: 0,
            allowances: 0,
            grossPay: Math.round(grossPay * 100) / 100,
          },
          deductions: {
            incomeTax: Math.round(incomeTax * 100) / 100,
            nationalInsurance: Math.round(nationalInsurance * 100) / 100,
            pensionContribution: Math.round(pensionContribution * 100) / 100,
            studentLoan: 0,
            courtOrders: 0,
            other: 0,
            totalDeductions: Math.round(totalDeductions * 100) / 100,
          },
          netPay: Math.round(netPay * 100) / 100,
          taxCodes: {
            incomeTaxCode: '1257L',
            nationalInsuranceCategory: 'A',
            pensionScheme: employee.contractInformation.pensionScheme,
          },
          calculatedBy: 'system',
          calculatedAt: new Date(payPeriodEnd.getTime() + 1 * 24 * 60 * 60 * 1000),
        });

        if (monthOffset > 0) {
          payroll.approvedBy = employees[1].id; // Manager approved
          payroll.approvedAt = new Date(payPeriodEnd.getTime() + 2 * 24 * 60 * 60 * 1000);
          payroll.paidBy = 'system';
          payroll.paidAt = payDate;
          payroll.paymentMethod = 'bank_transfer';
          payroll.paymentReference = `PAY${payroll.payrollNumber}`;
        }

        const savedPayroll = await this.payrollRepository.save(payroll);
        payrollRecords.push(savedPayroll);
      }
    }

    return payrollRecords;
  }

  private async seedHolidays(employees: Employee[]): Promise<Holiday[]> {
    console.log('🏖️ Seeding holiday requests...');

    constholidays: Holiday[] = [];
    const currentDate = new Date();

    for (const employee of employees) {
      // Past approved holiday
      const pastHoliday = this.holidayRepository.create({
        requestNumber: `HR${currentDate.getFullYear()}${String(holidays.length + 1).padStart(4, '0')}`,
        employeeId: employee.id,
        type: HolidayType.ANNUAL_LEAVE,
        status: HolidayStatus.TAKEN,
        duration: HolidayDuration.FULL_DAY,
        startDate: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(currentDate.getTime() - 26 * 24 * 60 * 60 * 1000),
        daysRequested: 5,
        reason: 'Family holiday',
        requestedAt: new Date(currentDate.getTime() - 45 * 24 * 60 * 60 * 1000),
        approval: {
          approvedBy: employees[1].id,
          approvedAt: new Date(currentDate.getTime() - 40 * 24 * 60 * 60 * 1000),
          approvalNotes: 'Approved - adequate cover arranged',
        },
      });

      const savedPastHoliday = await this.holidayRepository.save(pastHoliday);
      holidays.push(savedPastHoliday);

      // Future pending holiday
      const futureHoliday = this.holidayRepository.create({
        requestNumber: `HR${currentDate.getFullYear()}${String(holidays.length + 1).padStart(4, '0')}`,
        employeeId: employee.id,
        type: HolidayType.ANNUAL_LEAVE,
        status: HolidayStatus.PENDING,
        duration: HolidayDuration.FULL_DAY,
        startDate: new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(currentDate.getTime() + 25 * 24 * 60 * 60 * 1000),
        daysRequested: 5,
        reason: 'Summer break',
        requestedAt: new Date(),
      });

      const savedFutureHoliday = await this.holidayRepository.save(futureHoliday);
      holidays.push(savedFutureHoliday);
    }

    return holidays;
  }

  private async seedShifts(employees: Employee[]): Promise<Shift[]> {
    console.log('📅 Seeding shifts...');

    constshifts: Shift[] = [];
    const today = new Date();

    // Create shifts for next 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const shiftDate = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      
      for (const employee of employees.slice(0, 2)) { // Care workers only
        const startTime = new Date(shiftDate);
        startTime.setHours(8, 0, 0, 0);
        
        const endTime = new Date(shiftDate);
        endTime.setHours(16, 0, 0, 0);

        const shift = this.shiftRepository.create({
          shiftCode: `SH${shiftDate.getFullYear()}${String(shiftDate.getMonth() + 1).padStart(2, '0')}${String(shiftDate.getDate()).padStart(2, '0')}_${employee.id.substring(0, 8)}`,
          employeeId: employee.id,
          type: ShiftType.REGULAR,
          status: dayOffset < 0 ? ShiftStatus.COMPLETED : 
                 dayOffset === 0 ? ShiftStatus.IN_PROGRESS : ShiftStatus.SCHEDULED,
          scheduledStart: startTime,
          scheduledEnd: endTime,
          actualStart: dayOffset < 0 ? startTime : undefined,
          actualEnd: dayOffset < 0 ? endTime : undefined,
          location: {
            locationId: 'manchester_central',
            locationName: 'Manchester Central Office',
            address: '123 Care Street, Manchester M1 2AB',
            coordinates: {
              latitude: 53.4084,
              longitude: -2.2374,
            },
          },
          scheduledHours: 8,
          actualHours: dayOffset < 0 ? 8 + (Math.random() - 0.5) * 2 : undefined,
          hourlyRate: employee.jobDetails.baseSalary / (employee.jobDetails.workingHours * 4.33),
          overtimeRate: (employee.jobDetails.baseSalary / (employee.jobDetails.workingHours * 4.33)) * 1.5,
          description: 'Regular care shift',
          assignedBy: employees[1].id, // Manager assigned
          assignedAt: new Date(shiftDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        });

        const savedShift = await this.shiftRepository.save(shift);
        shifts.push(savedShift);
      }
    }

    return shifts;
  }

  // Helper methods for generating realistic data
  private getDefaultAccessPermissions(userType: UniversalUserType, serviceUserIds?: string[]): any {
    const basePermissions = {
      canViewServiceUsers: serviceUserIds || [],
      canViewAllServiceUsers: false,
      canEditServiceUsers: [],
      canViewVisits: serviceUserIds || [],
      canEditVisits: [],
      canViewReports: false,
      canViewFinancials: false,
      canReceiveEmergencyAlerts: false,
      canInitiateEmergencyAlerts: false,
      maxDataRetentionDays: 30,
      requiresBiometricAuth: false,
      allowedDeviceTypes: ['personal'],
    };

    switch (userType) {
      case UniversalUserType.FAMILY_MEMBER:
        return {
          ...basePermissions,
          canViewReports: true,
          canReceiveEmergencyAlerts: true,
          canInitiateEmergencyAlerts: true,
          maxDataRetentionDays: 365,
        };
      case UniversalUserType.CARE_WORKER:
        return {
          ...basePermissions,
          canViewAllServiceUsers: false,
          canEditVisits: serviceUserIds || [],
          canViewReports: true,
          canReceiveEmergencyAlerts: true,
          canInitiateEmergencyAlerts: true,
          allowedDeviceTypes: ['personal', 'organization'],
        };
      case UniversalUserType.MANAGER:
        return {
          ...basePermissions,
          canViewAllServiceUsers: true,
          canEditServiceUsers: [],
          canViewReports: true,
          canViewFinancials: true,
          canReceiveEmergencyAlerts: true,
          canInitiateEmergencyAlerts: true,
          maxDataRetentionDays: 365,
          requiresBiometricAuth: true,
          allowedDeviceTypes: ['personal', 'organization'],
        };
      case UniversalUserType.EXECUTIVE:
        return {
          ...basePermissions,
          canViewAllServiceUsers: true,
          canEditServiceUsers: [],
          canViewReports: true,
          canViewFinancials: true,
          canReceiveEmergencyAlerts: true,
          canInitiateEmergencyAlerts: true,
          maxDataRetentionDays: 365,
          requiresBiometricAuth: true,
          allowedDeviceTypes: ['organization'],
        };
      default:
        return basePermissions;
    }
  }

  private getDefaultNotificationPreferences(userType: UniversalUserType): any {
    return {
      enabled: true,
      visitReminders: userType === UniversalUserType.CARE_WORKER,
      visitUpdates: [UniversalUserType.FAMILY_MEMBER, UniversalUserType.CARE_WORKER].includes(userType),
      emergencyAlerts: true,
      careReports: userType === UniversalUserType.FAMILY_MEMBER,
      medicationAlerts: [UniversalUserType.FAMILY_MEMBER, UniversalUserType.CARE_WORKER].includes(userType),
      appointmentReminders: userType === UniversalUserType.FAMILY_MEMBER,
      systemUpdates: [UniversalUserType.MANAGER, UniversalUserType.EXECUTIVE].includes(userType),
      marketingCommunications: false,
      quietHours: {
        enabled: userType === UniversalUserType.FAMILY_MEMBER,
        startTime: '22:00',
        endTime: '08:00',
      },
      deliveryMethods: {
        push: true,
        email: userType === UniversalUserType.FAMILY_MEMBER,
        sms: false,
        phone: false,
      },
    };
  }

  private getDefaultAppPreferences(): any {
    return {
      language: 'en-GB',
      theme: 'auto',
      fontSize: 'medium',
      highContrast: false,
      voiceOver: false,
      reducedMotion: false,
      defaultDashboard: 'main',
      showTutorials: true,
    };
  }

  private getVisitTypeForServiceUser(serviceUser: ServiceUser): VisitType {
    const careLevel = serviceUser.careRequirements.careLevel;
    
    switch (careLevel) {
      case CareLevel.HIGH:
      case CareLevel.COMPLEX:
        return VisitType.PERSONAL_CARE;
      case CareLevel.MEDIUM:
        return Math.random() > 0.5 ? VisitType.PERSONAL_CARE : VisitType.MEDICATION;
      default:
        return VisitType.DOMESTIC;
    }
  }

  private generateTasksForVisit(serviceUser: ServiceUser): any[] {
    return serviceUser.careRequirements.careNeeds.map((need, index) => ({
      id: `task_${index + 1}`,
      category: need.category,
      task: need.task,
      description: need.specialInstructions,
      estimatedDuration: need.duration,
      priority: need.priority,
      completed: false,
      requiresFollowUp: false,
      photosRequired: need.category === 'medication' || need.riskLevel === 'high',
    }));
  }

  private generateCompletedTasks(serviceUser: ServiceUser): any[] {
    const tasks = this.generateTasksForVisit(serviceUser);
    return tasks.map(task => ({
      ...task,
      completed: Math.random() > 0.1, // 90% completion rate
      completedAt: new Date(),
      notes: task.completed ? 'Task completed successfully' : 'Unable to complete - service user refused',
      issues: !task.completed ? 'Service user declined assistance' : undefined,
    }));
  }

  private generateVisitNotes(serviceUser: ServiceUser): string {
    const notes = [
      `${serviceUser.getFullName()} was in good spirits today.`,
      'All tasks completed as planned.',
      'No concerns noted during visit.',
      'Service user expressed satisfaction with care received.',
      'Medication taken without issues.',
      'House secure on departure.',
    ];

    return notes.join(' ');
  }

  // Cleanup method for testing
  public async clearAllData(): Promise<void> {
    console.log('🧹 Clearing all seeded data...');

    const entities = [
      'care_visits',
      'time_entries', 
      'payroll_records',
      'holidays',
      'shifts',
      'overtime_requests',
      'rotas',
      'universal_users',
      'service_users',
      'employees',
    ];

    for (const entity of entities) {
      await AppDataSource.query(`DELETE FROM ${entity}`);
      console.log(`✅ Cleared ${entity}`);
    }

    console.log('✅ All data cleared successfully');
  }
}

export default ComprehensiveDataSeeder;
