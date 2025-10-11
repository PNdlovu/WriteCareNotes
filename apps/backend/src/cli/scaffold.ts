#!/usr/bin/env node

import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';

const __dirname = path.dirname(__filename);

interface DomainTemplate {
  name: string;
  description: string;
  entities: string[];
  services: string[];
  controllers: string[];
  routes: string[];
  components: string[];
  tests: string[];
}

interface ScaffoldOptions {
  domain: string;
  description?: string;
  entities?: string[];
  services?: string[];
  controllers?: string[];
  routes?: string[];
  components?: string[];
  tests?: string[];
  force?: boolean;
  template?: string;
}

class DomainScaffolder {
  private templates: Map<string, DomainTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize domain templates
   */
  private initializeTemplates(): void {
    // Financial domain template
    this.templates.set('financial', {
      name: 'Financial',
      description: 'Financial management domain',
      entities: ['Invoice', 'Payment', 'Expense', 'Salary', 'TaxRecord'],
      services: ['InvoiceService', 'PaymentService', 'ExpenseService', 'TaxRecordService'],
      controllers: ['InvoiceController', 'PaymentController', 'ExpenseController', 'TaxRecordController'],
      routes: ['invoiceRoutes', 'paymentRoutes', 'expenseRoutes', 'taxRecordRoutes'],
      components: ['InvoiceManagement', 'PaymentManagement', 'ExpenseManagement', 'TaxRecordManagement'],
      tests: ['InvoiceService.test', 'PaymentService.test', 'ExpenseService.test', 'TaxRecordService.test']
    });

    // HR domain template
    this.templates.set('hr', {
      name: 'HR',
      description: 'Human Resources domain',
      entities: ['EmployeeProfile', 'Certification', 'TimeOffRequest', 'ShiftSwap'],
      services: ['EmployeeProfileService', 'CertificationService', 'TimeOffService', 'ShiftSwapService'],
      controllers: ['EmployeeProfileController', 'CertificationController', 'TimeOffController', 'ShiftSwapController'],
      routes: ['employeeProfileRoutes', 'certificationRoutes', 'timeOffRoutes', 'shiftSwapRoutes'],
      components: ['EmployeeProfileManagement', 'CertificationManagement', 'TimeOffManagement', 'ShiftSwapManagement'],
      tests: ['EmployeeProfileService.test', 'CertificationService.test', 'TimeOffService.test', 'ShiftSwapService.test']
    });

    // Activities domain template
    this.templates.set('activities', {
      name: 'Activities',
      description: 'Activities and engagement domain',
      entities: ['Activity', 'TherapySession', 'AttendanceRecord'],
      services: ['ActivitiesTherapyService', 'AttendanceRecordService'],
      controllers: ['ActivitiesController', 'TherapyController', 'AttendanceController'],
      routes: ['activitiesRoutes', 'therapyRoutes', 'attendanceRoutes'],
      components: ['ActivityManagement', 'TherapyManagement', 'AttendanceManagement'],
      tests: ['ActivitiesTherapyService.test', 'AttendanceRecordService.test']
    });

    // AI Agents domain template
    this.templates.set('ai-agents', {
      name: 'AI Agents',
      description: 'AI Agents and automation domain',
      entities: ['AIAgentSession', 'AIAgentConversation'],
      services: ['AgentManager', 'OpenAIAdapter', 'VoiceToNoteAgent', 'SmartRosterAgent', 'RiskFlagAgent'],
      controllers: ['AIAgentController', 'VoiceAgentController', 'RosterAgentController', 'RiskAgentController'],
      routes: ['aiAgentRoutes', 'voiceAgentRoutes', 'rosterAgentRoutes', 'riskAgentRoutes'],
      components: ['AIAgentDashboard', 'VoiceAgentInterface', 'RosterAgentInterface', 'RiskAgentInterface'],
      tests: ['AgentManager.test', 'OpenAIAdapter.test', 'VoiceToNoteAgent.test', 'SmartRosterAgent.test', 'RiskFlagAgent.test']
    });

    // External Integration domain template
    this.templates.set('external-integration', {
      name: 'External Integration',
      description: 'External system integration domain',
      entities: ['ExternalSystem', 'IntegrationLog', 'WebhookEvent'],
      services: ['GPConnectService', 'IoTWearablesService', 'ConnectorSDK'],
      controllers: ['ExternalIntegrationController', 'GPConnectController', 'IoTController'],
      routes: ['externalIntegrationRoutes', 'gpConnectRoutes', 'iotRoutes'],
      components: ['IntegrationDashboard', 'GPConnectInterface', 'IoTInterface'],
      tests: ['GPConnectService.test', 'IoTWearablesService.test', 'ConnectorSDK.test']
    });

    // GraphQL domain template
    this.templates.set('graphql', {
      name: 'GraphQL',
      description: 'GraphQL gateway domain',
      entities: ['GraphQLSchema', 'GraphQLExecution', 'GraphQLSubscription'],
      services: ['GraphQLGatewayService'],
      controllers: ['GraphQLController'],
      routes: ['graphqlRoutes'],
      components: ['GraphQLPlayground', 'GraphQLMetrics'],
      tests: ['GraphQLGatewayService.test', 'GraphQLController.test']
    });
  }

