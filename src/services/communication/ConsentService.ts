import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, param, query, validationResult } from 'express-validator';
import crypto from 'crypto';
import { DatabaseService } from '../core/DatabaseService';
import { Logger } from '../core/Logger';
import { EmailService } from '../core/EmailService';
import { AuditService } from '../core/AuditService';
import { RealtimeMessagingService } from './RealtimeMessagingService';

export interface ConsentRequest {
  id: string;
  tenantId: string;
  consentType: ConsentType;
  subjectType: SubjectType;
  subjectId?: string;
  externalEmail?: string;
  externalName?: string;
  purpose: string;
  dataCategories: string[];
  retentionPeriod: number;
  legalBasis: LegalBasis;
  requiredBy?: string;
  requiredAt: string;
  expiresAt?: string;
  status: ConsentStatus;
  consentToken?: string;
  consentUrl?: string;
  metadata: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  consentRequestId: string;
  tenantId: string;
  subjectType: SubjectType;
  subjectId?: string;
  externalEmail?: string;
  consentGiven: boolean;
  consentWithdrawn: boolean;
  withdrawnAt?: string;
  withdrawnReason?: string;
  consentMethod: ConsentMethod;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  evidenceData: Record<string, any>;
  isValid: boolean;
  expiresAt?: string;
}

export interface ConsentTemplate {
  id: string;
  tenantId: string;
  templateName: string;
  consentType: ConsentType;
  legalBasis: LegalBasis;
  purpose: string;
  dataCategories: string[];
  defaultRetentionPeriod: number;
  consentText: string;
  isActive: boolean;
  version: string;
  createdBy: string;
  createdAt: string;
}

export type ConsentType = 
  | 'family_communication' 
  | 'care_data_sharing' 
  | 'medical_information' 
  | 'emergency_contact' 
  | 'media_recording' 
  | 'research_participation'
  | 'third_party_integration'
  | 'marketing_communication';

export type SubjectType = 
  | 'family_member' 
  | 'resident' 
  | 'external_professional' 
  | 'authority_representative'
  | 'care_team_member';

export type LegalBasis = 
  | 'consent' 
  | 'legitimate_interest' 
  | 'vital_interest' 
  | 'legal_obligation' 
  | 'public_task' 
  | 'contract';

export type ConsentStatus = 
  | 'pending' 
  | 'given' 
  | 'withdrawn' 
  | 'expired' 
  | 'rejected';

export type ConsentMethod = 
  | 'digital_signature' 
  | 'email_confirmation' 
  | 'verbal_recorded' 
  | 'written_form' 
  | 'implicit_action'
  | 'system_migration';

interface CreateConsentRequestData {
  consentType: ConsentType;
  subjectType: SubjectType;
  subjectId?: string;
  externalEmail?: string;
  externalName?: string;
  purpose: string;
  dataCategories: string[];
  retentionPeriod?: number;
  legalBasis: LegalBasis;
  requiredBy?: string;
  expiresAt?: string;
  templateId?: string;
  metadata?: Record<string, any>;
}

interface ProvideConsentData {
  consentGiven: boolean;
  consentMethod: ConsentMethod;
  digitalSignature?: string;
  witnessName?: string;
  witnessSignature?: string;
  additionalEvidence?: Record<string, any>;
}

export class ConsentService {
  private db: DatabaseService;
  private logger: Logger;
  private email: EmailService;
  private audit: AuditService;
  private messaging: RealtimeMessagingService;

  constructor() {
    this.db = new DatabaseService();
    this.logger = new Logger('ConsentService');
    this.email = new EmailService();
    this.audit = new AuditService();
    this.messaging = new RealtimeMessagingService();
  }

