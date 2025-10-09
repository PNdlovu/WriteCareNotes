# API Documentation - Phase 2 Services
## WriteCare Notes Enterprise Care Home Management System

**Version**: 2.0.0  
**Base URL**: `https://api.writecarenotes.com/api/v1`  
**Authentication**: Bearer JWT Token  
**Date**: October 9, 2025

---

## 🔐 Authentication

All Phase 2 endpoints require authentication via JWT token.

### Headers Required
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
X-Organization-ID: <your_organization_id>
```

### Authentication Flow
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGc....",
  "refreshToken": "eyJhbGc....",
  "user": {...},
  "expiresIn": "24h"
}
```

---

## 📦 Service #8: Document Management (16 Endpoints)

Base Path: `/documents`

### 1. Create Document
```http
POST /documents
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Care Home Policy 2025",
  "documentType": "policy",
  "content": "Policy content here...",
  "complianceType": "gdpr",
  "expiryDate": "2026-12-31T00:00:00Z",
  "tags": ["policy", "gdpr", "2025"]
}

Response (201):
{
  "id": "uuid",
  "documentNumber": "POL-2025-00001",
  "title": "Care Home Policy 2025",
  "version": "1.0.0",
  "status": "draft",
  "createdAt": "2025-10-09T12:00:00Z"
}
```

### 2. Get Document by ID
```http
GET /documents/:id
Authorization: Bearer <token>

Response (200):
{
  "id": "uuid",
  "documentNumber": "POL-2025-00001",
  "title": "Care Home Policy 2025",
  "documentType": "policy",
  "version": "1.0.0",
  "status": "published",
  "content": "...",
  "versions": [...]
}
```

### 3. List Documents
```http
GET /documents?type=policy&status=published&page=1&limit=20
Authorization: Bearer <token>

Response (200):
{
  "documents": [...],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

### 4. Create Document Version
```http
POST /documents/:id/versions
Authorization: Bearer <token>

{
  "content": "Updated content",
  "changeSummary": "Updated compliance section"
}

Response (201):
{
  "id": "uuid",
  "versionNumber": "1.1.0",
  "changeSummary": "Updated compliance section",
  "createdAt": "2025-10-09T14:00:00Z"
}
```

### 5. Approve Document
```http
PUT /documents/:id/approve
Authorization: Bearer <token>

Response (200):
{
  "id": "uuid",
  "status": "approved",
  "approvedBy": "uuid",
  "approvedDate": "2025-10-09T15:00:00Z"
}
```

### 6. Publish Document
```http
PUT /documents/:id/publish
Authorization: Bearer <token>

Response (200):
{
  "id": "uuid",
  "status": "published",
  "publishedDate": "2025-10-09T16:00:00Z"
}
```

### Complete Endpoint List
- `POST /documents` - Create document
- `GET /documents` - List documents with filters
- `GET /documents/:id` - Get document details
- `PUT /documents/:id` - Update document
- `DELETE /documents/:id` - Soft delete document
- `POST /documents/:id/versions` - Create version
- `GET /documents/:id/versions` - Get version history
- `PUT /documents/:id/approve` - Approve document
- `PUT /documents/:id/publish` - Publish document
- `PUT /documents/:id/archive` - Archive document
- `PUT /documents/:id/restore` - Restore deleted document
- `GET /documents/type/:type` - Get by type
- `GET /documents/status/:status` - Get by status
- `GET /documents/search?q=term` - Search documents
- `GET /documents/compliance/:type` - Get compliance documents
- `GET /documents/expiring?days=30` - Get expiring soon

---

## 👨‍👩‍👧‍👦 Service #9: Family Communication (22 Endpoints)

Base Path: `/family`

### Family Members

#### 1. Add Family Member
```http
POST /family/members
Authorization: Bearer <token>

{
  "residentId": "uuid",
  "firstName": "John",
  "lastName": "Smith",
  "relationship": "son",
  "email": "john.smith@example.com",
  "phone": "+44 7700 900000",
  "accessLevel": "full_access",
  "isEmergencyContact": true
}

