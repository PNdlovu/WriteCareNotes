import { Router } from 'express';
import DVLACheckController from '../../controllers/hr/DVLACheckController';
import { authenticate } from '../../middleware/auth-middleware';
import { authorize } from '../../middleware/rbac-middleware';

const router = Router();
const dvlaController = new DVLACheckController();

// Routes
router.post('/', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), dvlaController.createDVLACheck.bind(dvlaController));
router.get('/search', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), dvlaController.searchDVLAChecks.bind(dvlaController));
router.get('/:checkId', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), dvlaController.getDVLACheckById.bind(dvlaController));
router.get('/employee/:employeeId', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), dvlaController.getDVLAChecksByEmployee.bind(dvlaController));
router.put('/:checkId', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), dvlaController.updateDVLACheck.bind(dvlaController));
router.post('/:checkId/start', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), dvlaController.startDVLACheck.bind(dvlaController));
router.post('/:checkId/submit', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), dvlaController.submitDVLACheck.bind(dvlaController));
router.post('/:checkId/complete', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), dvlaController.completeDVLACheck.bind(dvlaController));
router.post('/:checkId/reject', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), dvlaController.rejectDVLACheck.bind(dvlaController));
router.get('/reports/compliance', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), dvlaController.getDVLAComplianceReport.bind(dvlaController));
router.get('/reports/expiring', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), dvlaController.getExpiringDVLAChecks.bind(dvlaController));
router.get('/reports/expired', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin', 'hr_staff']), dvlaController.getExpiredDVLAChecks.bind(dvlaController));
router.delete('/:checkId', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), dvlaController.deleteDVLACheck.bind(dvlaController));
router.post('/bulk-update-status', authenticate, authorize(['hr_manager', 'compliance_manager', 'admin']), dvlaController.bulkUpdateDVLACheckStatus.bind(dvlaController));

export default router;