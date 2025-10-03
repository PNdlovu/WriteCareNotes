import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { HRManagementService, EmployeeSearchCriteria } from '../../services/hr/HRManagementService';
import { Employee } from '../../entities/hr/Employee';

export class HRManagementController {
  private hrService: HRManagementService;

  constructor() {
    this.hrService = new HRManagementService();
  }

  // Employee Management Endpoints
  async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      const employeeData = req.body as Partial<Employee>;
      const employee = await this.hrService.createEmployee(employeeData);
      
      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to create employee',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getAllEmployees(req: Request, res: Response): Promise<void> {
    try {
      const employees = await this.hrService.getAllEmployees();
      
      res.json({
        success: true,
        data: employees,
        total: employees.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employees',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getEmployeeById(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const employee = await this.hrService.getEmployeeById(employeeId);
      
      if (!employee) {
        res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
        return;
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employee',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async searchEmployees(req: Request, res: Response): Promise<void> {
    try {
      const criteria: EmployeeSearchCriteria = {
        department: req.query['department'] as string,
        jobTitle: req.query['jobTitle'] as string,
        employmentStatus: req.query['employmentStatus'] as any,
        location: req.query['location'] as string,
        skillsRequired: req.query['skillsRequired'] as string[],
        certificationRequired: req.query['certificationRequired'] as string[]
      };

      const employees = await this.hrService.searchEmployees(criteria);
      
      res.json({
        success: true,
        data: employees,
        total: employees.length,
        criteria
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to search employees',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async updateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const updateData = req.body;
      
      const employee = await this.hrService.updateEmployee(employeeId, updateData);
      
      res.json({
        success: true,
        message: 'Employee updated successfully',
        data: employee
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to update employee',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async terminateEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { terminationReason, terminationDate } = req.body;

      if (!terminationReason || !terminationDate) {
        res.status(400).json({
          success: false,
          message: 'Termination reason and date are required'
        });
        return;
      }

      await this.hrService.terminateEmployee(employeeId, terminationReason, new Date(terminationDate));
      
      res.json({
        success: true,
        message: 'Employee terminated successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to terminate employee',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  // Performance Management Endpoints
  async getPerformanceAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.hrService.getPerformanceAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance analytics',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async schedulePerformanceReview(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { reviewDate, reviewerId } = req.body;

      if (!reviewDate || !reviewerId) {
        res.status(400).json({
          success: false,
          message: 'Review date and reviewer ID are required'
        });
        return;
      }

      await this.hrService.schedulePerformanceReview(employeeId, new Date(reviewDate), reviewerId);
      
      res.json({
        success: true,
        message: 'Performance review scheduled successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to schedule performance review',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  // Training Management Endpoints
  async assignTraining(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { trainingName, trainingType, dueDate } = req.body;

      if (!trainingName || !trainingType || !dueDate) {
        res.status(400).json({
          success: false,
          message: 'Training name, type, and due date are required'
        });
        return;
      }

      await this.hrService.assignTraining(employeeId, trainingName, trainingType, new Date(dueDate));
      
      res.json({
        success: true,
        message: 'Training assigned successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to assign training',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getTrainingPlan(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const trainingPlan = await this.hrService.generateTrainingPlan(employeeId);
      
      res.json({
        success: true,
        data: trainingPlan
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate training plan',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async recordTrainingCompletion(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, trainingId } = req.params;
      const { completionDate, score } = req.body;

      if (!completionDate) {
        res.status(400).json({
          success: false,
          message: 'Completion date is required'
        });
        return;
      }

      await this.hrService.recordTrainingCompletion(
        employeeId, 
        trainingId, 
        new Date(completionDate), 
        score
      );
      
      res.json({
        success: true,
        message: 'Training completion recorded successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to record training completion',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  // Compliance Endpoints
  async getComplianceAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await this.hrService.getComplianceAlerts();
      
      res.json({
        success: true,
        data: alerts,
        total: alerts.length
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve compliance alerts',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async checkEmployeeCompliance(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const compliance = await this.hrService.checkEmployeeCompliance(employeeId);
      
      res.json({
        success: true,
        data: compliance
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to check employee compliance',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  // Analytics Endpoints
  async getWorkforceAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await this.hrService.getWorkforceAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve workforce analytics',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getRecruitmentMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.hrService.getRecruitmentMetrics();
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date()
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve recruitment metrics',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getDisciplinaryHistory(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const history = await this.hrService.getDisciplinaryHistory(employeeId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve disciplinary history',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  // Department Management
  async getEmployeesByDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { department } = req.params;
      const employees = await this.hrService.getEmployeesByDepartment(department);
      
      res.json({
        success: true,
        data: employees,
        total: employees.length,
        department
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employees by department',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  async getEmployeesWithExpiringDocuments(req: Request, res: Response): Promise<void> {
    try {
      const withinDays = req.query['withinDays'] ? parseInt(req.query['withinDays'] as string) : 30;
      const employees = await this.hrService.getEmployeesWithExpiringDocuments(withinDays);
      
      res.json({
        success: true,
        data: employees,
        total: employees.length,
        withinDays
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve employees with expiring documents',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  // Bulk Operations
  async bulkUpdateTrainingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { trainingName, newStatus } = req.body;

      if (!trainingName || !newStatus) {
        res.status(400).json({
          success: false,
          message: 'Training name and new status are required'
        });
        return;
      }

      const updatedCount = await this.hrService.bulkUpdateTrainingStatus(trainingName, newStatus);
      
      res.json({
        success: true,
        message: `Updated training status for ${updatedCount} employees`,
        data: { updatedCount, trainingName, newStatus }
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update training status',
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }
}