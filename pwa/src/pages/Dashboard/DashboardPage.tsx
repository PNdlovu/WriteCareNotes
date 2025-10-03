/**
 * @fileoverview Dashboard Page Component
 * @module DashboardPage
 * @version 1.0.0
 * @description Main dashboard with healthcare metrics and quick actions
 */

import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Alert,
  Button,
  Paper,
  useTheme
} from '@mui/material'
import {
  People,
  LocalPharmacy,
  Assignment,
  Warning,
  TrendingUp,
  Schedule,
  Notifications,
  Emergency,
  CheckCircle,
  Error,
  Info,
  Refresh,
  MoreVert
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { format, startOfDay, endOfDay } from 'date-fns'

import { RootState } from '@store/store'
import { healthcareServices } from '@services/healthcareServices'
import { DashboardMetrics } from '@components/Dashboard/DashboardMetrics'
import { MedicationSchedule } from '@components/Dashboard/MedicationSchedule'
import { RecentActivities } from '@components/Dashboard/RecentActivities'
import { RiskAlerts } from '@components/Dashboard/RiskAlerts'
import { ComplianceStatus } from '@components/Dashboard/ComplianceStatus'
import { QuickStats } from '@components/Dashboard/QuickStats'
import { LoadingScreen } from '@components/LoadingScreen'
import { ErrorMessage } from '@components/ErrorMessage'

interface DashboardData {
  residents: {
    total: number
    active: number
    newAdmissions: number
    discharges: number
  }
  medications: {
    totalAdministrations: number
    completed: number
    pending: number
    missed: number
    overdue: number
  }
  careNotes: {
    total: number
    urgent: number
    followUpRequired: number
  }
  incidents: {
    total: number
    open: number
    resolved: number
    critical: number
  }
  compliance: {
    score: number
    issues: number
    audits: number
  }
  riskAssessments: {
    high: number
    medium: number
    low: number
    overdue: number
  }
}

const DashboardPage: React.FC = () => {
  const theme = useTheme()
  const { user, organizationId } = useSelector((state: RootState) => state.auth)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery<DashboardData>(
    ['dashboard', organizationId, format(selectedDate, 'yyyy-MM-dd')],
    async () => {
      const [
        residentsData,
        medicationsData,
        careNotesData,
        incidentsData,
        riskAssessmentsData
      ] = await Promise.all([
        healthcareServices.getResidents({ limit: 1000 }),
        healthcareServices.getMedicationSchedule(format(selectedDate, 'yyyy-MM-dd')),
        healthcareServices.getCareNotes({ 
          dateFrom: format(startOfDay(selectedDate), 'yyyy-MM-dd'),
          dateTo: format(endOfDay(selectedDate), 'yyyy-MM-dd')
        }),
        healthcareServices.getIncidents({
          dateFrom: format(startOfDay(selectedDate), 'yyyy-MM-dd'),
          dateTo: format(endOfDay(selectedDate), 'yyyy-MM-dd')
        }),
        healthcareServices.getRiskAssessments()
      ])

      return {
        residents: {
          total: residentsData.data.total,
          active: residentsData.data.residents.filter(r => r.status === 'active').length,
          newAdmissions: residentsData.data.residents.filter(r => 
            format(new Date(r.admissionDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
          ).length,
          discharges: residentsData.data.residents.filter(r => 
            r.dischargeDate && format(new Date(r.dischargeDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
          ).length
        },
        medications: {
          totalAdministrations: medicationsData.data.length,
          completed: medicationsData.data.filter(m => m.status === 'given').length,
          pending: medicationsData.data.filter(m => m.status === 'scheduled').length,
          missed: medicationsData.data.filter(m => m.status === 'missed').length,
          overdue: medicationsData.data.filter(m => 
            m.status === 'scheduled' && new Date(m.scheduledTime) < new Date()
          ).length
        },
        careNotes: {
          total: careNotesData.data.total,
          urgent: careNotesData.data.notes.filter(n => n.priority === 'urgent').length,
          followUpRequired: careNotesData.data.notes.filter(n => n.followUpRequired).length
        },
        incidents: {
          total: incidentsData.data.length,
          open: incidentsData.data.filter(i => i.status === 'open').length,
          resolved: incidentsData.data.filter(i => i.status === 'resolved').length,
          critical: incidentsData.data.filter(i => i.severity === 'critical').length
        },
        compliance: {
          score: 94, // This would come from compliance service
          issues: 3,
          audits: 2
        },
        riskAssessments: {
          high: riskAssessmentsData.data.filter(r => r.level === 'high').length,
          medium: riskAssessmentsData.data.filter(r => r.level === 'medium').length,
          low: riskAssessmentsData.data.filter(r => r.level === 'low').length,
          overdue: riskAssessmentsData.data.filter(r => 
            new Date(r.reviewDate) < new Date()
          ).length
        }
      }
    },
    {
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
    }
  )

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <ErrorMessage 
        message="Failed to load dashboard data" 
        onRetry={() => refetch()} 
      />
    )
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {format(selectedDate, 'EEEE, MMMM do, yyyy')} • {user?.organizationName}
        </Typography>
      </Box>

      {/* Critical Alerts */}
      {(dashboardData?.medications.overdue > 0 || dashboardData?.incidents.critical > 0) && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              View Details
            </Button>
          }
        >
          <strong>Immediate Attention Required:</strong> 
          {dashboardData.medications.overdue > 0 && ` ${dashboardData.medications.overdue} overdue medications`}
          {dashboardData.medications.overdue > 0 && dashboardData.incidents.critical > 0 && ', '}
          {dashboardData.incidents.critical > 0 && ` ${dashboardData.incidents.critical} critical incidents`}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quick Stats */}
        <Grid item xs={12}>
          <QuickStats data={dashboardData} />
        </Grid>

        {/* Key Metrics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Residents</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {dashboardData?.residents.active}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {dashboardData?.residents.total} total residents
              </Typography>
              {dashboardData?.residents.newAdmissions > 0 && (
                <Chip 
                  label={`+${dashboardData.residents.newAdmissions} new`} 
                  size="small" 
                  color="success" 
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <LocalPharmacy color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Medications</Typography>
              </Box>
              <Box display="flex" alignItems="baseline" mb={1}>
                <Typography variant="h3" color="primary" sx={{ mr: 1 }}>
                  {dashboardData?.medications.completed}
                </Typography>
                <Typography variant="h5" color="textSecondary">
                  /{dashboardData?.medications.totalAdministrations}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={dashboardData ? (dashboardData.medications.completed / dashboardData.medications.totalAdministrations) * 100 : 0}
                sx={{ mb: 1 }}
              />
              {dashboardData?.medications.overdue > 0 && (
                <Chip 
                  label={`${dashboardData.medications.overdue} overdue`} 
                  size="small" 
                  color="error" 
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Care Notes</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {dashboardData?.careNotes.total}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Today's entries
              </Typography>
              {dashboardData?.careNotes.urgent > 0 && (
                <Chip 
                  label={`${dashboardData.careNotes.urgent} urgent`} 
                  size="small" 
                  color="error" 
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Warning color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Risk Alerts</Typography>
              </Box>
              <Typography variant="h3" color="error">
                {dashboardData?.riskAssessments.high}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                High risk residents
              </Typography>
              <Box mt={1}>
                <Chip 
                  label={`${dashboardData?.riskAssessments.medium} medium`} 
                  size="small" 
                  color="warning" 
                  sx={{ mr: 0.5 }}
                />
                <Chip 
                  label={`${dashboardData?.riskAssessments.low} low`} 
                  size="small" 
                  color="success" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Medication Schedule */}
        <Grid item xs={12} lg={8}>
          <MedicationSchedule date={selectedDate} />
        </Grid>

        {/* Risk Alerts */}
        <Grid item xs={12} lg={4}>
          <RiskAlerts />
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} lg={6}>
          <RecentActivities />
        </Grid>

        {/* Compliance Status */}
        <Grid item xs={12} lg={6}>
          <ComplianceStatus score={dashboardData?.compliance.score} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage