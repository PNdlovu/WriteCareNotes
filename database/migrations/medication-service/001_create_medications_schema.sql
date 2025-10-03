-- Medication Service Database Schema
-- Creates tables for medication management with controlled substance compliance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create medications table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    strength VARCHAR(100),
    form VARCHAR(100) NOT NULL, -- tablet, capsule, liquid, injection, etc.
    route VARCHAR(100) NOT NULL, -- oral, topical, injection, etc.
    manufacturer VARCHAR(255),
    ndc_code VARCHAR(20), -- National Drug Code
    active_ingredient VARCHAR(255),
    
    -- Controlled substance information
    is_controlled_substance BOOLEAN DEFAULT FALSE,
    controlled_substance_schedule VARCHAR(10), -- Schedule I-V
    dea_number VARCHAR(20),
    
    -- Clinical information
    therapeutic_class VARCHAR(255),
    contraindications TEXT[],
    side_effects TEXT[],
    drug_interactions TEXT[],
    
    -- Dosage information
    default_dosage DECIMAL(10,4),
    dosage_unit VARCHAR(50),
    max_daily_dose DECIMAL(10,4),
    min_dose_interval_hours INTEGER,
    
    -- Status and audit
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    version INTEGER DEFAULT 1
);

-- Create prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    resident_id UUID NOT NULL,
    medication_id UUID NOT NULL REFERENCES medications(id),
    
    -- Prescriber information
    prescriber_name VARCHAR(255) NOT NULL,
    prescriber_id VARCHAR(100),
    prescriber_license VARCHAR(100),
    
    -- Prescription details
    prescribed_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    dosage DECIMAL(10,4) NOT NULL,
    dosage_unit VARCHAR(50) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(100) NOT NULL,
    instructions TEXT,
    
    -- Quantity and refills
    quantity_prescribed INTEGER,
    quantity_remaining INTEGER,
    refills_authorized INTEGER DEFAULT 0,
    refills_remaining INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'completed', 'suspended')),
    discontinuation_reason TEXT,
    discontinued_date DATE,
    discontinued_by UUID,
    
    -- PRN (as needed) information
    is_prn BOOLEAN DEFAULT FALSE,
    prn_indication TEXT,
    max_doses_per_day INTEGER,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    version INTEGER DEFAULT 1,
    
    CONSTRAINT prescriptions_dates_check CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT prescriptions_quantity_check CHECK (quantity_remaining >= 0),
    CONSTRAINT prescriptions_refills_check CHECK (refills_remaining >= 0)
);

-- Create medication administration records (MAR)
CREATE TABLE medication_administration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    resident_id UUID NOT NULL,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    
    -- Administration details
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    administered_time TIMESTAMP WITH TIME ZONE,
    administered_by UUID NOT NULL,
    witness_id UUID, -- Required for controlled substances
    
    -- Dosage information
    dosage_scheduled DECIMAL(10,4) NOT NULL,
    dosage_administered DECIMAL(10,4),
    dosage_unit VARCHAR(50) NOT NULL,
    route_administered VARCHAR(100),
    
    -- Status and reasons
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'administered', 'refused', 'omitted', 'held')),
    refusal_reason TEXT,
    omission_reason TEXT,
    hold_reason TEXT,
    
    -- Clinical observations
    notes TEXT,
    side_effects_observed TEXT[],
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    
    -- Controlled substance tracking
    controlled_substance_count_before INTEGER,
    controlled_substance_count_after INTEGER,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    correlation_id UUID,
    
    CONSTRAINT medication_administration_dosage_check CHECK (
        (status = 'administered' AND dosage_administered IS NOT NULL) OR 
        (status != 'administered')
    )
);

