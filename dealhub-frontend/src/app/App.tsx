import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import DashboardPage from "./components/pages/DashboardPage";
import AgreementDetailPage from "./components/pages/AgreementDetailPage";
import { TopBar } from "./components/TopBar";
import { LoginPage } from "./components/LoginPage";
import { ExtractPage } from "./components/pages/ExtractPage";
import AdminUsersPage from "./components/pages/AdminUsersPage";
import { LenderInboxPage } from "./components/pages/LenderInboxPage"; // ✅ NEW

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user && <TopBar />}

      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "AGENT", "LENDER"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/extract"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "AGENT"]}>
              <ExtractPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW: Lender Inbox */}
        <Route
          path="/lender/inbox"
          element={
            <ProtectedRoute allowedRoles={["LENDER"]}>
              <LenderInboxPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW: version-based route (Dashboard View/Edit uses this) */}
        <Route
          path="/agreements/versions/:versionId"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "AGENT", "LENDER"]}>
              <AgreementDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ Keep old agreement-based route for backward compatibility */}
        <Route
          path="/agreements/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "AGENT", "LENDER"]}>
              <AgreementDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ Admin users (MUST be before wildcard) */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster richColors />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#0B1F3B] via-[#102A52] to-[#1E40AF]">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}
