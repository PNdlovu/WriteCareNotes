# GROUP 1: Core Services - API Documentation

**Version**: 2.0.0  
**Date**: 2025-01-09  
**Services**: 8 Core Services (35 Endpoints)

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Organization Service (7 endpoints)](#organization-service)
3. [Tenant Service (7 endpoints)](#tenant-service)
4. [Resident Service (8 endpoints)](#resident-service)
5. [Audit Service (6 endpoints)](#audit-service)
6. [Authentication Service (10 endpoints)](#authentication-service)
7. [Error Codes Reference](#error-codes-reference)

---

## Authentication & Authorization

### Authentication Methods

All authenticated endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Permission System

Endpoints use role-based and permission-based access control:

- **Admin Permissions**: `admin:tenants:*`, `admin:organizations:*`
- **Organization Permissions**: `organizations:create`, `organizations:read`, `organizations:update`, `organizations:delete`
- **Resident Permissions**: `residents:create`, `residents:read`, `residents:update`, `residents:delete`
- **Audit Permissions**: `audit:read`, `audit:export`

### Tenant Isolation

Most endpoints automatically filter data by `tenant_id` using the `tenantIsolation` middleware. This ensures multi-tenant security.

---

## Organization Service

**Base URL**: `/api/organizations`  
**Controller**: `OrganizationController`  
**Service**: `OrganizationService`

### 1. Create Organization

**POST** `/api/organizations`

Creates a new organization within the current tenant.

**Authentication**: Required  
**Permissions**: `organizations:create`  
**Tenant Isolation**: Yes

**Request Body**:
```json
{
  "name": "Sunshine Care Home",
  "type": "CARE_HOME",
  "cqcRegistration": "1-12345678",
  "ofstedRegistration": "SC123456",
  "address": {
    "line1": "123 Main Street",
    "line2": "Suite 100",
    "city": "London",
    "postcode": "SW1A 1AA",
    "country": "England"
  },
  "contactInfo": {
    "phone": "+44 20 1234 5678",
    "email": "contact@sunshinecare.co.uk",
    "website": "https://sunshinecare.co.uk"
  },
  "settings": {
    "capacity": 50,
    "specializations": ["dementia", "nursing"],
    "languages": ["en", "pl", "es"]
  }
}
```

**Validation Rules**:
- `name`: Required, 2-255 characters
- `type`: Required, one of: `CARE_HOME`, `NURSING_HOME`, `ASSISTED_LIVING`, `DOMICILIARY`, `NHS_TRUST`
- `cqcRegistration`: Optional, alphanumeric
- `ofstedRegistration`: Optional, alphanumeric
- `address`: Optional, valid JSONB object
- `contactInfo`: Optional, valid JSONB object

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Sunshine Care Home",
    "type": "CARE_HOME",
    "cqcRegistration": "1-12345678",
    "ofstedRegistration": "SC123456",
    "address": {...},
    "contactInfo": {...},
    "settings": {...},
    "complianceStatus": {},
    "createdAt": "2025-01-09T10:00:00.000Z",
    "updatedAt": "2025-01-09T10:00:00.000Z",
    "createdBy": "user-uuid",
    "deletedAt": null
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Organization with same name already exists in tenant
- `500 Internal Server Error`: Server error

---

### 2. List All Organizations

**GET** `/api/organizations`

Retrieves all organizations for the current tenant with optional filters.

**Authentication**: Required  
**Permissions**: `organizations:read`  
**Tenant Isolation**: Yes

**Query Parameters**:
- `type` (optional): Filter by organization type (e.g., `CARE_HOME`)
- `isActive` (optional): Filter by active status (`true`/`false`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Example Request**:
```
GET /api/organizations?type=CARE_HOME&isActive=true&page=1&limit=20
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tenantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Sunshine Care Home",
      "type": "CARE_HOME",
      "cqcRegistration": "1-12345678",
      "address": {...},
      "createdAt": "2025-01-09T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### 3. Get Organization by ID

**GET** `/api/organizations/:id`

Retrieves a specific organization by ID (tenant-scoped).

**Authentication**: Required  
**Permissions**: `organizations:read`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Organization UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tenantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Sunshine Care Home",
    "type": "CARE_HOME",
    "cqcRegistration": "1-12345678",
    "ofstedRegistration": "SC123456",
    "address": {...},
    "contactInfo": {...},
    "settings": {...},
    "complianceStatus": {...},
    "createdAt": "2025-01-09T10:00:00.000Z",
    "updatedAt": "2025-01-09T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Organization not found or not in current tenant
- `500 Internal Server Error`: Server error

---

### 4. Update Organization

**PUT** `/api/organizations/:id`

Updates an existing organization.

**Authentication**: Required  
**Permissions**: `organizations:update`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Organization UUID

**Request Body** (all fields optional):
```json
{
  "name": "Sunshine Care Home (Updated)",
  "cqcRegistration": "1-87654321",
  "settings": {
    "capacity": 60,
    "specializations": ["dementia", "nursing", "palliative"]
  }
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Sunshine Care Home (Updated)",
    "updatedAt": "2025-01-09T11:00:00.000Z",
    ...
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error or invalid UUID
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Organization not found
- `500 Internal Server Error`: Server error

---

### 5. Delete Organization (Soft Delete)

**DELETE** `/api/organizations/:id`

Soft deletes an organization (sets `deletedAt` timestamp).

**Authentication**: Required  
**Permissions**: `organizations:delete`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Organization UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Organization deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deletedAt": "2025-01-09T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Organization not found
- `409 Conflict`: Cannot delete organization with active residents
- `500 Internal Server Error`: Server error

---

### 6. Get Organization Compliance Status

**GET** `/api/organizations/:id/compliance`

Retrieves CQC/OFSTED compliance status for an organization.

**Authentication**: Required  
**Permissions**: `organizations:read`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Organization UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "complianceStatus": {
      "cqc": {
        "rating": "Good",
        "lastInspection": "2024-06-15",
        "nextInspection": "2025-06-15",
        "areas": {
          "safe": "Good",
          "effective": "Good",
          "caring": "Outstanding",
          "responsive": "Good",
          "wellLed": "Good"
        }
      },
      "ofsted": {
        "rating": "Good",
        "lastInspection": "2024-07-20"
      }
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Organization not found
- `500 Internal Server Error`: Server error

---

### 7. Get Organization Statistics

**GET** `/api/organizations/:id/statistics`

Retrieves key statistics for an organization.

**Authentication**: Required  
**Permissions**: `organizations:read`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Organization UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "statistics": {
      "totalResidents": 42,
      "activeResidents": 40,
      "capacity": 60,
      "occupancyRate": 70.0,
      "staffCount": 25,
      "averageCareLevel": "MEDIUM",
      "careMetrics": {
        "medicationAdherence": 98.5,
        "incidentRate": 0.2,
        "satisfactionScore": 4.7
      }
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Organization not found
- `500 Internal Server Error`: Server error

---

## Tenant Service

**Base URL**: `/api/tenants`  
**Controller**: `TenantController`  
**Service**: `TenantService`

### 1. Create Tenant

**POST** `/api/tenants`

Creates a new tenant (admin-only operation).

**Authentication**: Required  
**Permissions**: `admin:tenants:create`  
**Tenant Isolation**: No (admin endpoint)

**Request Body**:
```json
{
  "name": "Acme Healthcare Group",
  "subdomain": "acme-healthcare",
  "subscriptionPlan": "enterprise",
  "configuration": {
    "features": ["multi-org", "advanced-analytics", "ai-suggestions"],
    "limits": {
      "maxOrganizations": 10,
      "maxUsers": 500,
      "maxResidents": 1000
    },
    "branding": {
      "logo": "https://cdn.example.com/acme-logo.png",
      "primaryColor": "#0066cc"
    }
  }
}
```

**Validation Rules**:
- `name`: Required, 2-255 characters
- `subdomain`: Required, 2-50 characters, lowercase alphanumeric + hyphens, must be unique
- `subscriptionPlan`: Optional, one of: `starter`, `professional`, `enterprise` (default: `enterprise`)
- `configuration`: Optional, valid JSONB object

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Acme Healthcare Group",
    "subdomain": "acme-healthcare",
    "subscriptionPlan": "enterprise",
    "configuration": {...},
    "isActive": true,
    "createdAt": "2025-01-09T10:00:00.000Z",
    "updatedAt": "2025-01-09T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (invalid subdomain format, name too short/long)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Not an admin user
- `409 Conflict`: Subdomain already exists
- `500 Internal Server Error`: Tenant creation failed

---

### 2. List All Tenants

**GET** `/api/tenants`

Retrieves all tenants (admin-only).

**Authentication**: Required  
**Permissions**: `admin:tenants:read`  
**Tenant Isolation**: No (admin endpoint)

**Query Parameters**:
- `includeInactive` (optional): Include inactive tenants (`true`/`false`, default: `false`)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Acme Healthcare Group",
      "subdomain": "acme-healthcare",
      "subscriptionPlan": "enterprise",
      "isActive": true,
      "createdAt": "2025-01-09T10:00:00.000Z"
    },
    {
      "id": "8d9e6679-7425-40de-944b-e07fc1f90ae8",
      "name": "Care Plus Ltd",
      "subdomain": "care-plus",
      "subscriptionPlan": "professional",
      "isActive": true,
      "createdAt": "2025-01-08T09:00:00.000Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Not an admin user
- `500 Internal Server Error`: Server error

---

### 3. Get Tenant by ID

**GET** `/api/tenants/:id`

Retrieves a specific tenant by ID (admin-only).

**Authentication**: Required  
**Permissions**: `admin:tenants:read`  
**Tenant Isolation**: No (admin endpoint)

**URL Parameters**:
- `id`: Tenant UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Acme Healthcare Group",
    "subdomain": "acme-healthcare",
    "subscriptionPlan": "enterprise",
    "configuration": {...},
    "isActive": true,
    "createdAt": "2025-01-09T10:00:00.000Z",
    "updatedAt": "2025-01-09T10:00:00.000Z",
    "organizations": [...],
    "users": [...]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Tenant not found
- `500 Internal Server Error`: Server error

---

### 4. Get Tenant by Subdomain

**GET** `/api/tenants/subdomain/:subdomain`

Resolves a tenant by subdomain (public endpoint for multi-tenant routing).

**Authentication**: Not Required (public endpoint)  
**Permissions**: None  
**Tenant Isolation**: No

**URL Parameters**:
- `subdomain`: Tenant subdomain (e.g., `acme-healthcare`)

**Example Request**:
```
GET /api/tenants/subdomain/acme-healthcare
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Acme Healthcare Group",
    "subdomain": "acme-healthcare",
    "configuration": {
      "branding": {
        "logo": "https://cdn.example.com/acme-logo.png",
        "primaryColor": "#0066cc"
      }
    },
    "isActive": true
  }
}
```

**Error Responses**:
- `404 Not Found`: Tenant not found or inactive
- `500 Internal Server Error`: Server error

**Use Case**: Frontend uses this endpoint to resolve tenant from subdomain (e.g., `acme-healthcare.writecarenotes.com`)

---

### 5. Update Tenant

**PUT** `/api/tenants/:id`

Updates an existing tenant (admin-only).

**Authentication**: Required  
**Permissions**: `admin:tenants:update`  
**Tenant Isolation**: No (admin endpoint)

**URL Parameters**:
- `id`: Tenant UUID

**Request Body** (all fields optional):
```json
{
  "name": "Acme Healthcare Group (Updated)",
  "subscriptionPlan": "enterprise",
  "configuration": {
    "features": ["multi-org", "advanced-analytics", "ai-suggestions", "api-access"]
  }
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "Acme Healthcare Group (Updated)",
    "subscriptionPlan": "enterprise",
    "updatedAt": "2025-01-09T11:00:00.000Z",
    ...
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error or invalid UUID
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Tenant not found
- `500 Internal Server Error`: Server error

---

### 6. Delete Tenant (Soft Delete)

**DELETE** `/api/tenants/:id`

Soft deletes a tenant (admin-only, sets `isActive = false`).

**Authentication**: Required  
**Permissions**: `admin:tenants:delete`  
**Tenant Isolation**: No (admin endpoint)

**URL Parameters**:
- `id`: Tenant UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Tenant deactivated successfully",
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "isActive": false,
    "updatedAt": "2025-01-09T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Tenant not found
- `409 Conflict`: Cannot delete tenant with active organizations or users
- `500 Internal Server Error`: Server error

---

### 7. Get Tenant Statistics

**GET** `/api/tenants/:id/statistics`

Retrieves key statistics for a tenant (admin-only).

**Authentication**: Required  
**Permissions**: `admin:tenants:read`  
**Tenant Isolation**: No (admin endpoint)

**URL Parameters**:
- `id`: Tenant UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tenantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "statistics": {
      "totalOrganizations": 8,
      "activeOrganizations": 7,
      "totalUsers": 245,
      "activeUsers": 232,
      "totalResidents": 876,
      "activeResidents": 850,
      "subscriptionPlan": "enterprise",
      "storageUsed": "24.5 GB",
      "apiCallsThisMonth": 1245678
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Tenant not found
- `500 Internal Server Error`: Server error

---

## Resident Service

**Base URL**: `/api/residents`  
**Controller**: `ResidentController`  
**Service**: `ResidentService`

### 1. Create Resident

**POST** `/api/residents`

Creates a new resident (care staff and managers).

**Authentication**: Required  
**Permissions**: `residents:create`  
**Tenant Isolation**: Yes

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Robert",
  "preferredName": "Johnny",
  "dateOfBirth": "1950-06-15",
  "gender": "male",
  "maritalStatus": "widowed",
  "nhsNumber": "1234567890",
  "email": "john.doe@family.com",
  "phoneNumber": "+44 7700 900000",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "admissionDate": "2025-01-01",
  "careLevel": "residential",
  "allergies": ["penicillin", "peanuts"],
  "medicalConditions": ["diabetes", "hypertension"],
  "gpName": "Dr. Sarah Smith",
  "gpPractice": "London Health Centre"
}
```

**Validation Rules**:
- `firstName`: Required, 1-100 characters
- `lastName`: Required, 1-100 characters
- `dateOfBirth`: Required, ISO8601 date format, must be in the past
- `gender`: Required, one of: `male`, `female`, `other`, `prefer_not_to_say`
- `admissionDate`: Required, ISO8601 date format
- `organizationId`: Required, valid UUID
- `careLevel`: Required, one of: `residential`, `nursing`, `dementia`, `mental_health`, `learning_disability`, `physical_disability`, `palliative`, `respite`

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "abc12345-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "preferredName": "Johnny",
    "dateOfBirth": "1950-06-15",
    "gender": "male",
    "careLevel": "residential",
    "status": "active",
    "admissionDate": "2025-01-01",
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-01-09T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: NHS number already exists
- `500 Internal Server Error`: Server error

**GDPR Note**: Personal data (name, DOB, NHS number, etc.) is encrypted at rest using field-level encryption.

---

### 2. List All Residents

**GET** `/api/residents`

Retrieves all residents with pagination and filters.

**Authentication**: Required  
**Permissions**: `residents:read`  
**Tenant Isolation**: Yes

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `organizationId` (optional): Filter by organization UUID
- `status` (optional): Filter by status (`active`, `discharged`, `deceased`, `transferred`, `temporary_absence`)
- `search` (optional): Search by name or NHS number

**Example Request**:
```
GET /api/residents?organizationId=550e8400-e29b-41d4-a716-446655440000&status=active&page=1&limit=20&search=john
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "abc12345-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "preferredName": "Johnny",
      "careLevel": "residential",
      "status": "active",
      "admissionDate": "2025-01-01",
      "organizationId": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### 3. Get Resident by ID

**GET** `/api/residents/:id`

Retrieves a specific resident by ID.

**Authentication**: Required  
**Permissions**: `residents:read`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Resident UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "abc12345-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "middleName": "Robert",
    "preferredName": "Johnny",
    "dateOfBirth": "1950-06-15",
    "gender": "male",
    "maritalStatus": "widowed",
    "nhsNumber": "1234567890",
    "email": "john.doe@family.com",
    "phoneNumber": "+44 7700 900000",
    "careLevel": "residential",
    "status": "active",
    "admissionDate": "2025-01-01",
    "allergies": ["penicillin", "peanuts"],
    "medicalConditions": ["diabetes", "hypertension"],
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-01-09T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resident not found or not in current tenant
- `500 Internal Server Error`: Server error

---

### 4. Update Resident

**PUT** `/api/residents/:id`

Updates an existing resident.

**Authentication**: Required  
**Permissions**: `residents:update`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Resident UUID

**Request Body** (all fields optional):
```json
{
  "preferredName": "Johnny",
  "careLevel": "nursing",
  "allergies": ["penicillin", "peanuts", "latex"],
  "medicalConditions": ["diabetes", "hypertension", "arthritis"]
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "abc12345-e29b-41d4-a716-446655440000",
    "preferredName": "Johnny",
    "careLevel": "nursing",
    "updatedAt": "2025-01-09T11:00:00.000Z",
    ...
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error or invalid UUID
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resident not found
- `500 Internal Server Error`: Server error

---

### 5. Delete Resident (Soft Delete)

**DELETE** `/api/residents/:id`

Soft deletes a resident (managers only, sets `deletedAt` timestamp).

**Authentication**: Required  
**Permissions**: `residents:delete` (managers only)  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Resident UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Resident deleted successfully",
  "data": {
    "id": "abc12345-e29b-41d4-a716-446655440000",
    "deletedAt": "2025-01-09T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (managers only)
- `404 Not Found`: Resident not found
- `500 Internal Server Error`: Server error

**GDPR Note**: Soft delete maintains data for compliance audits. Hard delete can be performed after retention period.

---

### 6. Get Resident Care Plan

**GET** `/api/residents/:id/care-plan`

Retrieves the current care plan for a resident.

**Authentication**: Required  
**Permissions**: `residents:read`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Resident UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "residentId": "abc12345-e29b-41d4-a716-446655440000",
    "carePlan": {
      "id": "plan-uuid",
      "version": "2.1",
      "lastUpdated": "2025-01-05",
      "nextReview": "2025-04-05",
      "goals": [...],
      "interventions": [...],
      "riskAssessments": [...],
      "preferences": {...}
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resident or care plan not found
- `500 Internal Server Error`: Server error

---

### 7. Get Resident Medications

**GET** `/api/residents/:id/medications`

Retrieves all current medications for a resident.

**Authentication**: Required  
**Permissions**: `residents:read`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Resident UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "residentId": "abc12345-e29b-41d4-a716-446655440000",
    "medications": [
      {
        "id": "med-uuid-1",
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": "twice daily",
        "route": "oral",
        "startDate": "2024-12-01",
        "endDate": null,
        "prescribedBy": "Dr. Sarah Smith"
      },
      {
        "id": "med-uuid-2",
        "name": "Lisinopril",
        "dosage": "10mg",
        "frequency": "once daily",
        "route": "oral",
        "startDate": "2024-11-15",
        "endDate": null,
        "prescribedBy": "Dr. Sarah Smith"
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resident not found
- `500 Internal Server Error`: Server error

---

### 8. Get Resident Assessments

**GET** `/api/residents/:id/assessments`

Retrieves all assessments for a resident.

**Authentication**: Required  
**Permissions**: `residents:read`  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Resident UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "residentId": "abc12345-e29b-41d4-a716-446655440000",
    "assessments": [
      {
        "id": "assess-uuid-1",
        "type": "mobility",
        "score": 3,
        "date": "2025-01-05",
        "assessedBy": "Jane Smith, RN"
      },
      {
        "id": "assess-uuid-2",
        "type": "cognitive",
        "score": 7,
        "date": "2025-01-05",
        "assessedBy": "Dr. John Brown"
      }
    ]
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resident not found
- `500 Internal Server Error`: Server error

---

## Audit Service

**Base URL**: `/api/audit`  
**Controller**: `AuditController`  
**Service**: `AuditService`

### 1. List Audit Logs

**GET** `/api/audit`

Retrieves audit logs with filters and pagination.

**Authentication**: Required  
**Permissions**: `audit:read` (managers and auditors)  
**Tenant Isolation**: Yes

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `userId` (optional): Filter by user UUID
- `action` (optional): Filter by action (e.g., `CREATE`, `UPDATE`, `DELETE`, `VIEW`)
- `entityType` (optional): Filter by entity type (e.g., `resident`, `medication`, `incident`)
- `startDate` (optional): Filter by start date (ISO8601)
- `endDate` (optional): Filter by end date (ISO8601)

**Example Request**:
```
GET /api/audit?userId=user-uuid&action=UPDATE&entityType=resident&startDate=2025-01-01&endDate=2025-01-09&page=1&limit=50
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "audit-uuid-1",
      "userId": "user-uuid",
      "userEmail": "nurse@example.com",
      "action": "UPDATE",
      "resourceType": "resident",
      "resourceId": "resident-uuid",
      "oldValues": {...},
      "newValues": {...},
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-01-09T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1245,
    "totalPages": 25
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (managers/auditors only)
- `500 Internal Server Error`: Server error

---

### 2. Get Audit Log by ID

**GET** `/api/audit/:id`

Retrieves a specific audit log entry by ID.

**Authentication**: Required  
**Permissions**: `audit:read` (managers and auditors)  
**Tenant Isolation**: Yes

**URL Parameters**:
- `id`: Audit log UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "audit-uuid-1",
    "userId": "user-uuid",
    "userEmail": "nurse@example.com",
    "userName": "Jane Doe",
    "action": "UPDATE",
    "resourceType": "resident",
    "resourceId": "resident-uuid",
    "resourceName": "John Doe",
    "oldValues": {
      "careLevel": "residential",
      "allergies": ["penicillin"]
    },
    "newValues": {
      "careLevel": "nursing",
      "allergies": ["penicillin", "peanuts"]
    },
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "sessionId": "session-uuid",
    "requestId": "req-123456",
    "apiEndpoint": "/api/residents/resident-uuid",
    "complianceFlags": ["GDPR", "CQC"],
    "riskLevel": "MEDIUM",
    "timestamp": "2025-01-09T10:30:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Audit log not found
- `500 Internal Server Error`: Server error

---

### 3. Get Entity Audit Trail

**GET** `/api/audit/entity/:entityType/:entityId`

Retrieves all audit logs for a specific entity (e.g., resident, medication).

**Authentication**: Required  
**Permissions**: `audit:read` or entity read permission  
**Tenant Isolation**: Yes

**URL Parameters**:
- `entityType`: Entity type (e.g., `resident`, `medication`, `incident`)
- `entityId`: Entity UUID

**Example Request**:
```
GET /api/audit/entity/resident/abc12345-e29b-41d4-a716-446655440000
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "entityType": "resident",
    "entityId": "abc12345-e29b-41d4-a716-446655440000",
    "entityName": "John Doe",
    "auditTrail": [
      {
        "id": "audit-uuid-1",
        "action": "CREATE",
        "userId": "user-uuid-1",
        "userName": "Admin User",
        "timestamp": "2025-01-01T08:00:00.000Z"
      },
      {
        "id": "audit-uuid-2",
        "action": "UPDATE",
        "userId": "user-uuid-2",
        "userName": "Jane Nurse",
        "oldValues": {"careLevel": "residential"},
        "newValues": {"careLevel": "nursing"},
        "timestamp": "2025-01-09T10:30:00.000Z"
      }
    ],
    "totalChanges": 15
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid entity type or UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Entity not found
- `500 Internal Server Error`: Server error

---

### 4. Get User Audit Trail

**GET** `/api/audit/user/:userId`

Retrieves all audit logs for a specific user's actions.

**Authentication**: Required  
**Permissions**: `audit:read` (managers and auditors)  
**Tenant Isolation**: Yes

**URL Parameters**:
- `userId`: User UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "userEmail": "nurse@example.com",
    "userName": "Jane Doe",
    "actions": [
      {
        "id": "audit-uuid-1",
        "action": "UPDATE",
        "resourceType": "resident",
        "resourceId": "resident-uuid",
        "timestamp": "2025-01-09T10:30:00.000Z"
      },
      {
        "id": "audit-uuid-2",
        "action": "CREATE",
        "resourceType": "medication",
        "resourceId": "med-uuid",
        "timestamp": "2025-01-09T09:15:00.000Z"
      }
    ],
    "totalActions": 234
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### 5. Get Audit Statistics

**GET** `/api/audit/statistics`

Retrieves audit log statistics for compliance reporting.

**Authentication**: Required  
**Permissions**: `audit:read` (managers and auditors)  
**Tenant Isolation**: Yes

**Query Parameters**:
- `startDate` (optional): Start date for statistics (ISO8601)
- `endDate` (optional): End date for statistics (ISO8601)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-09"
    },
    "statistics": {
      "totalActions": 12456,
      "actionBreakdown": {
        "CREATE": 2345,
        "UPDATE": 8901,
        "DELETE": 123,
        "VIEW": 1087
      },
      "entityBreakdown": {
        "resident": 4567,
        "medication": 3456,
        "incident": 234,
        "carePlan": 1234
      },
      "userActivity": {
        "mostActiveUser": {
          "userId": "user-uuid",
          "userName": "Jane Doe",
          "actionCount": 876
        }
      },
      "riskLevelBreakdown": {
        "LOW": 10234,
        "MEDIUM": 1890,
        "HIGH": 289,
        "CRITICAL": 43
      }
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### 6. Export Audit Logs

**GET** `/api/audit/export`

Exports audit logs in CSV, JSON, or PDF format for compliance.

**Authentication**: Required  
**Permissions**: `audit:export` (managers and auditors)  
**Tenant Isolation**: Yes

**Query Parameters**:
- `format`: Export format (`csv`, `json`, `pdf`)
- `startDate` (optional): Start date (ISO8601)
- `endDate` (optional): End date (ISO8601)
- `entityType` (optional): Filter by entity type
- `action` (optional): Filter by action

**Example Request**:
```
GET /api/audit/export?format=csv&startDate=2025-01-01&endDate=2025-01-09&entityType=resident
```

**Success Response** (200 OK):
- **CSV Format**: Returns CSV file with headers
- **JSON Format**: Returns JSON array of audit logs
- **PDF Format**: Returns formatted PDF report

**Response Headers**:
```
Content-Type: text/csv; charset=utf-8 (or application/json, application/pdf)
Content-Disposition: attachment; filename="audit-logs-2025-01-01-to-2025-01-09.csv"
```

**Error Responses**:
- `400 Bad Request`: Invalid format or date range
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Export failed

---

## Authentication Service

**Base URL**: `/api/auth`  
**Controller**: `AuthController`  
**Service**: `JWTAuthenticationService`

### 1. Login

**POST** `/api/auth/login`

Authenticates a user and returns JWT + refresh token.

**Authentication**: Not Required (public)  
**Permissions**: None  
**Tenant Isolation**: No

**Request Body**:
```json
{
  "email": "nurse@example.com",
  "password": "SecurePassword123!",
  "tenantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

**Validation Rules**:
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters
- `tenantId`: Optional (can be resolved from subdomain)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user-uuid",
      "email": "nurse@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "NURSE",
      "tenantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "organizationId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email format or missing fields
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account locked due to multiple failed attempts
- `404 Not Found`: User not found or inactive
- `500 Internal Server Error`: Server error

**Security Features**:
- Password hashing with bcrypt
- Rate limiting (max 5 attempts per 15 minutes)
- Account lockout after 5 failed attempts (30 minutes)
- JWT with 1-hour expiration
- Refresh token with 7-day expiration

---

### 2. Register

**POST** `/api/auth/register`

Registers a new user (requires tenant validation).

**Authentication**: Not Required (public with tenant validation)  
**Permissions**: None  
**Tenant Isolation**: Yes (requires valid tenantId)

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Smith",
  "tenantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation Rules**:
- `email`: Required, valid email format, unique
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, number
- `firstName`: Required, 1-100 characters
- `lastName`: Required, 1-100 characters
- `tenantId`: Required, valid UUID
- `organizationId`: Optional, valid UUID

**Success Response** (201 Created):
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "id": "user-uuid",
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "isVerified": false
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error or weak password
- `409 Conflict`: Email already exists
- `404 Not Found`: Tenant or organization not found
- `500 Internal Server Error`: Registration failed

**Email Verification**: Sends verification email to user

---

### 3. Refresh Token

**POST** `/api/auth/refresh`

Refreshes the JWT access token using a valid refresh token.

**Authentication**: Not Required (uses refresh token)  
**Permissions**: None  
**Tenant Isolation**: No

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing refresh token
- `401 Unauthorized`: Invalid or expired refresh token
- `500 Internal Server Error`: Server error

**Token Rotation**: Issues new refresh token and invalidates old one

---

### 4. Logout

**POST** `/api/auth/logout`

Logs out the current user and invalidates tokens.

**Authentication**: Required  
**Permissions**: None  
**Tenant Isolation**: No

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Server error

**Actions**:
- Invalidates current JWT
- Invalidates refresh token
- Marks session as inactive

---

### 5. Forgot Password

**POST** `/api/auth/forgot-password`

Initiates password reset process.

**Authentication**: Not Required (public)  
**Permissions**: None  
**Tenant Isolation**: No

**Request Body**:
```json
{
  "email": "nurse@example.com"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset email sent. Please check your inbox."
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email format
- `500 Internal Server Error`: Server error

**Security**:
- Always returns success (prevents email enumeration)
- Generates secure reset token (valid for 1 hour)
- Sends reset link to email

---

### 6. Reset Password

**POST** `/api/auth/reset-password`

Resets password using reset token.

**Authentication**: Not Required (uses reset token)  
**Permissions**: None  
**Tenant Isolation**: No

**Request Body**:
```json
{
  "resetToken": "secure-reset-token-123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Validation Rules**:
- `resetToken`: Required
- `newPassword`: Required, minimum 8 characters, must contain uppercase, lowercase, number

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successful. Please log in with your new password."
}
```

**Error Responses**:
- `400 Bad Request`: Weak password or missing fields
- `401 Unauthorized`: Invalid or expired reset token
- `500 Internal Server Error`: Server error

**Actions**:
- Validates reset token
- Hashes new password
- Invalidates all existing sessions
- Sends confirmation email

---

### 7. Change Password

**POST** `/api/auth/change-password`

Changes password for authenticated user.

**Authentication**: Required  
**Permissions**: None  
**Tenant Isolation**: No

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

**Validation Rules**:
- `currentPassword`: Required
- `newPassword`: Required, minimum 8 characters, must contain uppercase, lowercase, number, cannot be same as current

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Weak password or validation error
- `401 Unauthorized`: Current password incorrect or invalid JWT
- `500 Internal Server Error`: Server error

**Actions**:
- Validates current password
- Hashes new password
- Invalidates all sessions except current
- Sends confirmation email

---

### 8. Get Current User

**GET** `/api/auth/me`

Retrieves the currently authenticated user's information.

**Authentication**: Required  
**Permissions**: None  
**Tenant Isolation**: No

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "nurse@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "middleName": null,
    "preferredName": "Jane",
    "employeeId": "EMP001",
    "role": {
      "id": "role-uuid",
      "name": "NURSE",
      "displayName": "Registered Nurse",
      "permissions": [...]
    },
    "department": "Care",
    "jobTitle": "Senior Nurse",
    "phoneNumber": "+44 7700 900000",
    "tenantId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "isActive": true,
    "isVerified": true,
    "lastLogin": "2025-01-09T08:00:00.000Z",
    "twoFactorEnabled": false
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Server error

---

### 9. Verify Email

**POST** `/api/auth/verify-email`

Verifies user email address.

**Authentication**: Not Required (uses verification token)  
**Permissions**: None  
**Tenant Isolation**: No

**Request Body**:
```json
{
  "verificationToken": "secure-verification-token-123456"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

**Error Responses**:
- `400 Bad Request`: Missing verification token
- `401 Unauthorized`: Invalid or expired verification token
- `500 Internal Server Error`: Server error

---

### 10. Resend Verification Email

**POST** `/api/auth/resend-verification`

Resends email verification link.

**Authentication**: Not Required (public)  
**Permissions**: None  
**Tenant Isolation**: No

**Request Body**:
```json
{
  "email": "newuser@example.com"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox."
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email format
- `429 Too Many Requests`: Rate limit exceeded (max 3 per hour)
- `500 Internal Server Error`: Server error

---

## Error Codes Reference

### Standard HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate, constraint violation) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Custom Error Codes

| Error Code | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `TENANT_NOT_FOUND` | Tenant not found or inactive |
| `ORGANIZATION_NOT_FOUND` | Organization not found |
| `RESIDENT_NOT_FOUND` | Resident not found |
| `AUDIT_LOG_NOT_FOUND` | Audit log not found |
| `INVALID_CREDENTIALS` | Invalid email or password |
| `ACCOUNT_LOCKED` | Account locked due to failed login attempts |
| `DUPLICATE_EMAIL` | Email already exists |
| `DUPLICATE_SUBDOMAIN` | Subdomain already exists |
| `DUPLICATE_NHS_NUMBER` | NHS number already exists |
| `WEAK_PASSWORD` | Password does not meet security requirements |
| `INVALID_TOKEN` | Invalid or expired token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `TENANT_ISOLATION_VIOLATION` | Attempted to access resource from different tenant |

---

## Summary

**Total Endpoints**: 38 (35 core + 3 infrastructure)

| Service | Endpoints | Authentication Required |
|---------|-----------|------------------------|
| Organizations | 7 | Yes (except subdomain lookup) |
| Tenants | 7 | Yes (admin only, except subdomain) |
| Residents | 8 | Yes |
| Audit | 6 | Yes (managers/auditors) |
| Authentication | 10 | Mixed (5 public, 5 authenticated) |

**Security Features**:
- JWT-based authentication with 1-hour expiration
- Refresh token rotation with 7-day expiration
- Role-based access control (RBAC)
- Permission-based authorization
- Multi-tenant isolation
- Rate limiting on sensitive endpoints
- Account lockout after failed login attempts
- GDPR-compliant data encryption
- Comprehensive audit logging

**Compliance**:
- GDPR Article 6 & 9 (lawful processing)
- CQC Fundamental Standards
- NHS Digital Data Security Standards
- Care Certificate Standards

---

**Documentation Version**: 2.0.0  
**Last Updated**: 2025-01-09  
**Status**: ✅ COMPLETE
