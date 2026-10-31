import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './routes/ProtectedRoute';

// Public Directory & Report Pages
import HomePage from './pages/HomePage';
import LostItemsPage from './pages/LostItemsPage';
import LostItemDetailPage from './pages/LostItemDetailPage';
import ReportLostPage from './pages/ReportLostPage';
import FoundItemsPage from './pages/FoundItemsPage';
import FoundItemDetailPage from './pages/FoundItemDetailPage';
import ReportFoundPage from './pages/ReportFoundPage';
import SubmitClaimPage from './pages/SubmitClaimPage';
import NotFoundPage from './pages/NotFoundPage';

// Student Authentication Pages
import StudentLoginPage from './pages/StudentLoginPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentForgotPasswordPage from './pages/StudentForgotPasswordPage';
import StudentResetPasswordPage from './pages/StudentResetPasswordPage';

// Staff Authentication & Protected Management Pages
import StaffLoginPage from './pages/StaffLoginPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import StaffClaimsPage from './pages/StaffClaimsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Home */}
        <Route path="/" element={<HomePage />} />

        {/* Student Authentication */}
        <Route path="/login" element={<StudentLoginPage />} />
        <Route path="/register" element={<StudentRegisterPage />} />
        <Route path="/forgot-password" element={<StudentForgotPasswordPage />} />
        <Route path="/reset-password" element={<StudentResetPasswordPage />} />
        <Route path="/profile" element={<StudentProfilePage />} />

        {/* Lost Items Directory & Reporting */}
        <Route path="/lost" element={<LostItemsPage />} />
        <Route path="/lost/new" element={<ReportLostPage />} />
        <Route path="/lost/:id" element={<LostItemDetailPage />} />

        {/* Found Items Directory & Registration */}
        <Route path="/found" element={<FoundItemsPage />} />
        <Route path="/found/new" element={<ReportFoundPage />} />
        <Route path="/found/:id" element={<FoundItemDetailPage />} />

        {/* Ownership Claim Submission */}
        <Route path="/found/:id/claim" element={<SubmitClaimPage />} />
        <Route path="/claims/new" element={<SubmitClaimPage />} />

        {/* Staff Authentication */}
        <Route path="/staff/login" element={<StaffLoginPage />} />

        {/* Protected Staff Administration */}
        <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/claims"
          element={
            <ProtectedRoute>
              <StaffClaimsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
