/**
 * @fileoverview Current User Decorator
 * @module Decorators/CurrentUser
 * @version 1.0.0
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../services/auth/JWTAuthenticationService';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
