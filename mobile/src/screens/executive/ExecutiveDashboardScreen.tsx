import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

import { RootState } from '../../store/store';
import { ExecutiveService } from '../../services/ExecutiveService';

const { width } = Dimensions.get('window');

interface ExecutiveDashboardData {
  kpiMetrics: {
    totalRevenue: number;
    totalServiceUsers: number;
    totalStaff: number;
    occupancyRate: number;
    averageCareRating: number;
    complianceScore: number;
  };
  financialSummary: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    netProfit: number;
    profitMargin: number;
    yearOnYearGrowth: number;
  };
  operationalMetrics: {
    visitCompletionRate: number;
    staffUtilization: number;
    emergencyIncidents: number;
    complaintResolutionTime: number;
    trainingComplianceRate: number;
  };
  complianceAlerts: any[];
  trendData: {
    revenueData: number[];
    serviceUserData: number[];
    staffingData: number[];
    months: string[];
  };
  riskIndicators: {
    level: 'low' | 'medium' | 'high' | 'critical';
    count: number;
    category: string;
  }[];
}

export const ExecutiveDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const executiveService = new ExecutiveService();

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeframe]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await executiveService.getExecutiveDashboardData(selectedTimeframe);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading executive dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getKPIColor = (value: number, type: 'percentage' | 'rating' | 'compliance'): string => {
    if (type === 'percentage' || type === 'compliance') {
      if (value >= 90) return '#27ae60';
      if (value >= 75) return '#f39c12';
      return '#e74c3c';
    } else if (type === 'rating') {
      if (value >= 4.5) return '#27ae60';
      if (value >= 4.0) return '#f39c12';
      return '#e74c3c';
    }
    return '#667eea';
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'low': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'high': return '#e67e22';
      case 'critical': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeSelector}>
      {['week', 'month', 'quarter', 'year'].map((timeframe) => (
        <TouchableOpacity
          key={timeframe}
          style={[
            styles.timeframeButton,
            selectedTimeframe === timeframe && styles.timeframeButtonActive
          ]}
          onPress={() => setSelectedTimeframe(timeframe as any)}
        >
          <Text style={[
            styles.timeframeText,
            selectedTimeframe === timeframe && styles.timeframeTextActive
          ]}>
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderKPICards = () => {
    if (!dashboardData) return null;

    const kpis = [
      {
        title: 'Total Revenue',
        value: formatCurrency(dashboardData.kpiMetrics.totalRevenue),
        icon: 'attach-money',
        color: '#27ae60',
        trend: '+12.5%'
      },
      {
        title: 'Service Users',
        value: dashboardData.kpiMetrics.totalServiceUsers.toString(),
        icon: 'people',
        color: '#667eea',
        trend: '+3.2%'
      },
      {
        title: 'Staff Members',
        value: dashboardData.kpiMetrics.totalStaff.toString(),
        icon: 'group',
        color: '#f39c12',
        trend: '+1.8%'
      },
      {
        title: 'Occupancy Rate',
        value: formatPercentage(dashboardData.kpiMetrics.occupancyRate),
        icon: 'home',
        color: getKPIColor(dashboardData.kpiMetrics.occupancyRate, 'percentage'),
        trend: '+2.1%'
      },
      {
        title: 'Care Rating',
        value: `${dashboardData.kpiMetrics.averageCareRating.toFixed(1)}/5`,
        icon: 'star',
        color: getKPIColor(dashboardData.kpiMetrics.averageCareRating, 'rating'),
        trend: '+0.3'
      },
      {
        title: 'Compliance',
        value: formatPercentage(dashboardData.kpiMetrics.complianceScore),
        icon: 'verified',
        color: getKPIColor(dashboardData.kpiMetrics.complianceScore, 'compliance'),
        trend: '+1.5%'
      }
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
        <View style={styles.kpiGrid}>
          {kpis.map((kpi, index) => (
            <TouchableOpacity key={index} style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Icon name={kpi.icon} size={24} color={kpi.color} />
                <Text style={[styles.kpiTrend, { color: kpi.color }]}>
                  {kpi.trend}
                </Text>
              </View>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiTitle}>{kpi.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFinancialSummary = () => {
    if (!dashboardData) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FinancialDashboard')}>
            <Text style={styles.viewMoreText}>View Details</Text>
          </TouchableOpacity>
        </View>
        
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.financialCard}
        >
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Monthly Revenue</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(dashboardData.financialSummary.monthlyRevenue)}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Net Profit</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(dashboardData.financialSummary.netProfit)}
              </Text>
            </View>
          </View>
          
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Profit Margin</Text>
              <Text style={styles.financialValue}>
                {formatPercentage(dashboardData.financialSummary.profitMargin)}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>YoY Growth</Text>
              <Text style={styles.financialValue}>
                {formatPercentage(dashboardData.financialSummary.yearOnYearGrowth)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderTrendChart = () => {
    if (!dashboardData) return null;

    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#667eea'
      }
    };

    const data = {
      labels: dashboardData.trendData.months,
      datasets: [
        {
          data: dashboardData.trendData.revenueData,
          color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue Trend</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={data}
            width={width - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>
    );
  };

  const renderOperationalMetrics = () => {
    if (!dashboardData) return null;

    const metrics = [
      {
        title: 'Visit Completion',
        value: formatPercentage(dashboardData.operationalMetrics.visitCompletionRate),
        icon: 'check-circle',
        color: getKPIColor(dashboardData.operationalMetrics.visitCompletionRate, 'percentage')
      },
      {
        title: 'Staff Utilization',
        value: formatPercentage(dashboardData.operationalMetrics.staffUtilization),
        icon: 'people',
        color: getKPIColor(dashboardData.operationalMetrics.staffUtilization, 'percentage')
      },
      {
        title: 'Emergency Incidents',
        value: dashboardData.operationalMetrics.emergencyIncidents.toString(),
        icon: 'emergency',
        color: dashboardData.operationalMetrics.emergencyIncidents > 5 ? '#e74c3c' : '#27ae60'
      },
      {
        title: 'Training Compliance',
        value: formatPercentage(dashboardData.operationalMetrics.trainingComplianceRate),
        icon: 'school',
        color: getKPIColor(dashboardData.operationalMetrics.trainingComplianceRate, 'compliance')
      }
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operational Metrics</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <Icon name={metric.icon} size={32} color={metric.color} />
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricTitle}>{metric.title}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRiskIndicators = () => {
    if (!dashboardData) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Indicators</Text>
        {dashboardData.riskIndicators.map((risk, index) => (
          <TouchableOpacity key={index} style={styles.riskCard}>
            <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(risk.level) }]} />
            <View style={styles.riskContent}>
              <Text style={styles.riskCategory}>{risk.category}</Text>
              <Text style={styles.riskLevel}>
                {risk.level.toUpperCase()} - {risk.count} issues
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderComplianceAlerts = () => {
    if (!dashboardData) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Compliance Alerts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ComplianceOverview')}>
            <Text style={styles.viewMoreText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {dashboardData.complianceAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="verified" size={48} color="#27ae60" />
            <Text style={styles.emptyStateText}>All compliance requirements are up to date</Text>
          </View>
        ) : (
          dashboardData.complianceAlerts.slice(0, 3).map((alert, index) => (
            <TouchableOpacity key={index} style={styles.alertCard}>
              <View style={[styles.alertIndicator, { backgroundColor: alert.severity === 'high' ? '#e74c3c' : '#f39c12' }]} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                <Text style={styles.alertTime}>Due: {new Date(alert.dueDate).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Executive Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('StrategicAnalytics')}
        >
          <Icon name="analytics" size={32} color="#667eea" />
          <Text style={styles.actionText}>Strategic Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('BoardReports')}
        >
          <Icon name="assessment" size={32} color="#27ae60" />
          <Text style={styles.actionText}>Board Reports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('RiskManagement')}
        >
          <Icon name="security" size={32} color="#e74c3c" />
          <Text style={styles.actionText}>Risk Management</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('PerformanceReview')}
        >
          <Icon name="trending-up" size={32} color="#f39c12" />
          <Text style={styles.actionText}>Performance Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading executive dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#667eea']}
        />
      }
    >
      {renderTimeframeSelector()}
      {renderKPICards()}
      {renderFinancialSummary()}
      {renderTrendChart()}
      {renderOperationalMetrics()}
      {renderRiskIndicators()}
      {renderComplianceAlerts()}
      {renderQuickActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeframeButtonActive: {
    backgroundColor: '#667eea',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
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