import { OpenAIAdapter } from './OpenAIAdapter';
import { LLMIntegrationService } from './LLMIntegrationService';
import { AIAgentSessionService } from './AIAgentSessionService';

export interface RosterOptimizationRequest {
  staffRequirements: StaffRequirement[];
  shiftTimes: ShiftTime[];
  requiredSkills: string[];
  budgetConstraints: BudgetConstraint;
  staffAvailability: StaffAvailability[];
  maxHours?: number;
  minRestHours?: number;
  complianceRequirements: ComplianceRequirement[];
  currentRoster?: RosterEntry[];
  optimizationGoals: OptimizationGoal[];
}

export interface StaffRequirement {
  role: string;
  skillLevel: 'junior' | 'intermediate' | 'senior' | 'specialist';
  quantity: number;
  mandatorySkills: string[];
  preferredSkills: string[];
  certificationRequirements: string[];
  experienceLevel: 'entry' | 'experienced' | 'expert';
}

export interface ShiftTime {
  startTime: string;
  endTime: string;
  breakDuration: number;
  isOvertime: boolean;
  premiumRate?: number;
}

export interface BudgetConstraint {
  maxWeeklyCost: number;
  overtimeBudget: number;
  agencyBudget: number;
  currency: string;
}

export interface StaffAvailability {
  staffId: string;
  name: string;
  role: string;
  skills: string[];
  certifications: string[];
  availability: AvailabilityWindow[];
  hourlyRate: number;
  maxHoursPerWeek: number;
  preferences: StaffPreferences;
  performanceRating: number;
  reliabilityScore: number;
}

export interface AvailabilityWindow {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
}

export interface StaffPreferences {
  preferredShifts: string[];
  avoidShifts: string[];
  maxConsecutiveDays: number;
  preferredDaysOff: number[];
  workFromHome: boolean;
}

export interface ComplianceRequirement {
  type: 'minimum_staffing' | 'skill_coverage' | 'rest_periods' | 'overtime_limits';
  description: string;
  parameters: Record<string, any>;
  isMandatory: boolean;
}

export interface RosterEntry {
  staffId: string;
  shiftId: string;
  startTime: string;
  endTime: string;
  role: string;
  cost: number;
  isOvertime: boolean;
  skills: string[];
}

export interface OptimizationGoal {
  type: 'cost_minimization' | 'staff_satisfaction' | 'skill_optimization' | 'compliance_maximization';
  weight: number;
  description: string;
}

export interface RosterOptimizationResult {
  optimizedRoster: OptimizedRosterEntry[];
  totalCost: number;
  costSavings: number;
  staffSatisfactionScore: number;
  complianceScore: number;
  skillCoverageScore: number;
  recommendations: RosterRecommendation[];
  warnings: RosterWarning[];
  metadata: RosterMetadata;
}

export interface OptimizedRosterEntry {
  staffId: string;
  staffName: string;
  role: string;
  shiftId: string;
  startTime: string;
  endTime: string;
  duration: number;
  cost: number;
  isOvertime: boolean;
  skills: string[];
  certifications: string[];
  performanceRating: number;
  reliabilityScore: number;
  satisfactionScore: number;
}

export interface RosterRecommendation {
  type: 'staffing' | 'scheduling' | 'cost' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  actionRequired: string;
  estimatedSavings?: number;
}

export interface RosterWarning {
  type: 'compliance' | 'cost' | 'staffing' | 'scheduling';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedStaff?: string[];
  suggestedAction: string;
}

export interface RosterMetadata {
  processingTime: number;
  tokensUsed: number;
  model: string;
  optimizationIterations: number;
  constraintsSatisfied: number;
  totalConstraints: number;
}

export class SmartRosterAgent {
  privateopenAIAdapter: OpenAIAdapter;
  privatellmService: LLMIntegrationService;
  privatesessionService: AIAgentSessionService;

  constructor() {
    this.openAIAdapter = new OpenAIAdapter();
    this.llmService = new LLMIntegrationService();
    this.sessionService = new AIAgentSessionService();
  }

