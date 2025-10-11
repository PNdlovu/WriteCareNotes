import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRun, PayrollStatus, PayrollFrequency } from '../entities/PayrollRun';
import { Payslip, PayslipStatus } from '../entities/Payslip';
import { HMRCSubmission, HMRCSubmissionStatus, HMRCSubmissionType } from '../entities/HMRCSubmission';
import { TaxCalculation } from '../entities/TaxCalculation';
import { NationalInsurance } from '../entities/NationalInsurance';
import { PensionContribution } from '../entities/PensionContribution';
import { StaffMember } from '../../staff/entities/StaffMember';

export interface PayrollRunData {
  runName: string;
  payPeriod: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  payDate: Date;
  frequency: PayrollFrequency;
  staffMemberIds: string[];
}

export interface PayslipData {
  staffMemberId: string;
  basicPay: number;
  overtimePay?: number;
  bonus?: number;
  commission?: number;
  allowances?: number;
  otherDeductions?: number;
}

@Injectable()
export class PayrollService {
  const ructor(
    @InjectRepository(PayrollRun)
    privatepayrollRunRepository: Repository<PayrollRun>,
    @InjectRepository(Payslip)
    privatepayslipRepository: Repository<Payslip>,
    @InjectRepository(HMRCSubmission)
    privatehmrcSubmissionRepository: Repository<HMRCSubmission>,
    @InjectRepository(TaxCalculation)
    privatetaxCalculationRepository: Repository<TaxCalculation>,
    @InjectRepository(NationalInsurance)
    privatenationalInsuranceRepository: Repository<NationalInsurance>,
    @InjectRepository(PensionContribution)
    privatepensionContributionRepository: Repository<PensionContribution>,
    @InjectRepository(StaffMember)
    privatestaffMemberRepository: Repository<StaffMember>,
  ) {}

  /**
   * Create a new payroll run
   */
  async createPayrollRun(data: PayrollRunData): Promise<PayrollRun> {
    const payrollRun = this.payrollRunRepository.create({
      ...data,
      status: PayrollStatus.DRAFT,
    });

    return await this.payrollRunRepository.save(payrollRun);
  }

  /**
   * Process payroll for a specific run
   */
  async processPayroll(payrollRunId: string, payslipData: PayslipData[]): Promise<PayrollRun> {
    const payrollRun = await this.payrollRunRepository.findOne({
      where: { id: payrollRunId },
      relations: ['payslips', 'payslips.staffMember'],
    });

    if (!payrollRun) {
      throw new Error('Payroll run not found');
    }

    if (payrollRun.status !== PayrollStatus.DRAFT) {
      throw new Error('Payroll run is not in draft status');
    }

    // Update status to processing
    payrollRun.status = PayrollStatus.PROCESSING;
    await this.payrollRunRepository.save(payrollRun);

    try {
      // Process each payslip
      for (const data of payslipData) {
        await this.processPayslip(payrollRun, data);
      }

      // Calculate totals
      payrollRun.calculateTotals();
      payrollRun.status = PayrollStatus.COMPLETED;
      payrollRun.processedAt = new Date();

      return await this.payrollRunRepository.save(payrollRun);

    } catch (error) {
      payrollRun.status = PayrollStatus.FAILED;
      await this.payrollRunRepository.save(payrollRun);
      throw error;
    }
  }

