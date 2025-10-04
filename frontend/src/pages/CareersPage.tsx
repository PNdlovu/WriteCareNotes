import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Heart, 
  Shield, 
  Users, 
  MapPin, 
  Clock, 
  Banknote,
  ArrowRight,
  Building,
  Monitor,
  Stethoscope,
  Headphones,
  Code,
  BarChart3,
  Mail
} from 'lucide-react'

const benefits = [
  {
    icon: Heart,
    title: "Meaningful Work",
    description: "Make a real difference in care home operations across the British Isles"
  },
  {
    icon: Shield,
    title: "Comprehensive Benefits",
    description: "Health insurance, pension contributions, and wellbeing support"
  },
  {
    icon: Clock,
    title: "Flexible Working",
    description: "Hybrid working options and flexible hours to support work-life balance"
  },
  {
    icon: Users,
    title: "Career Development",
    description: "Continuous learning opportunities and clear progression pathways"
  }
]

const openPositions = [
  {
    id: 1,
    title: "Senior Care Software Developer",
    department: "Engineering",
    location: "London, England (Hybrid)",
    type: "Full-time",
    icon: Code,
    description: "Join our development team building the next generation of care home management software. Experience with healthcare systems preferred.",
    requirements: [
      "5+ years experience in software development",
      "Experience with React, TypeScript, and Node.js",
      "Understanding of healthcare compliance requirements",
      "Passion for improving care outcomes"
    ],
    salary: "£60,000 - £80,000"
  },
  {
    id: 2,
    title: "Care Operations Specialist", 
    department: "Customer Success",
    location: "Edinburgh, Scotland",
    type: "Full-time",
    icon: Stethoscope,
    description: "Support care homes with implementation and ongoing optimization of our platform. Must have residential care experience.",
    requirements: [
      "3+ years experience in residential care management",
      "Understanding of CQC regulations and compliance",
      "Strong communication and training skills",
      "Registered Care Manager qualification preferred"
    ],
    salary: "£40,000 - £50,000"
  },
  {
    id: 3,
    title: "Customer Support Manager",
    department: "Support",
    location: "Cardiff, Wales (Hybrid)",
    type: "Full-time", 
    icon: Headphones,
    description: "Lead our customer support team providing technical assistance to care home professionals. Healthcare background essential.",
    requirements: [
      "Leadership experience in customer support",
      "Background in healthcare or social care",
      "Experience with technical support systems",
      "Excellent problem-solving skills"
    ],
    salary: "£45,000 - £55,000"
  },
  {
    id: 4,
    title: "Business Development Executive",
    department: "Sales",
    location: "Belfast, Northern Ireland",
    type: "Full-time",
    icon: BarChart3,
    description: "Drive growth by building relationships with care home groups across Northern Ireland. Care sector knowledge required.",
    requirements: [
      "B2B sales experience, preferably in healthcare",
      "Understanding of care home operations",
      "Strong relationship building skills",
      "Knowledge of Northern Ireland care sector"
    ],
    salary: "£35,000 - £45,000 + commission"
  },
  {
    id: 5,
    title: "UI/UX Designer",
    department: "Design",
    location: "Remote (UK)",
    type: "Full-time",
    icon: Monitor,
    description: "Design intuitive interfaces for care professionals. Experience with accessibility and healthcare design patterns preferred.",
    requirements: [
      "3+ years experience in UI/UX design",
      "Portfolio demonstrating complex application design",
      "Understanding of accessibility requirements",
      "Experience with design systems"
    ],
    salary: "£45,000 - £60,000"
  },
  {
    id: 6,
    title: "Quality Assurance Analyst",
    department: "Engineering",
    location: "Manchester, England (Hybrid)",
    type: "Full-time",
    icon: Shield,
    description: "Ensure our platform meets the highest quality standards for care home operations. Healthcare testing experience valued.",
    requirements: [
      "Experience in software quality assurance",
      "Understanding of healthcare compliance testing",
      "Knowledge of automated testing tools",
      "Attention to detail and process improvement"
    ],
    salary: "£35,000 - £45,000"
  }
]

const values = [
  {
    title: "Care-Centered Innovation",
    description: "Everything we build starts with improving resident care and supporting the professionals who provide it."
  },
  {
    title: "Collaborative Excellence",
    description: "We work together across disciplines and locations to deliver the best possible outcomes for our customers."
  },
  {
    title: "Continuous Learning",
    description: "The care sector evolves constantly, and so do we. We invest in our team's growth and development."
  },
  {
    title: "Inclusive Community",
    description: "We build diverse teams that reflect the communities we serve across the British Isles."
  }
]

