/**
 * @fileoverview facilities Controller
 * @module Facilities/FacilitiesController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description facilities Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { FacilitiesManagementService } from '../../services/facilities/FacilitiesManagementService';

export class FacilitiesController {
  privatefacilitiesService: FacilitiesManagementService;

  const ructor() {
    this.facilitiesService = new FacilitiesManagementService();
  }

  async createAsset(req: Request, res: Response): Promise<void> {
    try {
      const asset = await this.facilitiesService.createFacilityAsset(req.body);
      res.status(201).json({ success: true, data: asset });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.facilitiesService.getFacilitiesAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
}
