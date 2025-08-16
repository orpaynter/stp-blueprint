import { useState } from 'react'
import { Play, Phone, CheckCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { VideoPlayer } from './VideoPlayer'
import { videoSources } from '../data/videos'

interface HeroProps {
  onStartChat: () => void
}

export function Hero({ onStartChat }: HeroProps) {
  const [showVideo, setShowVideo] = useState(false)
  const [stats] = useState({
    inspections: 2847,
    contractors: 1250,
    appointmentRate: 92
  })

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(88,165,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(31,246,235,0.1),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white space-y-8"
          >
            {/* Trust Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-secondary-500/20 border border-secondary-500/30 px-4 py-2 rounded-full"
            >
              <CheckCircle className="h-4 w-4 text-secondary-500" />
              <span className="text-sm font-medium text-secondary-100">
                {stats.appointmentRate}% Guaranteed Appointment Setup
              </span>
            </motion.div>

            {/* Main Headline */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight"
              >
                Get Your Roof
                <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent block">
                  Inspected by AI
                </span>
                <span className="text-white">in Minutes</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl lg:text-2xl text-gray-300 leading-relaxed"
              >
                Revolutionary AI technology connects you instantly with top-rated local contractors. Upload photos, get qualified, and have contractors calling you within 2 hours.
              </motion.p>
            </div>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={onStartChat}
                className="group relative bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-pulse-glow"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Start Your Free AI Inspection</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button
                onClick={() => setShowVideo(true)}
                className="group flex items-center space-x-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-300"
              >
                <Play className="h-5 w-5 text-secondary-400" />
                <span>Watch AI Roof Inspection Demo</span>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10"
            >
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-primary-400">
                  {stats.inspections.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-400 mt-1">AI Inspections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-secondary-400">
                  {stats.contractors.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-400 mt-1">Contractors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-primary-400">
                  {stats.appointmentRate}%
                </div>
                <div className="text-sm text-gray-400 mt-1">Success Rate</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Video/Image */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
              <div className="relative aspect-video bg-dark-800 rounded-xl overflow-hidden group cursor-pointer" onClick={() => setShowVideo(true)}>
                <img 
                  src="/images/hero-video-thumbnail.jpg" 
                  alt="AI Roof Inspection Technology" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-6 group-hover:scale-110 transition-all duration-300">
                    <Play className="h-12 w-12 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold text-lg mb-2">See How AI Roof Inspection Works</h3>
                  <p className="text-white/80 text-sm">Professional demonstration of AI-powered roof damage detection</p>
                </div>
              </div>
              
              {/* Professional Video Player */}
              <VideoPlayer 
                isOpen={showVideo}
                onClose={() => setShowVideo(false)}
                videoSources={videoSources}
              />
              
              {/* Floating Trust Elements */}
              <div className="absolute -top-4 -right-4 bg-secondary-500 text-dark-900 px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                🚀 AI-Powered
              </div>
              <div className="absolute -bottom-4 -left-4 bg-primary-500 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                ⚡ 2-Hour Response
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Emergency CTA Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-red-600 to-red-500 text-white py-3"
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 animate-pulse" />
            <span className="font-semibold">Emergency? Storm Damage?</span>
            <span className="text-red-100">Get immediate contractor response</span>
          </div>
          <button 
            onClick={onStartChat}
            className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold hover:bg-red-50 transition-colors"
          >
            Start Now
          </button>
        </div>
      </motion.div>
    </section>
  )
}