export const CareersPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-white to-blue-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              <Heart className="h-4 w-4 mr-2" />
              Join Our Mission to Transform Care
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Build Technology That 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> Changes Lives</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join a passionate team dedicated to transforming care home operations across 
              the British Isles. Work on meaningful projects that directly impact the quality 
              of life for thousands of residents and their families.
            </p>
            
            {/* Company Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">500+</div>
                <div className="text-sm text-gray-600">Care Homes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">50k+</div>
                <div className="text-sm text-gray-600">Residents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">95%</div>
                <div className="text-sm text-gray-600">Outstanding CQC</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">4.9/5</div>
                <div className="text-sm text-gray-600">Employee Rating</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="care" size="xl">
                View Open Positions
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="xl">
                <Building className="mr-2 h-5 w-5" />
                Learn About Our Culture
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Work at WriteCareNotes?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just building software – we're improving the lives of residents 
              and supporting the dedicated professionals who care for them.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600">
              The principles that guide our work and define our culture
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Open Positions
            </h2>
            <p className="text-xl text-gray-600">
              Join our team and help us transform care home operations
            </p>
          </div>
          
          <div className="space-y-8">
            {openPositions.map((position) => (
              <div key={position.id} className="bg-gray-50 rounded-xl p-8 hover:shadow-md transition-shadow">
                <div className="lg:flex lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                        <position.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {position.title}
                          </h3>
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            {position.department}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {position.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {position.type}
                          </div>
                          <div className="flex items-center">
                            <Banknote className="h-4 w-4 mr-1" />
                            {position.salary}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4">
                          {position.description}
                        </p>
                        
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Key Requirements:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {position.requirements.map((req, index) => (
                              <li key={index} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 lg:mt-0 lg:ml-8">
                    <Link to={`/contact?position=${position.id}`}>
                      <Button variant="care" size="lg">
                        Apply Now
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & Perks */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Benefits & Perks
            </h2>
            <p className="text-xl text-gray-600">
              We invest in our team's wellbeing and professional growth
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Shield className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Health & Wellbeing
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Comprehensive health insurance</li>
                <li>• Mental health support</li>
                <li>• Annual health assessments</li>
                <li>• Wellness programs</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Banknote className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Financial Security
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Competitive salary packages</li>
                <li>• Pension contributions</li>
                <li>• Performance bonuses</li>
                <li>• Share options program</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Clock className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Work-Life Balance
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Flexible working hours</li>
                <li>• Hybrid work options</li>
                <li>• 25 days annual leave</li>
                <li>• Sabbatical opportunities</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Users className="h-8 w-8 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Professional Growth
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Learning & development budget</li>
                <li>• Conference attendance</li>
                <li>• Internal mentorship</li>
                <li>• Career progression plans</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Building className="h-8 w-8 text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Office Environment
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Modern office spaces</li>
                <li>• Free refreshments</li>
                <li>• Team social events</li>
                <li>• Ergonomic workstations</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Heart className="h-8 w-8 text-pink-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Community Impact
              </h3>
              <ul className="text-gray-600 space-y-1 text-sm">
                <li>• Volunteer time off</li>
                <li>• Charity matching</li>
                <li>• Community partnerships</li>
                <li>• Care sector involvement</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Application Process
            </h2>
            <p className="text-xl text-gray-600">
              A transparent and respectful process designed to find the right fit
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Application
              </h3>
              <p className="text-gray-600 text-sm">
                Submit your application through our contact form or email directly
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Initial Review
              </h3>
              <p className="text-gray-600 text-sm">
                Our team reviews your application and provides feedback within 5 days
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Interviews
              </h3>
              <p className="text-gray-600 text-sm">
                Meet the team through video calls and in-person meetings as appropriate
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Decision
              </h3>
              <p className="text-gray-600 text-sm">
                We make our decision and provide detailed feedback to all candidates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Don't see the perfect role? We're always looking for talented people 
            who share our passion for improving care home operations and transforming lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                Send Us Your CV
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="xl" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-green-600">
              <Mail className="mr-2 h-5 w-5" />
              careers@writecarenotes.co.uk
            </Button>
          </div>
          <p className="text-green-100 text-sm mt-6">
            Equal opportunities employer • Remote-friendly • Great benefits package
          </p>
        </div>
      </section>
    </div>
  )
}