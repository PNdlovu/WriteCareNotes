# Child Allowances API Documentation

**Module**: Pocket Money & Allowances Management  
**Version**: 1.0.0  
**Base URL**: `/api/children/allowances`  
**Authentication**: JWT Bearer Token (Required for all endpoints)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Pocket Money Endpoints](#pocket-money-endpoints)
4. [Allowance Expenditure Endpoints](#allowance-expenditure-endpoints)
5. [Savings Account Endpoints](#savings-account-endpoints)
6. [Reports & Analytics Endpoints](#reports--analytics-endpoints)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)
9. [British Isles Compliance](#british-isles-compliance)

---

## Overview

The Child Allowances API provides comprehensive financial management for looked-after children across the British Isles, covering:

- **Pocket Money**: Weekly disbursement tracking with age-based rates
- **Allowances**: Expenditure tracking for clothing, birthdays, festivals, education, cultural needs
- **Savings**: Account management with deposits, withdrawals, and interest
- **Reporting**: Quarterly summaries, IRO dashboards, budget analysis

### Key Features

✅ **Age-Based Rates**: Automatic calculation based on 8 British Isles jurisdictions  
✅ **Approval Workflows**: Social worker → Manager escalation for high-value items  
✅ **Receipt Management**: Upload, verify, and track receipt images  
✅ **Budget Tracking**: Real-time budget vs actual comparison  
✅ **Cultural Support**: Equality Act 2010 compliant (cultural/religious needs)  
✅ **Complete Audit Trail**: Who, what, when for all transactions  
✅ **IRO Dashboard**: Items requiring attention (pending approvals, missing receipts, etc.)

### Jurisdictions Supported

| Jurisdiction | Currency | Age Bands | Pocket Money Range |
|-------------|----------|-----------|-------------------|
| England | GBP | 5-7, 8-10, 11-15, 16-18 | £5.00 - £12.50/week |
| Scotland | GBP | 5-7, 8-10, 11-15, 16-18 | £5.00 - £14.00/week |
| Wales | GBP | 5-7, 8-10, 11-15, 16-18 | £5.00 - £12.50/week |
| Northern Ireland | GBP | 5-7, 8-10, 11-15, 16-18 | £5.00 - £11.00/week |
| Ireland | EUR | 5-7, 8-10, 11-15, 16-18 | €6.00 - €15.00/week |
| Jersey | GBP | 5-7, 8-10, 11-15, 16-18 | £5.00 - £12.50/week |
| Guernsey | GBP | 5-7, 8-10, 11-15, 16-18 | £5.00 - £12.50/week |
| Isle of Man | GBP | 5-7, 8-10, 11-15, 16-18 | £5.00 - £12.50/week |

---

## Authentication & Authorization

### Authentication

All endpoints require a valid JWT bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

### Role-Based Access Control (RBAC)

Access is controlled by user roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| `SOCIAL_WORKER` | Allocated social worker | Full access to assigned children |
| `RESIDENTIAL_WORKER` | Care home staff | Disbursement & receipt operations |
| `MANAGER` | Service manager | Approval authority, high-value items |
| `IRO` | Independent Reviewing Officer | Read-only access, dashboard |
| `ADMIN` | System administrator | Full access |

### Role Requirements by Endpoint

- **Disburse Pocket Money**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN
- **Withhold Money**: MANAGER, ADMIN only
- **Approve Expenditure**: SOCIAL_WORKER, MANAGER, ADMIN
- **View IRO Dashboard**: IRO, MANAGER, ADMIN
- **Apply Interest**: MANAGER, ADMIN only

---

## Pocket Money Endpoints

### 1. Disburse Weekly Pocket Money

Disburse pocket money to a child for a specific week.

**Endpoint**: `POST /pocket-money/disburse`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "childId": "uuid",
  "weekNumber": 42,
  "year": 2025,
  "jurisdiction": "ENGLAND",
  "method": "CASH",
  "partialAmount": 10.00,
  "savingsAmount": 2.50,
  "notes": "Child requested partial savings transfer"
}
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| childId | UUID | Yes | Child identifier |
| weekNumber | Integer | Yes | ISO week number (1-53) |
| year | Integer | Yes | Year (2020-2100) |
| jurisdiction | Enum | Yes | British Isles jurisdiction |
| method | Enum | Yes | CASH, BANK_TRANSFER, PREPAID_CARD, DIRECT_TO_CHILD, HELD_IN_TRUST |
| partialAmount | Decimal | No | Amount to disburse (if less than expected) |
| savingsAmount | Decimal | No | Amount to transfer to savings |
| notes | String | No | Additional notes |

#### Response

```json
{
  "id": "uuid",
  "childId": "uuid",
  "weekNumber": 42,
  "year": 2025,
  "jurisdiction": "ENGLAND",
  "expectedAmount": 12.50,
  "disbursedAmount": 10.00,
  "status": "DISBURSED",
  "disbursementMethod": "CASH",
  "transferredToSavings": 2.50,
  "disbursedDate": "2025-10-10T14:30:00Z",
  "disbursedByStaffId": "uuid",
  "createdAt": "2025-10-10T14:30:00Z"
}
```

#### Status Codes

- `201 Created`: Pocket money disbursed successfully
- `400 Bad Request`: Validation error or duplicate disbursement
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Child not found

---

### 2. Confirm Child Receipt

Confirm that child received pocket money.

**Endpoint**: `PATCH /pocket-money/:id/confirm-receipt`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "childSignature": "John Smith - 10/10/2025",
  "childComment": "Thank you for my pocket money"
}
```

#### Response

```json
{
  "id": "uuid",
  "receiptConfirmed": true,
  "childSignature": "John Smith - 10/10/2025",
  "childComment": "Thank you for my pocket money",
  "updatedAt": "2025-10-10T14:35:00Z"
}
```

---

### 3. Record Pocket Money Refusal

Record when a child refuses pocket money.

**Endpoint**: `PATCH /pocket-money/:id/record-refusal`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "reason": "Child stated they didn't want pocket money this week"
}
```

#### Response

```json
{
  "id": "uuid",
  "wasRefused": true,
  "refusalReason": "Child stated they didn't want pocket money this week",
  "refusalTimestamp": "2025-10-10T14:40:00Z",
  "status": "REFUSED"
}
```

---

### 4. Withhold Pocket Money (Manager Only)

Withhold pocket money with manager approval.

**Endpoint**: `PATCH /pocket-money/:id/withhold`  
**Roles**: MANAGER, ADMIN

#### Request Body

```json
{
  "reason": "Disciplinary sanction following placement disruption - reviewed with IRO"
}
```

#### Response

```json
{
  "id": "uuid",
  "wasWithheld": true,
  "withholdingReason": "Disciplinary sanction following placement disruption - reviewed with IRO",
  "withholdingApprovedByManagerId": "uuid",
  "withholdingApprovalDate": "2025-10-10T14:45:00Z",
  "status": "WITHHELD"
}
```

---

### 5. Defer Disbursement

Postpone pocket money disbursement (e.g., child absent).

**Endpoint**: `PATCH /pocket-money/:id/defer`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "reason": "Child on respite care visit",
  "deferToDate": "2025-10-17"
}
```

#### Response

```json
{
  "id": "uuid",
  "wasDeferred": true,
  "deferralReason": "Child on respite care visit",
  "deferToDate": "2025-10-17",
  "status": "DEFERRED"
}
```

---

### 6. Get Pocket Money Transactions

Retrieve pocket money transactions for a child.

**Endpoint**: `GET /pocket-money/child/:childId`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | Integer | No | Filter by year |
| status | Enum | No | Filter by status (PENDING, DISBURSED, REFUSED, WITHHELD, DEFERRED) |
| startDate | Date | No | Filter from date |
| endDate | Date | No | Filter to date |

#### Example Request

```http
GET /pocket-money/child/550e8400-e29b-41d4-a716-446655440000?year=2025&status=DISBURSED
```

#### Response

```json
[
  {
    "id": "uuid",
    "childId": "uuid",
    "weekNumber": 42,
    "year": 2025,
    "expectedAmount": 12.50,
    "disbursedAmount": 12.50,
    "status": "DISBURSED",
    "disbursementMethod": "CASH",
    "disbursedDate": "2025-10-10T14:30:00Z"
  },
  {
    "id": "uuid",
    "childId": "uuid",
    "weekNumber": 41,
    "year": 2025,
    "expectedAmount": 12.50,
    "disbursedAmount": 12.50,
    "status": "DISBURSED",
    "disbursementMethod": "CASH",
    "disbursedDate": "2025-10-03T14:30:00Z"
  }
]
```

---

## Allowance Expenditure Endpoints

### 7. Request Allowance Expenditure

Request approval for allowance expenditure (clothing, birthday, education, etc.).

**Endpoint**: `POST /allowances/request`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "childId": "uuid",
  "allowanceType": "CLOTHING_SEASONAL",
  "amount": 75.50,
  "itemDescription": "Winter coat and school shoes",
  "vendor": "Next",
  "purchaseDate": "2025-10-10",
  "budgetAmount": 200.00,
  "isCultural": false,
  "isReligious": false,
  "childPresent": true,
  "childChose": true
}
```

#### Allowance Types

**Clothing**:
- `CLOTHING_SEASONAL` - Quarterly/seasonal clothing
- `CLOTHING_SCHOOL_UNIFORM` - School uniform
- `CLOTHING_SPORTS` - Sports/PE kit
- `CLOTHING_SPECIAL_OCCASION` - Formal wear
- `FOOTWEAR` - Shoes, trainers

**Birthday & Festivals**:
- `BIRTHDAY_GRANT` - Annual birthday money
- `CHRISTMAS_GRANT` - Christmas
- `EID_GRANT` - Eid al-Fitr, Eid al-Adha
- `DIWALI_GRANT` - Diwali
- `HANUKKAH_GRANT` - Hanukkah
- `FESTIVAL_OTHER` - Other religious/cultural festivals

**Education**:
- `EDUCATION_SCHOOL_TRIP` - School trips
- `EDUCATION_EQUIPMENT` - Books, calculator, laptop
- `EDUCATION_EXAM_FEES` - GCSE, A-Level exam fees
- `EDUCATION_MUSIC_LESSONS` - Music lessons/instruments
- `EDUCATION_TUTORING` - Private tutoring

**Cultural & Religious**:
- `CULTURAL_ACTIVITIES` - Cultural events, heritage activities
- `RELIGIOUS_ACTIVITIES` - Religious education, events
- `LANGUAGE_CLASSES` - Heritage language classes

**Hobbies & Leisure**:
- `HOBBIES_SPORTS` - Sports clubs, equipment
- `HOBBIES_ARTS` - Art supplies, classes
- `HOBBIES_MUSIC` - Music equipment, lessons
- `HOBBIES_OTHER` - Other hobby expenses

**Personal Care**:
- `PERSONAL_CARE_TOILETRIES` - Toiletries, hygiene
- `PERSONAL_CARE_HAIR` - Haircuts, hair care
- `PERSONAL_CARE_OPTICAL` - Glasses, contact lenses
- `PERSONAL_CARE_DENTAL` - Orthodontics (beyond NHS)

**Other**:
- `TRAVEL_HOME_VISIT` - Travel to family visits
- `TECHNOLOGY` - Phone top-up, internet
- `OTHER` - Miscellaneous

#### Response

```json
{
  "id": "uuid",
  "childId": "uuid",
  "allowanceType": "CLOTHING_SEASONAL",
  "category": "CLOTHING",
  "amount": 75.50,
  "itemDescription": "Winter coat and school shoes",
  "vendor": "Next",
  "purchaseDate": "2025-10-10",
  "approvalStatus": "PENDING",
  "requiresManagerApproval": false,
  "budgetAmount": 200.00,
  "budgetRemaining": 124.50,
  "exceedsBudget": false,
  "childWasPresent": true,
  "childChose": true,
  "requestedByStaffId": "uuid",
  "requestedAt": "2025-10-10T15:00:00Z"
}
```

**Note**: Expenditures > £100 automatically escalate to manager approval (`requiresManagerApproval: true`, `approvalStatus: "ESCALATED"`).

---

### 8. Approve Allowance Expenditure

Approve an expenditure request.

**Endpoint**: `PATCH /allowances/:id/approve`  
**Roles**: SOCIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "notes": "Appropriate purchase for winter season"
}
```

#### Response

```json
{
  "id": "uuid",
  "approvalStatus": "APPROVED",
  "approvedByStaffId": "uuid",
  "approvedAt": "2025-10-10T15:05:00Z",
  "approvalNotes": "Appropriate purchase for winter season"
}
```

---

### 9. Reject Allowance Expenditure

Reject an expenditure request.

**Endpoint**: `PATCH /allowances/:id/reject`  
**Roles**: SOCIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "reason": "Amount exceeds quarterly budget. Please revise."
}
```

#### Response

```json
{
  "id": "uuid",
  "approvalStatus": "REJECTED",
  "approvedByStaffId": "uuid",
  "approvedAt": "2025-10-10T15:10:00Z",
  "approvalNotes": "Amount exceeds quarterly budget. Please revise."
}
```

---

### 10. Upload Receipt

Upload receipt image for an expenditure.

**Endpoint**: `POST /allowances/:id/upload-receipt`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN  
**Content-Type**: `multipart/form-data`

#### Request Body

```
Content-Type: multipart/form-data

file: <binary-file-data>
```

**Allowed File Types**: JPEG, PNG, PDF  
**Max File Size**: 5MB

#### Response

```json
{
  "id": "uuid",
  "receiptStatus": "UPLOADED",
  "receiptImageUrl": "/uploads/receipts/receipt-1728518400000-123456789.jpg",
  "receiptUploadedAt": "2025-10-10T15:15:00Z",
  "receiptUploadedByStaffId": "uuid"
}
```

---

### 11. Verify Receipt

Verify receipt for an expenditure.

**Endpoint**: `PATCH /allowances/:id/verify-receipt`  
**Roles**: SOCIAL_WORKER, MANAGER, ADMIN

#### Response

```json
{
  "id": "uuid",
  "receiptStatus": "VERIFIED",
  "receiptVerifiedAt": "2025-10-10T15:20:00Z",
  "receiptVerifiedByStaffId": "uuid"
}
```

---

### 12. Get Allowance Expenditures

Retrieve expenditures for a child.

**Endpoint**: `GET /allowances/child/:childId`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| allowanceType | Enum | No | Filter by allowance type |
| category | String | No | Filter by category (CLOTHING, EDUCATION, etc.) |
| approvalStatus | Enum | No | Filter by status (PENDING, APPROVED, REJECTED) |
| year | Integer | No | Filter by year |
| quarter | Integer | No | Filter by quarter (1-4) |

#### Example Request

```http
GET /allowances/child/550e8400-e29b-41d4-a716-446655440000?category=CLOTHING&year=2025&quarter=4
```

#### Response

```json
[
  {
    "id": "uuid",
    "allowanceType": "CLOTHING_SEASONAL",
    "category": "CLOTHING",
    "amount": 75.50,
    "itemDescription": "Winter coat and school shoes",
    "vendor": "Next",
    "purchaseDate": "2025-10-10",
    "approvalStatus": "APPROVED",
    "receiptStatus": "VERIFIED"
  }
]
```

---

## Savings Account Endpoints

### 13. Open Savings Account

Open a savings account for a child.

**Endpoint**: `POST /savings/open`  
**Roles**: SOCIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "childId": "uuid",
  "accountType": "INTERNAL_POCKET_MONEY",
  "accountName": "Sarah's Birthday Savings",
  "interestRate": 2.5,
  "savingsGoal": {
    "amount": 200.00,
    "description": "New bicycle",
    "targetDate": "2026-05-15"
  }
}
```

#### Account Types

- `INTERNAL_POCKET_MONEY` - Internal account for pocket money savings
- `INTERNAL_ALLOWANCE` - Internal account for allowance savings
- `EXTERNAL_BANK_ACCOUNT` - Real bank account (Junior ISA, Children's Account)
- `TRUST_ACCOUNT` - Trust account for 16+ pathway

#### Response

```json
{
  "id": "uuid",
  "childId": "uuid",
  "accountType": "INTERNAL_POCKET_MONEY",
  "accountName": "Sarah's Birthday Savings",
  "status": "ACTIVE",
  "currentBalance": 0.00,
  "interestRate": 2.5,
  "savingsGoalAmount": 200.00,
  "savingsGoalDescription": "New bicycle",
  "savingsGoalTargetDate": "2026-05-15",
  "openedDate": "2025-10-10",
  "openedByStaffId": "uuid"
}
```

---

### 14. Deposit to Savings

Deposit money to a savings account.

**Endpoint**: `POST /savings/:accountId/deposit`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "amount": 10.00,
  "description": "Weekly pocket money savings",
  "linkedPocketMoneyTransactionId": "uuid"
}
```

