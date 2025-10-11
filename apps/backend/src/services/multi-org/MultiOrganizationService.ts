/**
 * @fileoverview multi organization Service
 * @module Multi-org/MultiOrganizationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description multi organization Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { MultiOrganization, OrganizationType } from '../../entities/multi-org/MultiOrganization';

export class MultiOrganizationService {
  privateorganizationRepository: Repository<MultiOrganization>;

  const ructor() {
    this.organizationRepository = AppDataSource.getRepository(MultiOrganization);
  }

  async createOrganization(orgData: Partial<MultiOrganization>): Promise<MultiOrganization> {
    try {
      const organizationCode = `ORG${Date.now()}`;
      
      const organization = this.organizationRepository.create({
        ...orgData,
        organizationCode,
        hierarchyLevel: {
          level: 1,
          childOrganizations: []
        },
        isActive: true
      });

      return await this.organizationRepository.save(organization);
    } catch (error: unknown) {
      console.error('Error creatingorganization:', error);
      throw error;
    }
  }

  async getOrganizationAnalytics(): Promise<any> {
    try {
      const organizations = await this.organizationRepository.find();
      
      return {
        totalOrganizations: organizations.length,
        activeOrganizations: organizations.filter(org => org.isActive).length,
        organizationsByType: organizations.reduce((acc, org) => {
          acc[org.organizationType] = (acc[org.organizationType] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error: unknown) {
      console.error('Error getting organizationanalytics:', error);
      throw error;
    }
  }
}
