-- =====================================================================================
-- Inventory & Supply Chain Service Database Schema Migration
-- Version: 001
-- Description: Creates comprehensive inventory management schema for WriteCareNotes
-- Author: WriteCareNotes Team
-- Date: 2025-01-01
-- 
-- Compliance:
-- - MHRA (Medicines and Healthcare products Regulatory Agency) regulations
-- - CQC (Care Quality Commission) requirements for medical supplies
-- - NHS Supply Chain standards and procedures
-- - GDPR data protection requirements
-- - Healthcare audit trail requirements
-- =====================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================================
-- INVENTORY ITEMS TABLE
-- Core inventory management with comprehensive tracking and compliance
-- =====================================================================================
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code VARCHAR(50) NOT NULL UNIQUE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    
    -- Physical properties
    unit_of_measure VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(10,4) NOT NULL CHECK (unit_cost >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    weight DECIMAL(10,3),
    dimensions JSONB, -- {length, width, height, unit}
    
    -- Stock levels
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    available_stock INTEGER NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
    min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    max_stock INTEGER NOT NULL DEFAULT 0 CHECK (max_stock >= min_stock),
    reorder_point INTEGER NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
    economic_order_quantity INTEGER CHECK (economic_order_quantity > 0),
    
    -- Usage and forecasting
    average_usage DECIMAL(10,2) CHECK (average_usage >= 0),
    lead_time_days INTEGER NOT NULL DEFAULT 7 CHECK (lead_time_days >= 0),
    seasonality_factor DECIMAL(5,2) DEFAULT 1.0,
    demand_variability DECIMAL(5,2),
    
    -- Financial tracking
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_value >= 0),
    average_cost DECIMAL(10,4) NOT NULL DEFAULT 0 CHECK (average_cost >= 0),
    last_cost_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Location and storage
    storage_location VARCHAR(100),
    storage_requirements TEXT,
    temperature_range JSONB, -- {min, max, unit}
    storage_conditions JSONB, -- Array of conditions
    
    -- Compliance and safety
    is_medical_device BOOLEAN NOT NULL DEFAULT FALSE,
    is_controlled_substance BOOLEAN NOT NULL DEFAULT FALSE,
    is_hazardous BOOLEAN NOT NULL DEFAULT FALSE,
    mhra_license_number VARCHAR(100),
    controlled_substance_license VARCHAR(100),
    hazardous_handling_instructions TEXT,
    safety_data_sheet TEXT,
    
    -- Supplier information
    preferred_supplier_id UUID,
    alternative_supplier_ids JSONB DEFAULT '[]'::jsonb,
    
    -- Tracking and automation
    auto_reorder BOOLEAN NOT NULL DEFAULT FALSE,
    track_expiry BOOLEAN NOT NULL DEFAULT FALSE,
    track_batches BOOLEAN NOT NULL DEFAULT FALSE,
    track_serial_numbers BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Performance metrics
    turnover_rate DECIMAL(8,2),
    stockout_frequency INTEGER DEFAULT 0,
    last_stockout_date TIMESTAMP WITH TIME ZONE,
    
    -- Status and dates
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued', 'deleted')),
    last_movement_date TIMESTAMP WITH TIME ZONE,
    last_stock_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_stock_check TIMESTAMP WITH TIME ZONE,
    
    -- System fields
    care_home_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_available_stock CHECK (available_stock = current_stock - reserved_stock),
    CONSTRAINT chk_medical_device_license CHECK (
        NOT is_medical_device OR mhra_license_number IS NOT NULL
    ),
    CONSTRAINT chk_controlled_substance_license CHECK (
        NOT is_controlled_substance OR controlled_substance_license IS NOT NULL
    ),
    CONSTRAINT chk_hazardous_instructions CHECK (
        NOT is_hazardous OR hazardous_handling_instructions IS NOT NULL
    )
);

