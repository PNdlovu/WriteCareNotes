import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { AlertTriangle, CheckCircle, FileText, RefreshCw } from 'lucide-react';

interface ReconciliationItem {
  id: string;
  residentName: string;
  medicationName: string;
  currentDosage: string;
  externalDosage: string;
  source: string;
  discrepancyType: 'dosage_diff' | 'medication_missing' | 'extra_medication' | 'timing_diff';
  status: 'pending' | 'resolved' | 'confirmed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

export const MedicationReconciliation: React.FC = () => {
  const [reconciliations] = useState<ReconciliationItem[]>([
    {
      id: 'rec-1',
      residentName: 'John Smith',
      medicationName: 'Amlodipine',
      currentDosage: '5mg once daily',
      externalDosage: '10mg once daily',
      source: 'GP Practice Update',
      discrepancyType: 'dosage_diff',
      status: 'pending',
      priority: 'high',
      notes: 'GP has increased dosage due to blood pressure readings'
    },
    {
      id: 'rec-2',
      residentName: 'Mary Johnson',
      medicationName: 'Simvastatin',
      currentDosage: 'Not prescribed',
      externalDosage: '20mg once daily',
      source: 'Hospital Discharge',
      discrepancyType: 'medication_missing',
      status: 'pending',
      priority: 'medium',
      notes: 'New prescription from hospital discharge summary'
    },
    {
      id: 'rec-3',
      residentName: 'Robert Wilson',
      medicationName: 'Warfarin',
      currentDosage: '2mg daily',
      externalDosage: '2mg daily',
      source: 'Pharmacy Review',
      discrepancyType: 'timing_diff',
      status: 'resolved',
      priority: 'low',
      notes: 'Timing adjusted to match pharmacy recommendation'
    }
  ]);

  const getDiscrepancyTypeColor = (type: string) => {
    switch (type) {
      case 'dosage_diff': return 'bg-orange-100 text-orange-800';
      case 'medication_missing': return 'bg-red-100 text-red-800';
      case 'extra_medication': return 'bg-purple-100 text-purple-800';
      case 'timing_diff': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Medication Reconciliation</h2>
        <Button>
          <RefreshCw className="w-4 h-4 mr-2" />
          Check for Updates
        </Button>
      </div>

      {/* Reconciliation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {reconciliations.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {reconciliations.filter(r => r.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {reconciliations.filter(r => r.priority === 'high' || r.priority === 'critical').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{reconciliations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reconciliation Items */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Reconciliation Items</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {reconciliations.map((item) => (
            <div key={item.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{item.residentName}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                      {item.priority} priority
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Medication</p>
                        <p className="text-sm text-gray-600">{item.medicationName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Current Dosage</p>
                        <p className="text-sm text-gray-600">{item.currentDosage}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">External Source Dosage</p>
                        <p className="text-sm text-gray-600">{item.externalDosage}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDiscrepancyTypeColor(item.discrepancyType)}`}>
                            {item.discrepancyType.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-500">Source: {item.source}</span>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 flex flex-col space-y-2">
                  {item.status === 'pending' && (
                    <>
                      <Button size="sm">Accept Change</Button>
                      <Button variant="outline" size="sm">Reject</Button>
                      <Button variant="outline" size="sm">Review</Button>
                    </>
                  )}
                  {item.status === 'resolved' && (
                    <Button variant="outline" size="sm">View Details</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Medication Reconciliation</h4>
            <p className="text-sm text-blue-800 mt-1">
              Compare medication lists from different healthcare sources to identify discrepancies. 
              Review and resolve differences to ensure accurate medication management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};