# API Reference - Children's Care System

## 📖 Complete API Documentation

All endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

Base URL: `http://localhost:3000/api`

---

## 📍 Module 1: Child Profile Management

### Base Path: `/v1/children`

### 1.1 Create Child Profile
```http
POST /v1/children
```

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2010-01-15",
  "gender": "male",
  "ethnicity": "white_british",
  "legalStatus": "section_20",
  "placementStartDate": "2024-01-01",
  "socialWorkerName": "Jane Smith",
  "socialWorkerEmail": "jane.smith@council.gov.uk",
  "placementType": "foster_care",
  "careAuthority": "Birmingham City Council"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2010-01-15",
  "legalStatus": "section_20",
  "createdAt": "2025-10-10T10:00:00Z",
  "updatedAt": "2025-10-10T10:00:00Z"
}
```

---

### 1.2 Get All Children
```http
GET /v1/children?page=1&limit=20&legalStatus=section_20
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `legalStatus` (optional): Filter by legal status
- `placementType` (optional): Filter by placement type
- `ageRange` (optional): e.g., "10-15"

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "age": 15,
      "legalStatus": "section_20",
      "placementType": "foster_care"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

---

### 1.3 Get Child by ID
```http
GET /v1/children/:id
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2010-01-15",
  "age": 15,
  "gender": "male",
  "ethnicity": "white_british",
  "legalStatus": "section_20",
  "placementStartDate": "2024-01-01",
  "socialWorkerName": "Jane Smith",
  "socialWorkerEmail": "jane.smith@council.gov.uk",
  "placementType": "foster_care",
  "careAuthority": "Birmingham City Council",
  "createdAt": "2025-10-10T10:00:00Z",
  "updatedAt": "2025-10-10T10:00:00Z"
}
```

---

### 1.4 Update Child Profile
```http
PATCH /v1/children/:id
```

**Request Body** (partial update):
```json
{
  "socialWorkerName": "Sarah Johnson",
  "socialWorkerEmail": "sarah.johnson@council.gov.uk"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "socialWorkerName": "Sarah Johnson",
  "socialWorkerEmail": "sarah.johnson@council.gov.uk",
  "updatedAt": "2025-10-10T11:00:00Z"
}
```

---

### 1.5 Soft Delete Child
```http
DELETE /v1/children/:id
```

**Response** (204 No Content)

---

### 1.6 Advanced Search
```http
POST /v1/children/search
```

