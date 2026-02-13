"use client";

import React, { useState } from "react";
import { QGPanel } from "../primitives/QGPanel";
import { QGButton } from "../primitives/QGButton";
import { QGInput } from "../primitives/QGInput";
import { QGBadge } from "../primitives/QGBadge";
import { QGScrollReveal } from "../primitives/QGScrollReveal";

// -- Main Page ----------------------------------------------------------------

export function QGSettingsPage() {
  const [notifications, setNotifications] = useState({
    yields: true,
    transactions: true,
    alerts: false,
    newsletter: false,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)", maxWidth: 700, margin: "0 auto" }}>
      {/* Profile Section */}
      <QGScrollReveal>
        <QGPanel label="Profile">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(var(--qg-primary-rgb),0.2), rgba(var(--qg-secondary-rgb),0.2))",
              border: "1px solid rgba(var(--qg-primary-rgb),0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 600, color: "var(--qg-primary)",
            }}>D</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Dami</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>dami@example.com</div>
              <QGBadge color="#10B981" variant="dot" pulse>KYC Verified</QGBadge>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <QGInput label="Display Name" placeholder="Enter display name" value="Dami" onChange={() => {}} />
            <QGInput label="Email" placeholder="Enter email" value="dami@example.com" type="email" onChange={() => {}} />
            <QGButton variant="secondary">Update Profile</QGButton>
          </div>
        </QGPanel>
      </QGScrollReveal>

      {/* Wallet Section */}
      <QGScrollReveal staggerIndex={1}>
        <QGPanel label="Wallet">
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: 12, borderRadius: 8,
            background: "rgba(var(--qg-primary-rgb),0.04)",
            border: "1px solid rgba(var(--qg-primary-rgb),0.08)",
            marginBottom: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Connected Wallet</div>
              <div style={{ fontSize: 13, color: "#fff", fontFamily: "monospace", fontWeight: 500 }}>0x7a2B...9cE4</div>
            </div>
            <QGBadge color="#10B981" variant="dot" pulse>Connected</QGBadge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Network</span>
            <span style={{ fontSize: 11, color: "#E84142", fontWeight: 500 }}>Avalanche C-Chain</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>USDC Balance</span>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 500 }}>$24,500.00</span>
          </div>
        </QGPanel>
      </QGScrollReveal>

      {/* Security Section */}
      <QGScrollReveal staggerIndex={2}>
        <QGPanel label="Security">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(var(--qg-primary-rgb),0.04)" }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Add extra security to your account</div>
              </div>
              <QGBadge color="#F59E0B" variant="outline">Not Enabled</QGBadge>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(var(--qg-primary-rgb),0.04)" }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Session Management</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>1 active session</div>
              </div>
              <QGButton variant="ghost" size="sm">Manage</QGButton>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Login History</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Last login: Today at 14:30 UTC</div>
              </div>
              <QGButton variant="ghost" size="sm">View</QGButton>
            </div>
          </div>
        </QGPanel>
      </QGScrollReveal>

      {/* Notifications Section */}
      <QGScrollReveal staggerIndex={3}>
        <QGPanel label="Notifications">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(notifications).map(([key, enabled]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(var(--qg-primary-rgb),0.04)" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "capitalize" }}>
                  {key === "yields" ? "Yield Distributions" : key === "transactions" ? "Transaction Updates" : key === "alerts" ? "Risk Alerts" : "Newsletter"}
                </span>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: enabled ? "var(--qg-primary)" : "rgba(255,255,255,0.1)",
                    border: "none", cursor: "pointer", position: "relative",
                    transition: "background var(--qg-anim-duration, 300ms) ease-out",
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 3,
                    left: enabled ? 21 : 3,
                    transition: "left var(--qg-anim-duration, 300ms) ease-out",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }} />
                </button>
              </div>
            ))}
          </div>
        </QGPanel>
      </QGScrollReveal>

      {/* Danger Zone */}
      <QGScrollReveal staggerIndex={4}>
        <QGPanel label="Danger Zone" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: "#EF4444" }}>Delete Account</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Permanently delete your account and all data</div>
            </div>
            <QGButton variant="ghost" size="sm">Delete</QGButton>
          </div>
        </QGPanel>
      </QGScrollReveal>
    </div>
  );
}
