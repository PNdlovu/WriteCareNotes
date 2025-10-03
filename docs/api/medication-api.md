# Medication Management API Documentation

## Overview

The Medication Management API provides comprehensive endpoints for managing resident medications, including prescription tracking, administration records, and compliance monitoring for WriteCareNotes.

## Base URL

```
https://api.writecarenotes.com/v1/medications
```

## Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer <jwt-token>
```

## Medication Endpoints

### Get Medications

Retrieves a list of medications with filtering and pagination.

```http
GET /medications
```

**Query Parameters:**
- `page` (integer, min: 1, default: 1) - Page number
- `limit` (integer, min: 1, max: 100, default: 20) - Items per page
- `residentId` (uuid) - Filter by resident ID
- `status` (string) - Filter by status: `active|inactive|expired|discontinued`
- `category` (string) - Filter by category: `prescription|over_the_counter|controlled|as_needed`
- `search` (string, 2-100 chars) - Search term
- `sortBy` (string) - Sort field: `name|createdAt|nextDue|priority`
- `sortOrder` (string) - Sort direction: `asc|desc`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "med-123",
      "residentId": "resident-456",
      "name": "Paracetamol",
      "genericName": "Acetaminophen",
      "dosage": "500mg",
      "form": "tablet",
      "route": "oral",
      "frequency": "twice daily",
      "instructions": "Take with food",
      "category": "prescription",
      "status": "active",
      "priority": "medium",
      "prescriber": "Dr. Smith",
      "prescriptionDate": "2025-01-15T00:00:00Z",
      "startDate": "2025-01-15T00:00:00Z",
      "endDate": "2025-02-15T00:00:00Z",
      "nextDue": "2025-01-15T08:00:00Z",
      "totalQuantity": 60,
      "remainingQuantity": 45,
      "refillsRemaining": 2,
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
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

### Create Medication

Creates a new medication record for a resident.

```http
POST /medications
```

**Request Body:**
```json
{
  "residentId": "resident-456",
  "name": "Paracetamol",
  "genericName": "Acetaminophen",
  "dosage": "500mg",
  "form": "tablet",
  "route": "oral",
  "frequency": "twice daily",
  "instructions": "Take with food",
  "category": "prescription",
  "priority": "medium",
  "prescriber": "Dr. Smith",
  "prescriptionDate": "2025-01-15T00:00:00Z",
  "startDate": "2025-01-15T00:00:00Z",
  "endDate": "2025-02-15T00:00:00Z",
  "totalQuantity": 60,
  "refillsRemaining": 2,
  "allergies": ["penicillin"],
  "contraindications": ["liver_disease"],
  "sideEffects": ["nausea", "headache"],
  "monitoringRequired": true,
  "monitoringFrequency": "weekly"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "med-123",
    "residentId": "resident-456",
    "name": "Paracetamol",
    "genericName": "Acetaminophen",
    "dosage": "500mg",
    "form": "tablet",
    "route": "oral",
    "frequency": "twice daily",
    "instructions": "Take with food",
    "category": "prescription",
    "status": "active",
    "priority": "medium",
    "prescriber": "Dr. Smith",
    "prescriptionDate": "2025-01-15T00:00:00Z",
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-02-15T00:00:00Z",
    "nextDue": "2025-01-15T08:00:00Z",
    "totalQuantity": 60,
    "remainingQuantity": 60,
    "refillsRemaining": 2,
    "allergies": ["penicillin"],
    "contraindications": ["liver_disease"],
    "sideEffects": ["nausea", "headache"],
    "monitoringRequired": true,
    "monitoringFrequency": "weekly",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

### Get Medication by ID

Retrieves a specific medication by its ID.

```http
GET /medications/{id}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "med-123",
    "residentId": "resident-456",
    "name": "Paracetamol",
    "genericName": "Acetaminophen",
    "dosage": "500mg",
    "form": "tablet",
    "route": "oral",
    "frequency": "twice daily",
    "instructions": "Take with food",
    "category": "prescription",
    "status": "active",
    "priority": "medium",
    "prescriber": "Dr. Smith",
    "prescriptionDate": "2025-01-15T00:00:00Z",
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-02-15T00:00:00Z",
    "nextDue": "2025-01-15T08:00:00Z",
    "totalQuantity": 60,
    "remainingQuantity": 45,
    "refillsRemaining": 2,
    "allergies": ["penicillin"],
    "contraindications": ["liver_disease"],
    "sideEffects": ["nausea", "headache"],
    "monitoringRequired": true,
    "monitoringFrequency": "weekly",
    "administrationHistory": [
      {
        "id": "admin-123",
        "administeredAt": "2025-01-15T08:00:00Z",
        "administeredBy": "nurse-456",
        "status": "completed",
        "notes": "Taken with breakfast"
      }
    ],
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

### Update Medication

Updates an existing medication record.

```http
PUT /medications/{id}
```

**Request Body:**
```json
{
  "name": "Paracetamol",
  "dosage": "1000mg",
  "frequency": "three times daily",
  "instructions": "Take with food, avoid alcohol",
  "endDate": "2025-03-15T00:00:00Z",
  "refillsRemaining": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "med-123",
    "residentId": "resident-456",
    "name": "Paracetamol",
    "dosage": "1000mg",
    "frequency": "three times daily",
    "instructions": "Take with food, avoid alcohol",
    "endDate": "2025-03-15T00:00:00Z",
    "refillsRemaining": 1,
    "updatedAt": "2025-01-15T11:00:00Z"
  }
}
```

### Delete Medication

Soft deletes a medication record.

```http
DELETE /medications/{id}
```

**Response (204):** No content

## Administration Endpoints

### Record Administration

Records medication administration.

```http
POST /medications/{id}/administrations
```

**Request Body:**
```json
{
  "administeredAt": "2025-01-15T08:00:00Z",
  "administeredBy": "nurse-456",
  "status": "completed",
  "quantity": 1,
  "notes": "Taken with breakfast",
  "sideEffects": [],
  "vitalSigns": {
    "bloodPressure": "120/80",
    "heartRate": 72,
    "temperature": 36.5
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "admin-123",
    "medicationId": "med-123",
    "administeredAt": "2025-01-15T08:00:00Z",
    "administeredBy": "nurse-456",
    "status": "completed",
    "quantity": 1,
    "notes": "Taken with breakfast",
    "sideEffects": [],
    "vitalSigns": {
      "bloodPressure": "120/80",
      "heartRate": 72,
      "temperature": 36.5
    },
    "createdAt": "2025-01-15T08:00:00Z"
  }
}
```

### Get Administration History

Retrieves administration history for a medication.

```http
GET /medications/{id}/administrations
```

**Query Parameters:**
- `page` (integer, min: 1, default: 1) - Page number
- `limit` (integer, min: 1, max: 100, default: 20) - Items per page
- `dateFrom` (date) - Start date filter
- `dateTo` (date) - End date filter
- `status` (string) - Filter by status: `completed|missed|refused|partial`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "admin-123",
      "medicationId": "med-123",
      "administeredAt": "2025-01-15T08:00:00Z",
      "administeredBy": "nurse-456",
      "status": "completed",
      "quantity": 1,
      "notes": "Taken with breakfast",
      "sideEffects": [],
      "vitalSigns": {
        "bloodPressure": "120/80",
        "heartRate": 72,
        "temperature": 36.5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Medication Schedule Endpoints

### Get Due Medications

Retrieves medications due for administration.

```http
GET /medications/due
```

**Query Parameters:**
- `date` (date) - Date to check (default: today)
- `residentId` (uuid) - Filter by resident
- `timeWindow` (integer) - Time window in minutes (default: 60)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "med-123",
      "residentId": "resident-456",
      "residentName": "John Smith",
      "name": "Paracetamol",
      "dosage": "500mg",
      "route": "oral",
      "dueAt": "2025-01-15T08:00:00Z",
      "priority": "medium",
      "instructions": "Take with food",
      "overdue": false,
      "timeUntilDue": 30
    }
  ]
}
```