#### Response

```json
{
  "id": "uuid",
  "accountId": "uuid",
  "transactionType": "DEPOSIT",
  "amount": 10.00,
  "description": "Weekly pocket money savings",
  "balanceBefore": 50.00,
  "balanceAfter": 60.00,
  "transactionDate": "2025-10-10T15:30:00Z",
  "linkedPocketMoneyTransactionId": "uuid"
}
```

---

### 15. Request Withdrawal

Request withdrawal from savings account.

**Endpoint**: `POST /savings/:accountId/withdraw`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "amount": 25.00,
  "purpose": "Purchase new trainers"
}
```

#### Response

```json
{
  "id": "uuid",
  "accountId": "uuid",
  "transactionType": "WITHDRAWAL",
  "amount": 25.00,
  "purpose": "Purchase new trainers",
  "withdrawalStatus": "PENDING",
  "requiresManagerApproval": false,
  "requestedByStaffId": "uuid",
  "transactionDate": "2025-10-10T15:35:00Z"
}
```

**Note**: Withdrawals > £50 require manager approval (`requiresManagerApproval: true`).

---

### 16. Approve Withdrawal

Approve a withdrawal request.

**Endpoint**: `PATCH /savings/withdrawals/:transactionId/approve`  
**Roles**: SOCIAL_WORKER, MANAGER, ADMIN

#### Request Body

```json
{
  "notes": "Appropriate purchase - child needs new trainers"
}
```

#### Response

```json
{
  "id": "uuid",
  "withdrawalStatus": "COMPLETED",
  "approvedByStaffId": "uuid",
  "approvedAt": "2025-10-10T15:40:00Z",
  "approvalNotes": "Appropriate purchase - child needs new trainers",
  "balanceAfter": 35.00,
  "disbursedAt": "2025-10-10T15:40:00Z"
}
```

---

### 17. Get Savings Account

Retrieve savings account for a child.

**Endpoint**: `GET /savings/child/:childId`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountType | Enum | No | Filter by account type |

#### Response

```json
{
  "id": "uuid",
  "childId": "uuid",
  "accountType": "INTERNAL_POCKET_MONEY",
  "accountName": "Sarah's Birthday Savings",
  "status": "ACTIVE",
  "currentBalance": 60.00,
  "totalDeposits": 60.00,
  "totalWithdrawals": 0.00,
  "totalInterest": 0.00,
  "savingsGoalAmount": 200.00,
  "savingsGoalProgress": 30.00,
  "savingsGoalAchieved": false
}
```

---

### 18. Get Savings Transactions

Retrieve transactions for a savings account.

**Endpoint**: `GET /savings/:accountId/transactions`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| transactionType | Enum | No | DEPOSIT, WITHDRAWAL, INTEREST, TRANSFER_IN, TRANSFER_OUT |

#### Response

```json
[
  {
    "id": "uuid",
    "transactionType": "DEPOSIT",
    "amount": 10.00,
    "description": "Weekly pocket money savings",
    "balanceBefore": 50.00,
    "balanceAfter": 60.00,
    "transactionDate": "2025-10-10T15:30:00Z"
  },
  {
    "id": "uuid",
    "transactionType": "DEPOSIT",
    "amount": 10.00,
    "description": "Weekly pocket money savings",
    "balanceBefore": 40.00,
    "balanceAfter": 50.00,
    "transactionDate": "2025-10-03T15:30:00Z"
  }
]
```

---

### 19. Apply Monthly Interest (Batch)

Apply monthly interest to all active savings accounts.

**Endpoint**: `POST /savings/apply-interest`  
**Roles**: MANAGER, ADMIN

#### Response

```json
{
  "message": "Monthly interest applied successfully",
  "totalInterest": 15.75,
  "appliedAt": "2025-10-10T16:00:00Z"
}
```

---

## Reports & Analytics Endpoints

### 20. Get Quarterly Summary

Comprehensive quarterly summary for a child.

**Endpoint**: `GET /reports/quarterly/:childId`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | Integer | Yes | Year |
| quarter | Integer | Yes | Quarter (1-4) |

#### Example Request

```http
GET /reports/quarterly/550e8400-e29b-41d4-a716-446655440000?year=2025&quarter=4
```

#### Response

```json
{
  "pocketMoney": {
    "disbursed": 162.50,
    "refused": 0,
    "withheld": 0,
    "deferred": 1
  },
  "allowances": {
    "total": 285.75,
    "byCategory": {
      "CLOTHING": 175.50,
      "EDUCATION": 85.25,
      "HOBBIES": 25.00
    }
  },
  "savings": {
    "deposits": 60.00,
    "withdrawals": 25.00,
    "balance": 60.00
  }
}
```

---

### 21. Get IRO Dashboard

Dashboard of items requiring attention.

**Endpoint**: `GET /reports/iro-dashboard`  
**Roles**: IRO, MANAGER, ADMIN

#### Response

```json
{
  "pendingApprovals": [
    {
      "id": "uuid",
      "childId": "uuid",
      "allowanceType": "EDUCATION_EQUIPMENT",
      "amount": 150.00,
      "itemDescription": "Laptop for A-Level studies",
      "approvalStatus": "ESCALATED",
      "requiresManagerApproval": true,
      "requestedAt": "2025-10-08T10:00:00Z"
    }
  ],
  "missingReceipts": [
    {
      "id": "uuid",
      "childId": "uuid",
      "amount": 45.00,
      "itemDescription": "School shoes",
      "approvalStatus": "APPROVED",
      "receiptStatus": "PENDING",
      "purchaseDate": "2025-10-05"
    }
  ],
  "budgetOverruns": [
    {
      "id": "uuid",
      "childId": "uuid",
      "category": "CLOTHING",
      "budgetAmount": 200.00,
      "budgetRemaining": -15.50,
      "exceedsBudget": true
    }
  ],
  "pendingWithdrawals": [
    {
      "id": "uuid",
      "childId": "uuid",
      "amount": 75.00,
      "purpose": "Birthday party expenses",
      "withdrawalStatus": "PENDING",
      "requiresManagerApproval": true,
      "requestedAt": "2025-10-09T14:00:00Z"
    }
  ],
  "varianceAlerts": [
    {
      "id": "uuid",
      "childId": "uuid",
      "expectedAmount": 12.50,
      "disbursedAmount": 8.00,
      "variance": -4.50,
      "varianceReason": "Partial disbursement - child absent for 2 days"
    }
  ]
}
```

---

### 22. Get Budget vs Actual

Budget analysis by category.

**Endpoint**: `GET /reports/budget-vs-actual/:childId`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | Integer | Yes | Year |

#### Example Request

```http
GET /reports/budget-vs-actual/550e8400-e29b-41d4-a716-446655440000?year=2025
```

#### Response

```json
[
  {
    "category": "CLOTHING",
    "budget": 500.00,
    "spent": 375.50,
    "remaining": 124.50,
    "percentageUsed": 75.1
  },
  {
    "category": "EDUCATION",
    "budget": 300.00,
    "spent": 185.75,
    "remaining": 114.25,
    "percentageUsed": 61.92
  },
  {
    "category": "BIRTHDAY",
    "budget": 100.00,
    "spent": 100.00,
    "remaining": 0.00,
    "percentageUsed": 100.0
  },
  {
    "category": "HOBBIES",
    "budget": 200.00,
    "spent": 125.00,
    "remaining": 75.00,
    "percentageUsed": 62.5
  }
]
```

---

### 23. Get Pocket Money Rates

Get pocket money rates for a jurisdiction.

**Endpoint**: `GET /rates/:jurisdiction`  
**Roles**: SOCIAL_WORKER, RESIDENTIAL_WORKER, MANAGER, IRO, ADMIN

#### Example Request

```http
GET /rates/ENGLAND
```

#### Response

```json
{
  "jurisdiction": "ENGLAND",
  "currency": "GBP",
  "rates": {
    "5-7": 5.00,
    "8-10": 7.50,
    "11-15": 10.00,
    "16-18": 12.50
  },
  "source": "Care Planning Regulations 2010"
}
```

---

## Data Models

### PocketMoneyTransaction

```typescript
{
  id: UUID
  childId: UUID
  jurisdiction: BritishIslesJurisdiction
  weekNumber: Integer (1-53)
  year: Integer
  weekStartDate: Date
  weekEndDate: Date
  expectedAmount: Decimal
  ageRange: String
  status: DisbursementStatus
  disbursedAmount: Decimal
  disbursementMethod: DisbursementMethod
  disbursedDate: DateTime
  disbursedByStaffId: UUID
  variance: Decimal
  hasVariance: Boolean
  varianceReason: String
  receiptConfirmed: Boolean
  childSignature: String
  childComment: String
  wasRefused: Boolean
  refusalReason: String
  wasWithheld: Boolean
  withholdingReason: String
  withholdingApprovedByManagerId: UUID
  wasDeferred: Boolean
  deferralReason: String
  deferToDate: Date
  transferredToSavings: Decimal
  savingsAccountId: UUID
  currency: String
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: String
  updatedBy: String
}
```

### AllowanceExpenditure

```typescript
{
  id: UUID
  childId: UUID
  allowanceType: AllowanceType
  category: String
  amount: Decimal
  currency: String
  budgetAmount: Decimal
  budgetRemaining: Decimal
  exceedsBudget: Boolean
  itemDescription: String
  vendor: String
  purchaseDate: Date
  quarter: Integer (1-4)
  year: Integer
  approvalStatus: ApprovalStatus
  requestedByStaffId: UUID
  requestedAt: DateTime
  approvedByStaffId: UUID
  approvedAt: DateTime
  approvalNotes: String
  requiresManagerApproval: Boolean
  escalatedToManagerId: UUID
  receiptStatus: ReceiptStatus
  receiptImageUrl: String
  receiptImages: String[]
  receiptUploadedAt: DateTime
  receiptUploadedByStaffId: UUID
  receiptVerifiedAt: DateTime
  receiptVerifiedByStaffId: UUID
  receiptRejectionReason: String
  childWasPresent: Boolean
  childChose: Boolean
  childFeedback: String
  isCulturalNeed: Boolean
  isReligiousNeed: Boolean
  culturalReligiousContext: String
  linkedPocketMoneyTransactionId: UUID
  linkedSavingsWithdrawalId: UUID
  notes: String
  metadata: Object
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: String
  updatedBy: String
}
```

### ChildSavingsAccount

```typescript
{
  id: UUID
  childId: UUID
  accountType: SavingsAccountType
  accountName: String
  status: String (ACTIVE, CLOSED, FROZEN)
  openedDate: Date
  closedDate: Date
  closureReason: String
  currentBalance: Decimal
  currency: String
  totalDeposits: Decimal
  totalWithdrawals: Decimal
  totalInterest: Decimal
  bankName: String
  accountNumber: String (encrypted)
  sortCode: String (encrypted)
  accountHolderName: String
  bankAccountOpenedDate: Date
  interestRate: Decimal
  interestFrequency: String
  lastInterestCalculatedDate: Date
  accruedInterest: Decimal
  savingsGoalAmount: Decimal
  savingsGoalDescription: String
  savingsGoalTargetDate: Date
  savingsGoalAchieved: Boolean
  highValueThreshold: Decimal
  requiresManagerApproval: Boolean
  pendingWithdrawals: Integer
  openedByStaffId: UUID
  closedByStaffId: UUID
  notes: String
  metadata: Object
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: String
  updatedBy: String
}
```

### ChildSavingsTransaction

```typescript
{
  id: UUID
  accountId: UUID
  childId: UUID
  transactionType: SavingsTransactionType
  amount: Decimal
  currency: String
  transactionDate: DateTime
  description: String
  balanceBefore: Decimal
  balanceAfter: Decimal
  linkedPocketMoneyTransactionId: UUID
  linkedAllowanceExpenditureId: UUID
  withdrawalStatus: WithdrawalStatus
  requestedByStaffId: UUID
  approvedByStaffId: UUID
  approvedAt: DateTime
  approvalNotes: String
  requiresManagerApproval: Boolean
  managerApprovedByStaffId: UUID
  disbursementMethod: String
  disbursedAt: DateTime
  disbursedByStaffId: UUID
  childAcknowledged: Boolean
  childComment: String
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: String
  updatedBy: String
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "amount",
      "message": "amount must not be less than 0"
    }
  ]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Validation error or business logic violation |
