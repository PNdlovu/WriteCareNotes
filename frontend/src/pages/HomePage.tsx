import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Bot, 
  Shield, 
  Users, 
  CheckCircle,
  Building,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  Phone,
  Play,
  Star
} from 'lucide-react'

const enterpriseCapabilities = [
  {
    icon: Bot,
    title: "AI-Powered Operations",
    description: "Intelligent automation for staff scheduling, resident care planning, and operational efficiency.",
    gradient: "from-violet-500 to-purple-600",
    stats: "80% efficiency gain"
  },
  {
    icon: Users,
    title: "HMRC Payroll Integration", 
    description: "Direct HMRC connectivity with real-time PAYE processing and automatic pension contributions.",
    gradient: "from-green-500 to-emerald-600",
    stats: "100% compliance"
  },
  {
    icon: Building,
    title: "Regulatory Compliance",
    description: "Automated compliance with CQC, Care Inspectorate, CIW, and RQIA across the British Isles.",
    gradient: "from-blue-500 to-cyan-600",
    stats: "Zero violations"
  },
  {
    icon: DollarSign,
    title: "Financial Management",
    description: "AI-powered financial forecasting, budget management, and enterprise accounting integration.",
    gradient: "from-emerald-500 to-teal-600",
    stats: "25% cost reduction"
  }
]

const platformStats = [
  { value: "80+", label: "Microservices", description: "Enterprise-grade architecture" },
  { value: "15+", label: "AI Agents", description: "Intelligent automation" },
  { value: "500+", label: "API Endpoints", description: "Complete integration" },
  { value: "4", label: "Territories", description: "British Isles coverage" }
]

const testimonials = [
  {
    quote: "WriteCareNotes transformed our operations. The AI scheduling alone saved us 20 hours per week.",
    author: "Sarah Chen",
    role: "Care Home Manager",
    company: "Sunrise Care Group",
    rating: 5
  },
  {
    quote: "HMRC integration eliminated payroll errors completely. Our compliance is now effortless.",
    author: "David Williams",
    role: "Operations Director",
    company: "Heritage Care Homes",
    rating: 5
  },
  {
    quote: "The financial forecasting is incredible. We can predict cash flow months in advance.",
    author: "Maria Rodriguez",
    role: "Finance Director",
    company: "Caring Communities Ltd",
    rating: 5
  }
]

const industrialFeatures = [
  {
    category: "Operations Management",
    features: [
      "AI-powered staff scheduling and optimization",
      "Real-time resident care tracking and documentation",
      "Automated compliance monitoring and reporting",
      "Digital visitor management and family communication"
    ]
  },
  {
    category: "Financial Intelligence",
    features: [
      "HMRC-integrated payroll with real-time submissions",
      "AI cashflow forecasting and budget optimization",
      "Automated invoicing and payment processing", 
      "Enterprise accounting system integration"
    ]
  },
  {
    category: "Regulatory Excellence",
    features: [
      "Automated CQC inspection preparation",
      "Multi-territory compliance (England, Scotland, Wales, NI)",
      "Digital audit trails and evidence collection",
      "Regulatory deadline tracking and alerts"
    ]
  }
]

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-violet-50 py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="text-center lg:text-left">
                <div className="mb-8">
                  <span className="inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg mb-6">
                    <Building className="h-5 w-5 mr-2" />
                    Enterprise Care Home Management Platform
                  </span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                  Transform Your 
                  <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent block mt-2">
                    Care Home Operations
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-10 max-w-3xl leading-relaxed">
                  The only AI-powered platform that combines care home management, HMRC payroll integration, 
                  regulatory compliance automation, and enterprise financial planning in one comprehensive solution.
                </p>
                
                {/* Value Propositions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                  <div className="bg-white rounded-xl p-4 border border-violet-100 shadow-sm">
                    <div className="flex items-center justify-center space-x-2 text-violet-700">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-semibold text-sm">25% Cost Reduction</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
                    <div className="flex items-center justify-center space-x-2 text-green-700">
                      <Shield className="h-5 w-5" />
                      <span className="font-semibold text-sm">100% Compliance</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-center space-x-2 text-blue-700">
                      <Clock className="h-5 w-5" />
                      <span className="font-semibold text-sm">80% Time Savings</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm">
                    <div className="flex items-center justify-center space-x-2 text-orange-700">
                      <Award className="h-5 w-5" />
                      <span className="font-semibold text-sm">Enterprise Grade</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link to="/demo">
                    <Button variant="care" size="lg" className="text-lg px-10 py-5 shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto">
                      <Play className="h-6 w-6 mr-3" />
                      Watch Platform Demo
                    </Button>
                  </Link>
                  <Link to="/enterprise-features">
                    <Button variant="outline" size="lg" className="text-lg px-10 py-5 border-2 hover:bg-gray-50 w-full sm:w-auto">
                      <Building className="h-6 w-6 mr-3" />
                      Explore Enterprise Features
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Platform Stats */}
            <div className="lg:col-span-5 mt-16 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform at Scale</h3>
                <div className="grid grid-cols-2 gap-6">
                  {platformStats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold text-violet-600 mb-2">{stat.value}</div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">{stat.label}</div>
                      <div className="text-xs text-gray-600">{stat.description}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                  <div className="flex items-center justify-center text-violet-700">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Trusted by 200+ Care Homes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Capabilities Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Enterprise-Grade Care Home Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive platform designed for modern care home operations with AI automation, 
              regulatory compliance, and financial intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {enterpriseCapabilities.map((capability, index) => {
              const IconComponent = capability.icon
              return (
                <div key={index} className="group">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full">
                    <div className={`bg-gradient-to-r ${capability.gradient} p-4 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{capability.title}</h3>
                    <p className="text-gray-600 mb-4">{capability.description}</p>
                    <div className="inline-flex items-center text-sm font-semibold text-violet-600">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {capability.stats}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Trusted by Care Home Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See how WriteCareNotes transforms care home operations across the British Isles
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-sm text-violet-600 font-medium">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industrial Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Complete Care Home Management Suite
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to run modern, compliant, and profitable care home operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {industrialFeatures.map((section, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{section.category}</h3>
                <ul className="space-y-4">
                  {section.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-violet-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Care Home Operations?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
            Join hundreds of care homes already using WriteCareNotes to reduce costs, ensure compliance, 
            and deliver exceptional resident care across the British Isles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button variant="secondary" size="lg" className="text-lg px-10 py-5 w-full sm:w-auto">
                <Play className="h-6 w-6 mr-3" />
                Schedule Demo
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="text-lg px-10 py-5 border-2 border-white text-white hover:bg-white hover:text-violet-600 w-full sm:w-auto">
                <Phone className="h-6 w-6 mr-3" />
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}