import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { 
  Shield, 
  Heart, 
  Users, 
  Award, 
  Building, 
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Clock
} from 'lucide-react'

const values = [
  {
    icon: Heart,
    title: "Compassionate Care",
    description: "We believe that every resident deserves dignity, respect, and compassionate care. Our platform is designed to support care professionals in delivering the highest quality of life."
  },
  {
    icon: Shield,
    title: "Trust & Reliability", 
    description: "Care homes trust us with their most important responsibilities. We maintain the highest standards of security, compliance, and reliability in everything we do."
  },
  {
    icon: Users,
    title: "Community Partnership",
    description: "We work hand-in-hand with care home professionals across the British Isles, building lasting partnerships that improve outcomes for residents and staff alike."
  },
  {
    icon: Award,
    title: "Excellence in Service",
    description: "Our commitment to excellence drives continuous innovation and improvement, ensuring our platform evolves with the needs of the care sector."
  }
]

const team = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Chief Executive Officer",
    bio: "Former NHS Director with 20+ years in healthcare management. Passionate about improving care home operations through technology.",
    location: "London, England"
  },
  {
    name: "James Robertson",
    role: "Chief Technology Officer", 
    bio: "Senior healthcare software architect with expertise in compliance systems and secure medical record management.",
    location: "Edinburgh, Scotland"
  },
  {
    name: "Emma Williams",
    role: "Head of Care Operations",
    bio: "Registered Care Manager with 15 years experience in residential care. Specialist in CQC compliance and quality assurance.",
    location: "Cardiff, Wales"
  },
  {
    name: "Michael O'Connor",
    role: "Director of Customer Success",
    bio: "Care home operations specialist focused on helping facilities optimize their workflows and achieve outstanding CQC ratings.",
    location: "Belfast, Northern Ireland"
  }
]

const stats = [
  { label: "Years of Experience", value: "12+" },
  { label: "Care Homes Served", value: "500+" },
  { label: "Team Members", value: "50+" },
  { label: "Countries Served", value: "4" }
]

export const AboutPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              About 
              <span className="text-primary font-bold"> WriteCareNotes</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              We're dedicated to supporting care home professionals across the British Isles 
              with innovative technology that improves resident care and operational efficiency.
            </p>
            <div className="flex justify-center">
              <Link to="/contact">
                <Button variant="care" size="lg">
                  Get in Touch
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                To empower care home professionals with technology that enhances resident care, 
                simplifies compliance, and supports the dedicated staff who make a difference 
                every day in the lives of those they serve.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Since 2012, we've been working exclusively with care homes across England, 
                Scotland, Wales, and Northern Ireland, developing deep expertise in the 
                unique challenges and requirements of the residential care sector.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-blue-50 border border-blue-200 p-8 rounded-2xl">
                <Building className="h-16 w-16 text-primary mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Built for Care Homes
                </h3>
                <p className="text-gray-700 mb-6">
                  Unlike generic healthcare software, WriteCareNotes is purpose-built 
                  exclusively for residential care homes. Every feature has been designed 
                  with input from care managers, nurses, and support staff.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <Shield className="h-5 w-5 text-green-600 mr-3" />
                    CQC compliance built-in from day one
                  </li>
                  <li className="flex items-center">
                    <Clock className="h-5 w-5 text-green-600 mr-3" />
                    24/7 support from care sector specialists
                  </li>
                  <li className="flex items-center">
                    <MapPin className="h-5 w-5 text-green-600 mr-3" />
                    Covers all four countries of the British Isles
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do in service of care home 
              professionals and the residents they support.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex p-3 rounded-lg mb-4 bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Leadership Team
            </h2>
            <p className="text-xl text-gray-600">
              Meet the care professionals and technology experts leading WriteCareNotes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-primary font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {member.bio}
                </p>
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  {member.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-6 text-gray-600">
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-semibold text-gray-900 mb-2">2012 - The Beginning</h3>
                  <p>
                    Founded by care professionals who experienced firsthand the challenges 
                    of managing compliance and resident care with outdated systems.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-semibold text-gray-900 mb-2">2015 - CQC Integration</h3>
                  <p>
                    Became the first platform to offer built-in CQC compliance monitoring, 
                    helping care homes achieve outstanding ratings consistently.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-semibold text-gray-900 mb-2">2018 - British Isles Expansion</h3>
                  <p>
                    Extended our services across Scotland, Wales, and Northern Ireland, 
                    adapting to local regulations and care standards.
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-semibold text-gray-900 mb-2">2024 - Enterprise Innovation</h3>
                  <p>
                    Launched our enterprise platform, now serving over 500 care homes 
                    and 25,000+ residents across the British Isles.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Recognition & Compliance
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <Award className="h-8 w-8 text-green-600 mr-4" />
                    <div>
                      <div className="font-semibold text-gray-900">CQC Approved Technology</div>
                      <div className="text-sm text-gray-600">Certified for use in all CQC regulated facilities</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <Shield className="h-8 w-8 text-blue-600 mr-4" />
                    <div>
                      <div className="font-semibold text-gray-900">GDPR Compliant</div>
                      <div className="text-sm text-gray-600">Full data protection compliance for resident information</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                    <Building className="h-8 w-8 text-purple-600 mr-4" />
                    <div>
                      <div className="font-semibold text-gray-900">Industry Partnership</div>
                      <div className="text-sm text-gray-600">Preferred technology partner for leading care groups</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 care-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Work with Us?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our growing community of care home professionals who trust 
            WriteCareNotes for their daily operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                Book a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="xl" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary">
                <Mail className="mr-2 h-5 w-5" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}