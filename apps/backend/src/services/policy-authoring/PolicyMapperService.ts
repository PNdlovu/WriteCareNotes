/**
 * @fileoverview policy mapper Service
 * @module Policy-authoring/PolicyMapperService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description policy mapper Service
 */

import { Injectable, Logger } from '@nestjs/common';
import { PolicyDraft } from '../../entities/policy-draft.entity';
import { PolicyTemplate, PolicyCategory, Jurisdiction } from '../../entities/policy-authoring/PolicyTemplate';
import { WorkflowType, PolicyEnforcementRule, EnforcementAction, EnforcementCondition } from './PolicyEnforcerService';

export enum ModuleType {
  SAFEGUARDING = 'safeguarding',
  CARE_PLANNING = 'care_planning',
  MEDICATION_MANAGEMENT = 'medication_management',
  STAFF_MANAGEMENT = 'staff_management',
  TRAINING_CPD = 'training_cpd',
  ONBOARDING = 'onboarding',
  INCIDENT_MANAGEMENT = 'incident_management',
  COMMUNICATION = 'communication',
  QUALITY_ASSURANCE = 'quality_assurance',
  HEALTH_SAFETY = 'health_safety',
  DATA_PROTECTION = 'data_protection',
  COMPLAINTS = 'complaints',
  VISITOR_MANAGEMENT = 'visitor_management',
  EMERGENCY_PROCEDURES = 'emergency_procedures',
  FINANCIAL_MANAGEMENT = 'financial_management'
}

export enum ComplianceStandard {
  CQC_KLOE_SAFE = 'cqc_kloe_safe',
  CQC_KLOE_EFFECTIVE = 'cqc_kloe_effective',
  CQC_KLOE_CARING = 'cqc_kloe_caring',
  CQC_KLOE_RESPONSIVE = 'cqc_kloe_responsive',
  CQC_KLOE_WELL_LED = 'cqc_kloe_well_led',
  CARE_ACT_2014 = 'care_act_2014',
  GDPR = 'gdpr',
  DATA_PROTECTION_ACT = 'data_protection_act',
  HEALTH_SAFETY_AT_WORK = 'health_safety_at_work',
  MENTAL_CAPACITY_ACT = 'mental_capacity_act',
  NICE_GUIDELINES = 'nice_guidelines',
  ISO_27001 = 'iso_27001',
  ISO_9001 = 'iso_9001'
}

export interface PolicyModuleMapping {
  policyId: string;
  policyCategory: PolicyCategory;
  moduleType: ModuleType;
  workflowTypes: WorkflowType[];
  enforcementLevel: 'mandatory' | 'recommended' | 'optional';
  triggers: PolicyTrigger[];
  integrationPoints: IntegrationPoint[];
  effectivenessMetrics: EffectivenessMetric[];
}

export interface PolicyTrigger {
  triggerType: 'workflow_start' | 'workflow_step' | 'data_change' | 'time_based' | 'user_action';
  condition: string;
  action: 'enforce' | 'prompt' | 'log' | 'notify';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
}

export interface IntegrationPoint {
  integrationId: string;
  name: string;
  description: string;
  integrationMethod: 'api_hook' | 'database_trigger' | 'event_listener' | 'middleware';
  endpoint?: string;
  eventType?: string;
  configuration: Record<string, any>;
}

export interface EffectivenessMetric {
  metricId: string;
  name: string;
  description: string;
  measurementType: 'compliance_rate' | 'incident_reduction' | 'training_completion' | 'audit_score';
  target: number;
  currentValue?: number;
  trend?: 'improving' | 'stable' | 'declining';
}

export interface ComplianceMapping {
  policyId: string;
  complianceStandards: ComplianceStandard[];
  requirements: ComplianceRequirement[];
  evidenceRequirements: EvidenceRequirement[];
  auditFrequency: 'monthly' | 'quarterly' | 'annually' | 'biannually';
  nextAuditDue: Date;
}

