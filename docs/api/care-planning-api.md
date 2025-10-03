# Care Planning API Documentation

## Overview

The Care Planning API provides comprehensive endpoints for managing care plans, care domains, and care interventions in WriteCareNotes. This API is designed to meet healthcare compliance requirements across the British Isles.

## Base URL

```
https://api.writecarenotes.com/v1
```

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

## Rate Limiting

- General operations: 100 requests per 15 minutes
- Sensitive operations: 20 requests per hour

## Compliance Standards

This API complies with:
- CQC (Care Quality Commission) - England
- Care Inspectorate - Scotland
- CIW (Care Inspectorate Wales) - Wales
- RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
- GDPR and Data Protection Act 2018

## Care Plan Endpoints

### Create Care Plan

Creates a new care plan for a resident.

**Endpoint:** `POST /care-plans`

**Required Permissions:** `care_record:create`

**Request Body:**
```json
{
  "residentId": "uuid",
  "planName": "string (5-200 chars)",
  "planType": "initial|updated|emergency|discharge|respite",
  "description": "string (optional, max 2000 chars)",
  "effectiveFrom": "ISO 8601 datetime",
  "effectiveUntil": "ISO 8601 datetime (optional)",
  "reviewFrequency": "weekly|fortnightly|monthly|quarterly|annually|as_needed",
  "nextReviewDate": "ISO 8601 datetime",
  "priority": "low|medium|high|critical",
  "careTeam": ["uuid"] (optional, max 20 members),
  "notes": "string (optional, max 1000 chars)",
  "tags": ["string"] (optional, max 10 tags)
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "residentId": "uuid",
    "planName": "string",
    "planType": "string",
    "status": "draft",
    "description": "string",
    "effectiveFrom": "ISO 8601 datetime",
    "effectiveUntil": "ISO 8601 datetime",
    "reviewFrequency": "string",
    "nextReviewDate": "ISO 8601 datetime",
    "priority": "string",
    "careTeam": ["uuid"],
    "notes": "string",
    "tags": ["string"],
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime",
    "createdBy": "uuid",
    "updatedBy": "uuid",
    "domainCount": 0,
    "interventionCount": 0
  },
  "meta": {
    "timestamp": "ISO 8601 datetime",
    "version": "v1"
  }
}
```

### Get Care Plans

Retrieves care plans with filtering and pagination.

**Endpoint:** `GET /care-plans`

**Required Permissions:** `care_record:read`

**Query Parameters:**
- `page` (integer, min: 1, default: 1) - Page number
- `limit` (integer, min: 1, max: 100, default: 20) - Items per page
- `status` (string) - Filter by status: `draft|active|under_review|suspended|completed|archived`
- `type` (string) - Filter by type: `initial|updated|emergency|discharge|respite`
- `priority` (string) - Filter by priority: `low|medium|high|critical`
- `residentId` (uuid) - Filter by resident ID
- `search` (string, 2-100 chars) - Search term
- `sortBy` (string) - Sort field: `planName|createdAt|effectiveFrom|nextReviewDate|priority`
- `sortDirection` (string) - Sort direction: `asc|desc`
- `careTeamMember` (uuid) - Filter by care team member
- `tags` (array) - Filter by tags

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "residentId": "uuid",
      "planName": "string",
      "planType": "string",
      "status": "string",
      "priority": "string",
      "createdAt": "ISO 8601 datetime",
      "updatedAt": "ISO 8601 datetime",
      "domainCount": 5,
      "interventionCount": 12
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false,
    "timestamp": "ISO 8601 datetime",
    "version": "v1"
  }
}
```

### Get Care Plan by ID

Retrieves a specific care plan by its ID.

**Endpoint:** `GET /care-plans/{id}`

**Required Permissions:** `care_record:read`

**Path Parameters:**
- `id` (uuid) - Care plan ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "residentId": "uuid",
    "planName": "string",
    "planType": "string",
    "status": "string",
    "description": "string",
    "effectiveFrom": "ISO 8601 datetime",
    "effectiveUntil": "ISO 8601 datetime",
    "reviewFrequency": "string",
    "nextReviewDate": "ISO 8601 datetime",
    "priority": "string",
    "careTeam": ["uuid"],
    "notes": "string",
    "tags": ["string"],
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime",
    "createdBy": "uuid",
    "updatedBy": "uuid",
    "domainCount": 5,
    "interventionCount": 12
  },
  "meta": {
    "timestamp": "ISO 8601 datetime",
    "version": "v1"
  }
}
```

### Update Care Plan

Updates an existing care plan.

**Endpoint:** `PUT /care-plans/{id}`

**Required Permissions:** `care_record:update`

**Path Parameters:**
- `id` (uuid) - Care plan ID

