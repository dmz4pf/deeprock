"use client";

import { type ReactNode } from "react";
import { useUIStore } from "@/stores/uiStore";
import { Menu } from "lucide-react";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  maxWidth?: "default" | "narrow" | "full";
}

const MAX_WIDTH_CLASSES = {
  default: "max-w-[var(--page-max-width)]",
  narrow: "max-w-[var(--page-max-width-narrow)]",
  full: "max-w-none",
} as const;

export function PageLayout({ children, title, subtitle, actions, maxWidth = "default" }: PageLayoutProps) {
  const { setSidebarOpen } = useUIStore();

  return (
    <div className={`${MAX_WIDTH_CLASSES[maxWidth]} mx-auto px-4 sm:px-6 w-full`}>
      {/* Page header */}
      <header className="flex justify-between items-center pt-6 pb-6 border-b border-[var(--border-subtle)] mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center p-1.5 bg-transparent border-none text-[#B8A99A] cursor-pointer shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#F0EBE0] m-0 font-serif leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[#B8A99A] mt-1 mb-0 font-sans">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </header>

      {/* Page content */}
      <div className="flex flex-col gap-[var(--page-gap)]">
        {children}
      </div>
    </div>
  );
}
