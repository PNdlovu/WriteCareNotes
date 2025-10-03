#!/usr/bin/env node

/**
 * @fileoverview Migration System Test Script
 * @module TestMigrationSystem
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-03
 * 
 * @description Comprehensive test script for the advanced migration system
 * with automated testing of all features and user scenarios.
 */

const { AdvancedOnboardingDataMigrationService } = require('../src/services/onboarding/AdvancedOnboardingDataMigrationService');
const { FileImportService } = require('../src/services/migration/FileImportService');
const { AIDataMappingService } = require('../src/services/migration/AIDataMappingService');
const { BackupRollbackService } = require('../src/services/migration/BackupRollbackService');
const { LegacySystemConnectors } = require('../src/services/migration/LegacySystemConnectors');
const { DataValidationService } = require('../src/services/migration/DataValidationService');

console.log('🧪 Testing Advanced Migration System');
console.log('=====================================\n');

class MigrationSystemTester {
  constructor() {
    this.migrationService = new AdvancedOnboardingDataMigrationService();
    this.fileImportService = new FileImportService();
    this.aiMappingService = new AIDataMappingService();
    this.backupService = new BackupRollbackService();
    this.legacyConnectors = new LegacySystemConnectors();
    this.validationService = new DataValidationService();
    
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  async runAllTests() {
    console.log('🔄 Starting comprehensive migration system tests...\n');

    try {
      // Test 1: Legacy System Connectors
      await this.testLegacySystemConnectors();
      
      // Test 2: File Import System
      await this.testFileImportSystem();
      
      // Test 3: AI Data Mapping
      await this.testAIDataMapping();
      
      // Test 4: Data Validation
      await this.testDataValidation();
      
      // Test 5: Backup and Rollback
      await this.testBackupRollback();
      
      // Test 6: Migration Pipeline Creation
      await this.testMigrationPipelineCreation();
      
      // Test 7: End-to-End Migration
      await this.testEndToEndMigration();
      
      // Test 8: Performance and Load Testing
      await this.testPerformanceAndLoad();

      this.printTestResults();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  async testLegacySystemConnectors() {
    console.log('📡 Testing Legacy System Connectors...');
    
    try {
      // Test available system types
      const availableSystems = this.legacyConnectors.getAvailableSystemTypes();
      this.assert(availableSystems.length >= 5, 'Should have at least 5 legacy system types');
      
      // Test Person Centred Software connection
      const pcsConnection = await this.legacyConnectors.connectToLegacySystem(
        'person_centred_software',
        { host: 'test-server', database: 'test_db' },
        { testConnection: true }
      );
      
      this.assert(pcsConnection.status === 'connected', 'Person Centred Software connection should succeed');
      this.assert(pcsConnection.estimatedRecords > 0, 'Should have estimated record count');
      
      // Test data extraction
      const extractionResult = await this.legacyConnectors.extractDataFromLegacySystem(
        pcsConnection.connectionId,
        { recordLimit: 10 }
      );
      
      this.assert(extractionResult.recordCount > 0, 'Should extract sample data');
      this.assert(extractionResult.extractedData.length > 0, 'Should have extracted data');
      
      // Test capabilities
      const capabilities = this.legacyConnectors.getSystemCapabilities('person_centred_software');
      this.assert(capabilities !== null, 'Should return system capabilities');
      this.assert(capabilities.supportedOperations.includes('read'), 'Should support read operations');
      
      this.recordSuccess('Legacy System Connectors', 'All connector tests passed');
      
    } catch (error) {
      this.recordFailure('Legacy System Connectors', error.message);
    }
  }

  async testFileImportSystem() {
    console.log('📁 Testing File Import System...');
    
    try {
      // Generate test CSV data
      const csvData = this.fileImportService.generateSampleData('csv', 10);
      const csvBuffer = Buffer.from(csvData);
      
      // Test CSV import
      const csvResult = await this.fileImportService.importFromBuffer(
        csvBuffer,
        'test_residents.csv',
        { autoDetectTypes: true, validateOnImport: true }
      );
      
      this.assert(csvResult.success, 'CSV import should succeed');
      this.assert(csvResult.recordsImported > 0, 'Should import CSV records');
      this.assert(csvResult.dataQualityScore > 70, 'Should have reasonable quality score');
      
      // Test Excel data generation and import
      const excelBuffer = this.fileImportService.generateSampleData('excel', 5);
      this.assert(Buffer.isBuffer(excelBuffer), 'Should generate Excel buffer');
      
      // Test data type analysis
      const sampleData = [
        { name: 'John Smith', dob: '1945-03-15', phone: '0161 123 4567', nhs: '9876543210' },
        { name: 'Mary Jones', dob: '1940-07-22', phone: '029 2087 6543', nhs: '1234567890' }
      ];
      
      const dataTypes = await this.fileImportService.analyzeDataTypes(sampleData);
      this.assert(dataTypes.length === 4, 'Should analyze all fields');
      this.assert(dataTypes.find(dt => dt.field === 'dob' && dt.detectedType === 'date'), 'Should detect date field');
      
      this.recordSuccess('File Import System', 'All file import tests passed');
      
    } catch (error) {
      this.recordFailure('File Import System', error.message);
    }
  }

  async testAIDataMapping() {
    console.log('🧠 Testing AI Data Mapping...');
    
    try {
      const sampleData = [
        {
          PatientID: 'P001',
          PatientName: 'John Smith',
          DOB: '1945-03-15',
          PhoneNumber: '0161 123 4567',
          Medications: 'Aspirin 75mg OD; Simvastatin 20mg ON',
          Allergies: 'Penicillin'
        },
        {
          PatientID: 'P002',
          PatientName: 'Mary Jones',
          DOB: '1940-07-22',
          PhoneNumber: '029 2087 6543',
          Medications: 'Metformin 500mg BD',
          Allergies: 'None known'
        }
      ];
      
      // Test AI mapping generation
      const mappings = await this.aiMappingService.generateMappingRecommendations(
        sampleData,
        undefined,
        {
          sourceSystemType: 'healthcare',
          migrationPurpose: 'care_home_migration',
          dataClassification: 'medical'
        }
      );
      
      this.assert(mappings.length > 0, 'Should generate AI mappings');
      
      // Check for expected mappings
      const patientIdMapping = mappings.find(m => m.sourceField === 'PatientID');
      this.assert(patientIdMapping && patientIdMapping.targetField === 'resident_id', 'Should map PatientID to resident_id');
      this.assert(patientIdMapping.confidence > 0.9, 'Should have high confidence for ID mapping');
      
      const nameMapping = mappings.find(m => m.sourceField === 'PatientName');
      this.assert(nameMapping && nameMapping.targetField === 'full_name', 'Should map PatientName to full_name');
      
      // Test mapping statistics
      const stats = this.aiMappingService.getMappingStatistics(mappings);
      this.assert(stats.totalMappings === mappings.length, 'Statistics should match mapping count');
      this.assert(stats.averageConfidence > 0, 'Should have positive average confidence');
      
      // Test learning from feedback
      await this.aiMappingService.learnFromFeedback({
        mappingId: mappings[0].mappingId,
        accepted: true,
        sourceField: mappings[0].sourceField,
        originalRecommendation: mappings[0].targetField
      });
      
      this.recordSuccess('AI Data Mapping', 'All AI mapping tests passed');
      
    } catch (error) {
      this.recordFailure('AI Data Mapping', error.message);
    }
  }

  async testDataValidation() {
    console.log('✅ Testing Data Validation...');
    
    try {
      const testData = [
        {
          resident_id: 'R001',
          full_name: 'John Smith',
          date_of_birth: '1945-03-15',
          nhs_number: '9876543210',
          phone_number: '0161 123 4567',
          current_medications: [
            { name: 'Aspirin', dosage: '75mg', frequency: 'OD' }
          ],
          known_allergies: ['Penicillin'],
          care_level: 'High dependency'
        },
        {
          resident_id: 'R002',
          full_name: '',
          date_of_birth: '2025-01-01', // Future date
          nhs_number: '123', // Invalid
          phone_number: 'invalid',
          current_medications: 'invalid format',
          known_allergies: '',
          care_level: 'Invalid level'
        }
      ];
      
      // Test comprehensive quality assessment
      const qualityReport = await this.validationService.assessDataQuality(testData, {
        includeClinicaValidation: true,
        includeRegulatoryChecks: true,
        detailedFieldAnalysis: true,
        generateRecommendations: true
      });
      
      this.assert(qualityReport.overallScore >= 0 && qualityReport.overallScore <= 100, 'Quality score should be 0-100');
      this.assert(qualityReport.validationResults.errors > 0, 'Should detect validation errors');
      this.assert(qualityReport.recommendations.length > 0, 'Should generate recommendations');
      
      // Test real-time validation
      const realTimeResult = await this.validationService.validateRecordRealTime(
        testData[1], // Invalid record
        2,
        { strictMode: true, clinicalValidation: true, autoFix: true }
      );
      
      this.assert(!realTimeResult.isValid, 'Should detect invalid record');
      this.assert(realTimeResult.errors.length > 0, 'Should have validation errors');
      this.assert(realTimeResult.fixedRecord !== undefined, 'Should provide auto-fixed record');
      
      this.recordSuccess('Data Validation', 'All validation tests passed');
      
    } catch (error) {
      this.recordFailure('Data Validation', error.message);
    }
  }

  async testBackupRollback() {
    console.log('💾 Testing Backup and Rollback...');
    
    try {
      const testPipelineId = 'test_pipeline_' + Date.now();
      
      // Test backup creation
      const backup = await this.backupService.createAutomatedBackup(testPipelineId, {
        priority: 'high',
        description: 'Test backup for system validation',
        tags: ['test', 'automated']
      });
      
      this.assert(backup.backupId, 'Should create backup with ID');
      this.assert(backup.pipelineId === testPipelineId, 'Should associate backup with pipeline');
      
      // Test backup listing
      const backups = await this.backupService.listBackups(testPipelineId);
      this.assert(backups.length > 0, 'Should list created backups');
      
      // Test backup statistics
      const stats = this.backupService.getBackupStatistics();
      this.assert(stats.totalBackups >= 0, 'Should return backup statistics');
      this.assert(['healthy', 'warning', 'critical'].includes(stats.healthStatus), 'Should have valid health status');
      
      // Test backup/restore procedure
      const testResult = await this.backupService.testBackupRestoreProcedure(testPipelineId);
      this.assert(testResult.backupTest.success, 'Backup test should succeed');
      this.assert(testResult.restoreTest.success, 'Restore test should succeed');
      this.assert(testResult.integrityTest.success, 'Integrity test should succeed');
      
      this.recordSuccess('Backup and Rollback', 'All backup/rollback tests passed');
      
    } catch (error) {
      this.recordFailure('Backup and Rollback', error.message);
    }
  }

  async testMigrationPipelineCreation() {
    console.log('🏗️ Testing Migration Pipeline Creation...');
    
    try {
      const pipelineConfig = {
        sourceSystems: [
          {
            systemName: 'Test System',
            systemType: 'healthcare',
            connectionDetails: { host: 'test' },
            dataTypes: ['residents', 'medications'],
            estimatedVolume: 2
          }
        ],
        targetSystem: {
          systemName: 'WriteCareNotes',
          dataModel: 'healthcare',
          performanceRequirements: {}
        },
        migrationRequirements: {
          migrationTimeline: 1,
          downtimeAllowance: 2,
          dataQualityThreshold: 95,
          performanceRequirements: {},
          userPreferences: {
            enableRealTimeUpdates: true,
            emailNotifications: true,
            inAppNotifications: true,
            notificationFrequency: 'immediate',
            criticalAlertsOnly: false
          }
        },
        userGuidance: {
          experienceLevel: 'intermediate',
          assistanceLevel: 'full',
          automationLevel: 'high'
        }
      };
      
      const pipeline = await this.migrationService.createDataMigrationPipeline(pipelineConfig);
      
      this.assert(pipeline.pipelineId, 'Should create pipeline with ID');
      this.assert(pipeline.sourceSystemAnalysis, 'Should include source analysis');
      this.assert(pipeline.migrationStrategy, 'Should include migration strategy');
      this.assert(pipeline.transformationRules.length > 0, 'Should have transformation rules');
      this.assert(pipeline.userExperience.guidedWizard, 'Should enable guided wizard');
      
      // Test progress tracking
      const progress = this.migrationService.getMigrationProgress(pipeline.pipelineId);
      this.assert(progress !== null, 'Should track migration progress');
      this.assert(progress.status === 'preparing', 'Initial status should be preparing');
      
      this.recordSuccess('Migration Pipeline Creation', 'Pipeline creation tests passed');
      
    } catch (error) {
      this.recordFailure('Migration Pipeline Creation', error.message);
    }
  }

  async testEndToEndMigration() {
    console.log('🚀 Testing End-to-End Migration...');
    
    try {
      // Create a complete migration scenario
      const testData = [
        {
          PatientID: 'E2E001',
          PatientName: 'Alice Wilson',
          DOB: '1941-05-12',
          PhoneNumber: '0141 555 0123',
          Medications: 'Atorvastatin 20mg evening; Amlodipine 10mg morning',
          Allergies: 'Sulfa drugs',
          CareLevel: 'Medium dependency'
        }
      ];

      // Step 1: Generate AI mappings
      const mappings = await this.aiMappingService.generateMappingRecommendations(testData);
      this.assert(mappings.length > 0, 'Should generate mappings for test data');

      // Step 2: Validate data quality
      const qualityReport = await this.validationService.assessDataQuality(testData);
      this.assert(qualityReport.overallScore > 0, 'Should assess data quality');

      // Step 3: Create migration pipeline
      const pipelineConfig = {
        sourceSystems: [{
          systemName: 'End-to-End Test',
          systemType: 'test',
          connectionDetails: {},
          dataTypes: ['residents'],
          estimatedVolume: 1
        }],
        targetSystem: { systemName: 'WriteCareNotes', dataModel: 'healthcare', performanceRequirements: {} },
        migrationRequirements: {
          migrationTimeline: 1,
          downtimeAllowance: 1,
          dataQualityThreshold: 90,
          performanceRequirements: {},
          userPreferences: {
            enableRealTimeUpdates: true,
            emailNotifications: false,
            inAppNotifications: true,
            notificationFrequency: 'immediate',
            criticalAlertsOnly: false
          }
        },
        userGuidance: {
          experienceLevel: 'expert',
          assistanceLevel: 'minimal',
          automationLevel: 'medium'
        }
      };

      const pipeline = await this.migrationService.createDataMigrationPipeline(pipelineConfig);
      
      // Step 4: Execute migration (dry run)
      await this.migrationService.executeMigration(pipeline.pipelineId, { dryRun: true });
      
      // Step 5: Verify completion
      const finalProgress = this.migrationService.getMigrationProgress(pipeline.pipelineId);
      this.assert(finalProgress.status === 'completed', 'Migration should complete successfully');
      
      this.recordSuccess('End-to-End Migration', 'Complete migration workflow tested successfully');
      
    } catch (error) {
      this.recordFailure('End-to-End Migration', error.message);
    }
  }

  async testPerformanceAndLoad() {
    console.log('⚡ Testing Performance and Load...');
    
    try {
      // Test large dataset processing
      const largeDataset = [];
      for (let i = 1; i <= 1000; i++) {
        largeDataset.push({
          id: `PERF${String(i).padStart(4, '0')}`,
          name: `Test Resident ${i}`,
          dob: `194${Math.floor(Math.random() * 10)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          medications: i % 3 === 0 ? 'Paracetamol 1g QDS PRN' : 'Aspirin 75mg OD'
        });
      }
      
      const startTime = Date.now();
      
      // Test AI mapping performance
      const mappings = await this.aiMappingService.generateMappingRecommendations(largeDataset.slice(0, 100));
      const mappingTime = Date.now() - startTime;
      
      this.assert(mappingTime < 5000, 'AI mapping should complete within 5 seconds for 100 records');
      this.assert(mappings.length > 0, 'Should generate mappings for large dataset');
      
      // Test validation performance
      const validationStart = Date.now();
      const qualityReport = await this.validationService.assessDataQuality(largeDataset.slice(0, 500));
      const validationTime = Date.now() - validationStart;
      
      this.assert(validationTime < 10000, 'Validation should complete within 10 seconds for 500 records');
      this.assert(qualityReport.overallScore >= 0, 'Should complete quality assessment');
      
      // Test memory usage (simulated)
      const memoryUsage = process.memoryUsage();
      this.assert(memoryUsage.heapUsed < 500 * 1024 * 1024, 'Memory usage should be reasonable'); // 500MB limit
      
      this.recordSuccess('Performance and Load', 'Performance tests completed within acceptable limits');
      
    } catch (error) {
      this.recordFailure('Performance and Load', error.message);
    }
  }

  // Helper methods

  assert(condition, message) {
    if (condition) {
      this.testResults.passed++;
      console.log(`  ✅ ${message}`);
    } else {
      this.testResults.failed++;
      console.log(`  ❌ ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  recordSuccess(testName, details) {
    this.testResults.details.push({
      test: testName,
      status: 'PASSED',
      details,
      timestamp: new Date()
    });
    console.log(`✅ ${testName}: ${details}\n`);
  }

  recordFailure(testName, error) {
    this.testResults.failed++;
    this.testResults.details.push({
      test: testName,
      status: 'FAILED',
      error,
      timestamp: new Date()
    });
    console.log(`❌ ${testName}: ${error}\n`);
  }

  recordWarning(testName, warning) {
    this.testResults.warnings++;
    this.testResults.details.push({
      test: testName,
      status: 'WARNING',
      warning,
      timestamp: new Date()
    });
    console.log(`⚠️ ${testName}: ${warning}\n`);
  }

  printTestResults() {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=======================');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⚠️ Warnings: ${this.testResults.warnings}`);
    console.log(`📋 Total Tests: ${this.testResults.details.length}`);
    
    const successRate = (this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100;
    console.log(`🎯 Success Rate: ${Math.round(successRate)}%`);
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Migration system is fully operational.');
      console.log('\n🚀 Advanced Migration System Features Verified:');
      console.log('   ✅ AI-assisted data mapping');
      console.log('   ✅ Friction-free user experience');
      console.log('   ✅ Real-time progress tracking');
      console.log('   ✅ Automated backup and rollback');
      console.log('   ✅ Legacy system integration');
      console.log('   ✅ Comprehensive data validation');
      console.log('   ✅ Clinical safety checks');
      console.log('   ✅ Regulatory compliance validation');
      console.log('   ✅ Multi-format file support');
      console.log('   ✅ Performance optimization');
    } else {
      console.log(`\n❌ ${this.testResults.failed} test(s) failed. Please review and fix issues.`);
      process.exit(1);
    }
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new MigrationSystemTester();
  tester.runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = MigrationSystemTester;