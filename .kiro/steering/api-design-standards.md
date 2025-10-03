---
inclusion: always
---

# WriteCareNotes API Design Standards

## API-First Development Approach

### OpenAPI 3.0 Specification
Every API endpoint MUST be documented using OpenAPI 3.0 before implementation:

```yaml
# Example API specification structure
openapi: 3.0.3
info:
  title: WriteCareNotes API
  version: 1.0.0
  description: British Isles Adult Care Home Management System API
  contact:
    name: WriteCareNotes Support
    email: support@writecarenotes.com
  license:
    name: Proprietary
servers:
  - url: https://api.writecarenotes.com/v1
    description: Production server
  - url: https://staging-api.writecarenotes.com/v1
    description: Staging server
```

## API Versioning Strategy

### URL-Based Versioning
```
https://api.writecarenotes.com/v1/residents
https://api.writecarenotes.com/v2/residents
```

### Version Lifecycle Management
- **v1**: Current stable version
- **v2**: Next version in development
- **Deprecation**: 12-month notice period
- **Sunset**: 6-month grace period after deprecation

### Backward Compatibility Rules
- Never remove fields from responses
- Never change field types
- Never change HTTP status codes
- Add new optional fields only
- Use feature flags for breaking changes

## RESTful API Conventions

### Resource Naming
```
GET    /v1/residents              # List residents
POST   /v1/residents              # Create resident
GET    /v1/residents/{id}         # Get specific resident
PUT    /v1/residents/{id}         # Update resident (full)
PATCH  /v1/residents/{id}         # Update resident (partial)
DELETE /v1/residents/{id}         # Delete resident

# Nested resources
GET    /v1/residents/{id}/care-plans
POST   /v1/residents/{id}/care-plans
GET    /v1/residents/{id}/medications
```

### HTTP Status Codes
```typescript
enum HTTPStatusCodes {
  // Success
  OK = 200,                    // Successful GET, PUT, PATCH
  CREATED = 201,               // Successful POST
  NO_CONTENT = 204,            // Successful DELETE
  
  // Client Errors
  BAD_REQUEST = 400,           // Invalid request data
  UNAUTHORIZED = 401,          // Authentication required
  FORBIDDEN = 403,             // Insufficient permissions
  NOT_FOUND = 404,             // Resource not found
  CONFLICT = 409,              // Resource conflict
  UNPROCESSABLE_ENTITY = 422,  // Validation errors
  TOO_MANY_REQUESTS = 429,     // Rate limit exceeded
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 500, // Generic server error
  SERVICE_UNAVAILABLE = 503,   // Temporary unavailability
}
```

## Request/Response Standards

### Request Headers
```typescript
interface RequiredHeaders {
  'Content-Type': 'application/json';
  'Authorization': 'Bearer <jwt-token>';
  'X-API-Version': 'v1';
  'X-Correlation-ID': string;
  'Accept-Language': 'en-GB' | 'cy-GB' | 'gd-GB' | 'ga-IE';
}
```

### Response Format
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
    correlationId: string;
  };
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    version: string;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_ERROR';
    message: string;
    details?: {
      field?: string;
      value?: any;
      constraint?: string;
    }[];
    correlationId: string;
    timestamp: string;
  };
}
```

## Security Standards

### Authentication
```typescript
// JWT Token Structure
interface JWTPayload {
  sub: string;           // User ID
  iss: 'writecarenotes'; // Issuer
  aud: 'api';           // Audience
  exp: number;          // Expiration
  iat: number;          // Issued at
  roles: string[];      // User roles
  permissions: string[]; // Specific permissions
  careHomeId?: string;  // Care home context
}
```

### Rate Limiting
```typescript
interface RateLimitHeaders {
  'X-RateLimit-Limit': number;     // Requests per window
  'X-RateLimit-Remaining': number; // Remaining requests
  'X-RateLimit-Reset': number;     // Window reset time
  'X-RateLimit-Window': number;    // Window size in seconds
}

// Rate limits by endpoint type
const RATE_LIMITS = {
  authentication: '5/minute',
  read_operations: '1000/hour',
  write_operations: '100/hour',
  report_generation: '10/hour',
  file_uploads: '20/hour',
};
```

### Input Validation
```typescript
// Use Joi schemas for validation
const ResidentCreateSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  dateOfBirth: Joi.date().max('now').required(),
  nhsNumber: Joi.string().pattern(/^\d{10}$/).required(),
  careLevel: Joi.string().valid('residential', 'nursing', 'dementia', 'mental-health').required(),
  emergencyContacts: Joi.array().items(EmergencyContactSchema).min(1).required(),
});
```

## Healthcare-Specific API Standards

### NHS Number Validation
```typescript
function validateNHSNumber(nhsNumber: string): boolean {
  // Implement NHS number check digit validation
  if (!/^\d{10}$/.test(nhsNumber)) return false;
  
  const digits = nhsNumber.split('').map(Number);
  const checkDigit = digits[9];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  
  const remainder = sum % 11;
  const calculatedCheckDigit = 11 - remainder;
  
  return calculatedCheckDigit === checkDigit || 
         (calculatedCheckDigit === 11 && checkDigit === 0);
}
```

### FHIR Compatibility
```typescript
// Prepare for FHIR R4 integration
interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: {
    system: 'https://fhir.nhs.uk/Id/nhs-number';
    value: string;
  }[];
  name: {
    family: string;
    given: string[];
  }[];
  birthDate: string;
  address: Address[];
}
```

## Performance Standards

### Response Time Requirements
```typescript
const PERFORMANCE_TARGETS = {
  authentication: '< 100ms',
  simple_queries: '< 200ms',
  complex_queries: '< 500ms',
  report_generation: '< 2000ms',
  file_uploads: '< 5000ms',
};
```

### Caching Strategy
```typescript
interface CacheHeaders {
  'Cache-Control': 'private, max-age=300' | 'no-cache' | 'no-store';
  'ETag': string;
  'Last-Modified': string;
}

// Cache policies by resource type
const CACHE_POLICIES = {
  static_data: 'max-age=3600',      // 1 hour
  user_data: 'max-age=300',         // 5 minutes
  real_time_data: 'no-cache',       // Always fresh
  sensitive_data: 'no-store',       // Never cache
};
```

## Monitoring and Observability

### Request Logging
```typescript
interface APIRequestLog {
  correlationId: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  userAgent: string;
  ipAddress: string;
  timestamp: Date;
  errorDetails?: any;
}
```

### Health Check Endpoints
```typescript
// GET /health
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    external_apis: {
      nhs_digital: ServiceHealth;
      cqc: ServiceHealth;
    };
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastChecked: string;
  error?: string;
}
```

## Documentation Requirements

### Endpoint Documentation Template
```typescript
/**
 * @swagger
 * /v1/residents:
 *   post:
 *     summary: Create a new resident
 *     description: Creates a new resident record with comprehensive care information
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResidentCreateRequest'
 *     responses:
 *       201:
 *         description: Resident created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResidentResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
```