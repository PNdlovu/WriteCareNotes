import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../middleware/auth.guard';
import { RbacGuard } from '../../middleware/rbac.guard';
import { SpreadsheetIntegrationService, SpreadsheetTemplate, SpreadsheetExport, SpreadsheetImport, SpreadsheetReport } from '../../services/spreadsheet-integration.service';
import { AuditTrailService } from '../../services/audit/AuditTrailService';

@Controller('api/spreadsheet-integration')
@UseGuards(JwtAuthGuard)
export class SpreadsheetIntegrationController {
  constructor(
    private readonly spreadsheetIntegrationService: SpreadsheetIntegrationService,
    private readonly auditService: AuditTrailService,
  ) {}

  /**
   * Create a new spreadsheet template
   */
  @Post('templates')
  @UseGuards(RbacGuard)
  async createTemplate(
    @Body() templateData: {
      name: string;
      description: string;
      category: 'care_plans' | 'medications' | 'assessments' | 'reports' | 'schedules' | 'inventory' | 'financial' | 'compliance';
      fileType: 'xlsx' | 'xls' | 'csv' | 'ods';
      templateData: any;
      fields: Array<{
        name: string;
        displayName: string;
        type: 'text' | 'number' | 'date' | 'boolean' | 'dropdown' | 'formula';
        required: boolean;
        validation?: {
          min?: number;
          max?: number;
          pattern?: string;
          options?: string[];
        };
        position: {
          row: number;
          column: number;
        };
        formula?: string;
      }>;
      validationRules: Array<{
        fieldId: string;
        ruleType: 'required' | 'range' | 'pattern' | 'custom';
        ruleValue: any;
        errorMessage: string;
        isActive: boolean;
      }>;
    },
    @Request() req: any,
  ) {
    try {
      const template = await this.spreadsheetIntegrationService.createTemplate({
        ...templateData,
        isActive: true,
      });

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Template',
        entityId: template.id,
        action: 'CREATE',
        details: {
          templateName: template.name,
          category: template.category,
          fileType: template.fileType,
          fieldCount: template.fields.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: template,
        message: 'Template created successfully',
      };
    } catch (error) {
      console.error('Error creating template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all templates
   */
  @Get('templates')
  @UseGuards(RbacGuard)
  async getAllTemplates(
    @Query('category') category?: string,
    @Request() req: any,
  ) {
    try {
      let templates: SpreadsheetTemplate[];

      if (category) {
        templates = await this.spreadsheetIntegrationService.getTemplatesByCategory(category as any);
      } else {
        templates = await this.spreadsheetIntegrationService.getAllTemplates();
      }

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Templates',
        entityId: 'templates_list',
        action: 'READ',
        details: {
          category,
          count: templates.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: templates,
        message: 'Templates retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting templates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get template by ID
   */
  @Get('templates/:templateId')
  @UseGuards(RbacGuard)
  async getTemplateById(
    @Param('templateId') templateId: string,
    @Request() req: any,
  ) {
    try {
      const template = await this.spreadsheetIntegrationService.getTemplateById(templateId);

      if (!template) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Template',
        entityId: templateId,
        action: 'READ',
        details: {
          templateName: template.name,
          category: template.category,
          fileType: template.fileType,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: template,
        message: 'Template retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export data to spreadsheet
   */
  @Post('export')
  @UseGuards(RbacGuard)
  async exportToSpreadsheet(
    @Body() exportData: {
      templateId: string;
      data: any[];
      exportType: 'full' | 'filtered' | 'summary';
      filters?: Record<string, any>;
    },
    @Request() req: any,
  ) {
    try {
      const exportResult = await this.spreadsheetIntegrationService.exportToSpreadsheet(
        exportData.templateId,
        exportData.data,
        exportData.exportType,
        exportData.filters,
      );

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Export',
        entityId: exportResult.id,
        action: 'CREATE',
        details: {
          templateId: exportData.templateId,
          fileName: exportResult.fileName,
          exportType: exportData.exportType,
          recordCount: exportData.data.length,
          fileSize: exportResult.fileSize,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: exportResult,
        message: 'Export completed successfully',
      };
    } catch (error) {
      console.error('Error exporting to spreadsheet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Import data from spreadsheet
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(RbacGuard)
  async importFromSpreadsheet(
    @UploadedFile() file: Express.Multer.File,
    @Body() importData: {
      templateId: string;
      importType: 'full' | 'incremental' | 'validation_only';
    },
    @Request() req: any,
  ) {
    try {
      if (!file) {
        return {
          success: false,
          error: 'No file uploaded',
        };
      }

      const importResult = await this.spreadsheetIntegrationService.importFromSpreadsheet(
        importData.templateId,
        file.path,
        file.originalname,
        file.size,
        importData.importType,
      );

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Import',
        entityId: importResult.id,
        action: 'CREATE',
        details: {
          templateId: importData.templateId,
          fileName: file.originalname,
          importType: importData.importType,
          recordsProcessed: importResult.recordsProcessed,
          recordsSuccessful: importResult.recordsSuccessful,
          recordsFailed: importResult.recordsFailed,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: importResult,
        message: 'Import completed successfully',
      };
    } catch (error) {
      console.error('Error importing from spreadsheet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate spreadsheet data
   */
  @Post('validate')
  @UseGuards(RbacGuard)
  async validateSpreadsheetData(
    @Body() validationData: {
      templateId: string;
      data: any[];
    },
    @Request() req: any,
  ) {
    try {
      const validationResults = await this.spreadsheetIntegrationService.validateSpreadsheetData(
        validationData.templateId,
        validationData.data,
      );

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Validation',
        entityId: `validation_${Date.now()}`,
        action: 'CREATE',
        details: {
          templateId: validationData.templateId,
          recordCount: validationData.data.length,
          validRecords: validationResults.filter(r => r.isValid).length,
          invalidRecords: validationResults.filter(r => !r.isValid).length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: validationResults,
        message: 'Validation completed successfully',
      };
    } catch (error) {
      console.error('Error validating spreadsheet data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get export history
   */
  @Get('exports')
  @UseGuards(RbacGuard)
  async getExportHistory(
    @Query('templateId') templateId?: string,
    @Request() req: any,
  ) {
    try {
      const exports = await this.spreadsheetIntegrationService.getExportHistory(templateId);

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Exports',
        entityId: 'exports_list',
        action: 'READ',
        details: {
          templateId,
          count: exports.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: exports,
        message: 'Export history retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting export history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get import history
   */
  @Get('imports')
  @UseGuards(RbacGuard)
  async getImportHistory(
    @Query('templateId') templateId?: string,
    @Request() req: any,
  ) {
    try {
      const imports = await this.spreadsheetIntegrationService.getImportHistory(templateId);

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Imports',
        entityId: 'imports_list',
        action: 'READ',
        details: {
          templateId,
          count: imports.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: imports,
        message: 'Import history retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting import history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a scheduled report
   */
  @Post('reports')
  @UseGuards(RbacGuard)
  async createScheduledReport(
    @Body() reportData: {
      name: string;
      description: string;
      templateId: string;
      reportType: 'summary' | 'detailed' | 'analytics' | 'compliance';
      parameters: Record<string, any>;
      schedule?: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        time: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
      };
    },
    @Request() req: any,
  ) {
    try {
      const report = await this.spreadsheetIntegrationService.createScheduledReport({
        ...reportData,
        isActive: true,
      });

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Report',
        entityId: report.id,
        action: 'CREATE',
        details: {
          reportName: report.name,
          templateId: report.templateId,
          reportType: report.reportType,
          schedule: report.schedule,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: report,
        message: 'Scheduled report created successfully',
      };
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all reports
   */
  @Get('reports')
  @UseGuards(RbacGuard)
  async getAllReports(@Request() req: any) {
    try {
      const reports = await this.spreadsheetIntegrationService.getAllReports();

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Reports',
        entityId: 'reports_list',
        action: 'READ',
        details: {
          count: reports.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: reports,
        message: 'Reports retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting reports:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get spreadsheet integration statistics
   */
  @Get('statistics')
  @UseGuards(RbacGuard)
  async getSpreadsheetIntegrationStatistics(@Request() req: any) {
    try {
      const statistics = await this.spreadsheetIntegrationService.getSpreadsheetIntegrationStatistics();

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Statistics',
        entityId: 'spreadsheet_stats',
        action: 'READ',
        details: {
          totalTemplates: statistics.templates.total,
          activeTemplates: statistics.templates.active,
          totalExports: statistics.exports.total,
          completedExports: statistics.exports.completed,
          totalImports: statistics.imports.total,
          completedImports: statistics.imports.completed,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: statistics,
        message: 'Spreadsheet integration statistics retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting spreadsheet integration statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get template categories
   */
  @Get('categories')
  @UseGuards(RbacGuard)
  async getTemplateCategories(@Request() req: any) {
    try {
      const categories = [
        {
          id: 'care_plans',
          name: 'Care Plans',
          description: 'Templates for resident care plans and assessments',
          icon: 'medical-bag',
          color: '#4CAF50',
        },
        {
          id: 'medications',
          name: 'Medications',
          description: 'Templates for medication management and tracking',
          icon: 'pill',
          color: '#FF9800',
        },
        {
          id: 'assessments',
          name: 'Assessments',
          description: 'Templates for health and wellness assessments',
          icon: 'clipboard-check',
          color: '#2196F3',
        },
        {
          id: 'reports',
          name: 'Reports',
          description: 'Templates for various care home reports',
          icon: 'chart-bar',
          color: '#9C27B0',
        },
        {
          id: 'schedules',
          name: 'Schedules',
          description: 'Templates for staff and resident schedules',
          icon: 'calendar',
          color: '#F44336',
        },
        {
          id: 'inventory',
          name: 'Inventory',
          description: 'Templates for equipment and supply inventory',
          icon: 'box',
          color: '#607D8B',
        },
        {
          id: 'financial',
          name: 'Financial',
          description: 'Templates for financial records and budgets',
          icon: 'currency-dollar',
          color: '#4CAF50',
        },
        {
          id: 'compliance',
          name: 'Compliance',
          description: 'Templates for regulatory compliance documentation',
          icon: 'shield-check',
          color: '#795548',
        },
      ];

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Categories',
        entityId: 'categories_list',
        action: 'READ',
        details: {
          count: categories.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: categories,
        message: 'Template categories retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting template categories:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get file types and formats
   */
  @Get('file-types')
  @UseGuards(RbacGuard)
  async getFileTypes(@Request() req: any) {
    try {
      const fileTypes = [
        {
          type: 'xlsx',
          name: 'Excel (XLSX)',
          description: 'Microsoft Excel 2007+ format',
          extension: '.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          maxSize: '10MB',
          features: ['formulas', 'formatting', 'charts', 'macros'],
        },
        {
          type: 'xls',
          name: 'Excel (XLS)',
          description: 'Microsoft Excel 97-2003 format',
          extension: '.xls',
          mimeType: 'application/vnd.ms-excel',
          maxSize: '5MB',
          features: ['formulas', 'formatting', 'charts'],
        },
        {
          type: 'csv',
          name: 'CSV',
          description: 'Comma-separated values format',
          extension: '.csv',
          mimeType: 'text/csv',
          maxSize: '50MB',
          features: ['simple', 'universal', 'fast'],
        },
        {
          type: 'ods',
          name: 'OpenDocument Spreadsheet',
          description: 'OpenDocument spreadsheet format',
          extension: '.ods',
          mimeType: 'application/vnd.oasis.opendocument.spreadsheet',
          maxSize: '10MB',
          features: ['open_source', 'formulas', 'formatting'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'FileTypes',
        entityId: 'file_types_list',
        action: 'READ',
        details: {
          count: fileTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: fileTypes,
        message: 'File types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting file types:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get field types and validation options
   */
  @Get('field-types')
  @UseGuards(RbacGuard)
  async getFieldTypes(@Request() req: any) {
    try {
      const fieldTypes = [
        {
          type: 'text',
          name: 'Text',
          description: 'Plain text input',
          validation: ['required', 'pattern', 'length'],
          examples: ['Name', 'Description', 'Notes'],
        },
        {
          type: 'number',
          name: 'Number',
          description: 'Numeric input',
          validation: ['required', 'min', 'max', 'decimal'],
          examples: ['Age', 'Weight', 'Temperature', 'Count'],
        },
        {
          type: 'date',
          name: 'Date',
          description: 'Date input',
          validation: ['required', 'min_date', 'max_date'],
          examples: ['Birth Date', 'Appointment Date', 'Due Date'],
        },
        {
          type: 'boolean',
          name: 'Boolean',
          description: 'True/False input',
          validation: ['required'],
          examples: ['Active', 'Completed', 'Approved'],
        },
        {
          type: 'dropdown',
          name: 'Dropdown',
          description: 'Select from predefined options',
          validation: ['required', 'options'],
          examples: ['Status', 'Category', 'Priority'],
        },
        {
          type: 'formula',
          name: 'Formula',
          description: 'Calculated field',
          validation: ['formula_syntax'],
          examples: ['Total', 'Average', 'Percentage'],
        },
      ];

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'FieldTypes',
        entityId: 'field_types_list',
        action: 'READ',
        details: {
          count: fieldTypes.length,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: fieldTypes,
        message: 'Field types retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting field types:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download exported file
   */
  @Get('download/:exportId')
  @UseGuards(RbacGuard)
  async downloadExportedFile(
    @Param('exportId') exportId: string,
    @Request() req: any,
  ) {
    try {
      // This would typically fetch the file from storage and return it
      const mockFile = {
        id: exportId,
        fileName: 'exported_data.xlsx',
        filePath: '/exports/exported_data.xlsx',
        fileSize: 1024000,
        downloadUrl: `/api/spreadsheet-integration/files/${exportId}`,
      };

      await this.auditService.logEvent({
        resource: 'SpreadsheetIntegration',
        entityType: 'Download',
        entityId: exportId,
        action: 'READ',
        details: {
          fileName: mockFile.fileName,
          fileSize: mockFile.fileSize,
        },
        userId: req.user.id,
      });

      return {
        success: true,
        data: mockFile,
        message: 'Download link generated successfully',
      };
    } catch (error) {
      console.error('Error downloading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}