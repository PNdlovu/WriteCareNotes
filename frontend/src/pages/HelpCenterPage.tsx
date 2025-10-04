import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Book, 
  Phone, 
  MessageCircle, 
  FileText, 
  ArrowRight,
  PlayCircle,
  Download,
  Clock,
  Users,
  Shield,
  Zap,
  CheckCircle,
  HelpCircle,
  Mail,
  Video,
  Headphones,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '../components/ui/Button'

const helpCategories = [
  {
    icon: Book,
    title: 'Quick Start Guide',
    description: 'Get up and running in 15 minutes',
    color: 'from-green-500 to-emerald-600',
    articles: [
      'Complete setup walkthrough',
      'Adding your first resident',
      'Recording your first care entry',
      'Inviting staff members',
      'Setting up notifications'
    ]
  },
  {
    icon: Users,
    title: 'Resident Management',
    description: 'Complete care planning and documentation',
    color: 'from-blue-500 to-cyan-600',
    articles: [
      'Creating detailed care plans',
      'Recording daily observations',
      'Managing medications safely',
      'Incident reporting and tracking',
      'Risk assessments and reviews',
      'Family communication tools'
    ]
  },
  {
    icon: Shield,
    title: 'Staff Management',
    description: 'Scheduling, training, and compliance',
    color: 'from-purple-500 to-indigo-600',
    articles: [
      'Creating staff profiles',
      'Shift scheduling and rota',
      'Training record management',
      'Performance tracking',
      'Holiday and absence management',
      'Staff communication tools'
    ]
  },
  {
    icon: FileText,
    title: 'Regional Compliance',
    description: 'All British Isles & Crown Dependencies',
    color: 'from-red-500 to-pink-600',
    articles: [
      'England - CQC inspection preparation',
      'Scotland - Care Inspectorate compliance',
      'Wales - Care Inspectorate Wales (CIW)',
      'N. Ireland - RQIA requirements',
      'Ireland - HIQA standards',
      'Jersey - Care Commission standards',
      'Guernsey - Care Standards Committee',
      'Isle of Man - Care Standards Team'
    ]
  },
  {
    icon: Zap,
    title: 'Reporting & Analytics',
    description: 'Insights and performance tracking',
    color: 'from-orange-500 to-yellow-600',
    articles: [
      'Creating custom reports',
      'Understanding analytics dashboard',
      'Performance metrics tracking',
      'Financial reporting',
      'Occupancy and capacity planning',
      'Export and sharing options'
    ]
  },
  {
    icon: Phone,
    title: 'Family Portal',
    description: 'Connecting families with care',
    color: 'from-teal-500 to-green-600',
    articles: [
      'Setting up family accounts',
      'Sharing care updates',
      'Photo and video sharing',
      'Virtual visit scheduling',
      'Communication preferences',
      'Privacy and access controls'
    ]
  },
  {
    icon: MessageCircle,
    title: 'Mobile App',
    description: 'Care on the go',
    color: 'from-indigo-500 to-purple-600',
    articles: [
      'Installing the mobile app',
      'Mobile care documentation',
      'Offline functionality',
      'Push notifications setup',
      'Photo capture and upload',
      'Emergency protocols'
    ]
  },
  {
    icon: HelpCircle,
    title: 'Audit & Security',
    description: 'Inspection ready, security certified',
    color: 'from-gray-500 to-slate-600',
    articles: [
      'Audit trail documentation',
      'GDPR compliance features',
      'Data security measures',
      'Backup and recovery',
      'Access control management',
      'Cyber Essentials preparation'
    ]
  }
]

