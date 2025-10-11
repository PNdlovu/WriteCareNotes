import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus, InvoiceType } from '../entities/Invoice';
import { InvoiceLineItem, LineItemType } from '../entities/InvoiceLineItem';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/Payment';
import { ResidentBilling } from '../entities/ResidentBilling';

export interface InvoiceData {
  type: InvoiceType;
  recipientName: string;
  recipientAddress: string;
  recipientPostcode?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  invoiceDate: Date;
  dueDate: Date;
  notes?: string;
  terms?: string;
  lineItems: InvoiceLineItemData[];
  residentBillingId?: string;
}

export interface InvoiceLineItemData {
  type: LineItemType;
  description: string;
  productCode?: string;
  serviceCode?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercentage?: number;
  taxRate?: number;
  notes?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  type?: InvoiceType;
  startDate?: Date;
  endDate?: Date;
  recipientName?: string;
  minAmount?: number;
  maxAmount?: number;
  isOverdue?: boolean;
}

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    privateinvoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceLineItem)
    privatelineItemRepository: Repository<InvoiceLineItem>,
    @InjectRepository(Payment)
    privatepaymentRepository: Repository<Payment>,
    @InjectRepository(ResidentBilling)
    privateresidentBillingRepository: Repository<ResidentBilling>,
  ) {}

  /**
   * Create a new invoice
   */
  async createInvoice(data: InvoiceData, createdBy: string): Promise<Invoice> {
    // Create invoice
    const invoice = this.invoiceRepository.create({
      ...data,
      invoiceNumber: this.generateInvoiceNumber(),
      status: InvoiceStatus.DRAFT,
      createdBy,
      updatedBy: createdBy,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create line items
    for (let i = 0; i < data.lineItems.length; i++) {
      const lineItemData = data.lineItems[i];
      const lineItem = this.lineItemRepository.create({
        invoiceId: savedInvoice.id,
        lineNumber: i + 1,
        ...lineItemData,
        taxRate: lineItemData.taxRate || 20, // Default VAT rate
        createdBy,
        updatedBy: createdBy,
      });

      lineItem.calculateLineTotal();
      await this.lineItemRepository.save(lineItem);
    }

    // Calculate invoice totals
    await this.calculateInvoiceTotals(savedInvoice.id);

    return await this.getInvoice(savedInvoice.id);
  }

  /**
   * Calculate invoice totals
   */
  async calculateInvoiceTotals(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['lineItems'],
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate subtotal
    invoice.subtotal = invoice.lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

    // Calculate tax amount
    invoice.taxAmount = invoice.lineItems.reduce((sum, item) => sum + item.taxAmount, 0);

    // Calculate total
    invoice.totalAmount = invoice.subtotal + invoice.taxAmount - invoice.discountAmount;

    // Calculate balance
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

    await this.invoiceRepository.save(invoice);
  }

  /**
   * Send invoice to recipient
   */
  async sendInvoice(invoiceId: string, sentBy: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be sent');
    }

    // Mark as sent
    invoice.markAsSent();
    invoice.updatedBy = sentBy;

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // TODO: Send email notification to recipient
    // await this.sendEmailNotification(invoice);

    return savedInvoice;
  }

  /**
   * Record payment for invoice
   */
  async recordPayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      method: PaymentMethod;
      paymentDate: Date;
      transactionId?: string;
      bankReference?: string;
      payerName?: string;
      payerEmail?: string;
      payerPhone?: string;
      notes?: string;
    },
    recordedBy: string
  ): Promise<Payment> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.canBePaid()) {
      throw new Error('Invoice cannot be paid in current status');
    }

    // Create payment
    const payment = this.paymentRepository.create({
      invoiceId: invoice.id,
      paymentReference: this.generatePaymentReference(),
      ...paymentData,
      status: PaymentStatus.COMPLETED,
      processedAt: new Date(),
      createdBy: recordedBy,
      updatedBy: recordedBy,
    });

    payment.calculateNetAmount();
    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice
    invoice.paidAmount += payment.netAmount;
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

    if (invoice.balanceAmount <= 0) {
      invoice.markAsPaid();
    }

    await this.invoiceRepository.save(invoice);

    return savedPayment;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    return await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['lineItems', 'payments', 'residentBilling'],
    });
  }

  /**
   * Get invoices with filters
   */
  async getInvoices(filters: InvoiceFilters = {}, limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    const query = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.lineItems', 'lineItems')
      .leftJoinAndSelect('invoice.payments', 'payments');

    if (filters.status) {
      query.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters.type) {
      query.andWhere('invoice.type = :type', { type: filters.type });
    }

    if (filters.startDate) {
      query.andWhere('invoice.invoiceDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('invoice.invoiceDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.recipientName) {
      query.andWhere('invoice.recipientName ILIKE :recipientName', { 
        recipientName: `%${filters.recipientName}%` 
      });
    }

    if (filters.minAmount) {
      query.andWhere('invoice.totalAmount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount) {
      query.andWhere('invoice.totalAmount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    if (filters.isOverdue) {
      query.andWhere('invoice.dueDate < :today', { today: new Date() });
      query.andWhere('invoice.status NOT IN (:...paidStatuses)', { 
        paidStatuses: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] 
      });
    }

    return await query
      .orderBy('invoice.invoiceDate', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    return await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.dueDate < :today', { today: new Date() })
      .andWhere('invoice.status NOT IN (:...paidStatuses)', { 
        paidStatuses: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] 
      })
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStatistics(period: 'month' | 'quarter' | 'year'): Promise<any> {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceDate BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate: now 
      })
      .getMany();

    const stats = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      paidAmount: invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0),
      outstandingAmount: invoices.reduce((sum, invoice) => sum + invoice.balanceAmount, 0),
      overdueCount: invoices.filter(invoice => invoice.isOverdue()).length,
      overdueAmount: invoices
        .filter(invoice => invoice.isOverdue())
        .reduce((sum, invoice) => sum + invoice.balanceAmount, 0),
      averageInvoiceValue: invoices.length > 0 ? 
        invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0) / invoices.length : 0,
      paymentRate: 0,
    };

    if (stats.totalAmount > 0) {
      stats.paymentRate = (stats.paidAmount / stats.totalAmount) * 100;
    }

    return stats;
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId: string, cancelledBy: string, reason: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.canBeCancelled()) {
      throw new Error('Invoice cannot be cancelled in current status');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.notes = invoice.notes ? `${invoice.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
    invoice.updatedBy = cancelledBy;

    return await this.invoiceRepository.save(invoice);
  }

  /**
   * Generate recurring invoices
   */
  async generateRecurringInvoices(): Promise<Invoice[]> {
    // Find resident billing records that need recurring invoices
    const residentBillings = await this.residentBillingRepository
      .createQueryBuilder('billing')
      .where('billing.isRecurring = true')
      .andWhere('billing.nextInvoiceDate <= :today', { today: new Date() })
      .getMany();

    constgeneratedInvoices: Invoice[] = [];

    for (const billing of residentBillings) {
      try {
        constinvoiceData: InvoiceData = {
          type: InvoiceType.RESIDENT_BILLING,
          recipientName: billing.residentName,
          recipientAddress: billing.residentAddress,
          recipientEmail: billing.residentEmail,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          lineItems: billing.serviceCharges.map(charge => ({
            type: LineItemType.SERVICE,
            description: charge.description,
            quantity: 1,
            unitPrice: charge.amount,
            taxRate: 20, // VAT rate
          })),
          residentBillingId: billing.id,
        };

        const invoice = await this.createInvoice(invoiceData, 'system');
        generatedInvoices.push(invoice);

        // Update next invoice date
        billing.nextInvoiceDate = new Date(billing.nextInvoiceDate.getTime() + billing.billingFrequency * 24 * 60 * 60 * 1000);
        await this.residentBillingRepository.save(billing);

      } catch (error) {
        console.error(`Failed to generate recurring invoice for billing ${billing.id}:`, error);
      }
    }

    return generatedInvoices;
  }

  // Helper methods
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INV${year}${month}${random}`;
  }

  private generatePaymentReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `PAY${timestamp}${random}`;
  }
}

export default InvoiceService;
