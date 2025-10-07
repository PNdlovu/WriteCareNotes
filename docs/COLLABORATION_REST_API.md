# REST API Reference
## Real-Time Collaboration - Feature 2

**Version:** 1.0.0  
**Date:** October 7, 2025  
**Author:** WriteCareNotes Development Team

---

## Overview

This document provides a complete reference for the REST API endpoints used in the real-time policy collaboration system. These endpoints complement the WebSocket protocol for session management, comment CRUD operations, and historical data access.

**Base URL:** `http://localhost:5000/api/collaboration`  
**Authentication:** JWT Bearer Token (TODO: Implement)  
**Content-Type:** `application/json`

---

## Session Management Endpoints

### GET `/sessions/:policyId`

Get all collaboration sessions for a specific policy.

**Parameters:**
- `policyId` (path, required): UUID of the policy document

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `ended`, `disconnected`)
- `limit` (optional): Max number of sessions to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "status": "active",
      "startTime": "2025-10-07T14:30:00.000Z",
      "lastActivity": "2025-10-07T15:45:00.000Z",
      "endTime": null,
      "metadata": {
        "userAgent": "Mozilla/5.0...",
        "ipAddress": "192.168.1.1"
      },
      "createdAt": "2025-10-07T14:30:00.000Z",
      "updatedAt": "2025-10-07T15:45:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/collaboration/sessions/7c9e6679-7425-40de-944b-e07fc1f90ae7 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### POST `/sessions`

Create a new collaboration session.

**Request Body:**
```json
{
  "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1"
  }
}
```

**Response:** `201 Created`
```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "active",
    "startTime": "2025-10-07T14:30:00.000Z",
    "lastActivity": "2025-10-07T14:30:00.000Z",
    "endTime": null,
    "metadata": {
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1"
    },
    "createdAt": "2025-10-07T14:30:00.000Z",
    "updatedAt": "2025-10-07T14:30:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/collaboration/sessions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "metadata": {
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1"
    }
  }'
```

---

### GET `/sessions/detail/:sessionId`

Get detailed information about a specific session.

**Parameters:**
- `sessionId` (path, required): UUID of the collaboration session

**Response:** `200 OK`
```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "active",
    "startTime": "2025-10-07T14:30:00.000Z",
    "lastActivity": "2025-10-07T15:45:00.000Z",
    "endTime": null,
    "metadata": {
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1",
      "totalComments": 15,
      "totalEdits": 42
    },
    "createdAt": "2025-10-07T14:30:00.000Z",
    "updatedAt": "2025-10-07T15:45:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/collaboration/sessions/detail/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### POST `/sessions/:sessionId/join`

Join an existing collaboration session.

**Parameters:**
- `sessionId` (path, required): UUID of the collaboration session

**Request Body:**
```json
{
  "userId": "456e7890-e89b-12d3-a456-426614174001"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Joined session successfully",
  "activeUsers": 3
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/collaboration/sessions/550e8400-e29b-41d4-a716-446655440000/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "456e7890-e89b-12d3-a456-426614174001"
  }'
```

---

### DELETE `/sessions/:sessionId/leave`

Leave a collaboration session.

**Parameters:**
- `sessionId` (path, required): UUID of the collaboration session

**Request Body:**
```json
{
  "userId": "456e7890-e89b-12d3-a456-426614174001"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Left session successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/api/collaboration/sessions/550e8400-e29b-41d4-a716-446655440000/leave \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "456e7890-e89b-12d3-a456-426614174001"
  }'
