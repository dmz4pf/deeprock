"use client";

import React, { useState } from "react";
import { QGPanel } from "../primitives/QGPanel";
import { QGBadge } from "../primitives/QGBadge";
import { QGButton } from "../primitives/QGButton";
import { QGInput } from "../primitives/QGInput";
import { QGScrollReveal } from "../primitives/QGScrollReveal";

// -- Main Page ----------------------------------------------------------------

export function QGDocumentsPage() {
  const [activeTab, setActiveTab] = useState<"seal" | "verify">("seal");
  const [hash, setHash] = useState("");

  const recentDocs = [
    { name: "Investment Agreement - USTB Pool", hash: "0xabc1...def2", date: "Feb 7, 2026", status: "Sealed" },
    { name: "KYC Verification Certificate", hash: "0x1234...5678", date: "Feb 5, 2026", status: "Sealed" },
    { name: "Pool Audit Report Q1 2026", hash: "0x9876...fedc", date: "Jan 28, 2026", status: "Verified" },
    { name: "Custodian Agreement", hash: "0xdef0...1234", date: "Jan 15, 2026", status: "Sealed" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <QGScrollReveal>
        <QGPanel>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>&#10065;</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>Document Verification</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Seal and verify documents on the Avalanche blockchain
            </p>
          </div>
        </QGPanel>
      </QGScrollReveal>

      {/* Tab Buttons */}
      <QGScrollReveal staggerIndex={1}>
        <div style={{ display: "flex", gap: 4, background: "rgba(var(--qg-primary-rgb),0.03)", borderRadius: 10, padding: 4 }}>
          {(["seal", "verify"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 8,
                border: "none", cursor: "pointer",
                background: activeTab === tab ? "rgba(var(--qg-primary-rgb),0.1)" : "transparent",
                color: activeTab === tab ? "var(--qg-primary)" : "rgba(255,255,255,0.4)",
                fontSize: 12, fontWeight: 500,
                transition: "all var(--qg-anim-duration, 300ms) ease-out",
                textTransform: "uppercase", letterSpacing: "0.1em",
              }}
            >
              {tab === "seal" ? "Seal Document" : "Verify Document"}
            </button>
          ))}
        </div>
      </QGScrollReveal>

      {/* Tab Content */}
      <QGScrollReveal staggerIndex={2}>
        {activeTab === "seal" ? (
          <QGPanel>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 8 }}>
              {/* Upload Area */}
              <div style={{
                border: "2px dashed rgba(var(--qg-primary-rgb),0.15)",
                borderRadius: 12, padding: "40px 20px",
                textAlign: "center",
                background: "rgba(var(--qg-primary-rgb),0.02)",
                cursor: "pointer",
                transition: "border-color var(--qg-anim-duration, 300ms) ease-out",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>&#128196;</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                  Drop your document here or click to browse
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                  PDF, DOC, DOCX up to 10MB
                </div>
              </div>

              <QGInput label="Document Name" placeholder="Enter document name" />
              <QGInput label="Description (Optional)" placeholder="Brief description" />

              <QGButton variant="primary" fullWidth>Seal on Blockchain</QGButton>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(var(--qg-primary-rgb),0.03)", borderRadius: 8 }}>
                <span style={{ fontSize: 14 }}>&#8505;</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                  Sealing creates an immutable hash of your document on the Avalanche C-Chain
                </span>
              </div>
            </div>
          </QGPanel>
        ) : (
          <QGPanel>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 8 }}>
              <QGInput
                label="Document Hash"
                placeholder="Enter document hash (0x...)"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
              />

              <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>&mdash; or &mdash;</div>

              {/* Upload for verification */}
              <div style={{
                border: "2px dashed rgba(var(--qg-primary-rgb),0.15)",
                borderRadius: 12, padding: "32px 20px",
                textAlign: "center",
                background: "rgba(var(--qg-primary-rgb),0.02)",
                cursor: "pointer",
              }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>&#128269;</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  Drop document to verify against blockchain
                </div>
              </div>

              <QGButton variant="primary" fullWidth>Verify Document</QGButton>

              {/* Sample verification result */}
              {hash && (
                <QGPanel style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>&#9989;</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#10B981" }}>Document Verified</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { label: "Sealed by", value: "0xUser...1234" },
                      { label: "Timestamp", value: "Feb 7, 2026 14:32 UTC" },
                      { label: "Block", value: "#4,291,876" },
                      { label: "Chain", value: "Avalanche C-Chain" },
                    ].map(item => (
                      <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </QGPanel>
              )}
            </div>
          </QGPanel>
        )}
      </QGScrollReveal>

      {/* Recent Documents */}
      <QGScrollReveal staggerIndex={3}>
        <QGPanel label="Recent Documents">
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recentDocs.map((doc, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 8px", borderRadius: 8,
                background: i % 2 === 0 ? "rgba(var(--qg-primary-rgb),0.015)" : "transparent",
              }}>
                <span style={{ fontSize: 16, opacity: 0.5 }}>&#128196;</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{doc.name}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{doc.hash}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{doc.date}</div>
                  <QGBadge color={doc.status === "Verified" ? "#10B981" : "var(--qg-primary)"} variant="outline">
                    {doc.status}
                  </QGBadge>
                </div>
              </div>
            ))}
          </div>
        </QGPanel>
      </QGScrollReveal>
    </div>
  );
}
