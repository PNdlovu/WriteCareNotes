/**
 * @fileoverview enhanced bed room management Service
 * @module Enhanced-bed-room/EnhancedBedRoomManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description enhanced bed room management Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import { EventEmitter2 } from 'eventemitter2';
import AppDataSource from '../../config/database';
import { EnhancedBedRoomManagement, RoomType, RoomStatus } from '../../entities/enhanced-bed-room/EnhancedBedRoomManagement';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';

export class EnhancedBedRoomManagementService {
  private roomRepository: Repository<EnhancedBedRoomManagement>;
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.roomRepository = AppDataSource.getRepository(EnhancedBedRoomManagement);
    this.notificationService = new NotificationService(new EventEmitter2());
    this.auditService = new AuditTrailService();
  }

  async createEnhancedRoom(roomData: Partial<EnhancedBedRoomManagement>): Promise<EnhancedBedRoomManagement> {
    try {
      const roomId = await this.generateRoomId();
      
      const room = this.roomRepository.create({
        ...roomData,
        roomId,
        status: RoomStatus.AVAILABLE,
        smartRoomFeatures: {
          environmentalControls: {
            smartThermostat: true,
            automatedLighting: true,
            airQualityMonitoring: true,
            noiseControl: true,
            humidityControl: true
          },
          safetyFeatures: {
            fallDetection: true,
            emergencyCallSystem: true,
            wanderingPrevention: roomData.roomType === RoomType.DEMENTIA_SPECIALIST,
            medicationReminders: true,
            vitalSignsMonitoring: true
          },
          comfortFeatures: {
            personalizedLighting: true,
            musicSystem: true,
            familyPhotos: true,
            comfortItems: true,
            privacyControls: true
          },
          accessibilityFeatures: {
            wheelchairAccessible: true,
            adjustableBed: true,
            accessibleBathroom: true,
            assistiveTechnology: true,
            mobilityAids: true
          }
        },
        occupancyHistory: [],
        environmentalData: [],
        occupancyRate: 0,
        nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      const savedRoom = await this.roomRepository.save(room);
      
      await this.auditService.logEvent({
        resource: 'EnhancedBedRoom',
        entityType: 'EnhancedBedRoom',
        entityId: savedRoom.id,
        action: 'CREATE_ENHANCED_ROOM',
        details: { roomId: savedRoom.roomId, roomType: savedRoom.roomType },
        userId: 'enhanced_room_system'
      });

      return savedRoom;
    } catch (error: unknown) {
      console.error('Error creating enhanced room:', error);
      throw error;
    }
  }

  async getRoomAnalytics(): Promise<any> {
    try {
      const allRooms = await this.roomRepository.find();
      
      return {
        totalRooms: allRooms.length,
        availableRooms: allRooms.filter(room => room.isAvailable()).length,
        occupiedRooms: allRooms.filter(room => room.isOccupied()).length,
        averageOccupancyRate: allRooms.reduce((sum, room) => sum + room.occupancyRate, 0) / allRooms.length,
        roomsByType: allRooms.reduce((acc, room) => {
          acc[room.roomType] = (acc[room.roomType] || 0) + 1;
          return acc;
        }, {}),
        averageSatisfaction: allRooms.reduce((sum, room) => sum + room.getAverageSatisfactionRating(), 0) / allRooms.length
      };
    } catch (error: unknown) {
      console.error('Error getting room analytics:', error);
      throw error;
    }
  }

  private async generateRoomId(): Promise<string> {
    const count = await this.roomRepository.count();
    return `RM${String(count + 1).padStart(4, '0')}`;
  }
}