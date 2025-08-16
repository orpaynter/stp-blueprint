"""
OrPaynter AI Platform Database Models
Shared SQLAlchemy models for all microservices
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, DECIMAL, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    phone_number = Column(String(20))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # homeowner, contractor, supplier, insurance_agent, adjuster, admin
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    status = Column(String(20), default="active")  # active, inactive, suspended
    profile_complete = Column(Boolean, default=False)
    notification_preferences = Column(JSON, default={"email": True, "sms": False, "push": True})
    
    # Relationships
    company = relationship("Company", back_populates="users")
    subscriptions = relationship("Subscription", back_populates="user")
    projects_owned = relationship("Project", foreign_keys="Project.homeowner_id", back_populates="homeowner")
    projects_contracted = relationship("Project", foreign_keys="Project.contractor_id", back_populates="contractor")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # contractor, supplier, insurance
    street = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    country = Column(String(50), default="USA")
    phone = Column(String(20))
    email = Column(String(255))
    website = Column(String(255))
    tax_id = Column(String(255))  # encrypted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(20), default="active")
    verification_status = Column(String(20), default="unverified")
    service_areas = Column(JSON, default=[])  # zip codes
    specialties = Column(JSON, default=[])
    logo_url = Column(String(500))
    
    # Relationships
    users = relationship("User", back_populates="company")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False)
    status = Column(String(20), nullable=False)  # active, canceled, past_due, trialing
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    cancel_at_period_end = Column(Boolean, default=False)
    payment_method_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default={})
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    role = Column(String(50), nullable=False)  # homeowner, contractor, supplier, insurance_agent
    tier = Column(String(20), nullable=False)  # free, basic, professional, enterprise
    price_monthly = Column(DECIMAL(10, 2))
    price_yearly = Column(DECIMAL(10, 2))
    features = Column(JSON, default=[])
    limits = Column(JSON, default={})  # projects, users, storage, api_calls
    stripe_price_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    active = Column(Boolean, default=True)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    homeowner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    contractor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="draft")  # draft, active, in_progress, completed, cancelled
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    estimated_cost = Column(DECIMAL(12, 2))
    final_cost = Column(DECIMAL(12, 2))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    completion_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default={})
    
    # Relationships
    homeowner = relationship("User", foreign_keys=[homeowner_id], back_populates="projects_owned")
    contractor = relationship("User", foreign_keys=[contractor_id], back_populates="projects_contracted")
    property = relationship("Property", back_populates="projects")

class Property(Base):
    __tablename__ = "properties"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    street = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(20), nullable=False)
    country = Column(String(50), default="USA")
    property_type = Column(String(50))  # single_family, townhouse, condo, commercial
    year_built = Column(Integer)
    square_footage = Column(Integer)
    roof_type = Column(String(50))
    roof_material = Column(String(50))
    roof_age = Column(Integer)
    insurance_carrier = Column(String(255))
    policy_number = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default={})
    
    # Relationships
    owner = relationship("User")
    projects = relationship("Project", back_populates="property")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    payee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    amount = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(3), default="USD")
    transaction_type = Column(String(50), nullable=False)  # subscription, project_payment, commission
    status = Column(String(20), default="pending")  # pending, completed, failed, refunded
    stripe_payment_intent_id = Column(String(255))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default={})

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    document_type = Column(String(50))  # image, pdf, contract, invoice, receipt
    ai_analysis_result = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSON, default={})

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    analysis_type = Column(String(50), nullable=False)  # damage_detection, cost_estimation, material_prediction
    input_data = Column(JSON, default={})
    result = Column(JSON, default={})
    confidence_score = Column(DECIMAL(5, 4))
    model_version = Column(String(50))
    processing_time = Column(DECIMAL(8, 3))  # seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON, default={})

# Create indexes for better performance
from sqlalchemy import Index

# User indexes
Index('idx_users_email', User.email)
Index('idx_users_role', User.role)
Index('idx_users_company_id', User.company_id)

# Project indexes
Index('idx_projects_homeowner_id', Project.homeowner_id)
Index('idx_projects_contractor_id', Project.contractor_id)
Index('idx_projects_status', Project.status)
Index('idx_projects_created_at', Project.created_at)

# Property indexes
Index('idx_properties_owner_id', Property.owner_id)
Index('idx_properties_zip_code', Property.zip_code)

# Transaction indexes
Index('idx_transactions_payer_id', Transaction.payer_id)
Index('idx_transactions_payee_id', Transaction.payee_id)
Index('idx_transactions_status', Transaction.status)
Index('idx_transactions_created_at', Transaction.created_at)

# Document indexes
Index('idx_documents_project_id', Document.project_id)
Index('idx_documents_user_id', Document.user_id)
Index('idx_documents_document_type', Document.document_type)

# AI Analysis indexes
Index('idx_ai_analyses_project_id', AIAnalysis.project_id)
Index('idx_ai_analyses_analysis_type', AIAnalysis.analysis_type)
Index('idx_ai_analyses_created_at', AIAnalysis.created_at)
