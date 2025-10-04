# 🏠 WriteCareNotes Care Home Terminology Standardization Plan

**Version:** 1.0.0  
**Date:** October 4, 2025  
**Status:** 🚨 **CRITICAL ACCURACY IMPROVEMENT**  
**Priority:** **IMMEDIATE IMPLEMENTATION REQUIRED**

## 📋 **EXECUTIVE SUMMARY**

WriteCareNotes has **inconsistent terminology** throughout the codebase that needs immediate correction. The system is specifically designed for **adult care homes**, not general healthcare facilities, but many references incorrectly use "healthcare" terminology instead of the more accurate "care home" terminology.

This standardization is **critical for**:
- ✅ **Regulatory Accuracy** - CQC specifically regulates care homes, not hospitals
- ✅ **Market Clarity** - Care home managers need clear, relevant terminology
- ✅ **Professional Credibility** - Industry-specific language builds trust
- ✅ **Compliance Precision** - Care home regulations differ from hospital regulations

---

## 🎯 **SCOPE OF CHANGES**

### **Current Problem:**
**❌ INCORRECT:** "healthcare management system"  
**✅ CORRECT:** "care home management system"

**❌ INCORRECT:** "healthcare environments"  
**✅ CORRECT:** "care home environments"

**❌ INCORRECT:** "healthcare workforce"  
**✅ CORRECT:** "care home staff" or "care workforce"

**❌ INCORRECT:** "healthcare organization oversight"  
**✅ CORRECT:** "care home organization oversight"

---

## 📊 **AUDIT RESULTS**

### **Files Requiring Updates:**

#### **🗄️ Database Migrations (High Priority)**
- `database/migrations/009_create_medication_reconciliation_tables.ts` - 2 instances
- `database/migrations/030_create_compliance_tables.ts` - 1 instance  
- `database/migrations/031_create_jurisdiction_compliance_tables.ts` - 1 instance

#### **⚙️ Backend Services (High Priority)**
- `src/routes/index.ts` - 4 instances
- `src/index.ts` - 1 instance
- `src/services/resident/ResidentService.ts` - 1 instance
- `src/services/health/HealthService.ts` - 2 instances

#### **📱 Mobile App Components (High Priority)**
- `mobile/src/services/BiometricService.ts` - 4 instances
- `mobile/src/services/FamilyOnboardingService.ts` - 2 instances
- `mobile/src/screens/handover/HandoverScreen.tsx` - 1 instance
- `mobile/src/screens/executive/ExecutiveDashboardScreen.tsx` - 5 instances
- **Test Files:** Multiple test files with healthcare references

#### **🌐 Frontend Components (Medium Priority)**
- `frontend/src/components/blog/BlogAdmin.tsx` - 3 instances
- `frontend/src/components/blog/BlogAdmin.test.tsx` - 4 instances
- `pwa/src/components/forms/` - Multiple files with healthcare references

#### **📚 Documentation (High Priority)**
- `README-ENTERPRISE-CORE.md` - 18 instances
- `AUDIT_REPORT.md` - 8 instances
- `SECURITY_VERIFICATION_SUMMARY.md` - 8 instances
- `ENTERPRISE_TRANSFORMATION_FINAL_REPORT.md` - 20+ instances
- Multiple other documentation files

#### **🧪 Test Files (Medium Priority)**
- `tests/ai-agents/` - 50+ instances in test data
- Mobile component test files
- Service test files

---

## 🔄 **TERMINOLOGY MAPPING**

### **Primary Replacements:**

| **❌ Current (Incorrect)** | **✅ Replacement (Correct)** |
|---------------------------|------------------------------|
| healthcare management system | care home management system |
| healthcare environment | care home environment |
| healthcare workforce | care home staff / care workforce |
| healthcare organization | care home organization |
| healthcare facility | care home facility |
| healthcare professional | care professional / care home staff |
| healthcare compliance | care home compliance |
| healthcare data | care home data / resident data |
| healthcare standards | care home standards |
| healthcare workflow | care home workflow |
| healthcare platform | care home platform |
| healthcare operations | care home operations |

### **Context-Specific Replacements:**

| **Context** | **❌ Incorrect** | **✅ Correct** |
|-------------|------------------|----------------|
| **Executive Dashboard** | healthcare organization oversight | care home organization oversight |
| **Staff Authentication** | healthcare workforce | care home staff |
| **Compliance** | healthcare regulations | care home regulations |
| **Documentation** | healthcare content management | care content management |
| **Forms** | healthcare data collection | care home data collection |
| **Workflows** | healthcare environments | care home environments |

### **Terms to KEEP as "Healthcare" (Medical Context):**

| **✅ Keep as Healthcare** | **Reason** |
|--------------------------|------------|
| healthcare professional (medical staff) | When referring to GPs, nurses with medical training |
| healthcare compliance (medical) | When referring to clinical governance, medication management |
| NHS healthcare integration | When integrating with NHS systems |
| healthcare field types | When referring to clinical data fields |
| healthcare data retention | When referring to medical record retention |

---

## 📝 **IMPLEMENTATION PHASES**

### **Phase 1: Critical System Files** 
**⏱️ Immediate (High Impact)**

1. **Database Migrations**
   - Update all migration file headers and comments
   - Ensure compliance references are care home specific

2. **Core Service Files**
   - Main routes and index files
   - Service documentation headers
   - API descriptions

