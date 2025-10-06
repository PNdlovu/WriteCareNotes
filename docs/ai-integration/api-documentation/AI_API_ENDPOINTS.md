# 🔌 AI API Endpoints - Complete Reference

## 📋 **Overview**

The AI-Enhanced PolicyGovernanceEngine provides comprehensive REST API endpoints and WebSocket interfaces for all AI-powered features. This documentation covers all endpoints with examples for each of the seven British Isles jurisdictions.

---

## 🏗️ **API Architecture**

### **Base URL Structure:**
```
Production:  https://api.policygovernance.com/api/ai/policies
Development: http://localhost:3000/api/ai/policies
```

### **Authentication:**
All endpoints require JWT authentication in the Authorization header:
```http
Authorization: Bearer <jwt_token>
```

### **Rate Limiting:**
- **AI Requests**: 60 per minute, 1000 per day
- **Chat Messages**: 300 per minute
- **Standard API**: 1000 per minute

---

## 🤖 **AI Policy Analysis Endpoints**

### **POST /analyze**
Analyze an existing policy for compliance gaps, clarity issues, and improvement opportunities.

#### **Request:**
```http
POST /api/ai/policies/analyze
Content-Type: application/json
Authorization: Bearer <token>

{
  "policyId": "uuid-policy-id",
  "jurisdictions": ["cqc_england", "care_inspectorate_scotland"],
  "analysisType": "comprehensive", // or "quick", "compliance_only"
  "focusAreas": ["compliance", "clarity", "implementation"],
  "organizationContext": {
    "type": "residential_care",
    "size": "medium", // small, medium, large
    "bedCount": 40,
    "specialUnits": ["dementia", "respite"]
  }
}
```

#### **Response:**
```json
{
  "analysisId": "analysis_uuid",
  "timestamp": "2025-10-06T14:30:00Z",
  "score": 85,
  "overallRating": "good",
  "executionTime": "2.3s",
  "jurisdictionalCompliance": {
    "cqc_england": {
      "score": 88,
      "fundamentalStandardsCompliance": {
        "regulation_9": { "status": "compliant", "score": 95 },
        "regulation_10": { "status": "needs_improvement", "score": 78 },
        "regulation_12": { "status": "compliant", "score": 92 }
      },
      "kloeAlignment": {
        "safe": 90,
        "effective": 85,
        "caring": 88,
        "responsive": 82,
        "well_led": 87
      }
    },
    "care_inspectorate_scotland": {
      "score": 82,
      "nationalStandardsCompliance": {
        "standard_1": { "status": "compliant", "score": 90 },
        "standard_2": { "status": "partial", "score": 75 },
        "standard_10": { "status": "compliant", "score": 88 }
      }
    }
  },
  "suggestions": [
    {
      "id": "sugg_001",
      "type": "compliance",
      "priority": "high",
      "title": "Enhance Dignity and Respect Procedures",
      "description": "Policy needs stronger language around dignity and respect practices",
      "suggestedChange": "Add specific procedures for maintaining dignity during personal care",
      "reasoning": "CQC Fundamental Standard 10 requires explicit dignity procedures",
      "complianceStandard": "CQC Regulation 10",
      "jurisdiction": "cqc_england",
      "confidence": 0.92,
      "estimatedImpact": "high",
      "implementationEffort": "medium"
    }
  ],
  "complianceGaps": [
    {
      "gapId": "gap_001",
      "standard": "CQC-Fundamental-Standard-12",
      "requirement": "Safe care and treatment",
      "currentStatus": "partial",
      "severity": "medium",
      "description": "Missing specific risk assessment procedures",
      "suggestedAction": "Add comprehensive risk assessment framework",
      "deadline": "2025-11-06T00:00:00Z",
      "jurisdiction": "cqc_england"
    }
  ],
  "riskAssessment": {
    "overallRisk": "medium",
    "riskFactors": [
      {
        "factor": "Compliance gap in risk assessment",
        "likelihood": "medium",
        "impact": "high",
        "jurisdiction": "cqc_england"
      }
    ],
    "mitigationStrategies": [
      "Implement comprehensive risk assessment procedures",
      "Schedule staff training on new procedures",
      "Regular internal audits"
    ]
  },
  "improvementRecommendations": [
    {
      "category": "structure",
      "priority": "medium",
      "title": "Improve Policy Structure",
      "description": "Reorganize sections for better readability",
      "estimatedBenefit": "Improved staff understanding and compliance"
    }
  ]
}
```

