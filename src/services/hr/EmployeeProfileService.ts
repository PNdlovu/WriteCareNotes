import { Repository } from 'typeorm';
import { EventEmitter2 } from 'eventemitter2';
import AppDataSource from '../../config/database';
import { EmployeeProfile, ProfileStatus, ProfileType } from '../../entities/hr/EmployeeProfile';
import { Employee } from '../../entities/hr/Employee';
import { NotificationService } from '../notifications/NotificationService';
import { AuditTrailService } from '../audit/AuditTrailService';
import { HealthcareEncryption } from '@/utils/healthcare-encryption';

export interface EmployeeProfileSearchCriteria {
  status?: ProfileStatus;
  profileType?: ProfileType;
  department?: string;
  location?: string;
  managerId?: string;
  employmentType?: string;
  skills?: string[];
  certifications?: string[];
  performanceRating?: number;
  yearsOfService?: {
    min?: number;
    max?: number;
  };
}

export interface ProfileSummary {
  totalProfiles: number;
  activeProfiles: number;
  pendingApproval: number;
  suspendedProfiles: number;
  archivedProfiles: number;
  averagePerformanceRating: number;
  profilesNeedingReview: number;
  developmentPlansActive: number;
  skillsGapAnalysis: {
    skill: string;
    required: number;
    available: number;
    gap: number;
  }[];
}

export interface OnboardingData {
  employeeId: string;
  personalInformation: any;
  contactDetails: any;
  professionalDetails: any;
  compensationDetails: any;
  initialSkills: any;
  developmentPlans: any[];
  onboardingChecklist: {
    item: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: Date;
  }[];
}

export interface ProfileUpdateData {
  personalInformation?: any;
  contactDetails?: any;
  professionalDetails?: any;
  compensationDetails?: any;
  skillsAndCompetencies?: any;
  developmentPlans?: any[];
  performanceMetrics?: any;
  notes?: string;
  metadata?: Record<string, any>;
}

export class EmployeeProfileService {
  private profileRepository: Repository<EmployeeProfile>;
  private employeeRepository: Repository<Employee>;
  private notificationService: NotificationService;
  private auditService: AuditTrailService;

  constructor() {
    this.profileRepository = AppDataSource.getRepository(EmployeeProfile);
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  // Profile Management
  async createProfile(profileData: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { id: profileData.employeeId }
    });
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if profile already exists
    const existingProfile = await this.profileRepository.findOne({
      where: { employeeId: profileData.employeeId }
    });
    if (existingProfile) {
      throw new Error('Profile already exists for this employee');
    }

    // Encrypt sensitive data
    if (profileData.personalInformation) {
      profileData.personalInformation = HealthcareEncryption.encrypt(profileData.personalInformation);
    }
    if (profileData.contactDetails) {
      profileData.contactDetails = HealthcareEncryption.encrypt(profileData.contactDetails);
    }

