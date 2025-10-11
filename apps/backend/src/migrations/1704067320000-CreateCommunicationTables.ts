import { EventEmitter2 } from "eventemitter2";

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCommunicationTables1704067320000 implements MigrationInterface {
    name = 'CreateCommunicationTables1704067320000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create communication_channels table
        await queryRunner.query(`
            CREATE TABLE "communication_channels" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "channelType" character var ying(50) NOT NULL,
                "channelName" character var ying(100) NOT NULL,
                "displayName" character var ying(255) NOT NULL,
                "description" text,
                "configuration" jsonb NOT NULL,
                "capabilities" jsonb NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "isDefault" boolean NOT NULL DEFAULT false,
                "priority" integer NOT NULL DEFAULT 0,
                "provider" character var ying(50),
                "providerId" character var ying(100),
                "statistics" jsonb,
                "healthCheck" jsonb,
                "templates" jsonb,
                "routingRules" jsonb,
                "notes" character var ying(500),
                "requiresApproval" boolean NOT NULL DEFAULT false,
                "approvalWorkflow" jsonb,
                "complianceSettings" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONST RAINT "PK_communication_channels" PRIMARY KEY ("id")
            )
        `);

        // Create communication_messages table
        await queryRunner.query(`
            CREATE TABLE "communication_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "channelId" uuid NOT NULL,
                "messageType" character var ying(100) NOT NULL,
                "subject" character var ying(255) NOT NULL,
                "content" text NOT NULL,
                "recipients" jsonb NOT NULL,
                "status" character var ying(20) NOT NULL DEFAULT 'draft',
                "scheduledAt" TIMESTAMP,
                "sentAt" TIMESTAMP,
                "deliveredAt" TIMESTAMP,
                "deliveryResults" jsonb,
                "attachments" jsonb,
                "template" jsonb,
                "priority" character var ying(50),
                "isRichText" boolean NOT NULL DEFAULT false,
                "requiresDeliveryConfirmation" boolean NOT NULL DEFAULT false,
                "requiresReadReceipt" boolean NOT NULL DEFAULT false,
                "retryCount" integer NOT NULL DEFAULT 0,
                "maxRetries" integer NOT NULL DEFAULT 3,
                "metadata" jsonb,
                "trackingData" jsonb,
                "notes" character var ying(500),
                "isBulkMessage" boolean NOT NULL DEFAULT false,
                "totalRecipients" integer NOT NULL DEFAULT 0,
                "complianceData" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONST RAINT "PK_communication_messages" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for communication_channels
        await queryRunner.query(`CREATE INDEX "IDX_communication_channels_channelType" ON "communication_channels" ("channelType")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_channels_isActive" ON "communication_channels" ("isActive")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_channels_isDefault" ON "communication_channels" ("isDefault")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_channels_priority" ON "communication_channels" ("priority")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_channels_provider" ON "communication_channels" ("provider")`);

        // Create indexes for communication_messages
        await queryRunner.query(`CREATE INDEX "IDX_communication_messages_channelId" ON "communication_messages" ("channelId")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_messages_messageType" ON "communication_messages" ("messageType")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_messages_status" ON "communication_messages" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_messages_scheduledAt" ON "communication_messages" ("scheduledAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_messages_sentAt" ON "communication_messages" ("sentAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_messages_priority" ON "communication_messages" ("priority")`);
        await queryRunner.query(`CREATE INDEX "IDX_communication_messages_createdAt" ON "communication_messages" ("createdAt")`);

        // Add foreign key const raints
        await queryRunner.query(`
            ALTER TABLE "communication_messages" 
            ADD CONST RAINT "FK_communication_messages_channelId" 
            FOREIGN KEY ("channelId") REFERENCES "communication_channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key const raints
        await queryRunner.query(`ALTER TABLE "communication_messages" DROP CONST RAINT "FK_communication_messages_channelId"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_communication_messages_createdAt"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_messages_priority"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_messages_sentAt"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_messages_scheduledAt"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_messages_status"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_messages_messageType"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_messages_channelId"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_channels_provider"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_channels_priority"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_channels_isDefault"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_channels_isActive"`);
        await queryRunner.query(`DROP INDEX "IDX_communication_channels_channelType"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "communication_messages"`);
        await queryRunner.query(`DROP TABLE "communication_channels"`);
    }
}
