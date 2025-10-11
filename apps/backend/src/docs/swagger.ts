import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { configService } from '../services/core/ConfigurationService';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WriteCareConnect API',
      version: '1.0.0',
      description: `
        WriteCareConnect is a comprehensive healthcare communication and supervision platform.
        
        This API provides endpoints for:
        - Patient management and care notes
        - Real-time communication and video sessions
        - AI-powered supervision and compliance monitoring
        - Audit trails and performance analytics
        
        ## Authentication
        Most endpoints require JWT authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Rate Limiting
        API requests are rate-limited to prevent abuse. Check response headers for rate limit status.
        
        ## Error Handling
        All errors follow a consistent format with appropriate HTTP status codes and error details.
      `,
      contact: {
        name: 'WriteCareConnect Support',
        email: 'support@writecarenotes.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://writecarenotes.com/license'
      }
    },
    servers: [
      {
        url: configService.isDevelopment() ? 'http://localhost:3000' : 'https://api.writecarenotes.com',
        description: configService.isDevelopment() ? 'Development server' : 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error', 'message', 'statusCode', 'timestamp'],
          properties: {
            error: {
              type: 'string',
              description: 'Error code'
            },
            message: {
              type: 'string',
              description: 'Human-readable error message'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When the error occurred'
            },
            path: {
              type: 'string',
              description: 'API endpoint that caused the error'
            },
            requestId: {
              type: 'string',
              description: 'Unique request identifier for tracking'
            }
          }
        },
        
        User: {
          type: 'object',
          required: ['id', 'email', 'role', 'isActive'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['patient', 'caregiver', 'healthcare_provider', 'supervisor', 'admin', 'system_admin'],
              description: 'User role in the system'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of permissions granted to the user'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active'
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last successful login timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        Patient: {
          type: 'object',
          required: ['id', 'firstName', 'lastName'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated user account ID'
            },
            firstName: {
              type: 'string',
              maxLength: 100
            },
            lastName: {
              type: 'string',
              maxLength: 100
            },
            dateOfBirth: {
              type: 'string',
              format: 'date'
            },
            phone: {
              type: 'string',
              pattern: '^[+]?[1-9][\\d]{0,15}$'
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                postalCode: { type: 'string' },
                country: { type: 'string' }
              }
            },
            medicalRecordNumber: {
              type: 'string',
              description: 'Unique medical record identifier'
            },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                relationship: { type: 'string' }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        CareNote: {
          type: 'object',
          required: ['id', 'patientId', 'authorId', 'content'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            patientId: {
              type: 'string',
              format: 'uuid'
            },
            authorId: {
              type: 'string',
              format: 'uuid'
            },
            title: {
              type: 'string',
              maxLength: 255
            },
            content: {
              type: 'string',
              description: 'Care note content'
            },
            noteType: {
              type: 'string',
              enum: ['daily_observation', 'medication', 'incident', 'general', 'assessment'],
              description: 'Type of care note'
            },
            isPrivate: {
              type: 'boolean',
              description: 'Whether note is private to author'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        CommunicationSession: {
          type: 'object',
          required: ['id', 'patientId', 'providerId', 'sessionType'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            patientId: {
              type: 'string',
              format: 'uuid'
            },
            providerId: {
              type: 'string',
              format: 'uuid'
            },
            sessionType: {
              type: 'string',
              enum: ['video_call', 'voice_call', 'chat', 'in_person'],
              description: 'Type of communication session'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'active', 'completed', 'cancelled'],
              description: 'Current session status'
            },
            scheduledAt: {
              type: 'string',
              format: 'date-time'
            },
            startedAt: {
              type: 'string',
              format: 'date-time'
            },
            endedAt: {
              type: 'string',
              format: 'date-time'
            },
            notes: {
              type: 'string'
            },
            recordingUrl: {
              type: 'string',
              format: 'uri'
            },
            transcript: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        SupervisionReport: {
          type: 'object',
          required: ['id', 'providerId', 'periodStart', 'periodEnd'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            providerId: {
              type: 'string',
              format: 'uuid'
            },
            supervisorId: {
              type: 'string',
              format: 'uuid'
            },
            periodStart: {
              type: 'string',
              format: 'date-time'
            },
            periodEnd: {
              type: 'string',
              format: 'date-time'
            },
            summary: {
              type: 'string',
              description: 'AI-generated summary of the supervision period'
            },
            sessionsReviewed: {
              type: 'integer'
            },
            notesReviewed: {
              type: 'integer'
            },
            complianceScore: {
              type: 'number',
              minimum: 0,
              maximum: 1
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        Complaint: {
          type: 'object',
          required: ['id', 'category', 'description', 'severity'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            patientId: {
              type: 'string',
              format: 'uuid'
            },
            providerId: {
              type: 'string',
              format: 'uuid'
            },
            category: {
              type: 'string',
              enum: ['quality_of_care', 'communication', 'safety_concern', 'billing', 'privacy', 'other']
            },
            description: {
              type: 'string'
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical']
            },
            status: {
              type: 'string',
              enum: ['open', 'investigating', 'resolved', 'escalated', 'closed']
            },
            reportedBy: {
              type: 'string',
              format: 'uuid'
            },
            assignedTo: {
              type: 'string',
              format: 'uuid'
            },
            resolution: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        HealthCheck: {
          type: 'object',
          required: ['status', 'services', 'timestamp'],
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy', 'degraded']
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  service: { type: 'string' },
                  status: {
                    type: 'string',
                    enum: ['healthy', 'unhealthy', 'degraded']
                  },
                  responseTime: { type: 'number' },
                  details: { type: 'object' },
                  lastChecked: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            uptime: {
              type: 'number',
              description: 'Server uptime in seconds'
            },
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number' },
                free: { type: 'number' },
                total: { type: 'number' },
                percentage: { type: 'number' }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Patients',
        description: 'Patient profile and medical record management'
      },
      {
        name: 'Care Notes',
        description: 'Care documentation and notes'
      },
      {
        name: 'Communication',
        description: 'Real-time communication and video sessions'
      },
      {
        name: 'Supervision',
        description: 'Care supervision, compliance, and quality monitoring'
      },
      {
        name: 'AI Services',
        description: 'AI-powered features and analytics'
      },
      {
        name: 'Health',
        description: 'System health and monitoring endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  // Swagger UI endpoint
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WriteCareConnect API Documentation',
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }));

  // JSON specification endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 API Documentation available at /api-docs');
};

export default specs;