    const profile = this.profileRepository.create(profileData);
    const savedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: savedProfile.id,
      action: 'CREATE',
      details: { employeeId: savedProfile.employeeId, profileType: savedProfile.profileType },
      userId: 'system'
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Employee Profile Created',
      type: 'profile_created',
      recipients: ['hr_team', 'line_managers'],
      data: {
        employeeName: savedProfile.getFullName(),
        profileType: savedProfile.profileType,
        department: savedProfile.professionalDetails.department
      }
    });

    return savedProfile;
  }

  async getProfileById(profileId: string): Promise<EmployeeProfile | null> {
    return await this.profileRepository.findOne({
      where: { id: profileId },
      relations: ['employee']
    });
  }

  async getProfileByEmployeeId(employeeId: string): Promise<EmployeeProfile | null> {
    return await this.profileRepository.findOne({
      where: { employeeId },
      relations: ['employee']
    });
  }

  async getAllProfiles(): Promise<EmployeeProfile[]> {
    return await this.profileRepository.find({
      relations: ['employee'],
      order: { createdAt: 'DESC' }
    });
  }

  async searchProfiles(criteria: EmployeeProfileSearchCriteria): Promise<EmployeeProfile[]> {
    let queryBuilder = this.profileRepository.createQueryBuilder('profile')
      .leftJoinAndSelect('profile.employee', 'employee');

    if (criteria.status) {
      queryBuilder = queryBuilder.andWhere('profile.status = :status', { status: criteria.status });
    }

    if (criteria.profileType) {
      queryBuilder = queryBuilder.andWhere('profile.profileType = :profileType', { profileType: criteria.profileType });
    }

    if (criteria.department) {
      queryBuilder = queryBuilder.andWhere('profile.professionalDetails->>\'department\' = :department', { department: criteria.department });
    }

    if (criteria.location) {
      queryBuilder = queryBuilder.andWhere('profile.professionalDetails->>\'location\' = :location', { location: criteria.location });
    }

    if (criteria.managerId) {
      queryBuilder = queryBuilder.andWhere('profile.professionalDetails->>\'managerId\' = :managerId', { managerId: criteria.managerId });
    }

    if (criteria.employmentType) {
      queryBuilder = queryBuilder.andWhere('profile.professionalDetails->>\'employmentType\' = :employmentType', { employmentType: criteria.employmentType });
    }

    if (criteria.performanceRating) {
      queryBuilder = queryBuilder.andWhere('profile.performanceMetrics->>\'overallRating\' >= :rating', { rating: criteria.performanceRating });
    }

    return await queryBuilder.getMany();
  }

  async updateProfile(profileId: string, updateData: ProfileUpdateData): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Encrypt sensitive data if provided
    if (updateData.personalInformation) {
      updateData.personalInformation = HealthcareEncryption.encrypt(updateData.personalInformation);
    }
    if (updateData.contactDetails) {
      updateData.contactDetails = HealthcareEncryption.encrypt(updateData.contactDetails);
    }

    Object.assign(profile, updateData);
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'UPDATE',
      details: updateData,
      userId: 'system'
    });

    return updatedProfile;
  }

  async deleteProfile(profileId: string): Promise<void> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    await this.profileRepository.remove(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'DELETE',
      details: { employeeId: profile.employeeId },
      userId: 'system'
    });
  }

  // Onboarding
  async onBoardEmployee(onboardingData: OnboardingData): Promise<EmployeeProfile> {
    const profileData: Partial<EmployeeProfile> = {
      employeeId: onboardingData.employeeId,
      status: ProfileStatus.PENDING_APPROVAL,
      profileType: ProfileType.BASIC,
      personalInformation: onboardingData.personalInformation,
      contactDetails: onboardingData.contactDetails,
      professionalDetails: onboardingData.professionalDetails,
      compensationDetails: onboardingData.compensationDetails,
      skillsAndCompetencies: onboardingData.initialSkills,
      developmentPlans: onboardingData.developmentPlans
    };

    const profile = await this.createProfile(profileData);

    // Process onboarding checklist
    for (const item of onboardingData.onboardingChecklist) {
      if (item.completed) {
        // Log completion
        await this.auditService.logEvent({
          resource: 'EmployeeProfile',
          entityType: 'EmployeeProfile',
          entityId: profile.id,
          action: 'ONBOARDING_ITEM_COMPLETED',
          details: { item: item.item, completedBy: item.completedBy, completedAt: item.completedAt },
          userId: 'system'
        });
      }
    }

    // Send onboarding notification
    await this.notificationService.sendNotification({
      message: 'Employee Onboarding Initiated',
      type: 'employee_onboarding',
      recipients: ['hr_team', 'line_managers', onboardingData.employeeId],
      data: {
        employeeName: profile.getFullName(),
        department: profile.professionalDetails.department,
        checklistItems: onboardingData.onboardingChecklist.length,
        completedItems: onboardingData.onboardingChecklist.filter(item => item.completed).length
      }
    });

    return profile;
  }

  async completeOnboarding(profileId: string, completedBy: string): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.status = ProfileStatus.ACTIVE;
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'ONBOARDING_COMPLETED',
      details: { completedBy },
      userId: 'system'
    });

    // Send completion notification
    await this.notificationService.sendNotification({
      message: 'Employee Onboarding Completed',
      type: 'onboarding_completed',
      recipients: ['hr_team', 'line_managers', profile.employeeId],
      data: {
        employeeName: profile.getFullName(),
        department: profile.professionalDetails.department
      }
    });

    return updatedProfile;
  }

  // Profile Analytics
  async getProfileSummary(): Promise<ProfileSummary> {
    const profiles = await this.getAllProfiles();
    const activeProfiles = profiles.filter(p => p.status === ProfileStatus.ACTIVE);
    const pendingApproval = profiles.filter(p => p.status === ProfileStatus.PENDING_APPROVAL);
    const suspendedProfiles = profiles.filter(p => p.status === ProfileStatus.SUSPENDED);
    const archivedProfiles = profiles.filter(p => p.status === ProfileStatus.ARCHIVED);

    // Calculate average performance rating
    const profilesWithRating = activeProfiles.filter(p => p.performanceMetrics?.overallRating);
    const averagePerformanceRating = profilesWithRating.length > 0
      ? profilesWithRating.reduce((sum, p) => sum + (p.performanceMetrics?.overallRating || 0), 0) / profilesWithRating.length
      : 0;

    // Count profiles needing review
    const profilesNeedingReview = activeProfiles.filter(p => p.isPerformanceReviewDue()).length;

    // Count active development plans
    const developmentPlansActive = activeProfiles.reduce((sum, p) => sum + p.getActiveDevelopmentPlans().length, 0);

    // Skills gap analysis
    const skillsGapAnalysis = this.calculateSkillsGap(activeProfiles);

    return {
      totalProfiles: profiles.length,
      activeProfiles: activeProfiles.length,
      pendingApproval: pendingApproval.length,
      suspendedProfiles: suspendedProfiles.length,
      archivedProfiles: archivedProfiles.length,
      averagePerformanceRating,
      profilesNeedingReview,
      developmentPlansActive,
      skillsGapAnalysis
    };
  }

  private calculateSkillsGap(profiles: EmployeeProfile[]): any[] {
    // This is a simplified skills gap analysis
    // In a real implementation, this would be more sophisticated
    const allSkills = new Set<string>();
    const skillCounts = new Map<string, number>();

    profiles.forEach(profile => {
      const technicalSkills = profile.skillsAndCompetencies.technicalSkills || [];
      technicalSkills.forEach(skill => {
        allSkills.add(skill.skill);
        skillCounts.set(skill.skill, (skillCounts.get(skill.skill) || 0) + 1);
      });
    });

    const totalProfiles = profiles.length;
    return Array.from(allSkills).map(skill => ({
      skill,
      required: Math.ceil(totalProfiles * 0.8), // Assume 80% of profiles need this skill
      available: skillCounts.get(skill) || 0,
      gap: Math.max(0, Math.ceil(totalProfiles * 0.8) - (skillCounts.get(skill) || 0))
    }));
  }

  // Development Plans
  async addDevelopmentPlan(profileId: string, planData: any): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const newPlan = {
      id: crypto.randomUUID(),
      ...planData,
      status: 'planned',
      progress: 0
    };

    profile.developmentPlans.push(newPlan);
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'DEVELOPMENT_PLAN_ADDED',
      details: { planId: newPlan.id, title: newPlan.title },
      userId: 'system'
    });

    return updatedProfile;
  }

  async updateDevelopmentPlan(profileId: string, planId: string, updateData: any): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const planIndex = profile.developmentPlans.findIndex(plan => plan.id === planId);
    if (planIndex === -1) {
      throw new Error('Development plan not found');
    }

    profile.developmentPlans[planIndex] = { ...profile.developmentPlans[planIndex], ...updateData };
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'DEVELOPMENT_PLAN_UPDATED',
      details: { planId, updateData },
      userId: 'system'
    });

    return updatedProfile;
  }

  async completeDevelopmentPlan(profileId: string, planId: string, completionNotes?: string): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const planIndex = profile.developmentPlans.findIndex(plan => plan.id === planId);
    if (planIndex === -1) {
      throw new Error('Development plan not found');
    }

    profile.developmentPlans[planIndex].status = 'completed';
    profile.developmentPlans[planIndex].progress = 100;
    if (completionNotes) {
      profile.developmentPlans[planIndex].notes = completionNotes;
    }

    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'DEVELOPMENT_PLAN_COMPLETED',
      details: { planId, completionNotes },
      userId: 'system'
    });

    return updatedProfile;
  }

  // Performance Management
  async updatePerformanceMetrics(profileId: string, metricsData: any): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.performanceMetrics = { ...profile.performanceMetrics, ...metricsData };
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'PERFORMANCE_METRICS_UPDATED',
      details: metricsData,
      userId: 'system'
    });

    return updatedProfile;
  }

  async addPerformanceGoal(profileId: string, goalData: any): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    if (!profile.performanceMetrics) {
      profile.performanceMetrics = {
        overallRating: 0,
        lastReviewDate: new Date(),
        nextReviewDate: new Date(),
        goals: [],
        achievements: [],
        areasForImprovement: [],
        strengths: [],
        developmentNeeds: []
      };
    }

    const newGoal = {
      id: crypto.randomUUID(),
      ...goalData,
      status: 'not_started',
      progress: 0
    };

    profile.performanceMetrics.goals.push(newGoal);
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'PERFORMANCE_GOAL_ADDED',
      details: { goalId: newGoal.id, description: newGoal.description },
      userId: 'system'
    });

    return updatedProfile;
  }

  async updatePerformanceGoal(profileId: string, goalId: string, updateData: any): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile || !profile.performanceMetrics) {
      throw new Error('Profile or performance metrics not found');
    }

    const goalIndex = profile.performanceMetrics.goals.findIndex(goal => goal.id === goalId);
    if (goalIndex === -1) {
      throw new Error('Performance goal not found');
    }

    profile.performanceMetrics.goals[goalIndex] = { ...profile.performanceMetrics.goals[goalIndex], ...updateData };
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'PERFORMANCE_GOAL_UPDATED',
      details: { goalId, updateData },
      userId: 'system'
    });

    return updatedProfile;
  }

  // Skills Management
  async updateSkills(profileId: string, skillsData: any): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.skillsAndCompetencies = { ...profile.skillsAndCompetencies, ...skillsData };
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'SKILLS_UPDATED',
      details: skillsData,
      userId: 'system'
    });

    return updatedProfile;
  }

  async addSkill(profileId: string, skillData: any): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const newSkill = {
      id: crypto.randomUUID(),
      ...skillData,
      lastUsed: new Date()
    };

    if (skillData.category === 'technical') {
      profile.skillsAndCompetencies.technicalSkills.push(newSkill);
    } else {
      profile.skillsAndCompetencies.softSkills.push(newSkill);
    }

    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'SKILL_ADDED',
      details: { skillId: newSkill.id, skill: newSkill.skill },
      userId: 'system'
    });

    return updatedProfile;
  }

  // Profile Status Management
  async activateProfile(profileId: string): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.status = ProfileStatus.ACTIVE;
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'PROFILE_ACTIVATED',
      details: { previousStatus: profile.status },
      userId: 'system'
    });

    return updatedProfile;
  }

  async suspendProfile(profileId: string, reason: string): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.status = ProfileStatus.SUSPENDED;
    profile.notes = reason;
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'PROFILE_SUSPENDED',
      details: { reason },
      userId: 'system'
    });

    return updatedProfile;
  }

  async archiveProfile(profileId: string): Promise<EmployeeProfile> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.status = ProfileStatus.ARCHIVED;
    const updatedProfile = await this.profileRepository.save(profile);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'EmployeeProfile',
      entityType: 'EmployeeProfile',
      entityId: profileId,
      action: 'PROFILE_ARCHIVED',
      details: { previousStatus: profile.status },
      userId: 'system'
    });

    return updatedProfile;
  }

  // Reporting
  async getProfilesByDepartment(department: string): Promise<EmployeeProfile[]> {
    return await this.searchProfiles({ department });
  }

  async getProfilesNeedingReview(): Promise<EmployeeProfile[]> {
    const profiles = await this.getAllProfiles();
    return profiles.filter(profile => profile.isPerformanceReviewDue());
  }

  async getProfilesWithActiveDevelopmentPlans(): Promise<EmployeeProfile[]> {
    const profiles = await this.getAllProfiles();
    return profiles.filter(profile => profile.getActiveDevelopmentPlans().length > 0);
  }

  async getProfilesByPerformanceRating(minRating: number): Promise<EmployeeProfile[]> {
    const profiles = await this.getAllProfiles();
    return profiles.filter(profile => 
      profile.performanceMetrics && profile.performanceMetrics.overallRating >= minRating
    );
  }

  // Bulk Operations
  async bulkUpdateProfiles(profileIds: string[], updateData: Partial<EmployeeProfile>): Promise<number> {
    let updatedCount = 0;

    for (const profileId of profileIds) {
      try {
        await this.updateProfile(profileId, updateData);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update profile ${profileId}:`, error);
      }
    }

    return updatedCount;
  }

  async exportProfiles(criteria: EmployeeProfileSearchCriteria): Promise<EmployeeProfile[]> {
    return await this.searchProfiles(criteria);
  }
}