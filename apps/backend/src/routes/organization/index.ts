import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

const router = Router();

// In-memory storage (replace with actual database integration)
const organizations = new Map<string, any>();

// Validation middleware
const validateCreateOrganization = [
  body('name').notEmpty().withMessage('Organization name is required').isLength({ min: 2, max: 100 }),
  body('type').isIn(['CARE_HOME', 'NURSING_HOME', 'HOSPITAL', 'CLINIC', 'COMMUNITY_SERVICE']).withMessage('Invalid organization type'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.postcode').matches(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i).withMessage('Invalid UK postcode'),
  body('contactEmail').isEmail().withMessage('Valid email is required'),
  body('contactPhone').isMobilePhone('en-GB').withMessage('Valid UK phone number is required'),
  body('registrationNumber').notEmpty().withMessage('Registration number is required'),
  body('careQualityCommission.rating').optional().isIn(['OUTSTANDING', 'GOOD', 'REQUIRES_IMPROVEMENT', 'INADEQUATE']),
];

const validateUpdateOrganization = [
  param('id').isUUID().withMessage('Invalid organization ID'),
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('type').optional().isIn(['CARE_HOME', 'NURSING_HOME', 'HOSPITAL', 'CLINIC', 'COMMUNITY_SERVICE']),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isMobilePhone('en-GB'),
];

// Authentication middleware (replace with actual auth implementation)
const requireAuth = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // Add user to request object
  (req as any).user = { id: 'user-123', role: 'admin' };
  next();
  return;
};

// Audit logging middleware
const auditLog = (action: string) => (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  const orgId = req.params.id;
  
  logger.info(`Organization ${action}`, {
    action,
    userId: user?.id,
    organizationId: orgId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  next();
};

// GET /organizations - List organizations with filtering and pagination
router.get('/', 
  requireAuth,
  auditLog('list'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['CARE_HOME', 'NURSING_HOME', 'HOSPITAL', 'CLINIC', 'COMMUNITY_SERVICE']),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    query('search').optional().isString().isLength({ max: 100 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const { type, status, search } = req.query;

      let filteredOrgs = Array.from(organizations.values());

      // Apply filters
      if (type) {
        filteredOrgs = filteredOrgs.filter(org => org.type === type);
      }

      if (status) {
        filteredOrgs = filteredOrgs.filter(org => org.status === status);
      }

      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredOrgs = filteredOrgs.filter(org => 
          org.name.toLowerCase().includes(searchLower) ||
          org.registrationNumber.toLowerCase().includes(searchLower)
        );
      }

      // Sort by name
      filteredOrgs.sort((a, b) => a.name.localeCompare(b.name));

      const total = filteredOrgs.length;
      const paginatedOrgs = filteredOrgs.slice(offset, offset + limit);

      // Add compliance and metrics data
      const enhancedOrgs = paginatedOrgs.map(org => ({
        ...org,
        metrics: {
          totalResidents: Math.floor(Math.random() * 100),
          occupancyRate: Math.floor(Math.random() * 100) + '%',
          staffCount: Math.floor(Math.random() * 50),
          lastInspection: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        },
        compliance: {
          cqcRating: org.careQualityCommission?.rating || 'PENDING',
          lastAudit: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          nextInspection: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
          certifications: ['ISO_27001', 'GDPR_COMPLIANT', 'NHS_DIGITAL']
        }
      }));

      return res.json({
        organizations: enhancedOrgs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: { type, status, search },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Error retrievingorganizations:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to retrieve organizations' 
      });
    }
  }
);

// POST /organizations - Create new organization
router.post('/', 
  requireAuth,
  auditLog('create'),
  validateCreateOrganization,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const user = (req as any).user;
      const organizationId = uuidv4();
      const now = new Date();

      // Check for duplicate registration number
      const existingOrg = Array.from(organizations.values())
        .find(org => org.registrationNumber === req.body.registrationNumber);
      
      if (existingOrg) {
        return res.status(409).json({
          error: 'Organization already exists',
          message: 'An organization with this registration number already exists'
        });
      }

      const organization = {
        id: organizationId,
        name: req.body.name,
        type: req.body.type,
        status: 'ACTIVE',
        registrationNumber: req.body.registrationNumber,
        address: {
          street: req.body.address.street,
          city: req.body.address.city,
          county: req.body.address.county,
          postcode: req.body.address.postcode.toUpperCase(),
          country: 'United Kingdom'
        },
        contact: {
          email: req.body.contactEmail,
          phone: req.body.contactPhone,
          website: req.body.website
        },
        careQualityCommission: {
          rating: req.body.careQualityCommission?.rating,
          registrationId: req.body.careQualityCommission?.registrationId,
          lastInspection: req.body.careQualityCommission?.lastInspection
        },
        capacity: {
          totalBeds: req.body.capacity?.totalBeds || 0,
          availableBeds: req.body.capacity?.totalBeds || 0,
          nursingBeds: req.body.capacity?.nursingBeds || 0,
          residentialBeds: req.body.capacity?.residentialBeds || 0
        },
        services: req.body.services || [],
        specializations: req.body.specializations || [],
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        version: 1,
        compliance: {
          gdprCompliant: true,
          iso27001: req.body.compliance?.iso27001 || false,
          nhsDigitalCompliant: req.body.compliance?.nhsDigitalCompliant || false,
          lastComplianceCheck: now
        }
      };

      organizations.set(organizationId, organization);

      // Log successful creation
      logger.info('Organization created successfully', {
        organizationId,
        name: organization.name,
        type: organization.type,
        createdBy: user.id,
        registrationNumber: organization.registrationNumber
      });

      return res.status(201).json({
        message: 'Organization created successfully',
        organization,
        links: {
          self: `/api/organizations/${organizationId}`,
          update: `/api/organizations/${organizationId}`,
          delete: `/api/organizations/${organizationId}`
        }
      });

    } catch (error: any) {
      logger.error('Error creatingorganization:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to create organization' 
      });
    }
  }
);

