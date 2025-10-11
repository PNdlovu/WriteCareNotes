import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Clock, Check, AlertTriangle, User, Pill } from 'lucide-react';

interface MedicationAdministration {
  id: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  residentName: string;
  status: 'pending' | 'administered' | 'missed' | 'refused';
  administeredBy?: string;
  administeredAt?: string;
  notes?: string;
}

export const MedicationAdministrationInterface: React.FC = () => {
  const [administrations, setAdministrations] = useState<MedicationAdministration[]>([
    {
      id: 'admin-1',
      medicationName: 'Amlodipine 5mg',
      dosage: '1 tablet',
      scheduledTime: '08:00',
      residentName: 'John Smith',
      status: 'pending'
    },
    {
      id: 'admin-2',
      medicationName: 'Metformin 500mg',
      dosage: '1 tablet',
      scheduledTime: '08:00',
      residentName: 'Mary Johnson',
      status: 'administered',
      administeredBy: 'Nurse Sarah',
      administeredAt: '08:05'
    }
  ]);

  const handleAdminister = (id: string) => {
    setAdministrations(prev => prev.map(admin => 
      admin.id === id 
        ? { ...admin, status: 'administered' as const, administeredAt: new Date().toLocaleTimeString(), administeredBy: 'Current User' }
        : admin
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'administered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'refused': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Medication Administration</h2>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Due Medications</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {administrations.map((admin) => (
            <div key={admin.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <Pill className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{admin.medicationName}</h4>
                  <p className="text-sm text-gray-500">{admin.dosage} for {admin.residentName}</p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Scheduled: {admin.scheduledTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(admin.status)}`}>
                  {admin.status}
                </span>
                {admin.status === 'pending' && (
                  <Button onClick={() => handleAdminister(admin.id)}>
                    <Check className="w-4 h-4 mr-2" />
                    Administer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};