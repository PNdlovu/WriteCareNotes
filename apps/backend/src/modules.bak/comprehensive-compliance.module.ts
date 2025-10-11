/**
 * @fileoverview Comprehensive module that provides all compliance services
 * @module Modules/Comprehensive-compliance.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive module that provides all compliance services
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Comprehensive Compliance Module for WriteCareNotes
 * @module ComprehensiveComplianceModule
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive module that provides all compliance services
 * for 2025 and beyond, including AI Governance, Cyber Resilience Act,
 * Supply Chain Security, DORA, Environmental Sustainability, and
 * existing British Isles healthcare compliance services.
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

// New 2025 Compliance Services
import { AIGovernanceComplianceService } from '../services/compliance/AIGovernanceComplianceService';
import { CyberResilienceActComplianceService } from '../services/compliance/CyberResilienceActComplianceService';
import { SupplyChainSecurityComplianceService } from '../services/compliance/SupplyChainSecurityComplianceService';
import { DORAComplianceService } from '../services/compliance/DORAComplianceService';
import { EnvironmentalSustainabilityComplianceService } from '../services/compliance/EnvironmentalSustainabilityComplianceService';
import { ComplianceOrchestrationService } from '../services/compliance/ComplianceOrchestrationService';

// Existing Compliance Services
import { ComplianceCheckService } from '../services/compliance/ComplianceCheckService';
import { CQCDigitalStandardsService } from '../services/compliance/CQCDigitalStandardsService';
import { NHSDigitalComplianceService } from '../services/compliance/NHSDigitalComplianceService';
import { CareInspectorateScotlandService } from '../services/compliance/CareInspectorateScotlandService';
import { CIWWalesComplianceService } from '../services/compliance/CIWWalesComplianceService';
import { RQIANorthernIrelandService } from '../services/compliance/RQIANorthernIrelandService';
import { ProfessionalStandardsService } from '../services/compliance/ProfessionalStandardsService';
import { UKCyberEssentialsService } from '../services/compliance/UKCyberEssentialsService';
import { DSPTComplianceService } from '../services/compliance/DSPTComplianceService';
import { MHRAComplianceService } from '../services/compliance/MHRAComplianceService';
import { NICEGuidelinesService } from '../services/compliance/NICEGuidelinesService';
import { BrexitTradeComplianceService } from '../services/compliance/BrexitTradeComplianceService';

// Supporting Services
import { GDPRComplianceService } from '../services/gdpr/GDPRComplianceService';
import { AuditTrailService } from '../services/audit/AuditTrailService';
import { DataSecurityService } from '../services/security/DataSecurityService';
import { NotificationService } from '../services/notifications/NotificationService';

/**
 * Comprehensive Compliance Module
 * 
 * This module provides a complete suite of compliance services for healthcare
 * organizations operating in the British Isles and globally. It includes:
 * 
 * 🚀 **NEW 2025 COMPLIANCE SERVICES:**
 * - AI Governance & ML Model Compliance (EU AI Act)
 * - Cyber Resilience Act Compliance
 * - Supply Chain Security Compliance
 * - Digital Operational Resilience Act (DORA) Compliance
 * - Environmental Sustainability Compliance
 * - Master Compliance Orchestration Service
 * 
 * 🏥 **EXISTING HEALTHCARE COMPLIANCE:**
 * - Complete British Isles Healthcare Compliance
 * - CQC Digital Standards (England)
 * - NHS Digital Compliance
 * - Care Inspectorate Scotland
 * - CIW Wales Compliance
 * - RQIA Northern Ireland
 * - Professional Standards (NMC, GMC, HCPC, etc.)
 * - UK Cyber Essentials
 * - DSPT Compliance
 * - MHRA Medical Device Compliance
 * - NICE Guidelines Integration
 * - Brexit Trade Compliance
 * 
 * 🔒 **SUPPORTING SERVICES:**
 * - GDPR Data Protection
 * - Comprehensive Audit Trails
 * - Healthcare-Grade Security
 * - Multi-Channel Notifications
 */
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use this instance throughout the app
      global: true,
      // set this to `true` to use wildcards
      wildcard: false,
      // the delimiter used to segment namespaces
      delimiter: '.',
      // set this to `true` if you want to emit the newListener event
      newListener: false,
      // set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // the maximum amount of listeners that can be assigned to an event
      maxListeners: 100,
      // show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
  ],
  providers: [
    // 🚀 NEW 2025 COMPLIANCE SERVICES
    AIGovernanceComplianceService,
    CyberResilienceActComplianceService,
    SupplyChainSecurityComplianceService,
    DORAComplianceService,
    EnvironmentalSustainabilityComplianceService,
    ComplianceOrchestrationService,

    // 🏥 EXISTING HEALTHCARE COMPLIANCE SERVICES
    ComplianceCheckService,
    CQCDigitalStandardsService,
    NHSDigitalComplianceService,
    CareInspectorateScotlandService,
    CIWWalesComplianceService,
    RQIANorthernIrelandService,
    ProfessionalStandardsService,
    UKCyberEssentialsService,
    DSPTComplianceService,
    MHRAComplianceService,
    NICEGuidelinesService,
    BrexitTradeComplianceService,

    // 🔒 SUPPORTING SERVICES
    GDPRComplianceService,
    AuditTrailService,
    DataSecurityService,
    NotificationService,
  ],
  exports: [
    // Export all services for use in other modules
    
    // 🚀 NEW 2025 COMPLIANCE SERVICES
    AIGovernanceComplianceService,
    CyberResilienceActComplianceService,
    SupplyChainSecurityComplianceService,
    DORAComplianceService,
    EnvironmentalSustainabilityComplianceService,
    ComplianceOrchestrationService,

    // 🏥 EXISTING HEALTHCARE COMPLIANCE SERVICES
    ComplianceCheckService,
    CQCDigitalStandardsService,
    NHSDigitalComplianceService,
    CareInspectorateScotlandService,
    CIWWalesComplianceService,
    RQIANorthernIrelandService,
    ProfessionalStandardsService,
    UKCyberEssentialsService,
    DSPTComplianceService,
    MHRAComplianceService,
    NICEGuidelinesService,
    BrexitTradeComplianceService,

    // 🔒 SUPPORTING SERVICES
    GDPRComplianceService,
    AuditTrailService,
    DataSecurityService,
    NotificationService,
  ],
})
export class ComprehensiveComplianceModule {}