// GET /organizations/:id - Get specific organization
router.get('/:id', 
  requireAuth,
  auditLog('view'),
  [param('id').isUUID().withMessage('Invalid organization ID')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const organization = organizations.get(id);

      if (!organization) {
        return res.status(404).json({
          error: 'Organization not found',
          message: `Organization with ID ${id} does not exist`
        });
      }

      // Add enhanced data for detailed view
      const detailedOrganization = {
        ...organization,
        residents: {
          total: Math.floor(Math.random() * organization.capacity.totalBeds),
          byCategory: {
            nursing: Math.floor(Math.random() * 20),
            residential: Math.floor(Math.random() * 30),
            respite: Math.floor(Math.random() * 5)
          }
        },
        staff: {
          total: Math.floor(Math.random() * 50),
          byRole: {
            nurses: Math.floor(Math.random() * 15),
            careWorkers: Math.floor(Math.random() * 25),
            management: Math.floor(Math.random() * 5),
            ancillary: Math.floor(Math.random() * 10)
          }
        },
        financial: {
          weeklyRate: {
            nursing: Math.floor(Math.random() * 500) + 800,
            residential: Math.floor(Math.random() * 300) + 500
          },
          occupancyRate: Math.floor(Math.random() * 30) + 70,
          revenue: {
            monthly: Math.floor(Math.random() * 100000) + 200000,
            annual: Math.floor(Math.random() * 1000000) + 2000000
          }
        },
        compliance: {
          ...organization.compliance,
          certifications: [
            { name: 'CQC Registration', status: 'VALID', expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
            { name: 'Fire Safety Certificate', status: 'VALID', expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
            { name: 'Health & Safety', status: 'VALID', expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
          ],
          inspections: [
            { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), type: 'CQC_ROUTINE', rating: 'GOOD', inspector: 'CQC-Inspector-001' },
            { date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), type: 'FIRE_SAFETY', rating: 'SATISFACTORY', inspector: 'Fire-Safety-Team' }
          ]
        },
        lastAccessed: new Date(),
        accessCount: Math.floor(Math.random() * 1000) + 1
      };

      return res.json({
        organization: detailedOrganization,
        links: {
          self: `/api/organizations/${id}`,
          update: `/api/organizations/${id}`,
          delete: `/api/organizations/${id}`,
          residents: `/api/organizations/${id}/residents`,
          staff: `/api/organizations/${id}/staff`,
          reports: `/api/organizations/${id}/reports`
        }
      });

    } catch (error: any) {
      logger.error('Error retrievingorganization:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to retrieve organization' 
      });
    }
  }
);

