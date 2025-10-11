import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnhancedBedRoomService } from '../../../services/enhanced-bed-room/EnhancedBedRoomService';
import { BedRoom } from '../../../entities/enhanced-bed-room/BedRoom';
import { RoomOccupancy } from '../../../entities/enhanced-bed-room/RoomOccupancy';

describe('EnhancedBedRoomService', () => {
  let service: EnhancedBedRoomService;
  let bedRoomRepository: Repository<BedRoom>;
  let roomOccupancyRepository: Repository<RoomOccupancy>;

  const mockBedRoomRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const mockRoomOccupancyRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedBedRoomService,
        {
          provide: getRepositoryToken(BedRoom),
          useValue: mockBedRoomRepository,
        },
        {
          provide: getRepositoryToken(RoomOccupancy),
          useValue: mockRoomOccupancyRepository,
        },
      ],
    }).compile();

    service = module.get<EnhancedBedRoomService>(EnhancedBedRoomService);
    bedRoomRepository = module.get<Repository<BedRoom>>(getRepositoryToken(BedRoom));
    roomOccupancyRepository = module.get<Repository<RoomOccupancy>>(getRepositoryToken(RoomOccupancy));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBedRoom', () => {
    it('should create a new bed room successfully', async () => {
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

      const mockBedRoom = { id: '1', ...bedRoomData, createdAt: new Date(), updatedAt: new Date() };
      mockBedRoomRepository.create.mockReturnValue(mockBedRoom);
      mockBedRoomRepository.save.mockResolvedValue(mockBedRoom);

      const result = await service.createBedRoom(bedRoomData);

      expect(mockBedRoomRepository.create).toHaveBeenCalledWith(bedRoomData);
      expect(mockBedRoomRepository.save).toHaveBeenCalledWith(mockBedRoom);
      expect(result).toEqual(mockBedRoom);
    });

    it('should throw error when room number already exists', async () => {
      const bedRoomData = {
        roomNumber: '101',
        roomType: 'Single',
        capacity: 1,
        amenities: ['TV'],
        accessibilityFeatures: [],
        status: 'Available' as const,
        location: 'First Floor',
        notes: ''
      };

      mockBedRoomRepository.findOne.mockResolvedValue({ id: '1', roomNumber: '101' });

      await expect(service.createBedRoom(bedRoomData)).rejects.toThrow('Room number already exists');
    });
  });

  describe('getAllBedRooms', () => {
    it('should return all bed rooms', async () => {
      const mockBedRooms = [
        { id: '1', roomNumber: '101', roomType: 'Single', capacity: 1, status: 'Available' },
        { id: '2', roomNumber: '102', roomType: 'Double', capacity: 2, status: 'Occupied' }
      ];

      mockBedRoomRepository.find.mockResolvedValue(mockBedRooms);

      const result = await service.getAllBedRooms();

      expect(mockBedRoomRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockBedRooms);
    });
  });

  describe('getBedRoomById', () => {
    it('should return bed room by id', async () => {
      const mockBedRoom = { id: '1', roomNumber: '101', roomType: 'Single', capacity: 1, status: 'Available' };
      mockBedRoomRepository.findOne.mockResolvedValue(mockBedRoom);

      const result = await service.getBedRoomById('1');

      expect(mockBedRoomRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockBedRoom);
    });

    it('should throw error when bed room not found', async () => {
      mockBedRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.getBedRoomById('1')).rejects.toThrow('Bed room not found');
    });
  });

  describe('updateBedRoom', () => {
    it('should update bed room successfully', async () => {
      const updateData = { roomType: 'Double', capacity: 2 };
      const mockBedRoom = { id: '1', roomNumber: '101', ...updateData, status: 'Available' };

      mockBedRoomRepository.findOne.mockResolvedValue(mockBedRoom);
      mockBedRoomRepository.save.mockResolvedValue(mockBedRoom);

      const result = await service.updateBedRoom('1', updateData);

      expect(mockBedRoomRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockBedRoomRepository.save).toHaveBeenCalledWith(mockBedRoom);
      expect(result).toEqual(mockBedRoom);
    });

    it('should throw error when bed room not found', async () => {
      mockBedRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.updateBedRoom('1', { roomType: 'Double' })).rejects.toThrow('Bed room not found');
    });
  });

  describe('deleteBedRoom', () => {
    it('should delete bed room successfully', async () => {
      const mockBedRoom = { id: '1', roomNumber: '101', roomType: 'Single', capacity: 1, status: 'Available' };
      mockBedRoomRepository.findOne.mockResolvedValue(mockBedRoom);
      mockBedRoomRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteBedRoom('1');

      expect(mockBedRoomRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockBedRoomRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when bed room not found', async () => {
      mockBedRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteBedRoom('1')).rejects.toThrow('Bed room not found');
    });
  });

  describe('assignResidentToRoom', () => {
    it('should assign resident to room successfully', async () => {
      const mockBedRoom = { id: '1', roomNumber: '101', capacity: 1, status: 'Available' };
      const mockOccupancy = { id: '1', bedRoomId: '1', residentId: 'resident1', assignedAt: new Date() };

      mockBedRoomRepository.findOne.mockResolvedValue(mockBedRoom);
      mockRoomOccupancyRepository.create.mockReturnValue(mockOccupancy);
      mockRoomOccupancyRepository.save.mockResolvedValue(mockOccupancy);
      mockBedRoomRepository.save.mockResolvedValue({ ...mockBedRoom, status: 'Occupied' });

      const result = await service.assignResidentToRoom('1', 'resident1');

      expect(mockBedRoomRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockRoomOccupancyRepository.create).toHaveBeenCalledWith({
        bedRoomId: '1',
        residentId: 'resident1',
        assignedAt: expect.any(Date)
      });
      expect(result).toEqual(mockOccupancy);
    });

    it('should throw error when room is not available', async () => {
      const mockBedRoom = { id: '1', roomNumber: '101', capacity: 1, status: 'Occupied' };
      mockBedRoomRepository.findOne.mockResolvedValue(mockBedRoom);

      await expect(service.assignResidentToRoom('1', 'resident1')).rejects.toThrow('Room is not available');
    });
  });

  describe('removeResidentFromRoom', () => {
    it('should remove resident from room successfully', async () => {
      const mockOccupancy = { id: '1', bedRoomId: '1', residentId: 'resident1', assignedAt: new Date() };
      const mockBedRoom = { id: '1', roomNumber: '101', capacity: 1, status: 'Occupied' };

      mockRoomOccupancyRepository.findOne.mockResolvedValue(mockOccupancy);
      mockRoomOccupancyRepository.delete.mockResolvedValue({ affected: 1 });
      mockBedRoomRepository.findOne.mockResolvedValue(mockBedRoom);
      mockBedRoomRepository.save.mockResolvedValue({ ...mockBedRoom, status: 'Available' });

      await service.removeResidentFromRoom('1', 'resident1');

      expect(mockRoomOccupancyRepository.findOne).toHaveBeenCalledWith({
        where: { bedRoomId: '1', residentId: 'resident1' }
      });
      expect(mockRoomOccupancyRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when occupancy not found', async () => {
      mockRoomOccupancyRepository.findOne.mockResolvedValue(null);

      await expect(service.removeResidentFromRoom('1', 'resident1')).rejects.toThrow('Resident not found in room');
    });
  });

  describe('getRoomOccupancy', () => {
    it('should return room occupancy by room id', async () => {
      const mockOccupancy = { id: '1', bedRoomId: '1', residentId: 'resident1', assignedAt: new Date() };
      mockRoomOccupancyRepository.find.mockResolvedValue([mockOccupancy]);

      const result = await service.getRoomOccupancy('1');

      expect(mockRoomOccupancyRepository.find).toHaveBeenCalledWith({
        where: { bedRoomId: '1' }
      });
      expect(result).toEqual([mockOccupancy]);
    });
  });

  describe('getAvailableRooms', () => {
    it('should return available rooms', async () => {
      const mockAvailableRooms = [
        { id: '1', roomNumber: '101', roomType: 'Single', capacity: 1, status: 'Available' },
        { id: '2', roomNumber: '102', roomType: 'Double', capacity: 2, status: 'Available' }
      ];

      mockBedRoomRepository.find.mockResolvedValue(mockAvailableRooms);

      const result = await service.getAvailableRooms();

      expect(mockBedRoomRepository.find).toHaveBeenCalledWith({
        where: { status: 'Available' }
      });
      expect(result).toEqual(mockAvailableRooms);
    });
  });

  describe('getRoomsByType', () => {
    it('should return rooms by type', async () => {
      const mockRooms = [
        { id: '1', roomNumber: '101', roomType: 'Single', capacity: 1, status: 'Available' }
      ];

      mockBedRoomRepository.find.mockResolvedValue(mockRooms);

      const result = await service.getRoomsByType('Single');

      expect(mockBedRoomRepository.find).toHaveBeenCalledWith({
        where: { roomType: 'Single' }
      });
      expect(result).toEqual(mockRooms);
    });
  });
});
