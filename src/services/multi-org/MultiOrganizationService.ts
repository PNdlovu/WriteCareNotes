import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { MultiOrganization, OrganizationType } from '../../entities/multi-org/MultiOrganization';

export class MultiOrganizationService {
  private organizationRepository: Repository<MultiOrganization>;

  constructor() {
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
      console.error('Error creating organization:', error);
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
      console.error('Error getting organization analytics:', error);
      throw error;
    }
  }
}