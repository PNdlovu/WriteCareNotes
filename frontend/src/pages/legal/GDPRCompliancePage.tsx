import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, CheckCircle, FileCheck, Globe, Clock, AlertCircle, Eye } from 'lucide-react'

const lastUpdated = "5th October 2025"

export const GDPRCompliancePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <FileCheck className="h-4 w-4 mr-2" />
              GDPR Compliance
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              GDPR 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Compliance</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              How WriteCareNotes ensures full compliance with the General Data Protection Regulation 
              across all care home operations in the British Isles.
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
          
          {/* GDPR Overview */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our GDPR Commitment</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Full GDPR Compliance</h3>
                  <p className="text-green-800">
                    WriteCareNotes is fully compliant with the General Data Protection Regulation (GDPR) 
                    as it applies to care homes across England, Scotland, Wales, and Northern Ireland.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              As a care home management platform handling sensitive personal and health data, we take GDPR 
              compliance extremely seriously. Our platform has been designed from the ground up to ensure 
              that care homes can deliver exceptional care while maintaining the highest standards of data protection.
            </p>
          </section>

          {/* Legal Basis for Processing */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Legal Basis for Processing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Care Delivery</h3>
                <p className="text-blue-800 text-sm">
                  <strong>Article 6(1)(c) & 9(2)(h):</strong> Processing necessary for compliance with 
                  legal obligations and provision of health and social care.
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Legitimate Interests</h3>
                <p className="text-purple-800 text-sm">
                  <strong>Article 6(1)(f):</strong> Processing necessary for legitimate interests 
                  in care home administration and family communication.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Consent</h3>
                <p className="text-green-800 text-sm">
                  <strong>Article 6(1)(a) & 9(2)(a):</strong> Explicit consent for specific 
                  data processing activities where required.
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">Vital Interests</h3>
                <p className="text-orange-800 text-sm">
                  <strong>Article 6(1)(d) & 9(2)(c):</strong> Processing necessary to protect 
                  vital interests of residents in emergency situations.
                </p>
              </div>
            </div>
          </section>

          {/* Data Subject Rights */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Subject Rights</h2>
            <p className="text-lg text-gray-700 mb-6">
              Under GDPR, residents and their families have specific rights regarding their personal data. 
              WriteCareNotes facilitates the exercise of these rights:
            </p>
            
            <div className="space-y-6">
              {[
                {
                  title: "Right to Information",
                  description: "Clear information about how personal data is processed, provided through our Privacy Policy and care documentation.",
                  icon: FileCheck
                },
                {
                  title: "Right of Access",
                  description: "Residents can request access to their personal data through our secure portal or by contacting the care home directly.",
                  icon: Eye
                },
                {
                  title: "Right to Rectification",
                  description: "Incorrect or incomplete data can be corrected through our platform's audit trail and update mechanisms.",
                  icon: CheckCircle
                },
                {
                  title: "Right to Erasure",
                  description: "Right to deletion of personal data when legally permissible, balanced against care record retention requirements.",
                  icon: AlertCircle
                },
                {
                  title: "Right to Restrict Processing",
                  description: "Ability to limit how personal data is processed while maintaining essential care delivery functions.",
                  icon: Shield
                },
                {
                  title: "Right to Data Portability",
                  description: "Secure transfer of personal data when moving between care providers or platforms.",
                  icon: Globe
                }
              ].map((right, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <right.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{right.title}</h3>
                      <p className="text-gray-700">{right.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Data Protection Measures */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical & Organisational Measures</h2>
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Safeguards</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>End-to-end encryption</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Multi-factor authentication</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Role-based access controls</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Automated data backup</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Regular security audits</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Organisational Measures</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Staff GDPR training</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Data Protection Impact Assessments</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Incident response procedures</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Regular compliance audits</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Vendor management protocols</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Processing Records */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Records of Processing Activities</h2>
            <p className="text-lg text-gray-700 mb-6">
              In accordance with Article 30 GDPR, we maintain comprehensive records of all processing activities:
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processing Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Legal Basis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Care Plan Management</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Legal obligation (Health & Social Care Act)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">8 years after care ends</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Medication Administration</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Legal obligation (CQC requirements)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">10 years</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Family Communication</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Legitimate interests</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Duration of care + 2 years</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Staff Management</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Legal obligation (Employment law)</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">6 years after employment ends</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Protection Contacts</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Data Protection Officer</h3>
                <p className="text-blue-800 mb-2">
                  <strong>Email:</strong> dpo@writecarenotes.com
                </p>
                <p className="text-blue-800 mb-2">
                  <strong>Phone:</strong> +44 (0) 800 123 4567
                </p>
                <p className="text-blue-800 text-sm">
                  For all data protection queries and exercising your rights under GDPR.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Supervisory Authority</h3>
                <p className="text-green-800 mb-2">
                  <strong>ICO (UK):</strong> ico.org.uk
                </p>
                <p className="text-green-800 mb-2">
                  <strong>Phone:</strong> 0303 123 1113
                </p>
                <p className="text-green-800 text-sm">
                  You have the right to lodge a complaint with the Information Commissioner's Office.
                </p>
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
                <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms of Service
                </Link>
                <Link to="/security" className="text-blue-600 hover:text-blue-700 font-medium">
                  Data Security
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

export default GDPRCompliancePage