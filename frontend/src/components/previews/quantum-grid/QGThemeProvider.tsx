"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { QGVariation, QGVariationConfig, variations } from "./theme/variations";
import { getThemeCSS } from "./theme/tokens";
import "./theme/animations.css";

interface QGThemeContextValue {
  variation: QGVariation;
  config: QGVariationConfig;
  setVariation: (v: QGVariation) => void;
}

const QGThemeContext = createContext<QGThemeContextValue>({
  variation: "cyan",
  config: variations.cyan,
  setVariation: () => {},
});

export function useQGTheme() {
  return useContext(QGThemeContext);
}

export function QGThemeProvider({
  children,
  defaultVariation = "cyan",
}: {
  children: React.ReactNode;
  defaultVariation?: QGVariation;
}) {
  const [variation, setVariation] = useState<QGVariation>(defaultVariation);
  const config = variations[variation];
  const themeCSS = useMemo(() => getThemeCSS(config), [config]);

  const value = useMemo(
    () => ({ variation, config, setVariation }),
    [variation, config]
  );

  return (
    <QGThemeContext.Provider value={value}>
      <div
        className={`qg-theme qg-theme-${variation}${config.specialEffect === "scanline" ? " qg-scanline" : ""}`}
        style={{
          ...themeCSS,
          background: config.background,
          color: "#fff",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          minHeight: "100%",
          transition: "background 300ms ease-out",
          position: "relative",
        } as React.CSSProperties}
      >
        {children}
      </div>
    </QGThemeContext.Provider>
  );
}
