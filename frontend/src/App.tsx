import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ResidentsPage } from './pages/ResidentsPage';
import { TestPage } from './pages/TestPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { MedicationDashboard } from './components/medication/MedicationDashboard';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import BlogLayout from './components/blog/BlogLayout';
import BlogHomePage from './pages/BlogHomePage';
import BlogPostPage from './pages/BlogPostPage';
import BlogListPage from './pages/BlogListPage';

// Dashboard Content Component
const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <DashboardLayout>
      <MedicationDashboard
        organizationId={user?.organizationId || 'org-1'}
        userId={user?.id || ''}
        userRole={user?.role || ''}
      />
    </DashboardLayout>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Blog Routes - Public */}
        <Route path="/blog" element={<BlogLayout />}>
          <Route index element={<BlogHomePage />} />
          <Route path="posts" element={<BlogListPage />} />
          <Route path="category/:slug" element={<BlogListPage />} />
          <Route path="tag/:slug" element={<BlogListPage />} />
          <Route path=":slug" element={<BlogPostPage />} />
        </Route>
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardContent />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/residents"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ResidentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/test"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TestPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default App;