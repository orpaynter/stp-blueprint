"""
OrPaynter AI Platform API Gateway
Main entry point for all API requests with authentication, rate limiting, and routing
"""

from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import httpx
import redis
import json
import time
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging
from jose import JWTError, jwt
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="OrPaynter AI Platform API Gateway",
    description="Centralized API Gateway for the OrPaynter AI Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Redis for rate limiting and caching
redis_client = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Service endpoints
SERVICES = {
    "user": os.getenv("USER_SERVICE_URL", "http://user-service:8001"),
    "project": os.getenv("PROJECT_SERVICE_URL", "http://project-service:8002"),
    "ai": os.getenv("AI_SERVICE_URL", "http://ai-service:8003"),
    "payment": os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8004"),
    "marketplace": os.getenv("MARKETPLACE_SERVICE_URL", "http://marketplace-service:8005"),
}

class RateLimitError(Exception):
    pass

class AuthenticationError(Exception):
    pass

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Validate JWT token and return user information"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise AuthenticationError("Invalid token")
        
        # Get user from cache or user service
        user_data = await get_user_from_cache_or_service(user_id)
        if user_data is None:
            raise AuthenticationError("User not found")
            
        return user_data
    except JWTError:
        raise AuthenticationError("Invalid token")

async def get_user_from_cache_or_service(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user data from Redis cache or user service"""
    cache_key = f"user:{user_id}"
    
    # Try cache first
    try:
        cached_user = redis_client.get(cache_key)
        if cached_user:
            return json.loads(cached_user)
    except Exception as e:
        logger.warning(f"Redis cache error: {e}")
    
    # Fallback to user service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{SERVICES['user']}/users/{user_id}")
            if response.status_code == 200:
                user_data = response.json()
                # Cache for 5 minutes
                try:
                    redis_client.setex(cache_key, 300, json.dumps(user_data))
                except Exception as e:
                    logger.warning(f"Redis cache set error: {e}")
                return user_data
    except Exception as e:
        logger.error(f"Error fetching user from service: {e}")
    
    return None

async def check_rate_limit(request: Request, user_id: Optional[str] = None) -> bool:
    """Check if request is within rate limits"""
    client_ip = request.client.host
    
    # Different limits for authenticated vs unauthenticated users
    if user_id:
        key = f"rate_limit:user:{user_id}"
        limit = 1000  # requests per hour for authenticated users
    else:
        key = f"rate_limit:ip:{client_ip}"
        limit = 100   # requests per hour for unauthenticated users
    
    try:
        current_time = int(time.time())
        window_start = current_time - 3600  # 1 hour window
        
        # Remove old entries
        redis_client.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        current_count = redis_client.zcard(key)
        
        if current_count >= limit:
            return False
        
        # Add current request
        redis_client.zadd(key, {str(current_time): current_time})
        redis_client.expire(key, 3600)
        
        return True
    except Exception as e:
        logger.warning(f"Rate limiting error: {e}")
        return True  # Allow request if rate limiting fails

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware"""
    # Skip rate limiting for health checks
    if request.url.path in ["/health", "/docs", "/openapi.json"]:
        return await call_next(request)
    
    # Extract user ID if authenticated
    user_id = None
    try:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
    except:
        pass
    
    # Check rate limit
    if not await check_rate_limit(request, user_id):
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded"}
        )
    
    return await call_next(request)

@app.exception_handler(AuthenticationError)
async def authentication_exception_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc)},
        headers={"WWW-Authenticate": "Bearer"},
    )

@app.exception_handler(RateLimitError)
async def rate_limit_exception_handler(request: Request, exc: RateLimitError):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Rate limit exceeded"}
    )

async def forward_request(service: str, path: str, method: str, headers: dict, body: bytes = None, params: dict = None) -> httpx.Response:
    """Forward request to appropriate microservice"""
    service_url = SERVICES.get(service)
    if not service_url:
        raise HTTPException(status_code=404, detail="Service not found")
    
    url = f"{service_url}{path}"
    
    # Remove host header to avoid conflicts
    headers = {k: v for k, v in headers.items() if k.lower() != "host"}
    
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=method,
            url=url,
            headers=headers,
            content=body,
            params=params,
            timeout=30.0
        )
        return response

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Authentication endpoints (no auth required)
@app.post("/auth/register")
async def register(request: Request):
    """User registration"""
    body = await request.body()
    response = await forward_request(
        service="user",
        path="/auth/register",
        method="POST",
        headers=dict(request.headers),
        body=body
    )
    return JSONResponse(content=response.json(), status_code=response.status_code)

