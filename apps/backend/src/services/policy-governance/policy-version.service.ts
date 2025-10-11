/**
 * @fileoverview Manages policy versioning, comparison, and rollback functionality
 * @module Policy-governance/Policy-version.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Manages policy versioning, comparison, and rollback functionality
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyDraft } from '../../entities/policy-draft.entity';
import { PolicyVersion } from '../../entities/policy-version.entity';
import { User } from '../../entities/user.entity';
import { AuditTrailService } from '../audit/AuditTrailService';

/**
 * Diff operation types
 */
export enum DiffOperation {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
  UNCHANGED = 'unchanged'
}

/**
 * Content diff result
 */
export interface ContentDiff {
  operation: DiffOperation;
  oldValue?: string;
  newValue?: string;
  path: string;
  context?: string;
}

/**
 * Version comparison result
 */
export interface VersionComparison {
  oldVersion: PolicyVersion;
  newVersion: PolicyVersion;
  diffs: ContentDiff[];
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

/**
 * Rollback result
 */
export interface RollbackResult {
  success: boolean;
  restoredVersion: PolicyVersion;
  newDraft: PolicyDraft;
  message: string;
}

/**
 * Policy Version Service
 * 
 * Provides comprehensive version management for policies including:
 * - Version history tracking
 * - Side-by-side comparison with visual diff
 * - One-click rollback to previous versions
 * - Version timeline visualization
 */
@Injectable()
export class PolicyVersionService {
  private readonly logger = new Logger(PolicyVersionService.name);

  constructor(
    @InjectRepository(PolicyVersion)
    private readonly versionRepository: Repository<PolicyVersion>,

    @InjectRepository(PolicyDraft)
    private readonly policyDraftRepository: Repository<PolicyDraft>,

    private readonly auditTrailService: AuditTrailService
  ) {}

