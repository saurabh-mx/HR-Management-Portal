import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-200 font-sans">
          {/* Background Ambient Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-black to-black pointer-events-none"></div>
          
          <div className="relative z-10 max-w-lg w-full bg-slate-900/80 backdrop-blur-xl border border-rose-900/50 rounded-2xl shadow-[0_0_50px_rgba(225,29,72,0.15)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600"></div>
            
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                <AlertTriangle className="w-10 h-10 text-rose-500 drop-shadow-md" />
              </div>
              
              <h1 className="text-2xl font-bold tracking-widest uppercase text-white mb-2">System Failure</h1>
              <p className="text-slate-400 font-light text-sm mb-6 max-w-sm">
                A critical error has occurred in the application matrix. Our technicians have been notified.
              </p>
              
              <div className="w-full bg-black/50 border border-slate-800 rounded-lg p-4 mb-8 text-left overflow-hidden">
                <div className="text-[10px] uppercase tracking-widest font-bold text-rose-500/70 mb-2">Error Details</div>
                <p className="text-xs font-mono text-slate-300 break-words line-clamp-3">
                  {this.state.error?.message || "Unknown unexpected error"}
                </p>
              </div>
              
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => window.location.href = "/"}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 transition-all text-sm font-bold uppercase tracking-wider text-slate-300 group"
                >
                  <Home className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Dashboard
                </button>
                <button 
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 transition-all text-sm font-bold uppercase tracking-wider text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.1)] group"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  Reboot System
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
