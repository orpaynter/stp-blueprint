import { Brain, Camera, Calculator, Users2, FileText, TrendingUp } from 'lucide-react'

const PlatformOverview = () => {
  const keyCapabilities = [
    {
      icon: Brain,
      title: 'AI-Powered Intelligence',
      description: 'Advanced machine learning models for damage detection, cost estimation, and predictive analytics.'
    },
    {
      icon: Camera,
      title: 'Computer Vision',
      description: '95% accuracy in roof damage detection using state-of-the-art image recognition technology.'
    },
    {
      icon: Calculator,
      title: 'Smart Estimation',
      description: 'Real-time cost calculations based on market data, materials, and regional pricing variations.'
    },
    {
      icon: Users2,
      title: 'Multi-Stakeholder Platform',
      description: 'Seamlessly connects homeowners, contractors, suppliers, and insurance companies.'
    },
    {
      icon: FileText,
      title: 'Automated Documentation',
      description: 'Complete project documentation, reports, and insurance claim generation.'
    },
    {
      icon: TrendingUp,
      title: 'Business Intelligence',
      description: 'Comprehensive analytics and insights for all stakeholders to optimize operations.'
    }
  ]

  const userRoles = [
    {
      role: 'Homeowners',
      description: 'Get instant damage assessments, cost estimates, and connect with verified contractors.',
      benefits: ['Transparent pricing', 'Quality assurance', 'Insurance assistance', 'Project tracking'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      role: 'Contractors',
      description: 'Access qualified leads, streamline operations, and grow your business with AI tools.',
      benefits: ['Lead generation', 'Project management', 'Cost optimization', 'Performance analytics'],
      color: 'from-green-500 to-green-600'
    },
    {
      role: 'Suppliers',
      description: 'Connect directly with contractors and optimize inventory with demand forecasting.',
      benefits: ['Market access', 'Demand prediction', 'Inventory optimization', 'Direct sales'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      role: 'Insurance',
      description: 'Automated claim processing, fraud detection, and streamlined verification.',
      benefits: ['Claim automation', 'Fraud detection', 'Cost control', 'Fast processing'],
      color: 'from-orange-500 to-orange-600'
    }
  ]

  return (
    <section id="overview" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Complete Ecosystem for the Roofing Industry
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform transforms traditional roofing workflows with intelligent automation, 
            seamless collaboration, and data-driven insights.
          </p>
        </div>

        {/* Key Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {keyCapabilities.map((capability, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <capability.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{capability.title}</h3>
              <p className="text-gray-600 leading-relaxed">{capability.description}</p>
            </div>
          ))}
        </div>

        {/* User Roles Section */}
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
            Built for Every Stakeholder
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {userRoles.map((user, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all">
                <div className={`h-2 bg-gradient-to-r ${user.color}`}></div>
                <div className="p-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">{user.role}</h4>
                  <p className="text-gray-600 mb-4">{user.description}</p>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-800">Key Benefits:</h5>
                    <ul className="grid grid-cols-2 gap-2">
                      {user.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-gray-600">
                          <div className={`w-2 h-2 bg-gradient-to-r ${user.color} rounded-full mr-2`}></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mt-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Why Choose OrPaynter AI Platform?
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            We combine cutting-edge AI technology with deep industry expertise to deliver 
            measurable results and exceptional user experiences.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">80%</div>
              <div className="text-gray-700">Faster Project Completion</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-700">Damage Detection Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">60%</div>
              <div className="text-gray-700">Cost Reduction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PlatformOverview