### Get Medication Schedule

Retrieves medication schedule for a resident.

```http
GET /medications/schedule
```

**Query Parameters:**
- `residentId` (uuid) - Resident ID
- `dateFrom` (date) - Start date
- `dateTo` (date) - End date
- `format` (string) - Response format: `daily|weekly|monthly`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "residentId": "resident-456",
    "residentName": "John Smith",
    "schedule": [
      {
        "date": "2025-01-15",
        "medications": [
          {
            "id": "med-123",
            "name": "Paracetamol",
            "dosage": "500mg",
            "times": ["08:00", "20:00"],
            "status": "scheduled"
          }
        ]
      }
    ]
  }
}
```

## Compliance and Monitoring

### Get Compliance Report

Generates medication compliance report.

```http
GET /medications/compliance
```

**Query Parameters:**
- `residentId` (uuid) - Filter by resident
- `dateFrom` (date) - Start date
- `dateTo` (date) - End date
- `format` (string) - Report format: `summary|detailed`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "residentId": "resident-456",
    "period": {
      "from": "2025-01-01",
      "to": "2025-01-31"
    },
    "compliance": {
      "overallRate": 95.5,
      "totalDoses": 120,
      "administeredDoses": 115,
      "missedDoses": 5,
      "refusedDoses": 0
    },
    "byMedication": [
      {
        "medicationId": "med-123",
        "medicationName": "Paracetamol",
        "complianceRate": 96.7,
        "totalDoses": 60,
        "administeredDoses": 58,
        "missedDoses": 2
      }
    ]
  }
}
```

