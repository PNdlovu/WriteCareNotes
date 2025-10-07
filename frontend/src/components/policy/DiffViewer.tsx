/**
 * @fileoverview Diff Viewer Component
 * @description Visual side-by-side comparison of policy content with syntax highlighting
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-07
 * @lastModified 2025-10-07
 * 
 * @compliance
 * - Accessibility: ARIA labels for screen readers
 * - WCAG 2.1 Level AA color contrast
 * - Keyboard navigation support
 */

import { useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Minus } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

/**
 * Diff operation types
 */
enum DiffOperation {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
  UNCHANGED = 'unchanged'
}

/**
 * Content diff interface
 */
interface ContentDiff {
  operation: DiffOperation;
  oldValue?: string;
  newValue?: string;
  path: string;
  context?: string;
}

/**
 * Policy version interface
 */
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
  metadata?: {
    wordCount: number;
  };
}

interface DiffViewerProps {
  oldVersion: PolicyVersion;
  newVersion: PolicyVersion;
  diffs: ContentDiff[];
  viewMode?: 'side-by-side' | 'unified';
}

/**
 * DiffViewer Component
 * 
 * Displays policy content differences with visual highlighting:
 * - Green: Added content
 * - Red: Removed content
 * - Amber: Modified content
 * - Gray: Unchanged content
 */
