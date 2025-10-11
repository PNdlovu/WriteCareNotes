# Child Finance Controller - API Documentation

## Overview

Enterprise-grade REST API for managing children's residential care finances across all 8 British Isles jurisdictions (England, Scotland, Wales, Northern Ireland, Ireland, Jersey, Guernsey, Isle of Man).

**Base URL**: `/api/children/billing`

**Authentication**: JWT Bearer Token required for all endpoints

**Version**: 1.0.0

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [CRUD Operations](#crud-operations)
3. [Invoice Management](#invoice-management)
4. [Reporting](#reporting)
5. [Dispute Management](#dispute-management)
6. [Transition to Leaving Care](#transition-to-leaving-care)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Examples](#examples)

---

## Authentication & Authorization

### Required Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| `FINANCE_ADMIN` | Full access (create, read, update, delete, payments, disputes) |
| `FINANCE_VIEWER` | Read-only access (view billing, invoices, reports) |
| `MANAGER` | Full access except payment recording |
| `SOCIAL_WORKER` | View own children's billing, create reports, transitions |
| `IRO` | View financial reports and IRO dashboard |

---

## CRUD Operations

### 1. Create Child Billing

**Endpoint**: `POST /api/children/billing`

**Description**: Create new billing record for child placement with local authority funding.

**Required Roles**: `FINANCE_ADMIN`, `MANAGER`

**Request Body**:

```json
{
  "childId": "uuid",
  "jurisdiction": "ENGLAND" | "SCOTLAND" | "WALES" | "NORTHERN_IRELAND" | "IRELAND" | "JERSEY" | "GUERNSEY" | "ISLE_OF_MAN",
  "primaryFundingSource": "LOCAL_AUTHORITY" | "HEALTH_BOARD" | "TUSLA" | "EDUCATION_AUTHORITY" | "DIRECT_PAYMENT" | "JOINT_FUNDING" | "SECTION_17" | "SECTION_20" | "COMPULSORY_ORDER" | "VOLUNTARY_ACCOMMODATION",
  "primaryFunderName": "string",
  "localAuthorityCode": "string (optional)",
  "dailyRate": 450.00,
  "billingFrequency": "WEEKLY" | "MONTHLY" | "QUARTERLY",
  "paymentTermsDays": 30,
  "placementStartDate": "2024-01-15T00:00:00Z",
  "socialWorkerName": "string",
  "socialWorkerEmail": "email@example.com",
  "socialWorkerPhone": "+44 20 1234 5678",
  "invoiceAddress": "string",
  "invoicePostcode": "string",
  "invoiceEmail": "billing@localauthority.gov.uk (optional)",
  "serviceCharges": [
    {
      "name": "Therapy Sessions",
      "frequency": "WEEKLY",
      "amount": 75.00,
      "startDate": "2024-01-15T00:00:00Z"
    }
  ],
  "personalAllowances": {
    "pocketMoney": 12.50,
    "clothing": 50.00,
    "birthday": 100.00,
    "religious": 25.00,
    "cultural": 30.00
  },
  "fundingAllocations": [
    {
      "funderId": "uuid",
      "funderName": "Local Authority A",
      "percentage": 70.0,
      "startDate": "2024-01-15T00:00:00Z"
    },
    {
      "funderId": "uuid",
      "funderName": "Health Board B",
      "percentage": 30.0,
      "startDate": "2024-01-15T00:00:00Z"
    }
  ],
  "notes": "string (optional)"
}
```

**Success Response**: `201 Created`

```json
{
  "success": true,
  "message": "Child billing record created successfully",
  "data": {
    "id": "uuid",
    "childId": "uuid",
    "jurisdiction": "ENGLAND",
    "dailyRate": 450.00,
    "billingFrequency": "MONTHLY",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    ...
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Error Responses**:

- `400 Bad Request` - Invalid input or active billing already exists
- `404 Not Found` - Child not found
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - Insufficient permissions

---

### 2. Get Child Billing

**Endpoint**: `GET /api/children/billing/:childId`

**Description**: Get active billing record for specific child.

**Required Roles**: `FINANCE_ADMIN`, `FINANCE_VIEWER`, `MANAGER`, `SOCIAL_WORKER`

**URL Parameters**:

- `childId` (UUID) - Child identifier

**Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "childId": "uuid",
    "jurisdiction": "ENGLAND",
    "primaryFundingSource": "LOCAL_AUTHORITY",
    "dailyRate": 450.00,
    "weeklyRate": 3150.00,
    "monthlyRate": 13500.00,
    "totalInvoiced": 67500.00,
    "totalPaid": 54000.00,
    "currentArrears": 13500.00,
    "isActive": true,
    "placementStartDate": "2024-01-15T00:00:00Z",
    "serviceCharges": [...],
    "personalAllowances": {...},
    "invoices": [...],
    "paymentHistory": [...],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Error Responses**:

- `404 Not Found` - Billing record not found

---

### 3. Update Child Billing

**Endpoint**: `PUT /api/children/billing/:id`

**Description**: Update billing record (rates, terms, contacts, allowances).

**Required Roles**: `FINANCE_ADMIN`, `MANAGER`

**URL Parameters**:

- `id` (UUID) - Billing record identifier

**Request Body** (all fields optional):

```json
{
  "dailyRate": 475.00,
  "billingFrequency": "WEEKLY",
  "paymentTermsDays": 14,
  "placementEndDate": "2024-12-31T00:00:00Z",
  "socialWorkerName": "string",
  "socialWorkerEmail": "email@example.com",
  "socialWorkerPhone": "+44 20 1234 5678",
  "invoiceAddress": "string",
  "invoicePostcode": "string",
  "serviceCharges": [...],
  "personalAllowances": {...},
  "notes": "string"
}
```

**Success Response**: `200 OK`

```json
{
  "success": true,
  "message": "Billing record updated successfully",
  "data": {
    "id": "uuid",
    "dailyRate": 475.00,
    "weeklyRate": 3325.00,
    "monthlyRate": 14250.00,
    ...
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Error Responses**:

- `404 Not Found` - Billing record not found

---

### 4. Deactivate Child Billing

**Endpoint**: `DELETE /api/children/billing/:id`

**Description**: Soft delete billing record (sets `isActive=false`, `placementEndDate=now`).

**Required Roles**: `FINANCE_ADMIN`, `MANAGER`

**URL Parameters**:

- `id` (UUID) - Billing record identifier

**Success Response**: `200 OK`

```json
{
  "success": true,
  "message": "Billing record deactivated successfully",
  "data": {
    "id": "uuid",
    "isActive": false,
    "placementEndDate": "2024-06-30T00:00:00Z",
    ...
  },
  "timestamp": "2024-06-30T10:00:00Z"
}
```

**Error Responses**:

- `404 Not Found` - Billing record not found

---

## Invoice Management

### 5. Get Child Invoices

**Endpoint**: `GET /api/children/billing/:childId/invoices`

**Description**: Get all invoices for specific child placement.

**Required Roles**: `FINANCE_ADMIN`, `FINANCE_VIEWER`, `MANAGER`, `SOCIAL_WORKER`

**URL Parameters**:

- `childId` (UUID) - Child identifier

**Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "childId": "uuid",
    "billingId": "uuid",
    "invoices": [
      {
        "id": "uuid",
        "invoiceNumber": "INV-2024-001234",
        "invoiceDate": "2024-01-31T00:00:00Z",
        "dueDate": "2024-02-29T00:00:00Z",
        "amount": 13500.00,
        "amountPaid": 13500.00,
        "status": "PAID",
        "lineItems": [...],
        "createdAt": "2024-01-31T10:00:00Z"
      }
    ],
    "paymentHistory": [
      {
        "invoiceId": "uuid",
        "amount": 13500.00,
        "paymentDate": "2024-02-15T00:00:00Z",
        "paymentReference": "LA-PAY-2024-5678",
        "recordedBy": "finance.admin",
        "recordedAt": "2024-02-15T10:00:00Z"
      }
    ],
    "totalInvoiced": 67500.00,
    "totalPaid": 54000.00,
    "currentArrears": 13500.00
  },
  "timestamp": "2024-06-30T10:00:00Z"
}
```

**Error Responses**:

- `404 Not Found` - Billing record not found

---

### 6. Generate Invoice Manually

**Endpoint**: `POST /api/children/billing/:id/generate-invoice`

**Description**: Manually generate invoice for child placement (bypasses auto-generation cron).

**Required Roles**: `FINANCE_ADMIN`, `MANAGER`

**URL Parameters**:

- `id` (UUID) - Billing record identifier

**Request Body**:

```json
{
  "invoiceDate": "2024-06-30T00:00:00Z",
  "dueDate": "2024-07-30T00:00:00Z (optional)",
  "includePersonalAllowances": true,
  "notes": "string (optional)"
}
```

**Success Response**: `201 Created`

```json
{
  "success": true,
  "message": "Invoice generated successfully",
  "data": {
    "id": "uuid",
    "invoiceNumber": "INV-2024-001235",
    "invoiceDate": "2024-06-30T00:00:00Z",
    "dueDate": "2024-07-30T00:00:00Z",
    "amount": 13500.00,
    "status": "PENDING",
    "lineItems": [
      {
        "description": "Monthly placement fee (June 2024)",
        "quantity": 1,
        "unitPrice": 13500.00,
        "total": 13500.00
      }
    ],
    "createdAt": "2024-06-30T10:00:00Z"
  },
  "timestamp": "2024-06-30T10:00:00Z"
}
```

**Error Responses**:

- `404 Not Found` - Billing record not found

---

### 7. Record Payment

**Endpoint**: `POST /api/children/billing/:id/record-payment/:invoiceId`

**Description**: Record local authority payment for invoice.

**Required Roles**: `FINANCE_ADMIN`

**URL Parameters**:

- `id` (UUID) - Billing record identifier
- `invoiceId` (UUID) - Invoice identifier

**Request Body**:

```json
{
  "amount": 13500.00,
  "paymentDate": "2024-07-15T00:00:00Z",
  "paymentReference": "LA-PAY-2024-9012"
}
```

**Success Response**: `200 OK`

```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "billingId": "uuid",
    "invoiceId": "uuid",
    "amount": 13500.00,
    "paymentDate": "2024-07-15T00:00:00Z",
    "paymentReference": "LA-PAY-2024-9012"
  },
  "timestamp": "2024-07-15T10:00:00Z"
}
```

**Error Responses**:

- `404 Not Found` - Billing or invoice not found

---

## Reporting

### 8. Get Overdue Invoices

**Endpoint**: `GET /api/children/billing/reports/overdue`

**Description**: Get arrears report for all children with overdue invoices.

**Required Roles**: `FINANCE_ADMIN`, `FINANCE_VIEWER`, `MANAGER`

**Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "totalChildren": 12,
    "totalOverdue": 156000.00,
    "overdueList": [
      {
        "childId": "uuid",
        "childName": "Anonymous Child A",
        "localAuthority": "Local Authority Name",
        "totalOverdue": 27000.00,
        "oldestOverdueDate": "2024-04-30T00:00:00Z",
        "daysPastDue": 61,
        "overdueInvoices": [
          {
            "invoiceId": "uuid",
            "invoiceNumber": "INV-2024-001230",
            "dueDate": "2024-04-30T00:00:00Z",
            "amount": 13500.00,
            "amountOutstanding": 13500.00
          }
        ]
      }
    ]
  },
  "timestamp": "2024-06-30T10:00:00Z"
}
```

---

### 9. Get Financial Statistics

**Endpoint**: `GET /api/children/billing/reports/stats`

**Description**: Get comprehensive financial summary across all children.

**Required Roles**: `FINANCE_ADMIN`, `FINANCE_VIEWER`, `MANAGER`, `IRO`

**Query Parameters**:

- `jurisdiction` (optional) - Filter by jurisdiction (e.g., `ENGLAND`)
- `fundingSource` (optional) - Filter by funding source (e.g., `LOCAL_AUTHORITY`)
- `hasArrears` (optional) - Filter by arrears status (boolean)
- `hasDispute` (optional) - Filter by dispute status (boolean)

**Example**: `GET /api/children/billing/reports/stats?jurisdiction=ENGLAND&hasArrears=true`

**Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "totalChildren": 45,
    "activeChildren": 42,
    "totalInvoiced": 1890000.00,
    "totalPaid": 1650000.00,
    "totalOutstanding": 240000.00,
    "byJurisdiction": {
      "ENGLAND": { "count": 30, "totalInvoiced": 1350000.00, "totalPaid": 1200000.00 },
      "SCOTLAND": { "count": 8, "totalInvoiced": 360000.00, "totalPaid": 315000.00 },
      "WALES": { "count": 4, "totalInvoiced": 180000.00, "totalPaid": 135000.00 }
    },
    "byFundingSource": {
      "LOCAL_AUTHORITY": { "count": 38, "totalInvoiced": 1710000.00 },
      "JOINT_FUNDING": { "count": 5, "totalInvoiced": 150000.00 },
      "SECTION_20": { "count": 2, "totalInvoiced": 30000.00 }
    },
    "childrenWithArrears": 12,
    "childrenWithDisputes": 3,
    "averageDailyRate": 425.50
  },
  "timestamp": "2024-06-30T10:00:00Z"
}
```

---

### 10. Get Child Financial Report

**Endpoint**: `GET /api/children/billing/:childId/report`

**Description**: Get comprehensive financial report for individual child.

**Required Roles**: `FINANCE_ADMIN`, `FINANCE_VIEWER`, `MANAGER`, `SOCIAL_WORKER`, `IRO`

**URL Parameters**:

- `childId` (UUID) - Child identifier

**Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "childId": "uuid",
    "placementDuration": 180,
    "totalCost": 81000.00,
    "totalInvoiced": 67500.00,
    "totalPaid": 54000.00,
    "currentArrears": 13500.00,
    "personalAllowancesSpent": {
      "pocketMoney": 2250.00,
      "clothing": 900.00,
      "birthday": 200.00,
      "religious": 450.00,
      "cultural": 540.00,
      "total": 4340.00
    },
    "serviceChargesTotal": 13500.00,
    "invoiceHistory": [...],
    "paymentHistory": [...]
  },
  "timestamp": "2024-06-30T10:00:00Z"
}
```

**Error Responses**:

- `404 Not Found` - Billing record not found

---

### 11. Get IRO Dashboard

**Endpoint**: `GET /api/children/billing/reports/iro/dashboard`

**Description**: Get financial oversight dashboard for Independent Reviewing Officers.

**Required Roles**: `IRO`, `MANAGER`

**Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "totalChildren": 45,
    "childrenWithArrears": 12,
    "childrenWithDisputes": 3,
    "totalOutstanding": 240000.00,
    "highRiskChildren": [
      {
        "childId": "uuid",
        "arrears": 27000.00,
        "daysPastDue": 61,
        "hasDispute": true
      }
    ],
    "byJurisdiction": {...},
    "recentActivity": [...]
  },
  "timestamp": "2024-06-30T10:00:00Z"
}
```

---

## Dispute Management

### 12. Raise Dispute

**Endpoint**: `POST /api/children/billing/:id/raise-dispute`

**Description**: Raise dispute for billing record (e.g., local authority disputes charges).

**Required Roles**: `FINANCE_ADMIN`, `MANAGER`

**URL Parameters**:

- `id` (UUID) - Billing record identifier

**Request Body**:

```json
{
  "details": "Local authority disputes therapy session charges for May 2024"
}
```

**Success Response**: `200 OK`

```json
{
  "success": true,
  "message": "Dispute raised successfully",
  "data": {
    "id": "uuid",
    "hasActiveDispute": true,
    "disputeDetails": "Local authority disputes therapy session charges for May 2024",
    "disputeRaisedAt": "2024-06-30T10:00:00Z",
    "disputeRaisedBy": "finance.admin",
    ...
  },
  "timestamp": "2024-06-30T10:00:00Z"
}
```

**Error Responses**:

- `404 Not Found` - Billing record not found

---

### 13. Resolve Dispute

**Endpoint**: `POST /api/children/billing/:id/resolve-dispute`

**Description**: Mark dispute as resolved.

**Required Roles**: `FINANCE_ADMIN`, `MANAGER`

**URL Parameters**:

- `id` (UUID) - Billing record identifier

**Success Response**: `200 OK`

```json
{
  "success": true,
  "message": "Dispute resolved successfully",
  "data": {
    "id": "uuid",
    "hasActiveDispute": false,
    "disputeResolvedAt": "2024-07-15T10:00:00Z",
    "disputeResolvedBy": "finance.admin",
    ...
  },
  "timestamp": "2024-07-15T10:00:00Z"
}
```

**Error Responses**:

- `400 Bad Request` - No active dispute exists
- `404 Not Found` - Billing record not found

---

## Transition to Leaving Care

### 14. Transition to Leaving Care Finances

**Endpoint**: `POST /api/children/billing/:id/transition`

**Description**: Transition child billing to leaving care finances (at age 16+).

**Required Roles**: `FINANCE_ADMIN`, `MANAGER`, `SOCIAL_WORKER`

**URL Parameters**:

- `id` (UUID) - Billing record identifier

**Success Response**: `200 OK`

```json
{
  "success": true,
  "message": "Transition to leaving care completed successfully",
  "data": {
    "childBillingId": "uuid",
    "leavingCareFinanceId": "uuid",
    "transitionDate": "2024-06-30T10:00:00Z",
    "finalBalance": 450.00,
    "transferredAllowances": {
      "pocketMoney": 12.50,
      "clothing": 50.00
    }
  },
  "timestamp": "2024-06-30T10:00:00Z"
}
```

**Error Responses**:

- `400 Bad Request` - Child must be 16+ or already transitioned
- `404 Not Found` - Billing record not found

---

## Data Models

### ChildBilling Entity

```typescript
{
  id: string (UUID)
  childId: string (UUID)
  jurisdiction: BritishIslesJurisdiction
  primaryFundingSource: ChildFundingSource
  primaryFunderName: string
  localAuthorityCode: string | null
  dailyRate: number
  weeklyRate: number (calculated: dailyRate * 7)
  monthlyRate: number (calculated: dailyRate * 30)
  billingFrequency: BillingFrequency
  paymentTermsDays: number
  isActive: boolean
  placementStartDate: Date
  placementEndDate: Date | null
  socialWorkerName: string
  socialWorkerEmail: string
  socialWorkerPhone: string
  invoiceAddress: string
  invoicePostcode: string
  invoiceEmail: string | null
  serviceCharges: ServiceCharge[] (JSON)
  personalAllowances: PersonalAllowances (JSON)
  fundingAllocations: FundingAllocation[] (JSON)
  totalInvoiced: number
  totalPaid: number
  currentArrears: number
  lastInvoiceDate: Date | null
  nextInvoiceDate: Date | null
  invoices: any[] (JSON) - Invoice IDs
  paymentHistory: PaymentRecord[] (JSON)
  hasActiveDispute: boolean
  disputeDetails: string | null
  disputeRaisedAt: Date | null
  disputeResolvedAt: Date | null
  hasTransitionedToLeavingCare: boolean
  leavingCareFinanceId: string | null
  transitionDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string | null
}
```

### Enums

```typescript
enum BritishIslesJurisdiction {
  ENGLAND = 'ENGLAND',
  SCOTLAND = 'SCOTLAND',
  WALES = 'WALES',
  NORTHERN_IRELAND = 'NORTHERN_IRELAND',
  IRELAND = 'IRELAND',
  JERSEY = 'JERSEY',
  GUERNSEY = 'GUERNSEY',
  ISLE_OF_MAN = 'ISLE_OF_MAN'
}

