import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Star, Users, Shield, FileText, BarChart3, Heart, Phone, Clock, Award, TrendingUp, Zap } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const solutions = [
  {
    id: 'care-home',
    title: 'Care Home Management',
    description: 'Complete operational management system for modern care homes',
    features: [
      'Comprehensive resident management',
      'Staff scheduling and roster management',
      'Medication administration tracking',
      'Incident reporting and documentation',
      'Family communication portal',
      'Financial management integration'
    ],
    icon: Heart,
    color: 'bg-blue-500',
    href: '/solutions/care-home'
  },
  {
    id: 'compliance',
    title: 'CQC Compliance',
    description: 'Automated regulatory compliance monitoring and reporting',
    features: [
      'Real-time compliance monitoring',
      'Automated CQC report generation',
      'Quality assurance workflows',
      'Audit trail management',
      'Risk assessment tools',
      'Regulatory update notifications'
    ],
    icon: Shield,
    color: 'bg-green-500',
    href: '/solutions/compliance'
  },
  {
    id: 'staff',
    title: 'Staff Management',
    description: 'Comprehensive workforce management and training platform',
    features: [
      'Staff scheduling and rotas',
      'Training and certification tracking',
      'Performance management',
      'Time and attendance monitoring',
      'Skills gap analysis',
      'Workforce analytics'
    ],
    icon: Users,
    color: 'bg-purple-500',
    href: '/solutions/staff'
  },
  {
    id: 'residents',
    title: 'Resident Care Plans',
    description: 'Personalized care planning and resident management',
    features: [
      'Individual care plan creation',
      'Health monitoring and tracking',
      'Medication management',
      'Activity and engagement tracking',
      'Family communication',
      'Progress reporting'
    ],
    icon: FileText,
    color: 'bg-orange-500',
    href: '/solutions/residents'
  },
  {
    id: 'family',
    title: 'Family Portal',
    description: 'Secure communication platform for families and care homes',
    features: [
      'Real-time updates and notifications',
      'Photo and video sharing',
      'Visit scheduling',
      'Care plan visibility',
      'Billing and payment access',
      'Feedback and communication tools'
    ],
    icon: Phone,
    color: 'bg-pink-500',
    href: '/solutions/family'
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    description: 'Advanced analytics and business intelligence for care homes',
    features: [
      'Operational dashboards',
      'Financial reporting',
      'Quality metrics tracking',
      'Occupancy and capacity planning',
      'Predictive analytics',
      'Custom report builder'
    ],
    icon: BarChart3,
    color: 'bg-indigo-500',
    href: '/solutions/analytics'
  }
]

const benefits = [
  {
    title: 'Streamlined Operations',
    description: 'Reduce administrative burden and focus on resident care',
    icon: CheckCircle
  },
  {
    title: 'Regulatory Compliance',
    description: 'Stay compliant with CQC requirements automatically',
    icon: Shield
  },
  {
    title: 'Enhanced Communication',
    description: 'Improve communication between staff, residents, and families',
    icon: Phone
  },
  {
    title: 'Data-Driven Decisions',
    description: 'Make informed decisions with comprehensive analytics',
    icon: BarChart3
  }
]

const stats = [
  { label: 'Care Homes Using Our Platform', value: '2,500+' },
  { label: 'Average CQC Rating Improvement', value: '1.8 Points' },
  { label: 'Time Saved on Admin Tasks', value: '40%' },
  { label: 'Customer Satisfaction Rate', value: '98.5%' }
]

export function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
              <Award className="w-4 h-4 mr-2" />
              Trusted by 2,500+ Care Homes Across the UK
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Complete Care Home
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Solutions</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Transform your care home operations with our integrated platform. 
              <br className="hidden md:block" />
              <strong>Streamline workflows, ensure compliance, and deliver exceptional resident care.</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4" asChild>
                <Link to="/demo">
                  <Zap className="mr-2 h-5 w-5" />
                  Book a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-2" asChild>
                <Link to="/contact">
                  <Phone className="mr-2 h-5 w-5" />
                  Talk to Sales
                </Link>
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                CQC Approved Platform
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                GDPR Compliant
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Proven Results Across the Industry
            </h2>
            <p className="text-xl text-gray-600">
              See the impact of our platform on care home operations
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 group-hover:from-blue-100 group-hover:to-purple-100 transition-all duration-300">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Solutions Grid */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4 mr-2" />
              Comprehensive Solution Suite
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need in
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> One Platform</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              From resident care to regulatory compliance, our integrated solutions work together 
              to streamline every aspect of your care home operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution) => (
              <div
                key={solution.id}
                className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`${solution.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <solution.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {solution.title}
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {solution.description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {solution.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  asChild 
                  className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300"
                >
                  <Link to={solution.href}>
                    Explore Solution
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
          
          {/* Integration highlight */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto border border-blue-100">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Seamlessly Integrated Platform
              </h3>
              <p className="text-gray-600 text-lg">
                All solutions work together as one unified platform. No more juggling multiple systems – 
                everything you need is connected and accessible from a single dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4 mr-2" />
              Key Benefits
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose 
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> WriteCareNotes</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Our integrated platform delivers measurable benefits across all aspects of care home operations, 
              helping you provide better care while reducing administrative burden.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-blue-50 to-green-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-blue-100 group-hover:to-green-100 transition-all duration-300 group-hover:scale-110">
                  <benefit.icon className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonial Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2" />
              Customer Success Story
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Care Home
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent"> Leaders</span>
            </h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-16 relative">
            <div className="absolute top-6 left-6 text-6xl text-blue-100 font-serif">"</div>
            
            <div className="flex justify-center mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-8 w-8 text-yellow-500 fill-current" />
              ))}
            </div>
            
            <blockquote className="text-2xl md:text-3xl text-gray-900 mb-12 italic text-center leading-relaxed">
              "WriteCareNotes has revolutionized our care home operations. The integrated solutions 
              have streamlined our workflows, improved compliance, and enhanced the quality of care 
              we provide to our residents. Our CQC rating improved from 'Requires Improvement' to 'Outstanding' 
              within 18 months."
            </blockquote>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                ST
              </div>
              <div className="text-xl font-bold text-gray-900">Sarah Thompson</div>
              <div className="text-gray-600 mb-2">Care Home Manager</div>
              <div className="text-blue-600 font-semibold">Oakwood Manor Care Home</div>
              <div className="text-sm text-gray-500 mt-2">120 residents • West Yorkshire</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        {/* Background patterns */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium mb-6">
              <Clock className="w-4 h-4 mr-2" />
              Ready to Get Started?
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Transform Your Care Home
              <br />
              <span className="text-yellow-300">Starting Today</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
              Join thousands of care homes already using WriteCareNotes to deliver exceptional care, 
              streamline operations, and achieve outstanding CQC ratings.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-4 font-semibold shadow-xl" 
              asChild
            >
              <Link to="/demo">
                <Zap className="mr-2 h-6 w-6" />
                Book a Demo
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-10 py-4 font-semibold" 
              asChild
            >
              <Link to="/contact">
                <Phone className="mr-2 h-6 w-6" />
                Contact Sales
              </Link>
            </Button>
          </div>
          
          {/* Additional trust signals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">30-Day</div>
              <div className="text-white/80">Free Trial</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/80">Support Included</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">No Setup</div>
              <div className="text-white/80">Fees</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}