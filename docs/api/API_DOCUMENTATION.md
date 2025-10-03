# WriteCareNotes AI Features API Documentation

## 🚀 **Overview**

The WriteCareNotes AI Features API provides comprehensive endpoints for managing AI-powered care home operations, including agent management, voice assistance, predictive analytics, and wellness tracking.

**Base URL**: `https://api.writecarenotes.com`  
**Version**: `1.0.0`  
**Authentication**: JWT Bearer Token

---

## 🔐 **Authentication**

All API endpoints (except health checks) require authentication using JWT Bearer tokens.

```http
Authorization: Bearer <your-jwt-token>
```

### User Roles
- `admin` - Full access to all features
- `manager` - Access to most features, limited admin functions
- `nurse` - Access to care-related features
- `staff` - Basic access to assigned features

---

## 🏥 **Health Check Endpoints**

### Basic Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 45678912,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1024000
  },
  "version": "1.0.0",
  "environment": "production"
}
```

### Comprehensive Health Check
```http
GET /api/health/comprehensive
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "checkTime": 150,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "basic": { "status": "OK" },
    "aiFeatures": { "status": "OK" },
    "database": { "status": "OK" },
    "redis": { "status": "OK" },
    "externalServices": { "status": "OK" }
  }
}
```

### AI Features Health Check
```http
GET /api/health/ai-features
```

**Response:**
```json
{
  "status": "OK",
  "message": "AI features health check completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "features": {
    "agentConsole": { "status": "OK", "activeAgents": 5 },
    "voiceAssistant": { "status": "OK", "voiceRecognitionEnabled": true },
    "predictiveAnalytics": { "status": "OK", "activeModels": 3 },
    "emotionTracking": { "status": "OK", "sentimentAnalysisEnabled": true },
    "aiDocumentation": { "status": "OK", "autoGenerationEnabled": true }
  }
}
```

---

## 🤖 **Agent Console Endpoints**

### Get Agent Metrics
```http
GET /api/ai-agents/metrics
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "voice_to_note",
    "name": "Voice-to-Note Agent",
    "status": "idle",
    "lastActivity": "2024-01-15T10:25:00.000Z",
    "processedCount": 1250,
    "errorCount": 12,
    "averageProcessingTime": 1200,
    "successRate": 99.04,
    "uptime": 24,
    "memoryUsage": 45.2,
    "cpuUsage": 12.5,
    "capabilities": ["transcription", "note_generation"],
    "healthScore": 95.5
  }
]
```

### Get System Health
```http
GET /api/ai-agents/health
```

**Response:**
```json
{
  "totalAgents": 5,
  "activeAgents": 4,
  "errorAgents": 0,
  "disabledAgents": 1,
  "totalRequests": 15420,
  "successfulRequests": 15380,
  "failedRequests": 40,
  "averageResponseTime": 850,
  "systemUptime": 168,
  "memoryUsage": 65.2,
  "cpuUsage": 25.8,
  "queueSize": 3,
  "lastHealthCheck": "2024-01-15T10:30:00.000Z"
}
```

### Toggle Agent Status
```http
POST /api/ai-agents/{agentId}/toggle
```

**Body:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent enabled successfully"
}
```

---

## 🎤 **Voice Assistant Endpoints**

### Process Hands-free Command
```http
POST /api/voice-assistant/hands-free
```

**Body:**
```json
{
  "command": "Log medication for John Smith",
  "device": "mobile",
  "location": "Room 101"
}
```

**Response:**
```json
{
  "id": "voice_cmd_1234567890",
  "command": "Log medication for John Smith",
  "intent": "medication_logging",
  "parameters": {
    "residentName": "John Smith",
    "medicationType": "medication"
  },
  "userId": "user_123",
  "tenantId": "tenant_456",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "confidence": 0.92,
  "response": "I've logged the medication information for John Smith. The details have been recorded and will be reviewed by the clinical team.",
  "status": "processed",
  "executionTime": 850
}
```

### Log Medication by Voice
```http
POST /api/voice-assistant/medication-log
```

**Body:**
```json
{
  "voiceTranscript": "Administered paracetamol 500mg at 2pm to John Smith",
  "residentId": "resident_123"
}
```

