/**
 * @fileoverview App Update Notification System - Automatically notify users of new features
 * @module Academy-training/app-update-notifications
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance GDPR (notifications are opt-in/opt-out)
 * 
 * @description Automatically creates training modules and notifications when app updates
 * are released. Keeps users up-to-date with new features based on their role.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { APP_TRAINING_MODULES, getRequiredTrainingForRole } from './app-training-modules';

/**
 * Represents a feature update release
 */
export interface FeatureUpdate {
  version: string;
  releaseDate: Date;
  title: string;
  description: string;
  features: Feature[];
  improvements: string[];
  bugFixes: string[];
  affectedRoles: string[]; // Which roles need to know about this
  isMandatory: boolean; // Must users complete training before using app?
  notificationType: 'email' | 'in_app' | 'both';
}

export interface Feature {
  name: string;
  description: string;
  microservice: string; // Which microservice/module
  impactLevel: 'low' | 'medium' | 'high'; // How significant is the change
  videoUrl?: string;
  documentationUrl?: string;
}

/**
 * User notification preferences
 */
@Entity('app_update_preferences')
export class UpdatePreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: true })
  inAppNotifications: boolean;

  @Column({ default: true })
  featureUpdates: boolean;

  @Column({ default: true })
  securityUpdates: boolean;

  @Column({ default: false })
  betaFeatures: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferredUpdateTime?: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    hour: number; // 0-23
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Track which updates users have seen/completed
 */
@Entity('app_update_completions')
export class UpdateCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  updateVersion: string;

  @Column({ type: 'timestamp' })
  notifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ default: false })
  dismissed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  feedback?: {
    helpful: boolean;
    comments?: string;
    rating?: number;
  };

  @CreateDateColumn()
  createdAt: Date;
}

@Injectable()
export class AppUpdateNotificationsService {
  private readonly logger = new Logger(AppUpdateNotificationsService.name);

