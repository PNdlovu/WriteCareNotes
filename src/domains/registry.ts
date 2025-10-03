/**
 * Domain Registry - Central registry for all domain modules
 * Provides a single point of access for all domain services, entities, and controllers
 */

import { DomainModule } from './types/DomainModule';

// Domain Modules
import * as CareDomain from './care';
import * as StaffDomain from './staff';
import * as FinanceDomain from './finance';
import * as ComplianceDomain from './compliance';
import * as AIDomain from './ai';
import * as IntegrationDomain from './integration';

export const DOMAIN_REGISTRY = {
  care: CareDomain,
  staff: StaffDomain,
  finance: FinanceDomain,
  compliance: ComplianceDomain,
  ai: AIDomain,
  integration: IntegrationDomain,
} as const;

export type DomainName = keyof typeof DOMAIN_REGISTRY;

export class DomainRegistry {
  private static instance: DomainRegistry;
  private modules: Map<DomainName, DomainModule> = new Map();

  private constructor() {
    this.initializeDomains();
  }

  public static getInstance(): DomainRegistry {
    if (!DomainRegistry.instance) {
      DomainRegistry.instance = new DomainRegistry();
    }
    return DomainRegistry.instance;
  }

  private initializeDomains(): void {
    Object.entries(DOMAIN_REGISTRY).forEach(([name, domain]) => {
      this.modules.set(name as DomainName, domain as DomainModule);
    });
  }

  public getDomain(name: DomainName): DomainModule | undefined {
    return this.modules.get(name);
  }

  public getAllDomains(): Map<DomainName, DomainModule> {
    return new Map(this.modules);
  }

  public getDomainNames(): DomainName[] {
    return Array.from(this.modules.keys());
  }

  public registerDomain(name: DomainName, domain: DomainModule): void {
    this.modules.set(name, domain);
  }

  public unregisterDomain(name: DomainName): boolean {
    return this.modules.delete(name);
  }
}

export default DomainRegistry;