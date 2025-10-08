/**
 * Impact Analysis Dashboard
 * 
 * Main component for visualizing policy impact analysis, dependencies,
 * and risk assessment before publishing changes.
 * 
 * Features:
 * - Dependency graph visualization
 * - Affected workflows and modules analysis
 * - Risk assessment with mitigation recommendations
 * - Pre-publish checklist
 * - Impact report generation (JSON, HTML, PDF)
 * 
 * @component
 * @version 1.0.0
 * @since Phase 2 TIER 1 - Feature 3
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Separator } from '../ui/Separator';
import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw, Download } from 'lucide-react';
import DependencyGraph from './DependencyGraph';
import AffectedWorkflowsList from './AffectedWorkflowsList';
import RiskAssessmentCard from './RiskAssessmentCard';

interface ImpactAnalysisData {
  dependencyGraph: {
    nodes: Array<{ id: string; type: string; label: string }>;
    edges: Array<{ source: string; target: string; strength: string }>;
  };
  riskAssessment: {
    overallRiskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: Array<{ factor: string; severity: string; description: string }>;
    requiresApproval: boolean;
  };
  affectedWorkflows: {
    total: number;
    byRisk: { low: number; medium: number; high: number; critical: number };
    criticalWorkflows: Array<{ id: string; name: string; impactDescription: string }>;
  };
  affectedModules: {
    total: number;
    modules: Array<{ id: string; name: string; riskLevel: string }>;
  };
  changeScope: {
    impactRadius: number;
    totalAffected: number;
    isSystemWide: boolean;
    affectedDepartments: string[];
  };
  recommendations: {
    prePublishActions: string[];
    mitigationStrategies: string[];
    notifyStakeholders: string[];
  };
  prePublishChecklist: Array<{ item: string; required: boolean; completed: boolean }>;
}

interface ImpactAnalysisDashboardProps {
  policyId: string;
}

export default function ImpactAnalysisDashboard({ policyId }: ImpactAnalysisDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ImpactAnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    loadImpactAnalysis();
  }, [policyId]);

  const loadImpactAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/policy-governance/impact-analysis/${policyId}`);
      if (!response.ok) {
        throw new Error('Failed to load impact analysis');
      }
      const analysisData = await response.json();
      setData(analysisData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadImpactAnalysis();
  };

  const handleExport = async (format: 'json' | 'html' | 'pdf') => {
    try {
      const response = await fetch(
        `/api/policy-governance/impact-analysis/${policyId}/export?format=${format}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to export as ${format.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `policy-${policyId}-impact-analysis.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Failed to export report as ${format.toUpperCase()}`);
    }
  };

  const getRiskBadgeVariant = (level: string): 'success' | 'info' | 'warning' | 'danger' => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'critical': return 'danger';
      default: return 'info';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 mt-4">
        <Alert variant="destructive">
          <div className="flex items-center justify-between w-full">
            <span>Error loading impact analysis: {error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 mt-4">
        <Alert variant="warning">
          No impact analysis data available for the selected policy.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Policy Impact Analysis
        </h1>
        <p className="text-sm text-gray-600">
          Comprehensive impact assessment for Policy ID: {policyId}
        </p>
      </div>

      {/* Risk Summary Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Overall Risk Level</p>
              <div className="flex flex-col items-center gap-2">
                {getRiskIcon(data.riskAssessment.riskLevel)}
                <Badge 
                  variant={getRiskBadgeVariant(data.riskAssessment.riskLevel)}
                  className="text-base font-bold"
                >
                  {data.riskAssessment.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Risk Score</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                {data.riskAssessment.overallRiskScore}
              </p>
              <p className="text-xs text-gray-500">out of 100</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Affected</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                {data.changeScope.totalAffected}
              </p>
              <p className="text-xs text-gray-500">
                {data.changeScope.isSystemWide ? 'System-wide' : 'Localized'}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Approval Required</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                {data.riskAssessment.requiresApproval ? 'YES' : 'NO'}
              </p>
              <p className="text-xs text-gray-500">
                {data.riskAssessment.requiresApproval ? 'Manager approval needed' : 'Auto-approved'}
              </p>
            </div>
          </div>

          {data.riskAssessment.requiresApproval && (
            <Alert variant="warning" className="mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Management Approval Required</p>
                  <p className="text-sm">
                    This change requires management approval before publishing due to high risk assessment.
                  </p>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* High/Critical Risk Alert */}
      {(data.riskAssessment.riskLevel === 'high' || data.riskAssessment.riskLevel === 'critical') && (
        <Alert 
          variant={data.riskAssessment.riskLevel === 'critical' ? 'destructive' : 'warning'}
          className="mb-6"
        >
          <div className="flex items-start gap-2">
            {data.riskAssessment.riskLevel === 'critical' ? (
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold mb-1">
                {data.riskAssessment.riskLevel === 'critical' 
                  ? '⚠️ CRITICAL RISK DETECTED - Publication Blocked'
                  : '⚠️ HIGH RISK DETECTED - Review Required'}
              </p>
              <p className="text-sm">
                This policy change has been flagged as {data.riskAssessment.riskLevel} risk. 
                Please review the recommendations and complete all checklist items before proceeding.
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dependencies">Dependency Graph</TabsTrigger>
          <TabsTrigger value="workflows">Affected Workflows</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="checklist">Pre-Publish Checklist</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Change Scope */}
            <Card>
              <CardHeader>
                <CardTitle>Change Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Impact Radius</span>
                    <Badge variant="info">
                      {data.changeScope.impactRadius} levels
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Affected</span>
                    <span className="font-semibold">{data.changeScope.totalAffected}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">System-Wide Impact</span>
                    <Badge variant={data.changeScope.isSystemWide ? 'warning' : 'success'}>
                      {data.changeScope.isSystemWide ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="pt-2">
                    <p className="text-sm text-gray-600 mb-2">Affected Departments</p>
                    <div className="flex flex-wrap gap-2">
                      {data.changeScope.affectedDepartments.map((dept) => (
                        <Badge key={dept} variant="secondary">{dept}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Affected Items Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Affected Items Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-3">Workflows by Risk Level</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-gray-700">Low</span>
                        <Badge variant="success">{data.affectedWorkflows.byRisk.low}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-gray-700">Medium</span>
                        <Badge variant="info">{data.affectedWorkflows.byRisk.medium}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <span className="text-sm font-medium text-gray-700">High</span>
                        <Badge variant="warning">{data.affectedWorkflows.byRisk.high}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-sm font-medium text-gray-700">Critical</span>
                        <Badge variant="danger">{data.affectedWorkflows.byRisk.critical}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Total Modules Affected</p>
                    <p className="text-4xl font-bold text-blue-600">
                      {data.affectedModules.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-base font-semibold mb-3 text-gray-900">Pre-Publish Actions</h3>
                  <ul className="space-y-2">
                    {data.recommendations.prePublishActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-base font-semibold mb-3 text-gray-900">Mitigation Strategies</h3>
                  <ul className="space-y-2">
                    {data.recommendations.mitigationStrategies.map((strategy, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-base font-semibold mb-3 text-gray-900">Notify Stakeholders</h3>
                  <ul className="space-y-2">
                    {data.recommendations.notifyStakeholders.map((stakeholder, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{stakeholder}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dependency Graph Tab */}
        <TabsContent value="dependencies">
          <DependencyGraph 
            policyId={policyId}
            graphData={data.dependencyGraph}
          />
        </TabsContent>

        {/* Affected Workflows Tab */}
        <TabsContent value="workflows">
          <AffectedWorkflowsList
            workflows={data.affectedWorkflows}
            modules={data.affectedModules}
          />
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk">
          <RiskAssessmentCard
            riskData={data.riskAssessment}
            policyId={policyId}
          />
        </TabsContent>

        {/* Pre-Publish Checklist Tab */}
        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Publish Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.prePublishChecklist.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={`${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.item}
                      </span>
                    </div>
                    {item.required && (
                      <Badge variant="danger" size="sm">Required</Badge>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Completion: {data.prePublishChecklist.filter(i => i.completed).length} of {data.prePublishChecklist.length} items
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{
                      width: `${(data.prePublishChecklist.filter(i => i.completed).length / data.prePublishChecklist.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3 mt-6">
        <Button 
          variant="outline"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
        <Button 
          variant="outline"
          onClick={() => handleExport('json')}
        >
          <Download className="w-4 h-4 mr-2" />
          Export JSON
        </Button>
        <Button 
          variant="outline"
          onClick={() => handleExport('html')}
        >
          <Download className="w-4 h-4 mr-2" />
          Export HTML
        </Button>
        <Button 
          onClick={() => handleExport('pdf')}
        >
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}
