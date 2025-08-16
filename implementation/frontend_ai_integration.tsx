/**
 * OrPaynter AI Platform - Frontend AI Integration
 * React hooks and components for seamless AI service integration
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosError } from 'axios';

// ====================
// TYPES AND INTERFACES
// ====================

interface DamageDetectionRequest {
  project_id: string;
  image_urls: string[];
  analysis_type?: string;
  priority?: 'standard' | 'urgent' | 'critical';
}

interface DamageDetectionResult {
  analysis_id: string;
  project_id: string;
  damages: Array<{
    type: string;
    bbox: number[];
    confidence: number;
    severity: string;
    area_sqft: number;
  }>;
  confidence_score: number;
  total_damage_area: number;
  severity_level: string;
  recommendations: string[];
  processing_time: number;
  created_at: string;
}

interface CostEstimationRequest {
  project_id: string;
  damage_analysis_id?: string;
  property_data: Record<string, any>;
  material_preferences?: Record<string, any>;
  location: { city: string; state: string; zip: string };
  urgency_factor?: number;
}

interface CostEstimationResult {
  estimation_id: string;
  project_id: string;
  total_cost: number;
  cost_breakdown: Record<string, number>;
  material_costs: Record<string, number>;
  labor_costs: Record<string, number>;
  timeline_estimate: Record<string, any>;
  confidence_score: number;
  processing_time: number;
  created_at: string;
}

interface ClaimsProcessingRequest {
  project_id: string;
  claim_data: Record<string, any>;
  policy_number: string;
  claimant_name: string;
  date_of_loss: string;
  description: string;
  documents: string[];
}

interface ClaimsProcessingResult {
  claim_id: string;
  project_id: string;
  status: string;
  fraud_risk: {
    score: number;
    level: string;
    indicators: string[];
    recommended_actions: string[];
  };
  recommended_actions: string[];
  estimated_payout?: number;
  processing_time: number;
  created_at: string;
}

interface SchedulingRequest {
  project_id: string;
  estimated_duration: number;
  preferred_start_date?: string;
  blackout_dates?: string[];
  location: { city: string; state: string; zip: string };
  priority?: string;
  weather_dependent?: boolean;
}

interface SchedulingResult {
  schedule_id: string;
  project_id: string;
  optimal_start_date: string;
  estimated_completion_date: string;
  weather_forecast: Array<Record<string, any>>;
  resource_allocation: Record<string, any>;
  risk_factors: string[];
  processing_time: number;
  created_at: string;
}

interface AIServiceConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
}

interface UseAIServiceOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  enableRealTime?: boolean;
}

// ====================
// CONFIGURATION
// ====================

const defaultConfig: AIServiceConfig = {
  baseURL: process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8003',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
};

// ====================
// API CLIENT
// ====================

class AIServiceClient {
  private axiosInstance;
  private wsConnection: WebSocket | null = null;

  constructor(config: AIServiceConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('orpaynter_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add retry interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config, response } = error;
        if (response?.status === 401) {
          // Handle token refresh or redirect to login
          localStorage.removeItem('orpaynter_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );
  }

  // WebSocket connection for real-time updates
  connectWebSocket(userId: string, onMessage?: (data: any) => void) {
    const wsUrl = `${this.axiosInstance.defaults.baseURL?.replace('http', 'ws')}/ws/${userId}`;
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      console.log('WebSocket connected');
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch {
        onMessage?.(event.data);
      }
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.wsConnection.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  disconnectWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  async detectDamage(request: DamageDetectionRequest): Promise<DamageDetectionResult> {
    const response = await this.axiosInstance.post('/damage-detection', request);
    return response.data;
  }

  async estimateCost(request: CostEstimationRequest): Promise<CostEstimationResult> {
    const response = await this.axiosInstance.post('/cost-estimation', request);
    return response.data;
  }

  async processClaim(request: ClaimsProcessingRequest): Promise<ClaimsProcessingResult> {
    const response = await this.axiosInstance.post('/claims-processing', request);
    return response.data;
  }

  async optimizeSchedule(request: SchedulingRequest): Promise<SchedulingResult> {
    const response = await this.axiosInstance.post('/scheduling', request);
    return response.data;
  }

  async healthCheck(): Promise<{ status: string; services: Record<string, string> }> {
    const response = await this.axiosInstance.get('/health');
    return response.data;
  }
}

// Singleton instance
const aiClient = new AIServiceClient(defaultConfig);

// ====================
// REACT HOOKS
// ====================

export const useAIDamageDetection = (options: UseAIServiceOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<DamageDetectionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const detectDamage = useCallback(async (request: DamageDetectionRequest) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await aiClient.detectDamage(request);
      
      clearInterval(progressInterval);
      setProgress(100);
      setData(result);
      options.onSuccess?.(result);
      
      return result;
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.response?.data?.detail || error.message || 'Damage detection failed';
      const errorObj = new Error(errorMessage);
      setError(errorObj);
      options.onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    detectDamage,
    isLoading,
    data,
    error,
    progress,
    reset: () => {
      setData(null);
      setError(null);
      setProgress(0);
    }
  };
};

export const useAICostEstimation = (options: UseAIServiceOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<CostEstimationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const estimateCost = useCallback(async (request: CostEstimationRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiClient.estimateCost(request);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.response?.data?.detail || error.message || 'Cost estimation failed';
      const errorObj = new Error(errorMessage);
      setError(errorObj);
      options.onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    estimateCost,
    isLoading,
    data,
    error,
    reset: () => {
      setData(null);
      setError(null);
    }
  };
};

export const useAIClaimsProcessing = (options: UseAIServiceOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ClaimsProcessingResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const processClaim = useCallback(async (request: ClaimsProcessingRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiClient.processClaim(request);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.response?.data?.detail || error.message || 'Claims processing failed';
      const errorObj = new Error(errorMessage);
      setError(errorObj);
      options.onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    processClaim,
    isLoading,
    data,
    error,
    reset: () => {
      setData(null);
      setError(null);
    }
  };
};

export const useAIScheduling = (options: UseAIServiceOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SchedulingResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const optimizeSchedule = useCallback(async (request: SchedulingRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiClient.optimizeSchedule(request);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.response?.data?.detail || error.message || 'Scheduling optimization failed';
      const errorObj = new Error(errorMessage);
      setError(errorObj);
      options.onError?.(errorObj);
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    optimizeSchedule,
    isLoading,
    data,
    error,
    reset: () => {
      setData(null);
      setError(null);
    }
  };
};

// ====================
// REACT COMPONENTS
// ====================

interface DamageDetectionWidgetProps {
  projectId: string;
  onResults?: (results: DamageDetectionResult) => void;
}

export const DamageDetectionWidget: React.FC<DamageDetectionWidgetProps> = ({
  projectId,
  onResults
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [priority, setPriority] = useState<'standard' | 'urgent' | 'critical'>('standard');
  
  const { detectDamage, isLoading, data, error, progress, reset } = useAIDamageDetection({
    onSuccess: onResults
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    // In production, upload files and get URLs
    const mockUrls = files.map((file, index) => `https://example.com/image${index + 1}.jpg`);
    setImages(mockUrls);
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      alert('Please select images to analyze');
      return;
    }

    await detectDamage({
      project_id: projectId,
      image_urls: images,
      priority
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">AI Damage Detection</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Roof Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'standard' | 'urgent' | 'critical')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="standard">Standard</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isLoading || images.length === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Damage'}
        </button>

        {isLoading && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error.message}</p>
            <button
              onClick={reset}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Try Again
            </button>
          </div>
        )}

        {data && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="font-medium text-green-800 mb-2">Analysis Complete</h4>
            <div className="space-y-2 text-sm text-green-700">
              <p>Damages Found: {data.damages.length}</p>
              <p>Total Damage Area: {data.total_damage_area} sq ft</p>
              <p>Severity Level: <span className="capitalize">{data.severity_level}</span></p>
              <p>Confidence Score: {Math.round(data.confidence_score * 100)}%</p>
              
              {data.recommendations.length > 0 && (
                <div>
                  <p className="font-medium">Recommendations:</p>
                  <ul className="list-disc list-inside">
                    {data.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CostEstimationWidgetProps {
  projectId: string;
  damageAnalysisId?: string;
  onResults?: (results: CostEstimationResult) => void;
}

export const CostEstimationWidget: React.FC<CostEstimationWidgetProps> = ({
  projectId,
  damageAnalysisId,
  onResults
}) => {
  const [propertyData, setPropertyData] = useState({
    roofing_material: 'asphalt_shingle',
    square_footage: '',
    stories: '1',
    age: ''
  });
  
  const [location, setLocation] = useState({
    city: '',
    state: '',
    zip: ''
  });

  const { estimateCost, isLoading, data, error, reset } = useAICostEstimation({
    onSuccess: onResults
  });

  const handleEstimate = async () => {
    if (!location.city || !location.state || !location.zip) {
      alert('Please fill in location information');
      return;
    }

    await estimateCost({
      project_id: projectId,
      damage_analysis_id: damageAnalysisId,
      property_data: propertyData,
      location
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">AI Cost Estimation</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roofing Material
            </label>
            <select
              value={propertyData.roofing_material}
              onChange={(e) => setPropertyData({...propertyData, roofing_material: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asphalt_shingle">Asphalt Shingle</option>
              <option value="metal_roofing">Metal Roofing</option>
              <option value="tile">Tile</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Square Footage
            </label>
            <input
              type="number"
              value={propertyData.square_footage}
              onChange={(e) => setPropertyData({...propertyData, square_footage: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="2000"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={location.city}
              onChange={(e) => setLocation({...location, city: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dallas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={location.state}
              onChange={(e) => setLocation({...location, state: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="TX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              value={location.zip}
              onChange={(e) => setLocation({...location, zip: e.target.value})}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="75201"
            />
          </div>
        </div>

        <button
          onClick={handleEstimate}
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Calculating...' : 'Get Cost Estimate'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error.message}</p>
            <button
              onClick={reset}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Try Again
            </button>
          </div>
        )}

        {data && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-800 mb-2">Cost Estimate</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <p className="text-lg font-bold">Total Cost: ${data.total_cost.toLocaleString()}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="font-medium">Cost Breakdown:</p>
                  <ul className="space-y-1">
                    {Object.entries(data.cost_breakdown).map(([key, value]) => (
                      <li key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace('_', ' ')}:</span>
                        <span>${value.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">Timeline:</p>
                  <p>{data.timeline_estimate.duration_days} days</p>
                  <p className="text-xs">Confidence: {Math.round(data.confidence_score * 100)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ====================
// REAL-TIME UPDATES HOOK
// ====================

export const useAIRealTimeUpdates = (userId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    aiClient.connectWebSocket(userId, (data) => {
      setMessages(prev => [...prev, { timestamp: new Date(), data }]);
    });

    setIsConnected(true);

    return () => {
      aiClient.disconnectWebSocket();
      setIsConnected(false);
    };
  }, [userId]);

  return {
    messages,
    isConnected,
    clearMessages: () => setMessages([])
  };
};

export { aiClient };
