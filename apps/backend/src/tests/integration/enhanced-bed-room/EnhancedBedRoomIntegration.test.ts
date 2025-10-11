import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnhancedBedRoomService } from '../../../services/enhanced-bed-room/EnhancedBedRoomService';
import { BedRoom } from '../../../entities/enhanced-bed-room/BedRoom';
import { RoomOccupancy } from '../../../entities/enhanced-bed-room/RoomOccupancy';

describe('EnhancedBedRoomService Integration Tests', () => {
  letservice: EnhancedBedRoomService;
  letmodule: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [BedRoom, RoomOccupancy],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([BedRoom, RoomOccupancy]),
      ],
      providers: [EnhancedBedRoomService],
    }).compile();

    service = module.get<EnhancedBedRoomService>(EnhancedBedRoomService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Bed Room Management Integration', () => {
    it('should create, read, update, and delete bed rooms', async () => {
      // Create a bed room
      const bedRoomData = {
        roomNumber: '101',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV', 'WiFi'],
        accessibilityFeatures: ['Wheelchair accessible'],
        status: 'Available' as const,
        location: 'First Floor',
        notes: 'Corner room with garden view'
      };

      const createdBedRoom = await service.createBedRoom(bedRoomData);
      expect(createdBedRoom).toBeDefined();
      expect(createdBedRoom.roomNumber).toBe('101');
      expect(createdBedRoom.roomType).toBe('Single');
      expect(createdBedRoom.status).toBe('Available');

      // Read the bed room
      const retrievedBedRoom = await service.getBedRoomById(createdBedRoom.id);
      expect(retrievedBedRoom).toBeDefined();
      expect(retrievedBedRoom.roomNumber).toBe('101');

      // Update the bed room
      const updateData = { roomType: 'Double', capacity: 2 };
      const updatedBedRoom = await service.updateBedRoom(createdBedRoom.id, updateData);
      expect(updatedBedRoom.roomType).toBe('Double');
      expect(updatedBedRoom.capacity).toBe(2);

      // Delete the bed room
      await service.deleteBedRoom(createdBedRoom.id);
      await expect(service.getBedRoomById(createdBedRoom.id)).rejects.toThrow('Bed room not found');
    });

    it('should handle room assignment and occupancy tracking', async () => {
      // Create a bed room
      const bedRoomData = {
        roomNumber: '102',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV'],
        accessibilityFeatures: [],
        status: 'Available' as const,
        location: 'Second Floor',
        notes: ''
      };

      const createdBedRoom = await service.createBedRoom(bedRoomData);

      // Assign a resident to the room
      const occupancy = await service.assignResidentToRoom(createdBedRoom.id, 'resident1');
      expect(occupancy).toBeDefined();
      expect(occupancy.bedRoomId).toBe(createdBedRoom.id);
      expect(occupancy.residentId).toBe('resident1');

      // Check room occupancy
      const roomOccupancy = await service.getRoomOccupancy(createdBedRoom.id);
      expect(roomOccupancy).toHaveLength(1);
      expect(roomOccupancy[0].residentId).toBe('resident1');

      // Remove resident from room
      await service.removeResidentFromRoom(createdBedRoom.id, 'resident1');
      const updatedOccupancy = await service.getRoomOccupancy(createdBedRoom.id);
      expect(updatedOccupancy).toHaveLength(0);
    });

    it('should prevent duplicate room numbers', async () => {
      const bedRoomData1 = {
        roomNumber: '103',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV'],
        accessibilityFeatures: [],
        status: 'Available' as const,
        location: 'Third Floor',
        notes: ''
      };

      const bedRoomData2 = {
        roomNumber: '103',
        roomType: 'Double',
        capacity: 2,
        amenities: ['TV', 'WiFi'],
        accessibilityFeatures: [],
        status: 'Available' as const,
        location: 'Third Floor',
        notes: ''
      };

      await service.createBedRoom(bedRoomData1);
      await expect(service.createBedRoom(bedRoomData2)).rejects.toThrow('Room number already exists');
    });

    it('should prevent assignment to unavailable rooms', async () => {
      const bedRoomData = {
        roomNumber: '104',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV'],
        accessibilityFeatures: [],
        status: 'Maintenance' as const,
        location: 'Fourth Floor',
        notes: ''
      };

      const createdBedRoom = await service.createBedRoom(bedRoomData);
      await expect(service.assignResidentToRoom(createdBedRoom.id, 'resident1')).rejects.toThrow('Room is not available');
    });

    it('should return available rooms and rooms by type', async () => {
      // Create multiple rooms with different types and statuses
      const room1 = await service.createBedRoom({
        roomNumber: '105',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV'],
        accessibilityFeatures: [],
        status: 'Available' as const,
        location: 'Fifth Floor',
        notes: ''
      });

      const room2 = await service.createBedRoom({
        roomNumber: '106',
        roomType: 'Double',
        capacity: 2,
        amenities: ['TV', 'WiFi'],
        accessibilityFeatures: [],
        status: 'Available' as const,
        location: 'Fifth Floor',
        notes: ''
      });

      const room3 = await service.createBedRoom({
        roomNumber: '107',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV'],
        accessibilityFeatures: [],
        status: 'Occupied' as const,
        location: 'Fifth Floor',
        notes: ''
      });

      // Test available rooms
      const availableRooms = await service.getAvailableRooms();
      expect(availableRooms).toHaveLength(2);
      expect(availableRooms.some(room => room.roomNumber === '105')).toBe(true);
      expect(availableRooms.some(room => room.roomNumber === '106')).toBe(true);
      expect(availableRooms.some(room => room.roomNumber === '107')).toBe(false);

      // Test rooms by type
      const singleRooms = await service.getRoomsByType('Single');
      expect(singleRooms).toHaveLength(2);
      expect(singleRooms.every(room => room.roomType === 'Single')).toBe(true);

      const doubleRooms = await service.getRoomsByType('Double');
      expect(doubleRooms).toHaveLength(1);
      expect(doubleRooms[0].roomType).toBe('Double');
    });
  });
});
