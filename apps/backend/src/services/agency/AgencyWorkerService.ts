/**
 * @fileoverview agency worker Service
 * @module Agency/AgencyWorkerService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description agency worker Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { AgencyWorker, WorkerStatus } from '../../entities/agency/AgencyWorker';

export class AgencyWorkerService {
  private workerRepository: Repository<AgencyWorker>;

  constructor() {
    this.workerRepository = AppDataSource.getRepository(AgencyWorker);
  }

  async createAgencyWorker(workerData: Partial<AgencyWorker>): Promise<AgencyWorker> {
    try {
      const workerId = `AGW${Date.now()}`;
      
      const worker = this.workerRepository.create({
        ...workerData,
        workerId,
        status: WorkerStatus.AVAILABLE,
        isActive: true
      });

      return await this.workerRepository.save(worker);
    } catch (error: unknown) {
      console.error('Error creating agency worker:', error);
      throw error;
    }
  }

  async getAgencyAnalytics(): Promise<any> {
    try {
      const workers = await this.workerRepository.find();
      
      return {
        totalWorkers: workers.length,
        availableWorkers: workers.filter(w => w.isAvailable()).length,
        averageHourlyRate: workers.reduce((sum, w) => sum + w.hourlyRate, 0) / workers.length
      };
    } catch (error: unknown) {
      console.error('Error getting agency analytics:', error);
      throw error;
    }
  }
}