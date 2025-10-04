import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Users, 
  Clock, 
  Calendar, 
  Shield, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Award,
  ArrowRight,
  UserPlus,
  FileText,
  Target,
  BarChart3,
  Star
} from 'lucide-react'

const staffFeatures = [
  {
    icon: Users,
    title: "Staff Scheduling",
    description: "Intelligent shift planning that ensures optimal coverage while managing costs and compliance.",
    benefits: ["Automated rota generation", "Skills-based matching", "Compliance monitoring"]
  },
  {
    icon: BookOpen,
    title: "Training Management",
    description: "Comprehensive training tracking with automated reminders and competency assessments.",
    benefits: ["Mandatory training alerts", "Skill development paths", "Certification management"]
  },
  {
    icon: Clock,
    title: "Time & Attendance",
    description: "Accurate time tracking with mobile clock-in/out and automated payroll integration.",
    benefits: ["Real-time attendance", "Overtime management", "Payroll integration"]
  },
  {
    icon: Target,
    title: "Performance Management",
    description: "Track staff performance with structured appraisals and development planning.",
    benefits: ["Performance metrics", "Goal setting", "Development plans"]
  },
  {
    icon: Shield,
    title: "Compliance Tracking",
    description: "Monitor all staff compliance requirements including DBS, references, and qualifications.",
    benefits: ["DBS monitoring", "Document expiry alerts", "Compliance reporting"]
  },
  {
    icon: BarChart3,
    title: "Staff Analytics",
    description: "Comprehensive insights into staff performance, satisfaction, and retention metrics.",
    benefits: ["Retention analysis", "Performance trends", "Satisfaction surveys"]
  }
]

const staffMetrics = [
  {
    metric: "Staff Retention",
    value: "94%",
    improvement: "+23%",
    description: "Average staff retention rate",
    icon: Users
  },
  {
    metric: "Training Compliance", 
    value: "99.8%",
    improvement: "+34%",
    description: "Mandatory training completion",
    icon: BookOpen
  },
  {
    metric: "Scheduling Efficiency",
    value: "87%",
    improvement: "+41%",
    description: "Optimal shift coverage",
    icon: Calendar
  },
  {
    metric: "Cost Reduction",
    value: "£47k",
    improvement: "Annual savings",
    description: "Per care home average",
    icon: TrendingUp
  }
]

const testimonial = {
  quote: "WriteCareNotes transformed our staff management. We've reduced turnover by 40% and eliminated scheduling conflicts completely.",
  author: "David Chen",
  role: "Operations Manager", 
  home: "Riverside Care Group, Manchester",
  staff: "240+ staff members"
}

const trainingModules = [
  { name: "Safeguarding Adults", completion: "100%", status: "complete" },
  { name: "Moving & Handling", completion: "98%", status: "complete" },
  { name: "Medication Management", completion: "96%", status: "complete" },
  { name: "Infection Control", completion: "89%", status: "warning" },
  { name: "Mental Capacity Act", completion: "92%", status: "complete" }
]

export const StaffManagementPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6">
                <Users className="h-4 w-4 mr-2" />
                Staff Management Solution
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Empower Your
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"> Care Team</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Comprehensive staff management platform that reduces turnover, improves 
                compliance, and empowers your care team to deliver exceptional resident care 
                through intelligent scheduling, training, and performance management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="care">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Schedule Demo
                </Button>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Staff Dashboard</h3>
                  <p className="text-gray-600">Real-time staff management overview</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-900">On Duty</span>
                    </div>
                    <span className="text-green-600 font-bold">24 staff</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="font-medium text-gray-900">Next Shift</span>
                    </div>
                    <span className="text-blue-600 font-bold">2 hours</span>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Training Compliance</span>
                      <span className="text-sm text-green-600 font-bold">96%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '96%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Proven Staff Management Results
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Care homes using WriteCareNotes see significant improvements in staff 
              satisfaction, retention, and operational efficiency.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {staffMetrics.map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</div>
                <div className="text-green-600 font-medium mb-2">{metric.improvement}</div>
                <div className="text-gray-600 text-sm">{metric.description}</div>
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
              Complete Staff Management Suite
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your care team effectively, from scheduling 
              and training to performance management and compliance tracking.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {staffFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
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

      {/* Training Compliance Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Automated Training Compliance
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Never miss mandatory training deadlines again. Our intelligent system 
                tracks all staff qualifications, sends automated reminders, and ensures 
                100% compliance with regulatory requirements.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  "Automated renewal reminders",
                  "Skills-based training recommendations", 
                  "Progress tracking and reporting",
                  "Integration with training providers"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button variant="care" size="lg">
                Explore Training Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Training Compliance Overview</h3>
                <div className="space-y-4">
                  {trainingModules.map((module, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {module.status === 'complete' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                        )}
                        <span className="font-medium text-gray-900">{module.name}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${
                          module.status === 'complete' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {module.completion}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800 font-medium">
                      Overall Compliance: 95.2% (Above Industry Average)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6">
            <Users className="h-4 w-4 mr-2" />
            Staff Management Success
          </div>
          <blockquote className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
            "{testimonial.quote}"
          </blockquote>
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">DC</span>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">{testimonial.author}</div>
              <div className="text-gray-600">{testimonial.role}</div>
              <div className="text-sm text-gray-500">{testimonial.home}</div>
              <div className="text-sm text-purple-600 font-medium">{testimonial.staff}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Transform Your Staff Management
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join hundreds of care homes that have improved staff satisfaction, 
            reduced turnover, and streamlined operations with WriteCareNotes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <UserPlus className="mr-2 h-5 w-5" />
              Start Free Trial
            </Button>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-purple-600">
                Watch Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-purple-100 text-sm mt-6">
            30-day free trial • No setup fees • Unlimited staff accounts
          </p>
        </div>
      </section>
    </div>
  )
}