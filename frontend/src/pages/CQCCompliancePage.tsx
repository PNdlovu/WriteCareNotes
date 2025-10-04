import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Shield, 
  CheckCircle, 
  FileText, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Download,
  Calendar,
  Eye,
  BarChart3
} from 'lucide-react'

const complianceFeatures = [
  {
    icon: FileText,
    title: "Automated Documentation",
    description: "Generate CQC-ready documentation automatically from care records and staff activities.",
    benefits: ["Always inspection-ready", "Reduce prep time by 90%", "Zero documentation gaps"]
  },
  {
    icon: Shield,
    title: "Compliance Monitoring",
    description: "Real-time monitoring of compliance status across all CQC fundamental standards.",
    benefits: ["Early warning alerts", "Continuous assessment", "Proactive compliance"]
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description: "Track KPIs and metrics that matter most to CQC inspectors and care quality.",
    benefits: ["Evidence-based improvements", "Trend analysis", "Benchmark comparisons"]
  },
  {
    icon: Clock,
    title: "Audit Trail Management",
    description: "Complete audit trails for all care activities, staff actions, and system changes.",
    benefits: ["Full transparency", "Regulatory compliance", "Historical tracking"]
  },
  {
    icon: Users,
    title: "Staff Training Tracking",
    description: "Monitor mandatory training completion and competency assessments.",
    benefits: ["Training compliance", "Skill gap identification", "Certification management"]
  },
  {
    icon: Award,
    title: "Quality Assurance",
    description: "Built-in quality checks and workflows to maintain high care standards.",
    benefits: ["Consistent quality", "Process standardization", "Error prevention"]
  }
]

const cqcStandards = [
  {
    standard: "Safe",
    description: "People are protected from abuse and avoidable harm",
    coverage: "100%"
  },
  {
    standard: "Effective", 
    description: "Care, treatment and support achieves good outcomes",
    coverage: "100%"
  },
  {
    standard: "Caring",
    description: "Staff involve and treat people with compassion, kindness, dignity and respect",
    coverage: "100%"
  },
  {
    standard: "Responsive",
    description: "Services are organised so they meet people's needs",
    coverage: "100%"
  },
  {
    standard: "Well-led",
    description: "Leadership, management and governance assures high-quality care",
    coverage: "100%"
  }
]

const testimonial = {
  quote: "WriteCareNotes transformed our CQC compliance from a constant worry to a strength. We went from 'Requires Improvement' to 'Outstanding' in 18 months.",
  author: "Sarah Mitchell",
  role: "Care Home Manager",
  home: "Oaklands Care Home, Somerset",
  rating: "Outstanding"
}

export const CQCCompliancePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <Shield className="h-4 w-4 mr-2" />
                CQC Compliance Solution
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Achieve 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Outstanding</span>
                <br />CQC Ratings
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Our comprehensive compliance management system helps care homes exceed 
                CQC standards and achieve Outstanding ratings through automated documentation, 
                continuous monitoring, and proactive quality management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="care">
                  Book Free Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <Download className="mr-2 h-5 w-5" />
                  Download CQC Guide
                </Button>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Outstanding Achievement</h3>
                  <p className="text-gray-600">Average rating improvement for our care homes</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">92%</div>
                    <div className="text-sm text-gray-600">Rating Improvement</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">6 Months</div>
                    <div className="text-sm text-gray-600">Average Timeline</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {cqcStandards.slice(0, 3).map((standard, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="font-medium text-gray-900">{standard.standard}</span>
                      </div>
                      <span className="text-green-600 font-medium">{standard.coverage}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CQC Standards Coverage */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Complete CQC Standards Coverage
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform addresses every aspect of the CQC's five fundamental standards, 
              ensuring comprehensive compliance and continuous improvement.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-5 gap-6">
            {cqcStandards.map((standard, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{standard.standard}</h3>
                  <p className="text-sm text-gray-600 mb-4">{standard.description}</p>
                  <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {standard.coverage} Coverage
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Comprehensive Compliance Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to maintain Outstanding CQC compliance, from automated 
              documentation to real-time monitoring and quality assurance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {complianceFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Your Path to Outstanding
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our proven methodology has helped care homes achieve Outstanding ratings 
              in an average of 6 months.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Assessment",
                description: "Comprehensive audit of current compliance status and identification of improvement areas.",
                icon: Eye
              },
              {
                step: "2", 
                title: "Implementation",
                description: "Deploy WriteCareNotes with customized workflows and compliance frameworks.",
                icon: FileText
              },
              {
                step: "3",
                title: "Monitoring",
                description: "Continuous tracking of compliance metrics with real-time alerts and reporting.",
                icon: BarChart3
              },
              {
                step: "4",
                title: "Excellence",
                description: "Achieve and maintain Outstanding ratings through ongoing optimization.",
                icon: Award
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4 mr-2" />
            CQC Outstanding Achievement
          </div>
          <blockquote className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
            "{testimonial.quote}"
          </blockquote>
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">SM</span>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">{testimonial.author}</div>
              <div className="text-gray-600">{testimonial.role}</div>
              <div className="text-sm text-gray-500">{testimonial.home}</div>
              <div className="inline-flex items-center mt-1">
                <span className="text-green-600 font-medium text-sm mr-2">CQC Rating:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  {testimonial.rating}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Achieve Outstanding?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of care homes that have transformed their CQC compliance 
            and achieved Outstanding ratings with WriteCareNotes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Calendar className="mr-2 h-5 w-5" />
              Book Free Assessment
            </Button>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Watch Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-6">
            Free 30-day trial • No setup fees • CQC compliance guarantee
          </p>
        </div>
      </section>
    </div>
  )
}