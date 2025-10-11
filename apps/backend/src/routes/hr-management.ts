import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { HRManagementController } from '../controllers/hr/HRManagementController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { validateRequest } from '../middleware/validation-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const hrController = new HRManagementController();

// Apply middleware to all routes
router.use(authenticate);
router.use(auditMiddleware);

// Employee Management Routes
router.post('/employees',
  authorize(['hr_manager', 'admin']),
  validateRequest({
    body: {
      personalDetails: { type: 'object', required: true },
      contactInformation: { type: 'object', required: true },
      employmentInformation: { type: 'object', required: true },
      jobDetails: { type: 'object', required: true },
      contractInformation: { type: 'object', required: true }
    }
  }),
  hrController.createEmployee.bind(hrController)
);

router.get('/employees',
  authorize(['hr_manager', 'line_manager', 'admin']),
  hrController.getAllEmployees.bind(hrController)
);

router.get('/employees/search',
  authorize(['hr_manager', 'line_manager', 'admin']),
  hrController.searchEmployees.bind(hrController)
);

router.get('/employees/:employeeId',
  authorize(['hr_manager', 'line_manager', 'admin', 'self']),
  hrController.getEmployeeById.bind(hrController)
);

router.put('/employees/:employeeId',
  authorize(['hr_manager', 'admin']),
  hrController.updateEmployee.bind(hrController)
);

router.post('/employees/:employeeId/terminate',
  authorize(['hr_manager', 'admin']),
  validateRequest({
    body: {
      terminationReason: { type: 'string', required: true },
      terminationDate: { type: 'string', required: true }
    }
  }),
  hrController.terminateEmployee.bind(hrController)
);

// Department Management
router.get('/departments/:department/employees',
  authorize(['hr_manager', 'line_manager', 'admin']),
  hrController.getEmployeesByDepartment.bind(hrController)
);

// Performance Management Routes
router.get('/analytics/performance',
  authorize(['hr_manager', 'senior_management', 'admin']),
  hrController.getPerformanceAnalytics.bind(hrController)
);

router.post('/employees/:employeeId/performance-review/schedule',
  authorize(['hr_manager', 'line_manager', 'admin']),
  validateRequest({
    body: {
      reviewDate: { type: 'string', required: true },
      reviewerId: { type: 'string', required: true }
    }
  }),
  hrController.schedulePerformanceReview.bind(hrController)
);

// Training Management Routes
router.post('/employees/:employeeId/training/assign',
  authorize(['hr_manager', 'training_coordinator', 'admin']),
  validateRequest({
    body: {
      trainingName: { type: 'string', required: true },
      trainingType: { type: 'string', required: true },
      dueDate: { type: 'string', required: true }
    }
  }),
  hrController.assignTraining.bind(hrController)
);

router.get('/employees/:employeeId/training/plan',
  authorize(['hr_manager', 'training_coordinator', 'line_manager', 'admin']),
  hrController.getTrainingPlan.bind(hrController)
);

router.post('/employees/:employeeId/training/:trainingId/complete',
  authorize(['hr_manager', 'training_coordinator', 'admin']),
  validateRequest({
    body: {
      completionDate: { type: 'string', required: true },
      score: { type: 'number', required: false }
    }
  }),
  hrController.recordTrainingCompletion.bind(hrController)
);

router.post('/training/bulk-update',
  authorize(['hr_manager', 'training_coordinator', 'admin']),
  validateRequest({
    body: {
      trainingName: { type: 'string', required: true },
      newStatus: { type: 'string', required: true }
    }
  }),
  hrController.bulkUpdateTrainingStatus.bind(hrController)
);

// Compliance Management Routes
router.get('/compliance/alerts',
  authorize(['hr_manager', 'compliance_officer', 'admin']),
  hrController.getComplianceAlerts.bind(hrController)
);

router.get('/employees/:employeeId/compliance',
  authorize(['hr_manager', 'line_manager', 'admin']),
  hrController.checkEmployeeCompliance.bind(hrController)
);

router.get('/employees/expiring-documents',
  authorize(['hr_manager', 'compliance_officer', 'admin']),
  hrController.getEmployeesWithExpiringDocuments.bind(hrController)
);

// Disciplinary Management Routes
router.get('/employees/:employeeId/disciplinary',
  authorize(['hr_manager', 'senior_management', 'admin']),
  hrController.getDisciplinaryHistory.bind(hrController)
);

// Analytics and Reporting Routes
router.get('/analytics/workforce',
  authorize(['hr_manager', 'senior_management', 'admin']),
  hrController.getWorkforceAnalytics.bind(hrController)
);

router.get('/analytics/recruitment',
  authorize(['hr_manager', 'recruitment_team', 'admin']),
  hrController.getRecruitmentMetrics.bind(hrController)
);

export default router;
