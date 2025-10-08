/**
 * @fileoverview inventory management Controller
 * @module Inventory/InventoryManagementController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description inventory management Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { InventoryManagementService } from '../../services/inventory/InventoryManagementService';

export class InventoryManagementController {
  private inventoryService: InventoryManagementService;

  constructor() {
    this.inventoryService = new InventoryManagementService();
  }

  async createItem(req: Request, res: Response): Promise<void> {
    try {
      const item = await this.inventoryService.createAdvancedInventoryItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async scanRFID(req: Request, res: Response): Promise<void> {
    try {
      const { rfidTagId, readerId, location } = req.body;
      const result = await this.inventoryService.performRFIDScan(rfidTagId, readerId, location);
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.inventoryService.getInventoryAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}