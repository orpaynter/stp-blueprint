import os
import json
import logging
from typing import Dict, List, Optional, Union, Any
import requests
from ..common.llm_provider import LLMProviderFactory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CostEstimator:
    """
    DSPy-based agent for estimating roof repair and replacement costs.
    Uses regional material/labor rates with adjustment logic.
    """
    
    def __init__(
        self,
        llm_provider_type: str = "openai",
        llm_model: str = "gpt-4-turbo",
        rates_api_key: Optional[str] = None,
        default_region: str = "US-National"
    ):
        """
        Initialize the cost estimator.
        
        Args:
            llm_provider_type: Type of LLM provider to use ('openai', 'anthropic', 'mistral', 'ollama').
            llm_model: Model name to use for the LLM.
            rates_api_key: API key for rates services. If None, will try to get from environment.
            default_region: Default region to use for cost estimation.
        """
        self.llm_provider = LLMProviderFactory.create_provider(
            llm_provider_type,
            model=llm_model
        )
        self.rates_api_key = rates_api_key or os.environ.get("RATES_API_KEY")
        self.default_region = default_region
        
        # Load regional rates data
        self.regional_rates = self._load_regional_rates()
        
        # Define material types and their characteristics
        self.material_types = {
            "asphalt_shingle": {
                "description": "Standard asphalt shingles",
                "lifespan_years": "15-30",
                "cost_per_square": {
                    "economy": {"min": 70, "max": 150},
                    "standard": {"min": 150, "max": 350},
                    "premium": {"min": 350, "max": 800}
                },
                "installation_difficulty": "low"
            },
            "metal": {
                "description": "Metal roofing panels or shingles",
                "lifespan_years": "40-70",
                "cost_per_square": {
                    "economy": {"min": 300, "max": 700},
                    "standard": {"min": 700, "max": 1000},
                    "premium": {"min": 1000, "max": 1800}
                },
                "installation_difficulty": "medium"
            },
            "tile": {
                "description": "Clay or concrete tiles",
                "lifespan_years": "50-100",
                "cost_per_square": {
                    "economy": {"min": 500, "max": 1000},
                    "standard": {"min": 1000, "max": 1500},
                    "premium": {"min": 1500, "max": 3000}
                },
                "installation_difficulty": "high"
            },
            "slate": {
                "description": "Natural slate tiles",
                "lifespan_years": "75-200",
                "cost_per_square": {
                    "economy": {"min": 800, "max": 1500},
                    "standard": {"min": 1500, "max": 3000},
                    "premium": {"min": 3000, "max": 5000}
                },
                "installation_difficulty": "very_high"
            },
            "wood_shake": {
                "description": "Wood shakes or shingles",
                "lifespan_years": "20-40",
                "cost_per_square": {
                    "economy": {"min": 350, "max": 500},
                    "standard": {"min": 500, "max": 700},
                    "premium": {"min": 700, "max": 1200}
                },
                "installation_difficulty": "medium"
            },
            "flat_roof": {
                "description": "Flat or low-slope roofing (EPDM, TPO, etc.)",
                "lifespan_years": "10-30",
                "cost_per_square": {
                    "economy": {"min": 250, "max": 400},
                    "standard": {"min": 400, "max": 700},
                    "premium": {"min": 700, "max": 1200}
                },
                "installation_difficulty": "medium"
            }
        }
        
        # Define labor rates by difficulty
        self.labor_rates = {
            "low": {"min": 150, "max": 300},
            "medium": {"min": 250, "max": 500},
            "high": {"min": 400, "max": 800},
            "very_high": {"min": 600, "max": 1200}
        }
        
        # Define additional cost factors
        self.additional_factors = {
            "roof_pitch": {
                "flat": 1.0,
                "low": 1.1,
                "medium": 1.25,
                "steep": 1.5,
                "very_steep": 1.8
            },
            "accessibility": {
                "easy": 1.0,
                "moderate": 1.15,
                "difficult": 1.3,
                "very_difficult": 1.5
            },
            "complexity": {
                "simple": 1.0,
                "moderate": 1.2,
                "complex": 1.4,
                "very_complex": 1.6
            },
            "removal": {
                "single_layer": 1.0,
                "multiple_layers": 1.3,
                "difficult_material": 1.5
            }
        }
    
    def _load_regional_rates(self) -> Dict[str, Dict[str, float]]:
        """
        Load regional rates data.
        
        Returns:
            Dictionary of regional rate adjustments.
        """
        # In a production environment, this would load from a database or API
        # For this implementation, we'll use a hardcoded dictionary
        
        return {
            "US-National": {
                "labor_multiplier": 1.0,
                "material_multiplier": 1.0
            },
            "US-Northeast": {
                "labor_multiplier": 1.3,
                "material_multiplier": 1.15
            },
            "US-Southeast": {
                "labor_multiplier": 0.9,
                "material_multiplier": 1.05
            },
            "US-Midwest": {
                "labor_multiplier": 0.95,
                "material_multiplier": 0.95
            },
            "US-Southwest": {
                "labor_multiplier": 1.0,
                "material_multiplier": 1.1
            },
            "US-West": {
                "labor_multiplier": 1.25,
                "material_multiplier": 1.2
            },
            "US-Northwest": {
                "labor_multiplier": 1.15,
                "material_multiplier": 1.1
            },
            "US-Alaska": {
                "labor_multiplier": 1.5,
                "material_multiplier": 1.4
            },
            "US-Hawaii": {
                "labor_multiplier": 1.4,
                "material_multiplier": 1.5
            },
            "CA-National": {
                "labor_multiplier": 1.1,
                "material_multiplier": 1.15
            },
            "UK-National": {
                "labor_multiplier": 1.2,
                "material_multiplier": 1.25
            },
            "AU-National": {
                "labor_multiplier": 1.3,
                "material_multiplier": 1.35
            }
        }
    
    async def _get_regional_rates(self, region: str) -> Dict[str, float]:
        """
        Get regional rate adjustments for a specific region.
        
        Args:
            region: Region code (e.g., 'US-Northeast').
            
        Returns:
            Dictionary of regional rate adjustments.
        """
        # Check if region exists in our data
        if region in self.regional_rates:
            return self.regional_rates[region]
        
        # If not, try to get it from an API (simulated here)
        if self.rates_api_key:
            try:
                # This would be a real API call in production
                # For this implementation, we'll just return the default
                logger.info(f"Region {region} not found in local data, would query API in production")
                pass
            except Exception as e:
                logger.error(f"Error getting regional rates from API: {e}")
        
        # Fall back to national average
        logger.warning(f"Region {region} not found, using default region {self.default_region}")
        return self.regional_rates[self.default_region]
    
    async def _calculate_material_cost(
        self,
        material_type: str,
        quality: str,
        area_squares: float,
        region: str
    ) -> Dict[str, Any]:
        """
        Calculate material cost based on type, quality, area, and region.
        
        Args:
            material_type: Type of roofing material.
            quality: Quality level ('economy', 'standard', 'premium').
            area_squares: Roof area in squares (100 sq ft).
            region: Region code.
            
        Returns:
            Dictionary with material cost details.
        """
        # Validate material type
        if material_type not in self.material_types:
            logger.warning(f"Unknown material type: {material_type}, using asphalt_shingle")
            material_type = "asphalt_shingle"
        
        # Validate quality
        if quality not in ["economy", "standard", "premium"]:
            logger.warning(f"Unknown quality: {quality}, using standard")
            quality = "standard"
        
        # Get material cost range per square
        material_data = self.material_types[material_type]
        cost_range = material_data["cost_per_square"][quality]
        
        # Get regional adjustment
        regional_rates = await self._get_regional_rates(region)
        material_multiplier = regional_rates["material_multiplier"]
        
        # Calculate min and max costs
        min_cost = cost_range["min"] * area_squares * material_multiplier
        max_cost = cost_range["max"] * area_squares * material_multiplier
        
        # Calculate average cost
        avg_cost = (min_cost + max_cost) / 2
        
        return {
            "material_type": material_type,
            "quality": quality,
            "cost_per_square": {
                "min": cost_range["min"] * material_multiplier,
                "max": cost_range["max"] * material_multiplier,
                "avg": (cost_range["min"] + cost_range["max"]) / 2 * material_multiplier
            },
            "total_cost": {
                "min": min_cost,
                "max": max_cost,
                "avg": avg_cost
            },
            "area_squares": area_squares
        }
    
    async def _calculate_labor_cost(
        self,
        material_type: str,
        area_squares: float,
        region: str,
        additional_factors: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Calculate labor cost based on material type, area, region, and additional factors.
        
        Args:
            material_type: Type of roofing material.
            area_squares: Roof area in squares (100 sq ft).
            region: Region code.
            additional_factors: Dictionary of additional cost factors.
            
        Returns:
            Dictionary with labor cost details.
        """
        # Validate material type
        if material_type not in self.material_types:
            logger.warning(f"Unknown material type: {material_type}, using asphalt_shingle")
            material_type = "asphalt_shingle"
        
        # Get installation difficulty
        material_data = self.material_types[material_type]
        difficulty = material_data["installation_difficulty"]
        
        # Get labor cost range per square
        labor_cost_range = self.labor_rates[difficulty]
        
        # Get regional adjustment
        regional_rates = await self._get_regional_rates(region)
        labor_multiplier = regional_rates["labor_multiplier"]
        
        # Calculate additional factors multiplier
        factors_multiplier = 1.0
        
        for factor, value in additional_factors.items():
            if factor in self.additional_factors and value in self.additional_factors[factor]:
                factors_multiplier *= self.additional_factors[factor][value]
        
        # Calculate min and max costs
        min_cost = labor_cost_range["min"] * area_squares * labor_multiplier * factors_multiplier
        max_cost = labor_cost_range["max"] * area_squares * labor_multiplier * factors_multiplier
        
        # Calculate average cost
        avg_cost = (min_cost + max_cost) / 2
        
        return {
            "difficulty": difficulty,
            "cost_per_square": {
                "min": labor_cost_range["min"] * labor_multiplier * factors_multiplier,
                "max": labor_cost_range["max"] * labor_multiplier * factors_multiplier,
                "avg": (labor_cost_range["min"] + labor_cost_range["max"]) / 2 * labor_multiplier * factors_multiplier
            },
            "total_cost": {
                "min": min_cost,
                "max": max_cost,
                "avg": avg_cost
            },
            "area_squares": area_squares,
            "factors_applied": additional_factors,
            "factors_multiplier": factors_multiplier
        }
    
    async def _calculate_additional_costs(
        self,
        base_cost: float,
        project_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate additional costs based on project details.
        
        Args:
            base_cost: Base cost (material + labor).
            project_details: Dictionary of project details.
            
        Returns:
            Dictionary with additional cost details.
        """
        additional_costs = {}
        total_additional = 0
        
        # Permits
        if project_details.get("permits_required", False):
            permit_cost = base_cost * 0.03  # Typically 2-4% of project cost
            additional_costs["permits"] = permit_cost
            total_additional += permit_cost
        
        # Disposal
        if project_details.get("disposal_required", True):
            disposal_cost = project_details.get("area_squares", 0) * 50  # About $50 per square
            additional_costs["disposal"] = disposal_cost
            total_additional += disposal_cost
        
        # Underlayment
        if project_details.get("new_underlayment", True):
            underlayment_cost = project_details.get("area_squares", 0) * 70  # About $70 per square
            additional_costs["underlayment"] = underlayment_cost
            total_additional += underlayment_cost
        
        # Flashing
        if project_details.get("new_flashing", True):
            flashing_cost = project_details.get("area_squares", 0) * 30  # About $30 per square
            additional_costs["flashing"] = flashing_cost
            total_additional += flashing_cost
        
        # Ridge vents
        if project_details.get("ridge_vents", False):
            ridge_vent_cost = project_details.get("roof_length_feet", 0) * 8  # About $8 per foot
            additional_costs["ridge_vents"] = ridge_vent_cost
            total_additional += ridge_vent_cost
        
        # Drip edge
        if project_details.get("drip_edge", False):
            drip_edge_cost = project_details.get("roof_perimeter_feet", 0) * 3  # About $3 per foot
            additional_costs["drip_edge"] = drip_edge_cost
            total_additional += drip_edge_cost
        
        # Insulation
        if project_details.get("insulation", False):
            insulation_cost = project_details.get("area_squares", 0) * 100  # About $100 per square
            additional_costs["insulation"] = insulation_cost
            total_additional += insulation_cost
        
        return {
            "itemized": additional_costs,
            "total": total_additional
        }
    
    async def estimate_cost(
        self,
        project_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Estimate 
(Content truncated due to size limit. Use line ranges to read in chunks)