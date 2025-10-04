import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Calendar } from '../components/ui/Calendar'
import { TimeSlotPicker } from '../components/ui/TimeSlotPicker'
import { 
  Clock, 
  Phone, 
  Mail,
  CheckCircle,
  ArrowRight,
  Home,
  Calendar as CalendarIcon
} from 'lucide-react'



const demoTypes = [
  {
    type: 'Quick Overview',
    duration: '15 minutes',
    description: 'Perfect for a first look at WriteCareNotes features'
  },
  {
    type: 'Full Demo',
    duration: '30 minutes', 
    description: 'Comprehensive walkthrough of all care home management features'
  },
  {
    type: 'Custom Demo',
    duration: '45 minutes',
    description: 'Tailored demonstration focused on your specific care home needs'
  }
]

export const DemoPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    careHomeName: '',
    role: '',
    bedCount: '',
    demoType: '',
    questions: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time for your demo')
      return
    }
    
    const demoBooking = {
      ...formData,
      preferredDate: selectedDate.toISOString(),
      preferredTime: selectedTime
    }
    
    console.log('Demo booking:', demoBooking)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Demo Booked Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your interest in WriteCareNotes. One of our care sector specialists 
            will contact you within 2 hours to confirm your demo appointment.
          </p>
          <div className="space-y-3">
            <Link to="/">
              <Button variant="care" size="lg" className="w-full">
                Return to Homepage
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="w-full">
                View Pricing Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <Home className="h-5 w-5" />
                <span className="text-sm">Back to Homepage</span>
              </Link>
            </div>
          </div>
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-900">Book Your Demo</h1>
            <p className="text-lg text-gray-600 mt-2">
              See how WriteCareNotes can transform your care home operations
            </p>
          </div>
        </div>
      </div>

      {/* Demo Types */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Demo Type</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {demoTypes.map((demo, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{demo.type}</h3>
                    <p className="text-sm text-gray-600">{demo.duration}</p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{demo.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Your Demo</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Care Home Information */}
              <div>
                <label htmlFor="careHomeName" className="block text-sm font-medium text-gray-700 mb-2">
                  Care Home Name *
                </label>
                <input
                  type="text"
                  id="careHomeName"
                  name="careHomeName"
                  required
                  value={formData.careHomeName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select role</option>
                    <option value="care-home-manager">Care Home Manager</option>
                    <option value="registered-manager">Registered Manager</option>
                    <option value="deputy-manager">Deputy Manager</option>
                    <option value="operations-director">Operations Director</option>
                    <option value="owner">Owner</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bedCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Beds
                  </label>
                  <select
                    id="bedCount"
                    name="bedCount"
                    value={formData.bedCount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select bed count</option>
                    <option value="1-20">1-20 beds</option>
                    <option value="21-40">21-40 beds</option>
                    <option value="41-60">41-60 beds</option>
                    <option value="61-80">61-80 beds</option>
                    <option value="81+">81+ beds</option>
                  </select>
                </div>
              </div>

              {/* Demo Preferences */}
              <div>
                <label htmlFor="demoType" className="block text-sm font-medium text-gray-700 mb-2">
                  Demo Type *
                </label>
                <select
                  id="demoType"
                  name="demoType"
                  required
                  value={formData.demoType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select demo type</option>
                  <option value="quick">Quick Overview (15 min)</option>
                  <option value="full">Full Demo (30 min)</option>
                  <option value="custom">Custom Demo (45 min)</option>
                </select>
              </div>

              {/* Date and Time Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                  Schedule Your Demo
                </h3>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Date *
                    </label>
                    <Calendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Time *
                    </label>
                    <TimeSlotPicker
                      selectedTime={selectedTime}
                      onTimeSelect={setSelectedTime}
                      selectedDate={selectedDate}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="questions" className="block text-sm font-medium text-gray-700 mb-2">
                  Questions or Specific Areas of Interest
                </label>
                <textarea
                  id="questions"
                  name="questions"
                  rows={4}
                  value={formData.questions}
                  onChange={handleInputChange}
                  placeholder="Tell us about any specific features you'd like to see or questions you have..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Booking Confirmation */}
              {selectedDate && selectedTime && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Demo Scheduled
                  </h4>
                  <div className="text-sm text-green-800">
                    <p><strong>Date:</strong> {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p><strong>Time:</strong> {selectedTime}</p>
                    <p><strong>Duration:</strong> 30-45 minutes</p>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                variant="care" 
                size="lg" 
                className="w-full"
                disabled={!selectedDate || !selectedTime}
              >
                Book Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>

          {/* Demo Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What to Expect</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Personalized Walkthrough</h4>
                    <p className="text-gray-600 text-sm">See how WriteCareNotes works specifically for your care home type and size</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">CQC Compliance Focus</h4>
                    <p className="text-gray-600 text-sm">Learn how our platform helps maintain outstanding CQC ratings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Q&A Session</h4>
                    <p className="text-gray-600 text-sm">Get answers to all your questions about implementation and features</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Custom Pricing</h4>
                    <p className="text-gray-600 text-sm">Receive a tailored quote based on your specific requirements</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
              <p className="text-gray-700 text-sm mb-4">
                Prefer to speak with someone directly? Our care sector specialists are available.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">+44 20 7946 0958</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">demos@writecarenotes.co.uk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}