import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Eye, Lock, FileText, Clock, Mail } from 'lucide-react'

const lastUpdated = "15th December 2024"

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4 mr-2" />
              Data Protection & Privacy
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Privacy 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Policy</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              How WriteCareNotes protects and manages your personal information 
              and care home data across the British Isles with enterprise-grade security.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">Last updated: {lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            {/* Introduction */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 text-primary mr-3" />
                Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed">
                At WriteCareNotes, we are committed to protecting your privacy and the confidentiality 
                of resident data. This Privacy Policy explains how we collect, use, store, and protect 
                personal information when you use our care home management platform across England, 
                Scotland, Wales, and Northern Ireland.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We understand the sensitive nature of care home operations and the importance of 
                maintaining the highest standards of data protection in compliance with UK GDPR, 
                the Data Protection Act 2018, and relevant care sector regulations.
              </p>
            </div>

            {/* Data We Collect */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 text-primary mr-3" />
                Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Name, email address, and contact details of care home staff</li>
                <li>Job title and professional qualifications</li>
                <li>Care home details including name, address, and CQC registration</li>
                <li>Account preferences and settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Resident Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Personal details necessary for care delivery</li>
                <li>Medical history and health records</li>
                <li>Care plans and assessment data</li>
                <li>Family contact information and emergency contacts</li>
                <li>Dietary requirements and preferences</li>
                <li>Medication records and administration logs</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Operational Data</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Staff schedules and duty rosters</li>
                <li>Incident reports and compliance records</li>
                <li>Quality monitoring and audit data</li>
                <li>Training records and certifications</li>
                <li>Usage analytics and system logs</li>
              </ul>
            </div>

            {/* How We Use Data */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 text-primary mr-3" />
                How We Use Your Information
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Primary Purposes</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Providing and maintaining the WriteCareNotes platform</li>
                <li>Supporting care delivery and resident wellbeing</li>
                <li>Enabling CQC compliance monitoring and reporting</li>
                <li>Facilitating communication between care staff and families</li>
                <li>Managing staff schedules and training requirements</li>
                <li>Generating reports for regulatory and quality purposes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Basis for Processing</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We process personal data under the following legal bases:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li><strong>Legitimate Interest:</strong> For care home operations and service improvement</li>
                <li><strong>Contractual Necessity:</strong> To provide our platform services</li>
                <li><strong>Legal Obligation:</strong> To comply with care sector regulations and CQC requirements</li>
                <li><strong>Vital Interests:</strong> For resident safety and emergency situations</li>
                <li><strong>Consent:</strong> For marketing communications and optional features</li>
              </ul>
            </div>

            {/* Data Sharing */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Authorized Sharing</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>With care home staff who need access for resident care</li>
                <li>With healthcare professionals involved in resident treatment</li>
                <li>With CQC or other regulatory bodies when legally required</li>
                <li>With family members as authorized by the resident or care home</li>
                <li>With emergency services in urgent health situations</li>
                <li>With trusted service providers under strict data processing agreements</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Services</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We work with carefully selected partners who help us provide our services:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Cloud hosting providers (AWS, Microsoft Azure) for secure data storage</li>
                <li>Communication services for notifications and alerts</li>
                <li>Analytics providers for service improvement</li>
                <li>Security services for fraud prevention and platform protection</li>
              </ul>
            </div>

            {/* Data Security */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security and Protection</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Safeguards</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>End-to-end encryption for all data transmission</li>
                <li>Advanced encryption (AES-256) for data at rest</li>
                <li>Multi-factor authentication for user accounts</li>
                <li>Regular security audits and penetration testing</li>
                <li>Secure data centers with 24/7 monitoring</li>
                <li>Regular automated backups with secure storage</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Operational Safeguards</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Role-based access controls limiting data access</li>
                <li>Regular staff training on data protection</li>
                <li>Incident response procedures for data breaches</li>
                <li>Data retention policies aligned with legal requirements</li>
                <li>Regular compliance assessments and audits</li>
              </ul>
            </div>

            {/* Data Retention */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-6 h-6 text-primary mr-3" />
                Data Retention
              </h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain personal data for different periods based on the type of information 
                and legal requirements:
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Retention Periods</h3>
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Resident Care Records:</strong> Retained for 20 years after last contact or death, in line with NHS guidelines</li>
                  <li><strong>Staff Employment Records:</strong> Retained for 6 years after employment ends</li>
                  <li><strong>Incident Reports:</strong> Retained for 10 years for quality and safety monitoring</li>
                  <li><strong>CQC Compliance Data:</strong> Retained as required by regulatory standards</li>
                  <li><strong>System Logs:</strong> Retained for 12 months for security monitoring</li>
                  <li><strong>Marketing Data:</strong> Retained until consent is withdrawn</li>
                </ul>
              </div>
            </div>

            {/* Your Rights */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights Under UK GDPR</h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the following rights regarding your personal data:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Access</h3>
                  <p className="text-gray-700 text-sm">Request a copy of your personal data we hold</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Rectification</h3>
                  <p className="text-gray-700 text-sm">Correct inaccurate or incomplete information</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Erasure</h3>
                  <p className="text-gray-700 text-sm">Request deletion of your personal data (subject to legal requirements)</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Portability</h3>
                  <p className="text-gray-700 text-sm">Receive your data in a structured, machine-readable format</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Object</h3>
                  <p className="text-gray-700 text-sm">Object to processing based on legitimate interests</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Right to Restrict</h3>
                  <p className="text-gray-700 text-sm">Limit how we process your personal data</p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">
                To exercise any of these rights, please contact our Data Protection Officer 
                using the details below. We will respond within 30 days of receiving your request.
              </p>
            </div>

            {/* Cookies */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to improve your experience:
              </p>
              
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li><strong>Essential Cookies:</strong> Required for platform functionality and security</li>
                <li><strong>Performance Cookies:</strong> Help us understand how you use our platform</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Provide insights for service improvement</li>
              </ul>
              
              <p className="text-gray-700 leading-relaxed">
                You can control cookie settings through your browser, though disabling essential 
                cookies may affect platform functionality.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="w-6 h-6 text-primary mr-3" />
                Contact Information
              </h2>
              
              <div className="bg-care-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Protection Officer</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> dpo@writecarenotes.co.uk</p>
                  <p><strong>Post:</strong> Data Protection Officer, WriteCareNotes Ltd, 125 Harley Street, London W1G 6AX</p>
                  <p><strong>Phone:</strong> +44 20 7946 0958</p>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Supervisory Authority</h3>
                <p className="text-gray-700">
                  If you're not satisfied with our response, you can contact the Information 
                  Commissioner's Office (ICO) at <strong>ico.org.uk</strong> or call their helpline: <strong>0303 123 1113</strong>
                </p>
              </div>
            </div>

            {/* Changes to Policy */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our 
                practices, technology, legal requirements, or other factors. When we make 
                significant changes, we will:
              </p>
              
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Notify you via email and platform notifications</li>
                <li>Update the "Last updated" date at the top of this policy</li>
                <li>Provide a summary of key changes</li>
                <li>Obtain new consent where required by law</li>
              </ul>
              
              <p className="text-gray-700 leading-relaxed">
                We encourage you to review this Privacy Policy periodically to stay informed 
                about how we protect your information.
              </p>
            </div>

          </div>

          {/* Back to Top / Contact CTA */}
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600 mb-6">
              Have questions about our privacy practices? We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white care-gradient hover:opacity-90 transition-opacity"
              >
                Contact Our Team
              </Link>
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}