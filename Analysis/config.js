// Redis Configuration for OrPaynter AI Platform

/*
This file contains the Redis configuration and key structures for the OrPaynter platform.
Redis is used for:
1. Caching frequently accessed data
2. Session management
3. Rate limiting
4. Real-time features
5. Task queues
*/

// Redis Key Prefixes
const KEY_PREFIXES = {
  // Session Management
  SESSION: 'session:',
  
  // User Data Caching
  USER: 'user:',
  USER_PROFILE: 'user:profile:',
  
  // Project Data Caching
  PROJECT: 'project:',
  PROJECT_LIST: 'project:list:',
  
  // Assessment Data Caching
  ASSESSMENT: 'assessment:',
  ASSESSMENT_LIST: 'assessment:list:',
  
  // Claim Data Caching
  CLAIM: 'claim:',
  CLAIM_LIST: 'claim:list:',
  
  // API Rate Limiting
  RATE_LIMIT: 'rate:',
  
  // Authentication
  TOKEN_BLACKLIST: 'token:blacklist:',
  REFRESH_TOKEN: 'refresh:',
  
  // Real-time Notifications
  NOTIFICATION_CHANNEL: 'notification:channel:',
  USER_NOTIFICATIONS: 'user:notifications:',
  
  // Task Queues
  TASK_QUEUE: 'queue:',
  
  // Weather Data Caching
  WEATHER: 'weather:',
  
  // Search Results Caching
  SEARCH_RESULTS: 'search:',
  
  // Dashboard Statistics
  STATS: 'stats:',
  
  // Feature Flags
  FEATURE_FLAG: 'feature:'
};

// Redis Data Structures and TTLs (Time-To-Live)

/*
1. User Sessions
   - Type: Hash
   - Key: session:{sessionId}
   - Fields: userId, role, permissions, lastActivity
   - TTL: 24 hours
*/
const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds

/*
2. User Data Cache
   - Type: Hash
   - Key: user:{userId}
   - Fields: email, firstName, lastName, role, etc.
   - TTL: 30 minutes
*/
const USER_CACHE_TTL = 60 * 30; // 30 minutes in seconds

/*
3. Project Data Cache
   - Type: Hash
   - Key: project:{projectId}
   - Fields: title, description, status, clientId, etc.
   - TTL: 15 minutes
*/
const PROJECT_CACHE_TTL = 60 * 15; // 15 minutes in seconds

/*
4. Project List Cache
   - Type: Sorted Set
   - Key: project:list:{userId}
   - Members: projectIds with score as timestamp
   - TTL: 5 minutes
*/
const PROJECT_LIST_CACHE_TTL = 60 * 5; // 5 minutes in seconds

/*
5. Assessment Data Cache
   - Type: Hash
   - Key: assessment:{assessmentId}
   - Fields: projectId, type, status, etc.
   - TTL: 15 minutes
*/
const ASSESSMENT_CACHE_TTL = 60 * 15; // 15 minutes in seconds

/*
6. API Rate Limiting
   - Type: String (Counter)
   - Key: rate:{endpoint}:{ip}
   - Value: Number of requests
   - TTL: 1 minute (sliding window)
*/
const RATE_LIMIT_TTL = 60; // 1 minute in seconds

/*
7. Token Blacklist
   - Type: String
   - Key: token:blacklist:{jti}
   - Value: 1
   - TTL: Equal to token expiration time
*/
const TOKEN_BLACKLIST_TTL = 60 * 60; // 1 hour in seconds (depends on token expiration)

/*
8. Real-time Notifications
   - Type: List
   - Key: user:notifications:{userId}
   - Values: JSON stringified notification objects
   - TTL: 7 days
*/
const NOTIFICATIONS_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

/*
9. Task Queues
   - Type: List
   - Key: queue:{queueName}
   - Values: JSON stringified task objects
   - TTL: None (processed by workers)
*/

/*
10. Weather Data Cache
    - Type: Hash
    - Key: weather:{zipCode}:{date}
    - Fields: temperature, precipitation, windSpeed, etc.
    - TTL: 1 hour
*/
const WEATHER_CACHE_TTL = 60 * 60; // 1 hour in seconds

/*
11. Search Results Cache
    - Type: List
    - Key: search:{queryHash}
    - Values: JSON stringified search result objects
    - TTL: 10 minutes
*/
const SEARCH_CACHE_TTL = 60 * 10; // 10 minutes in seconds

/*
12. Dashboard Statistics Cache
    - Type: Hash
    - Key: stats:{userId}:{statType}
    - Fields: Various statistics
    - TTL: 5 minutes
*/
const STATS_CACHE_TTL = 60 * 5; // 5 minutes in seconds

