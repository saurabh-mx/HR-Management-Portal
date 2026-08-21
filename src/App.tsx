import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import MainLayout from "@/components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import EmployeeDirectory from "./pages/EmployeeDirectory";
import CommunicationsFeed from "./pages/CommunicationsFeed";
import  MeetingsDashboard  from "./pages/MeetingsDashboard";
import LOAManagement from "./pages/LOAManagement";
import StrikeManagement from "./pages/StrikeManagement";
import RankManagement from "./pages/RankManagement";
import HRRequestsDashboard from "./pages/HRRequestsDashboard";
import Landing from "./pages/Landing";
import AdminPanel from "./pages/AdminPanel";
import DocumentsDashboard from "./pages/DocumentsDashboard";

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Establishing Secure Connection...</div>;
  }

  if (!session) {
    return <Landing />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/directory" element={<EmployeeDirectory />} />
          <Route path="/communications" element={<CommunicationsFeed />} />
          <Route path="/meetings" element={<MeetingsDashboard />} />
          <Route path="/loa" element={<LOAManagement />} />
          <Route path="/strikes" element={<StrikeManagement />} />
          <Route path="/promotions" element={<RankManagement />} />
          <Route path="/hr-requests" element={<HRRequestsDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/documents" element={<DocumentsDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <Toaster theme="system" position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;