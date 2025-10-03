# API Endpoints – WriteCareNotes

## Overview

This document provides comprehensive documentation for all WriteCareNotes API endpoints, including authentication, request/response formats, and error handling.

## Base URL

```
Production: https://api.writecarenotes.com
Development: http://localhost:3000
```

## Authentication

### JWT Token
All API requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt-token>
```

### Token Refresh
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

## Core Endpoints

### Health Endpoints

#### GET /health
Get comprehensive system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-19T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "external_apis": "healthy"
  }
}
```

#### GET /health/ready
Get application readiness status.

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

#### GET /health/live
Get application liveness status.

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

#### GET /health/metrics
Get system metrics and performance data.

**Response:**
```json
{
  "timestamp": "2024-12-19T10:30:00Z",
  "metrics": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 23.1,
    "active_connections": 150,
    "request_rate": 25.5
  }
}
```

## Authentication Endpoints

### POST /api/auth/login
Authenticate user and return JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "role": "nurse",
      "name": "John Doe"
    }
  }
}
```

### POST /api/auth/logout
Logout user and invalidate tokens.

**Request:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

## Medication Endpoints

### GET /api/medication
Get list of medications with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `residentId` (string): Filter by resident ID
- `status` (string): Filter by status (active, inactive, expired)

**Response:**
```json
{
  "success": true,
  "data": {
    "medications": [
      {
        "id": "med-123",
        "residentId": "resident-456",
        "name": "Paracetamol",
        "dosage": "500mg",
        "frequency": "twice daily",
        "status": "active",
        "createdAt": "2024-12-19T10:30:00Z",
        "updatedAt": "2024-12-19T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### POST /api/medication
Create new medication record.

**Request:**
```json
{
  "residentId": "resident-456",
  "name": "Paracetamol",
  "dosage": "500mg",
  "frequency": "twice daily",
  "route": "oral",
  "instructions": "Take with food",
  "prescriber": "Dr. Smith",
  "startDate": "2024-12-19",
  "endDate": "2024-12-26"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "med-123",
    "residentId": "resident-456",
    "name": "Paracetamol",
    "dosage": "500mg",
    "frequency": "twice daily",
    "route": "oral",
    "instructions": "Take with food",
    "prescriber": "Dr. Smith",
    "startDate": "2024-12-19",
    "endDate": "2024-12-26",
    "status": "active",
    "createdAt": "2024-12-19T10:30:00Z",
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

### GET /api/medication/:id
Get specific medication details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "med-123",
    "residentId": "resident-456",
    "name": "Paracetamol",
    "dosage": "500mg",
    "frequency": "twice daily",
    "route": "oral",
    "instructions": "Take with food",
    "prescriber": "Dr. Smith",
    "startDate": "2024-12-19",
    "endDate": "2024-12-26",
    "status": "active",
    "createdAt": "2024-12-19T10:30:00Z",
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

### PUT /api/medication/:id
Update medication record.

**Request:**
```json
{
  "name": "Paracetamol",
  "dosage": "1000mg",
  "frequency": "three times daily",
  "instructions": "Take with food, avoid alcohol"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "med-123",
    "residentId": "resident-456",
    "name": "Paracetamol",
    "dosage": "1000mg",
    "frequency": "three times daily",
    "route": "oral",
    "instructions": "Take with food, avoid alcohol",
    "prescriber": "Dr. Smith",
    "startDate": "2024-12-19",
    "endDate": "2024-12-26",
    "status": "active",
    "createdAt": "2024-12-19T10:30:00Z",
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

### DELETE /api/medication/:id
Delete medication record.

**Response:**
```json
{
  "success": true,
  "message": "Medication deleted successfully"
}
```

## Consent Endpoints

### GET /api/consent/dashboard
Get consent dashboard with overview of all consents.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalConsents": 150,
    "activeConsents": 120,
    "expiringConsents": 15,
    "expiredConsents": 15,
    "consents": [
      {
        "id": "consent-123",
        "residentId": "resident-456",
        "type": "medical_treatment",
        "status": "active",
        "givenBy": "resident",
        "givenDate": "2024-12-19T10:30:00Z",
        "expiryDate": "2025-12-19T10:30:00Z"
      }
    ]
  }
}
```

### POST /api/consent
Create new consent record.

**Request:**
```json
{
  "residentId": "resident-456",
  "type": "medical_treatment",
  "givenBy": "resident",
  "witnessedBy": "nurse-123",
  "dataCategories": ["medical_records", "medication_history"],
  "expiryDate": "2025-12-19T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "consent-123",
    "residentId": "resident-456",
    "type": "medical_treatment",
    "status": "active",
    "givenBy": "resident",
    "witnessedBy": "nurse-123",
    "dataCategories": ["medical_records", "medication_history"],
    "givenDate": "2024-12-19T10:30:00Z",
    "expiryDate": "2025-12-19T10:30:00Z",
    "createdAt": "2024-12-19T10:30:00Z",
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

## NHS Integration Endpoints

### POST /api/healthcare/nhs/prescriptions/sync
Sync prescriptions with NHS Digital.

**Request:**
```json
{
  "nhsNumber": "1234567890",
  "syncType": "full"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "syncId": "sync-123",
    "nhsNumber": "1234567890",
    "syncType": "full",
    "status": "completed",
    "prescriptionsSynced": 15,
    "syncDate": "2024-12-19T10:30:00Z"
  }
}
```

### GET /api/healthcare/nhs/prescriptions
Get NHS prescription data.

**Query Parameters:**
- `nhsNumber` (string): NHS number
- `status` (string): Prescription status

**Response:**
```json
{
  "success": true,
  "data": {
    "prescriptions": [
      {
        "id": "prescription-123",
        "nhsNumber": "1234567890",
        "medicationName": "Paracetamol",
        "dosage": "500mg",
        "quantity": 100,
        "status": "active",
        "prescriber": "Dr. Smith",
        "prescriptionDate": "2024-12-19T10:30:00Z"
      }
    ]
  }
}
```

## Care Planning Endpoints

### GET /api/care-plans
Get list of care plans.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `residentId` (string): Filter by resident ID
- `status` (string): Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "carePlans": [
      {
        "id": "care-plan-123",
        "residentId": "resident-456",
        "type": "comprehensive",
        "status": "active",
        "goals": [
          {
            "id": "goal-123",
            "description": "Improve mobility",
            "targetDate": "2025-03-19",
            "status": "in_progress"
          }
        ],
        "createdAt": "2024-12-19T10:30:00Z",
        "updatedAt": "2024-12-19T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### POST /api/care-plans
Create new care plan.

**Request:**
```json
{
  "residentId": "resident-456",
  "type": "comprehensive",
  "goals": [
    {
      "description": "Improve mobility",
      "targetDate": "2025-03-19",
      "priority": "high"
    }
  ],
  "reviewDate": "2025-03-19T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "care-plan-123",
    "residentId": "resident-456",
    "type": "comprehensive",
    "status": "active",
    "goals": [
      {
        "id": "goal-123",
        "description": "Improve mobility",
        "targetDate": "2025-03-19",
        "priority": "high",
        "status": "in_progress"
      }
    ],
    "reviewDate": "2025-03-19T10:30:00Z",
    "createdAt": "2024-12-19T10:30:00Z",
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "timestamp": "2024-12-19T10:30:00Z",
    "correlationId": "corr-123"
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
- `500` - Internal Server Error

### Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Authorization failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INTERNAL_ERROR` - Internal server error

## Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

## Pagination

### Pagination Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Pagination Response
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering and Sorting

### Filtering
Use query parameters to filter results:
```
GET /api/medication?status=active&residentId=resident-456
```

### Sorting
Use `sort` parameter with field and direction:
```
GET /api/medication?sort=createdAt:desc
```

### Search
Use `search` parameter for text search:
```
GET /api/medication?search=paracetamol
```

---

*This API documentation is part of the WriteCareNotes comprehensive documentation suite. For interactive API testing, visit `/api/docs`.*