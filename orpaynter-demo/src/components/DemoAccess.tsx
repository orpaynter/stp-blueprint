import { useState } from 'react'
import { ExternalLink, User, Lock, Play, Code, Database, Server, Copy } from 'lucide-react'

const DemoAccess = () => {
  const [copiedCredential, setCopiedCredential] = useState<string | null>(null)

  const demoCredentials = [
    {
      role: 'Homeowner',
      email: 'homeowner@orpaynter.demo',
      password: 'demo123',
      description: 'Experience the homeowner dashboard with project creation and AI damage detection',
      color: 'from-blue-500 to-blue-600'
    },
    {
      role: 'Contractor',
      email: 'contractor@orpaynter.demo',
      password: 'demo123',
      description: 'Explore contractor tools including lead management and project tracking',
      color: 'from-green-500 to-green-600'
    },
    {
      role: 'Supplier',
      email: 'supplier@orpaynter.demo',
      password: 'demo123',
      description: 'Access supplier marketplace features and inventory management',
      color: 'from-purple-500 to-purple-600'
    },
    {
      role: 'Insurance Agent',
      email: 'insurance@orpaynter.demo',
      password: 'demo123',
      description: 'Review insurance claim processing and automated documentation',
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const technicalEndpoints = [
    {
      name: 'API Gateway',
      url: 'https://api.orpaynter.demo',
      description: 'Main API entry point with authentication',
      status: 'online'
    },
    {
      name: 'User Service',
      url: 'https://api.orpaynter.demo/user',
      description: 'User management and authentication endpoints',
      status: 'online'
    },
    {
      name: 'AI Service',
      url: 'https://api.orpaynter.demo/ai',
      description: 'Machine learning and computer vision APIs',
      status: 'online'
    },
    {
      name: 'Project Service',
      url: 'https://api.orpaynter.demo/projects',
      description: 'Project management and workflow APIs',
      status: 'online'
    }
  ]

  const deploymentInfo = {
    frontend: {
      url: 'https://demo.orpaynter.ai',
      technology: 'React.js + TypeScript',
      hosting: 'AWS CloudFront + S3'
    },
    backend: {
      url: 'https://api.orpaynter.demo',
      technology: 'Microservices (Python + Node.js)',
      hosting: 'AWS ECS Fargate'
    },
    database: {
      primary: 'AWS RDS PostgreSQL',
      cache: 'AWS ElastiCache Redis',
      documents: 'MongoDB Atlas',
      vectors: 'Qdrant Cloud'
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCredential(type)
    setTimeout(() => setCopiedCredential(null), 2000)
  }

  return (
    <section id="demo" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Experience the Platform Live
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access our fully functional demo environment with sample data and all features enabled
          </p>
        </div>

        {/* Live Demo Access */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Access Live Demo</h3>
            <p className="text-blue-100 mb-6">
              Click below to launch the full OrPaynter AI Platform demo environment
            </p>
            <a
              href="https://demo.orpaynter.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
            >
              <span>Launch Demo Platform</span>
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Demo User Accounts
          </h3>
          <p className="text-gray-600 text-center mb-8">
            Use these pre-configured accounts to explore different user roles and features
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoCredentials.map((credential, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-r ${credential.color} rounded-lg flex items-center justify-center`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">{credential.role}</h4>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{credential.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
                      <div className="font-mono text-sm text-gray-800">{credential.email}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credential.email, `${credential.role}-email`)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Password</div>
                      <div className="font-mono text-sm text-gray-800">{credential.password}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(credential.password, `${credential.role}-password`)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {copiedCredential?.includes(credential.role) && (
                  <div className="mt-2 text-xs text-green-600 text-center">Copied to clipboard!</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* API Endpoints */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">API Endpoints</h3>
            </div>
            
            <div className="space-y-4">
              {technicalEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{endpoint.name}</div>
                    <div className="text-sm text-gray-600">{endpoint.description}</div>
                    <div className="font-mono text-xs text-blue-600 mt-1">{endpoint.url}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    endpoint.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>API Documentation:</strong> Full OpenAPI/Swagger documentation available at each endpoint with /docs
              </div>
            </div>
          </div>

          {/* Deployment Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Deployment Stack</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-1">Frontend Application</div>
                <div className="text-sm text-gray-600">{deploymentInfo.frontend.technology}</div>
                <div className="text-sm text-gray-600">{deploymentInfo.frontend.hosting}</div>
                <div className="font-mono text-xs text-blue-600 mt-1">{deploymentInfo.frontend.url}</div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-1">Backend Services</div>
                <div className="text-sm text-gray-600">{deploymentInfo.backend.technology}</div>
                <div className="text-sm text-gray-600">{deploymentInfo.backend.hosting}</div>
                <div className="font-mono text-xs text-blue-600 mt-1">{deploymentInfo.backend.url}</div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-1">Database Layer</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Primary: {deploymentInfo.database.primary}</div>
                  <div>Cache: {deploymentInfo.database.cache}</div>
                  <div>Documents: {deploymentInfo.database.documents}</div>
                  <div>Vectors: {deploymentInfo.database.vectors}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Local Development Setup
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Clone Repository</h4>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-3">
                git clone https://github.com/orpaynter/platform.git
              </div>
              <p className="text-gray-600 text-sm">Get the complete platform source code</p>
            </div>
            
            <div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Install Dependencies</h4>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-3">
                npm install && npm run dev
              </div>
              <p className="text-gray-600 text-sm">Install and start all services with Docker</p>
            </div>
            
            <div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Access Platform</h4>
              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-3">
                http://localhost:3000
              </div>
              <p className="text-gray-600 text-sm">Platform ready with sample data loaded</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DemoAccess
