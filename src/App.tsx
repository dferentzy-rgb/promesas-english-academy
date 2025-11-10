import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AvailableChildren from './pages/AvailableChildren';
import SponsorDashboard from './pages/SponsorDashboard';
import ChildDetail from './pages/ChildDetail';
import SponsorMessages from './pages/SponsorMessages';
import AdminDashboard from './pages/AdminDashboard';
import AdminChildren from './pages/AdminChildren';
import AdminChildForm from './pages/AdminChildForm';
import AdminMessages from './pages/AdminMessages';
import AdminProgress from './pages/AdminProgress';
import AdminSponsorships from './pages/AdminSponsorships';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/children" element={<AvailableChildren />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SponsorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/child/:id"
        element={
          <ProtectedRoute>
            <ChildDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <SponsorMessages />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/children"
        element={
          <ProtectedRoute requireAdmin>
            <AdminChildren />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/children/new"
        element={
          <ProtectedRoute requireAdmin>
            <AdminChildForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/children/:id"
        element={
          <ProtectedRoute requireAdmin>
            <AdminChildForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute requireAdmin>
            <AdminMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/progress/:childId"
        element={
          <ProtectedRoute requireAdmin>
            <AdminProgress />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sponsorships"
        element={
          <ProtectedRoute requireAdmin>
            <AdminSponsorships />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
