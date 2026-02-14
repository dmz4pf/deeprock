"use client";

import React from "react";

interface QGButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-7 py-3.5 text-[17px]",
} as const;

const VARIANT_CLASSES = {
  primary: "bg-gradient-to-r from-[#C4956A] via-[#E8B4B8] to-[#C9A0DC] text-white font-semibold shadow-[0_0_24px_rgba(201,160,220,0.3)]",
  secondary: "bg-[rgba(232,180,184,0.1)] text-[#E8B4B8] border border-[rgba(232,180,184,0.2)]",
  ghost: "bg-transparent text-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.08)]",
} as const;

export function QGButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  onClick,
  disabled,
}: QGButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-[10px] tracking-[0.03em] transition-all duration-[var(--duration-slow)] ease-out
        ${SIZE_CLASSES[size]}
        ${VARIANT_CLASSES[variant]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"}
      `}
    >
      {children}
    </button>
  );
}
