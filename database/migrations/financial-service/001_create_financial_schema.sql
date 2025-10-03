-- Financial Service Database Schema Migration
-- WriteCareNotes - Comprehensive Financial Management System
-- Version: 1.0.0
-- Author: WriteCareNotes Team
-- Date: 2025-01-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create financial service schema
CREATE SCHEMA IF NOT EXISTS financial;

-- Set search path
SET search_path TO financial, public;

-- =====================================================
-- RESIDENT BILLS TABLE
-- =====================================================

CREATE TABLE resident_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    resident_id UUID NOT NULL,
    care_home_id UUID NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,4) NOT NULL CHECK (subtotal >= 0),
    vat_amount DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
    total_amount DECIMAL(15,4) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description TEXT NOT NULL,
    payment_terms INTEGER DEFAULT 30 CHECK (payment_terms > 0),
    notes TEXT,
    encrypted_bank_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    updated_by UUID,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_billing_period CHECK (billing_period_start <= billing_period_end),
    CONSTRAINT chk_bill_status CHECK (status IN ('draft', 'pending', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded')),
    CONSTRAINT chk_currency CHECK (currency IN ('GBP', 'EUR', 'USD'))
);

-- =====================================================
-- BILL LINE ITEMS TABLE
-- =====================================================

CREATE TABLE bill_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES resident_bills(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,4) NOT NULL CHECK (unit_price >= 0),
    amount DECIMAL(15,4) NOT NULL CHECK (amount >= 0),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_line_item_calculation CHECK (amount = quantity * unit_price)
);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_reference VARCHAR(50) UNIQUE NOT NULL,
    bill_id UUID REFERENCES resident_bills(id),
    resident_id UUID NOT NULL,
    care_home_id UUID NOT NULL,
    amount DECIMAL(15,4) NOT NULL CHECK (amount > 0),
    processing_fee DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (processing_fee >= 0),
    net_amount DECIMAL(15,4) NOT NULL CHECK (net_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    gateway_transaction_id VARCHAR(100),
    gateway_response JSONB,
    encrypted_payment_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    updated_by UUID,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_payment_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'direct_debit', 'cheque', 'bacs', 'faster_payments')),
    CONSTRAINT chk_payment_currency CHECK (currency IN ('GBP', 'EUR', 'USD')),
    CONSTRAINT chk_net_amount CHECK (net_amount = amount - processing_fee)
);

-- =====================================================
-- INSURANCE CLAIMS TABLE
-- =====================================================

CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    resident_id UUID NOT NULL,
    care_home_id UUID NOT NULL,
    insurance_provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    claim_type VARCHAR(100) NOT NULL,
    claim_amount DECIMAL(15,4) NOT NULL CHECK (claim_amount > 0),
    deductible DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (deductible >= 0),
    net_claim_amount DECIMAL(15,4) NOT NULL CHECK (net_claim_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    incident_date DATE NOT NULL,
    submission_date DATE,
    approval_date DATE,
    payment_date DATE,
    description TEXT NOT NULL,
    supporting_documents JSONB DEFAULT '[]',
    notes TEXT,
    provider_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    updated_by UUID,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_claim_status CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'cancelled')),
    CONSTRAINT chk_claim_currency CHECK (currency IN ('GBP', 'EUR', 'USD')),
    CONSTRAINT chk_net_claim_amount CHECK (net_claim_amount = claim_amount - deductible)
);

-- =====================================================
-- FINANCIAL ACCOUNTS TABLE
-- =====================================================

CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_home_id UUID NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    account_number VARCHAR(50),
    sort_code VARCHAR(10),
    bank_name VARCHAR(255),
    iban VARCHAR(50),
    swift_code VARCHAR(20),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    current_balance DECIMAL(15,4) NOT NULL DEFAULT 0,
    available_balance DECIMAL(15,4) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT chk_account_type CHECK (account_type IN ('current', 'savings', 'credit', 'loan', 'investment')),
    CONSTRAINT chk_account_currency CHECK (currency IN ('GBP', 'EUR', 'USD'))
);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES financial_accounts(id),
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(15,4) NOT NULL CHECK (amount != 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    value_date DATE NOT NULL,
    balance_after DECIMAL(15,4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reference_number VARCHAR(100),
    counterparty_name VARCHAR(255),
    counterparty_account VARCHAR(50),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('debit', 'credit')),
    CONSTRAINT chk_transaction_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    CONSTRAINT chk_transaction_currency CHECK (currency IN ('GBP', 'EUR', 'USD'))
);

-- =====================================================
-- RECURRING BILLING TABLE
-- =====================================================

CREATE TABLE recurring_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL,
    care_home_id UUID NOT NULL,
    billing_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15,4) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    frequency VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE NOT NULL,
    last_billing_date DATE,
    description TEXT NOT NULL,
    line_items JSONB NOT NULL DEFAULT '[]',
    payment_terms INTEGER DEFAULT 30 CHECK (payment_terms > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT chk_recurring_frequency CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'annually')),
    CONSTRAINT chk_recurring_currency CHECK (currency IN ('GBP', 'EUR', 'USD')),
    CONSTRAINT chk_recurring_dates CHECK (start_date <= COALESCE(end_date, start_date))
);

-- =====================================================
-- FINANCIAL REPORTS TABLE
-- =====================================================

CREATE TABLE financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL,
    care_home_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    generated_date TIMESTAMP WITH TIME ZONE NOT NULL,
    data JSONB NOT NULL,
    format VARCHAR(20) NOT NULL DEFAULT 'json',
    parameters JSONB DEFAULT '{}',
    file_path VARCHAR(500),
    file_size BIGINT,
    created_by UUID NOT NULL,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_report_type CHECK (report_type IN ('profit_and_loss', 'balance_sheet', 'cash_flow', 'aged_debtors', 'budget_variance', 'tax_summary')),
    CONSTRAINT chk_report_format CHECK (format IN ('json', 'pdf', 'excel', 'csv')),
    CONSTRAINT chk_report_dates CHECK (start_date <= end_date)
);

-- =====================================================
-- INSURANCE COVERAGE TABLE
-- =====================================================

CREATE TABLE insurance_coverage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL,
    provider VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    policy_type VARCHAR(100) NOT NULL,
    coverage_amount DECIMAL(15,4) NOT NULL CHECK (coverage_amount > 0),
    deductible DECIMAL(15,4) NOT NULL DEFAULT 0 CHECK (deductible >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT chk_coverage_currency CHECK (currency IN ('GBP', 'EUR', 'USD')),
    CONSTRAINT chk_coverage_dates CHECK (start_date <= expiry_date),
    CONSTRAINT uk_insurance_coverage UNIQUE (resident_id, provider, policy_number)
);