**Response:**
```json
{
  "id": "med_log_1234567890",
  "residentId": "resident_123",
  "medicationName": "paracetamol",
  "dosage": "500mg",
  "time": "2024-01-15T14:00:00.000Z",
  "administeredBy": "user_123",
  "notes": "Administered as prescribed",
  "voiceTranscript": "Administered paracetamol 500mg at 2pm to John Smith",
  "confidence": 0.88,
  "status": "completed",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Activate Emergency Protocol
```http
POST /api/voice-assistant/emergency-protocol
```

**Body:**
```json
{
  "voiceTranscript": "Emergency in Room 101, resident has fallen",
  "residentId": "resident_123",
  "location": "Room 101"
}
```

**Response:**
```json
{
  "id": "emergency_1234567890",
  "residentId": "resident_123",
  "emergencyType": "medical",
  "severity": "high",
  "location": "Room 101",
  "voiceTranscript": "Emergency in Room 101, resident has fallen",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "active",
  "actions": [
    {
      "id": "action_1",
      "action": "Notify medical staff",
      "assignedTo": "medical_team",
      "status": "pending",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧠 **Predictive Health Analytics Endpoints**

### Generate Health Prediction
```http
POST /api/predictive-health/generate-prediction
```

**Body:**
```json
{
  "residentId": "resident_123",
  "predictionType": "health_deterioration",
  "timeframe": "short_term"
}
```

**Response:**
```json
{
  "id": "prediction_1234567890",
  "residentId": "resident_123",
  "predictionType": "health_deterioration",
  "confidence": 0.85,
  "predictedValue": 75.5,
  "factors": [
    {
      "id": "factor_001",
      "name": "Blood Pressure",
      "type": "vital_signs",
      "weight": 0.3,
      "value": 140,
      "impact": "negative",
      "description": "Elevated blood pressure",
      "confidence": 0.9
    }
  ],
  "recommendations": [
    {
      "id": "rec_001",
      "type": "medication",
      "title": "Review Blood Pressure Medication",
      "description": "Consider adjusting blood pressure medication dosage",
      "priority": "high",
      "expectedOutcome": "Improved blood pressure control",
      "timeline": "Within 1 week"
    }
  ],
  "timeframe": "short_term",
  "status": "active",
  "riskLevel": "medium",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Analyze Health Trends
```http
GET /api/predictive-health/{residentId}/trends?period=30d
```

**Response:**
```json
[
  {
    "id": "trend_1234567890",
    "residentId": "resident_123",
    "metric": "vital_signs",
    "direction": "declining",
    "rate": -5.2,
    "significance": "medium",
    "timeframe": "30d",
    "dataPoints": [
      {
        "timestamp": "2024-01-15T10:30:00.000Z",
        "value": 75.5,
        "confidence": 0.8,
        "source": "vital_signs_monitor"
      }
    ],
    "confidence": 0.8,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Get Health Dashboard
```http
GET /api/predictive-health/{residentId}/dashboard
```

**Response:**
```json
{
  "residentId": "resident_123",
  "overallHealthScore": 78.5,
  "riskLevel": "medium",
  "activePredictions": 3,
  "activeAlerts": 1,
  "recentInsights": 5,
  "trends": [...],
  "predictions": [...],
  "alerts": [...],
  "insights": [...],
  "recommendations": [...],
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

---

## 😊 **Emotion & Wellness Tracking Endpoints**

### Record Emotion Reading
```http
POST /api/wellness/emotion-reading
```

**Body:**
```json
{
  "residentId": "resident_123",
  "emotionType": "happy",
  "intensity": 0.8,
  "source": "staff_observation",
  "context": "Participated in group activity",
  "triggers": ["social_interaction", "music"],
  "duration": 30,
  "location": "Activity Room",
  "staffPresent": ["nurse_001", "care_worker_002"]
}
```

**Response:**
```json
{
  "id": "emotion_1234567890",
  "residentId": "resident_123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "emotionType": "happy",
  "intensity": 0.8,
  "confidence": 0.85,
  "source": "staff_observation",
  "context": "Participated in group activity",
  "triggers": ["social_interaction", "music"],
  "duration": 30,
  "location": "Activity Room",
  "staffPresent": ["nurse_001", "care_worker_002"],
  "metadata": {
    "processingTime": 150,
    "modelVersion": "1.0.0"
  }
}
```

### Analyze Sentiment
```http
POST /api/wellness/sentiment-analysis
```

**Body:**
```json
{
  "residentId": "resident_123",
  "text": "I had a wonderful day today, the staff were very kind",
  "source": "voice_transcript"
}
```

**Response:**
```json
{
  "id": "sentiment_1234567890",
  "residentId": "resident_123",
  "text": "I had a wonderful day today, the staff were very kind",
  "sentiment": "positive",
  "confidence": 0.92,
  "emotions": [
    {
      "emotion": "happy",
      "intensity": 0.8
    },
    {
      "emotion": "content",
      "intensity": 0.7
    }
  ],
  "keywords": ["wonderful", "day", "staff", "kind"],
  "topics": ["social", "satisfaction"],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "voice_transcript"
}
```

### Track Wellness Metric
```http
POST /api/wellness/wellness-metric
```

**Body:**
```json
{
  "residentId": "resident_123",
  "metricType": "mood",
  "value": 85,
  "source": "ai_analysis",
  "unit": "%",
  "notes": "Based on voice analysis and behavioral patterns"
}
```

**Response:**
```json
{
  "id": "metric_1234567890",
  "residentId": "resident_123",
  "metricType": "mood",
  "value": 85,
  "unit": "%",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "ai_analysis",
  "confidence": 0.88,
  "trend": "stable",
  "baseline": 80,
  "target": 85,
  "status": "normal",
  "notes": "Based on voice analysis and behavioral patterns"
}
```

### Get Wellness Dashboard
```http
GET /api/wellness/{residentId}/dashboard
```

**Response:**
```json
{
  "residentId": "resident_123",
  "overallMoodScore": 82.5,
  "moodTrend": "improving",
  "dominantEmotions": [
    {
      "emotion": "happy",
      "frequency": 15,
      "averageIntensity": 0.75
    },
    {
      "emotion": "content",
      "frequency": 12,
      "averageIntensity": 0.65
    }
  ],
  "recentEmotions": [...],
  "wellnessMetrics": [...],
  "behavioralPatterns": [...],
  "insights": [...],
  "recommendations": [...],
  "alerts": [...],
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### Generate Activity Recommendations
```http
POST /api/wellness/activity-recommendations
```

**Body:**
```json
{
  "residentId": "resident_123",
  "currentMood": "sad",
  "preferences": ["music", "art", "social"]
}
```

**Response:**
```json
[
  {
    "id": "rec_1234567890",
    "type": "activity",
    "title": "Music Therapy Session",
    "description": "Participate in a group music therapy session",
    "priority": "high",
    "expectedOutcome": "Improved mood and social engagement",
    "effort": "low",
    "resources": ["music_room", "therapist"],
    "timeline": "Within 2 hours",
    "successProbability": 0.85,
    "cost": 0,
    "implementationSteps": [
      "Schedule music therapy session",
      "Transport resident to music room",
      "Facilitate group participation"
    ],
    "monitoringRequired": true,
    "reviewDate": "2024-01-15T12:30:00.000Z",
    "category": "mood_enhancement"
  }
]
```

---

## 📊 **Error Responses**

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Required fields are missing",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Access token required",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔧 **Rate Limiting**

API endpoints are rate-limited to ensure fair usage:

- **Health Checks**: 100 requests per 15 minutes
- **Agent Console**: 100 requests per 15 minutes
- **Voice Assistant**: 200 requests per 15 minutes
- **Predictive Health**: 100 requests per 15 minutes
- **Wellness Tracking**: 200 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

---

## 📝 **Pagination**

List endpoints support pagination:

**Query Parameters:**
- `limit` - Number of items per page (default: 50, max: 100)
- `offset` - Number of items to skip (default: 0)

**Response Headers:**
```
X-Total-Count: 1250
X-Page-Limit: 50
X-Page-Offset: 0
X-Has-Next: true
```

---

## 🔍 **Filtering & Sorting**

Many endpoints support filtering and sorting:

**Query Parameters:**
- `filter` - JSON object with filter criteria
- `sort` - Field to sort by (e.g., `createdAt`, `-createdAt` for descending)
- `search` - Text search across relevant fields

**Example:**
```
GET /api/wellness/resident_123/emotion-history?filter={"emotionType":"happy"}&sort=-timestamp&limit=20
```

---

## 📱 **Webhooks**

The API supports webhooks for real-time notifications:

**Webhook Events:**
- `emotion.recorded` - New emotion reading recorded
- `health.prediction.generated` - New health prediction generated
- `voice.command.processed` - Voice command processed
- `wellness.alert.created` - New wellness alert created

**Webhook Payload:**
```json
{
  "event": "emotion.recorded",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "emotionId": "emotion_1234567890",
    "residentId": "resident_123",
    "emotionType": "happy",
    "intensity": 0.8
  }
}
```

---

## 🧪 **Testing**

### Test Environment
- **Base URL**: `https://test-api.writecarenotes.com`
- **Test Data**: Pre-populated with sample residents and data
- **Rate Limits**: 10x higher than production

### Postman Collection
A complete Postman collection is available for testing all endpoints.

### SDKs
- **JavaScript/TypeScript**: `@writecarenotes/sdk`
- **Python**: `writecarenotes-python`
- **Java**: `writecarenotes-java`

---

## 📞 **Support**

- **Documentation**: [https://docs.writecarenotes.com](https://docs.writecarenotes.com)
- **API Status**: [https://status.writecarenotes.com](https://status.writecarenotes.com)
- **Support Email**: api-support@writecarenotes.com
- **GitHub Issues**: [https://github.com/writecarenotes/api/issues](https://github.com/writecarenotes/api/issues)

---

**Last Updated**: January 15, 2024  
**API Version**: 1.0.0  
**Status**: ✅ Production Ready