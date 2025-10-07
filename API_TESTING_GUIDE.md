# Feature 1 - API Testing Guide
## Quick Start Testing for Policy Version Endpoints

### 🚀 Prerequisites

1. **Start the server**:
   ```bash
   npm run dev
   # or
   npm start
   ```

2. **Verify server is running**:
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## 📍 API Endpoints

### Base URL
```
http://localhost:3000/api/policies
```

---

## 🧪 Test Cases

### 1. Get All Versions for a Policy

**Request**:
```bash
curl -X GET "http://localhost:3000/api/policies/{policyId}/versions" \
  -H "x-organization-id: your-org-id"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "uuid",
      "version": "1.2.0",
      "title": "Updated Policy Title",
      "status": "published",
      "createdAt": "2025-10-07T10:30:00Z",
      ...
    }
  ]
}
```

**Error Cases**:
- 400 Bad Request - Invalid policy ID format
- 404 Not Found - No versions found

---

### 2. Get Single Version by ID

**Request**:
```bash
curl -X GET "http://localhost:3000/api/policies/versions/{versionId}"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "version": "1.2.0",
    "title": "Policy Title",
    "content": { ... },
    "metadata": { ... },
    "createdAt": "2025-10-07T10:30:00Z"
  }
}
```

**Error Cases**:
- 400 Bad Request - Invalid version ID format
- 404 Not Found - Version not found

---

### 3. Compare Two Versions

**Request**:
```bash
curl -X GET "http://localhost:3000/api/policies/versions/compare?v1={uuid1}&v2={uuid2}" \
  -H "x-organization-id: your-org-id"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "oldVersion": { ... },
    "newVersion": { ... },
    "diffs": [
      {
        "operation": "modified",
        "oldValue": "Old text",
        "newValue": "New text",
        "path": "content.paragraph1"
      }
    ],
    "summary": {
      "additionsCount": 5,
      "deletionsCount": 2,
      "modificationsCount": 3,
      "unchangedCount": 10,
      "totalChanges": 10
    },
    "metadata": {
      "timeDifference": 86400000,
      "editors": ["user1", "user2"],
      "categories": ["Clinical", "Clinical"]
    }
  }
}
```

**Error Cases**:
- 400 Bad Request - Missing v1 or v2 parameters
- 400 Bad Request - Invalid UUID format
- 404 Not Found - One or both versions not found

---

### 4. Rollback to Previous Version

**Request**:
```bash
curl -X POST "http://localhost:3000/api/policies/versions/{versionId}/rollback" \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{
    "reason": "Reverting to previous version due to compliance issue found in current version"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Policy successfully rolled back to version 1.1.0",
  "data": {
    "updatedPolicy": { ... },
    "restoredVersion": { ... },
    "rollbackMetadata": {
      "performedBy": "user-uuid",
      "performedAt": "2025-10-07T15:30:00Z",
      "reason": "Reverting to previous version...",
      "targetVersionId": "version-uuid"
    }
  }
}
```

**Error Cases**:
- 400 Bad Request - Invalid version ID
- 400 Bad Request - Missing reason
- 400 Bad Request - Reason too short (< 10 chars)
- 400 Bad Request - Reason too long (> 500 chars)
- 404 Not Found - Version not found
- 500 Internal Server Error - Rollback failed

---

### 5. RESTful Diff Endpoint (Alternative to Compare)

**Request**:
```bash
curl -X GET "http://localhost:3000/api/policies/versions/{versionId}/diff/{compareVersionId}" \
  -H "x-organization-id: your-org-id"
```

**Expected Response**: Same as Compare endpoint (200 OK)

---

### 6. Archive Version (Soft Delete)

**Request**:
```bash
curl -X DELETE "http://localhost:3000/api/policies/versions/{versionId}"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Version archived successfully",
  "data": {
    "archivedVersionId": "version-uuid",
    "archivedAt": "2025-10-07T15:30:00Z"
  }
}
```

**Error Cases**:
- 400 Bad Request - Invalid version ID
- 403 Forbidden - Cannot archive published versions
- 404 Not Found - Version not found

---

## 🧪 Postman/Thunder Client Collection

### Collection Variables
```json
{
  "baseUrl": "http://localhost:3000/api/policies",
  "policyId": "your-policy-uuid",
  "versionId1": "version-uuid-1",
  "versionId2": "version-uuid-2",
  "orgId": "your-org-uuid",
  "userId": "your-user-uuid"
}
```

### Quick Import (Thunder Client)
1. Open Thunder Client in VS Code
2. Create new collection: "Policy Versions API"
3. Add 6 requests using the endpoints above
4. Set variables in Environment

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"
**Solution**: Ensure database connection is configured
```bash
# Check database config
cat src/config/database.ts
```

### Issue: "Version not found"
**Solution**: Ensure you have policy versions in the database
```sql
-- Check versions
SELECT * FROM policy_versions WHERE policy_id = 'your-uuid';
```

### Issue: "Invalid UUID format"
**Solution**: Ensure all IDs are valid UUIDs
```
Valid:   123e4567-e89b-12d3-a456-426614174000
Invalid: 12345 or abc123
```

---

## ✅ Validation Checklist

Before testing, ensure:

- [x] Server is running on port 3000
- [x] Database is connected and accessible
- [x] policy_versions table exists
- [x] At least one policy with versions exists
- [x] Valid UUIDs for testing
- [x] Headers include x-organization-id (for multi-tenant support)
- [x] Headers include x-user-id (for rollback operations)

---

## 📊 Expected Database State

After successful rollback:

```sql
-- Original version (unchanged)
SELECT * FROM policy_versions WHERE id = 'rollback-target-uuid';

-- Pre-rollback snapshot (new version created automatically)
SELECT * FROM policy_versions 
WHERE policy_id = 'policy-uuid' 
ORDER BY created_at DESC 
LIMIT 1;

-- Updated policy draft
SELECT * FROM policy_drafts WHERE id = 'policy-uuid';
```

---

## 🎯 Success Criteria

All tests pass when:
- ✅ All 6 endpoints return 200 OK for valid requests
- ✅ Invalid UUIDs return 400 Bad Request
- ✅ Missing versions return 404 Not Found
- ✅ Rollback creates new version and updates policy
- ✅ Archive sets deletedAt timestamp (soft delete)
- ✅ Published versions cannot be archived (403 Forbidden)
- ✅ Comparison shows accurate diffs
- ✅ All responses include success flag and data

---

**Testing Status**: Ready for QA  
**API Version**: 1.0.0  
**Last Updated**: October 7, 2025
