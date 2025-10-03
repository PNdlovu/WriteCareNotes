import { Request, Response } from 'express';
import { GraphQLGatewayService } from '../../services/graphql/GraphQLGatewayService';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse {
  data?: any;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
    extensions?: Record<string, any>;
  }>;
  extensions?: Record<string, any>;
}

export class GraphQLController {
  private graphQLService: GraphQLGatewayService;
  private auditService: AuditTrailService;

  constructor() {
    this.graphQLService = new GraphQLGatewayService();
    this.auditService = new AuditTrailService();
  }

  /**
   * Handle GraphQL requests
   */
  async handleGraphQL(req: Request, res: Response): Promise<void> {
    try {
      const { query, variables = {}, operationName } = req.body as GraphQLRequest;

      // Validate request
      if (!query) {
        res.status(400).json({
          errors: [{
            message: 'Query is required',
            extensions: {
              code: 'MISSING_QUERY'
            }
          }]
        });
        return;
      }

      // Extract context from request
      const context = this.extractContext(req);

      // Execute GraphQL query/mutation
      const execution = await this.graphQLService.executeQuery(
        query,
        variables,
        operationName,
        context
      );

      // Prepare response
      const response: GraphQLResponse = {
        data: execution.result?.data,
        errors: execution.error ? [{
          message: execution.error,
          extensions: {
            code: 'EXECUTION_ERROR',
            executionId: execution.id
          }
        }] : undefined,
        extensions: {
          executionId: execution.id,
          duration: execution.duration,
          timestamp: execution.startTime.toISOString()
        }
      };

      // Set response status
      const statusCode = execution.status === 'completed' ? 200 : 500;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('GraphQL request failed:', error);
      
      const response: GraphQLResponse = {
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
          extensions: {
            code: 'INTERNAL_ERROR'
          }
        }]
      };

      res.status(500).json(response);
    }
  }

  /**
   * Handle GraphQL mutations
   */
  async handleMutation(req: Request, res: Response): Promise<void> {
    try {
      const { mutation, variables = {}, operationName } = req.body as GraphQLRequest;

      // Validate request
      if (!mutation) {
        res.status(400).json({
          errors: [{
            message: 'Mutation is required',
            extensions: {
              code: 'MISSING_MUTATION'
            }
          }]
        });
        return;
      }

      // Extract context from request
      const context = this.extractContext(req);

      // Execute GraphQL mutation
      const execution = await this.graphQLService.executeMutation(
        mutation,
        variables,
        operationName,
        context
      );

      // Prepare response
      const response: GraphQLResponse = {
        data: execution.result?.data,
        errors: execution.error ? [{
          message: execution.error,
          extensions: {
            code: 'EXECUTION_ERROR',
            executionId: execution.id
          }
        }] : undefined,
        extensions: {
          executionId: execution.id,
          duration: execution.duration,
          timestamp: execution.startTime.toISOString()
        }
      };

      // Set response status
      const statusCode = execution.status === 'completed' ? 200 : 500;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('GraphQL mutation failed:', error);
      
      const response: GraphQLResponse = {
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
          extensions: {
            code: 'INTERNAL_ERROR'
          }
        }]
      };

      res.status(500).json(response);
    }
  }

  /**
   * Handle GraphQL subscriptions
   */
  async handleSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { subscription, variables = {}, operationName } = req.body as GraphQLRequest;

      // Validate request
      if (!subscription) {
        res.status(400).json({
          errors: [{
            message: 'Subscription is required',
            extensions: {
              code: 'MISSING_SUBSCRIPTION'
            }
          }]
        });
        return;
      }

      // Extract context from request
      const context = this.extractContext(req);

      // Create subscription
      const subscriptionId = await this.graphQLService.subscribe(
        subscription,
        variables,
        operationName,
        context
      );

      // Prepare response
      const response: GraphQLResponse = {
        data: {
          subscriptionId,
          status: 'created'
        },
        extensions: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('GraphQL subscription failed:', error);
      
      const response: GraphQLResponse = {
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
          extensions: {
            code: 'INTERNAL_ERROR'
          }
        }]
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get GraphQL schema
   */
  async getSchema(req: Request, res: Response): Promise<void> {
    try {
      const { schemaId } = req.params;

      if (schemaId) {
        // Get specific schema
        const schema = this.graphQLService.getSchema(schemaId);
        if (!schema) {
          res.status(404).json({
            error: 'Schema not found',
            code: 'SCHEMA_NOT_FOUND'
          });
          return;
        }

        res.json({
          success: true,
          data: schema
        });
      } else {
        // Get all schemas
        const schemas = this.graphQLService.getAllSchemas();
        res.json({
          success: true,
          data: schemas
        });
      }

    } catch (error) {
      console.error('Failed to get schema:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        tenantId,
        status,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = req.query;

      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (tenantId) filters.tenantId = tenantId as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const executions = this.graphQLService.getExecutionHistory(filters);
      const paginatedExecutions = executions.slice(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          executions: paginatedExecutions,
          total: executions.length,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });

    } catch (error) {
      console.error('Failed to get execution history:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get execution by ID
   */
  async getExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = this.graphQLService.getExecution(executionId);
      if (!execution) {
        res.status(404).json({
          error: 'Execution not found',
          code: 'EXECUTION_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        data: execution
      });

    } catch (error) {
      console.error('Failed to get execution:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get GraphQL metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.graphQLService.getMetrics();

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      console.error('Failed to get metrics:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const schemas = this.graphQLService.getAllSchemas();
      const metrics = this.graphQLService.getMetrics();

      res.json({
        success: true,
        data: {
          status: 'healthy',
          schemas: schemas.length,
          metrics: {
            totalQueries: metrics.totalQueries,
            totalMutations: metrics.totalMutations,
            totalSubscriptions: metrics.totalSubscriptions,
            averageResponseTime: metrics.averageResponseTime,
            errorRate: metrics.errorRate
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Extract context from request
   */
  private extractContext(req: Request): {
    userId: string;
    tenantId: string;
    permissions: string[];
  } {
    // Extract user information from JWT token or session
    const userId = (req as any).user?.id || 'anonymous';
    const tenantId = (req as any).user?.tenantId || 'default';
    const permissions = (req as any).user?.permissions || ['graphql:execute'];

    return {
      userId,
      tenantId,
      permissions
    };
  }
}

export default GraphQLController;