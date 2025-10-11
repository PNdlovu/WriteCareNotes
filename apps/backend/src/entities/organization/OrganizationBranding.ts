import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Organization Branding Entity for WriteCareNotes
 * @module OrganizationBrandingEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Organization branding entity for multi-brand support
 * with customizable themes, logos, and brand guidelines.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { 
  IsUUID, 
  IsEnum, 
  IsString, 
  IsBoolean, 
  IsUrl, 
  IsOptional, 
  Length,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { Organization } from './Organization';

export enum BrandingType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  SEASONAL = 'seasonal',
  CAMPAIGN = 'campaign',
  DEPARTMENT = 'department'
}

export enum BrandingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface BrandTypography {
  fontFamily: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface BrandAssets {
  logo: {
    primary: string;
    secondary?: string;
    icon: string;
    favicon: string;
  };
  images: {
    hero?: string;
    background?: string;
    placeholder?: string;
  };
  documents: {
    brandGuidelines?: string;
    logoPackage?: string;
    templateLibrary?: string;
  };
}

export interface BrandGuidelines {
  logoUsage: {
    minimumSize: string;
    clearSpace: string;
    prohibitedUses: string[];
  };
  colorUsage: {
    primaryApplications: string[];
    secondaryApplications: string[];
    accessibility: {
      contrastRatios: Record<string, number>;
      colorBlindnessCompliant: boolean;
    };
  };
  typographyUsage: {
    headingHierarchy: string[];
    bodyTextGuidelines: string[];
    specialUseCases: string[];
  };
  voiceAndTone: {
    brandPersonality: string[];
    communicationStyle: string;
    doAndDonts: {
      do: string[];
      dont: string[];
    };
  };
}

export interface BrandCustomization {
  theme: 'light' | 'dark' | 'auto';
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

@Entity('wcn_organization_branding')
@Index(['organizationId', 'brandingType'])
@Index(['status', 'isActive'])
@Index(['effectiveDate', 'expiryDate'])
export class OrganizationBranding extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  overrideid!: string;

