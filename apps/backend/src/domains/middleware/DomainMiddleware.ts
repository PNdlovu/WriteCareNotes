/**
 * Domain-aware Middleware System
 * Provides middleware that can route requests to appropriate domain modules
 */

import { Request, Response, NextFunction } from 'express';
import DomainRegistry from '../registry';
import { DomainContext } from '../types/DomainModule';

export interface DomainRequest extends Request {
  domain?: string;
  domainContext?: DomainContext;
}

export class DomainMiddleware {
  private static instance: DomainMiddleware;
  privatedomainRegistry: DomainRegistry;

  private constructor() {
    this.domainRegistry = DomainRegistry.getInstance();
  }

  public static getInstance(): DomainMiddleware {
    if (!DomainMiddleware.instance) {
      DomainMiddleware.instance = new DomainMiddleware();
    }
    return DomainMiddleware.instance;
  }

  /**
   * Middleware to extract domain from request path
   * Routes like /api/care/residents or /api/staff/employees
   */
  public extractDomain() {
    return (req: DomainRequest, res: Response, next: NextFunction) => {
      const pathSegments = req.path.split('/').filter(Boolean);
      
      if (pathSegments.length >= 2 && pathSegments[0] === 'api') {
        const domainName = pathSegments[1] as keyof ReturnType<typeof this.domainRegistry.getAllDomains>;
        const domain = this.domainRegistry.getDomain(domainName);
        
        if (domain) {
          req.domain = domainName;
          req.domainContext = {
            domainName,
            tenantId: req.headers['x-tenant-id'] as string,
            userId: req.headers['x-user-id'] as string,
            requestId: req.headers['x-request-id'] as string,
          };
        }
      }
      
      next();
    };
  }

  /**
   * Middleware to validate domain access permissions
   */
  public validateDomainAccess() {
    return (req: DomainRequest, res: Response, next: NextFunction) => {
      if (!req.domain) {
        return next();
      }

      const domain = this.domainRegistry.getDomain(req.domain);
      if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      // Add domain-specific access validation here
      // This could check user permissions, tenant access, etc.
      
      next();
    };
  }

  /**
   * Middleware to inject domain services into request
   */
  public injectDomainServices() {
    return (req: DomainRequest, res: Response, next: NextFunction) => {
      if (!req.domain) {
        return next();
      }

      const domain = this.domainRegistry.getDomain(req.domain);
      if (domain) {
        // Inject domain services into request object
        req.domainServices = domain.services;
        req.domainEntities = domain.entities;
        req.domainControllers = domain.controllers;
      }
      
      next();
    };
  }

  /**
   * Middleware to handle domain-specific error handling
   */
  public domainErrorHandler() {
    return (error: any, req: DomainRequest, res: Response, next: NextFunction) => {
      if (req.domain) {
        const domain = this.domainRegistry.getDomain(req.domain);
        if (domain && domain.errorHandler) {
          return domain.errorHandler(error, req, res, next);
        }
      }
      
      next(error);
    };
  }

  /**
   * Middleware to log domain-specific events
   */
  public domainEventLogger() {
    return (req: DomainRequest, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      
      res.send = function(data: any) {
        // Log domain-specific events
        if (req.domain && req.domainContext) {
          console.log(`[${req.domain}] ${req.method} ${req.path} - ${res.statusCode}`, {
            domain: req.domain,
            context: req.domainContext,
            timestamp: new Date().toISOString(),
          });
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      domain?: string;
      domainContext?: DomainContext;
      domainServices?: Record<string, any>;
      domainEntities?: Record<string, any>;
      domainControllers?: Record<string, any>;
    }
  }
}

export default DomainMiddleware;