#### **Jurisdiction-Specific Examples:**

**CQC England Analysis:**
```json
{
  "jurisdictions": ["cqc_england"],
  "organizationContext": {
    "type": "nursing_home",
    "cqcRating": "good",
    "lastInspection": "2024-06-15"
  }
}
```

**Care Inspectorate Scotland Analysis:**
```json
{
  "jurisdictions": ["care_inspectorate_scotland"],
  "organizationContext": {
    "type": "care_home",
    "careInspectorateGrades": {
      "care_support": 4,
      "environment": 5,
      "staffing": 4,
      "management": 4
    }
  }
}
```

**Multi-Jurisdictional Analysis:**
```json
{
  "jurisdictions": ["cqc_england", "care_inspectorate_scotland", "ciw_wales"],
  "organizationContext": {
    "type": "care_group",
    "sites": [
      {"location": "england", "regulator": "cqc"},
      {"location": "scotland", "regulator": "care_inspectorate"},
      {"location": "wales", "regulator": "ciw"}
    ]
  }
}
```

---

## 🏗️ **AI Policy Generation Endpoints**

### **POST /generate**
Generate a new policy from natural language requirements.

#### **Request:**
```http
POST /api/ai/policies/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Medication Management Policy",
  "category": "medication",
  "jurisdictions": ["cqc_england"],
  "requirements": [
    "Safe storage of medications",
    "Administration procedures",
    "MAR chart requirements",
    "Staff training requirements",
    "Emergency medication protocols"
  ],
  "organizationContext": {
    "type": "residential_care",
    "bedCount": 30,
    "hasNursingCare": true,
    "specialNeeds": ["dementia", "mental_health"]
  },
  "preferences": {
    "length": "comprehensive", // brief, standard, comprehensive
    "language": "plain_english",
    "includeFlowcharts": true,
    "includeTemplates": true
  }
}
```

#### **Response:**
```json
{
  "generationId": "gen_uuid",
  "timestamp": "2025-10-06T14:30:00Z",
  "executionTime": "4.2s",
  "generatedPolicy": {
    "title": "Medication Management Policy",
    "category": "medication",
    "description": "Comprehensive medication management policy ensuring safe storage, administration, and monitoring of medications in residential care.",
    "jurisdiction": ["cqc_england"],
    "content": {
      "sections": [
        {
          "id": "section_1",
          "title": "1. Policy Statement",
          "content": "This policy ensures the safe and effective management of medications in accordance with CQC Fundamental Standards, particularly Regulation 12 (Safe care and treatment)...",
          "complianceReferences": ["CQC Regulation 12", "NICE Guidelines NG5"]
        },
        {
          "id": "section_2", 
          "title": "2. Legal Framework",
          "content": "This policy complies with:\n- The Human Medicines Regulations 2012\n- CQC Fundamental Standards (Regulation 12)\n- NICE Guidelines on Managing medicines in care homes (NG5)...",
          "complianceReferences": ["Human Medicines Regulations 2012", "CQC Regulation 12"]
        }
      ],
      "procedures": [
        {
          "id": "proc_1",
          "title": "Medication Storage Procedure",
          "steps": [
            "Ensure all medications are stored in locked cabinets",
            "Maintain temperature logs for refrigerated medications",
            "Conduct daily checks of controlled drugs"
          ],
          "complianceNotes": "Meets CQC Regulation 12 requirements for safe medication storage"
        }
      ],
      "forms": [
        {
          "id": "form_1",
          "title": "Medication Administration Record (MAR)",
          "description": "Template for recording medication administration",
          "complianceStandard": "CQC Regulation 12"
        }
      ]
    },
    "metadata": {
      "wordCount": 2850,
      "readingLevel": "Grade 8",
      "complianceScore": 98,
      "implementationComplexity": "medium"
    }
  },
  "complianceValidation": {
    "cqc_england": {
      "fundamentalStandardsAlignment": {
        "regulation_12": "fully_compliant",
        "regulation_17": "fully_compliant"
      },
      "kloeAlignment": {
        "safe": "excellent",
        "effective": "good",
        "well_led": "excellent"
      }
    }
  },
  "suggestedNextSteps": [
    "Review with senior management team",
    "Schedule staff training sessions",
    "Implement MAR chart system",
    "Set review date for 12 months"
  ]
}
```

#### **Jurisdiction-Specific Generation Examples:**

