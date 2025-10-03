/**
 * @fileoverview Seed Data for Medication Interaction Tables
 * @module MedicationInteractionSeed
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive seed data for medication interactions, drug database,
 * contraindications, and clinical decision support data for testing and development.
 * 
 * @compliance
 * - MHRA Drug Safety Guidelines
 * - BNF (British National Formulary) Standards
 * - NICE Clinical Guidelines
 * - CQC Regulation 12 - Safe care and treatment
 * - Professional Standards (GMC, NMC, GPhC)
 */

import { AppDataSource } from '../../src/config/database';
import { logger } from '../../src/utils/logger';

export class MedicationInteractionSeed {
  async run(): Promise<void> {
    try {
      logger.info('Starting medication interaction seed data insertion...');

      // Seed drug database
      await this.seedDrugDatabase();

      // Seed drug interactions
      await this.seedDrugInteractions();

      // Seed medication contraindications
      await this.seedMedicationContraindications();

      // Seed sample resident allergies
      await this.seedResidentAllergies();

      // Seed sample resident conditions
      await this.seedResidentConditions();

      logger.info('Medication interaction seed data insertion completed successfully');
    } catch (error) {
      logger.error('Error inserting medication interaction seed data', { error: error.message });
      throw error;
    }
  }

  private async seedDrugDatabase(): Promise<void> {
    const drugs = [
      {
        id: 'drug_warfarin_001',
        name: 'Warfarin',
        activeIngredients: ['warfarin sodium'],
        therapeuticClass: 'Anticoagulant',
        pharmacologicalClass: 'Vitamin K antagonist',
        mechanism: 'Inhibits vitamin K-dependent clotting factors',
        indications: ['Atrial fibrillation', 'Deep vein thrombosis', 'Pulmonary embolism'],
        contraindications: ['Active bleeding', 'Severe liver disease', 'Pregnancy'],
        warnings: ['Bleeding risk', 'Drug interactions', 'Regular INR monitoring required'],
        interactions: ['Aspirin', 'NSAIDs', 'Antibiotics', 'Amiodarone'],
        sideEffects: ['Bleeding', 'Bruising', 'Hair loss', 'Skin necrosis'],
        dosageInformation: [
          { route: 'oral', strength: '1mg, 3mg, 5mg tablets', frequency: 'once daily', duration: 'long-term' }
        ],
        specialPopulations: {
          pregnancy: 'Contraindicated - teratogenic',
          breastfeeding: 'Compatible with monitoring',
          pediatric: 'Specialist use only',
          geriatric: 'Start with lower doses',
          renalImpairment: 'No dose adjustment needed',
          hepaticImpairment: 'Contraindicated in severe disease'
        },
        monitoringParameters: ['INR', 'Signs of bleeding', 'Liver function tests']
      },
      {
        id: 'drug_aspirin_001',
        name: 'Aspirin',
        activeIngredients: ['acetylsalicylic acid'],
        therapeuticClass: 'Antiplatelet agent',
        pharmacologicalClass: 'NSAID',
        mechanism: 'Irreversibly inhibits COX-1 and COX-2',
        indications: ['Cardiovascular protection', 'Stroke prevention', 'Pain relief'],
        contraindications: ['Active peptic ulcer', 'Severe asthma', 'Children under 16'],
        warnings: ['GI bleeding risk', 'Reye syndrome in children', 'Asthma exacerbation'],
        interactions: ['Warfarin', 'Methotrexate', 'ACE inhibitors'],
        sideEffects: ['GI upset', 'Bleeding', 'Tinnitus', 'Allergic reactions'],
        dosageInformation: [
          { route: 'oral', strength: '75mg, 300mg tablets', frequency: 'once daily', duration: 'long-term' }
        ],
        specialPopulations: {
          pregnancy: 'Avoid in third trimester',
          breastfeeding: 'Use with caution',
          pediatric: 'Contraindicated under 16 years',
          geriatric: 'Increased bleeding risk',
          renalImpairment: 'Reduce dose',
          hepaticImpairment: 'Use with caution'
        },
        monitoringParameters: ['Signs of bleeding', 'GI symptoms', 'Renal function']
      },
      {
        id: 'drug_metformin_001',
        name: 'Metformin',
        activeIngredients: ['metformin hydrochloride'],
        therapeuticClass: 'Antidiabetic',
        pharmacologicalClass: 'Biguanide',
        mechanism: 'Decreases hepatic glucose production',
        indications: ['Type 2 diabetes mellitus', 'PCOS'],
        contraindications: ['Severe renal impairment', 'Metabolic acidosis', 'Severe heart failure'],
        warnings: ['Lactic acidosis risk', 'Vitamin B12 deficiency', 'Contrast media interactions'],
        interactions: ['Contrast media', 'Alcohol', 'Cimetidine'],
        sideEffects: ['GI upset', 'Diarrhea', 'Metallic taste', 'Vitamin B12 deficiency'],
        dosageInformation: [
          { route: 'oral', strength: '500mg, 850mg, 1000mg tablets', frequency: 'twice daily', duration: 'long-term' }
        ],
        specialPopulations: {
          pregnancy: 'Generally safe',
          breastfeeding: 'Compatible',
          pediatric: 'Licensed from 10 years',
          geriatric: 'Monitor renal function',
          renalImpairment: 'Contraindicated if eGFR <30',
          hepaticImpairment: 'Use with caution'
        },
        monitoringParameters: ['HbA1c', 'Renal function', 'Vitamin B12 levels']
      },
      {
        id: 'drug_amoxicillin_001',
        name: 'Amoxicillin',
        activeIngredients: ['amoxicillin trihydrate'],
        therapeuticClass: 'Antibiotic',
        pharmacologicalClass: 'Penicillin',
        mechanism: 'Inhibits bacterial cell wall synthesis',
        indications: ['Respiratory tract infections', 'UTIs', 'Skin infections'],
        contraindications: ['Penicillin allergy', 'Severe renal impairment'],
        warnings: ['Allergic reactions', 'C. difficile colitis', 'Rash in viral infections'],
        interactions: ['Warfarin', 'Methotrexate', 'Oral contraceptives'],
        sideEffects: ['Diarrhea', 'Nausea', 'Rash', 'Allergic reactions'],
        dosageInformation: [
          { route: 'oral', strength: '250mg, 500mg capsules', frequency: 'three times daily', duration: '5-10 days' }
        ],
        specialPopulations: {
          pregnancy: 'Safe to use',
          breastfeeding: 'Compatible',
          pediatric: 'Widely used',
          geriatric: 'No specific precautions',
          renalImpairment: 'Reduce dose',
          hepaticImpairment: 'No adjustment needed'
        },
        monitoringParameters: ['Signs of infection resolution', 'Allergic reactions', 'GI symptoms']
      },
      {
        id: 'drug_simvastatin_001',
        name: 'Simvastatin',
        activeIngredients: ['simvastatin'],
        therapeuticClass: 'Lipid-lowering agent',
        pharmacologicalClass: 'HMG-CoA reductase inhibitor',
        mechanism: 'Inhibits cholesterol synthesis',
        indications: ['Hypercholesterolemia', 'Cardiovascular risk reduction'],
        contraindications: ['Active liver disease', 'Pregnancy', 'Breastfeeding'],
        warnings: ['Myopathy risk', 'Liver toxicity', 'Drug interactions'],
        interactions: ['Warfarin', 'Digoxin', 'Amlodipine', 'Clarithromycin'],
        sideEffects: ['Muscle pain', 'Headache', 'GI upset', 'Elevated liver enzymes'],
        dosageInformation: [
          { route: 'oral', strength: '10mg, 20mg, 40mg tablets', frequency: 'once daily evening', duration: 'long-term' }
        ],
        specialPopulations: {
          pregnancy: 'Contraindicated',
          breastfeeding: 'Contraindicated',
          pediatric: 'Specialist use only',
          geriatric: 'Start with lower doses',
          renalImpairment: 'Use with caution',
          hepaticImpairment: 'Contraindicated'
        },
        monitoringParameters: ['Lipid profile', 'Liver function tests', 'CK levels']
      }
    ];

    for (const drug of drugs) {
      await AppDataSource.query(`
        INSERT INTO drug_database (
          id, name, active_ingredients, therapeutic_class, pharmacological_class,
          mechanism, indications, contraindications, warnings, interactions,
          side_effects, dosage_information, special_populations, monitoring_parameters,
          last_updated, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING
      `, [
        drug.id, drug.name, JSON.stringify(drug.activeIngredients),
        drug.therapeuticClass, drug.pharmacologicalClass, drug.mechanism,
        JSON.stringify(drug.indications), JSON.stringify(drug.contraindications),
        JSON.stringify(drug.warnings), JSON.stringify(drug.interactions),
        JSON.stringify(drug.sideEffects), JSON.stringify(drug.dosageInformation),
        JSON.stringify(drug.specialPopulations), JSON.stringify(drug.monitoringParameters),
        new Date(), new Date()
      ]);
    }

    logger.info('Drug database seed data inserted successfully');
  }