enum ChildFundingSource {
  LOCAL_AUTHORITY = 'LOCAL_AUTHORITY',
  HEALTH_BOARD = 'HEALTH_BOARD',
  TUSLA = 'TUSLA',
  EDUCATION_AUTHORITY = 'EDUCATION_AUTHORITY',
  DIRECT_PAYMENT = 'DIRECT_PAYMENT',
  JOINT_FUNDING = 'JOINT_FUNDING',
  SECTION_17 = 'SECTION_17',
  SECTION_20 = 'SECTION_20',
  COMPULSORY_ORDER = 'COMPULSORY_ORDER',
  VOLUNTARY_ACCOMMODATION = 'VOLUNTARY_ACCOMMODATION'
}

enum BillingFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY'
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)",
  "timestamp": "2024-06-30T10:00:00Z"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | OK | Successful GET/PUT/POST (non-creation) |
| `201` | Created | Successful POST (creation) |
| `400` | Bad Request | Invalid input, validation errors, business rule violations |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Insufficient permissions (role-based) |
| `404` | Not Found | Resource not found |
| `500` | Internal Server Error | Unexpected server error |

---

## Rate Limiting

**Default Limits**:

- 100 requests per minute per IP
- 1000 requests per hour per user

**Headers**:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
```

---

## Examples

### Example 1: Create Billing for English Local Authority Placement

```bash
curl -X POST https://api.example.com/api/children/billing \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "123e4567-e89b-12d3-a456-426614174000",
    "jurisdiction": "ENGLAND",
    "primaryFundingSource": "LOCAL_AUTHORITY",
    "primaryFunderName": "Manchester City Council",
    "localAuthorityCode": "MAN",
    "dailyRate": 450.00,
    "billingFrequency": "MONTHLY",
    "paymentTermsDays": 30,
    "placementStartDate": "2024-01-15T00:00:00Z",
    "socialWorkerName": "Jane Smith",
    "socialWorkerEmail": "jane.smith@manchester.gov.uk",
    "socialWorkerPhone": "+44 161 234 5678",
    "invoiceAddress": "Manchester City Council, Town Hall, Albert Square, Manchester M60 2LA",
    "invoicePostcode": "M60 2LA",
    "invoiceEmail": "childrens.finance@manchester.gov.uk",
    "serviceCharges": [
      {
        "name": "Weekly Therapy Session",
        "frequency": "WEEKLY",
        "amount": 75.00,
        "startDate": "2024-01-15T00:00:00Z"
      }
    ],
    "personalAllowances": {
      "pocketMoney": 12.50,
      "clothing": 50.00,
      "birthday": 100.00
    }
  }'
