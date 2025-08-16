import { useState } from 'react'
import { Server, Database, Cloud, Shield, Zap, Globe, ArrowRight, Code, GitBranch } from 'lucide-react'

const Architecture = () => {
  const [activeLayer, setActiveLayer] = useState(0)

  const architectureLayers = [
    {
      title: 'Client Applications',
      description: 'Multi-platform frontend applications built with modern frameworks',
      components: [
        { name: 'Web Application', tech: 'React.js + TypeScript', description: 'Responsive web interface for all user roles' },
        { name: 'Mobile Apps', tech: 'React Native', description: 'iOS and Android applications' },
        { name: 'White-Label Portals', tech: 'Next.js', description: 'Customizable portals for enterprise clients' },
        { name: 'API Integrations', tech: 'RESTful APIs', description: 'Third-party system integrations' }
      ],
      color: 'from-blue-500 to-blue-600',
      icon: Globe
    },
    {
      title: 'API Gateway Layer',
      description: 'Centralized entry point with security, routing, and monitoring',
      components: [
        { name: 'Authentication & Authorization', tech: 'JWT + OAuth2', description: 'Secure user authentication' },
        { name: 'Rate Limiting', tech: 'Redis-based', description: 'API usage control and throttling' },
        { name: 'API Versioning', tech: 'Semantic Versioning', description: 'Backward-compatible API evolution' },
        { name: 'Monitoring & Analytics', tech: 'Custom Metrics', description: 'Real-time API performance tracking' }
      ],
      color: 'from-green-500 to-green-600',
      icon: Shield
    },
    {
      title: 'Microservices Layer',
      description: 'Independent, scalable services handling specific business domains',
      components: [
        { name: 'User Service', tech: 'FastAPI + Python', description: 'User management and authentication' },
        { name: 'Project Service', tech: 'Node.js + Express', description: 'Project lifecycle management' },
        { name: 'AI Service', tech: 'Python + TensorFlow', description: 'Machine learning and AI processing' },
        { name: 'Payment Service', tech: 'Stripe Integration', description: 'Payment processing and billing' },
        { name: 'Marketplace Service', tech: 'Node.js', description: 'Contractor and supplier marketplace' },
        { name: 'Notification Service', tech: 'Node.js + SendGrid', description: 'Email, SMS, and push notifications' }
      ],
      color: 'from-purple-500 to-purple-600',
      icon: Server
    },
    {
      title: 'Data Layer',
      description: 'Multi-database architecture optimized for different data types',
      components: [
        { name: 'PostgreSQL', tech: 'Relational Database', description: 'User data, projects, and transactions' },
        { name: 'MongoDB', tech: 'Document Database', description: 'Flexible schema data and configurations' },
        { name: 'Qdrant', tech: 'Vector Database', description: 'AI embeddings and similarity search' },
        { name: 'Redis', tech: 'In-Memory Cache', description: 'Session management and caching' }
      ],
      color: 'from-orange-500 to-orange-600',
      icon: Database
    }
  ]

  const deploymentFeatures = [
    {
      icon: Cloud,
      title: 'Cloud-Native Architecture',
      description: 'Built for scalability and reliability on AWS infrastructure'
    },
    {
      icon: Zap,
      title: 'Auto-Scaling',
      description: 'Automatically adjusts resources based on demand'
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'End-to-end encryption and comprehensive security measures'
    },
    {
      icon: GitBranch,
      title: 'CI/CD Pipeline',
      description: 'Automated testing, building, and deployment processes'
    }
  ]

  const developmentWorkflow = [
    { step: 'Development', description: 'Local development with Docker Compose', tool: 'Docker + pnpm' },
    { step: 'Testing', description: 'Automated unit and integration tests', tool: 'Jest + Cypress' },
    { step: 'Building', description: 'Containerized builds for consistency', tool: 'Docker + GitHub Actions' },
    { step: 'Deployment', description: 'Blue-green deployment to AWS', tool: 'AWS ECS + Terraform' },
    { step: 'Monitoring', description: 'Real-time performance monitoring', tool: 'CloudWatch + Custom Metrics' }
  ]

  return (
    <section id="architecture" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Scalable Microservices Architecture
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built with modern cloud-native principles for maximum scalability, reliability, and performance
          </p>
        </div>

        {/* Interactive Architecture Diagram */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Layer Navigation */}
            <div className="space-y-4">
              {architectureLayers.map((layer, index) => {
                const IconComponent = layer.icon
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      activeLayer === index
                        ? `bg-gradient-to-r ${layer.color} text-white shadow-lg`
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveLayer(index)}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-6 h-6 ${
                        activeLayer === index ? 'text-white' : 'text-gray-600'
                      }`} />
                      <div>
                        <h3 className="font-semibold">{layer.title}</h3>
                        <p className={`text-sm ${
                          activeLayer === index ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {layer.components.length} components
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Layer Details */}
            <div className="lg:col-span-2 bg-gray-50 rounded-2xl p-8">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  {(() => {
                    const IconComponent = architectureLayers[activeLayer].icon
                    return (
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${architectureLayers[activeLayer].color}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    )
                  })()}
                  <h3 className="text-2xl font-bold text-gray-900">
                    {architectureLayers[activeLayer].title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  {architectureLayers[activeLayer].description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {architectureLayers[activeLayer].components.map((component, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-1">{component.name}</h4>
                    <p className="text-sm text-blue-600 mb-2">{component.tech}</p>
                    <p className="text-sm text-gray-600">{component.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Features */}
        <div className="mb-20">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Production-Ready Infrastructure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {deploymentFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Development Workflow */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Development & Deployment Workflow
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {developmentWorkflow.map((workflow, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full mx-auto mb-3 text-sm font-bold">
                    {index + 1}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{workflow.step}</h4>
                  <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                  <div className="inline-flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    <Code className="w-3 h-3" />
                    <span>{workflow.tool}</span>
                  </div>
                </div>
                {index < developmentWorkflow.length - 1 && (
                  <div className="hidden md:block">
                    <ArrowRight className="w-5 h-5 text-gray-400 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Architecture
