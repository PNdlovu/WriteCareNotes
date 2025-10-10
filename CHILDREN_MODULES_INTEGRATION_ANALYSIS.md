# Children's Module Integration Analysis

**Date:** October 10, 2025  
**Purpose:** Identify which existing modules need children/young persons customization  
**Status:** ANALYSIS PHASE  

---

## 🔍 **CURRENT STATE ANALYSIS**

### **Existing Children's Modules** ✅
1. **Children Domain** (`src/domains/children/`)
   - Child entity with 8 British Isles jurisdictions
   - Developmental milestones (0-5 years)
   - Child profiles and tracking

2. **Leaving Care Domain** (`src/domains/leavingcare/`)
   - Young Person Portal (16+)
   - Pathway plans
   - Life skills progress
   - Leaving care finances (STANDALONE - not integrated with main finance)

3. **Placements Domain** (`src/domains/placements/`)
   - Residential care placements

4. **UASC Domain** (`src/domains/uasc/`)
   - Unaccompanied Asylum Seeking Children

---

## ❌ **MODULES LACKING CHILDREN CUSTOMIZATION**

### **1. FINANCE MODULE** - NOT INTEGRATED

**Current State:**
- `ResidentBilling.ts` - ADULT-FOCUSED (residentId, resident fields)
- `Invoice.ts` - Generic billing
- `Expense.ts` - General expenses
- `PayrollService.ts` - Staff only
- NO children-specific billing types

**Required for Children:**
- ✅ **Leaving Care Finances** (Already exists but ISOLATED)
- ❌ **Local Authority Invoicing** (placement fees, allowances)
- ❌ **Pocket Money Management** (weekly allowances for children)
- ❌ **Education Grants Tracking** (bursaries, PEP funding)
- ❌ **Clothing Allowance** (statutory allowances)
- ❌ **Birthday/Festival Grants** (special occasion funding)
- ❌ **Setting Up Home Grants** (care leavers 16+)
- ❌ **Integration with ResidentBilling** (children are residents too)

**Gap:** Leaving care finances exist but NOT connected to main finance module

---

### **2. MEDICATION MODULE (eMAR)** - NO CHILDREN CUSTOMIZATION

**Current State:**
- `MedicationRecord.ts` - Generic (residentId reference)
- Medication administration service - ADULT-FOCUSED
- NO age-appropriate dosing
- NO parental consent tracking (under 16)
- NO Gillick competence assessment

**Required for Children:**
- ❌ **Age-Based Dosing Rules** (weight-based for children)
- ❌ **Parental Consent Tracking** (under 16 cannot consent)
- ❌ **Gillick Competence Assessment** (16+ can consent)
- ❌ **Fraser Guidelines** (contraception for under 16)
- ❌ **PRN Medication Restrictions** (additional safeguards for children)
- ❌ **Controlled Drugs Restrictions** (stricter rules for children)
- ❌ **BNF for Children Integration** (pediatric dosing reference)
- ❌ **Side Effects Monitoring** (enhanced for children)
- ❌ **Growth/Development Impact** (medication effects on development)

**Gap:** Medication module treats all as adults - DANGEROUS for children

---

### **3. CARE PLANNING MODULE** - PARTIAL CUSTOMIZATION

**Current State:**
- Generic care plans exist
- NO children-specific care plan templates
- NO statutory review timescales (children have different timescales)

**Required for Children:**
- ❌ **LAC Reviews** (Looked After Children statutory reviews)
  - First review: 28 days
  - Second review: 3 months
  - Subsequent: 6 months
- ❌ **Personal Education Plans (PEP)** (statutory for children in care)
- ❌ **Health Assessments** (Initial Health Assessment, Review Health Assessment)
- ❌ **Pathway Plans** (16+ care leavers) - EXISTS but not integrated
- ❌ **Placement Plan** (immediate on placement)
- ❌ **Missing from Care Protocol** (CSE/CCE risk assessment)

**Gap:** No children-specific care planning workflows

---

### **4. HEALTH MODULE** - NO CHILDREN CUSTOMIZATION

