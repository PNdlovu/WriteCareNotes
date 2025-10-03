# Financial Analytics Service API Documentation

## Overview

The Financial Analytics Service provides comprehensive financial management capabilities for WriteCareNotes, including transaction processing, budgeting, forecasting, and regulatory compliance reporting specifically designed for healthcare operations across the British Isles.

## Base URL

```
https://api.writecarenotes.com/v1/financial
```

## Authentication

All API endpoints require authentication using JWT Bearer tokens:

```http
Authorization: Bearer <jwt-token>
```

## Rate Limits

- **Standard Operations**: 100 requests per 15 minutes per IP
- **Report Generation**: 10 requests per hour per user
- **Bulk Operations**: 20 requests per hour per user

## Common Headers

```http
Content-Type: application/json
Authorization: Bearer <jwt-token>
X-API-Version: v1
X-Correlation-ID: <uuid>
Accept-Language: en-GB
```

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "correlationId": "uuid",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `COMPLIANCE_VIOLATION`: Regulatory compliance issue

## Financial Transactions

### Create Transaction

Creates a new financial transaction with comprehensive validation and compliance checks.

```http
POST /transactions
```

**Request Body:**

```json
{
  "accountId": "uuid",
  "amount": "1000.00",
  "currency": "GBP",
  "description": "Resident monthly fee - John Smith",
  "category": "resident_fees",
  "reference": "INV-2025-001",
  "paymentMethod": "bank_transfer",
  "costCenter": "uuid",
  "residentId": "uuid",
  "departmentId": "uuid",
  "transactionDate": "2025-01-15T00:00:00Z",
  "vatAmount": "200.00",
  "vatRate": "0.20",
  "regulatoryCode": "NHS-001",
  "taxCode": "STD",
  "metadata": {
    "invoiceNumber": "INV-2025-001",
    "paymentTerms": "30 days"
  }
}
```

