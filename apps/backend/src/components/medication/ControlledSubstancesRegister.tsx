import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Shield, Lock, AlertTriangle, FileText } from 'lucide-react';

interface ControlledSubstance {
  id: string;
  name: string;
  schedule: string;
  currentStock: number;
  location: string;
  lastChecked: string;
  checkedBy: string;
}

export const ControlledSubstancesRegister: React.FC = () => {
  const [substances] = useState<ControlledSubstance[]>([
    {
      id: 'cs-1',
      name: 'Morphine 10mg',
      schedule: 'Schedule II',
      currentStock: 50,
      location: 'Secure Cabinet A',
      lastChecked: '2024-01-15 08:00',
      checkedBy: 'Nurse Manager'
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">Controlled Substances Register</h2>
        </div>
        <Button variant="destructive">
          <Lock className="w-4 h-4 mr-2" />
          Secure Access
        </Button>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-sm text-red-800">
            This section requires enhanced security clearance and maintains detailed audit logs.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Controlled Substances Inventory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Substance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Checked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {substances.map((substance) => (
                <tr key={substance.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {substance.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {substance.schedule}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {substance.currentStock} units
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {substance.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{substance.lastChecked}</div>
                    <div className="text-sm text-gray-500">by {substance.checkedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="outline" size="sm">Audit Trail</Button>
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