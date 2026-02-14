"use client";

import React from "react";

interface QGPanelProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
  hover?: boolean;
  accent?: boolean;
  variant?: "default" | "hero" | "compact";
  mode?: "vault" | "luxe" | "default";
}

export function QGPanel({
  children,
  label,
  className = "",
  style,
  noPadding,
  hover,
  accent,
  variant = "default",
  mode = "default",
}: QGPanelProps) {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const isVault = mode === "vault";
  const isLuxe = mode === "luxe";

  const padClass = noPadding
    ? "p-0"
    : isHero
      ? "p-7"
      : isCompact
        ? "px-3.5 py-3"
        : "px-[22px] py-5";

  const roundClass = isCompact ? "rounded-[10px]" : "rounded-[14px]";

  const bgClass = isVault
    ? "bg-transparent"
    : isLuxe
      ? ""
      : isHero
        ? "bg-gradient-to-b from-[rgba(21,18,26,0.95)] to-[rgba(14,11,16,0.98)]"
        : "bg-[var(--elevation-1)]";

  const borderClass = isVault ? "border-none" : "border border-[var(--border-default)]";

  const luxeClass = isLuxe ? "fb-luxe-card fb-shine fb-iri" : "";

  const shadowStyle = isVault || isLuxe
    ? undefined
    : isHero
      ? "var(--shadow-3)"
      : "var(--shadow-1)";

  return (
    <div
      className={`
        relative overflow-hidden flex flex-col
        transition-[border-color,box-shadow,transform] duration-[var(--duration-slow)] ease-out
        ${bgClass} ${borderClass} ${roundClass} ${padClass}
        ${hover ? "forge-hover-lift" : ""}
        ${accent ? "forge-edge" : ""}
        ${isHero ? "hero-inner-glow" : ""}
        ${luxeClass}
        ${className}
      `}
      style={{ boxShadow: shadowStyle, ...style }}
    >
      {!isVault && (
        <div
          className="absolute -top-10 -right-10 w-[100px] h-[100px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(232,180,184,0.04) 0%, transparent 70%)" }}
        />
      )}
      {label && <QGLabel>{label}</QGLabel>}
      <div className="relative flex-1 flex flex-col">{children}</div>
      {isVault && <div className="rose-rule mt-4" />}
    </div>
  );
}

function QGLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] tracking-[0.14em] uppercase text-[#5A5347] mb-3.5 font-semibold font-sans">
      {children}
    </div>
  );
}

export { QGLabel };
