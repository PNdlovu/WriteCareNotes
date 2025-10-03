# Audit Logging Policy and Implementation

## Overview

WriteCareNotes implements comprehensive audit logging to ensure complete traceability, compliance, and security across all system operations. This document outlines the audit logging framework, requirements, and implementation details.

## Audit Logging Principles

### 1. Complete Traceability
- **Every Action Logged**: All user and system actions are recorded
- **Immutable Logs**: Audit logs cannot be modified or deleted
- **Correlation IDs**: All related actions are linked via correlation IDs
- **Timestamp Precision**: Microsecond precision timestamps

### 2. Security and Compliance
- **Tamper Evidence**: Logs are cryptographically signed
- **Secure Storage**: Encrypted storage with access controls
- **Retention Policies**: Compliance-driven retention periods
- **Access Controls**: Role-based access to audit logs

### 3. Performance and Scalability
- **Asynchronous Logging**: Non-blocking log operations
- **Batch Processing**: Efficient log processing
- **Distributed Logging**: Scalable log collection
- **Real-time Monitoring**: Live audit log analysis

## Audit Event Categories

### 1. Authentication Events
**Purpose**: Track user authentication and session management

**Events**:
- `AUTH_LOGIN_SUCCESS`: Successful user login
- `AUTH_LOGIN_FAILURE`: Failed login attempt
- `AUTH_LOGOUT`: User logout
- `AUTH_SESSION_EXPIRED`: Session timeout
- `AUTH_MFA_SUCCESS`: MFA authentication success
- `AUTH_MFA_FAILURE`: MFA authentication failure
- `AUTH_PASSWORD_CHANGE`: Password change
- `AUTH_PASSWORD_RESET`: Password reset

**Data Captured**:
```typescript
interface AuthEvent {
  event_type: 'AUTH_LOGIN_SUCCESS' | 'AUTH_LOGIN_FAILURE' | 'AUTH_LOGOUT' | 'AUTH_SESSION_EXPIRED' | 'AUTH_MFA_SUCCESS' | 'AUTH_MFA_FAILURE' | 'AUTH_PASSWORD_CHANGE' | 'AUTH_PASSWORD_RESET';
  user_id: string;
  tenant_id: string;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  success: boolean;
  failure_reason?: string;
  session_id: string;
  correlation_id: string;
}
```

### 2. Authorization Events
**Purpose**: Track access control and permission usage

**Events**:
- `AUTHZ_ACCESS_GRANTED`: Access granted to resource
- `AUTHZ_ACCESS_DENIED`: Access denied to resource
- `AUTHZ_ROLE_ASSIGNED`: Role assigned to user
- `AUTHZ_ROLE_REVOKED`: Role revoked from user
- `AUTHZ_PERMISSION_GRANTED`: Permission granted
- `AUTHZ_PERMISSION_REVOKED`: Permission revoked
- `AUTHZ_PRIVILEGE_ESCALATION`: Privilege escalation attempt

**Data Captured**:
```typescript
interface AuthzEvent {
  event_type: 'AUTHZ_ACCESS_GRANTED' | 'AUTHZ_ACCESS_DENIED' | 'AUTHZ_ROLE_ASSIGNED' | 'AUTHZ_ROLE_REVOKED' | 'AUTHZ_PERMISSION_GRANTED' | 'AUTHZ_PERMISSION_REVOKED' | 'AUTHZ_PRIVILEGE_ESCALATION';
  user_id: string;
  tenant_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  permission: string;
  role: string;
  timestamp: Date;
  success: boolean;
  reason?: string;
  correlation_id: string;
}
```

### 3. Data Access Events
**Purpose**: Track data access and modifications

**Events**:
- `DATA_READ`: Data read operation
- `DATA_CREATE`: Data creation
- `DATA_UPDATE`: Data modification
- `DATA_DELETE`: Data deletion
- `DATA_EXPORT`: Data export
- `DATA_IMPORT`: Data import
- `DATA_BACKUP`: Data backup
- `DATA_RESTORE`: Data restore

**Data Captured**:
```typescript
interface DataEvent {
  event_type: 'DATA_READ' | 'DATA_CREATE' | 'DATA_UPDATE' | 'DATA_DELETE' | 'DATA_EXPORT' | 'DATA_IMPORT' | 'DATA_BACKUP' | 'DATA_RESTORE';
  user_id: string;
  tenant_id: string;
  table_name: string;
  record_id: string;
  operation: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  timestamp: Date;
  success: boolean;
  error_message?: string;
  correlation_id: string;
}
```

