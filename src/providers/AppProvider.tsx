import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from '@/auth/context';
import { Toaster } from "sonner";
import type { ReactNode } from "react";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <Toaster theme="system" position="top-right" />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
