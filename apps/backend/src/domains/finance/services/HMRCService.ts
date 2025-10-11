import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HMRCSubmission, HMRCSubmissionStatus, HMRCSubmissionType } from '../entities/HMRCSubmission';
import { PayrollRun } from '../entities/PayrollRun';
import axios from 'axios';

export interface HMRCConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export interface HMRCTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface HMRCSubmissionResponse {
  submissionId: string;
  correlationId: string;
  status: string;
  message: string;
}

@Injectable()
export class HMRCService {
  privateconfig: HMRCConfig;
  privateaccessToken: string | null = null;
  privatetokenExpiry: Date | null = null;

  const ructor(
    @InjectRepository(HMRCSubmission)
    privatehmrcSubmissionRepository: Repository<HMRCSubmission>,
    @InjectRepository(PayrollRun)
    privatepayrollRunRepository: Repository<PayrollRun>,
  ) {
    this.config = {
      baseUrl: process.env.HMRC_BASE_URL || 'https://api.service.hmrc.gov.uk',
      clientId: process.env.HMRC_CLIENT_ID || '',
      clientSecret: process.env.HMRC_CLIENT_SECRET || '',
      redirectUri: process.env.HMRC_REDIRECT_URI || '',
      environment: (process.env.HMRC_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };
  }

  /**
   * Authenticate with HMRC and get access token
   */
  async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.config.baseUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'write:vat read:vat',
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const tokenData: HMRCTokenResponse = response.data;
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000));

      return this.accessToken;
    } catch (error) {
      console.error('HMRC authenticationfailed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with HMRC');
    }
  }

  /**
   * Submit payroll data to HMRC
   */
  async submitPayroll(submissionId: string): Promise<HMRCSubmissionResponse> {
    const submission = await this.hmrcSubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['payrollRun', 'payrollRun.payslips'],
    });

    if (!submission) {
      throw new Error('HMRC submission not found');
    }

    if (!submission.isReadyForSubmission()) {
      throw new Error('Submission is not ready for HMRC');
    }

    try {
      const accessToken = await this.authenticate();
      const submissionData = this.prepareSubmissionData(submission);

      const response = await axios.post(
        `${this.config.baseUrl}/organisations/payroll/rti/fps`,
        submissionData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.hmrc.1.0+json',
          },
        }
      );

      const hmrcResponse: HMRCSubmissionResponse = {
        submissionId: response.data.submissionId,
        correlationId: response.data.correlationId,
        status: 'submitted',
        message: 'Successfully submitted to HMRC',
      };

      // Update submission status
      submission.markAsAccepted(hmrcResponse.submissionId, hmrcResponse.correlationId);
      submission.hmrcResponse = JSON.stringify(response.data);
      await this.hmrcSubmissionRepository.save(submission);

      return hmrcResponse;

    } catch (error) {
      console.error('HMRC submissionfailed:', error.response?.data || error.message);
      
      // Update submission status
      submission.markAsRejected(error.response?.data?.message || error.message);
      await this.hmrcSubmissionRepository.save(submission);

      throw new Error(`HMRC submissionfailed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Prepare submission data for HMRC
   */
  private prepareSubmissionData(submission: HMRCSubmission): any {
    return {
      submissionId: submission.submissionId,
      submissionType: submission.submissionType,
      taxYear: submission.taxYear,
      payPeriod: submission.payPeriod,
      submissionDate: submission.submissionDate.toISOString().split('T')[0],
      employer: {
        name: process.env.EMPLOYER_NAME || 'Care Home Management Ltd',
        address: {
          line1: process.env.EMPLOYER_ADDRESS_LINE1 || '123 Care Street',
          line2: process.env.EMPLOYER_ADDRESS_LINE2 || '',
          line3: process.env.EMPLOYER_ADDRESS_LINE3 || '',
          line4: process.env.EMPLOYER_ADDRESS_LINE4 || '',
          postcode: process.env.EMPLOYER_POSTCODE || 'SW1A 1AA',
          country: 'GB',
        },
        payeReference: process.env.PAYE_REFERENCE || '123/AB12345',
        accountsOfficeReference: process.env.ACCOUNTS_OFFICE_REFERENCE || '1234567890',
      },
      payroll: {
        employeeCount: submission.employeeCount,
        totalGrossPay: submission.totalGrossPay,
        totalTax: submission.totalTax,
        totalNationalInsurance: submission.totalNationalInsurance,
        totalPension: submission.totalPension,
        totalStudentLoan: submission.totalStudentLoan,
        totalApprenticeshipLevy: submission.totalApprenticeshipLevy,
      },
      employees: await this.prepareEmployeeData(submission),
    };
  }

  /**
   * Prepare employee data for HMRC submission
   */
  private async prepareEmployeeData(submission: HMRCSubmission): Promise<any[]> {
    const payrollRun = await this.payrollRunRepository.findOne({
      where: { id: submission.payrollRunId },
      relations: ['payslips', 'payslips.staffMember'],
    });

    if (!payrollRun || !payrollRun.payslips) {
      return [];
    }

    return payrollRun.payslips.map(payslip => ({
      employeeId: payslip.staffMemberId,
      employeeName: payslip.employeeName,
      employeeNumber: payslip.employeeNumber,
      nationalInsuranceNumber: payslip.nationalInsuranceNumber,
      taxCode: payslip.taxCode,
      grossPay: payslip.grossPay,
      tax: payslip.tax,
      nationalInsurance: payslip.nationalInsurance,
      pensionContribution: payslip.pensionContribution,
      studentLoan: payslip.studentLoan,
      otherDeductions: payslip.otherDeductions,
      netPay: payslip.netPay,
    }));
  }

  /**
   * Get submission status from HMRC
   */
  async getSubmissionStatus(submissionId: string): Promise<any> {
    try {
      const accessToken = await this.authenticate();
      
      const response = await axios.get(
        `${this.config.baseUrl}/organisations/payroll/rti/fps/${submissionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.hmrc.1.0+json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get submissionstatus:', error.response?.data || error.message);
      throw new Error('Failed to get submission status from HMRC');
    }
  }

  /**
   * Get all submissions for a tax year
   */
  async getSubmissionsForTaxYear(taxYear: string): Promise<HMRCSubmission[]> {
    return await this.hmrcSubmissionRepository.find({
      where: { taxYear },
      relations: ['payrollRun'],
      order: { submissionDate: 'DESC' },
    });
  }

  /**
   * Retry failed submission
   */
  async retrySubmission(submissionId: string): Promise<HMRCSubmissionResponse> {
    const submission = await this.hmrcSubmissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (!submission.canRetry()) {
      throw new Error('Submission cannot be retried');
    }

    // Reset submission status
    submission.status = HMRCSubmissionStatus.DRAFT;
    submission.errorMessage = null;
    await this.hmrcSubmissionRepository.save(submission);

    return await this.submitPayroll(submissionId);
  }

  /**
   * Get HMRC submission statistics
   */
  async getSubmissionStatistics(taxYear?: string): Promise<any> {
    const query = this.hmrcSubmissionRepository.createQueryBuilder('submission');
    
    if (taxYear) {
      query.where('submission.taxYear = :taxYear', { taxYear });
    }

    const submissions = await query.getMany();

    const stats = {
      total: submissions.length,
      submitted: submissions.filter(s => s.status === HMRCSubmissionStatus.SUBMITTED).length,
      accepted: submissions.filter(s => s.status === HMRCSubmissionStatus.ACCEPTED).length,
      rejected: submissions.filter(s => s.status === HMRCSubmissionStatus.REJECTED).length,
      processing: submissions.filter(s => s.status === HMRCSubmissionStatus.PROCESSING).length,
      totalGrossPay: submissions.reduce((sum, s) => sum + s.totalGrossPay, 0),
      totalTax: submissions.reduce((sum, s) => sum + s.totalTax, 0),
      totalNationalInsurance: submissions.reduce((sum, s) => sum + s.totalNationalInsurance, 0),
    };

    return stats;
  }

  /**
   * Validate HMRC configuration
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      console.error('HMRC configuration validationfailed:', error.message);
      return false;
    }
  }
}

export default HMRCService;
