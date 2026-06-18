import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage          from './pages/LoginPage';
import EmployeeDashboard  from './pages/EmployeeDashboard';
import TicketListPage     from './pages/TicketListPage';
import TicketDetailPage   from './pages/TicketDetailPage';
import CreateTicketPage   from './pages/CreateTicketPage';
import AdminDashboard     from './pages/AdminDashboard';
import AdminUsersPage     from './pages/AdminUsersPage';
import AdminReportsPage   from './pages/AdminReportsPage';
import ProfilePage        from './pages/ProfilePage';

/* ── Premium spinner while checking token ── */
function FullPageSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--sail, #1B2A6B)',
      flexDirection: 'column', gap: '16px'
    }}>
      <img
        src="/sail-logo.png"
        alt="SAIL"
        style={{ width: 52, height: 52, objectFit: 'contain', animation: 'pulse 1.5s ease-in-out infinite' }}
      />
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'inherit' }}>
        Loading…
      </p>
      <style>{`@keyframes pulse { 0%,100%{opacity:.5;transform:scale(.97)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
}

/* ── Route Guards ── */
function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, initializing, isAdmin } = useAuth();
  if (initializing) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function RootRedirect() {
  const { user, initializing } = useAuth();
  if (initializing) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'EMPLOYEE') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/"      element={<RootRedirect />} />

      <Route path="/dashboard"     element={<RequireAuth><EmployeeDashboard /></RequireAuth>} />
      <Route path="/tickets"       element={<RequireAuth><TicketListPage /></RequireAuth>} />
      <Route path="/tickets/new"   element={<RequireAuth><CreateTicketPage /></RequireAuth>} />
      <Route path="/tickets/:id"   element={<RequireAuth><TicketDetailPage /></RequireAuth>} />
      <Route path="/profile"       element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><EmployeeDashboard /></RequireAuth>} />

      <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
      <Route path="/admin/tickets"   element={<RequireAdmin><TicketListPage /></RequireAdmin>} />
      <Route path="/admin/users"     element={<RequireAdmin><AdminUsersPage /></RequireAdmin>} />
      <Route path="/admin/reports"   element={<RequireAdmin><AdminReportsPage /></RequireAdmin>} />

      <Route path="*" element={
        <div className="flex items-center justify-center h-screen" style={{ background:'#F5F7FF' }}>
          <div className="text-center">
            <p className="text-6xl font-bold text-[#DDE3F0] mb-2">404</p>
            <p className="text-[#8890B5] mb-4">Page not found</p>
            <a href="/" className="btn-sail px-5 py-2 rounded-lg inline-flex">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', fontFamily: 'DM Sans, Inter, sans-serif', fontSize: '13.5px' },
            success: { iconTheme: { primary: '#1B2A6B', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
