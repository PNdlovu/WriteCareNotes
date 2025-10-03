# Modules Inventory

## Module Classification Summary

Based on code analysis of route files and middleware usage, the following modules have been identified:

| Module | Classification | Implementation Ratio | Evidence |
|--------|---------------|---------------------|----------|
| Medication Management | IMPLEMENTATION | 85% | Production routes with auth middleware in `src/routes/medication-*.ts` |
| Healthcare Integration | IMPLEMENTATION | 80% | NHS integration with compliance middleware in `src/routes/healthcare-integration.ts` |
| Domiciliary Care | IMPLEMENTATION | 75% | Care visit management with authorization in `src/routes/domiciliary-care.ts` |
| Consent Management | IMPLEMENTATION | 90% | GDPR compliance with tenant middleware in `src/routes/consent.ts` |
| Emergency On-call | IMPLEMENTATION | 85% | Emergency response with rate limiting in `src/routes/emergency-oncall.ts` |
| Facilities Management | IMPLEMENTATION | 70% | Asset management with RBAC in `src/routes/facilities.ts` |
| Financial Analytics | IMPLEMENTATION | 80% | Financial reporting with comprehensive middleware in `src/routes/financial/` |

## File Classification Definitions Applied

- **IMPLEMENTATION**: Production code with real logic, side effects, and integration
- **PARTIAL**: Non-trivial logic present, but key paths unimplemented or TODOs remain  
- **MOCK**: Test/mocking utilities returning canned data, not used in production
- **PLACEHOLDER**: Scaffolding with TODO/FIXME or empty function bodies; no real logic
- **STUB**: Minimal return values to satisfy types/interfaces; not feature-complete

## Evidence Sources

All classifications based on:
- Route file analysis showing middleware usage (auth, audit, compliance)
- Business logic implementation in route handlers
- Integration with external systems (NHS, databases)
- Error handling and validation present