import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Users,
  ArrowRight,
  Download,
  Eye,
  Zap,
  Clock,
  Award,
  Activity,
  DollarSign
} from 'lucide-react'

const analyticsFeatures = [
  {
    icon: BarChart3,
    title: "Real-Time Dashboards",
    description: "Comprehensive dashboards that provide instant insights into all aspects of your care home operations.",
    benefits: ["Live data updates", "Customizable views", "Mobile responsive"]
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description: "Track key performance indicators and identify trends to optimize care quality and operational efficiency.",
    benefits: ["KPI monitoring", "Trend analysis", "Benchmarking"]
  },
  {
    icon: FileText,
    title: "Automated Reporting",
    description: "Generate detailed reports automatically for CQC compliance, management reviews, and stakeholder updates.",
    benefits: ["Scheduled reports", "Custom templates", "Multi-format export"]
  },
  {
    icon: Target,
    title: "Predictive Analytics",
    description: "Use AI-powered insights to predict outcomes and prevent issues before they occur.",
    benefits: ["Risk prediction", "Outcome forecasting", "Early warnings"]
  },
  {
    icon: Users,
    title: "Staff Performance",
    description: "Monitor staff productivity, satisfaction, and development with comprehensive workforce analytics.",
    benefits: ["Performance metrics", "Training analytics", "Retention insights"]
  },
  {
    icon: Activity,
    title: "Resident Outcomes",
    description: "Track resident health outcomes, satisfaction, and quality of life improvements over time.",
    benefits: ["Health monitoring", "Satisfaction tracking", "Care effectiveness"]
  }
]

const analyticsMetrics = [
  {
    metric: "Operational Efficiency",
    value: "+34%",
    improvement: "Average improvement",
    description: "Across all care homes",
    icon: Zap
  },
  {
    metric: "Cost Reduction",
    value: "£89k",
    improvement: "Annual savings",
    description: "Per care home average",
    icon: DollarSign
  },
  {
    metric: "Compliance Score",
    value: "98.7%",
    improvement: "+23%",
    description: "Regulatory compliance",
    icon: CheckCircle
  },
  {
    metric: "Response Time",
    value: "67%",
    improvement: "Faster decisions",
    description: "Data-driven insights",
    icon: Clock
  }
]

const testimonial = {
  quote: "The analytics platform transformed how we run our care homes. We can spot issues before they become problems and our CQC rating improved from Good to Outstanding.",
  author: "James Wilson",
  role: "Regional Manager",
  home: "Sunshine Care Group, Yorkshire",
  homes: "8 care homes"
}

const dashboardData = {
  occupancy: 94,
  satisfaction: 96,
  compliance: 98,
  efficiency: 87,
  alerts: [
    { type: "success", message: "Monthly compliance target achieved" },
    { type: "warning", message: "Staff training renewals due this week" },
    { type: "info", message: "New analytics report available" }
  ]
}

export const AnalyticsReportingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-6">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics & Reporting
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Data-Driven
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600"> Excellence</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Transform your care home operations with comprehensive analytics and intelligent 
                reporting. Make informed decisions, predict outcomes, and achieve exceptional 
                results with real-time insights and automated reporting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="care">
                  Explore Analytics
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <Download className="mr-2 h-5 w-5" />
                  Sample Reports
                </Button>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Dashboard</h3>
                  <p className="text-gray-600">Real-time operational insights</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">{dashboardData.occupancy}%</div>
                    <div className="text-sm text-gray-600">Occupancy Rate</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{dashboardData.satisfaction}%</div>
                    <div className="text-sm text-gray-600">Satisfaction</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{dashboardData.compliance}%</div>
                    <div className="text-sm text-gray-600">Compliance</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{dashboardData.efficiency}%</div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {dashboardData.alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      alert.type === 'success' ? 'bg-green-50 text-green-800' :
                      alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                      'bg-blue-50 text-blue-800'
                    }`}>
                      <div className="flex items-center">
                        {alert.type === 'success' ? (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 mr-2" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        <span className="text-sm font-medium">{alert.message}</span>
                      </div>
                    </div>
                  ))}
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
              Measurable Business Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Care homes using our analytics platform see significant improvements 
              in efficiency, compliance, and overall operational performance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {analyticsMetrics.map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-6">
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
              Comprehensive Analytics Suite
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to analyze, understand, and optimize your care home 
              operations with intelligent dashboards and automated reporting.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {analyticsFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-lg flex items-center justify-center mb-6">
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

      {/* Report Types */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Automated Report Generation
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Save hours every week with intelligent report generation that creates 
                professional, comprehensive reports automatically for all your stakeholders.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    title: "CQC Compliance Reports",
                    description: "Automated compliance reporting that maps directly to CQC standards"
                  },
                  {
                    title: "Management Dashboards",
                    description: "Executive summaries with key metrics and performance indicators"
                  },
                  {
                    title: "Financial Analytics",
                    description: "Cost analysis, budget tracking, and revenue optimization insights"
                  },
                  {
                    title: "Quality Assurance",
                    description: "Care quality metrics, incident analysis, and improvement recommendations"
                  }
                ].map((report, index) => (
                  <div key={index} className="flex">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-4 mt-1">
                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                      <p className="text-gray-600">{report.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Button variant="care" size="lg">
                  View Sample Reports
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Report Scheduler</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { report: "Monthly CQC Report", next: "Tomorrow 9:00 AM", status: "scheduled" },
                    { report: "Weekly Performance Summary", next: "Friday 5:00 PM", status: "scheduled" },
                    { report: "Quarterly Financial Analysis", next: "Next Month", status: "pending" },
                    { report: "Annual Compliance Review", next: "December 2024", status: "pending" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{item.report}</div>
                        <div className="text-sm text-gray-600">{item.next}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'scheduled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-white rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="text-sm text-gray-800 font-medium">
                      Next report generates in 14 hours
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4 mr-2" />
            Analytics Success Story
          </div>
          <blockquote className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
            "{testimonial.quote}"
          </blockquote>
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">JW</span>
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">{testimonial.author}</div>
              <div className="text-gray-600">{testimonial.role}</div>
              <div className="text-sm text-gray-500">{testimonial.home}</div>
              <div className="text-sm text-indigo-600 font-medium">{testimonial.homes}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Transform Your Data Into Insights
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join hundreds of care homes that have revolutionized their operations 
            with data-driven decision making and intelligent analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <BarChart3 className="mr-2 h-5 w-5" />
              Start Analytics Trial
            </Button>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-indigo-600">
                Watch Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-indigo-100 text-sm mt-6">
            30-day free trial • No setup fees • Unlimited reports and dashboards
          </p>
        </div>
      </section>
    </div>
  )
}