import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Shield, FileCheck, AlertTriangle, BarChart3, Users, Star } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const complianceAreas = [
  {
    title: 'Safe Care and Treatment',
    regulation: 'Regulation 12',
    description: 'Ensure safe administration of medicines and proper care procedures',
    features: [
      'Medication administration tracking',
      'Risk assessment management',
      'Infection control monitoring',
      'Safe environment checks',
      'Equipment maintenance logs'
    ],
    icon: Shield
  },
  {
    title: 'Safeguarding Service Users',
    regulation: 'Regulation 13',
    description: 'Protect residents from abuse and improper treatment',
    features: [
      'Safeguarding incident reporting',
      'Staff training records',
      'Background check tracking',
      'Vulnerability assessments',
      'Multi-agency collaboration tools'
    ],
    icon: Users
  },
  {
    title: 'Good Governance',
    regulation: 'Regulation 17',
    description: 'Maintain proper records and quality assurance systems',
    features: [
      'Audit trail management',
      'Quality monitoring dashboards',
      'Policy and procedure tracking',
      'Staff competency records',
      'Continuous improvement tools'
    ],
    icon: FileCheck
  },
  {
    title: 'Staffing',
    regulation: 'Regulation 18',
    description: 'Ensure adequate staffing levels and appropriate skills',
    features: [
      'Staff-to-resident ratio monitoring',
      'Skills gap analysis',
      'Training compliance tracking',
      'Recruitment record management',
      'Performance monitoring'
    ],
    icon: Users
  }
]

const features = [
  {
    title: 'Real-time Compliance Monitoring',
    description: 'Continuous monitoring of all CQC requirements with instant alerts',
    icon: AlertTriangle,
    benefits: [
      'Live compliance dashboard',
      'Automated alert system',
      'Risk identification',
      'Proactive issue resolution',
      'Real-time reporting'
    ]
  },
  {
    title: 'Automated Report Generation',
    description: 'Generate CQC-ready reports with a single click',
    icon: FileCheck,
    benefits: [
      'CQC inspection reports',
      'Quality assurance summaries',
      'Compliance certificates',
      'Audit trail documentation',
      'Evidence packages'
    ]
  },
  {
    title: 'Quality Assurance Workflows',
    description: 'Structured workflows to maintain high standards',
    icon: BarChart3,
    benefits: [
      'Quality checks scheduling',
      'Corrective action tracking',
      'Performance benchmarking',
      'Continuous improvement cycles',
      'Best practice sharing'
    ]
  }
]

const stats = [
  { label: 'Average CQC Rating Improvement', value: '1.8 Points' },
  { label: 'Compliance Rate Achieved', value: '99.8%' },
  { label: 'Time Saved on Admin', value: '40%' },
  { label: 'Successful Inspections', value: '98.5%' }
]

const testimonials = [
  {
    quote: "Since implementing WriteCareNotes, we've achieved an 'Outstanding' CQC rating. The compliance features are second to none.",
    author: "Helen Richardson",
    role: "Quality Manager",
    facility: "Meadowbrook Care Home",
    rating: "Outstanding"
  },
  {
    quote: "The automated compliance monitoring has transformed our approach to quality assurance. We catch issues before they become problems.",
    author: "Dr. James Mitchell",
    role: "Clinical Director",
    facility: "Sunnydale Residential Care",
    rating: "Good"
  }
]

export function CQCCompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-green-600 font-semibold">CQC Compliance</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Automated CQC Compliance Made Simple
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                Stay ahead of CQC requirements with our comprehensive compliance management system. 
                Automated monitoring, instant alerts, and inspection-ready reports ensure you're 
                always prepared for regulatory visits.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link to="/demo">
                    Book a Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact">Talk to Compliance Expert</Link>
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Shield className="h-5 w-5 text-green-500 mr-2" />
                CQC Success Metrics
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Regulations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive CQC Regulation Coverage
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform covers all essential CQC regulations, ensuring complete compliance across your care home
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {complianceAreas.map((area, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start mb-6">
                  <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                    <area.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {area.title}
                    </h3>
                    <div className="text-sm text-green-600 font-semibold mb-2">
                      {area.regulation}
                    </div>
                    <p className="text-gray-600">
                      {area.description}
                    </p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {area.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Advanced Compliance Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed to simplify compliance management and ensure regulatory readiness
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-green-600" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {feature.description}
                </p>
                
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspection Readiness Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Always Inspection Ready
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our platform ensures you're always prepared for CQC inspections with comprehensive 
                documentation, evidence packages, and compliance reports available at a moment's notice.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Instant Evidence Packages</h4>
                    <p className="text-gray-600">Generate comprehensive evidence packages for any CQC regulation within seconds</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Compliance Score Tracking</h4>
                    <p className="text-gray-600">Monitor your compliance score across all regulations with real-time updates</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Action Plan Generation</h4>
                    <p className="text-gray-600">Automatic generation of improvement action plans based on compliance gaps</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Inspection Preparation Checklist</h3>
              <div className="space-y-4">
                {[
                  'Documentation review completed',
                  'Staff training records up to date',
                  'Quality assurance checks current',
                  'Risk assessments validated',
                  'Incident reports documented',
                  'Medication records verified',
                  'Safeguarding procedures confirmed',
                  'Governance systems operational'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">98.5%</div>
                  <div className="text-sm text-gray-600">Inspection Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              CQC Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              See how our compliance platform has helped care homes achieve outstanding ratings
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="flex mr-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    testimonial.rating === 'Outstanding' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    CQC Rating: {testimonial.rating}
                  </span>
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  <div className="text-gray-500 text-sm">{testimonial.facility}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Achieve Outstanding CQC Compliance
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of care homes that have improved their CQC ratings with our compliance platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/demo">
                Book Compliance Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600" asChild>
              <Link to="/contact">Speak to Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}