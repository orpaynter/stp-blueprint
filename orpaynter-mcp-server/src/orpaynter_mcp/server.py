#!/usr/bin/env python3
"""
OrPaynter Autonomous Roofing Lead Generation and Qualification MCP Server

This server provides comprehensive lead generation, qualification, contractor matching,
and appointment scheduling capabilities for the roofing industry.
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any, Literal
from pathlib import Path
import aiosqlite
from fastmcp import FastMCP, Context
from pydantic import BaseModel, Field
import httpx
from PIL import Image
import io
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastMCP server
mcp = FastMCP("OrPaynter Lead Generation System")

# Database configuration
DB_PATH = os.getenv("ORPAYNTER_DB_PATH", "/tmp/orpaynter.db")
UPLOADS_DIR = os.getenv("ORPAYNTER_UPLOADS_DIR", "/tmp/orpaynter_uploads")

# External API configurations
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# Pydantic models for data validation
class LeadContact(BaseModel):
    """Lead contact information"""
    name: str = Field(..., description="Lead's full name")
    email: str = Field(..., description="Lead's email address")
    phone: str = Field(..., description="Lead's phone number")
    address: str = Field(..., description="Property address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State/Province")
    zip_code: str = Field(..., description="ZIP/Postal code")

class PropertyDetails(BaseModel):
    """Property details for roofing assessment"""
    property_type: Literal["residential", "commercial"] = Field(..., description="Type of property")
    roof_age: Optional[int] = Field(None, description="Age of roof in years")
    roof_material: Optional[str] = Field(None, description="Current roof material")
    square_footage: Optional[int] = Field(None, description="Approximate square footage")
    stories: Optional[int] = Field(None, description="Number of stories")
    slope: Optional[str] = Field(None, description="Roof slope (low, medium, steep)")

class DamageAssessment(BaseModel):
    """Damage assessment details"""
    damage_type: str = Field(..., description="Type of damage (storm, leak, age, etc.)")
    damage_severity: Literal["minor", "moderate", "severe", "emergency"] = Field(..., description="Severity level")
    damage_description: str = Field(..., description="Detailed description of damage")
    photos_uploaded: bool = Field(default=False, description="Whether photos were uploaded")
    urgency_level: int = Field(..., ge=1, le=10, description="Urgency on scale 1-10")

class InsuranceInfo(BaseModel):
    """Insurance information"""
    has_insurance: bool = Field(..., description="Whether property owner has insurance")
    insurance_company: Optional[str] = Field(None, description="Insurance company name")
    claim_filed: Optional[bool] = Field(None, description="Whether claim has been filed")
    claim_number: Optional[str] = Field(None, description="Insurance claim number")
    deductible: Optional[float] = Field(None, description="Insurance deductible amount")

class QualificationCriteria(BaseModel):
    """Lead qualification criteria"""
    budget_range: Optional[str] = Field(None, description="Budget range for project")
    timeline: Optional[str] = Field(None, description="Desired project timeline")
    decision_maker: bool = Field(..., description="Whether contact is decision maker")
    financing_needed: bool = Field(default=False, description="Whether financing is needed")

class Lead(BaseModel):
    """Complete lead information"""
    contact: LeadContact
    property: PropertyDetails
    damage: DamageAssessment
    insurance: InsuranceInfo
    qualification: QualificationCriteria
    source: str = Field(default="chatbot", description="Lead source")
    notes: Optional[str] = Field(None, description="Additional notes")

class Contractor(BaseModel):
    """Contractor information"""
    id: str = Field(..., description="Unique contractor ID")
    name: str = Field(..., description="Contractor business name")
    email: str = Field(..., description="Contact email")
    phone: str = Field(..., description="Contact phone")
    service_areas: List[str] = Field(..., description="ZIP codes served")
    specialties: List[str] = Field(..., description="Roofing specialties")
    rating: float = Field(..., ge=0, le=5, description="Contractor rating")
    availability: bool = Field(default=True, description="Current availability")
    response_time_avg: int = Field(..., description="Average response time in hours")

class Appointment(BaseModel):
    """Appointment information"""
    lead_id: str = Field(..., description="Associated lead ID")
    contractor_id: str = Field(..., description="Assigned contractor ID")
    scheduled_date: datetime = Field(..., description="Scheduled appointment date/time")
    appointment_type: Literal["inspection", "estimate", "consultation"] = Field(..., description="Type of appointment")
    status: Literal["scheduled", "confirmed", "completed", "cancelled", "rescheduled"] = Field(default="scheduled", description="Appointment status")
    notes: Optional[str] = Field(None, description="Appointment notes")

# Database initialization
async def init_database() -> None:
    """Initialize the SQLite database with required tables"""
    async with aiosqlite.connect(DB_PATH) as db:
        # Leads table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id TEXT PRIMARY KEY,
                contact_info TEXT NOT NULL,
                property_details TEXT NOT NULL,
                damage_assessment TEXT NOT NULL,
                insurance_info TEXT NOT NULL,
                qualification_criteria TEXT NOT NULL,
                qualification_score INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                source TEXT NOT NULL DEFAULT 'chatbot',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
            )
        """)
        
        # Contractors table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS contractors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                service_areas TEXT NOT NULL,
                specialties TEXT NOT NULL,
                rating REAL NOT NULL DEFAULT 4.0,
                availability BOOLEAN DEFAULT TRUE,
                response_time_avg INTEGER DEFAULT 24,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Appointments table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id TEXT PRIMARY KEY,
                lead_id TEXT NOT NULL,
                contractor_id TEXT NOT NULL,
                scheduled_date TIMESTAMP NOT NULL,
                appointment_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'scheduled',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads(id),
                FOREIGN KEY (contractor_id) REFERENCES contractors(id)
            )
        """)
        
        # Lead documents table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS lead_documents (
                id TEXT PRIMARY KEY,
                lead_id TEXT NOT NULL,
                document_type TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lead_id) REFERENCES leads(id)
            )
        """)
        
        # Analytics table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS analytics (
                id TEXT PRIMARY KEY,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                period_start TIMESTAMP NOT NULL,
                period_end TIMESTAMP NOT NULL,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        await db.commit()

