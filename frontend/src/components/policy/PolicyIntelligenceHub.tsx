/**
 * @fileoverview Policy Intelligence Hub - Integrated Dashboard
 * @module PolicyIntelligenceHub
 * @category Policy
 * @subcategory Integration
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * Unified dashboard integrating all three Policy Intelligence components:
 * - Gap Analysis (identify missing policies)
 * - Risk Management (monitor compliance risk)
 * - Advanced Analytics (measure effectiveness & ROI)
 * 
 * This hub provides a comprehensive view of policy governance health
 * with seamless navigation between intelligence features.
 * 
 * @example
 * ```tsx
 * <PolicyIntelligenceHub organizationId="org-123" jurisdiction="england" />
 * ```
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Shield, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

// Import the three Policy Intelligence components
import { PolicyGapAnalysis } from './PolicyGapAnalysis';
import { PolicyRiskDashboard } from './PolicyRiskDashboard';
import { PolicyAnalyticsDashboard } from './PolicyAnalyticsDashboard';

/**
 * Component props
 */
interface PolicyIntelligenceHubProps {
  organizationId: string;
  jurisdiction: 'england' | 'wales' | 'scotland' | 'northern-ireland' | 'ireland' | 'jersey' | 'isle-of-man';
  serviceType?: 'residential-care' | 'nursing-home' | 'domiciliary-care' | 'day-care' | 'supported-living' | 'specialist-care';
  defaultTab?: 'gaps' | 'risk' | 'analytics';
}

/**
 * Policy Intelligence Hub - Integrated Dashboard
 * 
 * Combines Gap Analysis, Risk Management, and Analytics into a unified interface.
 */
export const PolicyIntelligenceHub: React.FC<PolicyIntelligenceHubProps> = ({
  organizationId,
  jurisdiction,
  serviceType = 'residential-care',
  defaultTab = 'gaps'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  /**
   * Handle navigation from gap to policy creation
   */
  const handleGapSelected = (gap: any) => {
    console.log('Gap selected:', gap);
    // In production: navigate(`/policies/create?template=${gap.recommendedTemplate}`);
  };

  /**
   * Handle template-based policy creation
   */
  const handleCreateFromTemplate = (templateId: string) => {
    console.log('Creating policy from template:', templateId);
    // In production: createPolicyFromTemplate(templateId);
  };

  /**
   * Handle navigation to policy details from risk dashboard
   */
  const handlePolicyClick = (policyId: string) => {
    console.log('Policy clicked:', policyId);
    // In production: navigate(`/policies/${policyId}`);
  };

  /**
   * Handle analytics report export
   */
  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log('Exporting report:', format);
    // In production: exportAnalyticsReport(format);
  };

  /**
   * Handle scheduled report setup
   */
  const handleScheduleReport = (frequency: 'daily' | 'weekly' | 'monthly') => {
    console.log('Scheduling report:', frequency);
    // In production: scheduleEmailReport(frequency);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Policy Intelligence Hub
        </h1>
        <p className="text-gray-600">
          AI-powered policy governance for {jurisdiction.replace('-', ' ')} care services
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="gaps" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Gap Analysis</span>
            <Badge variant="secondary" className="ml-2">AI-Powered</Badge>
          </TabsTrigger>
          
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Risk Management</span>
            <Badge variant="secondary" className="ml-2">Real-Time</Badge>
          </TabsTrigger>
          
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics & ROI</span>
            <Badge variant="secondary" className="ml-2">ML Forecast</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Gap Analysis Tab */}
        <TabsContent value="gaps" className="space-y-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Policy Gap Analysis
                </h3>
                <p className="text-sm text-blue-800">
                  Identify missing policies by comparing your organization against regulatory 
                  requirements for {jurisdiction.replace('-', ' ')}. Get AI-powered recommendations 
                  and one-click policy creation from templates.
                </p>
              </div>
            </div>
          </Card>

          <PolicyGapAnalysis
            organizationId={organizationId}
            jurisdiction={jurisdiction}
            serviceType={serviceType}
            onGapSelected={handleGapSelected}
            onCreateFromTemplate={handleCreateFromTemplate}
          />
        </TabsContent>

        {/* Risk Management Tab */}
        <TabsContent value="risk" className="space-y-4">
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">
                  Compliance Risk Dashboard
                </h3>
                <p className="text-sm text-orange-800">
                  Monitor policy compliance risk using multi-factor analysis (age, acknowledgment, 
                  violations, update frequency). Receive automated alerts and mitigation recommendations.
                </p>
              </div>
            </div>
          </Card>

          <PolicyRiskDashboard
            organizationId={organizationId}
            onPolicyClick={handlePolicyClick}
            alertThreshold={70}
            autoRefresh={true}
            refreshInterval={60000}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  Advanced Analytics & ROI
                </h3>
                <p className="text-sm text-green-800">
                  Measure policy effectiveness, track acknowledgment trends with ML forecasting, 
                  analyze ROI (time saved, costs avoided), and generate executive reports.
                </p>
              </div>
            </div>
          </Card>

          <PolicyAnalyticsDashboard
            organizationId={organizationId}
            onExportReport={handleExportReport}
            onScheduleReport={handleScheduleReport}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Stats Footer */}
      <Card className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Policy Intelligence Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Gap Analysis</p>
              <p className="text-sm text-gray-600">
                Automated detection • Industry benchmarks • Template suggestions
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Risk Scoring</p>
              <p className="text-sm text-gray-600">
                Multi-factor calculation • Real-time alerts • Trend analysis
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Analytics & ROI</p>
              <p className="text-sm text-gray-600">
                ML forecasting • Violation patterns • Executive reports
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PolicyIntelligenceHub;
