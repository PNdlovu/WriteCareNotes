import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationService } from '../../../services/communication/CommunicationService';
import { CommunicationMessage } from '../../../entities/communication/CommunicationMessage';

describe('Communication E2E Tests', () => {
  let app: INestApplication;
  let service: CommunicationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<CommunicationService>(CommunicationService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Communication Workflow', () => {
    it('should handle complete communication lifecycle from message creation to deletion', async () => {
      // Step 1: Create multiple messages between users
      const message1 = await service.createMessage({
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Hello, how are you?',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', threadId: 'thread1' }
      });

      const message2 = await service.createMessage({
        senderId: 'user2',
        recipientId: 'user1',
        messageType: 'text' as const,
        content: 'I am doing well, thank you!',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', threadId: 'thread1' }
      });

      const message3 = await service.createMessage({
        senderId: 'user1',
        recipientId: 'user3',
        messageType: 'image' as const,
        content: 'Check out this image',
        priority: 'high' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', fileSize: '2MB', fileName: 'image.jpg' }
      });

      expect(message1).toBeDefined();
      expect(message2).toBeDefined();
      expect(message3).toBeDefined();

      // Step 2: Verify message creation and properties
      const allMessages = await service.getAllMessages();
      expect(allMessages).toHaveLength(3);

      // Step 3: Test message status transitions
      await service.updateMessage(message1.id, { status: 'delivered' as const });
      let updatedMessage1 = await service.getMessageById(message1.id);
      expect(updatedMessage1.status).toBe('delivered');

      await service.updateMessage(message2.id, { status: 'delivered' as const });
      let updatedMessage2 = await service.getMessageById(message2.id);
      expect(updatedMessage2.status).toBe('delivered');

      // Step 4: Mark messages as read
      const readMessage1 = await service.markMessageAsRead(message1.id);
      expect(readMessage1.status).toBe('read');
      expect(readMessage1.readAt).toBeDefined();

      const readMessage2 = await service.markMessageAsRead(message2.id);
      expect(readMessage2.status).toBe('read');
      expect(readMessage2.readAt).toBeDefined();

      // Step 5: Test message filtering by various criteria
      const user1SentMessages = await service.getMessagesBySender('user1');
      expect(user1SentMessages).toHaveLength(2);
      expect(user1SentMessages.every(msg => msg.senderId === 'user1')).toBe(true);

      const user2ReceivedMessages = await service.getMessagesByRecipient('user2');
      expect(user2ReceivedMessages).toHaveLength(1);
      expect(user2ReceivedMessages[0].recipientId).toBe('user2');

      const textMessages = await service.getMessagesByType('text');
      expect(textMessages).toHaveLength(2);
      expect(textMessages.every(msg => msg.messageType === 'text')).toBe(true);

      const imageMessages = await service.getMessagesByType('image');
      expect(imageMessages).toHaveLength(1);
      expect(imageMessages[0].messageType).toBe('image');

      const highPriorityMessages = await service.getMessagesByPriority('high');
      expect(highPriorityMessages).toHaveLength(1);
      expect(highPriorityMessages[0].priority).toBe('high');

      const normalPriorityMessages = await service.getMessagesByPriority('normal');
      expect(normalPriorityMessages).toHaveLength(2);
      expect(normalPriorityMessages.every(msg => msg.priority === 'normal')).toBe(true);

      // Step 6: Test unread message tracking
      const unreadMessages = await service.getUnreadMessages('user2');
      expect(unreadMessages).toHaveLength(0); // All messages are read

      // Create a new unread message
      const unreadMessage = await service.createMessage({
        senderId: 'user3',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'New unread message',
        priority: 'normal' as const,
        status: 'delivered' as const,
        metadata: { channel: 'internal' }
      });

      const newUnreadMessages = await service.getUnreadMessages('user2');
      expect(newUnreadMessages).toHaveLength(1);
      expect(newUnreadMessages[0].id).toBe(unreadMessage.id);

      // Step 7: Update message content and metadata
      await service.updateMessage(message3.id, {
        content: 'Updated image message',
        metadata: { channel: 'internal', fileSize: '3MB', fileName: 'updated_image.jpg' }
      });

      const updatedMessage3 = await service.getMessageById(message3.id);
      expect(updatedMessage3.content).toBe('Updated image message');
      expect(updatedMessage3.metadata.fileSize).toBe('3MB');
      expect(updatedMessage3.metadata.fileName).toBe('updated_image.jpg');

      // Step 8: Clean up - delete messages
      await service.deleteMessage(message1.id);
      await service.deleteMessage(message2.id);
      await service.deleteMessage(message3.id);
      await service.deleteMessage(unreadMessage.id);

      // Verify deletion
      const finalMessages = await service.getAllMessages();
      expect(finalMessages).toHaveLength(0);
    });

    it('should handle complex communication scenarios', async () => {
      // Create a conversation thread
      const threadId = 'conversation-thread-1';
      
      const message1 = await service.createMessage({
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'Let\'s discuss the project',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', threadId }
      });

      const message2 = await service.createMessage({
        senderId: 'user2',
        recipientId: 'user1',
        messageType: 'text' as const,
        content: 'Sure, what would you like to discuss?',
        priority: 'normal' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', threadId }
      });

      const message3 = await service.createMessage({
        senderId: 'user1',
        recipientId: 'user2',
        messageType: 'text' as const,
        content: 'I need your input on the design',
        priority: 'high' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', threadId }
      });

      const message4 = await service.createMessage({
        senderId: 'user2',
        recipientId: 'user1',
        messageType: 'image' as const,
        content: 'Here are my design suggestions',
        priority: 'high' as const,
        status: 'sent' as const,
        metadata: { channel: 'internal', threadId, fileSize: '5MB', fileName: 'design_suggestions.pdf' }
      });

      // Simulate message delivery and reading
      await service.updateMessage(message1.id, { status: 'delivered' as const });
      await service.updateMessage(message2.id, { status: 'delivered' as const });
      await service.updateMessage(message3.id, { status: 'delivered' as const });
      await service.updateMessage(message4.id, { status: 'delivered' as const });

      await service.markMessageAsRead(message1.id);
      await service.markMessageAsRead(message2.id);
      await service.markMessageAsRead(message3.id);
      await service.markMessageAsRead(message4.id);

      // Verify conversation flow
      const user1Messages = await service.getMessagesBySender('user1');
      expect(user1Messages).toHaveLength(2);
      expect(user1Messages.every(msg => msg.metadata.threadId === threadId)).toBe(true);

      const user2Messages = await service.getMessagesBySender('user2');
      expect(user2Messages).toHaveLength(2);
      expect(user2Messages.every(msg => msg.metadata.threadId === threadId)).toBe(true);

      // Test different message types in conversation
      const textMessages = await service.getMessagesByType('text');
      expect(textMessages).toHaveLength(3);

      const imageMessages = await service.getMessagesByType('image');
      expect(imageMessages).toHaveLength(1);

      // Test priority filtering
      const highPriorityMessages = await service.getMessagesByPriority('high');
      expect(highPriorityMessages).toHaveLength(2);

      // Test status filtering
      const readMessages = await service.getMessagesByStatus('read');
      expect(readMessages).toHaveLength(4);

      // Clean up
      await service.deleteMessage(message1.id);
      await service.deleteMessage(message2.id);
      await service.deleteMessage(message3.id);
      await service.deleteMessage(message4.id);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test operations on non-existent message
      await expect(service.getMessageById('non-existent-id'))
        .rejects.toThrow('Communication message not found');

      await expect(service.updateMessage('non-existent-id', { status: 'delivered' }))
        .rejects.toThrow('Communication message not found');

      await expect(service.deleteMessage('non-existent-id'))
        .rejects.toThrow('Communication message not found');

      await expect(service.markMessageAsRead('non-existent-id'))
        .rejects.toThrow('Communication message not found');

      // Test filtering with non-existent criteria
      const nonExistentSenderMessages = await service.getMessagesBySender('non-existent-user');
      expect(nonExistentSenderMessages).toHaveLength(0);

      const nonExistentRecipientMessages = await service.getMessagesByRecipient('non-existent-user');
      expect(nonExistentRecipientMessages).toHaveLength(0);

      const nonExistentTypeMessages = await service.getMessagesByType('non-existent-type');
      expect(nonExistentTypeMessages).toHaveLength(0);

      const nonExistentPriorityMessages = await service.getMessagesByPriority('non-existent-priority');
      expect(nonExistentPriorityMessages).toHaveLength(0);

      const nonExistentStatusMessages = await service.getMessagesByStatus('non-existent-status');
      expect(nonExistentStatusMessages).toHaveLength(0);
    });
  });
});