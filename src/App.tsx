import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import './services/i18n';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { configureLeaflet } from './config/leafletConfig';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Pages with lazy loading
const Home = React.lazy(() => import('./pages/Home'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Events = React.lazy(() => import('./pages/Events'));
const EventDetail = React.lazy(() => import('./pages/EventDetail'));
const EventCreate = React.lazy(() => import('./pages/EventCreate'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const PastEvents = React.lazy(() => import('./pages/PastEvents'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Admin = React.lazy(() => import('./pages/Admin'));
const UsersManagement = React.lazy(() => import('./pages/UsersManagement'));
const AdminUserApprovals = React.lazy(() => import('./pages/AdminUserApprovals'));
const Organization = React.lazy(() => import('./pages/Organization'));
const CreateOrganization = React.lazy(() => import('./pages/CreateOrganization'));
const EditEvent = React.lazy(() => import('./pages/EventEdit'));
const MapExplorer = React.lazy(() => import('./pages/MapExplorer'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
  </div>
);

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  return user ? <Navigate to="/events" replace /> : <Navigate to="/auth" replace />;
};

function App() {
  // Configure Leaflet once on mount
  useEffect(() => {
    configureLeaflet();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
            <Navbar />
            <main className="min-h-screen">
              <React.Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  <Route path="/events" element={
                    <ProtectedRoute>
                      <Events />
                    </ProtectedRoute>
                  } />
                  <Route path="/events/:id" element={
                    <ProtectedRoute>
                      <EventDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/events/create" element={
                    <ProtectedRoute>
                      <EventCreate />
                    </ProtectedRoute>
                  } />
                  <Route path="/events/:id/edit" element={
                    <ProtectedRoute>
                      <EditEvent />
                    </ProtectedRoute>
                  } />
                  <Route path="/calendar" element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  } />
                  <Route path="/past-events" element={
                    <ProtectedRoute>
                      <PastEvents />
                    </ProtectedRoute>
                  } />
                  <Route path="/map" element={
                    <ProtectedRoute>
                      <MapExplorer />
                    </ProtectedRoute>
                  } />
                  <Route path="/organizations" element={
                    <ProtectedRoute>
                      <Organization />
                    </ProtectedRoute>
                  } />
                  <Route path="/organizations/:id" element={
                    <ProtectedRoute>
                      <Organization />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/organizations/create" element={
                    <ProtectedRoute>
                      <CreateOrganization />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="/users" element={
                    <ProtectedRoute requiredRole="admin">
                       <UsersManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/user-approvals" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminUserApprovals />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Page not found</p>
                        <a href="/" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium">
                          Go Home
                        </a>
                      </div>
                    </div>
                  } />
                </Routes>
              </React.Suspense>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;