import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertCircle, PlusCircle, Search, Filter, Calendar, Clock, User, Pill } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedBy: string;
  prescribedDate: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'discontinued' | 'completed';
  residentId: string;
  residentName: string;
  instructions: string;
  sideEffects?: string[];
  contraindications?: string[];
}

interface MedicationDashboardProps {
  residentId?: string;
}

export const MedicationDashboard: React.FC<MedicationDashboardProps> = ({ 
  residentId 
}) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadMedications();
  }, [residentId]);

  const loadMedications = async () => {
    setIsLoading(true);
    try {
      // Simulate API call with realistic medication data
      const mockMedications: Medication[] = [
        {
          id: 'med-1',
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: 'Once daily',
          route: 'Oral',
          prescribedBy: 'Dr. Sarah Johnson',
          prescribedDate: '2024-01-15',
          startDate: '2024-01-16',
          status: 'active',
          residentId: 'res-1',
          residentName: 'John Smith',
          instructions: 'Take with or without food, preferably at the same time each day',
          sideEffects: ['Swelling of ankles', 'Fatigue', 'Dizziness']
        },
        {
          id: 'med-2',
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          route: 'Oral',
          prescribedBy: 'Dr. Michael Chen',
          prescribedDate: '2024-01-10',
          startDate: '2024-01-11',
          status: 'active',
          residentId: 'res-1',
          residentName: 'John Smith',
          instructions: 'Take with meals to reduce stomach upset',
          sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste']
        },
        {
          id: 'med-3',
          name: 'Warfarin',
          dosage: '2mg',
          frequency: 'Once daily',
          route: 'Oral',
          prescribedBy: 'Dr. Emma Williams',
          prescribedDate: '2024-01-05',
          startDate: '2024-01-06',
          endDate: '2024-02-06',
          status: 'completed',
          residentId: 'res-2',
          residentName: 'Mary Johnson',
          instructions: 'Take at the same time each day. Regular blood tests required',
          contraindications: ['Aspirin', 'NSAIDs', 'Excessive alcohol']
        }
      ];

      // Filter by resident if specified
      const filteredMedications = residentId 
        ? mockMedications.filter(med => med.residentId === residentId)
        : mockMedications;

      setMedications(filteredMedications);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMedications = medications.filter(medication => {
    const matchesSearch = medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medication.residentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || medication.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {residentId ? 'Resident Medications' : 'Medication Management'}
          </h2>
          <p className="text-gray-600">
            Monitor and manage medication administration for residents
          </p>
        </div>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search medications or residents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="discontinued">Discontinued</option>
            <option value="completed">Completed</option>
          </select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Pill className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Medications</p>
              <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {medications.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <User className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Residents</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(medications.map(m => m.residentId)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Medications List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Current Medications</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosage & Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prescribed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedications.map((medication) => (
                <tr key={medication.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {medication.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {medication.route}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{medication.residentName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{medication.dosage}</div>
                    <div className="text-sm text-gray-500">{medication.frequency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{medication.prescribedBy}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(medication.prescribedDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(medication.status)}`}>
                      {medication.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredMedications.length === 0 && (
        <div className="text-center py-12">
          <Pill className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No medications found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding a new medication.'}
          </p>
        </div>
      )}
    </div>
  );
};