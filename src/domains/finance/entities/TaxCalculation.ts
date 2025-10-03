import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Payslip } from './Payslip';

export enum TaxBand {
  PERSONAL_ALLOWANCE = 'personal_allowance',
  BASIC_RATE = 'basic_rate',
  HIGHER_RATE = 'higher_rate',
  ADDITIONAL_RATE = 'additional_rate'
}

@Entity('tax_calculations')
export class TaxCalculation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payslip, payslip => payslip.taxCalculations)
  @JoinColumn({ name: 'payslipId' })
  payslip: Payslip;

  @Column({ type: 'uuid' })
  payslipId: string;

  @Column({ type: 'varchar', length: 20 })
  taxCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxableIncome: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  personalAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basicRateIncome: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  higherRateIncome: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  additionalRateIncome: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  basicRate: number; // 20%

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  higherRate: number; // 40%

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  additionalRate: number; // 45%

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basicRateTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  higherRateTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  additionalRateTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxAlreadyPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxDue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  taxRefund: number;

  @Column({ type: 'varchar', length: 50 })
  taxYear: string; // e.g., "2024-25"

  @Column({ type: 'date' })
  calculationDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public calculateTax(): void {
    // Calculate tax for each band
    this.basicRateTax = Math.max(0, this.basicRateIncome * (this.basicRate / 100));
    this.higherRateTax = Math.max(0, this.higherRateIncome * (this.higherRate / 100));
    this.additionalRateTax = Math.max(0, this.additionalRateIncome * (this.additionalRate / 100));

    // Calculate total tax
    this.totalTax = this.basicRateTax + this.higherRateTax + this.additionalRateTax;

    // Calculate tax due/refund
    const netTax = this.totalTax - this.taxAlreadyPaid;
    if (netTax > 0) {
      this.taxDue = netTax;
      this.taxRefund = 0;
    } else {
      this.taxDue = 0;
      this.taxRefund = Math.abs(netTax);
    }
  }

  public getTaxBandForIncome(income: number): TaxBand {
    if (income <= this.personalAllowance) {
      return TaxBand.PERSONAL_ALLOWANCE;
    } else if (income <= 50270) { // 2024-25 basic rate threshold
      return TaxBand.BASIC_RATE;
    } else if (income <= 125140) { // 2024-25 higher rate threshold
      return TaxBand.HIGHER_RATE;
    } else {
      return TaxBand.ADDITIONAL_RATE;
    }
  }

  public isTaxCodeValid(): boolean {
    // Basic validation for UK tax codes
    const validPatterns = [
      /^\d{4}[LMNPTY]$/, // Standard tax codes
      /^K\d{3}$/, // K codes for negative allowances
      /^BR$/, // Basic rate
      /^D\d$/, // D codes
      /^NT$/, // No tax
      /^0T$/, // Zero tax
    ];

    return validPatterns.some(pattern => pattern.test(this.taxCode));
  }
}