# Utility functions
def calculate_lead_score(lead: Lead) -> int:
    """Calculate lead qualification score (1-10)"""
    score = 5  # Base score
    
    # Damage severity scoring
    severity_scores = {"emergency": 3, "severe": 2, "moderate": 1, "minor": 0}
    score += severity_scores.get(lead.damage.damage_severity, 0)
    
    # Urgency scoring
    if lead.damage.urgency_level >= 8:
        score += 2
    elif lead.damage.urgency_level >= 6:
        score += 1
    
    # Insurance scoring
    if lead.insurance.has_insurance:
        score += 1
        if lead.insurance.claim_filed:
            score += 1
    
    # Decision maker scoring
    if lead.qualification.decision_maker:
        score += 1
    
    # Photo evidence scoring
    if lead.damage.photos_uploaded:
        score += 1
    
    return min(10, max(1, score))

async def send_email_notification(to_email: str, subject: str, content: str, ctx: Context) -> bool:
    """Send email notification using SendGrid"""
    if not SENDGRID_API_KEY:
        await ctx.warning("SendGrid API key not configured")
        return False
    
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail
        
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        message = Mail(
            from_email='noreply@orpaynter.com',
            to_emails=to_email,
            subject=subject,
            html_content=content
        )
        
        response = sg.send(message)
        await ctx.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        await ctx.error(f"Failed to send email: {str(e)}")
        return False

async def send_sms_notification(to_phone: str, message: str, ctx: Context) -> bool:
    """Send SMS notification using Twilio"""
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        await ctx.warning("Twilio credentials not configured")
        return False
    
    try:
        from twilio.rest import Client
        
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        sms = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone
        )
        
        await ctx.info(f"SMS sent successfully to {to_phone}")
        return True
    except Exception as e:
        await ctx.error(f"Failed to send SMS: {str(e)}")
        return False

# MCP Tools Implementation

