import { useState, useEffect } from 'react'
import { Check, Star, Zap, Crown, Users } from 'lucide-react'

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
}

const Pricing = () => {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [selectedTier, setSelectedTier] = useState(1)

  useEffect(() => {
    fetch('/data/platform-features.json')
      .then(response => response.json())
      .then(data => setPricingTiers(data.pricingTiers))
      .catch(error => console.error('Error loading pricing:', error))
  }, [])

  const tierIcons = {
    Basic: Users,
    Premium: Star,
    Professional: Zap,
    Enterprise: Crown
  }

  const tierColors = {
    Basic: 'from-gray-500 to-gray-600',
    Premium: 'from-blue-500 to-blue-600',
    Professional: 'from-purple-500 to-purple-600',
    Enterprise: 'from-gold-500 to-yellow-600'
  }

  const roiCalculator = {
    timesSaved: '80%',
    costReduction: '60%',
    accuracyIncrease: '95%',
    customerSatisfaction: '4.9/5'
  }

  if (pricingTiers.length === 0) {
    return <div className="py-20 text-center">Loading pricing information...</div>
  }

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Flexible Pricing for Every Need
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your business. All plans include our core AI features and 24/7 support.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pricingTiers.map((tier, index) => {
            const IconComponent = tierIcons[tier.name as keyof typeof tierIcons] || Users
            const isPopular = tier.name === 'Premium'
            const isProfessional = tier.name === 'Professional'
            
            return (
              <div
                key={tier.name}
                className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-xl ${
                  isPopular
                    ? 'border-blue-500 shadow-lg'
                    : isProfessional
                    ? 'border-purple-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                } ${selectedTier === index ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedTier(index)}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                {/* Professional Badge */}
                {isProfessional && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Best Value
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-gradient-to-r ${
                    tierColors[tier.name as keyof typeof tierColors] || 'from-gray-500 to-gray-600'
                  }`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  {/* Tier Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                    {tier.price !== 'Free' && tier.price !== 'Custom' && (
                      <span className="text-gray-600 ml-1">/month</span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">{tier.description}</p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      isPopular || isProfessional
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* ROI Calculator */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Calculate Your ROI
            </h3>
            <p className="text-lg text-gray-600">
              See how OrPaynter AI Platform delivers measurable business value
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{roiCalculator.timesSaved}</div>
              <div className="text-gray-700 font-medium">Time Savings</div>
              <div className="text-sm text-gray-600 mt-1">Faster project completion</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{roiCalculator.costReduction}</div>
              <div className="text-gray-700 font-medium">Cost Reduction</div>
              <div className="text-sm text-gray-600 mt-1">Operational efficiency</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{roiCalculator.accuracyIncrease}</div>
              <div className="text-gray-700 font-medium">Accuracy Rate</div>
              <div className="text-sm text-gray-600 mt-1">AI damage detection</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">{roiCalculator.customerSatisfaction}</div>
              <div className="text-gray-700 font-medium">Customer Rating</div>
              <div className="text-sm text-gray-600 mt-1">User satisfaction</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h4>
              <p className="text-gray-600 text-sm">
                Yes, you can change your plan at any time. Changes take effect immediately, and you'll be prorated accordingly.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Do you offer custom enterprise solutions?</h4>
              <p className="text-gray-600 text-sm">
                Absolutely! Our Enterprise plan includes custom integrations, dedicated support, and tailored features.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial available?</h4>
              <p className="text-gray-600 text-sm">
                Yes, we offer a 14-day free trial of our Premium plan so you can experience all features.
              </p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">What kind of support do you provide?</h4>
              <p className="text-gray-600 text-sm">
                All plans include email support. Premium and above get priority support, and Enterprise gets dedicated account management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing
