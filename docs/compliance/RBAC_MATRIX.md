# Role-Based Access Control (RBAC) Matrix

## Overview

This document defines the comprehensive RBAC matrix for WriteCareNotes, outlining roles, permissions, and access controls across all system modules and functionalities.

## Role Hierarchy

### 1. System Administrator
**Level**: Highest
**Scope**: Global system access
**Responsibilities**: System configuration, user management, security oversight

### 2. Tenant Administrator
**Level**: High
**Scope**: Tenant-specific administration
**Responsibilities**: Tenant configuration, user management, compliance oversight

### 3. Clinical Manager
**Level**: High
**Scope**: Clinical operations
**Responsibilities**: Clinical oversight, care planning, staff management

### 4. Care Coordinator
**Level**: Medium-High
**Scope**: Care coordination
**Responsibilities**: Care planning, resident management, family communication

### 5. Registered Nurse
**Level**: Medium
**Scope**: Clinical care
**Responsibilities**: Medication administration, care delivery, documentation

### 6. Care Assistant
**Level**: Medium
**Scope**: Direct care
**Responsibilities**: Personal care, observation, basic documentation

### 7. Family Member
**Level**: Low
**Scope**: Limited access
**Responsibilities**: View resident information, communicate with staff

### 8. External Auditor
**Level**: Low
**Scope**: Read-only access
**Responsibilities**: Compliance auditing, report generation

## Permission Categories

### A. System Management
- **SYSTEM_CONFIG**: System configuration management
- **USER_MANAGEMENT**: User account management
- **ROLE_MANAGEMENT**: Role and permission management
- **AUDIT_ACCESS**: Audit log access
- **SECURITY_CONFIG**: Security configuration

### B. Tenant Management
- **TENANT_CONFIG**: Tenant configuration
- **TENANT_USERS**: Tenant user management
- **TENANT_DATA**: Tenant data access
- **TENANT_COMPLIANCE**: Tenant compliance management

### C. Clinical Operations
- **CLINICAL_READ**: Read clinical data
- **CLINICAL_WRITE**: Write clinical data
- **MEDICATION_MANAGE**: Medication management
- **CARE_PLAN_MANAGE**: Care plan management
- **ASSESSMENT_MANAGE**: Assessment management

### D. Resident Management
- **RESIDENT_READ**: Read resident data
- **RESIDENT_WRITE**: Write resident data
- **RESIDENT_CREATE**: Create resident records
- **RESIDENT_DELETE**: Delete resident records
- **RESIDENT_EXPORT**: Export resident data

### E. Financial Operations
- **FINANCIAL_READ**: Read financial data
- **FINANCIAL_WRITE**: Write financial data
- **INVOICE_MANAGE**: Invoice management
- **PAYMENT_MANAGE**: Payment management
- **REPORTING**: Financial reporting

### F. HR Operations
- **HR_READ**: Read HR data
- **HR_WRITE**: Write HR data
- **STAFF_MANAGE**: Staff management
- **PAYROLL_MANAGE**: Payroll management
- **DBS_MANAGE**: DBS check management

### G. Compliance & Audit
- **COMPLIANCE_READ**: Read compliance data
- **COMPLIANCE_WRITE**: Write compliance data
- **AUDIT_READ**: Read audit logs
- **REPORT_GENERATE**: Generate reports
- **INCIDENT_MANAGE**: Incident management

## Detailed RBAC Matrix

### System Administrator
| Permission | Access Level | Notes |
|------------|--------------|-------|
| SYSTEM_CONFIG | Full | Complete system configuration |
| USER_MANAGEMENT | Full | All users across all tenants |
| ROLE_MANAGEMENT | Full | Create/modify roles and permissions |
| AUDIT_ACCESS | Full | All audit logs |
| SECURITY_CONFIG | Full | Security settings and policies |
| TENANT_CONFIG | Full | All tenant configurations |
| TENANT_USERS | Full | All tenant users |
| TENANT_DATA | Full | All tenant data |
| TENANT_COMPLIANCE | Full | All tenant compliance |
| CLINICAL_READ | Full | All clinical data |
| CLINICAL_WRITE | Full | All clinical data |
| MEDICATION_MANAGE | Full | All medication data |
| CARE_PLAN_MANAGE | Full | All care plans |
| ASSESSMENT_MANAGE | Full | All assessments |
| RESIDENT_READ | Full | All resident data |
| RESIDENT_WRITE | Full | All resident data |
| RESIDENT_CREATE | Full | Create resident records |
| RESIDENT_DELETE | Full | Delete resident records |
| RESIDENT_EXPORT | Full | Export all resident data |
| FINANCIAL_READ | Full | All financial data |
| FINANCIAL_WRITE | Full | All financial data |
| INVOICE_MANAGE | Full | All invoices |
| PAYMENT_MANAGE | Full | All payments |
| REPORTING | Full | All reports |
| HR_READ | Full | All HR data |
| HR_WRITE | Full | All HR data |
| STAFF_MANAGE | Full | All staff |
| PAYROLL_MANAGE | Full | All payroll |
| DBS_MANAGE | Full | All DBS checks |
| COMPLIANCE_READ | Full | All compliance data |
| COMPLIANCE_WRITE | Full | All compliance data |
| AUDIT_READ | Full | All audit logs |
| REPORT_GENERATE | Full | All reports |
| INCIDENT_MANAGE | Full | All incidents |