Response (201):
{
  "id": "uuid",
  "fullName": "John Smith",
  "relationship": "son",
  "accessLevel": "full_access",
  "isEmergencyContact": true,
  "createdAt": "2025-10-09T12:00:00Z"
}
```

#### 2. List Family Members
```http
GET /family/members?residentId=uuid
Authorization: Bearer <token>

Response (200):
{
  "members": [
    {
      "id": "uuid",
      "fullName": "John Smith",
      "relationship": "son",
      "accessLevel": "full_access",
      "isEmergencyContact": true
    }
  ]
}
```

### Messages

#### 3. Send Message
```http
POST /family/messages
Authorization: Bearer <token>

{
  "residentId": "uuid",
  "familyMemberId": "uuid",
  "messageType": "update",
  "subject": "Daily Update",
  "message": "Had a great day today...",
  "priority": "normal",
  "isEncrypted": true
}

Response (201):
{
  "id": "uuid",
  "subject": "Daily Update",
  "sentAt": "2025-10-09T14:00:00Z",
  "isEncrypted": true
}
```

#### 4. List Messages
```http
GET /family/messages?residentId=uuid&type=update
Authorization: Bearer <token>

Response (200):
{
  "messages": [...],
  "total": 15,
  "unread": 3
}
```

#### 5. Mark Message as Read
```http
PUT /family/messages/:id/read
Authorization: Bearer <token>

Response (200):
{
  "id": "uuid",
  "readAt": "2025-10-09T15:00:00Z"
}
```

### Visits

#### 6. Schedule Visit
```http
POST /family/visits
Authorization: Bearer <token>

{
  "residentId": "uuid",
  "familyMemberId": "uuid",
  "visitType": "general",
  "scheduledDate": "2025-10-15T14:00:00Z",
  "durationMinutes": 60,
  "notes": "Please have tea ready"
}

Response (201):
{
  "id": "uuid",
  "visitType": "general",
  "scheduledDate": "2025-10-15T14:00:00Z",
  "status": "pending",
  "createdAt": "2025-10-09T12:00:00Z"
}
```

#### 7. Approve Visit
```http
PUT /family/visits/:id/approve
Authorization: Bearer <token>

Response (200):
{
  "id": "uuid",
  "status": "approved",
  "approvedBy": "uuid",
  "approvedAt": "2025-10-09T13:00:00Z"
}
```

### Complete Endpoint List

**Family Members (7):**
- `POST /family/members` - Add family member
- `GET /family/members` - List by resident
- `GET /family/members/:id` - Get details
- `PUT /family/members/:id` - Update details
- `PUT /family/members/:id/access` - Update access level
- `PUT /family/members/:id/emergency-contact` - Set emergency contact
- `DELETE /family/members/:id` - Remove member

**Messages (8):**
- `POST /family/messages` - Send message
- `GET /family/messages` - List messages
- `GET /family/messages/:id` - Get message
- `PUT /family/messages/:id/read` - Mark as read
- `PUT /family/messages/:id/acknowledge` - Acknowledge
- `DELETE /family/messages/:id` - Delete message
- `GET /family/messages/unread` - Get unread count
- `POST /family/messages/broadcast` - Broadcast message

**Visits (7):**
- `POST /family/visits` - Schedule visit
- `GET /family/visits` - List visits
- `GET /family/visits/:id` - Get visit details
- `PUT /family/visits/:id` - Update visit
- `PUT /family/visits/:id/approve` - Approve visit
- `PUT /family/visits/:id/confirm` - Confirm attendance
- `DELETE /family/visits/:id` - Cancel visit

---

## 🚨 Service #10: Incident Management (16 Endpoints)

Base Path: `/incidents`

### 1. Report Incident
```http
POST /incidents
Authorization: Bearer <token>

