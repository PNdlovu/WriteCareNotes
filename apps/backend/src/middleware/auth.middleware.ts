/**
 * @fileoverview auth.middleware
 * @module Auth.middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description auth.middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../services/auth/JWTAuthenticationService';

// Note: AuthenticatedRequest is now defined globally in src/types/express.d.ts
// This ensures consistency across the application

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId,
      roles: decoded.roles || [decoded.role || 'user'],
      permissions: decoded.permissions || [],
      dataAccessLevel: decoded.dataAccessLevel || 0,
      complianceLevel: decoded.complianceLevel || 0
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Alias for backward compatibility
export const authMiddleware = authenticateToken;

// Alias for consistency with tenant routes (GROUP 1 verification)
export const authenticateJWT = authenticateToken;