-- Create controlled substance inventory table
CREATE TABLE controlled_substance_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    medication_id UUID NOT NULL REFERENCES medications(id),
    
    -- Inventory details
    lot_number VARCHAR(100),
    expiration_date DATE,
    quantity_received INTEGER NOT NULL,
    quantity_current INTEGER NOT NULL,
    quantity_dispensed INTEGER DEFAULT 0,
    quantity_wasted INTEGER DEFAULT 0,
    
    -- Tracking information
    received_date DATE NOT NULL,
    received_by UUID NOT NULL,
    supplier VARCHAR(255),
    invoice_number VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'recalled', 'depleted')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT controlled_substance_inventory_quantity_check CHECK (quantity_current >= 0),
    CONSTRAINT controlled_substance_inventory_balance_check CHECK (
        quantity_current = quantity_received - quantity_dispensed - quantity_wasted
    )
);

-- Create medication interactions table
CREATE TABLE medication_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_a_id UUID NOT NULL REFERENCES medications(id),
    medication_b_id UUID NOT NULL REFERENCES medications(id),
    interaction_type VARCHAR(100) NOT NULL, -- major, moderate, minor
    severity_level INTEGER NOT NULL CHECK (severity_level BETWEEN 1 AND 5),
    description TEXT NOT NULL,
    clinical_significance TEXT,
    management_strategy TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT medication_interactions_different_meds CHECK (medication_a_id != medication_b_id),
    UNIQUE(medication_a_id, medication_b_id)
);

