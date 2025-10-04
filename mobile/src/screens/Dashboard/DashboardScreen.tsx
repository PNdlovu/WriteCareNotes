/**
 * @fileoverview Dashboard Screen
 * @module DashboardScreen
 * @version 1.0.0
 * @description Main dashboard screen for mobile app
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity
} from 'react-native'
import { useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { useFocusEffect } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { format } from 'date-fns'

import { RootState } from '../../store/store'
import { healthcareServices } from '../../../shared/services/healthcareServices'
import { MetricCard } from '../../components/Dashboard/MetricCard'
import { QuickActionCard } from '../../components/Dashboard/QuickActionCard'
import { AlertCard } from '../../components/Dashboard/AlertCard'
import { MedicationScheduleCard } from '../../components/Dashboard/MedicationScheduleCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { theme } from '../../styles/theme'

const { width } = Dimensions.get('window')

interface DashboardData {
  residents: {
    total: number
    active: number
    newToday: number
  }
  medications: {
    totalScheduled: number
    completed: number
    pending: number
    overdue: number
  }
  careNotes: {
    total: number
    urgent: number
  }
  alerts: {
    critical: number
    high: number
    medium: number
  }
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const DashboardScreen: React.FC = () => {
  const { user, organizationId } = useSelector((state: RootState) => state.auth)
  const [refreshing, setRefreshing] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery<DashboardData>(
    ['dashboard-mobile', organizationId, today],
    async () => {
      const [residentsRes, medicationsRes, careNotesRes, riskAssessmentsRes] = await Promise.all([
        healthcareServices.getResidents({ limit: 1000 }),
        healthcareServices.getMedicationSchedule(today),
        healthcareServices.getCareNotes({ 
          dateFrom: today,
          dateTo: today
        }),
        healthcareServices.getRiskAssessments()
      ])

      const now = new Date()
      const overdueCount = medicationsRes.data.filter(med => 
        med.status === 'scheduled' && new Date(med.scheduledTime) < now
      ).length

      return {
        residents: {
          total: residentsRes.data.total,
          active: residentsRes.data.residents.filter(r => r.status === 'active').length,
          newToday: residentsRes.data.residents.filter(r => 
            format(new Date(r.admissionDate), 'yyyy-MM-dd') === today
          ).length
        },
        medications: {
          totalScheduled: medicationsRes.data.length,
          completed: medicationsRes.data.filter(m => m.status === 'given').length,
          pending: medicationsRes.data.filter(m => m.status === 'scheduled').length,
          overdue: overdueCount
        },
        careNotes: {
          total: careNotesRes.data.total,
          urgent: careNotesRes.data.notes.filter(n => n.priority === 'urgent').length
        },
        alerts: {
          critical: riskAssessmentsRes.data.filter(r => r.level === 'critical').length,
          high: riskAssessmentsRes.data.filter(r => r.level === 'high').length,
          medium: riskAssessmentsRes.data.filter(r => r.level === 'medium').length
        }
      }
    },
    {
      refetchInterval: 5 * 60 * 1000, // 5 minutes
      staleTime: 2 * 60 * 1000 // 2 minutes
    }
  )

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refetch])

  const showCriticalAlert = () => {
    if (dashboardData?.medications.overdue > 0) {
      Alert.alert(
        'Critical Alert',
        `${dashboardData.medications.overdue} medications are overdue. Please check medication schedule immediately.`,
        [
          { text: 'Dismiss', style: 'cancel' },
          { text: 'View Schedule', onPress: () => {/* Navigate to medication screen */} }
        ]
      )
    }
  }

  if (isLoading && !dashboardData) {
    return <LoadingSpinner />
  }

  if (error && !dashboardData) {
    return (
      <ErrorMessage 
        message="Failed to load dashboard data" 
        onRetry={refetch} 
      />
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.firstName}
        </Text>
        <Text style={styles.dateText}>
          {format(new Date(), 'EEEE, MMMM do')}
        </Text>
        <Text style={styles.organizationText}>
          {user?.organizationName}
        </Text>
      </View>

      {/* Critical Alerts */}
      {dashboardData?.medications.overdue > 0 && (
        <TouchableOpacity onPress={showCriticalAlert}>
          <AlertCard
            type="critical"
            title="Immediate Attention Required"
            message={`${dashboardData.medications.overdue} medications are overdue`}
            icon="warning"
          />
        </TouchableOpacity>
      )}

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        
        <View style={styles.metricsRow}>
          <MetricCard
            title="Active Residents"
            value={dashboardData?.residents.active || 0}
            subtitle={`${dashboardData?.residents.total || 0} total`}
            icon="people"
            color={theme.colors.primary}
            style={styles.metricCard}
          />
          
          <MetricCard
            title="Medications"
            value={dashboardData?.medications.completed || 0}
            subtitle={`of ${dashboardData?.medications.totalScheduled || 0} scheduled`}
            icon="local-pharmacy"
            color={theme.colors.secondary}
            progress={
              dashboardData?.medications.totalScheduled 
                ? (dashboardData.medications.completed / dashboardData.medications.totalScheduled) * 100
                : 0
            }
            style={styles.metricCard}
          />
        </View>

        <View style={styles.metricsRow}>
          <MetricCard
            title="Care Notes"
            value={dashboardData?.careNotes.total || 0}
            subtitle={`${dashboardData?.careNotes.urgent || 0} urgent`}
            icon="assignment"
            color={theme.colors.success}
            style={styles.metricCard}
          />
          
          <MetricCard
            title="Risk Alerts"
            value={dashboardData?.alerts.critical || 0}
            subtitle={`${dashboardData?.alerts.high || 0} high risk`}
            icon="warning"
            color={theme.colors.error}
            style={styles.metricCard}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.quickActionsRow}>
          <QuickActionCard
            title="Add Care Note"
            icon="note-add"
            color={theme.colors.primary}
            onPress={() => {/* Navigate to add care note */}}
            style={styles.quickActionCard}
          />
          
          <QuickActionCard
            title="Record Vitals"
            icon="favorite"
            color={theme.colors.error}
            onPress={() => {/* Navigate to record vitals */}}
            style={styles.quickActionCard}
          />
        </View>

        <View style={styles.quickActionsRow}>
          <QuickActionCard
            title="Medication Admin"
            icon="local-pharmacy"
            color={theme.colors.secondary}
            onPress={() => {/* Navigate to medication */}}
            style={styles.quickActionCard}
          />
          
          <QuickActionCard
            title="Incident Report"
            icon="report-problem"
            color={theme.colors.warning}
            onPress={() => {/* Navigate to incident report */}}
            style={styles.quickActionCard}
          />
        </View>
      </View>

      {/* Medication Schedule */}
      <View style={styles.scheduleContainer}>
        <Text style={styles.sectionTitle}>Medication Schedule</Text>
        <MedicationScheduleCard
          pending={dashboardData?.medications.pending || 0}
          overdue={dashboardData?.medications.overdue || 0}
          completed={dashboardData?.medications.completed || 0}
          onPress={() => {/* Navigate to medication schedule */}}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 2
  },
  organizationText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500'
  },
  metricsContainer: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 4
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  quickActionCard: {
    flex: 1,
    marginHorizontal: 4
  },
  scheduleContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40
  }
})