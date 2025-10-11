/**
 * @fileoverview policy enforcer Service
 * @module Policy-authoring/PolicyEnforcerService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description policy enforcer Service
 */

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PolicyDraft, PolicyStatus } from '../../entities/policy-draft.entity';
import { UserAcknowledgment } from '../../entities/user-acknowledgment.entity';
import { AuditEvent, AuditEventType } from '../../entities/audit-event.entity';
import { PolicyStatusService, PolicyTrackingColor } from './PolicyStatusService';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/notification.service';

export enum WorkflowType {
  SAFEGUARDING_INCIDENT = 'safeguarding_incident',
  STAFF_ONBOARDING = 'staff_onboarding', 
  MEDICATION_ADMINISTRATION = 'medication_administration',
  CARE_PLAN_CREATION = 'care_plan_creation',
  COMPLAINT_HANDLING = 'complaint_handling',
  DATA_ACCESS = 'data_access',
  TRAINING_COMPLETION = 'training_completion',
  RESIDENT_ADMISSION = 'resident_admission',
  STAFF_SUPERVISION = 'staff_supervision',
  QUALITY_ASSURANCE = 'quality_assurance',
  EMERGENCY_RESPONSE = 'emergency_response',
  VISITOR_MANAGEMENT = 'visitor_management'
}

export enum EnforcementAction {
  BLOCK = 'block',           // Prevent workflow from proceeding
  WARN = 'warn',             // Show warning but allow continuation
  PROMPT = 'prompt',         // Prompt for policy acknowledgment
  LOG = 'log',               // Log violation but don't interrupt
  ESCALATE = 'escalate'      // Escalate to supervisor/compliance
}

