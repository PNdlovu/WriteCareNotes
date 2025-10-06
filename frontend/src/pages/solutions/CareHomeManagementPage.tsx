import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Heart, Users, Clock, FileText, Shield, Phone, BarChart3, Star, Brain, Target, Smile, Award, MessageCircle, Camera } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const revolutionaryFeatures = [
  {
    title: 'Staff Revolution Platform',
    description: 'Transform your workforce from burnout to breakthrough with AI-powered emotional support',
    icon: Heart,
    category: 'Staff Excellence',
    benefits: [
      'AI stress detection & proactive support',
      'Daily achievement recognition system',
      'Peer support network matching',
      'Career progression pathways',
      'Mental health check-ins',
      'Problem-solving assistance'
    ],
    impact: 'Reduce staff turnover from 35% to <10%'
  },
  {
    title: 'Family Trust Engine',
    description: 'Give families complete confidence with real-time care quality transparency',
    icon: Shield,
    category: 'Family Excellence',
    benefits: [
      'Real-time care quality scores',
      'Live preference honoring tracking',
      'Daily life glimpses (photos/videos)',
      'Remote care decision participation',
      'Instant concern resolution visibility',
      'Complete care transparency dashboard'
    ],
    impact: 'Achieve 96%+ family satisfaction scores'
  },
  {
    title: 'Resident Voice Amplification',
    description: 'Ensure every resident feels heard, valued, and in control of their care',
    icon: Smile,
    category: 'Resident Excellence',
    benefits: [
      'AI preference learning & adaptation',
      'Communication aids for cognitive challenges',
      'Personal choice tracking & honoring',
      'Quality of life measurement',
      'Life story integration',
      'Dignity preservation monitoring'
    ],
    impact: 'Achieve 92%+ resident satisfaction'
  },
  {
    title: 'Care Quality Intelligence',
    description: 'Make excellent care visible and prevent poor care before it happens',
    icon: Award,
    category: 'Care Excellence',
    benefits: [
      'Real-time care quality dashboard',
      'AI-powered excellence recognition',
      'Predictive care issue prevention',
      'Instant best practice sharing',
      'Care innovation generation',
      'Continuous outcome optimization'
    ],
    impact: 'Achieve Outstanding CQC ratings'
  },
  {
    title: 'Revolutionary Communication',
    description: 'Beyond messaging - create meaningful connections that transform care',
    icon: MessageCircle,
    category: 'Connection Excellence',
    benefits: [
      'Video calls with care context',
      'AI-powered transcription & insights',
      'Safeguarding detection & alerts',
      'External platform integration',
      'Recording with consent management',
      'Action item extraction & tracking'
    ],
    impact: 'Transform communication into care enhancement'
  },
  {
    title: 'Community Connection Hub',
    description: 'Eliminate social isolation and build meaningful relationships',
    icon: Users,
    category: 'Community Excellence',
    benefits: [
      'Virtual family gatherings',
      'Local community event coordination',
      'Intergenerational program matching',
      'Spiritual care support',
      'Activity optimization by interest',
      'Friendship facilitation'
    ],
    impact: 'Eliminate social isolation completely'
  }
]

const revolutionaryBenefits = [
  'Transform staff turnover from 35% to <10%',
  'Achieve 96%+ family satisfaction scores',
  'Reach 92%+ resident satisfaction ratings',
  'Attain Outstanding CQC ratings consistently',
  'Eliminate social isolation completely',
  'Reduce care incidents by 75%',
  'Make care homes places families fight to get into',
  'Create careers staff are genuinely proud of'
]

const testimonials = [
  {
    quote: "WriteCareConnect has revolutionized our care home. Staff love coming to work, families trust us completely, and our residents are genuinely happy. We went from 'requires improvement' to 'Outstanding' in 8 months.",
    author: "Margaret Thompson",
    role: "Care Home Manager",
    facility: "Willowbrook Care Home",
    metrics: "45 residents • 95% staff retention • Outstanding CQC"
  },
  {
    quote: "The family trust engine changed everything. Families can see their loved one's care quality in real-time. Complaints dropped 80% and we have a waiting list for the first time ever.",
    author: "David Chen",
    role: "Operations Director",
    facility: "Riverside Care Group",
    metrics: "150 residents • 97% family satisfaction • Zero complaints"
  },
  {
    quote: "Our staff used to burn out constantly. Now they feel supported and celebrated. The AI recognizes their achievements daily and connects them with peers. It's transformed our culture completely.",
    author: "Sarah Williams",
    role: "HR Director",
    facility: "Golden Years Care",
    metrics: "80 staff • 8% turnover • 94% job satisfaction"
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
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-semibold">WriteCareConnect Revolution</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                The Care Revolution Platform That Transforms Lives
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                Beyond management software - we revolutionize care itself. Make staff love their jobs, 
                families trust completely, and residents thrive. Transform your care home from a place 
                people dread to a destination families fight to access.
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
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Revolutionary Outcomes</h3>
              <ul className="space-y-4">
                {revolutionaryBenefits.map((benefit, index) => (
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

      {/* Revolutionary Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Care Platform Modules
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Six integrated modules that transform every aspect of care - from staff burnout to family trust to resident happiness
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {revolutionaryFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-8 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">{feature.category}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {feature.description}
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                  <p className="text-sm font-semibold text-green-800">
                    Impact: {feature.impact}
                  </p>
                </div>
                
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

      {/* Metrics Comparison Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Industry-Leading Results
            </h2>
            <p className="text-xl text-gray-600">
              See how WriteCareConnect customers outperform industry averages
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-sm text-gray-600 mb-1">Staff Retention</div>
              <div className="text-xs text-gray-500">vs 65% industry avg</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">96%</div>
              <div className="text-sm text-gray-600 mb-1">Family Satisfaction</div>
              <div className="text-xs text-gray-500">vs 78% industry avg</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">92%</div>
              <div className="text-sm text-gray-600 mb-1">Resident Happiness</div>
              <div className="text-xs text-gray-500">vs 71% industry avg</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">90%</div>
              <div className="text-sm text-gray-600 mb-1">Outstanding CQC</div>
              <div className="text-xs text-gray-500">vs 23% industry avg</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Results from Real Care Homes
            </h2>
            <p className="text-xl text-gray-600">
              See how WriteCareConnect transforms care homes from struggling to outstanding
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="border-t pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  <div className="text-blue-600 text-sm font-medium">{testimonial.facility}</div>
                  <div className="text-green-600 text-xs mt-1 font-medium">{testimonial.metrics}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Revolutionary Your Care Home?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join the care revolution. Transform from a place people dread to a destination families fight to access. 
            Make staff love their jobs, families trust completely, and residents truly thrive.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/demo">
                See the Revolution
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600" asChild>
              <Link to="/contact">Transform Your Care Home</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}