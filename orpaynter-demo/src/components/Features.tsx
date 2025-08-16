import { useState, useEffect } from 'react'
import { Camera, Calculator, Users, Clipboard, Shield, BarChart3, CheckCircle, ArrowRight } from 'lucide-react'

interface Feature {
  id: string
  title: string
  description: string
  icon: string
  benefits: string[]
}

const Features = () => {
  const [features, setFeatures] = useState<Feature[]>([])
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    fetch('/data/platform-features.json')
      .then(response => response.json())
      .then(data => setFeatures(data.features))
      .catch(error => console.error('Error loading features:', error))
  }, [])

  const getIcon = (iconName: string) => {
    const icons = {
      camera: Camera,
      calculator: Calculator,
      users: Users,
      clipboard: Clipboard,
      shield: Shield,
      chart: BarChart3
    }
    return icons[iconName as keyof typeof icons] || Camera
  }

  const demoScenarios = [
    {
      title: 'Homeowner Dashboard',
      description: 'Submit roof photos and get instant AI analysis',
      features: ['Photo upload', 'Damage detection', 'Cost estimation', 'Contractor matching']
    },
    {
      title: 'Contractor Workflow',
      description: 'Manage projects and optimize operations',
      features: ['Lead management', 'Project tracking', 'Cost optimization', 'Performance analytics']
    },
    {
      title: 'Insurance Claims',
      description: 'Automated claim processing and verification',
      features: ['Claim generation', 'Document verification', 'Fraud detection', 'Fast approval']
    }
  ]

  if (features.length === 0) {
    return <div className="py-20 text-center">Loading features...</div>
  }

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Every Need
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how our AI-powered features transform the roofing industry workflow
          </p>
        </div>

        {/* Interactive Feature Showcase */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const IconComponent = getIcon(feature.icon)
                return (
                  <div
                    key={feature.id}
                    className={`p-6 rounded-xl cursor-pointer transition-all ${
                      activeFeature === index
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${
                        activeFeature === index ? 'bg-blue-500' : 'bg-blue-100'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          activeFeature === index ? 'text-white' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className={`text-sm ${
                          activeFeature === index ? 'text-blue-100' : 'text-gray-600'
                        }`}>
                          {feature.description}
                        </p>
                      </div>
                      <ArrowRight className={`w-5 h-5 ${
                        activeFeature === index ? 'text-white' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Feature Detail */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-4">
                  {(() => {
                    const IconComponent = getIcon(features[activeFeature]?.icon)
                    return <IconComponent className="w-8 h-8 text-blue-600" />
                  })()}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {features[activeFeature]?.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {features[activeFeature]?.description}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Key Benefits:</h4>
                {features[activeFeature]?.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Try This Feature
              </button>
            </div>
          </div>
        </div>

        {/* Demo Scenarios */}
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Experience the Platform in Action
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {demoScenarios.map((scenario, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    <p className="text-gray-600 text-sm">Interactive Demo</p>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">{scenario.title}</h4>
                  <p className="text-gray-600 mb-4">{scenario.description}</p>
                  <ul className="space-y-2 mb-6">
                    {scenario.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Launch Demo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