{
  "incidentType": "fall",
  "severity": "moderate",
  "description": "Resident slipped in bathroom",
  "incidentDateTime": "2025-10-09T08:30:00Z",
  "reportedBy": "Staff Name",
  "location": "Bathroom, Room 12",
  "affectedPersons": 1,
  "witnessStatements": ["I heard a noise..."],
  "immediateActions": ["Called nurse", "Assessed injuries"]
}

Response (201):
{
  "id": "uuid",
  "incidentNumber": "FALL-2025-00001",
  "incidentType": "fall",
  "severity": "moderate",
  "status": "reported",
  "cqcReporting": {
    "notificationRequired": false,
    "notificationDeadline": null
  },
  "aiAnalysis": {
    "riskScore": 40,
    "recommendedActions": [
      "Review mobility assessment",
      "Check environment for hazards"
    ]
  },
  "createdAt": "2025-10-09T08:45:00Z"
}
```

### 2. Add Root Cause Analysis
```http
POST /incidents/:id/root-cause-analysis
Authorization: Bearer <token>

{
  "primaryCause": "Wet floor not marked",
  "contributingFactors": [
    "Inadequate signage",
    "Poor lighting"
  ],
  "systemicIssues": ["Cleaning protocol needs review"],
  "humanFactors": ["Staff training gap"],
  "environmentalFactors": ["Poor drainage"],
  "analysisMethod": "5_why",
  "analysisNotes": "Conducted 5 Why analysis...",
  "lessonsLearned": [
    "Improve wet floor procedures",
    "Install better lighting"
  ]
}

Response (200):
{
  "id": "uuid",
  "status": "investigating",
  "rootCauseAnalysis": {
    "primaryCause": "Wet floor not marked",
    "analysisMethod": "5_why",
    ...
  }
}
```

### 3. Add Corrective Action
```http
POST /incidents/:id/corrective-actions
Authorization: Bearer <token>

{
  "description": "Install non-slip flooring",
  "priority": "high",
  "responsible": "Facilities Manager",
  "deadline": "2025-11-09T00:00:00Z",
  "resourcesRequired": ["Contractor", "Materials"],
  "successCriteria": "Non-slip flooring installed and tested"
}

Response (201):
{
  "actionId": "ACTION-1728468123",
  "description": "Install non-slip flooring",
  "priority": "high",
  "status": "pending",
  "deadline": "2025-11-09T00:00:00Z"
}
```

### 4. Send CQC Notification
```http
POST /incidents/:id/cqc-notification
Authorization: Bearer <token>

{
  "notificationReference": "CQC-2025-001"
}

Response (200):
{
  "id": "uuid",
  "cqcReporting": {
    "notificationSent": true,
    "notificationReference": "CQC-2025-001",
    "complianceStatus": "compliant",
    "sentAt": "2025-10-09T09:00:00Z"
  }
}
```

### 5. Get Incident Statistics
```http
GET /incidents/statistics
Authorization: Bearer <token>

Response (200):
{
  "total": 145,
  "byStatus": {
    "reported": 12,
    "investigating": 8,
    "resolved": 120,
    "closed": 5
  },
  "byType": {
    "fall": 45,
    "medication_error": 12,
    "behavioral": 23,
    ...
  },
  "bySeverity": {
    "minor": 89,
    "moderate": 42,
    "major": 12,
    "severe": 2
  },
  "critical": 2,
  "requiresCQC": 3,
  "overdueActions": 5,
  "avgResolutionTime": 4.5
}
```

### Complete Endpoint List
- `POST /incidents` - Report incident
- `GET /incidents` - List with filters
- `GET /incidents/:id` - Get details
- `PUT /incidents/:id` - Update incident
- `POST /incidents/:id/root-cause-analysis` - Add RCA
- `GET /incidents/:id/root-cause-analysis` - Get RCA
- `POST /incidents/:id/cqc-notification` - Send CQC notification
- `GET /incidents/:id/cqc-notification` - Get notification status
- `PUT /incidents/:id/cqc-notification` - Update notification
- `POST /incidents/:id/corrective-actions` - Add action
- `GET /incidents/:id/corrective-actions` - List actions
- `PUT /incidents/corrective-actions/:actionId` - Update action
- `PUT /incidents/corrective-actions/:actionId/complete` - Mark complete
- `POST /incidents/:id/qa-review` - Add QA review
- `GET /incidents/:id/qa-review` - Get review
- `GET /incidents/statistics` - Get statistics

---

## 🏥 Service #11: Health Monitoring (12 Endpoints)

Base Path: `/health-monitoring`

### 1. Record Vital Signs
```http
POST /health-monitoring/vital-signs
Authorization: Bearer <token>