**Jersey (JCC) Safeguarding Policy:**
```json
{
  "title": "Safeguarding Adults Policy",
  "category": "safeguarding",
  "jurisdictions": ["jcc_jersey"],
  "requirements": [
    "Abuse recognition and reporting",
    "Jersey-specific reporting procedures",
    "Island community considerations",
    "Multi-agency working protocols"
  ],
  "organizationContext": {
    "type": "residential_care",
    "location": "jersey",
    "bedCount": 25,
    "islandContext": true
  }
}
```

**Guernsey (GCRB) Infection Control Policy:**
```json
{
  "title": "Infection Prevention and Control Policy",
  "category": "infection_control",
  "jurisdictions": ["gcrb_guernsey"],
  "requirements": [
    "COVID-19 protocols",
    "Standard infection control measures",
    "Guernsey health authority guidelines",
    "Outbreak management procedures"
  ],
  "organizationContext": {
    "type": "care_home",
    "location": "guernsey",
    "hasHealthcareUnits": true
  }
}
```

---

## 🗣️ **Natural Language Query Endpoints**

### **POST /query**
Process natural language queries about policies and compliance.

#### **Request:**
```http
POST /api/ai/policies/query
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "What policies do I need for a CQC inspection next month?",
  "context": {
    "organizationType": "nursing_home",
    "bedCount": 50,
    "lastInspection": "2023-04-15",
    "currentRating": "good",
    "jurisdictions": ["cqc_england"]
  },
  "responseFormat": "detailed" // brief, standard, detailed
}
```

#### **Response:**
```json
{
  "queryId": "query_uuid",
  "timestamp": "2025-10-06T14:30:00Z",
  "intent": "inspection_preparation",
  "confidence": 0.95,
  "response": {
    "summary": "For your upcoming CQC inspection, ensure you have current policies covering all Fundamental Standards, with particular focus on recently updated areas.",
    "recommendations": [
      {
        "priority": "high",
        "category": "essential_policies",
        "title": "Core Inspection Policies",
        "items": [
          {
            "policy": "Safeguarding Adults Policy",
            "status": "review_required",
            "lastUpdated": "2024-01-15",
            "complianceStandard": "CQC Regulation 13",
            "action": "Update to reflect recent safeguarding guidance changes"
          },
          {
            "policy": "Medication Management Policy", 
            "status": "current",
            "lastUpdated": "2024-09-10",
            "complianceStandard": "CQC Regulation 12",
            "action": "Ensure staff training records are current"
          }
        ]
      }
    ],
    "actionPlan": [
      {
        "task": "Review and update safeguarding policy",
        "deadline": "2025-10-20",
        "priority": "high",
        "estimatedTime": "4 hours"
      },
      {
        "task": "Audit staff training records",
        "deadline": "2025-10-25", 
        "priority": "medium",
        "estimatedTime": "2 hours"
      }
    ]
  },
  "relatedPolicies": [
    {
      "id": "policy_uuid_1",
      "title": "Safeguarding Adults Policy",
      "relevanceScore": 0.95,
      "lastReview": "2024-01-15"
    }
  ],
  "suggestedQueries": [
    "How do I prepare for a CQC KLOE assessment?",
    "What documentation should I have ready for inspectors?",
    "How do I demonstrate compliance with Regulation 17?"
  ]
}
```

#### **Multi-Jurisdictional Query Examples:**

**Cross-Border Care Group Query:**
```json
{
  "query": "I run care homes in England, Scotland, and Wales. What are the key differences in medication policies?",
  "context": {
    "organizationType": "care_group",
    "sites": [
      {"location": "england", "regulator": "cqc"},
      {"location": "scotland", "regulator": "care_inspectorate"},
      {"location": "wales", "regulator": "ciw"}
    ]
  }
}
```

**Island Jurisdiction Query:**
```json
{
  "query": "What safeguarding requirements are specific to Jersey care homes?",
  "context": {
    "organizationType": "residential_care",
    "location": "jersey",
    "regulator": "jcc"
  }
}
```

---

## 📊 **Compliance Risk Assessment Endpoints**

### **POST /compliance/assess-risk**
Assess compliance risks across policies and predict potential violations.

