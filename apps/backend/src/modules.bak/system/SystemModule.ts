import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from '../../controllers/system/SystemController';
import { SystemService } from '../../services/system/SystemService';
import { DBSVerification } from '../../entities/hr/DBSVerification';
import { RightToWorkCheck } from '../../entities/hr/RightToWorkCheck';
import { DVLACheck } from '../../entities/hr/DVLACheck';
import { CashTransaction } from '../../entities/financial/CashTransaction';
import { Budget } from '../../entities/financial/Budget';
import { LedgerAccount } from '../../entities/financial/LedgerAccount';
import { Employee } from '../../entities/hr/Employee';

/**
 * @fileoverview System Module
 * @module SystemModule
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Module for system testing, monitoring, and health checks
 * including unit tests, integration tests, E2E tests, and performance tests.
 */

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DBSVerification,
      RightToWorkCheck,
      DVLACheck,
      CashTransaction,
      Budget,
      LedgerAccount,
      Employee
    ])
  ],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService]
})
export class SystemModule {}