{
  "residentId": "uuid",
  "recordedAt": "2025-10-09T08:00:00Z",
  "systolicBP": 120,
  "diastolicBP": 80,
  "heartRate": 72,
  "temperature": 36.8,
  "oxygenSaturation": 98,
  "respiratoryRate": 16,
  "bloodGlucose": 5.5,
  "notes": "Patient resting",
  "concerns": false
}

Response (201):
{
  "id": "uuid",
  "news2Score": 0,
  "clinicalResponse": "Continue routine monitoring",
  "recordedAt": "2025-10-09T08:00:00Z",
  "createdAt": "2025-10-09T08:05:00Z"
}
```

### 2. Calculate NEWS2 Score
```http
GET /health-monitoring/news2/:residentId
Authorization: Bearer <token>

Response (200):
{
  "residentId": "uuid",
  "latestVitalSigns": {...},
  "news2Score": 0,
  "clinicalResponse": "Continue routine monitoring",
  "escalationRequired": false,
  "calculatedAt": "2025-10-09T12:00:00Z"
}
```

### 3. Record Weight/BMI
```http
POST /health-monitoring/weight
Authorization: Bearer <token>

{
  "residentId": "uuid",
  "weightKg": 68.5,
  "heightCm": 165,
  "notes": "Regular weekly weighing"
}

Response (201):
{
  "id": "uuid",
  "weightKg": 68.5,
  "heightCm": 165,
  "bmi": 25.2,
  "trend": "stable",
  "recordedAt": "2025-10-09T09:00:00Z"
}
```

### 4. Create Health Assessment
```http
POST /health-monitoring/assessments
Authorization: Bearer <token>

{
  "residentId": "uuid",
  "assessmentType": "falls_risk",
  "assessmentDate": "2025-10-09T10:00:00Z",
  "findings": "Mobility good, no recent falls",
  "riskScore": 3,
  "recommendations": [
    "Continue mobility exercises",
    "Review in 3 months"
  ],
  "reviewDate": "2026-01-09T00:00:00Z"
}

Response (201):
{
  "id": "uuid",
  "assessmentType": "falls_risk",
  "riskScore": 3,
  "status": "pending",
  "reviewDate": "2026-01-09T00:00:00Z",
  "createdAt": "2025-10-09T10:00:00Z"
}
```

### Complete Endpoint List
- `POST /health-monitoring/vital-signs` - Record vital signs
- `GET /health-monitoring/vital-signs` - Get history
- `POST /health-monitoring/weight` - Record weight/BMI
- `GET /health-monitoring/weight` - Get weight history with trends
- `POST /health-monitoring/assessments` - Create assessment
- `GET /health-monitoring/assessments` - List assessments
- `GET /health-monitoring/assessments/:id` - Get details
- `PUT /health-monitoring/assessments/:id` - Update assessment
- `PUT /health-monitoring/assessments/:id/complete` - Mark complete
- `DELETE /health-monitoring/assessments/:id` - Delete assessment
- `GET /health-monitoring/news2/:residentId` - Calculate NEWS2
- `GET /health-monitoring/trends/:residentId` - Get health trends

---

## 🎨 Service #12: Activity & Wellbeing (11 Endpoints)

Base Path: `/activities`

### 1. Create Activity
```http
POST /activities
Authorization: Bearer <token>

