# Pilot Feedback Agent Orchestration System

## Overview

The Pilot Feedback Agent is a compliance-first, enterprise-grade system designed to automate the triage, clustering, and summarization of pilot feedback while maintaining strict data protection, audit trails, and human oversight.

## Purpose

- **Automate feedback processing**: Triage, cluster, and summarize pilot feedback to accelerate fixes
- **Preserve compliance**: Maintain strict UK GDPR compliance and tenant isolation
- **Enable human oversight**: Mandatory human-in-the-loop for all recommendations
- **Ensure data protection**: Comprehensive PII masking and audit trails

## Scope Boundary

### In Scope
- Reading feedback metadata and free-text from pilot module
- Generating summaries, clusters, and suggested backlog items
- Providing recommendations for human review
- Maintaining audit trails and compliance records

### Out of Scope
- Writing to clinical records
- Changing data without human approval
- Executing autonomous actions
- Direct clinical decision support

## Safety Posture

### Human-in-the-Loop Mandatory
- All recommendations require human approval
- No autonomous changes to system or data
- Review console for approval workflow

### Read-Only Data Access
- Agent only reads from pilot feedback store
- Write access limited to agent-specific collections
- No access to clinical or sensitive data

### Principle of Least Privilege
- Minimal required permissions
- Tenant-scoped access controls
- Regular permission audits

### Immutable Audit Trails
- All actions logged with correlation IDs
- WORM-capable storage for compliance
- Replayable audit events

## Feature Flags

### Core Flags
- `agent.pilotFeedback.enabled`: false by default per tenant
- `agent.pilotFeedback.autonomy`: always "recommend-only"

### Additional Flags
- `agent.pilotFeedback.clustering`: Enable/disable clustering
- `agent.pilotFeedback.summarization`: Enable/disable summarization
- `agent.pilotFeedback.notifications`: Enable/disable notifications

## Architecture

### High-Level Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Input Queue   │───▶│   Orchestrator   │───▶│  Agent Runtime  │
│ pilot.feedback. │    │  - Rate Limiting │    │  - PII Masking  │
│    events       │    │  - Consent Check │    │  - Clustering   │
└─────────────────┘    └──────────────────┘    │  - Summarization│
                                               └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Review Console │◀───│  Output Store    │◀───│  Safety Guards  │
│  - Approvals    │    │  - Summaries     │    │  - Validation   │
│  - Dashboard    │    │  - Clusters      │    │  - Compliance   │
└─────────────────┘    │  - Recommendations│    └─────────────────┘
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Audit Log      │
                       │  - Immutable     │
                       │  - WORM-capable  │
                       └──────────────────┘
```

### Data Flow

1. **Input**: Pilot feedback events arrive via webhook
2. **Validation**: Event validation and consent verification
3. **Masking**: PII masking and data protection
4. **Processing**: Clustering, summarization, and recommendation generation
5. **Storage**: Outputs stored in tenant-scoped collections
6. **Review**: Human review and approval workflow
7. **Audit**: All actions logged for compliance

## API Endpoints

### Core Endpoints

#### POST /pilot/feedback
Submit pilot feedback event for processing.

**Request Body:**
```json
{
  "eventId": "evt-123",
  "tenantId": "t-123",
  "submittedAt": "2025-01-22T10:30:00Z",
  "module": "medication",
  "severity": "high",
  "role": "care_worker",
  "text": "Medication save button not working",
  "attachments": [],
  "consents": {
    "improvementProcessing": true
  }
}
```

#### GET /pilot/agent/status
Get agent status for tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "t-123",
    "enabled": true,
    "autonomy": "recommend-only",
    "lastRun": "2025-01-22T10:30:00Z",
    "queueSize": 5,
    "errorCount": 0,
    "isProcessing": false
  }
}
```

#### POST /pilot/agent/review/approve
Approve or dismiss recommendation.

