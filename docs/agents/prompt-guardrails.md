# Prompt Guardrails and Safety Controls
## Pilot Feedback Agent Orchestration System

**Document Version:** 1.0  
**Date:** 2025-01-22  
**Author:** AI Assistant  
**Status:** Active  

---

## Overview

This document defines the prompt guardrails, safety controls, and content filtering mechanisms for the Pilot Feedback Agent system to ensure safe, compliant, and effective processing of pilot feedback data.

## Core Safety Principles

### 1. Privacy-First Processing
- All PII must be masked before prompt processing
- No personal data in AI model inputs
- Pseudonymization of all identifiers

### 2. Content Safety
- Toxicity filtering and content moderation
- Healthcare-appropriate language requirements
- Professional communication standards

### 3. Compliance Assurance
- UK GDPR compliance in all prompts
- Healthcare sector requirements
- Audit trail for all processing decisions

---

## PII Redaction Rules

### 1.1 Personal Identifiers

#### Names and Titles
```
Pattern: \b[A-Z][a-z]+\s+[A-Z][a-z]+\b
Replacement: [NAME]
Examples:
- "Nurse Kelly Smith" → "[NAME]"
- "Dr. John Brown" → "[NAME]"
- "Manager Sarah Wilson" → "[NAME]"
```

#### Email Addresses
```
Pattern: \b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b
Replacement: [EMAIL]
Examples:
- "test@example.com" → "[EMAIL]"
- "nurse.smith@carehome.co.uk" → "[EMAIL]"
```

#### Phone Numbers
```
Pattern: \b(?:\+44|0)[1-9]\d{8,9}\b
Replacement: [PHONE]
Examples:
- "07912345678" → "[PHONE]"
- "+44 7912 345678" → "[PHONE]"
```

#### NHS Numbers
```
Pattern: \b\d{3}\s?\d{3}\s?\d{4}\b
Replacement: [NHS_NUMBER]
Examples:
- "123 456 7890" → "[NHS_NUMBER]"
- "1234567890" → "[NHS_NUMBER]"
```

### 1.2 Location Data

#### Postcodes
```
Pattern: \b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b
Replacement: [POSTCODE]
Examples:
- "SW1A 1AA" → "[POSTCODE]"
- "M1 1AA" → "[POSTCODE]"
```

#### Addresses
```
Pattern: \b\d+\s+[A-Za-z\s]+(?:Street|Road|Avenue|Lane|Drive|Close|Way|Place)\b
Replacement: [ADDRESS]
Examples:
- "123 Main Street" → "[ADDRESS]"
- "45 Care Home Road" → "[ADDRESS]"
```

### 1.3 Healthcare-Specific Identifiers

#### Medical Record Numbers
```
Pattern: \bMRN\d{6,10}\b
Replacement: [MEDICAL_RECORD]
Examples:
- "MRN123456" → "[MEDICAL_RECORD]"
- "MRN7890123" → "[MEDICAL_RECORD]"
```

#### Room Numbers
```
Pattern: \bRoom\s?\d{1,3}[A-Z]?\b
Replacement: [ROOM]
Examples:
- "Room 101" → "[ROOM]"
- "Room 2A" → "[ROOM]"
```

#### Staff IDs
```
Pattern: \b(?:STAFF|EMP|USER)\d{4,8}\b
Replacement: [STAFF_ID]
Examples:
- "STAFF1234" → "[STAFF_ID]"
- "EMP5678" → "[STAFF_ID]"
```

---

## Content Filtering and Moderation

### 2.1 Toxicity Detection

#### Blocked Content Categories
- **Hate Speech**: Discriminatory language, slurs, offensive terms
- **Harassment**: Personal attacks, threats, intimidation
- **Violence**: Threats of harm, graphic descriptions
- **Inappropriate Content**: Sexual content, profanity, unprofessional language

#### Healthcare-Specific Filters
- **Clinical Information**: Detailed medical conditions, treatments
- **Personal Details**: Family information, private circumstances
- **Confidential Data**: Internal policies, financial information

### 2.2 Content Quality Standards

