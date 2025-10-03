---
inclusion: always
---

# WriteCareNotes Completion Tracker Guidelines

## File Verification Requirements

Every completed task MUST verify the following files exist and are functional:

### Backend Verification Checklist
- [ ] Service class implemented with full business logic
- [ ] Repository/DAO layer with database operations
- [ ] API routes with proper middleware
- [ ] Input validation schemas (Joi/Zod)
- [ ] Error handling and logging
- [ ] Unit tests with 90%+ coverage
- [ ] Integration tests for API endpoints
- [ ] OpenAPI documentation generated

### Frontend Verification Checklist  
- [ ] React components with TypeScript interfaces
- [ ] State management (Redux/Zustand) if needed
- [ ] Form validation and error handling
- [ ] Responsive design implementation
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Component tests with React Testing Library
- [ ] Storybook stories for UI components
- [ ] i18n implementation for all text

### Database Verification Checklist
- [ ] Migration files created and tested
- [ ] Seed data for development/testing
- [ ] Indexes for performance optimization
- [ ] Foreign key constraints properly defined
- [ ] Audit trail columns (created_at, updated_at, deleted_at)
- [ ] Database tests for complex queries

### Integration Verification Checklist
- [ ] External API integrations tested
- [ ] Error handling for network failures
- [ ] Retry mechanisms implemented
- [ ] Rate limiting respected
- [ ] Authentication/authorization working
- [ ] Data transformation/mapping correct

### Security Verification Checklist
- [ ] Input sanitization implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection in place
- [ ] CSRF tokens implemented
- [ ] Sensitive data encrypted
- [ ] Audit logs capturing all operations
- [ ] Role-based access control working

### Documentation Verification Checklist
- [ ] README.md updated with new functionality
- [ ] API documentation auto-generated
- [ ] Code comments explaining business logic
- [ ] Architecture decision records (ADRs) if applicable
- [ ] Deployment instructions updated
- [ ] Troubleshooting guide updated

## Completion Verification Commands

Run these commands to verify completion:

```bash
# Test Coverage
npm run test:coverage

# API Documentation
npm run docs:generate

# Security Scan
npm audit
npm run security:scan

# Performance Test
npm run test:performance

# E2E Tests
npm run test:e2e

# Build Verification
npm run build
docker build -t writecarenotes .

# Database Migration Test
npm run db:migrate:test
npm run db:seed:test
```

## Real-World Testing Framework

### Testing Stack
- **Unit Testing**: Jest + @testing-library/react
- **API Testing**: Supertest + Jest
- **E2E Testing**: Cypress or Playwright
- **Performance Testing**: Artillery or k6
- **Security Testing**: OWASP ZAP integration
- **Database Testing**: Jest with test database

### Test Data Management
- Use factories for test data generation
- Implement database seeding for consistent test states
- Use separate test databases
- Clean up test data after each test suite

### Continuous Integration
- All tests must pass before merge
- Code coverage must be maintained at 90%+
- Security scans must pass
- Performance benchmarks must be met
- Documentation must be updated

## File Creation Verification

After completing each task, verify these files exist:

```
src/
├── services/[module]/
│   ├── [module].service.ts
│   ├── [module].repository.ts
│   ├── [module].types.ts
│   └── __tests__/
├── api/routes/
│   ├── [module].routes.ts
│   └── __tests__/
├── components/[module]/
│   ├── [Module]List.tsx
│   ├── [Module]Form.tsx
│   ├── [Module]Detail.tsx
│   └── __tests__/
├── database/
│   ├── migrations/
│   └── seeds/
└── docs/
    ├── api/
    └── modules/
```

## Quality Gates

Before marking any task as complete:

1. **Functionality Gate**: All features work as specified
2. **Testing Gate**: All tests pass with required coverage
3. **Security Gate**: Security scan passes
4. **Performance Gate**: Meets performance requirements
5. **Documentation Gate**: All documentation updated
6. **Integration Gate**: Works with existing system
7. **Compliance Gate**: Meets regulatory requirements