export interface ComplianceRequirement {
  requirementId: string;
  standard: ComplianceStandard;
  title: string;
  description: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  evidenceTypes: string[];
  assessmentCriteria: string[];
}

export interface EvidenceRequirement {
  evidenceId: string;
  type: 'document' | 'training_record' | 'audit_report' | 'incident_log' | 'meeting_minutes';
  description: string;
  frequency: 'ongoing' | 'monthly' | 'quarterly' | 'annually';
  responsible: string[];
  location?: string;
}

export interface PolicyEffectivenessReport {
  policyId: string;
  policyTitle: string;
  moduleType: ModuleType;
  period: { start: Date; end: Date };
  metrics: {
    acknowledgmentRate: number;
    complianceRate: number;
    incidentReduction: number;
    trainingCompletion: number;
    auditScore: number;
  };
  trends: {
    acknowledgments: 'up' | 'down' | 'stable';
    compliance: 'up' | 'down' | 'stable';
    incidents: 'up' | 'down' | 'stable';
  };
  recommendations: string[];
}

@Injectable()
export class PolicyMapperService {
  private readonlylogger = new Logger(PolicyMapperService.name);

  /**
   * Get default policy-module mappings
   */
  getDefaultPolicyModuleMappings(): PolicyModuleMapping[] {
    return [
      // Safeguarding Policy Mappings
      {
        policyId: 'safeguarding-policy',
        policyCategory: PolicyCategory.SAFEGUARDING,
        moduleType: ModuleType.SAFEGUARDING,
        workflowTypes: [
          WorkflowType.SAFEGUARDING_INCIDENT,
          WorkflowType.STAFF_ONBOARDING,
          WorkflowType.TRAINING_COMPLETION
        ],
        enforcementLevel: 'mandatory',
        triggers: [
          {
            triggerType: 'workflow_start',
            condition: 'safeguarding_incident_reported',
            action: 'enforce',
            priority: 'critical',
            message: 'Safeguarding policy acknowledgment required before processing incident'
          },
          {
            triggerType: 'user_action',
            condition: 'accessing_vulnerable_adult_records',
            action: 'prompt',
            priority: 'high',
            message: 'Remember safeguarding protocols when accessing sensitive records'
          }
        ],
        integrationPoints: [
          {
            integrationId: 'safeguarding-incident-hook',
            name: 'Safeguarding Incident API Hook',
            description: 'Enforces safeguarding policy before incident creation',
            integrationMethod: 'api_hook',
            endpoint: '/api/incidents/safeguarding',
            configuration: {
              enforcementLevel: 'block',
              requiredAcknowledgment: true,
              trainingRequired: true
            }
          }
        ],
        effectivenessMetrics: [
          {
            metricId: 'safeguarding-compliance',
            name: 'Safeguarding Compliance Rate',
            description: 'Percentage of staff with current safeguarding training',
            measurementType: 'compliance_rate',
            target: 100
          },
          {
            metricId: 'safeguarding-incidents',
            name: 'Safeguarding Incident Reduction',
            description: 'Month-over-month reduction in preventable safeguarding incidents',
            measurementType: 'incident_reduction',
            target: 10
          }
        ]
      },

      // Data Protection Policy Mappings
      {
        policyId: 'data-protection-policy',
        policyCategory: PolicyCategory.DATA_PROTECTION,
        moduleType: ModuleType.DATA_PROTECTION,
        workflowTypes: [
          WorkflowType.DATA_ACCESS,
          WorkflowType.STAFF_ONBOARDING,
          WorkflowType.RESIDENT_ADMISSION
        ],
        enforcementLevel: 'mandatory',
        triggers: [
          {
            triggerType: 'data_change',
            condition: 'personal_data_accessed',
            action: 'log',
            priority: 'medium',
            message: 'Data access logged for GDPR compliance'
          },
          {
            triggerType: 'workflow_start',
            condition: 'data_export_requested',
            action: 'enforce',
            priority: 'high',
            message: 'Data protection policy compliance required for data export'
          }
        ],
        integrationPoints: [
          {
            integrationId: 'data-access-logger',
            name: 'Data Access Logging',
            description: 'Logs all personal data access for GDPR compliance',
            integrationMethod: 'database_trigger',
            configuration: {
              auditAllAccess: true,
              retentionPeriod: '7years',
              anonymizeAfter: '2years'
            }
          }
        ],
        effectivenessMetrics: [
          {
            metricId: 'data-breach-incidents',
            name: 'Data Breach Incident Reduction',
            description: 'Reduction in data protection incidents',
            measurementType: 'incident_reduction',
            target: 95
          }
        ]
      },

      // Medication Management Policy Mappings
      {
        policyId: 'medication-management-policy',
        policyCategory: PolicyCategory.MEDICATION,
        moduleType: ModuleType.MEDICATION_MANAGEMENT,
        workflowTypes: [
          WorkflowType.MEDICATION_ADMINISTRATION,
          WorkflowType.STAFF_SUPERVISION
        ],
        enforcementLevel: 'mandatory',
        triggers: [
          {
            triggerType: 'workflow_start',
            condition: 'medication_administration_started',
            action: 'enforce',
            priority: 'critical',
            message: 'Medication management training and policy acknowledgment required'
          },
          {
            triggerType: 'time_based',
            condition: 'medication_review_due',
            action: 'notify',
            priority: 'high',
            message: 'Medication policy review required - regulatory compliance'
          }
        ],
        integrationPoints: [
          {
            integrationId: 'medication-admin-check',
            name: 'Medication Administration Check',
            description: 'Validates staff authorization before medication administration',
            integrationMethod: 'api_hook',
            endpoint: '/api/medication/administration/validate',
            configuration: {
              checkTraining: true,
              checkCompetency: true,
              logAllActions: true
            }
          }
        ],
        effectivenessMetrics: [
          {
            metricId: 'medication-errors',
            name: 'Medication Error Reduction',
            description: 'Reduction in medication administration errors',
            measurementType: 'incident_reduction',
            target: 90
          },
          {
            metricId: 'medication-compliance',
            name: 'Medication Policy Compliance',
            description: 'Staff compliance with medication management procedures',
            measurementType: 'compliance_rate',
            target: 98
          }
        ]
      },

      // Health & Safety Policy Mappings
      {
        policyId: 'health-safety-policy',
        policyCategory: PolicyCategory.HEALTH_SAFETY,
        moduleType: ModuleType.HEALTH_SAFETY,
        workflowTypes: [
          WorkflowType.EMERGENCY_RESPONSE,
          WorkflowType.STAFF_ONBOARDING,
          WorkflowType.VISITOR_MANAGEMENT
        ],
        enforcementLevel: 'mandatory',
        triggers: [
          {
            triggerType: 'workflow_start',
            condition: 'emergency_declared',
            action: 'prompt',
            priority: 'critical',
            message: 'Emergency procedures - follow health and safety protocols'
          },
          {
            triggerType: 'user_action',
            condition: 'risk_assessment_required',
            action: 'enforce',
            priority: 'high',
            message: 'Health and safety risk assessment required before proceeding'
          }
        ],
        integrationPoints: [
          {
            integrationId: 'risk-assessment-trigger',
            name: 'Risk Assessment Trigger',
            description: 'Automatically triggers risk assessments based on policy requirements',
            integrationMethod: 'event_listener',
            eventType: 'high_risk_activity_detected',
            configuration: {
              autoTrigger: true,
              escalateIfNotCompleted: true,
              notifyHSEOfficer: true
            }
          }
        ],
        effectivenessMetrics: [
          {
            metricId: 'workplace-accidents',
            name: 'Workplace Accident Reduction',
            description: 'Reduction in workplace accidents and near misses',
            measurementType: 'incident_reduction',
            target: 80
          }
        ]
      }
    ];
  }

