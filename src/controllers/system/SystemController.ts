/**
 * @fileoverview Controller for system testing, monitoring, and health checks
 * @module System/SystemController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Controller for system testing, monitoring, and health checks
 */

import { Controller, Get, Post, Body, Query, HttpStatus, HttpException } from '@nestjs/common';
import { SystemService, SystemTestResult, E2ETestResult, SmokeTestResult, RegressionTestResult, SystemStatus, SystemMetrics } from '../../services/system/SystemService';

/**
 * @fileoverview System Controller
 * @module SystemController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Controller for system testing, monitoring, and health checks
 * including unit tests, integration tests, E2E tests, and performance tests.
 */

@Controller('api/system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  /**
   * Run comprehensive system tests
   * @returns SystemTestResult
   */
  @Post('system-tests')
  async runSystemTests(): Promise<{ success: boolean; data: SystemTestResult; message: string }> {
    try {
      const result = await this.systemService.runSystemTests();
      return {
        success: true,
        data: result,
        message: 'System tests completed successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to run system tests',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Run end-to-end tests
   * @returns E2ETestResult
   */
  @Post('e2e-tests')
  async runE2ETests(): Promise<{ success: boolean; data: E2ETestResult; message: string }> {
    try {
      const result = await this.systemService.runE2ETests();
      return {
        success: true,
        data: result,
        message: 'E2E tests completed successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to run E2E tests',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Run smoke tests
   * @returns SmokeTestResult
   */
  @Post('smoke-tests')
  async runSmokeTests(): Promise<{ success: boolean; data: SmokeTestResult; message: string }> {
    try {
      const result = await this.systemService.runSmokeTests();
      return {
        success: true,
        data: result,
        message: 'Smoke tests completed successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to run smoke tests',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Run regression tests
   * @returns RegressionTestResult
   */
  @Post('regression-tests')
  async runRegressionTests(): Promise<{ success: boolean; data: RegressionTestResult; message: string }> {
    try {
      const result = await this.systemService.runRegressionTests();
      return {
        success: true,
        data: result,
        message: 'Regression tests completed successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to run regression tests',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get system status
   * @returns SystemStatus
   */
  @Get('status')
  async getSystemStatus(): Promise<{ success: boolean; data: SystemStatus; message: string }> {
    try {
      const result = await this.systemService.getSystemStatus();
      return {
        success: true,
        data: result,
        message: 'System status retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get system status',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get system metrics
   * @param timeRange Time range for metrics
   * @returns SystemMetrics
   */
  @Get('metrics')
  async getSystemMetrics(
    @Query('from') from: string,
    @Query('to') to: string
  ): Promise<{ success: boolean; data: SystemMetrics; message: string }> {
    try {
      if (!from || !to) {
        throw new HttpException(
          {
            success: false,
            message: 'Both from and to query parameters are required'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const timeRange = {
        from: new Date(from),
        to: new Date(to)
      };

      const result = await this.systemService.getSystemMetrics(timeRange);
      return {
        success: true,
        data: result,
        message: 'System metrics retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get system metrics',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get system health check
   * @returns Basic health status
   */
  @Get('health')
  async getHealthCheck(): Promise<{ success: boolean; data: { status: string; timestamp: Date }; message: string }> {
    try {
      return {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date()
        },
        message: 'System is healthy'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'System health check failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}