export default function DiffViewer({
  oldVersion,
  newVersion,
  diffs,
  viewMode = 'side-by-side'
}: DiffViewerProps) {
  
  /**
   * Extract plain text from rich content for display
   */
  const extractText = (content: any): string => {
    if (!content || !content.content) return '';

    let text = '';
    const extract = (nodes: any[]): void => {
      nodes.forEach(node => {
        if (node.type === 'text' && node.text) {
          text += node.text;
        }
        if (node.type === 'paragraph') {
          if (text && !text.endsWith('\n')) text += '\n';
        }
        if (node.type === 'heading' && node.content) {
          extract(node.content);
          text += '\n';
        }
        if (node.content) {
          extract(node.content);
        }
      });
    };

    extract(content.content);
    return text.trim();
  };

  /**
   * Group diffs by type for statistics
   */
  const diffStats = useMemo(() => {
    const stats = {
      additions: diffs.filter(d => d.operation === DiffOperation.ADDED).length,
      deletions: diffs.filter(d => d.operation === DiffOperation.REMOVED).length,
      modifications: diffs.filter(d => d.operation === DiffOperation.MODIFIED).length,
      unchanged: diffs.filter(d => d.operation === DiffOperation.UNCHANGED).length
    };
    return stats;
  }, [diffs]);

  /**
   * Get icon for diff operation
   */
  const getDiffIcon = (operation: DiffOperation) => {
    switch (operation) {
      case DiffOperation.ADDED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case DiffOperation.REMOVED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case DiffOperation.MODIFIED:
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  /**
   * Get background color class for diff operation
   */
  const getDiffBgClass = (operation: DiffOperation): string => {
    switch (operation) {
      case DiffOperation.ADDED:
        return 'bg-green-50 border-l-4 border-green-500';
      case DiffOperation.REMOVED:
        return 'bg-red-50 border-l-4 border-red-500';
      case DiffOperation.MODIFIED:
        return 'bg-amber-50 border-l-4 border-amber-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-300';
    }
  };

  /**
   * Get text color class for diff operation
   */
  const getDiffTextClass = (operation: DiffOperation): string => {
    switch (operation) {
      case DiffOperation.ADDED:
        return 'text-green-900';
      case DiffOperation.REMOVED:
        return 'text-red-900 line-through';
      case DiffOperation.MODIFIED:
        return 'text-amber-900';
      default:
        return 'text-gray-700';
    }
  };

  /**
   * Render metadata differences
   */
  const renderMetadataDiffs = () => {
    const metadataDiffs = diffs.filter(d => 
      ['title', 'category', 'jurisdiction', 'tags'].includes(d.path)
    );

    if (metadataDiffs.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Metadata Changes</h3>
        <div className="space-y-2">
          {metadataDiffs.map((diff, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${getDiffBgClass(diff.operation)}`}
            >
              <div className="flex items-start space-x-2">
                {getDiffIcon(diff.operation)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {diff.path}
                    </Badge>
                    <span className="text-xs text-gray-600">{diff.context}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {diff.oldValue && (
                      <div>
                        <span className="font-medium text-gray-600">Old: </span>
                        <span className="text-red-700 line-through">{diff.oldValue}</span>
                      </div>
                    )}
                    {diff.newValue && (
                      <div>
                        <span className="font-medium text-gray-600">New: </span>
                        <span className="text-green-700 font-medium">{diff.newValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render content differences
   */
  const renderContentDiffs = () => {
    const contentDiffs = diffs.filter(d => d.path.startsWith('content.line.'));

    if (contentDiffs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Minus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No content changes detected</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {contentDiffs.map((diff, index) => {
          const lineNumber = diff.path.split('.').pop();
          
          return (
            <div
              key={index}
              className={`p-2 rounded ${getDiffBgClass(diff.operation)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-12 text-right">
                  <span className="text-xs font-mono text-gray-500">{lineNumber}</span>
                </div>
                {getDiffIcon(diff.operation)}
                <div className="flex-1 font-mono text-sm">
                  {diff.operation === DiffOperation.MODIFIED ? (
                    <div className="space-y-1">
                      <div className="text-red-700 line-through">{diff.oldValue}</div>
                      <div className="text-green-700 font-medium">{diff.newValue}</div>
                    </div>
                  ) : diff.operation === DiffOperation.REMOVED ? (
                    <div className={getDiffTextClass(diff.operation)}>{diff.oldValue}</div>
                  ) : (
                    <div className={getDiffTextClass(diff.operation)}>{diff.newValue}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Render side-by-side view
   */
  const renderSideBySide = () => {
    const oldText = extractText(oldVersion.content);
    const newText = extractText(newVersion.content);
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Old Version */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 pb-3 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">
                  Version {oldVersion.version}
                </h4>
                <Badge variant="secondary">
                  {oldVersion.metadata?.wordCount || 0} words
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(oldVersion.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="h-96 overflow-y-auto">
              <div className="space-y-1 font-mono text-sm">
                {oldLines.map((line, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 hover:bg-gray-50 px-2 py-1 rounded"
                  >
                    <span className="text-xs text-gray-400 w-8 flex-shrink-0 text-right">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{line || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Version */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 pb-3 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">
                  Version {newVersion.version}
                </h4>
                <Badge variant="secondary">
                  {newVersion.metadata?.wordCount || 0} words
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(newVersion.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="h-96 overflow-y-auto">
              <div className="space-y-1 font-mono text-sm">
                {newLines.map((line, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 hover:bg-gray-50 px-2 py-1 rounded"
                  >
                    <span className="text-xs text-gray-400 w-8 flex-shrink-0 text-right">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{line || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Render unified view with highlighted changes
   */
  const renderUnified = () => {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 pb-4 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Unified Diff View</h4>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{diffStats.additions} added</span>
                </div>
                <div className="flex items-center space-x-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>{diffStats.deletions} removed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>{diffStats.modifications} modified</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-96 overflow-y-auto">
            {renderContentDiffs()}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" role="region" aria-label="Policy version differences">
      {/* Diff Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{diffStats.additions}</p>
                <p className="text-xs text-green-600">Additions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-700">{diffStats.deletions}</p>
                <p className="text-xs text-red-600">Deletions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{diffStats.modifications}</p>
                <p className="text-xs text-amber-600">Modified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Minus className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-700">
                  {diffStats.additions + diffStats.deletions + diffStats.modifications}
                </p>
                <p className="text-xs text-gray-600">Total Changes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata Differences */}
      {renderMetadataDiffs()}

      {/* Content Differences */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Changes</h3>
        {viewMode === 'side-by-side' ? renderSideBySide() : renderUnified()}
      </div>
    </div>
  );
}