**Current State:**
- Generic health tracking
- NO developmental tracking integration
- NO immunization tracking

**Required for Children:**
- ❌ **Immunization Schedule** (childhood vaccinations)
- ❌ **Growth Charts** (height, weight, BMI percentiles)
- ❌ **Developmental Milestones Integration** (link to existing milestones)
- ❌ **CAMHS Referrals** (Child and Adolescent Mental Health Services)
- ❌ **School Nursing** (school health team integration)
- ❌ **Dental Health** (6-monthly checks for children)
- ❌ **Sexual Health** (16+ young persons)

**Gap:** Health module doesn't track child-specific health needs

---

### **5. EDUCATION MODULE** - NO CHILDREN INTEGRATION

**Current State:**
- Generic education tracking (if exists)
- NO PEP integration
- NO school liaison

**Required for Children:**
- ❌ **School Attendance Tracking** (daily attendance)
- ❌ **PEP Reviews** (termly reviews)
- ❌ **Designated Teacher Liaison** (statutory role)
- ❌ **Virtual School Support** (local authority virtual school)
- ❌ **SEN/EHCP Tracking** (Special Educational Needs/Education Health Care Plan)
- ❌ **Exclusions Monitoring** (prevent school exclusions)
- ❌ **Attainment Tracking** (exam results, progress)

**Gap:** No education module for children in care

---

### **6. SAFEGUARDING MODULE** - MINIMAL CHILDREN FEATURES

**Current State:**
- Generic safeguarding
- NO CSE/CCE specific tools

**Required for Children:**
- ❌ **CSE Risk Assessment** (Child Sexual Exploitation)
- ❌ **CCE Risk Assessment** (Child Criminal Exploitation)
- ❌ **Missing from Care Protocol** (immediate escalation)
- ❌ **Online Safety Monitoring** (digital safeguarding)
- ❌ **Peer-on-Peer Abuse** (bullying, harmful sexual behavior)
- ❌ **Return Home Interview** (after missing episode)
- ❌ **Strategy Meetings** (multi-agency child protection)

**Gap:** Safeguarding not tailored for children's risks

---

### **7. CONTACT/FAMILY MODULE** - NO CHILDREN FOCUS

**Current State:**
- Generic contact management
- NO supervised contact tracking