export interface PolicyEnforcementRule {
  policyId: string;
  workflowTypes: WorkflowType[];
  enforcementAction: EnforcementAction;
  conditions: EnforcementCondition[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  exemptRoles?: string[];
  gracePeriodDays?: number;
  message: string;
  escalationContacts?: string[];
}

export interface EnforcementCondition {
  type: 'policy_acknowledged' | 'policy_active' | 'training_completed' | 'role_required' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
  description: string;
}

export interface WorkflowEnforcementContext {
  workflowType: WorkflowType;
  workflowId: string;
  userId: string;
  userRoles: string[];
  organizationId: string;
  metadata: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  ipAddress?: string;
}

export interface EnforcementResult {
  allowed: boolean;
  enforcementAction: EnforcementAction;
  violatedPolicies: PolicyViolation[];
  warnings: PolicyWarning[];
  requiredActions: RequiredAction[];
  auditEventId?: string;
  message: string;
}

export interface PolicyViolation {
  policy: PolicyDraft;
  rule: PolicyEnforcementRule;
  condition: EnforcementCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedAction: string;
}

export interface PolicyWarning {
  policy: PolicyDraft;
  message: string;
  actionRequired: boolean;
  dueDate?: Date;
}

export interface RequiredAction {
  type: 'acknowledge_policy' | 'complete_training' | 'contact_supervisor' | 'update_records';
  policyId?: string;
  description: string;
  deadline: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class PolicyEnforcerService {
  private readonlylogger = new Logger(PolicyEnforcerService.name);

  const ructor(
    private readonlypolicyStatusService: PolicyStatusService,
    private readonlyauditTrailService: AuditService,
    private readonlynotificationService: NotificationService
  ) {}

  /**
   * Enforce policies before workflow execution
   */
  async enforceWorkflowPolicies(
    context: WorkflowEnforcementContext,
    policies: PolicyDraft[],
    acknowledgments: UserAcknowledgment[],
    enforcementRules: PolicyEnforcementRule[]
  ): Promise<EnforcementResult> {
    this.logger.log(`Enforcing policies for workflow ${context.workflowType} by user ${context.userId}`);

    const violations: PolicyViolation[] = [];
    const warnings: PolicyWarning[] = [];
    const requiredActions: RequiredAction[] = [];
    let blockingAction: EnforcementAction | null = null;
    let resultMessage = '';

    // Find applicable enforcement rules for this workflow
    const applicableRules = enforcementRules.filter(rule => 
      rule.workflowTypes.includes(context.workflowType)
    );

    this.logger.debug(`Found ${applicableRules.length} applicable enforcement rules`);

    // Check each applicable rule
    for (const rule of applicableRules) {
      const policy = policies.find(p => p.id === rule.policyId);
      if (!policy) {
        this.logger.warn(`Policy ${rule.policyId} not found for enforcement rule`);
        continue;
      }

      // Check if user is exempt from this rule
      if (rule.exemptRoles && rule.exemptRoles.some(role => context.userRoles.includes(role))) {
        this.logger.debug(`User ${context.userId} exempt from policy ${policy.id} due to role`);
        continue;
      }

      // Evaluate enforcement conditions
      const conditionResults = await this.evaluateConditions(
        rule.conditions,
        context,
        policy,
        acknowledgments
      );

      const failedConditions = conditionResults.filter(result => !result.satisfied);

      if (failedConditions.length > 0) {
        // Policy violation detected
        for (const failed of failedConditions) {
          const violation: PolicyViolation = {
            policy,
            rule,
            condition: failed.condition,
            severity: rule.priority,
            description: `Policy "${policy.title}" violation: ${failed.reason}`,
            suggestedAction: this.getSuggestedAction(failed.condition, policy)
          };

          violations.push(violation);

          // Determine enforcement action
          if (this.isBlockingAction(rule.enforcementAction) && !blockingAction) {
            blockingAction = rule.enforcementAction;
          }

          // Generate required actions
          const requiredAction = this.generateRequiredAction(violation, rule);
          if (requiredAction) {
            requiredActions.push(requiredAction);
          }
        }
      } else {
        // Check if policy needs review or attention (warnings)
        const policyStatus = this.policyStatusService.calculatePolicyStatus(
          policy,
          acknowledgments.filter(ack => ack.policyId === policy.id),
          1, // We're checking for one user
          0  // No enforcement failures yet
        );

        if (policyStatus.color === PolicyTrackingColor.AMBER || policyStatus.color === PolicyTrackingColor.BLUE) {
          warnings.push({
            policy,
            message: policyStatus.description,
            actionRequired: policyStatus.actionRequired,
            dueDate: policyStatus.daysUntilAction ? this.addDays(new Date(), policyStatus.daysUntilAction) : undefined
          });
        }
      }
    }

    // Determine final result
    const allowed = !blockingAction || blockingAction === EnforcementAction.LOG;
    const finalAction = blockingAction || EnforcementAction.LOG;

    // Generate result message
    if (violations.length > 0) {
      const criticalViolations = violations.filter(v => v.severity === 'critical').length;
      const highViolations = violations.filter(v => v.severity === 'high').length;
      
      if (criticalViolations > 0) {
        resultMessage = `${criticalViolations} critical policy violation(s) detected. Workflow blocked.`;
      } else if (highViolations > 0) {
        resultMessage = `${highViolations} high-priority policy violation(s) detected. Review required.`;
      } else {
        resultMessage = `${violations.length} policy violation(s) detected. Please address before proceeding.`;
      }
    } else if (warnings.length > 0) {
      resultMessage = `${warnings.length} policy warning(s). Review recommended but workflow may proceed.`;
    } else {
      resultMessage = 'All policy requirements satisfied. Workflow may proceed.';
    }

    // Create audit event
    const auditEventId = await this.createEnforcementAuditEvent(
      context,
      violations,
      finalAction,
      allowed
    );

    // Send notifications for violations and escalations
    await this.handleEnforcementNotifications(context, violations, requiredActions);

    const result: EnforcementResult = {
      allowed,
      enforcementAction: finalAction,
      violatedPolicies: violations,
      warnings,
      requiredActions,
      auditEventId,
      message: resultMessage
    };

    this.logger.log(`Enforcement result: ${allowed ? 'ALLOWED' : 'BLOCKED'} with ${violations.length} violations`);

    return result;
  }

  /**
   * Evaluate enforcement conditions
   */
  private async evaluateConditions(
    conditions: EnforcementCondition[],
    context: WorkflowEnforcementContext,
    policy: PolicyDraft,
    acknowledgments: UserAcknowledgment[]
  ): Promise<Array<{ condition: EnforcementCondition; satisfied: boolean; reason: string }>> {
    const results = [];

    for (const condition of conditions) {
      let satisfied = false;
      let reason = '';

      switch (condition.type) {
        case 'policy_acknowledged':
          const userAcknowledgment = acknowledgments.find(
            ack => ack.policyId === policy.id && ack.userId === context.userId
          );
          satisfied = !!userAcknowledgment;
          reason = satisfied 
            ? `Policy acknowledged on ${userAcknowledgment!.acknowledgedAt}`
            : 'Policy not acknowledged by user';
          break;

        case 'policy_active':
          satisfied = policy.status === PolicyStatus.PUBLISHED && 
                     (!policy.expiryDate || policy.expiryDate > new Date());
          reason = satisfied 
            ? 'Policy is active and not expired'
            : policy.status !== PolicyStatus.PUBLISHED 
              ? 'Policy is not published'
              : 'Policy has expired';
          break;

        case 'training_completed':
          const acknowledgment = acknowledgments.find(
            ack => ack.policyId === policy.id && ack.userId === context.userId
          );
          satisfied = !!(acknowledgment?.trainingCompleted);
          reason = satisfied 
            ? 'Required training completed'
            : 'Required training not completed';
          break;

        case 'role_required':
          satisfied = Array.isArray(condition.value) 
            ? condition.value.some((role: string) => context.userRoles.includes(role))
            : context.userRoles.includes(condition.value);
          reason = satisfied 
            ? 'User has required role(s)'
            : 'User does not have required role(s)';
          break;

        case 'custom':
          // Custom conditions can be evaluated based on metadata
          satisfied = this.evaluateCustomCondition(condition, context, policy);
          reason = satisfied 
            ? 'Custom condition satisfied'
            : `Custom conditionfailed: ${condition.description}`;
          break;

        default:
          this.logger.warn(`Unknown conditiontype: ${condition.type}`);
          satisfied = true; // Default to satisfied for unknown conditions
          reason = 'Unknown condition type, defaulting to satisfied';
      }

      results.push({ condition, satisfied, reason });
    }

    return results;
  }

  /**
   * Evaluate custom enforcement conditions
   */
  private evaluateCustomCondition(
    condition: EnforcementCondition,
    context: WorkflowEnforcementContext,
    policy: PolicyDraft
  ): boolean {
    // Custom condition evaluation based on workflow metadata
    // This can be extended for specific business rules
    
    try {
      const { operator, value } = condition;
      const metadata = context.metadata;

      // Example customconditions:
      if (condition.description.includes('high_risk_resident')) {
        const residentRisk = metadata.residentRiskLevel;
        returnoperator === 'equals' ? residentRisk === value : residentRisk !== value;
      }

      if (condition.description.includes('out_of_hours')) {
        const hour = new Date().getHours();
        const isOutOfHours = hour < 8 || hour > 18;
        returnoperator === 'equals' ? isOutOfHours === value : isOutOfHours !== value;
      }

      if (condition.description.includes('sensitive_data')) {
        const containsSensitiveData = metadata.containsSensitiveData || false;
        returnoperator === 'equals' ? containsSensitiveData === value : containsSensitiveData !== value;
      }

      // Default fallback
      return true;
    } catch (error) {
      this.logger.error(`Error evaluating customcondition: ${error.message}`, error.stack);
      return false; // Fail safe - if custom condition can't be evaluated, fail the check
    }
  }

  /**
   * Check if enforcement action should block workflow
   */
  private isBlockingAction(action: EnforcementAction): boolean {
    returnaction === EnforcementAction.BLOCK || action === EnforcementAction.ESCALATE;
  }

  /**
   * Generate suggested action for policy violation
   */
  private getSuggestedAction(condition: EnforcementCondition, policy: PolicyDraft): string {
    switch (condition.type) {
      case 'policy_acknowledged':
        return `Please acknowledge policy "${policy.title}" before proceeding`;
      case 'policy_active':
        return `Policy "${policy.title}" needs to be reviewed and updated`;
      case 'training_completed':
        return `Complete required training for policy "${policy.title}"`;
      case 'role_required':
        return `Contact supervisor - this workflow requires elevated permissions`;
      case 'custom':
        return condition.description || 'Review policy requirements and try again';
      default:
        return 'Review policy requirements and contact compliance team';
    }
  }

  /**
   * Generate required action from violation
   */
  private generateRequiredAction(
    violation: PolicyViolation,
    rule: PolicyEnforcementRule
  ): RequiredAction | null {
    const deadline = this.addDays(new Date(), rule.gracePeriodDays || 7);

    switch (violation.condition.type) {
      case 'policy_acknowledged':
        return {
          type: 'acknowledge_policy',
          policyId: violation.policy.id,
          description: `Acknowledge policy "${violation.policy.title}"`,
          deadline,
          priority: rule.priority
        };

      case 'training_completed':
        return {
          type: 'complete_training',
          policyId: violation.policy.id,
          description: `Complete training for policy "${violation.policy.title}"`,
          deadline,
          priority: rule.priority
        };

      case 'role_required':
        return {
          type: 'contact_supervisor',
          description: 'Contact supervisor for elevated permissions',
          deadline,
          priority: rule.priority
        };

      case 'policy_active':
        return {
          type: 'update_records',
          policyId: violation.policy.id,
          description: `Update policy "${violation.policy.title}" - expired or inactive`,
          deadline,
          priority: rule.priority
        };

      default:
        return null;
    }
  }

  /**
   * Create audit event for enforcement action
   */
  private async createEnforcementAuditEvent(
    context: WorkflowEnforcementContext,
    violations: PolicyViolation[],
    action: EnforcementAction,
    allowed: boolean
  ): Promise<string> {
    try {
      const auditEvent = new AuditEvent();
      auditEvent.eventType = AuditEventType.POLICY_ENFORCED;
      auditEvent.actorId = context.userId;
      auditEvent.timestamp = new Date();
      auditEvent.metadata = {
        workflowType: context.workflowType,
        workflowId: context.workflowId,
        enforcementAction: action,
        allowed,
        violationCount: violations.length,
        violations: violations.map(v => ({
          policyId: v.policy.id,
          policyTitle: v.policy.title,
          severity: v.severity,
          condition: v.condition.type
        })),
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        organizationId: context.organizationId
      };

      const savedEvent = await this.auditTrailService.createAuditEvent(auditEvent);
      return savedEvent.id;
    } catch (error) {
      this.logger.error(`Failed to create enforcement auditevent: ${error.message}`, error.stack);
      return 'audit_creation_failed';
    }
  }

  /**
   * Handle notifications for enforcement violations
   */
  private async handleEnforcementNotifications(
    context: WorkflowEnforcementContext,
    violations: PolicyViolation[],
    requiredActions: RequiredAction[]
  ): Promise<void> {
    try {
      // Notify user of violations and required actions
      if (violations.length > 0) {
        const criticalViolations = violations.filter(v => v.severity === 'critical');
        
        if (criticalViolations.length > 0) {
          // Send immediate notification for critical violations
          await this.notificationService.sendImmediateNotification({
            userId: context.userId,
            title: 'Critical Policy Violation',
            message: `Critical policy violations detected in ${context.workflowType}. Immediate action required.`,
            type: 'critical',
            metadata: {
              workflowType: context.workflowType,
              violationCount: criticalViolations.length,
              policies: criticalViolations.map(v => v.policy.title)
            }
          });
        }

        // Send notification with required actions
        if (requiredActions.length > 0) {
          await this.notificationService.sendActionRequiredNotification({
            userId: context.userId,
            title: 'Policy Action Required',
            message: `${requiredActions.length} policy action(s) required before proceeding with ${context.workflowType}`,
            actions: requiredActions,
            deadline: requiredActions[0].deadline
          });
        }
      }

      // Escalate critical violations to supervisors
      const escalationViolations = violations.filter(v => 
        v.severity === 'critical' || v.rule.enforcementAction === EnforcementAction.ESCALATE
      );

      if (escalationViolations.length > 0) {
        // Find escalation contacts
        const escalationContacts = new Set<string>();
        escalationViolations.forEach(v => {
          if (v.rule.escalationContacts) {
            v.rule.escalationContacts.forEach(contact => escalationContacts.add(contact));
          }
        });

        // Send escalation notifications
        for (const contact of escalationContacts) {
          await this.notificationService.sendEscalationNotification({
            userId: contact,
            title: 'Policy Violation Escalation',
            message: `Critical policy violations require supervisor attention`,
            metadata: {
              violatingUser: context.userId,
              workflowType: context.workflowType,
              violations: escalationViolations.map(v => ({
                policy: v.policy.title,
                severity: v.severity,
                description: v.description
              }))
            }
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send enforcementnotifications: ${error.message}`, error.stack);
    }
  }

  /**
   * Helper method to add days to a date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Check if workflow should be blocked based on enforcement result
   */
  shouldBlockWorkflow(result: EnforcementResult): boolean {
    return !result.allowed || result.enforcementAction === EnforcementAction.BLOCK;
  }

  /**
   * Throw appropriate exception if workflow should be blocked
   */
  throwEnforcementException(result: EnforcementResult): never {
    const criticalViolations = result.violatedPolicies.filter(v => v.severity === 'critical');
    
    if (criticalViolations.length > 0) {
      throw new ForbiddenException({
        message: 'Workflow blocked due to critical policy violations',
        violations: criticalViolations.map(v => ({
          policy: v.policy.title,
          reason: v.description,
          action: v.suggestedAction
        })),
        requiredActions: result.requiredActions,
        code: 'POLICY_VIOLATION_CRITICAL'
      });
    }

    throw new ForbiddenException({
      message: result.message,
      violations: result.violatedPolicies.map(v => v.description),
      requiredActions: result.requiredActions,
      code: 'POLICY_VIOLATION'
    });
  }

  /**
   * Default enforcement rules for common workflows
   */
  getDefaultEnforcementRules(): PolicyEnforcementRule[] {
    return [
      // Safeguarding incident workflow
      {
        policyId: 'safeguarding-policy',
        workflowTypes: [WorkflowType.SAFEGUARDING_INCIDENT],
        enforcementAction: EnforcementAction.BLOCK,
        conditions: [
          {
            type: 'policy_acknowledged',
            operator: 'equals',
            value: true,
            description: 'Safeguarding policy must be acknowledged'
          },
          {
            type: 'training_completed',
            operator: 'equals',
            value: true,
            description: 'Safeguarding training must be completed'
          }
        ],
        priority: 'critical',
        message: 'Safeguarding policy acknowledgment and training required',
        escalationContacts: ['safeguarding-lead@example.com']
      },

      // Staff onboarding workflow
      {
        policyId: 'data-protection-policy',
        workflowTypes: [WorkflowType.STAFF_ONBOARDING],
        enforcementAction: EnforcementAction.PROMPT,
        conditions: [
          {
            type: 'policy_acknowledged',
            operator: 'equals',
            value: true,
            description: 'Data protection policy must be acknowledged during onboarding'
          }
        ],
        priority: 'high',
        gracePeriodDays: 3,
        message: 'Data protection policy acknowledgment required for new staff'
      },

      // Medication administration workflow
      {
        policyId: 'medication-management-policy',
        workflowTypes: [WorkflowType.MEDICATION_ADMINISTRATION],
        enforcementAction: EnforcementAction.BLOCK,
        conditions: [
          {
            type: 'training_completed',
            operator: 'equals',
            value: true,
            description: 'Medication management training must be completed'
          },
          {
            type: 'role_required',
            operator: 'contains',
            value: ['nurse', 'senior_carer', 'medication_administrator'],
            description: 'User must have medication administration role'
          }
        ],
        priority: 'critical',
        message: 'Medication administration requires proper training and role authorization'
      }
    ];
  }
}
