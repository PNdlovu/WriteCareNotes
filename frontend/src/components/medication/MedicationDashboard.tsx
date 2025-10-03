/**
 * @fileoverview Medication Management Dashboard Component
 * @module MedicationDashboard
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Main dashboard for medication management providing overview
 * of due medications, alerts, and quick access to administration functions.
 * 
 * @compliance
 * - CQC Regulation 12 - Safe care and treatment
 * - NICE Guidelines on Medication Management
 * - Professional Standards (NMC, GMC, GPhC)
 * - GDPR and Data Protection Act 2018
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { useMedicationDashboard } from '../../hooks/useMedicationDashboard';
import { formatDateTime, formatTime, formatMedicationTime } from '../../utils/dateUtils';
import { MedicationAdministrationModal } from './MedicationAdministrationModal';
import { MedicationDue } from '../../services/medicationService';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Pill, 
  Users, 
  TrendingUp,
  Shield,
  Calendar,
  Activity,
  FileText,
  RefreshCw
} from 'lucide-react';

interface MedicationDashboardProps {
  organizationId: string;
  userId: string;
  userRole: string;
}

export const MedicationDashboard: React.FC<MedicationDashboardProps> = ({
  organizationId,
  userId,
  userRole
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'due' | 'overdue'>('all');
  const [selectedMedication, setSelectedMedication] = useState<MedicationDue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    stats,
    dueMedications,
    overdueMedications,
    highPriorityMedications,
    alerts,
    criticalAlerts,
    isLoading,
    error,
    refetch
  } = useMedicationDashboard();

  const handleRefresh = () => {
    refetch();
    toast.success('Dashboard refreshed');
  };

  const handleAdministerMedication = (medication: MedicationDue) => {
    setSelectedMedication(medication);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMedication(null);
  };

  const handleAdministrationSuccess = () => {
    refetch(); // Refresh the dashboard data
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      case 'due':
        return <Badge variant="warning">Due Now</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger">High</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const filteredMedications = dueMedications.filter(med => {
    if (selectedFilter === 'due') return med.status === 'due';
    if (selectedFilter === 'overdue') return med.status === 'overdue';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medication Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time medication administration overview</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert variant="danger">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Alert:</strong> {criticalAlerts.length} critical medication alerts require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Medications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDueMedications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueMedications} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(stats.complianceRate)}% compliance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResidents}</div>
            <p className="text-xs text-muted-foreground">
              Under care
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Due Medications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Due Medications</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant={selectedFilter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter('all')}
                  >
                    All ({dueMedications.length})
                  </Button>
                  <Button
                    variant={selectedFilter === 'overdue' ? 'danger' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter('overdue')}
                  >
                    Overdue ({overdueMedications.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMedications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No medications {selectedFilter === 'all' ? 'due' : selectedFilter}</p>
                  </div>
                ) : (
                  filteredMedications.slice(0, 10).map((medication) => {
                    const timeInfo = formatMedicationTime(medication.scheduledTime);
                    return (
                      <div key={medication.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{medication.residentName}</h4>
                              <p className="text-sm text-gray-600">
                                {medication.medicationName} - {medication.dosage}
                              </p>
                              <p className="text-xs text-gray-500">
                                {timeInfo.time} • {timeInfo.timeUntil}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(medication.status)}
                              {getPriorityBadge(medication.priority)}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleAdministerMedication(medication)}
                          >
                            Administer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const reason = prompt('Reason for skipping:');
                              if (reason) {
                                medicationService.skipMedication(medication.id, reason)
                                  .then(() => {
                                    toast.success('Medication skipped');
                                    refetch();
                                  })
                                  .catch(() => toast.error('Failed to skip medication'));
                              }
                            }}
                          >
                            Skip
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No active alerts</p>
                  </div>
                ) : (
                  alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'high' ? 'text-orange-500' :
                          'text-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{alert.type}</p>
                          <p className="text-xs text-gray-600">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(alert.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Medication Administration Modal */}
      {selectedMedication && (
        <MedicationAdministrationModal
          medication={selectedMedication}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleAdministrationSuccess}
        />
      )}
    </div>
  );
};