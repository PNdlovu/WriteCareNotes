import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnhancedBedRoomService } from '../../../services/enhanced-bed-room/EnhancedBedRoomService';
import { BedRoom } from '../../../entities/enhanced-bed-room/BedRoom';
import { RoomOccupancy } from '../../../entities/enhanced-bed-room/RoomOccupancy';

describe('Enhanced Bed Room E2E Tests', () => {
  let app: INestApplication;
  let service: EnhancedBedRoomService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<EnhancedBedRoomService>(EnhancedBedRoomService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Bed Room Management Workflow', () => {
    it('should handle complete bed room lifecycle from creation to deletion', async () => {
      // Step 1: Create multiple bed rooms
      const room1 = await service.createBedRoom({
        roomNumber: '101',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV', 'WiFi'],
        accessibilityFeatures: ['Wheelchair accessible'],
        status: 'Available' as const,
        location: 'First Floor',
        notes: 'Corner room with garden view'
      });

      const room2 = await service.createBedRoom({
        roomNumber: '102',
        roomType: 'Double',
        capacity: 2,
        amenities: ['TV', 'WiFi', 'Mini Fridge'],
        accessibilityFeatures: ['Wheelchair accessible', 'Grab bars'],
        status: 'Available' as const,
        location: 'First Floor',
        notes: 'Spacious room with balcony'
      });

      const room3 = await service.createBedRoom({
        roomNumber: '103',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV'],
        accessibilityFeatures: [],
        status: 'Maintenance' as const,
        location: 'Second Floor',
        notes: 'Under renovation'
      });

      expect(room1).toBeDefined();
      expect(room2).toBeDefined();
      expect(room3).toBeDefined();

      // Step 2: Verify room creation and properties
      const allRooms = await service.getAllBedRooms();
      expect(allRooms).toHaveLength(3);

      const singleRooms = await service.getRoomsByType('Single');
      expect(singleRooms).toHaveLength(2);

      const doubleRooms = await service.getRoomsByType('Double');
      expect(doubleRooms).toHaveLength(1);

      // Step 3: Test room availability filtering
      const availableRooms = await service.getAvailableRooms();
      expect(availableRooms).toHaveLength(2);
      expect(availableRooms.every(room => room.status === 'Available')).toBe(true);

      // Step 4: Assign residents to available rooms
      const occupancy1 = await service.assignResidentToRoom(room1.id, 'resident1');
      const occupancy2 = await service.assignResidentToRoom(room2.id, 'resident2');

      expect(occupancy1).toBeDefined();
      expect(occupancy1.bedRoomId).toBe(room1.id);
      expect(occupancy1.residentId).toBe('resident1');

      expect(occupancy2).toBeDefined();
      expect(occupancy2.bedRoomId).toBe(room2.id);
      expect(occupancy2.residentId).toBe('resident2');

      // Step 5: Verify room occupancy tracking
      const room1Occupancy = await service.getRoomOccupancy(room1.id);
      expect(room1Occupancy).toHaveLength(1);
      expect(room1Occupancy[0].residentId).toBe('resident1');

      const room2Occupancy = await service.getRoomOccupancy(room2.id);
      expect(room2Occupancy).toHaveLength(1);
      expect(room2Occupancy[0].residentId).toBe('resident2');

      // Step 6: Update room information
      const updatedRoom1 = await service.updateBedRoom(room1.id, {
        amenities: ['TV', 'WiFi', 'Air Conditioning'],
        notes: 'Updated with air conditioning'
      });

      expect(updatedRoom1.amenities).toContain('Air Conditioning');
      expect(updatedRoom1.notes).toBe('Updated with air conditioning');

      // Step 7: Test room status changes
      const updatedRoom2 = await service.updateBedRoom(room2.id, {
        status: 'Occupied' as const
      });

      expect(updatedRoom2.status).toBe('Occupied');

      // Step 8: Remove resident from room
      await service.removeResidentFromRoom(room1.id, 'resident1');
      const updatedRoom1Occupancy = await service.getRoomOccupancy(room1.id);
      expect(updatedRoom1Occupancy).toHaveLength(0);

      // Step 9: Verify room is available again
      const updatedAvailableRooms = await service.getAvailableRooms();
      expect(updatedAvailableRooms).toHaveLength(1);
      expect(updatedAvailableRooms[0].id).toBe(room1.id);

      // Step 10: Clean up - delete rooms
      await service.deleteBedRoom(room1.id);
      await service.deleteBedRoom(room2.id);
      await service.deleteBedRoom(room3.id);

      // Verify deletion
      const finalRooms = await service.getAllBedRooms();
      expect(finalRooms).toHaveLength(0);
    });

    it('should handle complex room assignment scenarios', async () => {
      // Create a double room
      const doubleRoom = await service.createBedRoom({
        roomNumber: '201',
        roomType: 'Double',
        capacity: 2,
        amenities: ['TV', 'WiFi'],
        accessibilityFeatures: [],
        status: 'Available' as const,
        location: 'Second Floor',
        notes: 'Double occupancy room'
      });

      // Assign first resident
      const occupancy1 = await service.assignResidentToRoom(doubleRoom.id, 'resident1');
      expect(occupancy1).toBeDefined();

      // Assign second resident to same room
      const occupancy2 = await service.assignResidentToRoom(doubleRoom.id, 'resident2');
      expect(occupancy2).toBeDefined();

      // Verify both residents are in the room
      const roomOccupancy = await service.getRoomOccupancy(doubleRoom.id);
      expect(roomOccupancy).toHaveLength(2);
      expect(roomOccupancy.some(occ => occ.residentId === 'resident1')).toBe(true);
      expect(roomOccupancy.some(occ => occ.residentId === 'resident2')).toBe(true);

      // Remove one resident
      await service.removeResidentFromRoom(doubleRoom.id, 'resident1');
      const updatedOccupancy = await service.getRoomOccupancy(doubleRoom.id);
      expect(updatedOccupancy).toHaveLength(1);
      expect(updatedOccupancy[0].residentId).toBe('resident2');

      // Remove remaining resident
      await service.removeResidentFromRoom(doubleRoom.id, 'resident2');
      const finalOccupancy = await service.getRoomOccupancy(doubleRoom.id);
      expect(finalOccupancy).toHaveLength(0);

      // Clean up
      await service.deleteBedRoom(doubleRoom.id);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test duplicate room number creation
      await service.createBedRoom({
        roomNumber: '301',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV'],
        accessibilityFeatures: [],
        status: 'Available' as const,
        location: 'Third Floor',
        notes: ''
      });

      await expect(service.createBedRoom({
        roomNumber: '301',
        roomType: 'Double',
        capacity: 2,
        amenities: ['TV', 'WiFi'],
        accessibilityFeatures: [],
        status: 'Available' as const,
        location: 'Third Floor',
        notes: ''
      })).rejects.toThrow('Room number already exists');

      // Test assignment to unavailable room
      const maintenanceRoom = await service.createBedRoom({
        roomNumber: '302',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV'],
        accessibilityFeatures: [],
        status: 'Maintenance' as const,
        location: 'Third Floor',
        notes: ''
      });

      await expect(service.assignResidentToRoom(maintenanceRoom.id, 'resident1'))
        .rejects.toThrow('Room is not available');

      // Test operations on non-existent room
      await expect(service.getBedRoomById('non-existent-id'))
        .rejects.toThrow('Bed room not found');

      await expect(service.updateBedRoom('non-existent-id', { roomType: 'Double' }))
        .rejects.toThrow('Bed room not found');

      await expect(service.deleteBedRoom('non-existent-id'))
        .rejects.toThrow('Bed room not found');

      // Test removing non-existent resident
      await expect(service.removeResidentFromRoom(maintenanceRoom.id, 'non-existent-resident'))
        .rejects.toThrow('Resident not found in room');

      // Clean up
      await service.deleteBedRoom(maintenanceRoom.id);
    });
  });
});
