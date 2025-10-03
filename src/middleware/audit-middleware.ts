import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Basic audit middleware
 */
export const auditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    console.info('Request audited', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

export default auditMiddleware;