  /**
   * Process individual payslip
   */
  private async processPayslip(payrollRun: PayrollRun, data: PayslipData): Promise<Payslip> {
    const staffMember = await this.staffMemberRepository.findOne({
      where: { id: data.staffMemberId },
    });

    if (!staffMember) {
      throw new Error(`Staff member ${data.staffMemberId} not found`);
    }

    // Create payslip
    const payslip = this.payslipRepository.create({
      payrollRunId: payrollRun.id,
      staffMemberId: data.staffMemberId,
      employeeName: `${staffMember.firstName} ${staffMember.lastName}`,
      employeeNumber: staffMember.employeeNumber,
      nationalInsuranceNumber: staffMember.nationalInsuranceNumber,
      taxCode: staffMember.taxCode,
      payPeriodStart: payrollRun.payPeriodStart,
      payPeriodEnd: payrollRun.payPeriodEnd,
      payDate: payrollRun.payDate,
      basicPay: data.basicPay,
      overtimePay: data.overtimePay || 0,
      bonus: data.bonus || 0,
      commission: data.commission || 0,
      allowances: data.allowances || 0,
      otherDeductions: data.otherDeductions || 0,
      status: PayslipStatus.GENERATED,
    });

    // Calculate payslip
    payslip.calculateAll();
    payslip.payslipNumber = payslip.generatePayslipNumber();

    // Calculate tax
    await this.calculateTax(payslip);

    // Calculate National Insurance
    await this.calculateNationalInsurance(payslip);

    // Calculate pension contributions
    await this.calculatePensionContributions(payslip);

    // Recalculate final amounts
    payslip.calculateAll();

    return await this.payslipRepository.save(payslip);
  }

  /**
   * Calculate tax for payslip
   */
  private async calculateTax(payslip: Payslip): Promise<void> {
    const taxCalculation = this.taxCalculationRepository.create({
      payslipId: payslip.id,
      taxCode: payslip.taxCode,
      taxableIncome: payslip.grossPay,
      personalAllowance: this.getPersonalAllowance(payslip.taxCode),
      basicRateIncome: Math.max(0, Math.min(payslip.grossPay - this.getPersonalAllowance(payslip.taxCode), 50270 - this.getPersonalAllowance(payslip.taxCode))),
      higherRateIncome: Math.max(0, Math.min(payslip.grossPay - 50270, 125140 - 50270)),
      additionalRateIncome: Math.max(0, payslip.grossPay - 125140),
      basicRate: 20,
      higherRate: 40,
      additionalRate: 45,
      taxYear: this.getTaxYear(payslip.payDate),
      calculationDate: new Date(),
    });

    taxCalculation.calculateTax();
    payslip.tax = taxCalculation.taxDue;

    await this.taxCalculationRepository.save(taxCalculation);
  }

  /**
   * Calculate National Insurance for payslip
   */
  private async calculateNationalInsurance(payslip: Payslip): Promise<void> {
    const niCalculation = this.nationalInsuranceRepository.create({
      payslipId: payslip.id,
      grossPay: payslip.grossPay,
      employeeRate: 12, // 12% for 2024-25
      employerRate: 13.8, // 13.8% for 2024-25
      lowerEarningsLimit: 123, // Weekly
      upperEarningsLimit: 967, // Weekly
      employeeContribution: 0,
      employerContribution: 0,
      calculationDate: new Date(),
    });

    // Calculate employee NI
    const weeklyGross = payslip.grossPay / 4.33; // Convert monthly to weekly
    if (weeklyGross > niCalculation.lowerEarningsLimit) {
      const taxableAmount = Math.min(weeklyGross - niCalculation.lowerEarningsLimit, 
                                   niCalculation.upperEarningsLimit - niCalculation.lowerEarningsLimit);
      niCalculation.employeeContribution = (taxableAmount * niCalculation.employeeRate / 100) * 4.33;
    }

    // Calculate employer NI
    if (weeklyGross > niCalculation.lowerEarningsLimit) {
      const taxableAmount = Math.max(0, weeklyGross - niCalculation.lowerEarningsLimit);
      niCalculation.employerContribution = (taxableAmount * niCalculation.employerRate / 100) * 4.33;
    }

    payslip.nationalInsurance = niCalculation.employeeContribution;

    await this.nationalInsuranceRepository.save(niCalculation);
  }

