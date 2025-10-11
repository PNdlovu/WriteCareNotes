import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Invoice } from './Invoice';

export interface ServiceCharge {
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

@Entity('resident_billing')
export class ResidentBilling {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  residentId: string;

  @Column({ type: 'varchar', length: 200 })
  residentName: string;

  @Column({ type: 'varchar', length: 200 })
  residentAddress: string;

  @Column({ type: 'varchar', length: 20 })
  residentPostcode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  residentEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  residentPhone: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nextOfKinName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nextOfKinPhone: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nextOfKinEmail: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nextOfKinRelationship: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fundingSource: string; // Self-funded, Local Authority, NHS, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  localAuthority: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  socialWorkerName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  socialWorkerPhone: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  socialWorkerEmail: string;

  @Column({ type: 'json' })
  serviceCharges: ServiceCharge[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalMonthlyCharges: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  isRecurring: boolean;

  @Column({ type: 'int', default: 30 })
  billingFrequency: number; // Days between invoices

  @Column({ type: 'date', nullable: true })
  nextInvoiceDate: Date;

  @Column({ type: 'date', nullable: true })
  lastInvoiceDate: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => Invoice, invoice => invoice.residentBilling)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateTotalMonthlyCharges(): void {
    this.totalMonthlyCharges = this.serviceCharges
      .filter(charge => charge.isActive)
      .reduce((total, charge) => {
        let monthlyAmount = charge.amount;
        
        // Convert to monthly amount based on frequency
        switch (charge.frequency) {
          case 'daily':
            monthlyAmount = charge.amount * 30;
            break;
          case 'weekly':
            monthlyAmount = charge.amount * 4.33; // Average weeks per month
            break;
          case 'monthly':
            monthlyAmount = charge.amount;
            break;
          case 'yearly':
            monthlyAmount = charge.amount / 12;
            break;
        }
        
        return total + monthlyAmount;
      }, 0);
  }

  public getActiveServiceCharges(): ServiceCharge[] {
    return this.serviceCharges.filter(charge => charge.isActive);
  }

  public getInactiveServiceCharges(): ServiceCharge[] {
    return this.serviceCharges.filter(charge => !charge.isActive);
  }

  public addServiceCharge(charge: ServiceCharge): void {
    this.serviceCharges.push(charge);
    this.calculateTotalMonthlyCharges();
  }

  public removeServiceCharge(description: string): void {
    this.serviceCharges = this.serviceCharges.filter(charge => charge.description !== description);
    this.calculateTotalMonthlyCharges();
  }

  public updateServiceCharge(description: string, updatedCharge: ServiceCharge): void {
    const index = this.serviceCharges.findIndex(charge => charge.description === description);
    if (index !== -1) {
      this.serviceCharges[index] = updatedCharge;
      this.calculateTotalMonthlyCharges();
    }
  }

  public setNextInvoiceDate(): void {
    if (this.isRecurring && this.billingFrequency > 0) {
      const lastDate = this.lastInvoiceDate || new Date();
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + this.billingFrequency);
      this.nextInvoiceDate = nextDate;
    }
  }

  public isInvoiceDue(): boolean {
    if (!this.isRecurring || !this.nextInvoiceDate) return false;
    return new Date() >= this.nextInvoiceDate;
  }

  public getDaysUntilNextInvoice(): number {
    if (!this.nextInvoiceDate) return 0;
    
    const today = new Date();
    const diffTime = this.nextInvoiceDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getBillingSummary(): {
    id: string;
    residentName: string;
    residentId: string;
    totalMonthlyCharges: number;
    currency: string;
    isRecurring: boolean;
    billingFrequency: number;
    nextInvoiceDate: Date | null;
    lastInvoiceDate: Date | null;
    isActive: boolean;
    isInvoiceDue: boolean;
    daysUntilNextInvoice: number;
    activeServiceCharges: ServiceCharge[];
  } {
    return {
      id: this.id,
      residentName: this.residentName,
      residentId: this.residentId,
      totalMonthlyCharges: this.totalMonthlyCharges,
      currency: this.currency,
      isRecurring: this.isRecurring,
      billingFrequency: this.billingFrequency,
      nextInvoiceDate: this.nextInvoiceDate,
      lastInvoiceDate: this.lastInvoiceDate,
      isActive: this.isActive,
      isInvoiceDue: this.isInvoiceDue(),
      daysUntilNextInvoice: this.getDaysUntilNextInvoice(),
      activeServiceCharges: this.getActiveServiceCharges(),
    };
  }
}