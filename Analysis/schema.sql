-- PostgreSQL Schema for OrPaynter AI Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('homeowner', 'contractor', 'supplier', 'insurance_agent')),
    phone VARCHAR(20),
    company_name VARCHAR(255),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_zip VARCHAR(20),
    address_country VARCHAR(100) DEFAULT 'US',
    profile_image_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    client_id UUID NOT NULL REFERENCES users(id),
    contractor_id UUID REFERENCES users(id),
    address_street VARCHAR(255) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_state VARCHAR(100) NOT NULL,
    address_zip VARCHAR(20) NOT NULL,
    address_country VARCHAR(100) DEFAULT 'US',
    start_date DATE,
    end_date DATE,
    estimated_cost DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_contractor_id ON projects(contractor_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Assessments Table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('initial', 'follow_up', 'final')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    performed_by UUID REFERENCES users(id),
    roof_type VARCHAR(100),
    roof_age INTEGER,
    roof_area_squares DECIMAL(8, 2),
    pitch VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_project_id ON assessments(project_id);
CREATE INDEX idx_assessments_performed_by ON assessments(performed_by);

-- Assessment Images Table
CREATE TABLE assessment_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    image_url VARCHAR(255) NOT NULL,
    image_type VARCHAR(50) NOT NULL CHECK (image_type IN ('overview', 'damage_detail', 'measurement', 'other')),
    taken_at TIMESTAMP WITH TIME ZONE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessment_images_assessment_id ON assessment_images(assessment_id);

-- Damage Detections Table
CREATE TABLE damage_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    image_id UUID REFERENCES assessment_images(id),
    damage_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    location VARCHAR(100),
    confidence DECIMAL(5, 4) NOT NULL,
    bounding_box_x INTEGER,
    bounding_box_y INTEGER,
    bounding_box_width INTEGER,
    bounding_box_height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_damage_detections_assessment_id ON damage_detections(assessment_id);
CREATE INDEX idx_damage_detections_image_id ON damage_detections(image_id);

-- Cost Estimates Table
CREATE TABLE cost_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    material_type VARCHAR(100) NOT NULL,
    quality VARCHAR(50) NOT NULL CHECK (quality IN ('economy', 'standard', 'premium')),
    region VARCHAR(100) NOT NULL,
    material_cost_min DECIMAL(12, 2) NOT NULL,
    material_cost_max DECIMAL(12, 2) NOT NULL,
    material_cost_avg DECIMAL(12, 2) NOT NULL,
    labor_cost_min DECIMAL(12, 2) NOT NULL,
    labor_cost_max DECIMAL(12, 2) NOT NULL,
    labor_cost_avg DECIMAL(12, 2) NOT NULL,
    additional_costs_total DECIMAL(12, 2) NOT NULL,
    total_cost_min DECIMAL(12, 2) NOT NULL,
    total_cost_max DECIMAL(12, 2) NOT NULL,
    total_cost_avg DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_estimates_assessment_id ON cost_estimates(assessment_id);

-- Claims Table
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    policy_number VARCHAR(100) NOT NULL,
    insurance_company VARCHAR(255) NOT NULL,
    adjuster_name VARCHAR(255),
    adjuster_email VARCHAR(255),
    adjuster_phone VARCHAR(20),
    incident_date DATE NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    incident_description TEXT,
    policy_start_date DATE,
    policy_end_date DATE,
    deductible DECIMAL(12, 2),
    coverage_limit DECIMAL(12, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'denied', 'paid')),
    claim_amount DECIMAL(12, 2) NOT NULL,
    approved_amount DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    submitted_date TIMESTAMP WITH TIME ZONE,
    approved_date TIMESTAMP WITH TIME ZONE,
    denied_date TIMESTAMP WITH TIME ZONE,
    denial_reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_claims_project_id ON claims(project_id);
CREATE INDEX idx_claims_assessment_id ON claims(assessment_id);
CREATE INDEX idx_claims_status ON claims(status);

-- Claim Documents Table
CREATE TABLE claim_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id),
    document_type VARCHAR(100) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_claim_documents_claim_id ON claim_documents(claim_id);

-- Claim Notes Table
CREATE TABLE claim_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id),
    author_id UUID REFERENCES users(id),
    author_name VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_claim_notes_claim_id ON claim_notes(claim_id);

-- Fraud Detection Results Table
CREATE TABLE fraud_detection_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id),
    fraud_score DECIMAL(5, 4) NOT NULL,
    risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    suspicious_patterns JSONB,
    recommendation TEXT,
    validation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fraud_detection_results_claim_id ON fraud_detection_results(claim_id);

-- Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES users(id),
    contractor_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 4) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    terms TEXT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_contractor_id ON invoices(contractor_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Invoice Items Table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    invoice_id UUID REFERENCES invoices(id),
    claim_id UUID REFERENCES claims(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50) NOT NULL,
    payment_details JSONB,
    transaction_id VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(12, 2),
    refund_reason TEXT
);

CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_claim_id ON payments(claim_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Schedule Table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    assigned_to UUID REFERENCES users(id),
    weather_dependent BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_project_id ON schedules(project_id);
CREATE INDEX idx_schedules_assigned_to ON schedules(assigned_to);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);

-- Weather Data Table
CREATE TABLE weather_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    forecast_date DATE NOT NULL,
    temperature_high DECIMAL(5, 2),
    temperature_low DECIMAL(5, 2),
    precipitation_probability DECIMAL(5, 4),
    precipitation_type VARCHAR(50),
    wind_speed DECIMAL(5, 2),
    weather_condition VARCHAR(100),
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weather_data_project_id ON weather_data(project_id);
CREATE INDEX idx_weather_data_forecast_date ON weather_data(forecast_date);

-- Marketplace Products Table
CREATE TABLE marketplace_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    unit VARCHAR(50) NOT NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    inventory_count INTEGER,
    supplier_id UUID NOT NULL REFERENCES users(id),
    specifications JSONB,
    features JSONB,
    warranty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketplace_products_supplier_id ON marketplace_products(supplier_id);
CREATE INDEX idx_marketplace_products_category ON marketplace_products(category);

-- Marketplace Services Table
CREATE TABLE marketplace_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    duration INTEGER NOT NULL,
    provider_id UUID NOT NULL REFERENCES users(id),
    details JSONB,
    availability JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketplace_services_provider_id ON marketplace_services(provider_id);
CREATE INDEX idx_marketplace_services_category ON marketplace_services(category);

-- Marketplace Orders Table
CREATE TABLE marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 4) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,
    shipping_cost DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(255),
    estimated_delivery DATE,
    actual_delivery DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketplace_orders_project_id ON marketplace_orders(project_id);
CREATE INDEX idx_marketplace_orders_customer_id ON marketplace_orders(customer_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);

-- Marketplace Order Items Table
CREATE TABLE marketplace_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES marketplace_orders(id),
    product_id UUID REFERENCES marketplace_products(id),
    service_id UUID REFERENCES marketplace_services(id),
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketplace_order_items_order_id ON marketplace_order_items(order_id);
CREATE INDEX idx_marketplace_order_items_product_id ON marketplace_order_items(product_id);
CREATE INDEX idx_marketplace_order_items_service_id ON marketplace_order_items(service_id);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VAR
(Content truncated due to size limit. Use line ranges to read in chunks)