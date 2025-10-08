import { DataSource, Repository, Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { 
  IncidentReport, 
  IncidentType, 
  IncidentSeverity, 
  IncidentStatus,
  RootCauseAnalysis 
} from '../../entities/incident/IncidentReport';

// DTOs
export interface CreateIncidentDTO {
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  incidentDateTime: Date;
  reportedBy: string;
  location?: string;
  affectedPersons?: number;
  witnessStatements?: string[];
  immediateActions?: string[];
  organizationId: string;
}

export interface UpdateIncidentDTO {
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  location?: string;
}

export interface RootCauseAnalysisDTO {
  primaryCause: string;
  contributingFactors: string[];
  systemicIssues: string[];
  humanFactors: string[];
  environmentalFactors: string[];
  organizationalFactors: string[];
  analysisMethod: '5_why' | 'fishbone' | 'fault_tree' | 'barrier_analysis' | 'other';
  analysisNotes: string;
  lessonsLearned: string[];
}

export interface CorrectiveActionDTO {
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  responsible: string;
  deadline: Date;
  resourcesRequired?: string[];
  successCriteria: string;
}

export interface IncidentFilters {
  incidentType?: IncidentType | IncidentType[];
  severity?: IncidentSeverity | IncidentSeverity[];
  status?: IncidentStatus | IncidentStatus[];
  reportedBy?: string;
  startDate?: Date;
  endDate?: Date;
  requiresCQC?: boolean;
  critical?: boolean;
}

/**
 * Service #10: Incident Management Service
 * 
 * Comprehensive incident reporting and investigation with:
 * - Incident logging and tracking
 * - Root cause analysis
 * - Corrective action management
 * - CQC notification workflow
 * - Quality assurance reviews
 * - Trend analysis
 * 
 * Compliance: CQC, RIDDOR, Health & Safety at Work Act 1974
 */
export class IncidentManagementService {
  private incidentRepository: Repository<IncidentReport>;

  constructor(private dataSource: DataSource) {
    this.incidentRepository = this.dataSource.getRepository(IncidentReport);
  }

  /**
   * Create a new incident report
   */
  async create(dto: CreateIncidentDTO): Promise<IncidentReport> {
    const incidentNumber = await this.generateIncidentNumber(dto.incidentType);

    // Initialize AI analysis placeholder
    const aiAnalysis = {
      riskScore: this.calculateRiskScore(dto.severity, dto.incidentType),
      predictedOutcome: 'Under investigation',
      similarIncidents: [],
      recommendedActions: this.getRecommendedActions(dto.incidentType, dto.severity),
    };

    // Initialize CQC reporting
    const requiresCQC = this.shouldNotifyCQC(dto.incidentType, dto.severity);
    const cqcReporting = {
      notificationRequired: requiresCQC,
      notificationDeadline: requiresCQC ? new Date(dto.incidentDateTime.getTime() + 24 * 60 * 60 * 1000) : new Date(),
      notificationSent: false,
      notificationReference: '',
      cqcReference: '',
      followUpRequired: requiresCQC,
      followUpActions: [],
      complianceStatus: 'under_review' as const,
    };

    // Initialize root cause analysis placeholder
    const rootCauseAnalysis: RootCauseAnalysis = {
      primaryCause: '',
      contributingFactors: [],
      systemicIssues: [],
      humanFactors: [],
      environmentalFactors: [],
      organizationalFactors: [],
      timeline: [],
      evidence: [],
      analysisMethod: '5_why',
      analysisNotes: '',
      recommendedActions: [],
      preventionMeasures: [],
      lessonsLearned: [],
      cqcCompliance: {
        notificationRequired: requiresCQC,
        notificationDeadline: cqcReporting.notificationDeadline,
        notificationSent: false,
        notificationReference: '',
        followUpRequired: requiresCQC,
        followUpActions: [],
      },
    };

    const incident = this.incidentRepository.create({
      incidentNumber,
      incidentType: dto.incidentType,
      severity: dto.severity,
      status: IncidentStatus.REPORTED,
      description: dto.description,
      incidentDateTime: dto.incidentDateTime,
      reportedBy: dto.reportedBy,
      rootCauseAnalysis,
      aiAnalysis,
      cqcReporting,
      correctiveActions: [],
      qualityAssurance: {
        reviewCompleted: false,
        reviewedBy: '',
        qualityScore: 0,
        areasForImprovement: [],
        bestPractices: [],
        trainingNeeds: [],
        processImprovements: [],
      },
      organizationId: dto.organizationId,
    });

    return await this.incidentRepository.save(incident);
  }

  /**
   * Find incident by ID
   */
  async findById(id: string, organizationId: string): Promise<IncidentReport | null> {
    return await this.incidentRepository.findOne({
      where: { id, organizationId },
    });
  }

  /**
   * Find all incidents with filtering and pagination
   */
  async findAll(
    organizationId: string,
    filters: IncidentFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ incidents: IncidentReport[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.incidentRepository
      .createQueryBuilder('incident')
      .where('incident.organizationId = :organizationId', { organizationId });

    if (filters.incidentType) {
      if (Array.isArray(filters.incidentType)) {
        queryBuilder.andWhere('incident.incidentType IN (:...types)', { types: filters.incidentType });
      } else {
        queryBuilder.andWhere('incident.incidentType = :type', { type: filters.incidentType });
      }
    }

    if (filters.severity) {
      if (Array.isArray(filters.severity)) {
        queryBuilder.andWhere('incident.severity IN (:...severities)', { severities: filters.severity });
      } else {
        queryBuilder.andWhere('incident.severity = :severity', { severity: filters.severity });
      }
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryBuilder.andWhere('incident.status IN (:...statuses)', { statuses: filters.status });
      } else {
        queryBuilder.andWhere('incident.status = :status', { status: filters.status });
      }
    }

    if (filters.reportedBy) {
      queryBuilder.andWhere('incident.reportedBy = :reportedBy', { reportedBy: filters.reportedBy });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('incident.incidentDateTime >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('incident.incidentDateTime <= :endDate', { endDate: filters.endDate });
    }

    if (filters.critical !== undefined && filters.critical) {
      queryBuilder.andWhere('incident.severity IN (:...criticalSeverities)', {
        criticalSeverities: [IncidentSeverity.SEVERE, IncidentSeverity.CATASTROPHIC],
      });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('incident.incidentDateTime', 'DESC');

    const [incidents, total] = await queryBuilder.getManyAndCount();

    return {
      incidents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update incident
   */
  async update(id: string, organizationId: string, dto: UpdateIncidentDTO): Promise<IncidentReport> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    if (incident.status === IncidentStatus.CLOSED) {
      throw new Error('Cannot update closed incidents');
    }

    Object.assign(incident, dto);
    return await this.incidentRepository.save(incident);
  }

  /**
   * Delete incident (soft delete)
   */
  async delete(id: string, organizationId: string): Promise<void> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    if (incident.isCritical()) {
      throw new Error('Cannot delete critical incidents. Archive them instead.');
    }

    await this.incidentRepository.softRemove(incident);
  }

  /**
   * Add root cause analysis
   */
  async addRootCauseAnalysis(
    id: string,
    organizationId: string,
    dto: RootCauseAnalysisDTO
  ): Promise<IncidentReport> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    incident.rootCauseAnalysis = {
      ...incident.rootCauseAnalysis,
      ...dto,
    };

    incident.status = IncidentStatus.INVESTIGATING;
    return await this.incidentRepository.save(incident);
  }

  /**
   * Add corrective action
   */
  async addCorrectiveAction(
    id: string,
    organizationId: string,
    dto: CorrectiveActionDTO
  ): Promise<IncidentReport> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const action = {
      actionId: `ACTION-${Date.now()}`,
      description: dto.description,
      priority: dto.priority,
      responsible: dto.responsible,
      assignedDate: new Date(),
      deadline: dto.deadline,
      status: 'pending' as const,
      effectiveness: 0,
      reviewDate: new Date(dto.deadline.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after deadline
      resourcesRequired: dto.resourcesRequired || [],
      successCriteria: dto.successCriteria,
      monitoringMethod: 'Regular review',
    };

    incident.correctiveActions.push(action);
    return await this.incidentRepository.save(incident);
  }

  /**
   * Update corrective action status
   */
  async updateCorrectiveAction(
    id: string,
    organizationId: string,
    actionId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'overdue',
    effectiveness?: number
  ): Promise<IncidentReport> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const action = incident.correctiveActions.find(a => a.actionId === actionId);
    if (!action) {
      throw new Error('Corrective action not found');
    }

    action.status = status;
    if (status === 'completed') {
      action.completionDate = new Date();
    }
    if (effectiveness !== undefined) {
      action.effectiveness = effectiveness;
    }

    // Check if deadline is passed
    if (new Date() > action.deadline && status !== 'completed') {
      action.status = 'overdue';
    }

    return await this.incidentRepository.save(incident);
  }

  /**
   * Mark as resolved
   */
  async markAsResolved(id: string, organizationId: string): Promise<IncidentReport> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const actionStatus = incident.getCorrectiveActionStatus();
    if (actionStatus.pending > 0 || actionStatus.overdue > 0) {
      throw new Error('Cannot resolve incident with pending or overdue corrective actions');
    }

    incident.status = IncidentStatus.RESOLVED;
    return await this.incidentRepository.save(incident);
  }

  /**
   * Close incident
   */
  async close(id: string, organizationId: string): Promise<IncidentReport> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    if (incident.status !== IncidentStatus.RESOLVED) {
      throw new Error('Only resolved incidents can be closed');
    }

    if (!incident.qualityAssurance.reviewCompleted) {
      throw new Error('Quality review must be completed before closing');
    }

    incident.status = IncidentStatus.CLOSED;
    return await this.incidentRepository.save(incident);
  }

  /**
   * Complete quality assurance review
   */
  async completeQualityReview(
    id: string,
    organizationId: string,
    reviewedBy: string,
    qualityScore: number,
    areasForImprovement: string[],
    bestPractices: string[]
  ): Promise<IncidentReport> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    incident.qualityAssurance = {
      reviewCompleted: true,
      reviewDate: new Date(),
      reviewedBy,
      qualityScore,
      areasForImprovement,
      bestPractices,
      trainingNeeds: [],
      processImprovements: [],
    };

    return await this.incidentRepository.save(incident);
  }

  /**
   * Send CQC notification
   */
  async sendCQCNotification(
    id: string,
    organizationId: string,
    notificationReference: string
  ): Promise<IncidentReport> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    incident.cqcReporting.notificationSent = true;
    incident.cqcReporting.notificationReference = notificationReference;
    incident.cqcReporting.complianceStatus = 'compliant';

    return await this.incidentRepository.save(incident);
  }

  /**
   * Get critical incidents
   */
  async getCriticalIncidents(organizationId: string): Promise<IncidentReport[]> {
    return await this.incidentRepository.find({
      where: {
        organizationId,
        severity: In([IncidentSeverity.SEVERE, IncidentSeverity.CATASTROPHIC]),
      },
      order: { incidentDateTime: 'DESC' },
    });
  }

  /**
   * Get incidents requiring CQC notification
   */
  async getIncidentsRequiringCQC(organizationId: string): Promise<IncidentReport[]> {
    const incidents = await this.incidentRepository
      .createQueryBuilder('incident')
      .where('incident.organizationId = :organizationId', { organizationId })
      .andWhere("incident.cqcReporting->>'notificationRequired' = 'true'")
      .andWhere("incident.cqcReporting->>'notificationSent' = 'false'")
      .orderBy('incident.incidentDateTime', 'ASC')
      .getMany();

    return incidents;
  }

  /**
   * Get overdue corrective actions
   */
  async getOverdueCorrectiveActions(organizationId: string): Promise<any[]> {
    const incidents = await this.incidentRepository.find({
      where: { organizationId },
    });

    const overdueActions: any[] = [];
    incidents.forEach(incident => {
      incident.correctiveActions.forEach(action => {
        if (new Date() > action.deadline && action.status !== 'completed') {
          overdueActions.push({
            incidentId: incident.id,
            incidentNumber: incident.incidentNumber,
            incidentType: incident.incidentType,
            action,
          });
        }
      });
    });

    return overdueActions;
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byMonth: Record<string, number>;
    total: number;
    criticalRate: number;
    resolutionTime: number;
  }> {
    const incidents = await this.incidentRepository.find({
      where: {
        organizationId,
        incidentDateTime: Between(startDate, endDate),
      },
    });

    const byType = incidents.reduce((acc, inc) => {
      acc[inc.incidentType] = (acc[inc.incidentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = incidents.reduce((acc, inc) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byMonth = incidents.reduce((acc, inc) => {
      const month = new Date(inc.incidentDateTime).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const critical = incidents.filter(inc => inc.isCritical()).length;
    const criticalRate = incidents.length > 0 ? (critical / incidents.length) * 100 : 0;

    // Calculate average resolution time (for resolved incidents)
    const resolvedIncidents = incidents.filter(inc => inc.status === IncidentStatus.RESOLVED || inc.status === IncidentStatus.CLOSED);
    const avgResolutionTime = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, inc) => {
          const resolutionTime = inc.updatedAt.getTime() - inc.incidentDateTime.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedIncidents.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    return {
      byType,
      bySeverity,
      byMonth,
      total: incidents.length,
      criticalRate: Math.round(criticalRate * 100) / 100,
      resolutionTime: Math.round(avgResolutionTime * 100) / 100,
    };
  }

  /**
   * Get statistics
   */
  async getStatistics(organizationId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    critical: number;
    requiresCQC: number;
    overdueActions: number;
    avgResolutionTime: number;
  }> {
    const incidents = await this.incidentRepository.find({ where: { organizationId } });

    const byStatus = incidents.reduce((acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = incidents.reduce((acc, inc) => {
      acc[inc.incidentType] = (acc[inc.incidentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = incidents.reduce((acc, inc) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const critical = incidents.filter(inc => inc.isCritical()).length;
    const requiresCQC = incidents.filter(inc => inc.cqcReporting.notificationRequired && !inc.cqcReporting.notificationSent).length;

    const overdueActions = await this.getOverdueCorrectiveActions(organizationId);

    const resolvedIncidents = incidents.filter(inc => inc.status === IncidentStatus.RESOLVED || inc.status === IncidentStatus.CLOSED);
    const avgResolutionTime = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, inc) => {
          const resolutionTime = inc.updatedAt.getTime() - inc.incidentDateTime.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedIncidents.length / (1000 * 60 * 60 * 24)
      : 0;

    return {
      total: incidents.length,
      byStatus,
      byType,
      bySeverity,
      critical,
      requiresCQC,
      overdueActions: overdueActions.length,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
    };
  }

  /**
   * Private helper methods
   */

  private async generateIncidentNumber(type: IncidentType): Promise<string> {
    const prefix = this.getIncidentPrefix(type);
    const year = new Date().getFullYear();
    const count = await this.incidentRepository.count();
    const sequence = String(count + 1).padStart(5, '0');
    return `${prefix}-${year}-${sequence}`;
  }

  private getIncidentPrefix(type: IncidentType): string {
    const prefixes: Record<IncidentType, string> = {
      [IncidentType.CLINICAL]: 'CLI',
      [IncidentType.MEDICATION_ERROR]: 'MED',
      [IncidentType.FALL]: 'FALL',
      [IncidentType.INJURY]: 'INJ',
      [IncidentType.SAFEGUARDING]: 'SAFE',
      [IncidentType.INFECTION_CONTROL]: 'INF',
      [IncidentType.EQUIPMENT_FAILURE]: 'EQUIP',
      [IncidentType.SECURITY_BREACH]: 'SEC',
      [IncidentType.ENVIRONMENTAL]: 'ENV',
      [IncidentType.BEHAVIORAL]: 'BEH',
    };
    return prefixes[type] || 'INC';
  }

  private calculateRiskScore(severity: IncidentSeverity, type: IncidentType): number {
    const severityScores = {
      [IncidentSeverity.MINOR]: 20,
      [IncidentSeverity.MODERATE]: 40,
      [IncidentSeverity.MAJOR]: 60,
      [IncidentSeverity.SEVERE]: 80,
      [IncidentSeverity.CATASTROPHIC]: 100,
    };

    const typeModifiers = {
      [IncidentType.SAFEGUARDING]: 1.2,
      [IncidentType.CLINICAL]: 1.15,
      [IncidentType.MEDICATION_ERROR]: 1.1,
      [IncidentType.FALL]: 1.0,
      [IncidentType.INJURY]: 1.05,
      [IncidentType.INFECTION_CONTROL]: 1.1,
      [IncidentType.EQUIPMENT_FAILURE]: 0.9,
      [IncidentType.SECURITY_BREACH]: 1.0,
      [IncidentType.ENVIRONMENTAL]: 0.85,
      [IncidentType.BEHAVIORAL]: 0.95,
    };

    return Math.min(100, Math.round(severityScores[severity] * typeModifiers[type]));
  }

  private shouldNotifyCQC(type: IncidentType, severity: IncidentSeverity): boolean {
    // CQC notification required for serious incidents
    return severity === IncidentSeverity.SEVERE ||
           severity === IncidentSeverity.CATASTROPHIC ||
           type === IncidentType.SAFEGUARDING ||
           type === IncidentType.CLINICAL;
  }

  private getRecommendedActions(type: IncidentType, severity: IncidentSeverity): string[] {
    const actions: string[] = ['Document incident thoroughly', 'Notify management'];

    if (severity === IncidentSeverity.SEVERE || severity === IncidentSeverity.CATASTROPHIC) {
      actions.push('Immediate safety review', 'CQC notification required');
    }

    switch (type) {
      case IncidentType.FALL:
        actions.push('Review mobility assessment', 'Check environment for hazards');
        break;
      case IncidentType.MEDICATION_ERROR:
        actions.push('Review medication procedures', 'Staff retraining');
        break;
      case IncidentType.SAFEGUARDING:
        actions.push('Safeguarding investigation', 'Contact local authority');
        break;
      case IncidentType.INFECTION_CONTROL:
        actions.push('Infection control measures', 'Staff hygiene training');
        break;
    }

    return actions;
  }
}
