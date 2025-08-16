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

class Scheduler:
    """
    DSPy-based agent for optimizing roofing project schedules.
    Uses weather data and resource allocation logic.
    """
    
    def __init__(
        self,
        llm_provider_type: str = "openai",
        llm_model: str = "gpt-4-turbo",
        weather_api_key: Optional[str] = None
    ):
        """
        Initialize the scheduler.
        
        Args:
            llm_provider_type: Type of LLM provider to use ('openai', 'anthropic', 'mistral', 'ollama').
            llm_model: Model name to use for the LLM.
            weather_api_key: API key for weather services. If None, will try to get from environment.
        """
        self.llm_provider = LLMProviderFactory.create_provider(
            llm_provider_type,
            model=llm_model
        )
        self.weather_api_key = weather_api_key or os.environ.get("OPENWEATHERMAP_API_KEY")
        
        # Define weather constraints for roofing work
        self.weather_constraints = {
            "temperature": {
                "min": 40,  # Minimum temperature in Fahrenheit
                "max": 95   # Maximum temperature in Fahrenheit
            },
            "wind_speed": {
                "max": 20   # Maximum wind speed in mph
            },
            "precipitation": {
                "max": 0.1  # Maximum precipitation in inches
            },
            "humidity": {
                "max": 85   # Maximum humidity percentage
            }
        }
        
        # Define resource requirements by project type
        self.resource_requirements = {
            "small_repair": {
                "crew_size": 2,
                "equipment": ["ladder", "hand_tools"],
                "duration_days": 1
            },
            "medium_repair": {
                "crew_size": 3,
                "equipment": ["ladder", "hand_tools", "power_tools"],
                "duration_days": 2
            },
            "large_repair": {
                "crew_size": 4,
                "equipment": ["ladder", "hand_tools", "power_tools", "safety_equipment"],
                "duration_days": 3
            },
            "full_replacement_small": {
                "crew_size": 4,
                "equipment": ["ladder", "hand_tools", "power_tools", "safety_equipment", "dumpster"],
                "duration_days": 2
            },
            "full_replacement_medium": {
                "crew_size": 6,
                "equipment": ["ladder", "hand_tools", "power_tools", "safety_equipment", "dumpster", "lift"],
                "duration_days": 3
            },
            "full_replacement_large": {
                "crew_size": 8,
                "equipment": ["ladder", "hand_tools", "power_tools", "safety_equipment", "dumpster", "lift", "crane"],
                "duration_days": 5
            }
        }
    
    async def _get_weather_forecast(self, location: str, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get weather forecast for a location.
        
        Args:
            location: Location string (city, state, zip, etc.).
            days: Number of days to forecast.
            
        Returns:
            List of daily weather forecasts.
        """
        if not self.weather_api_key:
            logger.warning("No weather API key provided, using simulated weather data")
            return self._get_simulated_weather(days)
        
        try:
            # Use OpenWeatherMap API for forecast
            url = f"https://api.openweathermap.org/data/2.5/forecast/daily"
            params = {
                "q": location,
                "cnt": days,
                "units": "imperial",  # Use Fahrenheit
                "appid": self.weather_api_key
            }
            
            response = requests.get(url, params=params)
            
            if response.status_code != 200:
                logger.error(f"Error from weather API: {response.text}")
                return self._get_simulated_weather(days)
            
            data = response.json()
            
            # Format the forecast data
            forecast = []
            for day in data.get("list", []):
                forecast.append({
                    "date": datetime.datetime.fromtimestamp(day["dt"]).strftime("%Y-%m-%d"),
                    "temp": {
                        "min": day["temp"]["min"],
                        "max": day["temp"]["max"],
                        "day": day["temp"]["day"]
                    },
                    "humidity": day["humidity"],
                    "wind_speed": day["speed"],
                    "precipitation": day.get("rain", 0),
                    "weather_condition": day["weather"][0]["main"],
                    "weather_description": day["weather"][0]["description"]
                })
            
            return forecast
        except Exception as e:
            logger.error(f"Error getting weather forecast: {e}")
            return self._get_simulated_weather(days)
    
    def _get_simulated_weather(self, days: int = 7) -> List[Dict[str, Any]]:
        """
        Generate simulated weather data for testing.
        
        Args:
            days: Number of days to simulate.
            
        Returns:
            List of simulated daily weather forecasts.
        """
        import random
        
        forecast = []
        start_date = datetime.datetime.now()
        
        for i in range(days):
            date = start_date + datetime.timedelta(days=i)
            
            # Generate random but somewhat realistic weather data
            temp_min = random.randint(50, 75)
            temp_max = temp_min + random.randint(5, 15)
            
            # Higher chance of good weather than bad
            weather_conditions = ["Clear", "Clouds", "Rain", "Thunderstorm"]
            weights = [0.4, 0.3, 0.2, 0.1]
            weather_condition = random.choices(weather_conditions, weights=weights)[0]
            
            # Set precipitation based on weather condition
            if weather_condition == "Clear":
                precipitation = 0
                description = "clear sky"
            elif weather_condition == "Clouds":
                precipitation = 0
                description = "partly cloudy"
            elif weather_condition == "Rain":
                precipitation = random.uniform(0.1, 0.5)
                description = "light rain"
            else:  # Thunderstorm
                precipitation = random.uniform(0.5, 1.5)
                description = "thunderstorm"
            
            forecast.append({
                "date": date.strftime("%Y-%m-%d"),
                "temp": {
                    "min": temp_min,
                    "max": temp_max,
                    "day": (temp_min + temp_max) / 2
                },
                "humidity": random.randint(40, 90),
                "wind_speed": random.uniform(0, 25),
                "precipitation": precipitation,
                "weather_condition": weather_condition,
                "weather_description": description
            })
        
        return forecast
    
    async def _evaluate_weather_suitability(self, forecast: Dict[str, Any]) -> float:
        """
        Evaluate the suitability of weather for roofing work.
        
        Args:
            forecast: Weather forecast for a day.
            
        Returns:
            Suitability score from 0 (unsuitable) to 1 (perfect).
        """
        # Start with perfect score
        score = 1.0
        
        # Check temperature
        temp = forecast["temp"]["day"]
        if temp < self.weather_constraints["temperature"]["min"]:
            # Too cold
            temp_factor = max(0, temp / self.weather_constraints["temperature"]["min"])
            score *= temp_factor
        elif temp > self.weather_constraints["temperature"]["max"]:
            # Too hot
            temp_factor = max(0, 1 - (temp - self.weather_constraints["temperature"]["max"]) / 20)
            score *= temp_factor
        
        # Check wind speed
        wind = forecast["wind_speed"]
        if wind > self.weather_constraints["wind_speed"]["max"]:
            # Too windy
            wind_factor = max(0, 1 - (wind - self.weather_constraints["wind_speed"]["max"]) / 15)
            score *= wind_factor
        
        # Check precipitation
        precip = forecast["precipitation"]
        if precip > self.weather_constraints["precipitation"]["max"]:
            # Too rainy
            precip_factor = max(0, 1 - (precip - self.weather_constraints["precipitation"]["max"]) / 0.5)
            score *= precip_factor
        
        # Check humidity
        humidity = forecast["humidity"]
        if humidity > self.weather_constraints["humidity"]["max"]:
            # Too humid
            humidity_factor = max(0, 1 - (humidity - self.weather_constraints["humidity"]["max"]) / 15)
            score *= humidity_factor
        
        # Check weather condition
        condition = forecast["weather_condition"]
        if condition in ["Rain", "Thunderstorm", "Snow"]:
            # Bad weather condition
            score *= 0.2
        elif condition in ["Drizzle", "Mist", "Fog"]:
            # Suboptimal weather condition
            score *= 0.7
        
        return score
    
    async def _determine_project_type(self, project_details: Dict[str, Any]) -> str:
        """
        Determine the project type based on project details.
        
        Args:
            project_details: Dictionary with project details.
            
        Returns:
            Project type string.
        """
        # Extract relevant details
        repair_type = project_details.get("repair_type", "full_replacement")
        area_squares = float(project_details.get("area_squares", 0))
        
        # Determine project size based on area
        if area_squares < 10:
            size = "small"
        elif area_squares < 30:
            size = "medium"
        else:
            size = "large"
        
        # Determine project type
        if repair_type == "spot_repair":
            return "small_repair"
        elif repair_type == "partial_replacement":
            if size == "small":
                return "medium_repair"
            else:
                return "large_repair"
        else:  # full_replacement
            return f"full_replacement_{size}"
    
    async def _allocate_resources(
        self,
        project_type: str,
        start_date: str,
        available_resources: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Allocate resources for a project.
        
        Args:
            project_type: Type of project.
            start_date: Start date string (YYYY-MM-DD).
            available_resources: Dictionary of available resources.
            
        Returns:
            Dictionary with resource allocation details.
        """
        # Get resource requirements for this project type
        if project_type not in self.resource_requirements:
            logger.warning(f"Unknown project type: {project_type}, using medium_repair")
            project_type = "medium_repair"
        
        requirements = self.resource_requirements[project_type]
        
        # Check if we have enough resources
        crew_available = available_resources.get("crew_members", 0)
        crew_needed = requirements["crew_size"]
        
        equipment_available = available_resources.get("equipment", {})
        equipment_needed = requirements["equipment"]
        
        # Calculate end date
        start_datetime = datetime.datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = start_datetime + datetime.timedelta(days=requirements["duration_days"])
        end_date = end_datetime.strftime("%Y-%m-%d")
        
        # Check for resource constraints
        resource_constraints = []
        
        if crew_available < crew_needed:
            resource_constraints.append(f"Need {crew_needed} crew members, only {crew_available} available")
        
        for equipment in equipment_needed:
            if equipment_available.get(equipment, 0) < 1:
                resource_constraints.append(f"Need {equipment}, none available")
        
        # Prepare allocation result
        allocation = {
            "project_type": project_type,
            "start_date": start_date,
            "end_date": end_date,
            "duration_days": requirements["duration_days"],
            "crew_size": crew_needed,
            "equipment": equipment_needed,
            "resource_constraints": resource_constraints,
            "is_feasible": len(resource_constraints) == 0
        }
        
        return allocation
    
    async def schedule_project(
        self,
        project_details: Dict[str, Any],
        location: str,
        available_dates: List[str],
        available_resources: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Schedule a roofing project based on weather and resource constraints.
        
        Args:
            project_details: Dictionary with project details.
            location: Location string for weather forecast.
            available_dates: List of available date strings (YYYY-MM-DD).
            available_resources: Dictionary of available resources.
            
        Returns:
            Dictionary with scheduling details.
        """
        try:
            # Determine project type
            project_type = await self._determine_project_type(project_details)
            
            # Get weather forecast for the location
            forecast = await self._get_weather_forecast(location)
            
            # Filter forecast to only include available dates
            available_forecast = [f for f in forecast if f["date"] in available_dates]
            
            if not available_forecast:
                logger.warning("No available dates in forecast range")
                return {
                    "project_details": project_details,
                    "location": location,
                    "is_scheduled": False,
                    "reason": "No available dates in forecast range",
                    "suggested_dates": []
                }
            
            # Evaluate weather suitability for each day
            weather_scores = []
            for day in available_forecast:
                score = await self._evaluate_weather_suitability(day)
                weather_scores.append({
                    "date": day["date"],
                    "score": score,
                    "forecast": day
                })
            
            # Sort by weather suitability score (descending)
            weather_scores.sort(key=lambda x: x["score"], reverse=True)
            
            # Get project duration
            duration = self.resource_requirements[project_type]["duration_days"]
            
            # Find the best consecutive days for the project
            best_start_date = None
            best_avg_score = 0
            
            for i in range(len(weather_scores) - duration + 1):
                # Check if these days are consecutive
                current_date = datetime.datetime.strptime(weather_scores[i]["date"], "%Y-%m-%d")
                consecutive = True
                
                for j in range(1, duration):
                    next_date = current_date + datetime.timedelta(days=j)
                    next_date_str = next_date.strftime("%Y-%m-%d")
                    
                    if i + j >= len(weather_scores) or weather_scores[i + j]["date"] !=
(Content truncated due to size limit. Use line ranges to read in chunks)