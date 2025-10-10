/**
 * ============================================================================
 * UASC Routes
 * ============================================================================
 * 
 * @fileoverview Express router configuration for UASC endpoints.
 * 
 * @module domains/uasc/routes
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Defines all HTTP routes for UASC (Unaccompanied Asylum Seeking Children)
 * management including profiles, age assessments, immigration status, and
 * Home Office correspondence.
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Router } from 'express';
import { UASCController } from '../controllers/UASCController';

const router = Router();
const uascController = new UASCController();

// ========================================
// UASC PROFILE ROUTES
// ========================================

router.post('/profiles', (req, res) => uascController.createProfile(req, res));
router.get('/profiles', (req, res) => uascController.getProfiles(req, res));
router.get('/profiles/:id', (req, res) => uascController.getProfile(req, res));
router.get('/profiles/child/:childId', (req, res) =>
  uascController.getProfileByChild(req, res)
);
router.put('/profiles/:id', (req, res) => uascController.updateProfile(req, res));
router.get('/profiles/attention/:organizationId', (req, res) =>
  uascController.getProfilesRequiringAttention(req, res)
);

// ========================================
// AGE ASSESSMENT ROUTES
// ========================================

router.post('/age-assessments', (req, res) =>
  uascController.createAgeAssessment(req, res)
);
router.get('/age-assessments/:id', (req, res) =>
  uascController.getAgeAssessment(req, res)
);
router.get('/age-assessments/profile/:uascProfileId', (req, res) =>
  uascController.getAgeAssessmentsByProfile(req, res)
);
router.put('/age-assessments/:id', (req, res) =>
  uascController.updateAgeAssessment(req, res)
);
router.put('/age-assessments/:id/complete', (req, res) =>
  uascController.completeAgeAssessment(req, res)
);
router.get('/age-assessments/overdue/:organizationId', (req, res) =>
  uascController.getOverdueAgeAssessments(req, res)
);

// ========================================
// IMMIGRATION STATUS ROUTES
// ========================================

router.post('/immigration-status', (req, res) =>
  uascController.createImmigrationStatus(req, res)
);
router.get('/immigration-status/:id', (req, res) =>
  uascController.getImmigrationStatus(req, res)
);
router.get('/immigration-status/current/:uascProfileId', (req, res) =>
  uascController.getCurrentImmigrationStatus(req, res)
);
router.get('/immigration-status/history/:uascProfileId', (req, res) =>
  uascController.getImmigrationStatusHistory(req, res)
);
router.put('/immigration-status/:id', (req, res) =>
  uascController.updateImmigrationStatus(req, res)
);
router.get('/immigration-status/attention/:organizationId', (req, res) =>
  uascController.getImmigrationStatusesRequiringAttention(req, res)
);

// ========================================
// HOME OFFICE CORRESPONDENCE ROUTES
// ========================================

router.post('/correspondence', (req, res) =>
  uascController.createCorrespondence(req, res)
);
router.get('/correspondence/:id', (req, res) =>
  uascController.getCorrespondence(req, res)
);
router.get('/correspondence/profile/:uascProfileId', (req, res) =>
  uascController.getCorrespondenceByProfile(req, res)
);
router.put('/correspondence/:id', (req, res) =>
  uascController.updateCorrespondence(req, res)
);
router.put('/correspondence/:id/sent', (req, res) =>
  uascController.markCorrespondenceSent(req, res)
);
router.put('/correspondence/:id/response', (req, res) =>
  uascController.recordResponse(req, res)
);
router.get('/correspondence/overdue/:organizationId', (req, res) =>
  uascController.getOverdueCorrespondence(req, res)
);
router.get('/correspondence/attention/:organizationId', (req, res) =>
  uascController.getCorrespondenceRequiringAttention(req, res)
);

// ========================================
// STATISTICS ROUTE
// ========================================

router.get('/statistics/:organizationId', (req, res) =>
  uascController.getStatistics(req, res)
);

export default router;
