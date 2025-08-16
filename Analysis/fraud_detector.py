import os
import json
import logging
import datetime
from typing import Dict, List, Optional, Union, Any
import requests
from ..common.llm_provider import LLMProviderFactory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FraudDetector:
    """
    DSPy-based agent for detecting potential fraud in insurance claims.
    Uses pattern analysis and anomaly detection.
    """
    
    def __init__(
        self,
        llm_provider_type: str = "openai",
        llm_model: str = "gpt-4-turbo",
        confidence_threshold: float = 0.7
    ):
        """
        Initialize the fraud detector.
        
        Args:
            llm_provider_type: Type of LLM provider to use ('openai', 'anthropic', 'mistral', 'ollama').
            llm_model: Model name to use for the LLM.
            confidence_threshold: Minimum confidence score for fraud detection.
        """
        self.llm_provider = LLMProviderFactory.create_provider(
            llm_provider_type,
            model=llm_model
        )
        self.confidence_threshold = confidence_threshold
        
        # Define fraud indicators and their weights
        self.fraud_indicators = {
            "claim_timing": {
                "description": "Timing of the claim relative to policy start/renewal",
                "weight": 0.15,
                "patterns": {
                    "recent_policy": "Claim filed shortly after policy start or coverage increase",
                    "policy_expiration": "Claim filed just before policy expiration",
                    "weekend_holiday": "Claim filed during weekend or holiday when verification is difficult"
                }
            },
            "documentation": {
                "description": "Issues with claim documentation",
                "weight": 0.2,
                "patterns": {
                    "incomplete": "Missing or incomplete documentation",
                    "inconsistent": "Inconsistencies between different documents",
                    "altered": "Signs of document alteration or manipulation",
                    "generic": "Generic or vague descriptions lacking specific details"
                }
            },
            "damage_assessment": {
                "description": "Inconsistencies in damage assessment",
                "weight": 0.25,
                "patterns": {
                    "exaggerated": "Damage extent appears exaggerated compared to evidence",
                    "unrelated": "Damage claimed is unrelated to the reported cause",
                    "pre_existing": "Evidence suggests damage existed before the claimed incident",
                    "staged": "Damage patterns suggest intentional or staged damage"
                }
            },
            "claimant_behavior": {
                "description": "Suspicious behavior by the claimant",
                "weight": 0.15,
                "patterns": {
                    "pressure": "Unusual pressure to settle quickly",
                    "evasive": "Evasive or changing answers to questions",
                    "overfamiliar": "Excessive knowledge of insurance procedures",
                    "reluctance": "Reluctance to provide certain information"
                }
            },
            "history": {
                "description": "Claim history and patterns",
                "weight": 0.15,
                "patterns": {
                    "frequent": "History of frequent claims",
                    "similar": "Multiple similar claims in the past",
                    "multiple_carriers": "Claims with multiple insurance carriers",
                    "prior_denials": "History of denied claims"
                }
            },
            "financial": {
                "description": "Financial indicators",
                "weight": 0.1,
                "patterns": {
                    "financial_distress": "Evidence of financial difficulties",
                    "overinsured": "Property appears to be overinsured",
                    "recent_increase": "Recent increase in coverage before claim",
                    "bankruptcy": "Recent or pending bankruptcy"
                }
            }
        }
    
    async def _analyze_claim_timing(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the timing of the claim for suspicious patterns.
        
        Args:
            claim_data: Dictionary with claim data.
            
        Returns:
            Dictionary with analysis results.
        """
        try:
            # Extract relevant dates
            claim_date = datetime.datetime.fromisoformat(claim_data.get("claim_date", datetime.datetime.now().isoformat()))
            policy_start_date = datetime.datetime.fromisoformat(claim_data.get("policy_start_date", "2000-01-01"))
            policy_end_date = datetime.datetime.fromisoformat(claim_data.get("policy_end_date", "2099-12-31"))
            incident_date = datetime.datetime.fromisoformat(claim_data.get("incident_date", claim_date.isoformat()))
            
            # Calculate time differences
            days_since_policy_start = (claim_date - policy_start_date).days
            days_until_policy_end = (policy_end_date - claim_date).days
            days_since_incident = (claim_date - incident_date).days
            
            # Check for suspicious timing patterns
            suspicious_patterns = []
            confidence_scores = []
            
            # Recent policy
            if days_since_policy_start < 30:
                confidence = max(0, min(1, 1 - (days_since_policy_start / 30)))
                if confidence > 0.5:
                    suspicious_patterns.append({
                        "pattern": "recent_policy",
                        "description": f"Claim filed only {days_since_policy_start} days after policy start",
                        "confidence": confidence
                    })
                    confidence_scores.append(confidence)
            
            # Policy expiration
            if days_until_policy_end < 30:
                confidence = max(0, min(1, 1 - (days_until_policy_end / 30)))
                if confidence > 0.5:
                    suspicious_patterns.append({
                        "pattern": "policy_expiration",
                        "description": f"Claim filed only {days_until_policy_end} days before policy expiration",
                        "confidence": confidence
                    })
                    confidence_scores.append(confidence)
            
            # Weekend or holiday
            if claim_date.weekday() >= 5:  # 5=Saturday, 6=Sunday
                confidence = 0.6
                suspicious_patterns.append({
                    "pattern": "weekend_holiday",
                    "description": f"Claim filed on a weekend ({claim_date.strftime('%A')})",
                    "confidence": confidence
                })
                confidence_scores.append(confidence)
            
            # Delayed reporting
            if days_since_incident > 30:
                confidence = min(1, (days_since_incident - 30) / 60)
                if confidence > 0.5:
                    suspicious_patterns.append({
                        "pattern": "delayed_reporting",
                        "description": f"Claim filed {days_since_incident} days after the incident",
                        "confidence": confidence
                    })
                    confidence_scores.append(confidence)
            
            # Calculate overall confidence
            overall_confidence = max(confidence_scores) if confidence_scores else 0
            
            return {
                "category": "claim_timing",
                "suspicious_patterns": suspicious_patterns,
                "confidence": overall_confidence
            }
        except Exception as e:
            logger.error(f"Error analyzing claim timing: {e}")
            return {
                "category": "claim_timing",
                "suspicious_patterns": [],
                "confidence": 0,
                "error": str(e)
            }
    
    async def _analyze_documentation(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze claim documentation for suspicious patterns.
        
        Args:
            claim_data: Dictionary with claim data.
            
        Returns:
            Dictionary with analysis results.
        """
        try:
            # Extract relevant data
            documents = claim_data.get("documents", [])
            description = claim_data.get("description", "")
            
            # Check for suspicious documentation patterns
            suspicious_patterns = []
            confidence_scores = []
            
            # Incomplete documentation
            if len(documents) < 3:  # Assuming at least 3 documents are typically required
                confidence = 0.7
                suspicious_patterns.append({
                    "pattern": "incomplete",
                    "description": f"Only {len(documents)} documents provided",
                    "confidence": confidence
                })
                confidence_scores.append(confidence)
            
            # Generic description
            if len(description) < 100:
                confidence = 0.6
                suspicious_patterns.append({
                    "pattern": "generic",
                    "description": "Unusually brief claim description",
                    "confidence": confidence
                })
                confidence_scores.append(confidence)
            
            # Use LLM to analyze description for vagueness
            if description:
                prompt = f"""
                Analyze the following insurance claim description for signs of vagueness, inconsistency, or lack of specific details that might indicate potential fraud.
                
                Claim description: "{description}"
                
                Rate the description on a scale of 0 to 1, where:
                - 0 means the description is detailed, specific, and consistent
                - 1 means the description is vague, inconsistent, or lacking important details
                
                Provide your rating and brief explanation in JSON format:
                {{
                    "rating": 0.0,
                    "explanation": "explanation here"
                }}
                """
                
                try:
                    response = await self.llm_provider.generate(prompt, temperature=0.3)
                    
                    # Extract JSON from the response
                    json_start = response.find('{')
                    json_end = response.rfind('}') + 1
                    json_str = response[json_start:json_end]
                    result = json.loads(json_str)
                    
                    rating = float(result.get("rating", 0))
                    explanation = result.get("explanation", "")
                    
                    if rating > 0.6:
                        suspicious_patterns.append({
                            "pattern": "generic",
                            "description": f"Vague or inconsistent description: {explanation}",
                            "confidence": rating
                        })
                        confidence_scores.append(rating)
                except Exception as e:
                    logger.error(f"Error analyzing description with LLM: {e}")
            
            # Calculate overall confidence
            overall_confidence = max(confidence_scores) if confidence_scores else 0
            
            return {
                "category": "documentation",
                "suspicious_patterns": suspicious_patterns,
                "confidence": overall_confidence
            }
        except Exception as e:
            logger.error(f"Error analyzing documentation: {e}")
            return {
                "category": "documentation",
                "suspicious_patterns": [],
                "confidence": 0,
                "error": str(e)
            }
    
    async def _analyze_damage_assessment(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze damage assessment for suspicious patterns.
        
        Args:
            claim_data: Dictionary with claim data.
            
        Returns:
            Dictionary with analysis results.
        """
        try:
            # Extract relevant data
            damage_assessment = claim_data.get("damage_assessment", {})
            claimed_cause = claim_data.get("cause_of_damage", "")
            claimed_value = float(claim_data.get("claimed_amount", 0))
            property_value = float(claim_data.get("property_value", 0))
            
            # Check for suspicious damage patterns
            suspicious_patterns = []
            confidence_scores = []
            
            # Exaggerated damage value
            if property_value > 0 and claimed_value > property_value * 0.7:
                confidence = min(1, (claimed_value / property_value - 0.7) / 0.3)
                suspicious_patterns.append({
                    "pattern": "exaggerated",
                    "description": f"Claimed amount ({claimed_value}) is {claimed_value/property_value:.1%} of property value",
                    "confidence": confidence
                })
                confidence_scores.append(confidence)
            
            # Analyze damage assessment if available
            if damage_assessment:
                # Check confidence score from damage assessment
                ai_confidence = damage_assessment.get("confidence", 0)
                if ai_confidence < 0.6:
                    confidence = 0.7
                    suspicious_patterns.append({
                        "pattern": "unrelated",
                        "description": f"AI damage assessment has low confidence ({ai_confidence:.1%})",
                        "confidence": confidence
                    })
                    confidence_scores.append(confidence)
                
                # Check if damage type matches claimed cause
                detections = damage_assessment.get("detections", [])
                damage_types = [d.get("type") for d in detections]
                
                # Use LLM to check if damage types are consistent with claimed cause
                if damage_types and claimed_cause:
                    prompt = f"""
                    Analyze whether the following detected damage types are consistent with the claimed cause of damage.
                    
                    Claimed cause: "{claimed_cause}"
                    Detected damage types: {damage_types}
                    
                    Rate the consistency on a scale of 0 to 1, where:
                    - 0 means the damage types are completely consistent with the claimed cause
                    - 1 means the damage types are inconsistent with the claimed cause
                    
                    Provide your rating and brief explanation in JSON format:
                    {{
                        "rating": 0.0,
                        "explanation": "explanation here"
                    }}
                    """
                    
                    try:
                        response = await self.llm_provider.generate(prompt, temperature=0.3)
                        
                        # Extract JSON from the response
                        json_start = response.find('{')
                        json_end = response.rfind('}') + 1
                        json_str = response[json_start:json_end]
                        result = json.loads(json_str)
                        
      
(Content truncated due to size limit. Use line ranges to read in chunks)