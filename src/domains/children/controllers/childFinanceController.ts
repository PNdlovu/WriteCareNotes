import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Body, 
  Param, 
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  Min,
  IsEmail,
  IsPostalCode,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  ChildFinanceIntegrationService,
  CreateChildBillingRequest,
  UpdateChildBillingRequest,
  GenerateInvoiceRequest,
  FinancialReportFilter,
} from '../services/childFinanceIntegrationService';
import { 
  BritishIslesJurisdiction, 
  ChildFundingSource, 
  BillingFrequency 
} from '../entities/ChildBilling';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

/**
 * DTO for creating child billing record
 */
class CreateChildBillingDto {
  @IsUUID()
  childId: string;

  @IsEnum(BritishIslesJurisdiction)
  jurisdiction: BritishIslesJurisdiction;

  @IsEnum(ChildFundingSource)
  primaryFundingSource: ChildFundingSource;

  @IsString()
  primaryFunderName: string;

  @IsString()
  @IsOptional()
  localAuthorityCode?: string;

  @IsNumber()
  @Min(0)
  dailyRate: number;

  @IsEnum(BillingFrequency)
  billingFrequency: BillingFrequency;

  @IsNumber()
  @Min(1)
  @IsOptional()
  paymentTermsDays?: number;

  @IsDate()
  @Type(() => Date)
  placementStartDate: Date;

  @IsString()
  socialWorkerName: string;

  @IsEmail()
  socialWorkerEmail: string;

  @IsString()
  socialWorkerPhone: string;

  @IsString()
  invoiceAddress: string;

  @IsString()
  invoicePostcode: string;

  @IsEmail()
  @IsOptional()
  invoiceEmail?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  serviceCharges?: any[];

  @IsOptional()
  @Type(() => Object)
  personalAllowances?: any;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  fundingAllocations?: any[];

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO for updating child billing record
 */
class UpdateChildBillingDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyRate?: number;

  @IsEnum(BillingFrequency)
  @IsOptional()
  billingFrequency?: BillingFrequency;

  @IsNumber()
  @Min(1)
  @IsOptional()
  paymentTermsDays?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  placementEndDate?: Date;

  @IsString()
  @IsOptional()
  socialWorkerName?: string;

  @IsEmail()
  @IsOptional()
  socialWorkerEmail?: string;

  @IsString()
  @IsOptional()
  socialWorkerPhone?: string;

  @IsString()
  @IsOptional()
  invoiceAddress?: string;

  @IsString()
  @IsOptional()
  invoicePostcode?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  serviceCharges?: any[];

  @IsOptional()
  @Type(() => Object)
  personalAllowances?: any;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO for generating invoice
 */
class GenerateInvoiceDto {
  @IsDate()
  @Type(() => Date)
  invoiceDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @IsBoolean()
  @IsOptional()
  includePersonalAllowances?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO for recording payment
 */
class RecordPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDate()
  @Type(() => Date)
  paymentDate: Date;

  @IsString()
  paymentReference: string;
}

/**
 * DTO for raising dispute
 */
class RaiseDisputeDto {
  @IsString()
  details: string;
}

/**
 * DTO for financial report filters
 */
class FinancialReportFilterDto {
  @IsEnum(BritishIslesJurisdiction)
  @IsOptional()
  jurisdiction?: BritishIslesJurisdiction;

  @IsEnum(ChildFundingSource)
  @IsOptional()
  fundingSource?: ChildFundingSource;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  hasArrears?: boolean;

