import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SpreadsheetIntegrationService } from '../../services/spreadsheet-integration.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

describe('SpreadsheetIntegrationService', () => {
  let service: SpreadsheetIntegrationService;
  let mockTemplateRepository: any;
  let mockExportRepository: any;
  let mockImportRepository: any;
  let mockDataRepository: any;
  let mockReportRepository: any;
  let mockEventEmitter: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockTemplateRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockExportRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockImportRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockDataRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockReportRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockAuditService = {
      logEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpreadsheetIntegrationService,
        {
          provide: getRepositoryToken('SpreadsheetTemplate'),
          useValue: mockTemplateRepository,
        },
        {
          provide: getRepositoryToken('SpreadsheetExport'),
          useValue: mockExportRepository,
        },
        {
          provide: getRepositoryToken('SpreadsheetImport'),
          useValue: mockImportRepository,
        },
        {
          provide: getRepositoryToken('SpreadsheetData'),
          useValue: mockDataRepository,
        },
        {
          provide: getRepositoryToken('SpreadsheetReport'),
          useValue: mockReportRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: AuditTrailService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<SpreadsheetIntegrationService>(SpreadsheetIntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTemplate', () => {
    it('should create a new spreadsheet template successfully', async () => {
      const templateData = {
        name: 'Care Plan Template',
        description: 'Template for resident care plans',
        category: 'care_plans' as const,
        fileType: 'xlsx' as const,
        templateData: {},
        fields: [
          {
            id: 'field_001',
            name: 'resident_name',
            displayName: 'Resident Name',
            type: 'text' as const,
            required: true,
            position: { row: 1, column: 1 },
          },
        ],
        validationRules: [
          {
            id: 'rule_001',
            fieldId: 'field_001',
            ruleType: 'required' as const,
            ruleValue: true,
            errorMessage: 'Resident name is required',
            isActive: true,
          },
        ],
        isActive: true,
      };

      const result = await service.createTemplate(templateData);

      expect(result).toEqual({
        id: expect.any(String),
        ...templateData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockTemplateRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        ...templateData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.template.created', {
        templateId: expect.any(String),
        templateName: templateData.name,
        category: templateData.category,
        fileType: templateData.fileType,
        timestamp: expect.any(Date),
      });
    });

    it('should handle template creation failure', async () => {
      const templateData = {
        name: 'Care Plan Template',
        description: 'Template for resident care plans',
        category: 'care_plans' as const,
        fileType: 'xlsx' as const,
        templateData: {},
        fields: [],
        validationRules: [],
        isActive: true,
      };

      mockTemplateRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createTemplate(templateData)).rejects.toThrow('Failed to create template');
    });
  });

  describe('exportToSpreadsheet', () => {
    it('should export data to spreadsheet successfully', async () => {
      const templateId = 'template_001';
      const data = [
        { resident_name: 'John Doe', age: 75, room: '101' },
        { resident_name: 'Jane Smith', age: 80, room: '102' },
      ];
      const exportType = 'full';
      const filters = { room: '101' };

      const mockTemplate = {
        id: templateId,
        name: 'Care Plan Template',
        fileType: 'xlsx',
        fields: [],
        validationRules: [],
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.exportToSpreadsheet(templateId, data, exportType, filters);

      expect(result).toEqual({
        id: expect.any(String),
        templateId,
        fileName: expect.stringContaining('Care Plan Template'),
        filePath: expect.stringContaining('/exports/'),
        fileSize: expect.any(Number),
        exportType,
        filters,
        status: 'completed',
        createdAt: expect.any(Date),
        completedAt: expect.any(Date),
      });

      expect(mockExportRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        templateId,
        exportType,
        filters,
        status: 'pending',
        createdAt: expect.any(Date),
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.export.completed', {
        exportId: expect.any(String),
        templateId,
        fileName: expect.stringContaining('Care Plan Template'),
        recordCount: data.length,
        fileSize: expect.any(Number),
        timestamp: expect.any(Date),
      });
    });

    it('should handle export failure when template not found', async () => {
      const templateId = 'nonexistent_template';
      const data = [];

      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.exportToSpreadsheet(templateId, data)).rejects.toThrow('Template not found');
    });

    it('should handle export failure during processing', async () => {
      const templateId = 'template_001';
      const data = [];

      const mockTemplate = {
        id: templateId,
        name: 'Care Plan Template',
        fileType: 'xlsx',
        fields: [],
        validationRules: [],
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockExportRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.exportToSpreadsheet(templateId, data)).rejects.toThrow('Failed to export to spreadsheet');
    });
  });

  describe('importFromSpreadsheet', () => {
    it('should import data from spreadsheet successfully', async () => {
      const templateId = 'template_001';
      const filePath = '/uploads/import.xlsx';
      const fileName = 'import.xlsx';
      const fileSize = 1024000;
      const importType = 'full';

      const mockTemplate = {
        id: templateId,
        name: 'Care Plan Template',
        fileType: 'xlsx',
        fields: [
          {
            id: 'field_001',
            name: 'resident_name',
            displayName: 'Resident Name',
            type: 'text',
            required: true,
            position: { row: 1, column: 1 },
          },
        ],
        validationRules: [],
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.importFromSpreadsheet(templateId, filePath, fileName, fileSize, importType);

      expect(result).toEqual({
        id: expect.any(String),
        templateId,
        fileName,
        filePath,
        fileSize,
        importType,
        status: 'completed',
        recordsProcessed: expect.any(Number),
        recordsSuccessful: expect.any(Number),
        recordsFailed: expect.any(Number),
        validationResults: expect.any(Array),
        createdAt: expect.any(Date),
        completedAt: expect.any(Date),
      });

      expect(mockImportRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        templateId,
        fileName,
        filePath,
        fileSize,
        importType,
        status: 'pending',
        createdAt: expect.any(Date),
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.import.completed', {
        importId: expect.any(String),
        templateId,
        fileName,
        recordsProcessed: expect.any(Number),
        recordsSuccessful: expect.any(Number),
        recordsFailed: expect.any(Number),
        timestamp: expect.any(Date),
      });
    });

    it('should handle import failure when template not found', async () => {
      const templateId = 'nonexistent_template';
      const filePath = '/uploads/import.xlsx';
      const fileName = 'import.xlsx';
      const fileSize = 1024000;

      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.importFromSpreadsheet(templateId, filePath, fileName, fileSize)).rejects.toThrow('Template not found');
    });

    it('should handle import failure during processing', async () => {
      const templateId = 'template_001';
      const filePath = '/uploads/import.xlsx';
      const fileName = 'import.xlsx';
      const fileSize = 1024000;

      const mockTemplate = {
        id: templateId,
        name: 'Care Plan Template',
        fileType: 'xlsx',
        fields: [],
        validationRules: [],
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockImportRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.importFromSpreadsheet(templateId, filePath, fileName, fileSize)).rejects.toThrow('Failed to import from spreadsheet');
    });
  });

  describe('validateSpreadsheetData', () => {
    it('should validate spreadsheet data successfully', async () => {
      const templateId = 'template_001';
      const data = [
        { resident_name: 'John Doe', age: 75 },
        { resident_name: '', age: 'invalid' },
      ];

      const mockTemplate = {
        id: templateId,
        name: 'Care Plan Template',
        fileType: 'xlsx',
        fields: [
          {
            id: 'field_001',
            name: 'resident_name',
            displayName: 'Resident Name',
            type: 'text',
            required: true,
            position: { row: 1, column: 1 },
          },
          {
            id: 'field_002',
            name: 'age',
            displayName: 'Age',
            type: 'number',
            required: true,
            position: { row: 1, column: 2 },
          },
        ],
        validationRules: [],
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.validateSpreadsheetData(templateId, data);

      expect(result).toEqual(expect.any(Array));
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => !r.isValid)).toBe(true);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.validation.completed', {
        templateId,
        recordCount: data.length,
        validRecords: expect.any(Number),
        invalidRecords: expect.any(Number),
        timestamp: expect.any(Date),
      });
    });

    it('should handle validation failure when template not found', async () => {
      const templateId = 'nonexistent_template';
      const data = [];

      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.validateSpreadsheetData(templateId, data)).rejects.toThrow('Template not found');
    });

    it('should handle validation failure during processing', async () => {
      const templateId = 'template_001';
      const data = [];

      mockTemplateRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.validateSpreadsheetData(templateId, data)).rejects.toThrow('Failed to validate spreadsheet data');
    });
  });

  describe('getAllTemplates', () => {
    it('should get all templates successfully', async () => {
      const mockTemplates = [
        {
          id: 'template_001',
          name: 'Care Plan Template',
          category: 'care_plans',
          fileType: 'xlsx',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'template_002',
          name: 'Medication Template',
          category: 'medications',
          fileType: 'xlsx',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTemplateRepository.find.mockResolvedValue(mockTemplates);

      const result = await service.getAllTemplates();

      expect(result).toEqual(mockTemplates);
      expect(mockTemplateRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.templates.accessed', {
        count: mockTemplates.length,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get all templates failure', async () => {
      mockTemplateRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getAllTemplates()).rejects.toThrow('Failed to get templates');
    });
  });

  describe('getTemplateById', () => {
    it('should get template by ID successfully', async () => {
      const templateId = 'template_001';
      const mockTemplate = {
        id: templateId,
        name: 'Care Plan Template',
        category: 'care_plans',
        fileType: 'xlsx',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateById(templateId);

      expect(result).toEqual(mockTemplate);
      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({ where: { id: templateId } });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.template.accessed', {
        templateId,
        templateName: mockTemplate.name,
        category: mockTemplate.category,
        fileType: mockTemplate.fileType,
        timestamp: expect.any(Date),
      });
    });

    it('should return null for non-existent template', async () => {
      const templateId = 'nonexistent_template';

      mockTemplateRepository.findOne.mockResolvedValue(null);

      const result = await service.getTemplateById(templateId);

      expect(result).toBeNull();
    });

    it('should handle get template by ID failure', async () => {
      const templateId = 'template_001';

      mockTemplateRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.getTemplateById(templateId)).rejects.toThrow('Failed to get template');
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should get templates by category successfully', async () => {
      const category = 'care_plans';
      const mockTemplates = [
        {
          id: 'template_001',
          name: 'Care Plan Template',
          category: 'care_plans',
          fileType: 'xlsx',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTemplateRepository.find.mockResolvedValue(mockTemplates);

      const result = await service.getTemplatesByCategory(category);

      expect(result).toEqual(mockTemplates);
      expect(mockTemplateRepository.find).toHaveBeenCalledWith({
        where: { category },
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.templates_by_category.accessed', {
        category,
        count: mockTemplates.length,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get templates by category failure', async () => {
      const category = 'care_plans';

      mockTemplateRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getTemplatesByCategory(category)).rejects.toThrow('Failed to get templates by category');
    });
  });

  describe('getExportHistory', () => {
    it('should get export history successfully', async () => {
      const templateId = 'template_001';
      const mockExports = [
        {
          id: 'export_001',
          templateId,
          fileName: 'export_1.xlsx',
          filePath: '/exports/export_1.xlsx',
          fileSize: 1024000,
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      mockExportRepository.find.mockResolvedValue(mockExports);

      const result = await service.getExportHistory(templateId);

      expect(result).toEqual(mockExports);
      expect(mockExportRepository.find).toHaveBeenCalledWith({
        where: { templateId },
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.exports.accessed', {
        templateId,
        count: mockExports.length,
        timestamp: expect.any(Date),
      });
    });

    it('should get all export history when no template ID provided', async () => {
      const mockExports = [
        {
          id: 'export_001',
          templateId: 'template_001',
          fileName: 'export_1.xlsx',
          filePath: '/exports/export_1.xlsx',
          fileSize: 1024000,
          status: 'completed',
          createdAt: new Date(),
        },
        {
          id: 'export_002',
          templateId: 'template_002',
          fileName: 'export_2.xlsx',
          filePath: '/exports/export_2.xlsx',
          fileSize: 2048000,
          status: 'completed',
          createdAt: new Date(),
        },
      ];

      mockExportRepository.find.mockResolvedValue(mockExports);

      const result = await service.getExportHistory();

      expect(result).toEqual(mockExports);
      expect(mockExportRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle get export history failure', async () => {
      mockExportRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getExportHistory()).rejects.toThrow('Failed to get export history');
    });
  });

  describe('getImportHistory', () => {
    it('should get import history successfully', async () => {
      const templateId = 'template_001';
      const mockImports = [
        {
          id: 'import_001',
          templateId,
          fileName: 'import_1.xlsx',
          filePath: '/uploads/import_1.xlsx',
          fileSize: 1024000,
          status: 'completed',
          recordsProcessed: 10,
          recordsSuccessful: 8,
          recordsFailed: 2,
          createdAt: new Date(),
        },
      ];

      mockImportRepository.find.mockResolvedValue(mockImports);

      const result = await service.getImportHistory(templateId);

      expect(result).toEqual(mockImports);
      expect(mockImportRepository.find).toHaveBeenCalledWith({
        where: { templateId },
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.imports.accessed', {
        templateId,
        count: mockImports.length,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get import history failure', async () => {
      mockImportRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getImportHistory()).rejects.toThrow('Failed to get import history');
    });
  });

  describe('createScheduledReport', () => {
    it('should create a scheduled report successfully', async () => {
      const reportData = {
        name: 'Weekly Care Report',
        description: 'Weekly summary of care activities',
        templateId: 'template_001',
        reportType: 'summary' as const,
        parameters: { period: 'weekly' },
        schedule: {
          frequency: 'weekly' as const,
          time: '09:00',
          dayOfWeek: 1,
        },
        isActive: true,
      };

      const result = await service.createScheduledReport(reportData);

      expect(result).toEqual({
        id: expect.any(String),
        ...reportData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockReportRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: expect.any(String),
        ...reportData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.report.created', {
        reportId: expect.any(String),
        reportName: reportData.name,
        templateId: reportData.templateId,
        reportType: reportData.reportType,
        timestamp: expect.any(Date),
      });
    });

    it('should handle create scheduled report failure', async () => {
      const reportData = {
        name: 'Weekly Care Report',
        description: 'Weekly summary of care activities',
        templateId: 'template_001',
        reportType: 'summary' as const,
        parameters: {},
        isActive: true,
      };

      mockReportRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createScheduledReport(reportData)).rejects.toThrow('Failed to create scheduled report');
    });
  });

  describe('getAllReports', () => {
    it('should get all reports successfully', async () => {
      const mockReports = [
        {
          id: 'report_001',
          name: 'Weekly Care Report',
          description: 'Weekly summary of care activities',
          templateId: 'template_001',
          reportType: 'summary',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockReportRepository.find.mockResolvedValue(mockReports);

      const result = await service.getAllReports();

      expect(result).toEqual(mockReports);
      expect(mockReportRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.reports.accessed', {
        count: mockReports.length,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get all reports failure', async () => {
      mockReportRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getAllReports()).rejects.toThrow('Failed to get reports');
    });
  });

  describe('getSpreadsheetIntegrationStatistics', () => {
    it('should get spreadsheet integration statistics successfully', async () => {
      mockTemplateRepository.count
        .mockResolvedValueOnce(10) // totalTemplates
        .mockResolvedValueOnce(8);  // activeTemplates

      mockExportRepository.count
        .mockResolvedValueOnce(50)  // totalExports
        .mockResolvedValueOnce(45); // completedExports

      mockImportRepository.count
        .mockResolvedValueOnce(30)  // totalImports
        .mockResolvedValueOnce(28); // completedImports

      mockReportRepository.count
        .mockResolvedValueOnce(15)  // totalReports
        .mockResolvedValueOnce(12); // activeReports

      const result = await service.getSpreadsheetIntegrationStatistics();

      expect(result).toEqual({
        templates: {
          total: 10,
          active: 8,
          inactive: 2,
        },
        exports: {
          total: 50,
          completed: 45,
          failed: 5,
          successRate: 90,
        },
        imports: {
          total: 30,
          completed: 28,
          failed: 2,
          successRate: 93.33,
        },
        reports: {
          total: 15,
          active: 12,
          inactive: 3,
        },
        lastUpdated: expect.any(Date),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('spreadsheet.statistics.accessed', {
        totalTemplates: 10,
        activeTemplates: 8,
        totalExports: 50,
        completedExports: 45,
        totalImports: 30,
        completedImports: 28,
        timestamp: expect.any(Date),
      });
    });

    it('should handle get spreadsheet integration statistics failure', async () => {
      mockTemplateRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(service.getSpreadsheetIntegrationStatistics()).rejects.toThrow('Failed to get spreadsheet integration statistics');
    });
  });
});