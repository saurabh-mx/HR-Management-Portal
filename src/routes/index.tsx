import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from '@/auth/hooks/useAuth';
import MainLayout from "@/components/layout/MainLayout";

import { Dashboard } from "@/features/Dashboard";
import EmployeeDirectory from "@/features/Directory";
import CommunicationsFeed from "@/features/Communications";
import MeetingsDashboard from "@/features/Meetings";
import LOAManagement from "@/features/LOAManagement";
import StrikeManagement from "@/features/StrikeManagement";
import SOIApplications from "@/features/SOIApplications";
import HRRequestsDashboard from "@/features/HRRequests";
import Landing from "@/features/Landing";
import AdminPanel from "@/features/AdminPanel";
import DocumentsDashboard from "@/features/Documents";
import Profile from "@/features/Profile";
import AuditLogs from "@/features/AdminPanel/AuditLogs";
import SubDepartmentFeed from "@/features/SubDepartment";

export function AppRoutes() {
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
          <Route path="/soi-applications" element={<SOIApplications />} />
          <Route path="/hr-requests" element={<HRRequestsDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/documents" element={<DocumentsDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/sub-department" element={<SubDepartmentFeed />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