#### **Request:**
```http
POST /api/ai/policies/compliance/assess-risk
Content-Type: application/json
Authorization: Bearer <token>

{
  "assessmentScope": "organization", // policy, department, organization
  "targetPolicies": ["all"], // or specific policy IDs
  "jurisdictions": ["cqc_england", "care_inspectorate_scotland"],
  "timeHorizon": "12_months", // 3_months, 6_months, 12_months
  "organizationData": {
    "type": "care_group",
    "totalBeds": 150,
    "staffCount": 180,
    "incidents": {
      "lastYear": 5,
      "trend": "decreasing"
    },
    "lastInspections": {
      "cqc_england": {
        "date": "2024-03-15",
        "rating": "good",
        "actionPoints": 2
      }
    }
  }
}
```

#### **Response:**
```json
{
  "assessmentId": "risk_assessment_uuid",
  "timestamp": "2025-10-06T14:30:00Z",
  "scope": "organization",
  "timeHorizon": "12_months",
  "overallRiskScore": 35, // 0-100 (lower is better)
  "overallRiskLevel": "medium", // low, medium, high, critical
  "jurisdictionalRisks": {
    "cqc_england": {
      "riskScore": 32,
      "riskLevel": "medium",
      "keyRiskAreas": [
        {
          "area": "medication_management",
          "riskScore": 45,
          "riskFactors": [
            "Staff training gaps identified",
            "MAR chart inconsistencies in recent audits"
          ],
          "regulatoryStandard": "CQC Regulation 12",
          "mitigationStrategies": [
            "Implement comprehensive staff training program",
            "Introduce electronic MAR system"
          ],
          "timeToMitigate": "2-3 months"
        }
      ]
    },
    "care_inspectorate_scotland": {
      "riskScore": 28,
      "riskLevel": "low",
      "keyRiskAreas": [
        {
          "area": "care_planning",
          "riskScore": 30,
          "riskFactors": ["Review cycles occasionally missed"],
          "regulatoryStandard": "National Care Standard 4"
        }
      ]
    }
  },
  "predictiveAnalysis": {
    "likelyViolations": [
      {
        "violationType": "medication_error",
        "probability": 0.25,
        "severity": "medium",
        "timeframe": "next_6_months",
        "jurisdiction": "cqc_england",
        "regulatoryImpact": "Possible requirement notice"
      }
    ],
    "trendAnalysis": {
      "complianceDirection": "improving",
      "confidenceLevel": 0.82,
      "keyIndicators": [
        "Training completion rates increasing",
        "Incident reporting improving",
        "Staff satisfaction scores stable"
      ]
    }
  },
  "recommendedActions": [
    {
      "priority": "high",
      "action": "Implement medication management training program",
      "estimatedCost": "£2,500",
      "estimatedROI": "High risk reduction",
      "timeline": "6 weeks"
    }
  ]
}
```

---

## 📋 **Template Recommendation Endpoints**

### **POST /templates/suggest**
Get AI-powered template recommendations based on organization profile.

#### **Request:**
```http
POST /api/ai/policies/templates/suggest
Content-Type: application/json
Authorization: Bearer <token>

{
  "organizationProfile": {
    "type": "residential_care",
    "bedCount": 35,
    "services": ["residential_care", "respite_care"],
    "specializations": ["dementia", "mental_health"],
    "jurisdiction": ["cqc_england"]
  },
  "requirements": {
    "urgentNeeded": ["safeguarding", "medication"],
    "plannedUpdates": ["health_safety", "complaints"],
    "newServices": ["day_care"]
  },
  "currentPolicies": [
    {
      "category": "safeguarding",
      "lastUpdated": "2023-06-15",
      "status": "needs_review"
    }
  ]
}
```

#### **Response:**
```json
{
  "recommendationId": "template_rec_uuid",
  "timestamp": "2025-10-06T14:30:00Z",
  "organizationAnalysis": {
    "profileMatch": "residential_care_with_specialization",
    "complianceLevel": "good",
    "gapAnalysis": {
      "missingPolicies": ["day_care_operations", "mental_health_support"],
      "outdatedPolicies": ["safeguarding"],
      "priorityUpdates": ["medication", "safeguarding"]
    }
  },
  "recommendations": [
    {
      "category": "safeguarding",
      "priority": "urgent",
      "templateId": "template_safeguarding_cqc_enhanced",
      "title": "Enhanced Safeguarding Policy for Dementia Care",
      "description": "Comprehensive safeguarding policy specifically designed for residential care with dementia specialization",
      "jurisdiction": "cqc_england",
      "compliance": {
        "standards": ["CQC Regulation 13", "CQC Regulation 10"],
        "kloeAlignment": ["Safe", "Caring", "Well-Led"]
      },
      "features": [
        "Dementia-specific safeguarding considerations",
        "Mental capacity assessment procedures",
        "Family involvement protocols",
        "Staff training requirements"
      ],
      "estimatedTime": {
        "customization": "2-3 hours",
        "implementation": "1-2 weeks"
      },
      "confidenceScore": 0.95
    }
  ],
  "templateBundle": {
    "bundleId": "bundle_dementia_care_essentials",
    "title": "Dementia Care Essential Policies Bundle",
    "description": "Complete policy set for dementia care residential homes",
    "templates": [
      "safeguarding_dementia_enhanced",
      "mental_capacity_assessment",
      "person_centered_care_dementia",
      "medication_management_dementia"
    ],
    "bundleDiscount": "20%",
    "totalEstimatedTime": "8-12 hours"
  }
}
```