const faqs = [
  {
    question: "Which countries and regions does WriteCareNotes support?",
    answer: "WriteCareNotes provides comprehensive coverage across all British Isles territories: ✅ UK Nations: England (CQC), Scotland (Care Inspectorate), Wales (CIW), Northern Ireland (RQIA) ✅ Republic of Ireland (HIQA) ✅ Crown Dependencies: Jersey (Care Commission), Guernsey (Care Standards Committee), Isle of Man (Care Standards Team). Each territory has dedicated local support teams, jurisdiction-specific compliance features, and regulatory expertise."
  },
  {
    question: "What compliance certifications do you currently have?",
    answer: "✅ FULLY COMPLIANT: CQC (England), GDPR (EU-wide), Care Standards Act, Data Protection Act 2018. ✅ AUDIT READY: Complete audit trails, automated documentation, inspection-ready reports. 🔄 IN PROGRESS: Cyber Essentials Plus certification (expected completion Q1 2026). We maintain full transparency about our certification status."
  },
  {
    question: "Is WriteCareNotes ready for CQC/regulatory inspections?",
    answer: "Absolutely! Our system automatically generates all required documentation including care plans, incident reports, training records, and medication management logs. We provide pre-inspection checklists, audit trail reports, and can export complete inspection packs in under 5 minutes. Many clients achieve Outstanding ratings using our platform."
  },
  {
    question: "How do I set up my care home on WriteCareNotes?",
    answer: "Setting up is simple! After creating your account, our region-specific setup wizard guides you through: 1) Selecting your jurisdiction (England/Scotland/Wales/NI/Ireland), 2) Adding care home details and regulatory information, 3) Creating resident profiles, 4) Inviting staff members. The entire process takes about 15 minutes with region-specific compliance features automatically configured."
  },
  {
    question: "What if I operate care homes in multiple regions?",
    answer: "Perfect! WriteCareNotes excels at multi-region operations. You can manage homes across England, Scotland, Wales, Northern Ireland, Republic of Ireland, Jersey, Guernsey, and Isle of Man from one unified dashboard. Each home automatically uses the correct regional compliance standards, forms, and reporting requirements. We provide consolidated reporting while maintaining jurisdiction-specific compliance, plus dedicated multi-region specialists for complex operations."
  },
  {
    question: "How secure is our data and are you Cyber Essentials certified?",
    answer: "Security is our top priority. ✅ CURRENT: Bank-level encryption, UK data centers, ISO 27001 practices, GDPR compliant, regular penetration testing. 🔄 IN PROGRESS: Cyber Essentials Plus certification (currently in final assessment phase, expected completion Q1 2026). We're fully transparent about our security journey and exceed current requirements while pursuing formal certification."
  },
  {
    question: "Can families access the system, and is it GDPR compliant?",
    answer: "Yes! WriteCareNotes includes a fully GDPR-compliant family portal. Families can view care updates, photos, and communicate with staff through our secure platform. You control exactly what each family member can see, with comprehensive consent management and data protection features. All regional privacy laws are automatically enforced."
  },
  {
    question: "What support do you provide for different regions?",
    answer: "We provide dedicated regional support teams: 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England - CQC specialists, 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland - Care Inspectorate experts, 🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales - CIW compliance team, Northern Ireland - RQIA specialists, 🇮🇪 Ireland - HIQA experts, 🇯🇪 Jersey - Care Commission specialists, 🇬🇬 Guernsey - Care Standards experts, 🇮🇲 Isle of Man - Local compliance team. All teams understand local regulations, provide jurisdiction-specific guidance, and are available during local business hours with emergency support 24/7."
  },
  {
    question: "What happens if there's a data breach or security incident?",
    answer: "We have comprehensive incident response procedures: immediate containment, forensic investigation, affected party notification within 72 hours (GDPR requirement), regulatory reporting to ICO/DPC as required, and full remediation. Our incident response plan is tested regularly, and we maintain cyber insurance. While we've never had a breach, transparency and preparedness are key to our security approach."
  },
  {
    question: "Can I try WriteCareNotes before committing, and how much does it cost?",
    answer: "Absolutely! We offer a 30-day free trial with full access to all features and regional compliance tools. Pricing starts from £2.50 per resident per month (with volume discounts available). No setup fees, hidden costs, or long-term contracts required. You can also book a region-specific demo to see how WriteCareNotes works with your local regulatory requirements."
  },
  {
    question: "How do I generate reports for inspections in my region?",
    answer: "Reports are built-in and region-specific! Go to 'Reports' and select your inspection type: CQC (England), Care Inspectorate (Scotland), CIW (Wales), RQIA (Northern Ireland), HIQA (Ireland), Jersey Care Commission, Guernsey Care Standards, or Isle of Man Care Standards. Each region gets appropriate templates, required metrics, and compliance indicators. Reports export to PDF, can be customized by date range, and include region-specific pre-inspection checklists."
  },
  {
    question: "What if I need urgent help outside business hours?",
    answer: "We provide 24/7 emergency support for critical issues affecting resident care or system access. During business hours (Mon-Fri, 8AM-6PM GMT), we offer live chat, phone, and email support with response times under 10 minutes. Our UK and Ireland-based teams understand care home operations and regional requirements. Emergency contact details are always available in your dashboard."
  }
]

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <HelpCircle className="h-4 w-4 mr-2" />
              Complete Help & Knowledge Center
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Succeed</span>
            </h1>
            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
              From setup to mastery - our comprehensive help center covers every aspect of WriteCareNotes. 
              Find answers, learn best practices, and get your team confident with the system quickly.
            </p>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 max-w-4xl mx-auto mb-8">
              <div className="flex items-center justify-center mb-3">
                <div className="text-2xl mr-3">🇬🇧 🇮🇪 🇯🇪 🇬🇬 🇮🇲</div>
                <h3 className="text-lg font-bold text-gray-900">Complete British Isles & Crown Dependencies Coverage</h3>
              </div>
              <p className="text-gray-700 text-center mb-4">
                Supports <strong>England, Scotland, Wales, Northern Ireland, Republic of Ireland</strong><br/>
                <strong>Plus Crown Dependencies:</strong> Jersey, Guernsey, Isle of Man<br/>
                Each with region-specific compliance, local support teams, and regulatory expertise.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mt-4">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  CQC (England)
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Care Inspectorate (Scotland)
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  CIW (Wales)
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  RQIA (N. Ireland)
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  HIQA (Ireland)
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                  Jersey Care Commission
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  Guernsey Care Standards
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                  Isle of Man Standards
                </div>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for help articles, guides, or tutorials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-lg"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" variant="care">
                <PlayCircle className="mr-2 h-5 w-5" />
                Quick Start Guide
              </Button>
              <Button size="lg" variant="outline">
                <Phone className="mr-2 h-5 w-5" />
                Live Support Chat
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">200+</div>
                <div className="text-gray-600">Help Articles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">50+</div>
                <div className="text-gray-600">Video Tutorials</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">24/7</div>
                <div className="text-gray-600">Emergency Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">8</div>
                <div className="text-gray-600">Regions Covered</div>
              </div>
            </div>
            
            {/* Compliance Status Banner */}
            <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-8 max-w-5xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">🛡️ Compliance & Security Status</h3>
                <p className="text-gray-600">Complete transparency on our certifications and audit readiness</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-bold text-green-900">CQC Compliant</div>
                  <div className="text-sm text-green-700">Fully Ready</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-bold text-green-900">GDPR Compliant</div>
                  <div className="text-sm text-green-700">Certified</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-bold text-green-900">Audit Ready</div>
                  <div className="text-sm text-green-700">Complete Trails</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="font-bold text-yellow-900">Cyber Essentials</div>
                  <div className="text-sm text-yellow-700">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              🚀 Get Started in 15 Minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              New to WriteCareNotes? Follow these steps to get your care home up and running quickly.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Setup Your Home",
                description: "Add care home details, logo, and basic settings",
                time: "3 mins",
                color: "from-blue-500 to-cyan-600"
              },
              {
                step: "2", 
                title: "Add Residents",
                description: "Create resident profiles and care plans",
                time: "5 mins",
                color: "from-green-500 to-emerald-600"
              },
              {
                step: "3",
                title: "Invite Staff",
                description: "Add your team and set permissions",
                time: "3 mins", 
                color: "from-purple-500 to-indigo-600"
              },
              {
                step: "4",
                title: "First Entry",
                description: "Record your first care observation",
                time: "4 mins",
                color: "from-orange-500 to-red-600"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center mb-6`}>
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {item.time}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-6">
                  Start Step {item.step}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" variant="care" className="shadow-lg">
              <PlayCircle className="mr-2 h-5 w-5" />
              Watch Complete Setup Video
            </Button>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              📚 Complete Knowledge Base
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to know about WriteCareNotes, organized by topic. 
              From basic setup to advanced features - we've got you covered.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {helpCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
                <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center mb-6`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{category.title}</h3>
                <p className="text-gray-600 mb-6">{category.description}</p>
                <ul className="space-y-2 mb-6">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex} className="flex items-start text-sm text-gray-700 hover:text-blue-600 cursor-pointer transition-colors">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      {article}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="w-full hover:bg-gray-50">
                  Explore {category.title}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              🎯 Popular Learning Resources
            </h2>
            <p className="text-xl text-gray-600">
              The most requested guides, tutorials, and tools to get you productive quickly
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: PlayCircle,
                title: "Video Tutorial Library",
                description: "50+ step-by-step video guides covering every feature",
                stats: "Average 5 mins each",
                cta: "Browse Videos",
                color: "from-red-500 to-pink-600"
              },
              {
                icon: Download,
                title: "Quick Reference Guides",
                description: "Printable cheat sheets and checklists for your team",
                stats: "12 PDF guides available",
                cta: "Download All",
                color: "from-blue-500 to-cyan-600"
              },
              {
                icon: HelpCircle,
                title: "Common Issues Solver",
                description: "Step-by-step solutions for the most common questions",
                stats: "Resolves 90% of issues",
                cta: "Find Solutions",
                color: "from-green-500 to-emerald-600"
              },
              {
                icon: Headphones,
                title: "Live Training Sessions",
                description: "Weekly group training and Q&A with our experts",
                stats: "Every Tuesday 2PM",
                cta: "Join Next Session",
                color: "from-purple-500 to-indigo-600"
              },
              {
                icon: Users,
                title: "User Community Forum",
                description: "Connect with other care homes and share best practices",
                stats: "1000+ active members",
                cta: "Join Community",
                color: "from-orange-500 to-red-600"
              },
              {
                icon: Star,
                title: "Best Practice Templates",
                description: "Pre-built care plans, forms, and workflows to get started",
                stats: "25+ templates ready",
                cta: "Browse Templates",
                color: "from-teal-500 to-blue-600"
              }
            ].map((resource, index) => (
              <div key={index} className="bg-white rounded-xl p-8 text-center shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
                <div className={`w-16 h-16 bg-gradient-to-br ${resource.color} rounded-xl flex items-center justify-center mx-auto mb-6`}>
                  <resource.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{resource.title}</h3>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <div className="text-sm text-blue-600 font-medium mb-6">{resource.stats}</div>
                <Button variant="care" size="sm" className="w-full">
                  {resource.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              ❓ Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Detailed answers to the most common questions. Can't find what you're looking for? 
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium"> Contact our support team.</a>
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-200">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  <div className="flex-shrink-0">
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-blue-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="care" size="sm">
                <MessageCircle className="mr-2 h-4 w-4" />
                Live Chat Support
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="mr-2 h-4 w-4" />
                Call Support
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              🌍 Regional Support Teams
            </h2>
            <p className="text-xl text-gray-600">
              Dedicated local experts who understand your jurisdiction's specific requirements
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              {
                icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
                title: "England",
                regulator: "CQC Specialists",
                description: "Expert support for CQC compliance, Outstanding ratings, and English care standards",
                contact: "+44 20 7946 0958",
                email: "england@writecarenotes.co.uk",
                color: "from-red-500 to-blue-600"
              },
              {
                icon: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
                title: "Scotland",
                regulator: "Care Inspectorate",
                description: "Dedicated team for Scottish care standards and Health and Social Care Standards",
                contact: "+44 131 558 8400",
                email: "scotland@writecarenotes.co.uk",
                color: "from-blue-500 to-cyan-600"
              },
              {
                icon: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
                title: "Wales",
                regulator: "CIW Compliance",
                description: "Care Inspectorate Wales specialists and Welsh language support available",
                contact: "+44 29 2090 5040",
                email: "wales@writecarenotes.co.uk",
                color: "from-red-600 to-green-600"
              },
              {
                icon: "🇬🇧",
                title: "Northern Ireland",
                regulator: "RQIA Standards",
                description: "Regulation and Quality Improvement Authority compliance experts",
                contact: "+44 28 9051 7500",
                email: "ni@writecarenotes.co.uk",
                color: "from-purple-500 to-indigo-600"
              },
              {
                icon: "🇮🇪",
                title: "Republic of Ireland",
                regulator: "HIQA Compliance",
                description: "Health Information and Quality Authority standards and Irish regulations",
                contact: "+353 1 814 7400",
                email: "ireland@writecarenotes.co.uk",
                color: "from-green-500 to-emerald-600"
              },
              {
                icon: "�🇪",
                title: "Jersey",
                regulator: "Jersey Care Commission",
                description: "Channel Islands care standards and Jersey-specific regulatory requirements",
                contact: "+44 1534 445 500",
                email: "jersey@writecarenotes.co.uk",
                color: "from-teal-500 to-blue-600"
              },
              {
                icon: "🇬🇬",
                title: "Guernsey",
                regulator: "Care Standards Committee",
                description: "Guernsey care standards and Bailiwick-specific compliance support",
                contact: "+44 1481 717 000",
                email: "guernsey@writecarenotes.co.uk",
                color: "from-indigo-500 to-purple-600"
              },
              {
                icon: "🇮🇲",
                title: "Isle of Man",
                regulator: "Care Standards Team",
                description: "Manx care standards and Isle of Man regulatory compliance expertise",
                contact: "+44 1624 685 000",
                email: "iom@writecarenotes.co.uk",
                color: "from-pink-500 to-red-600"
              }
            ].map((region, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{region.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900">{region.title}</h3>
                  <div className={`inline-block px-3 py-1 bg-gradient-to-r ${region.color} text-white text-sm rounded-full font-medium mt-2`}>
                    {region.regulator}
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-center">{region.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-center text-gray-700">
                    <Phone className="h-4 w-4 mr-2 text-green-600" />
                    {region.contact}
                  </div>
                  <div className="flex items-center justify-center text-gray-700">
                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                    {region.email}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4 hover:bg-gray-50">
                  Contact {region.title} Team
                </Button>
              </div>
            ))}
          </div>

          {/* Multi-Region Support Banner */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-8 border border-orange-200">
            <div className="text-center">
              <div className="text-3xl mb-3">🌐</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Multi-Region & Cross-Border Operations</h3>
              <p className="text-gray-700 mb-4">
                Operating across multiple jurisdictions? Our specialist team provides unified support for care groups 
                with homes across different regions, ensuring consistent compliance and streamlined operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <div className="flex items-center text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-orange-600" />
                  +44 20 7946 0958
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-orange-600" />
                  multiregion@writecarenotes.co.uk
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">Universal Support Channels</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  icon: MessageCircle,
                  title: "Live Chat",
                  description: "Instant help in your dashboard",
                  availability: "Mon-Fri: 8AM-6PM GMT",
                  color: "from-green-500 to-emerald-600"
                },
                {
                  icon: Phone,
                  title: "Emergency Support",
                  description: "24/7 critical issue support",
                  availability: "24/7 for urgent matters",
                  color: "from-red-500 to-pink-600"
                },
                {
                  icon: Video,
                  title: "Screen Share",
                  description: "One-on-one guided support",
                  availability: "By appointment",
                  color: "from-purple-500 to-indigo-600"
                },
                {
                  icon: Headphones,
                  title: "Training Sessions",
                  description: "Regional group training",
                  availability: "Weekly sessions",
                  color: "from-orange-500 to-red-600"
                }
              ].map((option, index) => (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${option.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <option.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{option.title}</h4>
                  <p className="text-sm text-gray-600 mb-1">{option.description}</p>
                  <div className="text-xs text-gray-500">{option.availability}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Still Need Help?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Our support team is standing by to help you get the most out of WriteCareNotes. 
            Don't hesitate to reach out!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Phone className="mr-2 h-5 w-5" />
              Call Support Now
            </Button>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Book Training Session
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-6">
            UK-based support team • Available Mon-Fri 8AM-6PM GMT • Emergency support 24/7
          </p>
        </div>
      </section>
    </div>
  )
}