### 4. Clinical Events
**Purpose**: Track healthcare-specific operations

**Events**:
- `CLINICAL_MEDICATION_ADMINISTERED`: Medication administration
- `CLINICAL_CARE_PLAN_CREATED`: Care plan creation
- `CLINICAL_CARE_PLAN_UPDATED`: Care plan modification
- `CLINICAL_ASSESSMENT_COMPLETED`: Assessment completion
- `CLINICAL_INCIDENT_REPORTED`: Incident reporting
- `CLINICAL_VITAL_SIGNS_RECORDED`: Vital signs recording
- `CLINICAL_TREATMENT_PRESCRIBED`: Treatment prescription

**Data Captured**:
```typescript
interface ClinicalEvent {
  event_type: 'CLINICAL_MEDICATION_ADMINISTERED' | 'CLINICAL_CARE_PLAN_CREATED' | 'CLINICAL_CARE_PLAN_UPDATED' | 'CLINICAL_ASSESSMENT_COMPLETED' | 'CLINICAL_INCIDENT_REPORTED' | 'CLINICAL_VITAL_SIGNS_RECORDED' | 'CLINICAL_TREATMENT_PRESCRIBED';
  user_id: string;
  tenant_id: string;
  resident_id: string;
  clinical_data: Record<string, any>;
  timestamp: Date;
  success: boolean;
  clinical_notes?: string;
  correlation_id: string;
}
```

### 5. System Events
**Purpose**: Track system operations and changes

**Events**:
- `SYSTEM_STARTUP`: System startup
- `SYSTEM_SHUTDOWN`: System shutdown
- `SYSTEM_CONFIG_CHANGED`: Configuration change
- `SYSTEM_BACKUP_CREATED`: Backup creation
- `SYSTEM_BACKUP_RESTORED`: Backup restoration
- `SYSTEM_UPDATE_INSTALLED`: System update
- `SYSTEM_ERROR`: System error
- `SYSTEM_WARNING`: System warning

**Data Captured**:
```typescript
interface SystemEvent {
  event_type: 'SYSTEM_STARTUP' | 'SYSTEM_SHUTDOWN' | 'SYSTEM_CONFIG_CHANGED' | 'SYSTEM_BACKUP_CREATED' | 'SYSTEM_BACKUP_RESTORED' | 'SYSTEM_UPDATE_INSTALLED' | 'SYSTEM_ERROR' | 'SYSTEM_WARNING';
  system_component: string;
  configuration?: Record<string, any>;
  error_code?: string;
  error_message?: string;
  timestamp: Date;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  correlation_id: string;
}
```

### 6. Security Events
**Purpose**: Track security-related operations and threats

**Events**:
- `SECURITY_LOGIN_ANOMALY`: Unusual login pattern
- `SECURITY_ACCESS_ANOMALY`: Unusual access pattern
- `SECURITY_DATA_BREACH`: Data breach detected
- `SECURITY_MALWARE_DETECTED`: Malware detection
- `SECURITY_INTRUSION_DETECTED`: Intrusion detection
- `SECURITY_POLICY_VIOLATION`: Security policy violation
- `SECURITY_CERTIFICATE_EXPIRED`: Certificate expiration
- `SECURITY_KEY_ROTATION`: Key rotation

**Data Captured**:
```typescript
interface SecurityEvent {
  event_type: 'SECURITY_LOGIN_ANOMALY' | 'SECURITY_ACCESS_ANOMALY' | 'SECURITY_DATA_BREACH' | 'SECURITY_MALWARE_DETECTED' | 'SECURITY_INTRUSION_DETECTED' | 'SECURITY_POLICY_VIOLATION' | 'SECURITY_CERTIFICATE_EXPIRED' | 'SECURITY_KEY_ROTATION';
  user_id?: string;
  tenant_id?: string;
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threat_type: string;
  source_ip?: string;
  target_resource?: string;
  timestamp: Date;
  action_taken?: string;
  correlation_id: string;
}
```

## Audit Log Structure

### Base Audit Event
```typescript
interface BaseAuditEvent {
  id: string;                    // Unique event ID
  event_type: string;            // Event type
  timestamp: Date;               // Event timestamp
  user_id?: string;              // User ID (if applicable)
  tenant_id?: string;            // Tenant ID (if applicable)
  session_id?: string;           // Session ID (if applicable)
  correlation_id: string;        // Correlation ID
  source_ip?: string;            // Source IP address
  user_agent?: string;           // User agent string
  success: boolean;              // Success/failure status
  error_message?: string;        // Error message (if applicable)
  metadata?: Record<string, any>; // Additional metadata
  signature: string;             // Cryptographic signature
  version: string;               // Audit log version
}
```

