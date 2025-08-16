"""
OrPaynter AI Platform AI Service
Handles damage detection, cost estimation, and other AI/ML tasks
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, BackgroundTasks
from fastapi.responses import JSONResponse
import cv2
import numpy as np
from PIL import Image
import tensorflow as tf
import torch
import io
import base64
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import aiofiles
import httpx
from qdrant_client import QdrantClient
from qdrant_client.http import models
import pymongo

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="OrPaynter AI Service",
    description="AI-powered damage detection and cost estimation service",
    version="1.0.0"
)

# Configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

# Initialize clients
try:
    qdrant_client = QdrantClient(url=QDRANT_URL)
    mongo_client = pymongo.MongoClient(MONGO_URL)
    mongo_db = mongo_client.orpaynter
    logger.info("Connected to Qdrant and MongoDB")
except Exception as e:
    logger.error(f"Failed to connect to databases: {e}")
    qdrant_client = None
    mongo_client = None
    mongo_db = None

# Pydantic Models
class DamageDetectionRequest(BaseModel):
    project_id: str
    image_urls: List[str]
    analysis_type: str = "damage_detection"

class DamageDetectionResult(BaseModel):
    analysis_id: str
    project_id: str
    damages: List[Dict[str, Any]]
    confidence_score: float
    total_damage_area: float
    severity_level: str
    processing_time: float
    created_at: datetime

class CostEstimationRequest(BaseModel):
    project_id: str
    damage_analysis_id: Optional[str] = None
    property_data: Dict[str, Any]
    material_preferences: Optional[Dict[str, Any]] = None

class CostEstimationResult(BaseModel):
    estimation_id: str
    project_id: str
    total_cost: float
    cost_breakdown: Dict[str, float]
    material_costs: Dict[str, float]
    labor_costs: Dict[str, float]
    confidence_score: float
    processing_time: float
    created_at: datetime

# Mock AI Models (Replace with actual trained models)
class DamageDetectionModel:
    def __init__(self):
        # In production, load your trained damage detection model
        self.model = None
        self.damage_classes = [
            "missing_shingles", "broken_tiles", "hail_damage", 
            "wind_damage", "water_damage", "structural_damage",
            "gutters_damage", "flashing_damage"
        ]
    
    def detect_damage(self, image: np.ndarray) -> Dict[str, Any]:
        """Detect damage in roof image"""
        try:
            # Mock implementation - replace with actual model inference
            height, width = image.shape[:2]
            
            # Simulate damage detection results
            damages = []
            total_damage_area = 0.0
            
            # Mock damage detection logic
            if np.mean(image) < 100:  # Dark areas might indicate damage
                damages.append({
                    "type": "missing_shingles",
                    "confidence": 0.85,
                    "bbox": [100, 100, 200, 200],
                    "area": 10000,
                    "severity": "moderate"
                })
                total_damage_area += 10000
            
            if cv2.Laplacian(image, cv2.CV_64F).var() > 500:  # High variance might indicate damage
                damages.append({
                    "type": "hail_damage",
                    "confidence": 0.75,
                    "bbox": [300, 150, 400, 250],
                    "area": 8000,
                    "severity": "minor"
                })
                total_damage_area += 8000
            
            # Determine overall severity
            if total_damage_area > 20000:
                severity_level = "severe"
            elif total_damage_area > 10000:
                severity_level = "moderate"
            elif total_damage_area > 5000:
                severity_level = "minor"
            else:
                severity_level = "minimal"
            
            confidence_score = sum(d["confidence"] for d in damages) / len(damages) if damages else 0.5
            
            return {
                "damages": damages,
                "total_damage_area": total_damage_area,
                "severity_level": severity_level,
                "confidence_score": confidence_score
            }
        except Exception as e:
            logger.error(f"Damage detection error: {e}")
            return {
                "damages": [],
                "total_damage_area": 0.0,
                "severity_level": "minimal",
                "confidence_score": 0.0
            }

class CostEstimationModel:
    def __init__(self):
        # Cost estimation model and regional pricing data
        self.base_costs = {
            "asphalt_shingles": {"material": 120, "labor": 180},
            "metal_roofing": {"material": 350, "labor": 250},
            "tile_roofing": {"material": 300, "labor": 350},
            "slate_roofing": {"material": 800, "labor": 600}
        }
        
        self.damage_multipliers = {
            "missing_shingles": 1.2,
            "broken_tiles": 1.5,
            "hail_damage": 1.3,
            "wind_damage": 1.4,
            "water_damage": 2.0,
            "structural_damage": 3.0,
            "gutters_damage": 0.8,
            "flashing_damage": 1.1
        }
    
    def estimate_cost(self, property_data: Dict, damages: List[Dict] = None) -> Dict[str, Any]:
        """Estimate repair/replacement costs"""
        try:
            # Base calculations
            square_footage = property_data.get("square_footage", 2000)
            roof_type = property_data.get("roof_type", "asphalt_shingles")
            location_multiplier = property_data.get("location_multiplier", 1.0)
            
            base_cost = self.base_costs.get(roof_type, self.base_costs["asphalt_shingles"])
            
            # Calculate base material and labor costs
            material_cost = base_cost["material"] * square_footage * location_multiplier
            labor_cost = base_cost["labor"] * square_footage * location_multiplier
            
            # Apply damage multipliers
            if damages:
                damage_multiplier = 1.0
                for damage in damages:
                    damage_type = damage.get("type", "missing_shingles")
                    multiplier = self.damage_multipliers.get(damage_type, 1.0)
                    damage_multiplier *= multiplier
                
                material_cost *= damage_multiplier
                labor_cost *= damage_multiplier
            
            # Additional costs
            permit_cost = 500
            cleanup_cost = 1000
            inspection_cost = 300
            
            total_cost = material_cost + labor_cost + permit_cost + cleanup_cost + inspection_cost
            
            cost_breakdown = {
                "materials": material_cost,
                "labor": labor_cost,
                "permits": permit_cost,
                "cleanup": cleanup_cost,
                "inspection": inspection_cost
            }
            
            material_costs = {"roofing_materials": material_cost}
            labor_costs = {"installation": labor_cost}
            
            # Confidence based on data completeness
            confidence_score = 0.8 if all(k in property_data for k in ["square_footage", "roof_type"]) else 0.6
            
            return {
                "total_cost": total_cost,
                "cost_breakdown": cost_breakdown,
                "material_costs": material_costs,
                "labor_costs": labor_costs,
                "confidence_score": confidence_score
            }
        except Exception as e:
            logger.error(f"Cost estimation error: {e}")
            return {
                "total_cost": 0.0,
                "cost_breakdown": {},
                "material_costs": {},
                "labor_costs": {},
                "confidence_score": 0.0
            }

# Initialize models
damage_model = DamageDetectionModel()
cost_model = CostEstimationModel()

# Utility functions
async def download_image(url: str) -> np.ndarray:
    """Download image from URL and convert to numpy array"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            
        image_bytes = response.content
        image = Image.open(io.BytesIO(image_bytes))
        image_array = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_array.shape) == 3:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        
        return image_array
    except Exception as e:
        logger.error(f"Error downloading image from {url}: {e}")
        raise HTTPException(status_code=400, detail="Failed to download image")

