"use client";

import { useState } from "react";
import { CommandCenterDashboard } from "@/components/previews/CommandCenterDashboard";
import { NexusFlowDashboard } from "@/components/previews/NexusFlowDashboard";
import { NexusFlowEnhanced } from "@/components/previews/NexusFlowEnhanced";
import { OrbitalDashboard } from "@/components/previews/OrbitalDashboard";
import { CyberXHubAlpha } from "@/components/previews/CyberXHubAlpha";
import { CyberXHubBeta } from "@/components/previews/CyberXHubBeta";
import { QuantumGridDashboard } from "@/components/previews/QuantumGridDashboard";
import { NeuralNetworkDashboard } from "@/components/previews/NeuralNetworkDashboard";
import { CitadelCommandDashboard } from "@/components/previews/CitadelCommandDashboard";

type DesignVariant = "hub-alpha" | "hub-beta" | "quantum" | "neural" | "citadel" | "nexus-enhanced" | "orbital" | "nexus" | "command";

export default function DesignPreviewPage() {
  const [activeVariant, setActiveVariant] = useState<DesignVariant>("hub-alpha");

  const variants: { id: DesignVariant; name: string; description: string; accent: string }[] = [
    {
      id: "hub-alpha",
      name: "CyberX Hub Alpha",
      description: "Command center with orbital data flows",
      accent: "from-cyan-500/20 to-blue-500/5"
    },
    {
      id: "hub-beta",
      name: "CyberX Hub Beta",
      description: "Space command with data packets",
      accent: "from-teal-500/20 to-blue-500/5"
    },
    {
      id: "quantum",
      name: "Quantum Grid",
      description: "Bloomberg meets holographic UI",
      accent: "from-cyan-500/20 to-purple-500/5"
    },
    {
      id: "neural",
      name: "Neural Network",
      description: "Living constellation portfolio",
      accent: "from-purple-500/20 to-cyan-500/5"
    },
    {
      id: "citadel",
      name: "Citadel Command",
      description: "Military-grade war room",
      accent: "from-emerald-500/20 to-cyan-500/5"
    },
    {
      id: "nexus-enhanced",
      name: "Nexus Enhanced",
      description: "Premium data flow visualization",
      accent: "from-cyan-500/20 to-purple-500/5"
    },
    {
      id: "orbital",
      name: "Orbital",
      description: "Cinematic space mission control",
      accent: "from-blue-500/20 to-purple-500/5"
    },
    {
      id: "nexus",
      name: "Nexus Flow",
      description: "CyberX-inspired data streams",
      accent: "from-cyan-500/20 to-cyan-500/5"
    },
    {
      id: "command",
      name: "Command Center",
      description: "Technical precision dashboard",
      accent: "from-cyan-500/20 to-blue-500/5"
    },
  ];

  return (
    <div className="min-h-screen bg-[#030608]">
      {/* Variant Selector */}
      <div
        className="sticky top-0 z-50 px-8 py-5"
        style={{
          background: 'linear-gradient(180deg, rgba(3,6,8,0.98) 0%, rgba(3,6,8,0.95) 80%, transparent 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-medium text-white">Deeprock Design System</h1>
              <p className="text-sm text-white/40">Select a design variation to preview</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Preview</span>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveVariant(v.id)}
                className={`relative px-5 py-3 rounded-xl text-left transition-all duration-300 shrink-0 ${
                  activeVariant === v.id
                    ? "bg-gradient-to-br " + v.accent + " border border-white/10"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                {activeVariant === v.id && (
                  <div
                    className="absolute inset-0 rounded-xl opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)'
                    }}
                  />
                )}
                <span className={`block text-sm font-medium whitespace-nowrap ${
                  activeVariant === v.id ? "text-white" : "text-white/60"
                }`}>
                  {v.name}
                </span>
                <span className={`block text-xs mt-0.5 whitespace-nowrap ${
                  activeVariant === v.id ? "text-white/60" : "text-white/30"
                }`}>
                  {v.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="relative">
        {activeVariant === "hub-alpha" && <CyberXHubAlpha />}
        {activeVariant === "hub-beta" && <CyberXHubBeta />}
        {activeVariant === "quantum" && <QuantumGridDashboard />}
        {activeVariant === "neural" && <NeuralNetworkDashboard />}
        {activeVariant === "citadel" && <CitadelCommandDashboard />}
        {activeVariant === "nexus-enhanced" && <NexusFlowEnhanced />}
        {activeVariant === "orbital" && <OrbitalDashboard />}
        {activeVariant === "nexus" && <NexusFlowDashboard />}
        {activeVariant === "command" && <CommandCenterDashboard />}
      </div>
    </div>
  );
}
