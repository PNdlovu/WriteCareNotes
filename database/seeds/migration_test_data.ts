/**
 * @fileoverview Migration Test Data Seeder
 * @module MigrationTestDataSeeder
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-03
 * 
 * @description Comprehensive seeded data for testing migration system
 * with realistic UK healthcare data across multiple legacy system formats.
 */

import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing migration test data
  await knex('migration_test_residents').del();
  await knex('migration_test_legacy_systems').del();
  await knex('migration_test_pipelines').del();

  // Create test tables if they don't exist
  await createMigrationTestTables(knex);

  // Seed legacy system configurations
  await seedLegacySystems(knex);

  // Seed realistic resident data for different legacy systems
  await seedPersonCentredSoftwareData(knex);
  await seedCareSystemsUKData(knex);
  await seedNHSSpineData(knex);
  await seedSocialServicesData(knex);
  await seedGenericCSVData(knex);

  // Seed migration pipelines
  await seedMigrationPipelines(knex);

  console.log('Migration test data seeded successfully');
}

async function createMigrationTestTables(knex: Knex): Promise<void> {
  // Legacy systems registry
  await knex.schema.createTableIfNotExists('migration_test_legacy_systems', (table) => {
    table.uuid('id').primary();
    table.string('system_name').notNullable();
    table.string('system_type').notNullable();
    table.json('connection_details');
    table.json('supported_formats');
    table.integer('estimated_records');
    table.string('data_quality_score');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Test resident data for various legacy formats
  await knex.schema.createTableIfNotExists('migration_test_residents', (table) => {
    table.uuid('id').primary();
    table.string('source_system').notNullable();
    table.string('source_format').notNullable();
    table.json('raw_data');
    table.json('expected_mapping');
    table.string('complexity_level');
    table.json('validation_challenges');
    table.timestamps(true, true);
  });

  // Migration pipeline test configurations
  await knex.schema.createTableIfNotExists('migration_test_pipelines', (table) => {
    table.uuid('id').primary();
    table.string('pipeline_name').notNullable();
    table.string('source_system').notNullable();
    table.json('configuration');
    table.json('expected_results');
    table.string('test_scenario');
    table.timestamps(true, true);
  });
}

async function seedLegacySystems(knex: Knex): Promise<void> {
  const legacySystems = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      system_name: 'Person Centred Software',
      system_type: 'database',
      connection_details: {
        driver: 'mssql',
        host: 'pcs-server.care-home.local',
        port: 1433,
        database: 'CareHomeDB',
        authentication: 'windows'
      },
      supported_formats: ['mssql', 'csv', 'excel'],
      estimated_records: 1250,
      data_quality_score: 'high',
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      system_name: 'Care Systems UK',
      system_type: 'database',
      connection_details: {
        driver: 'mysql',
        host: 'mysql.caresystems.co.uk',
        port: 3306,
        database: 'care_management',
        ssl: true
      },
      supported_formats: ['mysql', 'csv', 'xml'],
      estimated_records: 850,
      data_quality_score: 'medium',
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      system_name: 'NHS Spine Integration',
      system_type: 'api',
      connection_details: {
        base_url: 'https://api.service.nhs.uk',
        auth_type: 'oauth2',
        client_id: 'nhs_spine_client',
        scopes: ['patient.read', 'medication.read']
      },
      supported_formats: ['fhir', 'json', 'xml'],
      estimated_records: 2100,
      data_quality_score: 'high',
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      system_name: 'Local Authority Social Services',
      system_type: 'api',
      connection_details: {
        base_url: 'https://api.manchester.gov.uk/social-services',
        auth_type: 'api_key',
        department: 'adult_social_care'
      },
      supported_formats: ['json', 'xml', 'csv'],
      estimated_records: 650,
      data_quality_score: 'medium',
      is_active: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      system_name: 'Generic File Import',
      system_type: 'file_based',
      connection_details: {},
      supported_formats: ['csv', 'xlsx', 'json', 'xml'],
      estimated_records: 0,
      data_quality_score: 'variable',
      is_active: true
    }
  ];

  await knex('migration_test_legacy_systems').insert(legacySystems);
}