  /**
   * Get compliance mappings for policies
   */
  getComplianceMappings(): ComplianceMapping[] {
    return [
      // Safeguarding Policy Compliance
      {
        policyId: 'safeguarding-policy',
        complianceStandards: [ComplianceStandard.CQC_KLOE_SAFE, ComplianceStandard.CARE_ACT_2014],
        requirements: [
          {
            requirementId: 'cqc-safe-safeguarding',
            standard: ComplianceStandard.CQC_KLOE_SAFE,
            title: 'Safeguarding people from abuse',
            description: 'Systems and processes to protect people from abuse and improper treatment',
            criticality: 'critical',
            evidenceTypes: ['policy_document', 'training_records', 'incident_logs'],
            assessmentCriteria: [
              'Policy covers all forms of abuse',
              'Clear reporting procedures established',
              'Staff training up to date',
              'Incidents properly investigated'
            ]
          }
        ],
        evidenceRequirements: [
          {
            evidenceId: 'safeguarding-training-records',
            type: 'training_record',
            description: 'All staff safeguarding training records',
            frequency: 'annually',
            responsible: ['Training Manager', 'Safeguarding Lead']
          }
        ],
        auditFrequency: 'annually',
        nextAuditDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },

      // Data Protection Policy Compliance
      {
        policyId: 'data-protection-policy',
        complianceStandards: [ComplianceStandard.GDPR, ComplianceStandard.DATA_PROTECTION_ACT],
        requirements: [
          {
            requirementId: 'gdpr-article-32',
            standard: ComplianceStandard.GDPR,
            title: 'Security of processing',
            description: 'Technical and organizational measures to ensure data security',
            criticality: 'critical',
            evidenceTypes: ['policy_document', 'technical_measures', 'staff_training'],
            assessmentCriteria: [
              'Encryption in place',
              'Access controls implemented',
              'Staff training completed',
              'Regular security assessments'
            ]
          }
        ],
        evidenceRequirements: [
          {
            evidenceId: 'data-access-logs',
            type: 'audit_report',
            description: 'Data access and processing logs',
            frequency: 'ongoing',
            responsible: ['Data Protection Officer', 'IT Manager']
          }
        ],
        auditFrequency: 'annually',
        nextAuditDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  /**
   * Generate enforcement rules from policy mappings
   */
  generateEnforcementRules(mappings: PolicyModuleMapping[]): PolicyEnforcementRule[] {
    const rules: PolicyEnforcementRule[] = [];

    mappings.forEach(mapping => {
      mapping.triggers.forEach(trigger => {
        const rule: PolicyEnforcementRule = {
          policyId: mapping.policyId,
          workflowTypes: mapping.workflowTypes,
          enforcementAction: this.mapTriggerActionToEnforcementAction(trigger.action),
          conditions: this.generateConditionsFromTrigger(trigger),
          priority: trigger.priority,
          message: trigger.message || `Policy enforcement required for ${mapping.policyCategory}`,
          gracePeriodDays: this.getGracePeriodForEnforcementLevel(mapping.enforcementLevel)
        };

        rules.push(rule);
      });
    });

    return rules;
  }

  /**
   * Get policies applicable to a workflow
   */
  getPoliciesForWorkflow(
    workflowType: WorkflowType,
    moduleType: ModuleType,
    mappings: PolicyModuleMapping[]
  ): string[] {
    return mappings
      .filter(mapping => 
        mapping.workflowTypes.includes(workflowType) || 
        mapping.moduleType === moduleType
      )
      .map(mapping => mapping.policyId);
  }

  /**
   * Get policy effectiveness report
   */
  generatePolicyEffectivenessReport(
    policyId: string,
    moduleType: ModuleType,
    period: { start: Date; end: Date },
    metrics: any // Would be actual metrics from database
  ): PolicyEffectivenessReport {
    // This would be implemented with actual data from monitoring systems
    return {
      policyId,
      policyTitle: 'Sample Policy', // Would be fetched from database
      moduleType,
      period,
      metrics: {
        acknowledgmentRate: metrics.acknowledgmentRate || 85,
        complianceRate: metrics.complianceRate || 92,
        incidentReduction: metrics.incidentReduction || 15,
        trainingCompletion: metrics.trainingCompletion || 78,
        auditScore: metrics.auditScore || 88
      },
      trends: {
        acknowledgments: metrics.acknowledgmentRate > 80 ? 'up' : 'down',
        compliance: metrics.complianceRate > 90 ? 'stable' : 'down',
        incidents: metrics.incidentReduction > 10 ? 'up' : 'stable'
      },
      recommendations: this.generateRecommendations(metrics)
    };
  }

  /**
   * Create integration hooks for policy enforcement
   */
  createIntegrationHooks(
    mappings: PolicyModuleMapping[]
  ): Record<string, IntegrationPoint[]> {
    const hooks: Record<string, IntegrationPoint[]> = {};

    mappings.forEach(mapping => {
      const moduleKey = mapping.moduleType;
      if (!hooks[moduleKey]) {
        hooks[moduleKey] = [];
      }
      hooks[moduleKey].push(...mapping.integrationPoints);
    });

    return hooks;
  }

  /**
   * Validate policy-module compatibility
   */
  validatePolicyModuleCompatibility(
    policy: PolicyDraft,
    moduleTypes: ModuleType[]
  ): { compatible: boolean; issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if policy category matches any module
    const compatibleModules = this.getCompatibleModules(policy.category);
    const hasCompatibleModule = moduleTypes.some(module => compatibleModules.includes(module));

    if (!hasCompatibleModule) {
      issues.push(`Policy category ${policy.category} not compatible with enabled modules`);
      recommendations.push(`Enable oneof: ${compatibleModules.join(', ')}`);
    }

    // Check jurisdiction compatibility
    const moduleJurisdictions = this.getModuleJurisdictions(moduleTypes);
    const hasJurisdictionMatch = policy.jurisdiction.some(j => moduleJurisdictions.includes(j));

    if (!hasJurisdictionMatch) {
      issues.push('Policy jurisdiction does not match module requirements');
      recommendations.push('Update policy jurisdiction or enable compatible modules');
    }

    // Check linked modules
    const missingModules = policy.linkedModules.filter(linkedModule => 
      !moduleTypes.map(m => m.toString()).includes(linkedModule)
    );

    if (missingModules.length > 0) {
      issues.push(`Policy requires modules notenabled: ${missingModules.join(', ')}`);
      recommendations.push(`Enable requiredmodules: ${missingModules.join(', ')}`);
    }

    return {
      compatible: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Helper methods

  private mapTriggerActionToEnforcementAction(action: string): EnforcementAction {
    switch (action) {
      case 'enforce': return EnforcementAction.BLOCK;
      case 'prompt': return EnforcementAction.PROMPT;
      case 'log': return EnforcementAction.LOG;
      case 'notify': return EnforcementAction.WARN;
      default: return EnforcementAction.LOG;
    }
  }

  private generateConditionsFromTrigger(trigger: PolicyTrigger): EnforcementCondition[] {
    // Generate enforcement conditions based on trigger type and condition
    const conditions: EnforcementCondition[] = [];

    if (trigger.triggerType === 'workflow_start' || trigger.action === 'enforce') {
      conditions.push({
        type: 'policy_acknowledged',
        operator: 'equals',
        value: true,
        description: 'Policy must be acknowledged'
      });
    }

    if (trigger.priority === 'critical') {
      conditions.push({
        type: 'training_completed',
        operator: 'equals',
        value: true,
        description: 'Training must be completed for critical policies'
      });
    }

    return conditions;
  }

  private getGracePeriodForEnforcementLevel(level: string): number {
    switch (level) {
      case 'mandatory': return 0; // No grace period for mandatory
      case 'recommended': return 7; // 1 week grace period
      case 'optional': return 30; // 1 month grace period
      default: return 7;
    }
  }

  private getCompatibleModules(category: PolicyCategory): ModuleType[] {
    const compatibility: Record<PolicyCategory, ModuleType[]> = {
      [PolicyCategory.SAFEGUARDING]: [ModuleType.SAFEGUARDING, ModuleType.INCIDENT_MANAGEMENT, ModuleType.TRAINING_CPD],
      [PolicyCategory.DATA_PROTECTION]: [ModuleType.DATA_PROTECTION, ModuleType.STAFF_MANAGEMENT],
      [PolicyCategory.MEDICATION]: [ModuleType.MEDICATION_MANAGEMENT, ModuleType.CARE_PLANNING],
      [PolicyCategory.HEALTH_SAFETY]: [ModuleType.HEALTH_SAFETY, ModuleType.EMERGENCY_PROCEDURES],
      [PolicyCategory.COMPLAINTS]: [ModuleType.COMPLAINTS, ModuleType.QUALITY_ASSURANCE],
      [PolicyCategory.STAFF_TRAINING]: [ModuleType.TRAINING_CPD, ModuleType.ONBOARDING],
      [PolicyCategory.INFECTION_CONTROL]: [ModuleType.HEALTH_SAFETY, ModuleType.CARE_PLANNING],
      [PolicyCategory.EMERGENCY_PROCEDURES]: [ModuleType.EMERGENCY_PROCEDURES, ModuleType.HEALTH_SAFETY],
      [PolicyCategory.DIGNITY_RESPECT]: [ModuleType.CARE_PLANNING, ModuleType.QUALITY_ASSURANCE],
      [PolicyCategory.NUTRITION_HYDRATION]: [ModuleType.CARE_PLANNING, ModuleType.HEALTH_SAFETY],
      [PolicyCategory.END_OF_LIFE]: [ModuleType.CARE_PLANNING, ModuleType.COMMUNICATION],
      [PolicyCategory.MENTAL_CAPACITY]: [ModuleType.CARE_PLANNING, ModuleType.SAFEGUARDING],
      [PolicyCategory.VISITORS]: [ModuleType.VISITOR_MANAGEMENT, ModuleType.COMMUNICATION],
      [PolicyCategory.TRANSPORT]: [ModuleType.HEALTH_SAFETY, ModuleType.CARE_PLANNING],
      [PolicyCategory.ACCOMMODATION]: [ModuleType.HEALTH_SAFETY, ModuleType.QUALITY_ASSURANCE]
    };

    return compatibility[category] || [];
  }

  private getModuleJurisdictions(moduleTypes: ModuleType[]): Jurisdiction[] {
    // Return jurisdictions supported by the enabled modules
    // This would be more sophisticated in a real implementation
    return [
      Jurisdiction.ENGLAND_CQC,
      Jurisdiction.SCOTLAND_CI,
      Jurisdiction.WALES_CIW,
      Jurisdiction.NORTHERN_IRELAND_RQIA,
      Jurisdiction.EU_GDPR,
      Jurisdiction.UK_DATA_PROTECTION
    ];
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.acknowledgmentRate < 90) {
      recommendations.push('Improve policy acknowledgment rates through targeted training');
    }

    if (metrics.complianceRate < 95) {
      recommendations.push('Review compliance procedures and provide additional support');
    }

    if (metrics.incidentReduction < 10) {
      recommendations.push('Analyze incident patterns and strengthen preventive measures');
    }

    if (metrics.trainingCompletion < 85) {
      recommendations.push('Implement mandatory training schedules and follow-up procedures');
    }

    return recommendations;
  }
}
