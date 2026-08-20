import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import EmployeeDirectory from "./pages/EmployeeDirectory";
import  CommunicationsFeed  from "./pages/CommunicationsFeed";
import { MeetingsDashboard } from "./pages/MeetingsDashboard";
import  LOAManagement  from "./pages/LOAManagement";
import  StrikeManagement  from "./pages/StrikeManagement";
import  RankManagement  from "./pages/RankManagement";
import  HRRequestsDashboard  from "./pages/HRRequestsDashboard";

function App() {
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