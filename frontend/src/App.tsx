import { Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import Login from "./pages/Login";
import Callback from "./auth/callback";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function DashboardPlaceholder() {
  return <div style={{ padding: 24 }}>Logged in ✅ (Dashboard next)</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPlaceholder />
          </RequireAuth>
        }
      />

      {/* IMPORTANT: fallback so unknown routes don't render nothing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
