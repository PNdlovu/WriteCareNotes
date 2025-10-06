# WriteCareNotes Enterprise API Documentation

## 🚀 Overview

WriteCareNotes is a comprehensive, enterprise-grade care home management platform built with a microservices architecture. This documentation provides complete API specifications for all 53 production-ready microservices.

**Version:** 2.0.0  
**Base URL:** `https://api.writecarenotes.com/v2`  
**Authentication:** Bearer Token (JWT)  
**Content-Type:** `application/json`

---

## 📋 Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Policy Management APIs](#policy-management-apis)
3. [Template Engine APIs](#template-engine-apis)
4. [Enterprise Security APIs](#enterprise-security-apis)
5. [Care Management APIs](#care-management-apis)
6. [Compliance & Regulatory APIs](#compliance--regulatory-apis)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [SDK & Integration Examples](#sdk--integration-examples)

---

## 🔐 Authentication & Security

### Authentication Methods

WriteCareNotes supports multiple authentication methods for maximum security:

- **JWT Bearer Tokens** (Primary)
- **Two-Factor Authentication** (TOTP)
- **Biometric Authentication** (Fingerprint, Face, Voice)
- **API Keys** (Service-to-service)
- **OAuth 2.0** (Third-party integrations)

### Authentication Headers

```http
Authorization: Bearer <jwt_token>
X-API-Key: <api_key>
X-Organization-ID: <organization_uuid>
X-Request-ID: <unique_request_id>
Content-Type: application/json
```

### Security Features

- **Zero Trust Architecture**
- **End-to-end encryption**
- **Role-based access control (RBAC)**
- **Attribute-based access control (ABAC)**
- **Real-time threat detection**
- **Audit logging for all operations**

---

## 📄 Policy Management APIs

### POST /api/v2/policies/templates

Create a new policy template for regulatory compliance.

**Request Body:**
```json
{
  "title": "Safeguarding Adults Policy Template",
  "category": "safeguarding",
  "jurisdiction": ["england_cqc", "scotland_ci"],
  "description": "Comprehensive safeguarding policy template",
  "content": "# {{organization.name}} Safeguarding Policy\n\n**Safeguarding Lead:** {{safeguardingLead}}\n**Contact:** {{contactNumber}}\n\n## Policy Statement\n{{organization.name}} is committed to safeguarding all residents...",
  "variables": [
    {
      "name": "safeguardingLead",
      "type": "text",
      "label": "Designated Safeguarding Lead",
      "description": "Name and contact details of the designated safeguarding lead",
      "required": true
    },
    {
      "name": "contactNumber",
      "type": "text",
      "label": "Emergency Contact Number",
      "description": "24/7 emergency contact number",
      "required": true,
      "validation": {
        "pattern": "^\\+44\\d{10,11}$"
      }
    },
    {
      "name": "hasSpecialistUnits",
      "type": "boolean",
      "label": "Has Specialist Care Units",
      "description": "Whether the care home has specialist units",
      "required": false,
      "defaultValue": false
    },
    {
      "name": "riskLevel",
      "type": "select",
      "label": "Risk Assessment Level",
      "description": "Overall risk level for the organization",
      "required": true,
      "options": ["Low", "Medium", "High", "Critical"]
    }
  ],
  "version": "1.0.0",
  "effectiveDate": "2025-01-01T00:00:00Z",
  "reviewFrequency": 12,
  "approvedBy": "Policy Manager",
  "tags": ["safeguarding", "compliance", "cqc", "residents"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "pt_1a2b3c4d5e6f",
    "title": "Safeguarding Adults Policy Template",
    "category": "safeguarding",
    "jurisdiction": ["england_cqc", "scotland_ci"],
    "version": "1.0.0",
    "isActive": true,
    "effectiveDate": "2025-01-01T00:00:00Z",
    "reviewFrequency": 12,
    "variableCount": 4,
    "requiredVariableCount": 3,
    "createdAt": "2025-01-06T10:30:00Z",
    "updatedAt": "2025-01-06T10:30:00Z",
    "createdBy": "usr_9x8y7z6w5v4u",
    "metadata": {
      "compliance": ["Care Act 2014", "Mental Capacity Act 2005"],
      "applicableRegions": ["England", "Scotland"],
      "estimatedCompletionTime": "45 minutes"
    }
  },
  "meta": {
    "requestId": "req_abc123def456",
    "timestamp": "2025-01-06T10:30:00Z",
    "version": "2.0.0"
  }
}
```

### GET /api/v2/policies/templates

Retrieve policy templates with filtering and pagination.

**Query Parameters:**
- `category` (string): Filter by policy category
- `jurisdiction` (string): Filter by regulatory jurisdiction
- `isActive` (boolean): Filter by active status (default: true)
- `searchTerm` (string): Search in title, description, and tags
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `sortBy` (string): Sort field (title, updatedAt, category)
- `sortOrder` (string): Sort direction (asc, desc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "pt_1a2b3c4d5e6f",
        "title": "Safeguarding Adults Policy Template",
        "category": "safeguarding",
        "jurisdiction": ["england_cqc"],
        "description": "Comprehensive safeguarding policy template",
        "version": "1.0.0",
        "isActive": true,
        "effectiveDate": "2025-01-01T00:00:00Z",
        "reviewFrequency": 12,
        "variableCount": 4,
        "requiredVariableCount": 3,
        "tags": ["safeguarding", "compliance"],
        "createdAt": "2025-01-06T10:30:00Z",
        "updatedAt": "2025-01-06T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 87,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "meta": {
    "requestId": "req_def456ghi789",
    "timestamp": "2025-01-06T10:35:00Z",
    "version": "2.0.0"
  }
}
```

### POST /api/v2/policies/generate

Generate a policy instance from a template.

**Request Body:**
```json
{
  "templateId": "pt_1a2b3c4d5e6f",
  "organizationId": "org_5f4e3d2c1b0a",
  "variableValues": {
    "safeguardingLead": "Jane Smith (Senior Care Manager)",
    "contactNumber": "+44 1234 567890",
    "hasSpecialistUnits": true,
    "riskLevel": "Medium",
    "specialistUnits": [
      {
        "name": "Dementia Care Unit",
        "capacity": 12,
        "staffRatio": "1:4"
      },
      {
        "name": "Rehabilitation Unit", 
        "capacity": 8,
        "staffRatio": "1:3"
      }
    ]
  },
  "customTitle": "Sunset Manor Safeguarding Policy",
  "approvedBy": "Care Home Manager",
  "effectiveDate": "2025-02-01T00:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "pi_7g6h5i4j3k2l",
    "templateId": "pt_1a2b3c4d5e6f",
    "organizationId": "org_5f4e3d2c1b0a",
    "title": "Sunset Manor Safeguarding Policy",
    "category": "safeguarding",
    "jurisdiction": ["england_cqc"],
    "status": "DRAFT",
    "effectiveDate": "2025-02-01T00:00:00Z",
    "reviewDate": "2026-02-01T00:00:00Z",
    "version": "1.0.0",
    "generatedAt": "2025-01-06T10:40:00Z",
    "generatedBy": "usr_9x8y7z6w5v4u",
    "content": "# Sunset Manor Safeguarding Policy\n\n**Safeguarding Lead:** Jane Smith (Senior Care Manager)\n**Contact:** +44 1234 567890\n\n## Policy Statement\nSunset Manor is committed to safeguarding all residents...",
    "metadata": {
      "wordCount": 2847,
      "estimatedReadTime": "12 minutes",
      "complianceChecklist": {
        "cqcRequirements": false,
        "staffTraining": false,
        "procedureReview": false
      },
      "acknowledgmentStatus": {
        "totalStaff": 25,
        "acknowledged": 0,
        "pending": 25
      }
    }
  },
  "meta": {
    "requestId": "req_ghi789jkl012",
    "timestamp": "2025-01-06T10:40:00Z",
    "version": "2.0.0"
  }
}
```

### PUT /api/v2/policies/instances/{instanceId}/approve

Approve a policy instance for implementation.

**Path Parameters:**
- `instanceId` (string): Unique policy instance identifier

**Request Body:**
```json
{
  "approvalComments": "Policy reviewed and approved for implementation. All CQC requirements have been verified.",
  "approvedBy": "Care Home Manager",
  "digitalSignature": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "conditions": [
    "Staff training must be completed within 30 days",
    "Review scheduled in 6 months due to regulatory changes"
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pi_7g6h5i4j3k2l",
    "status": "APPROVED",
    "approvedBy": "usr_9x8y7z6w5v4u",
    "approvedAt": "2025-01-06T11:00:00Z",
    "approvalComments": "Policy reviewed and approved for implementation. All CQC requirements have been verified.",
    "digitalSignature": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "conditions": [
      "Staff training must be completed within 30 days",
      "Review scheduled in 6 months due to regulatory changes"
    ],
    "nextReviewDate": "2025-07-06T00:00:00Z",
    "implementationDeadline": "2025-02-05T00:00:00Z"
  },
  "meta": {
    "requestId": "req_jkl012mno345",
    "timestamp": "2025-01-06T11:00:00Z",
    "version": "2.0.0"
  }
}
```

---

## 🔧 Template Engine APIs

### POST /api/v2/template-engine/process

Process template content with variable substitution and advanced features.

**Request Body:**
```json
{
  "content": "# {{organization.name}} Care Plan\n\n**Resident:** {{resident.name}}\n**Age:** {{calculateAge(resident.dateOfBirth)}}\n**Care Level:** {{resident.careLevel}}\n\n{{#if resident.hasAllergies}}\n## Allergies\n{{#each resident.allergies as allergy}}\n- {{allergy.name}} (Severity: {{allergy.severity}})\n{{/each}}\n{{/if}}\n\n**Generated on:** {{formatDate(currentDate, \"DD/MM/YYYY HH:mm\")}}",
  "context": {
    "organization": {
      "name": "Sunset Manor Care Home",
      "address": "123 Care Street, Healthcare City",
      "registrationNumber": "CHR123456"
    },
    "resident": {
      "name": "Mary Johnson",
      "dateOfBirth": "1945-03-15T00:00:00Z",
      "careLevel": "Enhanced",
      "hasAllergies": true,
      "allergies": [
        {
          "name": "Penicillin",
          "severity": "High",
          "notes": "Anaphylactic reaction"
        },
        {
          "name": "Nuts",
          "severity": "Medium",
          "notes": "Skin rash and swelling"
        }
      ]
    },
    "variables": {
      "planType": "Monthly Care Review",
      "reviewPeriod": "January 2025"
    }
  },
  "options": {
    "strictMode": true,
    "allowUnsafeContent": false,
    "preserveWhitespace": false,
    "locale": "en-GB",
    "timezone": "Europe/London",
    "sanitizeOutput": true
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "processedContent": "# Sunset Manor Care Home Care Plan\n\n**Resident:** Mary Johnson\n**Age:** 79\n**Care Level:** Enhanced\n\n## Allergies\n- Penicillin (Severity: High)\n- Nuts (Severity: Medium)\n\n**Generated on:** 06/01/2025 11:15",
    "statistics": {
      "originalLength": 487,
      "processedLength": 245,
      "variablesProcessed": 8,
      "conditionalBlocks": 2,
      "loops": 1,
      "functions": 2,
      "processingTime": 156
    },
    "warnings": [],
    "metadata": {
      "locale": "en-GB",
      "timezone": "Europe/London",
      "generatedAt": "2025-01-06T11:15:00Z"
    }
  },
  "meta": {
    "requestId": "req_mno345pqr678",
    "timestamp": "2025-01-06T11:15:00Z",
    "version": "2.0.0"
  }
}
```

### POST /api/v2/template-engine/validate

Validate template syntax and variable references.

**Request Body:**
```json
{
  "content": "# {{organization.name}} Policy\n\n{{#if hasEmergencyProcedures}}\n## Emergency Procedures\n{{#each emergencyContacts as contact}}\n- {{contact.name}}: {{contact.phone}}\n{{/each}}\n{{/if}}\n\n**Review Date:** {{formatDate(reviewDate, \"DD/MM/YYYY\")}}",
  "expectedVariables": [
    "organization.name",
    "hasEmergencyProcedures", 
    "emergencyContacts",
    "reviewDate"
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [
      "Function 'formatDate' should include error handling for invalid dates"
    ],
    "requiredVariables": [
      "organization.name",
      "hasEmergencyProcedures",
      "emergencyContacts", 
      "reviewDate"
    ],
    "foundVariables": [
      "organization.name",
      "hasEmergencyProcedures",
      "emergencyContacts",
      "reviewDate",
      "contact.name",
      "contact.phone"
    ],
    "syntaxAnalysis": {
      "conditionalBlocks": 1,
      "loops": 1,
      "functions": 1,
      "variableReferences": 6
    },
    "recommendations": [
      "Consider adding validation for 'contact.phone' format",
      "Add default value for 'hasEmergencyProcedures'"
    ]
  },
  "meta": {
    "requestId": "req_pqr678stu901",
    "timestamp": "2025-01-06T11:20:00Z",
    "version": "2.0.0"
  }
}
```

### GET /api/v2/template-engine/functions

Get available template functions and their documentation.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "functions": [
      {
        "name": "formatDate",
        "description": "Format a date according to the specified format",
        "parameters": [
          {
            "name": "date",
            "type": "Date|string",
            "required": true,
            "description": "Date to format"
          },
          {
            "name": "format",
            "type": "string",
            "required": false,
            "default": "DD/MM/YYYY",
            "description": "Date format pattern"
          }
        ],
        "examples": [
          "{{formatDate(currentDate, \"DD/MM/YYYY\")}}",
          "{{formatDate(resident.dateOfBirth, \"DD MMM YYYY\")}}",
          "{{formatDate(reviewDate, \"YYYY-MM-DD\")}}"
        ],
        "returnType": "string"
      },
      {
        "name": "calculateAge",
        "description": "Calculate age from birth date",
        "parameters": [
          {
            "name": "birthDate",
            "type": "Date|string",
            "required": true,
            "description": "Birth date"
          }
        ],
        "examples": [
          "{{calculateAge(resident.dateOfBirth)}}",
          "{{calculateAge(\"1945-03-15\")}}"
        ],
        "returnType": "number"
      },
      {
        "name": "currency",
        "description": "Format number as currency",
        "parameters": [
          {
            "name": "amount",
            "type": "number",
            "required": true,
            "description": "Amount to format"
          },
          {
            "name": "currency",
            "type": "string",
            "required": false,
            "default": "GBP",
            "description": "Currency code"
          }
        ],
        "examples": [
          "{{currency(1250.50, \"GBP\")}}",
          "{{currency(resident.weeklyFee)}}"
        ],
        "returnType": "string"
      }
    ],
    "categories": [
      {
        "name": "Date & Time",
        "functions": ["formatDate", "calculateAge", "addDays", "diffDays"]
      },
      {
        "name": "Text Processing", 
        "functions": ["upper", "lower", "capitalize", "truncate"]
      },
      {
        "name": "Numbers & Currency",
        "functions": ["currency", "percentage", "round", "format"]
      },
      {
        "name": "Healthcare Specific",
        "functions": ["bmiCalculator", "medicationSchedule", "riskAssessment"]
      }
    ]
  },
  "meta": {
    "requestId": "req_stu901vwx234",
    "timestamp": "2025-01-06T11:25:00Z",
    "version": "2.0.0"
  }
}
```

---

## 🔒 Enterprise Security APIs

### POST /api/v2/auth/login

Authenticate user with multi-factor support and risk assessment.

**Request Body:**
```json
{
  "identifier": "jane.smith@sunsetmanor.co.uk",
  "password": "SecurePassword123!",
  "organizationId": "org_5f4e3d2c1b0a",
  "context": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "deviceId": "device_abc123def456",
    "location": {
      "latitude": 51.5074,
      "longitude": -0.1278,
      "accuracy": 10
    }
  }
}
```

**Response (200 OK - Primary Authentication Successful):**
```json
{
  "success": true,
  "data": {
    "authenticationStatus": "SUCCESS",
    "user": {
      "id": "usr_9x8y7z6w5v4u",
      "email": "jane.smith@sunsetmanor.co.uk",
      "firstName": "Jane",
      "lastName": "Smith",
      "roles": ["care_manager", "safeguarding_lead"],
      "permissions": ["view_residents", "manage_policies", "approve_care_plans"],
      "organizationId": "org_5f4e3d2c1b0a",
      "lastLoginAt": "2025-01-06T09:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    },
    "riskAssessment": {
      "score": 15,
      "level": "low",
      "factors": [
        "Known device",
        "Normal business hours",
        "Expected geographic location"
      ]
    },
    "sessionInfo": {
      "sessionId": "sess_def456ghi789",
      "expiresAt": "2025-01-06T12:30:00Z",
      "refreshable": true
    }
  },
  "meta": {
    "requestId": "req_vwx234yza567",
    "timestamp": "2025-01-06T11:30:00Z",
    "version": "2.0.0"
  }
}
```

**Response (202 Accepted - Additional Authentication Required):**
```json
{
  "success": false,
  "data": {
    "authenticationStatus": "ADDITIONAL_AUTH_REQUIRED",
    "requiresTwoFactor": true,
    "requiresBiometric": false,
    "riskAssessment": {
      "score": 65,
      "level": "high",
      "factors": [
        "Unknown device",
        "Unusual geographic location",
        "Login outside normal hours"
      ]
    },
    "partialAuthToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "nextSteps": [
      {
        "method": "two_factor",
        "endpoint": "/api/v2/auth/2fa/verify",
        "description": "Complete two-factor authentication using TOTP"
      }
    ]
  },
  "meta": {
    "requestId": "req_yza567bcd890",
    "timestamp": "2025-01-06T11:30:00Z",
    "version": "2.0.0"
  }
}
```

### POST /api/v2/auth/2fa/verify

Complete two-factor authentication.

**Request Body:**
```json
{
  "partialAuthToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token": "123456",
  "context": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "authenticationStatus": "COMPLETE",
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    },
    "sessionInfo": {
      "sessionId": "sess_ghi789jkl012",
      "expiresAt": "2025-01-06T12:30:00Z",
      "securityLevel": "ENHANCED"
    }
  },
  "meta": {
    "requestId": "req_bcd890efg123",
    "timestamp": "2025-01-06T11:35:00Z",
    "version": "2.0.0"
  }
}
```

### GET /api/v2/auth/authorize

Check authorization for specific resource access.

**Query Parameters:**
- `resource` (string): Resource identifier
- `action` (string): Action to perform
- `context` (object): Additional context for ABAC evaluation

**Headers:**
```http
Authorization: Bearer <access_token>
X-Organization-ID: <organization_uuid>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "decision": "ALLOW",
    "reason": "User has required permission via Care Manager role",
    "accessLevel": "FULL",
    "conditions": [],
    "expiresAt": "2025-01-06T18:00:00Z",
    "audit": {
      "policyEvaluated": "rbac_care_manager_policy",
      "evaluationTime": 45,
      "riskFactors": []
    }
  },
  "meta": {
    "requestId": "req_efg123hij456",
    "timestamp": "2025-01-06T11:40:00Z",
    "version": "2.0.0"
  }
}
```

---

## 👥 Care Management APIs

### GET /api/v2/residents

Retrieve residents with filtering and search capabilities.

**Query Parameters:**
- `careLevel` (string): Filter by care level (basic, enhanced, specialist)
- `ageRange` (string): Age range filter (e.g., "65-80")
- `hasAllergies` (boolean): Filter residents with allergies
- `searchTerm` (string): Search in name, NHS number, room number
- `sortBy` (string): Sort field (name, admissionDate, dateOfBirth)
- `page` (integer): Page number
- `limit` (integer): Items per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "residents": [
      {
        "id": "res_1m2n3o4p5q6r",
        "nhsNumber": "123 456 7890",
        "firstName": "Mary",
        "lastName": "Johnson",
        "dateOfBirth": "1945-03-15T00:00:00Z",
        "age": 79,
        "gender": "Female",
        "roomNumber": "101A",
        "careLevel": "Enhanced",
        "admissionDate": "2023-08-15T00:00:00Z",
        "status": "Active",
        "primaryContact": {
          "name": "Sarah Johnson",
          "relationship": "Daughter",
          "phone": "+44 7890 123456",
          "email": "sarah.johnson@email.com"
        },
        "medicalInfo": {
          "allergies": ["Penicillin", "Nuts"],
          "conditions": ["Dementia", "Hypertension"],
          "gpPractice": "Meadowview Medical Centre",
          "lastAssessment": "2025-01-01T00:00:00Z"
        },
        "carePlan": {
          "id": "cp_7s8t9u0v1w2x",
          "status": "Active",
          "lastUpdated": "2025-01-01T00:00:00Z",
          "nextReview": "2025-04-01T00:00:00Z"
        },
        "metadata": {
          "photoUrl": "https://cdn.writecarenotes.com/photos/residents/res_1m2n3o4p5q6r.jpg",
          "createdAt": "2023-08-15T10:30:00Z",
          "updatedAt": "2025-01-06T09:15:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 125,
      "totalPages": 7,
      "hasNext": true,
      "hasPrev": false
    },
    "summary": {
      "totalResidents": 125,
      "carelevels": {
        "basic": 45,
        "enhanced": 65,
        "specialist": 15
      },
      "averageAge": 82.5,
      "occupancyRate": 94.7
    }
  },
  "meta": {
    "requestId": "req_hij456klm789",
    "timestamp": "2025-01-06T11:45:00Z",
    "version": "2.0.0"
  }
}
```

### POST /api/v2/residents/{residentId}/care-plans

Create a new care plan for a resident.

**Path Parameters:**
- `residentId` (string): Unique resident identifier

**Request Body:**
```json
{
  "planType": "Monthly Care Review",
  "assessmentDate": "2025-01-06T00:00:00Z",
  "reviewDate": "2025-02-06T00:00:00Z",
  "assessedBy": "usr_care_manager_001",
  "goals": [
    {
      "category": "Mobility",
      "description": "Maintain current mobility level with daily physiotherapy",
      "targetDate": "2025-03-06T00:00:00Z",
      "priority": "High",
      "interventions": [
        "Daily 30-minute physiotherapy sessions",
        "Use of walking frame for corridors",
        "Weekly review with physiotherapist"
      ]
    },
    {
      "category": "Social Engagement", 
      "description": "Increase participation in group activities",
      "targetDate": "2025-02-20T00:00:00Z",
      "priority": "Medium",
      "interventions": [
        "Encourage attendance at music therapy",
        "Family visit coordination",
        "Peer mentoring program"
      ]
    }
  ],
  "riskAssessments": [
    {
      "type": "Falls Risk",
      "level": "Medium",
      "factors": ["History of falls", "Mobility issues"],
      "mitigations": ["Bed rails", "Hourly checks during night"],
      "reviewDate": "2025-01-20T00:00:00Z"
    }
  ],
  "medicationReview": {
    "required": true,
    "lastReview": "2024-12-15T00:00:00Z",
    "nextReview": "2025-03-15T00:00:00Z",
    "reviewer": "Dr. Smith - GP"
  },
  "personalPreferences": {
    "dietaryRequirements": ["Soft diet", "No dairy"],
    "sleepPattern": "Early riser (6 AM)",
    "activities": ["Reading", "Music", "Garden visits"],
    "communication": "Hard of hearing - speak clearly"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "cp_3y4z5a6b7c8d",
    "residentId": "res_1m2n3o4p5q6r",
    "planType": "Monthly Care Review",
    "status": "Draft",
    "assessmentDate": "2025-01-06T00:00:00Z",
    "reviewDate": "2025-02-06T00:00:00Z",
    "assessedBy": "usr_care_manager_001",
    "approvalStatus": {
      "status": "Pending",
      "requiredApprovals": ["Care Manager", "Senior Nurse"],
      "approvals": []
    },
    "goals": [
      {
        "id": "goal_1a2b3c4d",
        "category": "Mobility",
        "description": "Maintain current mobility level with daily physiotherapy",
        "targetDate": "2025-03-06T00:00:00Z",
        "priority": "High",
        "status": "Active",
        "progress": 0,
        "interventions": [
          {
            "id": "int_5e6f7g8h",
            "description": "Daily 30-minute physiotherapy sessions",
            "frequency": "Daily",
            "assignedTo": "Physiotherapy Team",
            "status": "Scheduled"
          }
        ]
      }
    ],
    "riskProfile": {
      "overallRisk": "Medium",
      "assessments": [
        {
          "type": "Falls Risk",
          "level": "Medium",
          "lastAssessed": "2025-01-06T00:00:00Z",
          "nextReview": "2025-01-20T00:00:00Z"
        }
      ]
    },
    "compliance": {
      "cqcRequirements": true,
      "documentationComplete": false,
      "requiredSignatures": ["Care Manager", "Resident/Family"],
      "lastAudit": null
    },
    "metadata": {
      "version": "1.0",
      "createdAt": "2025-01-06T11:50:00Z",
      "createdBy": "usr_care_manager_001",
      "estimatedCompletionTime": "45 minutes"
    }
  },
  "meta": {
    "requestId": "req_klm789nop012",
    "timestamp": "2025-01-06T11:50:00Z",
    "version": "2.0.0"
  }
}
```

---

## 📊 Compliance & Regulatory APIs

### GET /api/v2/compliance/report/{jurisdiction}

Generate compliance report for specific regulatory jurisdiction.

**Path Parameters:**
- `jurisdiction` (string): Regulatory jurisdiction (england_cqc, scotland_ci, wales_ciw, etc.)

**Query Parameters:**
- `startDate` (string): Report start date (ISO 8601)
- `endDate` (string): Report end date (ISO 8601)
- `includeDetails` (boolean): Include detailed findings (default: false)
- `format` (string): Report format (json, pdf, excel)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reportId": "compliance_report_20250106",
    "jurisdiction": "england_cqc",
    "organizationId": "org_5f4e3d2c1b0a",
    "reportPeriod": {
      "startDate": "2024-12-01T00:00:00Z",
      "endDate": "2025-01-06T00:00:00Z"
    },
    "overallCompliance": {
      "score": 94.5,
      "rating": "Good",
      "previousScore": 92.1,
      "trend": "Improving"
    },
    "keyQuestions": [
      {
        "question": "S1: How do you ensure that people using the service are safe?",
        "rating": "Good",
        "score": 95,
        "evidence": [
          "Safeguarding policies up to date",
          "Staff training compliance at 98%",
          "Zero serious incidents in reporting period"
        ],
        "improvements": [
          "Update fire evacuation procedures",
          "Complete advanced safeguarding training for 3 staff"
        ]
      },
      {
        "question": "E1: How do you ensure that people's care and treatment achieves good outcomes?",
        "rating": "Outstanding", 
        "score": 97,
        "evidence": [
          "Resident satisfaction score: 96%",
          "Clinical outcomes above national average",
          "Personalized care plans for all residents"
        ],
        "improvements": []
      }
    ],
    "policies": {
      "totalPolicies": 47,
      "upToDate": 45,
      "needingReview": 2,
      "overdue": 0,
      "complianceRate": 95.7
    },
    "training": {
      "staffCompliance": 98.2,
      "mandatoryTraining": {
        "safeguarding": 100,
        "fireSupport": 96,
        "infectionControl": 99,
        "mentalCapacity": 97
      },
      "overdueTraining": 3
    },
    "incidents": {
      "totalIncidents": 12,
      "seriousIncidents": 0,
      "notifiableEvents": 1,
      "averageResolutionTime": "3.2 days",
      "learningActions": 8
    },
    "auditResults": {
      "lastInspection": "2024-10-15T00:00:00Z",
      "nextInspection": "2025-10-15T00:00:00Z",
      "internalAudits": 4,
      "externalAudits": 1,
      "actionItems": {
        "completed": 15,
        "inProgress": 3,
        "overdue": 0
      }
    },
    "recommendations": [
      {
        "priority": "High",
        "area": "Fire Safety",
        "description": "Update fire evacuation procedures to include new wing",
        "deadline": "2025-02-01T00:00:00Z"
      },
      {
        "priority": "Medium", 
        "area": "Staff Training",
        "description": "Complete advanced safeguarding training for care assistants",
        "deadline": "2025-03-01T00:00:00Z"
      }
    ],
    "generatedAt": "2025-01-06T12:00:00Z",
    "validUntil": "2025-02-06T12:00:00Z"
  },
  "meta": {
    "requestId": "req_nop012qrs345", 
    "timestamp": "2025-01-06T12:00:00Z",
    "version": "2.0.0"
  }
}
```

---

## ⚠️ Error Handling

All API endpoints follow consistent error response formats:

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more validation errors occurred",
    "details": [
      {
        "field": "safeguardingLead",
        "code": "REQUIRED_FIELD",
        "message": "Safeguarding lead is required for policy generation"
      },
      {
        "field": "contactNumber",
        "code": "INVALID_FORMAT",
        "message": "Contact number must be in UK format (+44...)"
      }
    ],
    "documentation": "https://docs.writecarenotes.com/errors/validation",
    "supportCode": "ERR_20250106_001"
  },
  "meta": {
    "requestId": "req_error_123abc",
    "timestamp": "2025-01-06T12:05:00Z",
    "version": "2.0.0"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_FAILED` | 401 | Invalid or missing authentication |
| `AUTHORIZATION_DENIED` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `CONFLICT_ERROR` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429 | API rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## 🚦 Rate Limiting

API rate limits ensure fair usage and system stability:

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641484800
X-RateLimit-Window: 3600
```

### Rate Limits by Endpoint Type

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Policy Creation | 50 requests | 1 hour |
| Template Processing | 100 requests | 1 hour |
| Data Retrieval | 1000 requests | 1 hour |
| File Upload | 20 requests | 1 hour |

---

## 📚 SDK & Integration Examples

### JavaScript/Node.js SDK

```javascript
const WriteCareNotes = require('@writecarenotes/sdk');

// Initialize client
const client = new WriteCareNotes({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.writecarenotes.com/v2',
  organizationId: 'org_5f4e3d2c1b0a'
});

// Create policy template
const template = await client.policies.templates.create({
  title: 'Medication Management Policy',
  category: 'medication',
  jurisdiction: ['england_cqc'],
  description: 'Comprehensive medication management policy',
  content: templateContent,
  variables: templateVariables
});

// Generate policy instance
const policy = await client.policies.generate({
  templateId: template.id,
  variableValues: {
    pharmacist: 'Dr. Sarah Wilson',
    reviewFrequency: 'Monthly'
  }
});

// Approve policy
const approvedPolicy = await client.policies.approve(policy.id, {
  approvalComments: 'Policy approved for implementation'
});
```

### Python SDK

```python
from writecarenotes import WriteCareNotesClient

# Initialize client
client = WriteCareNotesClient(
    api_key='your_api_key',
    base_url='https://api.writecarenotes.com/v2',
    organization_id='org_5f4e3d2c1b0a'
)

# Create policy template
template = client.policies.templates.create(
    title='Safeguarding Policy Template',
    category='safeguarding',
    jurisdiction=['england_cqc'],
    content=template_content,
    variables=template_variables
)

# Process template with data
processed_content = client.template_engine.process(
    content=template.content,
    context={
        'organization': organization_data,
        'variables': custom_variables
    }
)
```

### REST API with cURL

```bash
# Authenticate
curl -X POST https://api.writecarenotes.com/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "password": "password",
    "organizationId": "org_5f4e3d2c1b0a"
  }'

# Create policy template  
curl -X POST https://api.writecarenotes.com/v2/policies/templates \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Organization-ID: org_5f4e3d2c1b0a" \
  -d @policy_template.json

# Generate policy
curl -X POST https://api.writecarenotes.com/v2/policies/generate \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "pt_1a2b3c4d5e6f",
    "organizationId": "org_5f4e3d2c1b0a",
    "variableValues": {
      "safeguardingLead": "Jane Smith"
    }
  }'
```

---

## 🔗 Additional Resources

- **API Reference:** https://docs.writecarenotes.com/api
- **Developer Portal:** https://developers.writecarenotes.com
- **SDKs:** https://github.com/writecarenotes
- **Support:** https://support.writecarenotes.com
- **Status Page:** https://status.writecarenotes.com

---

**© 2025 WriteCareNotes Ltd. All rights reserved.**