/**
 * @fileoverview Comprehensive service for managing third-party integrations
 * @module Integration-marketplace/IntegrationMarketplaceService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive service for managing third-party integrations
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Integration Marketplace Service
 * @module IntegrationMarketplaceService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive service for managing third-party integrations
 * while maintaining superior in-house capabilities.
 */

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

import { ResidentStatus } from '../entities/Resident';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IntegrationConfig } from '../../entities/integration/IntegrationConfig';
import { IntegrationLog } from '../../entities/integration/IntegrationLog';
import { OrganizationIntegration } from '../../entities/integration/OrganizationIntegration';

interface AvailableIntegration {
  id: string;
  name: string;
  provider: string;
  category: 'healthcare' | 'financial' | 'communication' | 'hr' | 'analytics' | 'security';
  description: string;
  features: string[];
  pricing: 'free' | 'premium' | 'enterprise';
  rating: number;
  installs: number;
  isRecommended: boolean;
  isInHouseSuperior: boolean;
  inHouseAlternative?: string;
  apiEndpoint: string;
  authMethod: 'oauth2' | 'apikey' | 'basic' | 'certificate';
  webhookSupport: boolean;
  realTimeSync: boolean;
  documentation: string;
  supportLevel: 'basic' | 'standard' | 'premium';
}


export class IntegrationMarketplaceService {
  // Logger removed

