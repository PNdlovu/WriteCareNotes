import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChildBilling, BritishIslesJurisdiction, ChildFundingSource, BillingFrequency } from '../entities/ChildBilling';
import { Child } from '../entities/Child';
import { Invoice, InvoiceType } from '../../finance/entities/Invoice';
import { InvoiceLineItem, LineItemType } from '../../finance/entities/InvoiceLineItem';
import { LeavingCareFinances } from '../../leavingcare/entities/LeavingCareFinances';
import { InvoiceService } from '../../finance/services/InvoiceService';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CreateChildBillingRequest {
  childId: string;
  jurisdiction: BritishIslesJurisdiction;
  primaryFundingSource: ChildFundingSource;
  primaryFunderName: string;
  localAuthorityCode?: string;
  dailyRate: number;
  billingFrequency: BillingFrequency;
  paymentTermsDays?: number;
  placementStartDate: Date;
  socialWorkerName: string;
  socialWorkerEmail: string;
  socialWorkerPhone: string;
  invoiceAddress: string;
  invoicePostcode: string;
  invoiceEmail?: string;
  serviceCharges?: any[];
  personalAllowances?: any;
  fundingAllocations?: any[];
  notes?: string;
  createdBy: string;
}

export interface UpdateChildBillingRequest {
  dailyRate?: number;
  billingFrequency?: BillingFrequency;
  paymentTermsDays?: number;
  placementEndDate?: Date;
  socialWorkerName?: string;
  socialWorkerEmail?: string;
  socialWorkerPhone?: string;
  invoiceAddress?: string;
  invoicePostcode?: string;
  serviceCharges?: any[];
  personalAllowances?: any;
  notes?: string;
  updatedBy: string;
}

export interface GenerateInvoiceRequest {
  billingId: string;
  invoiceDate: Date;
  dueDate?: Date;
  includePersonalAllowances?: boolean;
  notes?: string;
  createdBy: string;
}

export interface FinancialReportFilter {
  jurisdiction?: BritishIslesJurisdiction;
  fundingSource?: ChildFundingSource;
  startDate?: Date;
  endDate?: Date;
  hasArrears?: boolean;
  hasDispute?: boolean;
}

/**
 * ChildFinanceIntegrationService
 * 
 * Comprehensive finance service for children's residential care across all 8 British Isles jurisdictions.
 * Integrates ChildBilling with existing finance services while maintaining clean separation of concerns.
 * 
 * KeyFeatures:
 * - Auto-generate local authority invoices (monthly/quarterly)
 * - Calculate placement costs with service charges
 * - Track payment status and arrears
 * - Generate financial reports for IRO/social workers
 * - Handle disputes and resolution
 * - Transition to LeavingCareFinances at 16+
 * - Support multi-funder (jointly funded) placements
 * - Compliance tracking per jurisdiction
 * 
 * IMPORTANT: This service INTEGRATES with existing services, does NOT duplicatethem:
 * - Uses InvoiceService for invoice generation (not duplicating)
 * - Uses Child entity for child data (not duplicating)
 * - Uses LeavingCareFinances for 16+ transition (not duplicating)
 */