---

## 🔄 **Policy Improvement Endpoints**

### **POST /:id/improve**
Get AI-powered suggestions to improve an existing policy.

#### **Request:**
```http
POST /api/ai/policies/550e8400-e29b-41d4-a716-446655440000/improve
Content-Type: application/json
Authorization: Bearer <token>

{
  "improvementFocus": ["clarity", "compliance", "implementation"],
  "targetAudience": "care_staff", // management, care_staff, all_staff
  "urgency": "medium", // low, medium, high
  "jurisdictionalUpdates": {
    "cqc_england": {
      "newGuidance": ["medication_guidance_2024", "safeguarding_update_2024"]
    }
  }
}
```

#### **Response:**
```json
{
  "improvementId": "improvement_uuid",
  "timestamp": "2025-10-06T14:30:00Z",
  "originalPolicy": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Medication Management Policy",
    "currentScore": 78
  },
  "improvements": [
    {
      "section": "medication_storage",
      "improvementType": "clarity",
      "priority": "high",
      "currentText": "Medications should be stored safely and securely",
      "improvedText": "All medications must be stored in locked cabinets, with controlled drugs in a separate locked cabinet within the main medication cabinet. Temperature-sensitive medications must be stored in a designated pharmaceutical refrigerator with continuous temperature monitoring.",
      "justification": "Original text was vague and didn't meet CQC Regulation 12 specificity requirements",
      "complianceImpact": "Ensures full CQC Regulation 12 compliance",
      "implementationNotes": "Staff training required on new storage procedures"
    }
  ],
  "projectedScore": 92,
  "scoreImprovements": {
    "clarity": "+8 points",
    "compliance": "+12 points", 
    "implementation": "+4 points"
  },
  "regulatoryBenefits": [
    "Full CQC Regulation 12 compliance",
    "Reduced risk of medication errors",
    "Improved inspection readiness"
  ],
  "implementationPlan": {
    "phases": [
      {
        "phase": 1,
        "title": "Update policy content",
        "duration": "1 week",
        "tasks": ["Review improved sections", "Management approval"]
      },
      {
        "phase": 2,
        "title": "Staff implementation",
        "duration": "2 weeks", 
        "tasks": ["Staff training", "Procedure practice", "Competency assessment"]
      }
    ],
    "totalDuration": "3 weeks",
    "estimatedCost": "£800"
  }
}
```

---

## 💬 **Chat Interface (WebSocket)**

### **Connection Endpoint:**
```
ws://localhost:3000/ai-chat
wss://api.policygovernance.com/ai-chat
```

