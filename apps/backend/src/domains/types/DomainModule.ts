/**
 * Domain Module Type Definition
 * Defines the structure that each domain module must implement
 */

export interface DomainModule {
  name: string;
  version: string;
  description: string;
  
  // Core domain components
  entities: Record<string, any>;
  services: Record<string, any>;
  controllers: Record<string, any>;
  routes: Record<string, any>;
  
  // Optional components
  middleware?: Record<string, any>;
  repositories?: Record<string, any>;
  dto?: Record<string, any>;
  schemas?: Record<string, any>;
  
  // Domain metadata
  dependencies?: string[];
  configuration?: Record<string, any>;
  healthCheck?: () => Promise<boolean>;
  
  // Lifecycle hooks
  initialize?: () => Promise<void>;
  shutdown?: () => Promise<void>;
}

export interface DomainContext {
  domainName: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
}

export interface DomainEvent {
  type: string;
  domain: string;
  entityId: string;
  data: any;
  timestamp: Date;
  context: DomainContext;
}

export interface DomainCommand {
  type: string;
  domain: string;
  data: any;
  context: DomainContext;
}

export interface DomainQuery {
  type: string;
  domain: string;
  filters: any;
  context: DomainContext;
}
