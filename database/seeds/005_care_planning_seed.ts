/**
 * @fileoverview Care Planning seed data for WriteCareNotes
 * @module CarePlanningSeed
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Seed data for care planning system including care plans,
 * care domains, interventions, and quality metrics for development and testing.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Uses anonymized test data only
 * - No real resident information included
 * - Follows data protection guidelines
 */

import { DataSource } from 'typeorm';

export class CarePlanningSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Get existing residents for foreign key references
      const residents = await queryRunner.query(`
        SELECT id FROM residents WHERE deleted_at IS NULL LIMIT 5
      `);

      if (residents.length === 0) {
        console.log('No residents found. Skipping care planning seed data.');
        await queryRunner.commitTransaction();
        return;
      }

      // Create sample care plans
      const carePlans = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          resident_id: residents[0].id,
          plan_name: 'Initial Care Plan - Personal Care Focus',
          plan_type: 'initial',
          status: 'active',
          created_by: '550e8400-e29b-41d4-a716-446655440000', // Sample staff ID
          approved_by: '550e8400-e29b-41d4-a716-446655440000',
          approved_at: new Date('2025-01-01T10:00:00Z'),
          effective_from: '2025-01-01',
          review_frequency: 'monthly',
          next_review_date: '2025-02-01',
          care_goals: [
            {
              id: 'goal_001',
              description: 'Maintain independence in personal hygiene with minimal assistance',
              category: 'personal_care',
              targetDate: '2025-03-01T00:00:00Z',
              status: 'active',
              measurableOutcome: 'Resident able to complete 80% of personal hygiene tasks independently',
              responsibleStaff: ['550e8400-e29b-41d4-a716-446655440000']
            },
            {
              id: 'goal_002',
              description: 'Improve mobility and reduce fall risk',
              category: 'mobility',
              targetDate: '2025-04-01T00:00:00Z',
              status: 'active',
              measurableOutcome: 'Zero falls in 3-month period, improved balance scores',
              responsibleStaff: ['550e8400-e29b-41d4-a716-446655440000']
            }
          ],
          risk_assessments: [
            {
              id: 'risk_001',
              riskType: 'falls',
              riskLevel: 'medium',
              description: 'History of falls, mobility issues, medication side effects',
              mitigationStrategies: [
                'Regular mobility assessments',
                'Environmental modifications',
                'Medication review',
                'Staff supervision during transfers'
              ],
              reviewDate: '2025-02-01T00:00:00Z',
              assessedBy: '550e8400-e29b-41d4-a716-446655440000'
            }
          ],
          emergency_procedures: [
            {
              id: 'emergency_001',
              procedureType: 'medical_emergency',
              description: 'Procedure for medical emergencies',
              steps: [
                'Assess resident condition',
                'Call emergency services if required',
                'Notify senior staff and family',
                'Document incident thoroughly'
              ],
              contactInformation: [
                {
                  name: 'Emergency Services',
                  role: 'Emergency Response',
                  phone: '999',
                  email: null
                },
                {
                  name: 'Care Manager',
                  role: 'Senior Staff',
                  phone: '+44 1234 567890',
                  email: 'manager@careHome.com'
                }
              ],
              lastUpdated: '2025-01-01T00:00:00Z',
              updatedBy: '550e8400-e29b-41d4-a716-446655440000'
            }
          ],
          resident_preferences: [
            {
              category: 'personal_care',
              preference: 'Prefers shower in the morning',
              importance: 'medium',
              dateRecorded: '2025-01-01T00:00:00Z',
              recordedBy: '550e8400-e29b-41d4-a716-446655440000'
            },
            {
              category: 'social',
              preference: 'Enjoys group activities and music therapy',
              importance: 'high',
              dateRecorded: '2025-01-01T00:00:00Z',
              recordedBy: '550e8400-e29b-41d4-a716-446655440000'
            }
          ],
          version: 1
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          resident_id: residents[1].id,
          plan_name: 'Comprehensive Care Plan - Dementia Support',
          plan_type: 'review',
          status: 'active',
          created_by: '550e8400-e29b-41d4-a716-446655440000',
          approved_by: '550e8400-e29b-41d4-a716-446655440000',
          approved_at: new Date('2025-01-02T14:30:00Z'),
          effective_from: '2025-01-02',
          review_frequency: 'weekly',
          next_review_date: '2025-01-09',
          care_goals: [
            {
              id: 'goal_003',
              description: 'Maintain cognitive function and reduce confusion episodes',
              category: 'cognitive',
              targetDate: '2025-02-02T00:00:00Z',
              status: 'active',
              measurableOutcome: 'Reduce confusion episodes by 30%, maintain current cognitive assessment scores',
              responsibleStaff: ['550e8400-e29b-41d4-a716-446655440000']
            }
          ],
          risk_assessments: [
            {
              id: 'risk_002',
              riskType: 'wandering',
              riskLevel: 'high',
              description: 'Tendency to wander, especially in evening hours',
              mitigationStrategies: [
                '1:1 supervision during high-risk periods',
                'Secure environment modifications',
                'Engagement activities to reduce restlessness',
                'Family involvement in care planning'
              ],
              reviewDate: '2025-01-09T00:00:00Z',
              assessedBy: '550e8400-e29b-41d4-a716-446655440000'
            }
          ],
          version: 2,
          previous_version_id: null
        }
      ];

      // Insert care plans
      for (const carePlan of carePlans) {
        await queryRunner.query(`
          INSERT INTO care_plans (
            id, resident_id, plan_name, plan_type, status, created_by, approved_by, approved_at,
            effective_from, review_frequency, next_review_date, care_goals, risk_assessments,
            emergency_procedures, resident_preferences, version, previous_version_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          carePlan.id, carePlan.resident_id, carePlan.plan_name, carePlan.plan_type,
          carePlan.status, carePlan.created_by, carePlan.approved_by, carePlan.approved_at,
          carePlan.effective_from, carePlan.review_frequency, carePlan.next_review_date,
          JSON.stringify(carePlan.care_goals), JSON.stringify(carePlan.risk_assessments),
          JSON.stringify(carePlan.emergency_procedures), JSON.stringify(carePlan.resident_preferences),
          carePlan.version, carePlan.previous_version_id
        ]);
      }

      // Create sample care domains
      const careDomains = [
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          care_plan_id: '550e8400-e29b-41d4-a716-446655440001',
          domain_type: 'personal_care',
          domain_name: 'Personal Care and Hygiene',
          assessment_summary: 'Resident requires minimal assistance with personal hygiene. Independent with most tasks but needs prompting and supervision.',
          current_status: 'requires_assistance',
          goals: [
            {
              id: 'domain_goal_001',
              description: 'Maintain current level of independence in personal care',
              targetDate: '2025-03-01T00:00:00Z',
              status: 'active',
              measurableOutcome: 'Complete personal care routine with minimal prompting',
              progressNotes: [
                '2025-01-01T00:00:00Z: Initial assessment completed',
                '2025-01-05T00:00:00Z: Good progress with morning routine'
              ]
            }
          ],
          risk_level: 'low',
          risk_factors: [
            {
              id: 'domain_risk_001',
              factor: 'Skin integrity concerns',
              likelihood: 'low',
              impact: 'medium',
              mitigationStrategy: 'Daily skin inspection, moisturizing routine',
              reviewDate: '2025-02-01T00:00:00Z'
            }
          ],
          equipment_needed: [
            {
              id: 'equipment_001',
              equipmentType: 'mobility_aid',
              equipmentName: 'Shower chair',
              purpose: 'Safe showering support',
              lastInspection: '2025-01-01T00:00:00Z',
              nextInspection: '2025-04-01T00:00:00Z'
            }
          ],
          staff_requirements: {
            skillLevel: 'basic',
            qualifications: ['Care Certificate'],
            experience: 'Minimum 6 months care experience',
            minimumStaffRatio: '1:8'
          },
          monitoring_frequency: 'daily',
          last_assessment_date: '2025-01-01',
          next_assessment_date: '2025-02-01',
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440012',
          care_plan_id: '550e8400-e29b-41d4-a716-446655440001',
          domain_type: 'mobility',
          domain_name: 'Mobility and Transfers',
          assessment_summary: 'Resident has reduced mobility due to arthritis. Requires assistance with transfers and walking longer distances.',
          current_status: 'requires_assistance',
          goals: [
            {
              id: 'domain_goal_002',
              description: 'Improve mobility and maintain current function',
              targetDate: '2025-04-01T00:00:00Z',
              status: 'active',
              measurableOutcome: 'Walk 50 meters with walking aid, safe transfers',
              progressNotes: [
                '2025-01-01T00:00:00Z: Baseline mobility assessment completed'
              ]
            }
          ],
          risk_level: 'medium',
          risk_factors: [
            {
              id: 'domain_risk_002',
              factor: 'Fall risk due to mobility limitations',
              likelihood: 'medium',
              impact: 'high',
              mitigationStrategy: 'Physiotherapy, environmental modifications, mobility aids',
              reviewDate: '2025-02-01T00:00:00Z'
            }
          ],
          equipment_needed: [
            {
              id: 'equipment_002',
              equipmentType: 'mobility_aid',
              equipmentName: 'Walking frame',
              purpose: 'Mobility support and fall prevention',
              lastInspection: '2025-01-01T00:00:00Z',
              nextInspection: '2025-04-01T00:00:00Z'
            }
          ],
          staff_requirements: {
            skillLevel: 'intermediate',
            qualifications: ['Care Certificate', 'Moving and Handling'],
            experience: 'Minimum 1 year care experience',
            specialTraining: ['Manual Handling', 'Fall Prevention'],
            minimumStaffRatio: '1:6'
          },
          monitoring_frequency: 'daily',
          last_assessment_date: '2025-01-01',
          next_assessment_date: '2025-01-15',
          is_active: true
        }
      ];

      // Insert care domains
      for (const domain of careDomains) {
        await queryRunner.query(`
          INSERT INTO care_domains (
            id, care_plan_id, domain_type, domain_name, assessment_summary, current_status,
            goals, risk_level, risk_factors, equipment_needed, staff_requirements,
            monitoring_frequency, last_assessment_date, next_assessment_date, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          domain.id, domain.care_plan_id, domain.domain_type, domain.domain_name,
          domain.assessment_summary, domain.current_status, JSON.stringify(domain.goals),
          domain.risk_level, JSON.stringify(domain.risk_factors), JSON.stringify(domain.equipment_needed),
          JSON.stringify(domain.staff_requirements), domain.monitoring_frequency,
          domain.last_assessment_date, domain.next_assessment_date, domain.is_active
        ]);
      }

      // Create sample care interventions
      const careInterventions = [
        {
          id: '550e8400-e29b-41d4-a716-446655440021',
          care_domain_id: '550e8400-e29b-41d4-a716-446655440011',
          intervention_name: 'Personal Hygiene Assistance',
          intervention_code: 'PC001',
          description: 'Assist resident with daily personal hygiene routine including washing, teeth cleaning, and grooming',
          intervention_type: 'direct_care',
          frequency: 'twice daily',
          timing: '08:00, 20:00',
          duration_minutes: 30,
          priority: 'medium',
          required_skills: [
            {
              skill: 'Personal Care',
              level: 'basic',
              certification: 'Care Certificate',
              trainingRequired: true
            }
          ],
          equipment_needed: [
            {
              equipmentType: 'hygiene_supplies',
              equipmentName: 'Personal care kit',
              quantity: 1,
              specifications: 'Soap, shampoo, toothbrush, towels'
            }
          ],
          safety_considerations: [
            {
              hazardType: 'slip_fall',
              riskLevel: 'medium',
              precautions: ['Non-slip mats', 'Grab rails', 'Staff supervision'],
              emergencyProcedure: 'Call for assistance, do not move resident if injured'
            }
          ],
          outcome_measures: [
            {
              measureType: 'completion_rate',
              expectedOutcome: '100% completion of hygiene routine',
              measurementMethod: 'Daily documentation',
              frequency: 'daily'
            }
          ],
          documentation_requirements: [
            {
              documentType: 'care_activity_log',
              frequency: 'each_occurrence',
              requiredFields: ['time_completed', 'assistance_level', 'resident_response', 'any_concerns'],
              approvalRequired: false
            }
          ],
          effective_from: '2025-01-01',
          is_active: true,
          is_prn: false,
          created_by: '550e8400-e29b-41d4-a716-446655440000'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440022',
          care_domain_id: '550e8400-e29b-41d4-a716-446655440012',
          intervention_name: 'Mobility Assessment and Exercise',
          intervention_code: 'MOB001',
          description: 'Daily mobility assessment and guided exercise to maintain and improve mobility',
          intervention_type: 'therapy',
          frequency: 'daily',
          timing: '10:00',
          duration_minutes: 45,
          priority: 'high',
          required_skills: [
            {
              skill: 'Physiotherapy Support',
              level: 'intermediate',
              certification: 'Moving and Handling Certificate',
              trainingRequired: true
            }
          ],
          equipment_needed: [
            {
              equipmentType: 'exercise_equipment',
              equipmentName: 'Exercise mat and resistance bands',
              quantity: 1,
              specifications: 'Non-slip exercise mat, light resistance bands'
            }
          ],
          safety_considerations: [
            {
              hazardType: 'overexertion',
              riskLevel: 'medium',
              precautions: ['Monitor vital signs', 'Stop if resident shows distress', 'Gradual progression'],
              emergencyProcedure: 'Stop exercise immediately, assess resident, call nurse if needed'
            }
          ],
          outcome_measures: [
            {
              measureType: 'mobility_score',
              expectedOutcome: 'Maintain or improve mobility score by 10%',
              measurementMethod: 'Weekly mobility assessment',
              frequency: 'weekly',
              targetValue: 'Mobility score >= 7/10'
            }
          ],
          documentation_requirements: [
            {
              documentType: 'therapy_progress_note',
              frequency: 'each_session',
              requiredFields: ['exercises_completed', 'duration', 'resident_tolerance', 'progress_notes'],
              approvalRequired: true
            }
          ],
          effective_from: '2025-01-01',
          is_active: true,
          is_prn: false,
          created_by: '550e8400-e29b-41d4-a716-446655440000'
        }
      ];

      // Insert care interventions
      for (const intervention of careInterventions) {
        await queryRunner.query(`
          INSERT INTO care_interventions (
            id, care_domain_id, intervention_name, intervention_code, description, intervention_type,
            frequency, timing, duration_minutes, priority, required_skills, equipment_needed,
            safety_considerations, outcome_measures, documentation_requirements,
            effective_from, is_active, is_prn, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `, [
          intervention.id, intervention.care_domain_id, intervention.intervention_name,
          intervention.intervention_code, intervention.description, intervention.intervention_type,
          intervention.frequency, intervention.timing, intervention.duration_minutes,
          intervention.priority, JSON.stringify(intervention.required_skills),
          JSON.stringify(intervention.equipment_needed), JSON.stringify(intervention.safety_considerations),
          JSON.stringify(intervention.outcome_measures), JSON.stringify(intervention.documentation_requirements),
          intervention.effective_from, intervention.is_active, intervention.is_prn, intervention.created_by
        ]);
      }

      // Create sample care quality metrics
      const qualityMetrics = [
        {
          id: '550e8400-e29b-41d4-a716-446655440031',
          resident_id: residents[0].id,
          care_plan_id: '550e8400-e29b-41d4-a716-446655440001',
          metric_type: 'falls',
          metric_category: 'safety',
          metric_name: 'Fall Incidents',
          metric_description: 'Number of fall incidents per month',
          metric_date: '2025-01-01',
          metric_value: 0,
          metric_unit: 'count',
          baseline_value: 2,
          target_value: 0,
          normal_range_min: 0,
          normal_range_max: 0,
          trend: 'improving',
          trend_confidence: 'high',
          significance_level: 'normal',
          data_source: 'direct_observation',
          measurement_method: 'Incident reporting system',
          recorded_by: '550e8400-e29b-41d4-a716-446655440000',
          context_factors: {
            environmental_modifications: 'Non-slip mats installed',
            medication_changes: 'Reduced sedating medications',
            mobility_aids: 'Walking frame provided'
          },
          interventions_applied: {
            fall_prevention_program: 'Daily mobility exercises',
            environmental_assessment: 'Room hazard assessment completed',
            staff_training: 'Fall prevention training updated'
          },
          alert_generated: false,
          alert_level: 'none',
          action_required: false,
          notes: 'Excellent progress with fall prevention measures'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440032',
          resident_id: residents[0].id,
          care_plan_id: '550e8400-e29b-41d4-a716-446655440001',
          metric_type: 'mood',
          metric_category: 'wellbeing',
          metric_name: 'Mood Assessment Score',
          metric_description: 'Weekly mood assessment using standardized scale',
          metric_date: '2025-01-07',
          metric_value: 8.5,
          metric_unit: 'score',
          baseline_value: 6.0,
          target_value: 8.0,
          normal_range_min: 7.0,
          normal_range_max: 10.0,
          trend: 'improving',
          trend_confidence: 'medium',
          significance_level: 'noteworthy',
          data_source: 'assessment_tool',
          measurement_method: 'Cornell Scale for Depression in Dementia',
          recorded_by: '550e8400-e29b-41d4-a716-446655440000',
          context_factors: {
            social_activities: 'Increased participation in group activities',
            family_visits: 'Regular family visits resumed',
            medication_optimization: 'Antidepressant dosage adjusted'
          },
          alert_generated: false,
          alert_level: 'none',
          action_required: false,
          follow_up_date: '2025-01-14',
          notes: 'Significant improvement in mood and social engagement'
        }
      ];

      // Insert quality metrics
      for (const metric of qualityMetrics) {
        await queryRunner.query(`
          INSERT INTO care_quality_metrics (
            id, resident_id, care_plan_id, metric_type, metric_category, metric_name,
            metric_description, metric_date, metric_value, metric_unit, baseline_value,
            target_value, normal_range_min, normal_range_max, trend, trend_confidence,
            significance_level, data_source, measurement_method, recorded_by,
            context_factors, interventions_applied, alert_generated, alert_level,
            action_required, follow_up_date, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
        `, [
          metric.id, metric.resident_id, metric.care_plan_id, metric.metric_type,
          metric.metric_category, metric.metric_name, metric.metric_description,
          metric.metric_date, metric.metric_value, metric.metric_unit,
          metric.baseline_value, metric.target_value, metric.normal_range_min,
          metric.normal_range_max, metric.trend, metric.trend_confidence,
          metric.significance_level, metric.data_source, metric.measurement_method,
          metric.recorded_by, JSON.stringify(metric.context_factors),
          JSON.stringify(metric.interventions_applied), metric.alert_generated,
          metric.alert_level, metric.action_required, metric.follow_up_date, metric.notes
        ]);
      }

      await queryRunner.commitTransaction();
      console.log('Care planning seed data inserted successfully');

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error inserting care planning seed data:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}