import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'
import { 
  Home, 
  Building, 
  FileText, 
  Phone, 
  CreditCard,
  Menu,
  X
} from 'lucide-react'

interface NavigationProps {
  className?: string
}

const navigation = [
  { name: 'Solutions', href: '/solutions', icon: FileText },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
  { name: 'Blog', href: '/blog', icon: FileText },
  { name: 'About', href: '/about', icon: Building },
  { name: 'Contact', href: '/contact', icon: Phone },
]

export const EnterpriseNavigation: React.FC<NavigationProps> = ({ className }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (href: string) => {
    return location.pathname === href
  }

  return (
    <nav className={cn("sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40 z-50", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 care-gradient rounded-xl flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">WriteCareNotes</span>
                <span className="text-xs text-gray-600 font-medium">Care Home Management</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-semibold transition-all duration-200 hover:text-primary relative py-2",
                  isActive(item.href) 
                    ? "text-primary after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
                    : "text-gray-700 hover:text-gray-900"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="care" size="sm" className="font-semibold shadow-lg hover:shadow-xl transition-shadow">
                Book Demo
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mx-2",
                  isActive(item.href)
                    ? "bg-blue-50 text-primary border border-blue-200"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="border-t border-gray-200 mt-4 pt-4 space-y-3 mx-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700">
                  Sign In
                </Button>
              </Link>
              <Link to="/demo" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="care" size="sm" className="w-full justify-start font-semibold">
                  Book Demo
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </nav>
  )
}