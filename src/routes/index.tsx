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
import IdentityCard from "@/features/Identity";
import BodycamOverlay from "@/features/Bodycam";
import ForcePasswordChange from "@/auth/components/ForcePasswordChange";
import PendingApprovalScreen from "@/auth/components/PendingApprovalScreen";

export function AppRoutes() {
  const { session, loading, logout, officerAuthFlow, officerFlowData, setOfficerAuthFlow } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Establishing Secure Connection...</div>;
  }

  // ─── Officer Auth Flow Intercepts ───────────────────────────────────
  // These take priority over normal routing when the officer is mid-auth-flow

  if (officerAuthFlow === 'force_password_change' && officerFlowData.officerId) {
    return (
      <ForcePasswordChange
        officerId={officerFlowData.officerId}
        onSuccess={() => {
          setOfficerAuthFlow('pending_approval');
        }}
        onCancel={async () => {
          setOfficerAuthFlow('none');
          await logout();
        }}
      />
    );
  }

  if (officerAuthFlow === 'pending_approval') {
    return (
      <PendingApprovalScreen
        officerName={officerFlowData.officerId}
        approvalRequestId={officerFlowData.approvalId}
        onLogout={async () => {
          setOfficerAuthFlow('none');
          await logout();
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route — no auth required */}
        <Route path="/identity/:badge" element={<IdentityCard />} />
        <Route path="/bodycam/:badge" element={<BodycamOverlay />} />

        {/* Protected routes — require session */}
        {!session ? (
          <Route path="*" element={<Landing />} />
        ) : (
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
