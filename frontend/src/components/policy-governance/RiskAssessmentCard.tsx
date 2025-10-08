import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Separator } from '../ui/Separator';
import { Alert } from '../ui/Alert';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

/**
 * Risk Assessment Card Component
 * 
 * Displays comprehensive risk assessment for policy changes.
 * Shows risk factors, severity levels, and mitigation recommendations.
 * 
 * Features:
 * - Overall risk score visualization
 * - Risk factor breakdown
 * - Severity indicators
 * - Approval requirements
 * 
 * @component
 * @version 1.0.0
 * @since Phase 2 TIER 1 - Feature 3
 */

interface RiskAssessmentCardProps {
  riskAssessment: {
    overallRiskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: Array<{
      factor: string;
      severity: string;
      description: string;
    }>;
    requiresApproval: boolean;
  };
}

export default function RiskAssessmentCard({ riskAssessment }: RiskAssessmentCardProps) {
  const getSeverityBadgeVariant = (severity: string): 'success' | 'info' | 'warning' | 'danger' => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'info';
      case 'high':
        return 'warning';
      case 'critical':
        return 'danger';
      default:
        return 'secondary' as any;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
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

  const getRiskScoreColor = (score: number): string => {
    if (score >= 75) return 'bg-red-600';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 25) return 'bg-blue-500';
    return 'bg-green-600';
  };

  const getRiskScoreTextColor = (score: number): string => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 25) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overall Risk Score */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Overall Risk Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="mb-4">
              <p className={`text-6xl font-bold ${getRiskScoreTextColor(riskAssessment.overallRiskScore)}`}>
                {riskAssessment.overallRiskScore}
              </p>
              <p className="text-sm text-gray-600">out of 100</p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className={`h-4 rounded-full transition-all duration-300 ${getRiskScoreColor(riskAssessment.overallRiskScore)}`}
                style={{ width: `${riskAssessment.overallRiskScore}%` }}
              />
            </div>
            
            <Badge 
              variant={getSeverityBadgeVariant(riskAssessment.riskLevel)}
              className="text-lg px-4 py-2"
            >
              {riskAssessment.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Approval Required</span>
              <Badge variant={riskAssessment.requiresApproval ? 'danger' : 'success'}>
                {riskAssessment.requiresApproval ? 'YES' : 'NO'}
              </Badge>
            </div>
            
            {riskAssessment.requiresApproval && (
              <Alert variant="warning" className="mt-3">
                <AlertTriangle className="w-4 h-4" />
                <span className="ml-2 text-sm">
                  Management approval required before publication.
                </span>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Risk Factors Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {riskAssessment.riskFactors.length === 0 ? (
            <Alert variant="success">
              <CheckCircle className="w-4 h-4" />
              <span className="ml-2">No risk factors identified for this policy change.</span>
            </Alert>
          ) : (
            <div className="space-y-4">
              {riskAssessment.riskFactors.map((factor, index) => (
                <div 
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getSeverityIcon(factor.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {factor.factor}
                        </h3>
                        <Badge variant={getSeverityBadgeVariant(factor.severity)}>
                          {factor.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Score Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Low (0-24)</p>
                <div className="w-full bg-green-100 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Medium (25-49)</p>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">High (50-74)</p>
                <div className="w-full bg-yellow-100 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Critical (75-100)</p>
                <div className="w-full bg-red-100 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mitigation Recommendations */}
      {riskAssessment.riskLevel === 'high' || riskAssessment.riskLevel === 'critical' ? (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={riskAssessment.riskLevel === 'critical' ? 'destructive' : 'warning'}>
              <div className="space-y-2">
                <p className="font-semibold">
                  {riskAssessment.riskLevel === 'critical' 
                    ? 'Critical Risk - Immediate Action Required'
                    : 'High Risk - Review Recommended'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Review all affected workflows and modules carefully</li>
                  <li>Consult with department heads and stakeholders</li>
                  <li>Create a rollback plan before publishing</li>
                  <li>Schedule a post-publication review meeting</li>
                  {riskAssessment.riskLevel === 'critical' && (
                    <>
                      <li className="font-semibold text-red-700">Obtain written approval from senior management</li>
                      <li className="font-semibold text-red-700">Implement additional monitoring during rollout</li>
                    </>
                  )}
                </ul>
              </div>
            </Alert>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
