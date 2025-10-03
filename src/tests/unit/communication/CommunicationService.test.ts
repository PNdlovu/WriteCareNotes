import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationService } from '../../../services/communication/CommunicationService';
import { CommunicationMessage } from '../../../entities/communication/CommunicationMessage';

describe('CommunicationService', () => {
  let service: CommunicationService;
  let communicationMessageRepository: Repository<CommunicationMessage>;

  const mockCommunicationMessageRepository = {
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
        CommunicationService,
        {
          provide: getRepositoryToken(CommunicationMessage),
          useValue: mockCommunicationMessageRepository,
        },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
    communicationMessageRepository = module.get<Repository<CommunicationMessage>>(getRepositoryToken(CommunicationMessage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a new communication message successfully', async () => {
      const messageData = {
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Hello, how are you?',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal' }
      };

      const mockMessage = { id: '1', ...messageData, createdAt: new Date(), updatedAt: new Date() };
      mockCommunicationMessageRepository.create.mockReturnValue(mockMessage);
      mockCommunicationMessageRepository.save.mockResolvedValue(mockMessage);

      const result = await service.createMessage(messageData);

      expect(mockCommunicationMessageRepository.create).toHaveBeenCalledWith(messageData);
      expect(mockCommunicationMessageRepository.save).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getAllMessages', () => {
    it('should return all communication messages', async () => {
      const mockMessages = [
        { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', status: 'sent' },
        { id: '2', senderId: 'user2', recipientId: 'user1', content: 'Hi there', status: 'delivered' }
      ];

      mockCommunicationMessageRepository.find.mockResolvedValue(mockMessages);

      const result = await service.getAllMessages();

      expect(mockCommunicationMessageRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getMessageById', () => {
    it('should return communication message by id', async () => {
      const mockMessage = { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', status: 'sent' };
      mockCommunicationMessageRepository.findOne.mockResolvedValue(mockMessage);

      const result = await service.getMessageById('1');

      expect(mockCommunicationMessageRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockMessage);
    });

    it('should throw error when communication message not found', async () => {
      mockCommunicationMessageRepository.findOne.mockResolvedValue(null);

      await expect(service.getMessageById('1')).rejects.toThrow('Communication message not found');
    });
  });

  describe('updateMessage', () => {
    it('should update communication message successfully', async () => {
      const updateData = { status: 'delivered' as const, readAt: new Date() };
      const mockMessage = { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', ...updateData };

      mockCommunicationMessageRepository.findOne.mockResolvedValue(mockMessage);
      mockCommunicationMessageRepository.save.mockResolvedValue(mockMessage);

      const result = await service.updateMessage('1', updateData);

      expect(mockCommunicationMessageRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockCommunicationMessageRepository.save).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(mockMessage);
    });

    it('should throw error when communication message not found', async () => {
      mockCommunicationMessageRepository.findOne.mockResolvedValue(null);

      await expect(service.updateMessage('1', { status: 'delivered' })).rejects.toThrow('Communication message not found');
    });
  });

  describe('deleteMessage', () => {
    it('should delete communication message successfully', async () => {
      const mockMessage = { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', status: 'sent' };
      mockCommunicationMessageRepository.findOne.mockResolvedValue(mockMessage);
      mockCommunicationMessageRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteMessage('1');

      expect(mockCommunicationMessageRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockCommunicationMessageRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when communication message not found', async () => {
      mockCommunicationMessageRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteMessage('1')).rejects.toThrow('Communication message not found');
    });
  });

  describe('getMessagesBySender', () => {
    it('should return messages by sender id', async () => {
      const mockMessages = [
        { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', status: 'sent' },
        { id: '2', senderId: 'user1', recipientId: 'user3', content: 'Hi', status: 'delivered' }
      ];

      mockCommunicationMessageRepository.find.mockResolvedValue(mockMessages);

      const result = await service.getMessagesBySender('user1');

      expect(mockCommunicationMessageRepository.find).toHaveBeenCalledWith({
        where: { senderId: 'user1' }
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getMessagesByRecipient', () => {
    it('should return messages by recipient id', async () => {
      const mockMessages = [
        { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', status: 'sent' },
        { id: '2', senderId: 'user3', recipientId: 'user2', content: 'Hi', status: 'delivered' }
      ];

      mockCommunicationMessageRepository.find.mockResolvedValue(mockMessages);

      const result = await service.getMessagesByRecipient('user2');

      expect(mockCommunicationMessageRepository.find).toHaveBeenCalledWith({
        where: { recipientId: 'user2' }
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getMessagesByStatus', () => {
    it('should return messages by status', async () => {
      const mockMessages = [
        { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', status: 'sent' }
      ];

      mockCommunicationMessageRepository.find.mockResolvedValue(mockMessages);

      const result = await service.getMessagesByStatus('sent');

      expect(mockCommunicationMessageRepository.find).toHaveBeenCalledWith({
        where: { status: 'sent' }
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getMessagesByType', () => {
    it('should return messages by type', async () => {
      const mockMessages = [
        { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', messageType: 'text' }
      ];

      mockCommunicationMessageRepository.find.mockResolvedValue(mockMessages);

      const result = await service.getMessagesByType('text');

      expect(mockCommunicationMessageRepository.find).toHaveBeenCalledWith({
        where: { messageType: 'text' }
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getMessagesByPriority', () => {
    it('should return messages by priority', async () => {
      const mockMessages = [
        { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Urgent message', priority: 'high' }
      ];

      mockCommunicationMessageRepository.find.mockResolvedValue(mockMessages);

      const result = await service.getMessagesByPriority('high');

      expect(mockCommunicationMessageRepository.find).toHaveBeenCalledWith({
        where: { priority: 'high' }
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark message as read successfully', async () => {
      const mockMessage = { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', status: 'delivered' };
      mockCommunicationMessageRepository.findOne.mockResolvedValue(mockMessage);
      mockCommunicationMessageRepository.save.mockResolvedValue({ ...mockMessage, status: 'read', readAt: new Date() });

      const result = await service.markMessageAsRead('1');

      expect(mockCommunicationMessageRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result.status).toBe('read');
      expect(result.readAt).toBeDefined();
    });

    it('should throw error when message not found', async () => {
      mockCommunicationMessageRepository.findOne.mockResolvedValue(null);

      await expect(service.markMessageAsRead('1')).rejects.toThrow('Communication message not found');
    });
  });

  describe('getUnreadMessages', () => {
    it('should return unread messages for a user', async () => {
      const mockMessages = [
        { id: '1', senderId: 'user1', recipientId: 'user2', content: 'Hello', status: 'delivered' },
        { id: '2', senderId: 'user3', recipientId: 'user2', content: 'Hi', status: 'delivered' }
      ];

      mockCommunicationMessageRepository.find.mockResolvedValue(mockMessages);

      const result = await service.getUnreadMessages('user2');

      expect(mockCommunicationMessageRepository.find).toHaveBeenCalledWith({
        where: { recipientId: 'user2', status: 'delivered' }
      });
      expect(result).toEqual(mockMessages);
    });
  });
});