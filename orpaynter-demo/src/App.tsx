import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import PlatformOverview from './components/PlatformOverview'
import Features from './components/Features'
import Architecture from './components/Architecture'
import TechStack from './components/TechStack'
import Pricing from './components/Pricing'
import Documentation from './components/Documentation'
import DemoAccess from './components/DemoAccess'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation />
        <Routes>
          <Route path="/" element={
            <main>
              <Hero />
              <PlatformOverview />
              <Features />
              <Architecture />
              <TechStack />
              <Pricing />
              <DemoAccess />
            </main>
          } />
          <Route path="/documentation" element={<Documentation />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App
