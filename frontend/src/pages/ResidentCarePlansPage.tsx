import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Heart, 
  FileText, 
  Clock, 
  Shield, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar,
  ArrowRight,
  UserCheck,
  Activity,
  Target,
  Users,
  Star,
  Clipboard
} from 'lucide-react'

const careFeatures = [
  {
    icon: FileText,
    title: "Person-Centered Care Plans",
    description: "Comprehensive, individualized care plans that put each resident at the center of their care.",
    benefits: ["Individual preferences", "Life history integration", "Goal-oriented planning"]
  },
  {
    icon: Activity,
    title: "Care Monitoring",
    description: "Real-time tracking of care delivery with automated alerts for changes in condition.",
    benefits: ["Vital sign monitoring", "Medication tracking", "Risk assessments"]
  },
  {
    icon: Target,
    title: "Outcome Tracking",
    description: "Measure and track care outcomes to ensure continuous improvement in resident wellbeing.",
    benefits: ["Quality of life metrics", "Health improvements", "Goal achievement"]
  },
  {
    icon: Calendar,
    title: "Care Scheduling",
    description: "Intelligent scheduling that ensures all care tasks are completed on time, every time.",
    benefits: ["Automated reminders", "Task prioritization", "Coverage optimization"]
  },
  {
    icon: Users,
    title: "Multi-Disciplinary Planning",
    description: "Collaborative care planning involving all members of the care team.",
    benefits: ["Team coordination", "Specialist input", "Family involvement"]
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Proactive identification and management of care risks to prevent incidents.",
    benefits: ["Risk assessments", "Prevention strategies", "Incident tracking"]
  }
]

const careMetrics = [
  {
    metric: "Care Quality",
    value: "98.7%",
    improvement: "+15%",
    description: "Resident satisfaction score",
    icon: Heart
  },
  {
    metric: "Plan Compliance", 
    value: "99.2%",
    improvement: "+28%",
    description: "Care plan adherence",
    icon: CheckCircle
  },
  {
    metric: "Response Time",
    value: "3.2 min",
    improvement: "-45%",
    description: "Average care response",
    icon: Clock
  },
  {
    metric: "Health Outcomes",
    value: "89%",
    improvement: "+22%",
    description: "Positive health trends",
    icon: TrendingUp
  }
]

const testimonial = {
  quote: "The person-centered care plans have transformed how we deliver care. Our residents are happier, families are more engaged, and our CQC rating improved to Outstanding.",
  author: "Margaret Thompson",
  role: "Care Manager", 
  home: "Willowbrook Care Home, Surrey",
  residents: "45 residents"
}

const carePlanExample = {
  resident: "Margaret Smith",
  room: "Room 12",
  careLevel: "Medium Support",
  lastUpdate: "2 hours ago",
  tasks: [
    { task: "Morning medication", status: "completed", time: "08:00" },
    { task: "Physiotherapy session", status: "in-progress", time: "10:30" },
    { task: "Lunch assistance", status: "pending", time: "12:00" },
    { task: "Family video call", status: "scheduled", time: "15:00" }
  ]
}

export const ResidentCarePlansPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6">
                <Heart className="h-4 w-4 mr-2" />
                Resident Care Plans
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Person-Centered
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600"> Care Plans</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Create comprehensive, individualized care plans that honor each resident's 
                unique needs, preferences, and life story. Deliver outstanding care that 
                improves quality of life and exceeds family expectations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="care">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <UserCheck className="mr-2 h-5 w-5" />
                  See Demo
                </Button>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{carePlanExample.resident}</h3>
                    <p className="text-gray-600">{carePlanExample.room} • {carePlanExample.careLevel}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Last updated</div>
                    <div className="text-sm font-medium text-emerald-600">{carePlanExample.lastUpdate}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {carePlanExample.tasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {task.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        ) : task.status === 'in-progress' ? (
                          <Clock className="h-5 w-5 text-blue-600 mr-3" />
                        ) : task.status === 'pending' ? (
                          <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                        ) : (
                          <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        )}
                        <span className="font-medium text-gray-900">{task.task}</span>
                      </div>
                      <div className="text-sm text-gray-600">{task.time}</div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                  <div className="flex items-center">
                    <Heart className="h-5 w-5 text-emerald-600 mr-2" />
                    <span className="text-sm text-emerald-800 font-medium">
                      Care plan 98% complete today
                    </span>
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
              Exceptional Care Outcomes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Care homes using our resident care plans see significant improvements 
              in resident satisfaction, family engagement, and overall care quality.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {careMetrics.map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-6">
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
              Comprehensive Care Planning
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, manage, and deliver outstanding 
              person-centered care that honors each resident's unique journey.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {careFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
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

      {/* Person-Centered Approach */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Truly Person-Centered Care
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our care planning approach honors each resident as an individual with 
                their own unique story, preferences, and needs. Create care plans that 
                reflect who they are, not just their medical conditions.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    title: "Life Story Integration",
                    description: "Incorporate personal history, interests, and relationships into daily care"
                  },
                  {
                    title: "Preference-Based Care",
                    description: "Respect individual choices about meals, activities, and routines"
                  },
                  {
                    title: "Family Involvement",
                    description: "Keep families engaged with transparent communication and involvement"
                  },
                  {
                    title: "Goal-Oriented Planning",
                    description: "Set meaningful goals that enhance quality of life and independence"
                  }
                ].map((approach, index) => (
                  <div key={index} className="flex">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{approach.title}</h3>
                      <p className="text-gray-600">{approach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button variant="care" size="lg">
                  Learn More About Our Approach
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Care Plan Quality Score</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { category: "Personal Preferences", score: 96 },
                    { category: "Health Monitoring", score: 94 },
                    { category: "Social Engagement", score: 91 },
                    { category: "Family Involvement", score: 98 }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">{item.category}</span>
                        <span className="text-sm font-bold text-emerald-600">{item.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{width: `${item.score}%`}}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-white rounded-lg">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-800 font-medium">
                      Overall Care Quality: Excellent (95%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6">
            <Heart className="h-4 w-4 mr-2" />
            Outstanding Care Success
          </div>
          <blockquote className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
            "{testimonial.quote}"
          </blockquote>
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">MT</span>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">{testimonial.author}</div>
              <div className="text-gray-600">{testimonial.role}</div>
              <div className="text-sm text-gray-500">{testimonial.home}</div>
              <div className="text-sm text-emerald-600 font-medium">{testimonial.residents}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Transform Resident Care
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Create person-centered care plans that honor each resident's unique 
            journey and deliver the exceptional care they deserve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Clipboard className="mr-2 h-5 w-5" />
              Start Free Trial
            </Button>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-emerald-600">
                Watch Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-emerald-100 text-sm mt-6">
            30-day free trial • Unlimited care plans • Outstanding results guaranteed
          </p>
        </div>
      </section>
    </div>
  )
}