/**
 * @fileoverview Resident Management Components Export Index
 * @module ResidentComponents
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Central export point for all resident management components
 * providing a clean import interface for the resident management system.
 * 
 * @example
 * // Import specific components
 * import { ResidentDashboard, ResidentProfile } from '@/components/resident';
 * 
 * // Import all components
 * import * as ResidentComponents from '@/components/resident';
 */

// Core Resident Management Components
export { ResidentDashboard } from './ResidentDashboard';
export { ResidentProfile } from './ResidentProfile';
export { ResidentAdmission } from './ResidentAdmission';

// Additional components to be implemented:
// export { CarePlanManagement } from './CarePlanManagement';
// export { ResidentReporting } from './ResidentReporting';
// export { FamilyPortal } from './FamilyPortal';
// export { RiskAssessment } from './RiskAssessment';
// export { WellbeingTracking } from './WellbeingTracking';