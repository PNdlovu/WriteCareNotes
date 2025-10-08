/**
 * @fileoverview Policy Gap Analysis Component
 * @module PolicyGapAnalysis
 * @category Policy
 * @subcategory Analytics
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * AI-powered policy gap analysis component that identifies missing policies,
 * compares against industry benchmarks, and provides recommendations for
 * compliance across all 7 British Isles jurisdictions.
 * 
 * Features:
 * - Automated gap detection algorithm
 * - Industry benchmark comparison
 * - Required policies checklist by jurisdiction
 * - Policy coverage heatmap visualization
 * - Priority recommendations (critical/high/medium/low)
 * - Template suggestions for identified gaps
 * - Export to PDF/Excel
 * 
 * @compliance
 * - CQC (England) - Fundamental Standards
 * - CIW (Wales) - National Minimum Standards
 * - Care Inspectorate (Scotland) - Health & Social Care Standards
 * - RQIA (Northern Ireland) - Quality Standards
 * - HIQA (Ireland) - National Standards
 * - Jersey - Care Standards
 * - Isle of Man - Regulatory Framework
 * 
 * @example
 * ```tsx
 * <PolicyGapAnalysis
 *   organizationId="org-123"
 *   jurisdiction="england"
 *   serviceType="residential-care"
 *   onGapSelected={(gap) => console.log(gap)}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
  Download,
  Search,
  MapPin
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import {
  fetchGapAnalysis,
  createPolicyFromTemplate,
  type Jurisdiction,
  type ServiceType,
  type GapPriority,
  type PolicyGap
} from '@/services/policyIntelligence';

/**
 * Type definitions are imported from service layer
 * @see @/services/policyIntelligence
 */

/**
 * Component props
 */
interface PolicyGapAnalysisProps {
  organizationId: string;
  jurisdiction: Jurisdiction;
  serviceType: ServiceType;
  onGapSelected?: (gap: PolicyGap) => void;
  onCreateFromTemplate?: (templateId: string) => void;
}

/**
 * Policy Gap Analysis Component
 */
export const PolicyGapAnalysis: React.FC<PolicyGapAnalysisProps> = ({
  organizationId,
  jurisdiction,
  serviceType,
  onGapSelected,
  onCreateFromTemplate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<GapPriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  /**
   * Fetch gap analysis using React Query
   */
  const { 
    data: analysisResult, 
    isLoading: loading,
    refetch 
  } = useQuery({
    queryKey: ['gapAnalysis', organizationId, jurisdiction, serviceType],
    queryFn: () => fetchGapAnalysis(organizationId, jurisdiction, serviceType),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });

  /**
   * Handle applying template to create policy
   */
  const handleApplyTemplate = async (gap: PolicyGap) => {
    try {
      if (!gap.recommendedTemplate) return;
      
      const result = await createPolicyFromTemplate(
        organizationId,
        gap.recommendedTemplate,
        { jurisdiction, serviceType }
      );
      
      console.log('Policy created:', result);
      alert(`Policy "${result.policyName}" created successfully!`);
      
      // Call prop callback if provided (for backward compatibility)
      onCreateFromTemplate?.(gap.recommendedTemplate);
      
      // Refetch gap analysis
      refetch();
    } catch (error) {
      console.error('Failed to create policy:', error);
      alert('Failed to create policy. Please try again.');
    }
  };

  /**
   * Filter gaps based on search and filters
   */
  const filteredGaps = useMemo(() => {
    if (!analysisResult) return [];

    let filtered = analysisResult.gaps;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(gap =>
        gap.policyName.toLowerCase().includes(term) ||
        gap.category.toLowerCase().includes(term) ||
        gap.description.toLowerCase().includes(term)
      );
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(gap => gap.priority === filterPriority);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(gap => gap.category === filterCategory);
    }

    return filtered;
  }, [analysisResult, searchTerm, filterPriority, filterCategory]);

  /**
   * Get unique categories
   */
  const categories = useMemo(() => {
    if (!analysisResult) return [];
    return [...new Set(analysisResult.gaps.map(gap => gap.category))];
  }, [analysisResult]);

  /**
   * Get priority badge color
   */
  const getPriorityColor = (priority: GapPriority): string => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return colors[priority];
  };

  /**
   * Export gap analysis
   */
  const handleExport = () => {
    if (!analysisResult) return;

    // Generate CSV
    const headers = ['Policy Name', 'Category', 'Priority', 'Regulator', 'Coverage'];
    const rows = analysisResult.gaps.map(gap => [
      gap.policyName,
      gap.category,
      gap.priority.toUpperCase(),
      gap.regulator,
      `${gap.benchmarkCoverage}%`
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policy-gap-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Analyzing policy gaps...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisResult) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            Unable to load gap analysis. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Coverage</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analysisResult.coveragePercentage}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={analysisResult.coveragePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Required</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analysisResult.totalRequired}
                </p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Implemented</p>
                <p className="text-3xl font-bold text-green-600">
                  {analysisResult.implemented}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Missing</p>
                <p className="text-3xl font-bold text-red-600">
                  {analysisResult.missing}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Policy Gaps ({filteredGaps.length})</CardTitle>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>

            <Select 
              value={filterPriority} 
              onValueChange={(v: string) => setFilterPriority(v as GapPriority | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gap List */}
          <div className="space-y-4">
            {filteredGaps.map(gap => (
              <div
                key={gap.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onGapSelected?.(gap)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{gap.policyName}</h4>
                      <Badge className={getPriorityColor(gap.priority)}>
                        {gap.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary">{gap.category}</Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{gap.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {gap.regulator}
                      </span>
                      <span>Industry Coverage: {gap.benchmarkCoverage}%</span>
                    </div>

                    {gap.consequences.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs font-semibold text-red-900 mb-1">
                          Consequences of non-compliance:
                        </p>
                        <ul className="text-xs text-red-800 list-disc list-inside">
                          {gap.consequences.map((consequence, idx) => (
                            <li key={idx}>{consequence}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {gap.recommendedTemplate && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(gap);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {filteredGaps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No policy gaps found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Coverage by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analysisResult.categoryBreakdown).map(([category, data]) => {
              const percentage = (data.implemented / data.required) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm text-gray-500">
                      {data.implemented}/{data.required} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <Progress value={percentage} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyGapAnalysis;