async function seedPersonCentredSoftwareData(knex: Knex): Promise<void> {
  const residents = [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      source_system: 'person_centred_software',
      source_format: 'mssql_export',
      raw_data: {
        PatientID: 'PCS001',
        PatientName: 'John Arthur Smith',
        DOB: '1945-03-15',
        Gender: 'Male',
        Address: '123 Care Home Lane, Manchester, Greater Manchester',
        PostCode: 'M1 1AA',
        PhoneNumber: '0161 123 4567',
        GPName: 'Dr. Sarah Johnson',
        GPPractice: 'Manchester Medical Centre',
        GPAddress: '456 Medical Way, Manchester, M2 2BB',
        Medications: 'Amlodipine 5mg OD; Simvastatin 20mg ON; Aspirin 75mg OD; Paracetamol 1g QDS PRN',
        CareNeeds: 'Assistance with mobility, diabetes management, medication supervision, social interaction',
        NextOfKin: 'Mary Elizabeth Smith (Daughter) - 07700123456',
        Allergies: 'Penicillin (rash), Shellfish (anaphylaxis)',
        CareLevel: 'High dependency',
        RoomNumber: 'A12',
        AdmissionDate: '2024-01-15',
        FundingType: 'Self-funded',
        MentalCapacity: 'Full capacity',
        MobilityAid: 'Walking frame',
        DietaryRequirements: 'Diabetic diet, low sodium',
        Religion: 'Church of England',
        PreferredLanguage: 'English',
        EmergencyContact2: 'Robert Smith (Son) - 07700123457'
      },
      expected_mapping: {
        resident_id: 'PCS001',
        full_name: 'John Arthur Smith',
        first_name: 'John',
        middle_name: 'Arthur',
        last_name: 'Smith',
        date_of_birth: '1945-03-15',
        gender: 'male',
        address: '123 Care Home Lane, Manchester, Greater Manchester',
        postcode: 'M1 1AA',
        phone_number: '+44161123456',
        gp_name: 'Dr. Sarah Johnson',
        gp_practice: 'Manchester Medical Centre',
        current_medications: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'OD', route: 'Oral' },
          { name: 'Simvastatin', dosage: '20mg', frequency: 'ON', route: 'Oral' },
          { name: 'Aspirin', dosage: '75mg', frequency: 'OD', route: 'Oral' },
          { name: 'Paracetamol', dosage: '1g', frequency: 'QDS PRN', route: 'Oral' }
        ],
        care_requirements: 'Assistance with mobility, diabetes management, medication supervision, social interaction',
        next_of_kin: {
          name: 'Mary Elizabeth Smith',
          relationship: 'Daughter',
          phone: '+447700123456'
        },
        known_allergies: ['Penicillin (rash)', 'Shellfish (anaphylaxis)'],
        care_level: 'High dependency',
        room_number: 'A12',
        admission_date: '2024-01-15',
        funding_type: 'Self-funded'
      },
      complexity_level: 'medium',
      validation_challenges: [
        'Multiple medication parsing required',
        'Complex allergy information with reactions',
        'Multiple contact persons to structure'
      ]
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      source_system: 'person_centred_software',
      source_format: 'csv_export',
      raw_data: {
        PatientID: 'PCS002',
        PatientName: 'Eleanor Mary Davies',
        DOB: '1938-07-22',
        Gender: 'Female',
        Address: '456 Residential Close, Cardiff, South Wales',
        PostCode: 'CF10 1BH',
        PhoneNumber: '029 2087 6543',
        GPName: 'Dr. Michael Williams',
        GPPractice: 'Cardiff Bay Surgery',
        Medications: 'Metformin 500mg BD; Ramipril 2.5mg OD; Donepezil 10mg OD; Calcium/Vitamin D 1 tablet OD',
        CareNeeds: 'Dementia care, fall prevention, personal care assistance, cognitive stimulation',
        NextOfKin: 'David John Davies (Son) - 07700234567',
        Allergies: 'None known',
        CareLevel: 'Medium dependency',
        RoomNumber: 'B08',
        AdmissionDate: '2024-03-10',
        FundingType: 'Local Authority',
        MentalCapacity: 'Impaired - dementia',
        MobilityAid: 'Wheelchair',
        DietaryRequirements: 'Soft diet, finger foods',
        Religion: 'Methodist',
        SocialWorker: 'Janet Wilson - Cardiff Council'
      },
      expected_mapping: {
        resident_id: 'PCS002',
        full_name: 'Eleanor Mary Davies',
        first_name: 'Eleanor',
        middle_name: 'Mary',
        last_name: 'Davies',
        date_of_birth: '1938-07-22',
        gender: 'female',
        address: '456 Residential Close, Cardiff, South Wales',
        postcode: 'CF10 1BH',
        phone_number: '+442920876543',
        gp_name: 'Dr. Michael Williams',
        gp_practice: 'Cardiff Bay Surgery',
        current_medications: [
          { name: 'Metformin', dosage: '500mg', frequency: 'BD', route: 'Oral' },
          { name: 'Ramipril', dosage: '2.5mg', frequency: 'OD', route: 'Oral' },
          { name: 'Donepezil', dosage: '10mg', frequency: 'OD', route: 'Oral' },
          { name: 'Calcium/Vitamin D', dosage: '1 tablet', frequency: 'OD', route: 'Oral' }
        ],
        care_requirements: 'Dementia care, fall prevention, personal care assistance, cognitive stimulation',
        next_of_kin: {
          name: 'David John Davies',
          relationship: 'Son',
          phone: '+447700234567'
        },
        known_allergies: [],
        care_level: 'Medium dependency',
        mental_capacity: 'Impaired - dementia',
        mobility_aid: 'Wheelchair',
        dietary_requirements: 'Soft diet, finger foods',
        social_worker: 'Janet Wilson - Cardiff Council'
      },
      complexity_level: 'high',
      validation_challenges: [
        'Dementia-specific care requirements',
        'Mental capacity assessment data',
        'Social services integration data'
      ]
    }
  ];

  await knex('migration_test_residents').insert(residents);
}

