import React from "react";
import { Img, staticFile } from "remotion";
import { COLORS } from "../lib/theme";

type AppFrameProps = {
  screenshot: string;
  children?: React.ReactNode;
  scale?: number;
  translateX?: number;
  translateY?: number;
};

export const AppFrame: React.FC<AppFrameProps> = ({
  screenshot,
  children,
  scale = 1,
  translateX = 0,
  translateY = 0,
}) => {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        backgroundColor: COLORS.bg,
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        transformOrigin: "center center",
      }}
    >
      {/* Browser chrome bar */}
      <div
        style={{
          height: 40,
          backgroundColor: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {["#FF5F56", "#FFBD2E", "#27C93F"].map((color, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: color,
            }}
          />
        ))}
        <div
          style={{
            flex: 1,
            height: 24,
            borderRadius: 6,
            backgroundColor: COLORS.elevated,
            marginLeft: 60,
            marginRight: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: COLORS.textDim,
            fontFamily: "monospace",
          }}
        >
          deeprock.finance
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Img
          src={staticFile(screenshot)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top left",
          }}
        />
        {children}
      </div>
    </div>
  );
};
