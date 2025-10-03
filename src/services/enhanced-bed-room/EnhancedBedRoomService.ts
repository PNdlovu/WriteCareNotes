import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enhanced Bed Room Management Service
 * @module EnhancedBedRoomService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Injectable } from '@nestjs/common';

import { ResidentStatus } from '../entities/Resident';
import { EventEmitter2 } from 'eventemitter2';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import AppDataSource from '../../config/database';
import { BedRoom } from '../../entities/enhanced-bed-room/BedRoom';
import { RoomOccupancy } from '../../entities/enhanced-bed-room/RoomOccupancy';
import { Resident } from '../../entities/Resident';
import { AuditTrailService } from '../audit/AuditTrailService';
import { NotificationService } from '../notifications/NotificationService';

export interface CreateRoomDto {
  roomNumber: string;
  roomType: 'single' | 'double' | 'suite' | 'specialized' | 'deluxe' | 'family';
  roomSize: number;
  floor: string;
  wing: string;
  amenities: any;
  equipment: any;
  careHomeId: string;
  dailyRate?: number;
  notes?: string;
  accessibilityFeatures?: any;
  environmentalControls?: any;
}

export interface AssignResidentDto {
  residentId: string;
  reason: 'admission' | 'transfer' | 'temporary' | 'emergency' | 'respite';
  specialRequirements: string[];
  emergencyContacts: string[];
  careLevel: 'low' | 'medium' | 'high' | 'critical';
  mobilityLevel: 'independent' | 'assisted' | 'dependent' | 'bedbound';
  dietaryRequirements: string[];
  medicationSchedule: any[];
  carePlan: any;
  charges: any;
  notes?: string;
  isEmergencyAdmission?: boolean;
  admissionSource?: string;
}

export interface RoomAvailability {
  roomId: string;
  roomNumber: string;
  roomType: string;
  status: string;
  availableFrom: Date;
  estimatedValue: number;
  amenities: any;
  equipment: any;
}

export interface MaintenanceSchedule {
  roomId: string;
  roomNumber: string;
  maintenanceType: 'cleaning' | 'repair' | 'inspection' | 'deep_clean';
  scheduledDate: Date;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  estimatedDuration: number;
}


export class EnhancedBedRoomService {
  private bedRoomRepository: Repository<BedRoom>;
  private occupancyRepository: Repository<RoomOccupancy>;
  private residentRepository: Repository<Resident>;
  private auditService: AuditTrailService;
  private notificationService: NotificationService;

  constructor() {
    this.bedRoomRepository = AppDataSource.getRepository(BedRoom);
    this.occupancyRepository = AppDataSource.getRepository(RoomOccupancy);
    this.residentRepository = AppDataSource.getRepository(Resident);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService(new EventEmitter2());
  }

  async createRoom(roomData: CreateRoomDto): Promise<BedRoom> {
    try {
      // Check if room number already exists
      const existingRoom = await this.bedRoomRepository.findOne({
        where: { roomNumber: roomData.roomNumber }
      });

      if (existingRoom) {
        throw new Error(`Room number ${roomData.roomNumber} already exists`);
      }

      // Create room with default maintenance schedule
      const room = this.bedRoomRepository.create({
        ...roomData,
        status: 'available',
        maintenanceSchedule: {
          weekly: true,
          monthly: true,
          quarterly: true,
          lastService: new Date(),
          nextService: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          serviceProvider: 'Internal Maintenance Team',
          maintenanceNotes: []
        },
        isActive: true
      });

      const savedRoom = await this.bedRoomRepository.save(room);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'BedRoom',
        entityType: 'BedRoom',
        entityId: savedRoom.id,
        action: 'CREATE',
        details: {
          roomNumber: savedRoom.roomNumber,
          roomType: savedRoom.roomType,
          careHomeId: savedRoom.careHomeId
        },
        userId: 'system'
      });