  private async seedDrugInteractions(): Promise<void> {
    const interactions = [
      {
        id: 'int_warfarin_aspirin_001',
        drug1Id: 'drug_warfarin_001',
        drug1Name: 'Warfarin',
        drug2Id: 'drug_aspirin_001',
        drug2Name: 'Aspirin',
        interactionType: 'major',
        severity: 'critical',
        mechanism: 'Additive anticoagulant and antiplatelet effects',
        clinicalEffect: 'Significantly increased bleeding risk',
        management: 'Avoid combination if possible. If used together, monitor INR closely and watch for bleeding signs. Consider PPI for GI protection.',
        evidence: 'established',
        references: ['BNF 2024', 'NICE CG181', 'Cochrane Review 2019']
      },
      {
        id: 'int_warfarin_amoxicillin_001',
        drug1Id: 'drug_warfarin_001',
        drug1Name: 'Warfarin',
        drug2Id: 'drug_amoxicillin_001',
        drug2Name: 'Amoxicillin',
        interactionType: 'moderate',
        severity: 'medium',
        mechanism: 'Alteration of gut flora affecting vitamin K production',
        clinicalEffect: 'Potential increase in anticoagulant effect',
        management: 'Monitor INR more frequently during antibiotic course and for 1 week after completion.',
        evidence: 'established',
        references: ['BNF 2024', 'MHRA Drug Safety Update 2018']
      },
      {
        id: 'int_warfarin_simvastatin_001',
        drug1Id: 'drug_warfarin_001',
        drug1Name: 'Warfarin',
        drug2Id: 'drug_simvastatin_001',
        drug2Name: 'Simvastatin',
        interactionType: 'minor',
        severity: 'low',
        mechanism: 'Potential CYP450 enzyme competition',
        clinicalEffect: 'Slight increase in warfarin effect possible',
        management: 'Monitor INR when starting or stopping simvastatin. Usually no dose adjustment needed.',
        evidence: 'theoretical',
        references: ['BNF 2024', 'Clinical Pharmacology Review 2020']
      },
      {
        id: 'int_aspirin_metformin_001',
        drug1Id: 'drug_aspirin_001',
        drug1Name: 'Aspirin',
        drug2Id: 'drug_metformin_001',
        drug2Name: 'Metformin',
        interactionType: 'minor',
        severity: 'low',
        mechanism: 'Potential enhancement of hypoglycemic effect',
        clinicalEffect: 'Slight increase in glucose-lowering effect',
        management: 'Monitor blood glucose levels. Usually no dose adjustment needed.',
        evidence: 'theoretical',
        references: ['BNF 2024', 'Diabetes Care Guidelines 2023']
      },
      {
        id: 'int_amoxicillin_metformin_001',
        drug1Id: 'drug_amoxicillin_001',
        drug1Name: 'Amoxicillin',
        drug2Id: 'drug_metformin_001',
        drug2Name: 'Metformin',
        interactionType: 'minor',
        severity: 'low',
        mechanism: 'Potential alteration of gut flora affecting metformin absorption',
        clinicalEffect: 'Possible temporary change in glucose control',
        management: 'Monitor blood glucose during antibiotic course. Usually no intervention needed.',
        evidence: 'anecdotal',
        references: ['Clinical observation reports']
      }
    ];

    for (const interaction of interactions) {
      await AppDataSource.query(`
        INSERT INTO drug_interactions (
          id, drug1_id, drug1_name, drug2_id, drug2_name, interaction_type,
          severity, mechanism, clinical_effect, management, evidence,
          references, is_active, last_updated, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
      `, [
        interaction.id, interaction.drug1Id, interaction.drug1Name,
        interaction.drug2Id, interaction.drug2Name, interaction.interactionType,
        interaction.severity, interaction.mechanism, interaction.clinicalEffect,
        interaction.management, interaction.evidence, JSON.stringify(interaction.references),
        true, new Date(), new Date()
      ]);
    }

    logger.info('Drug interactions seed data inserted successfully');
  }

