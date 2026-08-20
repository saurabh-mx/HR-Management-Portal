import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Placeholder (We will add the Global Search here later) */}
        <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center px-8">
          <span className="text-slate-500 text-sm">Welcome to the portal.</span>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};