def preprocess_image(image: np.ndarray) -> np.ndarray:
    """Preprocess image for AI analysis"""
    # Resize image if too large
    height, width = image.shape[:2]
    if width > 1024 or height > 1024:
        scale = min(1024/width, 1024/height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        image = cv2.resize(image, (new_width, new_height))
    
    return image

def save_analysis_result(analysis_id: str, result: Dict[str, Any]):
    """Save analysis result to MongoDB"""
    try:
        if mongo_db:
            mongo_db.ai_analyses.insert_one({
                "_id": analysis_id,
                **result,
                "created_at": datetime.utcnow()
            })
    except Exception as e:
        logger.error(f"Error saving analysis result: {e}")

# API Endpoints
@app.post("/ai/damage-detection", response_model=DamageDetectionResult)
async def detect_damage(
    request: DamageDetectionRequest,
    background_tasks: BackgroundTasks,
    user_request: Request
):
    """Detect damage in roof images"""
    start_time = datetime.utcnow()
    
    try:
        user_id = user_request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="User authentication required")
        
        analysis_id = f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{user_id[:8]}"
        
        all_damages = []
        total_damage_area = 0.0
        confidence_scores = []
        
        # Process each image
        for image_url in request.image_urls:
            image = await download_image(image_url)
            preprocessed_image = preprocess_image(image)
            
            # Run damage detection
            detection_result = damage_model.detect_damage(preprocessed_image)
            
            all_damages.extend(detection_result["damages"])
            total_damage_area += detection_result["total_damage_area"]
            confidence_scores.append(detection_result["confidence_score"])
        
        # Calculate overall metrics
        overall_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
        
        # Determine overall severity
        if total_damage_area > 30000:
            severity_level = "severe"
        elif total_damage_area > 15000:
            severity_level = "moderate"
        elif total_damage_area > 5000:
            severity_level = "minor"
        else:
            severity_level = "minimal"
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        result = DamageDetectionResult(
            analysis_id=analysis_id,
            project_id=request.project_id,
            damages=all_damages,
            confidence_score=overall_confidence,
            total_damage_area=total_damage_area,
            severity_level=severity_level,
            processing_time=processing_time,
            created_at=start_time
        )
        
        # Save result in background
        background_tasks.add_task(save_analysis_result, analysis_id, result.dict())
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Damage detection error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/ai/cost-estimation", response_model=CostEstimationResult)
async def estimate_cost(
    request: CostEstimationRequest,
    background_tasks: BackgroundTasks,
    user_request: Request
):
    """Estimate repair/replacement costs"""
    start_time = datetime.utcnow()
    
    try:
        user_id = user_request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="User authentication required")
        
        estimation_id = f"estimate_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{user_id[:8]}"
        
        # Get damage data if analysis ID provided
        damages = []
        if request.damage_analysis_id and mongo_db:
            try:
                analysis = mongo_db.ai_analyses.find_one({"_id": request.damage_analysis_id})
                if analysis:
                    damages = analysis.get("damages", [])
            except Exception as e:
                logger.warning(f"Could not retrieve damage analysis: {e}")
        
        # Run cost estimation
        estimation_result = cost_model.estimate_cost(request.property_data, damages)
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        result = CostEstimationResult(
            estimation_id=estimation_id,
            project_id=request.project_id,
            total_cost=estimation_result["total_cost"],
            cost_breakdown=estimation_result["cost_breakdown"],
            material_costs=estimation_result["material_costs"],
            labor_costs=estimation_result["labor_costs"],
            confidence_score=estimation_result["confidence_score"],
            processing_time=processing_time,
            created_at=start_time
        )
        
        # Save result in background
        background_tasks.add_task(save_analysis_result, estimation_id, result.dict())
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cost estimation error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/ai/analysis/{analysis_id}")
async def get_analysis(analysis_id: str, user_request: Request):
    """Get stored analysis result"""
    try:
        user_id = user_request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="User authentication required")
        
        if not mongo_db:
            raise HTTPException(status_code=503, detail="Database not available")
        
        analysis = mongo_db.ai_analyses.find_one({"_id": analysis_id})
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Remove MongoDB _id field
        analysis.pop("_id", None)
        
        return analysis
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get analysis error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/ai/models/status")
async def get_model_status():
    """Get AI model status"""
    return {
        "damage_detection_model": {
            "status": "available",
            "version": "1.0.0",
            "supported_classes": damage_model.damage_classes
        },
        "cost_estimation_model": {
            "status": "available",
            "version": "1.0.0",
            "supported_materials": list(cost_model.base_costs.keys())
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "qdrant_connected": qdrant_client is not None,
        "mongodb_connected": mongo_db is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