  private async seedMedicationContraindications(): Promise<void> {
    const contraindications = [
      {
        id: 'contra_warfarin_001',
        medicationId: 'drug_warfarin_001',
        medicationName: 'Warfarin',
        activeIngredient: 'warfarin sodium',
        contraindicationType: 'absolute',
        condition: 'Active bleeding',
        reason: 'Warfarin increases bleeding risk',
        severity: 'critical',
        clinicalGuidance: 'Do not initiate warfarin in patients with active bleeding. Stop warfarin immediately if significant bleeding occurs.',
        alternativeOptions: ['Direct oral anticoagulants (when bleeding resolved)', 'Heparin (short-term)'],
        references: ['BNF 2024', 'NICE CG180']
      },
      {
        id: 'contra_warfarin_002',
        medicationId: 'drug_warfarin_001',
        medicationName: 'Warfarin',
        activeIngredient: 'warfarin sodium',
        contraindicationType: 'absolute',
        condition: 'Pregnancy',
        reason: 'Teratogenic effects and fetal bleeding risk',
        severity: 'critical',
        clinicalGuidance: 'Contraindicated throughout pregnancy. Switch to LMWH before conception or immediately if pregnancy detected.',
        alternativeOptions: ['Low molecular weight heparin', 'Unfractionated heparin'],
        references: ['BNF 2024', 'RCOG Guidelines 2021']
      },
      {
        id: 'contra_aspirin_001',
        medicationId: 'drug_aspirin_001',
        medicationName: 'Aspirin',
        activeIngredient: 'acetylsalicylic acid',
        contraindicationType: 'absolute',
        condition: 'Children under 16 years',
        reason: 'Risk of Reye syndrome',
        severity: 'critical',
        clinicalGuidance: 'Never give aspirin to children under 16 years except on specialist advice for specific conditions like Kawasaki disease.',
        alternativeOptions: ['Paracetamol', 'Ibuprofen (over 3 months)'],
        references: ['BNF for Children 2024', 'MHRA Safety Alert']
      },
      {
        id: 'contra_metformin_001',
        medicationId: 'drug_metformin_001',
        medicationName: 'Metformin',
        activeIngredient: 'metformin hydrochloride',
        contraindicationType: 'absolute',
        condition: 'Severe renal impairment (eGFR <30)',
        reason: 'Risk of lactic acidosis',
        severity: 'critical',
        clinicalGuidance: 'Stop metformin if eGFR falls below 30 ml/min/1.73m². Review dose if eGFR 30-45.',
        alternativeOptions: ['Insulin', 'Sulfonylureas', 'DPP-4 inhibitors'],
        references: ['BNF 2024', 'NICE NG28']
      },
      {
        id: 'contra_amoxicillin_001',
        medicationId: 'drug_amoxicillin_001',
        medicationName: 'Amoxicillin',
        activeIngredient: 'amoxicillin trihydrate',
        contraindicationType: 'absolute',
        condition: 'Penicillin allergy',
        reason: 'Risk of severe allergic reaction including anaphylaxis',
        severity: 'critical',
        clinicalGuidance: 'Never give penicillins to patients with known penicillin allergy. Ensure allergy status is clearly documented.',
        alternativeOptions: ['Macrolides (clarithromycin)', 'Cephalexin (if no severe allergy)', 'Trimethoprim'],
        references: ['BNF 2024', 'NICE CG139']
      },
      {
        id: 'contra_simvastatin_001',
        medicationId: 'drug_simvastatin_001',
        medicationName: 'Simvastatin',
        activeIngredient: 'simvastatin',
        contraindicationType: 'relative',
        condition: 'Hypothyroidism',
        reason: 'Increased risk of myopathy',
        severity: 'medium',
        clinicalGuidance: 'Use with caution in hypothyroidism. Ensure thyroid function is optimized before starting statin.',
        alternativeOptions: ['Atorvastatin', 'Rosuvastatin', 'Treat hypothyroidism first'],
        references: ['BNF 2024', 'NICE CG181']
      }
    ];

    for (const contraindication of contraindications) {
      await AppDataSource.query(`
        INSERT INTO medication_contraindications (
          id, medication_id, medication_name, active_ingredient, contraindication_type,
          condition, reason, severity, clinical_guidance, alternative_options,
          references, last_reviewed, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [
        contraindication.id, contraindication.medicationId, contraindication.medicationName,
        contraindication.activeIngredient, contraindication.contraindicationType,
        contraindication.condition, contraindication.reason, contraindication.severity,
        contraindication.clinicalGuidance, JSON.stringify(contraindication.alternativeOptions),
        JSON.stringify(contraindication.references), new Date(), new Date()
      ]);
    }

    logger.info('Medication contraindications seed data inserted successfully');
  }

  private async seedResidentAllergies(): Promise<void> {
    // Get sample residents
    const residents = await AppDataSource.query(`
      SELECT id, organization_id FROM residents LIMIT 5
    `);

    if (residents.length === 0) {
      logger.warn('No residents found for allergy seeding');
      return;
    }

    const allergies = [
      {
        residentId: residents[0]?.id,
        organizationId: residents[0]?.organization_id,
        allergen: 'penicillin',
        allergenType: 'drug',
        reactionType: 'allergy',
        severity: 'severe',
        symptoms: ['rash', 'swelling', 'difficulty breathing'],
        verifiedBy: 'doctor_001',
        notes: 'Severe reaction in 2020 - documented anaphylaxis'
      },
      {
        residentId: residents[1]?.id,
        organizationId: residents[1]?.organization_id,
        allergen: 'aspirin',
        allergenType: 'drug',
        reactionType: 'intolerance',
        severity: 'moderate',
        symptoms: ['stomach upset', 'nausea'],
        verifiedBy: 'nurse_001',
        notes: 'GI intolerance - avoid NSAIDs'
      },
      {
        residentId: residents[2]?.id,
        organizationId: residents[2]?.organization_id,
        allergen: 'shellfish',
        allergenType: 'food',
        reactionType: 'allergy',
        severity: 'severe',
        symptoms: ['hives', 'swelling', 'anaphylaxis'],
        verifiedBy: 'doctor_002',
        notes: 'Carries EpiPen - avoid all shellfish'
      },
      {
        residentId: residents[3]?.id,
        organizationId: residents[3]?.organization_id,
        allergen: 'latex',
        allergenType: 'environmental',
        reactionType: 'allergy',
        severity: 'moderate',
        symptoms: ['skin irritation', 'rash'],
        verifiedBy: 'nurse_002',
        notes: 'Use latex-free gloves and equipment'
      },
      {
        residentId: residents[4]?.id,
        organizationId: residents[4]?.organization_id,
        allergen: 'codeine',
        allergenType: 'drug',
        reactionType: 'adverse_reaction',
        severity: 'mild',
        symptoms: ['nausea', 'dizziness'],
        verifiedBy: 'pharmacist_001',
        notes: 'Avoid opioid medications where possible'
      }
    ];

    for (const allergy of allergies) {
      if (allergy.residentId && allergy.organizationId) {
        const allergyId = 'allergy_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        
        await AppDataSource.query(`
          INSERT INTO resident_allergies (
            id, resident_id, allergen, allergen_type, reaction_type, severity,
            symptoms, verified_by, verification_date, notes, is_active,
            organization_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          allergyId, allergy.residentId, allergy.allergen, allergy.allergenType,
          allergy.reactionType, allergy.severity, JSON.stringify(allergy.symptoms),
          allergy.verifiedBy, new Date(), allergy.notes, true,
          allergy.organizationId, new Date()
        ]);
      }
    }

