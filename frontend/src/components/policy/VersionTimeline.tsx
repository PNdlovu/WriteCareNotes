/**
 * @fileoverview Version Timeline Component
 * @description Visual timeline showing all policy versions chronologically with status indicators
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-07
 * @lastModified 2025-10-07
 * 
 * @compliance
 * - Accessibility: ARIA labels and keyboard navigation
 * - WCAG 2.1 Level AA compliance
 * - Screen reader compatible
 */

import { useState } from 'react';
import { 
  Clock, 
  User, 
  CheckCircle, 
  FileText, 
  RotateCcw,
  Eye,
  GitBranch,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

/**
 * Policy version interface
 */
interface PolicyVersion {
  id: string;
  version: string;
  title: string;
  status: string;
  category: string;
  createdBy: string;
  createdAt: string;
  changeDescription?: string;
  metadata?: {
    wordCount: number;
    approvedBy?: string;
    publishedBy?: string;
  };
}

interface VersionTimelineProps {
  versions: PolicyVersion[];
  onSelectVersion?: (versionId: string) => void;
  onRollback?: (versionId: string) => void;
  selectedVersionId?: string;
}

/**
 * VersionTimeline Component
 * 
 * Displays a visual timeline of all policy versions with:
 * - Chronological ordering (newest first)
 * - Status badges
 * - Change descriptions
 * - Word count tracking
 * - Interactive selection
 * - Rollback actions
 */
export default function VersionTimeline({
  versions,
  onSelectVersion,
  onRollback,
  selectedVersionId
}: VersionTimelineProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  /**
   * Toggle expanded state for a version
   */
  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  /**
   * Get status badge configuration
   */
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { 
        variant: 'secondary', 
        label: 'Draft',
        icon: FileText
      },
      under_review: { 
        variant: 'primary', 
        label: 'Under Review',
        icon: Eye
      },
      approved: { 
        variant: 'success', 
        label: 'Approved',
        icon: CheckCircle
      },
      published: { 
        variant: 'success', 
        label: 'Published',
        icon: CheckCircle
      },
      archived: { 
        variant: 'secondary', 
        label: 'Archived',
        icon: FileText
      }
    };

    const config = configs[status] || configs.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  /**
   * Format relative time
   */
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 30) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  /**
   * Get timeline connector color based on status
   */
  const getConnectorColor = (status: string): string => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'approved':
        return 'bg-blue-500';
      case 'under_review':
        return 'bg-amber-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No version history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" role="region" aria-label="Policy version timeline">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-violet-600" />
            <span>Version Timeline</span>
            <Badge variant="secondary">{versions.length} versions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div 
              className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"
              aria-hidden="true"
            />

            {/* Timeline items */}
            <div className="space-y-6">
              {versions.map((version, index) => {
                const isExpanded = expandedVersions.has(version.id);
                const isSelected = selectedVersionId === version.id;
                const isLatest = index === 0;

                return (
                  <div 
                    key={version.id}
                    className={`relative pl-12 ${isSelected ? 'bg-violet-50 -ml-4 p-4 rounded-lg' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div 
                      className={`absolute left-2 w-5 h-5 rounded-full border-4 border-white ${getConnectorColor(version.status)}`}
                      aria-hidden="true"
                    />

                    {/* Version card */}
                    <div className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${isSelected ? 'border-violet-300 shadow-sm' : 'border-gray-200'}`}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              v{version.version}
                            </h4>
                            {isLatest && (
                              <Badge variant="primary" className="text-xs">
                                Latest
                              </Badge>
                            )}
                            {getStatusBadge(version.status)}
                          </div>
                          <p className="text-sm text-gray-700 font-medium mb-1">
                            {version.title}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{getRelativeTime(version.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>User {version.createdBy.slice(0, 8)}</span>
                            </div>
                            {version.metadata?.wordCount && (
                              <div className="flex items-center space-x-1">
                                <FileText className="h-3 w-3" />
                                <span>{version.metadata.wordCount} words</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          {onSelectVersion && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectVersion(version.id)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Compare
                            </Button>
                          )}
                          {onRollback && !isLatest && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRollback(version.id)}
                              className="text-xs"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Change description */}
                      {version.changeDescription && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-100">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Changes: </span>
                            {version.changeDescription}
                          </p>
                        </div>
                      )}

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Category:</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {version.category}
                              </Badge>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Created:</span>
                              <span className="text-gray-600 ml-2">
                                {new Date(version.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {version.metadata?.approvedBy && (
                              <div>
                                <span className="font-medium text-gray-700">Approved by:</span>
                                <span className="text-gray-600 ml-2">
                                  {version.metadata.approvedBy.slice(0, 8)}
                                </span>
                              </div>
                            )}
                            {version.metadata?.publishedBy && (
                              <div>
                                <span className="font-medium text-gray-700">Published by:</span>
                                <span className="text-gray-600 ml-2">
                                  {version.metadata.publishedBy.slice(0, 8)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Toggle details button */}
                      <button
                        onClick={() => toggleExpanded(version.id)}
                        className="mt-2 text-xs text-violet-600 hover:text-violet-700 font-medium"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? 'Show less' : 'Show more details'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline legend */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Published/Approved</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-600">Under Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <span className="text-gray-600">Draft</span>
              </div>
            </div>
            <div className="text-gray-500">
              {versions.length} version{versions.length !== 1 ? 's' : ''} tracked
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