3. **Mobile Components**
   - Executive dashboard
   - Service descriptions
   - Authentication services

### **Phase 2: Documentation & Configuration**
**⏱️ Priority (Public Facing)**

1. **README Files**
   - Main README.md
   - Enterprise documentation
   - Setup guides

2. **Compliance Documentation**
   - Audit reports
   - Security summaries
   - Transformation reports

### **Phase 3: Test Files & Development**
**⏱️ Secondary (Internal)**

1. **Test Data**
   - Update test tenant names
   - Fix test descriptions
   - Update mock data

2. **Development Files**
   - Comments and documentation
   - Variable names where appropriate

### **Phase 4: Frontend Components**
**⏱️ Final (User Interface)**

1. **React Components**
   - UI text and labels
   - Form descriptions
   - Help text

2. **PWA Components**
   - Form builders
   - Component descriptions

---

## ⚠️ **IMPORTANT CONSIDERATIONS**

### **DO NOT Change:**
- ✅ **Medical terminology** where clinically appropriate
- ✅ **NHS integration** references (these are healthcare systems)
- ✅ **Clinical standards** (DCB0129, etc.)
- ✅ **Medication management** clinical aspects
- ✅ **GP Connect** and medical system integrations

### **BE CAREFUL With:**
- 🔍 **Staff roles** - Some may be healthcare professionals working in care homes
- 🔍 **Compliance references** - Ensure they point to care home specific regulations
- 🔍 **API endpoints** - May need updates if they include "healthcare" in URLs
- 🔍 **Database table/column names** - Avoid breaking changes

### **Compliance Mapping:**
| **Current** | **Correct Care Home Regulator** |
|-------------|--------------------------------|
| Healthcare regulators | CQC (England), Care Inspectorate Scotland, CIW Wales, RQIA Northern Ireland |
| Healthcare standards | Adult Social Care Standards |
| Healthcare compliance | Care Home Regulations |

---

## 🚀 **EXECUTION STRATEGY**

### **Immediate Actions:**

1. **Start with Current File** (`031_create_jurisdiction_compliance_tables.ts`)
   - Fix the header comment to use "care home" terminology
   - Update compliance references

2. **Systematic File-by-File Updates**
   - Use multi-file replacement tools for efficiency
   - Test after each major group of changes

3. **Validation Steps**
   - Ensure build still works
   - Verify no broken references
   - Check that medical contexts retain healthcare terminology

### **Quality Assurance:**

1. **Terminology Consistency Check**
   - Scan for remaining "healthcare" instances
   - Verify each is contextually appropriate

2. **Regulatory Accuracy Validation**
   - Ensure all compliance references point to care home regulations
   - Verify CQC standards are properly referenced

3. **Professional Review**
   - System should clearly serve care home industry
   - Language should resonate with care home managers

---

## 📈 **EXPECTED OUTCOMES**

### **Professional Benefits:**
- ✅ **Industry Credibility** - Proper care home terminology builds trust
- ✅ **Regulatory Alignment** - Accurate compliance references
- ✅ **Market Positioning** - Clear care home focus
- ✅ **User Experience** - Familiar terminology for care home staff

### **Technical Benefits:**
- ✅ **Documentation Accuracy** - Clear, precise system descriptions
- ✅ **Compliance Precision** - Correct regulatory frameworks
- ✅ **Maintainability** - Consistent terminology throughout codebase

### **Business Benefits:**
- ✅ **Target Market Clarity** - Specifically for care homes
- ✅ **Sales Enablement** - Clear value proposition
- ✅ **Competitive Advantage** - Industry-specific focus

---

## ✅ **SUCCESS CRITERIA**

### **Completion Metrics:**
- [ ] All inappropriate "healthcare" references updated to "care home"
- [ ] Medical/clinical "healthcare" references preserved where appropriate
- [ ] All compliance references point to care home regulations
- [ ] Documentation clearly positions system for care home industry
- [ ] No broken references or build failures
- [ ] Terminology consistency across all files

### **Validation Tests:**
- [ ] Grep search for remaining inappropriate "healthcare" instances
- [ ] Build and test execution successful
- [ ] Compliance documentation accuracy review
- [ ] Professional terminology review by care home industry expert

---

## 📅 **TIMELINE**

| **Phase** | **Duration** | **Dependencies** |
|-----------|--------------|------------------|
| **Phase 1 - Critical Files** | 2-3 hours | None |
| **Phase 2 - Documentation** | 2-3 hours | Phase 1 complete |
| **Phase 3 - Test Files** | 1-2 hours | Phase 1-2 complete |
| **Phase 4 - Frontend** | 1-2 hours | Phase 1-3 complete |
| **Validation & Testing** | 1 hour | All phases complete |
| **Total Estimated Time** | **7-11 hours** | |

---

## 🎯 **NEXT STEPS**

1. **Begin with Current File** - Fix `031_create_jurisdiction_compliance_tables.ts`
2. **Execute Phase 1** - Critical system files
3. **Validate Changes** - Ensure system still builds and functions
4. **Continue Systematically** - Work through remaining phases
5. **Final Quality Check** - Comprehensive terminology audit

---

**This standardization is essential for WriteCareNotes to be recognized as the premier care home management system it is designed to be. Accurate terminology builds trust with care home professionals and ensures regulatory compliance precision.**

---

*This plan ensures WriteCareNotes speaks the language of the care home industry while maintaining technical accuracy and regulatory compliance.*