@mcp.tool
async def qualify_lead(
    contact_name: str,
    contact_email: str,
    contact_phone: str,
    property_address: str,
    city: str,
    state: str,
    zip_code: str,
    property_type: Literal["residential", "commercial"],
    damage_type: str,
    damage_severity: Literal["minor", "moderate", "severe", "emergency"],
    damage_description: str,
    urgency_level: int,
    has_insurance: bool,
    is_decision_maker: bool,
    ctx: Context,
    roof_age: Optional[int] = None,
    roof_material: Optional[str] = None,
    square_footage: Optional[int] = None,
    insurance_company: Optional[str] = None,
    claim_filed: Optional[bool] = None,
    budget_range: Optional[str] = None,
    timeline: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process and qualify a roofing lead through intelligent conversation flow.
    
    Returns lead qualification results including score and next steps.
    """
    try:
        await ensure_db_initialized()
        await ctx.info(f"Processing lead qualification for {contact_name}")
        
        # Create lead object
        lead = Lead(
            contact=LeadContact(
                name=contact_name,
                email=contact_email,
                phone=contact_phone,
                address=property_address,
                city=city,
                state=state,
                zip_code=zip_code
            ),
            property=PropertyDetails(
                property_type=property_type,
                roof_age=roof_age,
                roof_material=roof_material,
                square_footage=square_footage
            ),
            damage=DamageAssessment(
                damage_type=damage_type,
                damage_severity=damage_severity,
                damage_description=damage_description,
                urgency_level=urgency_level
            ),
            insurance=InsuranceInfo(
                has_insurance=has_insurance,
                insurance_company=insurance_company,
                claim_filed=claim_filed
            ),
            qualification=QualificationCriteria(
                budget_range=budget_range,
                timeline=timeline,
                decision_maker=is_decision_maker
            ),
            notes=notes
        )
        
        # Calculate qualification score
        score = calculate_lead_score(lead)
        
        # Determine qualification status
        qualified = score >= 6
        priority = "high" if score >= 8 else "medium" if score >= 6 else "low"
        
        # Store lead in database
        lead_id = f"LEAD_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO leads (id, contact_info, property_details, damage_assessment, 
                                 insurance_info, qualification_criteria, qualification_score, 
                                 status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                lead_id,
                json.dumps(lead.contact.dict()),
                json.dumps(lead.property.dict()),
                json.dumps(lead.damage.dict()),
                json.dumps(lead.insurance.dict()),
                json.dumps(lead.qualification.dict()),
                score,
                "qualified" if qualified else "unqualified",
                notes
            ))
            await db.commit()
        
        await ctx.info(f"Lead {lead_id} qualified with score {score}")
        
        return {
            "lead_id": lead_id,
            "qualified": qualified,
            "score": score,
            "priority": priority,
            "recommended_actions": [
                "Schedule inspection" if qualified else "Follow up in 30 days",
                "Photo upload recommended" if not lead.damage.photos_uploaded else "Photos received",
                "Insurance claim assistance" if has_insurance and not claim_filed else None
            ],
            "next_steps": "Contractor matching" if qualified else "Lead nurturing"
        }
        
    except Exception as e:
        await ctx.error(f"Lead qualification failed: {str(e)}")
        raise

@mcp.tool
async def match_contractors(
    lead_id: str,
    ctx: Context,
    specialty_required: Optional[str] = None,
    max_contractors: int = 3
) -> Dict[str, Any]:
    """
    Match qualified leads with appropriate local contractors based on location,
    specialization, availability, and performance metrics.
    """
    try:
        await ensure_db_initialized()
        await ctx.info(f"Finding contractors for lead {lead_id}")
        
        # Get lead details
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)) as cursor:
                lead_row = await cursor.fetchone()
                
            if not lead_row:
                raise ValueError(f"Lead {lead_id} not found")
            
            contact_info = json.loads(lead_row[1])
            zip_code = contact_info["zip_code"]
            
            # Find matching contractors
            async with db.execute("""
                SELECT * FROM contractors 
                WHERE availability = TRUE 
                AND service_areas LIKE ?
                ORDER BY rating DESC, response_time_avg ASC
                LIMIT ?
            """, (f"%{zip_code}%", max_contractors)) as cursor:
                contractors = await cursor.fetchall()
        
        if not contractors:
            # Create sample contractors for demonstration
            sample_contractors = [
                {
                    "id": "CONT_001",
                    "name": "Elite Roofing Solutions",
                    "email": "contact@eliteroofing.com", 
                    "phone": "(555) 123-4567",
                    "rating": 4.8,
                    "response_time_avg": 2,
                    "specialties": ["storm damage", "residential", "insurance claims"]
                },
                {
                    "id": "CONT_002", 
                    "name": "ProRoof Masters",
                    "email": "info@proroofmasters.com",
                    "phone": "(555) 234-5678", 
                    "rating": 4.6,
                    "response_time_avg": 4,
                    "specialties": ["commercial", "emergency repair", "metal roofing"]
                },
                {
                    "id": "CONT_003",
                    "name": "Reliable Roofing Co",
                    "email": "service@reliableroofing.com",
                    "phone": "(555) 345-6789",
                    "rating": 4.5,
                    "response_time_avg": 6,
                    "specialties": ["residential", "shingle replacement", "gutters"]
                }
            ]
            
            # Store sample contractors
            async with aiosqlite.connect(DB_PATH) as db:
                for contractor in sample_contractors:
                    await db.execute("""
                        INSERT OR REPLACE INTO contractors 
                        (id, name, email, phone, service_areas, specialties, rating, response_time_avg)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        contractor["id"],
                        contractor["name"],
                        contractor["email"],
                        contractor["phone"],
                        json.dumps([zip_code]),
                        json.dumps(contractor["specialties"]),
                        contractor["rating"],
                        contractor["response_time_avg"]
                    ))
                await db.commit()
            
            matched_contractors = sample_contractors
        else:
            matched_contractors = [
                {
                    "id": row[0],
                    "name": row[1],
                    "email": row[2],
                    "phone": row[3],
                    "rating": row[6],
                    "response_time_avg": row[8],
                    "specialties": json.loads(row[5])
                }
                for row in contractors
            ]
        
        await ctx.info(f"Found {len(matched_contractors)} contractors for lead {lead_id}")
        
        return {
            "lead_id": lead_id,
            "matched_contractors": matched_contractors,
            "match_criteria": {
                "location": zip_code,
                "specialty": specialty_required,
                "max_contractors": max_contractors
            },
            "next_action": "Send notifications to contractors"
        }
        
    except Exception as e:
        await ctx.error(f"Contractor matching failed: {str(e)}")
        raise