### Tenant Administrator
| Permission | Access Level | Notes |
|------------|--------------|-------|
| SYSTEM_CONFIG | None | No system-level access |
| USER_MANAGEMENT | Tenant | Tenant users only |
| ROLE_MANAGEMENT | Tenant | Tenant roles only |
| AUDIT_ACCESS | Tenant | Tenant audit logs only |
| SECURITY_CONFIG | Tenant | Tenant security settings |
| TENANT_CONFIG | Full | Own tenant only |
| TENANT_USERS | Full | Own tenant only |
| TENANT_DATA | Full | Own tenant only |
| TENANT_COMPLIANCE | Full | Own tenant only |
| CLINICAL_READ | Full | Own tenant only |
| CLINICAL_WRITE | Full | Own tenant only |
| MEDICATION_MANAGE | Full | Own tenant only |
| CARE_PLAN_MANAGE | Full | Own tenant only |
| ASSESSMENT_MANAGE | Full | Own tenant only |
| RESIDENT_READ | Full | Own tenant only |
| RESIDENT_WRITE | Full | Own tenant only |
| RESIDENT_CREATE | Full | Own tenant only |
| RESIDENT_DELETE | Full | Own tenant only |
| RESIDENT_EXPORT | Full | Own tenant only |
| FINANCIAL_READ | Full | Own tenant only |
| FINANCIAL_WRITE | Full | Own tenant only |
| INVOICE_MANAGE | Full | Own tenant only |
| PAYMENT_MANAGE | Full | Own tenant only |
| REPORTING | Full | Own tenant only |
| HR_READ | Full | Own tenant only |
| HR_WRITE | Full | Own tenant only |
| STAFF_MANAGE | Full | Own tenant only |
| PAYROLL_MANAGE | Full | Own tenant only |
| DBS_MANAGE | Full | Own tenant only |
| COMPLIANCE_READ | Full | Own tenant only |
| COMPLIANCE_WRITE | Full | Own tenant only |
| AUDIT_READ | Full | Own tenant only |
| REPORT_GENERATE | Full | Own tenant only |
| INCIDENT_MANAGE | Full | Own tenant only |

### Clinical Manager
| Permission | Access Level | Notes |
|------------|--------------|-------|
| SYSTEM_CONFIG | None | No system access |
| USER_MANAGEMENT | None | No user management |
| ROLE_MANAGEMENT | None | No role management |
| AUDIT_ACCESS | Read | Clinical audit logs only |
| SECURITY_CONFIG | None | No security config |
| TENANT_CONFIG | None | No tenant config |
| TENANT_USERS | None | No user management |
| TENANT_DATA | Read | Clinical data only |
| TENANT_COMPLIANCE | Read | Clinical compliance only |
| CLINICAL_READ | Full | All clinical data |
| CLINICAL_WRITE | Full | All clinical data |
| MEDICATION_MANAGE | Full | All medication data |
| CARE_PLAN_MANAGE | Full | All care plans |
| ASSESSMENT_MANAGE | Full | All assessments |
| RESIDENT_READ | Full | All residents |
| RESIDENT_WRITE | Full | All residents |
| RESIDENT_CREATE | Full | Create residents |
| RESIDENT_DELETE | None | No deletion |
| RESIDENT_EXPORT | Full | Export resident data |
| FINANCIAL_READ | None | No financial access |
| FINANCIAL_WRITE | None | No financial access |
| INVOICE_MANAGE | None | No invoice access |
| PAYMENT_MANAGE | None | No payment access |
| REPORTING | Clinical | Clinical reports only |
| HR_READ | None | No HR access |
| HR_WRITE | None | No HR access |
| STAFF_MANAGE | None | No staff management |
| PAYROLL_MANAGE | None | No payroll access |
| DBS_MANAGE | None | No DBS access |
| COMPLIANCE_READ | Clinical | Clinical compliance only |
| COMPLIANCE_WRITE | Clinical | Clinical compliance only |
| AUDIT_READ | Clinical | Clinical audit logs only |
| REPORT_GENERATE | Clinical | Clinical reports only |
| INCIDENT_MANAGE | Clinical | Clinical incidents only |

