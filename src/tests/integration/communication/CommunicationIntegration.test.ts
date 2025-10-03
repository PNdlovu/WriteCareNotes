import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationService } from '../../../services/communication/CommunicationService';
import { CommunicationMessage } from '../../../entities/communication/CommunicationMessage';

describe('CommunicationService Integration Tests', () => {
  let service: CommunicationService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [CommunicationMessage],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([CommunicationMessage]),
      ],
      providers: [CommunicationService],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Communication Message Management Integration', () => {
    it('should create, read, update, and delete communication messages', async () => {
      // Create a communication message
      const messageData = {
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Hello, how are you?',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal' }
      };

      const createdMessage = await service.createMessage(messageData);
      expect(createdMessage).toBeDefined();
      expect(createdMessage.senderId).toBe('user1');
      expect(createdMessage.recipientId).toBe('user2');
      expect(createdMessage.content).toBe('Hello, how are you?');
      expect(createdMessage.status).toBe('sent');

      // Read the communication message
      const retrievedMessage = await service.getMessageById(createdMessage.id);
      expect(retrievedMessage).toBeDefined();
      expect(retrievedMessage.senderId).toBe('user1');

      // Update the communication message
      const updateData = { status: 'delivered' as const, readAt: new Date() };
      const updatedMessage = await service.updateMessage(createdMessage.id, updateData);
      expect(updatedMessage.status).toBe('delivered');
      expect(updatedMessage.readAt).toBeDefined();

      // Delete the communication message
      await service.deleteMessage(createdMessage.id);
      await expect(service.getMessageById(createdMessage.id)).rejects.toThrow('Communication message not found');
    });

    it('should handle message status transitions and read tracking', async () => {
      // Create a message
      const messageData = {
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Important message',
        priority: 'high' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal' }
      };

      const createdMessage = await service.createMessage(messageData);

      // Mark as delivered
      await service.updateMessage(createdMessage.id, { status: 'delivered' as const });
      let updatedMessage = await service.getMessageById(createdMessage.id);
      expect(updatedMessage.status).toBe('delivered');

      // Mark as read
      const readMessage = await service.markMessageAsRead(createdMessage.id);
      expect(readMessage.status).toBe('read');
      expect(readMessage.readAt).toBeDefined();

      // Verify final state
      updatedMessage = await service.getMessageById(createdMessage.id);
      expect(updatedMessage.status).toBe('read');
      expect(updatedMessage.readAt).toBeDefined();
    });

    it('should filter messages by sender, recipient, status, type, and priority', async () => {
      // Create multiple messages with different properties
      const message1 = await service.createMessage({
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Hello from user1',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal' }
      });

      const message2 = await service.createMessage({
        senderId: 'user1',
        recipientId: 'user3',
        messageType: 'text' as const,
        content: 'Another message from user1',
        priority: 'high' as const,
        status: 'delivered' as const,
        metadata: { channel: 'internal' }
      });

      const message3 = await service.createMessage({
        senderId: 'user2',
        recipientId: 'user1',
        messageType: 'image' as const,
        content: 'Image message',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal' }
      });

      const message4 = await service.createMessage({
        senderId: 'user3',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Message from user3',
        priority: 'low' as const,
        status: 'read' as const,
        metadata: { channel: 'internal' }
      });

      // Test filtering by sender
      const user1Messages = await service.getMessagesBySender('user1');
      expect(user1Messages).toHaveLength(2);
      expect(user1Messages.every(msg => msg.senderId === 'user1')).toBe(true);

      // Test filtering by recipient
      const user2Messages = await service.getMessagesByRecipient('user2');
      expect(user2Messages).toHaveLength(2);
      expect(user2Messages.every(msg => msg.recipientId === 'user2')).toBe(true);

      // Test filtering by status
      const sentMessages = await service.getMessagesByStatus('sent');
      expect(sentMessages).toHaveLength(2);
      expect(sentMessages.every(msg => msg.status === 'sent')).toBe(true);

      const deliveredMessages = await service.getMessagesByStatus('delivered');
      expect(deliveredMessages).toHaveLength(1);
      expect(deliveredMessages[0].status).toBe('delivered');

      // Test filtering by type
      const textMessages = await service.getMessagesByType('text');
      expect(textMessages).toHaveLength(3);
      expect(textMessages.every(msg => msg.messageType === 'text')).toBe(true);

      const imageMessages = await service.getMessagesByType('image');
      expect(imageMessages).toHaveLength(1);
      expect(imageMessages[0].messageType).toBe('image');

      // Test filtering by priority
      const highPriorityMessages = await service.getMessagesByPriority('high');
      expect(highPriorityMessages).toHaveLength(1);
      expect(highPriorityMessages[0].priority).toBe('high');

      const normalPriorityMessages = await service.getMessagesByPriority('normal');
      expect(normalPriorityMessages).toHaveLength(2);
      expect(normalPriorityMessages.every(msg => msg.priority === 'normal')).toBe(true);
    });

    it('should handle unread message tracking', async () => {
      // Create messages with different statuses for user2
      await service.createMessage({
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Unread message 1',
        priority: 'normal' as const,
        status: 'delivered' as const,
        metadata: { channel: 'internal' }
      });

      await service.createMessage({
        senderId: 'user3',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Unread message 2',
        priority: 'normal' as const,
        status: 'delivered' as const,
        metadata: { channel: 'internal' }
      });

      await service.createMessage({
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Read message',
        priority: 'normal' as const,
        status: 'read' as const,
        metadata: { channel: 'internal' }
      });

      // Get unread messages for user2
      const unreadMessages = await service.getUnreadMessages('user2');
      expect(unreadMessages).toHaveLength(2);
      expect(unreadMessages.every(msg => msg.recipientId === 'user2' && msg.status === 'delivered')).toBe(true);

      // Mark one message as read
      await service.markMessageAsRead(unreadMessages[0].id);

      // Check unread messages again
      const updatedUnreadMessages = await service.getUnreadMessages('user2');
      expect(updatedUnreadMessages).toHaveLength(1);
      expect(updatedUnreadMessages[0].id).toBe(unreadMessages[1].id);
    });

    it('should handle message metadata and different message types', async () => {
      // Create messages with different types and metadata
      const textMessage = await service.createMessage({
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Text message',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', threadId: 'thread1' }
      });

      const imageMessage = await service.createMessage({
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'image' as const,
        content: 'Image attachment',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', fileSize: '2MB', fileName: 'image.jpg' }
      });

      const audioMessage = await service.createMessage({
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'audio' as const,
        content: 'Audio message',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', duration: '30s', format: 'mp3' }
      });

      // Verify message types
      const textMessages = await service.getMessagesByType('text');
      expect(textMessages).toHaveLength(1);
      expect(textMessages[0].metadata).toEqual({ channel: 'internal', threadId: 'thread1' });

      const imageMessages = await service.getMessagesByType('image');
      expect(imageMessages).toHaveLength(1);
      expect(imageMessages[0].metadata).toEqual({ channel: 'internal', fileSize: '2MB', fileName: 'image.jpg' });

      const audioMessages = await service.getMessagesByType('audio');
      expect(audioMessages).toHaveLength(1);
      expect(audioMessages[0].metadata).toEqual({ channel: 'internal', duration: '30s', format: 'mp3' });
    });
  });
});