### **Authentication:**
Include JWT token in connection parameters:
```javascript
const socket = io('ws://localhost:3000/ai-chat', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### **Message Types:**

#### **Start Chat Session:**
```json
{
  "type": "start_session",
  "data": {
    "organizationId": "org_uuid",
    "userContext": {
      "role": "manager",
      "jurisdiction": ["cqc_england"]
    }
  }
}
```

#### **Send Message:**
```json
{
  "type": "message",
  "data": {
    "sessionId": "session_uuid",
    "content": "I need help creating a safeguarding policy for our 40-bed care home in England",
    "attachments": []
  }
}
```

#### **Receive Response:**
```json
{
  "type": "message_response",
  "data": {
    "messageId": "msg_uuid",
    "sessionId": "session_uuid",
    "content": "I'd be happy to help you create a safeguarding policy! Since you mentioned England, I'll ensure it complies with CQC Regulation 13 and other relevant fundamental standards.\n\nTo create the most effective policy for your care home, could you tell me:\n- Do you specialize in any particular types of care (e.g., dementia, mental health)?\n- Have you had any recent safeguarding concerns or incidents?\n- When was your last CQC inspection?",
    "timestamp": "2025-10-06T14:30:00Z",
    "suggestedActions": [
      {
        "id": "action_1",
        "type": "create_policy",
        "label": "Create Safeguarding Policy",
        "data": {
          "category": "safeguarding",
          "jurisdiction": ["cqc_england"]
        }
      },
      {
        "id": "action_2", 
        "type": "browse_templates",
        "label": "Browse Templates",
        "data": {
          "category": "safeguarding"
        }
      }
    ],
    "metadata": {
      "aiConfidence": 0.95,
      "processingTime": "1.2s",
      "jurisdiction": "cqc_england"
    }
  }
}
```

#### **Execute Action:**
```json
{
  "type": "execute_action",
  "data": {
    "sessionId": "session_uuid",
    "actionId": "action_1",
    "parameters": {
      "category": "safeguarding",
      "jurisdiction": ["cqc_england"],
      "requirements": ["abuse recognition", "reporting procedures", "staff training"]
    }
  }
}
```

---

## 📊 **System Status and Analytics**

### **GET /status**
Get AI system status and health metrics.

#### **Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-06T14:30:00Z",
  "aiServices": {
    "openai": {
      "status": "operational",
      "responseTime": "1.2s",
      "errorRate": "0.02%"
    },
    "policyAnalysis": {
      "status": "operational",
      "queueLength": 3,
      "avgProcessingTime": "2.1s"
    },
    "chatService": {
      "status": "operational",
      "activeSessions": 23,
      "avgResponseTime": "0.8s"
    }
  },
  "usage": {
    "todayRequests": 1247,
    "monthlyQuota": 50000,
    "quotaUsed": "15.2%"
  }
}
```

### **GET /analytics**
Get AI usage analytics and insights.

#### **Response:**
```json
{
  "period": "last_30_days",
  "totalRequests": 15673,
  "breakdown": {
    "policyAnalysis": 6234,
    "policyGeneration": 3421,
    "chatInteractions": 4892,
    "queryProcessing": 1126
  },
  "jurisdictionUsage": {
    "cqc_england": 8945,
    "care_inspectorate_scotland": 3234,
    "ciw_wales": 2134,
    "rqia_northern_ireland": 892,
    "jcc_jersey": 234,
    "gcrb_guernsey": 156,
    "dhsc_isle_of_man": 78
  },
  "qualityMetrics": {
    "userSatisfaction": 4.7,
    "aiAccuracy": 94.2,
    "responseTime": "1.8s"
  }
}
```

---

## 🔒 **Error Handling**

### **Standard Error Response:**
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid jurisdiction specified",
    "details": "Jurisdiction 'invalid_jurisdiction' is not supported",
    "timestamp": "2025-10-06T14:30:00Z",
    "requestId": "req_uuid"
  },
  "supportedJurisdictions": [
    "cqc_england",
    "care_inspectorate_scotland", 
    "ciw_wales",
    "rqia_northern_ireland",
    "jcc_jersey",
    "gcrb_guernsey",
    "dhsc_isle_of_man"
  ]
}
```

### **Common Error Codes:**
- `INVALID_REQUEST`: Malformed request data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `AI_SERVICE_UNAVAILABLE`: AI service temporarily unavailable
- `POLICY_NOT_FOUND`: Policy ID not found
- `JURISDICTION_NOT_SUPPORTED`: Invalid jurisdiction
- `QUOTA_EXCEEDED`: AI usage quota exceeded

---

## 🎯 **Best Practices**

### **Request Optimization:**
- Include relevant organization context for better AI responses
- Specify exact jurisdictions to get targeted compliance advice
- Use appropriate analysis types (quick vs comprehensive)
- Batch related requests when possible

### **Response Handling:**
- Always check confidence scores on AI responses
- Implement retry logic for transient failures
- Cache frequently requested analysis results
- Monitor rate limits and implement backoff strategies

### **Security:**
- Never include sensitive data in request logs
- Rotate API keys regularly
- Implement proper HTTPS in production
- Validate all user inputs before sending to AI

This comprehensive API documentation ensures full utilization of the AI-Enhanced PolicyGovernanceEngine across all British Isles jurisdictions, providing the most advanced policy management capabilities available in the healthcare industry.