@app.post("/auth/login")
async def login(request: Request):
    """User login"""
    body = await request.body()
    response = await forward_request(
        service="user",
        path="/auth/login",
        method="POST",
        headers=dict(request.headers),
        body=body
    )
    return JSONResponse(content=response.json(), status_code=response.status_code)

# Protected endpoints - User service
@app.api_route("/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def user_service_proxy(request: Request, path: str, current_user: dict = Depends(get_current_user)):
    """Forward requests to user service"""
    body = await request.body() if request.method in ["POST", "PUT", "PATCH"] else None
    
    # Add user context to headers
    headers = dict(request.headers)
    headers["X-User-ID"] = current_user["id"]
    headers["X-User-Role"] = current_user["role"]
    
    response = await forward_request(
        service="user",
        path=f"/users/{path}",
        method=request.method,
        headers=headers,
        body=body,
        params=dict(request.query_params)
    )
    return JSONResponse(content=response.json(), status_code=response.status_code)

# Protected endpoints - Project service
@app.api_route("/projects/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def project_service_proxy(request: Request, path: str, current_user: dict = Depends(get_current_user)):
    """Forward requests to project service"""
    body = await request.body() if request.method in ["POST", "PUT", "PATCH"] else None
    
    headers = dict(request.headers)
    headers["X-User-ID"] = current_user["id"]
    headers["X-User-Role"] = current_user["role"]
    
    response = await forward_request(
        service="project",
        path=f"/projects/{path}",
        method=request.method,
        headers=headers,
        body=body,
        params=dict(request.query_params)
    )
    return JSONResponse(content=response.json(), status_code=response.status_code)

# Protected endpoints - AI service
@app.api_route("/ai/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def ai_service_proxy(request: Request, path: str, current_user: dict = Depends(get_current_user)):
    """Forward requests to AI service"""
    body = await request.body() if request.method in ["POST", "PUT", "PATCH"] else None
    
    headers = dict(request.headers)
    headers["X-User-ID"] = current_user["id"]
    headers["X-User-Role"] = current_user["role"]
    
    response = await forward_request(
        service="ai",
        path=f"/ai/{path}",
        method=request.method,
        headers=headers,
        body=body,
        params=dict(request.query_params)
    )
    return JSONResponse(content=response.json(), status_code=response.status_code)

# Protected endpoints - Payment service
@app.api_route("/payments/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def payment_service_proxy(request: Request, path: str, current_user: dict = Depends(get_current_user)):
    """Forward requests to payment service"""
    body = await request.body() if request.method in ["POST", "PUT", "PATCH"] else None
    
    headers = dict(request.headers)
    headers["X-User-ID"] = current_user["id"]
    headers["X-User-Role"] = current_user["role"]
    
    response = await forward_request(
        service="payment",
        path=f"/payments/{path}",
        method=request.method,
        headers=headers,
        body=body,
        params=dict(request.query_params)
    )
    return JSONResponse(content=response.json(), status_code=response.status_code)

# Protected endpoints - Marketplace service
@app.api_route("/marketplace/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def marketplace_service_proxy(request: Request, path: str, current_user: dict = Depends(get_current_user)):
    """Forward requests to marketplace service"""
    body = await request.body() if request.method in ["POST", "PUT", "PATCH"] else None
    
    headers = dict(request.headers)
    headers["X-User-ID"] = current_user["id"]
    headers["X-User-Role"] = current_user["role"]
    
    response = await forward_request(
        service="marketplace",
        path=f"/marketplace/{path}",
        method=request.method,
        headers=headers,
        body=body,
        params=dict(request.query_params)
    )
    return JSONResponse(content=response.json(), status_code=response.status_code)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