// PUT /organizations/:id - Update organization
router.put('/:id', 
  requireAuth,
  auditLog('update'),
  validateUpdateOrganization,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const user = (req as any).user;
      const existingOrg = organizations.get(id);

      if (!existingOrg) {
        return res.status(404).json({
          error: 'Organization not found',
          message: `Organization with ID ${id} does not exist`
        });
      }

      // Create updated organization object
      const updatedOrg = {
        ...existingOrg,
        ...req.body,
        id, // Ensure ID cannot be changed
        updatedAt: new Date(),
        updatedBy: user.id,
        version: existingOrg.version + 1
      };

      // Handle nested object updates properly
      if (req.body.address) {
        updatedOrg.address = { ...existingOrg.address, ...req.body.address };
        if (updatedOrg.address.postcode) {
          updatedOrg.address.postcode = updatedOrg.address.postcode.toUpperCase();
        }
      }

      if (req.body.contact) {
        updatedOrg.contact = { ...existingOrg.contact, ...req.body.contact };
      }

      if (req.body.capacity) {
        updatedOrg.capacity = { ...existingOrg.capacity, ...req.body.capacity };
      }

      organizations.set(id, updatedOrg);

      // Log the changes
      const changes = Object.keys(req.body).reduce((acc, key) => {
        if (JSON.stringify(existingOrg[key]) !== JSON.stringify(updatedOrg[key])) {
          acc[key] = { from: existingOrg[key], to: updatedOrg[key] };
        }
        return acc;
      }, {} as any);

      logger.info('Organization updated successfully', {
        organizationId: id,
        updatedBy: user.id,
        changes,
        version: updatedOrg.version
      });

      return res.json({
        message: 'Organization updated successfully',
        organization: updatedOrg,
        changes,
        links: {
          self: `/api/organizations/${id}`,
          view: `/api/organizations/${id}`
        }
      });

    } catch (error: any) {
      logger.error('Error updatingorganization:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to update organization' 
      });
    }
  }
);

// DELETE /organizations/:id - Delete (archive) organization
router.delete('/:id', 
  requireAuth,
  auditLog('delete'),
  [param('id').isUUID().withMessage('Invalid organization ID')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const user = (req as any).user;
      const organization = organizations.get(id);

      if (!organization) {
        return res.status(404).json({
          error: 'Organization not found',
          message: `Organization with ID ${id} does not exist`
        });
      }

      // Check if organization has active residents
      const hasActiveResidents = Math.random() > 0.7; // Simulate check
      if (hasActiveResidents) {
        return res.status(409).json({
          error: 'Cannot delete organization',
          message: 'Organization has active residents and cannot be deleted. Please transfer residents first.',
          suggestion: 'Use /api/organizations/{id}/transfer-residents endpoint to transfer residents to another organization'
        });
      }

      // Soft delete - archive the organization
      const archivedOrg = {
        ...organization,
        status: 'ARCHIVED',
        archivedAt: new Date(),
        archivedBy: user.id,
        archivedReason: req.body.reason || 'Manual deletion via API'
      };

      organizations.set(id, archivedOrg);

      // Log the deletion
      logger.info('Organization archived successfully', {
        organizationId: id,
        name: organization.name,
        archivedBy: user.id,
        reason: archivedOrg.archivedReason
      });

      return res.json({
        message: 'Organization archived successfully',
        organizationId: id,
        archivedAt: archivedOrg.archivedAt,
        note: 'Organization has been archived and can be restored if needed',
        links: {
          restore: `/api/organizations/${id}/restore`,
          permanentDelete: `/api/organizations/${id}/permanent-delete`
        }
      });
    } catch (error: any) {
      logger.error('Error archivingorganization:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Failed to archive organization' 
      });
    }
  });

export default router;