    logger.info('Resident allergies seed data inserted successfully');
  }

  private async seedResidentConditions(): Promise<void> {
    // Get sample residents
    const residents = await AppDataSource.query(`
      SELECT id, organization_id FROM residents LIMIT 5
    `);

    if (residents.length === 0) {
      logger.warn('No residents found for conditions seeding');
      return;
    }

    const conditions = [
      {
        residentId: residents[0]?.id,
        organizationId: residents[0]?.organization_id,
        conditionName: 'Atrial fibrillation',
        conditionCode: 'I48.9',
        severity: 'moderate',
        status: 'active',
        diagnosedBy: 'cardiologist_001',
        notes: 'Chronic AF - on anticoagulation'
      },
      {
        residentId: residents[1]?.id,
        organizationId: residents[1]?.organization_id,
        conditionName: 'Type 2 diabetes mellitus',
        conditionCode: 'E11.9',
        severity: 'moderate',
        status: 'active',
        diagnosedBy: 'endocrinologist_001',
        notes: 'Well controlled on metformin'
      },
      {
        residentId: residents[2]?.id,
        organizationId: residents[2]?.organization_id,
        conditionName: 'Chronic kidney disease stage 3',
        conditionCode: 'N18.3',
        severity: 'moderate',
        status: 'active',
        diagnosedBy: 'nephrologist_001',
        notes: 'eGFR 45-59 - monitor renal function'
      },
      {
        residentId: residents[3]?.id,
        organizationId: residents[3]?.organization_id,
        conditionName: 'Severe liver disease',
        conditionCode: 'K72.9',
        severity: 'severe',
        status: 'active',
        diagnosedBy: 'hepatologist_001',
        notes: 'Avoid hepatotoxic medications'
      },
      {
        residentId: residents[4]?.id,
        organizationId: residents[4]?.organization_id,
        conditionName: 'Peptic ulcer disease',
        conditionCode: 'K27.9',
        severity: 'moderate',
        status: 'chronic',
        diagnosedBy: 'gastroenterologist_001',
        notes: 'History of GI bleeding - avoid NSAIDs'
      }
    ];

    for (const condition of conditions) {
      if (condition.residentId && condition.organizationId) {
        const conditionId = 'condition_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        
        await AppDataSource.query(`
          INSERT INTO resident_conditions (
            id, resident_id, condition_name, condition_code, severity, status,
            diagnosed_by, notes, is_active, organization_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          conditionId, condition.residentId, condition.conditionName,
          condition.conditionCode, condition.severity, condition.status,
          condition.diagnosedBy, condition.notes, true,
          condition.organizationId, new Date()
        ]);
      }
    }

    logger.info('Resident conditions seed data inserted successfully');
  }
}

// Export for use in seed runner
export default MedicationInteractionSeed;