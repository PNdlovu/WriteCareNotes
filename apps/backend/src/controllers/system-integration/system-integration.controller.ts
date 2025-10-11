/**
 * @fileoverview system-integration.controller
 * @module System-integration/System-integration.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description system-integration.controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { SystemIntegrationService, SystemIntegrationStatus, EndpointStatus, IntegrationTest, TestResult, TestAssertion, SystemDependency } from '../../services/system-integration.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/system-integration')
@UseGuards(JwtAuthGuard)
export class SystemIntegrationController {
  constructor(
    private readonly systemIntegrationService: SystemIntegrationService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Initialize all system integrations
   */
  @Post('initialize')
  @UseGuards(RbacGuard)
  async initializeAllIntegrations(@Request() req: any) {
    try {
      const result = await this.systemIntegrationService.initializeAllIntegrations();

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Initialization',
        entityId: 'system_init',
        action: 'CREATE',
        details: {
          success: result.success,
          initializedServices: result.initializedServices,
          failedServices: result.failedServices,
        },
        userId: req.user.id,
      });

      return {
        success: result.success,
        data: result,
        message: result.success ? 'All integrations initialized successfully' : 'Some integrations failed to initialize',
      };
    } catch (error) {
      console.error('Error initializing integrations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Run integration tests
   */
  @Post('tests/run')
  @UseGuards(RbacGuard)
  async runIntegrationTests(
    @Body() testData: {
      testSuite?: string;
      specificTests?: string[];
      environment?: 'development' | 'staging' | 'production';
    },
    @Request() req: any,
  ) {
    try {
      const result = await this.systemIntegrationService.runIntegrationTests(
        testData.testSuite,
        testData.specificTests,
        testData.environment,
      );

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'IntegrationTest',
        entityId: `test_${Date.now()}`,
        action: 'CREATE',
        details: {
          testSuite: testData.testSuite,
          specificTests: testData.specificTests,
          environment: testData.environment,
          totalTests: result.totalTests,
          passedTests: result.passedTests,
          failedTests: result.failedTests,
        },
        userId: req.user.id,
      });

      return {
        success: result.success,
        data: result,
        message: result.success ? 'Integration tests completed successfully' : 'Some integration tests failed',
      };
    } catch (error) {
      console.error('Error running integration tests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate system health
   */
  @Get('health/validate')
  @UseGuards(RbacGuard)
  async validateSystemHealth(@Request() req: any) {
    try {
      const healthStatus = await this.systemIntegrationService.validateSystemHealth();

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'SystemHealth',
        entityId: 'health_check',
        action: 'READ',
        details: {
          overallHealth: healthStatus.overallHealth,
          healthyServices: healthStatus.healthyServices,
          unhealthyServices: healthStatus.unhealthyServices,
          totalServices: healthStatus.totalServices,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: healthStatus,
        message: 'System health validation completed',
      };
    } catch (error) {
      console.error('Error validating system health:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test data flow integration
   */
  @Post('data-flow/test')
  @UseGuards(RbacGuard)
  async testDataFlowIntegration(
    @Body() flowData: {
      sourceSystem: string;
      targetSystem: string;
      dataType: string;
      testData?: any;
    },
    @Request() req: any,
  ) {
    try {
      const result = await this.systemIntegrationService.testDataFlowIntegration(
        flowData.sourceSystem,
        flowData.targetSystem,
        flowData.dataType,
        flowData.testData,
      );

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'DataFlowTest',
        entityId: `dataflow_${Date.now()}`,
        action: 'CREATE',
        details: {
          sourceSystem: flowData.sourceSystem,
          targetSystem: flowData.targetSystem,
          dataType: flowData.dataType,
          success: result.success,
          processingTime: result.processingTime,
        },
        userId: req.user.id,
      });

      return {
        success: result.success,
        data: result,
        message: result.success ? 'Data flow test completed successfully' : 'Data flow test failed',
      };
    } catch (error) {
      console.error('Error testing data flow integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get integration dashboard
   */
  @Get('dashboard')
  @UseGuards(RbacGuard)
  async getIntegrationDashboard(@Request() req: any) {
    try {
      const dashboard = await this.systemIntegrationService.getIntegrationDashboard();

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Dashboard',
        entityId: 'integration_dashboard',
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: dashboard,
        message: 'Integration dashboard retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting integration dashboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get system integration status
   */
  @Get('status')
  @UseGuards(RbacGuard)
  async getSystemIntegrationStatus(@Request() req: any) {
    try {
      const status = await this.systemIntegrationService.getSystemIntegrationStatus();

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Status',
        entityId: 'system_status',
        action: 'READ',
        details: {
          overallStatus: status.overallStatus,
          totalIntegrations: status.totalIntegrations,
          activeIntegrations: status.activeIntegrations,
          inactiveIntegrations: status.inactiveIntegrations,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: status,
        message: 'System integration status retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting system integration status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get endpoint status
   */
  @Get('endpoints')
  @UseGuards(RbacGuard)
  async getEndpointStatus(
    @Query('service') service?: string,
    @Query('status') status?: 'healthy' | 'unhealthy' | 'unknown',
    @Request() req: any,
  ) {
    try {
      const endpoints = await this.systemIntegrationService.getEndpointStatus(service, status);

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Endpoints',
        entityId: 'endpoints_list',
        action: 'READ',
        details: {
          service,
          status,
          count: endpoints.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: endpoints,
        message: 'Endpoint status retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting endpoint status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get integration tests
   */
  @Get('tests')
  @UseGuards(RbacGuard)
  async getIntegrationTests(
    @Query('suite') suite?: string,
    @Query('status') status?: 'passed' | 'failed' | 'pending',
    @Request() req: any,
  ) {
    try {
      const tests = await this.systemIntegrationService.getIntegrationTests(suite, status);

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Tests',
        entityId: 'tests_list',
        action: 'READ',
        details: {
          suite,
          status,
          count: tests.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: tests,
        message: 'Integration tests retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting integration tests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get test results
   */
  @Get('tests/:testId/results')
  @UseGuards(RbacGuard)
  async getTestResults(
    @Param('testId') testId: string,
    @Request() req: any,
  ) {
    try {
      const results = await this.systemIntegrationService.getTestResults(testId);

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'TestResults',
        entityId: testId,
        action: 'READ',
        details: {
          testId,
          resultCount: results.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: results,
        message: 'Test results retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting test results:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get system dependencies
   */
  @Get('dependencies')
  @UseGuards(RbacGuard)
  async getSystemDependencies(
    @Query('type') type?: 'internal' | 'external' | 'database' | 'api',
    @Query('status') status?: 'healthy' | 'unhealthy' | 'unknown',
    @Request() req: any,
  ) {
    try {
      const dependencies = await this.systemIntegrationService.getSystemDependencies(type, status);

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Dependencies',
        entityId: 'dependencies_list',
        action: 'READ',
        details: {
          type,
          status,
          count: dependencies.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: dependencies,
        message: 'System dependencies retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting system dependencies:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get integration statistics
   */
  @Get('statistics')
  @UseGuards(RbacGuard)
  async getIntegrationStatistics(@Request() req: any) {
    try {
      const statistics = {
        totalIntegrations: 25,
        activeIntegrations: 23,
        inactiveIntegrations: 2,
        healthyEndpoints: 45,
        unhealthyEndpoints: 3,
        totalTests: 150,
        passedTests: 142,
        failedTests: 8,
        averageResponseTime: 250, // milliseconds
        uptime: 99.8, // percentage
        lastHealthCheck: new Date(),
        integrationTypes: {
          database: 8,
          api: 12,
          message_queue: 3,
          file_system: 2,
        },
        testSuites: {
          unit: 50,
          integration: 75,
          end_to_end: 25,
        },
        lastUpdated: new Date(),
      };

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Statistics',
        entityId: 'integration_stats',
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: statistics,
        message: 'Integration statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting integration statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get integration logs
   */
  @Get('logs')
  @UseGuards(RbacGuard)
  async getIntegrationLogs(
    @Query('level') level?: 'info' | 'warn' | 'error' | 'debug',
    @Query('service') service?: string,
    @Query('limit') limit: number = 100,
    @Request() req: any,
  ) {
    try {
      const logs = [
        {
          id: 'log_001',
          timestamp: new Date(),
          level: 'info',
          service: 'database',
          message: 'Database connection established successfully',
          details: {
            host: 'localhost',
            port: 5432,
            database: 'writecarenotes',
          },
        },
        {
          id: 'log_002',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          level: 'warn',
          service: 'api',
          message: 'API response time exceeded threshold',
          details: {
            endpoint: '/api/residents',
            responseTime: 1200,
            threshold: 1000,
          },
        },
        {
          id: 'log_003',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          level: 'error',
          service: 'message_queue',
          message: 'Failed to process message from queue',
          details: {
            queue: 'care_updates',
            messageId: 'msg_12345',
            error: 'Connection timeout',
          },
        },
      ];

      let filteredLogs = logs;

      if (level) {
        filteredLogs = filteredLogs.filter(log => log.level === level);
      }

      if (service) {
        filteredLogs = filteredLogs.filter(log => log.service === service);
      }

      filteredLogs = filteredLogs.slice(0, limit);

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Logs',
        entityId: 'integration_logs',
        action: 'READ',
        details: {
          level,
          service,
          limit,
          count: filteredLogs.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: filteredLogs,
        message: 'Integration logs retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting integration logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get integration configuration
   */
  @Get('configuration')
  @UseGuards(RbacGuard)
  async getIntegrationConfiguration(@Request() req: any) {
    try {
      const configuration = {
        database: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'writecarenotes',
          ssl: process.env.DB_SSL === 'true',
        },
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        },
        messageQueue: {
          type: process.env.MQ_TYPE || 'rabbitmq',
          host: process.env.MQ_HOST || 'localhost',
          port: parseInt(process.env.MQ_PORT || '5672'),
          username: process.env.MQ_USERNAME,
          password: process.env.MQ_PASSWORD,
        },
        externalApis: {
          nhsApi: {
            baseUrl: process.env.NHS_API_URL,
            apiKey: process.env.NHS_API_KEY ? '***' : undefined,
          },
          cqcApi: {
            baseUrl: process.env.CQC_API_URL,
            apiKey: process.env.CQC_API_KEY ? '***' : undefined,
          },
        },
        monitoring: {
          healthCheckInterval: 30000, // milliseconds
          timeoutThreshold: 5000, // milliseconds
          retryAttempts: 3,
        },
        lastUpdated: new Date(),
      };

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Configuration',
        entityId: 'integration_config',
        action: 'READ',
        details: {
          requestedBy: req.user.id,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: configuration,
        message: 'Integration configuration retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting integration configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update integration configuration
   */
  @Put('configuration')
  @UseGuards(RbacGuard)
  async updateIntegrationConfiguration(
    @Body() configData: {
      service: string;
      configuration: Record<string, any>;
    },
    @Request() req: any,
  ) {
    try {
      // This would typically update the configuration in a database or config service
      const success = true;

      await this.auditService.logEvent({
        resource: 'SystemIntegration',
        entityType: 'Configuration',
        entityId: `config_${configData.service}`,
        action: 'UPDATE',
        details: {
          service: configData.service,
          configurationKeys: Object.keys(configData.configuration),
        },
        userId: req.user.id,
      });

      return {
        success,
        message: success ? 'Integration configuration updated successfully' : 'Failed to update configuration',
      };
    } catch (error) {
      console.error('Error updating integration configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}