import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { EnterpriseNavigation } from './components/layout/EnterpriseNavigation'
import { EnterpriseFooter } from './components/layout/EnterpriseFooter'

// Page imports
import { HomePageTest } from './pages/HomePageTest'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { CareersPage } from './pages/CareersPage'
import { PricingPage } from './pages/PricingPage'
import { DemoPage } from './pages/DemoPage'
import { HelpCenterPage } from './pages/HelpCenterPage'
import BlogListPage from './pages/BlogListPage'
import BlogPostPage from './pages/BlogPostPage'

// Solution pages
import { SolutionsPage } from './pages/solutions/SolutionsPageSimple'
import { CareHomeManagementPage } from './pages/solutions/CareHomeManagementPage'
import { CQCCompliancePage } from './pages/solutions/CQCCompliancePage'
import { StaffManagementPage } from './pages/solutions/StaffManagementPage'
import { ResidentCarePlansPage } from './pages/solutions/ResidentCarePlansPage'
import { FamilyPortalPage } from './pages/solutions/FamilyPortalPage'
import { AnalyticsReportingPage } from './pages/solutions/AnalyticsReportingPage'

// Documentation pages
import { APIDocumentationPage } from './pages/docs/APIDocumentationPage'

// Auth pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'

// Legal pages
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage'
import { TermsOfServicePage } from './pages/legal/TermsOfServicePage'

// Layout wrapper for pages with navigation and footer
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <EnterpriseNavigation />
    <main className="flex-1">
      {children}
    </main>
    <EnterpriseFooter />
  </>
)

// Auth layout without navigation and footer
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen">
    {children}
  </div>
)

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Main pages with navigation and footer */}
          <Route path="/" element={<LayoutWrapper><HomePageTest /></LayoutWrapper>} />
          <Route path="/about" element={<LayoutWrapper><AboutPage /></LayoutWrapper>} />
          <Route path="/blog" element={<LayoutWrapper><BlogListPage /></LayoutWrapper>} />
          <Route path="/blog/:id" element={<LayoutWrapper><BlogPostPage /></LayoutWrapper>} />
          <Route path="/contact" element={<LayoutWrapper><ContactPage /></LayoutWrapper>} />
          <Route path="/careers" element={<LayoutWrapper><CareersPage /></LayoutWrapper>} />
          <Route path="/pricing" element={<LayoutWrapper><PricingPage /></LayoutWrapper>} />
          <Route path="/demo" element={<LayoutWrapper><DemoPage /></LayoutWrapper>} />
          <Route path="/help" element={<LayoutWrapper><HelpCenterPage /></LayoutWrapper>} />
          
          {/* Solution routes */}
          <Route path="/solutions" element={<LayoutWrapper><SolutionsPage /></LayoutWrapper>} />
          <Route path="/solutions/care-home" element={<LayoutWrapper><CareHomeManagementPage /></LayoutWrapper>} />
          <Route path="/solutions/compliance" element={<LayoutWrapper><CQCCompliancePage /></LayoutWrapper>} />
          <Route path="/solutions/staff" element={<LayoutWrapper><StaffManagementPage /></LayoutWrapper>} />
          <Route path="/solutions/residents" element={<LayoutWrapper><ResidentCarePlansPage /></LayoutWrapper>} />
          <Route path="/solutions/family" element={<LayoutWrapper><FamilyPortalPage /></LayoutWrapper>} />
          <Route path="/solutions/analytics" element={<LayoutWrapper><AnalyticsReportingPage /></LayoutWrapper>} />
          
          {/* Documentation routes */}
          <Route path="/docs/api" element={<LayoutWrapper><APIDocumentationPage /></LayoutWrapper>} />
          
          {/* Auth routes - without navigation/footer */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
          <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
          
          {/* Legal routes */}
          <Route path="/privacy-policy" element={<LayoutWrapper><PrivacyPolicyPage /></LayoutWrapper>} />
          <Route path="/terms-of-service" element={<LayoutWrapper><TermsOfServicePage /></LayoutWrapper>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App