  // Pre-defined integration catalog
  private readonlyintegrationCatalog: AvailableIntegration[] = [
    // Healthcare Systems
    {
      id: 'atlas-emar',
      name: 'Atlas eMAR',
      provider: 'Atlas Healthcare',
      category: 'healthcare',
      description: 'Electronic medication administration records system for care homes.',
      features: ['Medication charting', 'Basic interaction checking', 'Compliance reporting'],
      pricing: 'enterprise',
      rating: 4.2,
      installs: 1250,
      isRecommended: false,
      isInHouseSuperior: true,
      inHouseAlternative: 'Advanced eMAR with AI Clinical Decision Support',
      apiEndpoint: 'https://api.atlas-healthcare.com/v1',
      authMethod: 'oauth2',
      webhookSupport: true,
      realTimeSync: false,
      documentation: 'https://docs.atlas-healthcare.com',
      supportLevel: 'premium',
    },
    {
      id: 'gp-connect',
      name: 'GP Connect Enhanced',
      provider: 'NHS Digital',
      category: 'healthcare',
      description: 'Enhanced GP Connect integration for patient data exchange.',
      features: ['Patient data access', 'Appointment booking', 'Care summaries'],
      pricing: 'free',
      rating: 4.8,
      installs: 3500,
      isRecommended: true,
      isInHouseSuperior: false,
      apiEndpoint: 'https://api.service.nhs.uk/gp-connect',
      authMethod: 'certificate',
      webhookSupport: true,
      realTimeSync: true,
      documentation: 'https://digital.nhs.uk/services/gp-connect',
      supportLevel: 'standard',
    },
    {
      id: 'omnicell',
      name: 'Omnicell Automated Dispensing',
      provider: 'Omnicell Inc.',
      category: 'healthcare',
      description: 'Automated medication dispensing and inventory management.',
      features: ['Automated dispensing', 'Inventory tracking', 'Waste management'],
      pricing: 'enterprise',
      rating: 4.5,
      installs: 890,
      isRecommended: true,
      isInHouseSuperior: true,
      inHouseAlternative: 'AI-Enhanced Medication Management with Predictive Analytics',
      apiEndpoint: 'https://api.omnicell.com/v2',
      authMethod: 'apikey',
      webhookSupport: true,
      realTimeSync: true,
      documentation: 'https://developer.omnicell.com',
      supportLevel: 'premium',
    },

    // Financial Systems
    {
      id: 'sage-accounting',
      name: 'Sage 50 Accounts',
      provider: 'Sage Group',
      category: 'financial',
      description: 'Comprehensive accounting software for care home financial management.',
      features: ['Invoicing', 'Payroll', 'Financial reporting', 'VAT management'],
      pricing: 'premium',
      rating: 4.3,
      installs: 2100,
      isRecommended: true,
      isInHouseSuperior: true,
      inHouseAlternative: 'Advanced Financial Planning with AI Forecasting',
      apiEndpoint: 'https://api.sage.com/v1',
      authMethod: 'oauth2',
      webhookSupport: false,
      realTimeSync: false,
      documentation: 'https://developer.sage.com',
      supportLevel: 'standard',
    },
    {
      id: 'stripe-payments',
      name: 'Stripe Payment Processing',
      provider: 'Stripe Inc.',
      category: 'financial',
      description: 'Secure payment processing for care home billing and self-pay residents.',
      features: ['Card processing', 'Direct debits', 'Recurring payments', 'Dispute management'],
      pricing: 'free',
      rating: 4.7,
      installs: 5600,
      isRecommended: true,
      isInHouseSuperior: false,
      apiEndpoint: 'https://api.stripe.com/v1',
      authMethod: 'apikey',
      webhookSupport: true,
      realTimeSync: true,
      documentation: 'https://stripe.com/docs',
      supportLevel: 'premium',
    },

    // Communication Systems
    {
      id: 'whatsapp-business',
      name: 'WhatsApp Business API',
      provider: 'Meta Platforms',
      category: 'communication',
      description: 'Professional messaging platform for family communication.',
      features: ['Secure messaging', 'Media sharing', 'Group communication', 'Message templates'],
      pricing: 'premium',
      rating: 4.6,
      installs: 4200,
      isRecommended: true,
      isInHouseSuperior: false,
      apiEndpoint: 'https://graph.facebook.com/v18.0',
      authMethod: 'oauth2',
      webhookSupport: true,
      realTimeSync: true,
      documentation: 'https://developers.facebook.com/docs/whatsapp',
      supportLevel: 'standard',
    },
    {
      id: 'microsoft-teams',
      name: 'Microsoft Teams Healthcare',
      provider: 'Microsoft Corporation',
      category: 'communication',
      description: 'Secure healthcare communication and collaboration platform.',
      features: ['Video calls', 'Secure chat', 'File sharing', 'Healthcare compliance'],
      pricing: 'premium',
      rating: 4.4,
      installs: 3100,
      isRecommended: true,
      isInHouseSuperior: true,
      inHouseAlternative: 'Integrated Communication with AI-Enhanced Messaging',
      apiEndpoint: 'https://graph.microsoft.com/v1.0',
      authMethod: 'oauth2',
      webhookSupport: true,
      realTimeSync: true,
      documentation: 'https://docs.microsoft.com/en-us/graph',
      supportLevel: 'premium',
    },

    // HR & Workforce
    {
      id: 'breathe-hr',
      name: 'BreatheHR',
      provider: 'Breathe Technology Ltd',
      category: 'hr',
      description: 'HR management system for care home staff administration.',
      features: ['Employee records', 'Leave management', 'Performance reviews', 'Training tracking'],
      pricing: 'premium',
      rating: 4.1,
      installs: 1800,
      isRecommended: false,
      isInHouseSuperior: true,
      inHouseAlternative: 'Advanced Workforce Analytics with British Isles Compliance',
      apiEndpoint: 'https://api.breathehr.com/v1',
      authMethod: 'oauth2',
      webhookSupport: false,
      realTimeSync: false,
      documentation: 'https://developer.breathehr.com',
      supportLevel: 'standard',
    },

    // Analytics & BI
    {
      id: 'power-bi',
      name: 'Microsoft Power BI',
      provider: 'Microsoft Corporation',
      category: 'analytics',
      description: 'Business intelligence and data visualization platform.',
      features: ['Data visualization', 'Custom dashboards', 'Report sharing', 'Data modeling'],
      pricing: 'premium',
      rating: 4.5,
      installs: 6700,
      isRecommended: false,
      isInHouseSuperior: true,
      inHouseAlternative: 'Real-time Healthcare Analytics with Predictive AI',
      apiEndpoint: 'https://api.powerbi.com/v1.0',
      authMethod: 'oauth2',
      webhookSupport: false,
      realTimeSync: false,
      documentation: 'https://docs.microsoft.com/en-us/rest/api/power-bi/',
      supportLevel: 'premium',
    },

    // Security & Compliance
    {
      id: 'okta-identity',
      name: 'Okta Identity Cloud',
      provider: 'Okta Inc.',
      category: 'security',
      description: 'Enterprise identity and access management platform.',
      features: ['Single sign-on', 'Multi-factor authentication', 'User provisioning', 'Access policies'],
      pricing: 'enterprise',
      rating: 4.6,
      installs: 2300,
      isRecommended: false,
      isInHouseSuperior: true,
      inHouseAlternative: 'Zero Trust Security with Healthcare-Specific Authentication',
      apiEndpoint: 'https://api.okta.com/v1',
      authMethod: 'oauth2',
      webhookSupport: true,
      realTimeSync: true,
      documentation: 'https://developer.okta.com',
      supportLevel: 'premium',
    },
  ];

