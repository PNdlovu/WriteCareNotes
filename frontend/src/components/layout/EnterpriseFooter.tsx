import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { 
  Home, 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Linkedin, 
  Facebook,
  Shield,
  Building
} from 'lucide-react'

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Blog & Insights', href: '/blog' },
    { name: 'Contact Us', href: '/contact' },
  ],
  solutions: [
    { name: 'AI-Powered Platform', href: '/platform/ai-features' },
    { name: 'Care Home Management', href: '/solutions/care-home' },
    { name: 'Domiciliary Care', href: '/solutions/domiciliary' },
    { name: 'CQC Compliance', href: '/solutions/compliance' },
    { name: 'Staff Management & Rota', href: '/solutions/staff' },
    { name: 'Academy & Training', href: '/solutions/training' },
    { name: 'Resident Care Plans', href: '/solutions/residents' },
    { name: 'Family Portal', href: '/solutions/family' },
    { name: 'Incident Reporting', href: '/solutions/incidents' },
    { name: 'HMRC Payroll', href: '/solutions/payroll' },
    { name: 'Analytics & Reporting', href: '/solutions/analytics' },
  ],
  resources: [
    { name: 'Help Center', href: '/help' },
    { name: 'AI Platform Features', href: '/platform/ai-features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Book a Demo', href: '/demo' },
    { name: 'API Documentation', href: '/docs/api' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'GDPR Compliance', href: '/gdpr' },
    { name: 'Data Security', href: '/security' },
    { name: 'Cookie Policy', href: '/cookie-policy' },
    { name: 'System Status', href: '/system-status' },
  ],
}

const socialLinks = [
  { name: 'Twitter', href: '#', icon: Twitter },
  { name: 'LinkedIn', href: '#', icon: Linkedin },
  { name: 'Facebook', href: '#', icon: Facebook },
]

export const EnterpriseFooter: React.FC = () => {
  return (
    <footer className="bg-home-900 text-home-100">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 care-gradient rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">WriteCareNotes</span>
                <span className="text-sm text-home-300">Care Home Management</span>
              </div>
            </div>
            <p className="text-home-300 mb-6 max-w-md">
              The leading care home management platform for the British Isles. 
              Trusted by care professionals to deliver exceptional resident care 
              while maintaining CQC compliance.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-home-300">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">United Kingdom & British Isles</span>
              </div>
              <div className="flex items-center space-x-3 text-home-300">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">+44 (0) 800 123 4567</span>
              </div>
              <div className="flex items-center space-x-3 text-home-300">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">hello@writecarenotes.com</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-home-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Solutions</h3>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-home-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-home-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-home-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-home-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h3 className="text-white font-semibold mb-2">Stay Updated</h3>
              <p className="text-home-300 text-sm max-w-md">
                Get the latest care home industry insights and product updates delivered to your inbox.
              </p>
            </div>
            <div className="flex space-x-3">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="px-4 py-2 bg-home-800 border border-home-700 rounded-md text-white placeholder-home-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button variant="care" size="default">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-home-800 bg-home-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-home-400">
              <span>
                © 2025 WriteCareNotes. All rights reserved.
              </span>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>CQC Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>British Isles Coverage</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-home-400 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}