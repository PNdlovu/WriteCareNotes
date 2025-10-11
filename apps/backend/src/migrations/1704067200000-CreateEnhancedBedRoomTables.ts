import { EventEmitter2 } from "eventemitter2";

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEnhancedBedRoomTables1704067200000 implements MigrationInterface {
    name = 'CreateEnhancedBedRoomTables1704067200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create bed_rooms table
        await queryRunner.query(`
            CREATE TABLE "bed_rooms" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "roomNumber" character varying(100) NOT NULL,
                "roomType" character varying(50) NOT NULL,
                "roomSize" numeric(8,2) NOT NULL,
                "floor" character varying(20) NOT NULL,
                "wing" character varying(20) NOT NULL,
                "amenities" jsonb NOT NULL,
                "equipment" jsonb NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'available',
                "careHomeId" uuid NOT NULL,
                "currentResidentId" uuid,
                "lastCleanedAt" TIMESTAMP,
                "lastMaintenanceAt" TIMESTAMP,
                "maintenanceSchedule" jsonb NOT NULL,
                "dailyRate" numeric(10,2),
                "notes" character varying(500),
                "roomPhotos" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "accessibilityFeatures" jsonb,
                "environmentalControls" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_bed_rooms_roomNumber" UNIQUE ("roomNumber"),
                CONSTRAINT "PK_bed_rooms" PRIMARY KEY ("id")
            )
        `);

        // Create room_occupancy table
        await queryRunner.query(`
            CREATE TABLE "room_occupancy" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "roomId" uuid NOT NULL,
                "residentId" uuid NOT NULL,
                "checkInDate" TIMESTAMP NOT NULL,
                "checkOutDate" TIMESTAMP,
                "status" character varying(20) NOT NULL,
                "occupancyDetails" jsonb NOT NULL,
                "charges" jsonb NOT NULL,
                "notes" character varying(500),
                "roomCondition" jsonb,
                "specialArrangements" jsonb,
                "isEmergencyAdmission" boolean NOT NULL DEFAULT false,
                "admissionSource" character varying(100),
                "dischargeDestination" character varying(100),
                "occupancyHistory" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_room_occupancy" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for bed_rooms
        await queryRunner.query(`CREATE INDEX "IDX_bed_rooms_careHomeId" ON "bed_rooms" ("careHomeId")`);
        await queryRunner.query(`CREATE INDEX "IDX_bed_rooms_status" ON "bed_rooms" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_bed_rooms_roomType" ON "bed_rooms" ("roomType")`);
        await queryRunner.query(`CREATE INDEX "IDX_bed_rooms_isActive" ON "bed_rooms" ("isActive")`);

        // Create indexes for room_occupancy
        await queryRunner.query(`CREATE INDEX "IDX_room_occupancy_roomId" ON "room_occupancy" ("roomId")`);
        await queryRunner.query(`CREATE INDEX "IDX_room_occupancy_residentId" ON "room_occupancy" ("residentId")`);
        await queryRunner.query(`CREATE INDEX "IDX_room_occupancy_status" ON "room_occupancy" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_room_occupancy_checkInDate" ON "room_occupancy" ("checkInDate")`);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "room_occupancy" 
            ADD CONSTRAINT "FK_room_occupancy_roomId" 
            FOREIGN KEY ("roomId") REFERENCES "bed_rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "room_occupancy" DROP CONSTRAINT "FK_room_occupancy_roomId"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_room_occupancy_checkInDate"`);
        await queryRunner.query(`DROP INDEX "IDX_room_occupancy_status"`);
        await queryRunner.query(`DROP INDEX "IDX_room_occupancy_residentId"`);
        await queryRunner.query(`DROP INDEX "IDX_room_occupancy_roomId"`);
        await queryRunner.query(`DROP INDEX "IDX_bed_rooms_isActive"`);
        await queryRunner.query(`DROP INDEX "IDX_bed_rooms_roomType"`);
        await queryRunner.query(`DROP INDEX "IDX_bed_rooms_status"`);
        await queryRunner.query(`DROP INDEX "IDX_bed_rooms_careHomeId"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "room_occupancy"`);
        await queryRunner.query(`DROP TABLE "bed_rooms"`);
    }
}