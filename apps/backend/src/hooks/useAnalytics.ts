import { useState, useEffect, useCallback, useRef } from 'react';

// Enterprise-grade analytics data interfaces
interface AnalyticsMetrics {
  complianceScore: number;
  occupancyRate: number;
  staffUtilization: number;
  residentSatisfaction: number;
  qualityRating: number;
  financialPerformance: number;
  riskScore: number;
  efficiencyIndex: number;
}

interface AnalyticsTrend {
  date: string;
  value: number;
  label: string;
  category: 'clinical' | 'operational' | 'financial' | 'compliance';
  forecast?: number;
  confidence?: number;
}

interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'clinical' | 'operational' | 'financial' | 'compliance' | 'quality';
  type: 'alert' | 'opportunity' | 'recommendation' | 'prediction';
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
  actionable: boolean;
  actions?: string[];
  priority: number;
  createdAt: string;
  expiresAt?: string;
}

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  label: string;
  unit: string;
  target: number;
  benchmark?: number;
  description: string;
  lastUpdated: string;
}

interface AnalyticsData {
  metrics: AnalyticsMetrics;
  trends: AnalyticsTrend[];
  insights: AnalyticsInsight[];
  kpiMetrics: KPIMetric[];
  lastUpdated: string;
  dataQuality: number;
  coverage: {
    clinical: number;
    operational: number;
    financial: number;
    compliance: number;
  };
}

interface UseAnalyticsOptions {
  tenantId: string;
  timeRange: '7d' | '30d' | '90d' | '1y';
  category?: 'clinical' | 'operational' | 'financial' | 'compliance' | 'all';
  refreshInterval?: number;
  enableRealTime?: boolean;
  cacheStrategy?: 'aggressive' | 'normal' | 'minimal';
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  kpiMetrics: KPIMetric[];
  predictiveInsights: AnalyticsInsight[];
  complianceScore: number;
  clinicalOutcomes: AnalyticsTrend[];
  operationalMetrics: AnalyticsTrend[];
  financialAnalytics: AnalyticsTrend[];
  residentSatisfaction: AnalyticsTrend[];
  staffPerformance: AnalyticsTrend[];
  loading: boolean;
  refreshAnalytics: () => Promise<void>;
  dataQuality: number;
  lastUpdated: string | null;
}

export const useAnalytics = (options: UseAnalyticsOptions): UseAnalyticsReturn => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheKeyRef = useRef<string>('');

  // Generate cache key based on options
  const generateCacheKey = useCallback(() => {
    return `analytics_${options.tenantId}_${options.timeRange}_${options.category || 'all'}`;
  }, [options.tenantId, options.timeRange, options.category]);

  // Enhanced fetch with enterprise features
  const fetchAnalytics = useCallback(async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const cacheKey = generateCacheKey();
    cacheKeyRef.current = cacheKey;
    
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        tenantId: options.tenantId,
        timeRange: options.timeRange,
        ...(options.category && { category: options.category }),
        timestamp: Date.now().toString()
      });

      const response = await fetch(`/api/analytics/dashboard?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'X-Tenant-ID': options.tenantId,
          'X-Cache-Strategy': options.cacheStrategy || 'normal'
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status} ${response.statusText}`);
      }

      constanalyticsData: AnalyticsData = await response.json();
      
      // Enterprise validation
      if (!analyticsData.metrics || !analyticsData.trends || !analyticsData.insights || !analyticsData.kpiMetrics) {
        throw new Error('Invalid analytics data structure received from server');
      }

      // Validate data quality
      if (analyticsData.dataQuality < 0.7) {
        console.warn('Analytics data quality below threshold:', analyticsData.dataQuality);
      }

      // Cache successful response
      if (options.cacheStrategy !== 'minimal') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: analyticsData,
            timestamp: Date.now(),
            ttl: options.cacheStrategy === 'aggressive' ? 3600000 : 1800000 // 1h or 30min
          }));
        } catch (cacheError) {
          console.warn('Failed to cache analytics data:', cacheError);
        }
      }

      setData(analyticsData);

      // Log successful fetch for monitoring
      console.info('Analytics data fetched successfully', {
        tenantId: options.tenantId,
        timeRange: options.timeRange,
        category: options.category,
        dataQuality: analyticsData.dataQuality,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.info('Analytics fetch aborted');
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(errorMessage);
      
      // Enhanced error logging
      console.error('Analytics fetch error:', {
        error: errorMessage,
        tenantId: options.tenantId,
        timeRange: options.timeRange,
        category: options.category,
        timestamp: new Date().toISOString(),
        stack: err instanceof Error ? err.stack : undefined
      });

      // Intelligent fallback to cached data
      try {
        const cachedEntry = localStorage.getItem(cacheKey);
        if (cachedEntry) {
          const parsed = JSON.parse(cachedEntry);
          const age = Date.now() - parsed.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (age < maxAge) {
            setData(parsed.data);
            setError(`Using cached data (${Math.round(age / 60000)} minutes old) - ${errorMessage}`);
            console.info('Fallback to cached analytics data', { age, cacheKey });
          } else {
            localStorage.removeItem(cacheKey);
            console.warn('Cached analytics data expired and removed', { age, cacheKey });
          }
        }
      } catch (cacheError) {
        console.error('Failed to parse cached analytics data:', cacheError);
        localStorage.removeItem(cacheKey);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [options, generateCacheKey]);

  // Auto-refresh with interval
  useEffect(() => {
    fetchAnalytics();

    if (options.enableRealTime && options.refreshInterval) {
      const interval = setInterval(fetchAnalytics, options.refreshInterval);
      return () => clearInterval(interval);
    }
    
    return undefined; // Explicit return for all code paths
  }, [fetchAnalytics, options.enableRealTime, options.refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refreshData = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  // Derived data with fallbacks
  const kpiMetrics = data?.kpiMetrics || [];
  const predictiveInsights = data?.insights?.filter(insight => insight.type === 'prediction') || [];
  const complianceScore = data?.metrics?.complianceScore || 0;
  const clinicalOutcomes = data?.trends?.filter(trend => trend.category === 'clinical') || [];
  const operationalMetrics = data?.trends?.filter(trend => trend.category === 'operational') || [];
  const financialAnalytics = data?.trends?.filter(trend => trend.category === 'financial') || [];
  const residentSatisfaction = data?.trends?.filter(trend => trend.label.toLowerCase().includes('satisfaction')) || [];
  const staffPerformance = data?.trends?.filter(trend => trend.label.toLowerCase().includes('staff')) || [];

  return {
    data,
    isLoading,
    error,
    refreshData,
    kpiMetrics,
    predictiveInsights,
    complianceScore,
    clinicalOutcomes,
    operationalMetrics,
    financialAnalytics,
    residentSatisfaction,
    staffPerformance,
    loading: isLoading,
    refreshAnalytics: refreshData,
    dataQuality: data?.dataQuality || 0,
    lastUpdated: data?.lastUpdated || null,
  };
};
