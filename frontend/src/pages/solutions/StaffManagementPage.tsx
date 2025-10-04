import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Users, BookOpen, Calendar, Award } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function StaffManagementPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 to-violet-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-purple-600 font-semibold">Staff Management</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Comprehensive Workforce Management for Care Homes
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline staff scheduling, training, and performance management with our integrated 
              workforce platform designed specifically for care home operations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/demo">
                  Book a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Smart Scheduling',
                icon: Calendar,
                description: 'AI-powered scheduling that considers skills, availability, and compliance requirements',
                features: ['Automated shift planning', 'Skills-based assignments', 'Holiday management', 'Overtime tracking']
              },
              {
                title: 'Training Management',
                icon: BookOpen,
                description: 'Track certifications, mandatory training, and professional development',
                features: ['Certification tracking', 'Training reminders', 'Course library', 'Progress monitoring']
              },
              {
                title: 'Performance Tracking',
                icon: Award,
                description: 'Monitor staff performance and development with comprehensive analytics',
                features: ['Performance reviews', 'Goal setting', '360-degree feedback', 'Development plans']
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8">
                <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}