/*
13. Feature Flags
    - Type: Hash
    - Key: feature:{featureName}
    - Fields: enabled, userGroups, percentage
    - TTL: None (until changed)
*/

// Redis Pub/Sub Channels
const CHANNELS = {
  // Real-time notifications
  USER_NOTIFICATIONS: 'user-notifications',
  
  // Project updates
  PROJECT_UPDATES: 'project-updates',
  
  // Assessment updates
  ASSESSMENT_UPDATES: 'assessment-updates',
  
  // Claim status changes
  CLAIM_UPDATES: 'claim-updates',
  
  // Payment status changes
  PAYMENT_UPDATES: 'payment-updates',
  
  // System-wide announcements
  SYSTEM_ANNOUNCEMENTS: 'system-announcements'
};

// Redis Connection Configuration
const REDIS_CONFIG = {
  // Production configuration (AWS ElastiCache)
  production: {
    host: process.env.REDIS_HOST || 'redis.orpaynter.com',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: 0,
    tls: true,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  },
  
  // Development configuration (local)
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: 0,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  },
  
  // Testing configuration (local)
  test: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: 1,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  }
};

// Redis Client Setup Example
/*
const redis = require('redis');
const { promisify } = require('util');

const environment = process.env.NODE_ENV || 'development';
const config = REDIS_CONFIG[environment];

const client = redis.createClient(config);

// Promisify Redis commands
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const hgetallAsync = promisify(client.hgetall).bind(client);
const hmsetAsync = promisify(client.hmset).bind(client);
const expireAsync = promisify(client.expire).bind(client);
const delAsync = promisify(client.del).bind(client);

// Error handling
client.on('error', (err) => {
  console.error('Redis Error:', err);
});

// Connection handling
client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('reconnecting', () => {
  console.log('Reconnecting to Redis');
});

// Export Redis client and promisified commands
module.exports = {
  client,
  getAsync,
  setAsync,
  hgetallAsync,
  hmsetAsync,
  expireAsync,
  delAsync,
  KEY_PREFIXES,
  CHANNELS,
  TTL: {
    SESSION: SESSION_TTL,
    USER_CACHE: USER_CACHE_TTL,
    PROJECT_CACHE: PROJECT_CACHE_TTL,
    PROJECT_LIST_CACHE: PROJECT_LIST_CACHE_TTL,
    ASSESSMENT_CACHE: ASSESSMENT_CACHE_TTL,
    RATE_LIMIT: RATE_LIMIT_TTL,
    TOKEN_BLACKLIST: TOKEN_BLACKLIST_TTL,
    NOTIFICATIONS: NOTIFICATIONS_TTL,
    WEATHER_CACHE: WEATHER_CACHE_TTL,
    SEARCH_CACHE: SEARCH_CACHE_TTL,
    STATS_CACHE: STATS_CACHE_TTL
  }
};
*/

// Example Usage

/*
// Caching a user
async function cacheUser(userId, userData) {
  const key = `${KEY_PREFIXES.USER}${userId}`;
  await hmsetAsync(key, userData);
  await expireAsync(key, USER_CACHE_TTL);
}

// Getting a cached user
async function getCachedUser(userId) {
  const key = `${KEY_PREFIXES.USER}${userId}`;
  return await hgetallAsync(key);
}

// Rate limiting
async function checkRateLimit(endpoint, ip, limit) {
  const key = `${KEY_PREFIXES.RATE_LIMIT}${endpoint}:${ip}`;
  const count = await getAsync(key) || 0;
  
  if (count >= limit) {
    return false; // Rate limit exceeded
  }
  
  await setAsync(key, parseInt(count) + 1, 'EX', RATE_LIMIT_TTL);
  return true; // Request allowed
}

// Adding a notification
async function addNotification(userId, notification) {
  const key = `${KEY_PREFIXES.USER_NOTIFICATIONS}${userId}`;
  await client.lpush(key, JSON.stringify(notification));
  await expireAsync(key, NOTIFICATIONS_TTL);
  
  // Publish to the user's notification channel
  const channel = `${CHANNELS.USER_NOTIFICATIONS}:${userId}`;
  await client.publish(channel, JSON.stringify(notification));
}

// Getting user notifications
async function getUserNotifications(userId, limit = 10) {
  const key = `${KEY_PREFIXES.USER_NOTIFICATIONS}${userId}`;
  const notifications = await client.lrange(key, 0, limit - 1);
  return notifications.map(n => JSON.parse(n));
}
*/
