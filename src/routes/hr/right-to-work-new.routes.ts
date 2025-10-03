import { Router } from 'express';
import RightToWorkCheckController from '../../controllers/hr/RightToWorkCheckController';
import { authenticate } from '../../middleware/auth-middleware';
import { authorize } from '../../middleware/rbac-middleware';

const router = Router();
const rightToWorkController = new RightToWorkCheckController();

// Routes
router.post('/', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), rightToWorkController.createRightToWorkCheck.bind(rightToWorkController));
router.get('/search', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), rightToWorkController.searchRightToWorkChecks.bind(rightToWorkController));
router.get('/:checkId', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), rightToWorkController.getRightToWorkCheckById.bind(rightToWorkController));
router.get('/employee/:employeeId', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), rightToWorkController.getRightToWorkChecksByEmployee.bind(rightToWorkController));
router.put('/:checkId', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), rightToWorkController.updateRightToWorkCheck.bind(rightToWorkController));
router.post('/:checkId/start', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), rightToWorkController.startRightToWorkCheck.bind(rightToWorkController));
router.post('/:checkId/submit', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), rightToWorkController.submitRightToWorkCheck.bind(rightToWorkController));
router.post('/:checkId/complete', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), rightToWorkController.completeRightToWorkCheck.bind(rightToWorkController));
router.post('/:checkId/reject', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), rightToWorkController.rejectRightToWorkCheck.bind(rightToWorkController));
router.get('/reports/compliance', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), rightToWorkController.getRightToWorkComplianceReport.bind(rightToWorkController));
router.get('/reports/expiring', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), rightToWorkController.getExpiringRightToWorkChecks.bind(rightToWorkController));
router.get('/reports/expired', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), rightToWorkController.getExpiredRightToWorkChecks.bind(rightToWorkController));
router.delete('/:checkId', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), rightToWorkController.deleteRightToWorkCheck.bind(rightToWorkController));
router.post('/bulk-update-status', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), rightToWorkController.bulkUpdateRightToWorkCheckStatus.bind(rightToWorkController));

export default router;