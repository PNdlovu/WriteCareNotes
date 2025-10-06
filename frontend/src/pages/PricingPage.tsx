import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Check, 
  X, 
  Phone, 
  Users, 
  ArrowRight,
  Star,
  Award,
  BarChart3,
  Headphones,
  Shield,
  CheckCircle,
  Brain,
  Heart,
  Zap
} from 'lucide-react'

const pricingPlans = [
  {
    name: "Essential Care",
    description: "Perfect for smaller care homes (5-25 residents) starting their digital journey",
    monthlyPrice: 99,
    yearlyPrice: 990,
    maxResidents: 25,
    maxStaff: 15,
    setup: "Standard setup & training included",
    support: "Email & chat support (9am-5pm)",
    features: [
      "Core resident management system",
      "Basic care planning & documentation",
      "Staff scheduling & shift management",
      "CQC compliance monitoring",
      "Digital care records",
      "Family communication portal",
      "Basic reporting dashboard",
      "Mobile app access",
      "Email notifications",
      "5GB secure storage",
      "GDPR compliance tools",
      "Video calling (up to 4 participants)"
    ],
    addOnsAvailable: [
      "AI Care Insights",
      "Advanced Analytics",
      "Staff Wellness Monitoring",
      "Priority Support"
    ],
    notIncluded: [
      "Advanced AI features",
      "Multi-channel messaging",
      "Advanced analytics",
      "Phone support"
    ],
    popular: false,
    cta: "Start Free Trial",
    color: "border-gray-200",
    badge: "Great for Small Homes"
  },
  {
    name: "Professional Care",
    description: "Comprehensive solution for medium care homes (25-75 residents)",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    maxResidents: 75,
    maxStaff: 50,
    setup: "Premium setup, training & data migration",
    support: "Priority phone & email support",
    features: [
      "Everything in Essential Care",
      "AI-powered care insights & predictions",
      "Advanced care planning workflows",
      "Multi-channel messaging (SMS, Email, Push)",
      "Staff wellness monitoring dashboard",
      "Advanced family portal with transparency",
      "Incident reporting & management",
      "Custom forms & care pathways",
      "API integrations",
      "Advanced analytics & insights",
      "25GB secure storage",
      "Video calling (unlimited participants)",
      "Automated compliance reporting",
      "Quality assurance tools"
    ],
    addOnsAvailable: [
      "Enterprise Security",
      "White-label Solution",
      "Custom Integrations",
      "24/7 Support"
    ],
    notIncluded: [
      "Dedicated account manager",
      "Custom white-labeling",
      "24/7 support"
    ],
    popular: true,
    cta: "Start Free Trial",
    color: "border-primary",
    badge: "Most Popular"
  },
  {
    name: "Enterprise Care",
    description: "Complete platform for large homes & care groups (75+ residents)",
    monthlyPrice: 349,
    yearlyPrice: 3490,
    maxResidents: "Unlimited",
    maxStaff: "Unlimited",
    setup: "White-glove implementation & training",
    support: "Dedicated support team & account manager",
    features: [
      "Everything in Professional Care",
      "Complete AI supervision platform",
      "Enterprise security & compliance",
      "Multi-location management",
      "Custom API integrations",
      "Advanced reporting suite",
      "Dedicated account manager",
      "Priority phone support",
      "Custom training programs",
      "White-label options",
      "Unlimited storage",
      "Custom workflows & automations",
      "SLA guarantee (99.9% uptime)",
      "Regulatory compliance suite",
      "Data export & migration tools",
      "24/7 monitoring & alerts"
    ],
    addOnsAvailable: [
      "Custom Development",
      "Additional Training",
      "Compliance Consulting"
    ],
    notIncluded: [],
    popular: false,
    cta: "Contact Sales",
    color: "border-gray-200",
    badge: "Enterprise Scale"
  }
]