| 401 | Unauthorized - Missing or invalid JWT token |
| 403 | Forbidden - Insufficient permissions for this operation |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource (e.g., duplicate weekly disbursement) |
| 500 | Internal Server Error - Unexpected server error |

### Common Error Messages

**Validation Errors**:
- `"childId must be a UUID"`
- `"weekNumber must not be less than 1"`
- `"weekNumber must not be greater than 53"`
- `"amount must not be less than 0"`
- `"Only JPEG, PNG, and PDF files are allowed"`
- `"File size must not exceed 5MB"`

**Business Logic Errors**:
- `"Pocket money already disbursed for child {childId} in week {weekNumber}/{year}"`
- `"Child {childId} already has an active {accountType} account"`
- `"Insufficient funds. Available: £60.00"`
- `"Savings amount cannot exceed disbursed amount"`
- `"Cannot deposit to inactive account"`
- `"Cannot close account with balance £60.00. Transfer funds first."`

**Authorization Errors**:
- `"Unauthorized"`
- `"Forbidden - manager role required"`
- `"Forbidden - insufficient permissions"`

**Not Found Errors**:
- `"Child {childId} not found"`
- `"Transaction {transactionId} not found"`
- `"Expenditure {expenditureId} not found"`
- `"Account {accountId} not found"`
- `"No active savings account found for child {childId}"`

