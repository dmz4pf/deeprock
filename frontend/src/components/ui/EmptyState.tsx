"use client";

import React from "react";
import Link from "next/link";
import { QGPanel } from "@/components/previews/quantum-grid/primitives/QGPanel";
import { QGButton } from "@/components/previews/quantum-grid/primitives/QGButton";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon?: "vault" | "seal" | "search" | "lock" | "empty";
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

const ICONS: Record<string, React.ReactNode> = {
  vault: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="12" width="40" height="34" rx="4" />
      <circle cx="28" cy="29" r="8" />
      <circle cx="28" cy="29" r="3" />
      <line x1="28" y1="21" x2="28" y2="12" />
      <rect x="18" y="8" width="20" height="4" rx="2" />
    </svg>
  ),
  seal: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="28" cy="28" r="16" />
      <circle cx="28" cy="28" r="10" />
      <path d="M28 18v4M28 34v4M18 28h4M34 28h4" />
      <circle cx="28" cy="28" r="3" fill="currentColor" />
    </svg>
  ),
  search: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="12" />
      <line x1="33" y1="33" x2="44" y2="44" />
      <line x1="20" y1="24" x2="28" y2="24" />
    </svg>
  ),
  lock: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="14" y="26" width="28" height="20" rx="4" />
      <path d="M20 26V20a8 8 0 0 1 16 0v6" />
      <circle cx="28" cy="37" r="3" fill="currentColor" />
    </svg>
  ),
  empty: (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20l6-8h20l6 8" />
      <rect x="12" y="20" width="32" height="24" rx="3" />
      <path d="M12 20h32" />
      <line x1="28" y1="30" x2="28" y2="30.01" strokeWidth="3" />
    </svg>
  ),
};

export function EmptyState({ icon = "empty", title, description, action }: EmptyStateProps) {
  const iconElement = ICONS[icon];

  const cta = action ? (
    action.href ? (
      <Link href={action.href} className="no-underline">
        <QGButton size="sm">{action.label}</QGButton>
      </Link>
    ) : (
      <QGButton size="sm" onClick={action.onClick}>{action.label}</QGButton>
    )
  ) : null;

  return (
    <QGPanel accent>
      <div className="flex flex-col items-center py-8 text-center">
        <div className="text-[#E8B4B8] opacity-40 mb-5 animate-[breathe_3s_ease-in-out_infinite]">
          {iconElement}
        </div>
        <h3 className="text-[22px] font-semibold font-serif text-[#F0EBE0] m-0 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-[14px] text-[#5A5347] m-0 mb-5 max-w-[320px] leading-relaxed">
            {description}
          </p>
        )}
        {cta}
      </div>
    </QGPanel>
  );
}
