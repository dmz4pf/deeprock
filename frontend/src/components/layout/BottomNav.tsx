"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Layers, FileText, Settings, type LucideIcon } from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/portfolio", label: "Portfolio", icon: LayoutDashboard },
  { href: "/pools", label: "Pools", icon: Layers },
  { href: "/documents", label: "Docs", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string): boolean =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--elevation-0)] border-t border-[var(--border-subtle)]">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center min-w-[64px] px-2 py-1
                no-underline transition-colors duration-150
                ${active ? "text-[#E8B4B8]" : "text-[#5A5347]"}
              `}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