const addOns = [
  {
    name: "AI Care Insights",
    description: "OpenAI-powered summarization, sentiment analysis, and predictive care recommendations",
    price: "£39/month",
    icon: Brain,
    availableFor: ["Essential Care", "Professional Care", "Enterprise Care"]
  },
  {
    name: "Advanced Analytics",
    description: "Detailed insights, predictive analytics, and custom reporting for operations optimization",
    price: "£49/month", 
    icon: BarChart3,
    availableFor: ["Essential Care", "Professional Care", "Enterprise Care"]
  },
  {
    name: "Staff Wellness Monitoring",
    description: "Complete burnout prevention, wellness tracking, and staff satisfaction management",
    price: "£59/month",
    icon: Heart,
    availableFor: ["Essential Care", "Professional Care", "Enterprise Care"]
  },
  {
    name: "Multi-Channel Messaging",
    description: "SMS, Email, Push notifications with bulk campaigns and automated workflows",
    price: "£29/month",
    icon: Zap,
    availableFor: ["Essential Care"]
  },
  {
    name: "Priority Support",
    description: "Phone support during business hours with faster response times",
    price: "£79/month",
    icon: Headphones,
    availableFor: ["Essential Care", "Professional Care"]
  },
  {
    name: "24/7 Support",
    description: "Round-the-clock technical support for critical issues and emergencies",
    price: "£149/month",
    icon: Shield,
    availableFor: ["Essential Care", "Professional Care"]
  },
  {
    name: "Enterprise Security",
    description: "Advanced security features, SOC2 compliance, and enhanced audit logging",
    price: "£99/month",
    icon: Shield,
    availableFor: ["Professional Care"]
  },
  {
    name: "Training Management",
    description: "Complete staff training, certification tracking, and compliance management",
    price: "£39/month",
    icon: Award,
    availableFor: ["Essential Care", "Professional Care", "Enterprise Care"]
  }
]

const faqs = [
  {
    question: "Can small care homes access advanced features like AI?",
    answer: "Absolutely! We believe every care home deserves access to the best technology. All add-on features, including AI-powered insights, are available to every plan. Small homes can add AI features for just £39/month - no feature lock-out based on size."
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes, we offer a 30-day free trial for all plans with full access to features. No credit card required to start, and you can upgrade or add features anytime during your trial."
  },
  {
    question: "What happens if we grow beyond our plan limits?",
    answer: "We're flexible! We'll contact you before you reach limits and help you upgrade smoothly. No service interruption - we want to grow with you. You can also temporarily exceed limits without penalty."
  },
  {
    question: "How does pricing work for very small care homes?",
    answer: "Our Essential Care plan starts at just £99/month for homes with 5-25 residents. We've specifically designed this to be affordable for smaller homes while still providing comprehensive care management and CQC compliance tools."
  },
  {
    question: "Can we add and remove features as needed?",
    answer: "Yes! Add-on features can be added or removed monthly. This gives you complete flexibility to try new features, scale up during busy periods, or adjust based on your budget and needs."
  },
  {
    question: "What's included in setup and training?",
    answer: "All plans include setup assistance and basic training. Professional and Enterprise plans include data migration, extended training sessions, and ongoing support to ensure successful implementation."
  },
  {
    question: "Do you offer discounts for care home groups?",
    answer: "Yes, we offer volume discounts for care home groups and multi-location operators. Contact our sales team for custom pricing that scales with your organization's size and needs."
  },
  {
    question: "Is the platform suitable for specialized care homes?",
    answer: "Absolutely! Our platform supports all types of care including residential, nursing, dementia, learning disabilities, and mental health. The system adapts to your specific care requirements and regulatory standards."
  }
]

