import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Phone, MessageSquare, Camera, Calendar } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function FamilyPortalPage() {
  return (
    <div className="min-h-screen bg-white">
      
      <section className="bg-gradient-to-br from-pink-50 to-rose-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-pink-500 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <span className="text-pink-600 font-semibold">Family Portal</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Secure Family Communication Platform
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Keep families connected with their loved ones through our secure portal that provides 
              real-time updates, photo sharing, and easy communication with care staff.
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
                title: 'Real-time Updates',
                icon: MessageSquare,
                description: 'Instant notifications about your loved one\'s care and activities',
                features: ['Care updates', 'Activity reports', 'Health notifications', 'Emergency alerts']
              },
              {
                title: 'Photo & Video Sharing',
                icon: Camera,
                description: 'Share precious moments with photos and videos from daily activities',
                features: ['Activity photos', 'Video messages', 'Milestone celebrations', 'Memory books']
              },
              {
                title: 'Visit Management',
                icon: Calendar,
                description: 'Schedule visits and manage appointments with ease',
                features: ['Visit booking', 'Schedule coordination', 'Reminder notifications', 'Virtual visits']
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-8">
                <div className="bg-pink-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
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