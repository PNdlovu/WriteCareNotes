import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, Scale, Shield, AlertTriangle, Clock, Mail } from 'lucide-react'

const lastUpdated = "15th December 2024"

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6">
              <Scale className="h-4 w-4 mr-2" />
              Legal Terms & Conditions
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Terms of 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"> Service</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              The terms and conditions governing your use of the WriteCareNotes 
              care home management platform and related services.
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
                <FileText className="w-6 h-6 text-primary mr-3" />
                Agreement to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service ("Terms") constitute a legally binding agreement between 
                you ("Customer", "User", or "you") and WriteCareNotes Ltd ("WriteCareNotes", 
                "we", "us", or "our") regarding your use of the WriteCareNotes care home 
                management platform and related services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using our platform, you confirm that you have read, understood, 
                and agree to be bound by these Terms. If you do not agree to these Terms, 
                please do not use our services.
              </p>
            </div>

            {/* Service Description */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Description</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Platform Overview</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                WriteCareNotes provides a comprehensive digital platform designed specifically 
                for care home management across England, Scotland, Wales, and Northern Ireland. 
                Our services include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Resident management and care planning systems</li>
                <li>Staff scheduling and workforce management</li>
                <li>CQC compliance monitoring and reporting</li>
                <li>Digital care records and documentation</li>
                <li>Family communication portals</li>
                <li>Analytics and performance reporting</li>
                <li>Training and certification tracking</li>
                <li>Incident reporting and quality management</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Availability</h3>
              <p className="text-gray-700 leading-relaxed">
                We strive to maintain 99.9% uptime for our platform. Scheduled maintenance 
                will be performed during agreed maintenance windows with advance notice. 
                Emergency maintenance may be performed without prior notice to ensure 
                platform security and stability.
              </p>
            </div>

            {/* Eligibility and Account */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Eligibility and Account Registration</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Eligibility Requirements</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use WriteCareNotes, you must:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Be 18 years or older and legally capable of entering contracts</li>
                <li>Be employed by or authorized to act on behalf of a licensed care home</li>
                <li>Operate a care facility registered with appropriate regulatory bodies (CQC, Care Inspectorate, CIW, or RQIA)</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security and confidentiality of your account credentials</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Responsibilities</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Maintaining accurate account information and promptly updating changes</li>
                <li>Ensuring all users in your organization comply with these Terms</li>
                <li>Implementing appropriate access controls and user permissions</li>
                <li>Immediately notifying us of any unauthorized access or security breaches</li>
                <li>All activities that occur under your account</li>
              </ul>
            </div>

            {/* Acceptable Use */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 text-primary mr-3" />
                Acceptable Use Policy
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Permitted Uses</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may use WriteCareNotes solely for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Managing care home operations in compliance with applicable regulations</li>
                <li>Documenting and tracking resident care and wellbeing</li>
                <li>Facilitating communication between staff, residents, and families</li>
                <li>Generating reports for regulatory compliance and quality improvement</li>
                <li>Training staff on proper care procedures and record-keeping</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Prohibited Activities</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must not:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Use the platform for any unlawful purpose or activity</li>
                <li>Attempt to gain unauthorized access to any part of the system</li>
                <li>Reverse engineer, decompile, or attempt to extract source code</li>
                <li>Share account credentials with unauthorized individuals</li>
                <li>Input false, misleading, or fraudulent information</li>
                <li>Use the platform to harass, abuse, or harm others</li>
                <li>Attempt to overwhelm our systems or network infrastructure</li>
                <li>Remove or modify any proprietary notices or labels</li>
              </ul>
            </div>

            {/* Data and Privacy */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Protection and Privacy</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Processing Agreement</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In providing our services, WriteCareNotes acts as a data processor for personal 
                data you submit to the platform. You remain the data controller and are 
                responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Ensuring lawful basis for processing personal data</li>
                <li>Obtaining necessary consents from residents and staff</li>
                <li>Providing appropriate privacy notices</li>
                <li>Implementing data subject rights procedures</li>
                <li>Reporting data breaches to relevant authorities</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Security</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>End-to-end encryption for all data transmission</li>
                <li>Advanced encryption (AES-256) for data storage</li>
                <li>Multi-factor authentication and role-based access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Secure data centers with 24/7 monitoring</li>
                <li>Automated backup systems with geographic redundancy</li>
              </ul>
            </div>

            {/* Payment Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Terms and Billing</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Subscription Fees</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Subscription fees are based on your selected plan and are billed in advance. 
                Current pricing is available on our website and may be updated with 30 days' 
                notice for existing customers.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Processing</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Payment is due in advance for each billing period</li>
                <li>We accept major credit cards and direct debit payments</li>
                <li>Failed payments may result in service suspension after 7 days</li>
                <li>Accounts may be terminated after 30 days of non-payment</li>
                <li>You remain responsible for all charges incurred during service use</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Refunds and Cancellation</h3>
              <p className="text-gray-700 leading-relaxed">
                Subscription fees are non-refundable except as required by law. You may 
                cancel your subscription at any time, with cancellation taking effect at 
                the end of your current billing period. Data export services are available 
                for 30 days following cancellation.
              </p>
            </div>

            {/* Intellectual Property */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Property</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                WriteCareNotes and all related intellectual property, including software, 
                designs, text, graphics, and trademarks, are owned by WriteCareNotes Ltd 
                or our licensors. You receive a limited, non-exclusive license to use 
                our platform solely as outlined in these Terms.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Data</h3>
              <p className="text-gray-700 leading-relaxed">
                You retain ownership of all data you submit to our platform. You grant 
                us a limited license to process, store, and backup your data solely to 
                provide our services. We do not claim ownership of your content or use 
                it for any purpose beyond service delivery.
              </p>
            </div>

            {/* Service Level Agreement */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-6 h-6 text-primary mr-3" />
                Service Level Agreement
              </h2>
              
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Uptime Commitment</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Target Uptime:</strong> 99.9% availability (excluding scheduled maintenance)</li>
                  <li><strong>Planned Maintenance:</strong> Maximum 4 hours per month with 48-hour notice</li>
                  <li><strong>Emergency Maintenance:</strong> Performed as needed for security or stability</li>
                  <li><strong>Response Times:</strong> Critical issues acknowledged within 1 hour</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Support Services</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Email support available 24/7 for all customers</li>
                <li>Phone support during business hours (8 AM - 6 PM GMT)</li>
                <li>Emergency support available for critical issues affecting resident care</li>
                <li>Online documentation and training resources</li>
                <li>Regular webinars and training sessions</li>
              </ul>
            </div>

            {/* Limitations and Disclaimers */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
                Limitations of Liability and Disclaimers
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Notice</h3>
                <p className="text-gray-700 leading-relaxed">
                  WriteCareNotes is a management platform that supports care home operations 
                  but does not replace professional judgment, clinical decision-making, or 
                  regulatory compliance responsibilities. Users remain fully responsible for 
                  all care decisions and regulatory compliance.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Disclaimers</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Services are provided "as is" without warranties of any kind</li>
                <li>We do not guarantee that our platform will meet all your specific requirements</li>
                <li>We are not responsible for decisions made based on platform data</li>
                <li>Internet connectivity and technical infrastructure are your responsibility</li>
                <li>Third-party integrations may be subject to separate terms and availability</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To the maximum extent permitted by law, our total liability for any claims 
                arising from these Terms or your use of our services shall not exceed the 
                amount you paid for our services in the 12 months preceding the claim.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including loss of profits, data, or business opportunities.
              </p>
            </div>

            {/* Termination */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Termination by You</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may terminate your subscription at any time by providing written notice. 
                Termination will be effective at the end of your current billing period. 
                You remain responsible for all charges incurred prior to termination.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Termination by Us</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may terminate your access immediately if you:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Breach these Terms or our Acceptable Use Policy</li>
                <li>Fail to pay fees when due (after appropriate notice period)</li>
                <li>Engage in activities that harm our platform or other users</li>
                <li>Provide false or misleading information</li>
                <li>Use our services for unlawful purposes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Effect of Termination</h3>
              <p className="text-gray-700 leading-relaxed">
                Upon termination, your access to the platform will cease, and we will 
                retain your data for 30 days to allow for data export. After this period, 
                data may be permanently deleted unless longer retention is required by law.
              </p>
            </div>

            {/* Changes to Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update these Terms from time to time to reflect changes in our 
                services, legal requirements, or business practices. When we make material 
                changes, we will:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Provide at least 30 days' advance notice via email and platform notifications</li>
                <li>Highlight key changes in our notification</li>
                <li>Update the "Last updated" date at the top of these Terms</li>
                <li>Allow you to terminate your subscription if you disagree with changes</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Continued use of our services after the effective date constitutes acceptance 
                of the updated Terms.
              </p>
            </div>

            {/* Governing Law */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law and Disputes</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Applicable Law</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms are governed by the laws of England and Wales. Any disputes 
                arising from these Terms or your use of our services will be subject to 
                the exclusive jurisdiction of the courts of England and Wales.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Dispute Resolution</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We encourage resolving disputes through direct communication. If a dispute 
                cannot be resolved informally, we are committed to good faith mediation 
                before pursuing formal legal proceedings.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="w-6 h-6 text-primary mr-3" />
                Contact Information
              </h2>
              
              <div className="bg-care-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal and Compliance</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Company:</strong> WriteCareNotes Ltd</p>
                  <p><strong>Address:</strong> 125 Harley Street, London W1G 6AX, United Kingdom</p>
                  <p><strong>Email:</strong> legal@writecarenotes.co.uk</p>
                  <p><strong>Phone:</strong> +44 20 7946 0958</p>
                  <p><strong>Company Registration:</strong> 12345678 (England and Wales)</p>
                  <p><strong>VAT Number:</strong> GB123456789</p>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Customer Support</h3>
                <p className="text-gray-700">
                  For technical support or general inquiries, please contact: 
                  <strong> support@writecarenotes.co.uk</strong> or visit our 
                  <Link to="/contact" className="text-primary hover:text-primary/80 font-medium"> Contact page</Link>
                </p>
              </div>
            </div>

          </div>

          {/* Back to Top / Contact CTA */}
          <div className="border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-600 mb-6">
              Questions about these Terms of Service? Our legal team is available to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white care-gradient hover:opacity-90 transition-opacity"
              >
                Contact Legal Team
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