### Care Coordinator
| Permission | Access Level | Notes |
|------------|--------------|-------|
| SYSTEM_CONFIG | None | No system access |
| USER_MANAGEMENT | None | No user management |
| ROLE_MANAGEMENT | None | No role management |
| AUDIT_ACCESS | None | No audit access |
| SECURITY_CONFIG | None | No security config |
| TENANT_CONFIG | None | No tenant config |
| TENANT_USERS | None | No user management |
| TENANT_DATA | Read | Assigned residents only |
| TENANT_COMPLIANCE | Read | Assigned residents only |
| CLINICAL_READ | Assigned | Assigned residents only |
| CLINICAL_WRITE | Assigned | Assigned residents only |
| MEDICATION_MANAGE | Assigned | Assigned residents only |
| CARE_PLAN_MANAGE | Assigned | Assigned residents only |
| ASSESSMENT_MANAGE | Assigned | Assigned residents only |
| RESIDENT_READ | Assigned | Assigned residents only |
| RESIDENT_WRITE | Assigned | Assigned residents only |
| RESIDENT_CREATE | None | No creation |
| RESIDENT_DELETE | None | No deletion |
| RESIDENT_EXPORT | Assigned | Assigned residents only |
| FINANCIAL_READ | None | No financial access |
| FINANCIAL_WRITE | None | No financial access |
| INVOICE_MANAGE | None | No invoice access |
| PAYMENT_MANAGE | None | No payment access |
| REPORTING | Assigned | Assigned residents only |
| HR_READ | None | No HR access |
| HR_WRITE | None | No HR access |
| STAFF_MANAGE | None | No staff management |
| PAYROLL_MANAGE | None | No payroll access |
| DBS_MANAGE | None | No DBS access |
| COMPLIANCE_READ | Assigned | Assigned residents only |
| COMPLIANCE_WRITE | Assigned | Assigned residents only |
| AUDIT_READ | Assigned | Assigned residents only |
| REPORT_GENERATE | Assigned | Assigned residents only |
| INCIDENT_MANAGE | Assigned | Assigned residents only |

### Registered Nurse
| Permission | Access Level | Notes |
|------------|--------------|-------|
| SYSTEM_CONFIG | None | No system access |
| USER_MANAGEMENT | None | No user management |
| ROLE_MANAGEMENT | None | No role management |
| AUDIT_ACCESS | None | No audit access |
| SECURITY_CONFIG | None | No security config |
| TENANT_CONFIG | None | No tenant config |
| TENANT_USERS | None | No user management |
| TENANT_DATA | Read | Assigned residents only |
| TENANT_COMPLIANCE | Read | Assigned residents only |
| CLINICAL_READ | Assigned | Assigned residents only |
| CLINICAL_WRITE | Assigned | Assigned residents only |
| MEDICATION_MANAGE | Assigned | Assigned residents only |
| CARE_PLAN_MANAGE | Read | Read-only access |
| ASSESSMENT_MANAGE | Assigned | Assigned residents only |
| RESIDENT_READ | Assigned | Assigned residents only |
| RESIDENT_WRITE | Assigned | Assigned residents only |
| RESIDENT_CREATE | None | No creation |
| RESIDENT_DELETE | None | No deletion |
| RESIDENT_EXPORT | None | No export |
| FINANCIAL_READ | None | No financial access |
| FINANCIAL_WRITE | None | No financial access |
| INVOICE_MANAGE | None | No invoice access |
| PAYMENT_MANAGE | None | No payment access |
| REPORTING | Assigned | Assigned residents only |
| HR_READ | None | No HR access |
| HR_WRITE | None | No HR access |
| STAFF_MANAGE | None | No staff management |
| PAYROLL_MANAGE | None | No payroll access |
| DBS_MANAGE | None | No DBS access |
| COMPLIANCE_READ | Assigned | Assigned residents only |
| COMPLIANCE_WRITE | None | No compliance write |
| AUDIT_READ | Assigned | Assigned residents only |
| REPORT_GENERATE | Assigned | Assigned residents only |
| INCIDENT_MANAGE | Assigned | Assigned residents only |

