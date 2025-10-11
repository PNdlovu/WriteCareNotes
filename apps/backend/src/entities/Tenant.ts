import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100, unique: true })
  subdomain: string;

  @Column({ type: 'jsonb', default: '{}' })
  configuration: Record<string, any>;

  @Column({ name: 'subscription_plan', length: 50, default: 'enterprise' })
  subscriptionPlan: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships - defined to prevent TypeScript errors
  @OneToMany('Organization', 'tenant')
  organizations: any[];

  @OneToMany('User', 'tenant')
  users: any[];
}
