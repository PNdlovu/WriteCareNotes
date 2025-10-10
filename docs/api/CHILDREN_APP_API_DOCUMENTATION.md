# 🏠 **CHILDREN'S RESIDENTIAL CARE APP - API DOCUMENTATION**

**Version**: 1.0.0  
**Base URL**: `https://api.yourcare.com/api/v1`  
**Last Updated**: October 10, 2025

---

## 📋 **TABLE OF CONTENTS**

1. [Authentication & Authorization](#authentication--authorization)
2. [Young Person Portal (16+)](#young-person-portal-16)
3. [Developmental Milestones (0-5 years)](#developmental-milestones-0-5-years)
4. [Residential Care Placements](#residential-care-placements)
5. [Life Skills Tracking](#life-skills-tracking)
6. [Leaving Care Finances](#leaving-care-finances)
7. [Error Codes](#error-codes)

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **Age-Gated Access Model**

| Age Range | Access Level | Features | Role |
|-----------|--------------|----------|------|
| **0-15 years** | ❌ NO ACCESS | Profile managed by staff only | N/A |
| **16+ years** | ✅ LIMITED ACCESS | Young Person Portal (finances, life skills, education, accommodation) | `young_person` |
| **18+ years** | ✅ EXTENDED ACCESS | Care leaver records, pathway planning | `care_leaver` |
| **Staff** | ✅ FULL ACCESS | All child profiles, all features | `social_worker`, `care_staff`, `manager` |

### **JWT Token Structure**

```json
{
  "userId": "uuid",
  "role": "young_person",
  "childId": "uuid",
  "age": 16,
  "leavingCareStatus": "ELIGIBLE",
  "iat": 1728518400,
  "exp": 1728604800
}
```

### **Authentication Endpoints**

#### **POST /auth/young-person/login**
Login for 16+ care leavers

**Request:**
```json
{
  "dateOfBirth": "2008-03-15",
  "uniqueIdentifier": "ABC123456"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "child-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "age": 17,
      "leavingCareStatus": "ELIGIBLE"
    }
  }
}
```

**Error Responses:**
- `403 Forbidden` - Under 16 years old
- `401 Unauthorized` - Invalid credentials

---

## 🎯 **YOUNG PERSON PORTAL (16+)**

### **GET /portal/dashboard**
Get complete portal overview

**Authentication**: Required (16+)  
**Authorization**: Own data only

**Response:**
```json
{
  "status": "success",
  "data": {
    "youngPerson": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "age": 17,
      "leavingCareStatus": "ELIGIBLE"
    },
    "finances": {
      "totalGrants": 2500.00,
      "monthlyAllowance": 350.00,
      "savings": 1200.00,
      "currency": "GBP"
    },
    "lifeSkills": {
      "completedSkills": 12,
      "totalSkills": 25,
      "progressPercentage": 48
    },
    "education": {
      "currentCourse": "A-Levels",
      "qualifications": 5,
      "pepStatus": "On Track"
    },
    "accommodation": {
      "currentStatus": "Planning",
      "plannedMoveDate": null
    },
    "personalAdvisor": {
      "name": "Sarah Johnson",
      "email": "sarah.johnson@localauthority.gov.uk",
      "phone": "01234 567890"
    }
  }
}
```

---

### **GET /portal/finances**
Get detailed financial information

**Authentication**: Required (16+)  
**Authorization**: Own data only

**Response:**
```json
{
  "status": "success",
  "data": {
    "grants": {
      "settingUpHomeGrant": 2000.00,
      "educationGrant": 500.00,
      "drivingLessonsGrant": 0.00,
      "totalGrantsReceived": 2500.00
    },
    "allowances": {
      "monthlyAllowance": 350.00,
      "lastPaymentDate": "2025-10-01T00:00:00Z",
      "nextPaymentDate": "2025-11-01T00:00:00Z"
    },
    "savings": {
      "balance": 1200.00,
      "interestRate": 2.5
    },
    "budgetingTools": {
      "monthlyIncome": 350.00,
      "monthlyExpenses": 250.00,
      "surplus": 100.00
    }
  }
}
```

---

### **GET /portal/life-skills**
Get life skills progress

**Authentication**: Required (16+)  
**Authorization**: Own data only

**Response:**
```json
{
  "status": "success",
  "data": {
    "categories": {
      "cooking": {
        "name": "Cooking & Nutrition",
        "skills": [
          {
            "id": "uuid",
            "name": "Prepare basic meals",
            "description": "Cook 5 simple, healthy meals",
            "completed": true,
            "completedDate": "2025-09-15T00:00:00Z",
            "notes": "Made pasta, stir-fry, omelette, curry, salad"
          },
          {
            "id": "uuid",
            "name": "Meal planning",
            "description": "Plan weekly meals on a budget",
            "completed": false,
            "completedDate": null,
            "notes": null
          }
        ],
        "completed": 3,
        "total": 6,
        "progressPercentage": 50
      },
      "budgeting": {
        "name": "Budgeting & Money Management",
        "skills": [...],
        "completed": 4,
        "total": 7,
        "progressPercentage": 57
      },
      "jobSearch": {
        "name": "Job Search & Employment",
        "skills": [...],
        "completed": 2,
        "total": 5,
        "progressPercentage": 40
      },
      "independentLiving": {
        "name": "Independent Living",
        "skills": [...],
        "completed": 3,
        "total": 7,
        "progressPercentage": 43
      }
    },
    "overallProgress": 48
  }
}
```

---

### **PATCH /portal/life-skills/:skillId**
Update life skills progress

**Authentication**: Required (16+)  
**Authorization**: Own data only (WRITE ACCESS)

**Request:**
```json
{
  "completed": true,
  "notes": "Practiced this today with my key worker. Feeling confident!"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "Prepare basic meals",
    "description": "Cook 5 simple, healthy meals",
    "completed": true,
    "completedDate": "2025-10-10T14:30:00Z",
    "notes": "Practiced this today with my key worker. Feeling confident!"
  },
  "message": "Life skill progress updated successfully"
}
```

---

### **GET /portal/education**
Get education plan

**Authentication**: Required (16+)  
**Authorization**: Own data only

**Response:**
```json
{
  "status": "success",
  "data": {
    "pep": {
      "status": "On Track",
      "reviewDate": "2025-11-15T00:00:00Z",
      "goals": [
        "Complete A-Levels in Maths, English, Biology",
        "Attend university open days",
        "Apply for university by January 2026"
      ]
    },
    "currentCourse": {
      "name": "A-Levels",
      "institution": "Sixth Form College",
      "startDate": "2024-09-01T00:00:00Z",
      "endDate": "2026-06-30T00:00:00Z"
    },
    "qualifications": [
      {"name": "GCSE Mathematics", "grade": "7", "year": 2024},
      {"name": "GCSE English", "grade": "6", "year": 2024},
      {"name": "GCSE Science", "grade": "7", "year": 2024}
    ],
    "careerPlanning": {
      "aspirations": "Want to become a nurse",
      "nextSteps": [
        "Research nursing degrees",
        "Complete first aid training",
        "Get work experience at hospital"
      ]
    }
  }
}
```

---

### **GET /portal/accommodation**
Get accommodation plan

**Authentication**: Required (16+)  
**Authorization**: Own data only

**Response:**
```json
{
  "status": "success",
  "data": {
    "currentStatus": "Planning",
    "housingOptions": [
      {
        "type": "Supported Accommodation",
        "provider": "Local Housing Association",
        "availability": "November 2025",
        "cost": "£450/month (subsidized)"
      },
      {
        "type": "Independent Flat",
        "provider": "Private Rental",
        "availability": "March 2026",
        "cost": "£650/month"
      }
    ],
    "viewingAppointments": [
      {
        "date": "2025-10-20T14:00:00Z",
        "property": "2-bed shared flat",
        "address": "123 Main Street"
      }
    ],
    "plannedMoveDate": "2026-01-15T00:00:00Z",
    "tenancyReadiness": {
      "checklist": [
        "Understanding tenancy agreement",
        "Managing household bills",
        "Basic home maintenance",
        "Dealing with repairs",
        "Neighbourhood safety"
      ],
      "completedItems": 2,
      "totalItems": 5
    },
    "support": {
      "housingOfficer": "Mike Davies",
      "supportPackage": "Weekly home visits for 6 months"
    }
  }
}
```

---

### **POST /portal/requests**
Submit request to personal advisor

**Authentication**: Required (16+)  
**Authorization**: Own data only (WRITE ACCESS)

**Request:**
```json
{
  "subject": "Need help with budgeting",
  "message": "I'm struggling to save money this month. Can we meet to review my budget?",
  "requestType": "finances"
}
```

**Request Types**: `general`, `accommodation`, `finances`, `education`, `urgent`

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "req_1728518400_abc123",
    "subject": "Need help with budgeting",
    "message": "I'm struggling to save money this month...",
    "requestType": "finances",
    "status": "PENDING",
    "submittedDate": "2025-10-10T15:00:00Z"
  },
  "message": "Request submitted successfully to your personal advisor"
}
```

---

## 👶 **DEVELOPMENTAL MILESTONES (0-5 YEARS)**

### **POST /children/:childId/milestones**
Create developmental milestone record

**Authentication**: Required  
**Authorization**: Staff only (social workers, care staff)

**Request:**
```json
{
  "domain": "motor_skills",
  "ageGroup": "12-18m",
  "milestoneName": "Walks independently",
  "description": "Child can walk without support for at least 10 steps",
  "status": "on_track"
}
```

**Domains**: `motor_skills`, `language`, `social_emotional`, `cognitive`, `self_care`

**Age Groups**: `0-3m`, `3-6m`, `6-9m`, `9-12m`, `12-18m`, `18-24m`, `2-3y`, `3-4y`, `4-5y`

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "childId": "uuid",
    "domain": "motor_skills",
    "ageGroup": "12-18m",
    "milestoneName": "Walks independently",
    "status": "on_track",
    "achieved": false,
    "isDelayed": false,
    "createdAt": "2025-10-10T15:00:00Z"
  }
}
```

---

### **GET /children/:childId/milestones**
Get all milestones for a child

**Authentication**: Required  
**Authorization**: Staff only

**Query Parameters**:
- `domain` (optional): Filter by domain
- `ageGroup` (optional): Filter by age group
- `status` (optional): Filter by status

**Response:**
```json
{
  "status": "success",
  "data": {
    "milestones": [
      {
        "id": "uuid",
        "domain": "motor_skills",
        "ageGroup": "12-18m",
        "milestoneName": "Walks independently",
        "achieved": true,
        "achievedDate": "2025-09-15T00:00:00Z",
        "achievedAtAgeMonths": 15,
        "status": "on_track"
      },
      {
        "id": "uuid",
        "domain": "language",
        "ageGroup": "12-18m",
        "milestoneName": "Says several single words",
        "achieved": false,
        "status": "emerging",
        "isDelayed": false
      }
    ],
    "summary": {
      "totalMilestones": 45,
      "achieved": 32,
      "onTrack": 8,
      "emerging": 3,
      "delayed": 2,
      "redFlags": 0
    }
  }
}
```

---

### **PATCH /children/:childId/milestones/:milestoneId**
Update milestone achievement

**Authentication**: Required  
**Authorization**: Staff only

**Request:**
```json
{
  "achieved": true,
  "achievedDate": "2025-10-10",
  "achievedAtAgeMonths": 15,
  "observationNotes": "Child walked across the room confidently today",
  "observedBy": "Sarah (Key Worker)"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "achieved": true,
    "achievedDate": "2025-10-10T00:00:00Z",
    "achievedAtAgeMonths": 15,
    "status": "on_track",
    "observationNotes": "Child walked across the room confidently today"
  },
  "message": "Milestone updated successfully"
}
```

---

## 🏡 **RESIDENTIAL CARE PLACEMENTS**

### **POST /children/:childId/residential-placements**
Create residential placement

**Authentication**: Required  
**Authorization**: Social worker, manager only

**Request:**
```json
{
  "careHomeId": "uuid",
  "careHomeName": "Sunshine Children's Home",
  "careHomeType": "childrens_home",
  "startDate": "2025-11-01",
  "roomNumber": "Room 3",
  "roomType": "single",
  "keyWorkerName": "Mike Davies",
  "keyWorkerEmail": "mike.davies@carehome.com",
  "isEmergencyPlacement": false,
  "placementPurpose": "Long-term stability placement"
}
```

**Care Home Types**: `childrens_home`, `secure_home`, `residential_school`, `mother_baby_unit`, `respite_care`

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "childId": "uuid",
    "careHomeName": "Sunshine Children's Home",
    "careHomeType": "childrens_home",
    "startDate": "2025-11-01T00:00:00Z",
    "status": "planned",
    "roomNumber": "Room 3",
    "keyWorkerName": "Mike Davies"
  },
  "message": "Residential placement created successfully"
}
```

---

### **GET /children/:childId/residential-placements**
Get placement history

**Authentication**: Required  
**Authorization**: Staff only

**Response:**
```json
{
  "status": "success",
  "data": {
    "currentPlacement": {
      "id": "uuid",
      "careHomeName": "Sunshine Children's Home",
      "startDate": "2024-03-15T00:00:00Z",
      "status": "active",
      "roomNumber": "Room 3",
      "keyWorkerName": "Mike Davies",
      "placementDurationDays": 210,
      "placementStabilityRating": "stable"
    },
    "previousPlacements": [
      {
        "id": "uuid",
        "careHomeName": "Oak Tree Home",
        "startDate": "2023-06-01T00:00:00Z",
        "endDate": "2024-03-14T00:00:00Z",
        "status": "ended",
        "endReason": "moved_to_another_home",
        "placementDurationDays": 287
      }
    ],
    "statistics": {
      "totalPlacements": 3,
      "averagePlacementDuration": 180,
      "placementBreakdowns": 1
    }
  }
}
```

---

## 📊 **LIFE SKILLS TRACKING**

### **GET /children/:childId/life-skills**
Get life skills progress

**Authentication**: Required  
**Authorization**: Staff + Young person (16+, own data)

**Response:**
```json
{
  "status": "success",
  "data": {
    "categories": {
      "cooking": {
        "completed": 3,
        "total": 6,
        "progressPercentage": 50
      },
      "budgeting": {
        "completed": 4,
        "total": 7,
        "progressPercentage": 57
      }
    },
    "overallProgress": 48,
    "skillsNeedingAttention": [
      {
        "id": "uuid",
        "name": "Job interview skills",
        "daysToDeadline": 5,
        "progressPercentage": 20
      }
    ]
  }
}
```

---

## 💰 **LEAVING CARE FINANCES**

### **GET /children/:childId/finances**
Get financial overview

**Authentication**: Required  
**Authorization**: Staff + Young person (16+, own data)

**Response:**
```json
{
  "status": "success",
  "data": {
    "grants": {
      "totalGrantsReceived": 2500.00
    },
    "savings": {
      "balance": 1200.00
    },
    "financialHealthScore": 80,
    "needsFinancialSupport": false
  }
}
```

---

## ⚠️ **ERROR CODES**

### **Authentication Errors**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Access denied: Age verification failed | Child is under 16 |
| 403 | Access denied: Staff only | Endpoint requires staff role |

### **Validation Errors**

| Code | Message | Description |
|------|---------|-------------|
| 400 | Validation failed | Invalid request body |
| 422 | Unprocessable entity | Data format correct but semantically invalid |

### **Resource Errors**

| Code | Message | Description |
|------|---------|-------------|
| 404 | Child not found | Child ID doesn't exist |
| 404 | No pathway plan found | Young person has no pathway plan |
| 409 | Conflict | Duplicate resource |

### **Example Error Response**

```json
{
  "status": "error",
  "error": {
    "code": 403,
    "message": "Access denied: Young Person Portal is available from age 16",
    "details": {
      "currentAge": 14,
      "requiredAge": 16
    }
  }
}
```

---

## 📝 **CHANGELOG**

### **v1.0.0** - October 10, 2025
- ✅ Young Person Portal (16+)
- ✅ Developmental Milestones (0-5 years)
- ✅ Residential Care Placements
- ✅ Life Skills Tracking
- ✅ Leaving Care Finances
- ✅ Age-gated authentication

---

**Documentation maintained by**: Children's Care Development Team  
**Support**: support@yourcare.com  
**API Status**: https://status.yourcare.com
