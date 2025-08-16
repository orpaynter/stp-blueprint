export const API_URL = 'https://api.orpaynter.com';

// API version
export const API_VERSION = 'v1';

// Full API base URL with version
export const API_BASE_URL = `${API_URL}/api/${API_VERSION}`;

// API endpoints
export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    ME: `${API_BASE_URL}/auth/me`,
  },
  
  // Project endpoints
  PROJECTS: {
    LIST: `${API_BASE_URL}/projects`,
    DETAIL: (id) => `${API_BASE_URL}/projects/${id}`,
    CREATE: `${API_BASE_URL}/projects`,
    UPDATE: (id) => `${API_BASE_URL}/projects/${id}`,
    DELETE: (id) => `${API_BASE_URL}/projects/${id}`,
  },
  
  // Assessment endpoints
  ASSESSMENTS: {
    LIST: `${API_BASE_URL}/assessments`,
    DETAIL: (id) => `${API_BASE_URL}/assessments/${id}`,
    CREATE: `${API_BASE_URL}/assessments`,
    ANALYZE: (id) => `${API_BASE_URL}/assessments/${id}/analyze`,
    ESTIMATE: (id) => `${API_BASE_URL}/assessments/${id}/estimate`,
  },
  
  // Claims endpoints
  CLAIMS: {
    LIST: `${API_BASE_URL}/claims`,
    DETAIL: (id) => `${API_BASE_URL}/claims/${id}`,
    CREATE: `${API_BASE_URL}/claims`,
    SUBMIT: (id) => `${API_BASE_URL}/claims/${id}/submit`,
    VALIDATE: (id) => `${API_BASE_URL}/claims/${id}/validate`,
  },
  
  // Payments endpoints
  PAYMENTS: {
    LIST: `${API_BASE_URL}/payments`,
    DETAIL: (id) => `${API_BASE_URL}/payments/${id}`,
    CREATE: `${API_BASE_URL}/payments`,
    PROCESS: (id) => `${API_BASE_URL}/payments/${id}/process`,
  },
  
  // Marketplace endpoints
  MARKETPLACE: {
    PRODUCTS: {
      LIST: `${API_BASE_URL}/marketplace/products`,
      DETAIL: (id) => `${API_BASE_URL}/marketplace/products/${id}`,
    },
    SERVICES: {
      LIST: `${API_BASE_URL}/marketplace/services`,
      DETAIL: (id) => `${API_BASE_URL}/marketplace/services/${id}`,
    },
    ORDERS: {
      LIST: `${API_BASE_URL}/marketplace/orders`,
      DETAIL: (id) => `${API_BASE_URL}/marketplace/orders/${id}`,
      CREATE: `${API_BASE_URL}/marketplace/orders`,
      UPDATE_STATUS: (id) => `${API_BASE_URL}/marketplace/orders/${id}/status`,
    },
  },
};

// API request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// API request retry configuration
export const RETRY_CONFIG = {
  retries: 3,
  retryDelay: 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
};

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// File upload headers
export const UPLOAD_HEADERS = {
  'Content-Type': 'multipart/form-data',
};

// API error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  DEFAULT: 'An unexpected error occurred. Please try again.',
};
