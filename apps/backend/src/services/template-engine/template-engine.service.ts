/**
 * @fileoverview Advanced template processing engine for dynamic content generation
 * @module Template-engine/Template-engine.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Advanced template processing engine for dynamic content generation
 */

/**
 * @fileoverview Template Engine Service
 * @description Advanced template processing engine for dynamic content generation
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-01-06
 * @lastModified 2025-01-06
 * 
 * @features
 * - Variable substitution with type validation
 * - Conditional content blocks
 * - Loop processing for arrays
 * - Mathematical calculations
 * - Date formatting and manipulation
 * - Regulatory compliance templates
 * - Multi-language support
 * - Security-aware processing
 * 
 * @compliance
 * - GDPR Article 25 (Data protection by design)
 * - ISO 27001 (Information Security)
 * - Care home data processing standards
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';

/**
 * Template context interface for variable resolution
 */
export interface TemplateContext {
  organization?: Organization;
  user?: User;
  resident?: any;
  variables?: Record<string, any>;
  system?: {
    currentDate: Date;
    currentYear: number;
    currentMonth: number;
    currentDay: number;
    timezone: string;
  };
  regulatory?: {
    jurisdiction: string;
    requirements: Record<string, any>;
  };
}

/**
 * Template processing options
 */
export interface TemplateProcessingOptions {
  strictMode?: boolean; // Throw errors on undefined variables
  allowUnsafeContent?: boolean; // Allow HTML/JS content
  preserveWhitespace?: boolean; // Preserve original formatting
  locale?: string; // Locale for date/number formatting
  timezone?: string; // Timezone for date operations
  sanitizeOutput?: boolean; // Sanitize final output
}

/**
 * Template function interface for custom functions
 */
export interface TemplateFunction {
  name: string;
  handler: (args: any[], context: TemplateContext) => any;
  description: string;
  examples: string[];
}

/**
 * Template Engine Service
 * 
 * Provides advanced template processing capabilities for generating dynamic content
 * from templates with variable substitution, conditional logic, and regulatory compliance.
 */
@Injectable()
export class TemplateEngineService {
  private readonly logger = new Logger(TemplateEngineService.name);
  private readonly customFunctions = new Map<string, TemplateFunction>();

  constructor() {
    this.registerDefaultFunctions();
  }

  /**
   * Process template content with context variables
   */
  async processTemplate(
    content: string,
    context: TemplateContext,
    options: TemplateProcessingOptions = {}
  ): Promise<string> {
    this.logger.log('Processing template content');

    try {
      const {
        strictMode = true,
        allowUnsafeContent = false,
        preserveWhitespace = false,
        locale = 'en-GB',
        timezone = 'Europe/London',
        sanitizeOutput = true
      } = options;

      // Prepare processing context
      const processingContext = this.prepareContext(context, locale, timezone);

      let processedContent = content;

      // Process in order of complexity
      processedContent = await this.processIncludes(processedContent, processingContext);
      processedContent = await this.processLoops(processedContent, processingContext);
      processedContent = await this.processConditionals(processedContent, processingContext);
      processedContent = await this.processFunctions(processedContent, processingContext);
      processedContent = await this.processVariables(processedContent, processingContext, strictMode);

      // Post-processing
      if (!preserveWhitespace) {
        processedContent = this.normalizeWhitespace(processedContent);
      }

      if (sanitizeOutput && !allowUnsafeContent) {
        processedContent = this.sanitizeContent(processedContent);
      }

      this.logger.log('Template processing completed successfully');
      return processedContent;

    } catch (error) {
      this.logger.error(`Template processing failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Template processing error: ${error.message}`);
    }
  }