```

---

### GET `/sessions/:sessionId/participants`

Get list of all participants in a session.

**Parameters:**
- `sessionId` (path, required): UUID of the collaboration session

**Response:** `200 OK`
```json
{
  "participants": [
    {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "userName": "John Smith",
      "status": "active",
      "joinedAt": "2025-10-07T14:30:00.000Z",
      "lastActivity": "2025-10-07T15:45:00.000Z"
    },
    {
      "userId": "456e7890-e89b-12d3-a456-426614174001",
      "userName": "Jane Doe",
      "status": "active",
      "joinedAt": "2025-10-07T14:35:00.000Z",
      "lastActivity": "2025-10-07T15:40:00.000Z"
    }
  ],
  "total": 2
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/collaboration/sessions/550e8400-e29b-41d4-a716-446655440000/participants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET `/sessions/:sessionId/stats`

Get session statistics (comments, edits, participants, duration).

**Parameters:**
- `sessionId` (path, required): UUID of the collaboration session

**Response:** `200 OK`
```json
{
  "stats": {
    "totalComments": 15,
    "totalEdits": 42,
    "totalParticipants": 3,
    "activeParticipants": 2,
    "duration": 4500000,
    "startTime": "2025-10-07T14:30:00.000Z",
    "lastActivity": "2025-10-07T15:45:00.000Z",
    "commentBreakdown": {
      "general": 5,
      "suggestion": 4,
      "question": 3,
      "approval": 2,
      "rejection": 1,
      "annotation": 0
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/collaboration/sessions/550e8400-e29b-41d4-a716-446655440000/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### DELETE `/sessions/:sessionId`

End a collaboration session (admin only).

**Parameters:**
- `sessionId` (path, required): UUID of the collaboration session

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Session ended successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/api/collaboration/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Comment Management Endpoints

### GET `/comments/policy/:policyId`

Get all comments for a specific policy.

**Parameters:**
- `policyId` (path, required): UUID of the policy document

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `resolved`, `deleted`)
- `commentType` (optional): Filter by type (`general`, `suggestion`, `question`, `approval`, `rejection`, `annotation`)
- `includeReplies` (optional): Include nested replies (default: true)
- `limit` (optional): Max comments to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "comments": [
    {
      "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "content": "This section needs review @[user-456]",
      "parentCommentId": null,
      "positionSelector": {
        "selector": "#section-3 > p:nth-child(2)",
        "textContent": "All residents must...",
        "startOffset": 0,
        "endOffset": 50
      },
      "status": "active",
      "commentType": "suggestion",
      "mentionedUsers": ["456e7890-e89b-12d3-a456-426614174001"],
      "likeCount": 3,
      "isPinned": false,
      "resolvedAt": null,
      "resolvedBy": null,
      "createdAt": "2025-10-07T14:35:00.000Z",
      "updatedAt": "2025-10-07T14:35:00.000Z",
      "replies": []
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:5000/api/collaboration/comments/policy/7c9e6679-7425-40de-944b-e07fc1f90ae7?status=active&includeReplies=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET `/comments/:commentId`

Get a specific comment by ID.

**Parameters:**
- `commentId` (path, required): UUID of the comment

**Response:** `200 OK`
```json
{
  "comment": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "content": "This section needs review @[user-456]",
    "parentCommentId": null,
    "positionSelector": {
      "selector": "#section-3 > p:nth-child(2)",
      "textContent": "All residents must...",
      "startOffset": 0,
      "endOffset": 50
    },
    "status": "active",
    "commentType": "suggestion",
    "mentionedUsers": ["456e7890-e89b-12d3-a456-426614174001"],
    "likeCount": 3,
    "isPinned": false,
    "resolvedAt": null,
    "resolvedBy": null,
    "createdAt": "2025-10-07T14:35:00.000Z",
    "updatedAt": "2025-10-07T14:35:00.000Z",
    "replies": []
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/collaboration/comments/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### POST `/comments`

Create a new comment.

**Request Body:**
```json
{
  "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "content": "This section needs review @[user-456]",
  "commentType": "suggestion",
  "parentCommentId": null,
  "positionSelector": {
    "selector": "#section-3 > p:nth-child(2)",
    "textContent": "All residents must...",
    "startOffset": 0,
    "endOffset": 50
  }
}
```

**Response:** `201 Created`
```json
{
  "comment": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "content": "This section needs review @[user-456]",
    "parentCommentId": null,
    "positionSelector": {
      "selector": "#section-3 > p:nth-child(2)",
      "textContent": "All residents must...",
      "startOffset": 0,
      "endOffset": 50
    },
    "status": "active",
    "commentType": "suggestion",
    "mentionedUsers": ["456e7890-e89b-12d3-a456-426614174001"],
    "likeCount": 0,
    "isPinned": false,
    "resolvedAt": null,
    "resolvedBy": null,
    "createdAt": "2025-10-07T14:35:00.000Z",
    "updatedAt": "2025-10-07T14:35:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/collaboration/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "content": "This section needs review @[user-456]",
    "commentType": "suggestion"
  }'
```

---

### PUT `/comments/:commentId`

Update an existing comment.

**Parameters:**
- `commentId` (path, required): UUID of the comment

**Request Body:**
```json
{
  "content": "Updated comment text",
  "commentType": "general"
}
```

**Response:** `200 OK`
```json
{
  "comment": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "content": "Updated comment text",
    "commentType": "general",
    "updatedAt": "2025-10-07T15:00:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:5000/api/collaboration/comments/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated comment text",
    "commentType": "general"
  }'
```

---

### DELETE `/comments/:commentId`

Delete a comment (soft delete).

**Parameters:**
- `commentId` (path, required): UUID of the comment

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/api/collaboration/comments/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### POST `/comments/:commentId/resolve`

Mark a comment as resolved.

**Parameters:**
- `commentId` (path, required): UUID of the comment

**Request Body:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:** `200 OK`
```json
{
  "comment": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "status": "resolved",
    "resolvedAt": "2025-10-07T15:10:00.000Z",
    "resolvedBy": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/collaboration/comments/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/resolve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

---

### POST `/comments/:commentId/reopen`

Reopen a resolved comment.

**Parameters:**
- `commentId` (path, required): UUID of the comment

**Request Body:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:** `200 OK`
```json
{
  "comment": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "status": "active",
    "resolvedAt": null,
    "resolvedBy": null
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/collaboration/comments/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/reopen \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

---

### POST `/comments/:commentId/like`

Like a comment.

**Parameters:**
- `commentId` (path, required): UUID of the comment

**Request Body:**
```json
{
  "userId": "456e7890-e89b-12d3-a456-426614174001"
}
```

**Response:** `200 OK`
```json
{
  "comment": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "likeCount": 4
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/collaboration/comments/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/like \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "456e7890-e89b-12d3-a456-426614174001"
  }'
```

---

### DELETE `/comments/:commentId/like`

Unlike a comment.

**Parameters:**
- `commentId` (path, required): UUID of the comment

**Request Body:**
```json
{
  "userId": "456e7890-e89b-12d3-a456-426614174001"
}
```

**Response:** `200 OK`
```json
{
  "comment": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "likeCount": 3
  }
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/api/collaboration/comments/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/like \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "456e7890-e89b-12d3-a456-426614174001"
  }'
```

---

### POST `/comments/:commentId/pin`

Pin a comment to the top.

**Parameters:**
- `commentId` (path, required): UUID of the comment

**Response:** `200 OK`
```json
{
  "comment": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "isPinned": true
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/collaboration/comments/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/pin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### DELETE `/comments/:commentId/pin`

Unpin a comment.

**Parameters:**
- `commentId` (path, required): UUID of the comment

**Response:** `200 OK`
```json
{
  "comment": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "isPinned": false
  }
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/api/collaboration/comments/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d/pin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET `/comments/mentions/:userId`

Get all comments where a user is mentioned.

**Parameters:**
- `userId` (path, required): UUID of the user

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `resolved`)
- `limit` (optional): Max comments to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "comments": [
    {
      "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      "policyId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "content": "Review this @[user-456]",
      "status": "active",
      "commentType": "suggestion",
      "createdAt": "2025-10-07T14:35:00.000Z"
    }
  ],
  "total": 1,
  "unreadCount": 1
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/collaboration/comments/mentions/456e7890-e89b-12d3-a456-426614174001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET `/comments/policy/:policyId/stats`

Get comment statistics for a policy.

**Parameters:**
- `policyId` (path, required): UUID of the policy

**Response:** `200 OK`
```json
{
  "stats": {
    "totalComments": 25,
    "activeComments": 20,
    "resolvedComments": 5,
    "commentsByType": {
      "general": 10,
      "suggestion": 8,
      "question": 4,
      "approval": 2,
      "rejection": 1,
      "annotation": 0
    },
    "totalLikes": 42,
    "totalReplies": 15,
    "pinnedComments": 3,
    "averageResolutionTime": 3600000
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/collaboration/comments/policy/7c9e6679-7425-40de-944b-e07fc1f90ae7/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid UUID format",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Session not found",
  "statusCode": 404
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "statusCode": 500
}
```

---

## Rate Limiting

**TODO:** Implement rate limiting middleware.

Proposed limits:
- 100 requests/minute per user (general endpoints)
- 10 requests/minute per user (POST/PUT/DELETE operations)
- 1000 requests/hour per IP address

---

## Authentication

**TODO:** Implement JWT authentication.

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token should contain:
- `userId`: UUID of the authenticated user
- `exp`: Expiration timestamp
- `iat`: Issued at timestamp

---

## Pagination

All list endpoints support pagination via query parameters:

- `limit`: Max items to return (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

Response includes pagination metadata:
```json
{
  "items": [...],
  "total": 250,
  "limit": 50,
  "offset": 100,
  "hasMore": true
}
```

---

## Versioning

API versioning (TODO): Future versions will use URL prefix:
- `/api/v1/collaboration/...`
- `/api/v2/collaboration/...`

Current version is implicit v1.

---

**End of REST API Reference**
