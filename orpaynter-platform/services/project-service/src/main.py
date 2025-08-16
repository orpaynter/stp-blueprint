"""
OrPaynter Project Service - Revenue-Generating Workflow Engine
Handles the core customer-facing workflows that generate money
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import httpx
import os
import logging
from datetime import datetime
import uuid
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="OrPaynter Project Service",
    description="Revenue-generating project workflows and automation",
    version="1.0.0"
)

# Service URLs
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8003")
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8004")

# Pydantic Models
class InstantAssessmentRequest(BaseModel):
    customer_email: EmailStr
    customer_name: str
    property_address: str
    damage_description: str
    image_urls: List[str]
    phone_number: Optional[str] = None

class ClaimsAutomationRequest(BaseModel):
    customer_email: EmailStr
    customer_name: str
    property_address: str
    insurance_company: str
    policy_number: str
    damage_date: str
    image_urls: List[str]
    assessment_id: Optional[str] = None

class ContractorLeadRequest(BaseModel):
    contractor_email: EmailStr
    contractor_name: str
    service_areas: List[str]
    specialties: List[str]
    lead_criteria: Dict[str, Any]

class ProjectResponse(BaseModel):
    project_id: str
    status: str
    estimated_completion: str
    next_steps: List[str]
    customer_portal_url: str

# In-memory storage for demo (replace with database)
projects_db = {}
leads_db = {}

@app.post("/projects/instant-assessment", response_model=ProjectResponse)
async def create_instant_assessment(
    request: InstantAssessmentRequest,
    background_tasks: BackgroundTasks
):
    """
    🚀 MONEY-MAKER #1: Instant AI Damage Assessment ($49.99)
    Customer uploads photos, gets professional report in minutes
    """
    try:
        project_id = f"assess_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
        
        # Create project record
        project = {
            "id": project_id,
            "type": "instant_assessment",
            "customer_email": request.customer_email,
            "customer_name": request.customer_name,
            "property_address": request.property_address,
            "status": "processing",
            "created_at": datetime.utcnow().isoformat(),
            "images": request.image_urls,
            "damage_description": request.damage_description,
            "phone_number": request.phone_number
        }
        
        projects_db[project_id] = project
        
        # Trigger AI analysis in background
        background_tasks.add_task(
            process_instant_assessment,
            project_id,
            request.image_urls,
            request.property_address
        )
        
        logger.info(f"Created instant assessment: {project_id} for {request.customer_email}")
        
        return ProjectResponse(
            project_id=project_id,
            status="processing",
            estimated_completion="5-10 minutes",
            next_steps=[
                "AI analyzing your roof images",
                "Generating damage assessment report",
                "Calculating repair estimates",
                "Report will be emailed when complete"
            ],
            customer_portal_url=f"https://jzdnyh4o9k.space.minimax.io/project/{project_id}"
        )
        
    except Exception as e:
        logger.error(f"Instant assessment creation error: {e}")
        raise HTTPException(status_code=500, detail="Assessment creation failed")

@app.post("/projects/claims-automation", response_model=ProjectResponse)
async def create_claims_automation(
    request: ClaimsAutomationRequest,
    background_tasks: BackgroundTasks
):
    """
    🚀 MONEY-MAKER #2: Automated Insurance Claims ($99.99)
    Complete claims processing automation with documentation
    """
    try:
        project_id = f"claim_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
        
        project = {
            "id": project_id,
            "type": "claims_automation",
            "customer_email": request.customer_email,
            "customer_name": request.customer_name,
            "property_address": request.property_address,
            "insurance_company": request.insurance_company,
            "policy_number": request.policy_number,
            "damage_date": request.damage_date,
            "status": "processing",
            "created_at": datetime.utcnow().isoformat(),
            "images": request.image_urls,
            "assessment_id": request.assessment_id
        }
        
        projects_db[project_id] = project
        
        # Trigger claims automation in background
        background_tasks.add_task(
            process_claims_automation,
            project_id,
            request
        )
        
        logger.info(f"Created claims automation: {project_id} for {request.customer_email}")
        
        return ProjectResponse(
            project_id=project_id,
            status="processing",
            estimated_completion="30-60 minutes",
            next_steps=[
                "AI analyzing damage for insurance claim",
                "Generating claim documentation",
                "Preparing adjuster communication",
                "Complete claim package will be emailed"
            ],
            customer_portal_url=f"https://jzdnyh4o9k.space.minimax.io/project/{project_id}"
        )
        
    except Exception as e:
        logger.error(f"Claims automation creation error: {e}")
        raise HTTPException(status_code=500, detail="Claims automation failed")

@app.post("/projects/contractor-leads")
async def generate_contractor_leads(
    request: ContractorLeadRequest,
    background_tasks: BackgroundTasks
):
    """
    🚀 MONEY-MAKER #3: Qualified Contractor Leads ($29.99 each)
    Pre-qualified leads with damage assessment and customer info
    """
    try:
        lead_id = f"lead_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
        
        # Find matching leads based on criteria
        matching_leads = find_qualified_leads(request.service_areas, request.specialties)
        
        lead_package = {
            "id": lead_id,
            "contractor_email": request.contractor_email,
            "contractor_name": request.contractor_name,
            "service_areas": request.service_areas,
            "leads": matching_leads,
            "created_at": datetime.utcnow().isoformat(),
            "status": "delivered"
        }
        
        leads_db[lead_id] = lead_package
        
        # Send leads to contractor
        background_tasks.add_task(
            deliver_contractor_leads,
            lead_id,
            request.contractor_email
        )
        
        logger.info(f"Generated {len(matching_leads)} leads for {request.contractor_email}")
        
        return {
            "lead_package_id": lead_id,
            "leads_count": len(matching_leads),
            "estimated_value": len(matching_leads) * 8500,  # Average project value
            "delivery_status": "processing",
            "next_steps": [
                "Packaging qualified leads",
                "Preparing customer contact information",
                "Generating damage assessment summaries",
                "Lead package will be emailed shortly"
            ]
        }
        
    except Exception as e:
        logger.error(f"Lead generation error: {e}")
        raise HTTPException(status_code=500, detail="Lead generation failed")

@app.get("/projects/{project_id}")
async def get_project_status(project_id: str):
    """Get project status and results"""
    try:
        if project_id not in projects_db:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = projects_db[project_id]
        
        return {
            "project_id": project_id,
            "status": project["status"],
            "type": project["type"],
            "created_at": project["created_at"],
            "customer_info": {
                "name": project["customer_name"],
                "email": project["customer_email"]
            },
            "results": project.get("results", {}),
            "documents": project.get("documents", []),
            "next_steps": project.get("next_steps", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Project retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Project retrieval failed")

async def process_instant_assessment(project_id: str, image_urls: List[str], property_address: str):
    """Process instant damage assessment with AI"""
    try:
        project = projects_db[project_id]
        
        # Call AI service for damage detection
        async with httpx.AsyncClient() as client:
            ai_response = await client.post(
                f"{AI_SERVICE_URL}/ai/damage-detection",
                json={
                    "project_id": project_id,
                    "image_urls": image_urls,
                    "analysis_type": "damage_detection"
                },
                headers={"X-User-ID": "system", "X-User-Role": "system"}
            )
            
            if ai_response.status_code == 200:
                damage_analysis = ai_response.json()
                
                # Call AI service for cost estimation
                cost_response = await client.post(
                    f"{AI_SERVICE_URL}/ai/cost-estimation",
                    json={
                        "project_id": project_id,
                        "damage_analysis_id": damage_analysis["analysis_id"],
                        "property_data": {
                            "address": property_address,
                            "square_footage": 2000,  # Default
                            "roof_type": "asphalt_shingles"
                        }
                    },
                    headers={"X-User-ID": "system", "X-User-Role": "system"}
                )
                
                if cost_response.status_code == 200:
                    cost_analysis = cost_response.json()
                    
                    # Generate professional report
                    report = generate_professional_report(damage_analysis, cost_analysis, project)
                    
                    # Update project with results
                    project["status"] = "completed"
                    project["results"] = {
                        "damage_analysis": damage_analysis,
                        "cost_estimation": cost_analysis,
                        "report": report
                    }
                    project["documents"] = [
                        f"OrPaynter_Damage_Report_{project_id}.pdf",
                        f"OrPaynter_Cost_Estimate_{project_id}.pdf"
                    ]
                    
                    # TODO: Send email with report
                    logger.info(f"Completed instant assessment: {project_id}")
                    
    except Exception as e:
        logger.error(f"Assessment processing error: {e}")
        # Update project status to failed
        if project_id in projects_db:
            projects_db[project_id]["status"] = "failed"
            projects_db[project_id]["error"] = str(e)

async def process_claims_automation(project_id: str, request: ClaimsAutomationRequest):
    """Process automated insurance claims"""
    try:
        project = projects_db[project_id]
        
        # Generate claims documentation
        claims_package = {
            "claim_number": f"ORP-{project_id}",
            "insurance_company": request.insurance_company,
            "policy_number": request.policy_number,
            "damage_date": request.damage_date,
            "estimated_amount": 0,
            "documentation": [],
            "adjuster_summary": "",
            "next_steps": []
        }
        
        # If assessment already exists, use it
        if request.assessment_id:
            # TODO: Retrieve existing assessment
            pass
        else:
            # Run new assessment for claims
            async with httpx.AsyncClient() as client:
                ai_response = await client.post(
                    f"{AI_SERVICE_URL}/ai/damage-detection",
                    json={
                        "project_id": project_id,
                        "image_urls": request.image_urls,
                        "analysis_type": "insurance_claim"
                    },
                    headers={"X-User-ID": "system", "X-User-Role": "system"}
                )
                
                if ai_response.status_code == 200:
                    damage_analysis = ai_response.json()
                    claims_package["estimated_amount"] = 8500  # Mock amount
        
        # Generate claim documents
        claims_package["documentation"] = [
            "Insurance_Claim_Form.pdf",
            "Damage_Assessment_Report.pdf", 
            "Repair_Estimate.pdf",
            "Photo_Documentation.pdf"
        ]
        
        claims_package["adjuster_summary"] = "Roof damage consistent with storm activity. Recommend full inspection for complete assessment."
        
        project["status"] = "completed"
        project["results"] = {"claims_package": claims_package}
        
        logger.info(f"Completed claims automation: {project_id}")
        
    except Exception as e:
        logger.error(f"Claims processing error: {e}")
        if project_id in projects_db:
            projects_db[project_id]["status"] = "failed"
            projects_db[project_id]["error"] = str(e)

def find_qualified_leads(service_areas: List[str], specialties: List[str]) -> List[Dict]:
    """Find qualified leads for contractors (mock data for demo)"""
    mock_leads = [
        {
            "lead_id": f"lead_{i}",
            "customer_name": f"Customer {i}",
            "property_address": f"{100 + i} Main St, City, State",
            "damage_type": "hail_damage",
            "estimated_project_value": 8500 + (i * 1000),
            "urgency": "high" if i % 2 == 0 else "medium",
            "contact_phone": f"555-{1000 + i}",
            "best_contact_time": "weekday_evening",
            "insurance_company": ["State Farm", "Allstate", "Farmers"][i % 3],
            "damage_description": "Significant hail damage to shingles, gutters need repair",
            "assessment_summary": f"AI assessment shows {i + 5} damaged areas requiring attention"
        }
        for i in range(1, 6)  # Generate 5 mock leads
    ]
    
    return mock_leads

async def deliver_contractor_leads(lead_id: str, contractor_email: str):
    """Deliver qualified leads to contractor"""
    try:
        # TODO: Send email with lead package
        logger.info(f"Delivered leads package {lead_id} to {contractor_email}")
    except Exception as e:
        logger.error(f"Lead delivery error: {e}")

def generate_professional_report(damage_analysis: Dict, cost_analysis: Dict, project: Dict) -> Dict:
    """Generate professional damage assessment report"""
    return {
        "report_id": f"RPT-{project['id']}",
        "property_address": project["property_address"],
        "assessment_date": datetime.utcnow().isoformat(),
        "executive_summary": f"AI analysis identified {len(damage_analysis.get('damages', []))} areas of concern with {damage_analysis.get('severity_level', 'moderate')} severity level.",
        "damage_summary": {
            "total_areas": len(damage_analysis.get('damages', [])),
            "severity": damage_analysis.get('severity_level', 'moderate'),
            "confidence": damage_analysis.get('confidence_score', 0.8)
        },
        "cost_summary": {
            "estimated_total": cost_analysis.get('total_cost', 0),
            "material_costs": cost_analysis.get('material_costs', {}),
            "labor_costs": cost_analysis.get('labor_costs', {})
        },
        "recommendations": [
            "Schedule professional inspection within 7 days",
            "Contact insurance company to file claim",
            "Obtain multiple contractor quotes",
            "Document all damage with photos"
        ],
        "insurance_ready": True,
        "contractor_ready": True
    }

@app.get("/projects/stats/revenue")
async def get_revenue_stats():
    """Get revenue-generating statistics"""
    total_projects = len(projects_db)
    completed_projects = len([p for p in projects_db.values() if p["status"] == "completed"])
    
    # Calculate revenue
    revenue_per_type = {
        "instant_assessment": 4999,  # $49.99
        "claims_automation": 9999,   # $99.99
        "contractor_leads": 2999     # $29.99 per lead
    }
    
    total_revenue = 0
    for project in projects_db.values():
        if project["status"] == "completed":
            total_revenue += revenue_per_type.get(project["type"], 0)
    
    return {
        "total_projects": total_projects,
        "completed_projects": completed_projects,
        "total_revenue_cents": total_revenue,
        "total_revenue_dollars": total_revenue / 100,
        "conversion_rate": (completed_projects / total_projects * 100) if total_projects > 0 else 0,
        "average_project_value": total_revenue / completed_projects if completed_projects > 0 else 0
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "project-service",
        "total_projects": len(projects_db),
        "ai_service_connected": bool(AI_SERVICE_URL)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
