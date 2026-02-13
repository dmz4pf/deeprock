"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";

interface SlideDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  categoryColor?: string; // glowRgb e.g. "232,180,184"
}

export function SlideDrawer({
  open,
  onClose,
  children,
  title,
  categoryColor = "232,180,184",
}: SlideDrawerProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, handleEsc]);

  const rgb = categoryColor;

  return (
    <div className={`slide-drawer-outer shrink-0${open ? " open" : ""}`}>
      {/* Inner panel — slides in from right */}
      <div
        className="slide-drawer-inner h-full flex flex-col relative"
        style={{
          width: 420,
          borderLeft: `2px solid rgba(${rgb}, 0.15)`,
          background: `linear-gradient(180deg, var(--elevation-1) 0%, var(--elevation-0) 100%)`,
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${rgb}, 0.08) 0%, transparent 70%)`,
          }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid rgba(${rgb}, 0.06)` }}
        >
          {title && (
            <div
              className="font-serif"
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "#F0EBE0",
              }}
            >
              {title}
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer"
            style={{
              background: `rgba(${rgb}, 0.06)`,
              border: `1px solid rgba(${rgb}, 0.1)`,
              color: "#B8A99A",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = `rgba(${rgb}, 0.12)`;
              el.style.color = "#F0EBE0";
              el.style.boxShadow = `0 0 12px rgba(${rgb}, 0.15)`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = `rgba(${rgb}, 0.06)`;
              el.style.color = "#B8A99A";
              el.style.boxShadow = "none";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Gradient divider */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(${rgb}, 0.15), transparent)`,
          }}
        />

        {/* Content — fades in last */}
        <div className="slide-drawer-content flex-1 overflow-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
