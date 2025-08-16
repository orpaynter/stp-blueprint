#!/usr/bin/env python3
"""
OrPaynter AI Platform Setup Script
Creates the complete project structure and microservices architecture
"""

import os
import json
from pathlib import Path

def create_directory_structure():
    """Create the complete directory structure for the OrPaynter AI Platform"""
    
    directories = [
        # Root directories
        "orpaynter-platform",
        "orpaynter-platform/docs",
        "orpaynter-platform/scripts",
        "orpaynter-platform/infrastructure",
        "orpaynter-platform/infrastructure/docker",
        "orpaynter-platform/infrastructure/k8s",
        "orpaynter-platform/infrastructure/terraform",
        
        # Microservices
        "orpaynter-platform/services",
        "orpaynter-platform/services/api-gateway",
        "orpaynter-platform/services/api-gateway/src",
        "orpaynter-platform/services/user-service",
        "orpaynter-platform/services/user-service/src",
        "orpaynter-platform/services/project-service",
        "orpaynter-platform/services/project-service/src",
        "orpaynter-platform/services/ai-service",
        "orpaynter-platform/services/ai-service/src",
        "orpaynter-platform/services/ai-service/models",
        "orpaynter-platform/services/payment-service",
        "orpaynter-platform/services/payment-service/src",
        "orpaynter-platform/services/marketplace-service",
        "orpaynter-platform/services/marketplace-service/src",
        "orpaynter-platform/services/notification-service",
        "orpaynter-platform/services/notification-service/src",
        
        # Frontend applications
        "orpaynter-platform/frontend",
        "orpaynter-platform/frontend/web-app",
        "orpaynter-platform/frontend/admin-dashboard",
        
        # Shared libraries
        "orpaynter-platform/shared",
        "orpaynter-platform/shared/database",
        "orpaynter-platform/shared/auth",
        "orpaynter-platform/shared/utils",
        "orpaynter-platform/shared/models",
        
        # Data and ML
        "orpaynter-platform/data",
        "orpaynter-platform/data/datasets",
        "orpaynter-platform/data/models",
        "orpaynter-platform/ml",
        "orpaynter-platform/ml/damage-detection",
        "orpaynter-platform/ml/cost-estimation",
        "orpaynter-platform/ml/training",
        
        # Testing
        "orpaynter-platform/tests",
        "orpaynter-platform/tests/integration",
        "orpaynter-platform/tests/unit",
        "orpaynter-platform/tests/e2e",
        
        # Configuration
        "orpaynter-platform/config",
        "orpaynter-platform/config/development",
        "orpaynter-platform/config/staging",
        "orpaynter-platform/config/production",
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {directory}")

def create_docker_compose():
    """Create Docker Compose configuration for local development"""
    
    docker_compose_content = """version: '3.8'

services:
  postgresql:
    image: postgres:14
    environment:
      POSTGRES_DB: orpaynter
      POSTGRES_USER: orpaynter
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: orpaynter
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  api-gateway:
    build: ./services/api-gateway
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://orpaynter:password@postgresql:5432/orpaynter
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgresql
      - redis

  user-service:
    build: ./services/user-service
    ports:
      - "8001:8001"
    environment:
      DATABASE_URL: postgresql://orpaynter:password@postgresql:5432/orpaynter
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgresql
      - redis

  project-service:
    build: ./services/project-service
    ports:
      - "8002:8002"
    environment:
      DATABASE_URL: postgresql://orpaynter:password@postgresql:5432/orpaynter
      MONGO_URL: mongodb://orpaynter:password@mongodb:27017/orpaynter
    depends_on:
      - postgresql
      - mongodb

  ai-service:
    build: ./services/ai-service
    ports:
      - "8003:8003"
    environment:
      QDRANT_URL: http://qdrant:6333
      MONGO_URL: mongodb://orpaynter:password@mongodb:27017/orpaynter
    depends_on:
      - qdrant
      - mongodb

  payment-service:
    build: ./services/payment-service
    ports:
      - "8004:8004"
    environment:
      DATABASE_URL: postgresql://orpaynter:password@postgresql:5432/orpaynter
      STRIPE_SECRET_KEY: sk_test_...
    depends_on:
      - postgresql

  marketplace-service:
    build: ./services/marketplace-service
    ports:
      - "8005:8005"
    environment:
      DATABASE_URL: postgresql://orpaynter:password@postgresql:5432/orpaynter
      MONGO_URL: mongodb://orpaynter:password@mongodb:27017/orpaynter
    depends_on:
      - postgresql
      - mongodb

  web-app:
    build: ./frontend/web-app
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:8000
    depends_on:
      - api-gateway

volumes:
  postgres_data:
  mongo_data:
  redis_data:
  qdrant_data:
"""
    
    with open("orpaynter-platform/docker-compose.yml", "w") as f:
        f.write(docker_compose_content)
    
    print("Created docker-compose.yml")

def create_package_json():
    """Create package.json for the root project"""
    
    package_json = {
        "name": "orpaynter-platform",
        "version": "1.0.0",
        "description": "AI-Powered Roofing Platform",
        "private": True,
        "workspaces": [
            "frontend/*",
            "services/*"
        ],
        "scripts": {
            "dev": "docker-compose up -d",
            "dev:build": "docker-compose up --build",
            "stop": "docker-compose down",
            "test": "npm run test --workspaces",
            "lint": "npm run lint --workspaces",
            "build": "npm run build --workspaces"
        },
        "devDependencies": {
            "concurrently": "^7.6.0",
            "nodemon": "^2.0.20"
        }
    }
    
    with open("orpaynter-platform/package.json", "w") as f:
        json.dump(package_json, f, indent=2)
    
    print("Created package.json")

def create_readme():
    """Create the main README file"""
    
    readme_content = """# OrPaynter AI Platform

A comprehensive AI-powered SaaS platform for the roofing industry that connects homeowners, contractors, suppliers, and insurance companies.

## Features

- **AI-Powered Damage Detection**: Advanced computer vision models for roof damage assessment
- **Cost Estimation**: Intelligent pricing algorithms for accurate project estimates
- **Multi-Role Marketplace**: Connect homeowners, contractors, suppliers, and insurance agents
- **Subscription Management**: Flexible pricing tiers for all user types
- **Insurance Integration**: Streamlined claims processing and documentation
- **Project Management**: Complete workflow management from inspection to completion

## Architecture

The platform is built using a microservices architecture with the following components:

- **API Gateway**: Entry point for all requests with authentication and rate limiting
- **User Service**: User management, authentication, and authorization
- **Project Service**: Project lifecycle management and documentation
- **AI Service**: Machine learning models for damage detection and cost estimation
- **Payment Service**: Stripe integration for subscription and transaction processing
- **Marketplace Service**: Contractor and supplier marketplace functionality
- **Notification Service**: Email, SMS, and push notifications

## Technology Stack

- **Backend**: Python (FastAPI), Node.js
- **Frontend**: React.js (Next.js), TypeScript
- **Databases**: PostgreSQL, MongoDB, Qdrant (Vector DB), Redis
- **AI/ML**: TensorFlow, PyTorch, OpenCV
- **Infrastructure**: Docker, AWS, Terraform
- **Payment**: Stripe

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development environment: `npm run dev`
4. Access the application at `http://localhost:3000`

## Development

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.9+

### Local Development

```bash
# Start all services
npm run dev

# Build and start services
npm run dev:build

# Stop all services
npm stop
```

### Testing

```bash
# Run all tests
npm test

# Run linting
npm run lint
```

## Documentation

Detailed documentation is available in the `/docs` directory:

- [API Documentation](docs/api.md)
- [Architecture Overview](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guidelines](docs/contributing.md)

## License

This project is proprietary software. All rights reserved.
"""
    
    with open("orpaynter-platform/README.md", "w") as f:
        f.write(readme_content)
    
    print("Created README.md")

def main():
    """Main setup function"""
    print("Setting up OrPaynter AI Platform...")
    
    # Create directory structure
    create_directory_structure()
    
    # Create configuration files
    create_docker_compose()
    create_package_json()
    create_readme()
    
    print("\n✅ OrPaynter AI Platform structure created successfully!")
    print("\nNext steps:")
    print("1. cd orpaynter-platform")
    print("2. Review and customize configuration files")
    print("3. Start implementing individual services")
    print("4. Run 'npm run dev' to start development environment")

if __name__ == "__main__":
    main()
