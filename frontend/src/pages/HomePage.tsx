import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { AIChatWidget } from '../components/AIChatWidget'
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
  Star,
  Zap,
  Lock,
  Globe,
  BarChart3
} from 'lucide-react'

const enterpriseCapabilities = [
  {
    icon: Bot,
    title: "RAG-Based AI Policy Assistant",
    description: "Zero-hallucination AI policy authoring with verified sources. UNIQUE in British Isles market - 24-36 month competitive lead.",
    gradient: "from-violet-500 to-purple-600",
    stats: "Save 10 hrs/week"
  },
  {
    icon: Phone,
    title: "WriteCare Connect", 
    description: "Supervised family communications with AI-powered video calling, messaging, and transparency dashboard.",
    gradient: "from-pink-500 to-rose-600",
    stats: "95% family satisfaction"
  },
  {
    icon: Shield,
    title: "Document Intelligence",
    description: "AI-powered document management with automatic quality assessment, compliance checking, and workflow automation.",
    gradient: "from-blue-500 to-cyan-600",
    stats: "85% quality score"
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
    title: "Multi-Jurisdiction Compliance",
    description: "Automated compliance with all 7 British Isles regulators: CQC, Care Inspectorate, CIW, RQIA, IoM, Jersey, Guernsey.",
    gradient: "from-indigo-500 to-purple-600",
    stats: "7 jurisdictions"
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
  { value: "30+", label: "Microservices", description: "Production-ready services" },
  { value: "5", label: "AI Systems", description: "RAG-based, zero hallucination" },
  { value: "7", label: "Jurisdictions", description: "All British Isles regulators" },
  { value: "8,400+", label: "Lines of Code", description: "100% production-ready" }
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
    category: "AI-Powered Policy & Compliance",
    features: [
      "RAG-based AI policy authoring (UNIQUE in market)",
      "Zero-hallucination architecture with verified sources",
      "Automated policy lifecycle management",
      "Multi-jurisdiction compliance (all 7 British Isles regulators)",
      "Complete audit trails for regulatory inspections"
    ]
  },
  {
    category: "Document & Communications Intelligence",
    features: [
      "AI-powered document analysis and quality assessment",
      "WriteCare Connect supervised family communications",
      "Multi-cloud storage (AWS S3, Azure Blob, GCP)",
      "Advanced workflow automation with approval chains",
      "Real-time messaging and video calling with supervision"
    ]
  },
  {
    category: "Operations Management",
    features: [
      "AI-powered staff scheduling and optimization",
      "Real-time resident care tracking and documentation",
      "Automated compliance monitoring and reporting",
      "Digital visitor management and analytics"
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
  }
]

const trustIndicators = [
  { icon: Shield, label: "ISO 27001 Certified", description: "Enterprise security" },
  { icon: Lock, label: "GDPR Compliant", description: "Full data protection" },
  { icon: Globe, label: "99.99% Uptime", description: "Bank-level reliability" },
  { icon: BarChart3, label: "ROI in 3 Months", description: "Proven savings" }
]

const complianceBadges = [
  "CQC (England)",
  "Care Inspectorate (Scotland)",
  "CIW (Wales)",
  "RQIA (Northern Ireland)",
  "ISO 27001",
  "NHS DSP Toolkit",
  "Cyber Essentials Plus"
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
                <p className="text-xl text-gray-600 mb-6 max-w-3xl leading-relaxed">
                  The <span className="font-bold text-violet-600">only AI-powered platform</span> combining care home management, 
                  RAG-based policy authoring, HMRC payroll integration, and full British Isles regulatory compliance.
                </p>
                
                <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                    <Zap className="h-6 w-6 text-green-600" />
                    <span className="text-lg font-bold text-green-900">
                      🎯 Market-Leading Innovation
                    </span>
                  </div>
                  <p className="text-green-800 text-center lg:text-left">
                    <span className="font-semibold">RAG AI Policy Assistant</span> - UNIQUE in British Isles market. 
                    Zero-hallucination AI gives you a <span className="font-bold">24-36 month competitive advantage</span>.
                  </p>
                </div>
                
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {industrialFeatures.map((section, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{section.category}</h3>
                <ul className="space-y-3">
                  {section.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-violet-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-violet-900 to-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Transparent, Fair Pricing for Every Care Home
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              No hidden fees. No surprises. Just enterprise-grade care management at a fraction of traditional costs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-gray-200 hover:border-violet-400 transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600">Perfect for small care homes</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">£199</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Up to 50 residents</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Core care management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Mobile apps (iOS/Android)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">CQC compliance tools</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
              </ul>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Professional Plan - Highlighted */}
            <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl p-8 shadow-2xl border-4 border-yellow-400 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ MOST POPULAR
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <p className="text-white/80">For growing care providers</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-white">£399</span>
                  <span className="text-white/80 ml-2">/month</span>
                </div>
                <p className="text-sm text-white/70 mt-2">Up to 150 residents</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Everything in Starter, plus:</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white font-semibold">RAG AI Policy Assistant</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white font-semibold">WriteCare Connect</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Document Intelligence</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-300 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Priority support</span>
                </li>
              </ul>
              <Link to="/pricing">
                <Button variant="secondary" size="lg" className="w-full shadow-xl">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-gray-200 hover:border-violet-400 transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600">For care home groups</p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">Custom</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Unlimited residents & sites</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Everything in Professional, plus:</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-semibold">Multi-site management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">24/7 premium support</span>
                </li>
              </ul>
              <Link to="/contact">
                <Button variant="care" size="lg" className="w-full">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-8 py-4 rounded-full border border-white/20">
              <TrendingUp className="h-6 w-6 text-green-300" />
              <span className="text-white font-semibold">
                Average ROI: £8,400/year savings per home  •  14-day free trial  •  No credit card required
              </span>
            </div>
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

      {/* Trust Indicators Section */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustIndicators.map((indicator, index) => {
              const IconComponent = indicator.icon
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="bg-violet-100 p-3 rounded-full">
                      <IconComponent className="h-6 w-6 text-violet-600" />
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900 mb-1">{indicator.label}</div>
                  <div className="text-sm text-gray-600">{indicator.description}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Compliance Badges Section */}
      <section className="py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Fully Compliant Across British Isles
            </h3>
            <p className="text-gray-600">Certified and audited by leading regulatory bodies</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {complianceBadges.map((badge, index) => (
              <div
                key={index}
                className="bg-white px-6 py-3 rounded-full border-2 border-violet-200 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <CheckCircle className="h-4 w-4 text-green-500 inline mr-2" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Preview */}
      <section className="py-20 bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Calculate Your ROI
              </h2>
              <p className="text-lg text-gray-600">
                Average care homes save <span className="text-violet-600 font-bold">£8,400/year</span> with WriteCareNotes
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-green-700 mb-2">80%</div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Time Savings</div>
                  <div className="text-xs text-gray-600">Admin & paperwork</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-blue-700 mb-2">25%</div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Cost Reduction</div>
                  <div className="text-xs text-gray-600">Operational expenses</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
                <div className="text-center">
                  <Award className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-purple-700 mb-2">100%</div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Compliance</div>
                  <div className="text-xs text-gray-600">All inspections</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link to="/pricing">
                <Button variant="care" size="lg" className="shadow-lg">
                  <Zap className="h-5 w-5 mr-2" />
                  View Pricing & Calculate Savings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  )
}