---

## British Isles Compliance

### Regulatory Framework

This API implements statutory requirements across the British Isles:

#### England
- **Care Planning Regulations 2010** - Regulation 5 (pocket money and savings)
- **Children Act 1989** - Section 22(3) (safeguarding child's property)
- **Equality Act 2010** - Cultural and religious needs support

#### Scotland
- **Looked After Children (Scotland) Regulations 2009**
- **Children (Scotland) Act 1995**

#### Wales
- **Care Planning, Placement and Case Review (Wales) Regulations 2015**
- **Children Act 1989** (as applied to Wales)

#### Northern Ireland
- **Children (Northern Ireland) Order 1995**
- **Children's Homes Regulations (Northern Ireland) 2005**

#### Ireland
- **Child Care Act 1991**
- **Tusla guidance on financial management for children in care**

#### Crown Dependencies
- **Jersey**: Follow England statutory guidance
- **Guernsey**: Follow England statutory guidance
- **Isle of Man**: Follow England statutory guidance

### Pocket Money Rates (Statutory Guidance)

Rates are based on statutory guidance and local authority policies:

| Age Band | England | Scotland | Wales | N. Ireland | Ireland |
|----------|---------|----------|-------|------------|---------|
| 5-7 | £5.00 | £5.00 | £5.00 | £5.00 | €6.00 |
| 8-10 | £7.50 | £8.00 | £7.50 | £7.00 | €8.50 |
| 11-15 | £10.00 | £10.50 | £10.00 | £9.00 | €11.00 |
| 16-18 | £12.50 | £14.00 | £12.50 | £11.00 | €15.00 |

**Note**: Rates updated annually. Last review: October 2025.

### Cultural & Religious Needs (Equality Act 2010)

The API supports cultural and religious needs for looked-after children:

- **Festival Grants**: Christmas, Eid, Diwali, Hanukkah, and other festivals
- **Cultural Activities**: Heritage events, language classes
- **Religious Activities**: Religious education, worship attendance
- **Hair Care**: Culturally appropriate hair care products and services
- **Clothing**: Culturally appropriate clothing and footwear

Each expenditure can be flagged as `isCultural` or `isReligious` with context provided in `culturalReligiousContext`.

### Child Participation

Compliance with Children Act 1989 s22(4) - ascertaining child's wishes:

- **Child Involvement Tracking**: `childWasPresent`, `childChose` flags
- **Child Feedback**: `childComment`, `childFeedback` fields
- **Child Acknowledgement**: `childAcknowledged` for savings transactions
- **Receipt Confirmation**: `childSignature` for pocket money receipts

### IRO (Independent Reviewing Officer) Oversight

IRO role has read-only access to:
- All pocket money transactions
- All allowance expenditures
- All savings accounts and transactions
- IRO Dashboard (items requiring attention)
- Quarterly summaries
- Budget vs actual reports

This ensures independent oversight of financial management.

### Data Protection & Privacy

- **GDPR Compliance**: All data processing documented
- **Encryption**: Bank account details encrypted at rest
- **Audit Trail**: Complete history of who did what, when
- **Access Control**: Role-based access (RBAC)
- **Data Retention**: Configurable per jurisdiction

---

## Changelog

### Version 1.0.0 (2025-10-10)
- Initial release
- 24 REST endpoints
- British Isles compliance (8 jurisdictions)
- Pocket money, allowances, and savings management
- Receipt upload and verification
- Approval workflows
- IRO dashboard
- Quarterly reporting
- Budget vs actual analysis

---

## Support & Contact

For technical support or questions:
- **Email**: support@wcnotes.example.com
- **Documentation**: https://docs.wcnotes.example.com
- **Issue Tracker**: https://github.com/PNdlovu/WCNotes-new/issues

---

**Last Updated**: October 10, 2025  
**API Version**: 1.0.0  
**Documentation Version**: 1.0.0
