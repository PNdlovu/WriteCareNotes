# Impact Analysis API Reference

**Version:** 1.0.0  
**Phase:** Phase 2 TIER 1 - Feature 3  
**Last Updated:** October 7, 2025

## Overview

The Impact Analysis API provides comprehensive tools for analyzing policy dependencies, assessing change impact, and generating risk reports before publishing policy changes. This API enables proactive risk management and informed decision-making for policy governance.

## Table of Contents

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Impact Analysis](#impact-analysis-endpoints)
   - [Dependency Management](#dependency-management-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Base URL

```
http://localhost:3000/api
```

For production environments, replace with your production domain.

---

## Authentication

All endpoints require authentication. Include the authentication token in the request headers:

```http
Authorization: Bearer <your-token-here>
```

---

## Endpoints

### Impact Analysis Endpoints

#### 1. Get Dependency Graph

**GET** `/policy/:policyId/dependencies`

Retrieve the complete dependency graph for a policy.

**Parameters:**
- `policyId` (path, required): UUID of the policy
- `maxDepth` (query, optional): Maximum traversal depth (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "uuid-1",
        "type": "workflow",
        "label": "Patient Admission Workflow",
        "depth": 1
      }
    ],
    "edges": [
      {
        "source": "uuid-policy",
        "target": "uuid-1",
        "strength": "strong",
        "type": "workflow"
      }
    ],
    "metadata": {
      "totalNodes": 15,
      "totalEdges": 18,
      "maxDepthReached": 3
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/dependencies?maxDepth=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 2. Get Complete Impact Analysis

**GET** `/policy/:policyId/impact-analysis`

Get a comprehensive impact analysis report including dependency graph, risk assessment, affected entities, and recommendations.

**Parameters:**
- `policyId` (path, required): UUID of the policy

**Response:**
```json
{
  "success": true,
  "data": {
    "dependencyGraph": { /* ... */ },
    "riskAssessment": {
      "overallRiskScore": 67,
      "riskLevel": "high",
      "riskFactors": [
        {
          "factor": "Critical Workflow Dependency",
          "severity": "high",
          "description": "This policy affects the Patient Admission workflow which is critical for daily operations."
        }
      ],
      "requiresApproval": true
    },
    "affectedWorkflows": {
      "total": 12,
      "byRisk": { "low": 3, "medium": 5, "high": 3, "critical": 1 },
      "criticalWorkflows": [
        {
          "id": "uuid-workflow-1",
          "name": "Patient Admission",
          "impactDescription": "Policy change may disrupt admission process"
        }
      ]
    },
    "affectedModules": {
      "total": 8,
      "modules": [
        {
          "id": "uuid-module-1",
          "name": "Care Planning Module",
          "riskLevel": "medium"
        }
      ]
    },
    "changeScope": {
      "impactRadius": 7,
      "totalAffected": 28,
      "isSystemWide": false,
      "affectedDepartments": ["Nursing", "Administration", "Medical Records"]
    },
    "recommendations": {
      "prePublishActions": [
        "Test all affected workflows in staging environment",
        "Notify department heads of upcoming changes"
      ],
      "mitigationStrategies": [
        "Schedule publication during off-peak hours",
        "Prepare rollback plan"
      ],
      "notifyStakeholders": [
        "Nursing Manager",
        "IT Administrator",
        "Compliance Officer"
      ]
    },
    "prePublishChecklist": [
      {
        "item": "All affected workflows tested",
        "required": true,
        "completed": false
      },
      {
        "item": "Stakeholders notified",
        "required": true,
        "completed": false
      },
      {
        "item": "Backup created",
        "required": false,
        "completed": true
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/impact-analysis" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 3. Get Affected Workflows

**GET** `/policy/:policyId/affected-workflows`

Retrieve all workflows affected by this policy with risk breakdown.

**Parameters:**
- `policyId` (path, required): UUID of the policy

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "byRisk": { "low": 3, "medium": 5, "high": 3, "critical": 1 },
    "criticalWorkflows": [ /* ... */ ]
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/affected-workflows" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 4. Get Affected Modules

**GET** `/policy/:policyId/affected-modules`

Retrieve all modules affected by this policy.

**Parameters:**
- `policyId` (path, required): UUID of the policy

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 8,
    "modules": [
      {
        "id": "uuid-module-1",
        "name": "Care Planning Module",
        "riskLevel": "medium"
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/affected-modules" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 5. Analyze Policy Changes

**POST** `/policy/:policyId/analyze-changes`

Analyze the impact of policy changes before publication with recommendations.

**Parameters:**
- `policyId` (path, required): UUID of the policy

**Request Body:**
```json
{
  "changes": "Updated section 3.2 to include new medication protocols"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": { /* Complete impact analysis */ },
    "recommendation": "review",
    "requiresApproval": true,
    "estimatedImpact": {
      "totalAffected": 28,
      "riskScore": 67,
      "criticalWorkflows": 1
    },
    "changes": "Updated section 3.2 to include new medication protocols"
  }
}
```

**Recommendation Values:**
- `proceed`: Low risk, can publish immediately
- `review`: Medium/high risk, review recommended
- `block`: Critical risk, publication blocked

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/analyze-changes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"changes": "Updated medication protocols"}'
```

---

#### 6. Get Risk Assessment

**GET** `/policy/:policyId/risk-assessment`

Get detailed risk assessment for policy changes.

**Parameters:**
- `policyId` (path, required): UUID of the policy

**Response:**
```json
{
  "success": true,
  "data": {
    "overallRiskScore": 67,
    "riskLevel": "high",
    "riskFactors": [ /* ... */ ],
    "requiresApproval": true
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/risk-assessment" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 7. Get Change Scope

**GET** `/policy/:policyId/change-scope`

Calculate the scope and reach of policy changes.

**Parameters:**
- `policyId` (path, required): UUID of the policy

**Response:**
```json
{
  "success": true,
  "data": {
    "impactRadius": 7,
    "totalAffected": 28,
    "isSystemWide": false,
    "affectedDepartments": ["Nursing", "Administration"]
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/change-scope" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 8. Generate Impact Report

**GET** `/policy/:policyId/impact-report`

Generate and download impact analysis report in specified format.

**Parameters:**
- `policyId` (path, required): UUID of the policy
- `format` (query, optional): Report format - `json`, `html`, or `pdf` (default: json)

**Response:**
- **JSON**: Standard JSON response
- **HTML**: HTML document
- **PDF**: Binary PDF file

**cURL Examples:**
```bash
# JSON format
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/impact-report?format=json" \
  -H "Authorization: Bearer YOUR_TOKEN"

# HTML format
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/impact-report?format=html" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o impact-report.html

# PDF format
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/impact-report?format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o impact-report.pdf
```

---

### Dependency Management Endpoints

#### 9. Create Dependency

**POST** `/policy/:policyId/dependencies`

Create a new dependency relationship for a policy.

**Parameters:**
- `policyId` (path, required): UUID of the policy

**Request Body:**
```json
{
  "dependentType": "workflow",
  "dependentId": "uuid-workflow-1",
  "dependencyStrength": "strong",
  "metadata": {
    "triggerPoint": "patient_admission",
    "affectedSteps": ["step_1", "step_2"]
  },
  "notes": "This workflow is triggered when policy section 3.2 is applied"
}
```

**Dependency Types:**
- `workflow`: Care workflow dependency
- `module`: System module dependency
- `template`: Document template dependency
- `assessment`: Care assessment dependency
- `training`: Training material dependency
- `document`: Related document dependency

**Dependency Strengths:**
- `strong`: Critical dependency, high impact
- `medium`: Moderate dependency
- `weak`: Minor dependency

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-dependency-1",
    "policyId": "uuid-policy",
    "dependentType": "workflow",
    "dependentId": "uuid-workflow-1",
    "dependencyStrength": "strong",
    "metadata": { /* ... */ },
    "notes": "This workflow is triggered...",
    "isActive": true,
    "createdAt": "2025-10-07T10:30:00Z"
  },
  "message": "Dependency created successfully"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/dependencies" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dependentType": "workflow",
    "dependentId": "550e8400-e29b-41d4-a716-446655440001",
    "dependencyStrength": "strong",
    "notes": "Critical workflow dependency"
  }'
```

---

#### 10. Update Dependency

**PUT** `/dependencies/:dependencyId`

Update an existing dependency relationship.

**Parameters:**
- `dependencyId` (path, required): UUID of the dependency

**Request Body:**
```json
{
  "dependencyStrength": "medium",
  "notes": "Updated: Dependency reduced after workflow optimization",
  "metadata": {
    "lastReviewed": "2025-10-07"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated dependency object */ },
  "message": "Dependency updated successfully"
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:3000/api/dependencies/550e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dependencyStrength": "medium",
    "notes": "Reduced dependency after optimization"
  }'
```

---

#### 11. Delete Dependency

**DELETE** `/dependencies/:dependencyId`

Delete a dependency relationship (soft delete by default).

**Parameters:**
- `dependencyId` (path, required): UUID of the dependency
- `hardDelete` (query, optional): Permanently delete if `true` (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Dependency deactivated successfully"
}
```

**cURL Examples:**
```bash
# Soft delete (deactivate)
curl -X DELETE "http://localhost:3000/api/dependencies/550e8400-e29b-41d4-a716-446655440002" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Hard delete (permanent)
curl -X DELETE "http://localhost:3000/api/dependencies/550e8400-e29b-41d4-a716-446655440002?hardDelete=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### 12. Bulk Create Dependencies

**POST** `/dependencies/bulk`

Create multiple dependency relationships in one request.

**Request Body:**
```json
{
  "dependencies": [
    {
      "policyId": "uuid-policy-1",
      "dependentType": "workflow",
      "dependentId": "uuid-workflow-1",
      "dependencyStrength": "strong"
    },
    {
      "policyId": "uuid-policy-1",
      "dependentType": "module",
      "dependentId": "uuid-module-1",
      "dependencyStrength": "medium"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [ /* Array of created dependencies */ ],
  "message": "Successfully created 2/2 dependencies"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:3000/api/dependencies/bulk" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dependencies": [
      {
        "policyId": "550e8400-e29b-41d4-a716-446655440000",
        "dependentType": "workflow",
        "dependentId": "550e8400-e29b-41d4-a716-446655440001",
        "dependencyStrength": "strong"
      }
    ]
  }'
```

---

## Data Models

### Policy Dependency

```typescript
interface PolicyDependency {
  id: string;
  policyId: string;
  dependentType: 'workflow' | 'module' | 'template' | 'assessment' | 'training' | 'document';
  dependentId: string;
  dependencyStrength: 'strong' | 'medium' | 'weak';
  metadata: Record<string, any>;
  notes: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Risk Assessment

```typescript
interface RiskAssessment {
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  requiresApproval: boolean;
}
```

### Change Scope

```typescript
interface ChangeScope {
  impactRadius: number; // 0-10
  totalAffected: number;
  isSystemWide: boolean;
  affectedDepartments: string[];
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

- **200 OK**: Successful GET request
- **201 Created**: Successful POST request
- **400 Bad Request**: Invalid parameters or request body
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Common Errors

**Invalid UUID:**
```json
{
  "error": "Invalid policy ID"
}
```

**Not Found:**
```json
{
  "error": "Policy not found"
}
```

**Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

---

## Rate Limiting

- **Rate Limit:** 100 requests per minute per user
- **Burst Limit:** 20 requests per second

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696680000
```

---

## Examples

### Complete Workflow Example

1. **Create a new policy dependency:**
```bash
curl -X POST "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/dependencies" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dependentType": "workflow",
    "dependentId": "550e8400-e29b-41d4-a716-446655440001",
    "dependencyStrength": "strong"
  }'
```

2. **Analyze impact before publication:**
```bash
curl -X POST "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/analyze-changes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"changes": "Updated medication protocols"}'
```

3. **Generate PDF report:**
```bash
curl -X GET "http://localhost:3000/api/policy/550e8400-e29b-41d4-a716-446655440000/impact-report?format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o impact-report.pdf
```

---

## Support

For additional support or questions:
- **Documentation:** See IMPACT_ANALYSIS_GUIDE.md for detailed usage instructions
- **Testing:** See IMPACT_ANALYSIS_TESTING.md for test scenarios
- **GitHub:** Report issues on the project repository

---

**End of API Reference**