### Audit Log Metadata
```typescript
interface AuditMetadata {
  application: string;           // Application name
  version: string;               // Application version
  environment: string;           // Environment (dev/staging/prod)
  region: string;                // Geographic region
  datacenter: string;            // Datacenter identifier
  server_id: string;             // Server identifier
  process_id: string;            // Process identifier
  thread_id: string;             // Thread identifier
}
```

## Implementation Architecture

### 1. Audit Logging Service
```typescript
@Injectable()
export class AuditLoggingService {
  private readonly logger = new Logger(AuditLoggingService.name);
  
  async logEvent(event: BaseAuditEvent): Promise<void> {
    try {
      // Validate event
      this.validateEvent(event);
      
      // Add metadata
      const enrichedEvent = this.enrichEvent(event);
      
      // Sign event
      const signedEvent = this.signEvent(enrichedEvent);
      
      // Store event
      await this.storeEvent(signedEvent);
      
      // Send to real-time monitoring
      await this.sendToMonitoring(signedEvent);
      
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  private validateEvent(event: BaseAuditEvent): void {
    if (!event.id || !event.event_type || !event.timestamp) {
      throw new Error('Invalid audit event: missing required fields');
    }
  }
  
  private enrichEvent(event: BaseAuditEvent): BaseAuditEvent {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        application: 'WriteCareNotes',
        version: process.env.APP_VERSION,
        environment: process.env.NODE_ENV,
        region: process.env.AWS_REGION,
        datacenter: process.env.DATACENTER,
        server_id: process.env.SERVER_ID,
        process_id: process.pid.toString(),
        thread_id: process.hrtime.bigint().toString()
      }
    };
  }
  
  private signEvent(event: BaseAuditEvent): BaseAuditEvent {
    const signature = this.cryptoService.sign(JSON.stringify(event));
    return {
      ...event,
      signature
    };
  }
  
  private async storeEvent(event: BaseAuditEvent): Promise<void> {
    // Store in primary database
    await this.auditRepository.create(event);
    
    // Store in audit log database
    await this.auditLogRepository.create(event);
    
    // Store in immutable storage
    await this.immutableStorage.store(event);
  }
}
```

### 2. Audit Middleware
```typescript
@Injectable()
export class AuditMiddleware {
  constructor(private auditService: AuditLoggingService) {}
  
  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const correlationId = req.headers['x-correlation-id'] || this.generateCorrelationId();
    
    // Add correlation ID to request
    req.correlationId = correlationId;
    
    // Log request
    this.auditService.logEvent({
      id: this.generateEventId(),
      event_type: 'HTTP_REQUEST',
      timestamp: new Date(),
      user_id: req.user?.id,
      tenant_id: req.tenantId,
      session_id: req.sessionID,
      correlation_id: correlationId,
      source_ip: req.ip,
      user_agent: req.get('User-Agent'),
      success: true,
      metadata: {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers)
      }
    });
    
    // Override response end to log response
    const originalEnd = res.end;
    res.end = (chunk?: any, encoding?: any) => {
      const duration = Date.now() - startTime;
      
      this.auditService.logEvent({
        id: this.generateEventId(),
        event_type: 'HTTP_RESPONSE',
        timestamp: new Date(),
        user_id: req.user?.id,
        tenant_id: req.tenantId,
        session_id: req.sessionID,
        correlation_id: correlationId,
        source_ip: req.ip,
        success: res.statusCode < 400,
        metadata: {
          method: req.method,
          url: req.url,
          status_code: res.statusCode,
          duration: duration
        }
      });
      
      originalEnd.call(res, chunk, encoding);
    };
    
    next();
  }
}
```

