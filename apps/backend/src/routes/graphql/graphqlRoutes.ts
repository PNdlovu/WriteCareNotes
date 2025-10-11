import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { GraphQLController } from '../../controllers/graphql/GraphQLController';
import { rbacMiddleware } from '../../middleware/rbacMiddleware';
import { rateLimitMiddleware } from '../../middleware/rateLimitMiddleware';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
const graphQLController = new GraphQLController();

// GraphQL endpoint
router.post(
  '/graphql',
  [
    body('query').notEmpty().withMessage('Query is required'),
    body('variables').optional().isObject().withMessage('variables must be an object'),
    body('operationName').optional().isString().withMessage('Operation name must be a string')
  ],
  validateRequest,
  rateLimitMiddleware({ windowMs: 60000, max: 100 }), // 100 requests per minute
  rbacMiddleware(['graphql:execute']),
  graphQLController.handleGraphQL.bind(graphQLController)
);

// GraphQL mutations endpoint
router.post(
  '/graphql/mutations',
  [
    body('mutation').notEmpty().withMessage('Mutation is required'),
    body('variables').optional().isObject().withMessage('variables must be an object'),
    body('operationName').optional().isString().withMessage('Operation name must be a string')
  ],
  validateRequest,
  rateLimitMiddleware({ windowMs: 60000, max: 50 }), // 50 mutations per minute
  rbacMiddleware(['graphql:execute', 'graphql:mutate']),
  graphQLController.handleMutation.bind(graphQLController)
);

// GraphQL subscriptions endpoint
router.post(
  '/graphql/subscriptions',
  [
    body('subscription').notEmpty().withMessage('Subscription is required'),
    body('variables').optional().isObject().withMessage('variables must be an object'),
    body('operationName').optional().isString().withMessage('Operation name must be a string')
  ],
  validateRequest,
  rateLimitMiddleware({ windowMs: 60000, max: 20 }), // 20 subscriptions per minute
  rbacMiddleware(['graphql:subscribe']),
  graphQLController.handleSubscription.bind(graphQLController)
);

// Get GraphQL schemas
router.get(
  '/graphql/schemas',
  rbacMiddleware(['graphql:read']),
  graphQLController.getSchema.bind(graphQLController)
);

// Get specific GraphQL schema
router.get(
  '/graphql/schemas/:schemaId',
  [
    param('schemaId').isString().withMessage('Schema ID must be a string')
  ],
  validateRequest,
  rbacMiddleware(['graphql:read']),
  graphQLController.getSchema.bind(graphQLController)
);

// Get execution history
router.get(
  '/graphql/executions',
  [
    query('userId').optional().isString().withMessage('User ID must be a string'),
    query('tenantId').optional().isString().withMessage('Tenant ID must be a string'),
    query('status').optional().isString().withMessage('Status must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer')
  ],
  validateRequest,
  rbacMiddleware(['graphql:read']),
  graphQLController.getExecutionHistory.bind(graphQLController)
);

// Get specific execution
router.get(
  '/graphql/executions/:executionId',
  [
    param('executionId').isString().withMessage('Execution ID must be a string')
  ],
  validateRequest,
  rbacMiddleware(['graphql:read']),
  graphQLController.getExecution.bind(graphQLController)
);

// Get GraphQL metrics
router.get(
  '/graphql/metrics',
  rbacMiddleware(['graphql:read', 'graphql:metrics']),
  graphQLController.getMetrics.bind(graphQLController)
);

// Health check
router.get(
  '/graphql/health',
  graphQLController.healthCheck.bind(graphQLController)
);

export default router;
