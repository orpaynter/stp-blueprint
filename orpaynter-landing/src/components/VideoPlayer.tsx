import { useState, useEffect } from 'react'
import { Play, X, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'

interface VideoPlayerProps {
  isOpen: boolean
  onClose: () => void
  videoSources: {
    id: string
    url: string
    title: string
    description: string
  }[]
}

export function VideoPlayer({ isOpen, onClose, videoSources }: VideoPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [videoError, setVideoError] = useState(false)
  const [muted, setMuted] = useState(false)

  const currentVideo = videoSources[currentVideoIndex]

  const handleVideoError = () => {
    setVideoError(true)
    // Try next video source if available
    if (currentVideoIndex < videoSources.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
      setVideoError(false)
    }
  }

  const retryVideo = () => {
    setVideoError(false)
    // Force iframe reload by changing key
    setCurrentVideoIndex(currentVideoIndex)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{currentVideo.title}</h3>
            <p className="text-gray-600 mt-1">{currentVideo.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Video Container */}
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
          {!videoError ? (
            <>
              <iframe
                key={`${currentVideo.id}-${currentVideoIndex}`}
                src={`${currentVideo.url}?autoplay=1&rel=0&modestbranding=1&controls=1${muted ? '&mute=1' : ''}`}
                title={currentVideo.title}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
                onError={handleVideoError}
              />
              
              {/* Video Controls Overlay */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => setMuted(!muted)}
                  className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <div className="bg-red-500/20 rounded-full p-4 mb-4">
                  <Play className="h-12 w-12 text-red-400 mx-auto" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Video Temporarily Unavailable</h4>
                <p className="text-gray-300 mb-4 max-w-md mx-auto">
                  We're having trouble loading this video. This could be due to network connectivity or the video source being temporarily unavailable.
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={retryVideo}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                  {currentVideoIndex < videoSources.length - 1 && (
                    <button
                      onClick={() => {
                        setCurrentVideoIndex(currentVideoIndex + 1)
                        setVideoError(false)
                      }}
                      className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Try Alternative Video
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Selection */}
        {videoSources.length > 1 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">More AI Roof Inspection Demos:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {videoSources.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => {
                    setCurrentVideoIndex(index)
                    setVideoError(false)
                  }}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    index === currentVideoIndex
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{video.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{video.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Professional Context */}
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <Play className="h-4 w-4 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-gray-900">Professional AI Technology</h5>
              <p className="text-sm text-gray-600">
                These demonstrations showcase real AI-powered roof inspection technology used by industry professionals.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}