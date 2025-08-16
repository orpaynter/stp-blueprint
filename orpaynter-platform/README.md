# OrPaynter AI Platform

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
