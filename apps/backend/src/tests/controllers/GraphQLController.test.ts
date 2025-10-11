import { Request, Response } from 'express';
import { GraphQLController } from '../../controllers/graphql/GraphQLController';
import { GraphQLGatewayService } from '../../services/graphql/GraphQLGatewayService';

// Mock the GraphQL service
jest.mock('../../services/graphql/GraphQLGatewayService');

describe('GraphQLController', () => {
  letcontroller: GraphQLController;
  letmockGraphQLService: jest.Mocked<GraphQLGatewayService>;
  letmockRequest: Partial<Request>;
  letmockResponse: Partial<Response>;

  beforeEach(() => {
    mockGraphQLService = {
      executeQuery: jest.fn(),
      executeMutation: jest.fn(),
      subscribe: jest.fn(),
      getSchema: jest.fn(),
      getAllSchemas: jest.fn(),
      getExecutionHistory: jest.fn(),
      getExecution: jest.fn(),
      getMetrics: jest.fn()
    } as any;

    (GraphQLGatewayService as jest.Mock).mockImplementation(() => mockGraphQLService);

    controller = new GraphQLController();

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-1', tenantId: 'tenant-1', permissions: ['graphql:execute'] }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGraphQL', () => {
    it('should handle GraphQL query successfully', async () => {
      const query = 'query { invoices { id invoiceNumber amountDue } }';
      const variables = { limit: 10 };
      const operationName = 'GetInvoices';

      mockRequest.body = { query, variables, operationName };

      const mockExecution = {
        id: 'exec-1',
        query,
        variables,
        operationName,
        status: 'completed',
        result: {
          data: {
            invoices: [
              { id: '1', invoiceNumber: 'INV-001', amountDue: 1000 }
            ]
          }
        },
        error: null,
        startTime: new Date(),
        endTime: new Date(),
        duration: 100,
        userId: 'user-1',
        tenantId: 'tenant-1',
        permissions: ['graphql:execute'],
        metadata: {}
      };

      mockGraphQLService.executeQuery.mockResolvedValue(mockExecution);

      await controller.handleGraphQL(mockRequest as Request, mockResponse as Response);

      expect(mockGraphQLService.executeQuery).toHaveBeenCalledWith(
        query,
        variables,
        operationName,
        { userId: 'user-1', tenantId: 'tenant-1', permissions: ['graphql:execute'] }
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockExecution.result.data,
        errors: undefined,
        extensions: {
          executionId: mockExecution.id,
          duration: mockExecution.duration,
          timestamp: mockExecution.startTime.toISOString()
        }
      });
    });

    it('should handle GraphQL query with errors', async () => {
      const query = 'query { invalidField }';
      mockRequest.body = { query };

      const mockExecution = {
        id: 'exec-1',
        query,
        variables: {},
        operationName: undefined,
        status: 'failed',
        result: null,
        error: 'Field "invalidField" not found',
        startTime: new Date(),
        endTime: new Date(),
        duration: 50,
        userId: 'user-1',
        tenantId: 'tenant-1',
        permissions: ['graphql:execute'],
        metadata: {}
      };

      mockGraphQLService.executeQuery.mockResolvedValue(mockExecution);

      await controller.handleGraphQL(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: undefined,
        errors: [{
          message: 'Field "invalidField" not found',
          extensions: {
            code: 'EXECUTION_ERROR',
            executionId: mockExecution.id
          }
        }],
        extensions: {
          executionId: mockExecution.id,
          duration: mockExecution.duration,
          timestamp: mockExecution.startTime.toISOString()
        }
      });
    });

    it('should return 400 for missing query', async () => {
      mockRequest.body = {};

      await controller.handleGraphQL(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [{
          message: 'Query is required',
          extensions: {
            code: 'MISSING_QUERY'
          }
        }]
      });
    });

    it('should handle service errors', async () => {
      const query = 'query { invoices { id } }';
      mockRequest.body = { query };

      mockGraphQLService.executeQuery.mockRejectedValue(new Error('Service error'));

      await controller.handleGraphQL(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [{
          message: 'Service error',
          extensions: {
            code: 'INTERNAL_ERROR'
          }
        }]
      });
    });
  });

  describe('handleMutation', () => {
    it('should handle GraphQL mutation successfully', async () => {
      const mutation = 'mutation { createInvoice(input: {invoiceNumber: "INV-001"}) { id } }';
      const variables = { input: { invoiceNumber: 'INV-001' } };

      mockRequest.body = { mutation, variables };

      const mockExecution = {
        id: 'exec-1',
        query: mutation,
        variables,
        operationName: undefined,
        status: 'completed',
        result: {
          data: {
            createInvoice: { id: 'invoice-1' }
          }
        },
        error: null,
        startTime: new Date(),
        endTime: new Date(),
        duration: 200,
        userId: 'user-1',
        tenantId: 'tenant-1',
        permissions: ['graphql:execute'],
        metadata: {}
      };

      mockGraphQLService.executeMutation.mockResolvedValue(mockExecution);

      await controller.handleMutation(mockRequest as Request, mockResponse as Response);

      expect(mockGraphQLService.executeMutation).toHaveBeenCalledWith(
        mutation,
        variables,
        undefined,
        { userId: 'user-1', tenantId: 'tenant-1', permissions: ['graphql:execute'] }
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for missing mutation', async () => {
      mockRequest.body = {};

      await controller.handleMutation(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [{
          message: 'Mutation is required',
          extensions: {
            code: 'MISSING_MUTATION'
          }
        }]
      });
    });
  });

  describe('handleSubscription', () => {
    it('should handle GraphQL subscription successfully', async () => {
      const subscription = 'subscription { invoiceUpdated { id status } }';
      const variables = {};

      mockRequest.body = { subscription, variables };

      const subscriptionId = 'sub-1';
      mockGraphQLService.subscribe.mockResolvedValue(subscriptionId);

      await controller.handleSubscription(mockRequest as Request, mockResponse as Response);

      expect(mockGraphQLService.subscribe).toHaveBeenCalledWith(
        subscription,
        variables,
        undefined,
        { userId: 'user-1', tenantId: 'tenant-1', permissions: ['graphql:execute'] }
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: {
          subscriptionId,
          status: 'created'
        },
        extensions: {
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 for missing subscription', async () => {
      mockRequest.body = {};

      await controller.handleSubscription(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [{
          message: 'Subscription is required',
          extensions: {
            code: 'MISSING_SUBSCRIPTION'
          }
        }]
      });
    });
  });

  describe('getSchema', () => {
    it('should return specific schema', async () => {
      const schemaId = 'financial_schema';
      mockRequest.params = { schemaId };

      const mockSchema = {
        id: schemaId,
        name: 'Financial Schema',
        version: '1.0.0',
        schema: 'type Query { invoices: [Invoice] }',
        resolvers: [],
        subscriptions: [],
        mutations: [],
        queries: [],
        types: [],
        directives: [],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockGraphQLService.getSchema.mockReturnValue(mockSchema);

      await controller.getSchema(mockRequest as Request, mockResponse as Response);

      expect(mockGraphQLService.getSchema).toHaveBeenCalledWith(schemaId);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSchema
      });
    });

    it('should return 404 for non-existent schema', async () => {
      const schemaId = 'non_existent_schema';
      mockRequest.params = { schemaId };

      mockGraphQLService.getSchema.mockReturnValue(null);

      await controller.getSchema(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Schema not found',
        code: 'SCHEMA_NOT_FOUND'
      });
    });

    it('should return all schemas when no schemaId provided', async () => {
      mockRequest.params = {};

      const mockSchemas = [
        { id: 'schema1', name: 'Schema 1' },
        { id: 'schema2', name: 'Schema 2' }
      ];

      mockGraphQLService.getAllSchemas.mockReturnValue(mockSchemas);

      await controller.getSchema(mockRequest as Request, mockResponse as Response);

      expect(mockGraphQLService.getAllSchemas).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSchemas
      });
    });
  });

  describe('getExecutionHistory', () => {
    it('should return execution history with filters', async () => {
      mockRequest.query = {
        userId: 'user-1',
        status: 'completed',
        limit: '10',
        offset: '0'
      };

      const mockExecutions = [
        {
          id: 'exec-1',
          status: 'completed',
          userId: 'user-1',
          tenantId: 'tenant-1'
        }
      ];

      mockGraphQLService.getExecutionHistory.mockReturnValue(mockExecutions);

      await controller.getExecutionHistory(mockRequest as Request, mockResponse as Response);

      expect(mockGraphQLService.getExecutionHistory).toHaveBeenCalledWith({
        userId: 'user-1',
        status: 'completed',
        startDate: undefined,
        endDate: undefined
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          executions: mockExecutions,
          total: mockExecutions.length,
          limit: 10,
          offset: 0
        }
      });
    });
  });

  describe('getExecution', () => {
    it('should return specific execution', async () => {
      const executionId = 'exec-1';
      mockRequest.params = { executionId };

      const mockExecution = {
        id: executionId,
        status: 'completed',
        userId: 'user-1',
        tenantId: 'tenant-1'
      };

      mockGraphQLService.getExecution.mockReturnValue(mockExecution);

      await controller.getExecution(mockRequest as Request, mockResponse as Response);

      expect(mockGraphQLService.getExecution).toHaveBeenCalledWith(executionId);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockExecution
      });
    });

    it('should return 404 for non-existent execution', async () => {
      const executionId = 'non_existent_exec';
      mockRequest.params = { executionId };

      mockGraphQLService.getExecution.mockReturnValue(null);

      await controller.getExecution(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Execution not found',
        code: 'EXECUTION_NOT_FOUND'
      });
    });
  });

  describe('getMetrics', () => {
    it('should return GraphQL metrics', async () => {
      const mockMetrics = {
        totalQueries: 100,
        totalMutations: 50,
        totalSubscriptions: 10,
        averageResponseTime: 150,
        errorRate: 0.05,
        cacheHitRate: 0.8,
        topQueries: [],
        topErrors: []
      };

      mockGraphQLService.getMetrics.mockReturnValue(mockMetrics);

      await controller.getMetrics(mockRequest as Request, mockResponse as Response);

      expect(mockGraphQLService.getMetrics).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics
      });
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const mockSchemas = [{ id: 'schema1', name: 'Schema 1' }];
      const mockMetrics = {
        totalQueries: 100,
        totalMutations: 50,
        totalSubscriptions: 10,
        averageResponseTime: 150,
        errorRate: 0.05,
        cacheHitRate: 0.8,
        topQueries: [],
        topErrors: []
      };

      mockGraphQLService.getAllSchemas.mockReturnValue(mockSchemas);
      mockGraphQLService.getMetrics.mockReturnValue(mockMetrics);

      await controller.healthCheck(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'healthy',
          schemas: mockSchemas.length,
          metrics: {
            totalQueries: mockMetrics.totalQueries,
            totalMutations: mockMetrics.totalMutations,
            totalSubscriptions: mockMetrics.totalSubscriptions,
            averageResponseTime: mockMetrics.averageResponseTime,
            errorRate: mockMetrics.errorRate
          },
          timestamp: expect.any(String)
        }
      });
    });
  });
});
