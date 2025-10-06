import React from 'react'
import { Link } from 'react-router-dom'
import { Cookie, Settings, Eye, Shield, Clock, CheckCircle } from 'lucide-react'

const lastUpdated = "5th October 2025"

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
              <Cookie className="h-4 w-4 mr-2" />
              Cookie Usage
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Cookie 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600"> Policy</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              How WriteCareNotes uses cookies and similar technologies to enhance 
              your experience while protecting your privacy and ensuring compliance.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">Last updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* What are Cookies */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What are Cookies?</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <Cookie className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">Small Data Files</h3>
                  <p className="text-orange-800">
                    Cookies are small text files stored on your device when you visit websites. 
                    They help us provide you with a better experience and allow certain features to work properly.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              WriteCareNotes uses cookies responsibly and transparently. We only collect the minimum 
              data necessary to provide our services effectively while ensuring your privacy rights 
              are protected under GDPR and UK data protection law.
            </p>
          </section>

          {/* Types of Cookies */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">Essential Cookies</h3>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        Always Active
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      These cookies are necessary for the website to function properly. They enable core 
                      functionality such as security, network management, and accessibility.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Examples:</h4>
                      <ul className="space-y-1 text-gray-700 text-sm">
                        <li>• Authentication and login sessions</li>
                        <li>• Security tokens and CSRF protection</li>
                        <li>• Load balancing and server routing</li>
                        <li>• Cookie consent preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">Functional Cookies</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Optional
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      These cookies enable enhanced functionality and personalization, such as 
                      remembering your preferences and settings.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Examples:</h4>
                      <ul className="space-y-1 text-gray-700 text-sm">
                        <li>• Language and region preferences</li>
                        <li>• Display settings and themes</li>
                        <li>• Form auto-completion</li>
                        <li>• Remember user preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">Analytics Cookies</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Optional
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      These cookies help us understand how you use our website so we can improve 
                      your experience. All data is aggregated and anonymous.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Examples:</h4>
                      <ul className="space-y-1 text-gray-700 text-sm">
                        <li>• Page views and popular content</li>
                        <li>• User journey and navigation patterns</li>
                        <li>• Performance and error monitoring</li>
                        <li>• Feature usage statistics</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cookie Details Table */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Detailed Cookie Information</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cookie Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">wcn_session</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Authentication session</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Session</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Essential</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">wcn_csrf</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Security protection</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Session</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Essential</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">wcn_consent</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Cookie consent preferences</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">1 year</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Essential</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">wcn_prefs</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">User preferences</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">6 months</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Functional</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">wcn_analytics</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Usage analytics</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">2 years</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Analytics</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Third-Party Services</h2>
            <p className="text-lg text-gray-700 mb-6">
              We may use carefully selected third-party services that set their own cookies. 
              These services are chosen for their privacy standards and GDPR compliance.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Google Analytics (Optional)</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Helps us understand website usage patterns. We use IP anonymization 
                  and have data sharing disabled.
                </p>
                <div className="text-sm text-blue-700">
                  <strong>Opt-out:</strong> Available through cookie preferences
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Intercom (If Enabled)</h3>
                <p className="text-green-800 text-sm mb-3">
                  Customer support chat functionality. Only active when you choose 
                  to use the chat feature.
                </p>
                <div className="text-sm text-green-700">
                  <strong>Control:</strong> Disable by not using chat feature
                </div>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Managing Your Cookie Preferences</h2>
            
            <div className="bg-gray-50 rounded-lg p-8 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Choices</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">On Our Website</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Use our cookie consent banner</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Update preferences anytime</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>View current settings</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">In Your Browser</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Block or delete cookies</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Set cookie preferences</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Use private browsing mode</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Important Note</h3>
              <p className="text-yellow-800">
                Disabling essential cookies may affect website functionality. Some features 
                may not work properly if you block all cookies.
              </p>
            </div>
          </section>

          {/* Browser Instructions */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Browser Cookie Settings</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Chrome</h3>
                <ol className="space-y-1 text-gray-700 text-sm">
                  <li>1. Click the three dots menu</li>
                  <li>2. Go to Settings &gt; Privacy and security</li>
                  <li>3. Click "Cookies and other site data"</li>
                  <li>4. Choose your cookie settings</li>
                </ol>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Firefox</h3>
                <ol className="space-y-1 text-gray-700 text-sm">
                  <li>1. Click the menu button</li>
                  <li>2. Go to Settings</li>
                  <li>3. Click "Privacy & Security"</li>
                  <li>4. Manage cookie settings</li>
                </ol>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Safari</h3>
                <ol className="space-y-1 text-gray-700 text-sm">
                  <li>1. Go to Safari menu</li>
                  <li>2. Click Preferences</li>
                  <li>3. Go to Privacy tab</li>
                  <li>4. Adjust cookie settings</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Questions About Cookies?</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800 mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, 
                please contact our Data Protection Officer.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-800 mb-1">
                    <strong>Email:</strong> dpo@writecarenotes.com
                  </p>
                  <p className="text-blue-800">
                    <strong>Phone:</strong> +44 (0) 800 123 4567
                  </p>
                </div>
                <div>
                  <p className="text-blue-800 mb-1">
                    <strong>Response Time:</strong> Within 72 hours
                  </p>
                  <p className="text-blue-800">
                    <strong>Subject:</strong> Cookie Policy Inquiry
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Navigation */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="flex space-x-6 mb-4 sm:mb-0">
                <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy Policy
                </Link>
                <Link to="/gdpr" className="text-blue-600 hover:text-blue-700 font-medium">
                  GDPR Compliance
                </Link>
                <Link to="/security" className="text-blue-600 hover:text-blue-700 font-medium">
                  Data Security
                </Link>
                <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms of Service
                </Link>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CookiePolicyPage