@Injectable()
export class ChildFinanceIntegrationService {
  const ructor(
    @InjectRepository(ChildBilling)
    privatechildBillingRepository: Repository<ChildBilling>,
    @InjectRepository(Child)
    privatechildRepository: Repository<Child>,
    @InjectRepository(Invoice)
    privateinvoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceLineItem)
    privateinvoiceLineItemRepository: Repository<InvoiceLineItem>,
    @InjectRepository(LeavingCareFinances)
    privateleavingCareFinancesRepository: Repository<LeavingCareFinances>,
    privateinvoiceService: InvoiceService, // REUSE existing service
    privateeventEmitter: EventEmitter2,
  ) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create new child billing record
   */
  async createChildBilling(request: CreateChildBillingRequest): Promise<ChildBilling> {
    // Verify child exists
    const child = await this.childRepository.findOne({
      where: { id: request.childId },
    });

    if (!child) {
      throw new NotFoundException(`Child with ID ${request.childId} not found`);
    }

    // Check if active billing already exists
    const existingBilling = await this.childBillingRepository.findOne({
      where: { 
        childId: request.childId,
        isActive: true,
      },
    });

    if (existingBilling) {
      throw new BadRequestException(`Active billing record already exists for child ${request.childId}`);
    }

    // Create billing record
    const billing = this.childBillingRepository.create({
      ...request,
      serviceCharges: request.serviceCharges || [],
      personalAllowances: request.personalAllowances || {
        weeklyPocketMoney: 0,
        clothingAllowanceQuarterly: 0,
        birthdayGrant: 0,
        festivalGrants: 0,
        savingsContribution: 0,
        educationAllowance: 0,
        totalMonthly: 0,
      },
      fundingAllocations: request.fundingAllocations || [],
      updatedBy: request.createdBy,
    });

    // Calculate all rates from daily rate
    billing.calculateAllRates();
    billing.calculateTotalWeeklyServiceCharges();
    billing.calculateTotalPersonalAllowances();
    billing.setNextInvoiceDate();

    const savedBilling = await this.childBillingRepository.save(billing);

    // Emit event
    this.eventEmitter.emit('child.billing.created', {
      billingId: savedBilling.id,
      childId: savedBilling.childId,
      jurisdiction: savedBilling.jurisdiction,
      dailyRate: savedBilling.dailyRate,
    });

    return savedBilling;
  }

  /**
   * Get child billing by child ID
   */
  async getChildBilling(childId: string): Promise<ChildBilling | null> {
    return await this.childBillingRepository.findOne({
      where: { childId, isActive: true },
      relations: ['child', 'invoices'],
    });
  }

  /**
   * Get billing by ID
   */
  async getBillingById(billingId: string): Promise<ChildBilling | null> {
    return await this.childBillingRepository.findOne({
      where: { id: billingId },
      relations: ['child', 'invoices'],
    });
  }

  /**
   * Update child billing
   */
  async updateChildBilling(
    billingId: string, 
    request: UpdateChildBillingRequest
  ): Promise<ChildBilling> {
    const billing = await this.childBillingRepository.findOne({
      where: { id: billingId },
    });

    if (!billing) {
      throw new NotFoundException(`Billing record ${billingId} not found`);
    }

    // Update fields
    Object.assign(billing, request);

    // Recalculate if daily rate changed
    if (request.dailyRate) {
      billing.calculateAllRates();
    }

    // Recalculate if service charges changed
    if (request.serviceCharges) {
      billing.calculateTotalWeeklyServiceCharges();
    }

    // Recalculate if personal allowances changed
    if (request.personalAllowances) {
      billing.calculateTotalPersonalAllowances();
    }

    const savedBilling = await this.childBillingRepository.save(billing);

    // Emit event
    this.eventEmitter.emit('child.billing.updated', {
      billingId: savedBilling.id,
      childId: savedBilling.childId,
      changes: request,
    });

    return savedBilling;
  }

  /**
   * Deactivate child billing (soft delete)
   */
  async deactivateChildBilling(billingId: string, deactivatedBy: string): Promise<ChildBilling> {
    const billing = await this.childBillingRepository.findOne({
      where: { id: billingId },
    });

    if (!billing) {
      throw new NotFoundException(`Billing record ${billingId} not found`);
    }

    billing.isActive = false;
    billing.placementEndDate = new Date();
    billing.updatedBy = deactivatedBy;

    const savedBilling = await this.childBillingRepository.save(billing);

    // Emit event
    this.eventEmitter.emit('child.billing.deactivated', {
      billingId: savedBilling.id,
      childId: savedBilling.childId,
      placementEndDate: savedBilling.placementEndDate,
    });

    return savedBilling;
  }

  // ============================================
  // INVOICE GENERATION
  // ============================================

  /**
   * Generate invoice for child's placement
   * USES existing InvoiceService - NO duplication
   */
  async generateInvoice(request: GenerateInvoiceRequest): Promise<Invoice> {
    const billing = await this.childBillingRepository.findOne({
      where: { id: request.billingId },
      relations: ['child'],
    });

    if (!billing) {
      throw new NotFoundException(`Billing record ${request.billingId} not found`);
    }

    // Calculate invoice amount based on billing frequency
    let invoiceAmount = 0;
    const lineItems: any[] = [];

    switch (billing.billingFrequency) {
      case BillingFrequency.WEEKLY:
        invoiceAmount = billing.weeklyRate;
        lineItems.push({
          type: LineItemType.SERVICE,
          description: `Weekly placement fee for ${billing.child.firstName} ${billing.child.lastName}`,
          quantity: 1,
          unitPrice: billing.weeklyRate,
          taxRate: 0, // LA funding usually VAT exempt
        });
        break;

      case BillingFrequency.MONTHLY:
        invoiceAmount = billing.monthlyRate;
        lineItems.push({
          type: LineItemType.SERVICE,
          description: `Monthly placement fee for ${billing.child.firstName} ${billing.child.lastName}`,
          quantity: 1,
          unitPrice: billing.monthlyRate,
          taxRate: 0,
        });
        break;

      case BillingFrequency.QUARTERLY:
        invoiceAmount = billing.monthlyRate * 3;
        lineItems.push({
          type: LineItemType.SERVICE,
          description: `Quarterly placement fee for ${billing.child.firstName} ${billing.child.lastName}`,
          quantity: 3,
          unit: 'months',
          unitPrice: billing.monthlyRate,
          taxRate: 0,
        });
        break;

      case BillingFrequency.ANNUAL:
        invoiceAmount = billing.annualRate;
        lineItems.push({
          type: LineItemType.SERVICE,
          description: `Annual placement fee for ${billing.child.firstName} ${billing.child.lastName}`,
          quantity: 1,
          unitPrice: billing.annualRate,
          taxRate: 0,
        });
        break;
    }

    // Add active service charges
    const activeServiceCharges = billing.getActiveServiceCharges();
    for (const charge of activeServiceCharges) {
      lineItems.push({
        type: LineItemType.SERVICE,
        description: charge.description,
        quantity: 1,
        unitPrice: charge.amount,
        notes: charge.notes,
        taxRate: 0,
      });
      invoiceAmount += charge.amount;
    }

    // Add personal allowances if requested
    if (request.includePersonalAllowances && billing.personalAllowances) {
      lineItems.push({
        type: LineItemType.SERVICE,
        description: 'Personal allowances (pocket money, clothing, education)',
        quantity: 1,
        unitPrice: billing.personalAllowances.totalMonthly,
        notes: `Pocket money: £${billing.personalAllowances.weeklyPocketMoney}/week, Clothing: £${billing.personalAllowances.clothingAllowanceQuarterly}/quarter`,
        taxRate: 0,
      });
      invoiceAmount += billing.personalAllowances.totalMonthly;
    }

    // Calculate due date
    const dueDate = request.dueDate || new Date(
      request.invoiceDate.getTime() + (billing.paymentTermsDays * 24 * 60 * 60 * 1000)
    );

    // Create invoice using EXISTING InvoiceService (integration, not duplication)
    const invoice = await this.invoiceService.createInvoice(
      {
        type: InvoiceType.CHILD_PLACEMENT,
        recipientName: billing.primaryFunderName,
        recipientAddress: billing.invoiceAddress,
        recipientPostcode: billing.invoicePostcode,
        recipientEmail: billing.invoiceEmail,
        invoiceDate: request.invoiceDate,
        dueDate: dueDate,
        notes: request.notes || `Invoice for ${billing.child.firstName} ${billing.child.lastName} - ${billing.jurisdiction} placement`,
        terms: `Payment due within ${billing.paymentTermsDays} days. PurchaseOrder: ${billing.purchaseOrderNumber || 'N/A'}`,
        lineItems: lineItems,
      },
      request.createdBy
    );

    // Link invoice to child billing
    invoice.childBillingId = billing.id;
    await this.invoiceRepository.save(invoice);

    // Update billing payment history
    billing.addInvoiceToHistory(
      invoice.id,
      invoice.invoiceNumber,
      request.invoiceDate,
      invoice.totalAmount,
      dueDate
    );

    await this.childBillingRepository.save(billing);

    // Emit event
    this.eventEmitter.emit('child.invoice.generated', {
      invoiceId: invoice.id,
      billingId: billing.id,
      childId: billing.childId,
      amount: invoice.totalAmount,
    });

    return invoice;
  }

  /**
   * Auto-generate recurring invoices (cron job runs daily at 9am)
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async generateRecurringInvoices(): Promise<Invoice[]> {
    console.log('🕒 Running auto-invoice generation for children\'s placements...');

    // Find all active billings with due invoices
    const billings = await this.childBillingRepository
      .createQueryBuilder('billing')
      .leftJoinAndSelect('billing.child', 'child')
      .where('billing.isRecurring = :isRecurring', { isRecurring: true })
      .andWhere('billing.isActive = :isActive', { isActive: true })
      .andWhere('billing.nextInvoiceDate <= :today', { today: new Date() })
      .getMany();

    console.log(`Found ${billings.length} billings ready for invoicing`);

    const generatedInvoices: Invoice[] = [];

    for (const billing of billings) {
      try {
        const invoice = await this.generateInvoice({
          billingId: billing.id,
          invoiceDate: new Date(),
          includePersonalAllowances: true,
          notes: `Auto-generated ${billing.billingFrequency.toLowerCase()} invoice`,
          createdBy: 'system',
        });

        generatedInvoices.push(invoice);

        // Update next invoice date
        billing.setNextInvoiceDate();
        await this.childBillingRepository.save(billing);

        console.log(`✅ Generated invoice ${invoice.invoiceNumber} for child ${billing.childId}`);

      } catch (error) {
        console.error(`❌ Failed to generate invoice for billing ${billing.id}:`, error);
        
        // Emit error event
        this.eventEmitter.emit('child.invoice.generation.failed', {
          billingId: billing.id,
          childId: billing.childId,
          error: error.message,
        });
      }
    }

    console.log(`✅ Auto-invoice generation complete. Generated ${generatedInvoices.length} invoices.`);

    return generatedInvoices;
  }

  // ============================================
  // PAYMENT TRACKING
  // ============================================

  /**
   * Record payment for child's invoice
   */
  async recordPayment(
    billingId: string,
    invoiceId: string,
    amount: number,
    paymentDate: Date,
    paymentReference: string,
    recordedBy: string
  ): Promise<void> {
    const billing = await this.childBillingRepository.findOne({
      where: { id: billingId },
    });

    if (!billing) {
      throw new NotFoundException(`Billing record ${billingId} not found`);
    }

    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    // Use existing InvoiceService to record payment
    await this.invoiceService.recordPayment(
      invoiceId,
      {
        amount,
        method: 'BANK_TRANSFER' as any, // LA payments are usually bank transfers
        paymentDate,
        bankReference: paymentReference,
        payerName: billing.primaryFunderName,
        notes: `Payment for ${billing.child?.firstName} ${billing.child?.lastName} placement`,
      },
      recordedBy
    );

    // Update child billing payment history
    billing.recordPayment(
      invoiceId,
      invoice.invoiceNumber,
      amount,
      paymentDate,
      paymentReference
    );

    await this.childBillingRepository.save(billing);

    // Emit event
    this.eventEmitter.emit('child.payment.recorded', {
      billingId: billing.id,
      invoiceId,
      amount,
      paymentDate,
    });
  }

  /**
   * Get overdue invoices for all children
   */
  async getOverdueInvoices(): Promise<{
    billing: ChildBilling;
    overdueInvoices: any[];
    totalOverdue: number;
  }[]> {
    const billings = await this.childBillingRepository.find({
      where: { isActive: true },
      relations: ['child'],
    });

    const results = [];

    for (const billing of billings) {
      const overdueInvoices = billing.getOverdueInvoices();
      
      if (overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce(
          (sum, inv) => sum + inv.balanceAmount,
          0
        );

        results.push({
          billing,
          overdueInvoices,
          totalOverdue,
        });
      }
    }

    return results;
  }

  // ============================================
  // FINANCIAL REPORTING
  // ============================================

  /**
   * Get financial summary for all children's placements
   */
  async getFinancialSummary(filters: FinancialReportFilter = {}): Promise<any> {
    const query = this.childBillingRepository.createQueryBuilder('billing')
      .leftJoinAndSelect('billing.child', 'child')
      .where('billing.isActive = :isActive', { isActive: true });

    if (filters.jurisdiction) {
      query.andWhere('billing.jurisdiction = :jurisdiction', { 
        jurisdiction: filters.jurisdiction 
      });
    }

    if (filters.fundingSource) {
      query.andWhere('billing.primaryFundingSource = :fundingSource', { 
        fundingSource: filters.fundingSource 
      });
    }

    if (filters.hasArrears) {
      query.andWhere('billing.currentArrears > 0');
    }

    if (filters.hasDispute) {
      query.andWhere('billing.hasDispute = true');
    }

    const billings = await query.getMany();

    return {
      totalChildren: billings.length,
      totalWeeklyPlacementCost: billings.reduce((sum, b) => sum + b.getTotalWeeklyCost(), 0),
      totalMonthlyPlacementCost: billings.reduce((sum, b) => sum + b.getTotalMonthlyCost(), 0),
      totalAnnualPlacementCost: billings.reduce((sum, b) => sum + b.annualRate, 0),
      totalInvoiced: billings.reduce((sum, b) => sum + b.totalInvoiced, 0),
      totalPaid: billings.reduce((sum, b) => sum + b.totalPaid, 0),
      totalArrears: billings.reduce((sum, b) => sum + b.currentArrears, 0),
      averagePaymentRate: billings.length > 0 
        ? billings.reduce((sum, b) => sum + b.getPaymentRate(), 0) / billings.length 
        : 0,
      childrenWithArrears: billings.filter(b => b.currentArrears > 0).length,
      childrenWithDisputes: billings.filter(b => b.hasDispute).length,
      byJurisdiction: this.groupByJurisdiction(billings),
      byFundingSource: this.groupByFundingSource(billings),
    };
  }

  /**
   * Get financial report for specific child
   */
  async getChildFinancialReport(childId: string): Promise<any> {
    const billing = await this.getChildBilling(childId);

    if (!billing) {
      throw new NotFoundException(`No active billing found for child ${childId}`);
    }

    const child = billing.child;
    const summary = billing.getFinancialSummary();
    const jurisdictionReqs = billing.getJurisdictionRequirements();

    return {
      child: {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        dateOfBirth: child.dateOfBirth,
        age: this.calculateAge(child.dateOfBirth),
      },
      placement: {
        startDate: billing.placementStartDate,
        endDate: billing.placementEndDate,
        duration: this.calculatePlacementDuration(
          billing.placementStartDate,
          billing.placementEndDate
        ),
      },
      costs: {
        daily: billing.dailyRate,
        weekly: billing.weeklyRate,
        monthly: billing.monthlyRate,
        annual: billing.annualRate,
        serviceCharges: billing.totalWeeklyServiceCharges,
        personalAllowances: billing.personalAllowances,
      },
      funding: {
        primarySource: billing.primaryFundingSource,
        primaryFunder: billing.primaryFunderName,
        allocations: billing.fundingAllocations,
      },
      financial: {
        totalInvoiced: billing.totalInvoiced,
        totalPaid: billing.totalPaid,
        currentArrears: billing.currentArrears,
        paymentRate: billing.getPaymentRate(),
        overdueInvoices: billing.getOverdueInvoices(),
      },
      compliance: {
        jurisdiction: billing.jurisdiction,
        regulation: jurisdictionReqs.regulation,
        reviewFrequency: jurisdictionReqs.reviewFrequency,
      },
      summary,
    };
  }

  /**
   * Get IRO financial dashboard (for oversight)
   */
  async getIROFinancialDashboard(): Promise<any> {
    const allBillings = await this.childBillingRepository.find({
      where: { isActive: true },
      relations: ['child'],
    });

    const childrenWithArrears = allBillings.filter(b => b.currentArrears > 0);
    const childrenWithDisputes = allBillings.filter(b => b.hasDispute);
    const childrenApproaching16 = allBillings.filter(b => 
      b.shouldTransitionToLeavingCare(b.child.dateOfBirth)
    );

    return {
      overview: {
        totalChildren: allBillings.length,
        totalWeeklySpend: allBillings.reduce((sum, b) => sum + b.getTotalWeeklyCost(), 0),
        totalMonthlySpend: allBillings.reduce((sum, b) => sum + b.getTotalMonthlyCost(), 0),
        totalAnnualSpend: allBillings.reduce((sum, b) => sum + b.annualRate, 0),
      },
      financialHealth: {
        totalArrears: allBillings.reduce((sum, b) => sum + b.currentArrears, 0),
        childrenWithArrears: childrenWithArrears.length,
        averagePaymentRate: allBillings.length > 0
          ? allBillings.reduce((sum, b) => sum + b.getPaymentRate(), 0) / allBillings.length
          : 0,
      },
      alerts: {
        childrenWithDisputes: childrenWithDisputes.length,
        childrenApproaching16: childrenApproaching16.length,
        overdueInvoices: allBillings.reduce(
          (sum, b) => sum + b.getOverdueInvoices().length,
          0
        ),
      },
      byJurisdiction: this.groupByJurisdiction(allBillings),
    };
  }

  // ============================================
  // DISPUTE MANAGEMENT
  // ============================================

  /**
   * Raise dispute for billing
   */
  async raiseDispute(billingId: string, details: string, raisedBy: string): Promise<ChildBilling> {
    const billing = await this.childBillingRepository.findOne({
      where: { id: billingId },
    });

    if (!billing) {
      throw new NotFoundException(`Billing record ${billingId} not found`);
    }

    billing.raiseDispute(details);
    billing.updatedBy = raisedBy;

    const savedBilling = await this.childBillingRepository.save(billing);

    // Emit event
    this.eventEmitter.emit('child.billing.dispute.raised', {
      billingId: savedBilling.id,
      childId: savedBilling.childId,
      details,
    });

    return savedBilling;
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(billingId: string, resolvedBy: string): Promise<ChildBilling> {
    const billing = await this.childBillingRepository.findOne({
      where: { id: billingId },
    });

    if (!billing) {
      throw new NotFoundException(`Billing record ${billingId} not found`);
    }

    if (!billing.hasDispute) {
      throw new BadRequestException('No active dispute found');
    }

    billing.resolveDispute();
    billing.updatedBy = resolvedBy;

    const savedBilling = await this.childBillingRepository.save(billing);

    // Emit event
    this.eventEmitter.emit('child.billing.dispute.resolved', {
      billingId: savedBilling.id,
      childId: savedBilling.childId,
    });

    return savedBilling;
  }

  // ============================================
  // TRANSITION TO LEAVING CARE (16+)
  // ============================================

  /**
   * Transition child billing to leaving care finances (at 16)
   */
  async transitionToLeavingCare(billingId: string, transitionedBy: string): Promise<{
    billing: ChildBilling;
    leavingCareFinance: LeavingCareFinances;
  }> {
    const billing = await this.childBillingRepository.findOne({
      where: { id: billingId },
      relations: ['child'],
    });

    if (!billing) {
      throw new NotFoundException(`Billing record ${billingId} not found`);
    }

    if (billing.transitionedToLeavingCare) {
      throw new BadRequestException('Billing already transitioned to leaving care');
    }

    const child = billing.child;

    // Calculate age
    const age = this.calculateAge(child.dateOfBirth);

    if (age < 16) {
      throw new BadRequestException('Child must be at least 16 to transition to leaving care');
    }

    // Create LeavingCareFinances record
    const leavingCareFinance = this.leavingCareFinancesRepository.create({
      childId: child.id,
      settingUpHomeGrant: 2500, // Typical grant amount
      educationGrant: 0,
      drivingLessonsGrant: 0,
      monthlyAllowance: billing.personalAllowances.weeklyPocketMoney * 4.33,
      clothingAllowance: billing.personalAllowances.clothingAllowanceQuarterly,
      // Transfer savings if any
      savingsAccountBalance: 0,
      // Other fields with defaults
      createdBy: transitionedBy,
      updatedBy: transitionedBy,
    });

    const savedLeavingCareFinance = await this.leavingCareFinancesRepository.save(leavingCareFinance);

    // Update billing with transition
    billing.transitionedToLeavingCare = true;
    billing.leavingCareFinanceId = savedLeavingCareFinance.id;
    billing.transitionDate = new Date();
    billing.updatedBy = transitionedBy;

    // Deactivate recurring invoices (care leaver funding is different)
    billing.isRecurring = false;
    billing.isActive = false;

    const savedBilling = await this.childBillingRepository.save(billing);

    // Emit event
    this.eventEmitter.emit('child.billing.transitioned', {
      billingId: savedBilling.id,
      childId: savedBilling.childId,
      leavingCareFinanceId: savedLeavingCareFinance.id,
      age,
    });

    return {
      billing: savedBilling,
      leavingCareFinance: savedLeavingCareFinance,
    };
  }

  /**
   * Check all children approaching 16 for transition
   * Cron job runs weekly on Mondays at 10am
   */
  @Cron(CronExpression.EVERY_WEEK)
  async checkTransitionReadiness(): Promise<void> {
    console.log('🕒 Checking children approaching 16 for transition to leaving care...');

    const billings = await this.childBillingRepository.find({
      where: { 
        isActive: true,
        transitionedToLeavingCare: false,
      },
      relations: ['child'],
    });

    const approaching16 = billings.filter(billing => 
      billing.shouldTransitionToLeavingCare(billing.child.dateOfBirth)
    );

    console.log(`Found ${approaching16.length} children ready for transition`);

    for (const billing of approaching16) {
      // Emit notification event (actual transition requires manual approval)
      this.eventEmitter.emit('child.transition.ready', {
        billingId: billing.id,
        childId: billing.childId,
        childName: `${billing.child.firstName} ${billing.child.lastName}`,
        age: this.calculateAge(billing.child.dateOfBirth),
        socialWorker: billing.socialWorkerEmail,
      });
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Group billings by jurisdiction
   */
  private groupByJurisdiction(billings: ChildBilling[]): any {
    const grouped = {};
    
    for (const billing of billings) {
      if (!grouped[billing.jurisdiction]) {
        grouped[billing.jurisdiction] = {
          count: 0,
          totalWeeklyCost: 0,
          totalMonthlyCost: 0,
          totalArrears: 0,
        };
      }

      grouped[billing.jurisdiction].count++;
      grouped[billing.jurisdiction].totalWeeklyCost += billing.getTotalWeeklyCost();
      grouped[billing.jurisdiction].totalMonthlyCost += billing.getTotalMonthlyCost();
      grouped[billing.jurisdiction].totalArrears += billing.currentArrears;
    }

    return grouped;
  }

  /**
   * Group billings by funding source
   */
  private groupByFundingSource(billings: ChildBilling[]): any {
    const grouped = {};
    
    for (const billing of billings) {
      if (!grouped[billing.primaryFundingSource]) {
        grouped[billing.primaryFundingSource] = {
          count: 0,
          totalWeeklyCost: 0,
        };
      }

      grouped[billing.primaryFundingSource].count++;
      grouped[billing.primaryFundingSource].totalWeeklyCost += billing.getTotalWeeklyCost();
    }

    return grouped;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Calculate placement duration
   */
  private calculatePlacementDuration(startDate: Date, endDate?: Date): string {
    const end = endDate || new Date();
    const diffTime = Math.abs(end.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;

    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

    return parts.join(', ') || '0 days';
  }
}