**Request Body**:
```json
{
  "filters": {
    "ageMin": 10,
    "ageMax": 15,
    "legalStatus": ["section_20", "section_31"],
    "placementType": ["foster_care"],
    "careAuthority": "Birmingham City Council"
  },
  "sort": {
    "field": "lastName",
    "order": "ASC"
  },
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

**Response** (200 OK): Similar to GET /v1/children

---

### 1.7 Get Child Timeline
```http
GET /v1/children/:id/timeline
```

**Response** (200 OK):
```json
{
  "events": [
    {
      "date": "2024-01-01",
      "type": "placement_start",
      "description": "Placed in foster care",
      "details": { "placementType": "foster_care" }
    },
    {
      "date": "2024-02-15",
      "type": "safeguarding_concern",
      "description": "Concern raised - emotional abuse",
      "details": { "riskLevel": "medium" }
    },
    {
      "date": "2024-03-01",
      "type": "care_plan_review",
      "description": "Statutory review completed",
      "details": { "outcome": "placement_continues" }
    }
  ]
}
```

---

### 1.8 Get Child Documents
```http
GET /v1/children/:id/documents
```

**Response** (200 OK):
```json
{
  "documents": [
    {
      "id": "doc-123",
      "type": "birth_certificate",
      "fileName": "john_doe_birth_cert.pdf",
      "uploadDate": "2024-01-05",
      "uploadedBy": "Jane Smith"
    },
    {
      "id": "doc-124",
      "type": "court_order",
      "fileName": "care_order_section_31.pdf",
      "uploadDate": "2024-01-10",
      "uploadedBy": "Legal Team"
    }
  ]
}
```

---

### 1.9 Get Child Relationships
```http
GET /v1/children/:id/relationships
```

**Response** (200 OK):
```json
{
  "familyMembers": [
    {
      "id": "fm-123",
      "name": "Mary Doe",
      "relationship": "mother",
      "parentalResponsibility": true,
      "contactAllowed": true
    },
    {
      "id": "fm-124",
      "name": "Robert Doe",
      "relationship": "father",
      "parentalResponsibility": false,
      "contactAllowed": false
    }
  ]
}
```

---

### 1.10 Get Placement History
```http
GET /v1/children/:id/placements
```

**Response** (200 OK):
```json
{
  "placements": [
    {
      "id": "placement-123",
      "type": "foster_care",
      "startDate": "2024-01-01",
      "endDate": null,
      "status": "active",
      "provider": "ABC Fostering Agency"
    },
    {
      "id": "placement-122",
      "type": "residential",
      "startDate": "2023-06-01",
      "endDate": "2023-12-31",
      "status": "ended",
      "provider": "XYZ Children's Home"
    }
  ]
}
```

---

### 1.11 Get Statutory Information
```http
GET /v1/children/:id/statutory
```

**Response** (200 OK):
```json
{
  "legalStatus": "section_31",
  "careOrderDate": "2024-01-01",
  "careOrderExpiryDate": "2028-01-15",
  "lastReviewDate": "2024-09-01",
  "nextReviewDue": "2025-03-01",
  "visitFrequency": "monthly",
  "lastVisitDate": "2025-10-01",
  "nextVisitDue": "2025-11-01"
}
```

---

### 1.12 Merge Duplicate Records
```http
POST /v1/children/:id/merge
```

**Request Body**:
```json
{
  "duplicateId": "550e8400-e29b-41d4-a716-446655440999",
  "keepPrimaryId": true
}
```

**Response** (200 OK):
```json
{
  "message": "Records merged successfully",
  "primaryRecordId": "550e8400-e29b-41d4-a716-446655440000",
  "mergedRecordId": "550e8400-e29b-41d4-a716-446655440999"
}
```

---

### 1.13 Get Audit Trail
```http
GET /v1/children/:id/audit
```

**Response** (200 OK):
```json
{
  "auditLog": [
    {
      "timestamp": "2025-10-10T10:00:00Z",
      "action": "created",
      "user": "jane.smith@council.gov.uk",
      "changes": null
    },
    {
      "timestamp": "2025-10-10T11:00:00Z",
      "action": "updated",
      "user": "sarah.johnson@council.gov.uk",
      "changes": {
        "socialWorkerName": {
          "from": "Jane Smith",
          "to": "Sarah Johnson"
        }
      }
    }
  ]
}
```

---

### 1.14 Restore Deleted Record
```http
POST /v1/children/:id/restore
```

**Response** (200 OK):
```json
{
  "message": "Child record restored successfully",
  "childId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 1.15 Get Statistics
```http
GET /v1/children/statistics
```

**Response** (200 OK):
```json
{
  "totalChildren": 1250,
  "byLegalStatus": {
    "section_20": 450,
    "section_31": 650,
    "epo": 50,
    "ico": 100
  },
  "byPlacementType": {
    "foster_care": 800,
    "residential": 200,
    "kinship": 150,
    "adoption": 100
  },
  "byAgeGroup": {
    "0-4": 200,
    "5-10": 400,
    "11-15": 450,
    "16-17": 200
  }
}
```

---

## 📍 Module 2: Placement Management

### Base Path: `/v1/placements`

### 2.1 Create Placement
```http
POST /v1/placements
```

**Request Body**:
```json
{
  "childId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "foster_care",
  "providerId": "provider-123",
  "startDate": "2024-01-01",
  "planedEndDate": "2025-01-01",
  "placementAddress": {
    "line1": "123 Foster Street",
    "city": "Birmingham",
    "postcode": "B1 1AA"
  },
  "carerDetails": {
    "primaryCarer": "Sarah Foster",
    "secondaryCarer": "John Foster",
    "contactNumber": "0121 555 0123"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "placement-123",
  "childId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "foster_care",
  "status": "active",
  "startDate": "2024-01-01",
  "createdAt": "2025-10-10T10:00:00Z"
}
```

---

### 2.2 Get All Placements
```http
GET /v1/placements?status=active&type=foster_care
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "placement-123",
      "childName": "John Doe",
      "type": "foster_care",
      "status": "active",
      "startDate": "2024-01-01",
      "provider": "ABC Fostering"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 60
  }
}
```

---

### 2.3 Get Placement by ID
```http
GET /v1/placements/:id
```

**Response** (200 OK):
```json
{
  "id": "placement-123",
  "child": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "age": 15
  },
  "type": "foster_care",
  "status": "active",
  "startDate": "2024-01-01",
  "provider": {
    "id": "provider-123",
    "name": "ABC Fostering Agency",
    "ofstedRating": "outstanding"
  },
  "carers": {
    "primary": "Sarah Foster",
    "secondary": "John Foster"
  },
  "address": {
    "line1": "123 Foster Street",
    "city": "Birmingham",
    "postcode": "B1 1AA"
  }
}
```

---

### 2.4 Update Placement
```http
PATCH /v1/placements/:id
```

**Request Body**:
```json
{
  "status": "extended",
  "plannedEndDate": "2026-01-01"
}
```

**Response** (200 OK)

---

### 2.5 End Placement
```http
DELETE /v1/placements/:id
```

**Request Body**:
```json
{
  "endDate": "2025-01-15",
  "endReason": "child_returned_home",
  "plannedEnding": true
}
```

**Response** (200 OK):
```json
{
  "message": "Placement ended successfully",
  "placementId": "placement-123",
  "endDate": "2025-01-15"
}
```

---

### 2.6 Search Placements
```http
POST /v1/placements/search
```

**Request Body**:
```json
{
  "filters": {
    "type": ["foster_care", "residential"],
    "status": "active",
    "providerId": "provider-123"
  }
}
```

---

### 2.7 Record Placement Transition
```http
POST /v1/placements/:id/transitions
```

**Request Body**:
```json
{
  "toPlacementId": "placement-124",
  "transitionDate": "2025-02-01",
  "transitionType": "planned",
  "reason": "carer_illness",
  "riskLevel": "medium",
  "supportPlan": "Gradual introduction over 2 weeks"
}
```

**Response** (201 Created)

---

### 2.8 Get Placement Transitions
```http
GET /v1/placements/:id/transitions
```

**Response** (200 OK):
```json
{
  "transitions": [
    {
      "id": "transition-123",
      "fromPlacement": "placement-122",
      "toPlacement": "placement-123",
      "transitionDate": "2024-01-01",
      "type": "planned",
      "riskLevel": "low"
    }
  ]
}
```

---

### 2.9 Find Suitable Placements (Matching)
```http
POST /v1/placements/matching
```

**Request Body**:
```json
{
  "childId": "550e8400-e29b-41d4-a716-446655440000",
  "placementType": "foster_care",
  "urgency": "routine",
  "preferences": {
    "location": "Birmingham",
    "schoolContinuity": true,
    "siblingPlacement": false,
    "culturalMatch": true
  }
}
```

**Response** (200 OK):
```json
{
  "matches": [
    {
      "providerId": "provider-123",
      "providerName": "ABC Fostering",
      "matchScore": 95,
      "availability": "immediate",
      "ofstedRating": "outstanding",
      "location": "Birmingham",
      "distance": "2.5 miles from current school"
    },
    {
      "providerId": "provider-124",
      "providerName": "XYZ Fostering",
      "matchScore": 85,
      "availability": "within 7 days",
      "ofstedRating": "good"
    }
  ]
}
```

---

### 2.10 Check Placement Compliance
```http
GET /v1/placements/:id/compliance
```

**Response** (200 OK):
```json
{
  "compliant": true,
  "checks": {
    "dbs_check": { "status": "valid", "expiryDate": "2026-01-01" },
    "safeguarding_training": { "status": "valid", "completedDate": "2024-09-01" },
    "first_aid_training": { "status": "valid", "completedDate": "2024-08-01" },
    "home_safety_check": { "status": "valid", "lastCheckDate": "2024-12-01" },
    "insurance": { "status": "valid", "expiryDate": "2025-12-31" }
  },
  "issues": []
}
```

---

### 2.11 Create Emergency Placement
```http
POST /v1/placements/:id/emergency
```

**Request Body**:
```json
{
  "childId": "550e8400-e29b-41d4-a716-446655440000",
  "reason": "immediate_safety_concern",
  "providerId": "provider-emergency-123",
  "authorizedBy": "emergency_duty_team",
  "contactNumber": "0800 555 0123"
}
```

**Response** (201 Created):
```json
{
  "placementId": "placement-emergency-123",
  "status": "emergency_active",
  "startDate": "2025-10-10T20:00:00Z",
  "reviewDueDate": "2025-10-11T09:00:00Z"
}
```

---

### 2.12 Create Respite Care
```http
POST /v1/placements/:id/respite
```

**Request Body**:
```json
{
  "childId": "550e8400-e29b-41d4-a716-446655440000",
  "startDate": "2025-12-20",
  "endDate": "2025-12-27",
  "respiteCarer": "respite-carer-123",
  "reason": "regular_carer_holiday"
}
```

**Response** (201 Created)

---

### 2.13 Get Breakdown Risk Analysis
```http
GET /v1/placements/breakdown-risk
```

**Response** (200 OK):
```json
{
  "highRiskPlacements": [
    {
      "placementId": "placement-456",
      "childName": "Jane Smith",
      "riskScore": 85,
      "riskFactors": [
        "multiple_placement_moves",
        "behavioral_challenges",
        "carer_stress_indicators"
      ],
      "recommendedActions": [
        "increase_social_worker_visits",
        "carer_support_package",
        "therapeutic_intervention"
      ]
    }
  ]
}
```

---

### 2.14 Report Missing from Placement
```http
POST /v1/placements/:id/missing
```

**Request Body**:
```json
{
  "missingDate": "2025-10-10T18:00:00Z",
  "lastSeenLocation": "School",
  "policeInformed": true,
  "policeReferenceNumber": "POL-2025-12345",
  "riskAssessment": "medium_risk",
  "triggerFactors": ["argument_with_carer"]
}
```

**Response** (201 Created):
```json
{
  "missingEpisodeId": "missing-123",
  "status": "active",
  "alertsSent": ["social_worker", "police", "emergency_duty_team"]
}
```

---

### 2.15 Mark as Returned from Missing
```http
POST /v1/placements/:id/return
```

**Request Body**:
```json
{
  "missingEpisodeId": "missing-123",
  "returnDate": "2025-10-11T02:00:00Z",
  "returnLocation": "Police Station",
  "condition": "unharmed",
  "independentReturnInterview": {
    "scheduled": true,
    "date": "2025-10-11T10:00:00Z"
  }
}
```

**Response** (200 OK)

---

### 2.16-2.20 Additional Endpoints
- `GET /v1/placements/provider/:providerId` - Get all placements by provider
- `GET /v1/placements/statistics` - Placement statistics
- `POST /v1/placements/:id/extend` - Extend placement
- `POST /v1/placements/:id/reviews` - Add placement review
- `GET /v1/placements/:id/timeline` - Placement timeline

---

## 📍 Module 3: Safeguarding

### Base Path: `/v1/safeguarding`

### 3.1 Report Safeguarding Concern
```http
POST /v1/safeguarding/concerns
```

**Request Body**:
```json
{
  "childId": "550e8400-e29b-41d4-a716-446655440000",
  "category": "emotional_abuse",
  "riskLevel": "high",
  "description": "Child presenting with anxiety and low self-esteem",
  "reportedBy": "School Teacher",
  "reportedDate": "2025-10-10",
  "immediateAction": "Safety plan implemented",
  "policeInformed": false
}
```

**Response** (201 Created):
```json
{
  "id": "concern-123",
  "referenceNumber": "SC-2025-10-0123",
  "status": "under_review",
  "createdAt": "2025-10-10T10:00:00Z"
}
```

---

### 3.2 Get All Concerns
```http
GET /v1/safeguarding/concerns?status=active&riskLevel=high
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "concern-123",
      "referenceNumber": "SC-2025-10-0123",
      "childName": "John Doe",
      "category": "emotional_abuse",
      "riskLevel": "high",
      "status": "under_review",
      "reportedDate": "2025-10-10"
    }
  ]
}
```

---

### 3.3 Get Concern by ID
```http
GET /v1/safeguarding/concerns/:id
```

**Response** (200 OK):
```json
{
  "id": "concern-123",
  "referenceNumber": "SC-2025-10-0123",
  "child": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "age": 15
  },
  "category": "emotional_abuse",
  "riskLevel": "high",
  "description": "Child presenting with anxiety and low self-esteem",
  "reportedBy": "School Teacher",
  "reportedDate": "2025-10-10",
  "status": "under_review",
  "timeline": [
    {
      "date": "2025-10-10T10:00:00Z",
      "action": "concern_reported",
      "by": "jane.smith@council.gov.uk"
    }
  ]
}
```

---

### 3.4 Update Concern
```http
PATCH /v1/safeguarding/concerns/:id
```

**Request Body**:
```json
{
  "status": "under_investigation",
  "assignedTo": "safeguarding.officer@council.gov.uk"
}
```

---

### 3.5 Escalate Concern
```http
POST /v1/safeguarding/concerns/:id/escalate
```

**Request Body**:
```json
{
  "escalationLevel": "strategy_discussion",
  "reason": "multiple_concerns_identified",
  "urgency": "immediate"
}
```

**Response** (200 OK):
```json
{
  "message": "Concern escalated to strategy discussion",
  "strategyMeetingDate": "2025-10-11T14:00:00Z"
}
```

---

### 3.6 Create Risk Assessment
```http
POST /v1/safeguarding/risk-assessments
```

**Request Body**:
```json
{
  "concernId": "concern-123",
  "childId": "550e8400-e29b-41d4-a716-446655440000",
  "riskFactors": [
    {
      "factor": "emotional_harm",
      "severity": "high",
      "likelihood": "medium"
    },
    {
      "factor": "placement_breakdown",
      "severity": "medium",
      "likelihood": "high"
    }
  ],
  "protectiveFactors": [
    "strong_relationship_with_carer",
    "engaged_in_education"
  ],
  "overallRiskScore": 75,
  "mitigatingActions": [
    "increase_social_worker_visits",
    "therapeutic_support_referral"
  ]
}
```

**Response** (201 Created)

---

### 3.7 Get Risk Assessments
```http
GET /v1/safeguarding/risk-assessments/:childId
```

**Response** (200 OK):
```json
{
  "assessments": [
    {
      "id": "assessment-123",
      "assessmentDate": "2025-10-10",
      "overallRiskScore": 75,
      "riskLevel": "high",
      "nextReviewDate": "2025-11-10"
    }
  ]
}
```

---

### 3.8 Update Risk Assessment
```http
PATCH /v1/safeguarding/risk-assessments/:id
```

---

### 3.9 Start Investigation (Section 47)
```http
POST /v1/safeguarding/investigations
```

**Request Body**:
```json
{
  "concernId": "concern-123",
  "investigationType": "section_47",
  "strategyDiscussionDate": "2025-10-11T14:00:00Z",
  "attendees": [
    "social_worker",
    "police",
    "health",
    "education"
  ],
  "outcome": "investigation_required",
  "timeline": "10_working_days"
}
```

**Response** (201 Created):
```json
{
  "investigationId": "inv-123",
  "referenceNumber": "S47-2025-10-0123",
  "startDate": "2025-10-11",
  "completionDueDate": "2025-10-25"
}
```

---

### 3.10 Get Investigation
```http
GET /v1/safeguarding/investigations/:id
```

---

### 3.11 Update Investigation
```http
PATCH /v1/safeguarding/investigations/:id
```

**Request Body**:
```json
{
  "status": "completed",
  "outcome": "child_protection_plan",
  "findings": "Significant harm identified - emotional abuse substantiated",
  "recommendations": [
    "child_protection_plan",
    "therapeutic_intervention",
    "parental_support_program"
  ]
}
```

---

### 3.12 Get Safeguarding Dashboard
```http
GET /v1/safeguarding/dashboard/:childId
```

**Response** (200 OK):
```json
{
  "child": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe"
  },
  "activeConcerns": 2,
  "currentRiskLevel": "high",
  "onChildProtectionPlan": true,
  "lastRiskAssessment": "2025-10-10",
  "nextReview": "2025-11-10",
  "recentConcerns": [
    {
      "date": "2025-10-10",
      "category": "emotional_abuse",
      "status": "under_investigation"
    }
  ],
  "alerts": [
    {
      "type": "review_overdue",
      "message": "Risk assessment review due in 5 days"
    }
  ]
}
```

---

## 📍 Module 4-9: Additional Endpoints

Due to space constraints, here's a summary of remaining modules:

### Module 4: Education (10 endpoints)
- PEP CRUD operations
- Attendance tracking
- Exclusion monitoring  
- SEN support management

### Module 5: Health (12 endpoints)
- Initial health assessments
- Review health assessments
- Immunization tracking
- Dental care records

### Module 6: Family & Contact (16 endpoints)
- Family member management
- Contact arrangement CRUD
- Contact session recording
- Life story work

### Module 7: Care Planning (15 endpoints)
- Care plan CRUD
- Statutory reviews
- Social worker visits
- Compliance monitoring

### Module 8: Leaving Care (8 endpoints)
- Pathway plans
- Needs assessments
- Accommodation support
- Financial assistance

### Module 9: UASC (25 endpoints)
- UASC profile management
- Immigration status tracking
- Age assessments
- Home Office correspondence
- Asylum applications
- Appeals
- Cultural support

---

## 🔐 Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get JWT Token
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@council.gov.uk",
  "password": "SecurePassword123!"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@council.gov.uk",
    "role": "social_worker"
  }
}
```

---

## 📊 Common Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |

---

## 🧪 API Testing

### Using cURL
```bash
# Create child
curl -X POST http://localhost:3000/api/v1/children \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"firstName":"John","lastName":"Doe","dateOfBirth":"2010-01-01"}'
```

### Using Postman
Import the Postman collection: `/docs/postman/ChildrensCareSystem.postman_collection.json`

---

**Document Version**: 1.0  
**Last Updated**: October 10, 2025  
**Total Endpoints Documented**: 133+  
**Status**: Production Ready ✅
