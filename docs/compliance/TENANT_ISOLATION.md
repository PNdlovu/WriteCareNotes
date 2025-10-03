# Tenant Isolation Architecture

## Overview

WriteCareNotes implements a comprehensive multi-tenant architecture with strict tenant isolation to ensure complete data segregation, security, and compliance for healthcare organizations across the British Isles.

## Isolation Levels

### 1. Data Isolation
**Implementation**: Complete data segregation at the database level

**Mechanisms**:
- **Tenant ID Filtering**: All queries include tenant_id filtering
- **Row-Level Security**: Database-level tenant isolation
- **Encrypted Data**: Tenant-specific encryption keys
- **Data Partitioning**: Physical data separation by tenant

**Technical Implementation**:
```sql
-- All tables include tenant_id column
CREATE TABLE residents (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    -- other columns
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Row-level security policy
CREATE POLICY tenant_isolation ON residents
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 2. Network Isolation
**Implementation**: Virtual network segmentation

**Mechanisms**:
- **VPC Isolation**: Separate virtual private clouds per tenant
- **Subnet Segmentation**: Isolated network segments
- **Security Groups**: Tenant-specific firewall rules
- **Private Endpoints**: Direct database connections

**Architecture**:
```
┌─────────────────────────────────────────────────────────┐
│                    Tenant A VPC                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Web App   │  │   API GW    │  │  Database   │     │
│  │   (A)       │  │   (A)       │  │   (A)       │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Tenant B VPC                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Web App   │  │   API GW    │  │  Database   │     │
│  │   (B)       │  │   (B)       │  │   (B)       │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 3. Compute Isolation
**Implementation**: Container and process isolation

**Mechanisms**:
- **Container Isolation**: Docker containers per tenant
- **Kubernetes Namespaces**: Separate namespaces per tenant
- **Resource Limits**: CPU and memory limits per tenant
- **Process Isolation**: Isolated application processes

**Kubernetes Implementation**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-a
  labels:
    tenant: tenant-a
    isolation: strict
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: tenant-a
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-server
      tenant: tenant-a
```

### 4. Storage Isolation
**Implementation**: Separate storage systems per tenant

**Mechanisms**:
- **Database Separation**: Separate database instances
- **File Storage**: Tenant-specific storage buckets
- **Backup Isolation**: Separate backup systems
- **Encryption Keys**: Tenant-specific encryption keys

**Storage Architecture**:
```
┌─────────────────────────────────────────────────────────┐
│                Tenant A Storage                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ PostgreSQL  │  │    Redis    │  │   S3 Bucket │     │
│  │   (A)       │  │    (A)      │  │     (A)     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                Tenant B Storage                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ PostgreSQL  │  │    Redis    │  │   S3 Bucket │     │
│  │   (B)       │  │    (B)      │  │     (B)     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Security Controls

### Authentication & Authorization
**Tenant-Specific Authentication**:
- Separate authentication realms per tenant
- Tenant-specific user directories
- Isolated session management
- Tenant-aware JWT tokens

**Implementation**:
```typescript
interface TenantJWT {
  sub: string;           // User ID
  tenant_id: string;     // Tenant ID
  roles: string[];       // Tenant-specific roles
  permissions: string[]; // Tenant-specific permissions
  exp: number;          // Expiration
  iat: number;          // Issued at
}
```

**Authorization Middleware**:
```typescript
@Injectable()
export class TenantIsolationMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const user = req.user as TenantJWT;
    
    // Verify tenant access
    if (user.tenant_id !== tenantId) {
      throw new ForbiddenException('Tenant access denied');
    }
    
    // Set tenant context
    req.tenantId = tenantId;
    next();
  }
}
```

### Data Access Controls
**Query Filtering**:
- Automatic tenant_id filtering on all queries
- Database-level row-level security
- Application-level access controls
- Audit logging for all data access

**Implementation**:
```typescript
@Injectable()
export class TenantAwareRepository<T> {
  async find(tenantId: string, criteria: any): Promise<T[]> {
    return this.repository.find({
      ...criteria,
      tenant_id: tenantId
    });
  }
  
  async create(tenantId: string, data: any): Promise<T> {
    return this.repository.save({
      ...data,
      tenant_id: tenantId
    });
  }
}
```

### Encryption & Key Management
**Tenant-Specific Encryption**:
- Separate encryption keys per tenant
- Key rotation per tenant schedule
- Hardware security modules (HSM)
- Key escrow and recovery procedures

**Implementation**:
```typescript
@Injectable()
export class TenantEncryptionService {
  async encrypt(tenantId: string, data: string): Promise<string> {
    const key = await this.getTenantKey(tenantId);
    return this.encryptionService.encrypt(data, key);
  }
  
  async decrypt(tenantId: string, encryptedData: string): Promise<string> {
    const key = await this.getTenantKey(tenantId);
    return this.encryptionService.decrypt(encryptedData, key);
  }
  
  private async getTenantKey(tenantId: string): Promise<string> {
    return this.keyManagementService.getTenantKey(tenantId);
  }
}
```

## Compliance & Regulatory

### GDPR Compliance
**Data Protection by Design**:
- Tenant data segregation ensures data minimization
- Purpose limitation through tenant-specific processing
- Data subject rights per tenant
- Cross-border data transfer controls

**Implementation**:
```typescript
@Injectable()
export class GDPRComplianceService {
  async processDataSubjectRequest(
    tenantId: string, 
    request: DataSubjectRequest
  ): Promise<void> {
    // Process request only for specific tenant
    const data = await this.getTenantData(tenantId, request.subjectId);
    
    switch (request.type) {
      case 'access':
        return this.provideDataAccess(tenantId, data);
      case 'erasure':
        return this.eraseData(tenantId, data);
      case 'portability':
        return this.exportData(tenantId, data);
    }
  }
}
```

