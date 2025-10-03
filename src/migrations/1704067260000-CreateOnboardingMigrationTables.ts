import { EventEmitter2 } from "eventemitter2";

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOnboardingMigrationTables1704067260000 implements MigrationInterface {
    name = 'CreateOnboardingMigrationTables1704067260000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create data_migrations table
        await queryRunner.query(`
            CREATE TABLE "data_migrations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "migrationName" character varying(100) NOT NULL,
                "description" character varying(255) NOT NULL,
                "sourceSystem" character varying(50) NOT NULL,
                "targetSystem" character varying(50) NOT NULL,
                "migrationType" character varying(50) NOT NULL,
                "migrationConfig" jsonb NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'pending',
                "totalRecords" integer NOT NULL DEFAULT 0,
                "processedRecords" integer NOT NULL DEFAULT 0,
                "successfulRecords" integer NOT NULL DEFAULT 0,
                "failedRecords" integer NOT NULL DEFAULT 0,
                "skippedRecords" integer NOT NULL DEFAULT 0,
                "startedAt" TIMESTAMP,
                "completedAt" TIMESTAMP,
                "lastProcessedAt" TIMESTAMP,
                "errorLog" jsonb NOT NULL DEFAULT '[]',
                "migrationResults" jsonb,
                "rollbackInfo" jsonb,
                "executedBy" character varying(100),
                "approvedBy" character varying(100),
                "approvedAt" TIMESTAMP,
                "progressTracking" jsonb,
                "dataQualityReport" jsonb,
                "isDryRun" boolean NOT NULL DEFAULT false,
                "requiresApproval" boolean NOT NULL DEFAULT false,
                "notes" character varying(500),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_data_migrations_migrationName" UNIQUE ("migrationName"),
                CONSTRAINT "PK_data_migrations" PRIMARY KEY ("id")
            )
        `);

        // Create migration_mappings table
        await queryRunner.query(`
            CREATE TABLE "migration_mappings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "migrationId" uuid NOT NULL,
                "sourceField" character varying(100) NOT NULL,
                "targetField" character varying(100) NOT NULL,
                "sourceTable" character varying(50) NOT NULL,
                "targetTable" character varying(50) NOT NULL,
                "dataTypeMapping" jsonb NOT NULL,
                "transformationRules" jsonb NOT NULL,
                "isRequired" boolean NOT NULL DEFAULT true,
                "defaultValue" character varying(255),
                "description" character varying(500),
                "mappingOrder" integer NOT NULL DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "validationResults" jsonb,
                "transformationResults" jsonb,
                "sourceDataType" character varying(50),
                "targetDataType" character varying(50),
                "allowNulls" boolean NOT NULL DEFAULT false,
                "customValidationFunction" character varying(100),
                "businessRules" jsonb,
                "lookupData" jsonb,
                "notes" character varying(500),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_migration_mappings" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for data_migrations
        await queryRunner.query(`CREATE INDEX "IDX_data_migrations_status" ON "data_migrations" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_data_migrations_migrationType" ON "data_migrations" ("migrationType")`);
        await queryRunner.query(`CREATE INDEX "IDX_data_migrations_sourceSystem" ON "data_migrations" ("sourceSystem")`);
        await queryRunner.query(`CREATE INDEX "IDX_data_migrations_targetSystem" ON "data_migrations" ("targetSystem")`);
        await queryRunner.query(`CREATE INDEX "IDX_data_migrations_createdAt" ON "data_migrations" ("createdAt")`);

        // Create indexes for migration_mappings
        await queryRunner.query(`CREATE INDEX "IDX_migration_mappings_migrationId" ON "migration_mappings" ("migrationId")`);
        await queryRunner.query(`CREATE INDEX "IDX_migration_mappings_sourceTable" ON "migration_mappings" ("sourceTable")`);
        await queryRunner.query(`CREATE INDEX "IDX_migration_mappings_targetTable" ON "migration_mappings" ("targetTable")`);
        await queryRunner.query(`CREATE INDEX "IDX_migration_mappings_isActive" ON "migration_mappings" ("isActive")`);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "migration_mappings" 
            ADD CONSTRAINT "FK_migration_mappings_migrationId" 
            FOREIGN KEY ("migrationId") REFERENCES "data_migrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "migration_mappings" DROP CONSTRAINT "FK_migration_mappings_migrationId"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_migration_mappings_isActive"`);
        await queryRunner.query(`DROP INDEX "IDX_migration_mappings_targetTable"`);
        await queryRunner.query(`DROP INDEX "IDX_migration_mappings_sourceTable"`);
        await queryRunner.query(`DROP INDEX "IDX_migration_mappings_migrationId"`);
        await queryRunner.query(`DROP INDEX "IDX_data_migrations_createdAt"`);
        await queryRunner.query(`DROP INDEX "IDX_data_migrations_targetSystem"`);
        await queryRunner.query(`DROP INDEX "IDX_data_migrations_sourceSystem"`);
        await queryRunner.query(`DROP INDEX "IDX_data_migrations_migrationType"`);
        await queryRunner.query(`DROP INDEX "IDX_data_migrations_status"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "migration_mappings"`);
        await queryRunner.query(`DROP TABLE "data_migrations"`);
    }
}