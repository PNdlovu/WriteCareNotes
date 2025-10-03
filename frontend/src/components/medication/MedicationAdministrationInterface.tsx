/**
 * @fileoverview Medication Administration Interface Component
 * @module MedicationAdministrationInterface
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description React component for medication administration with barcode scanning,
 * electronic signatures, and real-time safety checks for healthcare professionals.
 * 
 * @compliance
 * - CQC Regulation 12 - Safe care and treatment
 * - NICE Guidelines on Medication Management
 * - Professional Standards (NMC, GMC, GPhC)
 * - GDPR and Data Protection Act 2018
 * - WCAG 2.1 AA Accessibility Standards
 * 
 * @security
 * - Electronic signature verification
 * - Real-time drug interaction checking
 * - Audit trail for all administrations
 * - Role-based access control
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { BarcodeScanner } from '../ui/BarcodeScanner';
import { ElectronicSignature } from '../ui/ElectronicSignature';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { useMedicationAdministration } from '../hooks/useMedicationAdministration';
import { useClinicalSafety } from '../hooks/useClinicalSafety';
import { formatDateTime, formatTime } from '../../utils/dateUtils';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Scan, 
  FileText, 
  Shield,
  User,
  Calendar,
  Pill
} from 'lucide-react';

interface MedicationAdministrationInterfaceProps {
  residentId: string;
  organizationId: string;
  onAdministrationComplete?: (administrationId: string) => void;
  onError?: (error: string) => void;
}

interface PendingMedication {
  id: string;
  prescriptionId: string;
  medicationName: string;
  dosage: string;
  route: string;
  scheduledTime: Date;
  isOverdue: boolean;
  isPRN: boolean;
  lastAdministered?: Date;
  safetyAlerts: SafetyAlert[];
}

interface SafetyAlert {
  id: string;
  type: 'interaction' | 'allergy' | 'contraindication' | 'dosage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  requiresAction: boolean;
}

interface AdministrationRecord {
  medicationId: string;
  dosageGiven: string;
  routeUsed: string;
  administrationTime: Date;
  administeredBy: string;
  witnessedBy?: string;
  notes?: string;
  refusalReason?: string;
  sideEffectsObserved?: string[];
}

export const MedicationAdministrationInterface: React.FC<MedicationAdministrationInterfaceProps> = ({
  residentId,
  organizationId,
  onAdministrationComplete,
  onError
}) => {
  const [activeTab, setActiveTab] = useState<'due' | 'prn' | 'history'>('due');
  const [selectedMedication, setSelectedMedication] = useState<PendingMedication | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [administrationData, setAdministrationData] = useState<Partial<AdministrationRecord>>({});
  const [showSignature, setShowSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const {
    pendingMedications,
    prnMedications,
    administrationHistory,
    loading,
    error,
    recordAdministration,
    recordRefusal,
    refreshMedications
  } = useMedicationAdministration(residentId, organizationId);

  const {
    performSafetyCheck,
    safetyCheckResult,
    loading: safetyLoading
  } = useClinicalSafety();

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleMedicationSelect = useCallback(async (medication: PendingMedication) => {
    setSelectedMedication(medication);
    setAdministrationData({
      medicationId: medication.id,
      dosageGiven: medication.dosage,
      routeUsed: medication.route,
      administrationTime: new Date()
    });

    // Perform safety check
    await performSafetyCheck({
      residentId,
      medicationId: medication.id,
      dosage: medication.dosage,
      route: medication.route,
      organizationId
    });
  }, [residentId, organizationId, performSafetyCheck]);

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    setIsScanning(false);
    
    try {
      // Find medication by barcode
      const medication = [...pendingMedications, ...prnMedications].find(
        med => med.id === barcode || med.prescriptionId === barcode
      );

      if (medication) {
        await handleMedicationSelect(medication);
        toast({
          title: 'Medication Scanned',
          description: `${medication.medicationName} selected for administration`,
          variant: 'success'
        });
      } else {
        toast({
          title: 'Medication Not Found',
          description: 'Scanned barcode does not match any pending medications',
          variant: 'error'
        });
      }
    } catch (error) {
      toast({
        title: 'Scan Error',
        description: 'Failed to process barcode scan',
        variant: 'error'
      });
    }
  }, [pendingMedications, prnMedications, handleMedicationSelect, toast]);

  const handleAdministrationSubmit = useCallback(async (signature: string) => {
    if (!selectedMedication || !administrationData.medicationId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const administrationRecord: AdministrationRecord = {
        ...administrationData,
        administrationTime: new Date(),
        administeredBy: signature // In real implementation, this would be the user ID
      } as AdministrationRecord;

      const result = await recordAdministration(administrationRecord);

      toast({
        title: 'Administration Recorded',
        description: `${selectedMedication.medicationName} administration recorded successfully`,
        variant: 'success'
      });

      setSelectedMedication(null);
      setAdministrationData({});
      setShowSignature(false);
      
      if (onAdministrationComplete) {
        onAdministrationComplete(result.id);
      }

      await refreshMedications();
    } catch (error) {
      toast({
        title: 'Administration Failed',
        description: error instanceof Error ? error.message : 'Failed to record administration',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMedication, administrationData, recordAdministration, toast, onAdministrationComplete, refreshMedications]);

  const handleRefusal = useCallback(async (reason: string) => {
    if (!selectedMedication) {
      return;
    }

    try {
      await recordRefusal(selectedMedication.id, reason);
      
      toast({
        title: 'Refusal Recorded',
        description: `${selectedMedication.medicationName} refusal recorded`,
        variant: 'info'
      });

      setSelectedMedication(null);
      await refreshMedications();
    } catch (error) {
      toast({
        title: 'Refusal Recording Failed',
        description: error instanceof Error ? error.message : 'Failed to record refusal',
        variant: 'error'
      });
    }
  }, [selectedMedication, recordRefusal, toast, refreshMedications]);

  const renderSafetyAlerts = (alerts: SafetyAlert[]) => {
    if (alerts.length === 0) return null;

    return (
      <div className="space-y-2 mb-4">
        {alerts.map((alert) => (
          <Alert 
            key={alert.id} 
            variant={alert.severity === 'critical' ? 'destructive' : 'warning'}
            className="border-l-4"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">{alert.type.toUpperCase()}: {alert.message}</div>
              <div className="text-sm mt-1">{alert.recommendation}</div>
              {alert.requiresAction && (
                <Badge variant="destructive" className="mt-2">
                  Action Required
                </Badge>
              )}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  const renderMedicationCard = (medication: PendingMedication) => (
    <Card 
      key={medication.id} 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedMedication?.id === medication.id ? 'ring-2 ring-blue-500' : ''
      } ${medication.isOverdue ? 'border-red-500' : ''}`}
      onClick={() => handleMedicationSelect(medication)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{medication.medicationName}</CardTitle>
          <div className="flex gap-2">
            {medication.isOverdue && (
              <Badge variant="destructive">
                <Clock className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            )}
            {medication.isPRN && (
              <Badge variant="secondary">PRN</Badge>
            )}
            {medication.safetyAlerts.length > 0 && (
              <Badge variant="warning">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {medication.safetyAlerts.length} Alert{medication.safetyAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Dosage:</span>
            <span className="font-medium">{medication.dosage}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Route:</span>
            <span className="font-medium">{medication.route}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Scheduled:</span>
            <span className="font-medium">{formatTime(medication.scheduledTime)}</span>
          </div>
          {medication.lastAdministered && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Given:</span>
              <span className="font-medium">{formatDateTime(medication.lastAdministered)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading medications...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Medication Administration</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsScanning(true)}
            disabled={isScanning}
          >
            <Scan className="w-4 h-4 mr-2" />
            Scan Barcode
          </Button>
          <Button
            variant="outline"
            onClick={refreshMedications}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="due" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Due Medications ({pendingMedications.length})
          </TabsTrigger>
          <TabsTrigger value="prn" className="flex items-center gap-2">
            <Pill className="w-4 h-4" />
            PRN Medications ({prnMedications.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Administration History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="due" className="space-y-4">
          {pendingMedications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Medications Up to Date</h3>
                <p className="text-gray-600">No medications are currently due for administration.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingMedications.map(renderMedicationCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prn" className="space-y-4">
          {prnMedications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Pill className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No PRN Medications Available</h3>
                <p className="text-gray-600">No PRN (as required) medications are currently prescribed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prnMedications.map(renderMedicationCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Administration History</CardTitle>
            </CardHeader>
            <CardContent>
              {administrationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent administration history available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {administrationHistory.slice(0, 10).map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{record.medicationName}</div>
                        <div className="text-sm text-gray-600">
                          {record.dosage} via {record.route}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatDateTime(record.administrationTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {record.administeredBy}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Barcode Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Scan Medication Barcode</CardTitle>
            </CardHeader>
            <CardContent>
              <BarcodeScanner
                onScan={handleBarcodeScanned}
                onError={(error) => {
                  toast({
                    title: 'Scan Error',
                    description: error,
                    variant: 'error'
                  });
                  setIsScanning(false);
                }}
              />
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setIsScanning(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Medication Administration Modal */}
      {selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Administer {selectedMedication.medicationName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Safety Alerts */}
              {renderSafetyAlerts(selectedMedication.safetyAlerts)}

              {/* Safety Check Results */}
              {safetyCheckResult && (
                <Alert variant={safetyCheckResult.safe ? 'default' : 'destructive'}>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold">
                      Safety Check: {safetyCheckResult.safe ? 'SAFE' : 'UNSAFE'} 
                      (Score: {safetyCheckResult.safetyScore}/100)
                    </div>
                    {safetyCheckResult.recommendations.length > 0 && (
                      <ul className="mt-2 text-sm">
                        {safetyCheckResult.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Medication Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Medication</label>
                  <Input value={selectedMedication.medicationName} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Scheduled Time</label>
                  <Input value={formatTime(selectedMedication.scheduledTime)} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prescribed Dosage</label>
                  <Input value={selectedMedication.dosage} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Route</label>
                  <Input value={selectedMedication.route} disabled />
                </div>
              </div>

              {/* Administration Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Administration Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Actual Dosage Given</label>
                    <Input
                      value={administrationData.dosageGiven || ''}
                      onChange={(e) => setAdministrationData(prev => ({
                        ...prev,
                        dosageGiven: e.target.value
                      }))}
                      placeholder="Enter actual dosage given"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Route Used</label>
                    <Input
                      value={administrationData.routeUsed || ''}
                      onChange={(e) => setAdministrationData(prev => ({
                        ...prev,
                        routeUsed: e.target.value
                      }))}
                      placeholder="Enter route used"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Administration Notes</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    value={administrationData.notes || ''}
                    onChange={(e) => setAdministrationData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    placeholder="Any observations or notes about the administration..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Side Effects Observed</label>
                  <Input
                    value={administrationData.sideEffectsObserved?.join(', ') || ''}
                    onChange={(e) => setAdministrationData(prev => ({
                      ...prev,
                      sideEffectsObserved: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    placeholder="Enter any side effects observed (comma-separated)"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMedication(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt('Please enter reason for refusal:');
                      if (reason) {
                        handleRefusal(reason);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Record Refusal
                  </Button>
                </div>
                
                <Button
                  onClick={() => setShowSignature(true)}
                  disabled={
                    isSubmitting || 
                    !administrationData.dosageGiven || 
                    !administrationData.routeUsed ||
                    (safetyCheckResult && !safetyCheckResult.safe && safetyCheckResult.escalationRequired)
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Administer Medication
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Electronic Signature Modal */}
      {showSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Electronic Signature Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    Please provide your electronic signature to confirm medication administration.
                  </AlertDescription>
                </Alert>
                
                <ElectronicSignature
                  onSignature={handleAdministrationSubmit}
                  onCancel={() => setShowSignature(false)}
                  disabled={isSubmitting}
                  medicationName={selectedMedication?.medicationName}
                  residentId={residentId}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};