  constructor(
    @InjectRepository(UpdatePreference)
    private readonly preferenceRepository: Repository<UpdatePreference>,
    @InjectRepository(UpdateCompletion)
    private readonly completionRepository: Repository<UpdateCompletion>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * When a new version is released, create training module and notify users
   */
  async publishUpdateNotification(update: FeatureUpdate): Promise<void> {
    try {
      this.logger.log(`Publishing update notification for version ${update.version}`);

      // 1. Generate training content from update details
      const trainingModule = this.generateTrainingModule(update);

      // 2. Emit event for training service to create the course
      this.eventEmitter.emit('app_update.training_module.create', {
        module: trainingModule,
        updateVersion: update.version,
      });

      // 3. Get all users who should be notified (based on affected roles)
      const targetUsers = await this.getTargetUsers(update.affectedRoles);

      // 4. Create notification records for each user
      for (const user of targetUsers) {
        await this.createUserNotification(user, update);
      }

      // 5. Emit event for notification service to send emails/push
      this.eventEmitter.emit('app_update.notification.send', {
        updateVersion: update.version,
        affectedRoles: update.affectedRoles,
        isMandatory: update.isMandatory,
      });

      this.logger.log(`Published update ${update.version} to ${targetUsers.length} users`);
    } catch (error) {
      this.logger.error(`Failed to publish update notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate a training module from update details
   */
  private generateTrainingModule(update: FeatureUpdate): any {
    return {
      title: `${update.title} - Version ${update.version}`,
      description: update.description,
      category: 'app_usage',
      trainingType: 'internal_app',
      level: 'beginner',
      duration: this.calculateDuration(update),
      credits: 0,
      targetAudience: update.affectedRoles,
      isMandatory: update.isMandatory,
      learningObjectives: this.extractLearningObjectives(update),
      content: this.generateContentSections(update),
      assessments: update.isMandatory ? this.generateQuickQuiz(update) : [],
      tags: ['update', 'features', update.version, ...update.affectedRoles],
      isActive: true,
      metadata: {
        releaseDate: update.releaseDate,
        version: update.version,
        autoGenerated: true,
        updateType: 'feature_release',
      },
    };
  }

  /**
   * Calculate training duration based on update complexity
   */
  private calculateDuration(update: FeatureUpdate): number {
    let duration = 5; // Base 5 minutes

    // Add time per feature based on impact
    update.features.forEach(feature => {
      switch (feature.impactLevel) {
        case 'high':
          duration += 10;
          break;
        case 'medium':
          duration += 5;
          break;
        case 'low':
          duration += 2;
          break;
      }
    });

    // Add time for improvements and fixes
    duration += Math.ceil(update.improvements.length * 1);
    duration += Math.ceil(update.bugFixes.length * 0.5);

    return Math.min(duration, 30); // Cap at 30 minutes
  }

  /**
   * Extract learning objectives from features
   */
  private extractLearningObjectives(update: FeatureUpdate): string[] {
    const objectives: string[] = [];

    update.features.forEach(feature => {
      objectives.push(`Understand how to use the new ${feature.name} feature`);
    });

    if (update.improvements.length > 0) {
      objectives.push('Learn about improvements to existing features');
    }

    if (update.bugFixes.length > 0) {
      objectives.push('Be aware of bug fixes and how they affect your workflow');
    }

    return objectives;
  }

  /**
   * Generate content sections from update details
   */
  private generateContentSections(update: FeatureUpdate): any[] {
    const sections: any[] = [];
    let order = 1;

    // Overview section
    sections.push({
      id: `update-${update.version}-overview`,
      type: 'text',
      title: "What's New",
      description: 'Overview of updates in this release',
      content: {
        markdown: this.generateOverviewMarkdown(update),
      },
      duration: 5,
      order: order++,
      isRequired: true,
    });

    // Feature sections
    update.features.forEach((feature, index) => {
      if (feature.videoUrl) {
        sections.push({
          id: `update-${update.version}-feature-${index}`,
          type: 'video',
          title: feature.name,
          description: feature.description,
          content: { videoUrl: feature.videoUrl },
          duration: 5,
          order: order++,
          isRequired: feature.impactLevel === 'high',
        });
      } else {
        sections.push({
          id: `update-${update.version}-feature-${index}`,
          type: 'interactive',
          title: feature.name,
          description: feature.description,
          content: {
            steps: this.generateFeatureSteps(feature),
          },
          duration: 3,
          order: order++,
          isRequired: feature.impactLevel === 'high',
        });
      }
    });

    return sections;
  }

  /**
   * Generate overview markdown
   */
  private generateOverviewMarkdown(update: FeatureUpdate): string {
    let markdown = `# ${update.title}\n\n`;
    markdown += `**Version:** ${update.version}\n`;
    markdown += `**Released:** ${update.releaseDate.toLocaleDateString()}\n\n`;
    markdown += `${update.description}\n\n`;

    if (update.features.length > 0) {
      markdown += `## New Features\n\n`;
      update.features.forEach(feature => {
        markdown += `### ${feature.name}\n`;
        markdown += `${feature.description}\n\n`;
        markdown += `- **Module:** ${feature.microservice}\n`;
        markdown += `- **Impact:** ${feature.impactLevel}\n\n`;
      });
    }

    if (update.improvements.length > 0) {
      markdown += `## Improvements\n\n`;
      update.improvements.forEach(improvement => {
        markdown += `- ${improvement}\n`;
      });
      markdown += `\n`;
    }

    if (update.bugFixes.length > 0) {
      markdown += `## Bug Fixes\n\n`;
      update.bugFixes.forEach(fix => {
        markdown += `- ${fix}\n`;
      });
      markdown += `\n`;
    }

    markdown += `## Need Help?\n\n`;
    markdown += `Contact your manager or email support@writecarenotes.com\n`;

    return markdown;
  }

  /**
   * Generate step-by-step instructions for a feature
   */
  private generateFeatureSteps(feature: Feature): string[] {
    // This would be customized based on the feature
    // For now, generic steps
    return [
      `Navigate to the ${feature.microservice} section`,
      `Look for the new ${feature.name} button/option`,
      `Follow the on-screen prompts`,
      `Review documentation if needed`,
    ];
  }

  /**
   * Generate a quick quiz for mandatory updates
   */
  private generateQuickQuiz(update: FeatureUpdate): any[] {
    if (!update.isMandatory) return [];

    const questions = update.features.map((feature, index) => ({
      id: `q${index + 1}`,
      type: 'multiple_choice',
      question: `What is the main purpose of the new ${feature.name} feature?`,
      options: [
        feature.description,
        'To make the app slower',
        'To confuse users',
        'No purpose',
      ],
      correctAnswer: feature.description,
      explanation: `The ${feature.name} feature ${feature.description.toLowerCase()}.`,
      points: 10,
      order: index + 1,
    }));

    return [
      {
        id: `update-${update.version}-quiz`,
        title: 'Update Knowledge Check',
        description: 'Quick quiz to confirm understanding of new features',
        type: 'quiz',
        questions,
        passingScore: 70,
        timeLimit: 5,
        attemptsAllowed: 3,
        isRequired: true,
        order: 1,
      },
    ];
  }

  /**
   * Get users who should receive this update notification
   */
  private async getTargetUsers(affectedRoles: string[]): Promise<any[]> {
    // This would query your user database
    // For now, return empty array - implement based on your user system
    return [];
  }

  /**
   * Create a notification record for a user
   */
  private async createUserNotification(user: any, update: FeatureUpdate): Promise<void> {
    try {
      // Check user preferences
      let preference = await this.preferenceRepository.findOne({
        where: { userId: user.id },
      });

      if (!preference) {
        // Create default preferences
        preference = this.preferenceRepository.create({
          userId: user.id,
          emailNotifications: true,
          inAppNotifications: true,
          featureUpdates: true,
          securityUpdates: true,
          betaFeatures: false,
        });
        await this.preferenceRepository.save(preference);
      }

      // Only notify if user has opted in
      if (!preference.featureUpdates) {
        this.logger.log(`User ${user.id} has opted out of feature updates`);
        return;
      }

      // Create completion record
      const completion = this.completionRepository.create({
        userId: user.id,
        updateVersion: update.version,
        notifiedAt: new Date(),
        dismissed: false,
      });

      await this.completionRepository.save(completion);

      this.logger.log(`Created notification for user ${user.id}, update ${update.version}`);
    } catch (error) {
      this.logger.error(`Failed to create user notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark an update as viewed by a user
   */
  async markUpdateViewed(userId: string, updateVersion: string): Promise<void> {
    const completion = await this.completionRepository.findOne({
      where: { userId, updateVersion },
    });

    if (completion && !completion.viewedAt) {
      completion.viewedAt = new Date();
      await this.completionRepository.save(completion);

      this.eventEmitter.emit('app_update.viewed', {
        userId,
        updateVersion,
        viewedAt: completion.viewedAt,
      });
    }
  }

  /**
   * Mark an update as completed (training done)
   */
  async markUpdateCompleted(userId: string, updateVersion: string): Promise<void> {
    const completion = await this.completionRepository.findOne({
      where: { userId, updateVersion },
    });

    if (completion && !completion.completedAt) {
      completion.completedAt = new Date();
      await this.completionRepository.save(completion);

      this.eventEmitter.emit('app_update.completed', {
        userId,
        updateVersion,
        completedAt: completion.completedAt,
      });
    }
  }

  /**
   * Get pending updates for a user
   */
  async getPendingUpdates(userId: string): Promise<UpdateCompletion[]> {
    return this.completionRepository.find({
      where: {
        userId,
        completedAt: null,
        dismissed: false,
      },
      order: {
        notifiedAt: 'DESC',
      },
    });
  }

  /**
   * Get user's update notification preferences
   */
  async getUserPreferences(userId: string): Promise<UpdatePreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      // Create default preferences
      preference = this.preferenceRepository.create({
        userId,
        emailNotifications: true,
        inAppNotifications: true,
        featureUpdates: true,
        securityUpdates: true,
        betaFeatures: false,
      });
      await this.preferenceRepository.save(preference);
    }

    return preference;
  }

  /**
   * Update user's notification preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<UpdatePreference>,
  ): Promise<UpdatePreference> {
    let preference = await this.getUserPreferences(userId);

    Object.assign(preference, updates);
    return this.preferenceRepository.save(preference);
  }

  /**
   * Record user feedback on an update
   */
  async recordFeedback(
    userId: string,
    updateVersion: string,
    feedback: { helpful: boolean; comments?: string; rating?: number },
  ): Promise<void> {
    const completion = await this.completionRepository.findOne({
      where: { userId, updateVersion },
    });

    if (completion) {
      completion.feedback = feedback;
      await this.completionRepository.save(completion);

      this.eventEmitter.emit('app_update.feedback', {
        userId,
        updateVersion,
        feedback,
      });
    }
  }
}

/**
 * Example usage - how to publish an update notification
 */
export const EXAMPLE_UPDATE: FeatureUpdate = {
  version: '1.1.0',
  releaseDate: new Date('2025-01-15'),
  title: 'Enhanced Care Planning & Family Portal',
  description: 'Major improvements to care planning workflow and new family communication features.',
  features: [
    {
      name: 'Smart Care Plan Builder',
      description: 'AI-assisted care plan creation with evidence-based templates',
      microservice: 'Care Planning',
      impactLevel: 'high',
      videoUrl: '/training/videos/v1.1-care-plan-builder.mp4',
      documentationUrl: '/docs/care-planning/smart-builder',
    },
    {
      name: 'Family Video Calls',
      description: 'Built-in video calling for families directly in the portal',
      microservice: 'Family Portal',
      impactLevel: 'medium',
      videoUrl: '/training/videos/v1.1-video-calls.mp4',
    },
    {
      name: 'Medication Barcode Scanning',
      description: 'Scan medication barcodes for faster, safer administration',
      microservice: 'Medication Management',
      impactLevel: 'high',
      videoUrl: '/training/videos/v1.1-barcode-scanning.mp4',
    },
  ],
  improvements: [
    'Faster loading times for resident profiles (50% improvement)',
    'Better offline support for mobile app',
    'Improved search functionality across all modules',
    'Enhanced accessibility features (WCAG 2.1 AA compliant)',
  ],
  bugFixes: [
    'Fixed issue with handover notes not syncing',
    'Resolved medication time display bug',
    'Fixed family portal photo upload on iOS',
  ],
  affectedRoles: ['nurse', 'care_manager', 'care_assistant', 'family_member'],
  isMandatory: false,
  notificationType: 'both',
};