async function seedCareSystemsUKData(knex: Knex): Promise<void> {
  const residents = [
    {
      id: '660e8400-e29b-41d4-a716-446655440010',
      source_system: 'care_systems_uk',
      source_format: 'mysql_export',
      raw_data: {
        ResidentRef: 'CSUK001',
        Surname: 'Thompson',
        Forename: 'Margaret',
        MiddleName: 'Rose',
        BirthDate: '15/03/1940',
        Gender: 'Female',
        PostCode: 'M1 1AA',
        PhoneNumber: '0161 123 4567',
        GPPractice: 'Manchester Medical Centre',
        CurrentMeds: 'Aspirin 75mg daily; Atorvastatin 20mg evening; Omeprazole 20mg morning; Folic acid 5mg weekly',
        Allergies: 'Penicillin, Shellfish',
        CareLevel: 'High dependency',
        MentalCapacity: 'Impaired',
        MobilityAid: 'Walking frame',
        DietaryRequirements: 'Diabetic diet',
        Religion: 'Church of England',
        NextOfKinName: 'James Thompson',
        NextOfKinRelation: 'Son',
        NextOfKinPhone: '07800123456',
        NextOfKinAddress: '789 Family Street, Manchester, M3 3CC',
        RiskAssessment: 'Falls risk - high; Wandering - low; Aggression - none',
        CarePackageHours: '24/7 residential care',
        LastReview: '15/12/2024',
        ReviewDue: '15/06/2025'
      },
      expected_mapping: {
        resident_id: 'CSUK001',
        last_name: 'Thompson',
        first_name: 'Margaret',
        middle_name: 'Rose',
        date_of_birth: '1940-03-15',
        gender: 'female',
        postcode: 'M1 1AA',
        phone_number: '+441611234567',
        gp_practice: 'Manchester Medical Centre',
        current_medications: [
          { name: 'Aspirin', dosage: '75mg', frequency: 'daily', route: 'Oral' },
          { name: 'Atorvastatin', dosage: '20mg', frequency: 'evening', route: 'Oral' },
          { name: 'Omeprazole', dosage: '20mg', frequency: 'morning', route: 'Oral' },
          { name: 'Folic acid', dosage: '5mg', frequency: 'weekly', route: 'Oral' }
        ],
        known_allergies: ['Penicillin', 'Shellfish'],
        care_level: 'High dependency',
        mental_capacity: 'Impaired',
        mobility_aid: 'Walking frame',
        dietary_requirements: 'Diabetic diet',
        religion: 'Church of England',
        next_of_kin: {
          name: 'James Thompson',
          relationship: 'Son',
          phone: '+447800123456',
          address: '789 Family Street, Manchester, M3 3CC'
        },
        risk_assessment: {
          falls_risk: 'high',
          wandering_risk: 'low',
          aggression_risk: 'none'
        },
        care_package: '24/7 residential care',
        last_review: '2024-12-15',
        next_review: '2025-06-15'
      },
      complexity_level: 'high',
      validation_challenges: [
        'UK date format conversion (DD/MM/YYYY)',
        'Complex risk assessment parsing',
        'Structured contact information extraction'
      ]
    }
  ];

  await knex('migration_test_residents').insert(residents);
}

