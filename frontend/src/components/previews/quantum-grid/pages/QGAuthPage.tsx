"use client";

import React, { useState } from "react";
import { QGPanel } from "../primitives/QGPanel";
import { QGButton } from "../primitives/QGButton";
import { QGInput } from "../primitives/QGInput";
import { useMounted } from "../hooks/useMounted";

// -- Main Page ----------------------------------------------------------------

export function QGAuthPage() {
  const mounted = useMounted();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const authMethods = [
    { icon: "🦊", name: "MetaMask", description: "Browser wallet" },
    { icon: "🔗", name: "WalletConnect", description: "Mobile wallets" },
    { icon: "🪙", name: "Core Wallet", description: "Avalanche native" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "calc(100vh - 120px)",
      margin: "calc(var(--qg-gap) * -1)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(var(--qg-primary-rgb),0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(var(--qg-primary-rgb),0.04) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        opacity: mounted ? 1 : 0,
        transition: "opacity 2s ease-out",
      }} />

      {/* Radial glow */}
      <div style={{
        position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(var(--qg-primary-rgb),0.06) 0%, transparent 70%)",
      }} />

      {/* Auth Card */}
      <div style={{
        position: "relative", width: 380, zIndex: 1,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
        transition: "all 0.8s ease-out 0.2s",
      }}>
        <QGPanel>
          <div style={{ padding: 8 }}>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, margin: "0 auto 16px",
                background: "linear-gradient(135deg, rgba(var(--qg-primary-rgb),0.15), rgba(var(--qg-secondary-rgb),0.15))",
                border: "1px solid rgba(var(--qg-primary-rgb),0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, color: "var(--qg-primary)",
                boxShadow: "0 0 30px var(--qg-accent-glow)",
              }}>Q</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.05em" }}>DEEPROCK</div>
              <div style={{ fontSize: 10, color: "var(--qg-text-muted)", letterSpacing: "0.15em", marginTop: 2 }}>PROTOCOL</div>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: "flex", gap: 4, background: "rgba(var(--qg-primary-rgb),0.03)", borderRadius: 8, padding: 3, marginBottom: 20 }}>
              {(["login", "register"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setAuthMode(mode)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 6,
                    border: "none", cursor: "pointer",
                    background: authMode === mode ? "rgba(var(--qg-primary-rgb),0.1)" : "transparent",
                    color: authMode === mode ? "var(--qg-primary)" : "rgba(255,255,255,0.4)",
                    fontSize: 11, fontWeight: 500,
                    transition: "all var(--qg-anim-duration, 300ms) ease-out",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}
                >{mode}</button>
              ))}
            </div>

            {/* Wallet Connection Methods */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {authMethods.map(method => (
                <button
                  key={method.name}
                  className="qg-hover-lift"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 10,
                    background: "rgba(var(--qg-primary-rgb),0.03)",
                    border: "1px solid var(--qg-panel-border)",
                    cursor: "pointer", color: "#fff",
                    transition: "all var(--qg-anim-duration, 300ms) ease-out",
                    width: "100%", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{method.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{method.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{method.description}</div>
                  </div>
                  <span style={{ fontSize: 14, color: "var(--qg-text-muted)" }}>{"\u2192"}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--qg-panel-border)" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "var(--qg-panel-border)" }} />
            </div>

            {/* Email Auth */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <QGInput label="Email" placeholder="Enter your email" type="email" />
              <QGInput label="Password" placeholder="Enter password" type="password" />
              {authMode === "register" && (
                <QGInput label="Confirm Password" placeholder="Confirm password" type="password" />
              )}
              <QGButton variant="primary" fullWidth>
                {authMode === "login" ? "Sign In" : "Create Account"}
              </QGButton>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                By connecting, you agree to our Terms of Service
              </span>
            </div>
          </div>
        </QGPanel>
      </div>
    </div>
  );
}
