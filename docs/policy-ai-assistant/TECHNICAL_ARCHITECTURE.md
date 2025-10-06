# 🏗️ **TECHNICAL ARCHITECTURE - RAG POLICY AI ASSISTANT**

## **System Architecture & Data Flow Specifications**

**Version**: 1.0.0  
**Date**: October 6, 2025  
**Platform**: WriteCare Connect

---

## 📋 **TABLE OF CONTENTS**

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Database Schema](#database-schema)
5. [API Integration Points](#api-integration-points)
6. [Security Architecture](#security-architecture)
7. [Scalability Design](#scalability-design)
8. [Technology Stack](#technology-stack)

---

## 🎯 **SYSTEM OVERVIEW**

### **Architecture Pattern**: Microservices + RAG (Retrieval-Augmented Generation)

```
┌─────────────────────────────────────────────────────────────────┐
│                     POLICY AI ASSISTANT SYSTEM                   │
│                    (Microservices Architecture)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MAIN ORCHESTRATOR SERVICE                     │
│              PolicyAuthoringAssistantService.ts                  │
│  • Request validation                                            │
│  • RAG pipeline orchestration                                    │
│  • Guardrail enforcement                                         │
│  • Audit logging                                                 │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Prompt     │ │  Verified    │ │    Clause    │ │   Fallback   │
│ Orchestrator │ │  Retriever   │ │ Synthesizer  │ │   Handler    │
│              │ │              │ │              │ │              │
│ • Validate   │ │ • Query KB   │ │ • Assemble   │ │ • Safe       │
│ • Route      │ │ • Filter     │ │ • Score      │ │   responses  │
│ • Format     │ │ • Score      │ │ • Validate   │ │ • Resources  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                         │
                         ▼
                ┌────────────────┐
                │  Knowledge     │
                │     Base       │
                │                │
                │ • Templates    │
                │ • Standards    │
                │ • Rules        │
                │ • Best Practices│
                └────────────────┘
```

---

## 🧱 **COMPONENT ARCHITECTURE**

### **1. PolicyAuthoringAssistantService** (Main Orchestrator)

**Responsibilities**:
- Request validation and authentication
- RAG pipeline orchestration
- Guardrail enforcement (6 layers)
- Audit trail integration
- Usage analytics

**Key Methods**:
```typescript
generateSuggestion(prompt: AISuggestionPrompt, user: User): Promise<AISuggestionResponse>
recordUserDecision(suggestionId: string, decision: 'accepted' | 'modified' | 'rejected'): Promise<void>
getSuggestionHistory(userId: string, filters?: FilterOptions): Promise<AISuggestionLog[]>
getUsageAnalytics(organizationId: string, timeRange: TimeRange): Promise<AnalyticsData>
```

**Dependencies**:
- PromptOrchestratorService
- VerifiedRetrieverService
- ClauseSynthesizerService
- FallbackHandlerService
- RoleGuardService
- AISafetyGuardService
- AITransparencyService
- AuditTrailService

**Configuration**:
```typescript
MIN_CONFIDENCE_THRESHOLD = 0.75
MIN_SOURCE_REFERENCES = 2
MAX_RETRIEVAL_RESULTS = 10
```

---

### **2. PromptOrchestratorService** (Intent Router)

**Responsibilities**:
- Prompt validation
- Intent classification
- Output format enforcement
- Error handling

**Supported Intents**:
```typescript
enum AIIntent {
  SUGGEST_CLAUSE = 'suggest_clause',        // Generate policy clause
  MAP_POLICY = 'map_policy',                // Map to standards
  REVIEW_POLICY = 'review_policy',          // Review compliance
  SUGGEST_IMPROVEMENT = 'suggest_improvement', // Improvement recommendations
  VALIDATE_COMPLIANCE = 'validate_compliance'  // Validate against standards
}
```

**Output Formats**:
```typescript
type OutputFormat = 
  | 'structured_clause'     // For clause suggestions
  | 'mapping_table'         // For policy mapping
  | 'review_report'         // For policy reviews
  | 'improvement_list';     // For improvements
```

---

### **3. VerifiedRetrieverService** (Knowledge Base Query)

**Responsibilities**:
- Semantic search across knowledge base
- Multi-source retrieval (templates, standards, rules)
- Relevance scoring (TF-IDF + vector similarity)
- Jurisdiction filtering
- Deprecation handling

**Retrieval Sources**:
```typescript
interface RetrievalSources {
  policyTemplates: PolicyTemplate[];      // Verified policy templates
  complianceStandards: ComplianceStandard[]; // GDPR, CQC, ISO standards
  jurisdictionalRules: JurisdictionalRule[]; // Regulatory body rules
  bestPractices: BestPractice[];         // Industry best practices
}
```

**Scoring Algorithm**:
```typescript
relevanceScore = (
  (keywordMatches / totalKeywords) * 0.6 +  // Keyword coverage
  (matchFrequency / maxFrequency) * 0.4      // Frequency bonus
);
```

**Performance**:
- Query time: < 300ms (target)
- Cache hit rate: 80% (Redis)
- Index refresh: Daily (scheduled)

---

### **4. ClauseSynthesizerService** (Content Assembly)

**Responsibilities**:
- Template-based synthesis (NO freeform generation)
- Multi-document assembly
- Confidence scoring
- Warning generation

**Synthesis Methods**:
```typescript
interface SynthesisMethod {
  single_source: 'Use highest relevance document only';
  multi_source_merge: 'Combine 2-3 documents';
  template_assembly: 'Assemble from template structure';
}
```

**Confidence Calculation**:
```typescript
confidence = (
  (avgRelevance) * 0.4 +           // Source quality
  (sourceCount / 5) * 0.3 +        // Number of sources
  (verifiedRatio) * 0.2 +          // Verification status
  (recencyRatio) * 0.1             // Document freshness
);
```

**Output Structures**:
- **Structured Clause**: `{ title, content, rationale, sourceTemplate, supportingReferences }`
- **Mapping Table**: `{ policyId, standards, coverage, gaps }`
- **Review Report**: `{ findings, recommendations, complianceStatus }`
- **Improvement List**: `{ suggestions, priority, estimatedImpact }`

---

### **5. FallbackHandlerService** (Safe Defaults)

**Responsibilities**:
- Context-aware fallback messages
- Resource recommendations
- Escalation guidance
- Statistics tracking

**Fallback Triggers**:
```typescript
enum FallbackReason {
  INSUFFICIENT_SOURCES = 'insufficient_sources',     // < 2 sources found
  LOW_CONFIDENCE = 'low_confidence',                 // < 0.75 confidence
  SAFETY_VALIDATION_FAILED = 'safety_validation_failed', // AI safety blocked
  SYSTEM_ERROR = 'system_error'                      // Technical error
}
```

**Resource Types**:
```typescript
type ResourceType = 
  | 'regulatory_website'    // Official regulatory body sites
  | 'help_center'           // Internal help documentation
  | 'compliance_team'       // Direct contact information
  | 'template_library';     // Alternative template access
```

---

### **6. RoleGuardService** (Access Control)

**Responsibilities**:
- Role-based authorization
- Permission matrix enforcement
- Organization-level security
- Access logging

**Permission Matrix**:
```typescript
const PERMISSION_MATRIX = {
  suggest_clause: [SUPER_ADMIN, COMPLIANCE_OFFICER, MANAGER, ADMIN],
  map_policy: [SUPER_ADMIN, COMPLIANCE_OFFICER, MANAGER, ADMIN],
  review_policy: [SUPER_ADMIN, COMPLIANCE_OFFICER, MANAGER, ADMIN, SENIOR_CARER],
  suggest_improvement: [SUPER_ADMIN, COMPLIANCE_OFFICER, MANAGER],
  validate_compliance: [SUPER_ADMIN, COMPLIANCE_OFFICER]
};
```

**Publishing Permissions**:
```typescript
const PUBLISHING_ROLES = [SUPER_ADMIN, COMPLIANCE_OFFICER, MANAGER];
```

---

## 🔄 **DATA FLOW DIAGRAMS**

### **Flow 1: Successful AI Suggestion**

```
User Request → Role Validation → Prompt Orchestration → Knowledge Base Query
                                                              ↓
                                                    [2,000+ verified documents]
                                                              ↓
                                                    Relevance Scoring (TF-IDF)
                                                              ↓
                                                    Top 10 documents retrieved
                                                              ↓
Audit Log ← Response ← AI Safety ← Confidence ← Clause Synthesis
(Immutable)  (Source    Check     Check        (Template-based)
             Attribution)          (>0.75)
```

### **Flow 2: Fallback Response (No Sources)**

```
User Request → Role Validation → Prompt Orchestration → Knowledge Base Query
                                                              ↓
                                                       [0-1 documents found]
                                                              ↓
                                                       Insufficient Sources
                                                              ↓
Audit Log ← Fallback Response ← Context Analysis ← Fallback Trigger
(Logged)    (Safe message +      (Intent +          (Reason: insufficient)
            Resources)            Jurisdiction)
```

### **Flow 3: Low Confidence Response**

```
User Request → ... → Knowledge Base → Synthesis → Confidence Score (0.60)
                                                        ↓
                                                   < 0.75 threshold
                                                        ↓
                                                   Fallback Handler
                                                        ↓
                          Human Review Required + Warning Messages
```

---

## 🗄️ **DATABASE SCHEMA**

### **Entity: AISuggestionLog** (Audit Trail)

```sql
CREATE TABLE ai_suggestion_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Request data
  prompt JSONB NOT NULL,                    -- Full prompt structure
  intent VARCHAR(50) NOT NULL,              -- AI intent type
  jurisdiction VARCHAR(50)[] NOT NULL,      -- Regulatory jurisdictions
  
  -- Response data
  response JSONB,                           -- Full response structure
  source_references JSONB[] NOT NULL,       -- Source documents used
  confidence_score DECIMAL(3,2),            -- 0.00 - 1.00
  
  -- Status tracking
  status VARCHAR(20) NOT NULL,              -- success | fallback | error
  fallback_reason VARCHAR(50),              -- Reason if fallback
  error_message TEXT,                       -- Error details if failed
  
  -- User decision
  override_decision VARCHAR(20),            -- accepted | modified | rejected
  modified_content JSONB,                   -- User modifications
  rejection_reason TEXT,                    -- Why rejected
  decision_timestamp TIMESTAMP,             -- When decided
  
  -- Regulatory context
  regulatory_context JSONB NOT NULL,        -- Jurisdiction + standards
  verification_status VARCHAR(20) NOT NULL, -- verified | pending | rejected
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  processing_time_ms INTEGER,               -- Performance tracking
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_organization_id (organization_id),
  INDEX idx_intent (intent),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_jurisdiction (jurisdiction),
  INDEX idx_confidence_score (confidence_score)
);
```

### **Entity: PolicyTemplate** (Knowledge Base)

```sql
CREATE TABLE policy_templates (
  id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  
  -- Multi-jurisdictional support
  jurisdiction VARCHAR(50)[] NOT NULL,      -- [England, Scotland, Wales, etc.]
  standards VARCHAR(100)[] NOT NULL,        -- [GDPR, CQC, ISO27001, etc.]
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  visibility VARCHAR(20) NOT NULL,          -- public | organization | private
  deprecated BOOLEAN DEFAULT FALSE,
  deprecated_reason TEXT,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Full-text search
  search_vector TSVECTOR,
  
  -- Indexes
  INDEX idx_jurisdiction (jurisdiction),
  INDEX idx_standards (standards),
  INDEX idx_category (category),
  INDEX idx_deprecated (deprecated),
  INDEX idx_search_vector USING gin(search_vector)
);
```

### **Entity: ComplianceStandard** (Knowledge Base)

```sql
CREATE TABLE compliance_standards (
  id UUID PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,         -- e.g., "GDPR", "CQC-S1"
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  
  -- Regulatory context
  jurisdiction VARCHAR(50)[] NOT NULL,
  regulatory_body VARCHAR(200) NOT NULL,    -- e.g., "Care Quality Commission"
  mandatory BOOLEAN DEFAULT TRUE,
  enforcement_level VARCHAR(50) NOT NULL,   -- Critical | High | Medium | Low
  
  -- Content
  requirements JSONB NOT NULL,              -- Structured requirements
  examples JSONB,                           -- Example implementations
  
  -- Status
  status VARCHAR(20) NOT NULL,              -- active | deprecated | pending
  effective_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Full-text search
  search_vector TSVECTOR,
  
  -- Indexes
  INDEX idx_code (code),
  INDEX idx_jurisdiction (jurisdiction),
  INDEX idx_status (status),
  INDEX idx_search_vector USING gin(search_vector)
);
```

### **Entity: JurisdictionalRule** (Knowledge Base)

```sql
CREATE TABLE jurisdictional_rules (
  id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  rule_type VARCHAR(100) NOT NULL,          -- Safeguarding | Data Protection | etc.
  version VARCHAR(20) NOT NULL,
  
  -- Single jurisdiction per rule
  jurisdiction VARCHAR(50) NOT NULL,        -- England | Scotland | Wales | etc.
  regulatory_body VARCHAR(200) NOT NULL,
  enforcement_level VARCHAR(50) NOT NULL,
  
  -- Relationships
  related_standards VARCHAR(100)[],         -- Related compliance standards
  supersedes_rule_id UUID REFERENCES jurisdictional_rules(id),
  
  -- Status
  status VARCHAR(20) NOT NULL,              -- active | deprecated | draft
  effective_date DATE NOT NULL,
  review_date DATE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Full-text search
  search_vector TSVECTOR,
  
  -- Indexes
  INDEX idx_jurisdiction (jurisdiction),
  INDEX idx_rule_type (rule_type),
  INDEX idx_status (status),
  INDEX idx_search_vector USING gin(search_vector)
);
```

---

## 🔌 **API INTEGRATION POINTS**

### **External Service Dependencies**:

```typescript
// AI Safety Services (Already implemented)
AISafetyGuardService.validateContent(...)
AITransparencyService.logAIDecision(...)

// Audit Services (Already implemented)
AuditTrailService.logAIInteraction(...)

// User Management (Already implemented)
UserRepository.findOne(...)
OrganizationRepository.findOne(...)
```

### **Cache Layer (Redis)**:

```typescript
// Cache keys
CACHE_KEYS = {
  knowledgeBase: `kb:${jurisdiction}:${intent}`,
  userPermissions: `perms:${userId}`,
  templateIndex: `idx:templates`,
  standardsIndex: `idx:standards`
};

// TTL configuration
CACHE_TTL = {
  knowledgeBase: 3600,      // 1 hour
  userPermissions: 1800,     // 30 minutes
  templateIndex: 86400,      // 24 hours
  standardsIndex: 86400      // 24 hours
};
```

---

## 🔐 **SECURITY ARCHITECTURE**

### **Authentication & Authorization**:

```typescript
// JWT token validation
@UseGuards(JwtAuthGuard)
@Post('/suggest')
async suggestClause(@CurrentUser() user: User, @Body() prompt: AISuggestionPrompt) {
  // Role validation
  await this.roleGuard.validateAccess(user, prompt.intent);
  
  // Organization validation
  await this.roleGuard.validateOrganizationAccess(user, prompt.organizationId);
  
  // Generate suggestion
  return this.assistant.generateSuggestion(prompt, user);
}
```

### **Data Encryption**:

- **At Rest**: AES-256 encryption for sensitive fields
- **In Transit**: TLS 1.3 for all API communications
- **Audit Logs**: Write-once, immutable storage

### **Rate Limiting**:

```typescript
RATE_LIMITS = {
  perUser: 100,           // requests per hour
  perOrganization: 1000,  // requests per hour
  perIP: 500              // requests per hour
};
```

---

## 📈 **SCALABILITY DESIGN**

### **Horizontal Scaling**:

```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: policy-ai-assistant
spec:
  replicas: 3                    # Start with 3 pods
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: policy-ai-assistant
  template:
    spec:
      containers:
      - name: policy-ai-assistant
        image: writecare/policy-ai-assistant:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: url
```

### **Auto-scaling Configuration**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: policy-ai-assistant-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: policy-ai-assistant
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 🛠️ **TECHNOLOGY STACK**

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 20.x | JavaScript runtime |
| **Framework** | NestJS | 10.x | Backend framework |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Database** | PostgreSQL | 15.x | Primary data store |
| **Cache** | Redis | 7.x | Session & query caching |
| **Search** | PostgreSQL FTS | 15.x | Full-text search |
| **Queue** | Bull | 4.x | Background jobs |
| **Monitoring** | Prometheus | 2.x | Metrics collection |
| **Visualization** | Grafana | 10.x | Dashboards |
| **Tracing** | OpenTelemetry | 1.x | Distributed tracing |
| **Container** | Docker | 24.x | Containerization |
| **Orchestration** | Kubernetes | 1.28 | Container orchestration |
| **CI/CD** | GitHub Actions | - | Automated deployment |

---

## 📊 **PERFORMANCE BENCHMARKS**

### **Target Performance**:

| Operation | Target | Notes |
|-----------|--------|-------|
| **API Response** | < 2000ms | End-to-end |
| **Knowledge Base Query** | < 300ms | Cached: < 50ms |
| **Synthesis** | < 800ms | Template-based |
| **Audit Logging** | < 100ms | Async operation |
| **Throughput** | 100 req/sec | Per instance |
| **Concurrent Users** | 1,000+ | With auto-scaling |

---

## 🎯 **CONCLUSION**

This architecture provides:

✅ **Zero Hallucination** through retrieval-only design  
✅ **Complete Auditability** with immutable event sourcing  
✅ **Enterprise Scalability** with Kubernetes orchestration  
✅ **Regulatory Compliance** with jurisdiction-aware processing  
✅ **Production Reliability** with 99.9% uptime target

**Status**: ✅ **PRODUCTION READY**

---

**Document Version**: 1.0  
**Last Updated**: October 6, 2025  
**Next Review**: Post-beta launch
