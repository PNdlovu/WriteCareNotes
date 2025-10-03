import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export class ValidationMiddleware {
  static schemas = {
    uuid: Joi.string().uuid().required(),
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().optional(),
      order: Joi.string().valid('asc', 'desc').default('asc')
    }),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    string: () => Joi.string(),
    number: () => Joi.number(),
    object: (schema?: any) => Joi.object(schema),
    array: () => Joi.array(),
    date: Joi.date(),
    dateOptional: Joi.date().optional()
  };

  static healthcareSchemas = {
    medication: Joi.object({
      name: Joi.string().required(),
      dosage: Joi.string().required(),
      frequency: Joi.string().required(),
      residentId: Joi.string().uuid().required()
    }),
    consent: Joi.object({
      residentId: Joi.string().uuid().required(),
      consentType: Joi.string().required(),
      granted: Joi.boolean().required(),
      grantedBy: Joi.string().required(),
      grantedAt: Joi.date().required()
    })
  };

  static validateBody(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          }
        });
        return;
      }
      next();
    };
  }

  static validateQuery(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          }
        });
        return;
      }
      req.query = value;
      next();
    };
  }

  static validateParams(schema: Joi.StringSchema | Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      let error;
      if (schema.type === 'string') {
        error = (schema as Joi.StringSchema).validate(req.params['id']).error;
      } else {
        error = (schema as Joi.ObjectSchema).validate(req.params).error;
      }
      
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          }
        });
        return;
      }
      next();
    };
  }
}