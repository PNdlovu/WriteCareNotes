/**
 * @fileoverview Comprehensive invoice management service with healthcare billing features,
 * @module Financial/InvoiceService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive invoice management service with healthcare billing features,
 */

import { EventEmitter2 } from "eventemitter2";
import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';

/**
 * @fileoverview Invoice Service for WriteCareNotes
 * @module InvoiceService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive invoice management service with healthcare billing features,
 * payment tracking, and compliance reporting for care home operations.
 * 
 * @compliance
 * - PCI DSS (Payment Card Industry Data Security Standard)
 * - SOX (Sarbanes-Oxley Act) compliance
 * - GDPR Article 6 & 9 (Financial data processing)
 * - FCA (Financial Conduct Authority) regulations
 * - NHS Digital standards for healthcare billing
 */

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: 'resident_care' | 'medication' | 'equipment' | 'services' | 'other';
  status: 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
  clientId: string;
  clientName: string;
  clientType: 'resident' | 'family' | 'local_authority' | 'nhs' | 'insurance' | 'private';
  residentId?: string;
  residentName?: string;
  careHomeId: string;
  organizationId: string;
  
  // Financial details
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  
  // Dates
  issueDate: Date;
  dueDate: Date;
  serviceStartDate: Date;
  serviceEndDate: Date;
  paidDate?: Date;
  
  // Payment terms
  paymentTerms: string;
  paymentMethod?: string;
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Additional details
  description?: string;
  notes?: string;
  attachments?: string[];
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy?: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
  vatAmount: number;
  serviceDate?: Date;
  accountCode?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentReference: string;
  paymentMethod: 'bank_transfer' | 'card' | 'cash' | 'cheque' | 'direct_debit' | 'standing_order';
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  paymentDate: Date;
  processedDate?: Date;
  transactionId?: string;
  payerName?: string;
  payerReference?: string;
  bankReference?: string;
  notes?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceReport {
  reportType: 'summary' | 'aged_debtors' | 'payment_analysis' | 'vat_return';
  reportDate: Date;
  periodStart: Date;
  periodEnd: Date;
  organizationId: string;
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  data: any;
}

export interface AgedDebtorAnalysis {
  current: { count: number; amount: number; };
  days30: { count: number; amount: number; };
  days60: { count: number; amount: number; };
  days90: { count: number; amount: number; };
  over90: { count: number; amount: number; };
}

export class InvoiceService extends EventEmitter2 {
  privateinvoiceRepository: Repository<any>;
  privatepaymentRepository: Repository<any>;
  privateauditTrailService: AuditService;
  privatenotificationService: NotificationService;

  const ructor() {
    super();
    this.invoiceRepository = AppDataSource.getRepository('Invoice');
    this.paymentRepository = AppDataSource.getRepository('Payment');
    this.auditTrailService = new AuditTrailService();
    this.notificationService = new NotificationService();
  }

  async createInvoice(
    invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<Invoice> {
    const invoice: Invoice = {
      id: this.generateId(),
      invoiceNumber: await this.generateInvoiceNumber(invoiceData.careHomeId),
      ...invoiceData,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    // Calculate totals
    this.calculateInvoiceTotals(invoice);

    await this.invoiceRepository.save(invoice);

    await this.auditTrailService.log({
      action: 'invoice_created',
      entityType: 'invoice',
      entityId: invoice.id,
      userId,
      organizationId: invoice.organizationId,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        totalAmount: invoice.totalAmount
      }
    });

    this.emit('invoice_created', invoice);
    return invoice;
  }

  async updateInvoice(
    invoiceId: string,
    updates: Partial<Invoice>,
    userId: string,
    organizationId: string
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, organizationId }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Cannot modify paid invoice');
    }

    Object.assign(invoice, updates, { 
      updatedAt: new Date(),
      lastModifiedBy: userId
    });

    // Recalculate totals if line items changed
    if (updates.lineItems) {
      this.calculateInvoiceTotals(invoice);
    }

    await this.invoiceRepository.save(invoice);

    await this.auditTrailService.log({
      action: 'invoice_updated',
      entityType: 'invoice',
      entityId: invoiceId,
      userId,
      organizationId,
      details: { changes: updates }
    });