**Request Body:**
```json
{
  "tenantId": "t-123",
  "recommendationId": "rec-456",
  "action": "create_ticket",
  "notes": "Approved for development team"
}
```

#### GET /pilot/agent/outputs
Get agent outputs for tenant.

**Query Parameters:**
- `tenantId`: Required
- `from`: Optional start date
- `to`: Optional end date

### Review Console Endpoints

#### GET /pilot/agent/review/pending
Get pending recommendations for review.

#### GET /pilot/agent/review/dashboard
Get review dashboard data.

#### POST /pilot/agent/review/bulk-approve
Bulk approve multiple recommendations.

### Monitoring Endpoints

#### GET /monitoring/agent/health
Get agent health status.

#### GET /monitoring/agent/metrics
Get agent metrics for tenant.

#### GET /monitoring/agent/dashboard
Get monitoring dashboard.

## Data Schemas

### Pilot Feedback Event
```typescript
interface PilotFeedbackEvent {
  eventId: string;
  tenantId: string;
  submittedAt: string; // ISO 8601
  module: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  role: 'care_worker' | 'admin' | 'manager' | 'family' | 'resident';
  text: string;
  attachments: string[];
  consents: {
    improvementProcessing: boolean;
  };
}
```

### Agent Summary
```typescript
interface AgentSummary {
  summaryId: string;
  tenantId: string;
  window: {
    from: Date;
    to: Date;
  };
  topThemes: Array<{
    theme: string;
    count: number;
    modules: string[];
  }>;
  totalEvents: number;
  riskNotes: string;
  createdAt: Date;
}
```

### Agent Recommendation
```typescript
interface AgentRecommendation {
  recommendationId: string;
  tenantId: string;
  theme: string;
  proposedActions: string[];
  requiresApproval: boolean;
  linkedFeedbackIds: string[];
  privacyReview: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'approved' | 'dismissed';
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
}
```

## PII Masking Policy

### Masking Rules
- **Names**: "Nurse Kelly" → "[STAFF_1]"
- **Emails**: "test@example.com" → "[EMAIL]"
- **Phone Numbers**: "079..." → "[PHONE]"
- **NHS Numbers**: "123 456 7890" → "[NHS_NUMBER]"
- **Postcodes**: "SW1A 1AA" → "[POSTCODE]"
- **Addresses**: "123 Main Street" → "[ADDRESS]"
- **Medical Records**: "MRN123456" → "[MEDICAL_RECORD]"

### Context-Aware Masking
- Medication names and dosages
- Care-related terms with PII
- Time references that might be too specific
- Room numbers and staff IDs

### Validation
- 100% PII masking accuracy required
- Regular validation checks
- PHI leakage detection alerts

## RBAC Matrix

| Role | Read Feedback | Read Agent Outputs | Approve Actions | Configure Agent |
|------|---------------|-------------------|-----------------|-----------------|
| Pilot Admin | Yes | Yes | Yes | Yes |
| Developer | Yes (masked) | Yes | No | No |
| Compliance Officer | Yes | Yes | No | Yes (policy only) |
| Support | Limited (masked) | Yes | No | No |

## Compliance Requirements

### Legal Bases (UK GDPR)
- **Performance of contract**: For pilot participants
- **Legitimate interests**: For product improvement with safeguards

### Data Minimization
- **Input**: Feedback text, module tags, severity, timestamps, tenant ID, role
- **Output**: Summaries, clusters, non-identifying excerpts, recommendations

### Special Category Data
- Expected in healthcare context
- Confined to improvement purposes
- Strict access controls and DPA addendum

### Data Subject Rights
- SAR/erasure propagation
- Output mapping to originating feedback IDs
- Automated compliance with data subject requests

### Cross-Border Transfers
- Processing in UK/EU where possible
- TIA and SCCs for external model usage
- Data residency compliance

## Operational Controls

### Logging and Audit
- Correlation IDs across all operations
- Immutable append-only logs
- WORM-capable storage for 6-8 years
- Replayable audit events

