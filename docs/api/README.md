# WriteCareNotes API Documentation

## Overview

The WriteCareNotes API provides comprehensive endpoints for managing all aspects of care home operations, from resident management to financial analytics. This documentation covers all available endpoints, authentication, error handling, and integration examples.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Core APIs](#core-apis)
4. [Service-Specific APIs](#service-specific-apis)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [SDKs and Examples](#sdks-and-examples)
8. [Support](#support)

## Getting Started

### Base URLs

- **Production**: `https://api.writecarenotes.com/v1`
- **Staging**: `https://staging-api.writecarenotes.com/v1`
- **Development**: `http://localhost:3000/v1`

### Quick Start

1. **Get API Key**: Contact your system administrator for API credentials
2. **Authenticate**: Use JWT authentication for all requests
3. **Make Requests**: Use the appropriate endpoints for your use case

```bash
# Example: Get system health
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.writecarenotes.com/v1/health
```

## Authentication

All API requests require JWT authentication via the `Authorization` header:

```http
Authorization: Bearer <jwt-token>
```

### Getting a Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Token Refresh

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

## Core APIs

### Health & Status
- [Health Endpoints](./endpoints.md#health-endpoints) - System health monitoring
- [Metrics](./endpoints.md#metrics) - Performance and system metrics

### Authentication
- [Authentication Endpoints](./endpoints.md#authentication-endpoints) - Login, logout, token management

### Resident Management
- [Resident API](./resident-api.md) - Resident profiles, care records, family contacts
- [Care Planning API](./care-planning-api.md) - Care plans, domains, interventions
- [Medication API](./medication-api.md) - Medication management and tracking

### Clinical Services
- [NHS Integration API](./nhs-integration-api.md) - NHS Digital integration
- [Consent Management API](./consent-api.md) - Consent tracking and compliance
- [Clinical Records API](./clinical-records-api.md) - Medical records and assessments

## Service-Specific APIs

### Financial Services
- [Financial Analytics API](./financial-analytics-api.md) - Transactions, budgets, forecasting
- [Billing API](./billing-api.md) - Invoicing, payments, financial reporting

### Operational Services
- [Staff Management API](./staff-api.md) - Staff profiles, schedules, training
- [Facility Management API](./facility-api.md) - Room management, maintenance
- [Inventory API](./inventory-api.md) - Supplies, equipment tracking

### Communication Services
- [Notification API](./notification-api.md) - Email, SMS, push notifications
- [Family Portal API](./family-portal-api.md) - Family communication and updates
- [Reporting API](./reporting-api.md) - Custom reports and analytics

### AI & Analytics
- [AI Agent API](./ai-agent-api.md) - AI-powered care assistance
- [Analytics API](./analytics-api.md) - Data insights and predictions
- [Compliance API](./compliance-api.md) - Regulatory compliance monitoring

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "v1",
    "correlationId": "uuid"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... },
    "timestamp": "2025-01-15T10:30:00Z",
    "correlationId": "uuid"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

### Limits by Endpoint Type
- **Standard Operations**: 100 requests per 15 minutes
- **Sensitive Operations**: 20 requests per hour
- **Bulk Operations**: 10 requests per hour
- **Report Generation**: 5 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## SDKs and Examples

### Available SDKs
- **JavaScript/TypeScript**: `@writecarenotes/api-client`
- **Python**: `writecarenotes-api`
- **Java**: `com.writecarenotes.api`
- **C#**: `WriteCareNotes.ApiClient`

### Quick Examples

#### JavaScript/TypeScript
```typescript
import { WriteCareNotesAPI } from '@writecarenotes/api-client';

const client = new WriteCareNotesAPI({
  baseURL: 'https://api.writecarenotes.com/v1',
  apiKey: 'your-api-key'
});

// Get residents
const residents = await client.residents.list({
  page: 1,
  limit: 20,
  status: 'active'
});

// Create care plan
const carePlan = await client.carePlans.create({
  residentId: 'resident-123',
  planName: 'Comprehensive Care Plan',
  planType: 'initial'
});
```

#### Python
```python
from writecarenotes_api import WriteCareNotesClient

client = WriteCareNotesClient(
    base_url='https://api.writecarenotes.com/v1',
    api_key='your-api-key'
)

# Get residents
residents = client.residents.list(
    page=1,
    limit=20,
    status='active'
)

# Create medication record
medication = client.medications.create({
    'resident_id': 'resident-123',
    'name': 'Paracetamol',
    'dosage': '500mg',
    'frequency': 'twice daily'
})
```

## Pagination

All list endpoints support pagination:

### Parameters
- `page` (integer, min: 1, default: 1) - Page number
- `limit` (integer, min: 1, max: 100, default: 20) - Items per page

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering and Sorting

### Filtering
Use query parameters to filter results:
```http
GET /residents?status=active&department=nursing&search=john
```

### Sorting
Use `sortBy` and `sortOrder` parameters:
```http
GET /residents?sortBy=lastName&sortOrder=asc
```

### Search
Use `search` parameter for text search across relevant fields:
```http
GET /residents?search=john smith
```

## Webhooks

The API supports webhooks for real-time notifications:

### Supported Events
- `resident.created`
- `resident.updated`
- `care_plan.activated`
- `medication.due`
- `incident.reported`
- `compliance.alert`

### Webhook Configuration
```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/writecarenotes",
  "events": ["resident.created", "medication.due"],
  "secret": "your-webhook-secret"
}
```

## Compliance and Security

### Data Protection
- All data encrypted in transit (TLS 1.3)
- Sensitive data encrypted at rest (AES-256)
- GDPR compliant data processing
- Automatic data retention enforcement

### Healthcare Compliance
- CQC (Care Quality Commission) compliance
- NHS Digital integration standards
- Data Protection Act 2018 compliance
- Healthcare-specific audit trails

### Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- API key management
- Rate limiting and DDoS protection
- Comprehensive audit logging

## Support

### Resources
- **API Status**: https://status.writecarenotes.com
- **Developer Portal**: https://developers.writecarenotes.com
- **Interactive API Docs**: https://api.writecarenotes.com/docs
- **SDK Repository**: https://github.com/writecarenotes/api-sdks

### Contact
- **Technical Support**: api-support@writecarenotes.com
- **Integration Support**: integrations@writecarenotes.com
- **Compliance Questions**: compliance@writecarenotes.com
- **Emergency Support**: +44 800 123 4567

### Documentation Updates
This documentation is updated regularly. Check the changelog for the latest updates:
- [API Changelog](./CHANGELOG.md)
- [Release Notes](./RELEASE_NOTES.md)

---

*Last Updated: January 15, 2025*  
*API Version: v1.0.0*  
*Documentation Version: 1.0.0*