/**
 * @fileoverview Seed data for residents table
 * @module ResidentsSeed
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates realistic test data for residents with proper healthcare
 * information, encrypted sensitive data, and compliance with UK standards.
 */

import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex('residents').del();

  // Test organization and tenant IDs
  const testOrgId = 'org-test-001';
  const testTenantId = 'tenant-test-001';
  const testUserId = 'user-test-001';

  // Sample residents data
  const residents = [
    {
      id: uuidv4(),
      first_name: 'John',
      last_name: 'Smith',
      preferred_name: 'Johnny',
      date_of_birth: '1945-03-15',
      gender: 'male',
      marital_status: 'widowed',
      nhs_number: '1234567890', // Will be encrypted in real implementation
      care_level: 'residential',
      status: 'active',
      admission_date: '2024-01-15',
      room_number: 'A101',
      risk_level: 2,
      risk_factors: ['falls_risk', 'medication_compliance'],
      organization_id: testOrgId,
      tenant_id: testTenantId,
      gdpr_consent_date: new Date(),
      gdpr_lawful_basis: 'healthcare',
      consent_to_treatment: true,
      consent_to_photography: false,
      consent_to_data_sharing: true,
      created_by: testUserId,
      medical_information: JSON.stringify({
        allergies: ['penicillin', 'shellfish'],
        medicalConditions: ['diabetes_type_2', 'hypertension'],
        medications: ['metformin', 'lisinopril'],
        dietaryRequirements: ['diabetic_diet'],
        mobilityAids: ['walking_frame'],
        communicationNeeds: []
      }),
      care_preferences: JSON.stringify({
        preferredName: 'Johnny',
        languagePreference: 'english',
        religiousBeliefs: 'christian',
        culturalNeeds: [],
        personalCarePreferences: ['morning_shower', 'assistance_with_dressing'],
        activityPreferences: ['reading', 'television', 'garden_walks'],
        foodPreferences: ['no_spicy_food'],
        sleepPreferences: 'early_to_bed',
        socialPreferences: 'enjoys_company'
      }),
      financial_information: JSON.stringify({
        weeklyFee: 850.00,
        currency: 'GBP',
        fundingSource: 'self_funded',
        paymentMethod: 'direct_debit',
        billingContact: 'daughter'
      }),
      emergency_contacts: JSON.stringify([
        {
          id: uuidv4(),
          name: 'Sarah Smith',
          relationship: 'child',
          phoneNumber: '+44 7700 900123',
          email: 'sarah.smith@example.com',
          isPrimary: true,
          canMakeDecisions: true,
          hasLegalAuthority: false
        }
      ])
    },
    {
      id: uuidv4(),
      first_name: 'Mary',
      last_name: 'Johnson',
      date_of_birth: '1938-07-22',
      gender: 'female',
      marital_status: 'widowed',
      nhs_number: '9876543210',
      care_level: 'dementia',
      status: 'active',
      admission_date: '2023-11-08',
      room_number: 'B205',
      risk_level: 4,
      risk_factors: ['wandering', 'confusion', 'falls_risk'],
      organization_id: testOrgId,
      tenant_id: testTenantId,
      gdpr_consent_date: new Date(),
      gdpr_lawful_basis: 'healthcare',
      consent_to_treatment: true,
      consent_to_photography: true,
      consent_to_data_sharing: false,
      created_by: testUserId,
      medical_information: JSON.stringify({
        allergies: ['latex'],
        medicalConditions: ['alzheimers_disease', 'osteoporosis'],
        medications: ['donepezil', 'calcium_vitamin_d'],
        dietaryRequirements: ['soft_diet', 'finger_foods'],
        mobilityAids: ['wheelchair'],
        communicationNeeds: ['simple_language', 'visual_cues']
      }),
      care_preferences: JSON.stringify({
        languagePreference: 'english',
        religiousBeliefs: 'catholic',
        culturalNeeds: ['sunday_mass'],
        personalCarePreferences: ['female_carers_only', 'evening_bath'],
        activityPreferences: ['music_therapy', 'reminiscence'],
        foodPreferences: ['sweet_treats', 'tea_with_milk'],
        sleepPreferences: 'afternoon_nap',
        socialPreferences: 'small_groups'
      }),
      financial_information: JSON.stringify({
        weeklyFee: 1200.00,
        currency: 'GBP',
        fundingSource: 'local_authority',
        localAuthorityReference: 'LA-2023-4567',
        paymentMethod: 'local_authority_direct',
        billingContact: 'social_services'
      }),
      emergency_contacts: JSON.stringify([
        {
          id: uuidv4(),
          name: 'Michael Johnson',
          relationship: 'child',
          phoneNumber: '+44 7700 900456',
          isPrimary: true,
          canMakeDecisions: true,
          hasLegalAuthority: true
        }
      ])
    },
    {
      id: uuidv4(),
      first_name: 'Robert',
      last_name: 'Williams',
      preferred_name: 'Bob',
      date_of_birth: '1942-12-03',
      gender: 'male',
      marital_status: 'married',
      nhs_number: '5555666677',
      care_level: 'nursing',
      status: 'active',
      admission_date: '2024-02-20',
      room_number: 'C301',
      risk_level: 3,
      risk_factors: ['pressure_sores', 'swallowing_difficulties'],
      organization_id: testOrgId,
      tenant_id: testTenantId,
      gdpr_consent_date: new Date(),
      gdpr_lawful_basis: 'healthcare',
      consent_to_treatment: true,
      consent_to_photography: true,
      consent_to_data_sharing: true,
      created_by: testUserId,
      medical_information: JSON.stringify({
        allergies: [],
        medicalConditions: ['stroke', 'dysphagia', 'diabetes_type_1'],
        medications: ['insulin', 'aspirin', 'simvastatin'],
        dietaryRequirements: ['pureed_diet', 'thickened_fluids'],
        mobilityAids: ['hoist', 'pressure_mattress'],
        communicationNeeds: ['speech_therapy', 'communication_board']
      }),
      care_preferences: JSON.stringify({
        preferredName: 'Bob',
        languagePreference: 'english',
        religiousBeliefs: 'none',
        culturalNeeds: [],
        personalCarePreferences: ['male_carers_preferred', 'morning_care'],
        activityPreferences: ['radio', 'family_visits'],
        foodPreferences: ['no_restrictions'],
        sleepPreferences: 'raised_bed_head',
        socialPreferences: 'quiet_environment'
      }),
      financial_information: JSON.stringify({
        weeklyFee: 1450.00,
        currency: 'GBP',
        fundingSource: 'nhs_funded',
        paymentMethod: 'nhs_direct',
        billingContact: 'ccg'
      }),
      emergency_contacts: JSON.stringify([
        {
          id: uuidv4(),
          name: 'Margaret Williams',
          relationship: 'spouse',
          phoneNumber: '+44 7700 900789',
          email: 'margaret.williams@example.com',
          isPrimary: true,
          canMakeDecisions: true,
          hasLegalAuthority: true
        }
      ])
    },
    {
      id: uuidv4(),
      first_name: 'Elizabeth',
      last_name: 'Brown',
      preferred_name: 'Betty',
      date_of_birth: '1950-05-18',
      gender: 'female',
      marital_status: 'divorced',
      nhs_number: '1111222233',
      care_level: 'mental_health',
      status: 'active',
      admission_date: '2024-03-10',
      room_number: 'D102',
      risk_level: 3,
      risk_factors: ['self_harm', 'medication_compliance', 'social_isolation'],
      organization_id: testOrgId,
      tenant_id: testTenantId,
      gdpr_consent_date: new Date(),
      gdpr_lawful_basis: 'healthcare',
      consent_to_treatment: true,
      consent_to_photography: false,
      consent_to_data_sharing: false,
      created_by: testUserId,
      medical_information: JSON.stringify({
        allergies: ['codeine'],
        medicalConditions: ['bipolar_disorder', 'arthritis'],
        medications: ['lithium', 'ibuprofen'],
        dietaryRequirements: [],
        mobilityAids: ['walking_stick'],
        communicationNeeds: ['mental_health_support']
      }),
      care_preferences: JSON.stringify({
        preferredName: 'Betty',
        languagePreference: 'english',
        religiousBeliefs: 'methodist',
        culturalNeeds: [],
        personalCarePreferences: ['privacy_important', 'female_carers_only'],
        activityPreferences: ['art_therapy', 'gardening'],
        foodPreferences: ['vegetarian'],
        sleepPreferences: 'quiet_room',
        socialPreferences: 'one_to_one_preferred'
      }),
      financial_information: JSON.stringify({
        weeklyFee: 950.00,
        currency: 'GBP',
        fundingSource: 'mixed_funding',
        paymentMethod: 'mixed',
        billingContact: 'self'
      }),
      emergency_contacts: JSON.stringify([
        {
          id: uuidv4(),
          name: 'Dr. James Peterson',
          relationship: 'gp',
          phoneNumber: '+44 1234 567890',
          isPrimary: false,
          canMakeDecisions: false,
          hasLegalAuthority: false
        },
        {
          id: uuidv4(),
          name: 'Social Services',
          relationship: 'social_worker',
          phoneNumber: '+44 1234 567891',
          isPrimary: true,
          canMakeDecisions: true,
          hasLegalAuthority: true
        }
      ])
    },
    {
      id: uuidv4(),
      first_name: 'James',
      last_name: 'Davis',
      date_of_birth: '1955-09-12',
      gender: 'male',
      marital_status: 'single',
      nhs_number: '4444555566',
      care_level: 'learning_disability',
      status: 'active',
      admission_date: '2023-08-15',
      room_number: 'E201',
      risk_level: 2,
      risk_factors: ['communication_difficulties', 'behavioral_challenges'],
      organization_id: testOrgId,
      tenant_id: testTenantId,
      gdpr_consent_date: new Date(),
      gdpr_lawful_basis: 'healthcare',
      consent_to_treatment: true,
      consent_to_photography: true,
      consent_to_data_sharing: true,
      created_by: testUserId,
      medical_information: JSON.stringify({
        allergies: [],
        medicalConditions: ['downs_syndrome', 'hypothyroidism'],
        medications: ['levothyroxine'],
        dietaryRequirements: ['easy_chew'],
        mobilityAids: [],
        communicationNeeds: ['simple_language', 'visual_aids', 'patience']
      }),
      care_preferences: JSON.stringify({
        languagePreference: 'english',
        religiousBeliefs: 'none',
        culturalNeeds: [],
        personalCarePreferences: ['routine_important', 'gentle_approach'],
        activityPreferences: ['music', 'simple_crafts', 'walks'],
        foodPreferences: ['familiar_foods'],
        sleepPreferences: 'consistent_bedtime',
        socialPreferences: 'enjoys_interaction'
      }),
      financial_information: JSON.stringify({
        weeklyFee: 1100.00,
        currency: 'GBP',
        fundingSource: 'continuing_healthcare',
        paymentMethod: 'nhs_direct',
        billingContact: 'learning_disability_team'
      }),
      emergency_contacts: JSON.stringify([
        {
          id: uuidv4(),
          name: 'Learning Disability Team',
          relationship: 'social_worker',
          phoneNumber: '+44 1234 567892',
          isPrimary: true,
          canMakeDecisions: true,
          hasLegalAuthority: true
        }
      ])
    }
  ];

  // Insert seed data
  await knex('residents').insert(residents);
}