#### Professional Language Requirements
- Clear, concise communication
- Appropriate healthcare terminology
- Respectful tone and language
- Constructive feedback focus

#### Content Length Limits
- **Minimum**: 10 characters
- **Maximum**: 2000 characters
- **Optimal**: 100-500 characters

---

## Prompt Engineering Guidelines

### 3.1 Prompt Structure

#### Standard Prompt Template
```
System: You are a healthcare feedback analysis assistant. Process the following masked feedback data to identify themes and generate recommendations.

Instructions:
1. Analyze the feedback for common themes
2. Identify patterns and trends
3. Generate actionable recommendations
4. Maintain professional healthcare context
5. Do not reference any personal information

Feedback Data: [MASKED_CONTENT]

Output Format:
- Theme: [theme_name]
- Pattern: [description]
- Recommendation: [actionable_item]
- Priority: [low/medium/high/critical]
```

#### Clustering Prompt Template
```
System: Group similar feedback items based on themes and patterns.

Instructions:
1. Identify common themes across feedback items
2. Group items with similar characteristics
3. Assign descriptive theme names
4. Count items in each group
5. Extract key phrases and keywords

Feedback Items: [MASKED_ITEMS]

Output Format:
- Cluster ID: [unique_identifier]
- Theme: [descriptive_name]
- Count: [number_of_items]
- Keywords: [key_phrases]
- Items: [item_references]
```

### 3.2 Context Preservation

#### Healthcare Context Maintenance
- Preserve care home terminology
- Maintain professional healthcare language
- Keep clinical relevance intact
- Ensure appropriate urgency levels

#### Feedback Context Preservation
- Module-specific processing
- Severity level maintenance
- Role-based context
- Timestamp relevance

---

## Safety Controls and Validation

### 4.1 Input Validation

#### Pre-Processing Checks
```typescript
interface ValidationRules {
  maxLength: 2000;
  minLength: 10;
  allowedCharacters: /^[a-zA-Z0-9\s.,!?()-]+$/;
  blockedPatterns: [
    /@\w+\.\w+/,  // Email patterns
    /\b\d{3}-\d{2}-\d{4}\b/,  // SSN patterns
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/  // Name patterns
  ];
  requiredFields: ['text', 'module', 'severity'];
}
```

#### Content Safety Checks
- Toxicity score < 0.3
- No blocked keywords detected
- Professional language validation
- Healthcare context verification

### 4.2 Output Validation

#### Response Quality Checks
- Coherent and relevant output
- Appropriate healthcare terminology
- No personal information leakage
- Actionable recommendations

#### Compliance Verification
- No PII in outputs
- Appropriate data minimization
- Audit trail completeness
- Consent compliance

---

## Error Handling and Fallbacks

### 5.1 Processing Errors

#### Common Error Scenarios
1. **PII Detection**: Content contains unmasked personal data
2. **Toxicity**: Content fails safety filters
3. **Length**: Content exceeds maximum length
4. **Format**: Invalid input format or structure

#### Error Response Protocol
```typescript
interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  action: 'retry' | 'reject' | 'manual_review';
  details: Record<string, any>;
}
```

#### Fallback Mechanisms
- **PII Detection**: Automatic masking retry
- **Toxicity**: Human review queue
- **Length**: Truncation with notification
- **Format**: Validation error with guidance

### 5.2 Safety Overrides

#### Emergency Stop Conditions
- PHI leakage detected
- Security breach indicators
- System compromise signs
- Compliance violation alerts

#### Manual Override Process
1. Immediate processing halt
2. Security team notification
3. Incident response activation
4. Audit log preservation
5. Recovery procedure initiation

---

## Monitoring and Alerting

### 6.1 Real-Time Monitoring

#### Key Metrics
- PII masking accuracy rate
- Content safety pass rate
- Processing success rate
- Response time metrics

#### Alert Thresholds
- PII masking accuracy < 99%
- Toxicity detection rate > 5%
- Processing errors > 10%
- Response time > 30 seconds

### 6.2 Audit and Compliance

