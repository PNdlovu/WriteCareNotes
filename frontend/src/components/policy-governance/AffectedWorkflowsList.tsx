import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Alert } from '../ui/Alert';
import { AlertTriangle, Info } from 'lucide-react';

/**
 * Affected Workflows List Component
 * 
 * Displays lists of workflows and modules affected by policy changes.
 * Provides detailed impact information and risk assessment.
 * 
 * Features:
 * - Critical workflows table
 * - All modules table
 * - Risk level filtering
 * - Impact descriptions
 * 
 * @component
 * @version 1.0.0
 * @since Phase 2 TIER 1 - Feature 3
 */

interface AffectedWorkflowsListProps {
  workflows: {
    total: number;
    byRisk: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    criticalWorkflows: Array<{
      id: string;
      name: string;
      impactDescription: string;
    }>;
  };
  modules: {
    total: number;
    modules: Array<{
      id: string;
      name: string;
      riskLevel: string;
    }>;
  };
}

export default function AffectedWorkflowsList({ workflows, modules }: AffectedWorkflowsListProps) {
  const [selectedTab, setSelectedTab] = useState<string>('workflows');

  const getRiskBadgeVariant = (risk: string): 'success' | 'info' | 'warning' | 'danger' => {
    switch (risk.toLowerCase()) {
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

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Impact Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Workflows</p>
              <p className="text-2xl font-bold text-gray-900">{workflows.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Risk</p>
              <p className="text-2xl font-bold text-green-600">{workflows.byRisk.low}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Medium Risk</p>
              <p className="text-2xl font-bold text-blue-600">{workflows.byRisk.medium}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">High Risk</p>
              <p className="text-2xl font-bold text-yellow-600">{workflows.byRisk.high}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Critical Risk</p>
              <p className="text-2xl font-bold text-red-600">{workflows.byRisk.critical}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="workflows">
            Critical Workflows ({workflows.criticalWorkflows.length})
          </TabsTrigger>
          <TabsTrigger value="modules">
            All Modules ({modules.total})
          </TabsTrigger>
        </TabsList>

        {/* Critical Workflows Tab */}
        <TabsContent value="workflows">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Critical Workflows Requiring Immediate Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflows.criticalWorkflows.length === 0 ? (
                <Alert variant="success">
                  <Info className="w-4 h-4" />
                  <span className="ml-2">No critical workflows affected by this change.</span>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Workflow ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Workflow Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Impact Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {workflows.criticalWorkflows.map((workflow) => (
                        <tr key={workflow.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {workflow.id}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {workflow.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {workflow.impactDescription}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>All Affected Modules</CardTitle>
            </CardHeader>
            <CardContent>
              {modules.total === 0 ? (
                <Alert variant="success">
                  <Info className="w-4 h-4" />
                  <span className="ml-2">No modules affected by this change.</span>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Module ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Module Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Risk Level
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {modules.modules.map((module) => (
                        <tr key={module.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {module.id}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {module.name}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={getRiskBadgeVariant(module.riskLevel)}>
                              {module.riskLevel.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Modules are sorted by risk level (critical first).
                  Review each affected module to understand the full impact of this policy change.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
