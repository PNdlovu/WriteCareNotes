/**
 * @fileoverview NHS dm+d (Dictionary of Medicines and Devices) Entity
 * @module NHSDmdMedicationEntity
 * @version 1.0.0
 * @since 2025-10-10
 * 
 * @description
 * NHS dm+d standardized medication reference entity for UK care providers.
 * Provides authoritative medication data for prescribing, dispensing, and administration.
 * 
 * @compliance
 * - NHS Business Services Authority (NHSBSA) dm+d standards
 * - SNOMED CT UK Drug Extension
 * - FHIR UK Core Medication Profile
 * - CQC Regulation 12 (Safe care and treatment)
 * - Care Inspectorate Scotland
 * - Care Inspectorate Wales (CIW)
 * - RQIA Northern Ireland
 * 
 * @sources
 * - NHSBSA dm+d API: https://services.nhsbsa.nhs.uk/dmd-browser/
 * - dm+d XML files: https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/dictionary-medicines-and-devices-dmd
 * - SNOMED CT: https://termbrowser.nhs.uk/
 * 
 * @interoperability
 * This entity enables data exchange with:
 * - NHS Spine (national health IT infrastructure)
 * - Electronic Prescription Service (EPS)
 * - Summary Care Record (SCR)
 * - GP Connect
 * - Other care provider systems via FHIR
 */

