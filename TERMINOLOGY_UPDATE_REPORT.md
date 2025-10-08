# Care Home Terminology Update Report

**Date:** October 7, 2025  
**Status:** ✅ Analysis Complete - Ready for Implementation

---

## Executive Summary

Analysis of 100+ instances of "healthcare" terminology reveals a **strategic approach** is needed:

### ✅ KEEP "Healthcare" When Referring To:
- NHS healthcare systems and integration
- GP Connect and medical provider communication  
- FHIR/HL7 medical data standards
- "NHS Continuing Healthcare" (official term)
- Medical prescriptions and clinical systems
- Healthcare regulations (MHRA, NHS Digital)
- Technical integrations with healthcare providers

### 🔄 CHANGE "Healthcare" to "Care Home" When:
- Describing care home organizations
- File names for care home-specific services
- User-facing terminology
- Business context and descriptions
- General system descriptions

---

## Files Requiring Updates

### 1. File Renames (2 files)

#### ✅ HIGH PRIORITY - Service Files

**File:** `src/services/medication/HealthcareSystemIntegrationService.ts`
- **Rename to:** `CareHomeSystemIntegrationService.ts`
- **Impact:** Medium (1 test file imports this)
- **Related:** Update import in `src/services/resident/__tests__/ResidentService.test.ts`

**File:** `src/services/caching/HealthcareCacheManager.ts`
- **Rename to:** `CareHomeCacheManager.ts`
- **Impact:** Medium (1 test file imports this)
- **Related:** Update import in `src/services/resident/__tests__/ResidentService.test.ts`

---

### 2. Content Updates (Strategic Changes)

#### User Entity (`src/entities/user.entity.ts`)
**Lines:** 2, 5, 12

**BEFORE:**
```typescript
/**
 * @fileoverview User Entity - Core user management for healthcare system
 * @description Complete user entity with healthcare-specific fields and GDPR compliance
 * User role enumeration for healthcare organizations
 */
```

**AFTER:**
```typescript
/**
 * @fileoverview User Entity - Core user management for care home system
 * @description Complete user entity with care home-specific fields and GDPR compliance
 * User role enumeration for care home organizations
 */
```

---

#### Organization Entity (`src/entities/organization.entity.ts`)
**Line:** 2

**BEFORE:**
```typescript
/**
 * @fileoverview Organization Entity - Healthcare organization management
 */
```

**AFTER:**
```typescript
/**
 * @fileoverview Organization Entity - Care home organization management
 */
```

---

#### AI Policy Assistant (`src/services/policy-authoring-assistant/PolicyAuthoringAssistantService.ts`)
**Lines:** 16, 28

**BEFORE:**
```typescript
 * World-first RAG-based AI assistant for healthcare policy authoring
 * - ONLY RAG-based policy assistant in British Isles healthcare
```

**AFTER:**
```typescript
 * World-first RAG-based AI assistant for care home policy authoring
 * - ONLY RAG-based policy assistant in British Isles care homes
```

---

#### Express Types (`src/types/express.d.ts`)
**Line:** 11

**BEFORE:**
```typescript
 * healthcare-specific request context and user information.
```

**AFTER:**
```typescript
 * care home-specific request context and user information.
```

---

#### Date Utils (`src/utils/dateUtils.ts`)
**Line:** 11

**BEFORE:**
```typescript
 * with healthcare-specific date handling requirements.
```

**AFTER:**
```typescript
 * with care home-specific date handling requirements.
```

---

#### Template Engine Service (`src/services/template-engine/template-engine.service.ts`)
**Line:** 34

**BEFORE:**
```typescript
 * - Healthcare data processing standards
```

**AFTER:**
```typescript
 * - Care home data processing standards
```

---

#### Enterprise Security Service (`src/services/security/enterprise-security.service.ts`)
**Lines:** 26, 120

**BEFORE:**
```typescript
 * - Healthcare Security Standards
 * threat detection, and compliance monitoring for multi-tenant healthcare environments.
```

