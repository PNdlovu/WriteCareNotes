import { EventEmitter2 } from 'eventemitter2';
import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { AuditTrailService } from '../audit/AuditTrailService';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastChecked: Date;
  details: Record<string, any>;
  error?: string;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    free: number;
    usagePercentage: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
    usagePercentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
    slowQueries: number;
  };
  redis: {
    connected: boolean;
    memoryUsage: number;
    hitRate: number;
    operations: number;
  };
  application: {
    uptime: number;
    requestsPerMinute: number;
    errorRate: number;
    responseTime: number;
  };
}

export interface PrometheusMetrics {
  timestamp: Date;
  metrics: string;
}

export class HealthCheckService {
  private auditService: AuditTrailService;
  private eventEmitter: EventEmitter2;
  private healthChecks: Map<string, HealthCheckResult> = new Map();
  private metrics: SystemMetrics[] = [];
  private startTime: Date;

  constructor() {
    this.auditService = new AuditTrailService();
    this.eventEmitter = new EventEmitter2();
    this.startTime = new Date();
    
    this.startHealthCheckInterval();
    this.startMetricsCollection();
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheckResult[];
    timestamp: Date;
  }> {
    const checks: HealthCheckResult[] = [];

    // Database health check
    checks.push(await this.checkDatabase());

    // Redis health check
    checks.push(await this.checkRedis());

    // External services health check
    checks.push(await this.checkExternalServices());

    // Application health check
    checks.push(await this.checkApplication());

    // AI services health check
    checks.push(await this.checkAIServices());

    // Integration services health check
    checks.push(await this.checkIntegrationServices());

    // Store results
    checks.forEach(check => {
      this.healthChecks.set(check.service, check);
    });

    // Determine overall status
    const overall = this.determineOverallStatus(checks);

    const result = {
      overall,
      checks,
      timestamp: new Date()
    };

    // Emit health check event
    this.eventEmitter.emit('health.check.completed', result);

    return result;
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      const dataSource = AppDataSource;
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      // Perform a simple query
      await dataSource.query('SELECT 1');

      // Get connection pool stats
      const connectionCount = dataSource.manager.connection?.pool?.totalCount || 0;
      const idleCount = dataSource.manager.connection?.pool?.idleCount || 0;
      const waitingCount = dataSource.manager.connection?.pool?.waitingCount || 0;

      const responseTime = Date.now() - startTime;

      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        details: {
          connectionCount,
          idleCount,
          waitingCount,
          maxConnections: 100
        }
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Real Redis health check implementation
      const Redis = require('ioredis');
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        connectTimeout: 5000,
        lazyConnect: true
      });

      // Test Redis connectivity with actual operations
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'health_check_test';
      
      await redis.set(testKey, testValue, 'EX', 10); // Set with 10 second expiry
      const retrievedValue = await redis.get(testKey);
      await redis.del(testKey);

      if (retrievedValue !== testValue) {
        throw new Error('Redis read/write test failed');
      }

      // Get real Redis info
      const info = await redis.info();
      const memory = await redis.memory('usage');
      const stats = await redis.info('stats');
      
      const responseTime = Date.now() - startTime;

      // Parse Redis info for real metrics
      const memoryUsage = this.parseRedisInfo(info, 'used_memory');
      const hitRate = this.calculateHitRate(stats);
      const totalOps = this.parseRedisInfo(stats, 'total_commands_processed');

      await redis.disconnect();

      return {
        service: 'redis',
        status: 'healthy',
        responseTime,
        lastChecked: new Date(),
        details: {
          connected: true,
          memoryUsage: parseInt(memoryUsage) || 0,
          hitRate: hitRate || 0,
          operations: parseInt(totalOps) || 0,
          version: this.parseRedisInfo(info, 'redis_version')
        }
      };
    } catch (error: unknown) {
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check external services health
   */
  private async checkExternalServices(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check GP Connect
      const gpConnectStatus = await this.checkGPConnect();
      
      // Check IoT services
      const iotStatus = await this.checkIoTServices();

      const responseTime = Date.now() - startTime;
      const allHealthy = gpConnectStatus && iotStatus;

      return {
        service: 'external_services',
        status: allHealthy ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        details: {
          gpConnect: gpConnectStatus,
          iot: iotStatus
        }
      };
    } catch (error) {
      return {
        service: 'external_services',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check application health
   */
  private async checkApplication(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const uptime = Date.now() - this.startTime.getTime();
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const responseTime = Date.now() - startTime;

      return {
        service: 'application',
        status: 'healthy',
        responseTime,
        lastChecked: new Date(),
        details: {
          uptime,
          memoryUsage: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external
          },
          cpuUsage: {
            user: cpuUsage.user,
            system: cpuUsage.system
          },
          nodeVersion: process.version,
          platform: process.platform
        }
      };
    } catch (error) {
      return {
        service: 'application',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check AI services health
   */
  private async checkAIServices(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check OpenAI adapter
      const openAIStatus = await this.checkOpenAIAdapter();
      
      // Check AI Agent Manager
      const agentManagerStatus = await this.checkAgentManager();

      const responseTime = Date.now() - startTime;
      const allHealthy = openAIStatus && agentManagerStatus;

      return {
        service: 'ai_services',
        status: allHealthy ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        details: {
          openAI: openAIStatus,
          agentManager: agentManagerStatus
        }
      };
    } catch (error) {
      return {
        service: 'ai_services',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check integration services health
   */
  private async checkIntegrationServices(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check GraphQL gateway
      const graphQLStatus = await this.checkGraphQLGateway();
      
      // Check external integrations
      const integrationStatus = await this.checkExternalIntegrations();

      const responseTime = Date.now() - startTime;
      const allHealthy = graphQLStatus && integrationStatus;

      return {
        service: 'integration_services',
        status: allHealthy ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        details: {
          graphQL: graphQLStatus,
          integrations: integrationStatus
        }
      };
    } catch (error) {
      return {
        service: 'integration_services',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check GP Connect service
   */
  private async checkGPConnect(): Promise<boolean> {
    try {
      const axios = require('axios');
      
      // Real GP Connect API health check
      const gpConnectUrl = process.env.GP_CONNECT_URL || 'https://api.service.nhs.uk/gp-connect';
      const apiKey = process.env.GP_CONNECT_API_KEY;
      
      if (!apiKey) {
        console.warn('GP Connect API key not configured');
        return false;
      }

      const response = await axios.get(`${gpConnectUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'WriteCareNotes-HealthCheck/1.0'
        },
        timeout: 5000
      });

      return response.status === 200 && response.data.status === 'UP';
    } catch (error: unknown) {
      console.error('GP Connect health check failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Check IoT services
   */
  private async checkIoTServices(): Promise<boolean> {
    try {
      const axios = require('axios');
      
      // Real IoT services health check
      const iotServiceUrl = process.env.IOT_SERVICE_URL || 'http://localhost:8080';
      const iotApiKey = process.env.IOT_API_KEY;
      
      if (!iotApiKey) {
        console.warn('IoT service API key not configured');
        return false;
      }

      const response = await axios.get(`${iotServiceUrl}/api/health`, {
        headers: {
          'Authorization': `Bearer ${iotApiKey}`,
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check OpenAI adapter
   */
  private async checkOpenAIAdapter(): Promise<boolean> {
    try {
      const axios = require('axios');
      
      // Real OpenAI API health check
      const openAIApiKey = process.env.OPENAI_API_KEY;
      
      if (!openAIApiKey) {
        console.warn('OpenAI API key not configured');
        return false;
      }

      // Test OpenAI API connectivity with a minimal request
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      return response.status === 200 && response.data.data && Array.isArray(response.data.data);
    } catch (error: unknown) {
      console.error('OpenAI adapter health check failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Check AI Agent Manager
   */
  private async checkAgentManager(): Promise<boolean> {
    try {
      // Mock Agent Manager check
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check GraphQL gateway
   */
  private async checkGraphQLGateway(): Promise<boolean> {
    try {
      // Mock GraphQL gateway check
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check external integrations
   */
  private async checkExternalIntegrations(): Promise<boolean> {
    try {
      // Mock external integrations check
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(checks: HealthCheckResult[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date(),
      cpu: {
        usage: 0, // Would calculate actual CPU usage
        loadAverage: [0, 0, 0] // Would get actual load average
      },
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        free: memoryUsage.heapTotal - memoryUsage.heapUsed,
        usagePercentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      disk: {
        used: 0, // Would calculate actual disk usage
        total: 0,
        free: 0,
        usagePercentage: 0
      },
      network: {
        bytesIn: 0, // Would track network bytes
        bytesOut: 0,
        connections: 0
      },
      database: {
        connections: 0, // Would get actual connection count
        maxConnections: 100,
        queryTime: 0,
        slowQueries: 0
      },
      redis: {
        connected: true,
        memoryUsage: 0,
        hitRate: 0.95,
        operations: 0
      },
      application: {
        uptime: Date.now() - this.startTime.getTime(),
        requestsPerMinute: 0, // Would track actual requests
        errorRate: 0,
        responseTime: 0
      }
    };
  }

  /**
   * Generate Prometheus metrics
   */
  generatePrometheusMetrics(): PrometheusMetrics {
    const metrics = [
      '# HELP application_uptime_seconds Application uptime in seconds',
      '# TYPE application_uptime_seconds counter',
      `application_uptime_seconds ${(Date.now() - this.startTime.getTime()) / 1000}`,
      '',
      '# HELP application_memory_usage_bytes Application memory usage in bytes',
      '# TYPE application_memory_usage_bytes gauge',
      `application_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}`,
      `application_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}`,
      `application_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}`,
      '',
      '# HELP application_health_status Application health status',
      '# TYPE application_health_status gauge',
      'application_health_status 1'
    ].join('\n');

    return {
      timestamp: new Date(),
      metrics
    };
  }

  /**
   * Start health check interval
   */
  private startHealthCheckInterval(): void {
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        this.metrics.push(metrics);
        
        // Keep only last 100 metrics
        if (this.metrics.length > 100) {
          this.metrics = this.metrics.slice(-100);
        }
      } catch (error) {
        console.error('Metrics collection failed:', error);
      }
    }, 10000); // Collect every 10 seconds
  }

  /**
   * Get health check results
   */
  getHealthCheckResults(): HealthCheckResult[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get latest system metrics
   */
  getLatestSystemMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get health check result for specific service
   */
  getServiceHealth(service: string): HealthCheckResult | null {
    return this.healthChecks.get(service) || null;
  }

  /**
   * Parse Redis info string for specific values
   */
  private parseRedisInfo(info: string, key: string): string {
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.startsWith(`${key}:`)) {
        return line.split(':')[1];
      }
    }
    return '0';
  }

  /**
   * Calculate Redis hit rate from stats
   */
  private calculateHitRate(stats: string): number {
    const hits = parseInt(this.parseRedisInfo(stats, 'keyspace_hits')) || 0;
    const misses = parseInt(this.parseRedisInfo(stats, 'keyspace_misses')) || 0;
    const total = hits + misses;
    
    if (total === 0) return 0;
    return hits / total;
  }
}

export default HealthCheckService;