async function seedNHSSpineData(knex: Knex): Promise<void> {
  const residents = [
    {
      id: '660e8400-e29b-41d4-a716-446655440020',
      source_system: 'nhs_spine',
      source_format: 'fhir_r4',
      raw_data: {
        resourceType: 'Patient',
        id: 'nhs-patient-001',
        identifier: [
          {
            use: 'official',
            system: 'https://fhir.nhs.uk/Id/nhs-number',
            value: '9876543210'
          }
        ],
        active: true,
        name: [
          {
            use: 'official',
            family: 'Johnson',
            given: ['Patricia', 'Anne'],
            prefix: ['Mrs']
          }
        ],
        telecom: [
          {
            system: 'phone',
            value: '020 7946 0958',
            use: 'home'
          },
          {
            system: 'email',
            value: 'patricia.johnson@email.com',
            use: 'home'
          }
        ],
        gender: 'female',
        birthDate: '1944-09-12',
        address: [
          {
            use: 'home',
            type: 'both',
            line: ['15 Victoria Street', 'Westminster'],
            city: 'London',
            postalCode: 'SW1A 1AA',
            country: 'GB'
          }
        ],
        contact: [
          {
            relationship: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                    code: 'C',
                    display: 'Emergency Contact'
                  }
                ]
              }
            ],
            name: {
              family: 'Johnson',
              given: ['Michael']
            },
            telecom: [
              {
                system: 'phone',
                value: '07700123456'
              }
            ]
          }
        ],
        generalPractitioner: [
          {
            reference: 'Practitioner/gp-001',
            display: 'Dr. James Brown, Westminster Medical Practice'
          }
        ]
      },
      expected_mapping: {
        nhs_number: '9876543210',
        last_name: 'Johnson',
        first_name: 'Patricia',
        middle_name: 'Anne',
        title: 'Mrs',
        date_of_birth: '1944-09-12',
        gender: 'female',
        phone_number: '+442079460958',
        email: 'patricia.johnson@email.com',
        address_line_1: '15 Victoria Street',
        address_line_2: 'Westminster',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'GB',
        emergency_contact: {
          name: 'Michael Johnson',
          relationship: 'Emergency Contact',
          phone: '+447700123456'
        },
        gp_reference: 'Dr. James Brown, Westminster Medical Practice'
      },
      complexity_level: 'high',
      validation_challenges: [
        'FHIR resource structure parsing',
        'NHS number validation',
        'Multiple address lines handling',
        'Complex contact relationship mapping'
      ]
    }
  ];

  await knex('migration_test_residents').insert(residents);
}