      return savedRoom;
    } catch (error: unknown) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async assignResidentToRoom(roomId: string, assignmentData: AssignResidentDto): Promise<RoomOccupancy> {
    try {
      // Get room and validate availability
      const room = await this.bedRoomRepository.findOne({
        where: { id: roomId },
        relations: ['occupancies']
      });

      if (!room) {
        throw new Error('Room not found');
      }

      if (!room.isAvailable()) {
        throw new Error('Room is not available for assignment');
      }

      // Get resident
      const resident = await this.residentRepository.findOne({
        where: { id: assignmentData.residentId }
      });

      if (!resident) {
        throw new Error('Resident not found');
      }

      // Check if resident can be accommodated
      if (!room.canAccommodateResident(assignmentData)) {
        throw new Error('Room cannot accommodate resident requirements');
      }

      // Create occupancy record
      const occupancy = this.occupancyRepository.create({
        roomId: roomId,
        residentId: assignmentData.residentId,
        checkInDate: new Date(),
        status: ResidentStatus.ACTIVE,
        occupancyDetails: {
          reason: assignmentData.reason,
          specialRequirements: assignmentData.specialRequirements,
          emergencyContacts: assignmentData.emergencyContacts,
          careLevel: assignmentData.careLevel,
          mobilityLevel: assignmentData.mobilityLevel,
          dietaryRequirements: assignmentData.dietaryRequirements,
          medicationSchedule: assignmentData.medicationSchedule,
          carePlan: assignmentData.carePlan
        },
        charges: assignmentData.charges,
        notes: assignmentData.notes,
        isEmergencyAdmission: assignmentData.isEmergencyAdmission || false,
        admissionSource: assignmentData.admissionSource
      });

      const savedOccupancy = await this.occupancyRepository.save(occupancy);

      // Update room status
      room.status = 'occupied';
      room.currentResidentId = assignmentData.residentId;
      await this.bedRoomRepository.save(room);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'RoomOccupancy',
        entityType: 'RoomOccupancy',
        entityId: savedOccupancy.id,
        action: 'ASSIGN_RESIDENT',
        details: {
          roomId: roomId,
          residentId: assignmentData.residentId,
          careLevel: assignmentData.careLevel,
          reason: assignmentData.reason
        },
        userId: 'system'
      });

      // Send notifications
      await this.notificationService.sendNotification({
        message: 'Notification: Resident Assigned To Room',
        type: 'resident_assigned_to_room',
        recipients: ['care_team', 'management'],
        data: {
          roomNumber: room.roomNumber,
          residentName: resident.getFullName(),
          careLevel: assignmentData.careLevel,
          isEmergencyAdmission: assignmentData.isEmergencyAdmission
        }
      });

      return savedOccupancy;
    } catch (error: unknown) {
      console.error('Error assigning resident to room:', error);
      throw error;
    }
  }

  async getRoomAvailability(careHomeId: string, dateRange?: { start: Date; end: Date }): Promise<RoomAvailability[]> {
    try {
      const query = this.bedRoomRepository
        .createQueryBuilder('room')
        .where('room.careHomeId = :careHomeId', { careHomeId })
        .andWhere('room.isActive = :isActive', { isActive: true });

      if (dateRange) {
        // Check for conflicts with existing occupancies
        query.andWhere(
          `room.id NOT IN (
            SELECT DISTINCT o.roomId 
            FROM room_occupancy o 
            WHERE o.status = 'active' 
            AND (
              (o.checkInDate <= :startDate AND (o.checkOutDate IS NULL OR o.checkOutDate >= :startDate))
              OR (o.checkInDate <= :endDate AND (o.checkOutDate IS NULL OR o.checkOutDate >= :endDate))
              OR (o.checkInDate >= :startDate AND o.checkInDate <= :endDate)
            )
          )`,
          { startDate: dateRange.start, endDate: dateRange.end }
        );
      } else {
        // Only show currently available rooms
        query.andWhere('room.status = :status', { status: 'available' });
      }

      const rooms = await query.getMany();

      return rooms.map(room => ({
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        status: room.status,
        availableFrom: new Date(),
        estimatedValue: room.calculateRoomValue(),
        amenities: room.amenities,
        equipment: room.equipment
      }));
    } catch (error: unknown) {
      console.error('Error getting room availability:', error);
      throw error;
    }
  }

  async scheduleMaintenance(roomId: string, maintenanceData: MaintenanceSchedule): Promise<void> {
    try {
      const room = await this.bedRoomRepository.findOne({
        where: { id: roomId }
      });

      if (!room) {
        throw new Error('Room not found');
      }

      // Update maintenance schedule
      room.updateMaintenanceSchedule(false);
      room.maintenanceSchedule.nextService = maintenanceData.scheduledDate;
      room.maintenanceSchedule.serviceProvider = maintenanceData.assignedTo;
      room.maintenanceSchedule.maintenanceNotes.push(
        `${maintenanceData.maintenanceType}: ${maintenanceData.description} (Priority: ${maintenanceData.priority})`
      );

      await this.bedRoomRepository.save(room);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'BedRoom',
        entityType: 'BedRoom',
        entityId: roomId,
        action: 'SCHEDULE_MAINTENANCE',
        details: {
          maintenanceType: maintenanceData.maintenanceType,
          scheduledDate: maintenanceData.scheduledDate,
          assignedTo: maintenanceData.assignedTo,
          priority: maintenanceData.priority
        },
        userId: 'system'
      });

      // Send notification to maintenance team
      await this.notificationService.sendNotification({
        message: 'Notification: Maintenance Scheduled',
        type: 'maintenance_scheduled',
        recipients: [maintenanceData.assignedTo],
        data: {
          roomNumber: room.roomNumber,
          maintenanceType: maintenanceData.maintenanceType,
          scheduledDate: maintenanceData.scheduledDate,
          priority: maintenanceData.priority,
          description: maintenanceData.description
        }
      });
    } catch (error: unknown) {
      console.error('Error scheduling maintenance:', error);
      throw error;
    }
  }

  async completeMaintenance(roomId: string, completedBy: string, notes?: string): Promise<void> {
    try {
      const room = await this.bedRoomRepository.findOne({
        where: { id: roomId }
      });

      if (!room) {
        throw new Error('Room not found');
      }

      // Update maintenance schedule
      room.updateMaintenanceSchedule(true, notes);
      room.lastMaintenanceAt = new Date();

      // If room was out of order, make it available
      if (room.status === 'out_of_order') {
        room.status = 'available';
      }

      await this.bedRoomRepository.save(room);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'BedRoom',
        entityType: 'BedRoom',
        entityId: roomId,
        action: 'COMPLETE_MAINTENANCE',
        details: {
          completedBy: completedBy,
          notes: notes,
          nextService: room.maintenanceSchedule.nextService
        },
        userId: completedBy
      });
    } catch (error: unknown) {
      console.error('Error completing maintenance:', error);
      throw error;
    }
  }

  async transferResident(currentRoomId: string, newRoomId: string, residentId: string, reason: string): Promise<void> {
    try {
      // Get current occupancy
      const currentOccupancy = await this.occupancyRepository.findOne({
        where: {
          roomId: currentRoomId,
          residentId: residentId,
          status: ResidentStatus.ACTIVE
        }
      });

      if (!currentOccupancy) {
        throw new Error('Active occupancy not found');
      }

      // Get new room
      const newRoom = await this.bedRoomRepository.findOne({
        where: { id: newRoomId }
      });

      if (!newRoom || !newRoom.isAvailable()) {
        throw new Error('New room is not available');
      }

      // Transfer occupancy
      currentOccupancy.transferToNewRoom(newRoomId, new Date(), reason);
      await this.occupancyRepository.save(currentOccupancy);

      // Create new occupancy record
      const newOccupancy = this.occupancyRepository.create({
        roomId: newRoomId,
        residentId: residentId,
        checkInDate: new Date(),
        status: ResidentStatus.ACTIVE,
        occupancyDetails: currentOccupancy.occupancyDetails,
        charges: currentOccupancy.charges,
        notes: `Transferred from room ${currentRoomId}. Reason: ${reason}`,
        isEmergencyAdmission: false,
        admissionSource: 'Internal Transfer'
      });

      await this.occupancyRepository.save(newOccupancy);

      // Update new room status
      newRoom.status = 'occupied';
      newRoom.currentResidentId = residentId;
      await this.bedRoomRepository.save(newRoom);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'RoomOccupancy',
        entityType: 'RoomOccupancy',
        entityId: newOccupancy.id,
        action: 'TRANSFER_RESIDENT',
        details: {
          fromRoomId: currentRoomId,
          toRoomId: newRoomId,
          residentId: residentId,
          reason: reason
        },
        userId: 'system'
      });
    } catch (error: unknown) {
      console.error('Error transferring resident:', error);
      throw error;
    }
  }

  async checkOutResident(roomId: string, residentId: string, checkOutDate: Date, notes?: string): Promise<void> {
    try {
      const occupancy = await this.occupancyRepository.findOne({
        where: {
          roomId: roomId,
          residentId: residentId,
          status: ResidentStatus.ACTIVE
        }
      });

      if (!occupancy) {
        throw new Error('Active occupancy not found');
      }

      // Check out resident
      occupancy.checkOut(checkOutDate, notes);
      await this.occupancyRepository.save(occupancy);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'RoomOccupancy',
        entityType: 'RoomOccupancy',
        entityId: occupancy.id,
        action: 'CHECK_OUT',
        details: {
          roomId: roomId,
          residentId: residentId,
          checkOutDate: checkOutDate,
          lengthOfStay: occupancy.getLengthOfStay(),
          totalCharges: occupancy.calculateTotalCharges()
        },
        userId: 'system'
      });
    } catch (error: unknown) {
      console.error('Error checking out resident:', error);
      throw error;
    }
  }

  async getRoomOccupancyHistory(roomId: string): Promise<RoomOccupancy[]> {
    try {
      return await this.occupancyRepository.find({
        where: { roomId: roomId },
        relations: ['resident'],
        order: { checkInDate: 'DESC' }
      });
    } catch (error: unknown) {
      console.error('Error getting room occupancy history:', error);
      throw error;
    }
  }

  async getMaintenanceSchedule(careHomeId: string): Promise<BedRoom[]> {
    try {
      return await this.bedRoomRepository.find({
        where: { 
          careHomeId: careHomeId,
          isActive: true
        },
        order: { 'maintenanceSchedule.nextService': 'ASC' }
      });
    } catch (error: unknown) {
      console.error('Error getting maintenance schedule:', error);
      throw error;
    }
  }

  async getRoomsNeedingMaintenance(careHomeId: string): Promise<BedRoom[]> {
    try {
      const rooms = await this.bedRoomRepository.find({
        where: { 
          careHomeId: careHomeId,
          isActive: true
        }
      });

      return rooms.filter(room => room.needsMaintenance());
    } catch (error: unknown) {
      console.error('Error getting rooms needing maintenance:', error);
      throw error;
    }
  }

  async updateRoomDetails(roomId: string, updateData: Partial<CreateRoomDto>): Promise<BedRoom> {
    try {
      const room = await this.bedRoomRepository.findOne({
        where: { id: roomId }
      });

      if (!room) {
        throw new Error('Room not found');
      }

      // Update room details
      Object.assign(room, updateData);
      const updatedRoom = await this.bedRoomRepository.save(room);

      // Log audit trail
      await this.auditService.logEvent({
        resource: 'BedRoom',
        entityType: 'BedRoom',
        entityId: roomId,
        action: 'UPDATE',
        resource: 'BedRoom',
        details: updateData,
        userId: 'system'
      
      });

      return updatedRoom;
    } catch (error: unknown) {
      console.error('Error updating room details:', error);
      throw error;
    }
  }

  async getRoomStatistics(careHomeId: string): Promise<any> {
    try {
      const rooms = await this.bedRoomRepository.find({
        where: { careHomeId: careHomeId }
      });

      const occupancies = await this.occupancyRepository.find({
        where: { 
          room: { careHomeId: careHomeId }
        }
      });

      const statistics = {
        totalRooms: rooms.length,
        availableRooms: rooms.filter(r => r.status === 'available').length,
        occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
        maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length,
        outOfOrderRooms: rooms.filter(r => r.status === 'out_of_order').length,
        averageOccupancyRate: 0,
        totalRevenue: 0,
        maintenanceStatus: {
          upToDate: rooms.filter(r => r.getMaintenanceStatus() === 'up_to_date').length,
          dueSoon: rooms.filter(r => r.getMaintenanceStatus() === 'due_soon').length,
          overdue: rooms.filter(r => r.getMaintenanceStatus() === 'overdue').length
        },
        roomTypes: {
          single: rooms.filter(r => r.roomType === 'single').length,
          double: rooms.filter(r => r.roomType === 'double').length,
          suite: rooms.filter(r => r.roomType === 'suite').length,
          specialized: rooms.filter(r => r.roomType === 'specialized').length,
          deluxe: rooms.filter(r => r.roomType === 'deluxe').length,
          family: rooms.filter(r => r.roomType === 'family').length
        }
      };

      // Calculate average occupancy rate
      if (rooms.length > 0) {
        statistics.averageOccupancyRate = (statistics.occupiedRooms / rooms.length) * 100;
      }

      // Calculate total revenue from active occupancies
      const activeOccupancies = occupancies.filter(o => o.isActive());
      statistics.totalRevenue = activeOccupancies.reduce((total, occupancy) => {
        return total + occupancy.calculateTotalCharges();
      }, 0);

      return statistics;
    } catch (error: unknown) {
      console.error('Error getting room statistics:', error);
      throw error;
    }
  }
}