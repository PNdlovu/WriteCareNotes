import { EventEmitter2 } from "eventemitter2";
import { AuthenticatedUser } from "../services/auth/JWTAuthenticationService";

/**
 * @fileoverview Express Type Extensions for WriteCareNotes
 * @module ExpressTypes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Type extensions for Express.js to support
 * care home-specific request context and user information.
 */

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
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
