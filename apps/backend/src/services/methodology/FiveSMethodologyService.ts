/**
 * @fileoverview five s methodology Service
 * @module Methodology/FiveSMethodologyService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description five s methodology Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { FiveSWorkplace, FiveSPhase, WorkplaceArea } from '../../entities/methodology/FiveSWorkplace';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export class FiveSMethodologyService {
  privateworkplaceRepository: Repository<FiveSWorkplace>;
  privatenotificationService: NotificationService;
  privateauditService: AuditService;

  const ructor() {
    this.workplaceRepository = AppDataSource.getRepository(FiveSWorkplace);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  async createWorkplaceAssessment(assessmentData: Partial<FiveSWorkplace>): Promise<FiveSWorkplace> {
    try {
      const workplace = this.workplaceRepository.create({
        ...assessmentData,
        lastAuditDate: new Date(),
        nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        improvementActions: []
      });

      const savedWorkplace = await this.workplaceRepository.save(workplace);
      
      if (savedWorkplace.needsImprovement()) {
        await this.generateImprovementPlan(savedWorkplace);
      }
      
      return savedWorkplace;
    } catch (error: unknown) {
      console.error('Error creating workplaceassessment:', error);
      throw error;
    }
  }

  async get5SAnalytics(): Promise<any> {
    try {
      const workplaces = await this.workplaceRepository.find();
      
      return {
        totalWorkplaces: workplaces.length,
        averageScore: workplaces.reduce((sum, w) => sum + w.getOverallScore(), 0) / workplaces.length,
        workplacesNeedingImprovement: workplaces.filter(w => w.needsImprovement()).length,
        scoresByArea: this.getScoresByArea(workplaces)
      };
    } catch (error: unknown) {
      console.error('Error getting 5S analytics:', error);
      throw error;
    }
  }

  private async generateImprovementPlan(workplace: FiveSWorkplace): Promise<void> {
    const actions = [];
    
    if (workplace.assessmentScores.sort < 80) {
      actions.push({
        phase: FiveSPhase.SORT,
        action: 'Remove unnecessary items and organize workspace',
        responsible: 'area_supervisor',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        completed: false
      });
    }
    
    workplace.improvementActions = actions;
    await this.workplaceRepository.save(workplace);
  }

  private getScoresByArea(workplaces: FiveSWorkplace[]): any {
    return workplaces.reduce((acc, workplace) => {
      acc[workplace.area] = workplace.getOverallScore();
      return acc;
    }, {});
  }
}
