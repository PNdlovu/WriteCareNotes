import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EmployeeProfile } from './EmployeeProfile';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 100, unique: true })
  name: string;

  @Column({ type: 'var char', length: 200 })
  displayName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  code: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  managerId: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  location: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  email: string;

  @Column({ type: 'int', default: 0 })
  employeeCount: number;

  @Column({ type: 'int', default: 0 })
  maxEmployees: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  budget: number;

  @Column({ type: 'var char', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy: string;

  // Relationships
  @OneToMany(() => EmployeeProfile, employeeProfile => employeeProfile.department)
  employees: EmployeeProfile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public getEmployeeCount(): number {
    return this.employees?.length || 0;
  }

  public isFull(): boolean {
    return this.maxEmployees > 0 && this.getEmployeeCount() >= this.maxEmployees;
  }

  public hasCapacity(): boolean {
    return this.maxEmployees === 0 || this.getEmployeeCount() < this.maxEmployees;
  }

  public getCapacityPercentage(): number {
    if (this.maxEmployees === 0) return 0;
    return (this.getEmployeeCount() / this.maxEmployees) * 100;
  }

  public getDepartmentSummary(): {
    id: string;
    name: string;
    displayName: string;
    code: string;
    managerId: string;
    location: string;
    employeeCount: number;
    maxEmployees: number;
    capacityPercentage: number;
    budget: number;
    currency: string;
    isActive: boolean;
    isFull: boolean;
    hasCapacity: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      code: this.code || '',
      managerId: this.managerId || '',
      location: this.location || '',
      employeeCount: this.getEmployeeCount(),
      maxEmployees: this.maxEmployees,
      capacityPercentage: this.getCapacityPercentage(),
      budget: this.budget,
      currency: this.currency,
      isActive: this.isActive,
      isFull: this.isFull(),
      hasCapacity: this.hasCapacity(),
    };
  }
}
