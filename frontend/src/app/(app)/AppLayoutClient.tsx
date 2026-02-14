"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { Sidebar, BottomNav, AmbientBackground } from "@/components/layout";

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Show content immediately if user exists in store (optimistic rendering)
  const hasUser = useAuthStore.getState().user !== null;
  const [isLoading, setIsLoading] = useState(!hasUser);
  const { sidebarCollapsed } = useUIStore();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = useAuthStore.getState().user;

      if (currentUser) {
        // User exists — render immediately, validate in background
        setIsLoading(false);
        const isValid = await useAuthStore.getState().validateSession();
        if (!isValid) {
          router.replace("/login");
        }
        return;
      }

      // No user in store — must validate before rendering
      const isValid = await useAuthStore.getState().validateSession();
      if (!isValid) {
        router.replace("/login");
        return;
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-[rgba(232,180,184,0.15)] border-t-[#E8B4B8] animate-[forgeSpin_0.8s_linear_infinite]" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-0 lg:p-3" style={{ height: '100dvh' }}>
      <div className="app-shell flex w-full lg:max-w-[1600px] h-full lg:rounded-[20px] overflow-hidden bg-[rgba(14,11,16,0.82)] backdrop-blur-2xl lg:border lg:border-[rgba(232,180,184,0.06)] relative forge-fade-in">
        <AmbientBackground />

        {/* Desktop sidebar — flex child, not fixed */}
        <aside
          className="hidden lg:flex flex-shrink-0 flex-col h-full overflow-y-auto overflow-x-hidden bg-[rgba(21,18,26,0.6)] border-r border-[var(--border-subtle)] transition-[width] duration-200 ease-out"
          style={{ width: sidebarCollapsed ? 72 : 256 }}
        >
          <Sidebar />
        </aside>

        {/* Main content — flex child, scrolls independently */}
        <div className="flex-1 flex flex-col h-full min-h-0 relative z-[1]">
          <main className="flex-1 overflow-y-auto min-h-0 pb-16 lg:pb-0">
            {children}
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
