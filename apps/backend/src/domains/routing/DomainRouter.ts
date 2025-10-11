/**
 * Domain Router - Automatic routing to domain-specific controllers
 * Routes requests to appropriate domain modules based on URL patterns
 */

import { Router, Request, Response, NextFunction } from 'express';
import DomainRegistry from '../registry';
import { DomainRequest } from '../middleware/DomainMiddleware';

export class DomainRouter {
  private static instance: DomainRouter;
  private domainRegistry: DomainRegistry;
  private router: Router;

  private constructor() {
    this.domainRegistry = DomainRegistry.getInstance();
    this.router = Router();
    this.setupRoutes();
  }

  public static getInstance(): DomainRouter {
    if (!DomainRouter.instance) {
      DomainRouter.instance = new DomainRouter();
    }
    return DomainRouter.instance;
  }

  private setupRoutes(): void {
    // Setup domain-specific routes
    this.domainRegistry.getDomainNames().forEach(domainName => {
      const domain = this.domainRegistry.getDomain(domainName);
      if (domain && domain.routes) {
        this.setupDomainRoutes(domainName, domain.routes);
      }
    });

    // Health check for all domains
    this.router.get('/health', this.healthCheck.bind(this));
    
    // Domain discovery endpoint
    this.router.get('/domains', this.listDomains.bind(this));
  }

  private setupDomainRoutes(domainName: string, routes: Record<string, any>): void {
    const domainRouter = Router();
    
    // Register all routes for this domain
    Object.entries(routes).forEach(([routeName, routeHandler]) => {
      if (typeof routeHandler === 'function') {
        // Handle different HTTP methods
        const methods = ['get', 'post', 'put', 'patch', 'delete', 'options'];
        methods.forEach(method => {
          if (routeHandler[method]) {
            domainRouter[method]('/', routeHandler[method]);
          }
        });
      } else if (typeof routeHandler === 'object') {
        // Handle route objects with path and handler
        Object.entries(routeHandler).forEach(([path, handler]) => {
          if (typeof handler === 'function') {
            domainRouter.all(path, handler);
          }
        });
      }
    });

    // Mount domain router under /api/{domain}
    this.router.use(`/${domainName}`, domainRouter);
  }

  private async healthCheck(req: Request, res: Response): Promise<void> {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      domains: {},
    };

    // Check health of each domain
    for (const domainName of this.domainRegistry.getDomainNames()) {
      const domain = this.domainRegistry.getDomain(domainName);
      if (domain && domain.healthCheck) {
        try {
          const isHealthy = await domain.healthCheck();
          healthStatus.domains[domainName] = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            lastCheck: new Date().toISOString(),
          };
        } catch (error) {
          healthStatus.domains[domainName] = {
            status: 'error',
            error: error.message,
            lastCheck: new Date().toISOString(),
          };
        }
      } else {
        healthStatus.domains[domainName] = {
          status: 'unknown',
          lastCheck: new Date().toISOString(),
        };
      }
    }

    const allHealthy = Object.values(healthStatus.domains).every(
      (domain: any) => domain.status === 'healthy'
    );

    res.status(allHealthy ? 200 : 503).json(healthStatus);
  }

  private listDomains(req: Request, res: Response): void {
    const domains = this.domainRegistry.getDomainNames().map(domainName => {
      const domain = this.domainRegistry.getDomain(domainName);
      return {
        name: domainName,
        version: domain?.version || '1.0.0',
        description: domain?.description || '',
        endpoints: domain?.routes ? Object.keys(domain.routes) : [],
      };
    });

    res.json({
      domains,
      total: domains.length,
    });
  }

  public getRouter(): Router {
    return this.router;
  }

  /**
   * Register a new domain at runtime
   */
  public registerDomain(domainName: string, domain: any): void {
    this.domainRegistry.registerDomain(domainName, domain);
    this.setupDomainRoutes(domainName, domain.routes);
  }

  /**
   * Unregister a domain
   */
  public unregisterDomain(domainName: string): boolean {
    return this.domainRegistry.unregisterDomain(domainName);
  }
}

export default DomainRouter;