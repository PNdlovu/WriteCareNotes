import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Migration Services Index
 * @module MigrationServices
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-03
 */

export { default as FileImportService } from './FileImportService';
export { default as AIDataMappingService } from './AIDataMappingService';
export { default as BackupRollbackService } from './BackupRollbackService';
export { default as LegacySystemConnectors } from './LegacySystemConnectors';
export { default as DataValidationService } from './DataValidationService';
export { default as MigrationWebSocketService } from './MigrationWebSocketService';

// Export types for external use
export type {
  FileImportOptions,
  FileImportResult,
  MappingRecommendation,
  BackupConfiguration,
  RestoreResult,
  LegacySystemConnection,
  DataQualityReport
} from './FileImportService';