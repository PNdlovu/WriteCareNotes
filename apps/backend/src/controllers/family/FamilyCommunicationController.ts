import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { body, param, query, validationResult } from 'express-validator';
import {
  FamilyCommunicationService,
  CreateFamilyMemberDTO,
  UpdateFamilyMemberDTO,
  CreateMessageDTO,
  CreateVisitRequestDTO,
  FamilyFilters,
  MessageFilters,
  VisitFilters
} from '../../services/family/FamilyCommunicationService';
import { RelationshipType, AccessLevel, FamilyMemberStatus } from '../../entities/family/FamilyMember';
import { MessageType, MessagePriority } from '../../entities/family/FamilyMessage';
import { VisitType, VisitPriority } from '../../entities/family/VisitRequest';

/**
 * Service #9: Family Communication Controller
 * 
 * HTTP API layer for family portal management
 */
export class FamilyCommunicationController {
  privatefamilyService: FamilyCommunicationService;

  const ructor(private dataSource: DataSource) {
    this.familyService = new FamilyCommunicationService(dataSource);
  }

  /**
   * FAMILY MEMBER ENDPOINTS
   */

  async createFamilyMember(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const organizationId = (req as any).organizationId;
      const dto: CreateFamilyMemberDTO = { ...req.body, organizationId };

      const familyMember = await this.familyService.createFamilyMember(dto);

      return res.status(201).json({
        success: true,
        data: familyMember,
        message: 'Family member created successfully',
      });
    } catch (error: any) {
      console.error('Error creating familymember:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getFamilyMember(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const familyMember = await this.familyService.findFamilyMemberById(id, organizationId);

      if (!familyMember) {
        return res.status(404).json({ success: false, error: 'Family member not found' });
      }

      return res.json({ success: true, data: familyMember });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAllFamilyMembers(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: FamilyFilters = {};
      if (req.query.residentId) filters.residentId = req.query.residentId as string;
      if (req.query.relationship) filters.relationship = req.query.relationship as RelationshipType;
      if (req.query.accessLevel) filters.accessLevel = req.query.accessLevel as AccessLevel;
      if (req.query.status) filters.status = req.query.status as FamilyMemberStatus;
      if (req.query.isPrimaryContact !== undefined) filters.isPrimaryContact = req.query.isPrimaryContact === 'true';

      const result = await this.familyService.findAllFamilyMembers(organizationId, filters, page, limit);

      return res.json({
        success: true,
        data: result.familyMembers,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateFamilyMember(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const dto: UpdateFamilyMemberDTO = req.body;

      const familyMember = await this.familyService.updateFamilyMember(id, organizationId, dto);

      return res.json({
        success: true,
        data: familyMember,
        message: 'Family member updated successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteFamilyMember(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      await this.familyService.deleteFamilyMember(id, organizationId);

      return res.json({
        success: true,
        message: 'Family member deleted successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async verifyFamilyMember(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;

      const familyMember = await this.familyService.verifyFamilyMember(token);

      return res.json({
        success: true,
        data: familyMember,
        message: 'Family member verified successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getFamilyByResident(req: Request, res: Response): Promise<Response> {
    try {
      const { residentId } = req.params;
      const organizationId = (req as any).organizationId;

      const familyMembers = await this.familyService.getFamilyMembersByResident(residentId, organizationId);

      return res.json({
        success: true,
        data: familyMembers,
        message: `Found ${familyMembers.length} family members`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * MESSAGE ENDPOINTS
   */

  async createMessage(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const organizationId = (req as any).organizationId;
      const dto: CreateMessageDTO = { ...req.body, organizationId };

      const message = await this.familyService.createMessage(dto);

      return res.status(201).json({
        success: true,
        data: message,
        message: 'Message sent successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMessage(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const message = await this.familyService.findMessageById(id, organizationId);

      if (!message) {
        return res.status(404).json({ success: false, error: 'Message not found' });
      }

      return res.json({ success: true, data: message });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAllMessages(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: MessageFilters = {};
      if (req.query.familyId) filters.familyId = req.query.familyId as string;
      if (req.query.residentId) filters.residentId = req.query.residentId as string;
      if (req.query.type) filters.type = req.query.type as MessageType;
      if (req.query.priority) filters.priority = req.query.priority as MessagePriority;
      if (req.query.fromFamily !== undefined) filters.fromFamily = req.query.fromFamily === 'true';
      if (req.query.read !== undefined) filters.read = req.query.read === 'true';

      const result = await this.familyService.findAllMessages(organizationId, filters, page, limit);

      return res.json({
        success: true,
        data: result.messages,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async markMessageAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const readBy = req.body.readBy;

      const message = await this.familyService.markMessageAsRead(id, organizationId, readBy);

      return res.json({
        success: true,
        data: message,
        message: 'Message marked as read',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async acknowledgeMessage(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const { acknowledgedBy, notes } = req.body;

      const message = await this.familyService.acknowledgeMessage(id, organizationId, acknowledgedBy, notes);

      return res.json({
        success: true,
        data: message,
        message: 'Message acknowledged',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUnreadMessages(req: Request, res: Response): Promise<Response> {
    try {
      const { familyId } = req.params;
      const organizationId = (req as any).organizationId;

      const messages = await this.familyService.getUnreadMessages(familyId, organizationId);

      return res.json({
        success: true,
        data: messages,
        message: `Found ${messages.length} unread messages`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * VISIT ENDPOINTS
   */

  async createVisitRequest(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const organizationId = (req as any).organizationId;
      const dto: CreateVisitRequestDTO = { ...req.body, organizationId };

      const visit = await this.familyService.createVisitRequest(dto);

      return res.status(201).json({
        success: true,
        data: visit,
        message: 'Visit request created successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getVisitRequest(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;

      const visit = await this.familyService.findVisitById(id, organizationId);

      if (!visit) {
        return res.status(404).json({ success: false, error: 'Visit request not found' });
      }

      return res.json({ success: true, data: visit });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAllVisitRequests(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: VisitFilters = {};
      if (req.query.familyId) filters.familyId = req.query.familyId as string;
      if (req.query.residentId) filters.residentId = req.query.residentId as string;
      if (req.query.type) filters.type = req.query.type as VisitType;
      if (req.query.status) filters.status = req.query.status as any;
      if (req.query.priority) filters.priority = req.query.priority as VisitPriority;

      const result = await this.familyService.findAllVisits(organizationId, filters, page, limit);

      return res.json({
        success: true,
        data: result.visits,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async approveVisit(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const { approvedBy, notes } = req.body;

      const visit = await this.familyService.approveVisit(id, organizationId, approvedBy, notes);

      return res.json({
        success: true,
        data: visit,
        message: 'Visit approved successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async denyVisit(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const { deniedBy, reason } = req.body;

      const visit = await this.familyService.denyVisit(id, organizationId, deniedBy, reason);

      return res.json({
        success: true,
        data: visit,
        message: 'Visit denied',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async cancelVisit(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const { cancelledBy, reason } = req.body;

      const visit = await this.familyService.cancelVisit(id, organizationId, cancelledBy, reason);

      return res.json({
        success: true,
        data: visit,
        message: 'Visit cancelled successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async rescheduleVisit(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const { newTime, rescheduledBy, reason } = req.body;

      const visit = await this.familyService.rescheduleVisit(id, organizationId, new Date(newTime), rescheduledBy, reason);

      return res.json({
        success: true,
        data: visit,
        message: 'Visit rescheduled successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async completeVisit(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const organizationId = (req as any).organizationId;
      const { completedBy, notes } = req.body;

      const visit = await this.familyService.completeVisit(id, organizationId, completedBy, notes);

      return res.json({
        success: true,
        data: visit,
        message: 'Visit completed successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUpcomingVisits(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;
      const daysAhead = parseInt(req.query.daysAhead as string) || 7;

      const visits = await this.familyService.getUpcomingVisits(organizationId, daysAhead);

      return res.json({
        success: true,
        data: visits,
        message: `Found ${visits.length} upcoming visits`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPendingVisits(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;

      const visits = await this.familyService.getPendingVisits(organizationId);

      return res.json({
        success: true,
        data: visits,
        message: `Found ${visits.length} pending visits`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * STATISTICS
   */

  async getStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const organizationId = (req as any).organizationId;

      const stats = await this.familyService.getStatistics(organizationId);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

/**
 * Validation Rules
 */
export const createFamilyMemberValidation = [
  body('residentId').notEmpty().withMessage('Resident ID is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('relationship').isIn(Object.values(RelationshipType)).withMessage('Invalid relationship type'),
];

export const updateFamilyMemberValidation = [
  body('email').optional().isEmail(),
  body('accessLevel').optional().isIn(Object.values(AccessLevel)),
  body('status').optional().isIn(Object.values(FamilyMemberStatus)),
];

export const createMessageValidation = [
  body('familyId').notEmpty().withMessage('Family ID is required'),
  body('residentId').notEmpty().withMessage('Resident ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('fromFamily').isBoolean().withMessage('fromFamily must be boolean'),
];

export const createVisitValidation = [
  body('familyId').notEmpty().withMessage('Family ID is required'),
  body('residentId').notEmpty().withMessage('Resident ID is required'),
  body('type').isIn(Object.values(VisitType)).withMessage('Invalid visit type'),
  body('title').notEmpty().withMessage('Title is required'),
  body('scheduledTime').isISO8601().withMessage('Valid scheduled time required'),
  body('participants').isArray().withMessage('Participants must be an array'),
  body('location').isObject().withMessage('Location must be an object'),
];
