import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Shield, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface ComplianceMetric {
  id: string;
  area: string;
  score: number;
  status: 'compliant' | 'warning' | 'non_compliant';
  lastAudit: string;
  nextAudit: string;
  findings: number;
}

export const ComplianceMonitoring: React.FC = () => {
  const [metrics] = useState<ComplianceMetric[]>([
    {
      id: 'comp-1',
      area: 'Medication Storage',
      score: 98,
      status: 'compliant',
      lastAudit: '2024-01-15',
      nextAudit: '2024-04-15',
      findings: 0
    },
    {
      id: 'comp-2',
      area: 'Administration Records',
      score: 85,
      status: 'warning',
      lastAudit: '2024-01-10',
      nextAudit: '2024-04-10',
      findings: 2
    },
    {
      id: 'comp-3',
      area: 'Controlled Substances',
      score: 100,
      status: 'compliant',
      lastAudit: '2024-01-05',
      nextAudit: '2024-02-05',
      findings: 0
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const overallScore = Math.round(metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Compliance Monitoring</h2>
        </div>
        <Button>
          <TrendingUp className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Overall Compliance Score */}
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}%
          </div>
          <p className="text-lg text-gray-600 mt-2">Overall Compliance Score</p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Compliant Areas</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.filter(m => m.status === 'compliant').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.filter(m => m.status === 'warning').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Non-Compliant</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.filter(m => m.status === 'non_compliant').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Findings</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.reduce((sum, m) => sum + m.findings, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Areas */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Areas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Audit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Audit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Findings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric) => (
                <tr key={metric.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.area}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                      {metric.score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(metric.status)}`}>
                      {metric.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.lastAudit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.nextAudit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.findings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="outline" size="sm">View Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};