**Request Body:**
```json
{
  "planName": "string (optional, 5-200 chars)",
  "planType": "string (optional)",
  "description": "string (optional, max 2000 chars)",
  "effectiveUntil": "ISO 8601 datetime (optional)",
  "reviewFrequency": "string (optional)",
  "nextReviewDate": "ISO 8601 datetime (optional)",
  "priority": "string (optional)",
  "careTeam": ["uuid"] (optional, max 20 members),
  "notes": "string (optional, max 1000 chars)",
  "tags": ["string"] (optional, max 10 tags)
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "residentId": "uuid",
    "planName": "string",
    "planType": "string",
    "status": "string",
    "description": "string",
    "effectiveFrom": "ISO 8601 datetime",
    "effectiveUntil": "ISO 8601 datetime",
    "reviewFrequency": "string",
    "nextReviewDate": "ISO 8601 datetime",
    "priority": "string",
    "careTeam": ["uuid"],
    "notes": "string",
    "tags": ["string"],
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime",
    "createdBy": "uuid",
    "updatedBy": "uuid",
    "domainCount": 5,
    "interventionCount": 12
  },
  "meta": {
    "timestamp": "ISO 8601 datetime",
    "version": "v1"
  }
}
```

### Delete Care Plan

Soft deletes a care plan (maintains audit trail).

**Endpoint:** `DELETE /care-plans/{id}`

**Required Permissions:** `care_record:delete`

**Path Parameters:**
- `id` (uuid) - Care plan ID

**Response (204):** No content

### Activate Care Plan

Activates a care plan making it effective for resident care.

**Endpoint:** `POST /care-plans/{id}/activate`

**Required Permissions:** `care_record:update`

**Path Parameters:**
- `id` (uuid) - Care plan ID

**Request Body:**
```json
{
  "reason": "string (optional, max 500 chars)",
  "effectiveDate": "ISO 8601 datetime (optional)",
  "notifyTeam": ["uuid"] (optional)
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "activatedAt": "ISO 8601 datetime",
    "activatedBy": "uuid"
  },
  "meta": {
    "timestamp": "ISO 8601 datetime",
    "version": "v1"
  }
}
```

### Schedule Care Plan Review

Schedules or conducts a comprehensive review of the care plan.

**Endpoint:** `POST /care-plans/{id}/review`

**Required Permissions:** `care_record:update`

**Path Parameters:**
- `id` (uuid) - Care plan ID

**Request Body:**
```json
{
  "reviewType": "scheduled|emergency|incident_triggered|family_requested|regulatory",
  "reason": "string (optional, max 1000 chars)",
  "reviewDate": "ISO 8601 datetime",
  "reviewers": ["uuid"] (optional, 1-10 reviewers),
  "focusAreas": ["string"] (optional),
  "priority": "low|medium|high|critical (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reviewId": "uuid",
    "reviewType": "string",
    "reviewDate": "ISO 8601 datetime",
    "status": "scheduled",
    "reviewers": ["uuid"],
    "focusAreas": ["string"]
  },
  "meta": {
    "timestamp": "ISO 8601 datetime",
    "version": "v1"
  }
}
```

### Generate Care Plan from Template

Generates a personalized care plan from a template using assessment data.

**Endpoint:** `POST /care-plans/generate`

**Required Permissions:** `care_record:create`

**Request Body:**
```json
{
  "residentId": "uuid",
  "templateId": "uuid",
  "assessmentData": {
    "mobilityLevel": "string",
    "cognitiveStatus": "string",
    "socialNeeds": "string",
    "medicalConditions": ["string"]
  },
  "customName": "string (optional, 5-200 chars)",
  "priority": "low|medium|high|critical (optional)",
  "careTeam": ["uuid"] (optional, max 20 members),
  "customizationOptions": {
    "includeStandardInterventions": true,
    "customizeForConditions": true,
    "addFamilyPreferences": true
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "residentId": "uuid",
    "planName": "string",
    "planType": "initial",
    "status": "draft",
    "priority": "string",
    "createdAt": "ISO 8601 datetime",
    "createdBy": "uuid",
    "generatedFromTemplate": "uuid",
    "domainCount": 8,
    "interventionCount": 15
  },
  "meta": {
    "timestamp": "ISO 8601 datetime",
    "version": "v1"
  }
}
```

## Care Domain Endpoints

### Add Care Domain to Care Plan

Adds a new care domain to an existing care plan.

**Endpoint:** `POST /care-plans/{planId}/domains`

**Required Permissions:** `care_record:create`

**Path Parameters:**
- `planId` (uuid) - Care plan ID

**Request Body:**
```json
{
  "domainName": "string (3-100 chars)",
  "category": "physical_health|mental_health|cognitive_function|social_wellbeing|nutrition_hydration|medication_management|safety_security|personal_care|communication|spiritual_cultural|environmental|family_relationships",
  "description": "string (optional, max 1000 chars)",
  "priority": "low|medium|high|critical",
  "assessmentLevel": "low|moderate|high|critical",
  "riskLevel": "minimal|low|moderate|high|severe",
  "assessmentScore": "number (optional, 0-100)",
  "lastAssessmentDate": "ISO 8601 datetime (optional)",
  "nextAssessmentDate": "ISO 8601 datetime",
  "assignedTeam": ["uuid"] (optional, max 10 members),
  "goals": ["string"] (optional, max 10 goals),
  "notes": "string (optional, max 1000 chars)",
  "tags": ["string"] (optional, max 10 tags)
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "carePlanId": "uuid",
    "domainName": "string",
    "category": "string",
    "status": "active",
    "description": "string",
    "priority": "string",
    "assessmentLevel": "string",
    "riskLevel": "string",
    "assessmentScore": 75,
    "lastAssessmentDate": "ISO 8601 datetime",
    "nextAssessmentDate": "ISO 8601 datetime",
    "assignedTeam": ["uuid"],
    "goals": ["string"],
    "notes": "string",
    "tags": ["string"],
    "createdAt": "ISO 8601 datetime",
    "updatedAt": "ISO 8601 datetime",
    "createdBy": "uuid",
    "interventionCount": 0
  },
  "meta": {
    "timestamp": "ISO 8601 datetime",
    "version": "v1"
  }
}
```

