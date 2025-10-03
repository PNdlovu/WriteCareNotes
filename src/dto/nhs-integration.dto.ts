import { EventEmitter2 } from "eventemitter2";

import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * NHS Integration Data Transfer Objects
 * 
 * Comprehensive DTOs for NHS Digital and GP Connect integration
 * Supports FHIR R4 compliance and secure data exchange
 */

export class NHSCredentials {
  @ApiProperty({ description: 'NHS Digital client ID' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'NHS Digital client secret' })
  @IsString()
  clientSecret: string;

  @ApiProperty({ description: 'NHS ASID (Accredited System ID)' })
  @IsString()
  asid: string;

  @ApiProperty({ description: 'Organization ODS code' })
  @IsString()
  odsCode: string;
}

export class AuthToken {
  @ApiProperty({ description: 'OAuth2 access token' })
  @IsString()
  accessToken: string;

  @ApiProperty({ description: 'OAuth2 refresh token', required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  @IsNumber()
  expiresIn: number;

  @ApiProperty({ description: 'Token type (Bearer)' })
  @IsString()
  tokenType: string;

  @ApiProperty({ description: 'OAuth2 scope' })
  @IsString()
  scope: string;

  @ApiProperty({ description: 'Token issue timestamp' })
  @IsDateString()
  issuedAt: Date;
}

export class FHIRIdentifier {
  @ApiProperty({ description: 'Identifier system URL' })
  @IsString()
  system: string;

  @ApiProperty({ description: 'Identifier value' })
  @IsString()
  value: string;

  @ApiProperty({ description: 'Identifier use', required: false })
  @IsOptional()
  @IsString()
  use?: string;
}

export class FHIRCoding {
  @ApiProperty({ description: 'Code system URL' })
  @IsString()
  system: string;

  @ApiProperty({ description: 'Code value' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Display name' })
  @IsString()
  display: string;

  @ApiProperty({ description: 'Version', required: false })
  @IsOptional()
  @IsString()
  version?: string;
}

export class FHIRCodeableConcept {
  @ApiProperty({ description: 'Coding array', type: [FHIRCoding] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRCoding)
  coding: FHIRCoding[];

  @ApiProperty({ description: 'Text representation', required: false })
  @IsOptional()
  @IsString()
  text?: string;
}

export class PatientDemographics {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Patient name' })
  name: {
    family: string;
    given: string[];
    prefix?: string[];
    suffix?: string[];
  };

  @ApiProperty({ description: 'Date of birth' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ description: 'Gender' })
  @IsString()
  gender: string;

  @ApiProperty({ description: 'Address' })
  address?: {
    line: string[];
    city: string;
    postalCode: string;
    country: string;
  };

  @ApiProperty({ description: 'Contact information' })
  telecom?: {
    system: string;
    value: string;
    use?: string;
  }[];
}

export class GPPractice {
  @ApiProperty({ description: 'GP practice reference' })
  @IsString()
  reference: string;

  @ApiProperty({ description: 'Practice name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Practice ODS code', required: false })
  @IsOptional()
  @IsString()
  odsCode?: string;
}

export class CareRecordSection {
  @ApiProperty({ description: 'Section title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Section code' })
  @ValidateNested()
  @Type(() => FHIRCodeableConcept)
  code: FHIRCodeableConcept;

  @ApiProperty({ description: 'Section text content' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Section entries', required: false })
  @IsOptional()
  @IsArray()
  entry?: any[];
}

export class CareRecord {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Author ID' })
  @IsString()
  authorId: string;

  @ApiProperty({ description: 'Record date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Record type' })
  @ValidateNested()
  @Type(() => FHIRCodeableConcept)
  type: FHIRCodeableConcept;

  @ApiProperty({ description: 'Care record sections', type: [CareRecordSection] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CareRecordSection)
  sections: CareRecordSection[];
}

export class MedicationDetails {
  @ApiProperty({ description: 'Medication ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Medication name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'SNOMED CT code' })
  @IsString()
  snomedCode: string;

  @ApiProperty({ description: 'Dosage instructions' })
  @IsString()
  dosageInstructions: string;

  @ApiProperty({ description: 'Timing information' })
  timing: {
    frequency: number;
    period: number;
    periodUnit: string;
  };

  @ApiProperty({ description: 'Route of administration', required: false })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiProperty({ description: 'Medication status' })
  @IsString()
  status: string;
}

export class MedicationTransfer {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Transfer type' })
  @IsString()
  transferType: string;

  @ApiProperty({ description: 'Source organization' })
  @IsString()
  sourceOrganization: string;

  @ApiProperty({ description: 'Target organization' })
  @IsString()
  targetOrganization: string;

  @ApiProperty({ description: 'Medications list', type: [MedicationDetails] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDetails)
  medications: MedicationDetails[];

  @ApiProperty({ description: 'Transfer date' })
  @IsDateString()
  transferDate: string;

  @ApiProperty({ description: 'Clinical notes', required: false })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;
}

export class GPConnectPatient {
  @ApiProperty({ description: 'NHS number' })
  @IsString()
  nhsNumber: string;

  @ApiProperty({ description: 'Patient demographics' })
  @ValidateNested()
  @Type(() => PatientDemographics)
  demographics: PatientDemographics;

  @ApiProperty({ description: 'Care record data' })
  careRecord: {
    compositions: any[];
    medications: any[];
    allergies: any[];
    conditions: any[];
  };

  @ApiProperty({ description: 'Last updated timestamp' })
  @IsDateString()
  lastUpdated: Date;

  @ApiProperty({ description: 'GP practice information' })
  @ValidateNested()
  @Type(() => GPPractice)
  gpPractice: GPPractice;
}

export class DSCRRecord {
  @ApiProperty({ description: 'Patient ID' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Record date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Record sections', type: [CareRecordSection] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CareRecordSection)
  sections: CareRecordSection[];
}

export class DSCRData {
  @ApiProperty({ description: 'Facility ID' })
  @IsString()
  facilityId: string;

  @ApiProperty({ description: 'Submission type' })
  @IsString()
  submissionType: string;

  @ApiProperty({ description: 'DSCR records', type: [DSCRRecord] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DSCRRecord)
  records: DSCRRecord[];

  @ApiProperty({ description: 'Submission metadata', required: false })
  @IsOptional()
  metadata?: {
    submittedBy: string;
    submissionDate: string;
    version: string;
  };
}

export class ComplianceStandard {
  @ApiProperty({ description: 'Standard code' })
  @IsString()
  standard: string;

  @ApiProperty({ description: 'Standard name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Compliance score (0-100)' })
  @IsNumber()
  score: number;

  @ApiProperty({ description: 'Compliance status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Last assessment date' })
  @IsDateString()
  lastAssessment: Date;

  @ApiProperty({ description: 'Assessment findings' })
  @IsArray()
  @IsString({ each: true })
  findings: string[];
}

export class ComplianceReport {
  @ApiProperty({ description: 'Report ID' })
  @IsString()
  reportId: string;

  @ApiProperty({ description: 'Report generation date' })
  @IsDateString()
  generatedAt: Date;

  @ApiProperty({ description: 'Compliance standards' })
  standards: {
    dcb0129: ComplianceStandard;
    dcb0160: ComplianceStandard;
    dcb0154: ComplianceStandard;
    dcb0155: ComplianceStandard;
    dspt: ComplianceStandard;
  };

  @ApiProperty({ description: 'Overall compliance score' })
  @IsNumber()
  overallScore: number;

  @ApiProperty({ description: 'Improvement recommendations' })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];
}

export class NHSIntegrationConfig {
  @ApiProperty({ description: 'Enable NHS integration' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'GP Connect endpoint' })
  @IsString()
  gpConnectEndpoint: string;

  @ApiProperty({ description: 'eRedBag endpoint' })
  @IsString()
  eRedBagEndpoint: string;

  @ApiProperty({ description: 'DSCR endpoint' })
  @IsString()
  dscrEndpoint: string;

  @ApiProperty({ description: 'Auto-sync interval in minutes' })
  @IsNumber()
  autoSyncInterval: number;

  @ApiProperty({ description: 'Enable real-time updates' })
  @IsBoolean()
  realTimeUpdates: boolean;
}

export class FHIRResource {
  @ApiProperty({ description: 'FHIR resource type' })
  @IsString()
  resourceType: string;

  @ApiProperty({ description: 'Resource ID', required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Resource metadata', required: false })
  @IsOptional()
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };

  @ApiProperty({ description: 'Resource identifier', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FHIRIdentifier)
  identifier?: FHIRIdentifier[];
}