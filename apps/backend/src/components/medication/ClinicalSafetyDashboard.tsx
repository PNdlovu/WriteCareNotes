import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { AlertTriangle, Shield, TrendingUp, Clock } from 'lucide-react';

interface SafetyAlert {
  id: string;
  type: 'drug_interaction' | 'allergy' | 'dosage_warning' | 'contraindication';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  residentName: string;
  medicationInvolved: string;
  timestamp: string;
}

export const ClinicalSafetyDashboard: React.FC = () => {
  const [alerts] = useState<SafetyAlert[]>([
    {
      id: 'alert-1',
      type: 'drug_interaction',
      severity: 'high',
      message: 'Potential interaction between Warfarin and Aspirin',
      residentName: 'John Smith',
      medicationInvolved: 'Warfarin, Aspirin',
      timestamp: '2024-01-15 14:30'
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Clinical Safety Dashboard</h2>
        </div>
      </div>

      {/* Safety Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Safety Score</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Interventions</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-gray-900">2.3min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Safety Alerts */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Active Safety Alerts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{alert.timestamp}</span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mt-1">{alert.message}</h4>
                    <p className="text-sm text-gray-600">
                      Resident: {alert.residentName} | Medications: {alert.medicationInvolved}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Review</Button>
                  <Button size="sm">Resolve</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};