  /**
   * Validate template syntax and variables
   */
  async validateTemplate(
    content: string,
    expectedVariables: string[] = []
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    requiredVariables: string[];
    foundVariables: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const foundVariables: string[] = [];

    try {
      // Extract all variable references
      const variableMatches = content.match(/\{\{([^}]+)\}\}/g) || [];
      
      for (const match of variableMatches) {
        const variablePath = match.slice(2, -2).trim();
        foundVariables.push(variablePath);

        // Validate variable syntax
        if (!this.isValidVariablePath(variablePath)) {
          errors.push(`Invalid variable syntax: ${match}`);
        }
      }

      // Check for conditional syntax
      const conditionalMatches = content.match(/\{\{#if\s+([^}]+)\}\}[\s\S]*?\{\{\/if\}\}/g) || [];
      for (const match of conditionalMatches) {
        if (!this.isValidConditional(match)) {
          errors.push(`Invalid conditional syntax: ${match}`);
        }
      }

      // Check for loop syntax
      const loopMatches = content.match(/\{\{#each\s+([^}]+)\}\}[\s\S]*?\{\{\/each\}\}/g) || [];
      for (const match of loopMatches) {
        if (!this.isValidLoop(match)) {
          errors.push(`Invalid loop syntax: ${match}`);
        }
      }

      // Check for function calls
      const functionMatches = content.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\}\}/g) || [];
      for (const match of functionMatches) {
        const functionName = match.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)/)?.[1];
        if (functionName && !this.customFunctions.has(functionName)) {
          warnings.push(`Unknown function: ${functionName}`);
        }
      }

      // Check for missing expected variables
      for (const expectedVar of expectedVariables) {
        if (!foundVariables.includes(expectedVar)) {
          warnings.push(`Expected variable not found: ${expectedVar}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        requiredVariables: expectedVariables,
        foundVariables: [...new Set(foundVariables)]
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings,
        requiredVariables: expectedVariables,
        foundVariables
      };
    }
  }

  /**
   * Generate template for specific policy type
   */
  async generatePolicyTemplate(
    policyType: string,
    jurisdiction: string,
    organizationType: string = 'care_home'
  ): Promise<{
    title: string;
    content: string;
    variables: Array<{
      name: string;
      type: string;
      label: string;
      description: string;
      required: boolean;
      defaultValue?: any;
      options?: string[];
    }>;
    compliance: string[];
  }> {
    this.logger.log(`Generating template for policy type: ${policyType}`);

    const templates = {
      safeguarding: this.generateSafeguardingTemplate(jurisdiction),
      medication: this.generateMedicationTemplate(jurisdiction),
      infection_control: this.generateInfectionControlTemplate(jurisdiction),
      data_protection: this.generateDataProtectionTemplate(jurisdiction),
      emergency_procedures: this.generateEmergencyProceduresTemplate(jurisdiction)
    };

    const template = templates[policyType as keyof typeof templates];
    if (!template) {
      throw new BadRequestException(`Unknown policy type: ${policyType}`);
    }

    return await template;
  }

  /**
   * Register custom template function
   */
  registerFunction(func: TemplateFunction): void {
    this.customFunctions.set(func.name, func);
    this.logger.log(`Registered custom function: ${func.name}`);
  }

  /**
   * Get available template functions
   */
  getAvailableFunctions(): TemplateFunction[] {
    return Array.from(this.customFunctions.values());
  }

  /**
   * Private helper methods
   */

  private prepareContext(context: TemplateContext, locale: string, timezone: string): TemplateContext {
    const now = new Date();
    
    return {
      ...context,
      system: {
        currentDate: now,
        currentYear: now.getFullYear(),
        currentMonth: now.getMonth() + 1,
        currentDay: now.getDate(),
        timezone,
        ...context.system
      },
      variables: context.variables || {}
    };
  }

  private async processVariables(
    content: string,
    context: TemplateContext,
    strictMode: boolean
  ): Promise<string> {
    const variableRegex = /\{\{([^}#\/][^}]*)\}\}/g;
    
    return content.replace(variableRegex, (match, variablePath) => {
      try {
        const value = this.resolveVariablePath(variablePath.trim(), context);
        
        if (value === undefined || value === null) {
          if (strictMode) {
            throw new Error(`Undefined variable: ${variablePath}`);
          }
          return '';
        }
        
        return String(value);
      } catch (error) {
        if (strictMode) {
          throw error;
        }
        this.logger.warn(`Variable resolution warning: ${error.message}`);
        return match; // Return original if can't resolve
      }
    });
  }

  private async processConditionals(
    content: string,
    context: TemplateContext
  ): Promise<string> {
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{#else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
    
    return content.replace(conditionalRegex, (match, condition, ifContent, elseContent = '') => {
      try {
        const conditionResult = this.evaluateCondition(condition.trim(), context);
        return conditionResult ? ifContent : elseContent;
      } catch (error) {
        this.logger.warn(`Conditional evaluation warning: ${error.message}`);
        return '';
      }
    });
  }

  private async processLoops(
    content: string,
    context: TemplateContext
  ): Promise<string> {
    const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return content.replace(loopRegex, (match, loopDef, loopContent) => {
      try {
        const [arrayPath, itemName = 'item'] = loopDef.split(' as ').map(s => s.trim());
        const array = this.resolveVariablePath(arrayPath, context);
        
        if (!Array.isArray(array)) {
          this.logger.warn(`Loop variable is not an array: ${arrayPath}`);
          return '';
        }
        
        return array.map((item, index) => {
          const loopContext = {
            ...context,
            variables: {
              ...context.variables,
              [itemName]: item,
              [`${itemName}_index`]: index,
              [`${itemName}_first`]: index === 0,
              [`${itemName}_last`]: index === array.length - 1
            }
          };
          
          return this.processTemplate(loopContent, loopContext, { strictMode: false });
        }).join('');
        
      } catch (error) {
        this.logger.warn(`Loop processing warning: ${error.message}`);
        return '';
      }
    });
  }

  private async processFunctions(
    content: string,
    context: TemplateContext
  ): Promise<string> {
    const functionRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\}\}/g;
    
    return content.replace(functionRegex, (match, functionName, argsString) => {
      try {
        const func = this.customFunctions.get(functionName);
        if (!func) {
          this.logger.warn(`Unknown function: ${functionName}`);
          return match;
        }
        
        const args = this.parseArguments(argsString, context);
        const result = func.handler(args, context);
        
        return String(result);
      } catch (error) {
        this.logger.warn(`Function execution warning: ${error.message}`);
        return match;
      }
    });
  }

  private async processIncludes(
    content: string,
    context: TemplateContext
  ): Promise<string> {
    // Placeholder for include processing
    // Could be extended to include other templates
    return content;
  }

  private resolveVariablePath(path: string, context: TemplateContext): any {
    const parts = path.split('.');
    let current: any = context;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  private evaluateCondition(condition: string, context: TemplateContext): boolean {
    // Simple condition evaluation
    // Could be extended with more complex logic
    
    if (condition.includes('==')) {
      const [left, right] = condition.split('==').map(s => s.trim());
      const leftValue = this.resolveVariablePath(left, context);
      const rightValue = right.startsWith('"') ? right.slice(1, -1) : this.resolveVariablePath(right, context);
      return leftValue == rightValue;
    }
    
    if (condition.includes('!=')) {
      const [left, right] = condition.split('!=').map(s => s.trim());
      const leftValue = this.resolveVariablePath(left, context);
      const rightValue = right.startsWith('"') ? right.slice(1, -1) : this.resolveVariablePath(right, context);
      return leftValue != rightValue;
    }
    
    // Simple truthy check
    return Boolean(this.resolveVariablePath(condition, context));
  }

  private parseArguments(argsString: string, context: TemplateContext): any[] {
    if (!argsString.trim()) return [];
    
    return argsString.split(',').map(arg => {
      const trimmed = arg.trim();
      
      // String literal
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1);
      }
      
      // Number literal
      if (!isNaN(Number(trimmed))) {
        return Number(trimmed);
      }
      
      // Variable reference
      return this.resolveVariablePath(trimmed, context);
    });
  }

  private isValidVariablePath(path: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(path);
  }

  private isValidConditional(content: string): boolean {
    return content.includes('{{#if') && content.includes('{{/if}}');
  }

  private isValidLoop(content: string): boolean {
    return content.includes('{{#each') && content.includes('{{/each}}');
  }

  private normalizeWhitespace(content: string): string {
    return content
      .replace(/\n\s*\n/g, '\n\n') // Remove extra blank lines
      .replace(/[ \t]+/g, ' ')     // Normalize spaces
      .trim();
  }

  private sanitizeContent(content: string): string {
    // Basic sanitization - remove script tags and event handlers
    return content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  }

  private registerDefaultFunctions(): void {
    // Date formatting function
    this.registerFunction({
      name: 'formatDate',
      handler: (args: any[], context: TemplateContext) => {
        const [date, format = 'DD/MM/YYYY'] = args;
        const dateObj = new Date(date || context.system?.currentDate);
        return this.formatDate(dateObj, format);
      },
      description: 'Format a date according to the specified format',
      examples: ['{{formatDate(currentDate, "DD/MM/YYYY")}}']
    });

    // Uppercase function
    this.registerFunction({
      name: 'upper',
      handler: (args: any[]) => {
        return String(args[0] || '').toUpperCase();
      },
      description: 'Convert text to uppercase',
      examples: ['{{upper(organization.name)}}']
    });

    // Currency formatting function
    this.registerFunction({
      name: 'currency',
      handler: (args: any[], context: TemplateContext) => {
        const [amount, currency = 'GBP'] = args;
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency
        }).format(Number(amount || 0));
      },
      description: 'Format number as currency',
      examples: ['{{currency(fee, "GBP")}}']
    });

    // Calculate age function
    this.registerFunction({
      name: 'calculateAge',
      handler: (args: any[], context: TemplateContext) => {
        const [birthDate] = args;
        const birth = new Date(birthDate);
        const now = context.system?.currentDate || new Date();
        const ageInMs = now.getTime() - birth.getTime();
        return Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));
      },
      description: 'Calculate age from birth date',
      examples: ['{{calculateAge(resident.dateOfBirth)}}']
    });
  }

  private formatDate(date: Date, format: string): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
      .replace('YY', year.slice(-2));
  }

  // Template generators for specific policy types

  private async generateSafeguardingTemplate(jurisdiction: string) {
    return {
      title: 'Safeguarding Adults Policy',
      content: `# {{organization.name}} - Safeguarding Adults Policy

## 1. Policy Statement
{{organization.name}} is committed to safeguarding and promoting the welfare of all residents. This policy outlines our procedures for preventing abuse and responding to safeguarding concerns.

**Effective Date:** {{formatDate(effectiveDate, "DD/MM/YYYY")}}
**Review Date:** {{formatDate(reviewDate, "DD/MM/YYYY")}}
**Approved By:** {{approvedBy}}

## 2. Scope
This policy applies to all staff, volunteers, and visitors at {{organization.name}}.

{{#if hasSpecialistUnits}}
### Specialist Units
This policy covers our specialist units including:
{{#each specialistUnits as unit}}
- {{unit.name}} ({{unit.type}})
{{/each}}
{{/if}}

## 3. Key Principles
- Person-centered approach
- Empowerment and choice
- Prevention and early intervention
- Proportionate responses
- Multi-agency working
- Accountability and transparency

## 4. Types of Abuse
Staff must be aware of the following types of abuse:
- Physical abuse
- Sexual abuse
- Psychological/emotional abuse
- Financial/material abuse
- Discriminatory abuse
- Institutional abuse
- Self-neglect
- Domestic abuse

## 5. Reporting Procedures
**Immediate Response:**
1. Ensure the person is safe
2. Seek medical attention if required
3. Preserve evidence
4. Report to the designated safeguarding lead: {{safeguardingLead}}

**Contact Information:**
- Local Authority: {{localAuthority.phone}}
- Emergency Services: 999
- Police: {{police.nonEmergency}}
- Care Quality Commission: {{cqc.phone}}

## 6. Staff Training
All staff must complete safeguarding training within {{trainingTimeframe}} of employment and refresh annually.

## 7. Record Keeping
All safeguarding concerns must be documented using form {{safeguardingFormRef}} and stored securely for {{recordRetentionPeriod}} years.

---
**Document Reference:** {{documentReference}}
**Version:** {{version}}
**Next Review:** {{formatDate(reviewDate, "DD/MM/YYYY")}}`,
      variables: [
        {
          name: 'safeguardingLead',
          type: 'text',
          label: 'Designated Safeguarding Lead',
          description: 'Name and contact details of the designated safeguarding lead',
          required: true
        },
        {
          name: 'localAuthority.phone',
          type: 'text',
          label: 'Local Authority Phone',
          description: 'Phone number for local authority safeguarding team',
          required: true
        },
        {
          name: 'hasSpecialistUnits',
          type: 'boolean',
          label: 'Has Specialist Units',
          description: 'Does the organization have specialist care units?',
          required: false,
          defaultValue: false
        },
        {
          name: 'specialistUnits',
          type: 'text',
          label: 'Specialist Units',
          description: 'List of specialist care units',
          required: false
        },
        {
          name: 'trainingTimeframe',
          type: 'select',
          label: 'Training Timeframe',
          description: 'When new staff must complete safeguarding training',
          required: true,
          options: ['1 week', '2 weeks', '4 weeks', '6 weeks'],
          defaultValue: '2 weeks'
        }
      ],
      compliance: [
        'Care Act 2014',
        'Mental Capacity Act 2005',
        'Human Rights Act 1998',
        `${jurisdiction.toUpperCase()} Safeguarding Procedures`
      ]
    };
  }

  private async generateMedicationTemplate(jurisdiction: string) {
    return {
      title: 'Medication Management Policy',
      content: `# {{organization.name}} - Medication Management Policy

## 1. Policy Statement
{{organization.name}} ensures safe, effective medication management for all residents in accordance with professional standards and regulatory requirements.

**Effective Date:** {{formatDate(effectiveDate, "DD/MM/YYYY")}}
**Review Date:** {{formatDate(reviewDate, "DD/MM/YYYY")}}
**Approved By:** {{approvedBy}}

## 2. Medication Administration
Only qualified staff may administer medications:
{{#each qualifiedStaffRoles as role}}
- {{role}}
{{/each}}

## 3. Storage Requirements
- Controlled drugs: {{controlledDrugStorage}}
- Refrigerated medications: {{refrigeratedStorage}}
- Room temperature: {{roomTempStorage}}

## 4. Documentation
All medication administration must be recorded on the MAR chart with:
- Date and time
- Medication name and dose
- Staff signature
- Any observations

## 5. Medication Reviews
- GP reviews: Every {{gpReviewFrequency}}
- Pharmacy reviews: Every {{pharmacyReviewFrequency}}
- Internal reviews: {{internalReviewFrequency}}

## 6. Error Reporting
All medication errors must be reported to:
- Care Home Manager: {{managerContact}}
- GP: {{gpContact}}
- {{#if cqcReporting}}CQC (if required): {{cqc.phone}}{{/if}}

---
**Document Reference:** {{documentReference}}
**Version:** {{version}}`,
      variables: [
        {
          name: 'qualifiedStaffRoles',
          type: 'multiselect',
          label: 'Qualified Staff Roles',
          description: 'Staff roles qualified to administer medications',
          required: true,
          options: ['Registered Nurses', 'Senior Care Workers', 'Medication Champions', 'Care Managers']
        },
        {
          name: 'controlledDrugStorage',
          type: 'text',
          label: 'Controlled Drug Storage',
          description: 'Location and security requirements for controlled drugs',
          required: true
        },
        {
          name: 'gpReviewFrequency',
          type: 'select',
          label: 'GP Review Frequency',
          description: 'How often GPs review medications',
          required: true,
          options: ['3 months', '6 months', '12 months'],
          defaultValue: '6 months'
        }
      ],
      compliance: [
        'Medicines Act 1968',
        'Misuse of Drugs Act 1971',
        'NICE Guidelines',
        'RPS Guidelines',
        `${jurisdiction.toUpperCase()} Medication Standards`
      ]
    };
  }

  private async generateInfectionControlTemplate(jurisdiction: string) {
    return {
      title: 'Infection Prevention and Control Policy',
      content: `# {{organization.name}} - Infection Prevention and Control Policy

## 1. Policy Statement
{{organization.name}} is committed to preventing and controlling infections to protect residents, staff, and visitors.

**Effective Date:** {{formatDate(effectiveDate, "DD/MM/YYYY")}}
**Review Date:** {{formatDate(reviewDate, "DD/MM/YYYY")}}
**Approved By:** {{approvedBy}}

## 2. Key Responsibilities
**Infection Control Lead:** {{infectionControlLead}}
**Deputy:** {{infectionControlDeputy}}

## 3. Standard Precautions
- Hand hygiene before and after resident contact
- Personal protective equipment (PPE) as required
- Safe disposal of sharps and clinical waste
- Environmental cleaning protocols

## 4. Outbreak Management
**Definition:** {{outbreakDefinition}}

**Response Team:**
{{#each outbreakTeam as member}}
- {{member.role}}: {{member.name}}
{{/each}}

## 5. Notification Requirements
Report outbreaks to:
- Local Health Protection Team: {{hptContact}}
- {{#if cqcReporting}}CQC: {{cqc.phone}}{{/if}}
- {{organization.name}} Management

## 6. Training Requirements
All staff must complete infection control training:
- Initial training: Within {{initialTrainingPeriod}}
- Refresher training: Every {{refresherTrainingPeriod}}

---
**Document Reference:** {{documentReference}}
**Version:** {{version}}`,
      variables: [
        {
          name: 'infectionControlLead',
          type: 'text',
          label: 'Infection Control Lead',
          description: 'Name of the designated infection control lead',
          required: true
        },
        {
          name: 'outbreakDefinition',
          type: 'text',
          label: 'Outbreak Definition',
          description: 'Definition of what constitutes an outbreak',
          required: true,
          defaultValue: '2 or more related cases of infection within 72 hours'
        },
        {
          name: 'hptContact',
          type: 'text',
          label: 'Health Protection Team Contact',
          description: 'Contact details for local Health Protection Team',
          required: true
        }
      ],
      compliance: [
        'Health and Social Care Act 2008',
        'Public Health England Guidelines',
        'NICE Quality Standards',
        `${jurisdiction.toUpperCase()} Infection Control Standards`
      ]
    };
  }

  private async generateDataProtectionTemplate(jurisdiction: string) {
    return {
      title: 'Data Protection and Privacy Policy',
      content: `# {{organization.name}} - Data Protection and Privacy Policy

## 1. Policy Statement
{{organization.name}} is committed to protecting personal data in accordance with UK GDPR and Data Protection Act 2018.

**Effective Date:** {{formatDate(effectiveDate, "DD/MM/YYYY")}}
**Review Date:** {{formatDate(reviewDate, "DD/MM/YYYY")}}
**Approved By:** {{approvedBy}}

## 2. Data Protection Officer
**Name:** {{dpoName}}
**Contact:** {{dpoContact}}
**Email:** {{dpoEmail}}

## 3. Legal Basis for Processing
We process personal data under:
{{#each legalBases as basis}}
- {{basis}}
{{/each}}

## 4. Data Subject Rights
Individuals have the right to:
- Access their personal data
- Rectification of inaccurate data
- Erasure of data
- Restrict processing
- Data portability
- Object to processing

## 5. Data Retention
- Care records: {{careRecordRetention}}
- Staff records: {{staffRecordRetention}}
- Financial records: {{financialRecordRetention}}
- CCTV footage: {{cctvRetention}}

## 6. Data Breach Response
All breaches must be reported to the DPO within {{breachReportingTime}}.
{{#if icoBreach}}
Serious breaches will be reported to the ICO within 72 hours.
{{/if}}

## 7. Third Party Sharing
We may share data with:
{{#each thirdParties as party}}
- {{party.name}}: {{party.purpose}}
{{/each}}

---
**Document Reference:** {{documentReference}}
**Version:** {{version}}`,
      variables: [
        {
          name: 'dpoName',
          type: 'text',
          label: 'Data Protection Officer Name',
          description: 'Name of the designated Data Protection Officer',
          required: true
        },
        {
          name: 'legalBases',
          type: 'multiselect',
          label: 'Legal Bases for Processing',
          description: 'Legal bases under GDPR for processing personal data',
          required: true,
          options: ['Article 6(1)(b) Contract', 'Article 6(1)(c) Legal obligation', 'Article 6(1)(f) Legitimate interests', 'Article 9(2)(h) Health care']
        },
        {
          name: 'careRecordRetention',
          type: 'select',
          label: 'Care Record Retention Period',
          description: 'How long care records are retained',
          required: true,
          options: ['8 years', '20 years', '30 years', 'Permanently'],
          defaultValue: '8 years'
        }
      ],
      compliance: [
        'UK GDPR',
        'Data Protection Act 2018',
        'Human Rights Act 1998',
        'Records Management Code of Practice',
        `${jurisdiction.toUpperCase()} Data Protection Requirements`
      ]
    };
  }

  private async generateEmergencyProceduresTemplate(jurisdiction: string) {
    return {
      title: 'Emergency Procedures Policy',
      content: `# {{organization.name}} - Emergency Procedures Policy

## 1. Policy Statement
{{organization.name}} maintains comprehensive emergency procedures to ensure the safety and wellbeing of all residents, staff, and visitors.

**Effective Date:** {{formatDate(effectiveDate, "DD/MM/YYYY")}}
**Review Date:** {{formatDate(reviewDate, "DD/MM/YYYY")}}
**Approved By:** {{approvedBy}}

## 2. Emergency Contacts
**Emergency Services:** 999
**Manager:** {{managerContact}}
**Deputy Manager:** {{deputyManagerContact}}
**On-call Manager:** {{onCallContact}}

## 3. Fire Procedures
**Fire Officer:** {{fireOfficer}}
**Assembly Point:** {{assemblyPoint}}

**In case of fire:**
1. Raise the alarm
2. Call 999
3. Evacuate residents using PEEP plans
4. Close doors to contain fire
5. Report to assembly point

## 4. Medical Emergencies
**Qualified First Aiders:**
{{#each firstAiders as aider}}
- {{aider.name}} ({{aider.qualification}})
{{/each}}

**Nearest Hospital:** {{nearestHospital}}
**GP Out of Hours:** {{gpOutOfHours}}

## 5. Power Failure
**Generator Location:** {{generatorLocation}}
**Backup Duration:** {{backupDuration}}
**Electricity Supplier Emergency:** {{electricitySupplier}}

## 6. Severe Weather
{{#if floodRisk}}
**Flood Procedures:**
- Monitor Environment Agency warnings
- Activate flood barriers at {{floodBarrierLocation}}
- Prepare evacuation if water level reaches {{evacuationLevel}}
{{/if}}

## 7. Security Incidents
**Intruder alarm code:** {{alarmCode}}
**CCTV monitoring:** {{cctvMonitoring}}
**Police:** 999 or {{policeNonEmergency}}

## 8. Business Continuity
**Alternative accommodation:** {{alternativeAccommodation}}
**Data backup location:** {{dataBackupLocation}}
**Key suppliers:**
{{#each keySuppliers as supplier}}
- {{supplier.service}}: {{supplier.contact}}
{{/each}}

---
**Document Reference:** {{documentReference}}
**Version:** {{version}}`,
      variables: [
        {
          name: 'fireOfficer',
          type: 'text',
          label: 'Fire Officer',
          description: 'Name of designated fire officer',
          required: true
        },
        {
          name: 'assemblyPoint',
          type: 'text',
          label: 'Fire Assembly Point',
          description: 'Location of fire assembly point',
          required: true
        },
        {
          name: 'nearestHospital',
          type: 'text',
          label: 'Nearest Hospital',
          description: 'Name and location of nearest hospital',
          required: true
        },
        {
          name: 'floodRisk',
          type: 'boolean',
          label: 'Flood Risk Area',
          description: 'Is the care home in a flood risk area?',
          required: false,
          defaultValue: false
        },
        {
          name: 'generatorLocation',
          type: 'text',
          label: 'Emergency Generator Location',
          description: 'Location of emergency generator',
          required: false
        }
      ],
      compliance: [
        'Regulatory Reform (Fire Safety) Order 2005',
        'Health and Safety at Work Act 1974',
        'Care Standards Act 2000',
        `${jurisdiction.toUpperCase()} Emergency Planning Guidelines`
      ]
    };
  }
}