async function seedSocialServicesData(knex: Knex): Promise<void> {
  const residents = [
    {
      id: '660e8400-e29b-41d4-a716-446655440030',
      source_system: 'social_services',
      source_format: 'json_api',
      raw_data: {
        clientId: 'SS001',
        personalDetails: {
          clientName: 'George Harrison',
          dateOfBirth: '1943-02-25',
          gender: 'Male',
          ethnicity: 'White British',
          religion: 'None specified',
          preferredLanguage: 'English'
        },
        contactDetails: {
          homeAddress: {
            line1: '321 Sunset Gardens',
            line2: 'Meadowbank',
            city: 'Belfast',
            postcode: 'BT1 3CD',
            country: 'Northern Ireland'
          },
          phoneNumber: '028 9012 3456',
          emergencyContact: {
            name: 'Paul Harrison',
            relationship: 'Brother',
            phone: '028 9012 3457',
            address: 'Same as client'
          }
        },
        careAssessment: {
          carePackage: 'Residential Care',
          fundingType: 'NHS Continuing Healthcare',
          assessmentDate: '2024-12-15',
          careNeeds: 'Personal care, medication management, social interaction, physiotherapy support',
          riskFactors: 'Falls risk, confusion episodes, medication compliance issues',
          mobilityLevel: 'Requires assistance',
          cognitiveLevel: 'Mild cognitive impairment'
        },
        administrativeDetails: {
          socialWorker: 'Robert Taylor',
          localAuthority: 'Belfast City Council',
          careContribution: 0,
          reviewDate: '2025-06-15',
          caseNumber: 'BCC-2024-001'
        },
        medicalInformation: {
          gpName: 'Dr. Siobhan O\'Neill',
          gpPractice: 'Belfast Central Medical Practice',
          currentMedications: 'Donepezil 10mg OD; Memantine 20mg OD; Sertraline 50mg OD',
          knownAllergies: 'Latex, Codeine',
          medicalHistory: 'Alzheimer\'s disease, depression, hypertension'
        }
      },
      expected_mapping: {
        social_services_id: 'SS001',
        full_name: 'George Harrison',
        date_of_birth: '1943-02-25',
        gender: 'male',
        ethnicity: 'White British',
        religion: 'None specified',
        preferred_language: 'English',
        address_line_1: '321 Sunset Gardens',
        address_line_2: 'Meadowbank',
        city: 'Belfast',
        postcode: 'BT1 3CD',
        country: 'Northern Ireland',
        phone_number: '+442890123456',
        emergency_contact: {
          name: 'Paul Harrison',
          relationship: 'Brother',
          phone: '+442890123457'
        },
        care_package_type: 'Residential Care',
        funding_source: 'NHS Continuing Healthcare',
        last_assessment: '2024-12-15',
        care_requirements: 'Personal care, medication management, social interaction, physiotherapy support',
        identified_risks: ['Falls risk', 'confusion episodes', 'medication compliance issues'],
        mobility_level: 'Requires assistance',
        cognitive_level: 'Mild cognitive impairment',
        assigned_social_worker: 'Robert Taylor',
        local_authority: 'Belfast City Council',
        weekly_contribution: 0,
        next_review_date: '2025-06-15',
        case_number: 'BCC-2024-001',
        gp_name: 'Dr. Siobhan O\'Neill',
        gp_practice: 'Belfast Central Medical Practice',
        current_medications: [
          { name: 'Donepezil', dosage: '10mg', frequency: 'OD', route: 'Oral' },
          { name: 'Memantine', dosage: '20mg', frequency: 'OD', route: 'Oral' },
          { name: 'Sertraline', dosage: '50mg', frequency: 'OD', route: 'Oral' }
        ],
        known_allergies: ['Latex', 'Codeine'],
        medical_history: ['Alzheimer\'s disease', 'depression', 'hypertension']
      },
      complexity_level: 'high',
      validation_challenges: [
        'Nested JSON structure flattening',
        'Northern Ireland specific data formats',
        'Complex assessment data extraction',
        'Multiple medication sources reconciliation'
      ]
    }
  ];

  await knex('migration_test_residents').insert(residents);
}

