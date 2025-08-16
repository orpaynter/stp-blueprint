const axios = require('axios');

/**
 * OpenWeatherMap Integration Service for OrPaynter
 * Provides weather data for scheduling and planning roofing projects
 */
class OpenWeatherMapService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get current weather for a location
   * @param {Object} location - Location object with lat and lon
   * @returns {Promise<Object>} Weather data
   */
  async getCurrentWeather(location) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat: location.lat,
          lon: location.lon,
          appid: this.apiKey,
          units: 'imperial' // Use imperial units for US-based measurements
        }
      });
      
      return this._formatWeatherResponse(response.data);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw new Error(`Failed to fetch current weather: ${error.message}`);
    }
  }

  /**
   * Get weather forecast for a location
   * @param {Object} location - Location object with lat and lon
   * @param {number} days - Number of days for forecast (max 7)
   * @returns {Promise<Array>} Array of daily forecasts
   */
  async getForecast(location, days = 7) {
    try {
      const response = await axios.get(`${this.baseUrl}/onecall`, {
        params: {
          lat: location.lat,
          lon: location.lon,
          exclude: 'minutely,hourly',
          appid: this.apiKey,
          units: 'imperial',
          cnt: Math.min(days, 7) // Ensure we don't exceed API limits
        }
      });
      
      return this._formatForecastResponse(response.data);
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw new Error(`Failed to fetch weather forecast: ${error.message}`);
    }
  }

  /**
   * Get weather alerts for a location
   * @param {Object} location - Location object with lat and lon
   * @returns {Promise<Array>} Array of weather alerts
   */
  async getWeatherAlerts(location) {
    try {
      const response = await axios.get(`${this.baseUrl}/onecall`, {
        params: {
          lat: location.lat,
          lon: location.lon,
          exclude: 'minutely,hourly,daily',
          appid: this.apiKey,
          units: 'imperial'
        }
      });
      
      return response.data.alerts || [];
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      throw new Error(`Failed to fetch weather alerts: ${error.message}`);
    }
  }

  /**
   * Get geocoding data for an address
   * @param {string} address - Address to geocode
   * @returns {Promise<Object>} Location data with lat and lon
   */
  async geocodeAddress(address) {
    try {
      const response = await axios.get('http://api.openweathermap.org/geo/1.0/direct', {
        params: {
          q: address,
          limit: 1,
          appid: this.apiKey
        }
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('Location not found');
      }
      
      const location = response.data[0];
      return {
        lat: location.lat,
        lon: location.lon,
        name: location.name,
        country: location.country,
        state: location.state
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw new Error(`Failed to geocode address: ${error.message}`);
    }
  }

  /**
   * Check if weather conditions are suitable for roofing work
   * @param {Object} location - Location object with lat and lon
   * @param {Date} date - Date to check
   * @returns {Promise<Object>} Suitability assessment
   */
  async checkWorkSuitability(location, date) {
    try {
      // Get forecast for the date
      const forecast = await this.getForecast(location);
      
      // Find the forecast for the specified date
      const targetDate = new Date(date).setHours(0, 0, 0, 0);
      const dayForecast = forecast.find(day => {
        const forecastDate = new Date(day.date).setHours(0, 0, 0, 0);
        return forecastDate === targetDate;
      });
      
      if (!dayForecast) {
        throw new Error('Forecast not available for the specified date');
      }
      
      // Check conditions for roofing work
      const isSuitable = this._assessWorkConditions(dayForecast);
      
      return {
        date: dayForecast.date,
        suitable: isSuitable.suitable,
        reasons: isSuitable.reasons,
        forecast: dayForecast
      };
    } catch (error) {
      console.error('Error checking work suitability:', error);
      throw new Error(`Failed to check work suitability: ${error.message}`);
    }
  }

  /**
   * Find optimal work days within a date range
   * @param {Object} location - Location object with lat and lon
   * @param {Date} startDate - Start date of range
   * @param {Date} endDate - End date of range
   * @returns {Promise<Array>} Array of optimal work days
   */
  async findOptimalWorkDays(location, startDate, endDate) {
    try {
      // Get forecast for the entire period
      const forecast = await this.getForecast(location, 7);
      
      // Filter forecasts within the date range
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(0, 0, 0, 0);
      
      const daysInRange = forecast.filter(day => {
        const forecastDate = new Date(day.date).setHours(0, 0, 0, 0);
        return forecastDate >= start && forecastDate <= end;
      });
      
      // Assess each day and sort by suitability
      const assessedDays = daysInRange.map(day => {
        const assessment = this._assessWorkConditions(day);
        return {
          date: day.date,
          suitable: assessment.suitable,
          reasons: assessment.reasons,
          score: assessment.score,
          forecast: day
        };
      });
      
      // Sort by score (higher is better)
      return assessedDays.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error finding optimal work days:', error);
      throw new Error(`Failed to find optimal work days: ${error.message}`);
    }
  }

  /**
   * Format weather response data
   * @param {Object} data - Raw weather data
   * @returns {Object} Formatted weather data
   * @private
   */
  _formatWeatherResponse(data) {
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      date: new Date(data.dt * 1000).toISOString(),
      temperature: {
        current: data.main.temp,
        feelsLike: data.main.feels_like,
        min: data.main.temp_min,
        max: data.main.temp_max
      },
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind: {
        speed: data.wind.speed,
        direction: data.wind.deg
      },
      clouds: data.clouds.all,
      weather: {
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon
      },
      rain: data.rain ? data.rain['1h'] || 0 : 0,
      snow: data.snow ? data.snow['1h'] || 0 : 0,
      visibility: data.visibility
    };
  }

  /**
   * Format forecast response data
   * @param {Object} data - Raw forecast data
   * @returns {Array} Formatted forecast data
   * @private
   */
  _formatForecastResponse(data) {
    return data.daily.map(day => ({
      date: new Date(day.dt * 1000).toISOString(),
      sunrise: new Date(day.sunrise * 1000).toISOString(),
      sunset: new Date(day.sunset * 1000).toISOString(),
      temperature: {
        day: day.temp.day,
        min: day.temp.min,
        max: day.temp.max,
        night: day.temp.night,
        evening: day.temp.eve,
        morning: day.temp.morn
      },
      feelsLike: {
        day: day.feels_like.day,
        night: day.feels_like.night,
        evening: day.feels_like.eve,
        morning: day.feels_like.morn
      },
      pressure: day.pressure,
      humidity: day.humidity,
      dewPoint: day.dew_point,
      windSpeed: day.wind_speed,
      windDirection: day.wind_deg,
      weather: {
        main: day.weather[0].main,
        description: day.weather[0].description,
        icon: day.weather[0].icon
      },
      clouds: day.clouds,
      pop: day.pop, // Probability of precipitation
      rain: day.rain || 0,
      snow: day.snow || 0,
      uvi: day.uvi // UV index
    }));
  }

  /**
   * Assess weather conditions for roofing work
   * @param {Object} forecast - Weather forecast for a day
   * @returns {Object} Assessment result
   * @private
   */
  _assessWorkConditions(forecast) {
    const reasons = [];
    let score = 100; // Start with perfect score
    
    // Check temperature (ideal: 50-85°F)
    if (forecast.temperature.max > 95) {
      reasons.push('Temperature too high for safe work');
      score -= 30;
    } else if (forecast.temperature.max > 85) {
      reasons.push('Temperature high but workable');
      score -= 10;
    }
    
    if (forecast.temperature.min < 40) {
      reasons.push('Temperature too low for proper material adhesion');
      score -= 30;
    } else if (forecast.temperature.min < 50) {
      reasons.push('Temperature low but workable');
      score -= 10;
    }
    
    // Check precipitation
    if (forecast.pop > 0.5) {
      reasons.push('High chance of precipitation');
      score -= 40;
    } else if (forecast.pop > 0.3) {
      reasons.push('Moderate chance of precipitation');
      score -= 20;
    } else if (forecast.pop > 0.1) {
      reasons.push('Slight chance of precipitation');
      score -= 5;
    }
    
    // Check wind (over 20mph is problematic)
    if (forecast.windSpeed > 25) {
      reasons.push('Wind speed too high for safe work');
      score -= 40;
    } else if (forecast.windSpeed > 15) {
      reasons.push('Moderate wind may affect work');
      score -= 15;
    }
    
    // Check humidity (high humidity affects adhesives)
    if (forecast.humidity > 85) {
      reasons.push('High humidity may affect material curing');
      score -= 15;
    }
    
    // Check UV index (high UV can affect worker safety)
    if (forecast.uvi > 8) {
      reasons.push('High UV index requires additional worker protection');
      score -= 5;
    }
    
    return {
      suitable: score >= 60,
      reasons: reasons.length > 0 ? reasons : ['Weather conditions are suitable for roofing work'],
      score
    };
  }
}

module.exports = new OpenWeatherMapService();