**Required for Children:**
- ❌ **Contact Schedule** (court-ordered contact with family)
- ❌ **Supervised Contact Logs** (contact supervisor notes)
- ❌ **Contact Risk Assessment** (safety during contact)
- ❌ **Sibling Contact** (maintaining sibling relationships)
- ❌ **Letterbox Contact** (indirect contact via letters)
- ❌ **Contact Refusals** (child's wishes)

**Gap:** No family contact management for children in care

---

### **8. INDEPENDENT REVIEWING OFFICER (IRO) MODULE** - MISSING

**Required for Children:**
- ❌ **IRO Assignment** (statutory for all children in care)
- ❌ **IRO Visits** (midway between reviews)
- ❌ **IRO Reports** (independent review reports)
- ❌ **IRO Challenges** (disputes with local authority)
- ❌ **IRO Quality Assurance** (care plan quality)

**Gap:** NO IRO module exists

---

### **9. POCKET MONEY & PERSONAL ALLOWANCES** - MISSING

**Required for Children:**
- ❌ **Weekly Pocket Money** (age-appropriate amounts)
- ❌ **Clothing Allowance** (seasonal, birthday)
- ❌ **Birthday Money** (annual birthday allowance)
- ❌ **Festival Allowances** (religious festivals)
- ❌ **Savings Account** (pocket money savings)
- ❌ **Financial Education** (budgeting skills)

**Gap:** NO personal allowances module

---

### **10. THERAPY/COUNSELING MODULE** - NO CHILDREN FOCUS

**Current State:**
- Generic therapy (if exists)
- NO CAMHS integration

**Required for Children:**
- ❌ **CAMHS Referrals** (Child and Adolescent Mental Health Services)
- ❌ **Play Therapy** (trauma-informed therapy for young children)
- ❌ **Life Story Work** (therapeutic work on identity)
- ❌ **Attachment-Based Therapy** (attachment disorders)
- ❌ **Therapeutic Placement Support** (on-site therapists)

**Gap:** No specialist therapeutic support for children

---

## 📊 **PRIORITY MATRIX**

### **CRITICAL (Safety & Statutory)** 🔴
1. **Medication Module (eMAR)** - Age-based dosing, consent, Gillick competence
2. **LAC Reviews** - Statutory timescales (28 days, 3 months, 6 months)
3. **Missing from Care Protocol** - Immediate safeguarding
4. **CSE/CCE Risk Assessment** - Child exploitation prevention

### **HIGH (Statutory Requirements)** 🟠
5. **Finance Integration** - Connect leaving care finances to main finance
6. **Local Authority Invoicing** - Placement fee billing
7. **PEP Integration** - Personal Education Plans (statutory)
8. **Health Assessments** - Initial and Review Health Assessments
9. **IRO Module** - Independent Reviewing Officer (statutory)

### **MEDIUM (Service Quality)** 🟡
10. **Pocket Money Management** - Personal allowances tracking
11. **Contact Management** - Family contact scheduling
12. **Growth Charts** - Developmental health tracking
13. **Education Tracking** - School attendance, attainment

### **LOW (Nice-to-Have)** 🟢
14. **Therapy Tracking** - CAMHS, play therapy
15. **Immunization Schedule** - Vaccination tracking
16. **Savings Accounts** - Pocket money savings

---

## 🎯 **RECOMMENDED IMMEDIATE ACTIONS**

### **Phase 1: CRITICAL SAFETY (Week 1)**
1. **Medication Module Customization**
   - Add `childId` reference alongside `residentId`
   - Age-based dosing validation
   - Parental consent tracking (under 16)
   - Gillick competence assessment (16+)
   - BNF for Children integration

2. **Finance Module Integration**
   - Link `LeavingCareFinances` to main `Invoice` module
   - Add `childBilling` entity (extends ResidentBilling)
   - Local authority invoicing templates
   - Pocket money tracking

### **Phase 2: STATUTORY COMPLIANCE (Week 2)**
3. **LAC Reviews Module**
   - Review scheduling (28 days, 3 months, 6 months)
   - IRO assignment
   - Review reports

4. **PEP Module**
   - Personal Education Plan templates
   - Termly reviews
   - Designated teacher liaison

### **Phase 3: SAFEGUARDING (Week 3)**
5. **CSE/CCE Risk Assessment**
   - Screening tools
   - Missing from care protocol
   - Return home interviews

6. **Contact Management**
   - Court-ordered contact scheduling
   - Supervised contact logs

---

## ✅ **SUCCESS CRITERIA**

### **Medication Module**
- ✅ All medications for children <16 require parental consent
- ✅ All medications for 16+ require Gillick competence assessment
- ✅ Age-based dosing validated against BNF for Children
- ✅ Enhanced side effects monitoring for children

### **Finance Module**
- ✅ Leaving care finances integrated with main invoicing
- ✅ Local authority placement fees automatically invoiced
- ✅ Pocket money tracked weekly per child
- ✅ Allowances (clothing, birthday, festivals) automated

### **Care Planning Module**
- ✅ LAC reviews scheduled automatically (28 days, 3 months, 6 months)
- ✅ PEP reviews scheduled termly
- ✅ Health assessments scheduled (initial, 6-monthly)
- ✅ IRO assigned to every child

---

## 📋 **NEXT STEPS**

1. ✅ Create medication customization for children (eMAR)
2. ✅ Integrate leaving care finances with main finance module
3. ✅ Build pocket money/allowances tracking
4. ✅ Create LAC reviews module
5. ✅ Build PEP integration
6. ✅ Add CSE/CCE risk assessment tools

---

**Document Status:** ANALYSIS COMPLETE  
**Recommendation:** Proceed with Phase 1 (Medication + Finance customization)

