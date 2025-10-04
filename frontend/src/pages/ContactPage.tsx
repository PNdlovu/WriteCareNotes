import React, { useState } from 'react'
import { Button } from '../components/ui/Button'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  Building,
  MessageCircle,
  CheckCircle
} from 'lucide-react'

const contactMethods = [
  {
    icon: Phone,
    title: "Phone Support",
    description: "Speak directly with our care sector specialists",
    details: "+44 20 7946 0958",
    availability: "Mon-Fri: 8:00 AM - 6:00 PM GMT",
    color: "text-blue-600"
  },
  {
    icon: Mail,
    title: "Email Support", 
    description: "Get detailed assistance via email",
    details: "support@writecarenotes.co.uk",
    availability: "Response within 4 hours",
    color: "text-green-600"
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Instant help from our support team",
    details: "Available in your dashboard",
    availability: "Mon-Fri: 8:00 AM - 6:00 PM GMT",
    color: "text-purple-600"
  }
]

const offices = [
  {
    country: "England",
    city: "London",
    address: "125 Harley Street, London W1G 6AX",
    phone: "+44 20 7946 0958",
    email: "london@writecarenotes.co.uk"
  },
  {
    country: "Scotland", 
    city: "Edinburgh",
    address: "32 Charlotte Square, Edinburgh EH2 4ET",
    phone: "+44 131 668 8200",
    email: "edinburgh@writecarenotes.co.uk"
  },
  {
    country: "Wales",
    city: "Cardiff",
    address: "1 Caspian Point, Cardiff Bay CF10 4DQ",
    phone: "+44 29 2089 4500",
    email: "cardiff@writecarenotes.co.uk"
  },
  {
    country: "Northern Ireland",
    city: "Belfast",
    address: "Titanic Belfast, 1 Olympic Way BT3 9EP",
    phone: "+44 28 9076 6386",
    email: "belfast@writecarenotes.co.uk"
  }
]

const inquiryTypes = [
  { value: "demo", label: "Book a Demo" },
  { value: "sales", label: "Sales Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing Question" },
  { value: "partnership", label: "Partnership Opportunity" },
  { value: "other", label: "Other" }
]

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    careHomeName: '',
    inquiryType: '',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="flex-1 flex items-center justify-center bg-gray-50 py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Thank You for Contacting Us
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We've received your inquiry and one of our care sector specialists will 
              contact you within 2 business hours during our operating hours.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              For urgent support needs, please call us directly at +44 20 7946 0958
            </p>
            <Button 
              variant="care" 
              onClick={() => setIsSubmitted(false)}
              className="mr-4"
            >
              Send Another Message
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Return to Homepage
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Contact 
              <span className="text-primary font-bold"> Our Team</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get in touch with our care sector specialists. We're here to help you 
              improve your care home operations and achieve outstanding CQC ratings.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-md transition-shadow">
                <div className={`inline-flex p-3 rounded-lg mb-4 ${method.color} bg-opacity-10`}>
                  <method.icon className={`h-6 w-6 ${method.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {method.title}
                </h3>
                <p className="text-gray-600 mb-3">
                  {method.description}
                </p>
                <p className="text-lg font-medium text-gray-900 mb-1">
                  {method.details}
                </p>
                <p className="text-sm text-gray-500">
                  {method.availability}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and Offices */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send Us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
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
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="careHomeName" className="block text-sm font-medium text-gray-700 mb-2">
                    Care Home Name
                  </label>
                  <input
                    type="text"
                    id="careHomeName"
                    name="careHomeName"
                    value={formData.careHomeName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type *
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    required
                    value={formData.inquiryType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select an option</option>
                    {inquiryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your care home and how we can help..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <Button type="submit" variant="care" size="lg" className="w-full">
                  Send Message
                  <Send className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </div>

            {/* Office Locations */}
            <div className="mt-12 lg:mt-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Our Offices
              </h2>
              <p className="text-gray-600 mb-8">
                We have local teams across the British Isles to provide personalized 
                support for care homes in your region.
              </p>
              
              <div className="space-y-6">
                {offices.map((office, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {office.city}, {office.country}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {office.address}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {office.phone}
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            {office.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Clock className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Business Hours
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Monday - Friday: 8:00 AM - 6:00 PM GMT</div>
                      <div>Saturday: 9:00 AM - 1:00 PM GMT</div>
                      <div>Sunday: Emergency support only</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-16 bg-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Emergency Support
          </h2>
          <p className="text-gray-600 mb-6">
            For urgent technical issues affecting resident care, we provide 24/7 emergency support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="destructive" size="lg">
              <Phone className="mr-2 h-5 w-5" />
              Emergency: +44 800 123 4567
            </Button>
            <Button variant="outline" size="lg">
              <Mail className="mr-2 h-5 w-5" />
              urgent@writecarenotes.co.uk
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}