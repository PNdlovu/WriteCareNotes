import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { pilotService } from '../../services/pilotService';
import { PilotDashboard as PilotDashboardType } from '../../types/pilot';
import { FeedbackWidget } from './FeedbackWidget';

export const PilotDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<PilotDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useAuth();

  useEffect(() => {
    if (tenantId) {
      loadDashboard();
    }
  }, [tenantId]);

  const loadDashboard = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const data = await pilotService.getPilotDashboard(tenantId);
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load pilot dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error">
        {error}
        <Button onClick={loadDashboard} className="ml-4" size="sm">
          Retry
        </Button>
      </Alert>
    );
  }

  if (!dashboard) {
    return (
      <Alert type="info">
        No pilot data available. Please contact support if you believe this is an error.
      </Alert>
    );
  }

  const { pilot, metrics, recentFeedback, alerts, overallScore } = dashboard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pilot Dashboard</h1>
          <p className="text-gray-600">{pilot.careHomeName} • {pilot.location}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{overallScore}%</div>
          <div className="text-sm text-gray-500">Overall Score</div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              type={alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warning'}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{alert.message}</div>
                  <div className="text-sm text-gray-600 mt-1">{alert.action}</div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Engagement Metrics */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.engagement.activeUsers}</p>
                <p className="text-xs text-gray-500">Active Users</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{metrics.engagement.totalLogins}</div>
                <div className="text-xs text-gray-500">Total Logins</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Avg Session: {metrics.engagement.avgSessionDuration}min
              </div>
            </div>
          </div>
        </Card>

        {/* Compliance Metrics */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance</p>
                <p className="text-2xl font-bold text-green-600">{metrics.compliance.auditTrailCompleteness}%</p>
                <p className="text-xs text-gray-500">Audit Trail</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{metrics.compliance.consentRecords}</div>
                <div className="text-xs text-gray-500">Consent Records</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                NHS Sync: {metrics.compliance.nhsSyncSuccessRate}%
              </div>
            </div>
          </div>
        </Card>

        {/* Adoption Metrics */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Adoption</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.adoption.modulesUsed}</p>
                <p className="text-xs text-gray-500">Modules Used</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{metrics.adoption.medicationLogs}</div>
                <div className="text-xs text-gray-500">Med Logs</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Care Plans: {metrics.adoption.carePlans}
              </div>
            </div>
          </div>
        </Card>

        {/* Feedback Metrics */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Feedback</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.feedback.totalFeedback}</p>
                <p className="text-xs text-gray-500">Total Feedback</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{metrics.feedback.feedbackResolutionRate}%</div>
                <div className="text-xs text-gray-500">Resolution Rate</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Avg Resolution: {metrics.feedback.avgResolutionTime}h
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Feedback</h3>
            <Button onClick={loadDashboard} size="sm" variant="outline">
              Refresh
            </Button>
          </div>
          
          {recentFeedback.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent feedback</p>
          ) : (
            <div className="space-y-3">
              {recentFeedback.map((feedback) => (
                <div key={feedback.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{feedback.module}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          feedback.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          feedback.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          feedback.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {feedback.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          feedback.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          feedback.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {feedback.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{feedback.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        By {feedback.submittedBy} • {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
};

export default PilotDashboard;