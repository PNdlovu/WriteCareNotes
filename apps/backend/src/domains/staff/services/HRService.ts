import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeProfile, EmploymentStatus, EmploymentType } from '../entities/EmployeeProfile';
import { TimeOffRequest, TimeOffStatus, TimeOffType } from '../entities/TimeOffRequest';
import { ShiftSwap, ShiftSwapStatus, ShiftSwapType } from '../entities/ShiftSwap';
import { Certification, CertificationStatus, CertificationType } from '../entities/Certification';
import { Department } from '../entities/Department';
import { Position } from '../entities/Position';

export interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  dateOfBirth: Date;
  gender: string;
  nationalInsuranceNumber: string;
  address: string;
  postcode: string;
  city?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  startDate: Date;
  employmentType: EmploymentType;
  departmentId: string;
  positionId: string;
  managerId?: string;
  contractedHours: number;
  probationPeriod: number;
  skills?: string[];
  qualifications?: string[];
  previousExperience?: any[];
}

export interface LeaveRequestData {
  employeeProfileId: string;
  type: TimeOffType;
  startDate: Date;
  endDate: Date;
  reason: string;
  notes?: string;
  isEmergency?: boolean;
  requiresCover?: boolean;
  coverEmployeeId?: string;
}

export interface ShiftSwapData {
  requestingEmployeeId: string;
  originalShiftId: string;
  proposedShiftId?: string;
  type: ShiftSwapType;
  reason: string;
  notes?: string;
  isEmergency?: boolean;
  isPaidSwap?: boolean;
  compensationAmount?: number;
}

export interface OnboardingChecklist {
  id: string;
  task: string;
  description: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  category: 'documentation' | 'training' | 'equipment' | 'access' | 'compliance';
}

@Injectable()
export class HRService {
  const ructor(
    @InjectRepository(EmployeeProfile)
    privateemployeeProfileRepository: Repository<EmployeeProfile>,
    @InjectRepository(TimeOffRequest)
    privatetimeOffRequestRepository: Repository<TimeOffRequest>,
    @InjectRepository(ShiftSwap)
    privateshiftSwapRepository: Repository<ShiftSwap>,
    @InjectRepository(Certification)
    privatecertificationRepository: Repository<Certification>,
    @InjectRepository(Department)
    privatedepartmentRepository: Repository<Department>,
    @InjectRepository(Position)
    privatepositionRepository: Repository<Position>,
  ) {}

  /**
   * Complete employee onboarding process
   */
  async onboardEmployee(data: OnboardingData, createdBy: string): Promise<{
    employee: EmployeeProfile;
    checklist: OnboardingChecklist[];
  }> {
    // Create employee profile
    const employee = this.employeeProfileRepository.create({
      ...data,
      employmentStatus: EmploymentStatus.PROBATION,
      isProbationary: true,
      probationEndDate: new Date(data.startDate.getTime() + data.probationPeriod * 24 * 60 * 60 * 1000),
      createdBy,
      updatedBy: createdBy,
    });

    const savedEmployee = await this.employeeProfileRepository.save(employee);

    // Generate onboarding checklist
    const checklist = this.generateOnboardingChecklist(savedEmployee.id);

    return { employee: savedEmployee, checklist };
  }

  /**
   * Submit time off request
   */
  async submitTimeOffRequest(data: LeaveRequestData, submittedBy: string): Promise<TimeOffRequest> {
    // Check for overlapping requests
    const overlappingRequests = await this.timeOffRequestRepository
      .createQueryBuilder('request')
      .where('request.employeeProfileId = :employeeId', { employeeId: data.employeeProfileId })
      .andWhere('request.status IN (:...statuses)', { 
        statuses: [TimeOffStatus.PENDING, TimeOffStatus.APPROVED] 
      })
      .andWhere('(request.startDate <= :endDate AND request.endDate >= :startDate)', {
        startDate: data.startDate,
        endDate: data.endDate,
      })
      .getMany();

    if (overlappingRequests.length > 0) {
      throw new Error('You have overlapping time off requests for this period');
    }

    // Create time off request
    const request = this.timeOffRequestRepository.create({
      ...data,
      requestNumber: this.generateRequestNumber(),
      totalDays: this.calculateDaysBetween(data.startDate, data.endDate),
      totalHours: this.calculateDaysBetween(data.startDate, data.endDate) * 8, // Assuming 8-hour work day
      isFullDay: true,
      status: TimeOffStatus.PENDING,
      createdBy: submittedBy,
      updatedBy: submittedBy,
    });

    return await this.timeOffRequestRepository.save(request);
  }

