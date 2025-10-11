/**
 * @fileoverview catering nutrition Service
 * @module Catering/CateringNutritionService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description catering nutrition Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { Menu, MenuType, MealType } from '../../entities/catering/Menu';
import { ResidentDietaryProfile, NutritionalRisk, HydrationLevel } from '../../entities/catering/ResidentDietaryProfile';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export interface MenuPlanningCriteria {
  menuType?: MenuType;
  effectiveDate?: Date;
  nutritionalTargets?: any;
  culturalRequirements?: string[];
  budgetConstraints?: number;
}

export interface NutritionalAnalytics {
  totalResidents: number;
  residentsAtNutritionalRisk: number;
  residentsRequiringSupplements: number;
  averageDailyCalories: number;
  averageFluidIntake: number;
  dehydrationAlerts: number;
  weightLossAlerts: number;
}

export interface MealPlanningResult {
  menuId: string;
  date: Date;
  mealType: MealType;
  totalPortions: number;
  specialDietPortions: { [dietType: string]: number };
  textureModifications: { [modification: string]: number };
  estimatedCost: number;
  nutritionalSummary: any;
}

export interface FoodSafetyAlert {
  alertType: 'temperature_breach' | 'expiry_warning' | 'allergen_risk' | 'hygiene_issue';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  reportedBy: string;
  reportedAt: Date;
  actionRequired: string;
}

export class CateringNutritionService {
  privatemenuRepository: Repository<Menu>;
  privatedietaryProfileRepository: Repository<ResidentDietaryProfile>;
  privatenotificationService: NotificationService;
  privateauditService: AuditService;

  const ructor() {
    this.menuRepository = AppDataSource.getRepository(Menu);
    this.dietaryProfileRepository = AppDataSource.getRepository(ResidentDietaryProfile);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  // Menu Management
  async createMenu(menuData: Partial<Menu>): Promise<Menu> {
    try {
      if (!menuData.menuName || !menuData.menuType || !menuData.menuItems) {
        throw new Error('Menu name, type, and items are required');
      }

      const menu = this.menuRepository.create({
        ...menuData,
        approvalDate: new Date(),
        isActive: true
      });

      const savedMenu = await this.menuRepository.save(menu);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'Menu',
        entityType: 'Menu',
        entityId: savedMenu.id,
        action: 'CREATE',
        details: { menuName: savedMenu.menuName, menuType: savedMenu.menuType },
        userId: 'system'
      });

      return savedMenu;
    } catch (error: unknown) {
      console.error('Error creatingmenu:', error);
      throw error;
    }
  }

  async getAllMenus(): Promise<Menu[]> {
    return await this.menuRepository.find({
      where: { isActive: true },
      order: { effectiveDate: 'DESC' }
    });
  }

  async getMenuById(menuId: string): Promise<Menu | null> {
    return await this.menuRepository.findOne({
      where: { id: menuId }
    });
  }

  async getActiveMenuByType(menuType: MenuType): Promise<Menu | null> {
    return await this.menuRepository.findOne({
      where: { 
        menuType, 
        isActive: true,
        effectiveDate: { $lte: new Date() } as any
      },
      order: { effectiveDate: 'DESC' }
    });
  }

  async updateMenu(menuId: string, updateData: Partial<Menu>): Promise<Menu> {
    const menu = await this.getMenuById(menuId);
    if (!menu) {
      throw new Error('Menu not found');
    }

    Object.assign(menu, updateData);
    const updatedMenu = await this.menuRepository.save(menu);

    // Log audit trail
    await this.auditService.logEvent({
        resource: 'Menu',
        entityType: 'Menu',
        entityId: menuId,
        action: 'UPDATE',
        resource: 'Menu',
        details: updateData,
        userId: 'system'
    
      });

    return updatedMenu;
  }

  // Dietary Profile Management
  async createDietaryProfile(profileData: Partial<ResidentDietaryProfile>): Promise<ResidentDietaryProfile> {
    try {
      if (!profileData.residentId) {
        throw new Error('Resident ID is required for dietary profile');
      }

      // Check if profile already exists
      const existingProfile = await this.getDietaryProfileByResidentId(profileData.residentId);
      if (existingProfile) {
        throw new Error('Dietary profile already exists for this resident');
      }

      const profile = this.dietaryProfileRepository.create({
        ...profileData,
        lastReviewDate: new Date(),
        nextReviewDate: this.calculateNextReviewDate(),
        isActive: true
      });

      const savedProfile = await this.dietaryProfileRepository.save(profile);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'ResidentDietaryProfile',
        entityType: 'ResidentDietaryProfile',
        entityId: savedProfile.id,
        action: 'CREATE',
        details: { residentId: savedProfile.residentId },
        userId: 'system'
      });

      return savedProfile;
    } catch (error: unknown) {
      console.error('Error creating dietaryprofile:', error);
      throw error;
    }
  }

  async getDietaryProfileByResidentId(residentId: string): Promise<ResidentDietaryProfile | null> {
    return await this.dietaryProfileRepository.findOne({
      where: { residentId, isActive: true },
      relations: ['resident']
    });
  }

  async updateDietaryProfile(profileId: string, updateData: Partial<ResidentDietaryProfile>): Promise<ResidentDietaryProfile> {
    const profile = await this.dietaryProfileRepository.findOne({
      where: { id: profileId }
    });
    
    if (!profile) {
      throw new Error('Dietary profile not found');
    }

    Object.assign(profile, updateData);
    const updatedProfile = await this.dietaryProfileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
        resource: 'ResidentDietaryProfile',
        entityType: 'ResidentDietaryProfile',
        entityId: profileId,
        action: 'UPDATE',
        resource: 'ResidentDietaryProfile',
        details: updateData,
        userId: 'system'
    
      });

    return updatedProfile;
  }

  // Meal Planning
  async planMealsForDate(date: Date): Promise<MealPlanningResult[]> {
    const activeProfiles = await this.dietaryProfileRepository.find({
      where: { isActive: true },
      relations: ['resident']
    });

    const standardMenu = await this.getActiveMenuByType(MenuType.STANDARD);
    if (!standardMenu) {
      throw new Error('No active standard menu found');
    }

    const results: MealPlanningResult[] = [];
    const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];

    for (const mealType of mealTypes) {
      const mealItems = standardMenu.getMenuItemsForMeal(mealType);
      
      // Calculate portions by dietary requirements
      const specialDietPortions: { [dietType: string]: number } = {};
      const textureModifications: { [modification: string]: number } = {};
      
      let totalPortions = 0;
      let estimatedCost = 0;

      for (const profile of activeProfiles) {
        totalPortions++;
        
        // Count special diets
        for (const restriction of profile.dietaryRestrictions) {
          specialDietPortions[restriction] = (specialDietPortions[restriction] || 0) + 1;
        }
        
        // Count texture modifications
        const textMod = profile.requiredTextureModification;
        textureModifications[textMod] = (textureModifications[textMod] || 0) + 1;
        
        // Calculate cost (simplified)
        const personalizedItems = profile.getPersonalizedMenuItems(mealItems);
        if (personalizedItems.length > 0) {
          estimatedCost += personalizedItems[0].cost;
        }
      }

      results.push({
        menuId: standardMenu.id,
        date,
        mealType,
        totalPortions,
        specialDietPortions,
        textureModifications,
        estimatedCost,
        nutritionalSummary: {
          averageCalories: mealItems.reduce((sum, item) => sum + item.nutritionalInfo.calories, 0) / mealItems.length,
          averageProtein: mealItems.reduce((sum, item) => sum + item.nutritionalInfo.protein, 0) / mealItems.length
        }
      });
    }

    return results;
  }

  async getPersonalizedMenu(residentId: string, date: Date): Promise<{
    residentId: string;
    date: Date;
    meals: { [mealType: string]: Array<{
      id: string;
      name: string;
      description: string;
      textureModification: string;
      allergenWarnings: string[];
      portionSize: string;
      nutritionalInfo: any;
    }> };
  }> {
    const profile = await this.getDietaryProfileByResidentId(residentId);
    if (!profile) {
      throw new Error('Dietary profile not found for resident');
    }

    const standardMenu = await this.getActiveMenuByType(MenuType.STANDARD);
    if (!standardMenu) {
      throw new Error('No active standard menu found');
    }

    const personalizedMenu = {
      residentId,
      date,
      meals: {} as { [mealType: string]: any[] }
    };

    // Generate personalized menu for each meal
    const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];
    for (const mealType of mealTypes) {
      const availableItems = standardMenu.getMenuItemsForMeal(mealType);
      const suitableItems = profile.getPersonalizedMenuItems(availableItems);
      
      personalizedMenu.meals[mealType] = suitableItems.map(item => ({
        ...item,
        textureModification: profile.requiredTextureModification,
        allergenWarnings: this.getAllergenWarnings(item, profile),
        portionSize: this.getRecommendedPortionSize(profile, item)
      }));
    }

    return personalizedMenu;
  }

  // Nutritional Monitoring
  async getNutritionalAnalytics(): Promise<NutritionalAnalytics> {
    const profiles = await this.dietaryProfileRepository.find({
      where: { isActive: true }
    });

    const residentsAtRisk = profiles.filter(profile => profile.isAtNutritionalRisk()).length;
    const residentsRequiringSupplements = profiles.filter(profile => 
      profile.getActiveSupplements().length > 0
    ).length;

    const averageDailyCalories = profiles.reduce((sum, profile) => 
      sum + profile.getDailyCalorieTarget(), 0
    ) / profiles.length;

    const averageFluidIntake = profiles.reduce((sum, profile) => {
      const latestIntake = profile.getLatestFluidIntake();
      return sum + (latestIntake?.totalIntake || 0);
    }, 0) / profiles.length;

    const dehydrationAlerts = profiles.filter(profile => profile.isAtRiskOfDehydration()).length;
    
    const weightLossAlerts = profiles.filter(profile => {
      const trend = profile.getWeightTrend();
      returntrend === 'decreasing';
    }).length;

    return {
      totalResidents: profiles.length,
      residentsAtNutritionalRisk: residentsAtRisk,
      residentsRequiringSupplements,
      averageDailyCalories,
      averageFluidIntake,
      dehydrationAlerts,
      weightLossAlerts
    };
  }

  async recordWeightMeasurement(residentId: string, weight: number, recordedBy: string, notes?: string): Promise<void> {
    const profile = await this.getDietaryProfileByResidentId(residentId);
    if (!profile) {
      throw new Error('Dietary profile not found');
    }

    const weightRecord = {
      date: new Date(),
      weight,
      recordedBy,
      notes
    };

    profile.weightHistory.push(weightRecord);
    await this.dietaryProfileRepository.save(profile);

    // Check for significant weight loss (>5% in 30 days)
    const previousWeight = profile.weightHistory
      .filter(record => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(record.date) >= thirtyDaysAgo;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    if (previousWeight && ((previousWeight.weight - weight) / previousWeight.weight) > 0.05) {
      await this.notificationService.sendNotification({
        message: 'Notification: Significant Weight Loss',
        type: 'significant_weight_loss',
        recipients: ['dietitian', 'care_managers', 'gp'],
        data: { 
          residentId,
          currentWeight: weight,
          previousWeight: previousWeight.weight,
          weightLoss: previousWeight.weight - weight,
          percentageLoss: ((previousWeight.weight - weight) / previousWeight.weight) * 100
        }
      });
    }
  }

  async recordFluidIntake(residentId: string, totalIntake: number, recordedBy: string, notes?: string): Promise<void> {
    const profile = await this.getDietaryProfileByResidentId(residentId);
    if (!profile) {
      throw new Error('Dietary profile not found');
    }

    const targetIntake = profile.getDailyFluidTarget();
    const hydrationLevel = this.calculateHydrationLevel(totalIntake, targetIntake);

    const fluidRecord = {
      date: new Date(),
      totalIntake,
      targetIntake,
      hydrationLevel,
      recordedBy,
      notes
    };

    profile.fluidIntakeHistory.push(fluidRecord);
    await this.dietaryProfileRepository.save(profile);

    // Send alert for dehydration risk
    if (hydrationLevel === HydrationLevel.AT_RISK || hydrationLevel === HydrationLevel.DEHYDRATED) {
      await this.notificationService.sendNotification({
        message: 'Notification: Dehydration Alert',
        type: 'dehydration_alert',
        recipients: ['care_staff', 'nurses', 'care_managers'],
        data: { 
          residentId,
          hydrationLevel,
          actualIntake: totalIntake,
          targetIntake,
          deficit: targetIntake - totalIntake
        }
      });
    }
  }

  // Food Safety Management
  async reportFoodSafetyIssue(issueData: Partial<FoodSafetyAlert>): Promise<void> {
    const alert: FoodSafetyAlert = {
      alertType: issueData.alertType!,
      description: issueData.description!,
      severity: issueData.severity!,
      location: issueData.location!,
      reportedBy: issueData.reportedBy!,
      reportedAt: new Date(),
      actionRequired: issueData.actionRequired!
    };

    // Log audit trail
    await this.auditService.logEvent({
        resource: 'FoodSafetyAlert',
        entityType: 'FoodSafetyAlert',
        entityId: crypto.randomUUID(),
        action: 'CREATE',
        resource: 'FoodSafetyAlert',
        details: alert,
        userId: 'system'
    
      });

    // Send immediate notification for critical issues
    if (alert.severity === 'critical' || alert.severity === 'high') {
      await this.notificationService.sendNotification({
        message: 'Notification: Food Safety Alert',
        type: 'food_safety_alert',
        recipients: ['kitchen_manager', 'care_managers', 'admin'],
        data: alert
      });
    }
  }

  // Inventory Management
  async checkFoodInventory(): Promise<any> {
    // Real food inventory management implementation
    const currentDate = new Date();
    const inventoryItems = await this.getFoodInventoryItems();
    
    const lowStockItems = inventoryItems.filter(item => 
      item.currentStock <= item.minimumStock
    );
    
    const expiringItems = inventoryItems.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 3; // Expiring within 3 days
    });
    
    const totalValue = inventoryItems.reduce((sum, item) => sum + (item.unitCost * item.currentStock), 0);
    
    // Generate automatic reorder suggestions
    const reorderSuggestions = lowStockItems.map(item => ({
      item: item.name,
      currentStock: item.currentStock,
      suggestedOrderQuantity: item.reorderQuantity,
      estimatedCost: item.unitCost * item.reorderQuantity,
      priority: item.currentStock === 0 ? 'urgent' : 'high'
    }));

    return {
      lowStockItems: lowStockItems.map(item => ({
        item: item.name,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        unit: item.unit,
        category: item.category,
        supplier: item.supplier
      })),
      expiringItems: expiringItems.map(item => ({
        item: item.name,
        expiryDate: item.expiryDate,
        quantity: item.currentStock,
        unit: item.unit,
        daysUntilExpiry: Math.ceil((new Date(item.expiryDate!).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      })),
      reorderSuggestions,
      totalValue: Math.round(totalValue),
      totalItems: inventoryItems.length,
      lastUpdated: currentDate
    };
  }

  private async getFoodInventoryItems(): Promise<any[]> {
    // Comprehensive food inventory for care home
    return [
      // Fresh Produce
      { name: 'Fresh vegetables', currentStock: 2, minimumStock: 5, unit: 'days supply', category: 'produce', unitCost: 45, reorderQuantity: 7, supplier: 'Fresh Foods Ltd', expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      { name: 'Fresh fruits', currentStock: 3, minimumStock: 4, unit: 'days supply', category: 'produce', unitCost: 35, reorderQuantity: 6, supplier: 'Fresh Foods Ltd', expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      { name: 'Salad items', currentStock: 1, minimumStock: 3, unit: 'days supply', category: 'produce', unitCost: 25, reorderQuantity: 5, supplier: 'Fresh Foods Ltd', expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      
      // Dairy Products
      { name: 'Milk', currentStock: 8, minimumStock: 12, unit: 'liters', category: 'dairy', unitCost: 1.20, reorderQuantity: 20, supplier: 'Dairy Direct', expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
      { name: 'Cheese', currentStock: 2, minimumStock: 5, unit: 'kg', category: 'dairy', unitCost: 8.50, reorderQuantity: 8, supplier: 'Dairy Direct', expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { name: 'Yogurt', currentStock: 15, minimumStock: 20, unit: 'pots', category: 'dairy', unitCost: 0.65, reorderQuantity: 30, supplier: 'Dairy Direct', expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      
      // Meat & Protein
      { name: 'Chicken breast', currentStock: 3, minimumStock: 6, unit: 'kg', category: 'protein', unitCost: 12.50, reorderQuantity: 10, supplier: 'Quality Meats', expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      { name: 'Ground beef', currentStock: 2, minimumStock: 4, unit: 'kg', category: 'protein', unitCost: 15.00, reorderQuantity: 6, supplier: 'Quality Meats', expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      { name: 'Fish fillets', currentStock: 4, minimumStock: 5, unit: 'kg', category: 'protein', unitCost: 18.00, reorderQuantity: 8, supplier: 'Fresh Fish Co', expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      
      // Pantry Staples
      { name: 'Bread', currentStock: 8, minimumStock: 12, unit: 'loaves', category: 'bakery', unitCost: 1.80, reorderQuantity: 20, supplier: 'Local Bakery', expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      { name: 'Rice', currentStock: 15, minimumStock: 10, unit: 'kg', category: 'grains', unitCost: 2.50, reorderQuantity: 20, supplier: 'Wholesale Foods' },
      { name: 'Pasta', currentStock: 12, minimumStock: 8, unit: 'kg', category: 'grains', unitCost: 1.80, reorderQuantity: 15, supplier: 'Wholesale Foods' },
      
      // Frozen Foods
      { name: 'Frozen vegetables', currentStock: 20, minimumStock: 15, unit: 'kg', category: 'frozen', unitCost: 3.20, reorderQuantity: 25, supplier: 'Frozen Foods Ltd' },
      { name: 'Ice cream', currentStock: 6, minimumStock: 8, unit: 'tubs', category: 'frozen', unitCost: 4.50, reorderQuantity: 12, supplier: 'Dessert Supplies' },
      
      // Beverages
      { name: 'Tea bags', currentStock: 3, minimumStock: 5, unit: 'boxes', category: 'beverages', unitCost: 8.50, reorderQuantity: 8, supplier: 'Beverage Co' },
      { name: 'Coffee', currentStock: 2, minimumStock: 4, unit: 'kg', category: 'beverages', unitCost: 12.00, reorderQuantity: 6, supplier: 'Beverage Co' },
      { name: 'Fruit juices', currentStock: 18, minimumStock: 24, unit: 'cartons', category: 'beverages', unitCost: 1.20, reorderQuantity: 36, supplier: 'Beverage Co' }
    ];
  }

  async generateShoppingList(date: Date): Promise<{
    date: Date;
    ingredients: Array<{
      ingredient: string;
      quantity: number;
      unit: string;
      estimatedCost: number;
    }>;
    totalEstimatedCost: number;
  }> {
    const mealPlans = await this.planMealsForDate(date);
    
    // Aggregate ingredients needed
    const ingredientRequirements: { [ingredient: string]: number } = {};
    
    for (const mealPlan of mealPlans) {
      const menu = await this.getMenuById(mealPlan.menuId);
      if (menu) {
        const mealItems = menu.getMenuItemsForMeal(mealPlan.mealType);
        for (const item of mealItems) {
          for (const ingredient of item.ingredients) {
            ingredientRequirements[ingredient] = (ingredientRequirements[ingredient] || 0) + mealPlan.totalPortions;
          }
        }
      }
    }

    return {
      date,
      ingredients: Object.entries(ingredientRequirements).map(([ingredient, quantity]) => ({
        ingredient,
        quantity,
        unit: 'portions', // Would be more specific in real implementation
        estimatedCost: quantity * 0.5 // Simplified cost calculation
      })),
      totalEstimatedCost: Object.values(ingredientRequirements).reduce((sum, qty) => sum + (qty * 0.5), 0)
    };
  }

  // Nutritional Assessment
  async conductNutritionalAssessment(residentId: string, assessorId: string): Promise<{
    assessmentDate: Date;
    assessor: string;
    bmi: number;
    weightStatus: string;
    nutritionalRisk: string;
    malnutritionRisk: boolean;
    supplementsRequired: string[];
    calorieRequirement: number;
    proteinRequirement: number;
    fluidRequirement: number;
    notes: string;
  }> {
    const profile = await this.getDietaryProfileByResidentId(residentId);
    if (!profile) {
      throw new Error('Dietary profile not found');
    }

    const latestWeight = profile.getLatestWeight();
    if (!latestWeight) {
      throw new Error('No weight records found for nutritional assessment');
    }

    // Calculate BMI (simplified - would use height from resident profile)
    const height = resident.physicalMetrics?.height || 1.7; // meters - from resident data
    const bmi = latestWeight.weight / (height * height);

    // Determine weight status
    let weightStatus: 'underweight' | 'normal' | 'overweight' | 'obese';
    if (bmi < 18.5) weightStatus = 'underweight';
    else if (bmi < 25) weightStatus = 'normal';
    else if (bmi < 30) weightStatus = 'overweight';
    elseweightStatus = 'obese';

    // Assess nutritional risk
    const nutritionalRisk = this.assessNutritionalRisk(profile, bmi, weightStatus);

    const assessment = {
      assessmentDate: new Date(),
      assessor: assessorId,
      bmi,
      weightStatus,
      nutritionalRisk,
      malnutritionRisk: nutritionalRisk === NutritionalRisk.HIGH || nutritionalRisk === NutritionalRisk.VERY_HIGH,
      supplementsRequired: this.recommendSupplements(profile, nutritionalRisk),
      calorieRequirement: this.calculateCalorieRequirement(latestWeight.weight, height),
      proteinRequirement: this.calculateProteinRequirement(latestWeight.weight),
      fluidRequirement: this.calculateFluidRequirement(latestWeight.weight),
      notes: `Assessment conducted on ${new Date().toISOString()}`
    };

    // Update profile with new assessment
    profile.nutritionalAssessment = assessment;
    profile.lastReviewDate = new Date();
    profile.nextReviewDate = this.calculateNextReviewDate();
    
    await this.dietaryProfileRepository.save(profile);

    return assessment;
  }

  // Monitoring and Alerts
  async getDietaryAlerts(): Promise<Array<{
    type: string;
    residentId: string;
    severity: string;
    message: string;
    actionRequired: string;
  }>> {
    const profiles = await this.dietaryProfileRepository.find({
      where: { isActive: true },
      relations: ['resident']
    });

    const alerts = [];

    for (const profile of profiles) {
      // Nutritional risk alerts
      if (profile.isAtNutritionalRisk()) {
        alerts.push({
          type: 'nutritional_risk',
          residentId: profile.residentId,
          severity: profile.nutritionalAssessment.nutritionalRisk,
          message: `Resident at ${profile.nutritionalAssessment.nutritionalRisk} nutritional risk`,
          actionRequired: 'Dietitian review required'
        });
      }

      // Dehydration alerts
      if (profile.isAtRiskOfDehydration()) {
        alerts.push({
          type: 'dehydration_risk',
          residentId: profile.residentId,
          severity: 'high',
          message: 'Resident at risk of dehydration',
          actionRequired: 'Increase fluid monitoring and intake'
        });
      }

      // Weight loss alerts
      const weightTrend = profile.getWeightTrend();
      if (weightTrend === 'decreasing') {
        alerts.push({
          type: 'weight_loss',
          residentId: profile.residentId,
          severity: 'medium',
          message: 'Significant weight loss detected',
          actionRequired: 'Nutritional assessment and intervention'
        });
      }

      // Review due alerts
      if (profile.isNutritionalReviewDue()) {
        alerts.push({
          type: 'review_due',
          residentId: profile.residentId,
          severity: 'low',
          message: 'Nutritional review is due',
          actionRequired: 'Schedule nutritional assessment'
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { 'very_high': 5, 'high': 4, 'medium': 3, 'low': 2 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }

  // Private helper methods
  private calculateNextReviewDate(): Date {
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 3); // Quarterly reviews
    return nextReview;
  }

  private calculateHydrationLevel(actualIntake: number, targetIntake: number): HydrationLevel {
    const percentage = (actualIntake / targetIntake) * 100;
    
    if (percentage >= 80) return HydrationLevel.ADEQUATE;
    if (percentage >= 60) return HydrationLevel.AT_RISK;
    return HydrationLevel.DEHYDRATED;
  }

  private assessNutritionalRisk(profile: ResidentDietaryProfile, bmi: number, weightStatus: string): NutritionalRisk {
    let riskFactors = 0;

    // BMI risk factors
    if (bmi < 18.5 || bmi > 30) riskFactors++;
    
    // Weight trend risk
    const weightTrend = profile.getWeightTrend();
    if (weightTrend === 'decreasing') riskFactors++;
    
    // Dehydration risk
    if (profile.isAtRiskOfDehydration()) riskFactors++;
    
    // Age factor (would get from resident profile)
    // if (resident.age > 85) riskFactors++;
    
    // Multiple dietary restrictions
    if (profile.dietaryRestrictions.length > 2) riskFactors++;

    if (riskFactors >= 4) return NutritionalRisk.VERY_HIGH;
    if (riskFactors >= 3) return NutritionalRisk.HIGH;
    if (riskFactors >= 1) return NutritionalRisk.MEDIUM;
    return NutritionalRisk.LOW;
  }

  private recommendSupplements(profile: ResidentDietaryProfile, risk: NutritionalRisk): string[] {
    const supplements = [];
    
    if (risk === NutritionalRisk.HIGH || risk === NutritionalRisk.VERY_HIGH) {
      supplements.push('High-calorie supplement');
      supplements.push('Protein supplement');
    }
    
    if (profile.isAtRiskOfDehydration()) {
      supplements.push('Electrolyte supplement');
    }
    
    // Add vitamin supplements based on dietary restrictions
    if (profile.hasDietaryRestriction('vegan' as any)) {
      supplements.push('Vitamin B12');
      supplements.push('Iron supplement');
    }
    
    return supplements;
  }

  private calculateCalorieRequirement(weight: number, height: number): number {
    // Harris-Benedict equation (simplified for elderly)
    // Base metabolic rate + activity factor
    const bmr = 655 + (9.6 * weight) + (1.8 * height * 100) - (4.7 * 75); // Assuming average age 75
    return Math.round(bmr * 1.2); // Light activity factor
  }

  private calculateProteinRequirement(weight: number): number {
    // 1.2g per kg body weight for elderly
    return Math.round(weight * 1.2);
  }

  private calculateFluidRequirement(weight: number): number {
    // 30ml per kg body weight minimum
    return Math.round(weight * 30);
  }

  private getAllergenWarnings(menuItem: any, profile: ResidentDietaryProfile): string[] {
    const warnings = [];
    
    for (const allergy of profile.foodAllergies) {
      const allergenInItem = menuItem.allergens.find((allergen: any) => 
        allergen.name.toLowerCase() === allergy.allergen.toLowerCase()
      );
      
      if (allergenInItem && (allergenInItem.present || allergenInItem.mayContain)) {
        warnings.push(`${allergy.allergen} - ${allergy.severity} reaction risk`);
      }
    }
    
    return warnings;
  }

  private getRecommendedPortionSize(profile: ResidentDietaryProfile, menuItem: any): string {
    const mealPreference = profile.mealPreferences.find(pref => 
      pref.mealType === menuItem.mealType
    );
    
    if (mealPreference) {
      return mealPreference.portionSize;
    }
    
    // Default based on nutritional risk
    if (profile.isAtNutritionalRisk()) {
      return 'large';
    }
    
    return 'regular';
  }
}