  /**
   * Create a new consent request
   */
  async createConsentRequest(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const requestData: CreateConsentRequestData = req.body;

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Get template if specified
        let template: ConsentTemplate | null = null;
        if (requestData.templateId) {
          const templateResult = await client.query(
            'SELECT * FROM consent_templates WHERE id = $1 AND tenant_id = $2 AND is_active = true',
            [requestData.templateId, tenantId]
          );
          template = templateResult.rows[0] || null;
        }

        // Generate consent token and URL
        const consentToken = crypto.randomBytes(32).toString('hex');
        const consentUrl = `${process.env.FRONTEND_URL}/consent/${consentToken}`;

        // Create consent request
        const requestId = uuidv4();
        const insertQuery = `
          INSERT INTO consent_requests (
            id, tenant_id, consent_type, subject_type, subject_id,
            external_email, external_name, purpose, data_categories,
            retention_period, legal_basis, required_by, required_at,
            expires_at, status, consent_token, consent_url, metadata,
            created_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(),
            $13, 'pending', $14, $15, $16, $17, NOW(), NOW()
          ) RETURNING *
        `;

        const retentionPeriod = requestData.retentionPeriod || 
          template?.defaultRetentionPeriod || 
          this.getDefaultRetentionPeriod(requestData.consentType);

        const expiresAt = requestData.expiresAt ? 
          new Date(requestData.expiresAt) : 
          new Date(Date.now() + retentionPeriod * 24 * 60 * 60 * 1000);

        const result = await client.query(insertQuery, [
          requestId,
          tenantId,
          requestData.consentType,
          requestData.subjectType,
          requestData.subjectId || null,
          requestData.externalEmail || null,
          requestData.externalName || null,
          requestData.purpose,
          JSON.stringify(requestData.dataCategories),
          retentionPeriod,
          requestData.legalBasis,
          requestData.requiredBy || null,
          expiresAt,
          consentToken,
          consentUrl,
          JSON.stringify(requestData.metadata || {}),
          userId
        ]);

        const consentRequest = result.rows[0];

        // Send consent request email for external subjects
        if (requestData.externalEmail) {
          await this.sendConsentRequestEmail(
            requestData.externalEmail,
            requestData.externalName || 'User',
            consentRequest,
            template
          );
        }

        // Create notification for internal staff
        if (requestData.subjectId) {
          await this.notifications.create({
            tenantId,
            userId: requestData.subjectId,
            type: 'consent_request',
            title: 'Consent Required',
            message: `Your consent is required for: ${requestData.purpose}`,
            data: { consentRequestId: requestId, consentUrl },
            actionRequired: true
          });
        }

        await client.query('COMMIT');

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: 'consent_request_created',
          resourceType: 'consent_request',
          resourceId: requestId,
          details: {
            consentType: requestData.consentType,
            subjectType: requestData.subjectType,
            purpose: requestData.purpose
          }
        });

        this.logger.info('Consent request created', {
          requestId,
          tenantId,
          consentType: requestData.consentType,
          hasExternalEmail: !!requestData.externalEmail
        });

        const response: ConsentRequest = {
          id: consentRequest.id,
          tenantId: consentRequest.tenant_id,
          consentType: consentRequest.consent_type,
          subjectType: consentRequest.subject_type,
          subjectId: consentRequest.subject_id,
          externalEmail: consentRequest.external_email,
          externalName: consentRequest.external_name,
          purpose: consentRequest.purpose,
          dataCategories: JSON.parse(consentRequest.data_categories),
          retentionPeriod: consentRequest.retention_period,
          legalBasis: consentRequest.legal_basis,
          requiredBy: consentRequest.required_by,
          requiredAt: consentRequest.required_at,
          expiresAt: consentRequest.expires_at,
          status: consentRequest.status,
          consentToken: consentRequest.consent_token,
          consentUrl: consentRequest.consent_url,
          metadata: JSON.parse(consentRequest.metadata),
          createdBy: consentRequest.created_by,
          createdAt: consentRequest.created_at,
          updatedAt: consentRequest.updated_at
        };

        res.status(201).json({
          success: true,
          data: response
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to create consent request', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create consent request'
      });
    }
  }

  /**
   * Provide consent for a request
   */
  async provideConsent(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const consentToken = req.params.consentToken;
      const consentData: ProvideConsentData = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Get consent request by token
        const requestResult = await client.query(`
          SELECT * FROM consent_requests 
          WHERE consent_token = $1 AND status = 'pending'
        `, [consentToken]);

        if (requestResult.rows.length === 0) {
          res.status(404).json({
            success: false,
            message: 'Consent request not found or already processed'
          });
          return;
        }

        const consentRequest = requestResult.rows[0];

        // Check if consent request has expired
        if (consentRequest.expires_at && new Date() > new Date(consentRequest.expires_at)) {
          await client.query(`
            UPDATE consent_requests 
            SET status = 'expired', updated_at = NOW()
            WHERE id = $1
          `, [consentRequest.id]);

          res.status(400).json({
            success: false,
            message: 'Consent request has expired'
          });
          return;
        }

        // Create consent record
        const recordId = uuidv4();
        const recordQuery = `
          INSERT INTO consent_records (
            id, consent_request_id, tenant_id, subject_type, subject_id,
            external_email, consent_given, consent_method, ip_address,
            user_agent, timestamp, evidence_data, is_valid, expires_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, true, $12
          ) RETURNING *
        `;

        const evidenceData = {
          digitalSignature: consentData.digitalSignature,
          witnessName: consentData.witnessName,
          witnessSignature: consentData.witnessSignature,
          additionalEvidence: consentData.additionalEvidence || {},
          timestamp: new Date().toISOString(),
          ipAddress,
          userAgent
        };

        const recordResult = await client.query(recordQuery, [
          recordId,
          consentRequest.id,
          consentRequest.tenant_id,
          consentRequest.subject_type,
          consentRequest.subject_id,
          consentRequest.external_email,
          consentData.consentGiven,
          consentData.consentMethod,
          ipAddress,
          userAgent,
          JSON.stringify(evidenceData),
          consentRequest.expires_at
        ]);

        const consentRecord = recordResult.rows[0];

        // Update consent request status
        const newStatus = consentData.consentGiven ? 'given' : 'rejected';
        await client.query(`
          UPDATE consent_requests 
          SET status = $1, updated_at = NOW()
          WHERE id = $2
        `, [newStatus, consentRequest.id]);

        await client.query('COMMIT');

        // Send confirmation email
        if (consentRequest.external_email) {
          await this.sendConsentConfirmationEmail(
            consentRequest.external_email,
            consentRequest.external_name || 'User',
            consentRequest,
            consentData.consentGiven
          );
        }

        // Notify relevant staff
        await this.notifications.create({
          tenantId: consentRequest.tenant_id,
          userId: consentRequest.created_by,
          type: 'consent_provided',
          title: 'Consent Response Received',
          message: `Consent ${consentData.consentGiven ? 'granted' : 'rejected'} for: ${consentRequest.purpose}`,
          data: { 
            consentRequestId: consentRequest.id,
            consentGiven: consentData.consentGiven 
          }
        });

        // Log audit event
        await this.audit.log({
          tenantId: consentRequest.tenant_id,
          userId: consentRequest.subject_id || 'external_user',
          action: 'consent_provided',
          resourceType: 'consent_record',
          resourceId: recordId,
          details: {
            consentRequestId: consentRequest.id,
            consentGiven: consentData.consentGiven,
            consentMethod: consentData.consentMethod,
            ipAddress
          }
        });

        this.logger.info('Consent provided', {
          recordId,
          requestId: consentRequest.id,
          consentGiven: consentData.consentGiven,
          method: consentData.consentMethod
        });

        res.json({
          success: true,
          data: {
            id: consentRecord.id,
            consentGiven: consentRecord.consent_given,
            timestamp: consentRecord.timestamp,
            status: newStatus
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to provide consent', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process consent'
      });
    }
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const recordId = req.params.recordId;
      const { reason } = req.body;

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Get consent record
        const recordResult = await client.query(`
          SELECT cr.*, req.purpose, req.consent_type
          FROM consent_records cr
          JOIN consent_requests req ON cr.consent_request_id = req.id
          WHERE cr.id = $1 AND cr.tenant_id = $2 AND cr.consent_given = true
        `, [recordId, tenantId]);

        if (recordResult.rows.length === 0) {
          res.status(404).json({
            success: false,
            message: 'Consent record not found or already withdrawn'
          });
          return;
        }

        const consentRecord = recordResult.rows[0];

        // Validate user has permission to withdraw
        const canWithdraw = consentRecord.subject_id === userId || 
          await this.validateWithdrawalPermission(tenantId, userId, recordId);

        if (!canWithdraw) {
          res.status(403).json({
            success: false,
            message: 'Permission denied to withdraw consent'
          });
          return;
        }

        // Update consent record
        await client.query(`
          UPDATE consent_records 
          SET consent_withdrawn = true, withdrawn_at = NOW(), withdrawn_reason = $1
          WHERE id = $2
        `, [reason, recordId]);

        // Update consent request status
        await client.query(`
          UPDATE consent_requests 
          SET status = 'withdrawn', updated_at = NOW()
          WHERE id = $1
        `, [consentRecord.consent_request_id]);

        await client.query('COMMIT');

        // Process data deletion/anonymization based on consent type
        await this.processConsentWithdrawal(consentRecord);

        // Send withdrawal confirmation
        if (consentRecord.external_email) {
          await this.sendWithdrawalConfirmationEmail(
            consentRecord.external_email,
            'User',
            consentRecord,
            reason
          );
        }

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: 'consent_withdrawn',
          resourceType: 'consent_record',
          resourceId: recordId,
          details: {
            consentType: consentRecord.consent_type,
            purpose: consentRecord.purpose,
            reason
          }
        });

        this.logger.info('Consent withdrawn', {
          recordId,
          tenantId,
          userId,
          reason
        });

        res.json({
          success: true,
          message: 'Consent withdrawn successfully'
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to withdraw consent', error);
      res.status(500).json({
        success: false,
        message: 'Failed to withdraw consent'
      });
    }
  }

  /**
   * Get consent status for a subject
   */
  async getConsentStatus(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const subjectId = req.params.subjectId;
      const consentType = req.query.consentType as ConsentType;

      let whereClause = 'WHERE cr.tenant_id = $1 AND (cr.subject_id = $2 OR cr.external_email = $2)';
      const params: any[] = [tenantId, subjectId];

      if (consentType) {
        whereClause += ' AND req.consent_type = $3';
        params.push(consentType);
      }

      const query = `
        SELECT 
          cr.*,
          req.consent_type,
          req.purpose,
          req.data_categories,
          req.legal_basis,
          req.expires_at as request_expires_at
        FROM consent_records cr
        JOIN consent_requests req ON cr.consent_request_id = req.id
        ${whereClause}
        ORDER BY cr.timestamp DESC
      `;

      const result = await this.db.query(query, params);

      const consentRecords = result.rows.map(row => ({
        id: row.id,
        consentRequestId: row.consent_request_id,
        consentType: row.consent_type,
        purpose: row.purpose,
        dataCategories: JSON.parse(row.data_categories),
        legalBasis: row.legal_basis,
        consentGiven: row.consent_given,
        consentWithdrawn: row.consent_withdrawn,
        withdrawnAt: row.withdrawn_at,
        withdrawnReason: row.withdrawn_reason,
        consentMethod: row.consent_method,
        timestamp: row.timestamp,
        isValid: row.is_valid && !row.consent_withdrawn,
        expiresAt: row.expires_at || row.request_expires_at
      }));

      res.json({
        success: true,
        data: { consentRecords }
      });

    } catch (error) {
      this.logger.error('Failed to get consent status', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve consent status'
      });
    }
  }

  /**
   * Create consent template
   */
  async createConsentTemplate(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const templateData = req.body;

      const templateId = uuidv4();
      const query = `
        INSERT INTO consent_templates (
          id, tenant_id, template_name, consent_type, legal_basis,
          purpose, data_categories, default_retention_period,
          consent_text, is_active, version, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, NOW())
        RETURNING *
      `;

      const result = await this.db.query(query, [
        templateId,
        tenantId,
        templateData.templateName,
        templateData.consentType,
        templateData.legalBasis,
        templateData.purpose,
        JSON.stringify(templateData.dataCategories),
        templateData.defaultRetentionPeriod,
        templateData.consentText,
        templateData.version || '1.0',
        userId
      ]);

      const template = result.rows[0];

      // Log audit event
      await this.audit.log({
        tenantId,
        userId,
        action: 'consent_template_created',
        resourceType: 'consent_template',
        resourceId: templateId,
        details: {
          templateName: templateData.templateName,
          consentType: templateData.consentType
        }
      });

      res.status(201).json({
        success: true,
        data: {
          id: template.id,
          templateName: template.template_name,
          consentType: template.consent_type,
          legalBasis: template.legal_basis,
          purpose: template.purpose,
          dataCategories: JSON.parse(template.data_categories),
          defaultRetentionPeriod: template.default_retention_period,
          consentText: template.consent_text,
          isActive: template.is_active,
          version: template.version,
          createdBy: template.created_by,
          createdAt: template.created_at
        }
      });

    } catch (error) {
      this.logger.error('Failed to create consent template', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create consent template'
      });
    }
  }

  /**
   * Get consent audit trail
   */
  async getConsentAudit(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const recordId = req.params.recordId;

      const query = `
        SELECT 
          al.*,
          u.first_name,
          u.last_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.tenant_id = $1 
          AND al.resource_type IN ('consent_request', 'consent_record')
          AND (al.resource_id = $2 OR al.details->>'consentRequestId' = $2)
        ORDER BY al.created_at DESC
      `;

      const result = await this.db.query(query, [tenantId, recordId]);

      const auditTrail = result.rows.map(row => ({
        id: row.id,
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        userId: row.user_id,
        userName: row.first_name && row.last_name ? 
          `${row.first_name} ${row.last_name}` : 'System',
        details: row.details,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        timestamp: row.created_at
      }));

      res.json({
        success: true,
        data: { auditTrail }
      });

    } catch (error) {
      this.logger.error('Failed to get consent audit', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve consent audit'
      });
    }
  }

  // Public method for external service integration
  async createExternalConsentRequest(
    tenantId: string,
    externalEmail: string,
    consentType: ConsentType,
    metadata: Record<string, any>
  ): Promise<string> {
    const requestId = uuidv4();
    const consentToken = crypto.randomBytes(32).toString('hex');
    const consentUrl = `${process.env.FRONTEND_URL}/consent/${consentToken}`;

    const query = `
      INSERT INTO consent_requests (
        id, tenant_id, consent_type, subject_type, external_email,
        purpose, data_categories, retention_period, legal_basis,
        required_at, status, consent_token, consent_url, metadata,
        created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 'family_member', $4, $5, $6, $7, 'consent',
        NOW(), 'pending', $8, $9, $10, 'system', NOW(), NOW()
      )
    `;

    await this.db.query(query, [
      requestId,
      tenantId,
      consentType,
      externalEmail,
      this.getDefaultPurpose(consentType),
      JSON.stringify(this.getDefaultDataCategories(consentType)),
      this.getDefaultRetentionPeriod(consentType),
      consentToken,
      consentUrl,
      JSON.stringify(metadata)
    ]);

    return requestId;
  }

  // Private helper methods

  private async sendConsentRequestEmail(
    email: string,
    name: string,
    consentRequest: any,
    template: ConsentTemplate | null
  ): Promise<void> {
    const subject = `Consent Required - ${consentRequest.purpose}`;
    const consentText = template?.consentText || this.getDefaultConsentText(consentRequest.consent_type);
    
    await this.email.send({
      to: email,
      subject,
      template: 'consent_request',
      data: {
        name,
        purpose: consentRequest.purpose,
        consentText,
        consentUrl: consentRequest.consent_url,
        dataCategories: JSON.parse(consentRequest.data_categories),
        retentionPeriod: consentRequest.retention_period,
        expiresAt: consentRequest.expires_at
      }
    });
  }

  private async sendConsentConfirmationEmail(
    email: string,
    name: string,
    consentRequest: any,
    consentGiven: boolean
  ): Promise<void> {
    const subject = `Consent ${consentGiven ? 'Confirmation' : 'Declined'} - ${consentRequest.purpose}`;
    
    await this.email.send({
      to: email,
      subject,
      template: 'consent_confirmation',
      data: {
        name,
        purpose: consentRequest.purpose,
        consentGiven,
        timestamp: new Date().toISOString()
      }
    });
  }

  private async sendWithdrawalConfirmationEmail(
    email: string,
    name: string,
    consentRecord: any,
    reason: string
  ): Promise<void> {
    await this.email.send({
      to: email,
      subject: `Consent Withdrawn - ${consentRecord.purpose}`,
      template: 'consent_withdrawal',
      data: {
        name,
        purpose: consentRecord.purpose,
        reason,
        timestamp: new Date().toISOString()
      }
    });
  }

  private async validateWithdrawalPermission(
    tenantId: string,
    userId: string,
    recordId: string
  ): Promise<boolean> {
    // Check if user has admin permissions or data protection role
    const result = await this.db.query(`
      SELECT 1 FROM users u
      WHERE u.id = $1 AND u.tenant_id = $2 
        AND (u.role = 'admin' OR u.permissions ? 'data_protection')
    `, [userId, tenantId]);

    return result.rows.length > 0;
  }

  private async processConsentWithdrawal(consentRecord: any): Promise<void> {
    // Process data deletion/anonymization based on consent type
    switch (consentRecord.consent_type) {
      case 'family_communication':
        await this.anonymizeConversationData(consentRecord);
        break;
      case 'care_data_sharing':
        await this.restrictDataSharing(consentRecord);
        break;
      case 'media_recording':
        await this.deleteMediaRecordings(consentRecord);
        break;
      default:
        this.logger.info('No specific withdrawal processing for consent type', {
          consentType: consentRecord.consent_type
        });
    }
  }

  private async anonymizeConversationData(consentRecord: any): Promise<void> {
    // Anonymize conversation data related to the withdrawn consent
    if (consentRecord.external_email) {
      await this.db.query(`
        UPDATE conversation_participants 
        SET external_email = 'withdrawn@anonymized.com',
            external_name = 'Withdrawn User'
        WHERE external_email = $1 AND tenant_id = $2
      `, [consentRecord.external_email, consentRecord.tenant_id]);
    }
  }

  private async restrictDataSharing(consentRecord: any): Promise<void> {
    // Implement data sharing restrictions
    this.logger.info('Processing data sharing restrictions', {
      recordId: consentRecord.id
    });
  }

  private async deleteMediaRecordings(consentRecord: any): Promise<void> {
    // Delete media recordings for withdrawn consent
    this.logger.info('Processing media recording deletion', {
      recordId: consentRecord.id
    });
  }

  private getDefaultRetentionPeriod(consentType: ConsentType): number {
    const periods: Record<ConsentType, number> = {
      'family_communication': 365,
      'care_data_sharing': 2555, // 7 years
      'medical_information': 2555,
      'emergency_contact': 365,
      'media_recording': 730, // 2 years
      'research_participation': 1825, // 5 years
      'third_party_integration': 365,
      'marketing_communication': 1095 // 3 years
    };
    return periods[consentType] || 365;
  }

  private getDefaultPurpose(consentType: ConsentType): string {
    const purposes: Record<ConsentType, string> = {
      'family_communication': 'Family communication and updates',
      'care_data_sharing': 'Care data sharing with authorized parties',
      'medical_information': 'Medical information sharing',
      'emergency_contact': 'Emergency contact authorization',
      'media_recording': 'Media recording and photography',
      'research_participation': 'Research participation',
      'third_party_integration': 'Third-party service integration',
      'marketing_communication': 'Marketing communications'
    };
    return purposes[consentType] || 'Data processing consent';
  }

  private getDefaultDataCategories(consentType: ConsentType): string[] {
    const categories: Record<ConsentType, string[]> = {
      'family_communication': ['contact_information', 'care_updates', 'communication_preferences'],
      'care_data_sharing': ['care_plans', 'medical_records', 'incident_reports'],
      'medical_information': ['medical_history', 'current_medications', 'allergies'],
      'emergency_contact': ['contact_details', 'relationship_information'],
      'media_recording': ['photos', 'videos', 'audio_recordings'],
      'research_participation': ['anonymized_care_data', 'survey_responses'],
      'third_party_integration': ['service_data', 'integration_logs'],
      'marketing_communication': ['contact_preferences', 'communication_history']
    };
    return categories[consentType] || ['basic_information'];
  }

  private getDefaultConsentText(consentType: ConsentType): string {
    return `By providing your consent, you agree to allow us to process your data for the specified purpose. You can withdraw this consent at any time by contacting us directly.`;
  }

  // Route definitions
  getRoutes(): express.Router {
    const router = express.Router();

    // Validation middleware
    const createRequestValidation = [
      body('consentType').isIn([
        'family_communication', 'care_data_sharing', 'medical_information',
        'emergency_contact', 'media_recording', 'research_participation',
        'third_party_integration', 'marketing_communication'
      ]),
      body('subjectType').isIn(['family_member', 'resident', 'external_professional', 'authority_representative', 'care_team_member']),
      body('purpose').isLength({ min: 10, max: 500 }).trim(),
      body('dataCategories').isArray({ min: 1 }),
      body('legalBasis').isIn(['consent', 'legitimate_interest', 'vital_interest', 'legal_obligation', 'public_task', 'contract'])
    ];

    const provideConsentValidation = [
      param('consentToken').isLength({ min: 64, max: 64 }),
      body('consentGiven').isBoolean(),
      body('consentMethod').isIn(['digital_signature', 'email_confirmation', 'verbal_recorded', 'written_form', 'implicit_action', 'system_migration'])
    ];

    const templateValidation = [
      body('templateName').isLength({ min: 3, max: 100 }).trim(),
      body('consentType').isIn([
        'family_communication', 'care_data_sharing', 'medical_information',
        'emergency_contact', 'media_recording', 'research_participation',
        'third_party_integration', 'marketing_communication'
      ]),
      body('consentText').isLength({ min: 50, max: 2000 }).trim()
    ];

    // Routes
    router.post('/requests', createRequestValidation, this.createConsentRequest.bind(this));
    router.post('/provide/:consentToken', provideConsentValidation, this.provideConsent.bind(this));
    router.post('/records/:recordId/withdraw', this.withdrawConsent.bind(this));
    router.get('/status/:subjectId', this.getConsentStatus.bind(this));
    router.post('/templates', templateValidation, this.createConsentTemplate.bind(this));
    router.get('/audit/:recordId', this.getConsentAudit.bind(this));

    return router;
  }
}