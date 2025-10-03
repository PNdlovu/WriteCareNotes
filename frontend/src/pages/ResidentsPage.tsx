import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { residentService, Resident, ResidentFilters } from '../services/residentService';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';


export const ResidentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'discharged'>('active');
  const [isLoading, setIsLoading] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load residents from API
  useEffect(() => {
    const loadResidents = async () => {
      if (!user?.organizationId) return;
      
      setIsLoading(true);
      try {
        const filters: ResidentFilters = {
          search: searchTerm || undefined,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          limit: 50
        };
        
        const data = await residentService.getResidents(user.organizationId, filters);
        setResidents(data);
      } catch (error) {
        console.error('Failed to load residents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load residents. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadResidents();
  }, [searchTerm, selectedStatus, user?.organizationId, toast]);

  // Mock data for residents (fallback)
  const mockResidents: Resident[] = [
    {
      id: 'res-1',
      firstName: 'Mary',
      lastName: 'Johnson',
      dateOfBirth: '1935-03-15',
      roomNumber: 'Room 101',
      careLevel: 'Medium',
      status: 'active',
      admissionDate: '2023-01-15',
      email: 'mary.johnson@family.com',
      phone: '+44 20 7946 0958',
      emergencyContact: {
        name: 'David Johnson',
        relationship: 'Son',
        phone: '+44 20 7946 0959',
      },
    },
    {
      id: 'res-2',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '1940-07-22',
      roomNumber: 'Room 102',
      careLevel: 'High',
      status: 'active',
      admissionDate: '2022-11-08',
      phone: '+44 20 7946 0960',
      emergencyContact: {
        name: 'Sarah Smith',
        relationship: 'Daughter',
        phone: '+44 20 7946 0961',
      },
    },
    {
      id: 'res-3',
      firstName: 'Sarah',
      lastName: 'Wilson',
      dateOfBirth: '1938-12-03',
      roomNumber: 'Room 103',
      careLevel: 'Low',
      status: 'active',
      admissionDate: '2023-06-20',
      email: 'sarah.wilson@email.com',
      emergencyContact: {
        name: 'Mark Wilson',
        relationship: 'Nephew',
        phone: '+44 20 7946 0962',
      },
    },
  ];

  // Use real residents data or fallback to mock data
  const displayResidents = residents.length > 0 ? residents : mockResidents;
  
  // Filter residents based on search term and status (for mock data fallback)
  const filteredResidents = displayResidents.filter(resident => {
    const matchesSearch = searchTerm === '' || 
      `${resident.firstName} ${resident.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || resident.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'discharged':
        return <Badge variant="secondary">Discharged</Badge>;
      case 'temporary_leave':
        return <Badge variant="warning">Temporary Leave</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCareLevelBadge = (careLevel: string) => {
    switch (careLevel.toLowerCase()) {
      case 'high':
        return <Badge variant="danger">High Care</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium Care</Badge>;
      case 'low':
        return <Badge variant="success">Low Care</Badge>;
      default:
        return <Badge variant="secondary">{careLevel}</Badge>;
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resident Management</h1>
          <p className="text-gray-600 mt-1">Manage resident information and care details</p>
        </div>
        <Button onClick={() => toast.success('Add Resident feature coming soon!')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resident
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search residents by name or room..."
                  className="pl-10 form-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={selectedStatus === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
              >
                All ({residents.length})
              </Button>
              <Button
                variant={selectedStatus === 'active' ? 'success' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('active')}
              >
                Active ({residents.filter(r => r.status === 'active').length})
              </Button>
              <Button
                variant={selectedStatus === 'discharged' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('discharged')}
              >
                Discharged ({residents.filter(r => r.status === 'discharged').length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Residents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading residents...</span>
          </div>
        ) : (
          filteredResidents.map((resident) => (
          <Card key={resident.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {resident.firstName} {resident.lastName}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{resident.roomNumber}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(resident.status)}
                  {getCareLevelBadge(resident.careLevel)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Age:</span>
                  <p className="font-medium">{calculateAge(resident.dateOfBirth)} years</p>
                </div>
                <div>
                  <span className="text-gray-500">Admitted:</span>
                  <p className="font-medium">{new Date(resident.admissionDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                {resident.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {resident.email}
                  </div>
                )}
                {resident.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {resident.phone}
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Emergency Contact</h4>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{resident.emergencyContact.name}</p>
                  <p>{resident.emergencyContact.relationship}</p>
                  <div className="flex items-center mt-1">
                    <Phone className="h-3 w-3 mr-1" />
                    {resident.emergencyContact.phone}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  size="sm" 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => toast.success('Resident details feature coming soon!')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toast.success('Edit resident feature coming soon!')}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {!isLoading && filteredResidents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No residents found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria' : 'No residents match the selected filters'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};