async function seedGenericCSVData(knex: Knex): Promise<void> {
  const residents = [
    {
      id: '660e8400-e29b-41d4-a716-446655440040',
      source_system: 'generic_csv',
      source_format: 'csv_standard',
      raw_data: {
        ID: 'CSV001',
        'Full Name': 'Alice Margaret Wilson',
        'Date of Birth': '12/05/1941',
        'Phone': '0141 555 0123',
        'Address': '42 Highland Road, Glasgow',
        'Postcode': 'G1 4EF',
        'GP': 'Dr. Fiona MacLeod',
        'Medications': 'Atorvastatin 20mg evening, Amlodipine 10mg morning, Metformin 850mg twice daily',
        'Medical Conditions': 'Type 2 Diabetes, Hypertension, High Cholesterol',
        'Allergies': 'Sulfa drugs',
        'Care Level': 'Medium dependency',
        'Room': 'E18',
        'Admission': '20/01/2024',
        'Funding': 'Local Authority',
        'Next of Kin': 'Susan Anderson (Daughter) 07700567890',
        'Notes': 'Requires assistance with medication management and blood glucose monitoring'
      },
      expected_mapping: {
        resident_id: 'CSV001',
        full_name: 'Alice Margaret Wilson',
        date_of_birth: '1941-05-12',
        phone_number: '+441415550123',
        address: '42 Highland Road, Glasgow',
        postcode: 'G1 4EF',
        gp_name: 'Dr. Fiona MacLeod',
        current_medications: [
          { name: 'Atorvastatin', dosage: '20mg', frequency: 'evening', route: 'Oral' },
          { name: 'Amlodipine', dosage: '10mg', frequency: 'morning', route: 'Oral' },
          { name: 'Metformin', dosage: '850mg', frequency: 'twice daily', route: 'Oral' }
        ],
        medical_conditions: ['Type 2 Diabetes', 'Hypertension', 'High Cholesterol'],
        known_allergies: ['Sulfa drugs'],
        care_level: 'Medium dependency',
        room_number: 'E18',
        admission_date: '2024-01-20',
        funding_type: 'Local Authority',
        next_of_kin: {
          name: 'Susan Anderson',
          relationship: 'Daughter',
          phone: '+447700567890'
        },
        care_notes: 'Requires assistance with medication management and blood glucose monitoring'
      },
      complexity_level: 'medium',
      validation_challenges: [
        'Mixed date formats in single dataset',
        'Medication parsing with natural language',
        'Contact information extraction from text'
      ]
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440041',
      source_system: 'generic_csv',
      source_format: 'csv_non_standard',
      raw_data: {
        'Patient Ref': 'CSV002-COMPLEX',
        'Name (Last, First)': 'Brown, Thomas William',
        'DOB': '03-Dec-1939',
        'Tel': '(0131) 555-0124',
        'Home Address': '88 Royal Mile; Edinburgh; Scotland',
        'Post Code': 'EH1 1RF',
        'Doctor': 'Dr Emma Stewart / Royal Infirmary Practice',
        'Current Rx': 'Warfarin 3mg daily (Mon/Wed/Fri), 4mg daily (Tue/Thu/Sat/Sun) | Furosemide 40mg morning | Bisoprolol 2.5mg daily',
        'Medical Hx': 'Atrial fibrillation; Heart failure; Previous stroke 2019',
        'Allergic to': 'Aspirin (GI bleeding), NSAIDs',
        'Dependency': 'HIGH',
        'Accommodation': 'Room F-24 (ground floor)',
        'Start Date': '28-Feb-2024',
        'Payment': 'NHS CHC',
        'Family Contact': 'Helen Brown (wife) - mobile: 07700678901, email: helen.brown@email.com',
        'Special Notes': 'Anticoagulation clinic monitoring required; INR target 2.0-3.0; Fall risk due to anticoagulation'
      },
      expected_mapping: {
        resident_id: 'CSV002-COMPLEX',
        full_name: 'Thomas William Brown',
        last_name: 'Brown',
        first_name: 'Thomas',
        middle_name: 'William',
        date_of_birth: '1939-12-03',
        phone_number: '+441315550124',
        address: '88 Royal Mile, Edinburgh, Scotland',
        postcode: 'EH1 1RF',
        gp_name: 'Dr Emma Stewart',
        gp_practice: 'Royal Infirmary Practice',
        current_medications: [
          { 
            name: 'Warfarin', 
            dosage: '3mg/4mg', 
            frequency: 'Variable dosing schedule', 
            route: 'Oral',
            special_instructions: '3mg daily (Mon/Wed/Fri), 4mg daily (Tue/Thu/Sat/Sun)'
          },
          { name: 'Furosemide', dosage: '40mg', frequency: 'morning', route: 'Oral' },
          { name: 'Bisoprolol', dosage: '2.5mg', frequency: 'daily', route: 'Oral' }
        ],
        medical_history: ['Atrial fibrillation', 'Heart failure', 'Previous stroke 2019'],
        known_allergies: ['Aspirin (GI bleeding)', 'NSAIDs'],
        care_level: 'High dependency',
        room_number: 'F-24',
        room_features: ['ground floor'],
        admission_date: '2024-02-28',
        funding_type: 'NHS CHC',
        next_of_kin: {
          name: 'Helen Brown',
          relationship: 'wife',
          phone: '+447700678901',
          email: 'helen.brown@email.com'
        },
        special_care_requirements: [
          'Anticoagulation clinic monitoring required',
          'INR target 2.0-3.0',
          'Fall risk due to anticoagulation'
        ]
      },
      complexity_level: 'complex',
      validation_challenges: [
        'Complex medication dosing schedules',
        'Multiple date format variations',
        'Semicolon-separated address parsing',
        'Clinical monitoring requirements extraction',
        'Mixed contact information formats'
      ]
    }
  ];

  await knex('migration_test_residents').insert(residents);
}