### Get Care Domains for Care Plan

Retrieves all care domains associated with a specific care plan.

**Endpoint:** `GET /care-plans/{planId}/domains`

**Required Permissions:** `care_record:read`

**Path Parameters:**
- `planId` (uuid) - Care plan ID

**Query Parameters:**
- `page` (integer, min: 1, default: 1) - Page number
- `limit` (integer, min: 1, max: 100, default: 20) - Items per page
- `status` (string) - Filter by status: `active|inactive|under_assessment|needs_attention|resolved`
- `category` (string) - Filter by domain category
- `priority` (string) - Filter by priority: `low|medium|high|critical`
- `riskLevel` (string) - Filter by risk level: `minimal|low|moderate|high|severe`
- `assignedTeamMember` (uuid) - Filter by assigned team member
- `search` (string, 2-100 chars) - Search term
- `sortBy` (string) - Sort field: `domainName|priority|riskLevel|assessmentScore|nextAssessmentDate`
- `sortDirection` (string) - Sort direction: `asc|desc`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "carePlanId": "uuid",
      "domainName": "string",
      "category": "string",
      "status": "string",
      "priority": "string",
      "riskLevel": "string",
      "assessmentScore": 75,
      "nextAssessmentDate": "ISO 8601 datetime",
      "interventionCount": 3
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false,
    "timestamp": "ISO 8601 datetime",
    "version": "v1"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": "Specific validation error details",
    "timestamp": "ISO 8601 datetime"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "timestamp": "ISO 8601 datetime"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "timestamp": "ISO 8601 datetime"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "timestamp": "ISO 8601 datetime"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "timestamp": "ISO 8601 datetime",
    "retryAfter": 900
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred",
    "timestamp": "ISO 8601 datetime"
  }
}
```

## Healthcare Compliance Notes

### Audit Trail
All API operations are logged for regulatory compliance:
- User identification and authentication
- Operation type and timestamp
- Resource accessed or modified
- IP address and user agent
- Compliance flags for regulatory reporting

### Data Protection
- All sensitive data is encrypted at rest and in transit
- GDPR compliance with data subject rights
- Automatic data retention policy enforcement
- Secure data export capabilities for regulatory reporting

### Access Control
- Role-based access control (RBAC)
- Principle of least privilege
- Care home context isolation
- Session management and validation

### Performance Standards
- API response times < 200ms for standard operations
- 99.9% uptime requirement
- Horizontal scaling capability
- Comprehensive monitoring and alerting

## SDK and Integration Examples

### JavaScript/Node.js
```javascript
const careNotes = new WriteCareNotesAPI({
  baseURL: 'https://api.writecarenotes.com/v1',
  apiKey: 'your-api-key'
});

// Create care plan
const carePlan = await careNotes.carePlans.create({
  residentId: 'resident-123',
  planName: 'Comprehensive Care Plan',
  planType: 'initial',
  effectiveFrom: '2025-01-10T00:00:00.000Z',
  reviewFrequency: 'monthly',
  nextReviewDate: '2025-02-10T10:00:00.000Z',
  priority: 'high'
});

// Get care plans
const carePlans = await careNotes.carePlans.list({
  residentId: 'resident-123',
  status: 'active',
  page: 1,
  limit: 20
});
```

### Python
```python
from writecarenotes import WriteCareNotesAPI

client = WriteCareNotesAPI(
    base_url='https://api.writecarenotes.com/v1',
    api_key='your-api-key'
)

# Create care plan
care_plan = client.care_plans.create({
    'residentId': 'resident-123',
    'planName': 'Comprehensive Care Plan',
    'planType': 'initial',
    'effectiveFrom': '2025-01-10T00:00:00.000Z',
    'reviewFrequency': 'monthly',
    'nextReviewDate': '2025-02-10T10:00:00.000Z',
    'priority': 'high'
})

# Get care plans
care_plans = client.care_plans.list(
    resident_id='resident-123',
    status='active',
    page=1,
    limit=20
)
```

## Support and Resources

- **API Status:** https://status.writecarenotes.com
- **Developer Portal:** https://developers.writecarenotes.com
- **Support:** support@writecarenotes.com
- **Documentation:** https://docs.writecarenotes.com
- **Compliance:** compliance@writecarenotes.com