import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Home, 
  Heart, 
  Brain, 
  Clock, 
  Users, 
  Shield, 
  Stethoscope,
  MapPin,
  CheckCircle,
  Star,
  Building,
  UserCheck,
  Zap,
  Globe,
  ChevronDown,
  Video
} from 'lucide-react'

interface CareType {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
  features: string[]
  compliance: string[]
  coverage: string
}

const careTypes: CareType[] = [
  {
    id: 'residential-care',
    title: 'Residential Care Homes',
    description: 'Comprehensive management for traditional residential care facilities',
    icon: Home,
    color: 'from-blue-500 to-blue-600',
    features: [
      'Daily care planning and documentation',
      'Medication management (eMAR)',
      'Activity scheduling and tracking',
      'Nutritional monitoring',
      'Family communication portal'
    ],
    compliance: ['CQC Registration', 'DOLS Compliance', 'Safeguarding Protocols'],
    coverage: 'England, Scotland, Wales, Northern Ireland'
  },
  {
    id: 'nursing-homes',
    title: 'Nursing Homes',
    description: 'Advanced clinical management for nursing care facilities',
    icon: Stethoscope,
    color: 'from-green-500 to-emerald-600',
    features: [
      'Clinical assessment tools',
      'NHS Digital integration (GP Connect, eRedBag)',
      'Advanced medication protocols',
      'Wound care documentation',
      'Clinical governance reporting'
    ],
    compliance: ['NMC Standards', 'Clinical Governance', 'NHS Digital Integration'],
    coverage: 'Full British Isles with NHS connectivity'
  },
  {
    id: 'dementia-care',
    title: 'Dementia Care Facilities',
    description: 'Specialized tools for dementia and memory care units',
    icon: Brain,
    color: 'from-purple-500 to-violet-600',
    features: [
      'Behavior monitoring and analysis',
      'Wandering prevention systems',
      'Cognitive assessment tracking',
      'Person-centered care planning',
      'Family involvement tools'
    ],
    compliance: ['Mental Capacity Act', 'DOLS Assessment', 'Dementia Care Standards'],
    coverage: 'Specialized dementia care across British Isles'
  },
  {
    id: 'respite-care',
    title: 'Respite Care Centers',
    description: 'Flexible management for short-term and respite care',
    icon: Clock,
    color: 'from-orange-500 to-amber-600',
    features: [
      'Flexible booking system',
      'Quick assessment protocols',
      'Temporary care planning',
      'Family liaison services',
      'Rapid onboarding tools'
    ],
    compliance: ['Short-term Care Standards', 'Assessment Protocols', 'Safety Checks'],
    coverage: 'England, Wales, Scotland, Northern Ireland'
  },
  {
    id: 'domiciliary-care',
    title: 'Domiciliary Care Providers',
    description: 'GPS-verified home care with intelligent scheduling',
    icon: MapPin,
    color: 'from-cyan-500 to-blue-600',
    features: [
      'GPS visit verification',
      'Mobile care documentation',
      'Real-time scheduling',
      'Travel time optimization',
      'Client portal access'
    ],
    compliance: ['Home Care Standards', 'Safeguarding Protocols', 'Data Protection'],
    coverage: 'Urban and rural coverage across British Isles'
  },
  {
    id: 'learning-disability',
    title: 'Learning Disability Services',
    description: 'Specialized support for learning disability residential services',
    icon: Users,
    color: 'from-indigo-500 to-purple-600',
    features: [
      'Person-centered planning',
      'Outcome-focused documentation',
      'Skills development tracking',
      'Community integration tools',
      'Family and advocate portals'
    ],
    compliance: ['Person-Centered Planning', 'Outcome Monitoring', 'Rights-Based Care'],
    coverage: 'Comprehensive British Isles coverage'
  },
  {
    id: 'mental-health',
    title: 'Mental Health Residential',
    description: 'Specialized tools for mental health residential services',
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    features: [
      'Mental health assessments',
      'Crisis intervention protocols',
      'Therapeutic activity tracking',
      'Medication compliance monitoring',
      'Recovery-focused planning'
    ],
    compliance: ['Mental Health Act', 'NICE Guidelines', 'Recovery Standards'],
    coverage: 'England, Scotland, Wales, Northern Ireland'
  },
  {
    id: 'specialist-units',
    title: 'Specialist Care Units',
    description: 'Advanced tools for specialized medical care facilities',
    icon: Shield,
    color: 'from-red-500 to-pink-600',
    features: [
      'Complex care protocols',
      'Multi-disciplinary team coordination',
      'Advanced reporting systems',
      'Specialist equipment tracking',
      'Clinical outcome monitoring'
    ],
    compliance: ['Specialist Standards', 'Clinical Excellence', 'Advanced Protocols'],
    coverage: 'Specialized care across British Isles'
  }
]