-- Indexes for inventory_items
CREATE INDEX idx_inventory_items_item_code ON inventory_items(item_code);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_care_home ON inventory_items(care_home_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_stock_levels ON inventory_items(current_stock, min_stock, max_stock);
CREATE INDEX idx_inventory_items_reorder ON inventory_items(auto_reorder, current_stock, reorder_point) WHERE auto_reorder = TRUE;
CREATE INDEX idx_inventory_items_compliance ON inventory_items(is_medical_device, is_controlled_substance, is_hazardous);
CREATE INDEX idx_inventory_items_supplier ON inventory_items(preferred_supplier_id);
CREATE INDEX idx_inventory_items_created_at ON inventory_items(created_at);
CREATE INDEX idx_inventory_items_updated_at ON inventory_items(updated_at);

-- =====================================================================================
-- SUPPLIERS TABLE
-- Comprehensive supplier management with performance tracking
-- =====================================================================================
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(255) NOT NULL,
    supplier_type VARCHAR(50) NOT NULL CHECK (supplier_type IN ('manufacturer', 'distributor', 'wholesaler', 'service_provider')),
    registration_number VARCHAR(100),
    vat_number VARCHAR(50),
    
    -- Contact information (encrypted)
    primary_contact JSONB NOT NULL,
    alternative_contacts JSONB DEFAULT '[]'::jsonb,
    
    -- Address information
    business_address JSONB NOT NULL,
    delivery_addresses JSONB DEFAULT '[]'::jsonb,
    
    -- Financial information (encrypted)
    payment_terms VARCHAR(100) NOT NULL,
    credit_limit DECIMAL(12,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    bank_details JSONB, -- Encrypted
    
    -- Categories and capabilities
    categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    capabilities JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    
    -- Performance metrics
    minimum_order_value DECIMAL(10,2),
    average_lead_time INTEGER NOT NULL DEFAULT 7,
    delivery_zones JSONB DEFAULT '[]'::jsonb,
    rating DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spend DECIMAL(15,2) NOT NULL DEFAULT 0,
    average_delivery_time DECIMAL(5,2) NOT NULL DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
    quality_rating DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (quality_rating >= 0 AND quality_rating <= 5),
    
    -- Compliance
    insurance_certificate TEXT,
    quality_assurance_certificate TEXT,
    gdpr_compliant BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Status and dates
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blacklisted', 'deleted')),
    last_order_date TIMESTAMP WITH TIME ZONE,
    last_performance_review TIMESTAMP WITH TIME ZONE,
    next_performance_review TIMESTAMP WITH TIME ZONE,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT uk_supplier_name_registration UNIQUE (supplier_name, registration_number)
);

-- Indexes for suppliers
CREATE INDEX idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_rating ON suppliers(rating);
CREATE INDEX idx_suppliers_performance ON suppliers(on_time_delivery_rate, quality_rating);
CREATE INDEX idx_suppliers_created_at ON suppliers(created_at);

-- =====================================================================================
-- PURCHASE ORDERS TABLE
-- Complete purchase order management with approval workflow
-- =====================================================================================
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    care_home_id UUID NOT NULL,
    
    -- Financial totals
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    vat_amount DECIMAL(12,2) NOT NULL CHECK (vat_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    
    -- Order management
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 'partially_delivered', 'delivered', 'cancelled', 'closed')),
    
    -- Approval workflow
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery information
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    delivery_address JSONB,
    delivery_contact JSONB,
    special_instructions TEXT,
    
    -- Financial terms
    payment_terms VARCHAR(100),
    payment_due_date TIMESTAMP WITH TIME ZONE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
    
    -- References and tracking
    requisition_number VARCHAR(50),
    budget_code VARCHAR(50),
    supplier_order_number VARCHAR(50),
    tracking_numbers JSONB DEFAULT '[]'::jsonb,
    
    -- Performance tracking
    order_accuracy DECIMAL(5,2) CHECK (order_accuracy >= 0 AND order_accuracy <= 100),
    delivery_performance VARCHAR(20) CHECK (delivery_performance IN ('on_time', 'early', 'late')),
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 0 AND quality_rating <= 5),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_total_amount CHECK (total_amount = subtotal + vat_amount),
    CONSTRAINT chk_approved_fields CHECK (
        (status != 'approved' AND status != 'sent') OR 
        (approved_by IS NOT NULL AND approved_at IS NOT NULL)
    )
);

