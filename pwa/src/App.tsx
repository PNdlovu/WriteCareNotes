/**
 * @fileoverview Main App Component
 * @module App
 * @version 1.0.0
 * @description Main application component with routing and authentication
 */

import React, { Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'

import { RootState, AppDispatch } from '@store/store'
import { checkAuthStatus } from '@store/slices/authSlice'
import { MainLayout } from '@components/Layout/MainLayout'
import { AuthLayout } from '@components/Layout/AuthLayout'
import { ProtectedRoute } from '@components/ProtectedRoute'
import { OfflineIndicator } from '@components/OfflineIndicator'

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('@pages/Auth/LoginPage'))
const DashboardPage = React.lazy(() => import('@pages/Dashboard/DashboardPage'))
const ResidentsPage = React.lazy(() => import('@pages/Residents/ResidentsPage'))
const MedicationPage = React.lazy(() => import('@pages/Medication/MedicationPage'))
const CareNotesPage = React.lazy(() => import('@pages/CareNotes/CareNotesPage'))
const CompliancePage = React.lazy(() => import('@pages/Compliance/CompliancePage'))
const StaffPage = React.lazy(() => import('@pages/Staff/StaffPage'))
const ReportsPage = React.lazy(() => import('@pages/Reports/ReportsPage'))
const SettingsPage = React.lazy(() => import('@pages/Settings/SettingsPage'))
const NotFoundPage = React.lazy(() => import('@pages/NotFound/NotFoundPage'))

// Loading component
const PageLoader = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="60vh"
  >
    <CircularProgress size={40} />
  </Box>
)

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Check authentication status on app load
    dispatch(checkAuthStatus())
  }, [dispatch])

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={50} />
      </Box>
    )
  }

  return (
    <>
      <OfflineIndicator />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Authentication Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              )
            } 
          />

          {/* Protected Application Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/residents/*" element={<ResidentsPage />} />
                    <Route path="/medication/*" element={<MedicationPage />} />
                    <Route path="/care-notes/*" element={<CareNotesPage />} />
                    <Route path="/compliance/*" element={<CompliancePage />} />
                    <Route path="/staff/*" element={<StaffPage />} />
                    <Route path="/reports/*" element={<ReportsPage />} />
                    <Route path="/settings/*" element={<SettingsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  )
}

export default App