{
  "activityName": "Arts & Crafts Session",
  "activityType": "group",
  "category": "arts_crafts",
  "description": "Painting and drawing session",
  "scheduledDate": "2025-10-15T14:00:00Z",
  "durationMinutes": 90,
  "location": "Activity Room",
  "capacity": 12,
  "staffAssigned": ["uuid1", "uuid2"],
  "resourcesRequired": ["Paints", "Paper", "Brushes"]
}

Response (201):
{
  "id": "uuid",
  "activityName": "Arts & Crafts Session",
  "activityType": "group",
  "scheduledDate": "2025-10-15T14:00:00Z",
  "status": "scheduled",
  "capacity": 12,
  "createdAt": "2025-10-09T12:00:00Z"
}
```

### 2. Record Attendance
```http
POST /activities/:id/attendance
Authorization: Bearer <token>

{
  "residentId": "uuid",
  "participationLevel": "full_participation",
  "enjoymentRating": 5,
  "engagementRating": 4,
  "notes": "Really enjoyed painting flowers"
}

Response (201):
{
  "id": "uuid",
  "residentId": "uuid",
  "participationLevel": "full_participation",
  "enjoymentRating": 5,
  "engagementRating": 4,
  "createdAt": "2025-10-15T15:30:00Z"
}
```

### 3. Get Wellbeing Trends
```http
GET /activities/resident/:residentId/wellbeing-trends?months=6
Authorization: Bearer <token>

Response (200):
{
  "residentId": "uuid",
  "period": {
    "startDate": "2025-04-09",
    "endDate": "2025-10-09",
    "months": 6
  },
  "totalActivities": 48,
  "averageEnjoyment": 4.2,
  "averageEngagement": 4.0,
  "participationRate": 85,
  "preferredActivities": [
    { "category": "music", "count": 15 },
    { "category": "arts_crafts", "count": 12 }
  ],
  "trend": "improving"
}
```

### Complete Endpoint List
- `POST /activities` - Create activity
- `GET /activities` - List activities with filters
- `GET /activities/:id` - Get activity details
- `PUT /activities/:id` - Update activity
- `DELETE /activities/:id` - Cancel activity
- `POST /activities/:id/attendance` - Record attendance
- `GET /activities/:id/attendance` - Get attendance list
- `PUT /activities/attendance/:attendanceId` - Update attendance
- `GET /activities/resident/:residentId/wellbeing-trends` - Get trends
- `GET /activities/resident/:residentId/participation` - Get participation stats
- `GET /activities/statistics` - Get activity statistics

---

## 📊 Service #14: Reporting & Analytics (7 Endpoints)

Base Path: `/reporting`

### 1. Generate Custom Report
```http
POST /reporting/custom-report
Authorization: Bearer <token>

{
  "reportName": "Monthly Incident Summary",
  "reportType": "operational",
  "dataSource": "incidents",
  "columns": ["incidentType", "severity", "status", "createdAt"],
  "filters": {
    "startDate": "2025-09-01",
    "endDate": "2025-09-30"
  },
  "groupBy": ["incidentType"],
  "orderBy": { "field": "createdAt", "direction": "DESC" }
}

Response (200):
{
  "reportId": "RPT-20251009-001",
  "reportName": "Monthly Incident Summary",
  "data": [...],
  "generatedAt": "2025-10-09T12:00:00Z"
}
```

### 2. Get CQC Compliance Report
```http
GET /reporting/cqc-compliance?startDate=2025-09-01&endDate=2025-09-30
Authorization: Bearer <token>

Response (200):
{
  "period": {
    "startDate": "2025-09-01",
    "endDate": "2025-09-30"
  },
  "metrics": {
    "safeguardingIncidents": 2,
    "medicationErrors": 3,
    "falls": 12,
    "cqcNotificationsSent": 1,
    "overdueAssessments": 0,
    "staffTrainingCompliance": 95.5,
    "documentationCompliance": 98.2
  },
  "complianceScore": 92.5,
  "status": "compliant",
  "recommendations": [
    "Reduce medication errors through additional training",
    "Maintain current safeguarding procedures"
  ],
  "generatedAt": "2025-10-09T12:00:00Z"
}
```

### 3. Get Dashboard KPIs
```http
GET /reporting/dashboard-kpis
Authorization: Bearer <token>

