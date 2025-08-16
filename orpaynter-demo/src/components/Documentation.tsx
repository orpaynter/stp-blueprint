import { useState } from 'react'
import { Book, Code, Server, Database, Cloud, ArrowLeft, ExternalLink, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'

const Documentation = () => {
  const [activeSection, setActiveSection] = useState('api')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const sections = [
    { id: 'api', title: 'API Reference', icon: Code },
    { id: 'deployment', title: 'Deployment Guide', icon: Cloud },
    { id: 'architecture', title: 'Architecture', icon: Server },
    { id: 'database', title: 'Database Schema', icon: Database }
  ]

  const apiEndpoints = [
    {
      method: 'POST',
      endpoint: '/api/auth/login',
      description: 'Authenticate user and get access token',
      request: `{
  "email": "user@example.com",
  "password": "password123"
}`,
      response: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "homeowner"
  }
}`
    },
    {
      method: 'POST',
      endpoint: '/api/ai/damage-detection',
      description: 'Analyze roof image for damage detection',
      request: `{
  "image_url": "https://example.com/roof-image.jpg",
  "property_id": "uuid"
}`,
      response: `{
  "analysis_id": "uuid",
  "confidence": 0.95,
  "damages": [
    {
      "type": "missing_shingles",
      "severity": "moderate",
      "location": {"x": 150, "y": 200},
      "area": 45.5
    }
  ],
  "estimated_cost": 2500.00
}`
    },
    {
      method: 'GET',
      endpoint: '/api/projects/{project_id}',
      description: 'Get project details and status',
      request: `GET /api/projects/550e8400-e29b-41d4-a716-446655440000`,
      response: `{
  "id": "uuid",
  "name": "Roof Repair Project",
  "status": "in_progress",
  "homeowner_id": "uuid",
  "contractor_id": "uuid",
  "estimated_cost": 15000.00,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z"
}`
    }
  ]

  const deploymentSteps = [
    {
      title: 'Prerequisites',
      content: `# System Requirements
- Docker 20.10+ and Docker Compose 2.0+
- Node.js 18+ and npm/pnpm
- Python 3.9+ for AI services
- AWS CLI configured (for production)

# Environment Setup
cp .env.example .env
# Edit .env with your configuration`
    },
    {
      title: 'Local Development',
      content: `# Clone the repository
git clone https://github.com/orpaynter/platform.git
cd orpaynter-platform

# Install dependencies
npm install

# Start all services
npm run dev

# The platform will be available at:
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8000
# Individual services: ports 8001-8006`
    },
    {
      title: 'Production Deployment',
      content: `# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Deploy to AWS ECS
terraform init
terraform plan -var-file="production.tfvars"
terraform apply

# Alternative: Deploy using GitHub Actions
git push origin main  # Triggers CI/CD pipeline`
    },
    {
      title: 'Health Checks',
      content: `# Check service health
curl http://localhost:8000/health

# Check individual services
curl http://localhost:8001/health  # User Service
curl http://localhost:8002/health  # AI Service
curl http://localhost:8003/health  # Project Service

# Database connections
npm run db:check`
    }
  ]

  const architectureComponents = [
    {
      layer: 'Frontend Layer',
      components: [
        'React.js Web Application (Port 3000)',
        'React Native Mobile Apps',
        'White-label Portals (Next.js)',
        'Admin Dashboard'
      ]
    },
    {
      layer: 'API Gateway Layer',
      components: [
        'Kong API Gateway (Port 8000)',
        'JWT Authentication Middleware',
        'Rate Limiting & Throttling',
        'Request/Response Transformation'
      ]
    },
    {
      layer: 'Microservices Layer',
      components: [
        'User Service (FastAPI, Port 8001)',
        'AI Service (Python/TensorFlow, Port 8002)',
        'Project Service (Node.js, Port 8003)',
        'Payment Service (Stripe, Port 8004)',
        'Marketplace Service (Node.js, Port 8005)',
        'Notification Service (Node.js, Port 8006)'
      ]
    },
    {
      layer: 'Data Layer',
      components: [
        'PostgreSQL (Primary Database)',
        'MongoDB (Document Store)',
        'Qdrant (Vector Database)',
        'Redis (Cache & Sessions)'
      ]
    }
  ]

  const databaseSchema = [
    {
      table: 'users',
      description: 'User accounts and authentication',
      columns: [
        'id: UUID PRIMARY KEY',
        'email: VARCHAR(255) UNIQUE NOT NULL',
        'password_hash: VARCHAR(255) NOT NULL',
        'role: VARCHAR(50) NOT NULL',
        'first_name: VARCHAR(255)',
        'last_name: VARCHAR(255)',
        'created_at: TIMESTAMPTZ DEFAULT NOW()',
        'updated_at: TIMESTAMPTZ DEFAULT NOW()'
      ]
    },
    {
      table: 'projects',
      description: 'Roofing projects and their details',
      columns: [
        'id: UUID PRIMARY KEY',
        'name: VARCHAR(255) NOT NULL',
        'homeowner_id: UUID REFERENCES users(id)',
        'contractor_id: UUID REFERENCES users(id)',
        'property_id: UUID REFERENCES properties(id)',
        'status: VARCHAR(50) NOT NULL',
        'estimated_cost: NUMERIC(10,2)',
        'actual_cost: NUMERIC(10,2)',
        'created_at: TIMESTAMPTZ DEFAULT NOW()',
        'updated_at: TIMESTAMPTZ DEFAULT NOW()'
      ]
    },
    {
      table: 'damage_analyses',
      description: 'AI-powered damage detection results',
      columns: [
        'id: UUID PRIMARY KEY',
        'project_id: UUID REFERENCES projects(id)',
        'image_url: VARCHAR(500) NOT NULL',
        'analysis_result: JSONB NOT NULL',
        'confidence_score: NUMERIC(3,2)',
        'estimated_cost: NUMERIC(10,2)',
        'created_at: TIMESTAMPTZ DEFAULT NOW()'
      ]
    }
  ]

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const renderApiSection = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">API Reference</h3>
        <p className="text-gray-600 mb-6">
          Complete REST API documentation for the OrPaynter AI Platform. All endpoints require authentication unless specified.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">Base URL</h4>
          <code className="text-blue-800">https://api.orpaynter.demo</code>
        </div>
      </div>

      {apiEndpoints.map((endpoint, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
              endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {endpoint.method}
            </span>
            <code className="text-lg font-mono text-gray-800">{endpoint.endpoint}</code>
          </div>
          
          <p className="text-gray-600 mb-6">{endpoint.description}</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Request</h5>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{endpoint.request}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(endpoint.request, `request-${index}`)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Response</h5>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{endpoint.response}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(endpoint.response, `response-${index}`)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderDeploymentSection = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Deployment Guide</h3>
        <p className="text-gray-600 mb-6">
          Complete guide for deploying the OrPaynter AI Platform in development and production environments.
        </p>
      </div>

      {deploymentSteps.map((step, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h4>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
              <code>{step.content}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(step.content, `step-${index}`)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderArchitectureSection = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Architecture Overview</h3>
        <p className="text-gray-600 mb-6">
          Detailed breakdown of the microservices architecture and system components.
        </p>
      </div>

      {architectureComponents.map((layer, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">{layer.layer}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layer.components.map((component, componentIndex) => (
              <div key={componentIndex} className="bg-gray-50 rounded-lg p-3">
                <code className="text-sm text-gray-800">{component}</code>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const renderDatabaseSection = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Database Schema</h3>
        <p className="text-gray-600 mb-6">
          Database schema design and table structures for the OrPaynter AI Platform.
        </p>
      </div>

      {databaseSchema.map((table, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-gray-900">{table.table}</h4>
            <span className="text-sm text-gray-500">PostgreSQL Table</span>
          </div>
          <p className="text-gray-600 mb-4">{table.description}</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-semibold text-gray-900 mb-3">Columns</h5>
            <ul className="space-y-2">
              {table.columns.map((column, columnIndex) => (
                <li key={columnIndex} className="font-mono text-sm text-gray-700 bg-white rounded px-3 py-2">
                  {column}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Platform Demo
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Technical Documentation
          </h1>
          <p className="text-xl text-gray-600">
            Comprehensive developer documentation for the OrPaynter AI Platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Documentation</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeSection === 'api' && renderApiSection()}
            {activeSection === 'deployment' && renderDeploymentSection()}
            {activeSection === 'architecture' && renderArchitectureSection()}
            {activeSection === 'database' && renderDatabaseSection()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Documentation
