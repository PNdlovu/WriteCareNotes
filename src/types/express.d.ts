import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Express Type Extensions for WriteCareNotes
 * @module ExpressTypes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Type extensions for Express.js to support
 * healthcare-specific request context and user information.
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tenantId: string;
        permissions: string[];
        roles: string[];
        organizationId?: string;
      };
      tenant?: {
        id: string;
        isolationLevel: 'strict' | 'relaxed';
      };
      correlationId?: string;
      context?: {
        correlationId: string;
        [key: string]: any;
      };
    }
  }
}

export {};