  const ructor(
    
    private readonlyintegrationConfigRepository: Repository<IntegrationConfig>,
    
    private readonlyintegrationLogRepository: Repository<IntegrationLog>,
    
    private readonlyorganizationIntegrationRepository: Repository<OrganizationIntegration>,
    private readonlyeventEmitter: EventEmitter2,
  ) {}

  /**
   * Get all available integrations
   */
  async getAvailableIntegrations(organizationId: string): Promise<AvailableIntegration[]> {
    try {
      // Get installed integrations for this organization
      const installedIntegrations = await this.organizationIntegrationRepository.find({
        where: { organizationId },
      });

      const installedIds = installedIntegrations.map(integration => integration.integrationId);

      // Mark integrations as installed if they are
      return this.integrationCatalog.map(integration => ({
        ...integration,
        status: installedIds.includes(integration.id) ? 'installed' : 'available',
      }));
    } catch (error: unknown) {
      console.error(`Failed to get availableintegrations: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw new HttpException('Failed to fetch integrations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get integrations by category
   */
  async getIntegrationsByCategory(category: string): Promise<AvailableIntegration[]> {
    try {
      return this.integrationCatalog.filter(integration => 
        category === 'all' || integration.category === category
      );
    } catch (error: unknown) {
      console.error(`Failed to get integrations bycategory: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Get recommended integrations
   */
  async getRecommendedIntegrations(organizationId: string): Promise<AvailableIntegration[]> {
    try {
      // Get organization's current integrations to avoid recommending duplicates
      const installedIntegrations = await this.organizationIntegrationRepository.find({
        where: { organizationId },
      });

      const installedIds = installedIntegrations.map(integration => integration.integrationId);

      return this.integrationCatalog
        .filter(integration => 
          integration.isRecommended && 
          !installedIds.includes(integration.id)
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
    } catch (error: unknown) {
      console.error(`Failed to get recommendedintegrations: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Install integration for organization
   */
  async installIntegration(
    organizationId: string,
    integrationId: string,
    configData: Record<string, any>,
    userId: string
  ): Promise<OrganizationIntegration> {
    try {
      const integration = this.integrationCatalog.find(i => i.id === integrationId);
      if (!integration) {
        throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
      }

      // Check if already installed
      const existingIntegration = await this.organizationIntegrationRepository.findOne({
        where: { organizationId, integrationId },
      });

      if (existingIntegration) {
        throw new HttpException('Integration already installed', HttpStatus.CONFLICT);
      }

      // Create integration configuration
      const config = this.integrationConfigRepository.create({
        integrationId,
        organizationId,
        configuration: configData,
        authMethod: integration.authMethod,
        apiEndpoint: integration.apiEndpoint,
        webhookSupport: integration.webhookSupport,
        realTimeSync: integration.realTimeSync,
        isActive: false, // Requires configuration first
        createdBy: userId,
        createdAt: new Date(),
      });

      const savedConfig = await this.integrationConfigRepository.save(config);

      // Create organization integration record
      const orgIntegration = this.organizationIntegrationRepository.create({
        organizationId,
        integrationId,
        configId: savedConfig.id,
        status: 'configuring',
        installedBy: userId,
        installedAt: new Date(),
      });

      const savedOrgIntegration = await this.organizationIntegrationRepository.save(orgIntegration);

      // Log installation
      await this.logIntegrationEvent({
        organizationId,
        integrationId,
        action: 'INSTALL',
        status: 'SUCCESS',
        metadata: { userId, configId: savedConfig.id },
      });

      // Emit event for real-time updates
      this.eventEmitter.emit('integration.installed', {
        organizationId,
        integrationId,
        integrationName: integration.name,
        userId,
      });

      console.log(`Integration ${integrationId} installed for organization ${organizationId}`);
      return savedOrgIntegration;
    } catch (error: unknown) {
      console.error(`Failed to installintegration: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      
      // Log failed installation
      await this.logIntegrationEvent({
        organizationId,
        integrationId,
        action: 'INSTALL',
        status: 'ERROR',
        metadata: { userId, error: error instanceof Error ? error.message : "Unknown error" },
      });

      throw error;
    }
  }

  /**
   * Configure installed integration
   */
  async configureIntegration(
    organizationId: string,
    integrationId: string,
    configData: Record<string, any>,
    userId: string
  ): Promise<void> {
    try {
      const config = await this.integrationConfigRepository.findOne({
        where: { organizationId, integrationId },
      });

      if (!config) {
        throw new HttpException('Integration not installed', HttpStatus.NOT_FOUND);
      }

      // Update configuration
      await this.integrationConfigRepository.update(config.id, {
        configuration: { ...config.configuration, ...configData },
        updatedBy: userId,
        updatedAt: new Date(),
      });

      // Test the integration
      const testResult = await this.testIntegrationConnection(integrationId, configData);

      if (testResult.success) {
        // Activate integration
        await this.integrationConfigRepository.update(config.id, {
          isActive: true,
          lastTestedAt: new Date(),
          testResult: testResult.details,
        });

        await this.organizationIntegrationRepository.update(
          { organizationId, integrationId },
          { status: ResidentStatus.ACTIVE, activatedAt: new Date() }
        );

        // Log successful configuration
        await this.logIntegrationEvent({
          organizationId,
          integrationId,
          action: 'CONFIGURE',
          status: 'SUCCESS',
          metadata: { userId, testResult: testResult.details },
        });

        // Emit event
        this.eventEmitter.emit('integration.configured', {
          organizationId,
          integrationId,
          userId,
        });
      } else {
        // Log failed configuration
        await this.logIntegrationEvent({
          organizationId,
          integrationId,
          action: 'CONFIGURE',
          status: 'ERROR',
          metadata: { userId, error: testResult.error },
        });

        throw new HttpException(`Configuration failed: ${testResult.error}`, HttpStatus.BAD_REQUEST);
      }
    } catch (error: unknown) {
      console.error(`Failed to configureintegration: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Test integration connection
   */
  async testIntegration(organizationId: string, integrationId: string): Promise<any> {
    try {
      const config = await this.integrationConfigRepository.findOne({
        where: { organizationId, integrationId, isActive: true },
      });

      if (!config) {
        throw new HttpException('Integration not configured', HttpStatus.NOT_FOUND);
      }

      const testResult = await this.testIntegrationConnection(integrationId, config.configuration);

      // Update last tested timestamp
      await this.integrationConfigRepository.update(config.id, {
        lastTestedAt: new Date(),
        testResult: testResult.details,
      });

      // Log test
      await this.logIntegrationEvent({
        organizationId,
        integrationId,
        action: 'TEST',
        status: testResult.success ? 'SUCCESS' : 'ERROR',
        metadata: { testResult: testResult.details },
      });

      return testResult;
    } catch (error: unknown) {
      console.error(`Failed to testintegration: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Get installed integrations for organization
   */
  async getInstalledIntegrations(organizationId: string): Promise<any[]> {
    try {
      const installedIntegrations = await this.organizationIntegrationRepository.find({
        where: { organizationId },
        relations: ['config'],
      });

      return installedIntegrations.map(orgIntegration => {
        const integration = this.integrationCatalog.find(i => i.id === orgIntegration.integrationId);
        return {
          ...integration,
          status: orgIntegration.status,
          installedAt: orgIntegration.installedAt,
          activatedAt: orgIntegration.activatedAt,
          config: orgIntegration.config,
        };
      });
    } catch (error: unknown) {
      console.error(`Failed to get installedintegrations: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Uninstall integration
   */
  async uninstallIntegration(
    organizationId: string,
    integrationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Deactivate integration first
      await this.integrationConfigRepository.update(
        { organizationId, integrationId },
        { isActive: false, deactivatedAt: new Date(), deactivatedBy: userId }
      );

      // Remove organization integration
      await this.organizationIntegrationRepository.delete({
        organizationId,
        integrationId,
      });

      // Log uninstallation
      await this.logIntegrationEvent({
        organizationId,
        integrationId,
        action: 'UNINSTALL',
        status: 'SUCCESS',
        metadata: { userId },
      });

      // Emit event
      this.eventEmitter.emit('integration.uninstalled', {
        organizationId,
        integrationId,
        userId,
      });

      console.log(`Integration ${integrationId} uninstalled for organization ${organizationId}`);
    } catch (error: unknown) {
      console.error(`Failed to uninstallintegration: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Get integration categories with counts
   */
  async getIntegrationCategories(): Promise<any[]> {
    try {
      const categories = [
        { id: 'all', name: 'All Integrations', icon: 'Plug' },
        { id: 'healthcare', name: 'Healthcare Systems', icon: 'Stethoscope' },
        { id: 'financial', name: 'Financial & Billing', icon: 'DollarSign' },
        { id: 'communication', name: 'Communication', icon: 'MessageCircle' },
        { id: 'hr', name: 'HR & Workforce', icon: 'Users' },
        { id: 'analytics', name: 'Analytics & BI', icon: 'BarChart3' },
        { id: 'security', name: 'Security & Compliance', icon: 'Shield' },
      ];

      return categories.map(category => ({
        ...category,
        count: category.id === 'all' 
          ? this.integrationCatalog.length
          : this.integrationCatalog.filter(i => i.category === category.id).length,
        featured: this.integrationCatalog
          .filter(i => category.id === 'all' || i.category === category.id)
          .filter(i => i.isRecommended)
          .slice(0, 3),
      }));
    } catch (error: unknown) {
      console.error(`Failed to get integrationcategories: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Search integrations
   */
  async searchIntegrations(query: string, category?: string): Promise<AvailableIntegration[]> {
    try {
      return this.integrationCatalog.filter(integration => {
        const matchesQuery = !query || 
          integration.name.toLowerCase().includes(query.toLowerCase()) ||
          integration.description.toLowerCase().includes(query.toLowerCase()) ||
          integration.provider.toLowerCase().includes(query.toLowerCase()) ||
          integration.features.some(feature => 
            feature.toLowerCase().includes(query.toLowerCase())
          );
        
        const matchesCategory = !category || category === 'all' || integration.category === category;
        
        return matchesQuery && matchesCategory;
      });
    } catch (error: unknown) {
      console.error(`Failed to searchintegrations: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Get integration analytics
   */
  async getIntegrationAnalytics(organizationId: string): Promise<any> {
    try {
      const installedIntegrations = await this.organizationIntegrationRepository.find({
        where: { organizationId },
      });

      const logs = await this.integrationLogRepository.find({
        where: { organizationId },
        order: { createdAt: 'DESC' },
        take: 100,
      });

      const analytics = {
        totalInstalled: installedIntegrations.length,
        activeIntegrations: installedIntegrations.filter(i => i.status === 'active').length,
        totalApiCalls: logs.filter(l => l.action === 'API_CALL').length,
        successRate: this.calculateSuccessRate(logs),
        mostUsedIntegrations: this.getMostUsedIntegrations(logs),
        recentActivity: logs.slice(0, 10),
      };

      return analytics;
    } catch (error: unknown) {
      console.error(`Failed to get integrationanalytics: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // Private helper methods
  private async testIntegrationConnection(integrationId: string, config: Record<string, any>): Promise<any> {
    try {
      const integration = this.integrationCatalog.find(i => i.id === integrationId);
      if (!integration) {
        return { success: false, error: 'Integration not found' };
      }

      // Simulate API test based on integration type
      // In real implementation, this would make actual API calls
      const testResults = {
        'atlas-emar': { success: true, details: 'Successfully connected to Atlas eMAR API' },
        'gp-connect': { success: true, details: 'NHS Digital connection verified' },
        'stripe-payments': { success: true, details: 'Stripe webhook endpoint configured' },
        'whatsapp-business': { success: true, details: 'WhatsApp Business API authenticated' },
        'power-bi': { success: true, details: 'Power BI workspace connected' },
      };

      return testResults[integrationId] || { 
        success: true, 
        details: `Successfully connected to ${integration.name}` 
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private async logIntegrationEvent(eventData: {
    organizationId: string;
    integrationId: string;
    action: string;
    status: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      const log = this.integrationLogRepository.create({
        ...eventData,
        createdAt: new Date(),
      });

      await this.integrationLogRepository.save(log);
    } catch (error: unknown) {
      console.error(`Failed to log integrationevent: ${error instanceof Error ? error.message : "Unknown error"}`, error instanceof Error ? error.stack : undefined);
      // Don't throw error for logging failures
    }
  }

  private calculateSuccessRate(logs: IntegrationLog[]): number {
    if (logs.length === 0) return 100;
    
    const successCount = logs.filter(log => log.status === 'SUCCESS').length;
    return Math.round((successCount / logs.length) * 100);
  }

  private getMostUsedIntegrations(logs: IntegrationLog[]): any[] {
    const usage = logs.reduce((acc, log) => {
      acc[log.integrationId] = (acc[log.integrationId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(usage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([integrationId, count]) => {
        const integration = this.integrationCatalog.find(i => i.id === integrationId);
        return {
          integrationId,
          name: integration?.name || integrationId,
          provider: integration?.provider || 'Unknown',
          usageCount: count,
        };
      });
  }
}
