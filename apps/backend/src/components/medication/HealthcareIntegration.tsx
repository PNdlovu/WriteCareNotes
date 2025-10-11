import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Wifi, WifiOff, RefreshCw, Database, AlertCircle } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: 'gp_practice' | 'pharmacy' | 'hospital' | 'lab' | 'nhs_spine';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  dataExchanged: number;
}

export const HealthcareIntegration: React.FC = () => {
  const [integrations] = useState<Integration[]>([
    {
      id: 'int-1',
      name: 'Oakwood GP Practice',
      type: 'gp_practice',
      status: 'connected',
      lastSync: '2024-01-15 14:30',
      dataExchanged: 42
    },
    {
      id: 'int-2',
      name: 'CarePharm Pharmacy',
      type: 'pharmacy',
      status: 'connected',
      lastSync: '2024-01-15 13:15',
      dataExchanged: 18
    },
    {
      id: 'int-3',
      name: 'NHS Spine',
      type: 'nhs_spine',
      status: 'syncing',
      lastSync: '2024-01-15 12:00',
      dataExchanged: 156
    },
    {
      id: 'int-4',
      name: 'Regional Hospital',
      type: 'hospital',
      status: 'error',
      lastSync: '2024-01-14 16:20',
      dataExchanged: 8
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="w-5 h-5 text-green-600" />;
      case 'syncing': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'disconnected': return <WifiOff className="w-5 h-5 text-gray-600" />;
      default: return <WifiOff className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'gp_practice': return 'bg-blue-100 text-blue-800';
      case 'pharmacy': return 'bg-green-100 text-green-800';
      case 'hospital': return 'bg-red-100 text-red-800';
      case 'lab': return 'bg-purple-100 text-purple-800';
      case 'nhs_spine': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Healthcare Integration</h2>
        <Button>
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync All
        </Button>
      </div>

      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Wifi className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter(i => i.status === 'connected').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <RefreshCw className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Syncing</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter(i => i.status === 'syncing').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter(i => i.status === 'error').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Database className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Data Exchanged</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.reduce((sum, i) => sum + i.dataExchanged, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Healthcare Connections</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {integrations.map((integration) => (
            <div key={integration.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(integration.status)}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{integration.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(integration.type)}`}>
                      {integration.type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Last sync: {integration.lastSync} | Data exchanged: {integration.dataExchanged} records
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Sync
                </Button>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Database className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Healthcare Data Integration</h4>
            <p className="text-sm text-blue-800 mt-1">
              Securely exchange medication data with GP practices, pharmacies, and NHS systems. 
              All data transfers are encrypted and comply with NHS Digital standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};