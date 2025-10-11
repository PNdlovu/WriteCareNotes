import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { VisitorManagementService } from '../services/visitor/VisitorManagementService';
import { SecurityIntegrationService } from '../services/security/SecurityIntegrationService';
import { BackgroundCheckService, BackgroundCheckType } from '../services/compliance/BackgroundCheckService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const visitorService = new VisitorManagementService(
  new EventEmitter2(),
  null as any, // NotificationService
  null as any, // AuditTrailService 
  null as any, // SecurityIntegrationService
  null as any, // BackgroundCheckService
  null as any  // ComplianceService
);
const securityService = new SecurityIntegrationService(
  new EventEmitter2(),
  null as any, // AuditTrailService
  null as any  // NotificationService
);
const backgroundCheckService = new BackgroundCheckService(
  new EventEmitter2(),
  null as any, // AuditTrailService
  null as any, // NotificationService
  null as any  // ComplianceService
);

router.use(authenticate);
router.use(auditMiddleware);

// Visitor Registration & Management
router.post('/visitors/register', authorize(['reception', 'security', 'admin']), async (req, res) => {
  try {
    const visitor = await visitorService.registerAdvancedVisitor(req.body, req.user.id);
    res.status(201).json({ 
      success: true, 
      data: visitor,
      message: 'Visitor registered successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'VISITOR_REGISTRATION_FAILED'
    });
  }
});

router.get('/visitors/:visitorId', authorize(['reception', 'security', 'admin']), async (req, res) => {
  try {
    const visitor = await visitorService.getVisitorById(req.params.visitorId);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        error: 'Visitor not found',
        code: 'VISITOR_NOT_FOUND'
      });
    }
    res.json({ success: true, data: visitor });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.put('/visitors/:visitorId/check-in', authorize(['reception', 'security']), async (req, res) => {
  try {
    const visitId = await visitorService.checkInVisitor(
      req.params.visitorId,
      req.body,
      req.user.id
    );
    res.json({ 
      success: true, 
      data: { visitId },
      message: 'Visitor checked in successfully'
    });
  } catch (error: unknown) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'CHECK_IN_FAILED'
    });
  }
});

router.put('/visitors/:visitId/check-out', authorize(['reception', 'security']), async (req, res) => {
  try {
    await visitorService.checkOutVisitor(
      req.params.visitId,
      req.body,
      req.user.id
    );
    res.json({ 
      success: true, 
      message: 'Visitor checked out successfully'
    });
  } catch (error: unknown) {
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'CHECK_OUT_FAILED'
    });
  }
});

