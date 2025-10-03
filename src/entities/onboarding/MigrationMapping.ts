import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Migration Mapping Entity for Onboarding Data Migration
 * @module MigrationMapping
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../BaseEntity';
import { DataMigration } from './DataMigration';

export interface TransformationRules {
  type: 'direct' | 'calculated' | 'lookup' | 'conditional' | 'concatenate' | 'split' | 'format' | 'validate';
  formula?: string;
  lookupTable?: string;
  lookupKey?: string;
  lookupValue?: string;
  conditions?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with';
    value: any;
    thenValue: any;
    elseValue?: any;
  }[];
  concatenateFields?: string[];
  separator?: string;
  splitField?: string;
  splitDelimiter?: string;
  formatPattern?: string;
  validationRules?: {
    type: 'required' | 'email' | 'phone' | 'date' | 'number' | 'regex' | 'range' | 'length';
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  }[];
}

export interface DataTypeMapping {
  sourceType: string;
  targetType: string;
  precision?: number;
  scale?: number;
  length?: number;
  nullable: boolean;
  defaultValue?: any;
  constraints?: {
    unique?: boolean;
    primaryKey?: boolean;
    foreignKey?: {
      table: string;
      column: string;
    };
    check?: string;
  };
}

@Entity('migration_mappings')
export class MigrationMapping extends BaseEntity {
  @Column({ type: 'uuid' })
  migrationId!: string;

  @Column({ type: 'varchar', length: 100 })
  sourceField!: string;

  @Column({ type: 'varchar', length: 100 })
  targetField!: string;

  @Column({ type: 'varchar', length: 50 })
  sourceTable!: string;

  @Column({ type: 'varchar', length: 50 })
  targetTable!: string;

  @Column({ type: 'jsonb' })
  dataTypeMapping!: DataTypeMapping;

  @Column({ type: 'jsonb' })
  transformationRules!: TransformationRules;