Response (200):
{
  "kpis": [
    {
      "name": "Total Residents",
      "value": 45,
      "trend": "stable",
      "changePercent": 0
    },
    {
      "name": "Occupancy Rate",
      "value": 90,
      "unit": "%",
      "trend": "up",
      "changePercent": 2.5
    },
    {
      "name": "Incidents (30 days)",
      "value": 12,
      "trend": "down",
      "changePercent": -15
    },
    {
      "name": "Critical Incidents",
      "value": 1,
      "trend": "stable",
      "changePercent": 0
    },
    {
      "name": "Overdue Assessments",
      "value": 3,
      "trend": "down",
      "changePercent": -40
    },
    {
      "name": "Staff Utilization",
      "value": 87,
      "unit": "%",
      "trend": "stable",
      "changePercent": 1.2
    },
    {
      "name": "Activity Participation",
      "value": 78,
      "unit": "%",
      "trend": "up",
      "changePercent": 5
    },
    {
      "name": "Family Engagement",
      "value": 92,
      "unit": "%",
      "trend": "up",
      "changePercent": 3.5
    }
  ],
  "generatedAt": "2025-10-09T12:00:00Z"
}
```

### 4. Get Trend Analysis
```http
GET /reporting/trends?metric=incidents&period=daily&days=30
Authorization: Bearer <token>

Response (200):
{
  "metric": "incidents",
  "period": "daily",
  "days": 30,
  "data": [
    { "date": "2025-09-09", "value": 2 },
    { "date": "2025-09-10", "value": 1 },
    ...
  ],
  "statistics": {
    "average": 1.5,
    "min": 0,
    "max": 4,
    "total": 45,
    "stdDev": 0.8
  },
  "trend": {
    "direction": "declining",
    "slope": -0.05,
    "forecast": [
      { "date": "2025-10-10", "predicted": 1.2 },
      { "date": "2025-10-11", "predicted": 1.15 }
    ]
  },
  "generatedAt": "2025-10-09T12:00:00Z"
}
```

### 5. Export Report
```http
POST /reporting/export
Authorization: Bearer <token>

{
  "reportId": "RPT-20251009-001",
  "format": "pdf"
}

Response (200):
{
  "reportId": "RPT-20251009-001",
  "format": "pdf",
  "filePath": "/reports/RPT-20251009-001.pdf",
  "downloadUrl": "https://api.writecarenotes.com/reports/download/RPT-20251009-001.pdf",
  "expiresAt": "2025-10-16T12:00:00Z"
}
```

### Complete Endpoint List
- `POST /reporting/custom-report` - Generate custom report
- `GET /reporting/cqc-compliance` - CQC compliance report
- `GET /reporting/dashboard-kpis` - Dashboard KPIs
- `GET /reporting/trends` - Trend analysis
- `POST /reporting/export` - Export report
- `GET /reporting/operational-statistics` - Operational stats
- `GET /reporting/compliance-summary` - Compliance summary

---

## 📋 Common Query Parameters

### Pagination
```
?page=1&limit=20
```

### Filtering
```
?type=fall&severity=moderate&status=resolved
?startDate=2025-09-01&endDate=2025-09-30
```

### Sorting
```
?sortBy=createdAt&sortOrder=DESC
```

### Search
```
?q=search term
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## 📊 Rate Limiting

- **Standard endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes
- **Reporting/Analytics**: 50 requests per 15 minutes

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1728469200
```

---

## 🔗 Useful Links

- **Production API**: https://api.writecarenotes.com
- **Staging API**: https://staging-api.writecarenotes.com
- **Documentation**: https://docs.writecarenotes.com
- **Status Page**: https://status.writecarenotes.com
- **Support**: support@writecarenotes.com

---

**API Documentation Version**: 2.0.0  
**Last Updated**: October 9, 2025  
**Total Endpoints**: 84 (Phase 2)
