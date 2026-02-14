"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { LayoutDashboard, Layers, FileText, Settings, type LucideIcon } from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/portfolio", label: "Portfolio", icon: LayoutDashboard },
  { href: "/pools", label: "Pools", icon: Layers },
  { href: "/documents", label: "Docs", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const isActive = (href: string): boolean =>
    pathname === href || pathname.startsWith(`${href}/`);

  const activeIndex = navItems.findIndex((item) => isActive(item.href));

  /* Sliding indicator position */
  useEffect(() => {
    if (!navRef.current || activeIndex < 0) return;
    const links = navRef.current.querySelectorAll<HTMLAnchorElement>("a");
    const activeLink = links[activeIndex];
    if (!activeLink) return;
    const navRect = navRef.current.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    setIndicatorStyle({
      left: linkRect.left - navRect.left + linkRect.width / 2 - 12,
      width: 24,
    });
  }, [activeIndex]);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(232,180,184,0.08)] pb-[max(6px,env(safe-area-inset-bottom))]"
      style={{
        background: "rgba(14,11,16,0.85)",
        backdropFilter: "blur(24px) saturate(1.2)",
        WebkitBackdropFilter: "blur(24px) saturate(1.2)",
      }}
    >
      <div ref={navRef} className="flex items-center justify-around px-1 pt-1.5 pb-1 relative">
        {/* Sliding copper bar indicator */}
        {activeIndex >= 0 && (
          <span
            className="absolute top-0 h-[2.5px] rounded-full"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              background: "#E8B4B8",
              boxShadow: "0 0 8px rgba(232,180,184,0.5), 0 0 3px rgba(232,180,184,0.3)",
              transition: "left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.15s ease",
            }}
          />
        )}

        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-3 py-1.5 no-underline relative"
              style={{
                color: active ? "#E8B4B8" : "#5A5347",
                transition: "color 0.2s ease",
              }}
            >
              {/* Glow behind active icon */}
              {active && (
                <span
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(232,180,184,0.12) 0%, transparent 70%)",
                  }}
                />
              )}
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} className="relative z-10" />
              <span
                className="text-[10px] mt-1 relative z-10"
                style={{
                  fontWeight: active ? 600 : 400,
                  letterSpacing: active ? "0.02em" : "0",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
