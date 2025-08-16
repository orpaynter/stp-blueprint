import { useState } from 'react'
import { Hero } from './components/Hero'
import { Chatbot } from './components/Chatbot'
import { TrustSection } from './components/TrustSection'
import { ProcessSection } from './components/ProcessSection'

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const openChat = () => setIsChatOpen(true)
  const closeChat = () => setIsChatOpen(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <Hero onStartChat={openChat} />
      
      {/* Trust Section */}
      <TrustSection />
      
      {/* Process Section */}
      <ProcessSection />
      
      {/* Chatbot */}
      <Chatbot isOpen={isChatOpen} onClose={closeChat} />
      
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all animate-pulse-glow z-40"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.48L3 21l2.52-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default App