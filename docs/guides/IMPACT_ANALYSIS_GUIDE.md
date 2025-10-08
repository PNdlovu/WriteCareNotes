# Policy Impact Analysis - User Guide

**Version:** 1.0.0  
**Phase:** Phase 2 TIER 1 - Feature 3  
**Last Updated:** October 7, 2025

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Understanding Dependencies](#understanding-dependencies)
4. [Impact Analysis Dashboard](#impact-analysis-dashboard)
5. [Risk Assessment](#risk-assessment)
6. [Managing Dependencies](#managing-dependencies)
7. [Pre-Publication Workflow](#pre-publication-workflow)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Introduction

### What is Policy Impact Analysis?

Policy Impact Analysis is a comprehensive tool that helps you understand the ripple effects of policy changes before they're published. By tracking dependencies between policies and other system entities (workflows, modules, templates, etc.), the system can predict which areas will be affected by your changes and assess the associated risks.

### Why Use Impact Analysis?

- **Prevent Disruptions:** Identify critical workflows that might be affected before publishing changes
- **Informed Decision-Making:** Understand the full scope of policy changes
- **Risk Mitigation:** Get actionable recommendations to reduce deployment risks
- **Compliance:** Ensure proper approval workflows for high-risk changes
- **Stakeholder Communication:** Automatically identify who needs to be notified

### Key Features

✅ **Dependency Graph Visualization** - See all relationships at a glance  
✅ **Risk Scoring** - Automated 0-100 risk score calculation  
✅ **Affected Entities Analysis** - Know exactly what's impacted  
✅ **Pre-Publish Checklist** - Never miss a critical step  
✅ **Impact Reports** - Generate PDF/HTML reports for stakeholders  
✅ **Approval Workflows** - Automatic approval requirements for high-risk changes

---

## Getting Started

### Accessing Impact Analysis

1. **Navigate to Policy Editor**
   - Open any policy draft in the Policy Governance module
   - Click the **"Impact Analysis"** tab in the top navigation

2. **Dashboard Overview**
   - The dashboard loads automatically with the current policy analysis
   - Initial analysis may take 5-10 seconds for complex policies

### Dashboard Layout

The Impact Analysis Dashboard consists of 5 main tabs:

1. **Dependency Graph** - Visual network of all dependencies
2. **Affected Workflows** - List of impacted workflows and modules
3. **Risk Assessment** - Detailed risk breakdown
4. **Recommendations** - Actions and mitigation strategies
5. **Pre-Publish Checklist** - Required items before publication

---

## Understanding Dependencies

### What are Dependencies?

Dependencies represent relationships between your policy and other system entities. When a policy changes, any dependent entity may be affected.

### Dependency Types

#### 1. Workflow Dependencies
**Example:** Patient Admission Workflow depends on Admission Policy  
**Impact:** Changes to the policy may require workflow updates

#### 2. Module Dependencies
**Example:** Care Planning Module depends on Assessment Policy  
**Impact:** Module features may need reconfiguration

#### 3. Template Dependencies
**Example:** Care Plan Template depends on Documentation Policy  
**Impact:** Template structure may need adjustments

#### 4. Assessment Dependencies
**Example:** Risk Assessment depends on Safety Policy  
**Impact:** Assessment criteria may need updates

#### 5. Training Dependencies
**Example:** Staff Training depends on Medication Policy  
**Impact:** Training materials need revision

#### 6. Document Dependencies
**Example:** Procedure Document depends on Clinical Policy  
**Impact:** Related documents need review

### Dependency Strengths

#### Strong Dependencies (RED)
- **Impact:** Critical - will likely break if not updated
- **Action Required:** Must update dependent entity before publishing
- **Example:** A workflow that directly executes policy rules

#### Medium Dependencies (ORANGE)
- **Impact:** Significant - may cause issues if not reviewed
- **Action Required:** Should review and test dependent entity
- **Example:** A module that references policy guidelines

#### Weak Dependencies (GREY)
- **Impact:** Minor - might need cosmetic updates
- **Action Required:** Optional review
- **Example:** A document that mentions the policy

---

## Impact Analysis Dashboard

### Risk Summary Card

Located at the top of the dashboard, this card shows:

- **Overall Risk Score** (0-100):
  - 0-29: Low Risk (Green)
  - 30-59: Medium Risk (Blue)
  - 60-79: High Risk (Orange)
  - 80-100: Critical Risk (Red)

- **Total Affected Entities:** Number of dependent items

- **Critical Workflows:** Count of mission-critical workflows impacted

- **Approval Required:** Yes/No indicator for manager approval

#### Example:
```
Risk Score: 67/100 (HIGH RISK)
Total Affected: 28 entities
Critical Workflows: 1
Approval Required: YES
```

### Dependency Graph Tab

#### Understanding the Graph

- **Nodes:** Each circle represents an entity
- **Node Colors:**
  - Blue: Your policy (center)
  - Green: Workflows
  - Orange: Modules
  - Purple: Templates
  - Red: Assessments
  - Light Blue: Training
  - Dark Orange: Documents

- **Edges (Lines):**
  - Thickness indicates strength (thick = strong)
  - Animated lines = strong dependencies
  - Color matches dependency strength

#### Navigation:
- **Pan:** Click and drag the background
- **Zoom:** Use mouse wheel or controls
- **Mini-Map:** Bottom-left corner for overview
- **Reset View:** Click "Fit View" button

### Affected Workflows Tab

#### Critical Workflows Section

Shows workflows marked as critical with:
- Workflow name and ID
- Impact description
- Risk level badge

**Example:**
| Workflow | Impact | Risk |
|----------|--------|------|
| Patient Admission | May disrupt admission process | CRITICAL |
| Medication Admin | Dosage calculations affected | HIGH |

#### All Modules Section

Lists all affected modules with risk levels.

### Risk Assessment Tab

#### Risk Score Breakdown

Visual progress bar showing:
- Current risk score
- Risk level classification
- Color-coded severity

#### Risk Factors List

Each risk factor shows:
- **Factor Name:** What's causing risk
- **Severity:** Low, Medium, High, or Critical
- **Description:** Detailed explanation

**Example:**
- ❌ **Critical Workflow Dependency** (High)
  - _This policy affects Patient Admission workflow which is critical for daily operations_

#### Change Scope Analysis

- **Impact Radius:** Scale of 0-10 (how far-reaching the change is)
- **Total Affected:** Count of all impacted entities
- **Scope Type:** Localized or System-Wide
- **Affected Departments:** List of departments

### Recommendations Tab

#### Pre-Publish Actions

Step-by-step actions to take before publishing:
1. Test all affected workflows in staging
2. Notify department heads
3. Prepare training materials
4. Schedule publication time

#### Mitigation Strategies

Risk reduction recommendations:
- ⚠️ Schedule publication during off-peak hours
- ⚠️ Prepare rollback plan
- ⚠️ Create backup of current policy version

#### Stakeholders to Notify

Automatically identified people/roles to inform:
- Nursing Manager
- IT Administrator
- Compliance Officer
- Department Heads

### Pre-Publish Checklist Tab

#### Understanding Checklist Items

- ✅ **Green Check:** Completed
- ❌ **Red X:** Not completed (Required)
- ⚠️ **Orange X:** Not completed (Optional)

#### Example Checklist:
- [ ] ❌ **REQUIRED:** All affected workflows tested
- [ ] ❌ **REQUIRED:** Stakeholders notified
- [ ] ❌ **REQUIRED:** Manager approval obtained
- [x] ✅ **Optional:** Backup created

**Note:** All REQUIRED items must be completed before publishing.

---

## Risk Assessment

### How Risk Scores are Calculated

The system uses multiple factors to calculate risk:

1. **Dependency Count** (30%)
   - More dependencies = higher risk
   - Formula: `(totalDependencies / 50) * 30`

2. **Strong Dependencies** (40%)
   - Strong dependencies have highest impact
   - Formula: `(strongDependencies / totalDependencies) * 40`

3. **Critical Workflows** (20%)
   - Mission-critical workflows add significant risk
   - Formula: `(criticalWorkflows / totalWorkflows) * 20`

4. **Change Scope** (10%)
   - System-wide changes are riskier
   - Formula: `(impactRadius / 10) * 10`

**Total Risk Score = Sum of all factors (0-100)**

### Risk Levels Explained

#### Low Risk (0-29)
- ✅ **Can Publish Immediately**
- Few or no dependencies
- Only weak dependencies
- No critical workflows affected
- Localized impact

**Action:** Proceed with confidence, minimal testing needed

#### Medium Risk (30-59)
- ⚠️ **Review Recommended**
- Moderate number of dependencies
- Mix of dependency strengths
- Some workflows affected
- Moderate impact scope

**Action:** Test affected areas, notify relevant stakeholders

#### High Risk (60-79)
- ⚠️ **Careful Review Required**
- Many dependencies
- Several strong dependencies
- Critical workflows affected
- Wide impact scope

**Action:** Comprehensive testing, stakeholder approval, mitigation plan

#### Critical Risk (80-100)
- ❌ **Publication Blocked**
- Numerous dependencies
- Multiple strong dependencies
- Several critical workflows affected
- System-wide impact

**Action:** Cannot publish until dependencies are addressed or approval obtained

---

## Managing Dependencies

### Creating Dependencies

#### Manual Creation

1. **Navigate to Impact Analysis Dashboard**
2. **Scroll to "Manage Dependencies" section**
3. **Click "Add Dependency"**
4. **Fill in form:**
   - Dependent Type: Select from dropdown
   - Dependent Entity: Search and select
   - Dependency Strength: Strong, Medium, or Weak
   - Notes: Describe the relationship
5. **Click "Save"**

#### API Creation

Use the API for programmatic dependency creation:
```bash
curl -X POST "http://localhost:3000/api/policy/{policyId}/dependencies" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "dependentType": "workflow",
    "dependentId": "workflow-uuid",
    "dependencyStrength": "strong",
    "notes": "Critical workflow dependency"
  }'
```

### Editing Dependencies

1. **Locate dependency in the graph or list**
2. **Click the edit icon**
3. **Update fields:**
   - Change dependency strength
   - Update notes
   - Modify metadata
4. **Click "Update"**

**Note:** You cannot change the dependent entity - delete and recreate instead.

### Deleting Dependencies

#### Soft Delete (Recommended)
- Deactivates the dependency
- Preserves historical data
- Can be reactivated later

**Steps:**
1. Click the delete icon
2. Confirm deletion
3. Dependency marked as inactive

#### Hard Delete (Permanent)
- Permanently removes the dependency
- Cannot be recovered
- Use with caution

**Steps:**
1. Click delete icon while holding Shift key
2. Confirm permanent deletion
3. Dependency removed from database

### Bulk Operations

#### Bulk Import

For adding many dependencies at once:

1. **Prepare CSV file:**
```csv
dependentType,dependentId,dependencyStrength,notes
workflow,uuid-1,strong,Critical admission workflow
module,uuid-2,medium,Care planning module reference
template,uuid-3,weak,Documentation template
```

2. **Use bulk import tool:**
   - Navigate to "Manage Dependencies"
   - Click "Bulk Import"
   - Upload CSV file
   - Review and confirm

#### Bulk Export

Export all dependencies for analysis:
1. Click "Export Dependencies"
2. Choose format (CSV, JSON, Excel)
3. Download file

---

## Pre-Publication Workflow

### Step-by-Step Publishing Process

#### 1. Make Policy Changes
Edit your policy draft as needed using the policy editor.

#### 2. Run Impact Analysis
- Click "Analyze Impact" button
- Wait for analysis to complete (5-10 seconds)
- Review the dashboard

#### 3. Review Risk Assessment
- Check overall risk score
- Read all risk factors
- Understand change scope

#### 4. Address High-Risk Issues

**If Risk is High or Critical:**
- Review all affected workflows
- Test critical workflows in staging environment
- Update dependent entities as needed
- Create mitigation plan

#### 5. Complete Pre-Publish Checklist
Go through each checklist item:
- [ ] All affected workflows tested
- [ ] Stakeholders notified
- [ ] Training materials updated
- [ ] Manager approval obtained (if required)
- [ ] Backup created
- [ ] Rollback plan prepared

#### 6. Obtain Approvals

**If Approval Required:**
- Click "Request Approval"
- Approval request sent to designated manager
- Wait for approval confirmation
- Cannot publish until approved

#### 7. Notify Stakeholders
- Use the recommended stakeholder list
- Send notifications via the system
- Include impact summary
- Provide timeline for changes

#### 8. Generate Impact Report
- Click "Export PDF" button
- Attach to approval request or documentation
- Store for compliance records

#### 9. Schedule Publication

**Best Practices:**
- Schedule during off-peak hours
- Avoid critical operation times
- Notify IT team of scheduled time
- Prepare support staff for potential issues

#### 10. Publish and Monitor
- Click "Publish Policy"
- Monitor system for issues
- Have rollback plan ready
- Document any post-publication issues

---

## Best Practices

### Dependency Management

✅ **DO:**
- Keep dependencies up-to-date
- Document the reason for each dependency
- Review dependencies quarterly
- Use appropriate strength levels
- Include detailed notes

❌ **DON'T:**
- Create dependencies without clear relationships
- Mark everything as "strong" dependency
- Forget to update when entities change
- Leave dependencies without notes

### Impact Analysis

✅ **DO:**
- Run analysis before every publication
- Take high-risk warnings seriously
- Test all critical workflows
- Keep stakeholders informed
- Document your decision-making process

❌ **DON'T:**
- Skip analysis for "small" changes
- Ignore critical risk warnings
- Publish without completing checklist
- Bypass approval requirements

### Risk Mitigation

✅ **DO:**
- Create comprehensive rollback plans
- Test in staging environments first
- Schedule changes during low-activity periods
- Prepare support team in advance
- Document all changes thoroughly

❌ **DON'T:**
- Make critical changes during peak hours
- Publish without testing
- Skip stakeholder notifications
- Ignore mitigation recommendations

---

## Troubleshooting

### Common Issues

#### "Analysis Taking Too Long"

**Cause:** Large dependency graph or slow database

**Solution:**
- Wait up to 30 seconds for complex policies
- Reduce maxDepth parameter if using API
- Contact IT if consistently slow

#### "Missing Dependencies in Graph"

**Cause:** Inactive dependencies or filters applied

**Solution:**
- Check "Show Inactive Dependencies" checkbox
- Verify dependencies exist in database
- Refresh the dashboard

#### "Risk Score Seems Incorrect"

**Cause:** Outdated dependency information or missing data

**Solution:**
- Refresh impact analysis
- Verify all dependencies are current
- Check that all affected entities are properly linked

#### "Cannot Publish - Critical Risk"

**Cause:** Risk score above 80 or critical workflows affected

**Solution:**
- Address critical dependencies first
- Update affected workflows
- Obtain special approval from senior management
- Consider breaking changes into smaller updates

#### "Approval Request Not Received"

**Cause:** Email notification issues or incorrect approver

**Solution:**
- Verify approver email address
- Check email spam folder
- Resend approval request
- Contact approver directly

### Getting Help

**Support Channels:**
- **In-App Help:** Click (?) icon in dashboard
- **Email Support:** support@writecarenotes.com
- **Phone:** 1-800-CARE-NOTES
- **Documentation:** See IMPACT_ANALYSIS_API.md for technical details

---

## FAQ

### General Questions

**Q: How often should I run impact analysis?**  
A: Before every policy publication, even for minor changes.

**Q: Can I skip analysis for small updates?**  
A: No. Even small changes can have unexpected impacts. Always analyze.

**Q: How long does analysis take?**  
A: Typically 5-10 seconds. Complex policies may take up to 30 seconds.

**Q: What if there are no dependencies?**  
A: This is rare. If confirmed, the system will show low risk and allow publication.

### Dependencies

**Q: How do I know what dependency strength to use?**  
A: 
- **Strong:** Entity will break or malfunction without updates
- **Medium:** Entity will have issues but won't break completely
- **Weak:** Entity has minor references, updates optional

**Q: Can a policy have dependencies on multiple versions?**  
A: Yes, but the system analyzes the current policy version only.

**Q: What happens to dependencies when I delete a policy?**  
A: Dependencies are soft-deleted (deactivated) but preserved for historical records.

### Risk Assessment

**Q: Can I override a critical risk warning?**  
A: Only with senior management approval. Contact your administrator.

**Q: Why is my risk score different from yesterday?**  
A: Risk scores are calculated in real-time based on current dependencies and system state.

**Q: Does the system learn from past publications?**  
A: Not currently, but this is planned for future releases.

### Approvals

**Q: Who approves high-risk policy changes?**  
A: Designated policy manager or department head, configured in system settings.

**Q: How long do approvals take?**  
A: Varies by organization. Average is 24-48 hours.

**Q: Can I expedite an approval?**  
A: Contact the approver directly and reference the approval request ID.

### Reports

**Q: What format should I use for reports?**  
A:
- **PDF:** Best for formal documentation and archival
- **HTML:** Good for email and web sharing
- **JSON:** For programmatic analysis or data integration

**Q: Are reports signed/timestamped?**  
A: Yes, all reports include timestamp and user information.

**Q: How long are reports stored?**  
A: Reports are stored indefinitely for compliance purposes.

---

## Conclusion

Policy Impact Analysis is a powerful tool for safe, informed policy management. By following this guide and adhering to best practices, you can:

- Minimize disruption from policy changes
- Make data-driven publishing decisions
- Maintain system stability
- Ensure compliance with approval workflows
- Keep stakeholders informed

**Remember:** The goal isn't to prevent all changes, but to make changes safely and confidently.

For additional support, consult the [API Reference](IMPACT_ANALYSIS_API.md) or contact your system administrator.

---

**End of User Guide**

**Document Version:** 1.0.0  
**Last Updated:** October 7, 2025  
**Maintained By:** WriteCare Notes Development Team
