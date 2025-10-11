/**
 * @fileoverview catering nutrition Controller
 * @module Catering/CateringNutritionController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description catering nutrition Controller
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { CateringNutritionService } from '../../services/catering/CateringNutritionService';
import { Menu, MenuType } from '../../entities/catering/Menu';
import { ResidentDietaryProfile } from '../../entities/catering/ResidentDietaryProfile';

export class CateringNutritionController {
  privatecateringService: CateringNutritionService;

  const ructor() {
    this.cateringService = new CateringNutritionService();
  }

  // Menu Management Endpoints
  async createMenu(req: Request, res: Response): Promise<void> {
    try {
      const menuData = req.body as Partial<Menu>;
      const menu = await this.cateringService.createMenu(menuData);
      
      res.status(201).json({
        success: true,
        message: 'Menu created successfully',
        data: menu
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to create menu',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAllMenus(req: Request, res: Response): Promise<void> {
    try {
      const menus = await this.cateringService.getAllMenus();
      
      res.json({
        success: true,
        data: menus,
        total: menus.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve menus',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getMenuById(req: Request, res: Response): Promise<void> {
    try {
      const { menuId } = req.params;
      const menu = await this.cateringService.getMenuById(menuId);
      
      if (!menu) {
        res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
        return;
      }

      res.json({
        success: true,
        data: menu
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve menu',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getPersonalizedMenu(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
      
      const personalizedMenu = await this.cateringService.getPersonalizedMenu(residentId, date);
      
      res.json({
        success: true,
        data: personalizedMenu
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate personalized menu',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Dietary Profile Management
  async createDietaryProfile(req: Request, res: Response): Promise<void> {
    try {
      const profileData = req.body as Partial<ResidentDietaryProfile>;
      const profile = await this.cateringService.createDietaryProfile(profileData);
      
      res.status(201).json({
        success: true,
        message: 'Dietary profile created successfully',
        data: profile
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to create dietary profile',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getDietaryProfile(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const profile = await this.cateringService.getDietaryProfileByResidentId(residentId);
      
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Dietary profile not found'
        });
        return;
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dietary profile',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Meal Planning
  async planMealsForDate(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
      const mealPlans = await this.cateringService.planMealsForDate(date);
      
      res.json({
        success: true,
        data: mealPlans,
        date
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to plan meals',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async generateShoppingList(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
      const shoppingList = await this.cateringService.generateShoppingList(date);
      
      res.json({
        success: true,
        data: shoppingList
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate shopping list',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Nutritional Monitoring
  async recordWeight(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const { weight, recordedBy, notes } = req.body;

      if (!weight || !recordedBy) {
        res.status(400).json({
          success: false,
          message: 'Weight and recorded by are required'
        });
        return;
      }

      await this.cateringService.recordWeightMeasurement(residentId, weight, recordedBy, notes);
      
      res.json({
        success: true,
        message: 'Weight recorded successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to record weight',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async recordFluidIntake(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const { totalIntake, recordedBy, notes } = req.body;

      if (!totalIntake || !recordedBy) {
        res.status(400).json({
          success: false,
          message: 'Total intake and recorded by are required'
        });
        return;
      }

      await this.cateringService.recordFluidIntake(residentId, totalIntake, recordedBy, notes);
      
      res.json({
        success: true,
        message: 'Fluid intake recorded successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to record fluid intake',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async conductNutritionalAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const { assessorId } = req.body;

      if (!assessorId) {
        res.status(400).json({
          success: false,
          message: 'Assessor ID is required'
        });
        return;
      }

      const assessment = await this.cateringService.conductNutritionalAssessment(residentId, assessorId);
      
      res.json({
        success: true,
        message: 'Nutritional assessment completed',
        data: assessment
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to conduct nutritional assessment',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Analytics and Monitoring
  async getNutritionalAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.cateringService.getNutritionalAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve nutritional analytics',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getDietaryAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await this.cateringService.getDietaryAlerts();
      
      res.json({
        success: true,
        data: alerts,
        total: alerts.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dietary alerts',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Food Safety
  async reportFoodSafetyIssue(req: Request, res: Response): Promise<void> {
    try {
      const issueData = req.body;
      
      await this.cateringService.reportFoodSafetyIssue(issueData);
      
      res.json({
        success: true,
        message: 'Food safety issue reported successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to report food safety issue',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // Inventory Management
  async checkInventory(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await this.cateringService.checkFoodInventory();
      
      res.json({
        success: true,
        data: inventory
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to check inventory',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