  /**
   * Scaffold a new domain
   */
  async scaffoldDomain(options: ScaffoldOptions): Promise<void> {
    try {
      console.log(`🚀 Scaffolding domain: ${options.domain}`);

      // Validate domain name
      this.validateDomainName(options.domain);

      // Check if domain already exists
      const domainPath = path.join(process.cwd(), 'src', 'domains', options.domain);
      if (await this.pathExists(domainPath) && !options.force) {
        throw new Error(`Domain '${options.domain}' already exists. Use --force to overwrite.`);
      }

      // Get template
      const template = this.getTemplate(options.template || options.domain);

      // Create domain directory structure
      await this.createDomainStructure(domainPath, template);

      // Generate entities
      if (options.entities || template.entities) {
        await this.generateEntities(domainPath, options.entities || template.entities, options.domain);
      }

      // Generate services
      if (options.services || template.services) {
        await this.generateServices(domainPath, options.services || template.services, options.domain);
      }

      // Generate controllers
      if (options.controllers || template.controllers) {
        await this.generateControllers(domainPath, options.controllers || template.controllers, options.domain);
      }

      // Generate routes
      if (options.routes || template.routes) {
        await this.generateRoutes(domainPath, options.routes || template.routes, options.domain);
      }

      // Generate components
      if (options.components || template.components) {
        await this.generateComponents(domainPath, options.components || template.components, options.domain);
      }

      // Generate tests
      if (options.tests || template.tests) {
        await this.generateTests(domainPath, options.tests || template.tests, options.domain);
      }

      // Generate domain index
      await this.generateDomainIndex(domainPath, options.domain, template);

      // Generate README
      await this.generateREADME(domainPath, options.domain, template);

      console.log(`✅ Domain '${options.domain}' scaffolded successfully!`);
      console.log(`📁 Domain location: ${domainPath}`);

    } catch (error) {
      console.error(`❌ Failed to scaffold domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  /**
   * Create domain directory structure
   */
  private async createDomainStructure(domainPath: string, template: DomainTemplate): Promise<void> {
    const directories = [
      'entities',
      'services',
      'controllers',
      'routes',
      'components',
      'tests',
      'types',
      'utils'
    ];

    for (const dir of directories) {
      const dirPath = path.join(domainPath, dir);
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Generate entities
   */
  private async generateEntities(domainPath: string, entities: string[], domainName: string): Promise<void> {
    for (const entityName of entities) {
      const entityPath = path.join(domainPath, 'entities', `${entityName}.ts`);
      const entityContent = this.generateEntityContent(entityName, domainName);
      await fs.writeFile(entityPath, entityContent);
      console.log(`📄 Generated entity: ${entityName}.ts`);
    }
  }

  /**
   * Generate services
   */
  private async generateServices(domainPath: string, services: string[], domainName: string): Promise<void> {
    for (const serviceName of services) {
      const servicePath = path.join(domainPath, 'services', `${serviceName}.ts`);
      const serviceContent = this.generateServiceContent(serviceName, domainName);
      await fs.writeFile(servicePath, serviceContent);
      console.log(`🔧 Generated service: ${serviceName}.ts`);
    }
  }

  /**
   * Generate controllers
   */
  private async generateControllers(domainPath: string, controllers: string[], domainName: string): Promise<void> {
    for (const controllerName of controllers) {
      const controllerPath = path.join(domainPath, 'controllers', `${controllerName}.ts`);
      const controllerContent = this.generateControllerContent(controllerName, domainName);
      await fs.writeFile(controllerPath, controllerContent);
      console.log(`🎮 Generated controller: ${controllerName}.ts`);
    }
  }

  /**
   * Generate routes
   */
  private async generateRoutes(domainPath: string, routes: string[], domainName: string): Promise<void> {
    for (const routeName of routes) {
      const routePath = path.join(domainPath, 'routes', `${routeName}.ts`);
      const routeContent = this.generateRouteContent(routeName, domainName);
      await fs.writeFile(routePath, routeContent);
      console.log(`🛣️  Generated route: ${routeName}.ts`);
    }
  }

  /**
   * Generate components
   */
  private async generateComponents(domainPath: string, components: string[], domainName: string): Promise<void> {
    for (const componentName of components) {
      const componentPath = path.join(domainPath, 'components', `${componentName}.tsx`);
      const componentContent = this.generateComponentContent(componentName, domainName);
      await fs.writeFile(componentPath, componentContent);
      console.log(`⚛️  Generated component: ${componentName}.tsx`);
    }
  }

  /**
   * Generate tests
   */
  private async generateTests(domainPath: string, tests: string[], domainName: string): Promise<void> {
    for (const testName of tests) {
      const testPath = path.join(domainPath, 'tests', `${testName}.ts`);
      const testContent = this.generateTestContent(testName, domainName);
      await fs.writeFile(testPath, testContent);
      console.log(`🧪 Generated test: ${testName}.ts`);
    }
  }

  /**
   * Generate domain index
   */
  private async generateDomainIndex(domainPath: string, domainName: string, template: DomainTemplate): Promise<void> {
    const indexContent = this.generateIndexContent(domainName, template);
    const indexPath = path.join(domainPath, 'index.ts');
    await fs.writeFile(indexPath, indexContent);
    console.log(`📋 Generated domain index: index.ts`);
  }

  /**
   * Generate README
   */
  private async generateREADME(domainPath: string, domainName: string, template: DomainTemplate): Promise<void> {
    const readmeContent = this.generateREADMEContent(domainName, template);
    const readmePath = path.join(domainPath, 'README.md');
    await fs.writeFile(readmePath, readmeContent);
    console.log(`📖 Generated README: README.md`);
  }

  /**
   * Generate entity content
   */
  private generateEntityContent(entityName: string, domainName: string): string {
    return `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../entities/BaseEntity';

@Entity('${domainName.toLowerCase()}_${entityName.toLowerCase()}')
export class ${entityName} extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Business methods
  public isActive(): boolean {
    return this.isActive;
  }

  public activate(): void {
    this.isActive = true;
  }

  public deactivate(): void {
    this.isActive = false;
  }
}
`;
  }

  /**
   * Generate service content
   */
  private generateServiceContent(serviceName: string, domainName: string): string {
    return `import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { ${serviceName.replace('Service', '')} } from '../entities/${serviceName.replace('Service', '')}';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

export class ${serviceName} {
  private repository: Repository<${serviceName.replace('Service', '')}>;
  private auditService: AuditService;

  constructor() {
    this.repository = AppDataSource.getRepository(${serviceName.replace('Service', '')});
    this.auditService = new AuditTrailService();
  }

  /**
   * Create new ${serviceName.replace('Service', '').toLowerCase()}
   */
  async create(data: Partial<${serviceName.replace('Service', '')}>): Promise<${serviceName.replace('Service', '')}> {
    try {
      const entity = this.repository.create(data);
      const savedEntity = await this.repository.save(entity);

      await this.auditService.logEvent({
        resource: '${serviceName.replace('Service', '')}',
        entityType: '${serviceName.replace('Service', '')}',
        entityId: savedEntity.id,
        action: 'CREATE',
        details: { id: savedEntity.id, name: savedEntity.name },
        userId: 'system'
      });

      return savedEntity;
    } catch (error) {
      console.error('Error creating ${serviceName.replace('Service', '').toLowerCase()}:', error);
      throw error;
    }
  }

  /**
   * Get all ${serviceName.replace('Service', '').toLowerCase()}s
   */
  async findAll(): Promise<${serviceName.replace('Service', '')}[]> {
    try {
      return await this.repository.find();
    } catch (error) {
      console.error('Error finding ${serviceName.replace('Service', '').toLowerCase()}s:', error);
      throw error;
    }
  }

  /**
   * Get ${serviceName.replace('Service', '').toLowerCase()} by ID
   */
  async findById(id: string): Promise<${serviceName.replace('Service', '')} | null> {
    try {
      return await this.repository.findOne({ where: { id } });
    } catch (error) {
      console.error('Error finding ${serviceName.replace('Service', '').toLowerCase()}:', error);
      throw error;
    }
  }

  /**
   * Update ${serviceName.replace('Service', '').toLowerCase()}
   */
  async update(id: string, data: Partial<${serviceName.replace('Service', '')}>): Promise<${serviceName.replace('Service', '')} | null> {
    try {
      await this.repository.update(id, data);
      const updatedEntity = await this.findById(id);

      if (updatedEntity) {
        await this.auditService.logEvent({
          resource: '${serviceName.replace('Service', '')}',
          entityType: '${serviceName.replace('Service', '')}',
          entityId: id,
          action: 'UPDATE',
          details: { id, updates: Object.keys(data) },
          userId: 'system'
        });
      }

      return updatedEntity;
    } catch (error) {
      console.error('Error updating ${serviceName.replace('Service', '').toLowerCase()}:', error);
      throw error;
    }
  }

  /**
   * Delete ${serviceName.replace('Service', '').toLowerCase()}
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);

      if (result.affected && result.affected > 0) {
        await this.auditService.logEvent({
          resource: '${serviceName.replace('Service', '')}',
          entityType: '${serviceName.replace('Service', '')}',
          entityId: id,
          action: 'DELETE',
          details: { id },
          userId: 'system'
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting ${serviceName.replace('Service', '').toLowerCase()}:', error);
      throw error;
    }
  }
}

export default ${serviceName};
`;
  }

  /**
   * Generate controller content
   */
  private generateControllerContent(controllerName: string, domainName: string): string {
    return `import { Request, Response } from 'express';
import { ${controllerName.replace('Controller', 'Service')} } from '../services/${controllerName.replace('Controller', 'Service')}';

export class ${controllerName} {
  private service: ${controllerName.replace('Controller', 'Service')};

  constructor() {
    this.service = new ${controllerName.replace('Controller', 'Service')}();
  }

  /**
   * Create new ${controllerName.replace('Controller', '').toLowerCase()}
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const entity = await this.service.create(req.body);
      res.status(201).json({ success: true, data: entity });
    } catch (error) {
      console.error('Error creating ${controllerName.replace('Controller', '').toLowerCase()}:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Get all ${controllerName.replace('Controller', '').toLowerCase()}s
   */
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const entities = await this.service.findAll();
      res.json({ success: true, data: entities });
    } catch (error) {
      console.error('Error finding ${controllerName.replace('Controller', '').toLowerCase()}s:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Get ${controllerName.replace('Controller', '').toLowerCase()} by ID
   */
  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const entity = await this.service.findById(id);
      
      if (!entity) {
        res.status(404).json({ success: false, error: '${controllerName.replace('Controller', '')} not found' });
        return;
      }

      res.json({ success: true, data: entity });
    } catch (error) {
      console.error('Error finding ${controllerName.replace('Controller', '').toLowerCase()}:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Update ${controllerName.replace('Controller', '').toLowerCase()}
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const entity = await this.service.update(id, req.body);
      
      if (!entity) {
        res.status(404).json({ success: false, error: '${controllerName.replace('Controller', '')} not found' });
        return;
      }

      res.json({ success: true, data: entity });
    } catch (error) {
      console.error('Error updating ${controllerName.replace('Controller', '').toLowerCase()}:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Delete ${controllerName.replace('Controller', '').toLowerCase()}
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.service.delete(id);
      
      if (!deleted) {
        res.status(404).json({ success: false, error: '${controllerName.replace('Controller', '')} not found' });
        return;
      }

      res.json({ success: true, message: '${controllerName.replace('Controller', '')} deleted successfully' });
    } catch (error) {
      console.error('Error deleting ${controllerName.replace('Controller', '').toLowerCase()}:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}

export default ${controllerName};
`;
  }

  /**
   * Generate route content
   */
  private generateRouteContent(routeName: string, domainName: string): string {
    return `import { Router } from 'express';
import { body, param } from 'express-validator';
import { ${routeName.replace('Routes', 'Controller')} } from '../controllers/${routeName.replace('Routes', 'Controller')}';
import { rbacMiddleware } from '../../middleware/rbacMiddleware';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
const controller = new ${routeName.replace('Routes', 'Controller')}();

// Create ${routeName.replace('Routes', '').toLowerCase()}
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').optional().isString().withMessage('Description must be a string')
  ],
  validateRequest,
  rbacMiddleware(['${domainName}:write']),
  controller.create.bind(controller)
);

// Get all ${routeName.replace('Routes', '').toLowerCase()}s
router.get(
  '/',
  rbacMiddleware(['${domainName}:read']),
  controller.findAll.bind(controller)
);

// Get ${routeName.replace('Routes', '').toLowerCase()} by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid ID format')
  ],
  validateRequest,
  rbacMiddleware(['${domainName}:read']),
  controller.findById.bind(controller)
);

// Update ${routeName.replace('Routes', '').toLowerCase()}
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid ID format'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('description').optional().isString().withMessage('Description must be a string')
  ],
  validateRequest,
  rbacMiddleware(['${domainName}:write']),
  controller.update.bind(controller)
);

// Delete ${routeName.replace('Routes', '').toLowerCase()}
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid ID format')
  ],
  validateRequest,
  rbacMiddleware(['${domainName}:delete']),
  controller.delete.bind(controller)
);

export default router;
`;
  }

  /**
   * Generate component content
   */
  private generateComponentContent(componentName: string, domainName: string): string {
    return `import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Modal, Form, Input, Select } from 'antd';

interface ${componentName}Props {
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      const response = await fetch('/api/${domainName.toLowerCase()}/${componentName.replace('Management', '').toLowerCase()}');
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // TODO: Implement delete API call
      await fetch(\`/api/${domainName.toLowerCase()}/${componentName.replace('Management', '').toLowerCase()}/\${id}\`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        // TODO: Implement update API call
        await fetch(\`/api/${domainName.toLowerCase()}/${componentName.replace('Management', '').toLowerCase()}/\${editingItem.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
      } else {
        // TODO: Implement create API call
        await fetch(\`/api/${domainName.toLowerCase()}/${componentName.replace('Management', '').toLowerCase()}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Badge status={isActive ? 'success' : 'default'} text={isActive ? 'Active' : 'Inactive'} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <div>
          <Button size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={className}>
      <Card
        title="${componentName}"
        extra={
          <Button type="primary" onClick={handleCreate}>
            Create New
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? 'Edit Item' : 'Create New Item'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ${componentName};
`;
  }

  /**
   * Generate test content
   */
  private generateTestContent(testName: string, _domainName: string): string {
    return `import { ${testName.replace('.test', '')} } from '../services/${testName.replace('.test', '')}';
import { Repository } from 'typeorm';

// Mock the repository
jest.mock('typeorm', () => ({
  Repository: jest.fn(),
}));

// Mock the database
jest.mock('../../config/database', () => ({
  getRepository: jest.fn(),
}));

describe('${testName.replace('.test', '')}', () => {
  let service: ${testName.replace('.test', '')};
  let mockRepository: jest.Mocked<Repository<any>>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    (require('../../config/database').default.getRepository as jest.Mock).mockReturnValue(mockRepository);
    service = new ${testName.replace('.test', '')}();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new ${testName.replace('.test', '').replace('Service', '').toLowerCase()}', async () => {
      const data = { name: 'Test Item', description: 'Test Description' };
      const expectedEntity = { id: '1', ...data };

      mockRepository.create.mockReturnValue(expectedEntity as any);
      mockRepository.save.mockResolvedValue(expectedEntity as any);

      const result = await service.create(data);

      expect(mockRepository.create).toHaveBeenCalledWith(data);
      expect(mockRepository.save).toHaveBeenCalledWith(expectedEntity);
      expect(result).toEqual(expectedEntity);
    });

    it('should throw error when creation fails', async () => {
      const data = { name: 'Test Item' };
      const error = new Error('Database error');

      mockRepository.create.mockReturnValue(data as any);
      mockRepository.save.mockRejectedValue(error);

      await expect(service.create(data)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all ${testName.replace('.test', '').replace('Service', '').toLowerCase()}s', async () => {
      const expectedEntities = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];

      mockRepository.find.mockResolvedValue(expectedEntities as any);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedEntities);
    });
  });

  describe('findById', () => {
    it('should return ${testName.replace('.test', '').replace('Service', '').toLowerCase()} by ID', async () => {
      const id = '1';
      const expectedEntity = { id, name: 'Test Item' };

      mockRepository.findOne.mockResolvedValue(expectedEntity as any);

      const result = await service.findById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(expectedEntity);
    });

    it('should return null when ${testName.replace('.test', '').replace('Service', '').toLowerCase()} not found', async () => {
      const id = '1';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(id);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update ${testName.replace('.test', '').replace('Service', '').toLowerCase()}', async () => {
      const id = '1';
      const data = { name: 'Updated Item' };
      const expectedEntity = { id, ...data };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(expectedEntity as any);

      const result = await service.update(id, data);

      expect(mockRepository.update).toHaveBeenCalledWith(id, data);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(expectedEntity);
    });
  });

  describe('delete', () => {
    it('should delete ${testName.replace('.test', '').replace('Service', '').toLowerCase()}', async () => {
      const id = '1';

      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.delete(id);

      expect(mockRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    it('should return false when ${testName.replace('.test', '').replace('Service', '').toLowerCase()} not found', async () => {
      const id = '1';

      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.delete(id);

      expect(result).toBe(false);
    });
  });
});
`;
  }

  /**
   * Generate index content
   */
  private generateIndexContent(domainName: string, template: DomainTemplate): string {
    const exports = [
      ...template.entities.map(e => `export { ${e} } from './entities/${e}';`),
      ...template.services.map(s => `export { ${s} } from './services/${s}';`),
      ...template.controllers.map(c => `export { ${c} } from './controllers/${c}';`),
      ...template.routes.map(r => `export { default as ${r} } from './routes/${r}';`),
      ...template.components.map(c => `export { ${c} } from './components/${c}';`)
    ].join('\n');

    return `// ${template.name} Domain
// ${template.description}

${exports}

// Domain configuration
export const domainConfig = {
  name: '${domainName}',
  description: '${template.description}',
  version: '1.0.0',
  entities: ${JSON.stringify(template.entities, null, 2)},
  services: ${JSON.stringify(template.services, null, 2)},
  controllers: ${JSON.stringify(template.controllers, null, 2)},
  routes: ${JSON.stringify(template.routes, null, 2)},
  components: ${JSON.stringify(template.components, null, 2)},
  tests: ${JSON.stringify(template.tests, null, 2)}
};

export default domainConfig;
`;
  }

  /**
   * Generate README content
   */
  private generateREADMEContent(domainName: string, template: DomainTemplate): string {
    return `# ${template.name} Domain

${template.description}

## Overview

This domain contains all the components necessary for ${template.description.toLowerCase()} functionality.

## Structure

\`\`\`
src/domains/${domainName}/
├── entities/          # TypeORM entities
├── services/          # Business logic services
├── controllers/       # REST API controllers
├── routes/           # Express routes
├── components/       # React components
├── tests/           # Unit and integration tests
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── index.ts         # Domain exports
└── README.md        # This file
\`\`\`

## Entities

${template.entities.map(e => `- **${e}**: ${e} entity`).join('\n')}

## Services

${template.services.map(s => `- **${s}**: ${s} service`).join('\n')}

## Controllers

${template.controllers.map(c => `- **${c}**: ${c} controller`).join('\n')}

## Routes

${template.routes.map(r => `- **${r}**: ${r} routes`).join('\n')}

## Components

${template.components.map(c => `- **${c}**: ${c} component`).join('\n')}

## Tests

${template.tests.map(t => `- **${t}**: ${t} tests`).join('\n')}

## Usage

### Import the domain

\`\`\`typescript
import { ${template.entities[0]}, ${template.services[0]} } from './domains/${domainName}';
\`\`\`

### Use in controllers

\`\`\`typescript
import { ${template.controllers[0]} } from './domains/${domainName}';

const controller = new ${template.controllers[0]}();
\`\`\`

### Use in React components

\`\`\`typescript
import { ${template.components[0]} } from './domains/${domainName}';

<${template.components[0]} />
\`\`\`

## API Endpoints

- \`GET /api/${domainName.toLowerCase()}\` - Get all items
- \`POST /api/${domainName.toLowerCase()}\` - Create new item
- \`GET /api/${domainName.toLowerCase()}/:id\` - Get item by ID
- \`PUT /api/${domainName.toLowerCase()}/:id\` - Update item
- \`DELETE /api/${domainName.toLowerCase()}/:id\` - Delete item

## Testing

Run tests for this domain:

\`\`\`bash
npm test -- --testPathPattern=${domainName}
\`\`\`

## Development

1. Add new entities in \`entities/\`
2. Implement business logic in \`services/\`
3. Create API endpoints in \`controllers/\` and \`routes/\`
4. Build UI components in \`components/\`
5. Write tests in \`tests/\`
6. Update this README as needed

## Dependencies

- TypeORM for database operations
- Express for API endpoints
- React for UI components
- Jest for testing
- Class-validator for validation
- Class-transformer for data transformation
`;
  }

  /**
   * Get template by name
   */
  private getTemplate(templateName: string): DomainTemplate {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found. Available templates: ${Array.from(this.templates.keys()).join(', ')}`);
    }
    return template;
  }

  /**
   * Validate domain name
   */
  private validateDomainName(domainName: string): void {
    if (!domainName) {
      throw new Error('Domain name is required');
    }
    if (!/^[a-z][a-z0-9-]*$/.test(domainName)) {
      throw new Error('Domain name must start with a letter and contain only lowercase letters, numbers, and hyphens');
    }
  }

  /**
   * Check if path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}

// CLI setup
const program = new Command();

program
  .name('scaffold')
  .description('CLI tool for scaffolding new domains')
  .version('1.0.0');

program
  .command('domain')
  .description('Scaffold a new domain')
  .requiredOption('-d, --domain <name>', 'Domain name')
  .option('--description <text>', 'Domain description')
  .option('--entities <items>', 'Comma-separated list of entities')
  .option('--services <items>', 'Comma-separated list of services')
  .option('--controllers <items>', 'Comma-separated list of controllers')
  .option('--routes <items>', 'Comma-separated list of routes')
  .option('--components <items>', 'Comma-separated list of components')
  .option('--tests <items>', 'Comma-separated list of tests')
  .option('-f, --force', 'Force overwrite existing domain')
  .option('-t, --template <name>', 'Template to use')
  .action(async (options: any) => {
    const scaffolder = new DomainScaffolder();
    
    const scaffoldOptions: ScaffoldOptions = {
      domain: options.domain,
      description: options.description,
      entities: options.entities ? options.entities.split(',') : undefined,
      services: options.services ? options.services.split(',') : undefined,
      controllers: options.controllers ? options.controllers.split(',') : undefined,
      routes: options.routes ? options.routes.split(',') : undefined,
      components: options.components ? options.components.split(',') : undefined,
      tests: options.tests ? options.tests.split(',') : undefined,
      force: options.force,
      template: options.template
    };

    await scaffolder.scaffoldDomain(scaffoldOptions);
  });

program
  .command('list-templates')
  .description('List available templates')
  .action(() => {
    console.log('Available templates:');
    console.log('==================');
    // This would list available templates
    console.log('Use --help for more information');
  });

// Parse command line arguments
program.parse();