### NHS Digital Standards
**DCB0129 Compliance**:
- Clinical risk management per tenant
- Incident reporting isolation
- Safety management per organization
- Audit trails per tenant

**DCB0160 Compliance**:
- Clinical safety management per tenant
- Risk assessment isolation
- Safety monitoring per organization
- Compliance reporting per tenant

### CQC Compliance
**Safe Care**:
- Incident management per tenant
- Safeguarding isolation
- Risk assessment per organization
- Safety monitoring per tenant

**Well-Led Governance**:
- Governance per tenant
- Leadership isolation
- Management per organization
- Compliance per tenant

## Monitoring & Auditing

### Tenant-Specific Monitoring
**Metrics Collection**:
- Performance metrics per tenant
- Resource usage per tenant
- Error rates per tenant
- Security events per tenant

**Implementation**:
```typescript
@Injectable()
export class TenantMonitoringService {
  async recordMetric(tenantId: string, metric: Metric): Promise<void> {
    await this.metricsService.record({
      ...metric,
      tenant_id: tenantId,
      timestamp: new Date()
    });
  }
  
  async getTenantMetrics(tenantId: string): Promise<Metric[]> {
    return this.metricsService.find({ tenant_id: tenantId });
  }
}
```

### Audit Logging
**Tenant-Specific Audit Trails**:
- All actions logged with tenant context
- Immutable audit logs per tenant
- Compliance reporting per tenant
- Forensic analysis per tenant

**Implementation**:
```typescript
@Injectable()
export class TenantAuditService {
  async logEvent(tenantId: string, event: AuditEvent): Promise<void> {
    await this.auditService.create({
      ...event,
      tenant_id: tenantId,
      timestamp: new Date(),
      correlation_id: this.generateCorrelationId()
    });
  }
}
```

## Disaster Recovery

### Tenant-Specific Backup
**Backup Strategy**:
- Separate backup schedules per tenant
- Tenant-specific backup retention
- Cross-region backup replication
- Tenant-specific recovery procedures

**Implementation**:
```typescript
@Injectable()
export class TenantBackupService {
  async createBackup(tenantId: string): Promise<BackupInfo> {
    const backup = await this.backupService.create({
      tenant_id: tenantId,
      timestamp: new Date(),
      type: 'full'
    });
    
    return backup;
  }
  
  async restoreTenant(tenantId: string, backupId: string): Promise<void> {
    await this.backupService.restore({
      tenant_id: tenantId,
      backup_id: backupId
    });
  }
}
```

### Business Continuity
**Tenant Isolation in DR**:
- Separate DR environments per tenant
- Tenant-specific failover procedures
- Isolated recovery testing
- Tenant-specific RTO/RPO targets

## Performance & Scalability

### Resource Allocation
**Tenant Resource Limits**:
- CPU limits per tenant
- Memory limits per tenant
- Storage limits per tenant
- Network bandwidth limits per tenant

**Implementation**:
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-a-quota
  namespace: tenant-a
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    persistentvolumeclaims: "10"
```

### Auto-Scaling
**Tenant-Specific Scaling**:
- Independent scaling per tenant
- Tenant-specific scaling policies
- Resource monitoring per tenant
- Cost optimization per tenant

## Security Testing

### Isolation Testing
**Penetration Testing**:
- Cross-tenant access attempts
- Data leakage testing
- Privilege escalation testing
- Network isolation testing

**Automated Testing**:
```typescript
describe('Tenant Isolation', () => {
  it('should prevent cross-tenant data access', async () => {
    const tenantA = await createTenant('tenant-a');
    const tenantB = await createTenant('tenant-b');
    
    const dataA = await createData(tenantA.id, 'sensitive-data');
    
    // Attempt to access tenant A data from tenant B
    const result = await getData(tenantB.id, dataA.id);
    
    expect(result).toBeNull();
  });
});
```

### Compliance Testing
**Regulatory Compliance**:
- GDPR compliance per tenant
- NHS Digital standards per tenant
- CQC compliance per tenant
- Data protection per tenant

## Incident Response

### Tenant-Specific Incidents
**Incident Isolation**:
- Incident containment per tenant
- Impact assessment per tenant
- Recovery procedures per tenant
- Communication per tenant

**Implementation**:
```typescript
@Injectable()
export class TenantIncidentService {
  async handleIncident(tenantId: string, incident: Incident): Promise<void> {
    // Isolate incident to specific tenant
    await this.containIncident(tenantId, incident);
    
    // Notify tenant-specific stakeholders
    await this.notifyTenantStakeholders(tenantId, incident);
    
    // Begin tenant-specific recovery
    await this.beginRecovery(tenantId, incident);
  }
}
```

## Best Practices

### Development Guidelines
1. **Always Include Tenant Context**: Every operation must include tenant_id
2. **Validate Tenant Access**: Verify tenant access on every request
3. **Use Tenant-Aware Services**: Use services that enforce tenant isolation
4. **Audit Everything**: Log all tenant-specific operations
5. **Test Isolation**: Regularly test tenant isolation

### Operational Guidelines
1. **Monitor Tenant Resources**: Track resource usage per tenant
2. **Regular Security Reviews**: Review tenant isolation regularly
3. **Compliance Audits**: Audit compliance per tenant
4. **Incident Response**: Have tenant-specific incident procedures
5. **Documentation**: Maintain tenant isolation documentation

---

**Document Version**: 1.0.0  
**Last Updated**: January 2025  
**Next Review**: April 2025  
**Classification**: CONFIDENTIAL  
**Maintained By**: WriteCareNotes Security Team