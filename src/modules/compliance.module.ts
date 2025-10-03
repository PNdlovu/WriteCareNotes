import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview British Isles Compliance Module
 * @module ComplianceModule
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive British Isles compliance module integrating all
 * regulatory, professional, and trade compliance requirements.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// Import all compliance entities
import { ClinicalRiskAssessment, ClinicalSafetyCaseReport, DSPTAssessment, ClinicalSafetyOfficer, DSPTEvidenceItem, NHSDigitalComplianceMonitoring } from '../entities/compliance/NHSDigitalCompliance';
import { CQCComplianceAssessment, CQCActionPlan, CQCInspectionReadiness } from '../entities/compliance/CQCCompliance';
import { ScotlandComplianceAssessment, ScotlandServiceRegistration } from '../entities/compliance/ScotlandCompliance';
import { WalesComplianceAssessment, CIWServiceRegistration, WelshLanguageActiveOffer, SCWProfessionalRegistration } from '../entities/compliance/WalesCompliance';
import { NorthernIrelandComplianceAssessment, RQIAServiceRegistration, HumanRightsAssessment, NISCCProfessionalRegistration } from '../entities/compliance/NorthernIrelandCompliance';
import { ProfessionalRegistration, ProfessionalQualification, ContinuingEducationRecord, ProfessionalStandardsAssessment } from '../entities/compliance/ProfessionalStandards';
import { CyberEssentialsAssessment, VulnerabilityFinding, PenetrationTestResult } from '../entities/compliance/CybersecurityCompliance';
import { BrexitTradeDocumentation, EORIRegistration, UKConformityAssessment, CustomsDeclaration, BrexitComplianceAssessment } from '../entities/compliance/BrexitTradeCompliance';
import { NICEGuideline, NICERecommendation, NICEQualityStatement, NICEComplianceAssessment, MHRADeviceRegistration, MHRAComplianceAssessment } from '../entities/compliance/NICECompliance';

// Import all compliance services
import { NHSDigitalComplianceService } from '../services/compliance/NHSDigitalComplianceService';
import { CQCDigitalStandardsService } from '../services/compliance/CQCDigitalStandardsService';
import { CareInspectorateScotlandService } from '../services/compliance/CareInspectorateScotlandService';
import { CIWWalesComplianceService } from '../services/compliance/CIWWalesComplianceService';
import { RQIANorthernIrelandService } from '../services/compliance/RQIANorthernIrelandService';
import { ProfessionalStandardsService } from '../services/compliance/ProfessionalStandardsService';
import { UKCyberEssentialsService } from '../services/compliance/UKCyberEssentialsService';
import { DSPTComplianceService } from '../services/compliance/DSPTComplianceService';
import { MHRAComplianceService } from '../services/compliance/MHRAComplianceService';
import { NICEGuidelinesService } from '../services/compliance/NICEGuidelinesService';
import { BrexitTradeComplianceService } from '../services/compliance/BrexitTradeComplianceService';

// Import controllers
import { BritishIslesComplianceController } from '../controllers/compliance/BritishIslesComplianceController';

// Import existing compliance service
import { ComplianceCheckService } from '../services/compliance/ComplianceCheckService';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // NHS Digital Compliance Entities
      ClinicalRiskAssessment,
      ClinicalSafetyCaseReport,
      DSPTAssessment,
      ClinicalSafetyOfficer,
      DSPTEvidenceItem,
      NHSDigitalComplianceMonitoring,

      // CQC Compliance Entities
      CQCComplianceAssessment,
      CQCActionPlan,
      CQCInspectionReadiness,

      // Scotland Compliance Entities
      ScotlandComplianceAssessment,
      ScotlandServiceRegistration,

      // Wales Compliance Entities
      WalesComplianceAssessment,
      CIWServiceRegistration,
      WelshLanguageActiveOffer,
      SCWProfessionalRegistration,

      // Northern Ireland Compliance Entities
      NorthernIrelandComplianceAssessment,
      RQIAServiceRegistration,
      HumanRightsAssessment,
      NISCCProfessionalRegistration,

      // Professional Standards Entities
      ProfessionalRegistration,
      ProfessionalQualification,
      ContinuingEducationRecord,
      ProfessionalStandardsAssessment,

      // Cybersecurity Compliance Entities
      CyberEssentialsAssessment,
      VulnerabilityFinding,
      PenetrationTestResult,

      // Brexit Trade Compliance Entities
      BrexitTradeDocumentation,
      EORIRegistration,
      UKConformityAssessment,
      CustomsDeclaration,
      BrexitComplianceAssessment,

      // NICE and MHRA Entities
      NICEGuideline,
      NICERecommendation,
      NICEQualityStatement,
      NICEComplianceAssessment,
      MHRADeviceRegistration,
      MHRAComplianceAssessment
    ]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot()
  ],
  providers: [
    // NHS Digital Services
    NHSDigitalComplianceService,
    DSPTComplianceService,

    // Jurisdiction-Specific Services
    CQCDigitalStandardsService,
    CareInspectorateScotlandService,
    CIWWalesComplianceService,
    RQIANorthernIrelandService,

    // Professional Standards Services
    ProfessionalStandardsService,

    // Cybersecurity Services
    UKCyberEssentialsService,

    // Medical Device Services
    MHRAComplianceService,

    // Clinical Guidelines Services
    NICEGuidelinesService,

    // Brexit Trade Services
    BrexitTradeComplianceService,

    // Existing Services
    ComplianceCheckService
  ],
  controllers: [
    BritishIslesComplianceController
  ],
  exports: [
    // Export all services for use in other modules
    NHSDigitalComplianceService,
    DSPTComplianceService,
    CQCDigitalStandardsService,
    CareInspectorateScotlandService,
    CIWWalesComplianceService,
    RQIANorthernIrelandService,
    ProfessionalStandardsService,
    UKCyberEssentialsService,
    MHRAComplianceService,
    NICEGuidelinesService,
    BrexitTradeComplianceService,
    ComplianceCheckService
  ]
})
export class ComplianceModule {
  constructor() {
    console.log('🏛️ British Isles Compliance Module initialized');
    console.log('✅ All jurisdiction-specific compliance services loaded');
    console.log('🔒 Cybersecurity and data protection compliance ready');
    console.log('👥 Professional standards compliance active');
    console.log('🏥 Clinical excellence and NICE guidelines integrated');
    console.log('🌍 Brexit trade compliance implemented');
    console.log('📊 Automated compliance monitoring enabled');
  }
}