async function seedMigrationPipelines(knex: Knex): Promise<void> {
  const pipelines = [
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      pipeline_name: 'Person Centred Software Full Migration',
      source_system: 'person_centred_software',
      configuration: {
        migrationApproach: 'phased',
        qualityThreshold: 95,
        autoMapping: true,
        backupEnabled: true,
        notificationPreferences: {
          enableRealTimeUpdates: true,
          emailNotifications: true,
          inAppNotifications: true
        },
        userExperience: {
          experienceLevel: 'intermediate',
          assistanceLevel: 'full',
          automationLevel: 'high'
        }
      },
      expected_results: {
        estimatedDuration: 45,
        expectedRecords: 1250,
        qualityScore: 92,
        successRate: 98,
        commonIssues: [
          'Date format inconsistencies',
          'Medication parsing complexities',
          'Contact information variations'
        ]
      },
      test_scenario: 'standard_care_home_migration'
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440002',
      pipeline_name: 'NHS Spine Integration Test',
      source_system: 'nhs_spine',
      configuration: {
        migrationApproach: 'pilot',
        qualityThreshold: 98,
        autoMapping: true,
        fhirCompliance: true,
        clinicalValidation: true,
        backupEnabled: true
      },
      expected_results: {
        estimatedDuration: 60,
        expectedRecords: 2100,
        qualityScore: 96,
        successRate: 99,
        commonIssues: [
          'FHIR resource complexity',
          'Clinical data validation',
          'NHS number verification'
        ]
      },
      test_scenario: 'nhs_integration_test'
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440003',
      pipeline_name: 'Multi-System Complex Migration',
      source_system: 'multiple',
      configuration: {
        migrationApproach: 'parallel_run',
        qualityThreshold: 90,
        autoMapping: true,
        conflictResolution: 'ai_assisted',
        dataDeduplication: true,
        crossReferenceValidation: true
      },
      expected_results: {
        estimatedDuration: 120,
        expectedRecords: 4500,
        qualityScore: 88,
        successRate: 94,
        commonIssues: [
          'Data format conflicts between systems',
          'Duplicate record detection',
          'Cross-reference validation challenges',
          'Complex transformation requirements'
        ]
      },
      test_scenario: 'complex_multi_system_migration'
    }
  ];

  await knex('migration_test_pipelines').insert(pipelines);
}

