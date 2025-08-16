import os
import json
import logging
import base64
from typing import Dict, List, Optional, Union, Any, Tuple
import requests
from ..common.llm_provider import LLMProviderFactory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DamageAssessor:
    """
    DSPy-based agent for assessing roof damage from images.
    Uses computer vision and LLM capabilities to identify and classify damage.
    """
    
    def __init__(
        self,
        llm_provider_type: str = "openai",
        llm_model: str = "gpt-4-turbo",
        vision_api_key: Optional[str] = None,
        confidence_threshold: float = 0.7
    ):
        """
        Initialize the damage assessor.
        
        Args:
            llm_provider_type: Type of LLM provider to use ('openai', 'anthropic', 'mistral', 'ollama').
            llm_model: Model name to use for the LLM.
            vision_api_key: API key for vision services. If None, will try to get from environment.
            confidence_threshold: Minimum confidence score for damage detection.
        """
        self.llm_provider = LLMProviderFactory.create_provider(
            llm_provider_type,
            model=llm_model
        )
        self.vision_api_key = vision_api_key or os.environ.get("VISION_API_KEY")
        self.confidence_threshold = confidence_threshold
        
        # Define damage types and their characteristics
        self.damage_types = {
            "missing_shingle": {
                "description": "Areas where shingles are missing, exposing the roof deck or underlayment",
                "severity_indicators": {
                    "low": "Small area with 1-2 missing shingles, no visible water damage",
                    "medium": "Multiple missing shingles in a concentrated area",
                    "high": "Large sections of missing shingles with possible water intrusion"
                }
            },
            "crack": {
                "description": "Visible cracks in shingles or roof materials",
                "severity_indicators": {
                    "low": "Hairline cracks with no separation",
                    "medium": "Visible cracks with slight separation",
                    "high": "Deep cracks with significant separation and possible water intrusion"
                }
            },
            "water_damage": {
                "description": "Signs of water intrusion or moisture damage",
                "severity_indicators": {
                    "low": "Minor discoloration without structural damage",
                    "medium": "Visible water stains and some material deterioration",
                    "high": "Extensive water stains, mold, or rot in roof materials"
                }
            },
            "hail_damage": {
                "description": "Impact marks or dents from hail",
                "severity_indicators": {
                    "low": "Small, superficial dents without material loss",
                    "medium": "Multiple dents with some granule loss",
                    "high": "Significant dents with exposed fiberglass mat or cracks"
                }
            },
            "debris": {
                "description": "Accumulated debris on roof that could cause damage",
                "severity_indicators": {
                    "low": "Light debris (leaves, small branches) without visible damage",
                    "medium": "Moderate debris accumulation with potential for water pooling",
                    "high": "Heavy debris causing visible damage or blocking drainage"
                }
            }
        }
    
    async def _encode_image(self, image_path: str) -> str:
        """
        Encode an image to base64.
        
        Args:
            image_path: Path to the image file.
            
        Returns:
            Base64 encoded image.
        """
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    async def _analyze_image_with_vision_api(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze an image using a vision API.
        
        Args:
            image_path: Path to the image file.
            
        Returns:
            Analysis results from the vision API.
        """
        # For this implementation, we'll use OpenAI's vision capabilities
        # In a production environment, you might want to use a dedicated CV service
        
        encoded_image = await self._encode_image(image_path)
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.llm_provider.api_key}"
        }
        
        prompt = """
        You are an expert roof inspector. Analyze this roof image and identify any damage.
        Focus on:
        1. Missing shingles
        2. Cracks
        3. Water damage
        4. Hail damage
        5. Debris
        
        For each damage type found, provide:
        - Precise location (describe using coordinates like top-left, center, etc.)
        - Severity (low, medium, high)
        - Confidence level (0-100%)
        - Brief description
        
        Format your response as JSON with this structure:
        {
            "detections": [
                {
                    "type": "damage_type",
                    "location": "description",
                    "boundingBox": {"x": 0, "y": 0, "width": 0, "height": 0},
                    "severity": "low|medium|high",
                    "confidence": 0,
                    "description": "brief description"
                }
            ],
            "overallAssessment": "brief summary",
            "recommendedActions": ["action1", "action2"]
        }
        
        For boundingBox, estimate the position as percentages of the image dimensions.
        """
        
        data = {
            "model": "gpt-4-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded_image}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 1000
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=data
        )
        
        if response.status_code != 200:
            logger.error(f"Error from Vision API: {response.text}")
            raise Exception(f"Vision API error: {response.status_code}")
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Extract JSON from the response
        try:
            # Find JSON in the response
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            json_str = content[json_start:json_end]
            return json.loads(json_str)
        except Exception as e:
            logger.error(f"Error parsing JSON from vision API response: {e}")
            logger.error(f"Raw response: {content}")
            # Return a structured error response
            return {
                "detections": [],
                "overallAssessment": "Error analyzing image",
                "recommendedActions": ["Request manual inspection"]
            }
    
    async def _refine_detections(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Refine and validate damage detections.
        
        Args:
            detections: List of damage detections from vision API.
            
        Returns:
            Refined list of damage detections.
        """
        refined_detections = []
        
        for detection in detections:
            # Validate damage type
            damage_type = detection.get("type", "").lower()
            if damage_type not in self.damage_types:
                logger.warning(f"Unknown damage type: {damage_type}")
                damage_type = "other"
            
            # Validate severity
            severity = detection.get("severity", "").lower()
            if severity not in ["low", "medium", "high"]:
                logger.warning(f"Unknown severity: {severity}")
                severity = "medium"
            
            # Validate confidence
            confidence = float(detection.get("confidence", 0))
            if confidence < 0 or confidence > 100:
                logger.warning(f"Invalid confidence value: {confidence}")
                confidence = 50.0
            
            # Only include detections above the confidence threshold
            if confidence >= self.confidence_threshold * 100:
                refined_detections.append({
                    "id": f"det-{len(refined_detections) + 1}",
                    "type": damage_type,
                    "boundingBox": detection.get("boundingBox", {
                        "x": 0, "y": 0, "width": 10, "height": 10
                    }),
                    "severity": severity,
                    "confidence": confidence,
                    "description": detection.get("description", "")
                })
        
        return refined_detections
    
    async def _generate_recommendations(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate repair recommendations based on damage detections.
        
        Args:
            detections: List of damage detections.
            
        Returns:
            List of repair recommendations.
        """
        if not detections:
            return []
        
        # Create a prompt for the LLM to generate recommendations
        damage_descriptions = []
        for i, detection in enumerate(detections):
            damage_descriptions.append(
                f"{i+1}. {detection['type'].replace('_', ' ').title()}: "
                f"{detection['severity']} severity, {detection['description']}"
            )
        
        damage_summary = "\n".join(damage_descriptions)
        
        prompt = f"""
        As a roofing expert, provide repair recommendations for the following roof damage:
        
        {damage_summary}
        
        For each type of damage, provide:
        1. Recommended repair approach
        2. Priority level (low, medium, high)
        3. Estimated cost range
        4. Whether it requires professional help
        
        Format your response as JSON with this structure:
        {{
            "recommendations": [
                {{
                    "damageType": "type of damage",
                    "repairApproach": "description of repair",
                    "priority": "low|medium|high",
                    "estimatedCost": {{"min": 0, "max": 0, "currency": "USD"}},
                    "requiresProfessional": true|false
                }}
            ],
            "overallRecommendation": "summary recommendation"
        }}
        """
        
        try:
            response = await self.llm_provider.generate(prompt, temperature=0.3)
            
            # Extract JSON from the response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            json_str = response[json_start:json_end]
            recommendations = json.loads(json_str)
            
            return recommendations.get("recommendations", [])
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    async def assess_damage(self, image_path: str) -> Dict[str, Any]:
        """
        Assess roof damage from an image.
        
        Args:
            image_path: Path to the image file.
            
        Returns:
            Assessment results including damage detections, confidence scores, and recommendations.
        """
        try:
            # Analyze the image with vision API
            analysis_result = await self._analyze_image_with_vision_api(image_path)
            
            # Refine detections
            detections = await self._refine_detections(analysis_result.get("detections", []))
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(detections)
            
            # Calculate overall confidence score
            confidence_scores = [detection["confidence"] for detection in detections]
            overall_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
            
            # Prepare the assessment result
            assessment = {
                "imageUrl": image_path,
                "detections": detections,
                "confidence": overall_confidence,
                "overallAssessment": analysis_result.get("overallAssessment", ""),
                "recommendations": recommendations,
                "metadata": {
                    "assessedBy": "AI Damage Assessor",
                    "assessmentDate": None,  # Will be set by the caller
                    "modelVersion": "1.0.0"
                }
            }
            
            return assessment
        except Exception as e:
            logger.error(f"Error assessing damage: {e}")
            return {
                "imageUrl": image_path,
                "detections": [],
                "confidence": 0,
                "overallAssessment": "Error assessing damage",
                "recommendations": [],
                "metadata": {
                    "assessedBy": "AI Damage Assessor",
                    "assessmentDate": None,
                    "modelVersion": "1.0.0",
                    "error": str(e)
                }
            }
    
    async def assess_multiple_images(self, image_paths: List[str]) -> Dict[str, Any]:
        """
        Assess roof damage from multiple images.
        
        Args:
            image_paths: List of paths to image files.
            
        Returns:
            Aggregated assessment results.
        """
        assessments = []
        
        for image_path in image_paths:
            assessment = await self.assess_damage(image_path)
            assessments.append(assessment)
        
        # Aggregate results
        all_detections = []
        confidence_scores = []
        all_recommendations = []
        
        for assessment in assessments:
            all_detections.extend(assessment["detections"])
            if assessment["confidence"] > 0:
                confidence_scores.append(assessment["confidence"])
            all_recommendations.extend(assessment["recommendations"])
        
        # Calculate overall confidence
        overall_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        # Deduplicate recommendations
        unique_recommendations = []
        recommendation_types = set()
        
        for recommendation in all_recommendations:
            damage_type = recommendation.get("damageType", "")
            if damage_type not in recommendation_types:
                recommendation_types.add(damage_type)
                unique_recommendations.append(recommendation)
        
        # Generate overall assessment
        prompt = f"""
        Summarize the following roof damage assessment:
        - Number of images analyzed: {len(image_paths)}
        - Number of damage detections: {len(all_detections)}
        - Overall confidence score: {overall_confidence:.2f}%
        - Types of damage detected: {', '.join(set(d['type'] for d in all_detections))}
        
        P
(Content truncated due to size limit. Use line ranges to read in chunks)