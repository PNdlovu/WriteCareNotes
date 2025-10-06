import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Lock, Server, Eye, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

const lastUpdated = "5th October 2025"

export const DataSecurityPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-green-50 via-white to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4 mr-2" />
              Enterprise Security
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Data 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> Security</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Enterprise-grade security protecting care home data across the British Isles 
              with zero trust architecture and comprehensive compliance frameworks.
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
          
          {/* Security Overview */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Security Architecture</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Zero Trust Security Model</h3>
                  <p className="text-green-800">
                    WriteCareNotes employs a comprehensive zero trust security architecture, 
                    ensuring every access request is verified, authenticated, and authorized 
                    regardless of location or user status.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Our security framework is built specifically for care home environments, addressing the 
              unique challenges of healthcare data protection while maintaining usability for care staff. 
              We implement multiple layers of protection to safeguard resident information and operational data.
            </p>
          </section>

          {/* Compliance Certifications */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Security Certifications & Compliance</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">ISO 27001</h3>
                <p className="text-blue-800 text-sm">
                  Certified information security management system with healthcare-specific controls
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-purple-900 mb-2">DSPT</h3>
                <p className="text-purple-800 text-sm">
                  Data Security Protection Toolkit compliance for NHS and care organizations
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Cyber Essentials Plus</h3>
                <p className="text-green-800 text-sm">
                  Government-backed cybersecurity certification with annual verification
                </p>
              </div>
            </div>
          </section>

          {/* Technical Security Measures */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Security Controls</h2>
            
            <div className="space-y-8">
              {/* Encryption */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Encryption at Every Level</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Data at Rest</h4>
                        <ul className="space-y-1 text-gray-700 text-sm">
                          <li>• AES-256 database encryption</li>
                          <li>• Encrypted file storage</li>
                          <li>• Hardware security modules</li>
                          <li>• Key rotation protocols</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Data in Transit</h4>
                        <ul className="space-y-1 text-gray-700 text-sm">
                          <li>• TLS 1.3 for all connections</li>
                          <li>• Certificate pinning</li>
                          <li>• API encryption</li>
                          <li>• Secure mobile protocols</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Controls */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Identity & Access Management</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Authentication</h4>
                        <ul className="space-y-1 text-gray-700 text-sm">
                          <li>• Multi-factor authentication (MFA)</li>
                          <li>• Single sign-on (SSO) integration</li>
                          <li>• Biometric authentication options</li>
                          <li>• Session management</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Authorization</h4>
                        <ul className="space-y-1 text-gray-700 text-sm">
                          <li>• Role-based access control (RBAC)</li>
                          <li>• Principle of least privilege</li>
                          <li>• Dynamic permission assignment</li>
                          <li>• Audit trail logging</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Infrastructure Security */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Server className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Infrastructure Protection</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Network Security</h4>
                        <ul className="space-y-1 text-gray-700 text-sm">
                          <li>• Web Application Firewall (WAF)</li>
                          <li>• DDoS protection</li>
                          <li>• Network segmentation</li>
                          <li>• Intrusion detection systems</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Cloud Security</h4>
                        <ul className="space-y-1 text-gray-700 text-sm">
                          <li>• UK-based data centers</li>
                          <li>• Container security scanning</li>
                          <li>• Automated security patching</li>
                          <li>• Security monitoring & alerting</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Protection Measures */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Protection & Privacy</h2>
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Minimization</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Purpose limitation principles</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Automated data retention policies</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Secure data disposal</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Privacy by design architecture</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Backup & Recovery</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Automated daily backups</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Geo-redundant storage</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Point-in-time recovery</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Disaster recovery testing</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Incident Response */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Security Incident Response</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">24/7 Security Operations Center</h3>
                  <p className="text-orange-800">
                    Our dedicated security team monitors systems around the clock, with automated 
                    threat detection and rapid incident response capabilities.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">&lt; 15min</div>
                <div className="text-sm text-gray-700">Initial Response Time</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">&lt; 1hr</div>
                <div className="text-sm text-gray-700">Containment Time</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">&lt; 72hr</div>
                <div className="text-sm text-gray-700">Breach Notification</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-2">99.9%</div>
                <div className="text-sm text-gray-700">Threat Detection Rate</div>
              </div>
            </div>
          </section>

          {/* Regular Security Assessments */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Continuous Security Assessment</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Penetration Testing</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Quarterly third-party security assessments and annual comprehensive penetration testing.
                </p>
                <div className="text-sm text-blue-700">
                  <strong>Next Assessment:</strong> January 2026
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Vulnerability Scanning</h3>
                <p className="text-green-800 text-sm mb-3">
                  Automated daily vulnerability scans with immediate remediation for critical issues.
                </p>
                <div className="text-sm text-green-700">
                  <strong>Last Scan:</strong> Today
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Security Audits</h3>
                <p className="text-purple-800 text-sm mb-3">
                  Annual ISO 27001 audits and continuous DSPT compliance monitoring.
                </p>
                <div className="text-sm text-purple-700">
                  <strong>Last Audit:</strong> September 2025
                </div>
              </div>
            </div>
          </section>

          {/* Security Contact */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Security Contact Information</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">Report a Security Issue</h3>
              <p className="text-red-800 mb-4">
                If you discover a security vulnerability or have concerns about our security practices, 
                please contact our security team immediately.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-red-800 mb-1">
                    <strong>Email:</strong> security@writecarenotes.com
                  </p>
                  <p className="text-red-800 mb-1">
                    <strong>Emergency:</strong> +44 (0) 800 123 4567 (24/7)
                  </p>
                </div>
                <div>
                  <p className="text-red-800 mb-1">
                    <strong>Response Time:</strong> Within 15 minutes
                  </p>
                  <p className="text-red-800">
                    <strong>PGP Key:</strong> Available on request
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

export default DataSecurityPage