export const PricingPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Award className="h-4 w-4 mr-2" />
              Trusted by 500+ Care Homes
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Fair Pricing for 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Every Care Home</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              From small family-run homes to large care groups - comprehensive features 
              that scale with your needs. No care home left behind with our add-on approach 
              that gives everyone access to advanced AI and automation.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mb-12">
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="h-4 w-4 mr-2 text-green-600" />
                30-day free trial
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                No setup fees
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Award className="h-4 w-4 mr-2 text-green-600" />
                CQC compliance guarantee
              </div>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-12">
              <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${billingPeriod === 'yearly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Yearly
                <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                  Save 10%
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl border-2 ${plan.color} ${
                  plan.popular ? 'scale-105 shadow-2xl ring-2 ring-primary/20' : ''
                } p-8 transition-all duration-300 hover:shadow-2xl`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-full shadow-lg ${
                      plan.popular 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-900 text-white'
                    }`}>
                      <Star className="w-4 h-4 mr-1" />
                      {plan.badge}
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-gray-900">
                        £{billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                      </span>
                      <span className="text-gray-500 ml-2 text-lg">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <p className="text-green-600 text-sm font-medium mt-2">
                        Save £{(plan.monthlyPrice * 12) - plan.yearlyPrice} annually
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Residents:</span>
                        <div className="font-semibold text-gray-900">{plan.maxResidents}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Staff:</span>
                        <div className="font-semibold text-gray-900">{plan.maxStaff}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Setup:</span>
                        <div className="font-semibold text-gray-900 text-xs">{plan.setup}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Support:</span>
                        <div className="font-semibold text-gray-900 text-xs">{plan.support}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.addOnsAvailable && plan.addOnsAvailable.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Available Add-ons:</h4>
                      <div className="flex flex-wrap gap-1">
                        {plan.addOnsAvailable.map((addon, addonIndex) => (
                          <span key={addonIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {addon}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {plan.notIncluded && plan.notIncluded.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start opacity-50">
                      <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-500 text-sm line-through">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to={plan.name === 'Enterprise' ? '/contact' : '/demo'}>
                  <Button
                    variant={plan.popular ? 'care' : 'outline'}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                    {plan.name !== 'Enterprise' && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Flexible Add-On Features
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Enhance any plan with specialized features that grow with your care home
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4 mr-2" />
              All care homes can access any add-on feature
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="inline-flex p-3 rounded-lg mb-4 bg-primary/10">
                  <addon.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {addon.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {addon.description}
                </p>
                <div className="text-lg font-bold text-primary mb-4">
                  {addon.price}
                </div>
                <div className="text-xs text-gray-500">
                  Available for: {addon.availableFor.join(', ')}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <div className="bg-blue-50 rounded-xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No Feature Lock-Out Policy
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                We believe every care home, regardless of size, should have access to the best technology. 
                All add-on features are available to every plan, ensuring small care homes aren't locked out of advanced capabilities.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">5+</div>
                  <div className="text-sm text-gray-600">Resident homes can access AI features</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                  <div className="text-sm text-gray-600">Feature parity across all plans</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                  <div className="text-sm text-gray-600">Hidden costs or setup fees</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inclusive Philosophy Section */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Built for All Care Home Sizes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our mission is to ensure every resident receives outstanding care, 
              regardless of their care home's size or budget.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Small Homes (5-25 beds)</h3>
              <p className="text-gray-600 text-sm">
                Essential Care plan with full core features and optional AI add-ons starting at £99/month
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Medium Homes (25-75 beds)</h3>
              <p className="text-gray-600 text-sm">
                Professional Care with AI included, advanced analytics, and comprehensive family engagement
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Large Homes (75+ beds)</h3>
              <p className="text-gray-600 text-sm">
                Enterprise Care with white-label options, unlimited users, and dedicated support
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Care Groups</h3>
              <p className="text-gray-600 text-sm">
                Custom pricing with volume discounts, multi-location management, and group analytics
              </p>
            </div>
          </div>
          
          <div className="mt-12 bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment to Small Care Homes</h3>
              <p className="text-lg text-gray-600">
                We understand that small care homes are the backbone of personalized care. 
                That's why we've designed our pricing to be accessible while ensuring no compromise on quality.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">£3.96</div>
                <div className="text-sm text-gray-600">Per resident per month<br/>(25-bed home on Essential Care)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Feature access with add-ons<br/>(No features locked out)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">30</div>
                <div className="text-sm text-gray-600">Day free trial<br/>(Full access, no restrictions)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What's Included
            </h2>
            <p className="text-xl text-gray-600">
              Compare features across all plans
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      Essential Care
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      Professional Care
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      Enterprise Care
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Resident Management & Care Planning</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">CQC Compliance & Reporting</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Family Communication Portal</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Video Calling & Communication</td>
                    <td className="px-6 py-4 text-center text-sm">Up to 4 people</td>
                    <td className="px-6 py-4 text-center text-sm">Unlimited</td>
                    <td className="px-6 py-4 text-center text-sm">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">AI-Powered Care Insights (Add-on)</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">Available £39/mo</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Multi-Channel Messaging (SMS/Email/Push)</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">Available £29/mo</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Staff Wellness Monitoring (Add-on)</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">Available £59/mo</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">Available £59/mo</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Advanced Analytics & Reporting</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">Available £49/mo</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Phone Support</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">Available £79/mo</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">API Access & Integrations</td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">24/7 Support</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">Available £149/mo</td>
                    <td className="px-6 py-4 text-center text-sm text-blue-600">Available £149/mo</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Dedicated Account Manager</td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Get answers to common questions about our pricing and plans
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <span className="text-gray-500">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4 mr-2" />
            Customer Success Story
          </div>
          <blockquote className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
            "WriteCareNotes has saved us £200,000 annually in admin costs while improving our CQC rating to Outstanding. The ROI was clear within 3 months."
          </blockquote>
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">JM</span>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Julia Martinez</div>
              <div className="text-gray-600">Operations Director</div>
              <div className="text-sm text-gray-500">Harmony Care Group, Bristol</div>
              <div className="text-sm text-green-600 font-medium">12 care homes, 450+ residents</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start your 30-day free trial today. No credit card required, 
            full access to all features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="xl" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary">
                <Phone className="mr-2 h-5 w-5" />
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}