-- Create indexes for performance
CREATE INDEX idx_medications_tenant_id ON medications(tenant_id);
CREATE INDEX idx_medications_name ON medications USING gin(name gin_trgm_ops);
CREATE INDEX idx_medications_generic_name ON medications USING gin(generic_name gin_trgm_ops);
CREATE INDEX idx_medications_controlled ON medications(is_controlled_substance) WHERE is_controlled_substance = TRUE;
CREATE INDEX idx_medications_active ON medications(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_medications_ndc_code ON medications(ndc_code) WHERE ndc_code IS NOT NULL;

CREATE INDEX idx_prescriptions_tenant_id ON prescriptions(tenant_id);
CREATE INDEX idx_prescriptions_resident_id ON prescriptions(resident_id);
CREATE INDEX idx_prescriptions_medication_id ON prescriptions(medication_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_active ON prescriptions(status) WHERE status = 'active';
CREATE INDEX idx_prescriptions_dates ON prescriptions(start_date, end_date);
CREATE INDEX idx_prescriptions_prescriber ON prescriptions(prescriber_id) WHERE prescriber_id IS NOT NULL;

CREATE INDEX idx_medication_administration_tenant_id ON medication_administration(tenant_id);
CREATE INDEX idx_medication_administration_resident_id ON medication_administration(resident_id);
CREATE INDEX idx_medication_administration_prescription_id ON medication_administration(prescription_id);
CREATE INDEX idx_medication_administration_scheduled_time ON medication_administration(scheduled_time);
CREATE INDEX idx_medication_administration_status ON medication_administration(status);
CREATE INDEX idx_medication_administration_administered_by ON medication_administration(administered_by);
CREATE INDEX idx_medication_administration_correlation_id ON medication_administration(correlation_id) WHERE correlation_id IS NOT NULL;

CREATE INDEX idx_controlled_substance_inventory_tenant_id ON controlled_substance_inventory(tenant_id);
CREATE INDEX idx_controlled_substance_inventory_medication_id ON controlled_substance_inventory(medication_id);
CREATE INDEX idx_controlled_substance_inventory_status ON controlled_substance_inventory(status);
CREATE INDEX idx_controlled_substance_inventory_expiration ON controlled_substance_inventory(expiration_date);

CREATE INDEX idx_medication_interactions_medication_a ON medication_interactions(medication_a_id);
CREATE INDEX idx_medication_interactions_medication_b ON medication_interactions(medication_b_id);
CREATE INDEX idx_medication_interactions_severity ON medication_interactions(severity_level);

-- Create triggers for updated_at
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_administration_updated_at BEFORE UPDATE ON medication_administration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_controlled_substance_inventory_updated_at BEFORE UPDATE ON controlled_substance_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_interactions_updated_at BEFORE UPDATE ON medication_interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check drug interactions
CREATE OR REPLACE FUNCTION check_drug_interactions(p_resident_id UUID, p_medication_id UUID)
RETURNS TABLE(
    interaction_id UUID,
    medication_name VARCHAR(255),
    interaction_type VARCHAR(100),
    severity_level INTEGER,
    description TEXT,
    management_strategy TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        m.name,
        mi.interaction_type,
        mi.severity_level,
        mi.description,
        mi.management_strategy
    FROM medication_interactions mi
    JOIN medications m ON (mi.medication_a_id = m.id OR mi.medication_b_id = m.id)
    WHERE (mi.medication_a_id = p_medication_id OR mi.medication_b_id = p_medication_id)
    AND m.id != p_medication_id
    AND EXISTS (
        SELECT 1 FROM prescriptions p
        WHERE p.resident_id = p_resident_id
        AND p.medication_id = m.id
        AND p.status = 'active'
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to update controlled substance inventory
CREATE OR REPLACE FUNCTION update_controlled_substance_inventory(
    p_medication_id UUID,
    p_quantity_used INTEGER,
    p_administration_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    inventory_record RECORD;
    sufficient_quantity BOOLEAN := FALSE;
BEGIN
    -- Find active inventory with sufficient quantity
    SELECT * INTO inventory_record
    FROM controlled_substance_inventory
    WHERE medication_id = p_medication_id
    AND status = 'active'
    AND quantity_current >= p_quantity_used
    ORDER BY expiration_date ASC, created_at ASC
    LIMIT 1;
    
    IF FOUND THEN
        -- Update inventory
        UPDATE controlled_substance_inventory
        SET 
            quantity_current = quantity_current - p_quantity_used,
            quantity_dispensed = quantity_dispensed + p_quantity_used,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = inventory_record.id;
        
        -- Update administration record with inventory counts
        UPDATE medication_administration
        SET 
            controlled_substance_count_before = inventory_record.quantity_current,
            controlled_substance_count_after = inventory_record.quantity_current - p_quantity_used
        WHERE id = p_administration_id;
        
        sufficient_quantity := TRUE;
    END IF;
    
    RETURN sufficient_quantity;
END;
$$ LANGUAGE plpgsql;

-- Create view for active prescriptions with medication details
CREATE VIEW active_prescriptions_with_medications AS
SELECT 
    p.id as prescription_id,
    p.tenant_id,
    p.resident_id,
    p.medication_id,
    m.name as medication_name,
    m.generic_name,
    m.strength,
    m.form,
    m.route as medication_route,
    p.dosage,
    p.dosage_unit,
    p.frequency,
    p.route as prescribed_route,
    p.instructions,
    p.is_prn,
    p.prn_indication,
    p.max_doses_per_day,
    p.start_date,
    p.end_date,
    p.prescriber_name,
    m.is_controlled_substance,
    m.controlled_substance_schedule,
    p.created_at,
    p.updated_at
FROM prescriptions p
JOIN medications m ON p.medication_id = m.id
WHERE p.status = 'active'
AND m.is_active = TRUE;

-- Create view for medication administration due
CREATE VIEW medication_administration_due AS
SELECT 
    p.id as prescription_id,
    p.resident_id,
    p.medication_id,
    m.name as medication_name,
    p.dosage,
    p.dosage_unit,
    p.frequency,
    p.route,
    p.is_prn,
    CASE 
        WHEN p.is_prn THEN NULL
        ELSE CURRENT_TIMESTAMP + INTERVAL '1 hour' -- Next scheduled time logic would be more complex
    END as next_due_time,
    m.is_controlled_substance
FROM prescriptions p
JOIN medications m ON p.medication_id = m.id
WHERE p.status = 'active'
AND m.is_active = TRUE
AND (p.end_date IS NULL OR p.end_date >= CURRENT_DATE);

-- Grant permissions to medication service user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medication_service;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO medication_service;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO medication_service;