import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  BookOpen, 
  Video, 
  Users, 
  Lightbulb,
  TrendingUp,
  Shield,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react'

interface ResourceCategory {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
  resources: {
    title: string
    description: string
    type: string
    link: string
    featured?: boolean
  }[]
}

const resourceCategories: ResourceCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Everything you need to begin your journey with WriteCareNotes',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
    resources: [
      {
        title: 'Implementation Guide',
        description: 'Step-by-step guide to implementing WriteCareNotes in your care home',
        type: 'Guide',
        link: '/resources/implementation-guide',
        featured: true
      },
      {
        title: 'Quick Start Checklist',
        description: 'Essential checklist for your first 30 days with the platform',
        type: 'Checklist',
        link: '/resources/quick-start'
      },
      {
        title: 'Training Materials',
        description: 'Comprehensive training resources for your care team',
        type: 'Training',
        link: '/resources/training'
      },
      {
        title: 'Platform Demo Video',
        description: 'Watch our comprehensive platform walkthrough',
        type: 'Video',
        link: '/demo'
      }
    ]
  },
  {
    id: 'compliance',
    title: 'Compliance & Regulations',
    description: 'Stay compliant with CQC, DOLS, and British Isles regulations',
    icon: Shield,
    color: 'from-green-500 to-emerald-600',
    resources: [
      {
        title: 'CQC Compliance Guide',
        description: 'Complete guide to maintaining CQC compliance with our platform',
        type: 'Guide',
        link: '/resources/cqc-compliance',
        featured: true
      },
      {
        title: 'DOLS Documentation Templates',
        description: 'Ready-to-use templates for DOLS compliance',
        type: 'Templates',
        link: '/resources/dols-templates'
      },
      {
        title: 'NHS Digital Integration',
        description: 'Guide to NHS Digital services integration',
        type: 'Technical',
        link: '/resources/nhs-integration'
      },
      {
        title: 'Multi-Jurisdiction Compliance',
        description: 'Compliance across England, Scotland, Wales, and Northern Ireland',
        type: 'Guide',
        link: '/resources/multi-jurisdiction'
      }
    ]
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    description: 'Industry best practices and expert insights for care home management',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-600',
    resources: [
      {
        title: 'Care Planning Excellence',
        description: 'Best practices for creating effective care plans',
        type: 'Guide',
        link: '/resources/care-planning',
        featured: true
      },
      {
        title: 'Staff Management Guide',
        description: 'Effective strategies for managing care home staff',
        type: 'Guide',
        link: '/resources/staff-management'
      },
      {
        title: 'Quality Assurance Framework',
        description: 'Implementing quality assurance in your care home',
        type: 'Framework',
        link: '/resources/quality-assurance'
      },
      {
        title: 'Family Communication Tips',
        description: 'Best practices for family engagement and communication',
        type: 'Tips',
        link: '/resources/family-communication'
      }
    ]
  },
  {
    id: 'case-studies',
    title: 'Case Studies & Success Stories',
    description: 'Real-world examples of WriteCareNotes transforming care homes',
    icon: TrendingUp,
    color: 'from-purple-500 to-violet-600',
    resources: [
      {
        title: 'Reducing Admin Time by 40%',
        description: 'How Sunshine Care Home streamlined their operations',
        type: 'Case Study',
        link: '/resources/case-study-admin-reduction',
        featured: true
      },
      {
        title: 'Improving CQC Ratings',
        description: 'From "Requires Improvement" to "Outstanding" in 12 months',
        type: 'Case Study',
        link: '/resources/case-study-cqc-improvement'
      },
      {
        title: 'Staff Satisfaction Success',
        description: 'How technology improved staff morale and retention',
        type: 'Case Study',
        link: '/resources/case-study-staff-satisfaction'
      },
      {
        title: 'Family Engagement Results',
        description: 'Increasing family satisfaction scores through better communication',
        type: 'Case Study',
        link: '/resources/case-study-family-engagement'
      }
    ]
  }
]

const supportOptions = [
  {
    title: 'Help Center',
    description: 'Search our comprehensive knowledge base',
    icon: BookOpen,
    link: '/help',
    color: 'text-blue-600'
  },
  {
    title: 'Live Chat',
    description: 'Chat with our support team in real-time',
    icon: MessageCircle,
    link: '#',
    color: 'text-green-600'
  },
  {
    title: 'Phone Support',
    description: 'Call us for immediate assistance',
    icon: Phone,
    link: 'tel:+448001234567',
    color: 'text-purple-600'
  },
  {
    title: 'Email Support',
    description: 'Send us a detailed support request',
    icon: Mail,
    link: 'mailto:support@writecarenotes.com',
    color: 'text-orange-600'
  }
]

export const ResourcesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full shadow-lg">
                <Users className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              Expert Resources &<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Implementation Support
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed">
              Comprehensive guides, best practices, and expert support to maximize your 
              WriteCareNotes implementation. From compliance frameworks to technical integration, 
              we provide everything you need for success.
            </p>
            
            {/* Resource Categories Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12 text-sm">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-center space-x-2 text-blue-700">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">Implementation</span>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Compliance</span>
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center justify-center space-x-2 text-amber-700">
                  <Lightbulb className="h-4 w-4" />
                  <span className="font-medium">Best Practices</span>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-center space-x-2 text-purple-700">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Success Stories</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/help">
                <Button variant="care" size="lg" className="text-lg px-10 py-5 shadow-xl hover:shadow-2xl transition-all">
                  <BookOpen className="h-6 w-6 mr-3" />
                  Browse Knowledge Base
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="text-lg px-10 py-5 border-2 hover:bg-gray-50">
                  <MessageCircle className="h-6 w-6 mr-3" />
                  Get Expert Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {resourceCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className={`bg-gradient-to-r ${category.color} p-3 rounded-lg mr-4`}>
                    <category.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.resources.map((resource, index) => (
                    <div 
                      key={index}
                      className={`p-6 rounded-lg border transition-all hover:shadow-md ${
                        resource.featured 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-3">
                              {resource.title}
                            </h3>
                            {resource.featured && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {resource.description}
                          </p>
                          <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {resource.type}
                          </span>
                        </div>
                      </div>
                      <Link to={resource.link}>
                        <Button 
                          variant={resource.featured ? 'care' : 'outline'} 
                          size="sm" 
                          className="w-full"
                        >
                          <span className="mr-2">
                            {resource.type === 'Video' ? 'Watch' : 'Read'}
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Options */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Need Immediate Help?
            </h2>
            <p className="text-xl text-gray-600">
              Our support team is here to help you succeed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportOptions.map((option, index) => (
              <Link
                key={index}
                to={option.link}
                className="group p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all text-center"
              >
                <option.icon className={`h-8 w-8 mx-auto mb-4 ${option.color} group-hover:scale-110 transition-transform`} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {option.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Care Home?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join over 500+ care homes across the British Isles who trust WriteCareNotes 
              for their daily operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/demo">
                <Button variant="care" size="lg" className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-50">
                  <Video className="h-5 w-5 mr-2" />
                  Book Live Demo
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}