import { EventEmitter2 } from "eventemitter2";

import { Request, Response } from 'express';
import { SecurityAccessControlService } from '../../services/security/SecurityAccessControlService';
import { BiometricType } from '../../entities/security/AccessControlUser';

export class SecurityAccessControlController {
  private securityService: SecurityAccessControlService;

  constructor() {
    this.securityService = new SecurityAccessControlService();
  }

  async performBiometricAuth(req: Request, res: Response): Promise<void> {
    try {
      const { userId, biometricType, biometricTemplate, deviceInfo } = req.body;
      const result = await this.securityService.performBiometricAuthentication(
        userId, biometricType as BiometricType, biometricTemplate, deviceInfo
      );
      res.json({ success: true, data: result });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async grantAccess(req: Request, res: Response): Promise<void> {
    try {
      const { userId, accessLevel, permissions, biometricRequired } = req.body;
      await this.securityService.grantAdvancedAccess(userId, accessLevel, permissions, biometricRequired);
      res.json({ success: true, message: 'Access granted successfully' });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async detectThreats(req: Request, res: Response): Promise<void> {
    try {
      const threats = await this.securityService.performAdvancedThreatDetection();
      res.json({ success: true, data: threats });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async getSecurityMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.securityService.getComprehensiveSecurityMetrics();
      res.json({ success: true, data: metrics });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async performCybersecurityAssessment(req: Request, res: Response): Promise<void> {
    try {
      const assessment = await this.securityService.performCybersecurityAssessment();
      res.json({ success: true, data: assessment });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }

  async integrateSurveillance(req: Request, res: Response): Promise<void> {
    try {
      const surveillance = await this.securityService.integrateAdvancedSurveillance();
      res.json({ success: true, data: surveillance });
    } catch (error: unknown) {
      res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
    }
  }
}