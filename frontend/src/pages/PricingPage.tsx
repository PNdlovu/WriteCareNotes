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
  CheckCircle
} from 'lucide-react'

const pricingPlans = [
  {
    name: "Essential",
    description: "Perfect for smaller care homes starting their digital transformation",
    monthlyPrice: 149,
    yearlyPrice: 1490,
    maxResidents: 25,
    maxStaff: 15,
    setup: "Standard setup included",
    support: "Email & chat support",
    features: [
      "Resident management system",
      "Basic care planning",
      "Staff scheduling",
      "CQC compliance monitoring",
      "Digital care records",
      "Basic reporting dashboard",
      "Email support",
      "2GB secure storage",
      "Mobile app access",
      "GDPR compliance tools"
    ],
    notIncluded: [
      "Advanced analytics",
      "API integrations",
      "Custom workflows",
      "Priority phone support",
      "Dedicated account manager"
    ],
    popular: false,
    cta: "Start Free Trial",
    color: "border-gray-200",
    badge: null
  },
  {
    name: "Professional",
    description: "Comprehensive solution for medium to large care homes",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    maxResidents: 100,
    maxStaff: 75,
    setup: "Premium setup & training",
    support: "Priority phone & email support",
    features: [
      "Everything in Essential",
      "Advanced care planning",
      "Family portal access",
      "Advanced analytics & insights",
      "Staff training management",
      "Medication management",
      "Incident reporting system",
      "Custom forms & workflows",
      "API integrations",
      "25GB secure storage",
      "Multi-location support",
      "Advanced compliance tools"
    ],
    notIncluded: [
      "Dedicated account manager",
      "Custom integrations",
      "24/7 priority support"
    ],
    popular: true,
    cta: "Start Free Trial",
    color: "border-primary",
    badge: "Most Popular"
  },
  {
    name: "Enterprise",
    description: "Complete platform for large care home groups and chains",
    monthlyPrice: 599,
    yearlyPrice: 5990,
    maxResidents: "Unlimited",
    maxStaff: "Unlimited",
    setup: "White-glove implementation",
    support: "24/7 dedicated support team",
    features: [
      "Everything in Professional",
      "Unlimited locations",
      "Custom API integrations",
      "Advanced reporting suite",
      "Dedicated account manager",
      "24/7 priority support",
      "Custom training programs",
      "Enterprise security features",
      "Unlimited storage",
      "Custom workflows & automations",
      "SLA guarantee (99.9% uptime)",
      "Regulatory compliance suite",
      "Data export & migration tools"
    ],
    notIncluded: [],
    popular: false,
    cta: "Contact Sales",
    color: "border-gray-200",
    badge: "Enterprise"
  }
]

const addOns = [
  {
    name: "Family Portal",
    description: "Secure portal for families to access resident information",
    price: "£29/month",
    icon: Users
  },
  {
    name: "Advanced Analytics",
    description: "Detailed insights and predictive analytics for operations",
    price: "£49/month", 
    icon: BarChart3
  },
  {
    name: "Training Management",
    description: "Complete staff training and certification tracking",
    price: "£39/month",
    icon: Award
  },
  {
    name: "24/7 Support",
    description: "Round-the-clock technical support for critical issues",
    price: "£99/month",
    icon: Headphones
  }
]

const faqs = [
  {
    question: "Is there a free trial available?",
    answer: "Yes, we offer a 30-day free trial for Essential and Professional plans. No credit card required to start."
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Absolutely. You can change your plan at any time. Upgrades take effect immediately, downgrades at your next billing cycle."
  },
  {
    question: "What's included in implementation?",
    answer: "All plans include basic setup and training. Professional and Enterprise plans include data migration and extended training sessions."
  },
  {
    question: "Do you offer discounts for multiple locations?",
    answer: "Yes, we offer volume discounts for care home groups. Contact our sales team for custom pricing based on your needs."
  },
  {
    question: "Is my data secure and GDPR compliant?",
    answer: "Yes, we maintain the highest security standards with ISO 27001 certification and full GDPR compliance for all resident data."
  },
  {
    question: "What happens if I exceed my resident/staff limits?",
    answer: "We'll contact you before you reach your limits to discuss upgrading. No service interruption - we're flexible with temporary overages."
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
              Simple, Transparent 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Choose the perfect plan for your care home. All plans include 
              CQC compliance monitoring, 24/7 data security, and our commitment 
              to helping you achieve Outstanding ratings.
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
                  
                  {plan.notIncluded.map((feature, featureIndex) => (
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
              Enhanced Features
            </h2>
            <p className="text-xl text-gray-600">
              Add specialized features to meet your care home's unique needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex p-3 rounded-lg mb-4 bg-primary/10">
                  <addon.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {addon.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {addon.description}
                </p>
                <div className="text-lg font-bold text-primary">
                  {addon.price}
                </div>
              </div>
            ))}
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
                      Essential
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      Professional
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Resident Management</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">CQC Compliance</td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Advanced Analytics</td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">API Access</td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Phone Support</td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
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