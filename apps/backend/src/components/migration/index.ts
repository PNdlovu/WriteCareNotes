import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Migration Components Index
 * @module MigrationComponents
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-03
 */

export { default as MigrationWizard } from './MigrationWizard';
export { default as MigrationDashboard } from './MigrationDashboard';

// Export types for external use
export type {
  MigrationStep,
  SourceSystem,
  FieldMapping,
  MigrationConfig,
  FileUploadState
} from './MigrationWizard';