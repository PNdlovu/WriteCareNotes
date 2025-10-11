import { Router } from 'express';
import DBSVerificationController from '../../controllers/hr/DBSVerificationController';
import { authenticate } from '../../middleware/auth-middleware';
import { authorizeHR } from '../../middleware/enhanced-rbac-audit';

const router = Router();
const dbsController = new DBSVerificationController();

// Routes
router.post('/', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin'], 'CREATE_DBS_VERIFICATION'), dbsController.createDBSVerification.bind(dbsController));
router.get('/search', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin', 'hr_staff'], 'SEARCH_DBS_VERIFICATIONS'), dbsController.searchDBSVerifications.bind(dbsController));
router.get('/:verificationId', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin', 'hr_staff'], 'VIEW_DBS_VERIFICATION'), dbsController.getDBSVerificationById.bind(dbsController));
router.get('/employee/:employeeId', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin', 'hr_staff'], 'VIEW_EMPLOYEE_DBS_VERIFICATIONS'), dbsController.getDBSVerificationsByEmployee.bind(dbsController));
router.put('/:verificationId', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin'], 'UPDATE_DBS_VERIFICATION'), dbsController.updateDBSVerification.bind(dbsController));
router.post('/:verificationId/start-application', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin'], 'START_DBS_APPLICATION'), dbsController.startDBSApplication.bind(dbsController));
router.post('/:verificationId/submit-application', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin'], 'SUBMIT_DBS_APPLICATION'), dbsController.submitDBSApplication.bind(dbsController));
router.post('/:verificationId/complete', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin'], 'COMPLETE_DBS_VERIFICATION'), dbsController.completeDBSVerification.bind(dbsController));
router.post('/:verificationId/reject', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin'], 'REJECT_DBS_VERIFICATION'), dbsController.rejectDBSVerification.bind(dbsController));
router.get('/reports/compliance', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin'], 'VIEW_DBS_COMPLIANCE_REPORT'), dbsController.getDBSComplianceReport.bind(dbsController));
router.get('/reports/expiring', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin', 'hr_staff'], 'VIEW_EXPIRING_DBS_VERIFICATIONS'), dbsController.getExpiringDBSVerifications.bind(dbsController));
router.get('/reports/expired', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin', 'hr_staff'], 'VIEW_EXPIRED_DBS_VERIFICATIONS'), dbsController.getExpiredDBSVerifications.bind(dbsController));
router.delete('/:verificationId', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin'], 'DELETE_DBS_VERIFICATION'), dbsController.deleteDBSVerification.bind(dbsController));
router.post('/bulk-update-status', authenticate, authorizeHR(['hr_manager', 'compliance_manager', 'admin'], 'BULK_UPDATE_DBS_VERIFICATION_STATUS'), dbsController.bulkUpdateDBSVerificationStatus.bind(dbsController));

export default router;