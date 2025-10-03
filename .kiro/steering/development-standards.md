---
inclusion: always
---

# WriteCareNotes Development Standards

## Project Overview
WriteCareNotes is a British Isles Adult Care Home Management System that must meet healthcare regulatory standards, security certifications, and audit requirements.

## Core Development Principles

### 1. Complete Module Development
Every module MUST include:
- **Backend Service** - Full business logic implementation
- **API Endpoints** - RESTful API with OpenAPI documentation
- **Frontend Components** - React components with TypeScript
- **Database Schema** - Migrations and seed data
- **Integration Tests** - End-to-end functionality verification
- **Unit Tests** - 90%+ code coverage required
- **Documentation** - Comprehensive inline and external docs

### 2. Test-Driven Development (TDD)
- Write tests BEFORE implementation
- Use Jest for unit testing
- Use Supertest for API testing
- Use Cypress for E2E testing
- Use React Testing Library for component testing
- All tests must pass before code completion

### 3. API-First Design
- Design APIs before implementation
- Use OpenAPI 3.0 specification
- Implement API versioning (v1, v2, etc.)
- Follow RESTful conventions
- Include comprehensive error handling
- Implement rate limiting and security headers

### 4. Security Essentials
- Implement OWASP Top 10 protections
- Use JWT with refresh tokens
- Encrypt sensitive data (AES-256)
- Implement RBAC (Role-Based Access Control)
- Add audit logging for all operations
- Follow GDPR and Data Protection Act 2018
- Prepare for ISO 27001, SOC 2, and healthcare audits

### 5. Documentation Requirements
Every file MUST include:
```typescript
/**
 * @fileoverview Brief description of file purpose
 * @module ModuleName
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Detailed description of what this file does,
 * its role in the system, and how it integrates with other components.
 * 
 * @example
 * // Usage example
 * const service = new ResidentService();
 * const resident = await service.createResident(data);
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Implements data encryption for PII
 * - Follows GDPR data protection requirements
 * - Includes audit trail for all operations
 */
```

### 6. Database Standards
- Use PostgreSQL for primary data
- Implement proper indexing for performance
- Use database migrations for schema changes
- Include seed data for testing
- Implement soft deletes for audit trails
- Use connection pooling for performance

### 7. Language Support
- Implement i18n from the start
- Support English (UK), Welsh, Scottish Gaelic, Irish
- Use react-i18next for frontend
- Use i18next for backend
- Store translations in JSON files

### 8. Performance Requirements
- API response times < 200ms for standard operations
- Database queries optimized with proper indexes
- Implement caching with Redis
- Use CDN for static assets
- Implement lazy loading for large datasets

### 9. Monitoring and Logging
- Implement structured logging with Winston
- Use correlation IDs for request tracking
- Monitor application performance with APM
- Set up health checks for all services
- Implement alerting for critical issues

### 10. Deployment Standards
- Use Docker for containerization
- Implement CI/CD with automated testing
- Use environment-specific configurations
- Implement blue-green deployments
- Include rollback procedures