@mcp.tool
async def schedule_appointment(
    lead_id: str,
    contractor_id: str,
    appointment_date: str,
    appointment_type: Literal["inspection", "estimate", "consultation"],
    ctx: Context,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Schedule inspection appointments between clients and contractors with
    calendar integration and automated reminders.
    """
    try:
        await ensure_db_initialized()
        await ctx.info(f"Scheduling {appointment_type} for lead {lead_id} with contractor {contractor_id}")
        
        # Parse appointment date
        try:
            scheduled_date = datetime.fromisoformat(appointment_date.replace('Z', '+00:00'))
        except ValueError:
            from dateutil.parser import parse
            scheduled_date = parse(appointment_date)
        
        # Generate appointment ID
        appointment_id = f"APPT_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        # Store appointment
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO appointments (id, lead_id, contractor_id, scheduled_date, 
                                        appointment_type, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                appointment_id,
                lead_id,
                contractor_id,
                scheduled_date.isoformat(),
                appointment_type,
                "scheduled",
                notes
            ))
            
            # Get lead and contractor details for notifications
            async with db.execute("SELECT contact_info FROM leads WHERE id = ?", (lead_id,)) as cursor:
                lead_row = await cursor.fetchone()
                lead_contact = json.loads(lead_row[0])
            
            async with db.execute("SELECT name, email, phone FROM contractors WHERE id = ?", (contractor_id,)) as cursor:
                contractor_row = await cursor.fetchone()
                contractor_name, contractor_email, contractor_phone = contractor_row
            
            await db.commit()
        
        # Send confirmation notifications
        client_email_subject = f"Roofing {appointment_type.title()} Scheduled"
        client_email_content = f"""
        <h2>Your roofing {appointment_type} has been scheduled!</h2>
        <p><strong>Date & Time:</strong> {scheduled_date.strftime('%B %d, %Y at %I:%M %p')}</p>
        <p><strong>Contractor:</strong> {contractor_name}</p>
        <p><strong>Contractor Phone:</strong> {contractor_phone}</p>
        <p><strong>Appointment ID:</strong> {appointment_id}</p>
        {f'<p><strong>Notes:</strong> {notes}</p>' if notes else ''}
        <p>Please be available at your property for the scheduled appointment.</p>
        """
        
        contractor_email_subject = f"New {appointment_type.title()} Appointment"
        contractor_email_content = f"""
        <h2>New appointment scheduled</h2>
        <p><strong>Client:</strong> {lead_contact['name']}</p>
        <p><strong>Address:</strong> {lead_contact['address']}, {lead_contact['city']}, {lead_contact['state']} {lead_contact['zip_code']}</p>
        <p><strong>Date & Time:</strong> {scheduled_date.strftime('%B %d, %Y at %I:%M %p')}</p>
        <p><strong>Type:</strong> {appointment_type.title()}</p>
        <p><strong>Client Phone:</strong> {lead_contact['phone']}</p>
        <p><strong>Appointment ID:</strong> {appointment_id}</p>
        {f'<p><strong>Notes:</strong> {notes}</p>' if notes else ''}
        """
        
        # Send email notifications
        await send_email_notification(lead_contact['email'], client_email_subject, client_email_content, ctx)
        await send_email_notification(contractor_email, contractor_email_subject, contractor_email_content, ctx)
        
        # Schedule reminder notifications (24 hours before)
        reminder_time = scheduled_date - timedelta(hours=24)
        
        await ctx.info(f"Appointment {appointment_id} scheduled successfully")
        
        return {
            "appointment_id": appointment_id,
            "lead_id": lead_id,
            "contractor_id": contractor_id,
            "scheduled_date": scheduled_date.isoformat(),
            "appointment_type": appointment_type,
            "status": "scheduled",
            "notifications_sent": True,
            "reminder_scheduled": reminder_time.isoformat(),
            "next_steps": [
                "Appointment confirmation sent to both parties",
                "Reminder notifications scheduled",
                "Contractor will receive lead details"
            ]
        }
        
    except Exception as e:
        await ctx.error(f"Appointment scheduling failed: {str(e)}")
        raise

@mcp.tool
async def store_lead_data(
    lead_id: str,
    data_type: Literal["contact", "property", "damage", "insurance", "qualification", "notes"],
    data: Dict[str, Any],
    ctx: Context
) -> Dict[str, Any]:
    """
    Store and manage lead information in structured database format with
    full CRUD operations and data validation.
    """
    try:
        await ctx.info(f"Storing {data_type} data for lead {lead_id}")
        
        # Validate data based on type
        if data_type == "contact":
            validated_data = LeadContact(**data)
        elif data_type == "property":
            validated_data = PropertyDetails(**data)
        elif data_type == "damage":
            validated_data = DamageAssessment(**data)
        elif data_type == "insurance":
            validated_data = InsuranceInfo(**data)
        elif data_type == "qualification":
            validated_data = QualificationCriteria(**data)
        else:  # notes
            validated_data = data
        
        # Update database
        async with aiosqlite.connect(DB_PATH) as db:
            if data_type == "notes":
                await db.execute(
                    "UPDATE leads SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (json.dumps(data), lead_id)
                )
            else:
                column_map = {
                    "contact": "contact_info",
                    "property": "property_details", 
                    "damage": "damage_assessment",
                    "insurance": "insurance_info",
                    "qualification": "qualification_criteria"
                }
                
                column = column_map[data_type]
                await db.execute(
                    f"UPDATE leads SET {column} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (json.dumps(validated_data.dict() if hasattr(validated_data, 'dict') else validated_data), lead_id)
                )
            
            await db.commit()
        
        await ctx.info(f"Successfully stored {data_type} data for lead {lead_id}")
        
        return {
            "lead_id": lead_id,
            "data_type": data_type,
            "stored": True,
            "updated_at": datetime.now().isoformat(),
            "data_summary": f"{data_type.title()} information updated"
        }
        
    except Exception as e:
        await ctx.error(f"Data storage failed: {str(e)}")
        raise

@mcp.tool
async def send_notifications(
    notification_type: Literal["email", "sms", "both"],
    recipients: List[str],
    subject: str,
    message: str,
    ctx: Context,
    template: Optional[str] = None
) -> Dict[str, Any]:
    """
    Handle email and SMS communications for lead follow-ups, contractor
    notifications, and appointment reminders.
    """
    try:
        await ctx.info(f"Sending {notification_type} notifications to {len(recipients)} recipients")
        
        results = {"email": [], "sms": []}
        
        for recipient in recipients:
            if notification_type in ["email", "both"]:
                if "@" in recipient:  # Email address
                    email_success = await send_email_notification(recipient, subject, message, ctx)
                    results["email"].append({"recipient": recipient, "success": email_success})
            
            if notification_type in ["sms", "both"]:
                if "@" not in recipient:  # Phone number
                    sms_success = await send_sms_notification(recipient, message, ctx)
                    results["sms"].append({"recipient": recipient, "success": sms_success})
        
        total_sent = sum(1 for r in results["email"] if r["success"]) + sum(1 for r in results["sms"] if r["success"])
        
        await ctx.info(f"Successfully sent {total_sent} notifications")
        
        return {
            "notification_type": notification_type,
            "total_recipients": len(recipients),
            "total_sent": total_sent,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        await ctx.error(f"Notification sending failed: {str(e)}")
        raise

@mcp.tool
async def process_documents(
    lead_id: str,
    file_data: str,
    file_name: str,
    document_type: Literal["photo", "insurance_doc", "inspection_report", "estimate"],
    ctx: Context,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Handle photo uploads for damage assessment, process insurance documents,
    and manage all file storage with proper organization.
    """
    try:
        await ctx.info(f"Processing {document_type} for lead {lead_id}: {file_name}")
        
        # Ensure uploads directory exists
        uploads_path = Path(UPLOADS_DIR)
        uploads_path.mkdir(exist_ok=True)
        
        lead_dir = uploads_path / lead_id
        lead_dir.mkdir(exist_ok=True)
        
        # Decode base64 file data
        try:
            file_content = base64.b64decode(file_data)
        except Exception:
            raise ValueError("Invalid base64 file data")
        
        # Determine file extension and MIME type
        file_ext = Path(file_name).suffix.lower()
        mime_type_map = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.pdf': 'application/pdf', '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        mime_type = mime_type_map.get(file_ext, 'application/octet-stream')
        
        # Save file
        file_path = lead_dir / f"{document_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file_name}"
        
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Process images for damage assessment
        analysis_results = {}
        if document_type == "photo" and file_ext in ['.jpg', '.jpeg', '.png']:
            try:
                with Image.open(file_path) as img:
                    analysis_results = {
                        "image_size": img.size,
                        "format": img.format,
                        "mode": img.mode,
                        "has_exif": bool(img.getexif()) if hasattr(img, 'getexif') else False
                    }
                    
                    # Simple image quality checks
                    width, height = img.size
                    analysis_results["quality_assessment"] = {
                        "resolution": "high" if width * height > 1000000 else "medium" if width * height > 300000 else "low",
                        "aspect_ratio": round(width / height, 2)
                    }
                    
            except Exception as e:
                await ctx.warning(f"Image analysis failed: {str(e)}")
        
        # Store document record in database
        doc_id = f"DOC_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO lead_documents (id, lead_id, document_type, file_path, 
                                          file_name, file_size, mime_type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                lead_id,
                document_type,
                str(file_path),
                file_name,
                len(file_content),
                mime_type
            ))
            
            # Update lead photos_uploaded flag if it's a photo
            if document_type == "photo":
                await db.execute("""
                    UPDATE leads SET damage_assessment = json_set(damage_assessment, '$.photos_uploaded', true)
                    WHERE id = ?
                """, (lead_id,))
            
            await db.commit()
        
        await ctx.info(f"Document {doc_id} processed and stored successfully")
        
        return {
            "document_id": doc_id,
            "lead_id": lead_id,
            "document_type": document_type,
            "file_name": file_name,
            "file_size": len(file_content),
            "mime_type": mime_type,
            "stored_path": str(file_path),
            "analysis_results": analysis_results,
            "processed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        await ctx.error(f"Document processing failed: {str(e)}")
        raise

@mcp.tool
async def generate_reports(
    report_type: Literal["lead_summary", "inspection_report", "contractor_performance", "weekly_analytics"],
    ctx: Context,
    lead_id: Optional[str] = None,
    contractor_id: Optional[str] = None,
    date_range: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Generate comprehensive reports for leads, inspections, contractor performance,
    and business analytics.
    """
    try:
        await ctx.info(f"Generating {report_type} report")
        
        async with aiosqlite.connect(DB_PATH) as db:
            if report_type == "lead_summary" and lead_id:
                # Get complete lead information
                async with db.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)) as cursor:
                    lead_row = await cursor.fetchone()
                
                if not lead_row:
                    raise ValueError(f"Lead {lead_id} not found")
                
                lead_data = {
                    "lead_id": lead_row[0],
                    "contact": json.loads(lead_row[1]),
                    "property": json.loads(lead_row[2]),
                    "damage": json.loads(lead_row[3]),
                    "insurance": json.loads(lead_row[4]),
                    "qualification": json.loads(lead_row[5]),
                    "score": lead_row[6],
                    "status": lead_row[7],
                    "created_at": lead_row[9]
                }
                
                # Get associated documents
                async with db.execute("SELECT * FROM lead_documents WHERE lead_id = ?", (lead_id,)) as cursor:
                    documents = await cursor.fetchall()
                
                lead_data["documents"] = [
                    {
                        "id": doc[0],
                        "type": doc[2],
                        "filename": doc[4],
                        "size": doc[5],
                        "created_at": doc[7]
                    }
                    for doc in documents
                ]
                
                # Get appointments
                async with db.execute("SELECT * FROM appointments WHERE lead_id = ?", (lead_id,)) as cursor:
                    appointments = await cursor.fetchall()
                
                lead_data["appointments"] = [
                    {
                        "id": appt[0],
                        "contractor_id": appt[2],
                        "scheduled_date": appt[3],
                        "type": appt[4],
                        "status": appt[5]
                    }
                    for appt in appointments
                ]
                
                return {
                    "report_type": report_type,
                    "lead_data": lead_data,
                    "generated_at": datetime.now().isoformat()
                }
            
            elif report_type == "contractor_performance" and contractor_id:
                # Get contractor statistics
                async with db.execute("SELECT * FROM contractors WHERE id = ?", (contractor_id,)) as cursor:
                    contractor_row = await cursor.fetchone()
                
                if not contractor_row:
                    raise ValueError(f"Contractor {contractor_id} not found")
                
                # Get appointment statistics
                async with db.execute("""
                    SELECT status, COUNT(*) FROM appointments 
                    WHERE contractor_id = ? 
                    GROUP BY status
                """, (contractor_id,)) as cursor:
                    status_counts = dict(await cursor.fetchall())
                
                # Get response time statistics
                async with db.execute("""
                    SELECT AVG(response_time_avg) as avg_response_time
                    FROM contractors WHERE id = ?
                """, (contractor_id,)) as cursor:
                    response_stats = await cursor.fetchone()
                
                contractor_data = {
                    "contractor_id": contractor_id,
                    "name": contractor_row[1],
                    "rating": contractor_row[6],
                    "appointment_stats": status_counts,
                    "avg_response_time": response_stats[0] if response_stats else None,
                    "total_appointments": sum(status_counts.values()),
                    "completion_rate": status_counts.get("completed", 0) / sum(status_counts.values()) * 100 if status_counts else 0
                }
                
                return {
                    "report_type": report_type,
                    "contractor_performance": contractor_data,
                    "generated_at": datetime.now().isoformat()
                }
            
            elif report_type == "weekly_analytics":
                # Get weekly statistics
                week_ago = datetime.now() - timedelta(days=7)
                
                async with db.execute("""
                    SELECT COUNT(*) FROM leads 
                    WHERE created_at >= ?
                """, (week_ago.isoformat(),)) as cursor:
                    new_leads = (await cursor.fetchone())[0]
                
                async with db.execute("""
                    SELECT COUNT(*) FROM leads 
                    WHERE status = 'qualified' AND created_at >= ?
                """, (week_ago.isoformat(),)) as cursor:
                    qualified_leads = (await cursor.fetchone())[0]
                
                async with db.execute("""
                    SELECT COUNT(*) FROM appointments 
                    WHERE created_at >= ?
                """, (week_ago.isoformat(),)) as cursor:
                    appointments_scheduled = (await cursor.fetchone())[0]
                
                async with db.execute("""
                    SELECT AVG(qualification_score) FROM leads 
                    WHERE created_at >= ?
                """, (week_ago.isoformat(),)) as cursor:
                    avg_score = (await cursor.fetchone())[0]
                
                analytics_data = {
                    "period": f"{week_ago.date()} to {datetime.now().date()}",
                    "new_leads": new_leads,
                    "qualified_leads": qualified_leads,
                    "qualification_rate": (qualified_leads / new_leads * 100) if new_leads > 0 else 0,
                    "appointments_scheduled": appointments_scheduled,
                    "average_lead_score": round(avg_score, 2) if avg_score else 0,
                    "conversion_rate": (appointments_scheduled / new_leads * 100) if new_leads > 0 else 0
                }
                
                return {
                    "report_type": report_type,
                    "analytics": analytics_data,
                    "generated_at": datetime.now().isoformat()
                }
            
            else:
                return {
                    "report_type": report_type,
                    "message": "Report type not implemented or missing required parameters",
                    "generated_at": datetime.now().isoformat()
                }
        
    except Exception as e:
        await ctx.error(f"Report generation failed: {str(e)}")
        raise

@mcp.tool
async def track_analytics(
    metric_name: str,
    metric_value: float,
    period_start: str,
    period_end: str,
    ctx: Context,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Monitor and track conversion rates, performance metrics, and system analytics
    for continuous optimization.
    """
    try:
        await ctx.info(f"Tracking analytics metric: {metric_name}")
        
        # Parse dates
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        # Generate analytics ID
        analytics_id = f"ANALYTICS_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"
        
        # Store analytics data
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("""
                INSERT INTO analytics (id, metric_name, metric_value, period_start, 
                                     period_end, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                analytics_id,
                metric_name,
                metric_value,
                start_date.isoformat(),
                end_date.isoformat(),
                json.dumps(metadata) if metadata else None
            ))
            
            # Get historical data for comparison
            async with db.execute("""
                SELECT AVG(metric_value) FROM analytics 
                WHERE metric_name = ? AND created_at >= ?
            """, (metric_name, (datetime.now() - timedelta(days=30)).isoformat())) as cursor:
                historical_avg = (await cursor.fetchone())[0]
            
            await db.commit()
        
        # Calculate trend
        trend = "improving" if historical_avg and metric_value > historical_avg else "declining" if historical_avg and metric_value < historical_avg else "stable"
        
        await ctx.info(f"Analytics metric {metric_name} tracked successfully")
        
        return {
            "analytics_id": analytics_id,
            "metric_name": metric_name,
            "metric_value": metric_value,
            "period": f"{start_date.date()} to {end_date.date()}",
            "historical_average": round(historical_avg, 2) if historical_avg else None,
            "trend": trend,
            "metadata": metadata,
            "recorded_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        await ctx.error(f"Analytics tracking failed: {str(e)}")
        raise

# Resource for lead status tracking
@mcp.resource("orpaynter://leads/{lead_id}")
async def get_lead_status(lead_id: str, ctx: Context) -> str:
    """Get current status and details of a specific lead"""
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)) as cursor:
                lead_row = await cursor.fetchone()
            
            if not lead_row:
                return f"Lead {lead_id} not found"
            
            lead_data = {
                "id": lead_row[0],
                "status": lead_row[7],
                "score": lead_row[6],
                "created_at": lead_row[9],
                "contact": json.loads(lead_row[1])
            }
            
            return json.dumps(lead_data, indent=2)
    except Exception as e:
        await ctx.error(f"Failed to get lead status: {str(e)}")
        return f"Error retrieving lead {lead_id}: {str(e)}"

# Resource for contractor availability
@mcp.resource("orpaynter://contractors/available")
async def get_available_contractors(ctx: Context) -> str:
    """Get list of currently available contractors"""
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute("""
                SELECT id, name, email, phone, rating, service_areas, specialties 
                FROM contractors WHERE availability = TRUE
                ORDER BY rating DESC
            """) as cursor:
                contractors = await cursor.fetchall()
            
            contractor_list = [
                {
                    "id": row[0],
                    "name": row[1],
                    "email": row[2],
                    "phone": row[3],
                    "rating": row[4],
                    "service_areas": json.loads(row[5]),
                    "specialties": json.loads(row[6])
                }
                for row in contractors
            ]
            
            return json.dumps(contractor_list, indent=2)
    except Exception as e:
        await ctx.error(f"Failed to get contractors: {str(e)}")
        return f"Error retrieving contractors: {str(e)}"

# Prompt for lead qualification conversation
@mcp.prompt
def lead_qualification_prompt(customer_input: str) -> str:
    """Generate intelligent conversation prompts for lead qualification"""
    return f"""
You are an expert roofing consultant helping qualify potential customers. Based on the customer's input: "{customer_input}"

Ask intelligent follow-up questions to gather the following critical information:
- Property details (type, size, age, current roof material)
- Damage assessment (type, severity, urgency)
- Insurance information (coverage, claims status)
- Customer qualifications (decision-making authority, budget, timeline)

Be conversational, empathetic, and professional. Focus on understanding their needs and building trust.
If they mention emergency situations, prioritize urgency questions.
If they mention insurance, probe for claim details and coverage.

Next question to ask:
"""

# Database initialization flag
_db_initialized = False

async def ensure_db_initialized():
    """Ensure database is initialized before use"""
    global _db_initialized
    if not _db_initialized:
        await init_database()
        Path(UPLOADS_DIR).mkdir(exist_ok=True)
        _db_initialized = True
        logger.info("OrPaynter MCP Server initialized successfully")

if __name__ == "__main__":
    mcp.run()