  /**
   * Approve time off request
   */
  async approveTimeOffRequest(requestId: string, approvedBy: string, notes?: string): Promise<TimeOffRequest> {
    const request = await this.timeOffRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Time off request not found');
    }

    if (request.status !== TimeOffStatus.PENDING) {
      throw new Error('Only pending requests can be approved');
    }

    request.approve(approvedBy, notes);
    return await this.timeOffRequestRepository.save(request);
  }

  /**
   * Reject time off request
   */
  async rejectTimeOffRequest(requestId: string, rejectedBy: string, reason: string): Promise<TimeOffRequest> {
    const request = await this.timeOffRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Time off request not found');
    }

    if (request.status !== TimeOffStatus.PENDING) {
      throw new Error('Only pending requests can be rejected');
    }

    request.reject(rejectedBy, reason);
    return await this.timeOffRequestRepository.save(request);
  }

  /**
   * Create shift swap request
   */
  async createShiftSwapRequest(data: ShiftSwapData, createdBy: string): Promise<ShiftSwap> {
    const swap = this.shiftSwapRepository.create({
      ...data,
      swapNumber: this.generateSwapNumber(),
      status: ShiftSwapStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdBy,
      updatedBy: createdBy,
    });

    return await this.shiftSwapRepository.save(swap);
  }

  /**
   * Approve shift swap
   */
  async approveShiftSwap(swapId: string, approvedBy: string, notes?: string): Promise<ShiftSwap> {
    const swap = await this.shiftSwapRepository.findOne({
      where: { id: swapId },
    });

    if (!swap) {
      throw new Error('Shift swap not found');
    }

    if (swap.status !== ShiftSwapStatus.PENDING) {
      throw new Error('Only pending swaps can be approved');
    }

    swap.approve(approvedBy, notes);
    return await this.shiftSwapRepository.save(swap);
  }

  /**
   * Get employee dashboard data
   */
  async getEmployeeDashboard(employeeId: string): Promise<{
    employee: EmployeeProfile;
    pendingTimeOff: TimeOffRequest[];
    pendingSwaps: ShiftSwap[];
    expiringCertifications: Certification[];
    recentActivity: any[];
  }> {
    const employee = await this.employeeProfileRepository.findOne({
      where: { id: employeeId },
      relations: ['certifications', 'timeOffRequests', 'shiftSwaps'],
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const pendingTimeOff = employee.timeOffRequests.filter(
      request => request.status === TimeOffStatus.PENDING
    );

    const pendingSwaps = employee.shiftSwaps.filter(
      swap => swap.status === ShiftSwapStatus.PENDING
    );

    const expiringCertifications = employee.certifications.filter(
      cert => cert.isExpiringSoon(30) && cert.status === CertificationStatus.VALID
    );

    // Mock recent activity - in real implementation, this would come from an activity log
    const recentActivity = [
      { type: 'time_off_request', message: 'Submitted time off request', date: new Date() },
      { type: 'certification', message: 'Completed First Aid training', date: new Date() },
      { type: 'shift_swap', message: 'Requested shift swap', date: new Date() },
    ];

    return {
      employee,
      pendingTimeOff,
      pendingSwaps,
      expiringCertifications,
      recentActivity,
    };
  }

  /**
   * Get HR manager dashboard
   */
  async getHRDashboard(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    onProbation: number;
    pendingTimeOff: TimeOffRequest[];
    pendingSwaps: ShiftSwap[];
    expiringCertifications: Certification[];
    recentHires: EmployeeProfile[];
    upcomingLeaves: TimeOffRequest[];
  }> {
    const totalEmployees = await this.employeeProfileRepository.count();
    const activeEmployees = await this.employeeProfileRepository.count({
      where: { employmentStatus: EmploymentStatus.ACTIVE },
    });
    const onProbation = await this.employeeProfileRepository.count({
      where: { employmentStatus: EmploymentStatus.PROBATION },
    });

    const pendingTimeOff = await this.timeOffRequestRepository.find({
      where: { status: TimeOffStatus.PENDING },
      relations: ['employeeProfile'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const pendingSwaps = await this.shiftSwapRepository.find({
      where: { status: ShiftSwapStatus.PENDING },
      relations: ['requestingEmployee', 'respondingEmployee'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const expiringCertifications = await this.certificationRepository
      .createQueryBuilder('cert')
      .where('cert.status = :status', { status: CertificationStatus.VALID })
      .andWhere('cert.expiryDate BETWEEN :now AND :future', {
        now: new Date(),
        future: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .leftJoinAndSelect('cert.employeeProfile', 'employee')
      .getMany();

    const recentHires = await this.employeeProfileRepository.find({
      where: { employmentStatus: EmploymentStatus.ACTIVE },
      order: { startDate: 'DESC' },
      take: 5,
    });

    const upcomingLeaves = await this.timeOffRequestRepository.find({
      where: { status: TimeOffStatus.APPROVED },
      relations: ['employeeProfile'],
      order: { startDate: 'ASC' },
      take: 10,
    });

    return {
      totalEmployees,
      activeEmployees,
      onProbation,
      pendingTimeOff,
      pendingSwaps,
      expiringCertifications,
      recentHires,
      upcomingLeaves,
    };
  }

  /**
   * Get shift planner data
   */
  async getShiftPlanner(startDate: Date, endDate: Date): Promise<{
    shifts: any[];
    employees: EmployeeProfile[];
    conflicts: any[];
    coverage: any[];
  }> {
    // Mock shift planner data - in real implementation, this would query actual shift data
    const shifts = [];
    const employees = await this.employeeProfileRepository.find({
      where: { employmentStatus: EmploymentStatus.ACTIVE },
    });

    // Generate mock shifts for the date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      shifts.push({
        id: `shift-${currentDate.toISOString().split('T')[0]}`,
        date: new Date(currentDate),
        shiftType: 'day',
        startTime: '08:00',
        endTime: '16:00',
        requiredStaff: 3,
        assignedStaff: [],
        status: 'scheduled',
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      shifts,
      employees,
      conflicts: [],
      coverage: [],
    };
  }

  // Helper methods
  private generateOnboardingChecklist(employeeId: string): OnboardingChecklist[] {
    return [
      {
        id: '1',
        task: 'Complete Right to Work Check',
        description: 'Verify employee has legal right to work in the UK',
        isCompleted: false,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'high',
        category: 'compliance',
      },
      {
        id: '2',
        task: 'DBS Check',
        description: 'Obtain Disclosure and Barring Service check',
        isCompleted: false,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: 'high',
        category: 'compliance',
      },
      {
        id: '3',
        task: 'Health Assessment',
        description: 'Complete occupational health assessment',
        isCompleted: false,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        priority: 'high',
        category: 'compliance',
      },
      {
        id: '4',
        task: 'Induction Training',
        description: 'Complete mandatory induction training',
        isCompleted: false,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        category: 'training',
      },
      {
        id: '5',
        task: 'Equipment Assignment',
        description: 'Assign work equipment and uniform',
        isCompleted: false,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        category: 'equipment',
      },
      {
        id: '6',
        task: 'System Access',
        description: 'Set up user accounts and system access',
        isCompleted: false,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        category: 'access',
      },
    ];
  }

  private generateRequestNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `TOR${year}${month}${random}`;
  }

  private generateSwapNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `SWP${year}${month}${random}`;
  }

  private calculateDaysBetween(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
}

export default HRService;
