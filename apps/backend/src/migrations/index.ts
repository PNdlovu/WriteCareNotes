/**
 * ============================================================================
 * Database Migrations Index
 * ============================================================================
 * 
 * @fileoverview Central export for all database migrations.
 * 
 * @module migrations
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Exports all database migrations in the correct execution order for TypeORM.
 * Migrations are numbered sequentially to ensure proper ordering.
 * 
 * @compliance
 * - TypeORM Migration Best Practices
 * - Database Schema Versioning
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

export { CreateChildProfile1704988800000 } from './001-CreateChildProfile';
export { CreateChildrenCareSystem1704988900000 } from './002-CreateChildrenCareSystem';

/**
 * Migration Execution Order:
 * 
 * 1. CreateChildProfile (001) - Creates children table with all child profile fields
 * 2. CreateChildrenCareSystem (002) - Creates all related tables:
 *    - placements
 *    - safeguarding_incidents  
 *    - personal_education_plans
 *    - health_assessments
 *    - family_members
 *    - contact_schedules
 *    - care_plans
 *    - care_plan_reviews
 *    - pathway_plans
 *    - uasc_profiles
 *    - age_assessments
 *    - immigration_statuses
 *    - home_office_correspondence
 *    - audit_log
 * 
 * To run migrations:
 * npm run migration:run
 * 
 * To revert last migration:
 * npm run migration:revert
 * 
 * To generate new migration:
 * npm run migration:generate -- -n MigrationName
 */
