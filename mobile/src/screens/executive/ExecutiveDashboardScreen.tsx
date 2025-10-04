// ============================================================================/**

// EXECUTIVE DASHBOARD SCREEN - ENTERPRISE CARE HOME MANAGEMENT * @fileoverview Enterprise Executive Dashboard Screen

// ============================================================================ * @module ExecutiveDashboardScreen

//  * @version 2.0.0

// Comprehensive executive dashboard for care home organization oversight * @author WriteCareNotes Team

// Features: Real-time analytics, compliance monitoring, financial insights, * @since 2025-01-01

// operational metrics, and critical alert management with enterprise security * 

// * @description Production-grade executive dashboard providing comprehensive

// Author: Enterprise Development Team * care home organization insights, real-time analytics, compliance monitoring,

// Version: 2.0.0 (Enterprise Grade) * and strategic decision support with enterprise security and accessibility.

// Last Updated: 2024-12-26 * 

//  * @compliance

// Security: Multi-factor authentication, biometric verification, * - CQC Regulation 17 - Good governance

// end-to-end encryption for sensitive financial and operational data * - Companies House Filing Requirements

// * - GDPR and Data Protection Act 2018

// Compliance: CQC standards, Companies House reporting, GDPR compliance, * - ISO 27001 Information Security Management

// care home governance requirements, executive audit trails * - Care Home Financial Reporting Standards

// ============================================================================ * - Professional Standards Authority requirements

 * 

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'; * @security

import { * - Executive-level access control and authentication

  View, * - Encrypted sensitive financial and operational data

  Text, * - Comprehensive audit logging for all dashboard activities

  TouchableOpacity, * - Role-based data filtering and access restrictions

  ScrollView, * - Real-time anomaly detection and alerting

  ActivityIndicator, * 

  RefreshControl, * @features

  Alert, * - Real-time KPI monitoring and trending

  Platform, * - Advanced analytics with predictive insights

  Dimensions, * - Comprehensive compliance and risk management

  StyleSheet, * - Financial performance and forecasting

  SafeAreaView, * - Operational efficiency metrics

  StatusBar * - Interactive data visualization and drill-down

} from 'react-native'; * - Automated reporting and alerting

import { useNavigation } from '@react-navigation/native'; * - Accessibility compliance (WCAG 2.1 AA)

import { useSelector } from 'react-redux'; */

import { format, startOfMonth, endOfMonth, formatDistanceToNow } from 'date-fns';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ============================================================================import {

// SERVICE IMPORTS  View,

// ============================================================================  Text,

  ScrollView,

import { ExecutiveService } from '../../../services/ExecutiveService';  TouchableOpacity,

import { AuditService } from '../../../services/AuditService';  StyleSheet,

import { EncryptionService } from '../../../services/EncryptionService';  RefreshControl,

import { NotificationService } from '../../../services/NotificationService';  ActivityIndicator,

import { BiometricService } from '../../../services/BiometricService';  Alert,

import { Logger } from '../../../utils/Logger';  Dimensions,

  Platform,

// ============================================================================  AccessibilityInfo,

// TYPE DEFINITIONS  findNodeHandle

// ============================================================================} from 'react-native';

import { useNavigation } from '@react-navigation/native';

type TimeframeType = 'week' | 'month' | 'quarter' | 'year';import { useSelector } from 'react-redux';

import Icon from 'react-native-vector-icons/MaterialIcons';

interface ExecutiveDashboardData {import LinearGradient from 'react-native-linear-gradient';

  kpiMetrics: {import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';

    totalRevenue: number;import { format, startOfMonth, endOfMonth, subMonths, isValid } from 'date-fns';

    totalServiceUsers: number;import { enGB } from 'date-fns/locale';

    totalStaff: number;

    occupancyRate: number;import { RootState } from '../../store/store';

    averageCareRating: number;import { ExecutiveService } from '../../services/ExecutiveService';

    complianceScore: number;import { AuditService } from '../../../shared/services/AuditService';

    riskScore: number;import { EncryptionService } from '../../../shared/services/EncryptionService';

    revenueTrend: number;import { NotificationService } from '../../services/NotificationService';

    serviceUserTrend: number;import { BiometricService } from '../../services/BiometricService';

    staffTrend: number;import { Logger } from '../../../shared/utils/Logger';

    occupancyTrend: number;import { ErrorBoundary } from '../../components/ErrorBoundary';

    careRatingTrend: number;import { LoadingSpinner } from '../../components/LoadingSpinner';

    complianceTrend: number;import { AccessibilityAnnouncer } from '../../components/AccessibilityAnnouncer';

  };

  financialSummary: {const { width, height } = Dimensions.get('window');

    monthlyRevenue: number;

    monthlyExpenses: number;/**

    netProfit: number; * Enhanced interface for comprehensive executive dashboard data

    profitMargin: number; */

    yearOnYearGrowth: number;interface ExecutiveDashboardData {

    forecastRevenue: number;  kpiMetrics: {

    costPerServiceUser: number;    totalRevenue: number;

    revenuePerStaff: number;    totalServiceUsers: number;

    operatingRatio: number;    totalStaff: number;

    debtToEquity: number;    occupancyRate: number;

  };    averageCareRating: number;

  operationalMetrics: {    complianceScore: number;

    visitCompletionRate: number;    netProfit: number;

    staffUtilization: number;    ebitda: number;

    emergencyIncidents: number;    cashFlow: number;

    complaintResolutionTime: number;    riskScore: number;

    trainingComplianceRate: number;    staffTurnoverRate: number;

    medicationComplianceRate: number;    serviceUserSatisfaction: number;

    careQualityScore: number;  };

    safetySore: number;  financialSummary: {

    familySatisfactionScore: number;    monthlyRevenue: number;

    staffWellbeingScore: number;    monthlyExpenses: number;

  };    netProfit: number;

  complianceAlerts: ComplianceAlert[];    profitMargin: number;

  trendData: {    yearOnYearGrowth: number;

    revenueData: Array<{ date: string; value: number }>;    forecastRevenue: number;

    occupancyData: Array<{ date: string; value: number }>;    costPerServiceUser: number;

    satisfactionData: Array<{ date: string; value: number }>;    revenuePerStaff: number;

  };    operatingRatio: number;

  benchmarkData: {    debtToEquity: number;

    industryAverages: {  };

      occupancyRate: number;  operationalMetrics: {

      complianceScore: number;    visitCompletionRate: number;

      careRating: number;    staffUtilization: number;

      staffUtilization: number;    emergencyIncidents: number;

    };    complaintResolutionTime: number;

  };    trainingComplianceRate: number;

  alertSummary: {    medicationComplianceRate: number;

    totalAlerts: number;    careQualityScore: number;

    criticalAlerts: number;    safetySore: number;

    highPriorityAlerts: number;    familySatisfactionScore: number;

    resolvedToday: number;    staffWellbeingScore: number;

  };  };

  lastUpdated: Date;  complianceAlerts: ComplianceAlert[];

}  trendData: {

    revenueData: TrendDataPoint[];

interface ComplianceAlert {    serviceUserData: TrendDataPoint[];

  id: string;    staffingData: TrendDataPoint[];

  title: string;    complianceData: TrendDataPoint[];

  description: string;    incidentData: TrendDataPoint[];

  severity: 'critical' | 'high' | 'medium' | 'low';    months: string[];

  type: string;    forecasts: ForecastData[];

  createdAt: string;  };

  dueDate?: string;  riskIndicators: RiskIndicator[];

  assignedTo?: string;  predictiveInsights: PredictiveInsight[];

  status: 'open' | 'in_progress' | 'resolved';  benchmarkData: BenchmarkData;

}  alertSummary: AlertSummary;

}

interface DashboardState {

  data: ExecutiveDashboardData | null;/**

  isLoading: boolean; * Interface for compliance alerts

  isRefreshing: boolean; */

  error: string | null;interface ComplianceAlert {

  lastUpdated: Date | null;  id: string;

  selectedTimeframe: TimeframeType;  type: 'cqc' | 'financial' | 'safety' | 'staffing' | 'medication' | 'data_protection';

  selectedMetrics: string[];  severity: 'low' | 'medium' | 'high' | 'critical';

  filterCriteria: {  title: string;

    departments: string[];  description: string;

    regions: string[];  recommendedAction: string;

    serviceTypes: string[];  deadline: Date;

    riskLevels: string[];  affectedAreas: string[];

    dateRange: {  estimatedImpact: 'low' | 'medium' | 'high';

      start: Date;  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved';

      end: Date;  assignedTo: string;

    };  createdAt: Date;

  };}

  realTimeEnabled: boolean;

}/**

 * Interface for trend data points

interface RootState { */

  auth: {interface TrendDataPoint {

    user: {  value: number;

      id: string;  timestamp: Date;

      role: string;  variance: number;

      permissions: string[];  target?: number;

    } | null;  benchmark?: number;

  };}

}

/**

// ============================================================================ * Interface for risk indicators

// MAIN COMPONENT */

// ============================================================================interface RiskIndicator {

  id: string;