  /**
   * Optimize roster using AI
   */
  async optimizeRoster(
    request: RosterOptimizationRequest,
    context: { tenantId: string; securityLevel: string }
  ): Promise<RosterOptimizationResult> {
    const startTime = Date.now();

    try {
      // Prepare optimization data
      const optimizationData = this.prepareOptimizationData(request);

      // Call OpenAI for roster optimization
      const result = await this.openAIAdapter.optimizeRoster(
        optimizationData,
        context
      );

      // Parse and validate the result
      const optimizedRoster = this.parseOptimizedRoster(result.response);
      
      // Calculate metrics
      const metrics = this.calculateRosterMetrics(optimizedRoster, request);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(optimizedRoster, request);
      
      // Check for warnings
      const warnings = this.checkForWarnings(optimizedRoster, request);

      const processingTime = Date.now() - startTime;

      return {
        optimizedRoster,
        totalCost: metrics.totalCost,
        costSavings: metrics.costSavings,
        staffSatisfactionScore: metrics.staffSatisfactionScore,
        complianceScore: metrics.complianceScore,
        skillCoverageScore: metrics.skillCoverageScore,
        recommendations,
        warnings,
        metadata: {
          processingTime,
          tokensUsed: result.tokensUsed,
          model: result.metadata.model,
          optimizationIterations: 1,
          constraintsSatisfied: this.countSatisfiedConstraints(optimizedRoster, request),
          totalConstraints: this.countTotalConstraints(request)
        }
      };
    } catch (error) {
      console.error('Roster optimization failed:', error);
      throw new Error(`Roster optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare optimization data for AI processing
   */
  private prepareOptimizationData(request: RosterOptimizationRequest): Record<string, any> {
    return {
      staff_requirements: JSON.stringify(request.staffRequirements),
      shift_times: JSON.stringify(request.shiftTimes),
      required_skills: JSON.stringify(request.requiredSkills),
      budget_constraints: JSON.stringify(request.budgetConstraints),
      staff_availability: JSON.stringify(request.staffAvailability),
      max_hours: request.maxHours || 40,
      min_rest_hours: request.minRestHours || 12,
      compliance_requirements: JSON.stringify(request.complianceRequirements),
      current_roster: JSON.stringify(request.currentRoster || []),
      optimization_goals: JSON.stringify(request.optimizationGoals)
    };
  }

  /**
   * Parse optimized roster from AI response
   */
  private parseOptimizedRoster(response: string): OptimizedRosterEntry[] {
    try {
      // In a real implementation, this would parse the AI response
      // For now, we'll create a mock optimized roster
      return this.generateMockOptimizedRoster();
    } catch (error) {
      console.error('Failed to parse optimized roster:', error);
      return [];
    }
  }

  /**
   * Generate mock optimized roster for demonstration
   */
  private generateMockOptimizedRoster(): OptimizedRosterEntry[] {
    return [
      {
        staffId: 'staff_001',
        staffName: 'Sarah Johnson',
        role: 'Senior Care Assistant',
        shiftId: 'shift_001',
        startTime: '08:00',
        endTime: '16:00',
        duration: 8,
        cost: 120.00,
        isOvertime: false,
        skills: ['medication_administration', 'mobility_support', 'dementia_care'],
        certifications: ['NVQ_Level_3', 'First_Aid'],
        performanceRating: 4.8,
        reliabilityScore: 0.95,
        satisfactionScore: 0.88
      },
      {
        staffId: 'staff_002',
        staffName: 'Michael Brown',
        role: 'Care Assistant',
        shiftId: 'shift_002',
        startTime: '16:00',
        endTime: '00:00',
        duration: 8,
        cost: 100.00,
        isOvertime: false,
        skills: ['personal_care', 'meal_assistance', 'social_activities'],
        certifications: ['NVQ_Level_2', 'Food_Hygiene'],
        performanceRating: 4.5,
        reliabilityScore: 0.92,
        satisfactionScore: 0.85
      },
      {
        staffId: 'staff_003',
        staffName: 'Emma Wilson',
        role: 'Night Care Assistant',
        shiftId: 'shift_003',
        startTime: '00:00',
        endTime: '08:00',
        duration: 8,
        cost: 110.00,
        isOvertime: false,
        skills: ['night_care', 'emergency_response', 'medication_administration'],
        certifications: ['NVQ_Level_3', 'Emergency_First_Aid'],
        performanceRating: 4.7,
        reliabilityScore: 0.94,
        satisfactionScore: 0.90
      }
    ];
  }

  /**
   * Calculate roster metrics
   */
  private calculateRosterMetrics(
    roster: OptimizedRosterEntry[],
    request: RosterOptimizationRequest
  ): {
    totalCost: number;
    costSavings: number;
    staffSatisfactionScore: number;
    complianceScore: number;
    skillCoverageScore: number;
  } {
    const totalCost = roster.reduce((sum, entry) => sum + entry.cost, 0);
    const currentCost = request.currentRoster?.reduce((sum, entry) => sum + entry.cost, 0) || 0;
    const costSavings = Math.max(0, currentCost - totalCost);
    
    const staffSatisfactionScore = roster.reduce((sum, entry) => sum + entry.satisfactionScore, 0) / roster.length;
    const complianceScore = this.calculateComplianceScore(roster, request);
    const skillCoverageScore = this.calculateSkillCoverageScore(roster, request);

    return {
      totalCost,
      costSavings,
      staffSatisfactionScore,
      complianceScore,
      skillCoverageScore
    };
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    roster: OptimizedRosterEntry[],
    request: RosterOptimizationRequest
  ): number {
    let score = 0;
    let totalChecks = 0;

    // Check minimum staffing requirements
    const roleCounts = this.countRoles(roster);
    for (const requirement of request.staffRequirements) {
      const actualCount = roleCounts[requirement.role] || 0;
      if (actualCount >= requirement.quantity) {
        score += 1;
      }
      totalChecks += 1;
    }

    // Check skill coverage
    const coveredSkills = new Set<string>();
    roster.forEach(entry => {
      entry.skills.forEach(skill => coveredSkills.add(skill));
    });
    
    const requiredSkillsCovered = request.requiredSkills.filter(skill => 
      coveredSkills.has(skill)
    ).length;
    
    score += (requiredSkillsCovered / request.requiredSkills.length);
    totalChecks += 1;

    return totalChecks > 0 ? score / totalChecks : 0;
  }

  /**
   * Calculate skill coverage score
   */
  private calculateSkillCoverageScore(
    roster: OptimizedRosterEntry[],
    request: RosterOptimizationRequest
  ): number {
    const coveredSkills = new Set<string>();
    roster.forEach(entry => {
      entry.skills.forEach(skill => coveredSkills.add(skill));
    });

    const requiredSkillsCovered = request.requiredSkills.filter(skill => 
      coveredSkills.has(skill)
    ).length;

    return request.requiredSkills.length > 0 
      ? requiredSkillsCovered / request.requiredSkills.length 
      : 1;
  }

  /**
   * Count roles in roster
   */
  private countRoles(roster: OptimizedRosterEntry[]): Record<string, number> {
    constcounts: Record<string, number> = {};
    roster.forEach(entry => {
      counts[entry.role] = (counts[entry.role] || 0) + 1;
    });
    return counts;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    roster: OptimizedRosterEntry[],
    request: RosterOptimizationRequest
  ): RosterRecommendation[] {
    constrecommendations: RosterRecommendation[] = [];

    // Cost optimization recommendations
    if (request.budgetConstraints.maxWeeklyCost > 0) {
      const totalCost = roster.reduce((sum, entry) => sum + entry.cost, 0);
      if (totalCost > request.budgetConstraints.maxWeeklyCost) {
        recommendations.push({
          type: 'cost',
          priority: 'high',
          title: 'Budget Exceeded',
          description: `Current roster cost (${totalCost}) exceeds budget (${request.budgetConstraints.maxWeeklyCost})`,
          impact: 'Budget overrun',
          actionRequired: 'Consider reducing hours or using lower-cost staff',
          estimatedSavings: totalCost - request.budgetConstraints.maxWeeklyCost
        });
      }
    }

    // Staffing recommendations
    const roleCounts = this.countRoles(roster);
    for (const requirement of request.staffRequirements) {
      const actualCount = roleCounts[requirement.role] || 0;
      if (actualCount < requirement.quantity) {
        recommendations.push({
          type: 'staffing',
          priority: 'critical',
          title: 'Insufficient Staffing',
          description: `Need ${requirement.quantity} ${requirement.role}s, only have ${actualCount}`,
          impact: 'Compliance risk',
          actionRequired: 'Hire additional staff or adjust requirements'
        });
      }
    }

    // Skill coverage recommendations
    const coveredSkills = new Set<string>();
    roster.forEach(entry => {
      entry.skills.forEach(skill => coveredSkills.add(skill));
    });
    
    const missingSkills = request.requiredSkills.filter(skill => 
      !coveredSkills.has(skill)
    );

    if (missingSkills.length > 0) {
      recommendations.push({
        type: 'scheduling',
        priority: 'medium',
        title: 'Missing Skills',
        description: `Required skills not covered: ${missingSkills.join(', ')}`,
        impact: 'Service quality risk',
        actionRequired: 'Assign staff with required skills or provide training'
      });
    }

    return recommendations;
  }

  /**
   * Check for warnings
   */
  private checkForWarnings(
    roster: OptimizedRosterEntry[],
    request: RosterOptimizationRequest
  ): RosterWarning[] {
    constwarnings: RosterWarning[] = [];

    // Check for overtime warnings
    const overtimeEntries = roster.filter(entry => entry.isOvertime);
    if (overtimeEntries.length > 0) {
      warnings.push({
        type: 'cost',
        severity: 'medium',
        message: `${overtimeEntries.length} staff members scheduled for overtime`,
        affectedStaff: overtimeEntries.map(entry => entry.staffId),
        suggestedAction: 'Consider hiring additional staff to reduce overtime costs'
      });
    }

    // Check for low satisfaction scores
    const lowSatisfactionEntries = roster.filter(entry => entry.satisfactionScore < 0.7);
    if (lowSatisfactionEntries.length > 0) {
      warnings.push({
        type: 'staffing',
        severity: 'low',
        message: `${lowSatisfactionEntries.length} staff members have low satisfaction scores`,
        affectedStaff: lowSatisfactionEntries.map(entry => entry.staffId),
        suggestedAction: 'Review scheduling preferences and workload distribution'
      });
    }

    return warnings;
  }

  /**
   * Count satisfied constraints
   */
  private countSatisfiedConstraints(
    roster: OptimizedRosterEntry[],
    request: RosterOptimizationRequest
  ): number {
    let satisfied = 0;
    let total = 0;

    // Check staffing requirements
    const roleCounts = this.countRoles(roster);
    for (const requirement of request.staffRequirements) {
      const actualCount = roleCounts[requirement.role] || 0;
      if (actualCount >= requirement.quantity) {
        satisfied += 1;
      }
      total += 1;
    }

    // Check skill coverage
    const coveredSkills = new Set<string>();
    roster.forEach(entry => {
      entry.skills.forEach(skill => coveredSkills.add(skill));
    });
    
    const requiredSkillsCovered = request.requiredSkills.filter(skill => 
      coveredSkills.has(skill)
    ).length;
    
    if (requiredSkillsCovered === request.requiredSkills.length) {
      satisfied += 1;
    }
    total += 1;

    return satisfied;
  }

  /**
   * Count total constraints
   */
  private countTotalConstraints(request: RosterOptimizationRequest): number {
    return request.staffRequirements.length + 1; // +1 for skill coverage
  }

  /**
   * Get roster analytics
   */
  async getRosterAnalytics(
    roster: OptimizedRosterEntry[],
    context: { tenantId: string; securityLevel: string }
  ): Promise<{
    costAnalysis: any;
    staffUtilization: any;
    skillDistribution: any;
    complianceStatus: any;
  }> {
    return {
      costAnalysis: {
        totalCost: roster.reduce((sum, entry) => sum + entry.cost, 0),
        averageCostPerHour: this.calculateAverageCostPerHour(roster),
        overtimeCost: roster.filter(entry => entry.isOvertime).reduce((sum, entry) => sum + entry.cost, 0)
      },
      staffUtilization: {
        totalHours: roster.reduce((sum, entry) => sum + entry.duration, 0),
        averageHoursPerStaff: roster.length > 0 ? roster.reduce((sum, entry) => sum + entry.duration, 0) / roster.length : 0,
        utilizationRate: 0.85 // Mock value
      },
      skillDistribution: this.analyzeSkillDistribution(roster),
      complianceStatus: {
        overallScore: this.calculateComplianceScore(roster, { staffRequirements: [], requiredSkills: [], complianceRequirements: [], optimizationGoals: [] } as RosterOptimizationRequest),
        issues: []
      }
    };
  }

  /**
   * Calculate average cost per hour
   */
  private calculateAverageCostPerHour(roster: OptimizedRosterEntry[]): number {
    const totalCost = roster.reduce((sum, entry) => sum + entry.cost, 0);
    const totalHours = roster.reduce((sum, entry) => sum + entry.duration, 0);
    return totalHours > 0 ? totalCost / totalHours : 0;
  }

  /**
   * Analyze skill distribution
   */
  private analyzeSkillDistribution(roster: OptimizedRosterEntry[]): Record<string, number> {
    constskillCounts: Record<string, number> = {};
    roster.forEach(entry => {
      entry.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    return skillCounts;
  }
}

export default SmartRosterAgent;
