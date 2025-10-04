import { Request, Response, NextFunction } from 'express';
import { CreatePilotDto, PilotFeedbackDto } from '../dto/pilot.dto';

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const validatePilotRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { careHomeName, location, region, size, type, contactEmail, contactPhone } = req.body;

  // Required fields validation
  if (!careHomeName || typeof careHomeName !== 'string' || careHomeName.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Care home name is required and must be a non-empty string'
    });
  }

  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Location is required and must be a non-empty string'
    });
  }

  if (!region || typeof region !== 'string' || region.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Region is required and must be a non-empty string'
    });
  }

  if (!size || typeof size !== 'number' || size <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Size is required and must be a positive number'
    });
  }

  if (!type || !['nursing', 'residential', 'dementia', 'mixed'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Type is required and must be one of: nursing, residential, dementia, mixed'
    });
  }

  if (!contactEmail || typeof contactEmail !== 'string' || !isValidEmail(contactEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Valid contact email is required'
    });
  }

  if (!contactPhone || typeof contactPhone !== 'string' || contactPhone.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Contact phone is required and must be a non-empty string'
    });
  }

  // Optional fields validation
  if (req.body.startDate && !isValidDate(req.body.startDate)) {
    return res.status(400).json({
      success: false,
      message: 'Start date must be a valid date'
    });
  }

  if (req.body.endDate && !isValidDate(req.body.endDate)) {
    return res.status(400).json({
      success: false,
      message: 'End date must be a valid date'
    });
  }

  if (req.body.features && !Array.isArray(req.body.features)) {
    return res.status(400).json({
      success: false,
      message: 'Features must be an array'
    });
  }

  next();
};

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const validatePilotFeedback = (req: Request, res: Response, next: NextFunction) => {
  const { tenantId, module, description, severity, suggestedFix, submittedBy } = req.body;

  // Required fields validation
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Tenant ID is required and must be a non-empty string'
    });
  }

  if (!module || typeof module !== 'string' || module.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Module is required and must be a non-empty string'
    });
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Description is required and must be at least 10 characters long'
    });
  }

  if (!severity || !['low', 'medium', 'high', 'critical'].includes(severity)) {
    return res.status(400).json({
      success: false,
      message: 'Severity is required and must be one of: low, medium, high, critical'
    });
  }

  if (!submittedBy || typeof submittedBy !== 'string' || submittedBy.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Submitted by is required and must be a non-empty string'
    });
  }

  // Optional fields validation
  if (suggestedFix && typeof suggestedFix !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Suggested fix must be a string'
    });
  }

  next();
};

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}