#### Audit Logging
- All prompt inputs and outputs
- Safety check results
- Error conditions and responses
- Manual overrides and interventions

#### Compliance Reporting
- Daily safety metrics
- Weekly compliance reports
- Monthly trend analysis
- Quarterly risk assessments

---

## Testing and Validation

### 7.1 Automated Testing

#### Unit Tests
- PII masking accuracy
- Content filtering effectiveness
- Prompt template validation
- Error handling verification

#### Integration Tests
- End-to-end processing flows
- Safety control integration
- Error scenario handling
- Performance under load

### 7.2 Manual Testing

#### Red Team Exercises
- Adversarial prompt testing
- Security boundary testing
- Compliance validation
- Edge case exploration

#### User Acceptance Testing
- Healthcare professional review
- Feedback quality assessment
- Usability evaluation
- Performance validation

---

## Configuration and Tuning

### 8.1 Tunable Parameters

#### Safety Thresholds
```yaml
safety:
  pii_masking_accuracy: 0.99
  toxicity_threshold: 0.3
  content_length_max: 2000
  content_length_min: 10
  processing_timeout: 30
```

#### Content Filters
```yaml
filters:
  blocked_keywords: ["confidential", "private", "secret"]
  allowed_modules: ["medication", "care_planning", "scheduling"]
  severity_levels: ["low", "medium", "high", "critical"]
  role_types: ["care_worker", "admin", "manager", "family", "resident"]
```

### 8.2 Dynamic Configuration

#### Runtime Adjustments
- Threshold tuning based on performance
- Filter updates for new patterns
- Prompt template optimization
- Safety rule refinement

#### A/B Testing
- Safety control variations
- Prompt template comparisons
- Performance optimization
- User experience improvements

---

## Incident Response

### 9.1 Security Incidents

#### PHI Leakage Response
1. Immediate processing halt
2. Data containment and isolation
3. Security team notification
4. Incident documentation
5. Recovery and remediation

#### Safety Violation Response
1. Content quarantine
2. Human review activation
3. Pattern analysis and updates
4. System hardening
5. Prevention measures

### 9.2 Compliance Incidents

#### GDPR Violation Response
1. DPO notification within 24 hours
2. Data subject notification if required
3. Regulatory reporting if necessary
4. Remediation plan implementation
5. Prevention measure updates

---

## Maintenance and Updates

### 10.1 Regular Maintenance

#### Daily Tasks
- Safety metric review
- Error log analysis
- Performance monitoring
- Alert verification

#### Weekly Tasks
- Content filter updates
- Prompt template review
- Security patch application
- Compliance check

#### Monthly Tasks
- Comprehensive safety audit
- Performance optimization
- Documentation updates
- Training material review

### 10.2 Update Procedures

#### Safety Control Updates
1. Change request submission
2. Security review and approval
3. Testing and validation
4. Staged deployment
5. Monitoring and verification

#### Prompt Template Updates
1. Content review and approval
2. Healthcare professional validation
3. A/B testing implementation
4. Gradual rollout
5. Performance monitoring

---

## Documentation and Training

### 11.1 Documentation Requirements

#### Technical Documentation
- API specifications
- Configuration guides
- Troubleshooting procedures
- Security protocols

#### User Documentation
- User guides and manuals
- Best practices
- Common issues and solutions
- Training materials

### 11.2 Training Programs

#### Developer Training
- Safety control implementation
- Prompt engineering best practices
- Error handling procedures
- Security awareness

#### User Training
- System usage guidelines
- Safety and compliance awareness
- Feedback quality standards
- Incident reporting procedures

---

## Appendices

### Appendix A: PII Detection Patterns
Complete list of regex patterns and replacement rules

### Appendix B: Content Filtering Rules
Detailed filtering criteria and blocked content categories

### Appendix C: Error Codes and Messages
Comprehensive error handling reference

### Appendix D: Testing Scenarios
Test cases and validation procedures

---

**Document Control**
- **Version**: 1.0
- **Last Updated**: 2025-01-22
- **Next Review**: 2025-04-22
- **Classification**: Internal
- **Distribution**: Development Team, Security Team, Compliance Team