**AFTER:**
```typescript
 * - Care Home Security Standards
 * threat detection, and compliance monitoring for multi-tenant care home environments.
```

---

#### AI Data Mapping Service (`src/services/migration/AIDataMappingService.ts`)
**Line:** 2

**BEFORE:**
```typescript
 * @fileoverview Advanced AI-powered data mapping service for healthcare data migration
```

**AFTER:**
```typescript
 * @fileoverview Advanced AI-powered data mapping service for care home data migration
```

---

### 3. DO NOT CHANGE (Keep "Healthcare")

These references are **CORRECT** and should **NOT** be changed:

#### ✅ Medical/Clinical Context
- `NHS Continuing Healthcare` - Official government term
- `healthcare providers` - Referring to GPs, doctors, NHS
- `healthcare integration` - NHS Digital, GP Connect integration
- Blog content about NHS healthcare integration (accurate technical description)
- `healthcare data protection` in cyber resilience context
- RQIA standards mention "Healthcare" as official requirement
- Error codes like `HEALTHCARE_PATIENT_NOT_FOUND` (medical context)

#### ✅ Technical/Compliance Context
- Cyber Resilience Act healthcare context (regulatory)
- UK Cyber Essentials for healthcare applications (certification)
- DSPT and healthcare compliance (NHS requirements)
- AI Policy Assistant templates (regulatory compliance text)
- Migration service healthcare field mappings (legacy system compatibility)

---

## Implementation Strategy

### Phase 1: File Renames (30 minutes)
1. Rename `HealthcareSystemIntegrationService.ts` → `CareHomeSystemIntegrationService.ts`
2. Rename `HealthcareCacheManager.ts` → `CareHomeCacheManager.ts`
3. Update class names inside files
4. Update test file imports

### Phase 2: Strategic Content Updates (2-3 hours)
1. Update entity documentation (2 files)
2. Update service descriptions (5 files)
3. Update type definitions (1 file)
4. Update utility documentation (1 file)

### Phase 3: Verification (30 minutes)
1. Run TypeScript compiler: `npm run build`
2. Run tests: `npm test`
3. Verify no broken imports
4. Check for compilation errors

---

## Impact Assessment

### ⚠️ Breaking Changes
- **None** - All changes are internal refactoring
- File renames require import updates (2 files)
- No API changes
- No database schema changes

### ✅ Benefits
- **Professional branding** - "Care home" is more appropriate than "healthcare"
- **Market clarity** - Clear positioning as care home software
- **User confidence** - Terminology matches customer expectations
- **Regulatory accuracy** - Maintains correct NHS/healthcare terminology where required

### 📊 Statistics
- **Files to rename:** 2
- **Content updates:** 9 files, ~15 lines
- **Test files affected:** 1
- **Estimated time:** 3-4 hours total
- **Risk level:** LOW ✅

---

## Decision Matrix

| Use "Care Home" When... | Use "Healthcare" When... |
|------------------------|-------------------------|
| Describing the software platform | Referring to NHS systems |
| Describing care home organizations | Referring to medical providers |
| User-facing documentation | Technical NHS integrations |
| Marketing materials | Regulatory compliance text |
| Business context | Clinical/medical context |
| Internal system descriptions | Government healthcare programs |

---

## Validation Checklist

Before marking complete:

- [ ] File renames completed
- [ ] Class names updated in renamed files
- [ ] Import statements updated in test files
- [ ] Entity documentation updated
- [ ] Service descriptions updated
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Tests passing (`npm test`)
- [ ] No broken imports
- [ ] Git commit with clear message

---

## Conclusion

**Status:** Strategic, professional update that:
- ✅ Improves market positioning
- ✅ Maintains technical accuracy
- ✅ Preserves regulatory compliance
- ✅ Low risk, high value

**Recommendation:** Proceed with implementation

**Next Steps:** Execute Phase 1 (File Renames)

---

**Report Generated:** October 7, 2025  
**Analyst:** GitHub Copilot  
**Confidence Level:** HIGH ✅
