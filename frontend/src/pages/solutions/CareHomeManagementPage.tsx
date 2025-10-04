import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Heart, Users, Clock, FileText, Shield, Phone, BarChart3, Star } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const features = [
  {
    title: 'Resident Management',
    description: 'Complete resident profiles with medical history, care plans, and family contacts',
    icon: Users,
    benefits: [
      'Digital resident records',
      'Medical history tracking',
      'Family contact management',
      'Emergency information access',
      'Dietary requirements tracking'
    ]
  },
  {
    title: 'Care Planning',
    description: 'Create and manage personalized care plans for each resident',
    icon: FileText,
    benefits: [
      'Individual care plan creation',
      'Goal setting and tracking',
      'Review scheduling',
      'Multi-disciplinary input',
      'Progress monitoring'
    ]
  },
  {
    title: 'Staff Scheduling',
    description: 'Efficient staff scheduling and roster management',
    icon: Clock,
    benefits: [
      'Automated shift scheduling',
      'Skills-based assignments',
      'Holiday and absence management',
      'Overtime tracking',
      'Mobile roster access'
    ]
  },
  {
    title: 'Medication Management',
    description: 'Safe and compliant medication administration tracking',
    icon: Shield,
    benefits: [
      'Digital medication records',
      'Administration reminders',
      'Prescription tracking',
      'Allergy warnings',
      'Audit trail maintenance'
    ]
  },
  {
    title: 'Communication Hub',
    description: 'Streamlined communication between staff, residents, and families',
    icon: Phone,
    benefits: [
      'Internal messaging system',
      'Family portal access',
      'Update notifications',
      'Emergency communications',
      'Multi-channel support'
    ]
  },
  {
    title: 'Reporting & Analytics',
    description: 'Comprehensive reporting and data analytics',
    icon: BarChart3,
    benefits: [
      'Operational dashboards',
      'Compliance reports',
      'Performance metrics',
      'Custom report builder',
      'Data export capabilities'
    ]
  }
]

const benefits = [
  'Reduce administrative time by up to 40%',
  'Improve resident satisfaction scores',
  'Enhance staff productivity and engagement',
  'Maintain 99.8% CQC compliance rate',
  'Streamline family communication',
  'Reduce medication errors by 85%'
]

const testimonials = [
  {
    quote: "The care home management system has transformed our daily operations. We've seen a significant improvement in our CQC ratings.",
    author: "Margaret Johnson",
    role: "Care Home Manager",
    facility: "Riverside Care Home"
  },
  {
    quote: "Staff scheduling has never been easier. The system automatically handles complex requirements and saves us hours each week.",
    author: "David Chen",
    role: "Operations Director",
    facility: "Golden Years Care"
  }
]

export function CareHomeManagementPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="text-blue-600 font-semibold">Care Home Management</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Complete Operational Management for Modern Care Homes
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                Streamline every aspect of your care home operations with our comprehensive 
                management platform. From resident care to staff scheduling, manage it all 
                from one integrated system.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
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
            
            <div className="bg-white rounded-lg shadow-xl p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Benefits</h3>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Management Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to run a successful care home, integrated into one powerful platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
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

      {/* Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Seamless Integration with Your Existing Systems
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our care home management system integrates with your existing tools and workflows, 
                ensuring a smooth transition and minimal disruption to your operations.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Healthcare Systems</h4>
                  <p className="text-gray-600 text-sm">Connects with NHS systems, GP practices, and pharmacies</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Financial Software</h4>
                  <p className="text-gray-600 text-sm">Integrates with accounting and payroll systems</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Communication Tools</h4>
                  <p className="text-gray-600 text-sm">Works with existing phone and messaging systems</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Security Systems</h4>
                  <p className="text-gray-600 text-sm">Compatible with access control and CCTV systems</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Implementation Process</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Assessment & Planning</h4>
                    <p className="text-gray-600 text-sm">We analyze your current setup and create a customized implementation plan</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Data Migration</h4>
                    <p className="text-gray-600 text-sm">Secure transfer of your existing data to our platform</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Training & Go-Live</h4>
                    <p className="text-gray-600 text-sm">Comprehensive staff training and support during launch</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Hear from care home managers who have transformed their operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
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
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Care Home Management?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of care homes already using our platform to deliver exceptional care
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/demo">
                Book a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}