// Additional seeded data for edge cases and testing scenarios

export const migrationTestScenarios = {
  // Data quality scenarios
  poorQualityData: {
    description: 'Test migration with poor quality source data',
    data: [
      {
        'ID': '',
        'Name': 'John',
        'DOB': 'invalid-date',
        'Phone': '123',
        'Address': '',
        'Medications': 'some pills'
      }
    ],
    expectedChallenges: ['Missing required fields', 'Invalid date formats', 'Incomplete data']
  },
  
  // Large dataset scenario
  largeDataset: {
    description: 'Test migration performance with large dataset',
    recordCount: 10000,
    estimatedDuration: 180,
    performanceRequirements: {
      maxMemoryUsage: '2GB',
      maxProcessingTime: '3 hours',
      minThroughput: '50 records/second'
    }
  },
  
  // Legacy system edge cases
  legacySystemChallenges: {
    'ancient_access_db': {
      description: 'Very old Microsoft Access database',
      challenges: ['Proprietary format', 'Encoding issues', 'Relationship complexity'],
      migrationComplexity: 'complex'
    },
    'paper_records_digitized': {
      description: 'Scanned paper records with OCR',
      challenges: ['OCR errors', 'Inconsistent formatting', 'Missing data'],
      migrationComplexity: 'complex'
    },
    'multiple_excel_workbooks': {
      description: 'Data spread across multiple Excel files',
      challenges: ['File coordination', 'Version conflicts', 'Cross-reference validation'],
      migrationComplexity: 'high'
    }
  },
  
  // Regulatory compliance scenarios
  regulatoryScenarios: {
    gdprCompliance: {
      description: 'GDPR-compliant migration with consent tracking',
      requirements: ['Consent verification', 'Right to erasure', 'Data minimization'],
      specialHandling: true
    },
    clinicalSafety: {
      description: 'Clinical safety critical migration',
      requirements: ['Medication reconciliation', 'Allergy verification', 'Clinical validation'],
      validationLevel: 'enhanced'
    },
    auditTrail: {
      description: 'Full audit trail migration',
      requirements: ['Complete audit logs', 'Change tracking', 'User attribution'],
      auditLevel: 'comprehensive'
    }
  }
};

// Export additional test data generators
export const testDataGenerators = {
  generateResidentData: (count: number) => {
    const residents = [];
    const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'James', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    for (let i = 1; i <= count; i++) {
      residents.push({
        resident_id: `TEST${String(i).padStart(4, '0')}`,
        full_name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
        date_of_birth: new Date(1930 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        nhs_number: generateValidNHSNumber(),
        care_level: ['Low dependency', 'Medium dependency', 'High dependency'][Math.floor(Math.random() * 3)]
      });
    }
    
    return residents;
  },
  
  generateMedicationData: (residentCount: number) => {
    const medications = [];
    const commonMeds = [
      { name: 'Paracetamol', dosage: '1g', frequency: 'QDS PRN' },
      { name: 'Aspirin', dosage: '75mg', frequency: 'OD' },
      { name: 'Simvastatin', dosage: '20mg', frequency: 'ON' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'OD' },
      { name: 'Metformin', dosage: '500mg', frequency: 'BD' }
    ];
    
    for (let i = 1; i <= residentCount; i++) {
      const residentMeds = commonMeds.slice(0, Math.floor(Math.random() * 3) + 1);
      medications.push({
        resident_id: `TEST${String(i).padStart(4, '0')}`,
        medications: residentMeds
      });
    }
    
    return medications;
  }
};

function generateValidNHSNumber(): string {
  // Generate a valid NHS number with correct check digit
  const digits = [];
  for (let i = 0; i < 9; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  
  const sum = digits.reduce((acc, digit, index) => acc + digit * (10 - index), 0);
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;
  
  if (checkDigit === 11) {
    return generateValidNHSNumber(); // Regenerate if check digit would be 11
  }
  
  digits.push(checkDigit);
  return digits.join('');
}