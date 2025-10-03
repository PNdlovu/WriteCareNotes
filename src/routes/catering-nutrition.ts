import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { CateringNutritionController } from '../controllers/catering/CateringNutritionController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { validateRequest } from '../middleware/validation-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const cateringController = new CateringNutritionController();

// Apply middleware to all routes
router.use(authenticate);
router.use(auditMiddleware);

// Menu Management Routes
router.post('/menus',
  authorize(['dietitian', 'kitchen_manager', 'admin']),
  validateRequest({
    body: {
      menuName: { type: 'string', required: true },
      menuType: { type: 'string', required: true },
      effectiveDate: { type: 'string', required: true },
      menuItems: { type: 'object', required: true },
      nutritionalTargets: { type: 'object', required: true }
    }
  }),
  cateringController.createMenu.bind(cateringController)
);

router.get('/menus',
  authorize(['dietitian', 'kitchen_manager', 'care_staff', 'admin']),
  cateringController.getAllMenus.bind(cateringController)
);

router.get('/menus/:menuId',
  authorize(['dietitian', 'kitchen_manager', 'care_staff', 'admin']),
  cateringController.getMenuById.bind(cateringController)
);

// Dietary Profile Management Routes
router.post('/residents/:residentId/dietary-profile',
  authorize(['dietitian', 'care_manager', 'admin']),
  validateRequest({
    body: {
      dietaryRestrictions: { type: 'array', required: true },
      foodAllergies: { type: 'array', required: true },
      mealPreferences: { type: 'array', required: true },
      nutritionalAssessment: { type: 'object', required: true }
    }
  }),
  cateringController.createDietaryProfile.bind(cateringController)
);

router.get('/residents/:residentId/dietary-profile',
  authorize(['dietitian', 'care_staff', 'kitchen_staff', 'admin']),
  cateringController.getDietaryProfile.bind(cateringController)
);

router.get('/residents/:residentId/personalized-menu',
  authorize(['dietitian', 'care_staff', 'kitchen_staff', 'admin']),
  cateringController.getPersonalizedMenu.bind(cateringController)
);

// Meal Planning Routes
router.get('/meal-planning',
  authorize(['dietitian', 'kitchen_manager', 'admin']),
  cateringController.planMealsForDate.bind(cateringController)
);

router.get('/shopping-list',
  authorize(['kitchen_manager', 'procurement', 'admin']),
  cateringController.generateShoppingList.bind(cateringController)
);

// Nutritional Monitoring Routes
router.post('/residents/:residentId/weight',
  authorize(['care_staff', 'nurses', 'dietitian', 'admin']),
  validateRequest({
    body: {
      weight: { type: 'number', required: true },
      recordedBy: { type: 'string', required: true },
      notes: { type: 'string', required: false }
    }
  }),
  cateringController.recordWeight.bind(cateringController)
);

router.post('/residents/:residentId/fluid-intake',
  authorize(['care_staff', 'nurses', 'dietitian', 'admin']),
  validateRequest({
    body: {
      totalIntake: { type: 'number', required: true },
      recordedBy: { type: 'string', required: true },
      notes: { type: 'string', required: false }
    }
  }),
  cateringController.recordFluidIntake.bind(cateringController)
);

router.post('/residents/:residentId/nutritional-assessment',
  authorize(['dietitian', 'admin']),
  validateRequest({
    body: {
      assessorId: { type: 'string', required: true }
    }
  }),
  cateringController.conductNutritionalAssessment.bind(cateringController)
);

// Analytics Routes
router.get('/analytics/nutrition',
  authorize(['dietitian', 'care_managers', 'admin']),
  cateringController.getNutritionalAnalytics.bind(cateringController)
);

router.get('/alerts/dietary',
  authorize(['dietitian', 'care_staff', 'care_managers', 'admin']),
  cateringController.getDietaryAlerts.bind(cateringController)
);

// Food Safety Routes
router.post('/food-safety/report',
  authorize(['kitchen_staff', 'kitchen_manager', 'care_staff', 'admin']),
  validateRequest({
    body: {
      alertType: { type: 'string', required: true },
      description: { type: 'string', required: true },
      severity: { type: 'string', required: true },
      location: { type: 'string', required: true },
      reportedBy: { type: 'string', required: true },
      actionRequired: { type: 'string', required: true }
    }
  }),
  cateringController.reportFoodSafetyIssue.bind(cateringController)
);

// Inventory Routes
router.get('/inventory',
  authorize(['kitchen_manager', 'procurement', 'admin']),
  cateringController.checkInventory.bind(cateringController)
);

export default router;