  /**
   * Calculate pension contributions for payslip
   */
  private async calculatePensionContributions(payslip: Payslip): Promise<void> {
    const pensionCalculation = this.pensionContributionRepository.create({
      payslipId: payslip.id,
      grossPay: payslip.grossPay,
      employeeRate: 5, // 5% employee contribution
      employerRate: 3, // 3% employer contribution
      employeeContribution: 0,
      employerContribution: 0,
      calculationDate: new Date(),
    });

    // Calculate contributions
    pensionCalculation.employeeContribution = payslip.grossPay * pensionCalculation.employeeRate / 100;
    pensionCalculation.employerContribution = payslip.grossPay * pensionCalculation.employerRate / 100;

    payslip.pensionContribution = pensionCalculation.employeeContribution;

    await this.pensionContributionRepository.save(pensionCalculation);
  }

  /**
   * Submit payroll to HMRC
   */
  async submitToHMRC(payrollRunId: string, submittedBy: string): Promise<HMRCSubmission> {
    const payrollRun = await this.payrollRunRepository.findOne({
      where: { id: payrollRunId },
      relations: ['payslips'],
    });

    if (!payrollRun) {
      throw new Error('Payroll run not found');
    }

    if (!payrollRun.isReadyForSubmission()) {
      throw new Error('Payroll run is not ready for submission');
    }

    const submission = this.hmrcSubmissionRepository.create({
      payrollRunId: payrollRun.id,
      submissionId: this.generateHMRCSubmissionId(),
      submissionType: HMRCSubmissionType.FPS,
      taxYear: this.getTaxYear(payrollRun.payDate),
      payPeriod: this.getPayPeriod(payrollRun.payDate),
      submissionDate: payrollRun.payDate,
      employeeCount: payrollRun.employeeCount,
      totalGrossPay: payrollRun.totalGrossPay,
      totalTax: payrollRun.totalTax,
      totalNationalInsurance: payrollRun.totalNationalInsurance,
      totalPension: payrollRun.totalPension,
      totalStudentLoan: 0, // Calculate from payslips
      totalApprenticeshipLevy: 0, // Calculate from payslips
    });

    submission.markAsSubmitted(submittedBy);
    return await this.hmrcSubmissionRepository.save(submission);
  }

  /**
   * Get payroll run by ID
   */
  async getPayrollRun(id: string): Promise<PayrollRun | null> {
    return await this.payrollRunRepository.findOne({
      where: { id },
      relations: ['payslips', 'payslips.staffMember', 'hmrcSubmissions'],
    });
  }

  /**
   * Get all payroll runs
   */
  async getPayrollRuns(limit: number = 50, offset: number = 0): Promise<PayrollRun[]> {
    return await this.payrollRunRepository.find({
      relations: ['payslips', 'hmrcSubmissions'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get payslips for a payroll run
   */
  async getPayslips(payrollRunId: string): Promise<Payslip[]> {
    return await this.payslipRepository.find({
      where: { payrollRunId },
      relations: ['staffMember', 'taxCalculations', 'nationalInsuranceCalculations', 'pensionContributions'],
      order: { employeeName: 'ASC' },
    });
  }

  /**
   * Get payslip by ID
   */
  async getPayslip(id: string): Promise<Payslip | null> {
    return await this.payslipRepository.findOne({
      where: { id },
      relations: ['payrollRun', 'staffMember', 'taxCalculations', 'nationalInsuranceCalculations', 'pensionContributions'],
    });
  }

  // Helper methods
  private getPersonalAllowance(taxCode: string): number {
    // Extract personal allowance from tax code
    const numericPart = taxCode.match(/\d+/);
    if (numericPart) {
      return parseInt(numericPart[0]) * 10; // Convert to annual amount
    }
    return 12570; // Default personal allowance for 2024-25
  }

  private getTaxYear(date: Date): string {
    const year = date.getFullYear();
    const nextYear = year + 1;
    return `${year}-${nextYear.toString().slice(-2)}`;
  }

  private getPayPeriod(date: Date): string {
    return String(date.getMonth() + 1).padStart(2, '0');
  }

  private generateHMRCSubmissionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `HMRC${timestamp}${random}`;
  }
}

export default PayrollService;