**Response:**

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "accountId": "uuid",
    "amount": "1000.00",
    "currency": "GBP",
    "description": "Resident monthly fee - John Smith",
    "category": "resident_fees",
    "status": "pending_approval",
    "transactionDate": "2025-01-15T00:00:00Z",
    "createdAt": "2025-01-15T10:30:00Z",
    "createdBy": "uuid",
    "correlationId": "uuid"
  },
  "correlationId": "uuid",
  "responseTime": 150
}
```

**Validation Rules:**

- Amount must be positive decimal with up to 4 decimal places
- Transaction date cannot be more than 7 days in the future
- Cash transactions over £1000 require additional approval
- NHS funding transactions require regulatory code
- Medication costs must be linked to a resident

### Get Transactions

Retrieves financial transactions with advanced filtering and pagination.

```http
GET /transactions?accountId=uuid&category=resident_fees&dateFrom=2025-01-01&dateTo=2025-01-31&page=1&limit=50
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| accountId | UUID | Filter by account ID |
| category | String | Transaction category |
| status | String | Transaction status |
| dateFrom | Date | Start date (ISO 8601) |
| dateTo | Date | End date (ISO 8601) |
| amountMin | Decimal | Minimum amount |
| amountMax | Decimal | Maximum amount |
| residentId | UUID | Filter by resident |
| departmentId | UUID | Filter by department |
| costCenter | String | Filter by cost center |
| isReconciled | Boolean | Reconciliation status |
| page | Integer | Page number (default: 1) |
| limit | Integer | Items per page (max: 1000) |
| sortBy | String | Sort field |
| sortOrder | String | ASC or DESC |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "amount": "1000.00",
      "currency": "GBP",
      "description": "Resident monthly fee",
      "category": "resident_fees",
      "status": "approved",
      "transactionDate": "2025-01-15T00:00:00Z",
      "isReconciled": false,
      "account": {
        "id": "uuid",
        "accountCode": "4000-01-01",
        "accountName": "Resident Fees Income"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "correlationId": "uuid"
}
```

### Get Single Transaction

```http
GET /transactions/{id}
```

**Response:**

```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "accountId": "uuid",
    "amount": "1000.00",
    "currency": "GBP",
    "description": "Resident monthly fee - John Smith",
    "category": "resident_fees",
    "status": "approved",
    "transactionDate": "2025-01-15T00:00:00Z",
    "approvedBy": "uuid",
    "approvedDate": "2025-01-15T11:00:00Z",
    "isReconciled": true,
    "reconciledDate": "2025-01-16T09:00:00Z",
    "account": {
      "accountCode": "4000-01-01",
      "accountName": "Resident Fees Income"
    },
    "auditTrail": [
      {
        "action": "CREATED",
        "timestamp": "2025-01-15T10:30:00Z",
        "userId": "uuid",
        "changes": {}
      }
    ]
  },
  "correlationId": "uuid"
}
```

### Update Transaction

```http
PUT /transactions/{id}
```

**Request Body:**

```json
{
  "amount": "1100.00",
  "description": "Updated description",
  "category": "resident_fees",
  "status": "approved"
}
```

### Delete Transaction

```http
DELETE /transactions/{id}
```

**Response:** `204 No Content`

## Budget Management

### Create Budget

Creates a comprehensive budget with categories and monthly breakdown.

```http
POST /budgets
```

**Request Body:**

```json
{
  "budgetName": "Annual Budget 2025",
  "budgetType": "annual",
  "description": "Main operating budget for 2025",
  "financialYear": "2025-2026",
  "startDate": "2025-04-01",
  "endDate": "2026-03-31",
  "currency": "GBP",
  "totalBudgetedRevenue": "2500000.00",
  "totalBudgetedExpenses": "2200000.00",
  "careHomeId": "uuid",
  "budgetedOccupancy": 85,
  "categories": [
    {
      "categoryName": "Staff Costs",
      "budgetedAmount": "1200000.00",
      "monthlyBreakdown": [
        {
          "month": 1,
          "budgetedAmount": "100000.00"
        }
      ]
    },
    {
      "categoryName": "Clinical Supplies",
      "budgetedAmount": "300000.00"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "budget": {
    "id": "uuid",
    "budgetName": "Annual Budget 2025",
    "budgetType": "annual",
    "status": "draft",
    "totalBudgetedRevenue": "2500000.00",
    "totalBudgetedExpenses": "2200000.00",
    "totalBudgetedProfit": "300000.00",
    "categories": [
      {
        "id": "uuid",
        "categoryName": "Staff Costs",
        "budgetedAmount": "1200000.00",
        "actualAmount": "0.00",
        "variance": "0.00"
      }
    ],
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "correlationId": "uuid"
}
```

### Get Budgets

```http
GET /budgets?budgetType=annual&status=active&financialYear=2025-2026
```

### Budget Variance Analysis

```http
GET /budgets/{id}/variance
```

**Response:**

```json
{
  "success": true,
  "variance": {
    "budgetId": "uuid",
    "totalBudgetedRevenue": "2500000.00",
    "actualRevenue": "2450000.00",
    "revenueVariance": "-50000.00",
    "revenueVariancePercentage": "-2.0",
    "totalBudgetedExpenses": "2200000.00",
    "actualExpenses": "2250000.00",
    "expenseVariance": "50000.00",
    "expenseVariancePercentage": "2.3",
    "netVariance": "-100000.00",
    "categories": [
      {
        "categoryName": "Staff Costs",
        "budgetedAmount": "1200000.00",
        "actualAmount": "1250000.00",
        "variance": "50000.00",
        "variancePercentage": "4.2"
      }
    ],
    "performanceSummary": {
      "overallPerformance": "FAIR",
      "budgetUtilization": "102.3%",
      "revenuePerformance": "-2.0%",
      "expensePerformance": "2.3%"
    }
  }
}
```

## Forecasting

### Generate Forecast

Creates financial forecasts using AI/ML models with healthcare-specific parameters.

```http
POST /forecasts
```

**Request Body:**

```json
{
  "forecastType": "revenue",
  "entityType": "care_home",
  "entityId": "uuid",
  "periodMonths": 12,
  "lookbackMonths": 24,
  "confidence": 0.95,
  "methodology": "ensemble",
  "dataTypes": [
    "financial_transactions",
    "occupancy_data",
    "staff_costs"
  ],
  "externalFactors": [
    {
      "factorType": "inflation_rate",
      "impact": 0.03,
      "confidence": 0.8,
      "description": "Expected inflation impact on costs"
    },
    {
      "factorType": "occupancy_trend",
      "impact": 0.05,
      "confidence": 0.9,
      "description": "Improving occupancy rates"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "forecast": {
    "id": "uuid",
    "forecastName": "REVENUE Forecast 2025-02 to 2026-01",
    "forecastType": "revenue",
    "methodology": "ensemble",
    "confidence": "95.0%",
    "projectedTotal": "£2,450,000.00",
    "upperBoundTotal": "£2,695,000.00",
    "lowerBoundTotal": "£2,205,000.00",
    "projections": [
      {
        "period": "2025-02",
        "periodStart": "2025-02-01",
        "periodEnd": "2025-02-28",
        "projectedValue": "200000.00",
        "confidence": 0.95,
        "upperBound": "220000.00",
        "lowerBound": "180000.00",
        "factors": [
          {
            "factorName": "seasonal_adjustment",
            "impact": 0.02,
            "confidence": 0.85
          }
        ]
      }
    ],
    "accuracy": "92.5%",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "correlationId": "uuid",
  "confidence": 0.95,
  "methodology": "ensemble"
}
```

### Get Forecasts

```http
GET /forecasts?forecastType=revenue&status=active&entityType=care_home
```

### Forecast Accuracy Tracking

```http
GET /forecasts/{id}/accuracy
```

**Response:**

```json
{
  "success": true,
  "accuracy": {
    "forecastId": "uuid",
    "overallAccuracy": "92.5%",
    "meanAbsoluteError": "15000.00",
    "rSquared": "0.89",
    "accuracyByPeriod": [
      {
        "period": "2025-02",
        "projected": "200000.00",
        "actual": "195000.00",
        "accuracy": "97.5%",
        "error": "5000.00"
      }
    ],
    "modelPerformance": {
      "methodology": "ensemble",
      "dataPointsUsed": 120,
      "trainingAccuracy": "94.2%",
      "validationAccuracy": "92.5%"
    }
  }
}
```

## Analytics

### Generate Analytics

Performs comprehensive financial analysis with healthcare-specific metrics.

```http
POST /analytics
```

**Request Body:**

```json
{
  "analysisType": "profitability",
  "entityType": "care_home",
  "entityId": "uuid",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-01-31",
  "metrics": [
    "revenue",
    "expenses",
    "profit",
    "margin",
    "occupancy",
    "cost_per_resident"
  ],
  "groupBy": [
    "month",
    "department"
  ],
  "filters": [
    {
      "field": "department",
      "operator": "in",
      "value": ["nursing", "residential"]
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "metric": "revenue",
        "value": 250000.00,
        "previousValue": 240000.00,
        "change": 10000.00,
        "changePercentage": 4.17,
        "trend": "up"
      },
      {
        "metric": "profit_margin",
        "value": 12.5,
        "previousValue": 11.8,
        "change": 0.7,
        "changePercentage": 5.93,
        "trend": "up"
      }
    ],
    "trends": [
      {
        "metric": "revenue",
        "period": "monthly",
        "values": [240000, 245000, 250000],
        "trend": "up",
        "correlation": 0.95
      }
    ],
    "comparisons": [
      {
        "metric": "cost_per_resident",
        "currentValue": 2500.00,
        "benchmarkValue": 2400.00,
        "variance": 100.00,
        "variancePercentage": 4.17
      }
    ],
    "insights": [
      {
        "type": "revenue_opportunity",
        "title": "Occupancy Rate Improvement",
        "description": "Increasing occupancy from 85% to 90% could generate additional £15,000 monthly revenue",
        "impact": "medium",
        "recommendations": [
          "Focus marketing on local authority partnerships",
          "Improve referral processes",
          "Enhance care quality ratings"
        ]
      }
    ]
  },
  "correlationId": "uuid"
}
```

### Get KPIs

```http
GET /kpis?kpiType=revenue_growth&entityType=care_home&dateFrom=2025-01-01&frequency=monthly
```

**Response:**

```json
{
  "success": true,
  "kpis": [
    {
      "id": "uuid",
      "kpiName": "Monthly Revenue Growth",
      "kpiType": "revenue_growth",
      "currentValue": "4.17%",
      "targetValue": "3.00%",
      "trend": "up",
      "performanceRating": "EXCELLENT",
      "changeIndicator": "↗ 1.2%",
      "hasAlerts": false,
      "calculationDate": "2025-01-31T23:59:59Z",
      "metadata": {
        "calculationMethod": "month_over_month_percentage",
        "dataSource": "financial_transactions",
        "benchmarkSource": "industry_average"
      }
    }
  ]
}
```

## Reporting

### Generate Report

Creates comprehensive financial reports in various formats.

```http
POST /reports
```

**Request Body:**

```json
{
  "reportType": "profit_and_loss",
  "format": "pdf",
  "entityType": "care_home",
  "entityId": "uuid",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-01-31",
  "includeCharts": true,
  "includeDetails": true,
  "customFields": [
    "occupancy_metrics",
    "staff_ratios",
    "clinical_indicators"
  ],
  "filters": [
    {
      "field": "department",
      "value": "nursing",
      "operator": "equals"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "reportType": "profit_and_loss",
    "format": "pdf",
    "fileName": "P&L_Report_2025-01_uuid.pdf",
    "fileSize": 2048576,
    "downloadUrl": "https://api.writecarenotes.com/v1/financial/reports/uuid/download",
    "generatedAt": "2025-01-15T10:30:00Z",
    "expiresAt": "2025-01-22T10:30:00Z",
    "metadata": {
      "entityType": "care_home",
      "entityId": "uuid",
      "dateFrom": "2025-01-01",
      "dateTo": "2025-01-31",
      "recordCount": 1250,
      "totalPages": 15,
      "generatedBy": "uuid"
    }
  },
  "correlationId": "uuid"
}
```

### Get Reports

```http
GET /reports?reportType=profit_and_loss&format=pdf&dateFrom=2025-01-01
```

### Download Report

```http
GET /reports/{id}/download
```

**Response:** Binary file download with appropriate headers.

## Integration Endpoints

### Banking Integration

#### Get Banking Accounts

```http
GET /banking/accounts
```

**Response:**

```json
{
  "success": true,
  "accounts": [
    {
      "id": "uuid",
      "accountNumber": "12345678",
      "sortCode": "12-34-56",
      "accountName": "Main Operating Account",
      "balance": "150000.00",
      "currency": "GBP",
      "lastSyncDate": "2025-01-15T09:00:00Z",
      "provider": "Lloyds Bank"
    }
  ]
}
```

#### Bank Reconciliation

```http
POST /banking/reconcile
```

**Request Body:**

```json
{
  "accountId": "uuid",
  "reconciliationDate": "2025-01-31",
  "statementBalance": "150000.00",
  "autoMatch": true,
  "toleranceAmount": "5.00"
}
```

### Regulatory Compliance

#### Submit CQC Financial Returns

```http
POST /regulatory/cqc
```

**Request Body:**

```json
{
  "submissionType": "annual_return",
  "financialYear": "2024-2025",
  "careHomeId": "uuid",
  "reportingPeriod": {
    "startDate": "2024-04-01",
    "endDate": "2025-03-31"
  },
  "autoSubmit": false
}
```

#### HMRC Tax Submissions

```http
POST /regulatory/hmrc
```

**Request Body:**

```json
{
  "submissionType": "vat_return",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-03-31",
  "vatNumber": "GB123456789",
  "autoSubmit": false
}
```

## Webhooks

The Financial Analytics Service supports webhooks for real-time notifications:

### Webhook Events

- `transaction.created`
- `transaction.approved`
- `transaction.reconciled`
- `budget.variance_alert`
- `forecast.generated`
- `compliance.violation_detected`
- `report.generated`

### Webhook Payload Example

```json
{
  "event": "transaction.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "correlationId": "uuid",
  "data": {
    "transactionId": "uuid",
    "amount": "1000.00",
    "category": "resident_fees",
    "careHomeId": "uuid"
  },
  "metadata": {
    "apiVersion": "v1",
    "source": "financial_analytics_service"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { FinancialAnalyticsClient } from '@writecarenotes/financial-sdk';

const client = new FinancialAnalyticsClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.writecarenotes.com/v1/financial'
});

// Create transaction
const transaction = await client.transactions.create({
  accountId: 'uuid',
  amount: new Decimal('1000.00'),
  currency: 'GBP',
  description: 'Resident monthly fee',
  category: 'resident_fees',
  transactionDate: new Date()
});

// Generate forecast
const forecast = await client.forecasts.generate({
  forecastType: 'revenue',
  entityType: 'care_home',
  entityId: 'uuid',
  periodMonths: 12
});
```

### Python

```python
from writecarenotes_financial import FinancialAnalyticsClient
from decimal import Decimal

client = FinancialAnalyticsClient(
    api_key='your-api-key',
    base_url='https://api.writecarenotes.com/v1/financial'
)

# Create transaction
transaction = client.transactions.create({
    'account_id': 'uuid',
    'amount': Decimal('1000.00'),
    'currency': 'GBP',
    'description': 'Resident monthly fee',
    'category': 'resident_fees',
    'transaction_date': '2025-01-15T00:00:00Z'
})

# Get analytics
analytics = client.analytics.generate({
    'analysis_type': 'profitability',
    'entity_type': 'care_home',
    'date_from': '2025-01-01',
    'date_to': '2025-01-31',
    'metrics': ['revenue', 'expenses', 'profit']
})
```

## Performance Guidelines

### Response Time Targets

- **Transaction Operations**: < 200ms
- **Query Operations**: < 500ms
- **Analytics Generation**: < 2000ms
- **Report Generation**: < 30 seconds
- **Forecast Generation**: < 60 seconds

### Optimization Tips

1. **Use Pagination**: Always use appropriate page sizes (50-100 records)
2. **Filter Early**: Apply filters to reduce data processing
3. **Cache Results**: Cache frequently accessed data
4. **Batch Operations**: Use bulk endpoints for multiple operations
5. **Async Processing**: Use webhooks for long-running operations

## Security Considerations

### Data Protection

- All sensitive financial data is encrypted at rest and in transit
- Field-level encryption for PII and payment information
- GDPR-compliant data processing and retention
- Audit trails for all financial operations

### Access Control

- Role-based access control (RBAC)
- Principle of least privilege
- Multi-factor authentication for sensitive operations
- IP whitelisting for production environments

### Compliance

- PCI DSS compliance for payment processing
- SOX compliance preparation for financial reporting
- Healthcare data protection (GDPR Article 9)
- Regulatory reporting compliance (CQC, HMRC, etc.)

## Support and Resources

- **API Status**: https://status.writecarenotes.com
- **Developer Portal**: https://developers.writecarenotes.com
- **Support Email**: api-support@writecarenotes.com
- **Documentation**: https://docs.writecarenotes.com/financial-analytics
- **SDK Repository**: https://github.com/writecarenotes/financial-sdk