### Care Assistant
| Permission | Access Level | Notes |
|------------|--------------|-------|
| SYSTEM_CONFIG | None | No system access |
| USER_MANAGEMENT | None | No user management |
| ROLE_MANAGEMENT | None | No role management |
| AUDIT_ACCESS | None | No audit access |
| SECURITY_CONFIG | None | No security config |
| TENANT_CONFIG | None | No tenant config |
| TENANT_USERS | None | No user management |
| TENANT_DATA | Read | Assigned residents only |
| TENANT_COMPLIANCE | None | No compliance access |
| CLINICAL_READ | Assigned | Assigned residents only |
| CLINICAL_WRITE | Limited | Basic care documentation |
| MEDICATION_MANAGE | None | No medication access |
| CARE_PLAN_MANAGE | Read | Read-only access |
| ASSESSMENT_MANAGE | None | No assessment access |
| RESIDENT_READ | Assigned | Assigned residents only |
| RESIDENT_WRITE | Limited | Basic care documentation |
| RESIDENT_CREATE | None | No creation |
| RESIDENT_DELETE | None | No deletion |
| RESIDENT_EXPORT | None | No export |
| FINANCIAL_READ | None | No financial access |
| FINANCIAL_WRITE | None | No financial access |
| INVOICE_MANAGE | None | No invoice access |
| PAYMENT_MANAGE | None | No payment access |
| REPORTING | None | No reporting access |
| HR_READ | None | No HR access |
| HR_WRITE | None | No HR access |
| STAFF_MANAGE | None | No staff management |
| PAYROLL_MANAGE | None | No payroll access |
| DBS_MANAGE | None | No DBS access |
| COMPLIANCE_READ | None | No compliance access |
| COMPLIANCE_WRITE | None | No compliance write |
| AUDIT_READ | None | No audit access |
| REPORT_GENERATE | None | No reporting access |
| INCIDENT_MANAGE | None | No incident access |

### Family Member
| Permission | Access Level | Notes |
|------------|--------------|-------|
| SYSTEM_CONFIG | None | No system access |
| USER_MANAGEMENT | None | No user management |
| ROLE_MANAGEMENT | None | No role management |
| AUDIT_ACCESS | None | No audit access |
| SECURITY_CONFIG | None | No security config |
| TENANT_CONFIG | None | No tenant config |
| TENANT_USERS | None | No user management |
| TENANT_DATA | Read | Own family member only |
| TENANT_COMPLIANCE | None | No compliance access |
| CLINICAL_READ | Limited | Own family member only |
| CLINICAL_WRITE | None | No clinical write |
| MEDICATION_MANAGE | None | No medication access |
| CARE_PLAN_MANAGE | Read | Own family member only |
| ASSESSMENT_MANAGE | None | No assessment access |
| RESIDENT_READ | Limited | Own family member only |
| RESIDENT_WRITE | None | No resident write |
| RESIDENT_CREATE | None | No creation |
| RESIDENT_DELETE | None | No deletion |
| RESIDENT_EXPORT | None | No export |
| FINANCIAL_READ | None | No financial access |
| FINANCIAL_WRITE | None | No financial access |
| INVOICE_MANAGE | None | No invoice access |
| PAYMENT_MANAGE | None | No payment access |
| REPORTING | None | No reporting access |
| HR_READ | None | No HR access |
| HR_WRITE | None | No HR access |
| STAFF_MANAGE | None | No staff management |
| PAYROLL_MANAGE | None | No payroll access |
| DBS_MANAGE | None | No DBS access |
| COMPLIANCE_READ | None | No compliance access |
| COMPLIANCE_WRITE | None | No compliance write |
| AUDIT_READ | None | No audit access |
| REPORT_GENERATE | None | No reporting access |
| INCIDENT_MANAGE | None | No incident access |