  /**
   * Create a new version snapshot when policy is updated
   */
  async createVersionSnapshot(
    policy: PolicyDraft,
    createdBy: User,
    changeDescription?: string
  ): Promise<PolicyVersion> {
    this.logger.log(`Creating version snapshot for policy: ${policy.id}`);

    try {
      const version = this.versionRepository.create({
        policyId: policy.id,
        version: policy.version,
        title: policy.title,
        content: policy.content,
        category: policy.category,
        jurisdiction: policy.jurisdiction,
        status: policy.status,
        tags: policy.tags,
        description: policy.description,
        linkedModules: policy.linkedModules,
        changeDescription: changeDescription || `Updated to version ${policy.version}`,
        createdBy: createdBy.id,
        organizationId: policy.organizationId,
        metadata: {
          wordCount: this.getWordCount(policy.content),
          approvedBy: policy.approvedBy,
          publishedBy: policy.publishedBy,
          effectiveDate: policy.effectiveDate,
          reviewDue: policy.reviewDue
        }
      });

      const savedVersion = await this.versionRepository.save(version);

      await this.auditTrailService.log({
        entityType: 'policy_version',
        entityId: savedVersion.id,
        action: 'created',
        userId: createdBy.id,
        metadata: {
          policyId: policy.id,
          version: policy.version,
          changeDescription
        }
      });

      this.logger.log(`Version snapshot created: ${savedVersion.id}`);
      return savedVersion;

    } catch (error) {
      this.logger.error(`Failed to create version snapshot: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all versions for a policy
   */
  async getPolicyVersions(
    policyId: string,
    organizationId: string
  ): Promise<PolicyVersion[]> {
    this.logger.log(`Getting versions for policy: ${policyId}`);

    try {
      const versions = await this.versionRepository.find({
        where: {
          policyId,
          organizationId
        },
        order: {
          createdAt: 'DESC'
        }
      });

      return versions;

    } catch (error) {
      this.logger.error(`Failed to get policy versions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Compare two versions of a policy
   */
  async compareVersions(
    version1Id: string,
    version2Id: string,
    organizationId: string
  ): Promise<VersionComparison> {
    this.logger.log(`Comparing versions: ${version1Id} vs ${version2Id}`);

    try {
      const [oldVersion, newVersion] = await Promise.all([
        this.versionRepository.findOne({
          where: { id: version1Id, organizationId }
        }),
        this.versionRepository.findOne({
          where: { id: version2Id, organizationId }
        })
      ]);

      if (!oldVersion || !newVersion) {
        throw new NotFoundException('One or both versions not found');
      }

      // Ensure we're comparing the correct order
      const [earlier, later] = oldVersion.createdAt < newVersion.createdAt 
        ? [oldVersion, newVersion]
        : [newVersion, oldVersion];

      // Generate diffs
      const diffs = this.generateContentDiffs(earlier, later);

      // Calculate summary
      const summary = {
        additionsCount: diffs.filter(d => d.operation === DiffOperation.ADDED).length,
        deletionsCount: diffs.filter(d => d.operation === DiffOperation.REMOVED).length,
        modificationsCount: diffs.filter(d => d.operation === DiffOperation.MODIFIED).length,
        unchangedCount: diffs.filter(d => d.operation === DiffOperation.UNCHANGED).length,
        totalChanges: diffs.filter(d => d.operation !== DiffOperation.UNCHANGED).length
      };

      // Calculate metadata
      const timeDifference = later.createdAt.getTime() - earlier.createdAt.getTime();
      const editors = [...new Set([earlier.createdBy, later.createdBy])];
      const categories = [earlier.category, later.category];

      return {
        oldVersion: earlier,
        newVersion: later,
        diffs,
        summary,
        metadata: {
          timeDifference,
          editors,
          categories
        }
      };

    } catch (error) {
      this.logger.error(`Failed to compare versions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Rollback policy to a previous version
   */
  async rollbackToVersion(
    policyId: string,
    versionId: string,
    rollbackBy: User,
    reason: string
  ): Promise<RollbackResult> {
    this.logger.log(`Rolling back policy ${policyId} to version ${versionId}`);

    try {
      // Get the version to restore
      const versionToRestore = await this.versionRepository.findOne({
        where: { 
          id: versionId,
          policyId,
          organizationId: rollbackBy.organizationId
        }
      });

      if (!versionToRestore) {
        throw new NotFoundException('Version not found');
      }

      // Get current policy
      const currentPolicy = await this.policyDraftRepository.findOne({
        where: { 
          id: policyId,
          organizationId: rollbackBy.organizationId
        }
      });

      if (!currentPolicy) {
        throw new NotFoundException('Policy not found');
      }

      // Create snapshot of current state before rollback
      await this.createVersionSnapshot(currentPolicy, rollbackBy, `Pre-rollback snapshot`);

      // Calculate new version number
      const newVersionNumber = this.incrementVersion(currentPolicy.version);

      // Update policy with restored content
      await this.policyDraftRepository.update(policyId, {
        content: versionToRestore.content,
        title: versionToRestore.title,
        description: versionToRestore.description,
        category: versionToRestore.category,
        jurisdiction: versionToRestore.jurisdiction,
        tags: versionToRestore.tags,
        linkedModules: versionToRestore.linkedModules,
        version: newVersionNumber,
        updatedBy: rollbackBy.id,
        updatedAt: new Date()
      });

      // Get updated policy
      const updatedPolicy = await this.policyDraftRepository.findOne({
        where: { id: policyId }
      });

      // Create new version snapshot for rollback
      await this.createVersionSnapshot(
        updatedPolicy!,
        rollbackBy,
        `Rolled back to version ${versionToRestore.version}. Reason: ${reason}`
      );

      // Log audit trail
      await this.auditTrailService.log({
        entityType: 'policy_draft',
        entityId: policyId,
        action: 'rollback',
        userId: rollbackBy.id,
        metadata: {
          restoredVersionId: versionId,
          restoredVersion: versionToRestore.version,
          newVersion: newVersionNumber,
          reason
        }
      });

      this.logger.log(`Policy rolled back successfully: ${policyId}`);

      return {
        success: true,
        restoredVersion: versionToRestore,
        newDraft: updatedPolicy!,
        message: `Successfully rolled back to version ${versionToRestore.version}`
      };

    } catch (error) {
      this.logger.error(`Failed to rollback policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get version timeline for visualization
   */
  async getVersionTimeline(
    policyId: string,
    organizationId: string
  ): Promise<any[]> {
    this.logger.log(`Getting version timeline for policy: ${policyId}`);

    try {
      const versions = await this.getPolicyVersions(policyId, organizationId);

      return versions.map(version => ({
        id: version.id,
        version: version.version,
        title: version.title,
        status: version.status,
        changeDescription: version.changeDescription,
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        wordCount: version.metadata?.wordCount || 0,
        isPublished: version.status === 'published',
        isApproved: version.status === 'approved',
        category: version.category
      }));

    } catch (error) {
      this.logger.error(`Failed to get version timeline: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Private helper: Generate content diffs between two versions
   */
  private generateContentDiffs(
    oldVersion: PolicyVersion,
    newVersion: PolicyVersion
  ): ContentDiff[] {
    constdiffs: ContentDiff[] = [];

    // Compare title
    if (oldVersion.title !== newVersion.title) {
      diffs.push({
        operation: DiffOperation.MODIFIED,
        path: 'title',
        oldValue: oldVersion.title,
        newValue: newVersion.title,
        context: 'Policy title changed'
      });
    }

    // Compare category
    if (oldVersion.category !== newVersion.category) {
      diffs.push({
        operation: DiffOperation.MODIFIED,
        path: 'category',
        oldValue: oldVersion.category,
        newValue: newVersion.category,
        context: 'Policy category changed'
      });
    }

    // Compare jurisdiction
    const oldJurisdictions = new Set(oldVersion.jurisdiction);
    const newJurisdictions = new Set(newVersion.jurisdiction);

    newVersion.jurisdiction.forEach(j => {
      if (!oldJurisdictions.has(j)) {
        diffs.push({
          operation: DiffOperation.ADDED,
          path: 'jurisdiction',
          newValue: j,
          context: 'Jurisdiction added'
        });
      }
    });

    oldVersion.jurisdiction.forEach(j => {
      if (!newJurisdictions.has(j)) {
        diffs.push({
          operation: DiffOperation.REMOVED,
          path: 'jurisdiction',
          oldValue: j,
          context: 'Jurisdiction removed'
        });
      }
    });

    // Compare content (rich text)
    const contentDiffs = this.compareRichTextContent(
      oldVersion.content,
      newVersion.content
    );
    diffs.push(...contentDiffs);

    // Compare tags
    const oldTags = new Set(oldVersion.tags);
    const newTags = new Set(newVersion.tags);

    newVersion.tags.forEach(tag => {
      if (!oldTags.has(tag)) {
        diffs.push({
          operation: DiffOperation.ADDED,
          path: 'tags',
          newValue: tag,
          context: 'Tag added'
        });
      }
    });

    oldVersion.tags.forEach(tag => {
      if (!newTags.has(tag)) {
        diffs.push({
          operation: DiffOperation.REMOVED,
          path: 'tags',
          oldValue: tag,
          context: 'Tag removed'
        });
      }
    });

    return diffs;
  }

  /**
   * Private helper: Compare rich text content
   */
  private compareRichTextContent(oldContent: any, newContent: any): ContentDiff[] {
    constdiffs: ContentDiff[] = [];

    // Extract text from rich content
    const oldText = this.extractTextFromRichContent(oldContent);
    const newText = this.extractTextFromRichContent(newContent);

    // Simple line-by-line comparison
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine !== newLine) {
        if (!oldLine) {
          diffs.push({
            operation: DiffOperation.ADDED,
            path: `content.line.${i}`,
            newValue: newLine,
            context: `Line ${i + 1} added`
          });
        } else if (!newLine) {
          diffs.push({
            operation: DiffOperation.REMOVED,
            path: `content.line.${i}`,
            oldValue: oldLine,
            context: `Line ${i + 1} removed`
          });
        } else {
          diffs.push({
            operation: DiffOperation.MODIFIED,
            path: `content.line.${i}`,
            oldValue: oldLine,
            newValue: newLine,
            context: `Line ${i + 1} modified`
          });
        }
      }
    }

    return diffs;
  }

  /**
   * Private helper: Extract plain text from rich content
   */
  private extractTextFromRichContent(content: any): string {
    if (!content || !content.content) return '';

    let text = '';

    const extractText = (nodes: any[]): void => {
      nodes.forEach(node => {
        if (node.type === 'text' && node.text) {
          text += node.text;
        }
        if (node.type === 'paragraph') {
          if (text && !text.endsWith('\n')) text += '\n';
        }
        if (node.content) {
          extractText(node.content);
        }
      });
    };

    extractText(content.content);
    return text.trim();
  }

  /**
   * Private helper: Get word count from content
   */
  private getWordCount(content: any): number {
    const text = this.extractTextFromRichContent(content);
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Private helper: Increment version number
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
}
