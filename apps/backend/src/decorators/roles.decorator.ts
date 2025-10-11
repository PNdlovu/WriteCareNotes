/**
 * @fileoverview Roles Decorator for authorization
 * @module Decorators/Roles
 * @version 1.0.0
 */

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
