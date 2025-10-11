import { EventEmitter2 } from "eventemitter2";

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSecurityTables1704067380000 implements MigrationInterface {
    name = 'CreateSecurityTables1704067380000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create security_policies table
        await queryRunner.query(`
            CREATE TABLE "security_policies" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "policyName" character var ying(100) NOT NULL,
                "description" character var ying(255) NOT NULL,
                "policyType" character var ying(50) NOT NULL,
                "category" character var ying(50) NOT NULL,
                "conditions" jsonb NOT NULL,
                "actions" jsonb NOT NULL,
                "enforcementLevel" character var ying(20) NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "priority" integer NOT NULL DEFAULT 0,
                "effectiveDate" TIMESTAMP,
                "expiryDate" TIMESTAMP,
                "rules" jsonb,
                "metrics" jsonb,
                "createdBy" character var ying(100),
                "approvedBy" character var ying(100),
                "approvedAt" TIMESTAMP,
                "lastModifiedBy" character var ying(100),
                "lastModifiedAt" TIMESTAMP,
                "exceptions" jsonb,
                "complianceMapping" jsonb,
                "notes" character var ying(500),
                "requiresApproval" boolean NOT NULL DEFAULT false,
                "approvalWorkflow" jsonb,
                "testingResults" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONST RAINT "PK_security_policies" PRIMARY KEY ("id")
            )
        `);

        // Create security_incidents table
        await queryRunner.query(`
            CREATE TABLE "security_incidents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "incidentType" character var ying(50) NOT NULL,
                "severity" character var ying(20) NOT NULL,
                "title" character var ying(255) NOT NULL,
                "description" text NOT NULL,
                "details" jsonb NOT NULL,
                "status" character var ying(20) NOT NULL DEFAULT 'reported',
                "detectedAt" TIMESTAMP NOT NULL,
                "reportedAt" TIMESTAMP,
                "containedAt" TIMESTAMP,
                "resolvedAt" TIMESTAMP,
                "closedAt" TIMESTAMP,
                "reportedBy" character var ying(100),
                "assignedTo" character var ying(100),
                "investigationNotes" jsonb,
                "remediationActions" jsonb,
                "impact" jsonb,
                "complianceReporting" jsonb,
                "policyId" uuid,
                "detectionMethod" character var ying(50),
                "evidence" jsonb,
                "threatIntelligence" jsonb,
                "communicationLog" jsonb,
                "rootCause" character var ying(500),
                "lessonsLearned" character var ying(500),
                "metrics" jsonb,
                "requiresExternalNotification" boolean NOT NULL DEFAULT false,
                "requiresLegalReview" boolean NOT NULL DEFAULT false,
                "notes" character var ying(500),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONST RAINT "PK_security_incidents" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for security_policies
        await queryRunner.query(`CREATE INDEX "IDX_security_policies_policyType" ON "security_policies" ("policyType")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_policies_category" ON "security_policies" ("category")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_policies_enforcementLevel" ON "security_policies" ("enforcementLevel")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_policies_isActive" ON "security_policies" ("isActive")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_policies_priority" ON "security_policies" ("priority")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_policies_effectiveDate" ON "security_policies" ("effectiveDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_policies_expiryDate" ON "security_policies" ("expiryDate")`);

        // Create indexes for security_incidents
        await queryRunner.query(`CREATE INDEX "IDX_security_incidents_incidentType" ON "security_incidents" ("incidentType")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_incidents_severity" ON "security_incidents" ("severity")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_incidents_status" ON "security_incidents" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_incidents_detectedAt" ON "security_incidents" ("detectedAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_incidents_reportedAt" ON "security_incidents" ("reportedAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_incidents_assignedTo" ON "security_incidents" ("assignedTo")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_incidents_policyId" ON "security_incidents" ("policyId")`);
        await queryRunner.query(`CREATE INDEX "IDX_security_incidents_createdAt" ON "security_incidents" ("createdAt")`);

        // Add foreign key const raints
        await queryRunner.query(`
            ALTER TABLE "security_incidents" 
            ADD CONST RAINT "FK_security_incidents_policyId" 
            FOREIGN KEY ("policyId") REFERENCES "security_policies"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key const raints
        await queryRunner.query(`ALTER TABLE "security_incidents" DROP CONST RAINT "FK_security_incidents_policyId"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_security_incidents_createdAt"`);
        await queryRunner.query(`DROP INDEX "IDX_security_incidents_policyId"`);
        await queryRunner.query(`DROP INDEX "IDX_security_incidents_assignedTo"`);
        await queryRunner.query(`DROP INDEX "IDX_security_incidents_reportedAt"`);
        await queryRunner.query(`DROP INDEX "IDX_security_incidents_detectedAt"`);
        await queryRunner.query(`DROP INDEX "IDX_security_incidents_status"`);
        await queryRunner.query(`DROP INDEX "IDX_security_incidents_severity"`);
        await queryRunner.query(`DROP INDEX "IDX_security_incidents_incidentType"`);
        await queryRunner.query(`DROP INDEX "IDX_security_policies_expiryDate"`);
        await queryRunner.query(`DROP INDEX "IDX_security_policies_effectiveDate"`);
        await queryRunner.query(`DROP INDEX "IDX_security_policies_priority"`);
        await queryRunner.query(`DROP INDEX "IDX_security_policies_isActive"`);
        await queryRunner.query(`DROP INDEX "IDX_security_policies_enforcementLevel"`);
        await queryRunner.query(`DROP INDEX "IDX_security_policies_category"`);
        await queryRunner.query(`DROP INDEX "IDX_security_policies_policyType"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "security_incidents"`);
        await queryRunner.query(`DROP TABLE "security_policies"`);
    }
}
