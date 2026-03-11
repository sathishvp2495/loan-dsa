import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadDetailPage } from "./pages/LeadDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { PublicLeadPage } from "./pages/PublicLeadPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/apply" replace />} />
        <Route path="/apply" element={<PublicLeadPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leads/:leadId"
          element={
            <ProtectedRoute>
              <LeadDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AppShell>
  );
}
