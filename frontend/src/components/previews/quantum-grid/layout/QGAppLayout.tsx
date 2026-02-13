"use client";

import React from "react";
import { QGSidebar, QGPage } from "./QGSidebar";
import { QGHeader } from "./QGHeader";

interface QGAppLayoutProps {
  children: React.ReactNode;
  activePage: QGPage;
  onNavigate: (page: QGPage) => void;
}

export function QGAppLayout({ children, activePage, onNavigate }: QGAppLayoutProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <QGSidebar activePage={activePage} onNavigate={onNavigate} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <QGHeader />
        <div style={{ flex: 1, padding: "var(--qg-gap)", overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