-- Indexes for purchase_orders
CREATE INDEX idx_purchase_orders_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_care_home ON purchase_orders(care_home_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_priority ON purchase_orders(priority);
CREATE INDEX idx_purchase_orders_approval ON purchase_orders(requires_approval, status) WHERE requires_approval = TRUE;
CREATE INDEX idx_purchase_orders_delivery_date ON purchase_orders(expected_delivery_date);
CREATE INDEX idx_purchase_orders_created_at ON purchase_orders(created_at);

-- =====================================================================================
-- PURCHASE ORDER ITEMS TABLE
-- Individual items within purchase orders with delivery tracking
-- =====================================================================================
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    
    -- Quantities
    quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
    quantity_delivered INTEGER NOT NULL DEFAULT 0 CHECK (quantity_delivered >= 0),
    quantity_remaining INTEGER NOT NULL CHECK (quantity_remaining >= 0),
    
    -- Pricing
    unit_cost DECIMAL(10,4) NOT NULL CHECK (unit_cost >= 0),
    total_cost DECIMAL(12,2) NOT NULL CHECK (total_cost >= 0),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    
    -- Delivery tracking
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'partially_delivered', 'delivered', 'cancelled')),
    
    -- Batch and expiry
    requested_batch_number VARCHAR(50),
    delivered_batch_number VARCHAR(50),
    requested_expiry_date TIMESTAMP WITH TIME ZONE,
    delivered_expiry_date TIMESTAMP WITH TIME ZONE,
    
    -- Quality and compliance
    quality_check_required BOOLEAN NOT NULL DEFAULT FALSE,
    quality_check_passed BOOLEAN,
    quality_notes TEXT,
    
    -- Notes and references
    notes TEXT,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_quantity_remaining CHECK (quantity_remaining = quantity_ordered - quantity_delivered),
    CONSTRAINT chk_total_cost CHECK (total_cost = (unit_cost * quantity_ordered) - discount_amount),
    CONSTRAINT chk_quality_check CHECK (
        NOT quality_check_required OR quality_check_passed IS NOT NULL
    )
);

-- Indexes for purchase_order_items
CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_inventory ON purchase_order_items(inventory_item_id);
CREATE INDEX idx_purchase_order_items_delivery_status ON purchase_order_items(delivery_status);
CREATE INDEX idx_purchase_order_items_delivery_date ON purchase_order_items(expected_delivery_date);
CREATE INDEX idx_purchase_order_items_quality ON purchase_order_items(quality_check_required, quality_check_passed);

-- =====================================================================================
-- STOCK MOVEMENTS TABLE
-- Comprehensive stock movement tracking with audit trail
-- =====================================================================================
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'purchase', 'usage', 'waste', 'transfer_in', 'transfer_out', 'adjustment_in', 'adjustment_out')),
    
    -- Quantities and costs
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,4) NOT NULL CHECK (unit_cost >= 0),
    total_value DECIMAL(12,2) NOT NULL CHECK (total_value >= 0),
    previous_stock INTEGER NOT NULL CHECK (previous_stock >= 0),
    new_stock INTEGER NOT NULL CHECK (new_stock >= 0),
    
    -- Movement details
    reason VARCHAR(100) NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    
    -- Batch and expiry tracking
    batch_number VARCHAR(50),
    expiry_date TIMESTAMP WITH TIME ZONE,
    manufacturing_date TIMESTAMP WITH TIME ZONE,
    
    -- Location tracking
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    
    -- Related records
    purchase_order_id UUID,
    supplier_id UUID,
    transfer_to_item_id UUID,
    
    -- Dates
    movement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- System fields
    performed_by UUID NOT NULL,
    correlation_id UUID,
    
    -- Constraints
    CONSTRAINT chk_total_value CHECK (total_value = unit_cost * quantity),
    CONSTRAINT chk_stock_calculation CHECK (
        (movement_type IN ('stock_in', 'purchase', 'transfer_in', 'adjustment_in') AND new_stock = previous_stock + quantity) OR
        (movement_type IN ('stock_out', 'usage', 'waste', 'transfer_out', 'adjustment_out') AND new_stock = previous_stock - quantity)
    )
);