  // Branding Identity
  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  brandName!: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  brandCode?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'enum', enum: BrandingType, default: BrandingType.PRIMARY })
  @IsEnum(BrandingType)
  brandingType!: BrandingType;

  @Column({ type: 'enum', enum: BrandingStatus, default: BrandingStatus.ACTIVE })
  @IsEnum(BrandingStatus)
  status!: BrandingStatus;

  // Brand Colors
  @Column({ type: 'jsonb' })
  @ValidateNested()
  @Type(() => Object)
  colors!: BrandColors;

  // Typography
  @Column({ type: 'jsonb' })
  @ValidateNested()
  @Type(() => Object)
  typography!: BrandTypography;

  // Brand Assets
  @Column({ type: 'jsonb' })
  @ValidateNested()
  @Type(() => Object)
  assets!: BrandAssets;

  // Brand Guidelines
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  guidelines?: BrandGuidelines;

  // Customization Options
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  customization?: BrandCustomization;

  // Effective Dates
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  effectiveDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  expiryDate?: Date;

  // Status and Configuration
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isDefault!: boolean;

  @Column({ type: 'integer', default: 0 })
  priority!: number;

  // Usage Tracking
  @Column({ type: 'integer', default: 0 })
  usageCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastUsedDate?: Date;

  // Approval Workflow
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  approvedDate?: Date;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  approvalNotes?: string;

  // Version Control
  @Column({ type: 'var char', length: 20, default: '1.0.0' })
  @IsString()
  version!: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  parentBrandingId?: string;

  // Relationships
  @ManyToOne(() => Organization, organization => organization.branding)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'uuid' })
  @IsUUID()
  organizationId!: string;

  // Audit Fields
  @CreateDateColumn()
  overridecreatedAt!: Date;

  @UpdateDateColumn()
  overrideupdatedAt!: Date;

  @DeleteDateColumn()
  overridedeletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  overridecreatedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  overrideupdatedBy?: string;

  /**
   * Lifecycle hooks
   */
  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    this.validateBrandingData();
    this.setDefaults();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.brandCode) {
      this.brandCode = this.generateBrandCode();
    }
  }

  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    this.validateBrandingData();
    this.updateUsageTracking();
  }

  /**
   * Validation methods
   */
  private validateBrandingData(): void {
    // Validate color values
    this.validateColors();
    
    // Validate typography
    this.validateTypography();
    
    // Validate assets
    this.validateAssets();
    
    // Validate effective dates
    this.validateEffectiveDates();
  }

  private validateColors(): void {
    if (!this.colors) {
      throw new Error('Brand colors are required');
    }

    const requiredColors = ['primary', 'secondary', 'background', 'text'];
    for (const color of requiredColors) {
      if (!this.colors[color as keyof BrandColors]) {
        throw new Error(`Required color '${color}' is missing`);
      }
    }

    // Validate color format (hex, rgb, hsl)
    const colorRegex = /^(#[0-9A-Fa-f]{6}|rgb\(.*\)|hsl\(.*\))$/;
    
    if (!colorRegex.test(this.colors.primary)) {
      throw new Error('Invalid primary color format');
    }
  }

  private validateTypography(): void {
    if (!this.typography) {
      throw new Error('Brand typography is required');
    }

    if (!this.typography.fontFamily?.primary) {
      throw new Error('Primary font family is required');
    }

    if (!this.typography.fontSize?.base) {
      throw new Error('Base font size is required');
    }
  }

  private validateAssets(): void {
    if (!this.assets) {
      throw new Error('Brand assets are required');
    }

    if (!this.assets.logo?.primary) {
      throw new Error('Primary logo is required');
    }

    if (!this.assets.logo?.icon) {
      throw new Error('Logo icon is required');
    }

    // Validate URL format for assets
    const urlRegex = /^https?:\/\/.+/;
    
    if (!urlRegex.test(this.assets.logo.primary)) {
      throw new Error('Primary logo must be a valid URL');
    }
  }

  private validateEffectiveDates(): void {
    if (this.expiryDate && this.effectiveDate >= this.expiryDate) {
      throw new Error('Effective date must be before expiry date');
    }
  }

  /**
   * Utility methods
   */
  private setDefaults(): void {
    if (!this.effectiveDate) {
      this.effectiveDate = new Date();
    }

    if (!this.version) {
      this.version = '1.0.0';
    }

    if (!this.colors) {
      this.colors = this.getDefaultColors();
    }

    if (!this.typography) {
      this.typography = this.getDefaultTypography();
    }
  }

  private generateBrandCode(): string {
    const typePrefix = this.brandingType.substring(0, 3).toUpperCase();
    const nameCode = this.brandName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    
    return `${typePrefix}-${nameCode}-${timestamp}`;
  }

  private updateUsageTracking(): void {
    this.usageCount += 1;
    this.lastUsedDate = new Date();
  }

  private getDefaultColors(): BrandColors {
    return {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
        disabled: '#cbd5e1'
      },
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };
  }

  private getDefaultTypography(): BrandTypography {
    return {
      fontFamily: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'Georgia, serif',
        monospace: 'JetBrains Mono, monospace'
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    };
  }

  /**
   * Business methods
   */
  
  /**
   * Check if branding is currently effective
   */
  isEffective(): boolean {
    const now = new Date();
    
    if (this.effectiveDate > now) {
      return false;
    }
    
    if (this.expiryDate && this.expiryDate <= now) {
      return false;
    }
    
    return this.isActive && this.status === BrandingStatus.ACTIVE;
  }

  /**
   * Generate CSS variables from brand colors
   */
  generateCSSVariables(): Record<string, string> {
    const cssVars: Record<string, string> = {};
    
    // Primary colors
    cssVars['--color-primary'] = this.colors.primary;
    cssVars['--color-secondary'] = this.colors.secondary;
    cssVars['--color-accent'] = this.colors.accent;
    cssVars['--color-background'] = this.colors.background;
    cssVars['--color-surface'] = this.colors.surface;
    
    // Text colors
    cssVars['--color-text-primary'] = this.colors.text.primary;
    cssVars['--color-text-secondary'] = this.colors.text.secondary;
    cssVars['--color-text-disabled'] = this.colors.text.disabled;
    
    // Status colors
    cssVars['--color-success'] = this.colors.success;
    cssVars['--color-warning'] = this.colors.warning;
    cssVars['--color-error'] = this.colors.error;
    cssVars['--color-info'] = this.colors.info;
    
    // Typography
    cssVars['--font-family-primary'] = this.typography.fontFamily.primary;
    cssVars['--font-family-secondary'] = this.typography.fontFamily.secondary;
    cssVars['--font-size-base'] = this.typography.fontSize.base;
    
    return cssVars;
  }

  /**
   * Get brand theme configuration
   */
  getThemeConfig(): any {
    return {
      colors: this.colors,
      typography: this.typography,
      customization: this.customization,
      assets: {
        logo: this.assets.logo.primary,
        icon: this.assets.logo.icon,
        favicon: this.assets.logo.favicon
      }
    };
  }

  /**
   * Approve branding
   */
  approve(approvedBy: string, notes?: string): void {
    if (this.status !== BrandingStatus.DRAFT) {
      throw new Error('Only draft branding can be approved');
    }
    
    this.status = BrandingStatus.ACTIVE;
    this.approvedBy = approvedBy;
    this.approvedDate = new Date();
    this.approvalNotes = notes;
    this.isActive = true;
  }

  /**
   * Archive branding
   */
  archive(): void {
    this.status = BrandingStatus.ARCHIVED;
    this.isActive = false;
  }

  /**
   * Clone branding for new version
   */
  clone(): Partial<OrganizationBranding> {
    return {
      brandName: `${this.brandName} (Copy)`,
      brandingType: this.brandingType,
      colors: { ...this.colors },
      typography: { ...this.typography },
      assets: { ...this.assets },
      guidelines: this.guidelines ? { ...this.guidelines } : undefined,
      customization: this.customization ? { ...this.customization } : undefined,
      organizationId: this.organizationId,
      parentBrandingId: this.id,
      status: BrandingStatus.DRAFT,
      isActive: false,
      version: this.incrementVersion()
    };
  }

  private incrementVersion(): string {
    const [major, minor, patch] = this.version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Get branding summary
   */
  getSummary(): {
    id: string;
    name: string;
    type: BrandingType;
    status: BrandingStatus;
    isActive: boolean;
    isEffective: boolean;
    version: string;
    primaryColor: string;
  } {
    return {
      id: this.id,
      name: this.brandName,
      type: this.brandingType,
      status: this.status,
      isActive: this.isActive,
      isEffective: this.isEffective(),
      version: this.version,
      primaryColor: this.colors.primary
    };
  }
}

export default OrganizationBranding;
