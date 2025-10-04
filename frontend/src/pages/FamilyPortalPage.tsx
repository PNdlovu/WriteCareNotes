import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Heart, 
  Smartphone, 
  Video, 
  Camera, 
  MessageSquare,
  Bell,
  Calendar,
  FileText,
  Users,
  ArrowRight,
  Shield,
  Star,
  CheckCircle,
  Clock,
  Eye,
  Share2
} from 'lucide-react'

const familyFeatures = [
  {
    icon: Smartphone,
    title: "Mobile Family App",
    description: "Stay connected with your loved one through our intuitive mobile app, available 24/7.",
    benefits: ["iOS and Android apps", "Real-time notifications", "Offline access"]
  },
  {
    icon: Video,
    title: "Virtual Visits",
    description: "Schedule and conduct video calls with your loved one directly through the platform.",
    benefits: ["HD video calling", "Scheduled visits", "Group family calls"]
  },
  {
    icon: Camera,
    title: "Photo & Memory Sharing",
    description: "Share precious moments and memories with photo sharing and digital scrapbooks.",
    benefits: ["Photo albums", "Memory timelines", "Family sharing"]
  },
  {
    icon: FileText,
    title: "Care Updates",
    description: "Receive detailed updates about your loved one's care, activities, and wellbeing.",
    benefits: ["Daily care reports", "Health updates", "Activity summaries"]
  },
  {
    icon: Calendar,
    title: "Visit Scheduling",
    description: "Book visits, appointments, and activities with our integrated scheduling system.",
    benefits: ["Online booking", "Reminder notifications", "Calendar integration"]
  },
  {
    icon: MessageSquare,
    title: "Direct Communication",
    description: "Communicate directly with care staff and management through secure messaging.",
    benefits: ["Secure messaging", "Staff communication", "Emergency alerts"]
  }
]

const familyMetrics = [
  {
    metric: "Family Satisfaction",
    value: "97%",
    improvement: "+24%",
    description: "Overall satisfaction rating",
    icon: Heart
  },
  {
    metric: "Communication",
    value: "4.8/5",
    improvement: "+31%",
    description: "Communication quality score",
    icon: MessageSquare
  },
  {
    metric: "Engagement",
    value: "89%",
    improvement: "+45%",
    description: "Active family participation",
    icon: Users
  },
  {
    metric: "Response Time",
    value: "12 min",
    improvement: "-67%",
    description: "Average staff response",
    icon: Clock
  }
]

const testimonial = {
  quote: "The family portal has been a game-changer. I can see how mum is doing every day, chat with her carers, and even join her for virtual activities. It's given me such peace of mind.",
  author: "Robert Davies",
  role: "Son of Resident",
  home: "Meadowview Care Home, Cardiff",
  relationship: "Family Member for 2 years"
}

const familyUpdate = {
  resident: "Eleanor Davies",
  date: "Today, 2:30 PM",
  updates: [
    {
      type: "activity",
      title: "Enjoyed art therapy session",
      description: "Created a beautiful watercolor painting of flowers",
      icon: Star,
      time: "2:30 PM"
    },
    {
      type: "health",
      title: "Physiotherapy completed",
      description: "Great progress with mobility exercises",
      icon: CheckCircle,
      time: "11:00 AM"
    },
    {
      type: "social",
      title: "Video call with grandson",
      description: "30-minute call - both were delighted",
      icon: Video,
      time: "9:30 AM"
    }
  ]
}

export const FamilyPortalPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-pink-100 text-pink-800 rounded-full text-sm font-medium mb-6">
                <Heart className="h-4 w-4 mr-2" />
                Family Portal
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Stay Connected
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600"> With Love</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Bridge the distance between you and your loved one with our comprehensive 
                family portal. Stay informed, engaged, and connected through real-time 
                updates, virtual visits, and seamless communication with care staff.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="care">
                  Get Family Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Download App
                </Button>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{familyUpdate.resident}</h3>
                    <p className="text-gray-600">Daily Care Updates</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{familyUpdate.date}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {familyUpdate.updates.map((update, index) => (
                    <div key={index} className="flex p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                        <update.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{update.title}</h4>
                          <span className="text-sm text-gray-500">{update.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Video className="h-4 w-4 mr-2" />
                    Video Call
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
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
              Bringing Families Closer Together
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our family portal strengthens the bond between residents and their loved ones, 
              creating meaningful connections and peace of mind for families.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {familyMetrics.map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-6">
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
              Complete Family Engagement Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything families need to stay connected, informed, and involved 
              in their loved one's care journey, all in one secure platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {familyFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
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

      {/* Communication Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Seamless Communication
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Stay in constant touch with your loved one and their care team through 
                multiple communication channels designed for families.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Video,
                    title: "Virtual Visits",
                    description: "High-quality video calls with scheduling and group family sessions"
                  },
                  {
                    icon: MessageSquare,
                    title: "Secure Messaging",
                    description: "Direct communication with care staff for questions and updates"
                  },
                  {
                    icon: Bell,
                    title: "Smart Notifications",
                    description: "Customizable alerts for important updates and milestones"
                  },
                  {
                    icon: Share2,
                    title: "Family Sharing",
                    description: "Share updates and photos with extended family members"
                  }
                ].map((comm, index) => (
                  <div key={index} className="flex">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mr-4">
                      <comm.icon className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{comm.title}</h3>
                      <p className="text-gray-600">{comm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button variant="care" size="lg">
                  Explore Communication Features
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Family App Features</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { feature: "Real-time Care Updates", status: "Active" },
                    { feature: "Photo & Video Sharing", status: "Active" },
                    { feature: "Virtual Visit Scheduling", status: "Active" },
                    { feature: "Direct Staff Messaging", status: "Active" },
                    { feature: "Emergency Notifications", status: "Active" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <span className="font-medium text-gray-900">{item.feature}</span>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-green-600 font-medium">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-white rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">App Store Rating</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                      <span className="ml-2 text-sm font-bold text-gray-900">4.9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-pink-100 text-pink-800 rounded-full text-sm font-medium mb-6">
            <Heart className="h-4 w-4 mr-2" />
            Family Success Story
          </div>
          <blockquote className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
            "{testimonial.quote}"
          </blockquote>
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">RD</span>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">{testimonial.author}</div>
              <div className="text-gray-600">{testimonial.role}</div>
              <div className="text-sm text-gray-500">{testimonial.home}</div>
              <div className="text-sm text-pink-600 font-medium">{testimonial.relationship}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Secure & Private by Design
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your family's privacy and security are our top priorities. All communications 
              and data are protected with enterprise-grade security measures.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "End-to-End Encryption",
                description: "All messages, photos, and video calls are encrypted to protect your family's privacy."
              },
              {
                icon: Eye,
                title: "Privacy Controls",
                description: "Granular privacy settings let you control who sees what information about your loved one."
              },
              {
                icon: CheckCircle,
                title: "GDPR Compliant",
                description: "Fully compliant with data protection regulations to ensure your rights are protected."
              }
            ].map((security, index) => (
              <div key={index} className="text-center p-8 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <security.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{security.title}</h3>
                <p className="text-gray-600">{security.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Connect With Your Loved One Today
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Join thousands of families who stay connected, informed, and involved 
            in their loved one's care through our family portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Heart className="mr-2 h-5 w-5" />
              Get Family Access
            </Button>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-pink-600">
                Watch Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-pink-100 text-sm mt-6">
            Free for all families • Available 24/7 • iOS and Android apps
          </p>
        </div>
      </section>
    </div>
  )
}