### External Auditor
| Permission | Access Level | Notes |
|------------|--------------|-------|
| SYSTEM_CONFIG | None | No system access |
| USER_MANAGEMENT | None | No user management |
| ROLE_MANAGEMENT | None | No role management |
| AUDIT_ACCESS | Read | Audit logs only |
| SECURITY_CONFIG | None | No security config |
| TENANT_CONFIG | None | No tenant config |
| TENANT_USERS | None | No user management |
| TENANT_DATA | Read | Audit data only |
| TENANT_COMPLIANCE | Read | Compliance data only |
| CLINICAL_READ | None | No clinical access |
| CLINICAL_WRITE | None | No clinical write |
| MEDICATION_MANAGE | None | No medication access |
| CARE_PLAN_MANAGE | None | No care plan access |
| ASSESSMENT_MANAGE | None | No assessment access |
| RESIDENT_READ | None | No resident access |
| RESIDENT_WRITE | None | No resident write |
| RESIDENT_CREATE | None | No creation |
| RESIDENT_DELETE | None | No deletion |
| RESIDENT_EXPORT | None | No export |
| FINANCIAL_READ | None | No financial access |
| FINANCIAL_WRITE | None | No financial access |
| INVOICE_MANAGE | None | No invoice access |
| PAYMENT_MANAGE | None | No payment access |
| REPORTING | Read | Audit reports only |
| HR_READ | None | No HR access |
| HR_WRITE | None | No HR access |
| STAFF_MANAGE | None | No staff management |
| PAYROLL_MANAGE | None | No payroll access |
| DBS_MANAGE | None | No DBS access |
| COMPLIANCE_READ | Read | Compliance data only |
| COMPLIANCE_WRITE | None | No compliance write |
| AUDIT_READ | Read | Audit logs only |
| REPORT_GENERATE | Read | Audit reports only |
| INCIDENT_MANAGE | None | No incident access |

## Module-Specific Permissions

### Medication Management Module
| Role | View Medications | Administer Medications | Manage Prescriptions | View Reports |
|------|------------------|------------------------|---------------------|--------------|
| System Admin | Full | Full | Full | Full |
| Tenant Admin | Full | Full | Full | Full |
| Clinical Manager | Full | Full | Full | Full |
| Care Coordinator | Assigned | Assigned | Assigned | Assigned |
| Registered Nurse | Assigned | Assigned | Read | Assigned |
| Care Assistant | Assigned | None | None | None |
| Family Member | Own | None | None | None |
| External Auditor | None | None | None | Audit Only |

### Care Planning Module
| Role | View Care Plans | Create Care Plans | Modify Care Plans | Approve Care Plans |
|------|-----------------|-------------------|-------------------|-------------------|
| System Admin | Full | Full | Full | Full |
| Tenant Admin | Full | Full | Full | Full |
| Clinical Manager | Full | Full | Full | Full |
| Care Coordinator | Assigned | Assigned | Assigned | None |
| Registered Nurse | Assigned | None | Assigned | None |
| Care Assistant | Assigned | None | None | None |
| Family Member | Own | None | None | None |
| External Auditor | None | None | None | None |

### Financial Management Module
| Role | View Financials | Create Transactions | Approve Payments | Generate Reports |
|------|-----------------|-------------------|------------------|------------------|
| System Admin | Full | Full | Full | Full |
| Tenant Admin | Full | Full | Full | Full |
| Clinical Manager | None | None | None | None |
| Care Coordinator | None | None | None | None |
| Registered Nurse | None | None | None | None |
| Care Assistant | None | None | None | None |
| Family Member | None | None | None | None |
| External Auditor | Audit Only | None | None | Audit Only |

## Implementation Guidelines

### 1. Permission Inheritance
- Higher-level roles inherit permissions from lower-level roles
- System Administrator inherits all permissions
- Tenant Administrator inherits tenant-specific permissions
- Clinical roles inherit clinical permissions

### 2. Dynamic Permissions
- Permissions can be granted/revoked dynamically
- Time-based permissions for temporary access
- Context-based permissions for specific situations
- Emergency override permissions for critical situations

### 3. Audit Requirements
- All permission changes must be audited
- Failed access attempts must be logged
- Permission usage must be monitored
- Regular access reviews must be conducted

### 4. Compliance Considerations
- GDPR: Data access must be justified and documented
- NHS Digital: Clinical access must follow clinical guidelines
- CQC: Access controls must support safe care delivery
- ISO 27001: Access controls must be regularly reviewed

## Security Controls

### 1. Authentication
- Multi-factor authentication for all administrative roles
- Single sign-on for convenience
- Session management with appropriate timeouts
- Password policies and complexity requirements

### 2. Authorization
- Role-based access control implementation
- Principle of least privilege
- Regular access reviews
- Automated permission provisioning/deprovisioning

### 3. Monitoring
- Real-time access monitoring
- Anomaly detection for unusual access patterns
- Regular security assessments
- Incident response procedures

### 4. Compliance
- Regular compliance audits
- Documentation of access controls
- Training and awareness programs
- Continuous improvement processes

---

**Document Version**: 1.0.0  
**Last Updated**: January 2025  
**Next Review**: April 2025  
**Classification**: CONFIDENTIAL  
**Maintained By**: WriteCareNotes Security Team