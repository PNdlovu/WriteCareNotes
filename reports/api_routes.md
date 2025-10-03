# API Routes

## Route Summary

Based on code analysis of route files, the following API endpoints have been identified:

### Healthcare Integration Routes (`src/routes/healthcare-integration.ts`)

| Method | Path | Middleware Stack | Auth Required | Evidence |
|--------|------|------------------|---------------|----------|
| POST | `/nhs/prescriptions/sync` | correlation, performance, authenticateToken, compliance, audit | Yes | Line 159 |
| POST | `/gp/medications/reconcile` | correlation, performance, authenticateToken, compliance, audit | Yes | Line 262 |
| POST | `/pharmacy/prescriptions/submit` | correlation, performance, authenticateToken, compliance, audit | Yes | Line 367 |
| POST | `/hospital/medications/transfer` | correlation, performance, authenticateToken, compliance, audit | Yes | Line 474 |
| GET | `/drugs/information` | correlation, performance, authenticateToken, compliance, audit | Yes | Line 567 |
| GET | `/monitoring` | correlation, performance, authenticateToken, compliance, audit | Yes | Line 644 |
| POST | `/override/enable` | correlation, performance, authenticateToken, compliance, audit | Yes | Line 713 |
| GET | `/systems/status` | correlation, performance, authenticateToken, compliance, audit | Yes | Line 782 |
| POST | `/test/connectivity` | correlation, performance, authenticateToken, compliance, audit | Yes | Line 860 |

### Facilities Management Routes

| Method | Path | Handler File | Authorization | Evidence |
|--------|------|--------------|---------------|----------|
| POST | `/assets` | `src/routes/facilities.ts` | facilities_manager, admin | Line 14 |
| GET | `/analytics` | `src/routes/facilities.ts` | facilities_manager, admin | Line 15 |

### Inventory Management Routes

| Method | Path | Handler File | Authorization | Evidence |
|--------|------|--------------|---------------|----------|
| POST | `/items` | `src/routes/inventory-management.ts` | inventory_manager, admin | Line 14 |
| POST | `/rfid/scan` | `src/routes/inventory-management.ts` | inventory_staff, admin | Line 15 |
| GET | `/analytics` | `src/routes/inventory-management.ts` | inventory_manager, admin | Line 16 |

## Middleware Analysis

### Common Middleware Patterns

1. **Healthcare Integration**: Full middleware stack including correlation, performance, authentication, compliance, and audit
2. **Facilities/Inventory**: Authentication and audit middleware
3. **Authorization**: Role-based access control with specific role requirements

### Authentication & Authorization

- **Authentication**: All routes require authentication via `authenticateToken` or `authenticate` middleware
- **Authorization**: Role-based authorization with specific role requirements (facilities_manager, admin, inventory_manager, etc.)
- **Audit**: All routes include audit middleware for compliance tracking

## Contract Verification

### Frontend-Backend Alignment

All identified UI components have corresponding backend routes:
- MedicationDashboard → medication-management.ts, medication-inventory.ts
- ClinicalSafetyDashboard → medication-compliance.ts, medication-interaction.ts
- ControlledSubstancesRegister → controlled-substances.ts
- HealthcareIntegration → healthcare-integration.ts
- ConsentManagementDashboard → consent.ts

### Schema Validation

Evidence of validation middleware and schema definitions found in:
- `src/services/validation/ValidationService.ts` (Joi schemas)
- `src/services/workforce/ShiftHandoverService.ts` (class-validator)

## API Contract Issues

No contract drift detected - all frontend components align with backend route definitions.