-- =====================================================
-- EXPENSES TABLE
-- =====================================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_home_id UUID NOT NULL,
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(15,4) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    supplier_name VARCHAR(255),
    supplier_reference VARCHAR(100),
    payment_method VARCHAR(30),
    payment_date DATE,
    receipt_number VARCHAR(100),
    vat_amount DECIMAL(15,4) DEFAULT 0 CHECK (vat_amount >= 0),
    net_amount DECIMAL(15,4) NOT NULL CHECK (net_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approval_required BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_expense_status CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
    CONSTRAINT chk_expense_currency CHECK (currency IN ('GBP', 'EUR', 'USD')),
    CONSTRAINT chk_expense_payment_method CHECK (payment_method IS NULL OR payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'direct_debit', 'cheque', 'bacs', 'faster_payments'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Resident Bills Indexes
CREATE INDEX idx_resident_bills_resident_id ON resident_bills(resident_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_resident_bills_care_home_id ON resident_bills(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_resident_bills_status ON resident_bills(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_resident_bills_due_date ON resident_bills(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_resident_bills_issue_date ON resident_bills(issue_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_resident_bills_billing_period ON resident_bills(billing_period_start, billing_period_end) WHERE deleted_at IS NULL;
CREATE INDEX idx_resident_bills_correlation_id ON resident_bills(correlation_id) WHERE correlation_id IS NOT NULL;

-- Bill Line Items Indexes
CREATE INDEX idx_bill_line_items_bill_id ON bill_line_items(bill_id);
CREATE INDEX idx_bill_line_items_category ON bill_line_items(category);

-- Payments Indexes
CREATE INDEX idx_payments_resident_id ON payments(resident_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_care_home_id ON payments(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_bill_id ON payments(bill_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status ON payments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_payment_method ON payments(payment_method) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_payment_date ON payments(payment_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_gateway_transaction_id ON payments(gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX idx_payments_correlation_id ON payments(correlation_id) WHERE correlation_id IS NOT NULL;

-- Insurance Claims Indexes
CREATE INDEX idx_insurance_claims_resident_id ON insurance_claims(resident_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_claims_care_home_id ON insurance_claims(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_claims_provider ON insurance_claims(insurance_provider) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_claims_status ON insurance_claims(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_claims_submission_date ON insurance_claims(submission_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_claims_incident_date ON insurance_claims(incident_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_claims_correlation_id ON insurance_claims(correlation_id) WHERE correlation_id IS NOT NULL;

-- Financial Accounts Indexes
CREATE INDEX idx_financial_accounts_care_home_id ON financial_accounts(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_financial_accounts_type ON financial_accounts(account_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_financial_accounts_active ON financial_accounts(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_financial_accounts_primary ON financial_accounts(is_primary) WHERE is_primary = true AND deleted_at IS NULL;

-- Transactions Indexes
CREATE INDEX idx_transactions_account_id ON transactions(account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_date ON transactions(transaction_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_value_date ON transactions(value_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_category ON transactions(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_status ON transactions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_reference ON transactions(transaction_reference) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_correlation_id ON transactions(correlation_id) WHERE correlation_id IS NOT NULL;

-- Recurring Billing Indexes
CREATE INDEX idx_recurring_billing_resident_id ON recurring_billing(resident_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recurring_billing_care_home_id ON recurring_billing(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recurring_billing_next_date ON recurring_billing(next_billing_date) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_recurring_billing_frequency ON recurring_billing(frequency) WHERE is_active = true AND deleted_at IS NULL;

-- Financial Reports Indexes
CREATE INDEX idx_financial_reports_care_home_id ON financial_reports(care_home_id);
CREATE INDEX idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX idx_financial_reports_generated_date ON financial_reports(generated_date);
CREATE INDEX idx_financial_reports_period ON financial_reports(start_date, end_date);

-- Insurance Coverage Indexes
CREATE INDEX idx_insurance_coverage_resident_id ON insurance_coverage(resident_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_coverage_provider ON insurance_coverage(provider) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_coverage_active ON insurance_coverage(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_coverage_expiry ON insurance_coverage(expiry_date) WHERE is_active = true AND deleted_at IS NULL;

-- Expenses Indexes
CREATE INDEX idx_expenses_care_home_id ON expenses(care_home_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_category ON expenses(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_status ON expenses(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_supplier ON expenses(supplier_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_correlation_id ON expenses(correlation_id) WHERE correlation_id IS NOT NULL;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_resident_bills_updated_at BEFORE UPDATE ON resident_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_accounts_updated_at BEFORE UPDATE ON financial_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_billing_updated_at BEFORE UPDATE ON recurring_billing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_coverage_updated_at BEFORE UPDATE ON insurance_coverage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEQUENCES FOR BILL/CLAIM NUMBERS
-- =====================================================

-- Sequence for bill numbers
CREATE SEQUENCE IF NOT EXISTS bill_number_seq START 1;

-- Sequence for claim numbers  
CREATE SEQUENCE IF NOT EXISTS claim_number_seq START 1;

-- Sequence for expense numbers
CREATE SEQUENCE IF NOT EXISTS expense_number_seq START 1;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Outstanding Bills View
CREATE VIEW outstanding_bills AS
SELECT 
    rb.*,
    r.first_name,
    r.last_name,
    EXTRACT(DAY FROM (CURRENT_DATE - rb.due_date)) as days_past_due,
    CASE 
        WHEN CURRENT_DATE > rb.due_date THEN 'overdue'
        WHEN CURRENT_DATE > (rb.due_date - INTERVAL '7 days') THEN 'due_soon'
        ELSE 'current'
    END as aging_category
FROM resident_bills rb
LEFT JOIN public.residents r ON rb.resident_id = r.id
WHERE rb.status IN ('pending', 'partially_paid', 'overdue')
    AND rb.deleted_at IS NULL;

-- Payment Summary View
CREATE VIEW payment_summary AS
SELECT 
    p.*,
    rb.bill_number,
    rb.total_amount as bill_total,
    r.first_name,
    r.last_name
FROM payments p
LEFT JOIN resident_bills rb ON p.bill_id = rb.id
LEFT JOIN public.residents r ON p.resident_id = r.id
WHERE p.deleted_at IS NULL;

-- Financial Metrics View
CREATE VIEW financial_metrics AS
SELECT 
    care_home_id,
    DATE_TRUNC('month', issue_date) as month,
    SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as revenue,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills,
    COUNT(CASE WHEN status IN ('pending', 'partially_paid', 'overdue') THEN 1 END) as outstanding_bills,
    SUM(CASE WHEN status IN ('pending', 'partially_paid', 'overdue') THEN total_amount ELSE 0 END) as outstanding_amount
FROM resident_bills
WHERE deleted_at IS NULL
GROUP BY care_home_id, DATE_TRUNC('month', issue_date);

-- =====================================================
-- INSURANCE PROVIDER CONFIGURATIONS TABLE
-- =====================================================

CREATE TABLE insurance_provider_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(255) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    api_endpoint VARCHAR(500) NOT NULL,
    encrypted_api_key TEXT NOT NULL,
    api_version VARCHAR(20) DEFAULT 'v1',
    timeout_seconds INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT true,
    supported_claim_types JSONB DEFAULT '[]',
    configuration_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT uk_insurance_provider_configs UNIQUE (provider_name, provider_id)
);

-- Insurance Provider Configs Indexes
CREATE INDEX idx_insurance_provider_configs_provider ON insurance_provider_configs(provider_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_insurance_provider_configs_active ON insurance_provider_configs(is_active) WHERE deleted_at IS NULL;

-- Apply trigger for updated_at
CREATE TRIGGER update_insurance_provider_configs_updated_at BEFORE UPDATE ON insurance_provider_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA financial TO writecarenotes_app;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA financial TO writecarenotes_app;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA financial TO writecarenotes_app;

-- Grant permissions on views
GRANT SELECT ON outstanding_bills TO writecarenotes_app;
GRANT SELECT ON payment_summary TO writecarenotes_app;
GRANT SELECT ON financial_metrics TO writecarenotes_app;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA financial IS 'Financial service schema for WriteCareNotes care home management system';

COMMENT ON TABLE resident_bills IS 'Resident billing records with comprehensive financial tracking';
COMMENT ON TABLE bill_line_items IS 'Individual line items for resident bills';
COMMENT ON TABLE payments IS 'Payment processing records with gateway integration';
COMMENT ON TABLE insurance_claims IS 'Insurance claim management with provider integration';
COMMENT ON TABLE financial_accounts IS 'Care home financial accounts and banking details';
COMMENT ON TABLE transactions IS 'Financial transaction records for accounting';
COMMENT ON TABLE recurring_billing IS 'Automated recurring billing configurations';
COMMENT ON TABLE financial_reports IS 'Generated financial reports and analytics';
COMMENT ON TABLE insurance_coverage IS 'Resident insurance coverage details';
COMMENT ON TABLE expenses IS 'Care home expense tracking and management';

-- Migration completed successfully
SELECT 'Financial Service database schema created successfully' as result;