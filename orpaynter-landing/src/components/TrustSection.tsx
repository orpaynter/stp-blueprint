import { useState, useEffect } from 'react'
import { Star, CheckCircle, Clock, Shield, Award } from 'lucide-react'
import { motion } from 'framer-motion'

export function TrustSection() {
  const [liveStats, setLiveStats] = useState({
    inspectionsToday: 127,
    avgResponseTime: 2.3,
    successRate: 92
  })

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        inspectionsToday: prev.inspectionsToday + Math.floor(Math.random() * 3)
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Chicago, IL",
      rating: 5,
      text: "Amazing service! After the hailstorm, I uploaded photos and had 3 contractors call me within 2 hours. The AI really works!",
      damage: "Hail damage",
      timeToContact: "1.5 hours"
    },
    {
      name: "Mike Rodriguez",
      location: "Dallas, TX",
      rating: 5,
      text: "Skeptical at first, but the AI matched me with the perfect contractor for my commercial roof. Saved me days of research.",
      damage: "Commercial leak",
      timeToContact: "45 minutes"
    },
    {
      name: "Jennifer Chen",
      location: "Phoenix, AZ",
      rating: 5,
      text: "The whole process was seamless. From photos to inspection appointment in under 3 hours. Exactly what they promised!",
      damage: "Storm damage",
      timeToContact: "2.5 hours"
    }
  ]

  const insuranceCompanies = [
    "State Farm", "Allstate", "GEICO", "Progressive", "USAA", "Farmers", "Liberty Mutual", "Nationwide"
  ]

  const certifications = [
    { icon: Shield, text: "BBB A+ Rated" },
    { icon: Award, text: "Licensed & Insured" },
    { icon: CheckCircle, text: "Verified Contractors" },
    { icon: Clock, text: "24/7 Emergency" }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Live Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl p-6 mb-16"
        >
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">{liveStats.inspectionsToday}</div>
              <div className="text-primary-100">AI inspections today</div>
              <div className="text-xs text-primary-200 mt-1">🔴 Live</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{liveStats.avgResponseTime}h</div>
              <div className="text-primary-100">Average response time</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{liveStats.successRate}%</div>
              <div className="text-primary-100">Appointment setup rate</div>
            </div>
          </div>
        </motion.div>

        {/* Main Trust Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-semibold text-lg mb-6">
            <CheckCircle className="h-6 w-6" />
            <span>90% Guaranteed Appointment Setup</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Thousands of Homeowners
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered system has connected over 10,000 homeowners with qualified contractors, 
            achieving industry-leading response times and satisfaction rates.
          </p>
        </motion.div>

        {/* Testimonials */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="text-sm text-gray-500">{testimonial.timeToContact}</div>
              </div>
              
              <blockquote className="text-gray-700 mb-4 italic">
                "{testimonial.text}"
              </blockquote>
              
              <div className="border-t pt-4">
                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                <div className="text-sm text-gray-600">{testimonial.location}</div>
                <div className="text-sm text-primary-600 font-medium">{testimonial.damage}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Before/After Photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 mb-16 shadow-lg"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Real Results from Our Network</h3>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="/images/before-after-roof.jpg" 
                alt="Before and after roof repair" 
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-gray-900">From Damage to Perfect Repair</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>AI detected storm damage in 30 seconds</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>3 qualified contractors responded within 2 hours</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Insurance claim approved for $24,000</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Repair completed in 3 days</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Insurance Companies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Trusted by Major Insurance Companies</h3>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <img 
              src="/images/insurance-logos.jpg" 
              alt="Insurance company logos" 
              className="w-full max-w-4xl mx-auto opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-4 gap-6"
        >
          {certifications.map((cert, index) => {
            const Icon = cert.icon
            return (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <Icon className="h-8 w-8 text-primary-500 mx-auto mb-3" />
                <div className="font-semibold text-gray-900">{cert.text}</div>
              </div>
            )
          })}
        </motion.div>

        {/* Contractor Network */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-16 bg-gradient-to-r from-dark-900 to-dark-800 rounded-2xl p-8 text-white text-center"
        >
          <h3 className="text-2xl font-bold mb-4">Our Verified Contractor Network</h3>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="/images/contractor-team.jpeg" 
                alt="Professional contractor team" 
                className="w-full rounded-lg"
              />
            </div>
            <div className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-400">1,250+</div>
                  <div className="text-gray-300">Verified Contractors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-400">4.8/5</div>
                  <div className="text-gray-300">Average Rating</div>
                </div>
              </div>
              <ul className="space-y-2 text-gray-300">
                <li>✓ Background checked & licensed</li>
                <li>✓ Insurance verified & bonded</li>
                <li>✓ Local experts in your area</li>
                <li>✓ Real customer reviews</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}