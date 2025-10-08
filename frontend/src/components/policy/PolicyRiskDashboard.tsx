/**
 * @fileoverview Policy Compliance Risk Dashboard
 * @module PolicyRiskDashboard
 * @category Policy
 * @subcategory Risk Management
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * Comprehensive risk assessment dashboard that calculates compliance risk scores
 * using multi-factor analysis. Provides risk trends, heatmaps, automated alerts,
 * and mitigation recommendations.
 * 
 * Risk Calculation Factors:
 * 1. Policy Age (25%) - How long since last review
 * 2. Acknowledgment Rate (30%) - Staff engagement with policies
 * 3. Violation History (25%) - Past compliance incidents
 * 4. Update Frequency (20%) - Regular maintenance patterns
 * 
 * Features:
 * - Real-time risk score calculation (0-100%)
 * - Risk trend analysis over time
 * - Risk heatmap by policy category
 * - Automated threshold-based alerts
 * - Risk mitigation action recommendations
 * - Drill-down to policy details
 * - Export risk reports (PDF/Excel)
 * 
 * @compliance
 * - ISO 27001 - Risk Management
 * - CQC Fundamental Standards - Governance
 * - GDPR Article 32 - Risk Assessment
 * 
 * @example
 * ```tsx
 * <PolicyRiskDashboard
 *   organizationId="org-123"
 *   onPolicyClick={(policyId) => navigate(`/policies/${policyId}`)}
 *   alertThreshold={70}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Shield,
  Download,
  Bell,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  fetchPolicyRisks,
  fetchRiskAlerts,
  acknowledgeAlert,
  fetchRiskTrends,
  type RiskLevel
} from '@/services/policyIntelligence';

/**
 * Type definitions imported from service layer
 * @see @/services/policyIntelligence
 */

/**
 * Component props
 */
interface PolicyRiskDashboardProps {
  organizationId: string;
  onPolicyClick?: (policyId: string) => void;
  alertThreshold?: number; // Risk score threshold for alerts (default: 70)
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

/**
 * Policy Risk Dashboard Component
 */
export const PolicyRiskDashboard: React.FC<PolicyRiskDashboardProps> = ({
  organizationId,
  onPolicyClick,
  alertThreshold = 70,
  autoRefresh = false,
  refreshInterval = 60000
}) => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  /**
   * Fetch policy risks using React Query
   */
  const { data: policyRisks = [], isLoading: risksLoading } = useQuery({
    queryKey: ['policyRisks', organizationId],
    queryFn: () => fetchPolicyRisks(organizationId),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchInterval: autoRefresh ? refreshInterval : false
  });

