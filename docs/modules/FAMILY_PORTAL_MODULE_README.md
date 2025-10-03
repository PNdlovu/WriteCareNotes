# Family Portal Module – WriteCareNotes

## Overview

The Family Portal Module provides families with transparent, secure, and real-time access to resident care information, improving trust and engagement. This comprehensive module includes real-time notifications, care plan visibility, digital consent management, messaging, video calls, and daily wellbeing tracking.

## Features & Submodules

### 🔔 Real-Time Notifications
- **Instant Alerts**: Completed visits, medication given, incidents logged
- **Multi-Channel Delivery**: Email, SMS, push notifications, portal messages
- **Priority-Based**: Low, normal, high, and urgent notification levels
- **Firebase Integration**: Cross-platform push notifications for mobile and web

### 📋 Care Plan Visibility
- **Read-Only Access**: Secure viewing of resident care plans with consent
- **Role-Based Permissions**: Different access levels for different family members
- **Medical Information**: Controlled access based on family member authorization
- **Real-Time Updates**: Automatic updates when care plans change

### ✍️ Digital Consent Signing
- **Electronic Signatures**: Secure digital consent management
- **Multiple Consent Types**: Photo sharing, medical info, emergency contacts, etc.
- **Audit Trail**: Complete tracking of consent submissions and changes
- **Witness Support**: Optional witness verification for sensitive consents
- **Expiration Management**: Automatic renewal reminders and tracking

### 💬 Messaging & Video Calls
- **Secure Communication**: End-to-end encrypted messaging between families and care teams
- **Video Call Requests**: Schedule and manage video calls with residents
- **Message Threading**: Organized conversation history
- **File Attachments**: Share documents and photos securely
- **Priority Messaging**: Urgent message handling

### 📊 Daily Wellbeing & Activity Logs
- **Comprehensive Tracking**: Meals, activities, mood, social interactions
- **Photo Sharing**: Secure sharing of daily life moments
- **Health Metrics**: Vital signs and medication tracking (with consent)
- **Incident Reporting**: Transparent incident documentation
- **Quality Metrics**: Overall care quality scoring

### 📱 Multi-Channel Access
- **Web Portal**: Full-featured web interface
- **Mobile App**: Native mobile applications
- **Push Notifications**: Real-time alerts via Firebase
- **Responsive Design**: Works on all device sizes

## API Endpoints

### Core Endpoints
- `GET /api/family-portal/updates` - Get real-time updates
- `POST /api/family-portal/consent` - Submit digital consent
- `POST /api/family-portal/messages` - Send message to care team
- `GET /api/family-portal/careplan` - Get resident care plan
- `GET /api/family-portal/activities` - Get daily activities and wellbeing

### Communication Endpoints
- `GET /api/family-portal/messages` - Get family messages
- `PATCH /api/family-portal/messages/:messageId/read` - Mark message as read
- `POST /api/family-portal/video-call-request` - Request video call
- `GET /api/family-portal/notifications` - Get notifications
- `POST /api/family-portal/notifications/:notificationId/acknowledge` - Acknowledge notification

### Document & Preference Endpoints
- `GET /api/family-portal/documents` - Get authorized documents
- `GET /api/family-portal/documents/:documentId/download` - Download document
- `GET /api/family-portal/preferences` - Get family preferences
- `PUT /api/family-portal/preferences` - Update family preferences

### Feedback & Support
- `POST /api/family-portal/feedback` - Submit family feedback

## Database Entities

### FamilyMember
- **Primary Entity**: Represents family members with access to resident information
- **Access Levels**: Primary, secondary, emergency, limited
- **Permissions**: Medical info access, decision-making authority, consent signing
- **Preferences**: Communication, notification, privacy, and meeting preferences

### FamilyMessage
- **Communication**: Messages between family members and care team
- **Encryption**: End-to-end encrypted content
- **Priority Levels**: Low, normal, high, urgent
- **Message Types**: General, care updates, medical alerts, emergency, etc.

### FamilyConsent
- **Digital Signatures**: Secure consent management
- **Consent Types**: Photo sharing, medical info, emergency contacts, etc.
- **Audit Trail**: Complete tracking of consent lifecycle
- **Expiration Management**: Automatic renewal and reminders

### CareUpdate
- **Daily Tracking**: Comprehensive daily care updates
- **Mood & Activities**: Resident mood and activity participation
- **Meals & Health**: Meal tracking and health metrics
- **Photos & Media**: Secure photo and video sharing

### FamilyFeedback
- **Feedback Collection**: Structured feedback from family members
- **Rating System**: 1-5 scale ratings across multiple categories
- **Anonymous Option**: Option for anonymous feedback
- **Status Tracking**: Submitted, acknowledged, in review, resolved

### VisitRequest
- **Visit Management**: In-person, video, and phone call requests
- **Scheduling**: Flexible scheduling with approval workflow
- **Participant Management**: Multiple family member participation
- **Status Tracking**: Pending, approved, confirmed, completed

## Security & Compliance

### Audit Trail Logic
- **Complete Logging**: All family interactions logged with timestamps
- **User Tracking**: Who performed what action when
- **Data Changes**: Track all modifications to sensitive data
- **Consent Signatures**: Stored with timestamp and signer ID
- **End-to-End Encryption**: All sensitive communication encrypted

### Compliance Footprint
- **GDPR Compliance**: Explicit consent for family access and data processing
- **CQC Regulation 10**: Dignity and respect in care delivery
- **CQC Regulation 11**: Need for consent and family involvement
- **Mental Capacity Act 2005**: Proper consent management for vulnerable adults
- **Data Protection Act 2018**: Secure handling of personal data

### Security Features
- **Role-Based Access Control**: Different access levels for different family members
- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Secure Communication**: End-to-end encrypted messaging
- **Access Logging**: Complete audit trail of all access
- **Consent Management**: Proper consent tracking and management

## Real-Time Features

### Push Notifications
- **Firebase Integration**: Cross-platform push notifications
- **Priority-Based**: Different notification levels for different types of updates
- **Multi-Channel**: Email, SMS, push, and portal notifications
- **Customizable**: Family members can customize notification preferences

### Live Updates
- **WebSocket Support**: Real-time updates via WebSocket connections
- **Event-Driven**: Event-based architecture for real-time updates
- **Scalable**: Designed to handle high volumes of concurrent connections
- **Reliable**: Automatic reconnection and error handling

## Frontend Integration

### React Components
- **FamilyEngagementPortal**: Main portal component
- **useFamilyEngagement**: Custom hook for family engagement functionality
- **Real-Time Updates**: Live updates using React Query and WebSockets
- **Responsive Design**: Mobile-first responsive design

### Mobile Support
- **React Native**: Native mobile app support
- **Push Notifications**: Firebase push notification integration
- **Offline Support**: Offline capability for viewing cached data
- **Biometric Security**: Fingerprint and face ID support

## Configuration

### Environment Variables
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id

# Database Configuration
DATABASE_URL=your-database-url

# Encryption Configuration
ENCRYPTION_KEY=your-encryption-key

# Notification Configuration
EMAIL_SERVICE_API_KEY=your-email-api-key
SMS_SERVICE_API_KEY=your-sms-api-key
```

### Database Migrations
The module includes comprehensive database migrations for all entities:
- Family members and relationships
- Message and communication tables
- Consent management tables
- Care update and activity tracking
- Feedback and visit request tables

## Usage Examples

### Getting Family Dashboard
```typescript
const dashboard = await familyPortalService.getFamilyDashboard(familyId, residentId);
```

### Submitting Digital Consent
```typescript
const consent = await familyPortalService.submitDigitalConsent({
  residentId: 'resident-123',
  familyId: 'family-456',
  consentType: 'photo_sharing',
  granted: true,
  digitalSignature: {
    signature: 'base64-signature',
    timestamp: new Date(),
  },
});
```

### Sending Real-Time Notification
```typescript
await familyPortalService.sendRealTimeNotification(familyId, residentId, {
  type: 'care_update',
  title: 'Daily Care Update',
  message: 'New care summary is available',
  priority: 'normal',
});
```

## Monitoring & Analytics

### Health Checks
- **Service Health**: Firebase service health monitoring
- **Database Health**: Database connection and query performance
- **Notification Health**: Push notification delivery rates
- **API Health**: Endpoint response times and error rates

### Analytics
- **Family Engagement**: Track family portal usage and engagement
- **Notification Delivery**: Monitor notification delivery rates
- **Consent Tracking**: Track consent submission and renewal rates
- **Feedback Analysis**: Analyze family feedback and satisfaction

## Development

### Prerequisites
- Node.js 18+
- TypeScript 4.9+
- PostgreSQL 13+
- Firebase project setup
- Redis for caching (optional)

### Installation
```bash
npm install
npm run build
npm run migrate
npm run start
```

### Testing
```bash
npm run test
npm run test:e2e
npm run test:coverage
```

## Support

For technical support or questions about the Family Portal Module:
- **Documentation**: See inline code documentation
- **API Reference**: Check the API documentation endpoint
- **Issues**: Report issues through the project issue tracker
- **Contact**: WriteCareNotes Team

## License

This module is part of the WriteCareNotes platform and is subject to the same licensing terms.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Author**: WriteCareNotes Team