-- Indexes for stock_movements
CREATE INDEX idx_stock_movements_inventory_item ON stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_performed_by ON stock_movements(performed_by);
CREATE INDEX idx_stock_movements_purchase_order ON stock_movements(purchase_order_id);
CREATE INDEX idx_stock_movements_supplier ON stock_movements(supplier_id);
CREATE INDEX idx_stock_movements_batch ON stock_movements(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX idx_stock_movements_expiry ON stock_movements(expiry_date) WHERE expiry_date IS NOT NULL;

-- =====================================================================================
-- STOCK ALERTS TABLE
-- Automated stock alerts and notifications
-- =====================================================================================
CREATE TABLE stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL,
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('low_stock', 'critical_stock', 'out_of_stock', 'expiry_warning', 'expired', 'no_supplier', 'reorder_failed')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    
    -- Stock information
    current_stock INTEGER NOT NULL,
    reorder_point INTEGER,
    expiry_date TIMESTAMP WITH TIME ZONE,
    
    -- Resolution
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolution_notes TEXT,
    
    -- Notifications
    notifications_sent INTEGER NOT NULL DEFAULT 0,
    last_notification_sent TIMESTAMP WITH TIME ZONE,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    correlation_id UUID
);

-- Indexes for stock_alerts
CREATE INDEX idx_stock_alerts_inventory_item ON stock_alerts(inventory_item_id);
CREATE INDEX idx_stock_alerts_type ON stock_alerts(alert_type);
CREATE INDEX idx_stock_alerts_severity ON stock_alerts(severity);
CREATE INDEX idx_stock_alerts_resolved ON stock_alerts(is_resolved);
CREATE INDEX idx_stock_alerts_created_at ON stock_alerts(created_at);

-- =====================================================================================
-- ASSETS TABLE
-- Asset tracking and maintenance management
-- =====================================================================================
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type VARCHAR(30) NOT NULL CHECK (asset_type IN ('equipment', 'furniture', 'vehicle', 'technology', 'other')),
    asset_name VARCHAR(255) NOT NULL,
    asset_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Asset details
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Financial information
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL CHECK (purchase_price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    warranty_expiry TIMESTAMP WITH TIME ZONE,
    
    -- Location and assignment
    current_location VARCHAR(100) NOT NULL,
    assigned_to UUID,
    department VARCHAR(100),
    
    -- Maintenance
    maintenance_schedule JSONB,
    last_maintenance_date TIMESTAMP WITH TIME ZONE,
    next_maintenance_date TIMESTAMP WITH TIME ZONE,
    
    -- Compliance
    requires_calibration BOOLEAN NOT NULL DEFAULT FALSE,
    calibration_due TIMESTAMP WITH TIME ZONE,
    compliance_certificates JSONB DEFAULT '[]'::jsonb,
    
    -- Financial tracking
    depreciation_method VARCHAR(30) NOT NULL DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'units_of_production')),
    depreciation_rate DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (depreciation_rate >= 0 AND depreciation_rate <= 100),
    current_value DECIMAL(12,2) NOT NULL CHECK (current_value >= 0),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'disposed', 'lost')),
    condition VARCHAR(20) NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_repair')),
    
    -- System fields
    care_home_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID,
    correlation_id UUID
);

-- Indexes for assets
CREATE INDEX idx_assets_code ON assets(asset_code);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_care_home ON assets(care_home_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_location ON assets(current_location);
CREATE INDEX idx_assets_assigned_to ON assets(assigned_to);
CREATE INDEX idx_assets_maintenance ON assets(next_maintenance_date) WHERE next_maintenance_date IS NOT NULL;
CREATE INDEX idx_assets_calibration ON assets(calibration_due) WHERE requires_calibration = TRUE;

-- =====================================================================================
-- MAINTENANCE RECORDS TABLE
-- Asset maintenance history and tracking
-- =====================================================================================
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(30) NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency', 'calibration')),
    description TEXT NOT NULL,
    
    -- Scheduling
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0), -- Minutes
    
    -- Personnel
    performed_by UUID NOT NULL,
    supervised_by UUID,
    
    -- Details
    work_performed TEXT NOT NULL,
    parts_used JSONB DEFAULT '[]'::jsonb,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    
    -- Results
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'incomplete', 'failed')),
    next_maintenance_date TIMESTAMP WITH TIME ZONE,
    recommendations TEXT,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    correlation_id UUID
);

-- Indexes for maintenance_records
CREATE INDEX idx_maintenance_records_asset ON maintenance_records(asset_id);
CREATE INDEX idx_maintenance_records_type ON maintenance_records(maintenance_type);
CREATE INDEX idx_maintenance_records_date ON maintenance_records(actual_date);
CREATE INDEX idx_maintenance_records_performed_by ON maintenance_records(performed_by);
CREATE INDEX idx_maintenance_records_status ON maintenance_records(status);

