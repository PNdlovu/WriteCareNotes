/**
 * @fileoverview Migration runner script for WriteCareNotes data migration
 * @module run-migration
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { DataMigrationService, MigrationConfig } from '../services/migration/DataMigrationService';
import { createLogger } from '../utils/logger';

const logger = createLogger('MigrationRunner');

interface CliOptions {
  config: string;
  environment: string;
  phase?: string;
  service?: string;
  dryRun?: boolean;
  rollback?: boolean;
  progress?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArguments(): CliOptions {
  const program = new Command();
  
  program
    .name('run-migration')
    .description('WriteCareNotes Data Migration Tool')
    .version('1.0.0')
    .requiredOption('-c, --config <path>', 'Migration configuration file path')
    .requiredOption('-e, --environment <env>', 'Target environment (development, staging, production)')
    .option('-p, --phase <number>', 'Migration phase to execute (1, 2, etc.)')
    .option('-s, --service <name>', 'Specific service to migrate')
    .option('--dry-run', 'Execute migration in dry-run mode (no actual changes)')
    .option('--rollback', 'Rollback migration for specified service')
    .option('--progress', 'Show migration progress')
    .parse();

  return program.opts() as CliOptions;
}

/**
 * Load migration configuration from file
 */
function loadMigrationConfig(configPath: string): MigrationConfig {
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    logger.info(`Loaded migration configurationfrom: ${configPath}`);
    return config;
    
  } catch (error) {
    logger.error(`Failed to load migrationconfiguration: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Display migration progress
 */
function displayProgress(migrationService: DataMigrationService): void {
  const progressInterval = setInterval(() => {
    const progress = migrationService.getMigrationProgress();
    
    const progressPercent = progress.totalRecords > 0 
      ? Math.round((progress.migratedRecords / progress.totalRecords) * 100)
      : 0;
    
    const elapsed = Date.now() - progress.startTime.getTime();
    const elapsedFormatted = formatDuration(elapsed);
    
    let statusMessage = `Phase ${progress.currentPhase}/${progress.totalPhases} | `;
    statusMessage += `Tables ${progress.completedTables}/${progress.totalTables} | `;
    statusMessage += `Records ${progress.migratedRecords}/${progress.totalRecords} (${progressPercent}%) | `;
    statusMessage += `Elapsed: ${elapsedFormatted}`;
    
    if (progress.estimatedCompletion) {
      const remaining = progress.estimatedCompletion.getTime() - Date.now();
      const remainingFormatted = formatDuration(remaining);
      statusMessage += ` | ETA: ${remainingFormatted}`;
    }
    
    console.log(`\r${statusMessage}`, { end: '' });
    
    if (progress.status === 'completed' || progress.status === 'failed') {
      clearInterval(progressInterval);
      console.log(); // New line
    }
  }, 2000);
}

/**
 * Format duration in milliseconds to human readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Execute migration rollback
 */
async function executeRollback(migrationService: DataMigrationService, serviceName: string): Promise<void> {
  try {
    logger.info(`Starting rollback forservice: ${serviceName}`);
    
    await migrationService.rollbackService(serviceName);
    
    logger.info(`Rollback completed successfully forservice: ${serviceName}`);
    console.log(`✅ Rollback completed for ${serviceName}`);
    
  } catch (error) {
    logger.error(`Rollback failed for service ${serviceName}:`, error);
    console.error(`❌ Rollback failed for ${serviceName}: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Execute migration
 */
async function executeMigration(migrationService: DataMigrationService, options: CliOptions): Promise<void> {
  try {
    logger.info('Starting data migration execution');
    
    // Show progress if requested
    if (options.progress) {
      displayProgress(migrationService);
    }
    
    const results = await migrationService.executeMigration();
    
    // Display results summary
    console.log('\n📊 Migration ResultsSummary:');
    console.log('================================');
    
    let totalRecords = 0;
    let totalMigrated = 0;
    let totalFailed = 0;
    
    for (const result of results) {
      const statusIcon = result.status === 'completed' ? '✅' : 
                        result.status === 'partial' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${result.serviceName}.${result.tableName}:`);
      console.log(`   Records: ${result.migratedRecords}/${result.totalRecords}`);
      console.log(`   Duration: ${formatDuration(result.duration)}`);
      
      if (result.failedRecords > 0) {
        console.log(`   Failed: ${result.failedRecords}`);
      }
      
      if (result.validationErrors.length > 0) {
        console.log(`   ValidationErrors: ${result.validationErrors.length}`);
        result.validationErrors.slice(0, 3).forEach(error => {
          console.log(`     - ${error}`);
        });
        if (result.validationErrors.length > 3) {
          console.log(`     ... and ${result.validationErrors.length - 3} more`);
        }
      }
      
      console.log();
      
      totalRecords += result.totalRecords;
      totalMigrated += result.migratedRecords;
      totalFailed += result.failedRecords;
    }
    
    console.log('📈 OverallSummary:');
    console.log(`   TotalRecords: ${totalRecords}`);
    console.log(`   Migrated: ${totalMigrated}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   SuccessRate: ${totalRecords > 0 ? Math.round((totalMigrated / totalRecords) * 100) : 0}%`);
    
    const finalProgress = migrationService.getMigrationProgress();
    const totalDuration = Date.now() - finalProgress.startTime.getTime();
    console.log(`   TotalDuration: ${formatDuration(totalDuration)}`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 Migration completedsuccessfully!');
      logger.info('Migration completed successfully');
    } else {
      console.log('\n⚠️ Migration completed with some failures');
      logger.warn(`Migration completed with ${totalFailed} failed records`);
    }
    
  } catch (error) {
    logger.error('Migration executionfailed:', error);
    console.error(`❌ Migrationfailed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const options = parseArguments();
    
    console.log('🚀 WriteCareNotes Data Migration Tool');
    console.log('====================================');
    console.log(`Environment: ${options.environment}`);
    console.log(`Configuration: ${options.config}`);
    
    if (options.phase) {
      console.log(`Phase: ${options.phase}`);
    }
    
    if (options.service) {
      console.log(`Service: ${options.service}`);
    }
    
    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No actual changes will be made');
    }
    
    if (options.rollback) {
      console.log('🔄 ROLLBACK MODE');
    }
    
    console.log();
    
    // Load configuration
    const config = loadMigrationConfig(options.config);
    
    // Override config with CLI options
    if (options.dryRun) {
      config.dryRun = true;
    }
    
    // Initialize migration service
    const migrationService = new DataMigrationService(config);
    
    // Execute rollback or migration
    if (options.rollback) {
      if (!options.service) {
        console.error('❌ Service name is required for rollback operation');
        process.exit(1);
      }
      
      await executeRollback(migrationService, options.service);
    } else {
      await executeMigration(migrationService, options);
    }
    
    // Cleanup
    await migrationService.shutdown();
    
  } catch (error) {
    logger.error('Migration runnerfailed:', error);
    console.error(`❌ Migration runnerfailed: ${error.message}`);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration terminated');
  process.exit(143);
});

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejectionat:', promise, 'reason:', reason);
  console.error('❌ Unhandled error occurred. Check logs for details.');
  process.exit(1);
});

// Execute main function
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error:', error);
    console.error(`❌ Fatalerror: ${error.message}`);
    process.exit(1);
  });
}
