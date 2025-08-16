import { useState, useEffect } from 'react'
import { Code, Database, Cloud, Cpu, Palette, Zap } from 'lucide-react'

interface TechCategory {
  category: string
  technologies: string[]
}

const TechStack = () => {
  const [techStack, setTechStack] = useState<TechCategory[]>([])
  const [activeCategory, setActiveCategory] = useState(0)

  useEffect(() => {
    fetch('/data/platform-features.json')
      .then(response => response.json())
      .then(data => setTechStack(data.techStack))
      .catch(error => console.error('Error loading tech stack:', error))
  }, [])

  const categoryIcons = {
    Frontend: Palette,
    Backend: Code,
    Databases: Database,
    'AI/ML': Cpu,
    Infrastructure: Cloud,
    Integration: Zap
  }

  const categoryDescriptions = {
    Frontend: 'Modern, responsive user interfaces built with React ecosystem',
    Backend: 'Scalable microservices architecture with robust APIs',
    Databases: 'Multi-database approach optimized for different data types',
    'AI/ML': 'Advanced machine learning and artificial intelligence frameworks',
    Infrastructure: 'Cloud-native deployment and orchestration tools',
    Integration: 'Third-party services and payment processing integrations'
  }

  const technologyDetails = {
    'React.js': {
      description: 'Component-based UI library for building interactive interfaces',
      benefits: ['Virtual DOM performance', 'Rich ecosystem', 'Large community'],
      useCase: 'Primary frontend framework for web applications'
    },
    'TypeScript': {
      description: 'Statically typed JavaScript for better code quality',
      benefits: ['Type safety', 'Better IDE support', 'Reduced runtime errors'],
      useCase: 'Type-safe development across the entire platform'
    },
    'Next.js': {
      description: 'React framework with SSR and static site generation',
      benefits: ['SEO optimization', 'Performance', 'Developer experience'],
      useCase: 'Server-side rendered pages and white-label solutions'
    },
    'FastAPI': {
      description: 'Modern Python web framework for building APIs',
      benefits: ['High performance', 'Automatic docs', 'Type hints'],
      useCase: 'AI/ML service APIs and data processing endpoints'
    },
    'Node.js': {
      description: 'JavaScript runtime for server-side applications',
      benefits: ['Non-blocking I/O', 'NPM ecosystem', 'JavaScript everywhere'],
      useCase: 'Microservices and real-time communication'
    },
    'PostgreSQL': {
      description: 'Advanced open-source relational database',
      benefits: ['ACID compliance', 'JSON support', 'Performance'],
      useCase: 'User data, projects, and financial transactions'
    },
    'MongoDB': {
      description: 'Flexible document-oriented database',
      benefits: ['Schema flexibility', 'Horizontal scaling', 'JSON-like documents'],
      useCase: 'Configuration data and semi-structured information'
    },
    'TensorFlow': {
      description: 'Open-source machine learning framework',
      benefits: ['Production ready', 'Ecosystem', 'Mobile deployment'],
      useCase: 'Computer vision models for damage detection'
    },
    'Docker': {
      description: 'Containerization platform for consistent deployments',
      benefits: ['Environment consistency', 'Scalability', 'Portability'],
      useCase: 'Service containerization and local development'
    },
    'AWS': {
      description: 'Cloud computing platform and infrastructure',
      benefits: ['Global scale', 'Managed services', 'Security'],
      useCase: 'Production hosting and managed database services'
    }
  }

  if (techStack.length === 0) {
    return <div className="py-20 text-center">Loading technology stack...</div>
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Modern Technology Stack
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built with industry-leading technologies chosen for scalability, performance, and developer experience
          </p>
        </div>

        {/* Technology Categories */}
        <div className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((category, index) => {
              const IconComponent = categoryIcons[category.category as keyof typeof categoryIcons] || Code
              return (
                <button
                  key={category.category}
                  onClick={() => setActiveCategory(index)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    activeCategory === index
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <IconComponent className={`w-6 h-6 mx-auto mb-2 ${
                    activeCategory === index ? 'text-white' : 'text-blue-600'
                  }`} />
                  <div className="text-sm font-medium">{category.category}</div>
                  <div className={`text-xs ${
                    activeCategory === index ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {category.technologies.length} techs
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Category Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              {(() => {
                const IconComponent = categoryIcons[techStack[activeCategory]?.category as keyof typeof categoryIcons] || Code
                return <IconComponent className="w-8 h-8 text-blue-600" />
              })()}
              <h3 className="text-2xl font-bold text-gray-900">
                {techStack[activeCategory]?.category}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {categoryDescriptions[techStack[activeCategory]?.category as keyof typeof categoryDescriptions]}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack[activeCategory]?.technologies.map((tech, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">{tech}</h4>
                {technologyDetails[tech as keyof typeof technologyDetails] && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      {technologyDetails[tech as keyof typeof technologyDetails].description}
                    </p>
                    <div className="text-xs text-blue-600 font-medium">
                      {technologyDetails[tech as keyof typeof technologyDetails].useCase}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technology Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">High Performance</h3>
            <p className="text-gray-600 mb-4">
              Optimized for speed with React Virtual DOM, Node.js non-blocking I/O, and efficient database queries.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Sub-second API response times</li>
              <li>• 99.9% uptime guarantee</li>
              <li>• Auto-scaling infrastructure</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Cloud Native</h3>
            <p className="text-gray-600 mb-4">
              Built for the cloud with Docker containers, Kubernetes orchestration, and AWS managed services.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Containerized microservices</li>
              <li>• Automated deployments</li>
              <li>• Global CDN distribution</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered</h3>
            <p className="text-gray-600 mb-4">
              Advanced machine learning with TensorFlow, computer vision, and predictive analytics.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 95% damage detection accuracy</li>
              <li>• Real-time cost estimation</li>
              <li>• Predictive maintenance</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TechStack