import { 
  Entity, 
  Column, 
  Index,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { BaseEntity } from './BaseEntity';

/**
 * dm+d Virtual Product Type
 */
export enum DmdVirtualProductType {
  VTM = 'VTM',  // Virtual Therapeutic Moiety (generic concept)
  VMP = 'VMP',  // Virtual Medicinal Product (generic product)
  AMP = 'AMP'   // Actual Medicinal Product (branded product)
}

/**
 * dm+d Form Type (how medication is administered)
 */
export enum DmdFormType {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  ORAL_SOLUTION = 'ORAL_SOLUTION',
  ORAL_SUSPENSION = 'ORAL_SUSPENSION',
  INJECTION = 'INJECTION',
  INHALATION = 'INHALATION',
  CREAM = 'CREAM',
  OINTMENT = 'OINTMENT',
  DROPS = 'DROPS',
  PATCH = 'PATCH',
  SUPPOSITORY = 'SUPPOSITORY',
  PESSARY = 'PESSARY',
  SPRAY = 'SPRAY',
  GEL = 'GEL'
}

/**
 * dm+d Controlled Drug Category
 */
export enum DmdControlledDrugCategory {
  NOT_CONTROLLED = 'NOT_CONTROLLED',
  SCHEDULE_1 = 'SCHEDULE_1',  // Class A - No medical use (e.g., LSD)
  SCHEDULE_2 = 'SCHEDULE_2',  // Class A/B - Strict controls (e.g., morphine, methadone)
  SCHEDULE_3 = 'SCHEDULE_3',  // Class B/C - Moderate controls (e.g., temazepam)
  SCHEDULE_4_PART_1 = 'SCHEDULE_4_PART_1',  // Benzodiazepines
  SCHEDULE_4_PART_2 = 'SCHEDULE_4_PART_2',  // Anabolic steroids
  SCHEDULE_5 = 'SCHEDULE_5'   // Low strength preparations
}

@Entity('wcn_nhs_dmd_medications')
@Index(['snomedCode'], { unique: true })
@Index(['vtmSnomedCode'])
@Index(['vmpSnomedCode'])
@Index(['preferredTerm'])
export class NHSDmdMedication extends BaseEntity {
  // ==========================================
  // SNOMED CT IDENTIFIERS
  // ==========================================

  /**
   * SNOMED CT Concept ID - Unique identifier in SNOMED CT
   * This is the primary key for interoperability
   */
  @Column({ type: 'bigint', unique: true })
  @Index()
  snomedCode!: string;

  /**
   * VTM SNOMED Code - Virtual Therapeutic Moiety (generic concept)
   * e.g., "Paracetamol" (generic active ingredient)
   */
  @Column({ type: 'bigint', nullable: true })
  @Index()
  vtmSnomedCode?: string;

  /**
   * VMP SNOMED Code - Virtual Medicinal Product (generic product)
   * e.g., "Paracetamol 500mg tablets"
   */
  @Column({ type: 'bigint', nullable: true })
  @Index()
  vmpSnomedCode?: string;

  /**
   * AMP SNOMED Code - Actual Medicinal Product (branded)
   * e.g., "Panadol 500mg tablets" (brand name)
   */
  @Column({ type: 'bigint', nullable: true })
  ampSnomedCode?: string;

  /**
   * Product Type - VTM, VMP, or AMP
   */
  @Column({
    type: 'enum',
    enum: DmdVirtualProductType
  })
  productType!: DmdVirtualProductType;

  // ==========================================
  // MEDICATION NAMES
  // ==========================================

  /**
   * Preferred Term - Official dm+d name
   * e.g., "Paracetamol 500mg tablets"
   */
  @Column({ type: 'text' })
  @Index()
  preferredTerm!: string;

  /**
   * Fully Specified Name - Complete SNOMED CT name with qualifiers
   * e.g., "Paracetamol 500mg oral tablet (product)"
   */
  @Column({ type: 'text' })
  fullySpecifiedName!: string;

  /**
   * Short Name - Abbreviated name for display
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  shortName?: string;

  /**
   * Synonym - Alternative names
   */
  @Column({ type: 'jsonb', nullable: true })
  synonyms?: string[];

  // ==========================================
  // PRODUCT DETAILS
  // ==========================================

  /**
   * Form - How medication is administered (tablet, liquid, etc.)
   */
  @Column({
    type: 'enum',
    enum: DmdFormType,
    nullable: true
  })
  form?: DmdFormType;

  /**
   * Strength - Active ingredient strength
   * e.g., "500mg", "10mg/5ml"
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  strength?: string;

  /**
   * Unit of Measure - Standard unit (mg, ml, mcg, etc.)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  unitOfMeasure?: string;

  /**
   * Manufacturer - For AMPs (branded products)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer?: string;

  /**
   * Supplier - Who supplies the medication
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier?: string;

  // ==========================================
  // CONTROLLED DRUG INFORMATION
  // ==========================================

  /**
   * Controlled Drug Category - UK Misuse of Drugs Act classification
   */
  @Column({
    type: 'enum',
    enum: DmdControlledDrugCategory,
    default: DmdControlledDrugCategory.NOT_CONTROLLED
  })
  controlledDrugCategory!: DmdControlledDrugCategory;

  /**
   * Controlled Drug Schedule - Legal schedule under Misuse of Drugs Regulations
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  controlledDrugSchedule?: string;

  // ==========================================
  // PRESCRIBING INFORMATION
  // ==========================================

  /**
   * Prescribable - Can this medication be prescribed?
   */
  @Column({ type: 'boolean', default: true })
  isPrescribable!: boolean;

  /**
   * Black Triangle - New drug under intensive monitoring
   */
  @Column({ type: 'boolean', default: false })
  isBlackTriangle!: boolean;

  /**
   * BNF Code - British National Formulary code
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  bnfCode?: string;

  /**
   * BNF for Children Code - Pediatric BNF code
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  bnfcCode?: string;

  /**
   * Prescribing Status - Active, discontinued, etc.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  prescribingStatus?: string;

  // ==========================================
  // CLINICAL INFORMATION
  // ==========================================

  /**
   * Indications - What conditions this treats
   */
  @Column({ type: 'jsonb', nullable: true })
  indications?: string[];

  /**
   * Contraindications - When NOT to use this medication
   */
  @Column({ type: 'jsonb', nullable: true })
  contraindications?: string[];

  /**
   * Cautions - Warnings and precautions
   */
  @Column({ type: 'jsonb', nullable: true })
  cautions?: string[];

  /**
   * Side Effects - Common adverse reactions
   */
  @Column({ type: 'jsonb', nullable: true })
  sideEffects?: string[];

  /**
   * Drug Interactions - Medications that interact
   */
  @Column({ type: 'jsonb', nullable: true })
  drugInteractions?: {
    medication: string;
    snomedCode?: string;
    severity: 'mild' | 'moderate' | 'severe';
    description: string;
  }[];

  // ==========================================
  // PEDIATRIC INFORMATION
  // ==========================================

  /**
   * Pediatric Use - Approved for children?
   */
  @Column({ type: 'boolean', default: false })
  isPediatricApproved!: boolean;

  /**
   * Minimum Age Months - Minimum age for use
   */
  @Column({ type: 'int', nullable: true })
  minimumAgeMonths?: number;

  /**
   * Maximum Age Months - Maximum pediatric age (if applicable)
   */
  @Column({ type: 'int', nullable: true })
  maximumAgeMonths?: number;

  /**
   * Pediatric Dosing - Age/weight-based dosing guidance
   */
  @Column({ type: 'jsonb', nullable: true })
  pediatricDosing?: {
    ageGroup: string;
    minAgeMonths?: number;
    maxAgeMonths?: number;
    dosing: string;
    maxDailyDose?: string;
    calculation?: string; // e.g., "15mg/kg"
  }[];

  // ==========================================
  // NHS-SPECIFIC DATA
  // ==========================================

  /**
   * NHS dm+d Version - Version of dm+d database
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  dmdVersion?: string;

  /**
   * NHS dm+d ID - Original dm+d database ID
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  dmdId?: string;

  /**
   * NHS Indicative Price - Typical NHS cost
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  nhsIndicativePrice?: number;

  /**
   * Drug Tariff Category - NHS pricing category
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  drugTariffCategory?: string;

  // ==========================================
  // FHIR COMPATIBILITY
  // ==========================================

  /**
   * FHIR Medication Resource - JSON representation for FHIR exchange
   */
  @Column({ type: 'jsonb', nullable: true })
  fhirMedicationResource?: {
    resourceType: 'Medication';
    id: string;
    code: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    form?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    ingredient?: Array<{
      itemCodeableConcept: {
        coding: Array<{
          system: string;
          code: string;
          display: string;
        }>;
      };
      strength?: {
        numerator: {
          value: number;
          unit: string;
        };
        denominator: {
          value: number;
          unit: string;
        };
      };
    }>;
  };

  // ==========================================
  // METADATA
  // ==========================================

  /**
   * Is Active - Currently available for use
   */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /**
   * Invalid Date - When medication was marked invalid (discontinued)
   */
  @Column({ type: 'date', nullable: true })
  invalidDate?: Date;

  /**
   * Last dm+d Sync - When data was last synced from NHS dm+d
   */
  @Column({ type: 'timestamp', nullable: true })
  lastDmdSync?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ==========================================
  // COMPUTED METHODS
  // ==========================================

  /**
   * Check if medication requires controlled drug protocols
   */
  isControlledDrug(): boolean {
    return this.controlledDrugCategory !== DmdControlledDrugCategory.NOT_CONTROLLED;
  }

  /**
   * Get display name for prescribing UI
   */
  getDisplayName(): string {
    return this.shortName || this.preferredTerm;
  }

  /**
   * Check if medication is suitable for children
   */
  isSuitableForChildren(): boolean {
    return this.isPediatricApproved;
  }

  /**
   * Get SNOMED CT code for interoperability
   */
  getSnomedCode(): string {
    return this.snomedCode;
  }

  /**
   * Get BNF reference (adult or children)
   */
  getBNFCode(forChildren: boolean = false): string | undefined {
    return forChildren ? this.bnfcCode : this.bnfCode;
  }
}

export default NHSDmdMedication;
