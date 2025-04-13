import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Components/common/ProtectedRoute";
import { Toaster } from "react-hot-toast";

// Lazy load components for better performance
const Layout = lazy(() => import("./Components/layout/Layout"));
const LoginPage = lazy(() => import("./Pages/LoginPage"));
const RegisterPage = lazy(() => import("./Pages/RegisterPage"));
const DashboardPage = lazy(() => import("./Pages/DashboardPage"));
const DonationsPage = lazy(() => import("./Pages/DonationsPage"));
const DonationFormPage = lazy(() => import("./Pages/DonationFormPage"));
const CampaignsPage = lazy(() => import("./Pages/CampaignsPage"));
const CampaignFormPage = lazy(() => import("./Pages/CampaignFormPage"));
const UsersPage = lazy(() => import("./Pages/UsersPage"));
const UserFormPage = lazy(() => import("./Pages/UserFormPage"));
const NotFoundPage = lazy(() => import("./Pages/NotFoundPage"));
const LoadingSpinner = lazy(() => import("./Components/common/LoadingSpinner"));

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Suspense
          fallback={<LoadingSpinner size="lg" text="Loading application..." />}
        >
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Redirect to dashboard from root */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Donations */}
              <Route path="/donations" element={<DonationsPage />} />
              <Route path="/donations/new" element={<DonationFormPage />} />
              <Route
                path="/donations/edit/:id"
                element={<DonationFormPage />}
              />
              <Route path="/donations/:id" element={<DonationFormPage />} />

              {/* Campaigns */}
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/campaigns/new" element={<CampaignFormPage />} />
              <Route
                path="/campaigns/edit/:id"
                element={<CampaignFormPage />}
              />
              <Route path="/campaigns/:id" element={<CampaignFormPage />} />

              {/* Users */}
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/new" element={<UserFormPage />} />
              <Route path="/users/:id" element={<UserFormPage />} />
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
