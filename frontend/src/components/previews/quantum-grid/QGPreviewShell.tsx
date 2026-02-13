"use client";

import React, { useState, useCallback } from "react";
import { QGThemeProvider, useQGTheme } from "./QGThemeProvider";
import { QGAppLayout } from "./layout/QGAppLayout";
import { QGPage } from "./layout/QGSidebar";
import { variationList } from "./theme/variations";
import { QGPortfolioPage } from "./pages/QGPortfolioPage";
import { QGPoolsPage } from "./pages/QGPoolsPage";
import { QGCategoryPage } from "./pages/QGCategoryPage";
import { QGPoolDetailPage } from "./pages/QGPoolDetailPage";
import { QGDocumentsPage } from "./pages/QGDocumentsPage";
import { QGSettingsPage } from "./pages/QGSettingsPage";
import { QGLandingPage } from "./pages/QGLandingPage";
import { QGAuthPage } from "./pages/QGAuthPage";

function PreviewContent() {
  const { variation, setVariation } = useQGTheme();
  const [activePage, setActivePage] = useState<QGPage>("portfolio");

  const renderPage = useCallback(() => {
    switch (activePage) {
      case "portfolio": return <QGPortfolioPage />;
      case "pools": return <QGPoolsPage />;
      case "category": return <QGCategoryPage />;
      case "pool-detail": return <QGPoolDetailPage />;
      case "documents": return <QGDocumentsPage />;
      case "settings": return <QGSettingsPage />;
      case "landing": return <QGLandingPage />;
      case "auth": return <QGAuthPage />;
      default: return null;
    }
  }, [activePage]);

  return (
    <>
      {/* Variation Toggle Bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "10px 16px",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginRight: 8 }}>
          VARIATION
        </span>
        {variationList.map(v => (
          <button
            key={v.id}
            onClick={() => setVariation(v.id)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: variation === v.id ? `1px solid ${v.primary}40` : "1px solid rgba(255,255,255,0.06)",
              background: variation === v.id ? `${v.primary}15` : "transparent",
              color: variation === v.id ? v.primary : "rgba(255,255,255,0.4)",
              fontSize: 11, fontWeight: 500,
              cursor: "pointer",
              transition: "all 200ms ease-out",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: v.primary,
              boxShadow: variation === v.id ? `0 0 8px ${v.primary}` : "none",
            }} />
            {v.name}
          </button>
        ))}
      </div>

      {/* App Layout */}
      <QGAppLayout activePage={activePage} onNavigate={setActivePage}>
        {renderPage()}
      </QGAppLayout>
    </>
  );
}

export function QGPreviewShell() {
  return (
    <QGThemeProvider>
      <PreviewContent />
    </QGThemeProvider>
  );
}