```

### Example 2: Get Overdue Invoices for England with Arrears

```bash
curl -X GET "https://api.example.com/api/children/billing/reports/stats?jurisdiction=ENGLAND&hasArrears=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Record Payment

```bash
curl -X POST https://api.example.com/api/children/billing/abc123/record-payment/def456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 13500.00,
    "paymentDate": "2024-07-15T00:00:00Z",
    "paymentReference": "MAN-PAY-2024-7890"
  }'
```

### Example 4: Transition to Leaving Care (16+ Child)

```bash
curl -X POST https://api.example.com/api/children/billing/abc123/transition \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Compliance References

### England
- Care Planning, Placement and Case Review (England) Regulations 2010
- Children Act 1989 (Section 20, Section 17)

### Scotland
- Looked After Children (Scotland) Regulations 2009
- Children (Scotland) Act 1995

### Wales
- Care Planning, Placement and Case Review (Wales) Regulations 2015

### Northern Ireland
- Children (Northern Ireland) Order 1995

### Ireland
- Child Care Act 1991
- Tusla - Child and Family Agency Act 2013

---

## Support

For technical support, contact:

- Email: api-support@example.com
- Documentation: https://docs.example.com/child-finance-api
- Developer Portal: https://developer.example.com

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**License**: Proprietary - Internal Use Only
