import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Home, 
  Shield, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Quote,
  Building,
  Phone,
  FileText
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: "CQC Compliance",
    description: "Built-in compliance monitoring for Care Quality Commission standards across England.",
    color: "text-green-600"
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Comprehensive workforce management for care home professionals and registration tracking.",
    color: "text-blue-600"
  },
  {
    icon: Building,
    title: "Resident Care",
    description: "Complete resident management system with care planning and health records.",
    color: "text-purple-600"
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Real-time insights and compliance reporting for care home operations.",
    color: "text-orange-600"
  },
  {
    icon: FileText,
    title: "Digital Records",
    description: "Secure, GDPR-compliant digital record keeping for care documentation.",
    color: "text-indigo-600"
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Round-the-clock support for care home staff across the British Isles.",
    color: "text-red-600"
  }
]

const stats = [
  { label: "Care Homes Served", value: "500+" },
  { label: "Residents Managed", value: "25,000+" },
  { label: "CQC Compliance Rate", value: "99.8%" },
  { label: "Staff Users", value: "15,000+" }
]

const testimonials = [
  {
    quote: "WriteCareNotes has transformed how we manage our care home. The CQC compliance features alone have saved us countless hours.",
    author: "Sarah Mitchell",
    role: "Care Home Manager",
    company: "Sunshine Care Home, Manchester"
  },
  {
    quote: "The staff management system is incredible. We can track all our professional registrations and training in one place.",
    author: "James Thompson",
    role: "Operations Director", 
    company: "Heritage Care Group, Scotland"
  },
  {
    quote: "Finally, a system built specifically for care homes. The interface is intuitive and the support team understands our industry.",
    author: "Emma Williams",
    role: "Quality Manager",
    company: "Oak Tree Residential Care, Wales"
  }
]

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-50 py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  The Complete 
                  <span className="text-primary font-bold block mt-2"> Care Home </span>
                  Management Platform
                </h1>
                <p className="text-xl text-gray-700 mb-8 max-w-2xl leading-relaxed">
                  Trusted by care professionals across the British Isles. Streamline operations, 
                  ensure CQC compliance, and deliver exceptional resident care with our 
                  industry-leading platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link to="/demo">
                    <Button variant="care" size="xl" className="w-full sm:w-auto shadow-xl hover:shadow-2xl transition-all duration-300">
                      Book a Demo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button variant="outline" size="xl" className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50">
                      View Pricing
                    </Button>
                  </Link>
                </div>
                
                {/* Trust Indicators */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">Trusted by leading care homes across:</p>
                  <div className="flex flex-wrap gap-6 text-xs text-gray-500 font-medium">
                    <span className="flex items-center">🏴󠁧󠁢󠁥󠁮󠁧󠁿 England</span>
                    <span className="flex items-center">🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland</span>
                    <span className="flex items-center">🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales</span>
                    <span className="flex items-center">Northern Ireland</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-6 mt-12 lg:mt-0">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8 enterprise-shadow border border-gray-200">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 care-gradient rounded-xl flex items-center justify-center shadow-lg">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Meadowbrook Care Home</h3>
                      <p className="text-sm text-green-600 font-medium">CQC Rating: Outstanding</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <span className="text-sm font-semibold text-gray-800">Compliance Status</span>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700 font-bold">100%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
                        <p className="text-3xl font-bold text-blue-700">42</p>
                        <p className="text-sm text-blue-600 font-medium">Residents</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
                        <p className="text-3xl font-bold text-purple-700">28</p>
                        <p className="text-sm text-purple-600 font-medium">Staff</p>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>Last Inspection:</span>
                        <span className="font-medium">October 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Care Home Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Purpose-built for care home professionals across England, Scotland, Wales, 
              and Northern Ireland. Meet regulatory requirements while improving resident care.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className={`inline-flex p-3 rounded-lg mb-4 ${feature.color} bg-opacity-10`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Care Home Professionals
            </h2>
            <p className="text-xl text-gray-600">
              See what care home managers across the British Isles are saying
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl">
                <Quote className="h-8 w-8 text-primary mb-4" />
                <p className="text-gray-700 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 care-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Care Home?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of care homes across the British Isles who trust WriteCareNotes 
            for their daily operations and compliance needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                Book a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="xl" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary">
                <Phone className="mr-2 h-5 w-5" />
                Call Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}