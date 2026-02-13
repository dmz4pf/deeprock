"use client";

import React from "react";

export type QGPage = "portfolio" | "pools" | "category" | "pool-detail" | "documents" | "settings" | "landing" | "auth";

interface QGSidebarProps {
  activePage: QGPage;
  onNavigate: (page: QGPage) => void;
}

const NAV_ITEMS: { id: QGPage; label: string; icon: string; section?: string }[] = [
  { id: "portfolio", label: "Portfolio", icon: "\u25C8", section: "DASHBOARD" },
  { id: "pools", label: "Pools", icon: "\u25C9" },
  { id: "category", label: "Category", icon: "\u25A6" },
  { id: "pool-detail", label: "Pool Detail", icon: "\u25CE" },
  { id: "documents", label: "Documents", icon: "\u2750", section: "TOOLS" },
  { id: "settings", label: "Settings", icon: "\u2699" },
  { id: "landing", label: "Landing", icon: "\u25C6", section: "PUBLIC" },
  { id: "auth", label: "Auth", icon: "\u22A1" },
];

export function QGSidebar({ activePage, onNavigate }: QGSidebarProps) {
  let currentSection = "";

  return (
    <div
      style={{
        width: 200,
        minHeight: "100%",
        background: "rgba(var(--qg-primary-rgb),0.01)",
        borderRight: "1px solid var(--qg-panel-border)",
        padding: "16px 0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg, rgba(var(--qg-primary-rgb),0.15), rgba(var(--qg-secondary-rgb),0.15))",
            border: "1px solid rgba(var(--qg-primary-rgb),0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "var(--qg-primary)",
          }}
        >
          Q
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#fff", letterSpacing: "0.05em" }}>QUANTUM</div>
          <div style={{ fontSize: 8, color: "var(--qg-text-muted)", letterSpacing: "0.1em" }}>DEEPROCK</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        {NAV_ITEMS.map(item => {
          const showSection = item.section && item.section !== currentSection;
          if (item.section) currentSection = item.section;
          const isActive = activePage === item.id;

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div style={{
                  fontSize: 8, letterSpacing: "0.2em", color: "var(--qg-text-muted)",
                  padding: "16px 16px 6px", fontWeight: 500,
                }}>
                  {item.section}
                </div>
              )}
              <button
                onClick={() => onNavigate(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 16px", margin: "0 8px",
                  borderRadius: 8, border: "none",
                  background: isActive ? "rgba(var(--qg-primary-rgb),0.08)" : "transparent",
                  color: isActive ? "var(--qg-primary)" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                  fontSize: 12, fontWeight: isActive ? 500 : 400,
                  textAlign: "left",
                  transition: "all var(--qg-anim-duration, 300ms) ease-out",
                  position: "relative",
                }}
              >
                {isActive && (
                  <div style={{
                    position: "absolute", left: 0, top: "20%", bottom: "20%",
                    width: 2, borderRadius: 1,
                    background: "var(--qg-primary)",
                    boxShadow: "0 0 8px var(--qg-accent-glow)",
                  }} />
                )}
                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Status bar */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--qg-panel-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>AVAX C-CHAIN</span>
        </div>
      </div>
    </div>
  );
}