  @IsBoolean()
  @IsOptional()
  hasDispute?: boolean;
}

// ============================================
// CONTROLLER
// ============================================

/**
 * ChildFinanceController
 * 
 * Enterprise-grade REST API for children's residential care financial management
 * across all 8 British Isles jurisdictions.
 * 
 * Features:
 * - Complete CRUD operations for child billing
 * - Local authority invoice generation (manual + automated)
 * - Payment tracking and reconciliation
 * - Financial reporting (child, IRO, summary)
 * - Dispute management
 * - Transition to leaving care finances (16+)
 * - Multi-funder support
 * - Audit logging
 * 
 * Security:
 * - JWT authentication required
 * - Role-based access control (RBAC)
 * - Audit trail on all operations
 * 
 * Compliance:
 * - Care Planning Regulations 2010 (England)
 * - Looked After Children (Scotland) Act 2009
 * - Care Planning, Placement and Case Review (Wales) Regulations 2015
 * - Children (NI) Order 1995
 * - Child Care Act 1991 (Ireland)
 * - Channel Islands & Isle of Man regulations
 */
@ApiTags('Children Finance')
@Controller('children/billing')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ChildFinanceController {
  constructor(
    private readonly childFinanceService: ChildFinanceIntegrationService,
  ) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create new child billing record
   * 
   * POST /api/children/billing
   * 
   * Required Role: FINANCE_ADMIN, MANAGER
   */
  @Post()
  @Roles('FINANCE_ADMIN', 'MANAGER')
  @ApiOperation({ 
    summary: 'Create child billing record',
    description: 'Create new billing record for child placement with local authority funding',
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Billing record created successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input or active billing already exists',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Child not found',
  })
  async createBilling(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) 
    dto: CreateChildBillingDto,
    @Request() req: any,
  ) {
    try {
      const billing = await this.childFinanceService.createChildBilling({
        ...dto,
        createdBy: req.user.username || req.user.email,
      });

      return {
        success: true,
        message: 'Child billing record created successfully',
        data: billing,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (error.message.includes('already exists')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create billing record',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get child billing by child ID
   * 
   * GET /api/children/billing/:childId
   * 
   * Required Role: FINANCE_ADMIN, FINANCE_VIEWER, MANAGER, SOCIAL_WORKER
   */
  @Get(':childId')
  @Roles('FINANCE_ADMIN', 'FINANCE_VIEWER', 'MANAGER', 'SOCIAL_WORKER')
  @ApiOperation({ 
    summary: 'Get child billing',
    description: 'Get active billing record for specific child',
  })
  @ApiParam({ 
    name: 'childId', 
    description: 'Child UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Billing record retrieved successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Billing record not found',
  })
  async getBilling(@Param('childId') childId: string) {
    try {
      const billing = await this.childFinanceService.getChildBilling(childId);

      if (!billing) {
        throw new HttpException(
          {
            success: false,
            message: `No active billing record found for child ${childId}`,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: billing,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve billing record',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update child billing
   * 
   * PUT /api/children/billing/:id
   * 
   * Required Role: FINANCE_ADMIN, MANAGER
   */
  @Put(':id')
  @Roles('FINANCE_ADMIN', 'MANAGER')
  @ApiOperation({ 
    summary: 'Update child billing',
    description: 'Update billing record (rates, terms, contacts, allowances)',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Billing record UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Billing record updated successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Billing record not found',
  })
  async updateBilling(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) 
    dto: UpdateChildBillingDto,
    @Request() req: any,
  ) {
    try {
      const billing = await this.childFinanceService.updateChildBilling(id, {
        ...dto,
        updatedBy: req.user.username || req.user.email,
      });

      return {
        success: true,
        message: 'Billing record updated successfully',
        data: billing,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to update billing record',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Deactivate child billing (soft delete)
   * 
   * DELETE /api/children/billing/:id
   * 
   * Required Role: FINANCE_ADMIN, MANAGER
   */
  @Delete(':id')
  @Roles('FINANCE_ADMIN', 'MANAGER')
  @ApiOperation({ 
    summary: 'Deactivate child billing',
    description: 'Soft delete billing record (sets isActive=false, placementEndDate=now)',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Billing record UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Billing record deactivated successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Billing record not found',
  })
  async deactivateBilling(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    try {
      const billing = await this.childFinanceService.deactivateChildBilling(
        id,
        req.user.username || req.user.email,
      );

      return {
        success: true,
        message: 'Billing record deactivated successfully',
        data: billing,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to deactivate billing record',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================
  // INVOICE MANAGEMENT
  // ============================================

  /**
   * Get invoices for child
   * 
   * GET /api/children/billing/:childId/invoices
   * 
   * Required Role: FINANCE_ADMIN, FINANCE_VIEWER, MANAGER, SOCIAL_WORKER
   */
  @Get(':childId/invoices')
  @Roles('FINANCE_ADMIN', 'FINANCE_VIEWER', 'MANAGER', 'SOCIAL_WORKER')
  @ApiOperation({ 
    summary: 'Get child invoices',
    description: 'Get all invoices for specific child placement',
  })
  @ApiParam({ 
    name: 'childId', 
    description: 'Child UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Invoices retrieved successfully',
  })
  async getChildInvoices(@Param('childId') childId: string) {
    try {
      const billing = await this.childFinanceService.getChildBilling(childId);

      if (!billing) {
        throw new HttpException(
          {
            success: false,
            message: `No billing record found for child ${childId}`,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: {
          childId: billing.childId,
          billingId: billing.id,
          invoices: billing.invoices || [],
          paymentHistory: billing.paymentHistory,
          totalInvoiced: billing.totalInvoiced,
          totalPaid: billing.totalPaid,
          currentArrears: billing.currentArrears,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve invoices',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate invoice manually
   * 
   * POST /api/children/billing/:id/generate-invoice
   * 
   * Required Role: FINANCE_ADMIN, MANAGER
   */
  @Post(':id/generate-invoice')
  @Roles('FINANCE_ADMIN', 'MANAGER')
  @ApiOperation({ 
    summary: 'Generate invoice manually',
    description: 'Manually generate invoice for child placement (bypasses auto-generation)',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Billing record UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Invoice generated successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Billing record not found',
  })
  async generateInvoice(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) 
    dto: GenerateInvoiceDto,
    @Request() req: any,
  ) {
    try {
      const invoice = await this.childFinanceService.generateInvoice({
        billingId: id,
        invoiceDate: dto.invoiceDate,
        dueDate: dto.dueDate,
        includePersonalAllowances: dto.includePersonalAllowances ?? true,
        notes: dto.notes,
        createdBy: req.user.username || req.user.email,
      });

      return {
        success: true,
        message: 'Invoice generated successfully',
        data: invoice,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate invoice',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Record payment for invoice
   * 
   * POST /api/children/billing/:id/record-payment/:invoiceId
   * 
   * Required Role: FINANCE_ADMIN
   */
  @Post(':id/record-payment/:invoiceId')
  @Roles('FINANCE_ADMIN')
  @ApiOperation({ 
    summary: 'Record payment',
    description: 'Record local authority payment for invoice',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Billing record UUID',
    type: String,
  })
  @ApiParam({ 
    name: 'invoiceId', 
    description: 'Invoice UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Payment recorded successfully',
  })
  async recordPayment(
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) 
    dto: RecordPaymentDto,
    @Request() req: any,
  ) {
    try {
      await this.childFinanceService.recordPayment(
        id,
        invoiceId,
        dto.amount,
        dto.paymentDate,
        dto.paymentReference,
        req.user.username || req.user.email,
      );

      return {
        success: true,
        message: 'Payment recorded successfully',
        data: {
          billingId: id,
          invoiceId,
          amount: dto.amount,
          paymentDate: dto.paymentDate,
          paymentReference: dto.paymentReference,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to record payment',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================
  // REPORTING
  // ============================================

  /**
   * Get overdue invoices report
   * 
   * GET /api/children/billing/overdue
   * 
   * Required Role: FINANCE_ADMIN, FINANCE_VIEWER, MANAGER
   */
  @Get('reports/overdue')
  @Roles('FINANCE_ADMIN', 'FINANCE_VIEWER', 'MANAGER')
  @ApiOperation({ 
    summary: 'Get overdue invoices',
    description: 'Get arrears report for all children with overdue invoices',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Overdue invoices report retrieved successfully',
  })
  async getOverdueInvoices() {
    try {
      const overdueList = await this.childFinanceService.getOverdueInvoices();

      const totalOverdue = overdueList.reduce(
        (sum, item) => sum + item.totalOverdue,
        0,
      );

      return {
        success: true,
        data: {
          totalChildren: overdueList.length,
          totalOverdue,
          overdueList,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve overdue invoices',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get financial summary
   * 
   * GET /api/children/billing/stats
   * 
   * Required Role: FINANCE_ADMIN, FINANCE_VIEWER, MANAGER, IRO
   */
  @Get('reports/stats')
  @Roles('FINANCE_ADMIN', 'FINANCE_VIEWER', 'MANAGER', 'IRO')
  @ApiOperation({ 
    summary: 'Get financial statistics',
    description: 'Get comprehensive financial summary across all children',
  })
  @ApiQuery({ 
    name: 'jurisdiction', 
    enum: BritishIslesJurisdiction, 
    required: false,
  })
  @ApiQuery({ 
    name: 'fundingSource', 
    enum: ChildFundingSource, 
    required: false,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Financial statistics retrieved successfully',
  })
  async getFinancialStats(
    @Query('jurisdiction') jurisdiction?: BritishIslesJurisdiction,
    @Query('fundingSource') fundingSource?: ChildFundingSource,
    @Query('hasArrears') hasArrears?: boolean,
    @Query('hasDispute') hasDispute?: boolean,
  ) {
    try {
      const filters: FinancialReportFilter = {
        jurisdiction,
        fundingSource,
        hasArrears,
        hasDispute,
      };

      const stats = await this.childFinanceService.getFinancialSummary(filters);

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve financial statistics',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get child financial report
   * 
   * GET /api/children/billing/:childId/report
   * 
   * Required Role: FINANCE_ADMIN, FINANCE_VIEWER, MANAGER, SOCIAL_WORKER, IRO
   */
  @Get(':childId/report')
  @Roles('FINANCE_ADMIN', 'FINANCE_VIEWER', 'MANAGER', 'SOCIAL_WORKER', 'IRO')
  @ApiOperation({ 
    summary: 'Get child financial report',
    description: 'Get comprehensive financial report for individual child',
  })
  @ApiParam({ 
    name: 'childId', 
    description: 'Child UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Financial report retrieved successfully',
  })
  async getChildReport(@Param('childId') childId: string) {
    try {
      const report = await this.childFinanceService.getChildFinancialReport(childId);

      return {
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve child financial report',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get IRO financial dashboard
   * 
   * GET /api/children/billing/iro/dashboard
   * 
   * Required Role: IRO, MANAGER
   */
  @Get('reports/iro/dashboard')
  @Roles('IRO', 'MANAGER')
  @ApiOperation({ 
    summary: 'Get IRO financial dashboard',
    description: 'Get financial oversight dashboard for Independent Reviewing Officers',
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'IRO dashboard retrieved successfully',
  })
  async getIRODashboard() {
    try {
      const dashboard = await this.childFinanceService.getIROFinancialDashboard();

      return {
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve IRO dashboard',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================
  // DISPUTE MANAGEMENT
  // ============================================

  /**
   * Raise dispute
   * 
   * POST /api/children/billing/:id/raise-dispute
   * 
   * Required Role: FINANCE_ADMIN, MANAGER
   */
  @Post(':id/raise-dispute')
  @Roles('FINANCE_ADMIN', 'MANAGER')
  @ApiOperation({ 
    summary: 'Raise dispute',
    description: 'Raise dispute for billing record (e.g., LA disputes charges)',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Billing record UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dispute raised successfully',
  })
  async raiseDispute(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) 
    dto: RaiseDisputeDto,
    @Request() req: any,
  ) {
    try {
      const billing = await this.childFinanceService.raiseDispute(
        id,
        dto.details,
        req.user.username || req.user.email,
      );

      return {
        success: true,
        message: 'Dispute raised successfully',
        data: billing,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to raise dispute',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Resolve dispute
   * 
   * POST /api/children/billing/:id/resolve-dispute
   * 
   * Required Role: FINANCE_ADMIN, MANAGER
   */
  @Post(':id/resolve-dispute')
  @Roles('FINANCE_ADMIN', 'MANAGER')
  @ApiOperation({ 
    summary: 'Resolve dispute',
    description: 'Mark dispute as resolved',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Billing record UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dispute resolved successfully',
  })
  async resolveDispute(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    try {
      const billing = await this.childFinanceService.resolveDispute(
        id,
        req.user.username || req.user.email,
      );

      return {
        success: true,
        message: 'Dispute resolved successfully',
        data: billing,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (error.message.includes('No active dispute')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to resolve dispute',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================
  // TRANSITION TO LEAVING CARE
  // ============================================

  /**
   * Transition to leaving care finances
   * 
   * POST /api/children/billing/:id/transition
   * 
   * Required Role: FINANCE_ADMIN, MANAGER, SOCIAL_WORKER
   */
  @Post(':id/transition')
  @Roles('FINANCE_ADMIN', 'MANAGER', 'SOCIAL_WORKER')
  @ApiOperation({ 
    summary: 'Transition to leaving care',
    description: 'Transition child billing to leaving care finances (at age 16+)',
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Billing record UUID',
    type: String,
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transition completed successfully',
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Child must be 16+ or already transitioned',
  })
  async transitionToLeavingCare(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    try {
      const result = await this.childFinanceService.transitionToLeavingCare(
        id,
        req.user.username || req.user.email,
      );

      return {
        success: true,
        message: 'Transition to leaving care completed successfully',
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (
        error.message.includes('not found') || 
        error.message.includes('must be at least 16') ||
        error.message.includes('already transitioned')
      ) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
          error.message.includes('not found') 
            ? HttpStatus.NOT_FOUND 
            : HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to transition to leaving care',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