-- =====================================================================================
-- APPROVAL WORKFLOWS TABLE
-- Purchase order and budget approval workflows
-- =====================================================================================
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_type VARCHAR(30) NOT NULL CHECK (workflow_type IN ('purchase_order', 'budget_variance', 'supplier_change')),
    resource_id UUID NOT NULL,
    
    -- Workflow definition
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL CHECK (total_steps > 0),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    correlation_id UUID
);

-- =====================================================================================
-- APPROVAL STEPS TABLE
-- Individual steps in approval workflows
-- =====================================================================================
CREATE TABLE approval_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL CHECK (step_number > 0),
    approver_role VARCHAR(50) NOT NULL,
    approver_name VARCHAR(255),
    approver_email VARCHAR(255),
    
    -- Requirements
    required_approvals INTEGER NOT NULL DEFAULT 1 CHECK (required_approvals > 0),
    current_approvals INTEGER NOT NULL DEFAULT 0 CHECK (current_approvals >= 0),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    comments TEXT,
    
    -- Escalation
    escalation_required BOOLEAN NOT NULL DEFAULT FALSE,
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalated_to UUID,
    
    CONSTRAINT uk_workflow_step UNIQUE (workflow_id, step_number)
);

-- Indexes for approval workflows and steps
CREATE INDEX idx_approval_workflows_type ON approval_workflows(workflow_type);
CREATE INDEX idx_approval_workflows_resource ON approval_workflows(resource_id);
CREATE INDEX idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX idx_approval_steps_workflow ON approval_steps(workflow_id);
CREATE INDEX idx_approval_steps_status ON approval_steps(status);

-- =====================================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================================================

-- Inventory summary view
CREATE VIEW inventory_summary AS
SELECT 
    ii.id,
    ii.item_code,
    ii.item_name,
    ii.category,
    ii.current_stock,
    ii.available_stock,
    ii.min_stock,
    ii.reorder_point,
    ii.total_value,
    ii.status,
    s.supplier_name as preferred_supplier_name,
    CASE 
        WHEN ii.current_stock <= 0 THEN 'out_of_stock'
        WHEN ii.current_stock <= ii.min_stock THEN 'low_stock'
        WHEN ii.current_stock > ii.max_stock THEN 'overstock'
        ELSE 'normal'
    END as stock_status
FROM inventory_items ii
LEFT JOIN suppliers s ON ii.preferred_supplier_id = s.id
WHERE ii.status = 'active';

-- Purchase order summary view
CREATE VIEW purchase_order_summary AS
SELECT 
    po.id,
    po.order_number,
    po.status,
    po.priority,
    po.total_amount,
    po.currency,
    po.expected_delivery_date,
    s.supplier_name,
    COUNT(poi.id) as item_count,
    SUM(poi.quantity_ordered) as total_quantity_ordered,
    SUM(poi.quantity_delivered) as total_quantity_delivered
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id, po.order_number, po.status, po.priority, po.total_amount, 
         po.currency, po.expected_delivery_date, s.supplier_name;

-- Stock alert summary view
CREATE VIEW stock_alert_summary AS
SELECT 
    sa.id,
    sa.alert_type,
    sa.severity,
    sa.message,
    sa.current_stock,
    sa.is_resolved,
    sa.created_at,
    ii.item_code,
    ii.item_name,
    ii.category
FROM stock_alerts sa
JOIN inventory_items ii ON sa.inventory_item_id = ii.id
WHERE sa.is_resolved = FALSE
ORDER BY sa.severity DESC, sa.created_at DESC;

-- =====================================================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================================================

-- Insert default categories
INSERT INTO inventory_items (id, item_code, item_name, category, unit_of_measure, unit_cost, care_home_id, created_by, updated_by) VALUES
(uuid_generate_v4(), 'SYSTEM-INIT', 'System Initialization Item', 'System', 'each', 0.00, uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4())
ON CONFLICT (item_code) DO NOTHING;

-- Grant permissions (adjust as needed for your user roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO inventory_service_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO inventory_service_role;

-- =====================================================================================
-- MIGRATION COMPLETION
-- =====================================================================================
COMMENT ON SCHEMA public IS 'WriteCareNotes Inventory & Supply Chain Management Schema - Version 001';