/**
 * @fileoverview Comprehensive file import service supporting multiple formats
 * @module Migration/FileImportService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive file import service supporting multiple formats
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview File Import Service
 * @module FileImportService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-03
 * 
 * @description Comprehensive file import service supporting multiple formats
 * with intelligent data parsing, validation, and transformation.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as csv from 'csv-parser';
import * as xml2js from 'xml2js';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export interface FileImportOptions {
  encoding?: string;
  delimiter?: string;
  headers?: boolean;
  skipRows?: number;
  maxRows?: number;
  dateFormat?: string;
  autoDetectTypes?: boolean;
  validateOnImport?: boolean;
  transformationRules?: TransformationRule[];
}

export interface TransformationRule {
  field: string;
  type: 'date' | 'number' | 'phone' | 'postcode' | 'nhs_number' | 'medication' | 'custom';
  format?: string;
  customFunction?: (value: any) => any;
}

export interface FileImportResult {
  importId: string;
  fileName: string;
  fileSize: number;
  recordsFound: number;
  recordsImported: number;
  recordsSkipped: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  dataTypes: { [field: string]: string };
  sampleData: any[];
  processingTime: number;
  qualityScore: number;
}

export interface ImportError {
  row: number;
  column: string;
  value: any;
  error: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  autoFixable: boolean;
}

export interface ImportWarning {
  row: number;
  column: string;
  value: any;
  warning: string;
  suggestion: string;
  autoFixed: boolean;
}

export interface DataTypeAnalysis {
  field: string;
  detectedType: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'phone' | 'postcode' | 'nhs_number';
  confidence: number;
  samples: any[];
  nullCount: number;
  uniqueCount: number;
  patterns: string[];
}

export class FileImportService extends EventEmitter {
  private supportedFormats = ['.csv', '.xlsx', '.xls', '.json', '.xml', '.tsv'];
  private maxFileSize = 100 * 1024 * 1024; // 100MB

  private tempDirectory = process.env['TEMP_UPLOAD_DIR'] || './temp/uploads';


  constructor() {
    super();
    this.ensureTempDirectory();
  }

  private ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDirectory)) {
      fs.mkdirSync(this.tempDirectory, { recursive: true });
    }
  }

  /**
   * Import data from file buffer with comprehensive processing
   */
  async importFromBuffer(
    buffer: Buffer, 
    fileName: string, 
    options: FileImportOptions = {}
  ): Promise<FileImportResult> {
    const startTime = Date.now();
    const importId = uuidv4();
    const fileExtension = path.extname(fileName).toLowerCase();
    
    try {
      this.emit('import_started', { importId, fileName });
      
      // Validate file
      this.validateFile(buffer, fileName);
      
      // Parse file based on format
      letrawData: any[] = [];
      
      switch (fileExtension) {
        case '.csv':
        case '.tsv':
          rawData = await this.parseCSV(buffer, options);
          break;
        case '.xlsx':
        case '.xls':
          rawData = await this.parseExcel(buffer, options);
          break;
        case '.json':
          rawData = await this.parseJSON(buffer, options);
          break;
        case '.xml':
          rawData = await this.parseXML(buffer, options);
          break;
        default:
          throw new Error(`Unsupported file format: ${fileExtension}`);
      }
      
      this.emit('data_parsed', { importId, recordCount: rawData.length });
      
      // Analyze data types
      const dataTypes = await this.analyzeDataTypes(rawData);
      
      // Apply transformations
      const { transformedData, errors, warnings } = await this.applyTransformations(
        rawData, 
        options.transformationRules || [],
        dataTypes
      );
      
      // Validate data if requested
      letvalidationErrors: ImportError[] = [];
      letvalidationWarnings: ImportWarning[] = [];
      
      if (options.validateOnImport) {
        const validation = await this.validateImportedData(transformedData);
        validationErrors = validation.errors;
        validationWarnings = validation.warnings;
      }
      
      // Calculate quality score
      const qualityScore = this.calculateQualityScore(
        transformedData,
        [...errors, ...validationErrors],
        [...warnings, ...validationWarnings]
      );
      
      const processingTime = Date.now() - startTime;
      
      constresult: FileImportResult = {
        importId,
        fileName,
        fileSize: buffer.length,
        recordsFound: rawData.length,
        recordsImported: transformedData.length - errors.length,
        recordsSkipped: errors.length,
        errors: [...errors, ...validationErrors],
        warnings: [...warnings, ...validationWarnings],
        dataTypes: this.simplifyDataTypes(dataTypes),
        sampleData: transformedData.slice(0, 5),
        processingTime,
        qualityScore
      };
      
      this.emit('import_completed', { importId, result });
      
      return result;
      
    } catch (error: unknown) {
      this.emit('import_failed', { importId, error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    }
  }

  /**
   * Parse CSV/TSV files with advanced options
   */
  private async parseCSV(buffer: Buffer, options: FileImportOptions): Promise<any[]> {
    return new Promise((resolve, reject) => {
      constresults: any[] = [];
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);
      
      constcsvOptions: any = {
        separator: options.delimiter || (path.extname('file').toLowerCase() === '.tsv' ? '\t' : ','),
        headers: options.headers !== false,
        skipEmptyLines: true,
        skipLinesWithError: false
      };
      
      bufferStream
        .pipe(csv(csvOptions))
        .on('data', (data) => {
          if (options.skipRows && results.length < options.skipRows) {
            return;
          }
          if (options.maxRows && results.length >= options.maxRows) {
            return;
          }
          results.push(data);
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Parse Excel files with sheet detection
   */
  private async parseExcel(buffer: Buffer, options: FileImportOptions): Promise<any[]> {
    try {
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
      // Use first sheet or specified sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with proper options
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: options.headers !== false ? 1 : undefined,
        range: options.skipRows ? options.skipRows : undefined,
        defval: null,
        blankrows: false
      });
      
      // Apply row limit if specified
      return options.maxRows ? jsonData.slice(0, options.maxRows) : jsonData;
      
    } catch (error: unknown) {
      throw new Error(`Excel parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Parse JSON files with nested object flattening
   */
  private async parseJSON(buffer: Buffer, options: FileImportOptions): Promise<any[]> {
    try {
      const jsonString = buffer.toString(options.encoding || 'utf8');
      const jsonData = JSON.parse(jsonString);
      
      // Handle different JSON structures
      if (Array.isArray(jsonData)) {
        return jsonData;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        return jsonData.data;
      } else if (typeof jsonData === 'object') {
        // Flatten single object into array
        return [jsonData];
      } else {
        throw new Error('JSON file must contain an array of objects or an object with a data array');
      }
      
    } catch (error: unknown) {
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Parse XML files with flexible structure handling
   */
  private async parseXML(buffer: Buffer, options: FileImportOptions): Promise<any[]> {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        normalize: true,
        normalizeTags: true,
        trim: true
      });
      
      const xmlString = buffer.toString(options.encoding || 'utf8');
      const result = await parser.parseStringPromise(xmlString);
      
      // Extract records from common XML structures
      if (result.root && result.root.record) {
        return Array.isArray(result.root.record) ? result.root.record : [result.root.record];
      } else if (result.records && result.records.record) {
        return Array.isArray(result.records.record) ? result.records.record : [result.records.record];
      } else if (result.data) {
        return Array.isArray(result.data) ? result.data : [result.data];
      } else {
        // Fallback: extract all objects that look like records
        return this.extractRecordsFromXML(result);
      }
      
    } catch (error: unknown) {
      throw new Error(`XML parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private extractRecordsFromXML(xmlObj: any): any[] {
    constrecords: any[] = [];
    
    function traverse(obj: any) {
      if (typeof obj === 'object' && obj !== null) {
        // Check if this object looks like a record
        if (this.isRecordLike(obj)) {
          records.push(obj);
        } else {
          // Recursively search for records
          Object.values(obj).forEach(value => {
            if (Array.isArray(value)) {
              value.forEach(item => traverse(item));
            } else {
              traverse(value);
            }
          });
        }
      }
    }
    
    traverse(xmlObj);
    return records;
  }

  private isRecordLike(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) return false;
    
    const keys = Object.keys(obj);
    const recordIndicators = ['id', 'name', 'date', 'patient', 'resident', 'client'];
    
    return keys.length > 2 && recordIndicators.some(indicator => 
      keys.some(key => key.toLowerCase().includes(indicator))
    );
  }

  /**
   * Analyze data types for each field with AI-like intelligence
   */
  async analyzeDataTypes(data: any[]): Promise<DataTypeAnalysis[]> {
    if (!data || data.length === 0) return [];
    
    constfieldAnalysis: { [field: string]: DataTypeAnalysis } = {};
    const sampleSize = Math.min(data.length, 100);
    
    // Get all unique field names
    const allFields = new Set<string>();
    data.slice(0, sampleSize).forEach(record => {
      Object.keys(record).forEach(field => allFields.add(field));
    });
    
    // Analyze each field
    for (const field of allFields) {
      const values = data.slice(0, sampleSize)
        .map(record => record[field])
        .filter(value => value !== null && value !== undefined && value !== '');
      
      const analysis = await this.analyzeFieldType(field, values);
      fieldAnalysis[field] = analysis;
    }
    
    return Object.values(fieldAnalysis);
  }

  private async analyzeFieldType(fieldName: string, values: any[]): Promise<DataTypeAnalysis> {
    const fieldLower = fieldName.toLowerCase();
    const uniqueValues = new Set(values);
    const nullCount = values.length - values.filter(v => v !== null && v !== undefined && v !== '').length;
    
    // Pattern analysis
    constpatterns: string[] = [];
    letdetectedType: DataTypeAnalysis['detectedType'] = 'string';
    let confidence = 0.5;
    
    // NHS Number detection
    if (fieldLower.includes('nhs') || fieldLower.includes('national')) {
      const nhsPattern = /^\d{10}$/;
      const nhsMatches = values.filter(v => nhsPattern.test(String(v))).length;
      if (nhsMatches / values.length > 0.8) {
        detectedType = 'nhs_number';
        confidence = 0.95;
        patterns.push('NHS Number (10 digits)');
      }
    }
    
    // Date detection
    else if (fieldLower.includes('date') || fieldLower.includes('dob') || fieldLower.includes('birth')) {
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      ];
      
      let dateMatches = 0;
      for (const value of values) {
        if (datePatterns.some(pattern => pattern.test(String(value))) || !isNaN(Date.parse(String(value)))) {
          dateMatches++;
        }
      }
      
      if (dateMatches / values.length > 0.7) {
        detectedType = 'date';
        confidence = 0.9;
        patterns.push('Date format detected');
      }
    }
    
    // Phone number detection
    else if (fieldLower.includes('phone') || fieldLower.includes('tel') || fieldLower.includes('mobile')) {
      const phonePattern = /^(\+44|0)[0-9\s\-\(\)]{8,15}$/;
      const phoneMatches = values.filter(v => phonePattern.test(String(v))).length;
      if (phoneMatches / values.length > 0.6) {
        detectedType = 'phone';
        confidence = 0.85;
        patterns.push('UK phone number format');
      }
    }
    
    // Postcode detection
    else if (fieldLower.includes('postcode') || fieldLower.includes('postal') || fieldLower.includes('zip')) {
      const postcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
      const postcodeMatches = values.filter(v => postcodePattern.test(String(v))).length;
      if (postcodeMatches / values.length > 0.7) {
        detectedType = 'postcode';
        confidence = 0.9;
        patterns.push('UK postcode format');
      }
    }
    
    // Email detection
    else if (fieldLower.includes('email') || fieldLower.includes('mail')) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailMatches = values.filter(v => emailPattern.test(String(v))).length;
      if (emailMatches / values.length > 0.8) {
        detectedType = 'email';
        confidence = 0.9;
        patterns.push('Email address format');
      }
    }
    
    // Number detection
    else if (fieldLower.includes('amount') || fieldLower.includes('cost') || fieldLower.includes('price')) {
      const numberMatches = values.filter(v => !isNaN(parseFloat(String(v)))).length;
      if (numberMatches / values.length > 0.8) {
        detectedType = 'number';
        confidence = 0.85;
        patterns.push('Numeric values');
      }
    }
    
    // Boolean detection
    else if (values.every(v => ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(String(v).toLowerCase()))) {
      detectedType = 'boolean';
      confidence = 0.95;
      patterns.push('Boolean values');
    }
    
    return {
      field: fieldName,
      detectedType,
      confidence,
      samples: values.slice(0, 5),
      nullCount,
      uniqueCount: uniqueValues.size,
      patterns
    };
  }

  /**
   * Apply transformations to imported data
   */
  private async applyTransformations(
    data: any[], 
    rules: TransformationRule[], 
    dataTypes: DataTypeAnalysis[]
  ): Promise<{ transformedData: any[]; errors: ImportError[]; warnings: ImportWarning[] }> {
    consttransformedData: any[] = [];
    consterrors: ImportError[] = [];
    constwarnings: ImportWarning[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      consttransformedRecord: any = { ...record };
      
      // Apply transformation rules
      for (const rule of rules) {
        if (record[rule.field] !== undefined && record[rule.field] !== null && record[rule.field] !== '') {
          try {
            transformedRecord[rule.field] = await this.applyTransformation(record[rule.field], rule);
          } catch (error: unknown) {
            errors.push({
              row: i + 1,
              column: rule.field,
              value: record[rule.field],
              error: error instanceof Error ? error.message : "Unknown error",
              severity: 'medium',
              suggestion: `Check ${rule.type} format for field ${rule.field}`,
              autoFixable: rule.type !== 'custom'
            });
          }
        }
      }
      
      // Apply automatic transformations based on detected types
      for (const typeAnalysis of dataTypes) {
        if (record[typeAnalysis.field] !== undefined && typeAnalysis.confidence > 0.8) {
          try {
            const transformed = await this.applyAutoTransformation(
              record[typeAnalysis.field], 
              typeAnalysis.detectedType
            );
            
            if (transformed !== record[typeAnalysis.field]) {
              transformedRecord[typeAnalysis.field] = transformed;
              warnings.push({
                row: i + 1,
                column: typeAnalysis.field,
                value: record[typeAnalysis.field],
                warning: `Auto-transformed ${typeAnalysis.detectedType}`,
                suggestion: 'Verify transformation is correct',
                autoFixed: true
              });
            }
          } catch (error: unknown) {
            // Non-critical transformation errors become warnings
            warnings.push({
              row: i + 1,
              column: typeAnalysis.field,
              value: record[typeAnalysis.field],
              warning: `Auto-transformation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
              suggestion: 'Manual review recommended',
              autoFixed: false
            });
          }
        }
      }
      
      transformedData.push(transformedRecord);
    }
    
    return { transformedData, errors, warnings };
  }

  private async applyTransformation(value: any, rule: TransformationRule): Promise<any> {
    switch (rule.type) {
      case 'date':
        return this.transformDate(value, rule.format);
      case 'number':
        return this.transformNumber(value);
      case 'phone':
        return this.transformPhone(value);
      case 'postcode':
        return this.transformPostcode(value);
      case 'nhs_number':
        return this.transformNHSNumber(value);
      case 'medication':
        return this.transformMedication(value);
      case 'custom':
        return rule.customFunction ? rule.customFunction(value) : value;
      default:
        return value;
    }
  }

  private async applyAutoTransformation(value: any, type: DataTypeAnalysis['detectedType']): Promise<any> {
    switch (type) {
      case 'date':
        return this.transformDate(value);
      case 'number':
        return this.transformNumber(value);
      case 'phone':
        return this.transformPhone(value);
      case 'postcode':
        return this.transformPostcode(value);
      case 'nhs_number':
        return this.transformNHSNumber(value);
      case 'email':
        return String(value).toLowerCase().trim();
      case 'boolean':
        return this.transformBoolean(value);
      default:
        return value;
    }
  }

  // Transformation methods

  private transformDate(value: any, format?: string): Date {
    if (value instanceof Date) return value;
    
    const dateStr = String(value).trim();
    
    // Try parsing with specified format first
    if (format) {
      const parsed = this.parseDateWithFormat(dateStr, format);
      if (parsed) return parsed;
    }
    
    // Try common UK date formats
    const ukDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ukMatch = dateStr.match(ukDateRegex);
    if (ukMatch) {
      const day = parseInt(ukMatch[1]);
      const month = parseInt(ukMatch[2]);
      const year = parseInt(ukMatch[3]);
      return new Date(year, month - 1, day);
    }
    
    // Try ISO format
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    
    throw new Error(`Unable to parse date: ${value}`);
  }

  private parseDateWithFormat(dateStr: string, format: string): Date | null {
    // Simple format parsing - in production would use a proper date library
    if (format === 'DD/MM/YYYY') {
      const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (match) {
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
    return null;
  }

  private transformNumber(value: any): number {
    const numStr = String(value).replace(/[£$,\s]/g, '');
    const num = parseFloat(numStr);
    
    if (isNaN(num)) {
      throw new Error(`Invalid number format: ${value}`);
    }
    
    return num;
  }

  private transformPhone(value: any): string {
    let phone = String(value).replace(/[\s\-\(\)]/g, '');
    
    // Handle UK phone numbers
    if (phone.startsWith('0')) {
      phone = '+44' + phone.substring(1);
    } else if (phone.startsWith('44')) {
      phone = '+' + phone;
    } else if (!phone.startsWith('+')) {
      phone = '+44' + phone;
    }
    
    // Validate UK phone number format
    if (!/^\+44[0-9]{10}$/.test(phone)) {
      throw new Error(`Invalid UK phone number format: ${value}`);
    }
    
    return phone;
  }

  private transformPostcode(value: any): string {
    const postcode = String(value).toUpperCase().replace(/\s+/g, ' ').trim();
    
    // UK postcode validation
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/;
    if (!ukPostcodeRegex.test(postcode)) {
      throw new Error(`Invalid UK postcode format: ${value}`);
    }
    
    // Ensure proper spacing
    if (!postcode.includes(' ')) {
      return postcode.slice(0, -3) + ' ' + postcode.slice(-3);
    }
    
    return postcode;
  }

  private transformNHSNumber(value: any): string {
    const nhsNumber = String(value).replace(/\s/g, '');
    
    if (!/^\d{10}$/.test(nhsNumber)) {
      throw new Error(`NHS number must be 10 digits: ${value}`);
    }
    
    // Validate check digit
    const digits = nhsNumber.split('').map(Number);
    const checkDigit = digits[9];
    const sum = digits.slice(0, 9).reduce((acc, digit, index) => acc + digit * (10 - index), 0);
    const remainder = sum % 11;
    const expectedCheckDigit = remainder === 0 ? 0 : 11 - remainder;
    
    if (expectedCheckDigit !== checkDigit && expectedCheckDigit !== 11) {
      throw new Error(`Invalid NHS number check digit: ${value}`);
    }
    
    return nhsNumber;
  }

  private transformMedication(value: any): any[] {
    const medicationStr = String(value);
    
    if (!medicationStr || medicationStr.toLowerCase() === 'none') {
      return [];
    }
    
    // Parse medication string into structured format
    const medications = medicationStr.split(/[;,]/).map(med => {
      const trimmed = med.trim();
      const parts = trimmed.split(/\s+/);
      
      // Extract medication name (usually first part)
      const name = parts[0];
      
      // Extract dosage (look for number + unit pattern)
      const dosageMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units?)/i);
      const dosage = dosageMatch ? `${dosageMatch[1]}${dosageMatch[2]}` : '';
      
      // Extract frequency (common abbreviations)
      const frequencyMatch = trimmed.match(/\b(OD|BD|TDS|QDS|PRN|ON|morning|evening|daily|twice.*day)\b/i);
      const frequency = frequencyMatch ? frequencyMatch[1] : 'As directed';
      
      return {
        name,
        dosage,
        frequency,
        route: 'Oral',
        active: true,
        prescriber: 'GP'
      };
    }).filter(med => med.name && med.name !== '');
    
    return medications;
  }

  private transformBoolean(value: any): boolean {
    const strValue = String(value).toLowerCase().trim();
    const truthyValues = ['true', '1', 'yes', 'y', 'on', 'enabled'];
    return truthyValues.includes(strValue);
  }

  /**
   * Validate imported data against healthcare standards
   */
  private async validateImportedData(data: any[]): Promise<{ errors: ImportError[]; warnings: ImportWarning[] }> {
    consterrors: ImportError[] = [];
    constwarnings: ImportWarning[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      // Required field validation
      if (!record.resident_id && !record.patient_id && !record.id) {
        errors.push({
          row: i + 1,
          column: 'identifier',
          value: null,
          error: 'Missing required identifier field',
          severity: 'high',
          suggestion: 'Provide a unique ID for each record',
          autoFixable: false
        });
      }
      
      // Age validation
      if (record.date_of_birth) {
        try {
          const dob = new Date(record.date_of_birth);
          const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          
          if (age < 0) {
            errors.push({
              row: i + 1,
              column: 'date_of_birth',
              value: record.date_of_birth,
              error: 'Birth date cannot be in the future',
              severity: 'high',
              suggestion: 'Check date format and value',
              autoFixable: false
            });
          } else if (age > 120) {
            warnings.push({
              row: i + 1,
              column: 'date_of_birth',
              value: record.date_of_birth,
              warning: 'Age over 120 years',
              suggestion: 'Verify birth date accuracy',
              autoFixed: false
            });
          } else if (age < 18) {
            warnings.push({
              row: i + 1,
              column: 'date_of_birth',
              value: record.date_of_birth,
              warning: 'Age under 18 - adult care system',
              suggestion: 'Verify this is appropriate for adult care',
              autoFixed: false
            });
          }
        } catch (error: unknown) {
          errors.push({
            row: i + 1,
            column: 'date_of_birth',
            value: record.date_of_birth,
            error: 'Invalid date format',
            severity: 'medium',
            suggestion: 'Use YYYY-MM-DD format',
            autoFixable: true
          });
        }
      }
      
      // Medication validation
      if (record.current_medications && Array.isArray(record.current_medications)) {
        for (const medication of record.current_medications) {
          if (!medication.name) {
            warnings.push({
              row: i + 1,
              column: 'current_medications',
              value: medication,
              warning: 'Medication missing name',
              suggestion: 'Ensure all medications have names',
              autoFixed: false
            });
          }
        }
      }
      
      // Care level validation
      if (record.care_level) {
        const validCareLevels = ['low dependency', 'medium dependency', 'high dependency', 'nursing care'];
        if (!validCareLevels.some(level => 
          level.toLowerCase() === String(record.care_level).toLowerCase()
        )) {
          warnings.push({
            row: i + 1,
            column: 'care_level',
            value: record.care_level,
            warning: 'Non-standard care level',
            suggestion: 'Use: Low/Medium/High dependency or Nursing care',
            autoFixed: false
          });
        }
      }
    }
    
    return { errors, warnings };
  }

  /**
   * Calculate overall data quality score
   */
  private calculateQualityScore(data: any[], errors: ImportError[], warnings: ImportWarning[]): number {
    if (data.length === 0) return 0;
    
    let score = 100;
    
    // Deduct points for errors
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const highErrors = errors.filter(e => e.severity === 'high').length;
    const mediumErrors = errors.filter(e => e.severity === 'medium').length;
    const lowErrors = errors.filter(e => e.severity === 'low').length;
    
    score -= criticalErrors * 10;
    score -= highErrors * 5;
    score -= mediumErrors * 2;
    score -= lowErrors * 1;
    
    // Deduct points for warnings
    score -= warnings.length * 0.5;
    
    // Bonus for completeness
    const firstRecord = data[0] || {};
    const fieldCount = Object.keys(firstRecord).length;
    const completenessBonus = Math.min(fieldCount * 2, 10);
    score += completenessBonus;
    
    return Math.max(Math.min(score, 100), 0);
  }

  private simplifyDataTypes(dataTypes: DataTypeAnalysis[]): { [field: string]: string } {
    constsimplified: { [field: string]: string } = {};
    
    for (const analysis of dataTypes) {
      simplified[analysis.field] = analysis.detectedType;
    }
    
    return simplified;
  }

  private validateFile(buffer: Buffer, fileName: string): void {
    // File size validation
    if (buffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
    }
    
    // File format validation
    const extension = path.extname(fileName).toLowerCase();
    if (!this.supportedFormats.includes(extension)) {
      throw new Error(`Unsupported file format: ${extension}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }
    
    // Empty file validation
    if (buffer.length === 0) {
      throw new Error('File is empty');
    }
  }

  /**
   * Generate sample data for testing different file formats
   */
  generateSampleData(format: 'csv' | 'excel' | 'json' | 'xml', recordCount: number = 50): any {
    const sampleRecords = this.generateSampleRecords(recordCount);
    
    switch (format) {
      case 'csv':
        return this.convertToCSV(sampleRecords);
      case 'excel':
        return this.convertToExcel(sampleRecords);
      case 'json':
        return JSON.stringify(sampleRecords, null, 2);
      case 'xml':
        return this.convertToXML(sampleRecords);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private generateSampleRecords(count: number): any[] {
    const records = [];
    const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'James', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const careLevels = ['Low dependency', 'Medium dependency', 'High dependency', 'Nursing care'];
    const medications = [
      'Paracetamol 1g QDS PRN',
      'Aspirin 75mg OD',
      'Simvastatin 20mg ON',
      'Amlodipine 5mg OD',
      'Metformin 500mg BD',
      'Warfarin 3mg OD',
      'Furosemide 40mg OD'
    ];
    
    for (let i = 1; i <= count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const birthYear = 1930 + Math.floor(Math.random() * 25);
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;
      
      records.push({
        PatientID: `P${String(i).padStart(3, '0')}`,
        FirstName: firstName,
        LastName: lastName,
        FullName: `${firstName} ${lastName}`,
        DateOfBirth: `${String(birthDay).padStart(2, '0')}/${String(birthMonth).padStart(2, '0')}/${birthYear}`,
        Age: new Date().getFullYear() - birthYear,
        Gender: Math.random() > 0.5 ? 'Male' : 'Female',
        Address: `${Math.floor(Math.random() * 999) + 1} Sample Street, ${['Manchester', 'Birmingham', 'Leeds', 'Liverpool'][Math.floor(Math.random() * 4)]}`,
        Postcode: `M${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 9) + 1}AA`,
        PhoneNumber: `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000) + 10000000}`,
        NHSNumber: this.generateValidNHSNumber(),
        GPName: `Dr. ${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        CareLevel: careLevels[Math.floor(Math.random() * careLevels.length)],
        CurrentMedications: medications.slice(0, Math.floor(Math.random() * 3) + 1).join('; '),
        Allergies: Math.random() > 0.7 ? 'Penicillin' : 'None known',
        AdmissionDate: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/2024`,
        RoomNumber: `${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
        NextOfKin: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName} (${['Son', 'Daughter', 'Spouse', 'Sibling'][Math.floor(Math.random() * 4)]}) - 07700${Math.floor(Math.random() * 900000) + 100000}`
      });
    }
    
    return records;
  }

  private generateValidNHSNumber(): string {
    // Generate a valid NHS number with correct check digit
    const digits = [];
    for (let i = 0; i < 9; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }
    
    // Calculate check digit
    const sum = digits.reduce((acc, digit, index) => acc + digit * (10 - index), 0);
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;
    
    if (checkDigit === 11) {
      // Regenerate if check digit would be 11
      return this.generateValidNHSNumber();
    }
    
    digits.push(checkDigit);
    return digits.join('');
  }

  private convertToCSV(records: any[]): string {
    if (records.length === 0) return '';
    
    const headers = Object.keys(records[0]);
    const csvLines = [headers.join(',')];
    
    for (const record of records) {
      const values = headers.map(header => {
        const value = record[header];
        const stringValue = String(value || '');
        // Escape commas and quotes
        return stringValue.includes(',') || stringValue.includes('"') ? 
          `"${stringValue.replace(/"/g, '""')}"` : stringValue;
      });
      csvLines.push(values.join(','));
    }
    
    return csvLines.join('\n');
  }

  private convertToExcel(records: any[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Residents');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private convertToXML(records: any[]): string {
    const builder = new xml2js.Builder({
      rootName: 'ResidentData',
      headless: false,
      renderOpts: { pretty: true }
    });
    
    return builder.buildObject({ record: records });
  }

  /**
   * Clean up temporary files
   */
  async cleanup(): Promise<void> {
    try {
      const files = fs.readdirSync(this.tempDirectory);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.tempDirectory, file);
        const stats = fs.statSync(filePath);
        
        // Delete files older than 1 hour
        if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error: unknown) {
      console.error('Cleanup failed:', error);
    }
  }
}

export default FileImportService;
