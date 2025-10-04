import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, BarChart3, TrendingUp, Target } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function AnalyticsReportingPage() {
  return (
    <div className="min-h-screen bg-white">
      
      <section className="bg-gradient-to-br from-indigo-50 to-blue-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-indigo-500 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-indigo-600 font-semibold">Analytics & Reporting</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Advanced Analytics & Business Intelligence
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Make data-driven decisions with comprehensive analytics, customizable dashboards, 
              and detailed reporting across all aspects of your care home operations.
            </p>
            
            <Button size="lg" asChild>
              <Link to="/demo">
                Book a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Operational Dashboards',
                icon: BarChart3,
                description: 'Real-time insights into your care home\'s daily operations',
                features: ['Live operational metrics', 'Staff performance tracking', 'Resident wellbeing indicators', 'Resource utilization']
              },
              {
                title: 'Financial Reporting',
                icon: TrendingUp,
                description: 'Comprehensive financial analytics and budget management',
                features: ['Revenue tracking', 'Cost analysis', 'Budget forecasting', 'ROI reporting']
              },
              {
                title: 'Quality Metrics',
                icon: Target,
                description: 'Track quality indicators and compliance metrics',
                features: ['CQC compliance scores', 'Quality benchmarks', 'Improvement tracking', 'Audit reporting']
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8">
                <div className="bg-indigo-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}