  /**
   * Fetch risk alerts using React Query
   */
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['riskAlerts', organizationId],
    queryFn: () => fetchRiskAlerts(organizationId, false),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchInterval: autoRefresh ? refreshInterval : false
  });

  /**
   * Fetch risk trends using React Query
   */
  const { data: trendData = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['riskTrends', organizationId],
    queryFn: () => fetchRiskTrends(organizationId, 30),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchInterval: autoRefresh ? refreshInterval : false
  });

  /**
   * Acknowledge alert mutation
   */
  const acknowledgeMutation = useMutation({
    mutationFn: ({ alertId, notes }: { alertId: string; notes?: string }) =>
      acknowledgeAlert(alertId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskAlerts', organizationId] });
    }
  });

  /**
   * Handle acknowledging an alert
   */
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeMutation.mutateAsync({ alertId });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const loading = risksLoading || alertsLoading || trendsLoading;

  /**
   * Calculate overall statistics
   */
  const statistics = useMemo(() => {
    if (policyRisks.length === 0) {
      return {
        averageRisk: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        minimalCount: 0
      };
    }

    const total = policyRisks.reduce((sum, p) => sum + p.overallRisk, 0);
    
    return {
      averageRisk: Math.round(total / policyRisks.length),
      criticalCount: policyRisks.filter(p => p.riskLevel === 'critical').length,
      highCount: policyRisks.filter(p => p.riskLevel === 'high').length,
      mediumCount: policyRisks.filter(p => p.riskLevel === 'medium').length,
      lowCount: policyRisks.filter(p => p.riskLevel === 'low').length,
      minimalCount: policyRisks.filter(p => p.riskLevel === 'minimal').length
    };
  }, [policyRisks]);

  /**
   * Filter policies by category
   */
  const filteredPolicies = useMemo(() => {
    if (selectedCategory === 'all') {
      return policyRisks;
    }
    return policyRisks.filter(p => p.category === selectedCategory);
  }, [policyRisks, selectedCategory]);

  /**
   * Get unique categories
   */
  const categories = useMemo(() => {
    return [...new Set(policyRisks.map(p => p.category))];
  }, [policyRisks]);

  /**
   * Category risk breakdown
   */
  const categoryRiskData = useMemo(() => {
    return categories.map(category => {
      const categoryPolicies = policyRisks.filter(p => p.category === category);
      const avgRisk = categoryPolicies.reduce((sum, p) => sum + p.overallRisk, 0) / categoryPolicies.length;
      
      return {
        category,
        averageRisk: Math.round(avgRisk),
        count: categoryPolicies.length
      };
    }).sort((a, b) => b.averageRisk - a.averageRisk);
  }, [policyRisks, categories]);

  /**
   * Get risk level color
   */
  const getRiskColor = (level: RiskLevel): string => {
    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
      minimal: 'bg-green-500'
    };
    return colors[level];
  };

  /**
   * Get risk level from score
   */
  const getRiskLevel = (score: number): RiskLevel => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'minimal';
  };

  /**
   * Export risk report
   */
  const handleExportReport = () => {
    // Generate CSV report
    const headers = ['Policy Name', 'Category', 'Risk Score', 'Risk Level', 'Acknowledgment Rate', 'Violations'];
    const rows = policyRisks.map(p => [
      p.policyName,
      p.category,
      p.overallRisk.toString(),
      p.riskLevel.toUpperCase(),
      `${p.acknowledgmentRate}%`,
      p.violationCount.toString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policy-risk-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Risk distribution pie chart data
  const riskDistributionData = [
    { name: 'Critical', value: statistics.criticalCount, color: '#DC2626' },
    { name: 'High', value: statistics.highCount, color: '#F97316' },
    { name: 'Medium', value: statistics.mediumCount, color: '#EAB308' },
    { name: 'Low', value: statistics.lowCount, color: '#3B82F6' },
    { name: 'Minimal', value: statistics.minimalCount, color: '#10B981' }
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Calculating risk scores...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Risk Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {statistics.averageRisk}%
                </p>
                <Badge className={getRiskColor(getRiskLevel(statistics.averageRisk))}>
                  {getRiskLevel(statistics.averageRisk).toUpperCase()}
                </Badge>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical Risk</p>
                <p className="text-3xl font-bold text-red-600">
                  {statistics.criticalCount}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">High Risk</p>
                <p className="text-3xl font-bold text-orange-600">
                  {statistics.highCount}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Alerts</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {alerts.filter(a => !a.acknowledged).length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <Card className="border-l-4 border-l-red-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-600" />
              Active Risk Alerts ({alerts.filter(a => !a.acknowledged).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(a => !a.acknowledged).map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getRiskColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-gray-900">{alert.policyName}</span>
                    </div>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                  </div>
                  <Button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    size="sm"
                    variant="outline"
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="averageRisk"
                  stroke="#3B82F6"
                  name="Average Risk"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="criticalPolicies"
                  stroke="#DC2626"
                  name="Critical Policies"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Risk Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Risk by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryRiskData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageRisk" fill="#3B82F6" name="Average Risk Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* High-Risk Policies Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Policy Risk Details</CardTitle>
            <Button onClick={handleExportReport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="mb-4 flex gap-2 flex-wrap">
            <Button
              onClick={() => setSelectedCategory('all')}
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All Categories
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Policies List */}
          <div className="space-y-4">
            {filteredPolicies
              .sort((a, b) => b.overallRisk - a.overallRisk)
              .map(policy => (
                <div
                  key={policy.policyId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onPolicyClick?.(policy.policyId)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{policy.policyName}</h4>
                        <Badge className={getRiskColor(policy.riskLevel)}>
                          {policy.riskLevel.toUpperCase()} - {policy.overallRisk}%
                        </Badge>
                        <Badge variant="secondary">{policy.category}</Badge>
                        {policy.trend === 'increasing' && (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                        {policy.trend === 'decreasing' && (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                      </div>

                      {/* Risk Factors */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Age Score</p>
                          <div className="flex items-center gap-2">
                            <Progress value={policy.factors.ageScore} className="h-2" />
                            <span className="text-sm font-medium">{policy.factors.ageScore}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Acknowledgment</p>
                          <div className="flex items-center gap-2">
                            <Progress value={100 - policy.factors.acknowledgmentScore} className="h-2" />
                            <span className="text-sm font-medium">{policy.acknowledgmentRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Violations</p>
                          <div className="flex items-center gap-2">
                            <Progress value={policy.factors.violationScore} className="h-2" />
                            <span className="text-sm font-medium">{policy.violationCount}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Update Frequency</p>
                          <div className="flex items-center gap-2">
                            <Progress value={policy.factors.updateFrequencyScore} className="h-2" />
                            <span className="text-sm font-medium">{policy.factors.updateFrequencyScore}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Recommended Actions */}
                      {policy.recommendedActions.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs font-semibold text-blue-900 mb-2">
                            Recommended Actions:
                          </p>
                          <ul className="text-xs text-blue-800 space-y-1">
                            {policy.recommendedActions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {filteredPolicies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No policies found in this category.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyRiskDashboard;