    this.emit('invoice_updated', invoice);
    return invoice;
  }

  async sendInvoice(
    invoiceId: string,
    userId: string,
    organizationId: string,
    sendMethod: 'email' | 'post' | 'portal' = 'email'
  ): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, organizationId }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'draft' && invoice.status !== 'pending') {
      throw new Error('Invoice cannot be sent in current status');
    }

    // Update status
    invoice.status = 'sent';
    invoice.updatedAt = new Date();
    await this.invoiceRepository.save(invoice);

    // Send notification based on method
    await this.sendInvoiceNotification(invoice, sendMethod);

    await this.auditTrailService.log({
      action: 'invoice_sent',
      entityType: 'invoice',
      entityId: invoiceId,
      userId,
      organizationId,
      details: { sendMethod, invoiceNumber: invoice.invoiceNumber }
    });

    this.emit('invoice_sent', { invoice, sendMethod });
  }

  async recordPayment(
    paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<Payment> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: paymentData.invoiceId, organizationId: paymentData.organizationId }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const payment: Payment = {
      id: this.generateId(),
      ...paymentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.paymentRepository.save(payment);

    // Update invoice status if fully paid
    const totalPaid = await this.calculateTotalPaid(invoice.id);
    if (totalPaid >= invoice.totalAmount) {
      invoice.status = 'paid';
      invoice.paidDate = new Date();
      await this.invoiceRepository.save(invoice);
    }

    await this.auditTrailService.log({
      action: 'payment_recorded',
      entityType: 'payment',
      entityId: payment.id,
      userId,
      organizationId: payment.organizationId,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod
      }
    });

    this.emit('payment_recorded', { payment, invoice });
    return payment;
  }

  async generateAgedDebtorReport(
    organizationId: string,
    asOfDate?: Date
  ): Promise<AgedDebtorAnalysis> {
    const reportDate = asOfDate || new Date();
    
    const outstandingInvoices = await this.invoiceRepository.find({
      where: {
        organizationId,
        status: ['sent', 'overdue']
      }
    });

    const analysis: AgedDebtorAnalysis = {
      current: { count: 0, amount: 0 },
      days30: { count: 0, amount: 0 },
      days60: { count: 0, amount: 0 },
      days90: { count: 0, amount: 0 },
      over90: { count: 0, amount: 0 }
    };

    for (const invoice of outstandingInvoices) {
      const daysPastDue = Math.floor(
        (reportDate.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const outstandingAmount = invoice.totalAmount - await this.calculateTotalPaid(invoice.id);

      if (daysPastDue <= 0) {
        analysis.current.count++;
        analysis.current.amount += outstandingAmount;
      } else if (daysPastDue <= 30) {
        analysis.days30.count++;
        analysis.days30.amount += outstandingAmount;
      } else if (daysPastDue <= 60) {
        analysis.days60.count++;
        analysis.days60.amount += outstandingAmount;
      } else if (daysPastDue <= 90) {
        analysis.days90.count++;
        analysis.days90.amount += outstandingAmount;
      } else {
        analysis.over90.count++;
        analysis.over90.amount += outstandingAmount;
      }
    }

    return analysis;
  }

  async getInvoicesByOrganization(
    organizationId: string,
    filters?: {
      status?: string;
      clientType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      residentId?: string;
    }
  ): Promise<Invoice[]> {
    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
      .where('invoice.organizationId = :organizationId', { organizationId });

    if (filters?.status) {
      queryBuilder.andWhere('invoice.status = :status', { status: filters.status });
    }

    if (filters?.clientType) {
      queryBuilder.andWhere('invoice.clientType = :clientType', { clientType: filters.clientType });
    }

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('invoice.issueDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });
    }

    if (filters?.residentId) {
      queryBuilder.andWhere('invoice.residentId = :residentId', { residentId: filters.residentId });
    }

    return await queryBuilder.orderBy('invoice.issueDate', 'DESC').getMany();
  }

  async checkOverdueInvoices(organizationId: string): Promise<Invoice[]> {
    const today = new Date();
    
    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        organizationId,
        status: 'sent',
        dueDate: { $lt: today }
      }
    });

    // Update status to overdue and send notifications
    for (const invoice of overdueInvoices) {
      invoice.status = 'overdue';
      await this.invoiceRepository.save(invoice);

      await this.sendOverdueNotification(invoice);
    }

    return overdueInvoices;
  }

  private calculateInvoiceTotals(invoice: Invoice): void {
    let subtotal = 0;
    let totalVat = 0;

    for (const lineItem of invoice.lineItems) {
      lineItem.totalPrice = lineItem.quantity * lineItem.unitPrice;
      lineItem.vatAmount = lineItem.totalPrice * (lineItem.vatRate / 100);
      
      subtotal += lineItem.totalPrice;
      totalVat += lineItem.vatAmount;
    }

    invoice.subtotal = subtotal;
    invoice.vatAmount = totalVat;
    invoice.totalAmount = subtotal + totalVat;
  }

  private async calculateTotalPaid(invoiceId: string): Promise<number> {
    const payments = await this.paymentRepository.find({
      where: {
        invoiceId,
        paymentStatus: ['completed', 'processing']
      }
    });

    return payments.reduce((total, payment) => total + payment.amount, 0);
  }

  private async generateInvoiceNumber(careHomeId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Get last invoice number for this care home
    const lastInvoice = await this.invoiceRepository.findOne({
      where: { careHomeId },
      order: { createdAt: 'DESC' }
    });

    let sequenceNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber.includes(`${year}${month}`)) {
      const parts = lastInvoice.invoiceNumber.split('-');
      sequenceNumber = parseInt(parts[parts.length - 1]) + 1;
    }

    return `INV-${year}${month}-${sequenceNumber.toString().padStart(4, '0')}`;
  }

  private async sendInvoiceNotification(invoice: Invoice, sendMethod: string): Promise<void> {
    await this.notificationService.send({
      type: 'invoice_sent',
      recipients: [invoice.clientId],
      organizationId: invoice.organizationId,
      title: `Invoice ${invoice.invoiceNumber}`,
      message: `Your invoice for ${invoice.totalAmount} ${invoice.currency} is now available`,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        sendMethod
      }
    });
  }

  private async sendOverdueNotification(invoice: Invoice): Promise<void> {
    await this.notificationService.send({
      type: 'invoice_overdue',
      recipients: [invoice.clientId],
      organizationId: invoice.organizationId,
      title: `Overdue Invoice ${invoice.invoiceNumber}`,
      message: `Invoice ${invoice.invoiceNumber} for ${invoice.totalAmount} ${invoice.currency} is now overdue`,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        daysPastDue: Math.floor(
          (new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    });
  }

  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
