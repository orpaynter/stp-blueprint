import { Github, ExternalLink, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Architecture', href: '#architecture' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Demo Access', href: '#demo' }
      ]
    },
    {
      title: 'Documentation',
      links: [
        { label: 'API Reference', href: '/documentation#api' },
        { label: 'Deployment Guide', href: '/documentation#deployment' },
        { label: 'Database Schema', href: '/documentation#database' },
        { label: 'GitHub Repository', href: 'https://github.com/orpaynter/platform', external: true }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Technical Specs', href: '#' },
        { label: 'Business Model', href: '#' },
        { label: 'Implementation Plan', href: '#' },
        { label: 'Live Demo', href: 'https://demo.orpaynter.ai', external: true }
      ]
    },
    {
      title: 'Contact',
      links: [
        { label: 'demo@orpaynter.ai', href: 'mailto:demo@orpaynter.ai', icon: Mail },
        { label: '+1 (555) 123-4567', href: 'tel:+15551234567', icon: Phone },
        { label: 'San Francisco, CA', href: '#', icon: MapPin }
      ]
    }
  ]

  const socialLinks = [
    { label: 'GitHub', href: 'https://github.com/orpaynter', icon: Github },
    { label: 'Demo Platform', href: 'https://demo.orpaynter.ai', icon: ExternalLink }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                    >
                      {link.icon && <link.icon className="w-4 h-4" />}
                      <span>{link.label}</span>
                      {link.external && <ExternalLink className="w-3 h-3" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Platform Information */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OP</span>
                </div>
                <span className="text-xl font-bold">OrPaynter AI Platform</span>
              </div>
              <p className="text-gray-300 mb-4">
                Revolutionizing the roofing industry with AI-powered damage detection, cost estimation, 
                and comprehensive project management solutions.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400 mb-1">7</div>
                  <div className="text-sm text-gray-300">Microservices</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400 mb-1">4</div>
                  <div className="text-sm text-gray-300">User Roles</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400 mb-1">15+</div>
                  <div className="text-sm text-gray-300">Technologies</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-400 mb-1">95%</div>
                  <div className="text-sm text-gray-300">AI Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Stack Summary */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <h3 className="text-lg font-semibold mb-4">Technology Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              'React.js', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB',
              'Docker', 'AWS', 'TensorFlow', 'Redis', 'Stripe', 'Terraform'
            ].map((tech, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-800 rounded-lg p-3 mb-2">
                  <div className="text-sm font-medium text-gray-300">{tech}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Access */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to Experience the Platform?</h3>
            <p className="text-blue-100 mb-4">
              Access our fully functional demo with sample data and all features enabled
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://demo.orpaynter.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                <span>Launch Demo</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="/documentation"
                className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors"
              >
                <span>View Documentation</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © {currentYear} OrPaynter AI Platform. All rights reserved. This is a demonstration website.
          </div>
          <div className="flex space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