router.get('/visitors/current-visitors', authorize(['reception', 'security', 'admin']), async (req, res) => {
  try {
    const currentVisitors = await visitorService.getCurrentVisitors();
    res.json({ success: true, data: currentVisitors });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Emergency Visitor Management
router.post('/visitors/emergency-visit', authorize(['security', 'admin', 'manager']), async (req, res) => {
  try {
    const emergencyVisit = await visitorService.registerEmergencyVisitor(
      req.body,
      req.user.id
    );
    res.status(201).json({ 
      success: true, 
      data: emergencyVisit,
      message: 'Emergency visitor registered successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'EMERGENCY_REGISTRATION_FAILED'
    });
  }
});

// Risk Assessment & Security
router.put('/visitors/:visitorId/risk-assessment', authorize(['security', 'admin']), async (req, res) => {
  try {
    const assessment = await visitorService.updateRiskAssessment(
      req.params.visitorId,
      req.body,
      req.user.id
    );
    res.json({ 
      success: true, 
      data: assessment,
      message: 'Risk assessment updated successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'RISK_ASSESSMENT_FAILED'
    });
  }
});

router.get('/visitors/:visitorId/security-profile', authorize(['security', 'admin']), async (req, res) => {
  try {
    const profile = await visitorService.getSecurityProfile(req.params.visitorId);
    res.json({ success: true, data: profile });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Analytics & Reporting
router.get('/analytics', authorize(['security_manager', 'admin']), async (req, res) => {
  try {
    const dateRange = req.query.startDate && req.query.endDate ? {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string)
    } : undefined;
    
    const analytics = await visitorService.getVisitorAnalytics(dateRange);
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get('/analytics/security-metrics', authorize(['security_manager', 'admin']), async (req, res) => {
  try {
    const metrics = await visitorService.getSecurityMetrics();
    res.json({ success: true, data: metrics });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get('/analytics/compliance-report', authorize(['compliance', 'admin']), async (req, res) => {
  try {
    const report = await visitorService.generateComplianceReport();
    res.json({ success: true, data: report });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Background Checks
router.post('/background-checks', authorize(['hr', 'admin']), async (req, res) => {
  try {
    const result = await backgroundCheckService.performComprehensiveCheck({
      ...req.body,
      requestedBy: req.user.id
    });
    res.status(201).json({ 
      success: true, 
      data: result,
      message: 'Background check initiated successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'BACKGROUND_CHECK_FAILED'
    });
  }
});

router.get('/background-checks/:checkId', authorize(['hr', 'admin']), async (req, res) => {
  try {
    const result = await backgroundCheckService.getBackgroundCheckResult(req.params.checkId);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Background check not found',
        code: 'CHECK_NOT_FOUND'
      });
    }
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post('/background-checks/dbs', authorize(['hr', 'admin']), async (req, res) => {
  try {
    const result = await backgroundCheckService.performDBSCheck({
      ...req.body,
      requestedBy: req.user.id
    });
    res.status(201).json({ 
      success: true, 
      data: result,
      message: 'DBS check completed successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'DBS_CHECK_FAILED'
    });
  }
});

router.post('/background-checks/professional-registration', authorize(['hr', 'admin']), async (req, res) => {
  try {
    const result = await backgroundCheckService.verifyProfessionalRegistration({
      ...req.body,
      requestedBy: req.user.id
    });
    res.status(201).json({ 
      success: true, 
      data: result,
      message: 'Professional registration verified successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'REGISTRATION_CHECK_FAILED'
    });
  }
});

router.post('/background-checks/right-to-work', authorize(['hr', 'admin']), async (req, res) => {
  try {
    const result = await backgroundCheckService.checkRightToWork({
      ...req.body,
      requestedBy: req.user.id
    });
    res.status(201).json({ 
      success: true, 
      data: result,
      message: 'Right to work check completed successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'RIGHT_TO_WORK_CHECK_FAILED'
    });
  }
});

// Security System Integration
router.get('/security/status', authorize(['security', 'admin']), async (req, res) => {
  try {
    const status = await securityService.checkCurrentSecurityStatus();
    res.json({ success: true, data: status });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post('/security/emergency-lockdown', authorize(['security_manager', 'admin']), async (req, res) => {
  try {
    const result = await visitorService.triggerEmergencyLockdown({
      ...req.body,
      initiatedBy: req.user.id
    });
    res.status(201).json({ 
      success: true, 
      data: result,
      message: 'Emergency lockdown activated successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'LOCKDOWN_FAILED'
    });
  }
});

router.put('/security/lockdown/:lockdownId/deactivate', authorize(['security_manager', 'admin']), async (req, res) => {
  try {
    await securityService.deactivateEmergencyLockdown(
      req.params.lockdownId,
      req.user.id
    );
    res.json({ 
      success: true, 
      message: 'Emergency lockdown deactivated successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'LOCKDOWN_DEACTIVATION_FAILED'
    });
  }
});

// Access Control & Monitoring
router.get('/security/access-events', authorize(['security', 'admin']), async (req, res) => {
  try {
    const events = await securityService.getAccessControlEvents({
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      location: req.query.location as string
    });
    res.json({ success: true, data: events });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get('/security/cctv/cameras', authorize(['security', 'admin']), async (req, res) => {
  try {
    const cameras = await securityService.getCCTVCameras();
    res.json({ success: true, data: cameras });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get('/security/alerts', authorize(['security', 'admin']), async (req, res) => {
  try {
    const alerts = await securityService.getSecurityAlerts({
      severity: req.query.severity as string,
      resolved: req.query.resolved === 'true'
    });
    res.json({ success: true, data: alerts });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Visitor Patterns & Insights
router.get('/visitors/patterns/frequency', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const patterns = await visitorService.getVisitFrequencyPatterns();
    res.json({ success: true, data: patterns });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get('/visitors/patterns/demographics', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const demographics = await visitorService.getVisitorDemographics();
    res.json({ success: true, data: demographics });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Contact Tracing & Health Monitoring
router.get('/visitors/contact-tracing/:visitId', authorize(['health', 'admin']), async (req, res) => {
  try {
    const contacts = await visitorService.getContactTracingData(req.params.visitId);
    res.json({ success: true, data: contacts });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post('/visitors/health-alert', authorize(['health', 'admin']), async (req, res) => {
  try {
    await visitorService.processHealthAlert(req.body, req.user.id);
    res.json({ 
      success: true, 
      message: 'Health alert processed successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'HEALTH_ALERT_FAILED'
    });
  }
});

// Compliance & Audit
router.get('/compliance/audit-trail/:visitorId', authorize(['compliance', 'admin']), async (req, res) => {
  try {
    const auditTrail = await visitorService.getVisitorAuditTrail(req.params.visitorId);
    res.json({ success: true, data: auditTrail });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get('/compliance/gdpr-report', authorize(['compliance', 'admin']), async (req, res) => {
  try {
    const report = await visitorService.generateGDPRComplianceReport();
    res.json({ success: true, data: report });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Visitor Feedback & Satisfaction
router.post('/visitors/:visitorId/feedback', authorize(['reception', 'admin']), async (req, res) => {
  try {
    await visitorService.recordVisitorFeedback(
      req.params.visitorId,
      req.body,
      req.user.id
    );
    res.json({ 
      success: true, 
      message: 'Visitor feedback recorded successfully'
    });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'FEEDBACK_RECORDING_FAILED'
    });
  }
});

router.get('/satisfaction/metrics', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const metrics = await visitorService.getSatisfactionMetrics();
    res.json({ success: true, data: metrics });
  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
