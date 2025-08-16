import { useState } from 'react'
import { Camera, Brain, Users, CheckCircle, ArrowRight, Play, Clock, Shield, Award } from 'lucide-react'
import { motion } from 'framer-motion'

export function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [showAIDemo, setShowAIDemo] = useState(false)

  const steps = [
    {
      icon: Camera,
      title: "Upload Photos",
      description: "Take photos of your roof damage with your phone. Our AI analyzes them instantly.",
      details: [
        "Mobile-optimized photo capture",
        "AI damage detection in 30 seconds",
        "Automatic damage severity assessment",
        "Photo enhancement for clarity"
      ],
      color: "primary"
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Advanced AI evaluates damage type, severity, and urgency to match you with specialists.",
      details: [
        "Machine learning damage recognition",
        "Insurance claim probability assessment",
        "Repair cost estimation",
        "Contractor specialty matching"
      ],
      color: "secondary"
    },
    {
      icon: Users,
      title: "Contractor Matching",
      description: "Get connected with 3 top-rated local contractors within 2 hours guaranteed.",
      details: [
        "Location-based contractor matching",
        "Verified licensing & insurance",
        "Real customer reviews & ratings",
        "Instant notification system"
      ],
      color: "primary"
    }
  ]

  const aiFeatures = [
    {
      title: "Damage Detection",
      description: "Identifies 15+ types of roof damage with 95% accuracy",
      icon: "🔍"
    },
    {
      title: "Cost Estimation",
      description: "Provides instant repair cost estimates based on local market data",
      icon: "💰"
    },
    {
      title: "Insurance Assessment",
      description: "Evaluates claim eligibility and potential coverage amounts",
      icon: "🛡️"
    },
    {
      title: "Emergency Detection",
      description: "Flags urgent situations requiring immediate contractor response",
      icon: "🚨"
    }
  ]

  const sampleReports = [
    {
      title: "Hail Damage Report",
      damage: "Moderate hail damage",
      cost: "$8,500 - $12,000",
      urgency: "Medium",
      insurance: "90% coverage likely"
    },
    {
      title: "Storm Damage Assessment",
      damage: "Severe wind damage",
      cost: "$15,000 - $22,000",
      urgency: "High",
      insurance: "95% coverage likely"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How Our AI Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Revolutionary technology that transforms hours of research into minutes of results
          </p>
          <button
            onClick={() => setShowAIDemo(true)}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <Play className="h-5 w-5" />
            <span>Watch AI Demo</span>
          </button>
        </motion.div>

        {/* 3-Step Process */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = activeStep === index
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                  isActive 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setActiveStep(index)}
              >
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  isActive 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="h-8 w-8" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-6">{step.description}</p>

                {/* Details */}
                <div className="space-y-2">
                  {step.details.map((detail, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* AI Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Advanced AI Capabilities
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sample AI Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-dark-900 to-dark-800 rounded-2xl p-8 text-white"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Sample AI Analysis Reports</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {sampleReports.map((report, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h4 className="font-semibold text-primary-400 mb-4">{report.title}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Damage Assessment:</span>
                    <span className="text-white font-medium">{report.damage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Estimated Cost:</span>
                    <span className="text-white font-medium">{report.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Urgency Level:</span>
                    <span className={`font-medium ${
                      report.urgency === 'High' ? 'text-red-400' : 
                      report.urgency === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                    }`}>{report.urgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Insurance Coverage:</span>
                    <span className="text-secondary-400 font-medium">{report.insurance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-300 mb-4">Get your personalized AI analysis in under 30 seconds</p>
            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary-400" />
                <span>Instant results</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-secondary-400" />
                <span>95% accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-primary-400" />
                <span>Industry leading</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Demo Modal */}
        {showAIDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAIDemo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">AI Roof Inspection Technology Demo</h3>
                <button
                  onClick={() => setShowAIDemo(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/afen2G_WXOw?autoplay=1&rel=0"
                  title="Roof Inspections with Drones and AI"
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm">Professional demonstration of AI-powered drone roof inspection technology</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}