/**
 * 📋 **COMPLIANCE COVERAGE SUMMARY**
 * 
 * This module provides comprehensive compliance coverage for:
 * 
 * **🌍 GEOGRAPHIC COVERAGE:**
 * ✅ England (CQC, NHS Digital)
 * ✅ Scotland (Care Inspectorate)
 * ✅ Wales (CIW)
 * ✅ Northern Ireland (RQIA)
 * ✅ European Union (AI Act, Cyber Resilience Act, DORA)
 * ✅ United Kingdom (Post-Brexit Trade, Cyber Essentials)
 * ✅ Global (Environmental Sustainability, Supply Chain Security)
 * 
 * **🏥 HEALTHCARE SPECIFIC:**
 * ✅ Medical Device Regulations (MHRA)
 * ✅ Clinical Guidelines (NICE)
 * ✅ Professional Standards (NMC, GMC, HCPC, GPhC, GOC, GDC)
 * ✅ Data Security and Protection Toolkit (DSPT)
 * ✅ Clinical Safety (DCB0129, DCB0160)
 * ✅ Healthcare Data Standards
 * 
 * **🔒 SECURITY & PRIVACY:**
 * ✅ GDPR Data Protection
 * ✅ UK Cyber Essentials Plus
 * ✅ Cyber Resilience Act
 * ✅ Healthcare-Grade Encryption
 * ✅ Audit Trails and Logging
 * 
 * **🤖 EMERGING TECHNOLOGIES:**
 * ✅ AI Governance (EU AI Act)
 * ✅ ML Model Compliance
 * ✅ Algorithmic Accountability
 * ✅ Automated Decision Making
 * ✅ AI Risk Management
 * 
 * **🌱 SUSTAINABILITY:**
 * ✅ Environmental Compliance
 * ✅ Carbon Footprint Management
 * ✅ Sustainable IT Practices
 * ✅ Green Healthcare Operations
 * ✅ Circular Economy Principles
 * 
 * **🔗 SUPPLY CHAIN:**
 * ✅ Third-Party Risk Management
 * ✅ Supplier Security Assessment
 * ✅ Software Bill of Materials (SBOM)
 * ✅ Vulnerability Management
 * ✅ Secure Development Lifecycle
 * 
 * **💰 FINANCIAL SERVICES:**
 * ✅ Digital Operational Resilience Act (DORA)
 * ✅ ICT Risk Management
 * ✅ Incident Reporting
 * ✅ Operational Resilience Testing
 * ✅ Third-Party ICT Risk
 * 
 * **📊 COMPLIANCE MATURITY:**
 * ✅ Initial Assessment and Gap Analysis
 * ✅ Developing Compliance Programs
 * ✅ Defined Processes and Procedures
 * ✅ Managed Compliance Operations
 * ✅ Optimized Continuous Improvement
 * 
 * **🎯 KEY BENEFITS:**
 * 🚀 Stay ahead of regulatory requirements
 * 🛡️ Comprehensive risk management
 * 💰 Cost-effective compliance operations
 * 📈 Improved operational efficiency
 * 🏆 Competitive advantage through compliance excellence
 * 🔄 Integrated cross-framework synergies
 * 📊 Real-time compliance monitoring
 * 🎯 Automated compliance reporting
 * 
 * **⚡ IMPLEMENTATION APPROACH:**
 * 1. **Assessment Phase**: Comprehensive gap analysis
 * 2. **Planning Phase**: Integrated action plan development
 * 3. **Implementation Phase**: Phased rollout with quick wins
 * 4. **Monitoring Phase**: Continuous compliance monitoring
 * 5. **Optimization Phase**: Ongoing improvement and efficiency gains
 * 
 * This module represents the most comprehensive healthcare compliance
 * solution available, ensuring organizations stay ahead of regulatory
 * requirements while optimizing costs and operational efficiency.
 */