### Metrics and Alerts
- **Safety**: PII masking rate, PHI leakage detections
- **Quality**: Duplicate cluster rate, summarization coherence
- **Performance**: Queue latency, processing time, token costs
- **Compliance**: SAR/erasure propagation, DPIA status

### Testing and Validation
- Unit tests for masking and validation
- Red-team tests for security
- Shadow mode for 2-4 weeks
- Approval gate with ≥90% reviewer agreement

### Incident Response
- PHI leak detection and response
- Model misbehavior handling
- Cost runaway protection
- Kill switch: `agent.pilotFeedback.enabled=false`

## Rollout Plan

### Phase 1: Design Freeze
- DPIA completion and approval
- Guardrails and RBAC design
- Stakeholder sign-offs

### Phase 2: Shadow Mode
- Enable for 1-2 pilot tenants
- No externalized outputs
- Admin-only visibility

### Phase 3: Limited Recommend Mode
- Recommendations in review console
- No auto-ticketing
- Human approval required

### Phase 4: Scale-Out
- Expand to all pilot tenants
- Weekly compliance review
- Cost caps and monitoring

## Exit Criteria

### Shadow Mode → Recommend
- ≥95% PII masking accuracy
- Zero PHI leak incidents
- Queue latency < 5 minutes
- Red-team security pass

### Recommend → Broad Pilot
- Reviewer approval rate ≥ 80%
- Duplicate cluster rate < 15%
- SAR propagation test pass

### Pilot → GA
- 2 consecutive months with no major incidents
- DPIA residual risk "low"
- Support runbooks proven

## Security Controls

### Network Boundaries
- Private VNET/subnet
- No public egress except via approved proxy
- DLP scanning for data exfiltration

### Secrets Management
- KMS-backed encryption
- Short-lived tokens
- No secrets in prompts or logs

### Prompt Safety
- PII redaction before processing
- Length limits and stop sequences
- Toxicity blocklist filtering

### Auditability
- Correlation IDs for all operations
- Immutable audit logs
- Replayable event sequences

## Monitoring and Alerting

### Health Checks
- Database connectivity
- Queue processing status
- PII masking service
- Compliance service
- Audit service

### Alert Thresholds
- Error rate > 5% (critical)
- Queue size > 500 (warning)
- Processing time > 1 minute (critical)
- Memory usage > 1GB (warning)

### Dashboard Metrics
- Processing statistics
- Quality metrics
- Compliance scores
- Active alerts
- Trend analysis

## Troubleshooting

### Common Issues
1. **High error rate**: Check PII masking service and database connectivity
2. **Queue backlog**: Verify processing service and increase batch size
3. **PHI leakage**: Review masking patterns and update rules
4. **Compliance violations**: Check consent rates and audit completeness

### Debug Commands
```bash
# Check agent status
curl -X GET "/pilot/agent/status?tenantId=t-123"

# View recent errors
curl -X GET "/monitoring/agent/alerts?severity=critical"

# Trigger health check
curl -X POST "/monitoring/agent/health-check"
```

## Support and Maintenance

### Regular Maintenance
- Weekly compliance reviews
- Monthly security audits
- Quarterly DPIA updates
- Annual penetration testing

### Support Contacts
- **Technical Issues**: development-team@company.com
- **Compliance Questions**: dpo@company.com
- **Security Incidents**: security@company.com

### Documentation Updates
- Version control for all documentation
- Change tracking and approval
- Regular review and updates
- Stakeholder notification process

## Related Documentation

- [DPIA Pilot Feedback Agent](./DPIA-pilot-feedback-agent.md)
- [Prompt Guardrails](./prompt-guardrails.md)
- [Agent Runtime Security](./agent-runtime.md)
- [RoPA Update](./RoPA-update.md)
- [Red Team Plan](./agent-redteam-plan.md)
- [Agent Autonomy Policy](./agent-autonomy-policy.md)