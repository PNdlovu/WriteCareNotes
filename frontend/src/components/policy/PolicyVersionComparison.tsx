/**
 * @fileoverview Policy Version Comparison Component
 * @description Side-by-side comparison of policy versions with visual diff highlighting
 * @version 2.0.0
 * @author WriteCare Notes Development Team
 * @created 2025-10-06
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Clock, 
  User, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import DiffViewer from './DiffViewer';
import VersionTimeline from './VersionTimeline';

interface PolicyVersion {
  id: string;
  version: string;
  title: string;
  status: string;
  category: string;
  jurisdiction: string[];
  content: any;
  createdBy: string;
  createdAt: string;
  changeDescription?: string;
  metadata?: {
    wordCount: number;
    approvedBy?: string;
    publishedBy?: string;
  };
}

interface VersionComparison {
  oldVersion: PolicyVersion;
  newVersion: PolicyVersion;
  diffs: any[];
  summary: {
    additionsCount: number;
    deletionsCount: number;
    modificationsCount: number;
    unchangedCount: number;
    totalChanges: number;
  };
  metadata: {
    timeDifference: number;
    editors: string[];
    categories: string[];
  };
}

interface PolicyVersionComparisonProps {
  policyId: string;
  version1Id?: string;
  version2Id?: string;
  onRollback?: (versionId: string, reason: string) => Promise<void>;
  onClose?: () => void;
}

export default function PolicyVersionComparison({
  policyId,
  version1Id,
  version2Id,
  onRollback,
  onClose
}: PolicyVersionComparisonProps) {
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [selectedVersion1, setSelectedVersion1] = useState<string | null>(version1Id || null);
  const [selectedVersion2, setSelectedVersion2] = useState<string | null>(version2Id || null);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [rollbackReason, setRollbackReason] = useState('');
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('comparison');

  // Fetch all versions on mount
  useEffect(() => {
    fetchVersions();
  }, [policyId]);

  // Auto-compare when both versions are selected
  useEffect(() => {
    if (selectedVersion1 && selectedVersion2) {
      compareVersions();
    }
  }, [selectedVersion1, selectedVersion2]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/policies/${policyId}/versions`);
      const data = await response.json();
      setVersions(data);

      // Auto-select latest two versions if not provided
      if (data.length >= 2 && !version1Id && !version2Id) {
        setSelectedVersion1(data[1].id); // Previous version
        setSelectedVersion2(data[0].id); // Latest version
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = async () => {
    if (!selectedVersion1 || !selectedVersion2) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/policies/versions/compare?v1=${selectedVersion1}&v2=${selectedVersion2}`
      );
      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Failed to compare versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!onRollback) return;

    try {
      await onRollback(versionId, rollbackReason);
      setShowRollbackDialog(false);
      setRollbackReason('');
      // Refresh versions
      await fetchVersions();
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  const formatTimeDifference = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      under_review: { variant: 'default' as const, label: 'Under Review' },
      approved: { variant: 'default' as const, label: 'Approved' },
      published: { variant: 'default' as const, label: 'Published' },
      archived: { variant: 'secondary' as const, label: 'Archived' }
    };

    const { variant, label } = config[status as keyof typeof config] || config.draft;
    
    return (
      <Badge variant={variant} className="ml-2">
        {label}
      </Badge>
    );
  };

  if (loading && !comparison) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading versions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Policy Version Comparison</h2>
          <p className="text-gray-600 mt-1">Compare and restore previous versions</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Comparison
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="metadata">
            <FileText className="h-4 w-4 mr-2" />
            Metadata
          </TabsTrigger>
        </TabsList>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          {/* Version Selectors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Version 1 (Old)</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={selectedVersion1 || ''}
                  onChange={(e) => setSelectedVersion1(e.target.value)}
                >
                  <option value="">Select a version...</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} - {new Date(v.createdAt).toLocaleDateString()} - {v.title}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Version 2 (New)</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={selectedVersion2 || ''}
                  onChange={(e) => setSelectedVersion2(e.target.value)}
                >
                  <option value="">Select a version...</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} - {new Date(v.createdAt).toLocaleDateString()} - {v.title}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Summary */}
          {comparison && (
            <>
              <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-2xl font-bold text-green-600">
                          {comparison.summary.additionsCount}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Additions</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <XCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-2xl font-bold text-red-600">
                          {comparison.summary.deletionsCount}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Deletions</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                        <span className="text-2xl font-bold text-amber-600">
                          {comparison.summary.modificationsCount}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Modified</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <FileText className="h-5 w-5 text-gray-600 mr-2" />
                        <span className="text-2xl font-bold text-gray-600">
                          {comparison.summary.totalChanges}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Total Changes</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        Time difference: {formatTimeDifference(comparison.metadata.timeDifference)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span>{comparison.metadata.editors.length} editor(s)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diff Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle>Changes</CardTitle>
                  <CardDescription>
                    Side-by-side comparison of policy content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DiffViewer
                    oldVersion={comparison.oldVersion}
                    newVersion={comparison.newVersion}
                    diffs={comparison.diffs}
                  />
                </CardContent>
              </Card>

              {/* Rollback Actions */}
              {onRollback && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Want to restore version {comparison.oldVersion.version}?</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRollbackDialog(true)}
                      className="ml-4"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rollback to v{comparison.oldVersion.version}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <VersionTimeline
            versions={versions}
            onSelectVersion={(versionId) => {
              if (!selectedVersion1) {
                setSelectedVersion1(versionId);
              } else {
                setSelectedVersion2(versionId);
              }
              setActiveTab('comparison');
            }}
            onRollback={onRollback ? (versionId) => {
              setShowRollbackDialog(true);
              setSelectedVersion1(versionId);
            } : undefined}
          />
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata">
          {comparison && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Old Version Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Version {comparison.oldVersion.version}</CardTitle>
                  {getStatusBadge(comparison.oldVersion.status)}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Title</p>
                    <p className="text-sm text-gray-900">{comparison.oldVersion.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Category</p>
                    <Badge variant="outline">{comparison.oldVersion.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Word Count</p>
                    <p className="text-sm text-gray-900">
                      {comparison.oldVersion.metadata?.wordCount || 0} words
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(comparison.oldVersion.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {comparison.oldVersion.changeDescription && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Changes</p>
                      <p className="text-sm text-gray-900">
                        {comparison.oldVersion.changeDescription}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* New Version Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Version {comparison.newVersion.version}</CardTitle>
                  {getStatusBadge(comparison.newVersion.status)}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Title</p>
                    <p className="text-sm text-gray-900">{comparison.newVersion.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Category</p>
                    <Badge variant="outline">{comparison.newVersion.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Word Count</p>
                    <p className="text-sm text-gray-900">
                      {comparison.newVersion.metadata?.wordCount || 0} words
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(comparison.newVersion.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {comparison.newVersion.changeDescription && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Changes</p>
                      <p className="text-sm text-gray-900">
                        {comparison.newVersion.changeDescription}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rollback Dialog */}
      {showRollbackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Rollback</CardTitle>
              <CardDescription>
                This will restore the policy to version {comparison?.oldVersion.version}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Reason for rollback (required)
                </label>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  placeholder="e.g., Reverting incorrect changes, restoring previous approved version..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRollbackDialog(false);
                    setRollbackReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedVersion1 && handleRollback(selectedVersion1)}
                  disabled={!rollbackReason.trim()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirm Rollback
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