export const WhoWeServePage: React.FC = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full shadow-lg">
                <Building className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              Complete Care Home<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Platform Coverage
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed">
              From residential care to specialized units, WriteCareNotes provides tailored solutions 
              for every care environment across the British Isles. Our comprehensive platform adapts 
              to your specific care setting with specialized workflows and full regulatory compliance.
            </p>
            
            {/* Key Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-10 text-sm">
              <div className="flex items-center justify-center space-x-2 text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>NHS Digital Integration</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>HMRC Payroll Connected</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>CQC Compliant</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>15+ AI Agents</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/demo">
                <Button variant="care" size="lg" className="text-lg px-10 py-5 shadow-xl hover:shadow-2xl transition-all">
                  <UserCheck className="h-6 w-6 mr-3" />
                  See Your Care Setting Demo
                </Button>
              </Link>
              <Link to="/platform/ai-features">
                <Button variant="outline" size="lg" className="text-lg px-10 py-5 border-2 hover:bg-gray-50">
                  <Zap className="h-6 w-6 mr-3" />
                  Explore All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Coverage */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 py-12 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white rounded-full animate-pulse delay-500"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="text-white transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">53</div>
              <div className="text-blue-100">Microservices Available</div>
            </div>
            <div className="text-white transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">15+</div>
              <div className="text-blue-100">AI Agents & Automations</div>
            </div>
            <div className="text-white transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">100%</div>
              <div className="text-blue-100">British Isles Compliance</div>
            </div>
            <div className="text-white transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">24/7</div>
              <div className="text-blue-100">NHS Digital Integration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Care Types Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Complete Care Setting Coverage
          </h2>
          <p className="text-xl text-gray-600">
            Specialized features and compliance for every type of care environment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {careTypes.map((careType) => (
            <div 
              key={careType.id} 
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              onClick={() => setExpandedCard(expandedCard === careType.id ? null : careType.id)}
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className={`bg-gradient-to-r ${careType.color} p-3 rounded-lg mr-4 transition-transform duration-300 hover:scale-110`}>
                    <careType.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{careType.title}</h3>
                        <p className="text-gray-600 text-sm">{careType.description}</p>
                      </div>
                      <div className={`transition-transform duration-300 ${expandedCard === careType.id ? 'rotate-180' : ''}`}>
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`space-y-6 transition-all duration-300 ${
                  expandedCard === careType.id ? 'max-h-96 opacity-100' : 'max-h-32 opacity-70'
                } overflow-hidden`}>
                  {/* Key Features */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-blue-500" />
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {careType.features.slice(0, expandedCard === careType.id ? careType.features.length : 3).map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {!expandedCard && careType.features.length > 3 && (
                        <li className="text-sm text-blue-600 font-medium">
                          +{careType.features.length - 3} more features...
                        </li>
                      )}
                    </ul>
                  </div>

                  {expandedCard === careType.id && (
                    <>
                      {/* Compliance */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-green-500" />
                          Compliance & Standards
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {careType.compliance.map((comp, index) => (
                            <span 
                              key={index}
                              className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full transition-colors hover:bg-green-200"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Coverage */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-blue-500" />
                          Geographic Coverage
                        </h4>
                        <p className="text-sm text-gray-600">{careType.coverage}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link to="/demo">
                    <Button variant="care" size="sm" className="w-full transition-all hover:shadow-md">
                      See {careType.title} Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Capabilities Showcase */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Platform Capabilities
            </h2>
            <p className="text-xl text-gray-600">
              See what makes WriteCareNotes the most complete care management solution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* NHS Digital Integration */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">NHS Digital Integration</h3>
                  <p className="text-sm text-gray-600">Complete NHS ecosystem connection</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>GP Connect API integration</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>eRedBag discharge summaries</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>DSCR demographic service</span>
                </div>
              </div>
            </div>

            {/* AI Agent System */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">15+ AI Agents</h3>
                  <p className="text-sm text-gray-600">Comprehensive automation suite</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Customer support automation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Care plan assistance</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Compliance monitoring</span>
                </div>
              </div>
            </div>

            {/* HMRC Integration */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">HMRC Payroll Integration</h3>
                  <p className="text-sm text-gray-600">Full payroll automation</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Real-time PAYE processing</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Automatic pension contributions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Digital tax submissions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Excellence Statistics */}
          <div className="mt-16 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Technical Excellence & Comprehensive Coverage
              </h3>
              <p className="text-gray-600">Built for the future of care home management</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">53</div>
                <div className="text-sm text-gray-600">Microservices Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
                <div className="text-sm text-gray-600">API Endpoints</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">15+</div>
                <div className="text-sm text-gray-600">AI Agents & Automations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">British Isles Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose WriteCareNotes */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Care Providers Choose WriteCareNotes
            </h2>
            <p className="text-xl text-gray-600">
              Regardless of your care setting, you get the same excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Specialized for Your Setting</h3>
              <p className="text-gray-600">
                Tailored features and workflows designed specifically for your type of care environment
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Compliance Coverage</h3>
              <p className="text-gray-600">
                Complete regulatory compliance across all British Isles jurisdictions and care standards
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Implementation</h3>
              <p className="text-gray-600">
                Dedicated support team with deep experience in your specific care setting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Care Setting?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Experience the most comprehensive care management platform across the British Isles. 
              See how our specialized solutions work for your specific care environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/demo">
                <Button variant="care" size="lg" className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-50">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Book Specialized Demo
                </Button>
              </Link>
              <Link to="/platform/ai-features">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
                  <Zap className="h-5 w-5 mr-2" />
                  Explore All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Demo Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link to="/demo">
          <Button 
            variant="care" 
            size="lg" 
            className="rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 px-6 py-4"
          >
            <Video className="h-5 w-5 mr-2" />
            Quick Demo
          </Button>
        </Link>
      </div>
    </div>
  )
}