### 3. Database Audit Triggers
```sql
-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            event_type,
            table_name,
            record_id,
            operation,
            new_values,
            timestamp,
            user_id,
            tenant_id,
            correlation_id
        ) VALUES (
            'DATA_CREATE',
            TG_TABLE_NAME,
            NEW.id,
            'INSERT',
            row_to_json(NEW),
            NOW(),
            current_setting('app.current_user_id', true),
            current_setting('app.current_tenant_id', true),
            current_setting('app.correlation_id', true)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            event_type,
            table_name,
            record_id,
            operation,
            old_values,
            new_values,
            timestamp,
            user_id,
            tenant_id,
            correlation_id
        ) VALUES (
            'DATA_UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            row_to_json(OLD),
            row_to_json(NEW),
            NOW(),
            current_setting('app.current_user_id', true),
            current_setting('app.current_tenant_id', true),
            current_setting('app.correlation_id', true)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            event_type,
            table_name,
            record_id,
            operation,
            old_values,
            timestamp,
            user_id,
            tenant_id,
            correlation_id
        ) VALUES (
            'DATA_DELETE',
            TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            row_to_json(OLD),
            NOW(),
            current_setting('app.current_user_id', true),
            current_setting('app.current_tenant_id', true),
            current_setting('app.correlation_id', true)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all tables
CREATE TRIGGER residents_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON residents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Compliance Requirements

### 1. GDPR Compliance
- **Article 5(1)(f)**: Data processing must be secure
- **Article 32**: Security of processing
- **Article 33**: Breach notification
- **Article 35**: Data protection impact assessment

### 2. NHS Digital Standards
- **DCB0129**: Clinical risk management
- **DCB0160**: Clinical safety management
- **DSPT**: Data Security and Protection Toolkit

### 3. CQC Compliance
- **Safe**: Protection from abuse and avoidable harm
- **Effective**: Care and treatment achieves good outcomes
- **Well-led**: Leadership, management, and governance

### 4. ISO 27001
- **A.12.4.1**: Event logging
- **A.12.4.2**: Protection of log information
- **A.12.4.3**: Administrator and operator logs
- **A.12.4.4**: Clock synchronization

## Retention Policies

### 1. Audit Log Retention
- **Authentication Events**: 7 years
- **Authorization Events**: 7 years
- **Data Access Events**: 7 years
- **Clinical Events**: 8 years (medical records)
- **System Events**: 3 years
- **Security Events**: 10 years

### 2. Storage Tiers
- **Hot Storage**: Last 90 days (immediate access)
- **Warm Storage**: 90 days to 2 years (nearline access)
- **Cold Storage**: 2+ years (archive access)

### 3. Disposal Procedures
- **Automated Disposal**: Based on retention policies
- **Secure Deletion**: Cryptographic erasure
- **Disposal Certificates**: Proof of secure disposal
- **Audit Trail**: Disposal events are audited

## Monitoring and Alerting

### 1. Real-time Monitoring
- **Security Events**: Immediate alerting
- **Failed Authentication**: Threshold-based alerting
- **Data Access Anomalies**: Behavioral analysis
- **System Errors**: Critical error alerting

### 2. Compliance Monitoring
- **Audit Log Completeness**: Ensure all events are logged
- **Retention Compliance**: Monitor retention policies
- **Access Monitoring**: Track audit log access
- **Integrity Monitoring**: Verify log integrity

### 3. Performance Monitoring
- **Log Processing Time**: Monitor log processing performance
- **Storage Usage**: Monitor audit log storage
- **Query Performance**: Monitor audit log queries
- **System Impact**: Monitor impact on system performance

## Security Controls

### 1. Log Integrity
- **Cryptographic Signatures**: All logs are digitally signed
- **Hash Chains**: Log entries are linked via hash chains
- **Immutable Storage**: Logs cannot be modified
- **Regular Verification**: Periodic integrity checks

### 2. Access Controls
- **Role-based Access**: Different access levels for different roles
- **Multi-factor Authentication**: Required for audit log access
- **Session Management**: Short session timeouts
- **Audit Log Access**: All access to audit logs is logged

### 3. Encryption
- **Data at Rest**: AES-256 encryption for stored logs
- **Data in Transit**: TLS 1.3 for log transmission
- **Key Management**: Secure key management and rotation
- **Encryption Keys**: Separate keys for different log types

## Reporting and Analytics

### 1. Compliance Reports
- **GDPR Reports**: Data processing reports
- **NHS Digital Reports**: Clinical safety reports
- **CQC Reports**: Care quality reports
- **ISO 27001 Reports**: Security management reports

### 2. Security Analytics
- **Threat Detection**: Identify security threats
- **Anomaly Detection**: Detect unusual patterns
- **Risk Assessment**: Assess security risks
- **Trend Analysis**: Analyze security trends

### 3. Operational Analytics
- **Usage Patterns**: Understand system usage
- **Performance Metrics**: Monitor system performance
- **Error Analysis**: Analyze system errors
- **Capacity Planning**: Plan for future capacity

---

**Document Version**: 1.0.0  
**Last Updated**: January 2025  
**Next Review**: April 2025  
**Classification**: CONFIDENTIAL  
**Maintained By**: WriteCareNotes Security Team