### Get Side Effects Report

Retrieves side effects monitoring report.

```http
GET /medications/side-effects
```

**Query Parameters:**
- `residentId` (uuid) - Filter by resident
- `medicationId` (uuid) - Filter by medication
- `dateFrom` (date) - Start date
- `dateTo` (date) - End date

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "side-effect-123",
      "medicationId": "med-123",
      "medicationName": "Paracetamol",
      "residentId": "resident-456",
      "sideEffect": "nausea",
      "severity": "mild",
      "reportedAt": "2025-01-15T10:00:00Z",
      "reportedBy": "nurse-456",
      "notes": "Mild nausea after morning dose",
      "actionTaken": "monitored",
      "resolved": true,
      "resolvedAt": "2025-01-15T14:00:00Z"
    }
  ]
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
    "details": {
      "field": "dosage",
      "message": "Dosage is required"
    }
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Medication not found"
  }
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Medication already exists for this resident"
  }
}
```

## Webhooks

### Supported Events
- `medication.created`
- `medication.updated`
- `medication.deleted`
- `medication.due`
- `medication.overdue`
- `administration.recorded`
- `side_effect.reported`

### Webhook Payload Example
```json
{
  "event": "medication.due",
  "timestamp": "2025-01-15T08:00:00Z",
  "data": {
    "medicationId": "med-123",
    "residentId": "resident-456",
    "dueAt": "2025-01-15T08:00:00Z",
    "medicationName": "Paracetamol",
    "priority": "medium"
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { MedicationAPI } from '@writecarenotes/api-client';

const medicationAPI = new MedicationAPI({
  baseURL: 'https://api.writecarenotes.com/v1',
  apiKey: 'your-api-key'
});

// Create medication
const medication = await medicationAPI.create({
  residentId: 'resident-123',
  name: 'Paracetamol',
  dosage: '500mg',
  frequency: 'twice daily'
});

// Record administration
await medicationAPI.recordAdministration('med-123', {
  administeredAt: new Date(),
  administeredBy: 'nurse-456',
  status: 'completed'
});
```

### Python
```python
from writecarenotes_api import MedicationAPI

medication_api = MedicationAPI(
    base_url='https://api.writecarenotes.com/v1',
    api_key='your-api-key'
)

# Create medication
medication = medication_api.create({
    'resident_id': 'resident-123',
    'name': 'Paracetamol',
    'dosage': '500mg',
    'frequency': 'twice daily'
})

# Get due medications
due_medications = medication_api.get_due_medications()
```

## Compliance Notes

### Healthcare Standards
- All medication records comply with CQC requirements
- NHS Digital integration for prescription data
- GDPR compliant data handling
- Audit trail for all medication operations

### Safety Features
- Drug interaction checking
- Allergy warnings
- Dosage validation
- Administration verification
- Side effect monitoring

---

*Last Updated: January 15, 2025*  
*API Version: v1.0.0*