  @Column({ type: 'boolean', default: true })
  isRequired!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  defaultValue?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'integer', default: 0 })
  mappingOrder!: number;

  @Column({ type: 'boolean', default: false })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validationResults?: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    errors: {
      recordId: string;
      error: string;
      value: any;
    }[];
    warnings: {
      recordId: string;
      warning: string;
      value: any;
    }[];
  };

  @Column({ type: 'jsonb', nullable: true })
  transformationResults?: {
    totalTransformations: number;
    successfulTransformations: number;
    failedTransformations: number;
    transformationErrors: {
      recordId: string;
      error: string;
      originalValue: any;
      transformedValue?: any;
    }[];
  };

  @Column({ type: 'varchar', length: 50, nullable: true })
  sourceDataType?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetDataType?: string;

  @Column({ type: 'boolean', default: false })
  allowNulls!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customValidationFunction?: string;

  @Column({ type: 'jsonb', nullable: true })
  businessRules?: {
    ruleName: string;
    ruleDescription: string;
    ruleType: 'validation' | 'transformation' | 'calculation';
    ruleExpression: string;
    errorMessage: string;
    severity: 'error' | 'warning' | 'info';
  }[];

  @Column({ type: 'jsonb', nullable: true })
  lookupData?: {
    lookupTable: string;
    lookupKey: string;
    lookupValue: string;
    cacheResults: boolean;
    fallbackValue?: any;
  };

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  // Relationships
  @ManyToOne(() => DataMigration, migration => migration.mappings)
  @JoinColumn({ name: 'migrationId' })
  migration!: DataMigration;

  // Business Logic Methods
  validateValue(value: any): { isValid: boolean; error?: string; warning?: string } {
    // Check if value is required
    if (this.isRequired && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: `Field ${this.targetField} is required` };
    }

    // Check if nulls are allowed
    if (!this.allowNulls && (value === null || value === undefined)) {
      return { isValid: false, error: `Field ${this.targetField} does not allow null values` };
    }

    // Apply validation rules
    if (this.transformationRules.validationRules) {
      for (const rule of this.transformationRules.validationRules) {
        const validationResult = this.applyValidationRule(value, rule);
        if (!validationResult.isValid) {
          return validationResult;
        }
      }
    }

    // Apply business rules
    if (this.businessRules) {
      for (const rule of this.businessRules) {
        const ruleResult = this.applyBusinessRule(value, rule);
        if (!ruleResult.isValid) {
          return ruleResult;
        }
      }
    }

    return { isValid: true };
  }

  private applyValidationRule(value: any, rule: any): { isValid: boolean; error?: string; warning?: string } {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return { isValid: false, error: rule.message || 'Field is required' };
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          return { isValid: false, error: rule.message || 'Invalid email format' };
        }
        break;

      case 'phone':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (value && !phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return { isValid: false, error: rule.message || 'Invalid phone format' };
        }
        break;

      case 'date':
        if (value && isNaN(Date.parse(value))) {
          return { isValid: false, error: rule.message || 'Invalid date format' };
        }
        break;

      case 'number':
        if (value && isNaN(Number(value))) {
          return { isValid: false, error: rule.message || 'Invalid number format' };
        }
        break;

      case 'regex':
        if (value && rule.pattern && !new RegExp(rule.pattern).test(value)) {
          return { isValid: false, error: rule.message || 'Value does not match required pattern' };
        }
        break;

      case 'range':
        const numValue = Number(value);
        if (value && (numValue < rule.min || numValue > rule.max)) {
          return { isValid: false, error: rule.message || `Value must be between ${rule.min} and ${rule.max}` };
        }
        break;

      case 'length':
        if (value && (value.length < rule.min || value.length > rule.max)) {
          return { isValid: false, error: rule.message || `Length must be between ${rule.min} and ${rule.max}` };
        }
        break;
    }

    return { isValid: true };
  }

  private applyBusinessRule(value: any, rule: any): { isValid: boolean; error?: string; warning?: string } {
    try {
      // Simple business rule evaluation (in production, use a proper rule engine)
      const result = this.evaluateExpression(rule.ruleExpression, { value });
      
      if (!result) {
        return {
          isValid: rule.severity === 'error',
          error: rule.severity === 'error' ? rule.errorMessage : undefined,
          warning: rule.severity === 'warning' ? rule.errorMessage : undefined
        };
      }
    } catch (error: unknown) {
      return { isValid: false, error: `Business rule evaluation failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}` };
    }

    return { isValid: true };
  }

  private evaluateExpression(expression: string, context: any): boolean {
    // Simple expression evaluator (in production, use a proper expression engine)
    try {
      // Replace variables with context values
      let evalExpression = expression;
      for (const [key, value] of Object.entries(context)) {
        evalExpression = evalExpression.replace(new RegExp(`\\b${key}\\b`, 'g'), JSON.stringify(value));
      }

      // Evaluate the expression
      return Boolean(eval(evalExpression));
    } catch (error: unknown) {
      throw new Error(`Expression evaluation failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  transformValue(value: any, context?: any): { transformedValue: any; error?: string } {
    try {
      let transformedValue = value;

      // Apply transformation rules
      switch (this.transformationRules.type) {
        case 'direct':
          // No transformation needed
          break;

        case 'calculated':
          if (this.transformationRules.formula) {
            transformedValue = this.evaluateFormula(this.transformationRules.formula, { value, ...context });
          }
          break;

        case 'lookup':
          if (this.lookupData) {
            transformedValue = this.performLookup(value, this.lookupData);
          }
          break;

        case 'conditional':
          if (this.transformationRules.conditions) {
            transformedValue = this.applyConditionalTransformation(value, this.transformationRules.conditions, context);
          }
          break;

        case 'concatenate':
          if (this.transformationRules.concatenateFields && context) {
            const values = this.transformationRules.concatenateFields.map(field => context[field] || '');
            transformedValue = values.join(this.transformationRules.separator || ' ');
          }
          break;

        case 'split':
          if (this.transformationRules.splitField && this.transformationRules.splitDelimiter) {
            const splitValue = context?.[this.transformationRules.splitField] || value;
            transformedValue = splitValue.split(this.transformationRules.splitDelimiter);
          }
          break;

        case 'format':
          if (this.transformationRules.formatPattern) {
            transformedValue = this.formatValue(value, this.transformationRules.formatPattern);
          }
          break;

        case 'validate':
          const validation = this.validateValue(value);
          if (!validation.isValid) {
            return { transformedValue: null, error: validation.error };
          }
          break;
      }

      // Apply data type conversion
      transformedValue = this.convertDataType(transformedValue, this.dataTypeMapping.targetType);

      return { transformedValue };
    } catch (error: unknown) {
      return { transformedValue: null, error: `Transformation failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}` };
    }
  }

  private evaluateFormula(formula: string, context: any): any {
    try {
      // Replace variables with context values
      let evalFormula = formula;
      for (const [key, value] of Object.entries(context)) {
        evalFormula = evalFormula.replace(new RegExp(`\\b${key}\\b`, 'g'), JSON.stringify(value));
      }

      // Evaluate the formula
      return eval(evalFormula);
    } catch (error: unknown) {
      throw new Error(`Formula evaluation failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`);
    }
  }

  private performLookup(value: any, lookupData: any): any {
    // In production, this would query the lookup table
    // For now, return a mock lookup result
    return lookupData.fallbackValue || value;
  }

  private applyConditionalTransformation(value: any, conditions: any[], context: any): any {
    for (const condition of conditions) {
      const fieldValue = context?.[condition.field] || value;
      const conditionMet = this.evaluateCondition(fieldValue, condition.operator, condition.value);
      
      if (conditionMet) {
        return condition.thenValue;
      }
    }
    
    // Return else value if provided, otherwise return original value
    return conditions[0]?.elseValue || value;
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue);
      case 'contains':
        return String(fieldValue).includes(String(expectedValue));
      case 'starts_with':
        return String(fieldValue).startsWith(String(expectedValue));
      case 'ends_with':
        return String(fieldValue).endsWith(String(expectedValue));
      default:
        return false;
    }
  }

  private formatValue(value: any, pattern: string): string {
    // Simple formatting (in production, use a proper formatting library)
    switch (pattern) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'title_case':
        return String(value).replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      case 'phone_format':
        const phone = String(value).replace(/\D/g, '');
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      case 'date_format':
        return new Date(value).toLocaleDateString();
      default:
        return String(value);
    }
  }

  private convertDataType(value: any, targetType: string): any {
    if (value === null || value === undefined) {
      return this.dataTypeMapping.defaultValue || null;
    }

    switch (targetType.toLowerCase()) {
      case 'string':
      case 'varchar':
      case 'text':
        return String(value);
      case 'integer':
      case 'int':
        return parseInt(String(value), 10);
      case 'decimal':
      case 'float':
      case 'double':
        return parseFloat(String(value));
      case 'boolean':
        return Boolean(value);
      case 'date':
      case 'datetime':
      case 'timestamp':
        return new Date(value);
      case 'json':
      case 'jsonb':
        return typeof value === 'string' ? JSON.parse(value) : value;
      default:
        return value;
    }
  }

  updateValidationResults(results: any): void {
    this.validationResults = results;
  }

  updateTransformationResults(results: any): void {
    this.transformationResults = results;
  }

  getMappingSummary(): any {
    return {
      id: this.id,
      sourceField: this.sourceField,
      targetField: this.targetField,
      sourceTable: this.sourceTable,
      targetTable: this.targetTable,
      transformationType: this.transformationRules.type,
      isRequired: this.isRequired,
      isActive: this.isActive,
      validationResults: this.validationResults,
      transformationResults: this.transformationResults
    };
  }
}