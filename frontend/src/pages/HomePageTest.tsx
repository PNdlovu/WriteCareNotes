import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  CheckCircle, 
  Heart, 
  Shield, 
  Users, 
  BarChart3, 
  Star,
  Play,
  Award,
  Clock,
  Phone
} from 'lucide-react'

export function HomePageTest() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-8">
              <Award className="w-4 h-4 mr-2" />
              #1 Care Home Management Platform in the UK
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Transform Your 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Care Home</span>
              <br />
              Operations
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              The all-in-one platform that streamlines care home management, ensures CQC compliance, 
              and delivers exceptional resident care. Trusted by over 2,500 care homes across the UK.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link 
                to="/demo"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-lg shadow-xl hover:shadow-2xl"
              >
                <Play className="mr-2 h-6 w-6" />
                Watch Demo
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
              <Link 
                to="/solutions"
                className="inline-flex items-center border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all font-semibold text-lg"
              >
                Explore Solutions
              </Link>
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
                24/7 Support Included
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                No Setup Fees
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Proven Results Across the Industry
            </h2>
            <p className="text-xl text-gray-600">
              See the measurable impact WriteCareNotes has on care home operations
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-4">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  2,500+
                </div>
                <div className="text-gray-600 font-medium">
                  Care Homes Using Our Platform
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 mb-4">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  1.8
                </div>
                <div className="text-gray-600 font-medium">
                  Average CQC Rating Improvement
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-4">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  40%
                </div>
                <div className="text-gray-600 font-medium">
                  Time Saved on Admin Tasks
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 mb-4">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  98.5%
                </div>
                <div className="text-gray-600 font-medium">
                  Customer Satisfaction Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From resident care to regulatory compliance, WriteCareNotes provides all the tools 
              you need to run a successful care home operation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Care Management</h3>
              <p className="text-gray-600">
                Comprehensive resident care planning, medication tracking, and health monitoring
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">CQC Compliance</h3>
              <p className="text-gray-600">
                Automated compliance monitoring and reporting to maintain outstanding ratings
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Staff Management</h3>
              <p className="text-gray-600">
                Scheduling, training tracking, and performance management for your entire team
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Analytics & Insights</h3>
              <p className="text-gray-600">
                Real-time dashboards and reporting to optimize your care home operations
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/solutions"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-lg"
            >
              View All Solutions
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonial */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-16">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Trusted by Care Home Leaders
              </h2>
              <p className="text-xl text-gray-600">
                See what care home managers are saying about WriteCareNotes
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-8 w-8 text-yellow-500 fill-current" />
                ))}
              </div>
              <blockquote className="text-2xl md:text-3xl text-gray-900 mb-8 italic leading-relaxed">
                "Since implementing WriteCareNotes, our CQC rating improved from 'Requires Improvement' 
                to 'Outstanding' within 18 months. The platform has transformed how we manage care, 
                compliance, and communication with families."
              </blockquote>
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                  ST
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">Sarah Thompson</div>
                  <div className="text-gray-600">Care Home Manager, Oakwood Manor</div>
                  <div className="text-sm text-gray-500">120 residents • West Yorkshire</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium mb-6">
              <Clock className="w-4 h-4 mr-2" />
              Ready to Get Started?
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
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
            <Link 
              to="/demo"
              className="inline-flex items-center bg-white text-blue-600 px-10 py-4 rounded-xl hover:bg-gray-100 transition-all font-semibold text-lg shadow-xl"
            >
              <Play className="mr-2 h-6 w-6" />
              Book a Demo
              <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
            <Link 
              to="/contact"
              className="inline-flex items-center border-2 border-white text-white px-10 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-all font-semibold text-lg"
            >
              <Phone className="mr-2 h-6 w-6" />
              Contact Sales
            </Link>
          </div>
          
          {/* Additional trust signals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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