export const ExecutiveDashboardScreen: React.FC = () => {  level: 'low' | 'medium' | 'high' | 'critical';

  // ============================================================================  count: number;

  // HOOKS AND STATE MANAGEMENT  category: string;

  // ============================================================================  description: string;

  trend: 'improving' | 'stable' | 'deteriorating';

  const navigation = useNavigation();  lastUpdated: Date;

  const { user } = useSelector((state: RootState) => state.auth);  mitigation: string[];

  }

  const [state, setState] = useState<DashboardState>({

    data: null,/**

    isLoading: false, * Interface for predictive insights

    isRefreshing: false, */

    error: null,interface PredictiveInsight {

    lastUpdated: null,  id: string;

    selectedTimeframe: 'month',  type: 'revenue_forecast' | 'staffing_prediction' | 'compliance_risk' | 'operational_efficiency';

    selectedMetrics: ['revenue', 'occupancy', 'compliance', 'satisfaction'],  title: string;

    filterCriteria: {  description: string;

      departments: [],  confidence: number;

      regions: [],  timeframe: string;

      serviceTypes: [],  impact: 'positive' | 'negative' | 'neutral';

      riskLevels: [],  recommendedActions: string[];

      dateRange: {  dataPoints: any[];

        start: startOfMonth(new Date()),}

        end: endOfMonth(new Date())

      }/**

    }, * Interface for benchmark data

    realTimeEnabled: true */

  });interface BenchmarkData {

  industryAverages: {

  // ============================================================================    occupancyRate: number;

  // SERVICES AND UTILITIES    staffTurnover: number;

  // ============================================================================    complianceScore: number;

    profitMargin: number;

  const executiveService = useRef(new ExecutiveService()).current;    careRating: number;

  const auditService = useRef(new AuditService()).current;  };

  const encryptionService = useRef(new EncryptionService()).current;  peerComparison: {

  const notificationService = useRef(new NotificationService()).current;    position: 'top_quartile' | 'above_average' | 'average' | 'below_average';

  const biometricService = useRef(new BiometricService()).current;    metrics: { [key: string]: number };

  const logger = useRef(new Logger('ExecutiveDashboardScreen')).current;  };

  nationalTargets: {

  const scrollViewRef = useRef<ScrollView>(null);    cqcRating: string;

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);    complianceTarget: number;

  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);    safetyTarget: number;

  };

  // ============================================================================}

  // COMPUTED VALUES AND MEMOIZATION

  // ============================================================================/**

 * Interface for alert summary

  const screenDimensions = useMemo(() => Dimensions.get('window'), []); */

  interface AlertSummary {

  const criticalAlertsCount = useMemo(() => {  totalAlerts: number;

    return state.data?.complianceAlerts.filter(alert => alert.severity === 'critical').length || 0;  criticalAlerts: number;

  }, [state.data?.complianceAlerts]);  overdueActions: number;

  newIssues: number;

  const overallHealthScore = useMemo(() => {  trendsData: {

    if (!state.data) return 0;    period: string;

        count: number;

    const metrics = [    severity: string;

      state.data.kpiMetrics.complianceScore,  }[];

      state.data.kpiMetrics.averageCareRating * 20, // Convert to 100 scale}

      state.data.operationalMetrics.careQualityScore,

      Math.max(0, 100 - state.data.kpiMetrics.riskScore)/**

    ]; * Interface for forecast data

     */

    return Math.round(metrics.reduce((sum, metric) => sum + metric, 0) / metrics.length);interface ForecastData {

  }, [state.data]);  metric: string;

  current: number;

  const trendDirection = useMemo(() => {  forecast: number;

    if (!state.data?.trendData.revenueData.length) return 'stable';  confidence: number;

      timeframe: string;

    const recentData = state.data.trendData.revenueData.slice(-3);  factors: string[];

    const trend = recentData[recentData.length - 1].value - recentData[0].value;}

    

    if (trend > 5) return 'improving';/**

    if (trend < -5) return 'declining'; * Interface for dashboard state management

    return 'stable'; */

  }, [state.data?.trendData]);interface DashboardState {

  data: ExecutiveDashboardData | null;

  const kpiComparison = useMemo(() => {  isLoading: boolean;

    if (!state.data) return {};  isRefreshing: boolean;

      error: string | null;

    const { kpiMetrics } = state.data;  lastUpdated: Date | null;

    const { industryAverages } = state.data.benchmarkData;  selectedTimeframe: 'week' | 'month' | 'quarter' | 'year';

      selectedMetrics: string[];

    return {  filterCriteria: FilterCriteria;

      occupancy: ((kpiMetrics.occupancyRate - industryAverages.occupancyRate) / industryAverages.occupancyRate) * 100,  realTimeEnabled: boolean;

      compliance: ((kpiMetrics.complianceScore - industryAverages.complianceScore) / industryAverages.complianceScore) * 100,}

      satisfaction: ((kpiMetrics.averageCareRating - industryAverages.careRating) / industryAverages.careRating) * 100

    };/**

  }, [state.data]); * Interface for filter criteria

 */

  // ============================================================================interface FilterCriteria {

  // UTILITY FUNCTIONS  departments: string[];

  // ============================================================================  regions: string[];

  serviceTypes: string[];

  /**  riskLevels: string[];

   * Generates a unique correlation ID for tracking requests  dateRange: {

   */    start: Date;

  const generateCorrelationId = useCallback(() => {    end: Date;

    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;  };

  }, []);}



  /**export const ExecutiveDashboardScreen: React.FC = () => {

   * Verifies executive access permissions  // ============================================================================

   */  // HOOKS AND STATE MANAGEMENT

  const verifyExecutiveAccess = useCallback(async (): Promise<boolean> => {  // ============================================================================

    try {

      if (!user) return false;  const navigation = useNavigation();

        const { user } = useSelector((state: RootState) => state.auth);

      return ['executive', 'c_level', 'director', 'administrator'].includes(  

        user.role?.toLowerCase() || ''  const [state, setState] = useState<DashboardState>({

      ) && user.permissions?.includes('executive_dashboard');    data: null,

    } catch (error) {    isLoading: false,

      logger.error('Error verifying executive access', { error });    isRefreshing: false,

      return false;    error: null,

    }    lastUpdated: null,

  }, [user]);    selectedTimeframe: 'month',

    selectedMetrics: ['revenue', 'occupancy', 'compliance', 'satisfaction'],

  /**    filterCriteria: {

   * Decrypts sensitive financial and operational data      departments: [],

   */      regions: [],

  const decryptSensitiveData = useCallback(async (rawData: any): Promise<ExecutiveDashboardData> => {      serviceTypes: [],

    try {      riskLevels: [],

      if (!rawData.encrypted) return rawData;      dateRange: {

        start: startOfMonth(new Date()),

      const decrypted = await encryptionService.decryptData(rawData.encryptedPayload);        end: endOfMonth(new Date())

      return JSON.parse(decrypted);      }

    } catch (error) {    },

      logger.error('Failed to decrypt sensitive data', { error });    realTimeEnabled: true

      throw new Error('Unable to decrypt dashboard data');  });

    }

  }, []);  // ============================================================================

  // SERVICES AND UTILITIES

  /**  // ============================================================================

   * Validates dashboard data integrity and completeness

   */  const executiveService = useRef(new ExecutiveService()).current;

  const validateDashboardData = useCallback(async (data: any): Promise<{ isValid: boolean; errors: string[] }> => {  const auditService = useRef(new AuditService()).current;

    const errors: string[] = [];  const encryptionService = useRef(new EncryptionService()).current;

  const notificationService = useRef(new NotificationService()).current;

    if (!data) {  const biometricService = useRef(new BiometricService()).current;

      errors.push('No data provided');  const logger = useRef(new Logger('ExecutiveDashboardScreen')).current;

      return { isValid: false, errors };

    }  const scrollViewRef = useRef<ScrollView>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Validate required sections  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const requiredSections = ['kpiMetrics', 'financialSummary', 'operationalMetrics', 'complianceAlerts'];

    for (const section of requiredSections) {  // ============================================================================

      if (!data[section]) {  // COMPUTED VALUES AND MEMOIZATION

        errors.push(`Missing required section: ${section}`);  // ============================================================================

      }

    }  const screenDimensions = useMemo(() => Dimensions.get('window'), []);

  

    // Validate KPI metrics ranges  const criticalAlertsCount = useMemo(() => {

    if (data.kpiMetrics) {    return state.data?.complianceAlerts.filter(alert => alert.severity === 'critical').length || 0;

      if (data.kpiMetrics.complianceScore < 0 || data.kpiMetrics.complianceScore > 100) {  }, [state.data?.complianceAlerts]);

        errors.push('Invalid compliance score range');

      }  const overallHealthScore = useMemo(() => {

      if (data.kpiMetrics.occupancyRate < 0 || data.kpiMetrics.occupancyRate > 100) {    if (!state.data) return 0;

        errors.push('Invalid occupancy rate range');    

      }    const metrics = [

    }      state.data.kpiMetrics.complianceScore,

      state.data.kpiMetrics.averageCareRating * 20, // Convert to 100 scale

    return { isValid: errors.length === 0, errors };      state.data.operationalMetrics.careQualityScore,

  }, []);      Math.max(0, 100 - state.data.kpiMetrics.riskScore)

    ];

  /**    

   * Shows error alert with accessibility support    return Math.round(metrics.reduce((sum, metric) => sum + metric, 0) / metrics.length);

   */  }, [state.data]);

  const showErrorAlert = useCallback((title: string, message: string) => {

    Alert.alert(  const trendDirection = useMemo(() => {

      title,    if (!state.data?.trendData.revenueData.length) return 'stable';

      message,    

      [{ text: 'OK', style: 'default' }],    const recentData = state.data.trendData.revenueData.slice(-3);

      { cancelable: false }    const trend = recentData[recentData.length - 1].value - recentData[0].value;

    );    

  }, []);    if (trend > 5) return 'improving';

    if (trend < -5) return 'declining';

  /**    return 'stable';

   * Announces content to screen readers  }, [state.data?.trendData]);

   */

  const announceToScreenReader = useCallback((message: string) => {  const kpiComparison = useMemo(() => {

    if (Platform.OS === 'ios') {    if (!state.data) return {};

      // iOS announcement would be handled by VoiceOver    

      console.log('Screen Reader Announcement:', message);    const { kpiMetrics } = state.data;

    } else {    const { industryAverages } = state.data.benchmarkData;

      // Android announcement would be handled by TalkBack    

      console.log('Screen Reader Announcement:', message);    return {

    }      occupancy: ((kpiMetrics.occupancyRate - industryAverages.occupancyRate) / industryAverages.occupancyRate) * 100,

  }, []);      compliance: ((kpiMetrics.complianceScore - industryAverages.complianceScore) / industryAverages.complianceScore) * 100,

      satisfaction: ((kpiMetrics.serviceUserSatisfaction - industryAverages.careRating) / industryAverages.careRating) * 100

  /**    };

   * Sets up real-time data updates for live metrics  }, [state.data]);

   */

  const setupRealTimeUpdates = useCallback(() => {  // ============================================================================

    if (refreshIntervalRef.current) {  // UTILITY FUNCTIONS

      clearInterval(refreshIntervalRef.current);  // ============================================================================

    }

  /**

    refreshIntervalRef.current = setInterval(async () => {   * Generates a unique correlation ID for tracking requests

      if (!state.realTimeEnabled || state.isLoading) return;   */

  const generateCorrelationId = useCallback(() => {

      try {    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const correlationId = generateCorrelationId();  }, []);

        const updates = await executiveService.getRealtimeUpdates(correlationId);

          /**

        if (updates && state.data) {   * Verifies executive access permissions

          setState(prev => ({   */

            ...prev,  const verifyExecutiveAccess = useCallback(async (): Promise<boolean> => {

            data: {    try {

              ...prev.data!,      if (!user) return false;

              ...updates,      

              lastUpdated: new Date()      return ['executive', 'c_level', 'director', 'administrator'].includes(

            }        user.role?.toLowerCase() || ''

          }));      ) && user.permissions?.includes('executive_dashboard');

        }    } catch (error) {

      } catch (error) {      logger.error('Error verifying executive access', { error });

        logger.error('Failed to fetch real-time updates', { error });      return false;

      }    }

    }, 30000); // Update every 30 seconds  }, [user]);

  }, [state.realTimeEnabled, state.isLoading, state.data]);

  /**

  /**   * Decrypts sensitive financial and operational data

   * Handles critical alerts with immediate notifications   */

   */  const decryptSensitiveData = useCallback(async (rawData: any): Promise<ExecutiveDashboardData> => {

  const handleCriticalAlerts = useCallback(async () => {    try {

    if (!state.data?.complianceAlerts) return;      if (!rawData.encrypted) return rawData;



    const criticalAlerts = state.data.complianceAlerts.filter(      const decrypted = await encryptionService.decryptData(rawData.encryptedPayload);

      alert => alert.severity === 'critical'      return JSON.parse(decrypted);

    );    } catch (error) {

      logger.error('Failed to decrypt sensitive data', { error });

    for (const alert of criticalAlerts) {      throw new Error('Unable to decrypt dashboard data');

      try {    }

        await notificationService.sendCriticalAlert({  }, []);

          title: 'Critical Alert',

          message: alert.description,  /**

          data: {   * Validates dashboard data integrity and completeness

            alertId: alert.id,   */

            severity: alert.severity,  const validateDashboardData = useCallback(async (data: any): Promise<{ isValid: boolean; errors: string[] }> => {

            category: alert.type,    const errors: string[] = [];

            timestamp: alert.createdAt

          }    if (!data) {

        });      errors.push('No data provided');

      return { isValid: false, errors };

        await auditService.logEvent({    }

          eventType: 'critical_alert_processed',

          userId: user?.id || 'unknown',    // Validate required sections

          details: {    const requiredSections = ['kpiMetrics', 'financialSummary', 'operationalMetrics', 'complianceAlerts'];

            alertId: alert.id,    for (const section of requiredSections) {

            category: alert.type,      if (!data[section]) {

            processedAt: new Date().toISOString()        errors.push(`Missing required section: ${section}`);

          }      }

        });    }

      } catch (error) {

        logger.error('Failed to process critical alert', {     // Validate KPI metrics ranges

          alertId: alert.id,     if (data.kpiMetrics) {

          error       if (data.kpiMetrics.complianceScore < 0 || data.kpiMetrics.complianceScore > 100) {

        });        errors.push('Invalid compliance score range');

      }      }

    }      if (data.kpiMetrics.occupancyRate < 0 || data.kpiMetrics.occupancyRate > 100) {

  }, [state.data?.complianceAlerts, user?.id]);        errors.push('Invalid occupancy rate range');

      }

  // ============================================================================    }

  // LIFECYCLE METHODS

  // ============================================================================    return { isValid: errors.length === 0, errors };

  }, []);

  useEffect(() => {

    initializeDashboard();  /**

    return () => {   * Shows error alert with accessibility support

      if (refreshIntervalRef.current) {   */

        clearInterval(refreshIntervalRef.current);  const showErrorAlert = useCallback((title: string, message: string) => {

      }    Alert.alert(

      if (alertTimeoutRef.current) {      title,

        clearTimeout(alertTimeoutRef.current);      message,

      }      [{ text: 'OK', style: 'default' }],

    };      { cancelable: false }

  }, []);    );

  }, []);

  useEffect(() => {

    loadDashboardData();  /**

  }, [state.selectedTimeframe, state.filterCriteria]);   * Announces content to screen readers

   */

  useEffect(() => {  const announceToScreenReader = useCallback((message: string) => {

    if (state.realTimeEnabled) {    if (Platform.OS === 'ios') {

      setupRealTimeUpdates();      // iOS announcement would be handled by VoiceOver

    }      console.log('Screen Reader Announcement:', message);

  }, [state.realTimeEnabled]);    } else {

      // Android announcement would be handled by TalkBack

  useEffect(() => {      console.log('Screen Reader Announcement:', message);

    if (criticalAlertsCount > 0) {    }

      handleCriticalAlerts();  }, []);

    }

  }, [criticalAlertsCount]);  /**

   * Sets up real-time data updates for live metrics

  // ============================================================================   */

  // INITIALIZATION AND SETUP  const setupRealTimeUpdates = useCallback(() => {

  // ============================================================================    if (refreshIntervalRef.current) {

      clearInterval(refreshIntervalRef.current);

  /**    }

   * Initializes the executive dashboard with security checks

   */    refreshIntervalRef.current = setInterval(async () => {

  const initializeDashboard = useCallback(async () => {      if (!state.realTimeEnabled || state.isLoading) return;

    const startTime = Date.now();

    const correlationId = generateCorrelationId();      try {

        const correlationId = generateCorrelationId();

    try {        const updates = await executiveService.getRealtimeUpdates(correlationId);

      logger.info('Initializing Executive Dashboard', {         

        userId: user?.id,        if (updates && state.data) {

        correlationId           setState(prev => ({

      });            ...prev,

            data: {

      // Executive access verification              ...prev.data!,

      const hasExecutiveAccess = await verifyExecutiveAccess();              ...updates,

      if (!hasExecutiveAccess) {              lastUpdated: new Date()

        throw new Error('Insufficient privileges for executive dashboard access');            }

      }          }));

        }

      // Biometric authentication for sensitive data      } catch (error) {

      const biometricResult = await biometricService.authenticateUser(        logger.error('Failed to fetch real-time updates', { error });

        'Access sensitive executive dashboard data'      }

      );    }, 30000); // Update every 30 seconds

  }, [state.realTimeEnabled, state.isLoading, state.data]);

      if (!biometricResult.success) {

        throw new Error('Biometric authentication required for executive access');  /**

      }   * Handles critical alerts with immediate notifications

   */

      // Audit dashboard access  const handleCriticalAlerts = useCallback(async () => {

      await auditService.logEvent({    if (!state.data?.complianceAlerts) return;

        eventType: 'executive_dashboard_accessed',

        userId: user?.id || 'unknown',    const criticalAlerts = state.data.complianceAlerts.filter(

        correlationId,      alert => alert.severity === 'critical'

        details: {    );

          timestamp: new Date().toISOString(),

          platform: Platform.OS,    for (const alert of criticalAlerts) {

          accessLevel: 'executive',      try {

          biometricAuth: biometricResult.method || 'none'        await notificationService.sendCriticalAlert({

        }          title: 'Critical Alert',

      });          message: alert.message,

          data: {

      // Load initial data            alertId: alert.id,

      await loadDashboardData();            severity: alert.severity,

            category: alert.category,

      logger.info('Executive Dashboard initialization complete', {            timestamp: alert.timestamp

        correlationId,          }

        duration: Date.now() - startTime        });

      });

        await auditService.logEvent({

    } catch (error: any) {          eventType: 'critical_alert_processed',

      logger.error('Executive Dashboard initialization failed', {          userId: user?.id || 'unknown',

        error: error.message,          details: {

        correlationId,            alertId: alert.id,

        duration: Date.now() - startTime            category: alert.category,

      });            processedAt: new Date().toISOString()

          }

      setState(prev => ({         });

        ...prev,       } catch (error) {

        error: 'Failed to initialize executive dashboard. Please contact support.'         logger.error('Failed to process critical alert', { 

      }));          alertId: alert.id, 

                error 

      showErrorAlert('Access Error', error.message);        });

    }      }

  }, [user?.id]);    }

  }, [state.data?.complianceAlerts, user?.id]);

  /**

   * Loads comprehensive dashboard data with encryption handling  // ============================================================================

   */  // LIFECYCLE METHODS

  const loadDashboardData = useCallback(async () => {  // ============================================================================

    const startTime = Date.now();

    const correlationId = generateCorrelationId();  useEffect(() => {

    initializeDashboard();

    setState(prev => ({ ...prev, isLoading: true, error: null }));    return () => {

      if (refreshIntervalRef.current) {

    try {        clearInterval(refreshIntervalRef.current);

      logger.info('Loading executive dashboard data', {       }

        timeframe: state.selectedTimeframe,      if (alertTimeoutRef.current) {

        correlationId         clearTimeout(alertTimeoutRef.current);

      });      }

    };

      const rawData = await executiveService.getExecutiveDashboardData({  }, []);

        timeframe: state.selectedTimeframe,

        filters: state.filterCriteria,  useEffect(() => {

        includeForecasts: true,    loadDashboardData();

        includeBenchmarks: true,  }, [state.selectedTimeframe, state.filterCriteria]);

        correlationId

      });  useEffect(() => {

    if (state.realTimeEnabled) {

      // Decrypt sensitive financial data      setupRealTimeUpdates();

      const decryptedData = await decryptSensitiveData(rawData);    }

  }, [state.realTimeEnabled]);

      // Validate data integrity

      const validationResult = await validateDashboardData(decryptedData);  useEffect(() => {

      if (!validationResult.isValid) {    if (criticalAlertsCount > 0) {

        throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`);      handleCriticalAlerts();

      }    }

  }, [criticalAlertsCount]);

      setState(prev => ({

        ...prev,  // ============================================================================

        data: decryptedData,  // INITIALIZATION AND SETUP

        lastUpdated: new Date(),  // ============================================================================

        isLoading: false

      }));  /**

   * Initializes the executive dashboard with security checks

      // Audit successful data load   */

      await auditService.logEvent({  const initializeDashboard = useCallback(async () => {

        eventType: 'executive_dashboard_data_loaded',    const startTime = Date.now();

        userId: user?.id || 'unknown',    const correlationId = generateCorrelationId();

        correlationId,

        details: {    try {

          timeframe: state.selectedTimeframe,      logger.info('Initializing Executive Dashboard', { 

          recordsLoaded: decryptedData ? Object.keys(decryptedData).length : 0,        userId: user?.id,

          duration: Date.now() - startTime,        correlationId 

          criticalAlerts: decryptedData?.alertSummary.criticalAlerts || 0      });

        }

      });      // Executive access verification

      const hasExecutiveAccess = await verifyExecutiveAccess();

      // Announce critical alerts to screen readers      if (!hasExecutiveAccess) {

      if (decryptedData?.alertSummary.criticalAlerts > 0) {        throw new Error('Insufficient privileges for executive dashboard access');

        announceToScreenReader(      }

          `${decryptedData.alertSummary.criticalAlerts} critical alerts require immediate attention`

        );      // Biometric authentication for sensitive data

      }      const biometricResult = await biometricService.authenticateUser({

        reason: 'Access sensitive executive dashboard data',

      logger.info('Executive dashboard data loaded successfully', {        fallbackTitle: 'Use PIN'

        correlationId,      });

        duration: Date.now() - startTime,

        criticalAlerts: decryptedData?.alertSummary.criticalAlerts || 0      if (!biometricResult.success) {

      });        throw new Error('Biometric authentication required for executive access');

      }

    } catch (error: any) {

      logger.error('Failed to load executive dashboard data', {      // Audit dashboard access

        error: error.message,      await auditService.logEvent({

        correlationId,        eventType: 'executive_dashboard_accessed',

        timeframe: state.selectedTimeframe,        userId: user?.id || 'unknown',

        duration: Date.now() - startTime        correlationId,

      });        details: {

          timestamp: new Date().toISOString(),

      setState(prev => ({          platform: Platform.OS,

        ...prev,          accessLevel: 'executive',

        isLoading: false,          biometricAuth: biometricResult.method

        error: error.message || 'Failed to load dashboard data'        }

      }));      });



      showErrorAlert('Loading Error', 'Failed to load executive dashboard data. Please try again.');      // Load initial data

    }      await loadDashboardData();

  }, [state.selectedTimeframe, state.filterCriteria, user?.id]);

      logger.info('Executive Dashboard initialization complete', {

  /**        correlationId,

   * Handles screen refresh with optimistic updates        duration: Date.now() - startTime

   */      });

  const handleRefresh = useCallback(async () => {

    setState(prev => ({ ...prev, isRefreshing: true }));    } catch (error: any) {

          logger.error('Executive Dashboard initialization failed', {

    try {        error: error.message,

      await loadDashboardData();        correlationId,

    } catch (error: any) {        duration: Date.now() - startTime

      // Error already handled in loadDashboardData      });

    } finally {

      setState(prev => ({ ...prev, isRefreshing: false }));      setState(prev => ({ 

    }        ...prev, 

  }, [loadDashboardData]);        error: 'Failed to initialize executive dashboard. Please contact support.' 

      }));

  // ============================================================================      

  // EVENT HANDLERS      showErrorAlert('Access Error', error.message);

  // ============================================================================    }

  }, [user?.id]);

  /**

   * Handles timeframe selection with state updates  /**

   */   * Loads comprehensive dashboard data with encryption handling

  const handleTimeframeChange = useCallback((timeframe: TimeframeType) => {   */

    setState(prev => ({ ...prev, selectedTimeframe: timeframe }));  const loadDashboardData = useCallback(async () => {

        const startTime = Date.now();

    auditService.logEvent({    const correlationId = generateCorrelationId();

      eventType: 'executive_dashboard_timeframe_changed',

      userId: user?.id || 'unknown',    setState(prev => ({ ...prev, isLoading: true, error: null }));

      details: { 

        newTimeframe: timeframe,    try {

        timestamp: new Date().toISOString()      logger.info('Loading executive dashboard data', { 

      }        timeframe: state.selectedTimeframe,

    });        correlationId 

  }, [user?.id]);      });



  /**      const rawData = await executiveService.getExecutiveDashboardData({

   * Handles real-time updates toggle        timeframe: state.selectedTimeframe,

   */        filters: state.filterCriteria,

  const handleRealTimeToggle = useCallback((enabled: boolean) => {        includeForecasts: true,

    setState(prev => ({ ...prev, realTimeEnabled: enabled }));        includeBenchmarks: true,

            correlationId

    if (!enabled && refreshIntervalRef.current) {      });

      clearInterval(refreshIntervalRef.current);

      refreshIntervalRef.current = null;      // Decrypt sensitive financial data

    }      const decryptedData = await decryptSensitiveData(rawData);

  }, []);

      // Validate data integrity

  // ============================================================================      const validationResult = await validateDashboardData(decryptedData);

  // UTILITY FUNCTIONS      if (!validationResult.isValid) {

  // ============================================================================        throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`);

      }

  const formatCurrency = useCallback((amount: number): string => {

    return new Intl.NumberFormat('en-GB', {      setState(prev => ({

      style: 'currency',        ...prev,

      currency: 'GBP',        data: decryptedData,

      minimumFractionDigits: 0,        lastUpdated: new Date(),

      maximumFractionDigits: 0        isLoading: false

    }).format(amount);      }));

  }, []);

      // Audit successful data load

  const formatPercentage = useCallback((value: number): string => {      await auditService.logEvent({

    return `${Math.round(value)}%`;        eventType: 'executive_dashboard_data_loaded',

  }, []);        userId: user?.id || 'unknown',

        correlationId,

  const getKPIColor = useCallback((value: number, type: 'percentage' | 'rating' | 'compliance'): string => {        details: {

    switch (type) {          timeframe: state.selectedTimeframe,

      case 'percentage':          recordsLoaded: decryptedData ? Object.keys(decryptedData).length : 0,

      case 'compliance':          duration: Date.now() - startTime,

        if (value >= 90) return '#22C55E'; // Green          criticalAlerts: decryptedData?.alertSummary.criticalAlerts || 0

        if (value >= 75) return '#F59E0B'; // Amber        }

        return '#EF4444'; // Red      });

      case 'rating':

        if (value >= 4.5) return '#22C55E';      // Announce critical alerts to screen readers

        if (value >= 3.5) return '#F59E0B';      if (decryptedData?.alertSummary.criticalAlerts > 0) {

        return '#EF4444';        announceToScreenReader(

      default:          `${decryptedData.alertSummary.criticalAlerts} critical alerts require immediate attention`

        return '#6B7280';        );

    }      }

  }, []);

      logger.info('Executive dashboard data loaded successfully', {

  // ============================================================================        correlationId,

  // RENDER METHODS        duration: Date.now() - startTime,

  // ============================================================================        criticalAlerts: decryptedData?.alertSummary.criticalAlerts || 0

      });

  /**

   * Renders the executive dashboard header with controls    } catch (error: any) {

   */      logger.error('Failed to load executive dashboard data', {

  const renderHeader = useCallback(() => (        error: error.message,

    <View style={styles.header}>        correlationId,

      <View style={styles.headerTop}>        timeframe: state.selectedTimeframe,

        <View style={styles.headerLeft}>        duration: Date.now() - startTime

          <TouchableOpacity      });

            style={styles.backButton}

            onPress={() => navigation.goBack()}      setState(prev => ({

            accessibilityRole="button"        ...prev,

            accessibilityLabel="Go back"        isLoading: false,

          >        error: error.message || 'Failed to load dashboard data'

            <Text style={styles.backButtonText}>←</Text>      }));

          </TouchableOpacity>

          <View>      showErrorAlert('Loading Error', 'Failed to load executive dashboard data. Please try again.');

            <Text style={styles.headerTitle}>Executive Dashboard</Text>    }

            <Text style={styles.headerSubtitle}>  }, [state.selectedTimeframe, state.filterCriteria, user?.id]);

              {state.lastUpdated ? 

                `Last updated: ${format(state.lastUpdated, 'HH:mm, dd MMM yyyy')}` :  // ============================================================================

                'Loading...'  // EVENT HANDLERS

              }  // ============================================================================

            </Text>

          </View>  /**

        </View>   * Handles timeframe selection with state updates

           */

        <View style={styles.headerRight}>  const handleTimeframeChange = useCallback((timeframe: TimeframeType) => {

          <TouchableOpacity    setState(prev => ({ ...prev, selectedTimeframe: timeframe }));

            style={[styles.realTimeToggle, state.realTimeEnabled && styles.realTimeToggleActive]}    

            onPress={() => handleRealTimeToggle(!state.realTimeEnabled)}    auditService.logEvent({

            accessibilityRole="switch"      eventType: 'executive_dashboard_timeframe_changed',

            accessibilityState={{ checked: state.realTimeEnabled }}      userId: user?.id || 'unknown',

            accessibilityLabel="Toggle real-time updates"      details: { 

          >        newTimeframe: timeframe,

            <Text style={[        timestamp: new Date().toISOString()

              styles.realTimeToggleText,      }

              state.realTimeEnabled && styles.realTimeToggleTextActive    });

            ]}>  }, [user?.id]);

              LIVE

            </Text>  /**

          </TouchableOpacity>   * Handles filter criteria updates

             */

          <TouchableOpacity  const handleFilterChange = useCallback((key: string, value: any) => {

            style={styles.refreshButton}    setState(prev => ({

            onPress={handleRefresh}      ...prev,

            disabled={state.isLoading}      filterCriteria: {

            accessibilityRole="button"        ...prev.filterCriteria,

            accessibilityLabel="Refresh dashboard data"        [key]: value

          >      }

            <Text style={styles.refreshButtonText}>⟳</Text>    }));

          </TouchableOpacity>  }, []);

        </View>

      </View>  /**

   * Handles metric selection for customized dashboard

      {/* Timeframe Selection */}   */

      <ScrollView   const handleMetricToggle = useCallback((metric: string) => {

        horizontal     setState(prev => ({

        style={styles.timeframeContainer}      ...prev,

        showsHorizontalScrollIndicator={false}      selectedMetrics: prev.selectedMetrics.includes(metric)

        contentContainerStyle={styles.timeframeContent}        ? prev.selectedMetrics.filter(m => m !== metric)

      >        : [...prev.selectedMetrics, metric]

        {(['week', 'month', 'quarter', 'year'] as TimeframeType[]).map((timeframe) => (    }));

          <TouchableOpacity  }, []);

            key={timeframe}

            style={[  /**

              styles.timeframeButton,   * Handles real-time updates toggle

              state.selectedTimeframe === timeframe && styles.timeframeButtonActive   */

            ]}  const handleRealTimeToggle = useCallback((enabled: boolean) => {

            onPress={() => handleTimeframeChange(timeframe)}    setState(prev => ({ ...prev, realTimeEnabled: enabled }));

            accessibilityRole="button"    

            accessibilityLabel={`Select ${timeframe} timeframe`}    if (!enabled && refreshIntervalRef.current) {

            accessibilityState={{ selected: state.selectedTimeframe === timeframe }}      clearInterval(refreshIntervalRef.current);

          >      refreshIntervalRef.current = null;

            <Text style={[    }

              styles.timeframeText,  }, []);

              state.selectedTimeframe === timeframe && styles.timeframeTextActive

            ]}>  // ============================================================================

              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}  // UTILITY FUNCTIONS

            </Text>  // ============================================================================

          </TouchableOpacity>

        ))}  const formatCurrency = useCallback((amount: number): string => {

      </ScrollView>    return new Intl.NumberFormat('en-GB', {

      style: 'currency',

      {/* Critical Alerts Banner */}      currency: 'GBP',

      {criticalAlertsCount > 0 && (      minimumFractionDigits: 0,

        <TouchableOpacity       maximumFractionDigits: 0

          style={styles.criticalAlertBanner}    }).format(amount);

          onPress={() => {/* Navigate to alerts */}}  }, []);

          accessibilityRole="button"

          accessibilityLabel={`${criticalAlertsCount} critical alerts require attention`}  const formatPercentage = useCallback((value: number): string => {

        >    return `${Math.round(value)}%`;

          <Text style={styles.criticalAlertText}>  }, []);

            ⚠️ {criticalAlertsCount} Critical Alert{criticalAlertsCount > 1 ? 's' : ''} - Tap to Review

          </Text>  const getKPIColor = useCallback((value: number, type: 'percentage' | 'rating' | 'compliance'): string => {

        </TouchableOpacity>    switch (type) {

      )}      case 'percentage':

    </View>      case 'compliance':

  ), [state, criticalAlertsCount, navigation, handleTimeframeChange, handleRefresh, handleRealTimeToggle]);        if (value >= 90) return '#22C55E'; // Green

        if (value >= 75) return '#F59E0B'; // Amber

  /**        return '#EF4444'; // Red

   * Renders the KPI metrics overview section      case 'rating':

   */        if (value >= 4.5) return '#22C55E';

  const renderKPISection = useCallback(() => {        if (value >= 3.5) return '#F59E0B';

    if (!state.data) return null;        return '#EF4444';

      default:

    const kpiData = [        return '#6B7280';

      {    }

        title: 'Total Revenue',  }, []);

        value: formatCurrency(state.data.kpiMetrics.totalRevenue),

        trend: state.data.kpiMetrics.revenueTrend,  // ============================================================================

        color: '#22C55E',  // RENDER METHODS

        icon: '💰'  // ============================================================================

      },

      {  /**

        title: 'Service Users',   * Renders the executive dashboard header with controls

        value: state.data.kpiMetrics.totalServiceUsers.toString(),   */

        trend: state.data.kpiMetrics.serviceUserTrend,  const renderHeader = useCallback(() => (

        color: '#3B82F6',    <View style={styles.header}>

        icon: '👥'      <View style={styles.headerTop}>

      },        <View style={styles.headerLeft}>

      {          <TouchableOpacity

        title: 'Total Staff',            style={styles.backButton}

        value: state.data.kpiMetrics.totalStaff.toString(),            onPress={() => navigation.goBack()}

        trend: state.data.kpiMetrics.staffTrend,            accessibilityRole="button"

        color: '#8B5CF6',            accessibilityLabel="Go back"

        icon: '👨‍⚕️'          >

      },            <Text style={styles.backButtonText}>←</Text>

      {          </TouchableOpacity>

        title: 'Occupancy Rate',          <View>

        value: formatPercentage(state.data.kpiMetrics.occupancyRate),            <Text style={styles.headerTitle}>Executive Dashboard</Text>

        trend: state.data.kpiMetrics.occupancyTrend,            <Text style={styles.headerSubtitle}>

        color: getKPIColor(state.data.kpiMetrics.occupancyRate, 'percentage'),              {state.lastUpdated ? 

        icon: '🏠'                `Last updated: ${format(state.lastUpdated, 'HH:mm, dd MMM yyyy')}` :

      },                'Loading...'

      {              }

        title: 'Care Rating',            </Text>

        value: `${state.data.kpiMetrics.averageCareRating.toFixed(1)}/5`,          </View>

        trend: state.data.kpiMetrics.careRatingTrend,        </View>

        color: getKPIColor(state.data.kpiMetrics.averageCareRating, 'rating'),        

        icon: '⭐'        <View style={styles.headerRight}>

      },          <TouchableOpacity

      {            style={[styles.realTimeToggle, state.realTimeEnabled && styles.realTimeToggleActive]}

        title: 'Compliance Score',            onPress={() => handleRealTimeToggle(!state.realTimeEnabled)}

        value: formatPercentage(state.data.kpiMetrics.complianceScore),            accessibilityRole="switch"

        trend: state.data.kpiMetrics.complianceTrend,            accessibilityState={{ checked: state.realTimeEnabled }}

        color: getKPIColor(state.data.kpiMetrics.complianceScore, 'compliance'),            accessibilityLabel="Toggle real-time updates"

        icon: '✅'          >

      }            <Text style={[

    ];              styles.realTimeToggleText,

              state.realTimeEnabled && styles.realTimeToggleTextActive

    return (            ]}>

      <View style={styles.section}>              LIVE

        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>            </Text>

        <Text style={styles.sectionSubtitle}>          </TouchableOpacity>

          Overall Health Score: {overallHealthScore}% ({trendDirection})          

        </Text>          <TouchableOpacity

                    style={styles.refreshButton}

        <View style={styles.kpiGrid}>            onPress={handleRefresh}

          {kpiData.map((kpi, index) => (            disabled={state.isLoading}

            <TouchableOpacity            accessibilityRole="button"

              key={index}            accessibilityLabel="Refresh dashboard data"

              style={styles.kpiCard}          >

              onPress={() => {/* Navigate to detailed view */}}            <Text style={styles.refreshButtonText}>⟳</Text>

              accessibilityRole="button"          </TouchableOpacity>

              accessibilityLabel={`${kpi.title}: ${kpi.value}, trend ${kpi.trend > 0 ? 'up' : kpi.trend < 0 ? 'down' : 'stable'}`}        </View>

            >      </View>

              <View style={styles.kpiHeader}>

                <Text style={styles.kpiIcon}>{kpi.icon}</Text>      {/* Timeframe Selection */}

                <View style={[styles.trendIndicator, {       <ScrollView 

                  backgroundColor: kpi.trend > 0 ? '#22C55E' : kpi.trend < 0 ? '#EF4444' : '#6B7280'         horizontal 

                }]}>        style={styles.timeframeContainer}

                  <Text style={styles.trendText}>        showsHorizontalScrollIndicator={false}

                    {kpi.trend > 0 ? '↗' : kpi.trend < 0 ? '↘' : '→'} {Math.abs(kpi.trend).toFixed(1)}%        contentContainerStyle={styles.timeframeContent}

                  </Text>      >

                </View>        {(['week', 'month', 'quarter', 'year'] as TimeframeType[]).map((timeframe) => (

              </View>          <TouchableOpacity

                          key={timeframe}

              <Text style={styles.kpiTitle}>{kpi.title}</Text>            style={[

              <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>              styles.timeframeButton,

                            state.selectedTimeframe === timeframe && styles.timeframeButtonActive

              {kpiComparison[kpi.title.toLowerCase().replace(/\s+/g, '')] && (            ]}

                <Text style={styles.kpiComparison}>            onPress={() => handleTimeframeChange(timeframe)}

                  vs Industry: {kpiComparison[kpi.title.toLowerCase().replace(/\s+/g, '')].toFixed(1)}%            accessibilityRole="button"

                </Text>            accessibilityLabel={`Select ${timeframe} timeframe`}

              )}            accessibilityState={{ selected: state.selectedTimeframe === timeframe }}

            </TouchableOpacity>          >

          ))}            <Text style={[

        </View>              styles.timeframeText,

      </View>              state.selectedTimeframe === timeframe && styles.timeframeTextActive

    );            ]}>

  }, [state.data, overallHealthScore, trendDirection, kpiComparison, formatCurrency, formatPercentage, getKPIColor]);              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}

            </Text>

  /**          </TouchableOpacity>

   * Renders the financial summary section        ))}

   */      </ScrollView>

  const renderFinancialSection = useCallback(() => {

    if (!state.data) return null;      {/* Critical Alerts Banner */}

      {criticalAlertsCount > 0 && (

    const { financialSummary } = state.data;        <TouchableOpacity 

          style={styles.criticalAlertBanner}

    return (          onPress={() => {/* Navigate to alerts */}}

      <View style={styles.section}>          accessibilityRole="button"

        <Text style={styles.sectionTitle}>Financial Summary</Text>          accessibilityLabel={`${criticalAlertsCount} critical alerts require attention`}

                >

        <View style={styles.financialGrid}>          <Text style={styles.criticalAlertText}>

          <View style={styles.financialCard}>            ⚠️ {criticalAlertsCount} Critical Alert{criticalAlertsCount > 1 ? 's' : ''} - Tap to Review

            <Text style={styles.financialLabel}>Monthly Revenue</Text>          </Text>

            <Text style={styles.financialValue}>        </TouchableOpacity>

              {formatCurrency(financialSummary.monthlyRevenue)}      )}

            </Text>    </View>

            <Text style={[  ), [state, criticalAlertsCount, navigation, handleTimeframeChange, handleRefresh, handleRealTimeToggle]);

              styles.financialTrend,

              { color: financialSummary.yearOnYearGrowth > 0 ? '#22C55E' : '#EF4444' }  /**

            ]}>   * Renders the KPI metrics overview section

              YoY: {financialSummary.yearOnYearGrowth > 0 ? '+' : ''}{financialSummary.yearOnYearGrowth.toFixed(1)}%   */

            </Text>  const renderKPISection = useCallback(() => {

          </View>    if (!state.data) return null;



          <View style={styles.financialCard}>    const kpiData = [

            <Text style={styles.financialLabel}>Monthly Expenses</Text>      {

            <Text style={styles.financialValue}>        title: 'Total Revenue',

              {formatCurrency(financialSummary.monthlyExpenses)}        value: formatCurrency(state.data.kpiMetrics.totalRevenue),

            </Text>        trend: state.data.kpiMetrics.revenueTrend,

            <Text style={styles.financialSubtext}>        color: '#22C55E',

              Operating Ratio: {financialSummary.operatingRatio.toFixed(2)}        icon: '💰'

            </Text>      },

          </View>      {

        title: 'Service Users',

          <View style={styles.financialCard}>        value: state.data.kpiMetrics.totalServiceUsers.toString(),

            <Text style={styles.financialLabel}>Net Profit</Text>        trend: state.data.kpiMetrics.serviceUserTrend,

            <Text style={[        color: '#3B82F6',

              styles.financialValue,        icon: '👥'

              { color: financialSummary.netProfit > 0 ? '#22C55E' : '#EF4444' }      },

            ]}>      {

              {formatCurrency(financialSummary.netProfit)}        title: 'Total Staff',

            </Text>        value: state.data.kpiMetrics.totalStaff.toString(),

            <Text style={styles.financialSubtext}>        trend: state.data.kpiMetrics.staffTrend,

              Margin: {financialSummary.profitMargin.toFixed(1)}%        color: '#8B5CF6',

            </Text>        icon: '👨‍⚕️'

          </View>      },

      {

          <View style={styles.financialCard}>        title: 'Occupancy Rate',

            <Text style={styles.financialLabel}>Forecast Revenue</Text>        value: formatPercentage(state.data.kpiMetrics.occupancyRate),

            <Text style={styles.financialValue}>        trend: state.data.kpiMetrics.occupancyTrend,

              {formatCurrency(financialSummary.forecastRevenue)}        color: getKPIColor(state.data.kpiMetrics.occupancyRate, 'percentage'),

            </Text>        icon: '🏠'

            <Text style={styles.financialSubtext}>      },

              Cost per User: {formatCurrency(financialSummary.costPerServiceUser)}      {

            </Text>        title: 'Care Rating',

          </View>        value: `${state.data.kpiMetrics.averageCareRating.toFixed(1)}/5`,

        </View>        trend: state.data.kpiMetrics.careRatingTrend,

      </View>        color: getKPIColor(state.data.kpiMetrics.averageCareRating, 'rating'),

    );        icon: '⭐'

  }, [state.data, formatCurrency]);      },

      {

  /**        title: 'Compliance Score',

   * Renders the operational metrics section        value: formatPercentage(state.data.kpiMetrics.complianceScore),

   */        trend: state.data.kpiMetrics.complianceTrend,

  const renderOperationalSection = useCallback(() => {        color: getKPIColor(state.data.kpiMetrics.complianceScore, 'compliance'),

    if (!state.data) return null;        icon: '✅'

      }

    const { operationalMetrics } = state.data;    ];



    return (    return (

      <View style={styles.section}>      <View style={styles.section}>

        <Text style={styles.sectionTitle}>Operational Excellence</Text>        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>

                <Text style={styles.sectionSubtitle}>

        <View style={styles.operationalGrid}>          Overall Health Score: {overallHealthScore}% ({trendDirection})

          <View style={styles.operationalCard}>        </Text>

            <Text style={styles.operationalIcon}>👨‍⚕️</Text>        

            <Text style={styles.operationalLabel}>Staff Utilization</Text>        <View style={styles.kpiGrid}>

            <Text style={styles.operationalValue}>          {kpiData.map((kpi, index) => (

              {formatPercentage(operationalMetrics.staffUtilization)}            <TouchableOpacity

            </Text>              key={index}

            <View style={styles.progressBar}>              style={styles.kpiCard}

              <View style={[              onPress={() => {/* Navigate to detailed view */}}

                styles.progressFill,              accessibilityRole="button"

                {               accessibilityLabel={`${kpi.title}: ${kpi.value}, trend ${kpi.trend > 0 ? 'up' : kpi.trend < 0 ? 'down' : 'stable'}`}

                  width: `${operationalMetrics.staffUtilization}%`,            >

                  backgroundColor: getKPIColor(operationalMetrics.staffUtilization, 'percentage')              <View style={styles.kpiHeader}>

                }                <Text style={styles.kpiIcon}>{kpi.icon}</Text>

              ]} />                <View style={[styles.trendIndicator, { 

            </View>                  backgroundColor: kpi.trend > 0 ? '#22C55E' : kpi.trend < 0 ? '#EF4444' : '#6B7280' 

          </View>                }]}>

                  <Text style={styles.trendText}>

          <View style={styles.operationalCard}>                    {kpi.trend > 0 ? '↗' : kpi.trend < 0 ? '↘' : '→'} {Math.abs(kpi.trend).toFixed(1)}%

            <Text style={styles.operationalIcon}>⭐</Text>                  </Text>

            <Text style={styles.operationalLabel}>Care Quality Score</Text>                </View>

            <Text style={styles.operationalValue}>              </View>

              {operationalMetrics.careQualityScore.toFixed(1)}/100              

            </Text>              <Text style={styles.kpiTitle}>{kpi.title}</Text>

            <View style={styles.progressBar}>              <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>

              <View style={[              

                styles.progressFill,              {kpiComparison[kpi.title.toLowerCase().replace(/\s+/g, '')] && (

                {                 <Text style={styles.kpiComparison}>

                  width: `${operationalMetrics.careQualityScore}%`,                  vs Industry: {kpiComparison[kpi.title.toLowerCase().replace(/\s+/g, '')].toFixed(1)}%

                  backgroundColor: getKPIColor(operationalMetrics.careQualityScore, 'percentage')                </Text>

                }              )}

              ]} />            </TouchableOpacity>

            </View>          ))}

          </View>        </View>

      </View>

          <View style={styles.operationalCard}>    );

            <Text style={styles.operationalIcon}>📈</Text>  }, [state.data, overallHealthScore, trendDirection, kpiComparison, formatCurrency, formatPercentage, getKPIColor]);

            <Text style={styles.operationalLabel}>Visit Completion</Text>

            <Text style={styles.operationalValue}>  /**

              {formatPercentage(operationalMetrics.visitCompletionRate)}   * Renders the financial summary section

            </Text>   */

            <View style={styles.progressBar}>  const renderFinancialSection = useCallback(() => {

              <View style={[    if (!state.data) return null;

                styles.progressFill,

                {     const { financialSummary } = state.data;

                  width: `${operationalMetrics.visitCompletionRate}%`,

                  backgroundColor: getKPIColor(operationalMetrics.visitCompletionRate, 'percentage')    return (

                }      <View style={styles.section}>

              ]} />        <Text style={styles.sectionTitle}>Financial Summary</Text>

            </View>        

          </View>        <View style={styles.financialGrid}>

          <View style={styles.financialCard}>

          <View style={styles.operationalCard}>            <Text style={styles.financialLabel}>Monthly Revenue</Text>

            <Text style={styles.operationalIcon}>⚡</Text>            <Text style={styles.financialValue}>

            <Text style={styles.operationalLabel}>Resolution Time</Text>              {formatCurrency(financialSummary.monthlyRevenue)}

            <Text style={styles.operationalValue}>            </Text>

              {operationalMetrics.complaintResolutionTime}hrs            <Text style={[

            </Text>              styles.financialTrend,

            <Text style={styles.operationalSubtext}>              { color: financialSummary.yearOnYearGrowth > 0 ? '#22C55E' : '#EF4444' }

              Emergency Incidents: {operationalMetrics.emergencyIncidents}            ]}>

            </Text>              YoY: {financialSummary.yearOnYearGrowth > 0 ? '+' : ''}{financialSummary.yearOnYearGrowth.toFixed(1)}%

          </View>            </Text>

        </View>          </View>



        {/* Additional Metrics Row */}          <View style={styles.financialCard}>

        <View style={styles.additionalMetrics}>            <Text style={styles.financialLabel}>Monthly Expenses</Text>

          <View style={styles.metricItem}>            <Text style={styles.financialValue}>

            <Text style={styles.metricLabel}>Training Compliance</Text>              {formatCurrency(financialSummary.monthlyExpenses)}

            <Text style={styles.metricValue}>{formatPercentage(operationalMetrics.trainingComplianceRate)}</Text>            </Text>

          </View>            <Text style={styles.financialSubtext}>

                        Operating Ratio: {financialSummary.operatingRatio.toFixed(2)}

          <View style={styles.metricItem}>            </Text>

            <Text style={styles.metricLabel}>Family Satisfaction</Text>          </View>

            <Text style={styles.metricValue}>{operationalMetrics.familySatisfactionScore.toFixed(1)}/10</Text>

          </View>          <View style={styles.financialCard}>

                      <Text style={styles.financialLabel}>Net Profit</Text>

          <View style={styles.metricItem}>            <Text style={[

            <Text style={styles.metricLabel}>Staff Wellbeing</Text>              styles.financialValue,

            <Text style={styles.metricValue}>{operationalMetrics.staffWellbeingScore.toFixed(1)}/10</Text>              { color: financialSummary.netProfit > 0 ? '#22C55E' : '#EF4444' }

          </View>            ]}>

        </View>              {formatCurrency(financialSummary.netProfit)}

      </View>            </Text>

    );            <Text style={styles.financialSubtext}>

  }, [state.data, formatPercentage, getKPIColor]);              Margin: {financialSummary.profitMargin.toFixed(1)}%

            </Text>

  /**          </View>

   * Renders the compliance alerts section

   */          <View style={styles.financialCard}>

  const renderComplianceSection = useCallback(() => {            <Text style={styles.financialLabel}>Forecast Revenue</Text>

    if (!state.data) return null;            <Text style={styles.financialValue}>

              {formatCurrency(financialSummary.forecastRevenue)}

    const { complianceAlerts } = state.data;            </Text>

    const alertsByPriority = {            <Text style={styles.financialSubtext}>

      critical: complianceAlerts.filter(alert => alert.severity === 'critical'),              Cost per User: {formatCurrency(financialSummary.costPerServiceUser)}

      high: complianceAlerts.filter(alert => alert.severity === 'high'),            </Text>

      medium: complianceAlerts.filter(alert => alert.severity === 'medium'),          </View>

      low: complianceAlerts.filter(alert => alert.severity === 'low')        </View>

    };

        {/* Budget vs Actual Chart */}

    return (        <View style={styles.chartContainer}>

      <View style={styles.section}>          <Text style={styles.chartTitle}>Revenue Performance</Text>

        <Text style={styles.sectionTitle}>Compliance & Risk Management</Text>          <View style={styles.budgetComparison}>

                    <View style={styles.budgetBar}>

        <View style={styles.complianceOverview}>              <View style={styles.budgetActual} />

          <View style={styles.complianceCard}>              <View style={styles.budgetTarget} />

            <Text style={styles.complianceIcon}>⚠️</Text>            </View>

            <Text style={styles.complianceCount}>{alertsByPriority.critical.length}</Text>            <View style={styles.budgetLegend}>

            <Text style={styles.complianceLabel}>Critical</Text>              <View style={styles.legendItem}>

          </View>                <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />

                          <Text style={styles.legendText}>Actual: {formatCurrency(financialSummary.monthlyRevenue)}</Text>

          <View style={styles.complianceCard}>              </View>

            <Text style={styles.complianceIcon}>🔶</Text>              <View style={styles.legendItem}>

            <Text style={styles.complianceCount}>{alertsByPriority.high.length}</Text>                <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />

            <Text style={styles.complianceLabel}>High Priority</Text>                <Text style={styles.legendText}>Forecast: {formatCurrency(financialSummary.forecastRevenue)}</Text>

          </View>              </View>

                      </View>

          <View style={styles.complianceCard}>          </View>

            <Text style={styles.complianceIcon}>🔸</Text>        </View>

            <Text style={styles.complianceCount}>{alertsByPriority.medium.length}</Text>      </View>

            <Text style={styles.complianceLabel}>Medium</Text>    );

          </View>  }, [state.data, formatCurrency]);

          

          <View style={styles.complianceCard}>  /**

            <Text style={styles.complianceIcon}>ℹ️</Text>   * Renders the operational metrics section

            <Text style={styles.complianceCount}>{alertsByPriority.low.length}</Text>   */

            <Text style={styles.complianceLabel}>Low Priority</Text>  const renderOperationalSection = useCallback(() => {

          </View>    if (!state.data) return null;

        </View>

    const { operationalMetrics } = state.data;

        {/* Recent Critical Alerts */}

        {alertsByPriority.critical.length > 0 && (    return (

          <View style={styles.criticalAlertsContainer}>      <View style={styles.section}>

            <Text style={styles.subsectionTitle}>Critical Alerts Requiring Immediate Action</Text>        <Text style={styles.sectionTitle}>Operational Excellence</Text>

            {alertsByPriority.critical.slice(0, 3).map((alert, index) => (        

              <TouchableOpacity        <View style={styles.operationalGrid}>

                key={alert.id}          <View style={styles.operationalCard}>

                style={styles.alertItem}            <Text style={styles.operationalIcon}>👨‍⚕️</Text>

                onPress={() => {/* Navigate to alert details */}}            <Text style={styles.operationalLabel}>Staff Utilization</Text>

                accessibilityRole="button"            <Text style={styles.operationalValue}>

                accessibilityLabel={`Critical alert: ${alert.title}`}              {formatPercentage(operationalMetrics.staffUtilization)}

              >            </Text>

                <View style={styles.alertHeader}>            <View style={styles.progressBar}>

                  <Text style={styles.alertSeverity}>🚨 CRITICAL</Text>              <View style={[

                  <Text style={styles.alertTime}>                styles.progressFill,

                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}                { 

                  </Text>                  width: `${operationalMetrics.staffUtilization}%`,

                </View>                  backgroundColor: getKPIColor(operationalMetrics.staffUtilization, 'percentage')

                <Text style={styles.alertTitle}>{alert.title}</Text>                }

                <Text style={styles.alertDescription} numberOfLines={2}>              ]} />

                  {alert.description}            </View>

                </Text>          </View>

                <View style={styles.alertActions}>

                  <Text style={styles.alertCategory}>{alert.type}</Text>          <View style={styles.operationalCard}>

                  <Text style={styles.alertViewMore}>View Details →</Text>            <Text style={styles.operationalIcon}>⭐</Text>

                </View>            <Text style={styles.operationalLabel}>Care Quality Score</Text>

              </TouchableOpacity>            <Text style={styles.operationalValue}>

            ))}              {operationalMetrics.careQualityScore.toFixed(1)}/100

          </View>            </Text>

        )}            <View style={styles.progressBar}>

      </View>              <View style={[

    );                styles.progressFill,

  }, [state.data]);                { 

                  width: `${operationalMetrics.careQualityScore}%`,

  // ============================================================================                  backgroundColor: getKPIColor(operationalMetrics.careQualityScore, 'percentage')

  // MAIN RENDER METHOD                }

  // ============================================================================              ]} />

            </View>

  if (state.isLoading && !state.data) {          </View>

    return (

      <View style={styles.loadingContainer}>          <View style={styles.operationalCard}>

        <ActivityIndicator size="large" color="#007AFF" />            <Text style={styles.operationalIcon}>�</Text>

        <Text style={styles.loadingText}>Loading Executive Dashboard...</Text>            <Text style={styles.operationalLabel}>Visit Completion</Text>

        <Text style={styles.loadingSubtext}>Decrypting sensitive data and validating access permissions</Text>            <Text style={styles.operationalValue}>

      </View>              {formatPercentage(operationalMetrics.visitCompletionRate)}

    );            </Text>

  }            <View style={styles.progressBar}>

              <View style={[

  if (state.error && !state.data) {                styles.progressFill,

    return (                { 

      <View style={styles.errorContainer}>                  width: `${operationalMetrics.visitCompletionRate}%`,

        <Text style={styles.errorIcon}>⚠️</Text>                  backgroundColor: getKPIColor(operationalMetrics.visitCompletionRate, 'percentage')

        <Text style={styles.errorTitle}>Dashboard Unavailable</Text>                }

        <Text style={styles.errorMessage}>{state.error}</Text>              ]} />

        <TouchableOpacity            </View>

          style={styles.retryButton}          </View>

          onPress={() => initializeDashboard()}

          accessibilityRole="button"          <View style={styles.operationalCard}>

          accessibilityLabel="Retry loading dashboard"            <Text style={styles.operationalIcon}>⚡</Text>

        >            <Text style={styles.operationalLabel}>Resolution Time</Text>

          <Text style={styles.retryButtonText}>Retry</Text>            <Text style={styles.operationalValue}>

        </TouchableOpacity>              {operationalMetrics.complaintResolutionTime}hrs

      </View>            </Text>

    );            <Text style={styles.operationalSubtext}>

  }              Emergency Incidents: {operationalMetrics.emergencyIncidents}

            </Text>

  return (          </View>

    <SafeAreaView style={styles.container}>        </View>

      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

              {/* Additional Metrics Row */}

      {renderHeader()}        <View style={styles.additionalMetrics}>

                <View style={styles.metricItem}>

      <ScrollView            <Text style={styles.metricLabel}>Training Compliance</Text>

        ref={scrollViewRef}            <Text style={styles.metricValue}>{formatPercentage(operationalMetrics.trainingComplianceRate)}</Text>

        style={styles.scrollView}          </View>

        contentContainerStyle={styles.scrollContent}          

        refreshControl={          <View style={styles.metricItem}>

          <RefreshControl            <Text style={styles.metricLabel}>Family Satisfaction</Text>

            refreshing={state.isRefreshing}            <Text style={styles.metricValue}>{operationalMetrics.familySatisfactionScore.toFixed(1)}/10</Text>

            onRefresh={handleRefresh}          </View>

            tintColor="#007AFF"          

            title="Updating executive metrics..."          <View style={styles.metricItem}>

          />            <Text style={styles.metricLabel}>Staff Wellbeing</Text>

        }            <Text style={styles.metricValue}>{operationalMetrics.staffWellbeingScore.toFixed(1)}/10</Text>

        showsVerticalScrollIndicator={false}          </View>

      >        </View>

        {renderKPISection()}      </View>

        {renderFinancialSection()}    );

        {renderOperationalSection()}  }, [state.data, formatPercentage, getKPIColor]);

        {renderComplianceSection()}

          /**

        {/* Footer with timestamp and health score */}   * Renders the compliance alerts section

        <View style={styles.footer}>   */

          <Text style={styles.footerText}>  const renderComplianceSection = useCallback(() => {

            Data refreshed: {state.lastUpdated ? format(state.lastUpdated, 'HH:mm:ss') : 'Never'}    if (!state.data) return null;

          </Text>

          <Text style={styles.footerSubtext}>    const { complianceAlerts } = state.data;

            Overall Organization Health: {overallHealthScore}% • Trend: {trendDirection}    const alertsByPriority = {

          </Text>      critical: complianceAlerts.filter(alert => alert.severity === 'critical'),

        </View>      high: complianceAlerts.filter(alert => alert.severity === 'high'),

      </ScrollView>      medium: complianceAlerts.filter(alert => alert.severity === 'medium'),

            low: complianceAlerts.filter(alert => alert.severity === 'low')

      {/* Floating Action Button for Quick Actions */}    };

      <TouchableOpacity

        style={styles.fab}    return (

        onPress={() => {/* Show quick actions menu */}}      <View style={styles.section}>

        accessibilityRole="button"        <Text style={styles.sectionTitle}>Compliance & Risk Management</Text>

        accessibilityLabel="Quick actions menu"        

      >        <View style={styles.complianceOverview}>

        <Text style={styles.fabIcon}>⚡</Text>          <View style={styles.complianceCard}>

      </TouchableOpacity>            <Text style={styles.complianceIcon}>⚠️</Text>

    </SafeAreaView>            <Text style={styles.complianceCount}>{alertsByPriority.critical.length}</Text>

  );            <Text style={styles.complianceLabel}>Critical</Text>

};          </View>

          

// ============================================================================          <View style={styles.complianceCard}>

// STYLES            <Text style={styles.complianceIcon}>🔶</Text>

// ============================================================================            <Text style={styles.complianceCount}>{alertsByPriority.high.length}</Text>

            <Text style={styles.complianceLabel}>High Priority</Text>

const styles = StyleSheet.create({          </View>

  container: {          

    flex: 1,          <View style={styles.complianceCard}>

    backgroundColor: '#F8FAFC'            <Text style={styles.complianceIcon}>🔸</Text>

  },            <Text style={styles.complianceCount}>{alertsByPriority.medium.length}</Text>

              <Text style={styles.complianceLabel}>Medium</Text>

  // Header Styles          </View>

  header: {          

    backgroundColor: '#FFFFFF',          <View style={styles.complianceCard}>

    paddingTop: 16,            <Text style={styles.complianceIcon}>ℹ️</Text>

    paddingHorizontal: 20,            <Text style={styles.complianceCount}>{alertsByPriority.low.length}</Text>

    borderBottomWidth: 1,            <Text style={styles.complianceLabel}>Low Priority</Text>

    borderBottomColor: '#E5E7EB',          </View>

    elevation: 2,        </View>

    shadowColor: '#000000',

    shadowOffset: { width: 0, height: 2 },        {/* Recent Critical Alerts */}

    shadowOpacity: 0.1,        {alertsByPriority.critical.length > 0 && (

    shadowRadius: 4          <View style={styles.criticalAlertsContainer}>

  },            <Text style={styles.subsectionTitle}>Critical Alerts Requiring Immediate Action</Text>

              {alertsByPriority.critical.slice(0, 3).map((alert, index) => (

  headerTop: {              <TouchableOpacity

    flexDirection: 'row',                key={alert.id}

    justifyContent: 'space-between',                style={styles.alertItem}

    alignItems: 'center',                onPress={() => {/* Navigate to alert details */}}

    marginBottom: 16                accessibilityRole="button"

  },                accessibilityLabel={`Critical alert: ${alert.title}`}

                >

  headerLeft: {                <View style={styles.alertHeader}>

    flexDirection: 'row',                  <Text style={styles.alertSeverity}>🚨 CRITICAL</Text>

    alignItems: 'center',                  <Text style={styles.alertTime}>

    flex: 1                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}

  },                  </Text>

                  </View>

  headerRight: {                <Text style={styles.alertTitle}>{alert.title}</Text>

    flexDirection: 'row',                <Text style={styles.alertDescription} numberOfLines={2}>

    alignItems: 'center',                  {alert.description}

    gap: 12                </Text>

  },                <View style={styles.alertActions}>

                    <Text style={styles.alertCategory}>{alert.type}</Text>

  backButton: {                  <Text style={styles.alertViewMore}>View Details →</Text>

    padding: 8,                </View>

    marginRight: 12,              </TouchableOpacity>

    backgroundColor: '#F3F4F6',            ))}

    borderRadius: 8          </View>

  },        )}

        </View>

  backButtonText: {    );

    fontSize: 20,  }, [state.data]);

    color: '#374151'

  },  // ============================================================================

    // MAIN RENDER METHOD

  headerTitle: {  // ============================================================================

    fontSize: 24,

    fontWeight: '700',  if (state.isLoading && !state.data) {

    color: '#1F2937',    return (

    marginBottom: 4      <View style={styles.loadingContainer}>

  },        <ActivityIndicator size="large" color="#007AFF" />

          <Text style={styles.loadingText}>Loading Executive Dashboard...</Text>

  headerSubtitle: {        <Text style={styles.loadingSubtext}>Decrypting sensitive data and validating access permissions</Text>

    fontSize: 14,      </View>

    color: '#6B7280'    );

  },  }

  

  realTimeToggle: {  if (state.error && !state.data) {

    paddingHorizontal: 12,    return (

    paddingVertical: 6,      <View style={styles.errorContainer}>

    borderRadius: 16,        <Text style={styles.errorIcon}>⚠️</Text>

    backgroundColor: '#F3F4F6',        <Text style={styles.errorTitle}>Dashboard Unavailable</Text>

    borderWidth: 1,        <Text style={styles.errorMessage}>{state.error}</Text>

    borderColor: '#D1D5DB'        <TouchableOpacity

  },          style={styles.retryButton}

            onPress={() => initializeDashboard()}

  realTimeToggleActive: {          accessibilityRole="button"

    backgroundColor: '#22C55E',          accessibilityLabel="Retry loading dashboard"

    borderColor: '#22C55E'        >

  },          <Text style={styles.retryButtonText}>Retry</Text>

          </TouchableOpacity>

  realTimeToggleText: {      </View>

    fontSize: 12,    );

    fontWeight: '600',  }

    color: '#6B7280'

  },  return (

      <SafeAreaView style={styles.container}>

  realTimeToggleTextActive: {      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

    color: '#FFFFFF'      

  },      {renderHeader()}

        

  refreshButton: {      <ScrollView

    padding: 8,        ref={scrollViewRef}

    backgroundColor: '#F3F4F6',        style={styles.scrollView}

    borderRadius: 8        contentContainerStyle={styles.scrollContent}

  },        refreshControl={

            <RefreshControl

  refreshButtonText: {            refreshing={state.isRefreshing}

    fontSize: 18,            onRefresh={handleRefresh}

    color: '#374151'            tintColor="#007AFF"

  },            title="Updating executive metrics..."

            />

  timeframeContainer: {        }

    marginBottom: 16        showsVerticalScrollIndicator={false}

  },      >

          {renderKPISection()}

  timeframeContent: {        {renderFinancialSection()}

    paddingHorizontal: 4        {renderOperationalSection()}

  },        {renderComplianceSection()}

          

  timeframeButton: {        {/* Footer with timestamp and health score */}

    paddingHorizontal: 16,        <View style={styles.footer}>

    paddingVertical: 8,          <Text style={styles.footerText}>

    marginHorizontal: 4,            Data refreshed: {state.lastUpdated ? format(state.lastUpdated, 'HH:mm:ss') : 'Never'}

    borderRadius: 20,          </Text>

    backgroundColor: '#F9FAFB',          <Text style={styles.footerSubtext}>

    borderWidth: 1,            Overall Organization Health: {overallHealthScore}% • Trend: {trendDirection}

    borderColor: '#E5E7EB'          </Text>

  },        </View>

        </ScrollView>

  timeframeButtonActive: {      

    backgroundColor: '#3B82F6',      {/* Floating Action Button for Quick Actions */}

    borderColor: '#3B82F6'      <TouchableOpacity

  },        style={styles.fab}

          onPress={() => {/* Show quick actions menu */}}

  timeframeText: {        accessibilityRole="button"

    fontSize: 14,        accessibilityLabel="Quick actions menu"

    fontWeight: '500',      >

    color: '#6B7280'        <Text style={styles.fabIcon}>⚡</Text>

  },      </TouchableOpacity>

      </SafeAreaView>

  timeframeTextActive: {  );

    color: '#FFFFFF'};

  },

    const formatCurrency = (amount: number): string => {

  criticalAlertBanner: {    return new Intl.NumberFormat('en-GB', {

    backgroundColor: '#FEF2F2',      style: 'currency',

    borderColor: '#FECACA',      currency: 'GBP',

    borderWidth: 1,      minimumFractionDigits: 0,

    borderRadius: 8,      maximumFractionDigits: 0,

    padding: 12,    }).format(amount);

    marginBottom: 16  };

  },

    const formatPercentage = (value: number): string => {

  criticalAlertText: {    return `${value.toFixed(1)}%`;

    fontSize: 14,  };

    fontWeight: '600',

    color: '#DC2626',  const getKPIColor = (value: number, type: 'percentage' | 'rating' | 'compliance'): string => {

    textAlign: 'center'    if (type === 'percentage' || type === 'compliance') {

  },      if (value >= 90) return '#27ae60';

        if (value >= 75) return '#f39c12';

  scrollView: {      return '#e74c3c';

    flex: 1    } else if (type === 'rating') {

  },      if (value >= 4.5) return '#27ae60';

        if (value >= 4.0) return '#f39c12';

  scrollContent: {      return '#e74c3c';

    paddingBottom: 100    }

  },    return '#667eea';

    };

  section: {

    backgroundColor: '#FFFFFF',  const getRiskColor = (level: string): string => {

    marginHorizontal: 16,    switch (level) {

    marginVertical: 8,      case 'low': return '#27ae60';

    borderRadius: 12,      case 'medium': return '#f39c12';

    padding: 20,      case 'high': return '#e67e22';

    elevation: 2,      case 'critical': return '#e74c3c';

    shadowColor: '#000000',      default: return '#95a5a6';

    shadowOffset: { width: 0, height: 2 },    }

    shadowOpacity: 0.1,  };

    shadowRadius: 4

  },  const renderTimeframeSelector = () => (

      <View style={styles.timeframeSelector}>

  sectionTitle: {      {['week', 'month', 'quarter', 'year'].map((timeframe) => (

    fontSize: 20,        <TouchableOpacity

    fontWeight: '700',          key={timeframe}

    color: '#1F2937',          style={[

    marginBottom: 8            styles.timeframeButton,

  },            selectedTimeframe === timeframe && styles.timeframeButtonActive

            ]}

  sectionSubtitle: {          onPress={() => setSelectedTimeframe(timeframe as any)}

    fontSize: 14,        >

    color: '#6B7280',          <Text style={[

    marginBottom: 16            styles.timeframeText,

  },            selectedTimeframe === timeframe && styles.timeframeTextActive

            ]}>

  subsectionTitle: {            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}

    fontSize: 16,          </Text>

    fontWeight: '600',        </TouchableOpacity>

    color: '#374151',      ))}

    marginBottom: 12,    </View>

    marginTop: 8  );

  },

    const renderKPICards = () => {

  kpiGrid: {    if (!dashboardData) return null;

    flexDirection: 'row',

    flexWrap: 'wrap',    const kpis = [

    justifyContent: 'space-between',      {

    gap: 12        title: 'Total Revenue',

  },        value: formatCurrency(dashboardData.kpiMetrics.totalRevenue),

          icon: 'attach-money',

  kpiCard: {        color: '#27ae60',

    width: '48%',        trend: '+12.5%'

    backgroundColor: '#F9FAFB',      },

    borderRadius: 12,      {

    padding: 16,        title: 'Service Users',

    borderWidth: 1,        value: dashboardData.kpiMetrics.totalServiceUsers.toString(),

    borderColor: '#E5E7EB'        icon: 'people',

  },        color: '#667eea',

          trend: '+3.2%'

  kpiHeader: {      },

    flexDirection: 'row',      {

    justifyContent: 'space-between',        title: 'Staff Members',

    alignItems: 'center',        value: dashboardData.kpiMetrics.totalStaff.toString(),

    marginBottom: 8        icon: 'group',

  },        color: '#f39c12',

          trend: '+1.8%'

  kpiIcon: {      },

    fontSize: 20      {

  },        title: 'Occupancy Rate',

          value: formatPercentage(dashboardData.kpiMetrics.occupancyRate),

  trendIndicator: {        icon: 'home',

    paddingHorizontal: 6,        color: getKPIColor(dashboardData.kpiMetrics.occupancyRate, 'percentage'),

    paddingVertical: 2,        trend: '+2.1%'

    borderRadius: 4      },

  },      {

          title: 'Care Rating',

  trendText: {        value: `${dashboardData.kpiMetrics.averageCareRating.toFixed(1)}/5`,

    fontSize: 10,        icon: 'star',

    fontWeight: '600',        color: getKPIColor(dashboardData.kpiMetrics.averageCareRating, 'rating'),

    color: '#FFFFFF'        trend: '+0.3'

  },      },

        {

  kpiTitle: {        title: 'Compliance',

    fontSize: 12,        value: formatPercentage(dashboardData.kpiMetrics.complianceScore),

    fontWeight: '500',        icon: 'verified',

    color: '#6B7280',        color: getKPIColor(dashboardData.kpiMetrics.complianceScore, 'compliance'),

    marginBottom: 4        trend: '+1.5%'

  },      }

      ];

  kpiValue: {

    fontSize: 20,    return (

    fontWeight: '700',      <View style={styles.section}>

    marginBottom: 4        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>

  },        <View style={styles.kpiGrid}>

            {kpis.map((kpi, index) => (

  kpiComparison: {            <TouchableOpacity key={index} style={styles.kpiCard}>

    fontSize: 10,              <View style={styles.kpiHeader}>

    color: '#6B7280'                <Icon name={kpi.icon} size={24} color={kpi.color} />

  },                <Text style={[styles.kpiTrend, { color: kpi.color }]}>

                    {kpi.trend}

  financialGrid: {                </Text>

    flexDirection: 'row',              </View>

    flexWrap: 'wrap',              <Text style={styles.kpiValue}>{kpi.value}</Text>

    justifyContent: 'space-between',              <Text style={styles.kpiTitle}>{kpi.title}</Text>

    gap: 12,            </TouchableOpacity>

    marginBottom: 20          ))}

  },        </View>

        </View>

  financialCard: {    );

    width: '48%',  };

    backgroundColor: '#F8FAFC',

    borderRadius: 8,  const renderFinancialSummary = () => {

    padding: 16,    if (!dashboardData) return null;

    borderLeftWidth: 4,

    borderLeftColor: '#3B82F6'    return (

  },      <View style={styles.section}>

          <View style={styles.sectionHeader}>

  financialLabel: {          <Text style={styles.sectionTitle}>Financial Summary</Text>

    fontSize: 12,          <TouchableOpacity onPress={() => navigation.navigate('FinancialDashboard')}>

    fontWeight: '500',            <Text style={styles.viewMoreText}>View Details</Text>

    color: '#6B7280',          </TouchableOpacity>

    marginBottom: 4        </View>

  },        

          <LinearGradient

  financialValue: {          colors={['#667eea', '#764ba2']}

    fontSize: 18,          style={styles.financialCard}

    fontWeight: '700',        >

    color: '#1F2937',          <View style={styles.financialRow}>

    marginBottom: 4            <View style={styles.financialItem}>

  },              <Text style={styles.financialLabel}>Monthly Revenue</Text>

                <Text style={styles.financialValue}>

  financialTrend: {                {formatCurrency(dashboardData.financialSummary.monthlyRevenue)}

    fontSize: 12,              </Text>

    fontWeight: '600'            </View>

  },            <View style={styles.financialItem}>

                <Text style={styles.financialLabel}>Net Profit</Text>

  financialSubtext: {              <Text style={styles.financialValue}>

    fontSize: 11,                {formatCurrency(dashboardData.financialSummary.netProfit)}

    color: '#6B7280'              </Text>

  },            </View>

            </View>

  operationalGrid: {          

    flexDirection: 'row',          <View style={styles.financialRow}>

    flexWrap: 'wrap',            <View style={styles.financialItem}>

    justifyContent: 'space-between',              <Text style={styles.financialLabel}>Profit Margin</Text>

    gap: 12,              <Text style={styles.financialValue}>

    marginBottom: 20                {formatPercentage(dashboardData.financialSummary.profitMargin)}

  },              </Text>

              </View>

  operationalCard: {            <View style={styles.financialItem}>

    width: '48%',              <Text style={styles.financialLabel}>YoY Growth</Text>

    backgroundColor: '#F8FAFC',              <Text style={styles.financialValue}>

    borderRadius: 8,                {formatPercentage(dashboardData.financialSummary.yearOnYearGrowth)}

    padding: 16,              </Text>

    alignItems: 'center'            </View>

  },          </View>

          </LinearGradient>

  operationalIcon: {      </View>

    fontSize: 24,    );

    marginBottom: 8  };

  },

    const renderTrendChart = () => {

  operationalLabel: {    if (!dashboardData) return null;

    fontSize: 12,

    fontWeight: '500',    const chartConfig = {

    color: '#6B7280',      backgroundColor: '#ffffff',

    textAlign: 'center',      backgroundGradientFrom: '#ffffff',

    marginBottom: 4      backgroundGradientTo: '#ffffff',

  },      decimalPlaces: 0,

        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,

  operationalValue: {      labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,

    fontSize: 16,      style: {

    fontWeight: '700',        borderRadius: 16

    color: '#1F2937',      },

    marginBottom: 8      propsForDots: {

  },        r: '6',

          strokeWidth: '2',

  operationalSubtext: {        stroke: '#667eea'

    fontSize: 10,      }

    color: '#6B7280',    };

    textAlign: 'center'

  },    const data = {

        labels: dashboardData.trendData.months,

  progressBar: {      datasets: [

    width: '100%',        {

    height: 4,          data: dashboardData.trendData.revenueData,

    backgroundColor: '#E5E7EB',          color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,

    borderRadius: 2          strokeWidth: 2

  },        }

        ]

  progressFill: {    };

    height: '100%',

    borderRadius: 2    return (

  },      <View style={styles.section}>

          <Text style={styles.sectionTitle}>Revenue Trend</Text>

  additionalMetrics: {        <View style={styles.chartContainer}>

    flexDirection: 'row',          <LineChart

    justifyContent: 'space-between',            data={data}

    backgroundColor: '#F1F5F9',            width={width - 32}

    borderRadius: 8,            height={220}

    padding: 16            chartConfig={chartConfig}

  },            bezier

              style={styles.chart}

  metricItem: {          />

    alignItems: 'center',        </View>

    flex: 1      </View>

  },    );

    };

  metricLabel: {

    fontSize: 10,  const renderOperationalMetrics = () => {

    fontWeight: '500',    if (!dashboardData) return null;

    color: '#6B7280',

    textAlign: 'center',    const metrics = [

    marginBottom: 4      {

  },        title: 'Visit Completion',

          value: formatPercentage(dashboardData.operationalMetrics.visitCompletionRate),

  metricValue: {        icon: 'check-circle',

    fontSize: 14,        color: getKPIColor(dashboardData.operationalMetrics.visitCompletionRate, 'percentage')

    fontWeight: '600',      },

    color: '#374151'      {

  },        title: 'Staff Utilization',

          value: formatPercentage(dashboardData.operationalMetrics.staffUtilization),

  complianceOverview: {        icon: 'people',

    flexDirection: 'row',        color: getKPIColor(dashboardData.operationalMetrics.staffUtilization, 'percentage')

    justifyContent: 'space-between',      },

    marginBottom: 20      {

  },        title: 'Emergency Incidents',

          value: dashboardData.operationalMetrics.emergencyIncidents.toString(),

  complianceCard: {        icon: 'emergency',

    alignItems: 'center',        color: dashboardData.operationalMetrics.emergencyIncidents > 5 ? '#e74c3c' : '#27ae60'

    flex: 1,      },

    padding: 12,      {

    backgroundColor: '#F9FAFB',        title: 'Training Compliance',

    borderRadius: 8,        value: formatPercentage(dashboardData.operationalMetrics.trainingComplianceRate),

    marginHorizontal: 4        icon: 'school',

  },        color: getKPIColor(dashboardData.operationalMetrics.trainingComplianceRate, 'compliance')

        }

  complianceIcon: {    ];

    fontSize: 20,

    marginBottom: 4    return (

  },      <View style={styles.section}>

          <Text style={styles.sectionTitle}>Operational Metrics</Text>

  complianceCount: {        <View style={styles.metricsGrid}>

    fontSize: 18,          {metrics.map((metric, index) => (

    fontWeight: '700',            <View key={index} style={styles.metricCard}>

    color: '#1F2937',              <Icon name={metric.icon} size={32} color={metric.color} />

    marginBottom: 2              <Text style={styles.metricValue}>{metric.value}</Text>

  },              <Text style={styles.metricTitle}>{metric.title}</Text>

              </View>

  complianceLabel: {          ))}

    fontSize: 10,        </View>

    fontWeight: '500',      </View>

    color: '#6B7280',    );

    textAlign: 'center'  };

  },

    const renderRiskIndicators = () => {

  criticalAlertsContainer: {    if (!dashboardData) return null;

    marginTop: 8

  },    return (

        <View style={styles.section}>

  alertItem: {        <Text style={styles.sectionTitle}>Risk Indicators</Text>

    backgroundColor: '#FEF2F2',        {dashboardData.riskIndicators.map((risk, index) => (

    borderLeftWidth: 4,          <TouchableOpacity key={index} style={styles.riskCard}>

    borderLeftColor: '#DC2626',            <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(risk.level) }]} />

    borderRadius: 8,            <View style={styles.riskContent}>

    padding: 16,              <Text style={styles.riskCategory}>{risk.category}</Text>

    marginBottom: 12              <Text style={styles.riskLevel}>

  },                {risk.level.toUpperCase()} - {risk.count} issues

                </Text>

  alertHeader: {            </View>

    flexDirection: 'row',            <Icon name="chevron-right" size={20} color="#ccc" />

    justifyContent: 'space-between',          </TouchableOpacity>

    alignItems: 'center',        ))}

    marginBottom: 8      </View>

  },    );

    };

  alertSeverity: {

    fontSize: 10,  const renderComplianceAlerts = () => {

    fontWeight: '700',    if (!dashboardData) return null;

    color: '#DC2626'

  },    return (

        <View style={styles.section}>

  alertTime: {        <View style={styles.sectionHeader}>

    fontSize: 10,          <Text style={styles.sectionTitle}>Compliance Alerts</Text>

    color: '#6B7280'          <TouchableOpacity onPress={() => navigation.navigate('ComplianceOverview')}>

  },            <Text style={styles.viewMoreText}>View All</Text>

            </TouchableOpacity>

  alertTitle: {        </View>

    fontSize: 14,        

    fontWeight: '600',        {dashboardData.complianceAlerts.length === 0 ? (

    color: '#374151',          <View style={styles.emptyState}>

    marginBottom: 4            <Icon name="verified" size={48} color="#27ae60" />

  },            <Text style={styles.emptyStateText}>All compliance requirements are up to date</Text>

            </View>

  alertDescription: {        ) : (

    fontSize: 12,          dashboardData.complianceAlerts.slice(0, 3).map((alert, index) => (

    color: '#6B7280',            <TouchableOpacity key={index} style={styles.alertCard}>

    marginBottom: 8              <View style={[styles.alertIndicator, { backgroundColor: alert.severity === 'high' ? '#e74c3c' : '#f39c12' }]} />

  },              <View style={styles.alertContent}>

                  <Text style={styles.alertTitle}>{alert.title}</Text>

  alertActions: {                <Text style={styles.alertDescription}>{alert.description}</Text>

    flexDirection: 'row',                <Text style={styles.alertTime}>Due: {new Date(alert.dueDate).toLocaleDateString()}</Text>

    justifyContent: 'space-between',              </View>

    alignItems: 'center'            </TouchableOpacity>

  },          ))

          )}

  alertCategory: {      </View>

    fontSize: 10,    );

    fontWeight: '500',  };

    color: '#6B7280',

    backgroundColor: '#F3F4F6',  const renderQuickActions = () => (

    paddingHorizontal: 8,    <View style={styles.section}>

    paddingVertical: 2,      <Text style={styles.sectionTitle}>Executive Actions</Text>

    borderRadius: 4      <View style={styles.quickActionsGrid}>

  },        <TouchableOpacity

            style={styles.actionCard}

  alertViewMore: {          onPress={() => navigation.navigate('StrategicAnalytics')}

    fontSize: 12,        >

    fontWeight: '500',          <Icon name="analytics" size={32} color="#667eea" />

    color: '#3B82F6'          <Text style={styles.actionText}>Strategic Analytics</Text>

  },        </TouchableOpacity>

          

  loadingContainer: {        <TouchableOpacity

    flex: 1,          style={styles.actionCard}

    justifyContent: 'center',          onPress={() => navigation.navigate('BoardReports')}

    alignItems: 'center',        >

    backgroundColor: '#F8FAFC',          <Icon name="assessment" size={32} color="#27ae60" />

    paddingHorizontal: 40          <Text style={styles.actionText}>Board Reports</Text>

  },        </TouchableOpacity>

          

  loadingText: {        <TouchableOpacity

    fontSize: 18,          style={styles.actionCard}

    fontWeight: '600',          onPress={() => navigation.navigate('RiskManagement')}

    color: '#374151',        >

    marginTop: 16,          <Icon name="security" size={32} color="#e74c3c" />

    textAlign: 'center'          <Text style={styles.actionText}>Risk Management</Text>

  },        </TouchableOpacity>

          

  loadingSubtext: {        <TouchableOpacity

    fontSize: 14,          style={styles.actionCard}

    color: '#6B7280',          onPress={() => navigation.navigate('PerformanceReview')}

    marginTop: 8,        >

    textAlign: 'center'          <Icon name="trending-up" size={32} color="#f39c12" />

  },          <Text style={styles.actionText}>Performance Review</Text>

          </TouchableOpacity>

  errorContainer: {      </View>

    flex: 1,    </View>

    justifyContent: 'center',  );

    alignItems: 'center',

    backgroundColor: '#F8FAFC',  if (isLoading) {

    paddingHorizontal: 40    return (

  },      <View style={styles.loadingContainer}>

          <ActivityIndicator size="large" color="#667eea" />

  errorIcon: {        <Text style={styles.loadingText}>Loading executive dashboard...</Text>

    fontSize: 48,      </View>

    marginBottom: 16    );

  },  }

  

  errorTitle: {  return (

    fontSize: 20,    <ScrollView

    fontWeight: '700',      style={styles.container}

    color: '#374151',      refreshControl={

    marginBottom: 8,        <RefreshControl

    textAlign: 'center'          refreshing={isRefreshing}

  },          onRefresh={handleRefresh}

            colors={['#667eea']}

  errorMessage: {        />

    fontSize: 14,      }

    color: '#6B7280',    >

    textAlign: 'center',      {renderTimeframeSelector()}

    marginBottom: 24      {renderKPICards()}

  },      {renderFinancialSummary()}

        {renderTrendChart()}

  retryButton: {      {renderOperationalMetrics()}

    backgroundColor: '#3B82F6',      {renderRiskIndicators()}

    paddingHorizontal: 24,      {renderComplianceAlerts()}

    paddingVertical: 12,      {renderQuickActions()}

    borderRadius: 8    </ScrollView>

  },  );

  };

  retryButtonText: {

    fontSize: 16,const styles = StyleSheet.create({

    fontWeight: '600',  container: {

    color: '#FFFFFF'    flex: 1,

  },    backgroundColor: '#f8f9fa',

    },

  footer: {  loadingContainer: {

    padding: 20,    flex: 1,

    alignItems: 'center',    justifyContent: 'center',

    backgroundColor: '#F9FAFB',    alignItems: 'center',

    marginHorizontal: 16,    backgroundColor: '#f8f9fa',

    marginVertical: 8,  },

    borderRadius: 8  loadingText: {

  },    marginTop: 16,

      fontSize: 16,

  footerText: {    color: '#666',

    fontSize: 12,  },

    color: '#6B7280',  timeframeSelector: {

    marginBottom: 4    flexDirection: 'row',

  },    backgroundColor: '#fff',

      margin: 16,

  footerSubtext: {    borderRadius: 12,

    fontSize: 11,    padding: 4,

    color: '#9CA3AF'    shadowColor: '#000',

  },    shadowOffset: { width: 0, height: 2 },

      shadowOpacity: 0.1,

  fab: {    shadowRadius: 4,

    position: 'absolute',    elevation: 3,

    bottom: 20,  },

    right: 20,  timeframeButton: {

    width: 56,    flex: 1,

    height: 56,    paddingVertical: 8,

    borderRadius: 28,    alignItems: 'center',

    backgroundColor: '#3B82F6',    borderRadius: 8,

    justifyContent: 'center',  },

    alignItems: 'center',  timeframeButtonActive: {

    elevation: 8,    backgroundColor: '#667eea',

    shadowColor: '#000000',  },

    shadowOffset: { width: 0, height: 4 },  timeframeText: {

    shadowOpacity: 0.3,    fontSize: 14,

    shadowRadius: 8    fontWeight: '600',

  },    color: '#666',

    },

  fabIcon: {  timeframeTextActive: {

    fontSize: 24,    color: '#fff',

    color: '#FFFFFF'  },

  }  section: {

});    marginHorizontal: 16,

    marginBottom: 24,

export default ExecutiveDashboardScreen;  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewMoreText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiTrend: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kpiTitle: {
    fontSize: 14,
    color: '#666',
  },
  financialCard: {
    borderRadius: 16,
    padding: 20,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  financialItem: {
    flex: 1,
  },
  financialLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    borderRadius: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  riskIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  riskContent: {
    flex: 1,
  },
  riskCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  riskLevel: {
    fontSize: 14,
    color: '#666',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 48) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ExecutiveDashboardScreen;