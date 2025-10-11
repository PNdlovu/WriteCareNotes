import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ChildAllowanceService } from '../services/ChildAllowanceService';
import {
  BritishIslesJurisdiction,
  DisbursementMethod,
  DisbursementStatus,
} from '../entities/PocketMoneyTransaction';
import {
  AllowanceType,
  ApprovalStatus,
  ReceiptStatus,
} from '../entities/AllowanceExpenditure';
import {
  SavingsAccountType,
  SavingsTransactionType,
} from '../entities/ChildSavingsAccount';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDate,
  IsUUID,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== DTOs ====================

/**
 * Disburse Pocket Money DTO
 */
class DisbursePocketMoneyDto {
  @IsUUID()
  childId!: string;

  @IsNumber()
  @Min(1)
  @Max(53)
  weekNumber!: number;

  @IsNumber()
  @Min(2020)
  @Max(2100)
  year!: number;

  @IsEnum(BritishIslesJurisdiction)
  jurisdiction!: BritishIslesJurisdiction;

  @IsEnum(DisbursementMethod)
  method!: DisbursementMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partialAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  savingsAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Confirm Receipt DTO
 */
class ConfirmReceiptDto {
  @IsString()
  childSignature!: string;

  @IsOptional()
  @IsString()
  childComment?: string;
}

/**
 * Record Refusal DTO
 */
class RecordRefusalDto {
  @IsString()
  reason!: string;
}

/**
 * Withhold Pocket Money DTO
 */
class WithholdPocketMoneyDto {
  @IsString()
  reason!: string;
}

/**
 * Defer Disbursement DTO
 */
class DeferDisbursementDto {
  @IsString()
  reason!: string;

  @IsDate()
  @Type(() => Date)
  deferToDate!: Date;
}

/**
 * Request Allowance Expenditure DTO
 */
class RequestAllowanceExpenditureDto {
  @IsUUID()
  childId!: string;

  @IsEnum(AllowanceType)
  allowanceType!: AllowanceType;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  itemDescription!: string;

  @IsString()
  vendor!: string;

  @IsDate()
  @Type(() => Date)
  purchaseDate!: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAmount?: number;

  @IsOptional()
  @IsBoolean()
  isCultural?: boolean;

  @IsOptional()
  @IsBoolean()
  isReligious?: boolean;

  @IsOptional()
  @IsString()
  culturalContext?: string;

  @IsOptional()
  @IsBoolean()
  childPresent?: boolean;

  @IsOptional()
  @IsBoolean()
  childChose?: boolean;
}

/**
 * Approve/Reject DTO
 */
class ApprovalDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Rejection DTO
 */
class RejectionDto {
  @IsString()
  reason!: string;
}

/**
 * Upload Receipt DTO
 */
class UploadReceiptDto {
  @IsString()
  receiptImageUrl!: string;
}

/**
 * Open Savings Account DTO
 */
class OpenSavingsAccountDto {
  @IsUUID()
  childId!: string;

  @IsEnum(SavingsAccountType)
  accountType!: SavingsAccountType;

  @IsString()
  accountName!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  interestRate?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SavingsGoalDto)
  savingsGoal?: SavingsGoalDto;
}

class SavingsGoalDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  targetDate?: Date;
}

/**
 * Deposit to Savings DTO
 */
class DepositToSavingsDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsUUID()
  linkedPocketMoneyTransactionId?: string;
}

/**
 * Request Withdrawal DTO
 */
class RequestWithdrawalDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  purpose!: string;
}

/**
 * Child Allowance Controller
 * 
 * REST API for managing pocket money, allowances, and savings
 * for looked-after children across British Isles jurisdictions.
 * 
 * ENDPOINTS:
 * - POST /pocket-money/disburse - Disburse weekly pocket money
 * - PATCH /pocket-money/:id/confirm-receipt - Confirm child receipt
 * - PATCH /pocket-money/:id/record-refusal - Record refusal
 * - PATCH /pocket-money/:id/withhold - Withhold money (manager)
 * - PATCH /pocket-money/:id/defer - Defer disbursement
 * - GET /pocket-money/child/:childId - Get transactions
 * - POST /allowances/request - Request expenditure
 * - PATCH /allowances/:id/approve - Approve expenditure
 * - PATCH /allowances/:id/reject - Reject expenditure
 * - POST /allowances/:id/upload-receipt - Upload receipt
 * - PATCH /allowances/:id/verify-receipt - Verify receipt
 * - GET /allowances/child/:childId - Get expenditures
 * - POST /savings/open - Open savings account
 * - POST /savings/:accountId/deposit - Deposit to savings
 * - POST /savings/:accountId/withdraw - Request withdrawal
 * - PATCH /savings/withdrawals/:transactionId/approve - Approve withdrawal
 * - GET /savings/child/:childId - Get savings account
 * - GET /savings/:accountId/transactions - Get transactions
 * - POST /savings/apply-interest - Apply monthly interest (batch)
 * - GET /reports/quarterly/:childId - Quarterly summary
 * - GET /reports/iro-dashboard - IRO dashboard
 * - GET /reports/budget-vs-actual/:childId - Budget analysis
 * - GET /rates/:jurisdiction - Get pocket money rates
 * 
 * COMPLIANCE:
 * - Care Planning Regulations 2010 (England)
 * - Looked After Children Regulations 2009 (Scotland)
 * - Care Planning Regulations 2015 (Wales)
 * - Children Order 1995 (Northern Ireland)
 * - Tusla guidance (Ireland)
 * - Equality Act 2010 (cultural/religious needs)
 * 
 * @class ChildAllowanceController
 */
@ApiTags('Child Allowances')
@ApiBearerAuth()
@Controller('api/children/allowances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChildAllowanceController {
  constructor(private readonly allowanceService: ChildAllowanceService) {}

  // ==================== POCKET MONEY ENDPOINTS ====================

  /**
   * Disburse weekly pocket money
   * 
   * POST /api/children/allowances/pocket-money/disburse
   */
  @Post('pocket-money/disburse')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.RESIDENTIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Disburse weekly pocket money to child' })
  @ApiResponse({ status: 201, description: 'Pocket money disbursed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or duplicate disbursement' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  async disbursePocketMoney(
    @Body() dto: DisbursePocketMoneyDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.disburseWeeklyPocketMoney(
      dto.childId,
      dto.weekNumber,
      dto.year,
      dto.jurisdiction,
      dto.method,
      req.user,
      {
        partialAmount: dto.partialAmount,
        savingsAmount: dto.savingsAmount,
        notes: dto.notes,
      },
    );
  }

  /**
   * Confirm child receipt of pocket money
   * 
   * PATCH /api/children/allowances/pocket-money/:id/confirm-receipt
   */
  @Patch('pocket-money/:id/confirm-receipt')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.RESIDENTIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm child receipt of pocket money' })
  @ApiResponse({ status: 200, description: 'Receipt confirmed successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async confirmPocketMoneyReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmReceiptDto,
  ) {
    return await this.allowanceService.confirmPocketMoneyReceipt(
      id,
      dto.childSignature,
      dto.childComment,
    );
  }

  /**
   * Record pocket money refusal
   * 
   * PATCH /api/children/allowances/pocket-money/:id/record-refusal
   */
  @Patch('pocket-money/:id/record-refusal')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.RESIDENTIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record child refusal of pocket money' })
  @ApiResponse({ status: 200, description: 'Refusal recorded successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async recordPocketMoneyRefusal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordRefusalDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.recordPocketMoneyRefusal(id, dto.reason, req.user);
  }

  /**
   * Withhold pocket money (requires manager approval)
   * 
   * PATCH /api/children/allowances/pocket-money/:id/withhold
   */
  @Patch('pocket-money/:id/withhold')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withhold pocket money (manager only)' })
  @ApiResponse({ status: 200, description: 'Pocket money withheld successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - manager role required' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async withholdPocketMoney(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithholdPocketMoneyDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.withholdPocketMoney(id, dto.reason, req.user);
  }

  /**
   * Defer pocket money disbursement
   * 
   * PATCH /api/children/allowances/pocket-money/:id/defer
   */
  @Patch('pocket-money/:id/defer')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.RESIDENTIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Defer pocket money disbursement (e.g., child absent)' })
  @ApiResponse({ status: 200, description: 'Disbursement deferred successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async deferPocketMoney(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeferDisbursementDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.deferPocketMoney(
      id,
      dto.reason,
      dto.deferToDate,
      req.user,
    );
  }

  /**
   * Get pocket money transactions for child
   * 
   * GET /api/children/allowances/pocket-money/child/:childId
   */
  @Get('pocket-money/child/:childId')
  @Roles(
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get pocket money transactions for child' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  async getPocketMoneyTransactions(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('status') status?: DisbursementStatus,
  ) {
    return await this.allowanceService.getPocketMoneyTransactions(childId, {
      year,
      status,
    });
  }

  // ==================== ALLOWANCE EXPENDITURE ENDPOINTS ====================

  /**
   * Request allowance expenditure
   * 
   * POST /api/children/allowances/request
   */
  @Post('allowances/request')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.RESIDENTIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request allowance expenditure (clothing, birthday, education, etc.)' })
  @ApiResponse({ status: 201, description: 'Expenditure request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  async requestAllowanceExpenditure(
    @Body() dto: RequestAllowanceExpenditureDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.requestAllowanceExpenditure(
      dto.childId,
      dto.allowanceType,
      dto.amount,
      dto.itemDescription,
      dto.vendor,
      dto.purchaseDate,
      req.user,
      {
        budgetAmount: dto.budgetAmount,
        isCultural: dto.isCultural,
        isReligious: dto.isReligious,
        culturalContext: dto.culturalContext,
        childPresent: dto.childPresent,
        childChose: dto.childChose,
      },
    );
  }

  /**
   * Approve allowance expenditure
   * 
   * PATCH /api/children/allowances/:id/approve
   */
  @Patch('allowances/:id/approve')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve allowance expenditure' })
  @ApiResponse({ status: 200, description: 'Expenditure approved successfully' })
  @ApiResponse({ status: 404, description: 'Expenditure not found' })
  async approveAllowanceExpenditure(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovalDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.approveAllowanceExpenditure(id, req.user, dto.notes);
  }

  /**
   * Reject allowance expenditure
   * 
   * PATCH /api/children/allowances/:id/reject
   */
  @Patch('allowances/:id/reject')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject allowance expenditure' })
  @ApiResponse({ status: 200, description: 'Expenditure rejected successfully' })
  @ApiResponse({ status: 404, description: 'Expenditure not found' })
  async rejectAllowanceExpenditure(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectionDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.rejectAllowanceExpenditure(id, req.user, dto.reason);
  }

  /**
   * Upload receipt for expenditure
   * 
   * POST /api/children/allowances/:id/upload-receipt
   */
  @Post('allowances/:id/upload-receipt')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.RESIDENTIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload receipt image for expenditure' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Receipt uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Expenditure not found' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Note: In production, upload to S3/Azure Blob and get URL
    const receiptImageUrl = `/uploads/receipts/${file.filename}`;

    return await this.allowanceService.uploadReceipt(id, receiptImageUrl, req.user);
  }

  /**
   * Verify receipt
   * 
   * PATCH /api/children/allowances/:id/verify-receipt
   */
  @Patch('allowances/:id/verify-receipt')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify receipt for expenditure' })
  @ApiResponse({ status: 200, description: 'Receipt verified successfully' })
  @ApiResponse({ status: 404, description: 'Expenditure not found' })
  async verifyReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return await this.allowanceService.verifyReceipt(id, req.user);
  }

  /**
   * Get allowance expenditures for child
   * 
   * GET /api/children/allowances/child/:childId
   */
  @Get('allowances/child/:childId')
  @Roles(
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get allowance expenditures for child' })
  @ApiResponse({ status: 200, description: 'Expenditures retrieved successfully' })
  async getAllowanceExpenditures(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('allowanceType') allowanceType?: AllowanceType,
    @Query('category') category?: string,
    @Query('approvalStatus') approvalStatus?: ApprovalStatus,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('quarter', new ParseIntPipe({ optional: true })) quarter?: number,
  ) {
    return await this.allowanceService.getAllowanceExpenditures(childId, {
      allowanceType,
      category,
      approvalStatus,
      year,
      quarter,
    });
  }

  // ==================== SAVINGS ACCOUNT ENDPOINTS ====================

  /**
   * Open savings account
   * 
   * POST /api/children/allowances/savings/open
   */
  @Post('savings/open')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open savings account for child' })
  @ApiResponse({ status: 201, description: 'Savings account opened successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - child already has active account' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  async openSavingsAccount(
    @Body() dto: OpenSavingsAccountDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.openSavingsAccount(
      dto.childId,
      dto.accountType,
      dto.accountName,
      req.user,
      {
        interestRate: dto.interestRate,
        savingsGoal: dto.savingsGoal,
      },
    );
  }

  /**
   * Deposit to savings account
   * 
   * POST /api/children/allowances/savings/:accountId/deposit
   */
  @Post('savings/:accountId/deposit')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.RESIDENTIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Deposit money to savings account' })
  @ApiResponse({ status: 201, description: 'Deposit completed successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async depositToSavings(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: DepositToSavingsDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.depositToSavings(
      accountId,
      dto.amount,
      dto.description,
      req.user,
      dto.linkedPocketMoneyTransactionId,
    );
  }

  /**
   * Request withdrawal from savings
   * 
   * POST /api/children/allowances/savings/:accountId/withdraw
   */
  @Post('savings/:accountId/withdraw')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.RESIDENTIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request withdrawal from savings account' })
  @ApiResponse({ status: 201, description: 'Withdrawal request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - insufficient funds' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async requestSavingsWithdrawal(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: RequestWithdrawalDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.requestSavingsWithdrawal(
      accountId,
      dto.amount,
      dto.purpose,
      req.user,
    );
  }

  /**
   * Approve savings withdrawal
   * 
   * PATCH /api/children/allowances/savings/withdrawals/:transactionId/approve
   */
  @Patch('savings/withdrawals/:transactionId/approve')
  @Roles(UserRole.SOCIAL_WORKER, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve savings withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal approved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async approveSavingsWithdrawal(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Body() dto: ApprovalDto,
    @Request() req: any,
  ) {
    return await this.allowanceService.approveSavingsWithdrawal(
      transactionId,
      req.user,
      dto.notes,
    );
  }

  /**
   * Get savings account for child
   * 
   * GET /api/children/allowances/savings/child/:childId
   */
  @Get('savings/child/:childId')
  @Roles(
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get savings account for child' })
  @ApiResponse({ status: 200, description: 'Savings account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getSavingsAccount(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('accountType') accountType?: SavingsAccountType,
  ) {
    const account = await this.allowanceService.getSavingsAccount(childId, accountType);
    if (!account) {
      throw new NotFoundException(`No active savings account found for child ${childId}`);
    }
    return account;
  }

  /**
   * Get savings transactions
   * 
   * GET /api/children/allowances/savings/:accountId/transactions
   */
  @Get('savings/:accountId/transactions')
  @Roles(
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get transactions for savings account' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getSavingsTransactions(
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query('transactionType') transactionType?: SavingsTransactionType,
  ) {
    return await this.allowanceService.getSavingsTransactions(accountId, {
      transactionType,
    });
  }

  /**
   * Apply monthly interest (batch operation)
   * 
   * POST /api/children/allowances/savings/apply-interest
   */
  @Post('savings/apply-interest')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply monthly interest to all active savings accounts (batch)' })
  @ApiResponse({ status: 200, description: 'Interest applied successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - manager role required' })
  async applyMonthlyInterest(@Request() req: any) {
    const totalInterest = await this.allowanceService.applyMonthlyInterest(req.user);
    return {
      message: 'Monthly interest applied successfully',
      totalInterest,
      appliedAt: new Date(),
    };
  }

  // ==================== REPORTS & ANALYTICS ENDPOINTS ====================

  /**
   * Get quarterly summary
   * 
   * GET /api/children/allowances/reports/quarterly/:childId
   */
  @Get('reports/quarterly/:childId')
  @Roles(
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get quarterly summary for child (pocket money, allowances, savings)' })
  @ApiResponse({ status: 200, description: 'Quarterly summary retrieved successfully' })
  async getQuarterlySummary(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('quarter', ParseIntPipe) quarter: number,
  ) {
    return await this.allowanceService.getQuarterlySummary(childId, year, quarter);
  }

  /**
   * Get IRO dashboard
   * 
   * GET /api/children/allowances/reports/iro-dashboard
   */
  @Get('reports/iro-dashboard')
  @Roles(UserRole.IRO, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get IRO dashboard (items requiring attention: pending approvals, missing receipts, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getIRODashboard() {
    return await this.allowanceService.getIRODashboard();
  }

  /**
   * Get budget vs actual analysis
   * 
   * GET /api/children/allowances/reports/budget-vs-actual/:childId
   */
  @Get('reports/budget-vs-actual/:childId')
  @Roles(
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get budget vs actual analysis for child' })
  @ApiResponse({ status: 200, description: 'Budget analysis retrieved successfully' })
  async getBudgetVsActual(
    @Param('childId', ParseUUIDPipe) childId: string,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return await this.allowanceService.getBudgetVsActual(childId, year);
  }

  /**
   * Get pocket money rates for jurisdiction
   * 
   * GET /api/children/allowances/rates/:jurisdiction
   */
  @Get('rates/:jurisdiction')
  @Roles(
    UserRole.SOCIAL_WORKER,
    UserRole.RESIDENTIAL_WORKER,
    UserRole.MANAGER,
    UserRole.IRO,
    UserRole.ADMIN,
  )
  @ApiOperation({ summary: 'Get pocket money rates for British Isles jurisdiction' })
  @ApiResponse({ status: 200, description: 'Rates retrieved successfully' })
  async getPocketMoneyRates(@Param('jurisdiction') jurisdiction: BritishIslesJurisdiction) {
    return this.allowanceService.getPocketMoneyRates(jurisdiction);
  }
}
