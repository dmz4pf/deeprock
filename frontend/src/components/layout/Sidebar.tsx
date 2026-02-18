"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Layers,
  FileText,
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { ASSET_CLASSES } from "@/config/pools.config";

/* ── Types ── */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string; dotColor?: string }[];
}

/* ── Navigation config ── */

const mainItems: NavItem[] = [
  { href: "/portfolio", label: "Portfolio", icon: LayoutDashboard },
  {
    href: "/pools",
    label: "Pools",
    icon: Layers,
    children: ASSET_CLASSES.map((ac) => ({
      href: ac.href,
      label: ac.label,
      dotColor: ac.glowRgb,
    })),
  },
];

const toolItems: NavItem[] = [
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

/* ── Sidebar Component ── */

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } =
    useUIStore();
  const { user, logout } = useAuthStore();
  const [poolsExpanded, setPoolsExpanded] = useState(true);

  const collapsed = sidebarCollapsed;

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const isActive = (href: string): boolean =>
    pathname === href || pathname.startsWith(`${href}/`);

  const isPoolsActive = (): boolean =>
    pathname === "/pools" ||
    pathname.startsWith("/pools/") ||
    ASSET_CLASSES.some(
      (ac) => pathname === ac.href || pathname.startsWith(`${ac.href}/`)
    );

  const displayName = user?.displayName || user?.email || "User";
  const walletShort = user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : null;
  const initial = displayName.charAt(0).toUpperCase();

  /* ── Nav Item (standard) — Frosted Minimal style ── */
  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`
          sidebar-nav-item flex items-center gap-3 rounded-lg no-underline relative
          ${collapsed ? "justify-center h-10 px-0" : "h-11 px-4"}
        `}
        style={{
          color: active ? "#F0EBE0" : "#B8A99A",
          background: active ? "rgba(232,180,184,0.06)" : "transparent",
          backdropFilter: active ? "blur(12px)" : undefined,
          border: active
            ? "1px solid rgba(232,180,184,0.12)"
            : "1px solid transparent",
          fontWeight: active ? 600 : 400,
          boxShadow: active
            ? "inset 0 0 12px rgba(232,180,184,0.06), 0 0 16px rgba(232,180,184,0.04)"
            : "none",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Vertical bar indicator */}
        <span
          className="sidebar-nav-bar absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-full"
          style={{
            background: active ? "#E8B4B8" : "currentColor",
            opacity: active ? 1 : 0,
            boxShadow: active ? "0 0 10px rgba(232,180,184,0.5), 0 0 4px rgba(232,180,184,0.3)" : "none",
            transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        <Icon
          size={20}
          strokeWidth={active ? 2.2 : 1.8}
          className={`shrink-0 transition-colors duration-200 ${active ? "text-[#E8B4B8]" : "text-[#5A5347]"}`}
        />
        {!collapsed && <span className="text-sm">{item.label}</span>}
      </Link>
    );
  };

  /* ── Nav Item (Pools with expandable children) ── */
  const renderPoolsItem = (item: NavItem) => {
    const active = isPoolsActive();
    const Icon = item.icon;
    const childCount = item.children?.length ?? 0;
    return (
      <div key={item.href}>
        <div className="flex items-center">
          <Link
            href={item.href}
            className={`
              sidebar-nav-item flex items-center gap-3 rounded-lg no-underline flex-1 relative
              ${collapsed ? "justify-center h-10 px-0" : "h-11 px-4"}
            `}
            style={{
              color: active ? "#F0EBE0" : "#B8A99A",
              background: active ? "rgba(232,180,184,0.06)" : "transparent",
              backdropFilter: active ? "blur(12px)" : undefined,
              border: active
                ? "1px solid rgba(232,180,184,0.12)"
                : "1px solid transparent",
              fontWeight: active ? 600 : 400,
              boxShadow: active
                ? "inset 0 0 12px rgba(232,180,184,0.06), 0 0 16px rgba(232,180,184,0.04)"
                : "none",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* Vertical bar indicator */}
            <span
              className="sidebar-nav-bar absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-full"
              style={{
                background: active ? "#E8B4B8" : "currentColor",
                opacity: active ? 1 : 0,
                boxShadow: active ? "0 0 10px rgba(232,180,184,0.5), 0 0 4px rgba(232,180,184,0.3)" : "none",
                transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
            <Icon
              size={20}
              strokeWidth={active ? 2.2 : 1.8}
              className={`shrink-0 transition-colors duration-200 ${active ? "text-[#E8B4B8]" : "text-[#5A5347]"}`}
            />
            {!collapsed && (
              <span className="text-sm flex-1 flex items-center justify-between">
                <span>{item.label}</span>
                {childCount > 0 && (
                  <span className="text-[11px] text-[#706860] font-normal">
                    ({childCount})
                  </span>
                )}
              </span>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setPoolsExpanded(!poolsExpanded)}
              aria-label={poolsExpanded ? "Collapse pools" : "Expand pools"}
              aria-expanded={poolsExpanded}
              className="bg-transparent border-none text-[#5A5347] cursor-pointer p-1.5 flex items-center justify-center hover:text-[#B8A99A] hover:bg-[rgba(232,180,184,0.04)] rounded-md transition-all duration-200 mr-1"
            >
              <ChevronRight
                size={14}
                className="transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ transform: poolsExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </button>
          )}
        </div>

        {/* Sub-items — CSS grid 0fr→1fr for smooth height */}
        {!collapsed && (
          <div
            className="grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              gridTemplateRows: poolsExpanded ? "1fr" : "0fr",
              opacity: poolsExpanded ? 1 : 0,
            }}
          >
            <div className="overflow-hidden">
              <div className="ml-7 pt-1.5 pb-1 relative">
                {/* Vertical connection line */}
                <div
                  className="absolute left-[11px] top-1 bottom-1 w-px"
                  style={{
                    background: "linear-gradient(180deg, rgba(90,83,71,0.3) 0%, rgba(90,83,71,0.05) 100%)",
                  }}
                />

                {item.children?.map((child) => {
                  const childActive = isActive(child.href);
                  const rgb = child.dotColor || "232,180,184";
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`
                        sidebar-sub-item flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] no-underline mb-0.5
                        relative
                        ${childActive ? "font-medium" : ""}
                      `}
                      style={{
                        background: childActive
                          ? `rgba(${rgb}, 0.06)`
                          : "transparent",
                        backdropFilter: childActive ? "blur(12px)" : undefined,
                        border: childActive
                          ? `1px solid rgba(${rgb}, 0.10)`
                          : "1px solid transparent",
                        color: childActive
                          ? `rgb(${rgb})`
                          : "#706860",
                      }}
                      onMouseEnter={(e) => {
                        if (!childActive) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                          e.currentTarget.style.backdropFilter = "blur(8px)";
                          e.currentTarget.style.borderColor = `rgba(${rgb}, 0.08)`;
                          e.currentTarget.style.color = "#B8A99A";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!childActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.backdropFilter = "none";
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.color = "#706860";
                        }
                      }}
                    >
                      {/* Vertical bar indicator — D style */}
                      <span
                        className="sidebar-sub-bar shrink-0 rounded-sm"
                        style={{
                          width: 3,
                          height: 14,
                          background: childActive ? `rgb(${rgb})` : "currentColor",
                          opacity: childActive ? 1 : 0.25,
                          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                          boxShadow: childActive
                            ? `0 0 8px rgba(${rgb}, 0.5)`
                            : "none",
                        }}
                      />
                      <span>{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── Sidebar inner content ── */
  const sidebarInner = (
    <div className="flex flex-col h-full">
      {/* Logo + brand header */}
      <div className={`flex items-center h-16 border-b border-[var(--border-subtle)] shrink-0 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "gap-0" : ""}`}>
          <img src="/icon-192.png" alt="Deeprock" className="w-10 h-10 rounded-xl shrink-0" />
          {!collapsed && (
            <div>
              <div className="text-[20px] font-bold text-[#F0EBE0] font-serif tracking-tight leading-tight">
                Deeprock
              </div>
              <div className="text-[10px] font-medium text-[#5A5347] tracking-[0.12em] uppercase mt-0.5">
                INSTITUTIONAL GRADE
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
        {mainItems.map((item) =>
          item.children ? renderPoolsItem(item) : renderNavItem(item)
        )}

        {/* Divider */}
        <div className="h-px mx-3 my-2 bg-[var(--border-subtle)]" />

        {toolItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Bottom: user info + chain + logout */}
      <div className={`border-t border-[var(--border-subtle)] ${collapsed ? "px-2 py-3" : "px-4 py-3"}`}>
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`
            sidebar-nav-item flex items-center h-9 rounded-lg
            bg-transparent border-none cursor-pointer mb-2
            text-[#5A5347] hover:text-[#B8A99A]
            ${collapsed ? "justify-center w-10 mx-auto" : "gap-2.5 w-full px-3"}
          `}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && (
            <span className="text-[12px] font-medium font-sans">Collapse</span>
          )}
        </button>

        {!collapsed && (
          <>
            {/* User info */}
            {user && (
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-[rgba(232,180,184,0.10)] flex items-center justify-center text-[13px] font-bold text-[#E8B4B8] font-serif">
                    {initial}
                  </div>
                  <div className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-[#6FCF97] border-2 border-[#14120E]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[#F0EBE0] truncate">
                    {displayName}
                  </div>
                  {walletShort && (
                    <div className="text-[11px] text-[#5A5347] font-mono mt-px">
                      {walletShort}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chain label */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl border border-[rgba(111,207,151,0.15)] mb-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6FCF97]" />
              <span className="text-[10px] font-semibold text-[#6FCF97] tracking-[0.04em]">
                Avalanche
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="sidebar-nav-item flex items-center gap-1.5 bg-transparent border-none text-[#5A5347] text-xs cursor-pointer py-1 px-0 w-full hover:text-[#EB5757] transition-colors duration-150"
            >
              <LogOut size={14} className="shrink-0" />
              <span>Logout</span>
            </button>
          </>
        )}

        {/* Collapsed: user avatar only */}
        {collapsed && user && (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[rgba(232,180,184,0.10)] flex items-center justify-center text-[13px] font-bold text-[#E8B4B8] font-serif">
                {initial}
              </div>
              <div className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-[#6FCF97] border-2 border-[var(--elevation-1)]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop: render inner content directly (parent <aside> in AppLayoutClient) */}
      <div className="hidden lg:flex flex-col h-full">
        {sidebarInner}
      </div>

      {/* Mobile sidebar (overlay — stays fixed) */}
      <aside
        className={`
          lg:hidden fixed left-0 top-0 h-full z-50 w-[256px] flex flex-col
          bg-[rgba(21,18,26,0.85)] backdrop-blur-2xl border-r border-[var(--border-subtle)]
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarInner}
      </aside>
    </>
  );
}
