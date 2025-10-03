/**
 * @fileoverview Seed data for medications table
 * @module MedicationsSeed
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Creates realistic medication data for testing and development
 * with proper pharmaceutical information and UK healthcare compliance.
 */

import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex('medications').del();

  // Test user ID for created_by
  const testUserId = 'user-test-001';

  // Common medications used in UK care homes
  const medications = [
    {
      id: uuidv4(),
      generic_name: 'Paracetamol',
      brand_name: 'Panadol',
      alternative_names: ['Acetaminophen'],
      active_ingredients: ['Paracetamol'],
      strength: '500',
      strength_unit: 'mg',
      form: 'tablet',
      route: 'oral',
      therapeutic_class: 'analgesic',
      controlled_drug_schedule: 'not_controlled',
      snomed_code: '387517004',
      dmd_code: '90332006',
      bnf_code: '4.7.1',
      atc_code: 'N02BE01',
      manufacturer: 'GlaxoSmithKline',
      marketing_authorization_holder: 'GSK Consumer Healthcare',
      license_number: 'PL 44673/0001',
      indications: ['Pain relief', 'Fever reduction'],
      contraindications: [
        {
          condition: 'Severe hepatic impairment',
          severity: 'absolute',
          reason: 'Risk of hepatotoxicity',
          alternatives: ['Ibuprofen', 'Codeine']
        }
      ],
      side_effects: [
        {
          effect: 'Nausea',
          frequency: 'uncommon',
          severity: 'mild',
          bodySystem: 'Gastrointestinal',
          description: 'Mild stomach upset'
        },
        {
          effect: 'Hepatotoxicity',
          frequency: 'rare',
          severity: 'severe',
          bodySystem: 'Hepatic',
          description: 'Liver damage with overdose'
        }
      ],
      drug_interactions: [
        {
          interactingDrug: 'Warfarin',
          severity: 'moderate',
          mechanism: 'Enhanced anticoagulant effect',
          clinicalEffect: 'Increased bleeding risk',
          management: 'Monitor INR more frequently',
          references: ['BNF 82']
        }
      ],
      monitoring_requirements: [],
      standard_dose_adult: '500mg-1g every 4-6 hours',
      standard_dose_elderly: '500mg every 6 hours',
      maximum_daily_dose: 4000,
      minimum_interval_hours: 4,
      storage_requirements: {
        temperature: { min: 15, max: 25, unit: 'celsius' },
        lightProtection: false,
        refrigerated: false,
        frozen: false,
        controlledRoom: false,
        specialInstructions: ['Store in original container', 'Keep dry']
      },
      shelf_life_months: 36,
      special_precautions: ['Avoid alcohol', 'Check other medications for paracetamol content'],
      is_active: true,
      is_prescription_only: false,
      is_black_triangle: false,
      nhs_indicative_price: 0.85,
      drug_tariff_category: 'Category A',
      created_by: testUserId
    },
    {
      id: uuidv4(),
      generic_name: 'Morphine Sulfate',
      brand_name: 'MST Continus',
      alternative_names: ['Morphine'],
      active_ingredients: ['Morphine Sulfate'],
      strength: '10',
      strength_unit: 'mg',
      form: 'tablet',
      route: 'oral',
      therapeutic_class: 'analgesic',
      controlled_drug_schedule: 'schedule_2',
      snomed_code: '373529000',
      dmd_code: '318341003',
      bnf_code: '4.7.2',
      atc_code: 'N02AA01',
      manufacturer: 'Napp Pharmaceuticals',
      marketing_authorization_holder: 'Napp Pharmaceuticals Limited',
      license_number: 'PL 16950/0001',
      indications: ['Severe pain', 'Palliative care'],
      contraindications: [
        {
          condition: 'Respiratory depression',
          severity: 'absolute',
          reason: 'Risk of fatal respiratory arrest',
          alternatives: ['Non-opioid analgesics']
        },
        {
          condition: 'Acute alcoholism',
          severity: 'absolute',
          reason: 'Enhanced CNS depression',
          alternatives: ['Paracetamol', 'NSAIDs']
        }
      ],
      side_effects: [
        {
          effect: 'Constipation',
          frequency: 'very_common',
          severity: 'moderate',
          bodySystem: 'Gastrointestinal',
          description: 'Reduced bowel motility'
        },
        {
          effect: 'Respiratory depression',
          frequency: 'common',
          severity: 'severe',
          bodySystem: 'Respiratory',
          description: 'Reduced respiratory rate and depth'
        },
        {
          effect: 'Drowsiness',
          frequency: 'very_common',
          severity: 'mild',
          bodySystem: 'Neurological',
          description: 'Sedation and reduced alertness'
        }
      ],
      drug_interactions: [
        {
          interactingDrug: 'Benzodiazepines',
          severity: 'major',
          mechanism: 'Additive CNS depression',
          clinicalEffect: 'Severe sedation and respiratory depression',
          management: 'Avoid concurrent use or reduce doses significantly',
          references: ['MHRA Drug Safety Update']
        }
      ],
      monitoring_requirements: [
        {
          parameter: 'Respiratory rate',
          frequency: 'Every 4 hours initially',
          normalRange: '12-20 breaths per minute',
          actionRequired: 'Hold dose if <12/min, contact doctor if <10/min',
          urgency: 'urgent'
        },
        {
          parameter: 'Pain score',
          frequency: 'Every 4 hours',
          normalRange: '0-3/10',
          actionRequired: 'Assess effectiveness and adjust dose',
          urgency: 'routine'
        }
      ],
      standard_dose_adult: '10-30mg every 12 hours',
      standard_dose_elderly: '5-10mg every 12 hours',
      maximum_daily_dose: 200,
      minimum_interval_hours: 12,
      storage_requirements: {
        temperature: { min: 15, max: 25, unit: 'celsius' },
        lightProtection: true,
        refrigerated: false,
        frozen: false,
        controlledRoom: true,
        specialInstructions: ['Store in controlled drugs cupboard', 'Double lock required']
      },
      shelf_life_months: 24,
      special_precautions: ['Controlled drug - witness required', 'Risk of dependence', 'Gradual withdrawal needed'],
      is_active: true,
      is_prescription_only: true,
      is_black_triangle: false,
      nhs_indicative_price: 12.50,
      drug_tariff_category: 'Category C',
      created_by: testUserId
    },
    {
      id: uuidv4(),
      generic_name: 'Amlodipine',
      brand_name: 'Norvasc',
      alternative_names: ['Amlodipine Besylate'],
      active_ingredients: ['Amlodipine'],
      strength: '5',
      strength_unit: 'mg',
      form: 'tablet',
      route: 'oral',
      therapeutic_class: 'antihypertensive',
      controlled_drug_schedule: 'not_controlled',
      snomed_code: '386864001',
      dmd_code: '318982001',
      bnf_code: '2.6.2',
      atc_code: 'C08CA01',
      manufacturer: 'Pfizer',
      marketing_authorization_holder: 'Pfizer Limited',
      license_number: 'PL 00057/0001',
      indications: ['Hypertension', 'Angina pectoris'],
      contraindications: [
        {
          condition: 'Cardiogenic shock',
          severity: 'absolute',
          reason: 'Further reduction in cardiac output',
          alternatives: ['ACE inhibitors', 'Beta blockers']
        }
      ],
      side_effects: [
        {
          effect: 'Ankle swelling',
          frequency: 'common',
          severity: 'mild',
          bodySystem: 'Cardiovascular',
          description: 'Peripheral edema due to vasodilation'
        },
        {
          effect: 'Dizziness',
          frequency: 'common',
          severity: 'mild',
          bodySystem: 'Neurological',
          description: 'Due to blood pressure reduction'
        }
      ],
      drug_interactions: [
        {
          interactingDrug: 'Simvastatin',
          severity: 'moderate',
          mechanism: 'CYP3A4 inhibition',
          clinicalEffect: 'Increased simvastatin levels',
          management: 'Limit simvastatin to 20mg daily',
          references: ['BNF 82']
        }
      ],
      monitoring_requirements: [
        {
          parameter: 'Blood pressure',
          frequency: 'Weekly initially, then monthly',
          normalRange: '<140/90 mmHg',
          actionRequired: 'Adjust dose if target not achieved',
          urgency: 'routine'
        }
      ],
      standard_dose_adult: '5-10mg once daily',
      standard_dose_elderly: '2.5-5mg once daily',
      maximum_daily_dose: 10,
      minimum_interval_hours: 24,
      storage_requirements: {
        temperature: { min: 15, max: 30, unit: 'celsius' },
        lightProtection: false,
        refrigerated: false,
        frozen: false,
        controlledRoom: false
      },
      shelf_life_months: 36,
      special_precautions: ['Monitor for ankle swelling', 'Avoid grapefruit juice'],
      is_active: true,
      is_prescription_only: true,
      is_black_triangle: false,
      nhs_indicative_price: 1.20,
      drug_tariff_category: 'Category A',
      created_by: testUserId
    },
    {
      id: uuidv4(),
      generic_name: 'Donepezil',
      brand_name: 'Aricept',
      alternative_names: ['Donepezil Hydrochloride'],
      active_ingredients: ['Donepezil Hydrochloride'],
      strength: '10',
      strength_unit: 'mg',
      form: 'tablet',
      route: 'oral',
      therapeutic_class: 'other',
      controlled_drug_schedule: 'not_controlled',
      snomed_code: '386840002',
      dmd_code: '318637003',
      bnf_code: '4.11',
      atc_code: 'N06DA02',
      manufacturer: 'Eisai',
      marketing_authorization_holder: 'Eisai Limited',
      license_number: 'PL 10555/0001',
      indications: ['Alzheimer\'s disease', 'Dementia'],
      contraindications: [
        {
          condition: 'Known hypersensitivity',
          severity: 'absolute',
          reason: 'Risk of allergic reaction',
          alternatives: ['Rivastigmine', 'Galantamine']
        }
      ],
      side_effects: [
        {
          effect: 'Nausea',
          frequency: 'common',
          severity: 'mild',
          bodySystem: 'Gastrointestinal',
          description: 'Cholinergic side effect'
        },
        {
          effect: 'Diarrhea',
          frequency: 'common',
          severity: 'mild',
          bodySystem: 'Gastrointestinal',
          description: 'Increased bowel motility'
        },
        {
          effect: 'Bradycardia',
          frequency: 'uncommon',
          severity: 'moderate',
          bodySystem: 'Cardiovascular',
          description: 'Slow heart rate due to cholinergic effects'
        }
      ],
      drug_interactions: [
        {
          interactingDrug: 'Anticholinergics',
          severity: 'moderate',
          mechanism: 'Pharmacological antagonism',
          clinicalEffect: 'Reduced efficacy of donepezil',
          management: 'Avoid concurrent use if possible',
          references: ['BNF 82']
        }
      ],
      monitoring_requirements: [
        {
          parameter: 'Cognitive function',
          frequency: 'Every 6 months',
          normalRange: 'Stable or improved MMSE score',
          actionRequired: 'Consider discontinuation if significant decline',
          urgency: 'routine'
        },
        {
          parameter: 'Heart rate',
          frequency: 'Monthly initially',
          normalRange: '60-100 bpm',
          actionRequired: 'Monitor for bradycardia',
          urgency: 'routine'
        }
      ],
      standard_dose_adult: '5-10mg once daily',
      standard_dose_elderly: '5mg once daily initially',
      maximum_daily_dose: 10,
      minimum_interval_hours: 24,
      storage_requirements: {
        temperature: { min: 15, max: 30, unit: 'celsius' },
        lightProtection: false,
        refrigerated: false,
        frozen: false,
        controlledRoom: false
      },
      shelf_life_months: 36,
      special_precautions: ['Take in evening', 'Monitor for GI side effects', 'Gradual dose increase'],
      is_active: true,
      is_prescription_only: true,
      is_black_triangle: false,
      nhs_indicative_price: 2.85,
      drug_tariff_category: 'Category A',
      created_by: testUserId
    },
    {
      id: uuidv4(),
      generic_name: 'Insulin Human',
      brand_name: 'Humulin I',
      alternative_names: ['Human Insulin', 'Isophane Insulin'],
      active_ingredients: ['Human Insulin'],
      strength: '100',
      strength_unit: 'units/ml',
      form: 'injection',
      route: 'subcutaneous',
      therapeutic_class: 'antidiabetic',
      controlled_drug_schedule: 'not_controlled',
      snomed_code: '396064000',
      dmd_code: '323465006',
      bnf_code: '6.1.1',
      atc_code: 'A10AC01',
      manufacturer: 'Eli Lilly',
      marketing_authorization_holder: 'Eli Lilly and Company Limited',
      license_number: 'PL 00006/0001',
      indications: ['Type 1 diabetes', 'Type 2 diabetes'],
      contraindications: [
        {
          condition: 'Hypoglycemia',
          severity: 'absolute',
          reason: 'Risk of severe hypoglycemic episode',
          alternatives: ['Glucose administration']
        }
      ],
      side_effects: [
        {
          effect: 'Hypoglycemia',
          frequency: 'very_common',
          severity: 'severe',
          bodySystem: 'Endocrine',
          description: 'Low blood glucose levels'
        },
        {
          effect: 'Injection site reaction',
          frequency: 'common',
          severity: 'mild',
          bodySystem: 'Local',
          description: 'Redness, swelling at injection site'
        }
      ],
      drug_interactions: [
        {
          interactingDrug: 'Beta blockers',
          severity: 'moderate',
          mechanism: 'Masking of hypoglycemic symptoms',
          clinicalEffect: 'Delayed recognition of hypoglycemia',
          management: 'Monitor blood glucose more frequently',
          references: ['BNF 82']
        }
      ],
      monitoring_requirements: [
        {
          parameter: 'Blood glucose',
          frequency: 'Before meals and bedtime',
          normalRange: '4-7 mmol/L pre-meal, <10 mmol/L post-meal',
          actionRequired: 'Adjust dose based on glucose levels',
          urgency: 'immediate'
        },
        {
          parameter: 'HbA1c',
          frequency: 'Every 3-6 months',
          normalRange: '<7% (53 mmol/mol)',
          actionRequired: 'Review diabetes management if elevated',
          urgency: 'routine'
        }
      ],
      standard_dose_adult: '0.5-1 unit/kg/day divided',
      standard_dose_elderly: '0.2-0.5 unit/kg/day initially',
      maximum_daily_dose: null, // Variable based on individual needs
      minimum_interval_hours: null, // Multiple daily injections
      storage_requirements: {
        temperature: { min: 2, max: 8, unit: 'celsius' },
        lightProtection: true,
        refrigerated: true,
        frozen: false,
        controlledRoom: false,
        specialInstructions: ['Do not freeze', 'In-use vials can be stored at room temperature for 28 days']
      },
      shelf_life_months: 30,
      special_precautions: ['Rotate injection sites', 'Monitor for hypoglycemia', 'Adjust dose with illness'],
      is_active: true,
      is_prescription_only: true,
      is_black_triangle: false,
      nhs_indicative_price: 15.68,
      drug_tariff_category: 'Category C',
      created_by: testUserId
    }
  ];

  // Insert seed data
  await knex('medications').insert(medications);
}