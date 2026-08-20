import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import MainLayout from "@/components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import EmployeeDirectory from "./pages/EmployeeDirectory";
import CommunicationsFeed from "./pages/CommunicationsFeed";
import { MeetingsDashboard } from "./pages/MeetingsDashboard";
import LOAManagement from "./pages/LOAManagement";
import StrikeManagement from "./pages/StrikeManagement";
import RankManagement from "./pages/RankManagement";
import HRRequestsDashboard from "./pages/HRRequestsDashboard";
import Login from "./pages/Login";

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Establishing Secure Connection...</div>;
  }

  // If no session exists, force them to the login screen
  if (!session) {
    return <Login />;
  }

  // If logged in, show the full portal
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;