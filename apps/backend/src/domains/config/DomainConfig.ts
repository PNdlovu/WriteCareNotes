/**
 * Domain Configuration System
 * Centralized configuration management for all domain modules
 */

import { DomainModule } from '../types/DomainModule';

export interface DomainConfiguration {
  name: string;
  enabled: boolean;
  version: string;
  dependencies: string[];
  configuration: Record<string, any>;
  middleware: string[];
  routes: {
    prefix: string;
    version: string;
    middleware: string[];
  };
  database: {
    entities: string[];
    migrations: string[];
    seeds: string[];
  };
  cache: {
    enabled: boolean;
    ttl: number;
    keys: string[];
  };
  monitoring: {
    enabled: boolean;
    metrics: string[];
    alerts: string[];
  };
  security: {
    rbac: boolean;
    encryption: boolean;
    audit: boolean;
  };
}

export class DomainConfigManager {
  private static instance: DomainConfigManager;
  privateconfigurations: Map<string, DomainConfiguration> = new Map();

  private constructor() {
    this.loadDefaultConfigurations();
  }

  public static getInstance(): DomainConfigManager {
    if (!DomainConfigManager.instance) {
      DomainConfigManager.instance = new DomainConfigManager();
    }
    return DomainConfigManager.instance;
  }

  private loadDefaultConfigurations(): void {
    // Care Domain Configuration
    this.configurations.set('care', {
      name: 'care',
      enabled: true,
      version: '1.0.0',
      dependencies: ['compliance', 'ai'],
      configuration: {
        maxResidentsPerRoom: 2,
        medicationCheckInterval: 30,
        riskAssessmentFrequency: 7,
        emergencyResponseTime: 5,
      },
      middleware: ['auth', 'rbac', 'audit', 'validation'],
      routes: {
        prefix: '/api/care',
        version: 'v1',
        middleware: ['rateLimit', 'cors'],
      },
      database: {
        entities: ['Resident', 'CareRecord', 'CarePlan', 'MedicationRecord'],
        migrations: ['001_create_care_tables'],
        seeds: ['001_care_demo_data'],
      },
      cache: {
        enabled: true,
        ttl: 300,
        keys: ['residents', 'care_plans', 'medications'],
      },
      monitoring: {
        enabled: true,
        metrics: ['resident_count', 'care_plan_updates', 'medication_errors'],
        alerts: ['medication_overdue', 'risk_assessment_due'],
      },
      security: {
        rbac: true,
        encryption: true,
        audit: true,
      },
    });

    // Staff Domain Configuration
    this.configurations.set('staff', {
      name: 'staff',
      enabled: true,
      version: '1.0.0',
      dependencies: ['compliance', 'finance'],
      configuration: {
        maxShiftHours: 12,
        breakDuration: 30,
        certificationRenewalDays: 30,
        clockInOutTolerance: 5,
      },
      middleware: ['auth', 'rbac', 'audit'],
      routes: {
        prefix: '/api/staff',
        version: 'v1',
        middleware: ['rateLimit', 'cors'],
      },
      database: {
        entities: ['StaffMember', 'Shift', 'Roster', 'LeaveRequest'],
        migrations: ['001_create_staff_tables'],
        seeds: ['001_staff_demo_data'],
      },
      cache: {
        enabled: true,
        ttl: 600,
        keys: ['staff_members', 'shifts', 'rosters'],
      },
      monitoring: {
        enabled: true,
        metrics: ['staff_count', 'shift_coverage', 'leave_requests'],
        alerts: ['understaffed', 'overtime_exceeded'],
      },
      security: {
        rbac: true,
        encryption: true,
        audit: true,
      },
    });

    // Finance Domain Configuration
    this.configurations.set('finance', {
      name: 'finance',
      enabled: true,
      version: '1.0.0',
      dependencies: ['staff', 'compliance'],
      configuration: {
        currency: 'GBP',
        taxYear: '2024-25',
        payrollFrequency: 'monthly',
        invoiceDueDays: 30,
      },
      middleware: ['auth', 'rbac', 'audit', 'encryption'],
      routes: {
        prefix: '/api/finance',
        version: 'v1',
        middleware: ['rateLimit', 'cors', 'encryption'],
      },
      database: {
        entities: ['Invoice', 'Payment', 'PayrollRun', 'Salary'],
        migrations: ['001_create_finance_tables'],
        seeds: ['001_finance_demo_data'],
      },
      cache: {
        enabled: true,
        ttl: 1800,
        keys: ['invoices', 'payments', 'payroll_runs'],
      },
      monitoring: {
        enabled: true,
        metrics: ['revenue', 'expenses', 'payroll_cost'],
        alerts: ['payment_overdue', 'budget_exceeded'],
      },
      security: {
        rbac: true,
        encryption: true,
        audit: true,
      },
    });

    // Compliance Domain Configuration
    this.configurations.set('compliance', {
      name: 'compliance',
      enabled: true,
      version: '1.0.0',
      dependencies: [],
      configuration: {
        auditRetentionDays: 2555, // 7 years
        consentExpiryDays: 365,
        breachNotificationHours: 72,
        cqcInspectionFrequency: 365,
      },
      middleware: ['auth', 'rbac', 'audit', 'encryption'],
      routes: {
        prefix: '/api/compliance',
        version: 'v1',
        middleware: ['rateLimit', 'cors', 'encryption'],
      },
      database: {
        entities: ['ComplianceRecord', 'AuditLog', 'ConsentRecord'],
        migrations: ['001_create_compliance_tables'],
        seeds: ['001_compliance_demo_data'],
      },
      cache: {
        enabled: false,
        ttl: 0,
        keys: [],
      },
      monitoring: {
        enabled: true,
        metrics: ['audit_events', 'consent_records', 'breach_incidents'],
        alerts: ['consent_expired', 'breach_detected'],
      },
      security: {
        rbac: true,
        encryption: true,
        audit: true,
      },
    });

    // AI Domain Configuration
    this.configurations.set('ai', {
      name: 'ai',
      enabled: true,
      version: '1.0.0',
      dependencies: ['care', 'integration'],
      configuration: {
        maxConcurrentAgents: 10,
        agentTimeout: 300,
        summarizationModel: 'gpt-4',
        predictionConfidence: 0.8,
      },
      middleware: ['auth', 'rbac', 'audit'],
      routes: {
        prefix: '/api/ai',
        version: 'v1',
        middleware: ['rateLimit', 'cors'],
      },
      database: {
        entities: ['AIAgent', 'AISummary', 'MLModel'],
        migrations: ['001_create_ai_tables'],
        seeds: ['001_ai_demo_data'],
      },
      cache: {
        enabled: true,
        ttl: 3600,
        keys: ['ai_agents', 'ml_models', 'predictions'],
      },
      monitoring: {
        enabled: true,
        metrics: ['agent_usage', 'prediction_accuracy', 'response_time'],
        alerts: ['agent_failure', 'prediction_low_confidence'],
      },
      security: {
        rbac: true,
        encryption: true,
        audit: true,
      },
    });

    // Integration Domain Configuration
    this.configurations.set('integration', {
      name: 'integration',
      enabled: true,
      version: '1.0.0',
      dependencies: ['compliance'],
      configuration: {
        maxRetries: 3,
        timeout: 30,
        batchSize: 100,
        webhookSecret: process.env.WEBHOOK_SECRET,
      },
      middleware: ['auth', 'rbac', 'audit'],
      routes: {
        prefix: '/api/integration',
        version: 'v1',
        middleware: ['rateLimit', 'cors'],
      },
      database: {
        entities: ['Integration', 'IntegrationLog', 'IoTDevice'],
        migrations: ['001_create_integration_tables'],
        seeds: ['001_integration_demo_data'],
      },
      cache: {
        enabled: true,
        ttl: 1800,
        keys: ['integrations', 'device_status', 'sync_status'],
      },
      monitoring: {
        enabled: true,
        metrics: ['integration_success_rate', 'sync_frequency', 'error_rate'],
        alerts: ['integration_failure', 'sync_delayed'],
      },
      security: {
        rbac: true,
        encryption: true,
        audit: true,
      },
    });
  }

  public getConfiguration(domainName: string): DomainConfiguration | undefined {
    return this.configurations.get(domainName);
  }

  public getAllConfigurations(): Map<string, DomainConfiguration> {
    return new Map(this.configurations);
  }

  public updateConfiguration(domainName: string, config: Partial<DomainConfiguration>): void {
    const existing = this.configurations.get(domainName);
    if (existing) {
      this.configurations.set(domainName, { ...existing, ...config });
    }
  }

  public isDomainEnabled(domainName: string): boolean {
    const config = this.configurations.get(domainName);
    return config?.enabled ?? false;
  }

  public getDomainDependencies(domainName: string): string[] {
    const config = this.configurations.get(domainName);
    return config?.dependencies ?? [];
  }

  public getDomainMiddleware(domainName: string): string[] {
    const config = this.configurations.get(domainName);
    return config?.middleware ?? [];
  }

  public getDomainRoutes(domainName: string): any {
    const config = this.configurations.get(domainName);
    return config?.routes ?? {};
  }
}

export default DomainConfigManager;
