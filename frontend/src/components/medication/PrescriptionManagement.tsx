/**
 * @fileoverview Prescription Management Component
 * @module PrescriptionManagement
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive prescription management interface for healthcare
 * professionals to manage, review, and coordinate resident prescriptions.
 * 
 * @compliance
 * - CQC Regulation 12 - Safe care and treatment
 * - NICE Guidelines on Medication Management
 * - Professional Standards (NMC, GMC, GPhC)
 * - GDPR and Data Protection Act 2018
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DataTable } from '../ui/DataTable';
import { useToast } from '../hooks/useToast';
import { usePrescriptionManagement } from '../hooks/usePrescriptionManagement';
import { useDrugInteractionChecker } from '../hooks/useDrugInteractionChecker';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Pill,
  FileText,
  Calendar,
  Shield,
  Refresh,
  Download,
  Mail
} from 'lucide-react';

interface PrescriptionManagementProps {
  organizationId: string;
  userId: string;
  userRole: string;
}

interface PrescriptionView {
  id: string;
  residentId: string;
  residentName: string;
  residentPhoto?: string;
  medicationId: string;
  medicationName: string;
  genericName: string;
  prescriberId: string;
  prescriberName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  reviewDate: Date;
  status: 'active' | 'expired' | 'discontinued' | 'pending';
  specialInstructions?: string;
  clinicalIndication: string;
  lastAdministered?: Date;
  nextDue?: Date;
  adherenceRate: number;
  interactionWarnings: InteractionWarning[];
  expiryWarning: boolean;
  renewalRequired: boolean;
}

interface InteractionWarning {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  interactingMedication: string;
  description: string;
  clinicalGuidance: string;
  requiresAction: boolean;
}

interface PrescriptionFilters {
  status?: string;
  prescriber?: string;
  medication?: string;
  resident?: string;
  expiryWithinDays?: number;
  hasInteractions?: boolean;
  renewalRequired?: boolean;
}

export const PrescriptionManagement: React.FC<PrescriptionManagementProps> = ({
  organizationId,
  userId,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'interactions' | 'reviews'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PrescriptionFilters>({});
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionView | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const { toast } = useToast();
  const {
    prescriptions,
    expiringPrescriptions,
    prescriptionsWithInteractions,
    prescriptionsForReview,
    loading,
    error,
    updatePrescription,
    renewPrescription,
    discontinuePrescription,
    refreshPrescriptions
  } = usePrescriptionManagement(organizationId, filters);

  const {
    checkInteractions,
    interactionResults,
    loading: interactionLoading
  } = useDrugInteractionChecker();

  const handlePrescriptionSelect = useCallback(async (prescription: PrescriptionView) => {
    setSelectedPrescription(prescription);
    
    // Check for drug interactions
    if (prescription.status === 'active') {
      await checkInteractions({
        residentId: prescription.residentId,
        medicationId: prescription.medicationId,
        organizationId
      });
    }
  }, [checkInteractions, organizationId]);

  const handleRenewal = useCallback(async (prescriptionId: string) => {
    try {
      await renewPrescription(prescriptionId, {
        renewedBy: userId,
        renewalDate: new Date(),
        reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      });

      toast({
        title: 'Prescription Renewed',
        description: 'Prescription has been successfully renewed',
        variant: 'success'
      });

      await refreshPrescriptions();
    } catch (error) {
      toast({
        title: 'Renewal Failed',
        description: error instanceof Error ? error.message : 'Failed to renew prescription',
        variant: 'error'
      });
    }
  }, [renewPrescription, userId, toast, refreshPrescriptions]);

  const handleDiscontinue = useCallback(async (prescriptionId: string, reason: string) => {
    try {
      await discontinuePrescription(prescriptionId, {
        discontinuedBy: userId,
        discontinuationDate: new Date(),
        reason
      });

      toast({
        title: 'Prescription Discontinued',
        description: 'Prescription has been discontinued',
        variant: 'info'
      });

      await refreshPrescriptions();
    } catch (error) {
      toast({
        title: 'Discontinuation Failed',
        description: error instanceof Error ? error.message : 'Failed to discontinue prescription',
        variant: 'error'
      });
    }
  }, [discontinuePrescription, userId, toast, refreshPrescriptions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'discontinued': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const prescriptionColumns = [
    {
      key: 'residentName',
      header: 'Resident',
      render: (prescription: PrescriptionView) => (
        <div className="flex items-center gap-2">
          {prescription.residentPhoto && (
            <img 
              src={prescription.residentPhoto} 
              alt={prescription.residentName}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <div className="font-medium">{prescription.residentName}</div>
          </div>
        </div>
      )
    },
    {
      key: 'medicationName',
      header: 'Medication',
      render: (prescription: PrescriptionView) => (
        <div>
          <div className="font-medium">{prescription.medicationName}</div>
          <div className="text-sm text-gray-500">{prescription.genericName}</div>
        </div>
      )
    },
    {
      key: 'dosage',
      header: 'Dosage & Route',
      render: (prescription: PrescriptionView) => (
        <div>
          <div>{prescription.dosage}</div>
          <div className="text-sm text-gray-500">{prescription.route}</div>
        </div>
      )
    },
    {
      key: 'frequency',
      header: 'Frequency',
      render: (prescription: PrescriptionView) => prescription.frequency
    },
    {
      key: 'prescriber',
      header: 'Prescriber',
      render: (prescription: PrescriptionView) => prescription.prescriberName
    },
    {
      key: 'status',
      header: 'Status',
      render: (prescription: PrescriptionView) => (
        <div className="space-y-1">
          <Badge className={getStatusColor(prescription.status)}>
            {prescription.status.toUpperCase()}
          </Badge>
          {prescription.expiryWarning && (
            <Badge variant="warning" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Expiring Soon
            </Badge>
          )}
          {prescription.interactionWarnings.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {prescription.interactionWarnings.length} Interaction{prescription.interactionWarnings.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'reviewDate',
      header: 'Review Date',
      render: (prescription: PrescriptionView) => (
        <div>
          <div>{formatDate(prescription.reviewDate)}</div>
          {prescription.renewalRequired && (
            <Badge variant="warning" className="text-xs mt-1">
              Renewal Required
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'adherence',
      header: 'Adherence',
      render: (prescription: PrescriptionView) => (
        <div className="text-center">
          <div className={`font-medium ${
            prescription.adherenceRate >= 90 ? 'text-green-600' :
            prescription.adherenceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {prescription.adherenceRate}%
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (prescription: PrescriptionView) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePrescriptionSelect(prescription)}
          >
            <Edit className="w-3 h-3" />
          </Button>
          {prescription.renewalRequired && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRenewal(prescription.id)}
            >
              <Refresh className="w-3 h-3" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const filteredPrescriptions = prescriptions?.filter(prescription => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        prescription.residentName.toLowerCase().includes(query) ||
        prescription.medicationName.toLowerCase().includes(query) ||
        prescription.prescriberName.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  if (loading && !prescriptions) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading prescriptions...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescription Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor resident prescriptions and medication regimens
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={refreshPrescriptions}
            disabled={loading}
          >
            <Refresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowPrescriptionForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Prescription
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search prescriptions, residents, or medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="discontinued">Discontinued</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Warning</label>
                  <select
                    value={filters.expiryWithinDays || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      expiryWithinDays: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Filter</option>
                    <option value="7">Expiring in 7 days</option>
                    <option value="14">Expiring in 14 days</option>
                    <option value="30">Expiring in 30 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interactions</label>
                  <select
                    value={filters.hasInteractions ? 'true' : ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      hasInteractions: e.target.value === 'true' ? true : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Prescriptions</option>
                    <option value="true">With Interactions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Renewal</label>
                  <select
                    value={filters.renewalRequired ? 'true' : ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      renewalRequired: e.target.value === 'true' ? true : undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Prescriptions</option>
                    <option value="true">Renewal Required</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            All Prescriptions ({filteredPrescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Expiring ({expiringPrescriptions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="interactions" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Interactions ({prescriptionsWithInteractions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Reviews ({prescriptionsForReview?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <DataTable
                data={filteredPrescriptions}
                columns={prescriptionColumns}
                loading={loading}
                onRowClick={handlePrescriptionSelect}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Expiring Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringPrescriptions && expiringPrescriptions.length > 0 ? (
                <div className="space-y-3">
                  {expiringPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{prescription.medicationName}</h4>
                          <p className="text-sm text-gray-600">
                            {prescription.residentName} • {prescription.dosage}
                          </p>
                          <p className="text-sm text-orange-600 font-medium">
                            Expires: {formatDate(prescription.endDate!)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRenewal(prescription.id)}
                          >
                            <Refresh className="w-3 h-3 mr-1" />
                            Renew
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Contact Prescriber
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Expiring Prescriptions</h3>
                  <p className="text-gray-600">All prescriptions are current and valid.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Drug Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptionsWithInteractions && prescriptionsWithInteractions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptionsWithInteractions.map((prescription) => (
                    <div key={prescription.id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{prescription.medicationName}</h4>
                          <p className="text-sm text-gray-600">
                            {prescription.residentName} • {prescription.dosage}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {prescription.interactionWarnings.length} Interaction{prescription.interactionWarnings.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {prescription.interactionWarnings.map((warning) => (
                          <Alert key={warning.id} variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold">
                                    <span className={getSeverityColor(warning.severity)}>
                                      {warning.severity.toUpperCase()}
                                    </span>
                                    : Interaction with {warning.interactingMedication}
                                  </div>
                                  <div className="text-sm mt-1">{warning.description}</div>
                                  <div className="text-sm mt-1 font-medium">
                                    Clinical Guidance: {warning.clinicalGuidance}
                                  </div>
                                </div>
                                {warning.requiresAction && (
                                  <Button size="sm" variant="outline">
                                    Take Action
                                  </Button>
                                )}
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Drug Interactions</h3>
                  <p className="text-gray-600">No significant drug interactions detected.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Prescriptions Due for Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptionsForReview && prescriptionsForReview.length > 0 ? (
                <div className="space-y-3">
                  {prescriptionsForReview.map((prescription) => (
                    <div key={prescription.id} className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{prescription.medicationName}</h4>
                          <p className="text-sm text-gray-600">
                            {prescription.residentName} • {prescription.dosage}
                          </p>
                          <p className="text-sm text-blue-600 font-medium">
                            Review Due: {formatDate(prescription.reviewDate)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Adherence: {prescription.adherenceRate}%
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handlePrescriptionSelect(prescription)}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reviews Due</h3>
                  <p className="text-gray-600">All prescriptions are up to date with their reviews.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Prescription Details - {selectedPrescription.medicationName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prescription Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Prescription Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Medication</label>
                      <p className="font-medium">{selectedPrescription.medicationName}</p>
                      <p className="text-sm text-gray-500">{selectedPrescription.genericName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Dosage & Route</label>
                      <p>{selectedPrescription.dosage} via {selectedPrescription.route}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Frequency</label>
                      <p>{selectedPrescription.frequency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Clinical Indication</label>
                      <p>{selectedPrescription.clinicalIndication}</p>
                    </div>
                    {selectedPrescription.specialInstructions && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Special Instructions</label>
                        <p>{selectedPrescription.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Resident & Prescriber</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Resident</label>
                      <div className="flex items-center gap-2">
                        {selectedPrescription.residentPhoto && (
                          <img 
                            src={selectedPrescription.residentPhoto} 
                            alt={selectedPrescription.residentName}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <p className="font-medium">{selectedPrescription.residentName}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Prescriber</label>
                      <p>{selectedPrescription.prescriberName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Start Date</label>
                      <p>{formatDate(selectedPrescription.startDate)}</p>
                    </div>
                    {selectedPrescription.endDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Date</label>
                        <p>{formatDate(selectedPrescription.endDate)}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Review Date</label>
                      <p>{formatDate(selectedPrescription.reviewDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Adherence */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedPrescription.status)}>
                    {selectedPrescription.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Adherence Rate</p>
                  <p className={`text-2xl font-bold ${
                    selectedPrescription.adherenceRate >= 90 ? 'text-green-600' :
                    selectedPrescription.adherenceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedPrescription.adherenceRate}%
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Last Administered</p>
                  <p className="font-medium">
                    {selectedPrescription.lastAdministered 
                      ? formatDateTime(selectedPrescription.lastAdministered)
                      : 'Never'
                    }
                  </p>
                </div>
              </div>

              {/* Drug Interactions */}
              {selectedPrescription.interactionWarnings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Drug Interactions</h3>
                  <div className="space-y-2">
                    {selectedPrescription.interactionWarnings.map((warning) => (
                      <Alert key={warning.id} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold">
                            <span className={getSeverityColor(warning.severity)}>
                              {warning.severity.toUpperCase()}
                            </span>
                            : Interaction with {warning.interactingMedication}
                          </div>
                          <div className="text-sm mt-1">{warning.description}</div>
                          <div className="text-sm mt-1 font-medium">
                            Clinical Guidance: {warning.clinicalGuidance}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPrescription(null)}
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  {selectedPrescription.renewalRequired && (
                    <Button
                      onClick={() => handleRenewal(selectedPrescription.id)}
                    >
                      <Refresh className="w-4 h-4 mr-2" />
                      Renew Prescription
                    </Button>
                  )}
                  <Button
                    variant="outline"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Prescription
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt('Please enter reason for discontinuation:');
                      if (reason) {
                        handleDiscontinue(selectedPrescription.id, reason);
                        setSelectedPrescription(null);
                      }
                    }}
                  >
                    Discontinue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};