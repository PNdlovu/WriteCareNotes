import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Heart, FileText, Calendar, Activity } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function ResidentCarePlansPage() {
  return (
    <div className="min-h-screen bg-white">
      
      <section className="bg-gradient-to-br from-orange-50 to-amber-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-orange-600 font-semibold">Resident Care Plans</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Personalized Care Planning & Resident Management
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create comprehensive, individualized care plans that ensure each resident receives 
              the personalized attention and care they deserve.
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
                title: 'Individual Care Plans',
                icon: Heart,
                description: 'Comprehensive care plans tailored to each resident\'s unique needs',
                features: ['Personal preferences', 'Medical history', 'Care goals', 'Review scheduling']
              },
              {
                title: 'Health Monitoring',
                icon: Activity,
                description: 'Track vital signs, medications, and health indicators',
                features: ['Vital signs tracking', 'Medication schedules', 'Health alerts', 'Progress reports']
              },
              {
                title: 'Activity Planning',
                icon: Calendar,
                description: 'Plan and track activities that promote wellbeing and engagement',
                features: ['Activity scheduling', 'Participation tracking', 'Social interaction', 'Progress monitoring']
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8">
                <div className="bg-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
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