"use client";

import { useState } from "react";
import { VoidPrismPreview } from "@/components/previews/VoidPrismPreview";
import { CopperAtlasPreview } from "@/components/previews/CopperAtlasPreview";
import { MonochromeAbsolutePreview } from "@/components/previews/MonochromeAbsolutePreview";
import { CelestialMapPreview } from "@/components/previews/CelestialMapPreview";
import { PaperNoirPreview } from "@/components/previews/PaperNoirPreview";
import { MercuryFlowPreview } from "@/components/previews/MercuryFlowPreview";
import { BrutalistLedgerPreview } from "@/components/previews/BrutalistLedgerPreview";
import { AmberArchivePreview } from "@/components/previews/AmberArchivePreview";
import { ObsidianForgePreview } from "@/components/previews/ObsidianForgePreview";
import { ObsidianForgeAuroraPreview } from "@/components/previews/ObsidianForgeAuroraPreview";
import { ObsidianForgeEmberPreview } from "@/components/previews/ObsidianForgeEmberPreview";
import { ObsidianForgeFrostPreview } from "@/components/previews/ObsidianForgeFrostPreview";
import { ObsidianForgeNebulaPreview } from "@/components/previews/ObsidianForgeNebulaPreview";
import { ObsidianForgeJadePreview } from "@/components/previews/ObsidianForgeJadePreview";
import { ObsidianForgeRosePreview } from "@/components/previews/ObsidianForgeRosePreview";

type DesignVariant =
  | "obsidian-forge"
  | "obsidian-aurora"
  | "obsidian-ember"
  | "obsidian-frost"
  | "obsidian-nebula"
  | "obsidian-jade"
  | "obsidian-rose"
  | "void-prism"
  | "copper-atlas"
  | "monochrome-absolute"
  | "celestial-map"
  | "paper-noir"
  | "mercury-flow"
  | "brutalist-ledger"
  | "amber-archive";

type VariantGroup = {
  label: string;
  variants: {
    id: DesignVariant;
    name: string;
    description: string;
    accent: string;
    badge?: string;
  }[];
};

export default function DesignPreviewPage() {
  const [activeVariant, setActiveVariant] =
    useState<DesignVariant>("obsidian-forge");

  const groups: VariantGroup[] = [
    {
      label: "Obsidian Forge Collection",
      variants: [
        {
          id: "obsidian-forge",
          name: "Obsidian Forge",
          description: "Iridescent copper on forged obsidian",
          accent: "from-orange-400/20 via-violet-500/10 to-teal-500/5",
          badge: "ORIGIN",
        },
        {
          id: "obsidian-aurora",
          name: "Aurora",
          description: "Northern lights on polar night",
          accent: "from-emerald-400/20 via-teal-500/10 to-violet-500/5",
          badge: "NEW",
        },
        {
          id: "obsidian-ember",
          name: "Ember",
          description: "Volcanic forge, white-hot metal",
          accent: "from-red-500/20 via-orange-500/10 to-amber-500/5",
          badge: "NEW",
        },
        {
          id: "obsidian-frost",
          name: "Frost",
          description: "Arctic ice on frozen obsidian",
          accent: "from-sky-400/20 via-blue-500/10 to-slate-500/5",
          badge: "NEW",
        },
        {
          id: "obsidian-nebula",
          name: "Nebula",
          description: "Deep space cosmic forge",
          accent: "from-purple-500/20 via-pink-500/10 to-blue-500/5",
          badge: "NEW",
        },
        {
          id: "obsidian-jade",
          name: "Jade",
          description: "Eastern luxury, jade & gold leaf",
          accent: "from-emerald-500/20 via-green-500/10 to-amber-500/5",
          badge: "NEW",
        },
        {
          id: "obsidian-rose",
          name: "Rosé",
          description: "Rose gold luxury on warm onyx",
          accent: "from-pink-400/20 via-rose-400/10 to-amber-500/5",
          badge: "NEW",
        },
      ],
    },
    {
      label: "Standalone Themes",
      variants: [
        {
          id: "void-prism",
          name: "Void Prism",
          description: "Holographic iridescent on black",
          accent: "from-violet-500/20 to-pink-500/5",
        },
        {
          id: "copper-atlas",
          name: "Copper Atlas",
          description: "Brushed metal luxury watch",
          accent: "from-orange-400/20 to-amber-900/5",
        },
        {
          id: "monochrome-absolute",
          name: "Monochrome Absolute",
          description: "Zero color, pure typography",
          accent: "from-gray-400/20 to-gray-900/5",
        },
        {
          id: "celestial-map",
          name: "Celestial Map",
          description: "Portfolio as star constellation",
          accent: "from-purple-400/20 to-indigo-900/5",
        },
        {
          id: "paper-noir",
          name: "Paper Noir",
          description: "Ink brush + washi paper craft",
          accent: "from-stone-400/20 to-stone-900/5",
        },
        {
          id: "mercury-flow",
          name: "Mercury Flow",
          description: "Liquid metal chrome aesthetic",
          accent: "from-slate-300/20 to-slate-900/5",
        },
        {
          id: "brutalist-ledger",
          name: "Brutalist Ledger",
          description: "Raw Bauhaus financial grid",
          accent: "from-red-500/20 to-neutral-900/5",
        },
        {
          id: "amber-archive",
          name: "Amber Archive",
          description: "Classified dossier terminal",
          accent: "from-amber-400/20 to-yellow-900/5",
        },
      ],
    },
  ];

  const allVariants = groups.flatMap((g) => g.variants);
  const active = allVariants.find((v) => v.id === activeVariant);

  return (
    <div className="min-h-screen bg-[#030608]">
      {/* Variant Selector */}
      <div
        className="sticky top-0 z-50 px-8 py-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,6,8,0.98) 0%, rgba(3,6,8,0.95) 80%, transparent 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-medium text-white">
                Deeprock Design System
              </h1>
              <p className="text-sm text-white/40">
                {allVariants.length} theme variations — select to preview
              </p>
            </div>
            <div className="flex items-center gap-3">
              {active?.badge && (
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  {active.badge}
                </span>
              )}
              <div className="flex items-center gap-2 text-xs text-white/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Preview</span>
              </div>
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.label} className="mb-2.5 last:mb-0">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/25 mb-1.5 ml-1">
                {group.label}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {group.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVariant(v.id)}
                    className={`relative px-3 py-2 rounded-lg text-left transition-all duration-300 ${
                      activeVariant === v.id
                        ? "bg-gradient-to-br " +
                          v.accent +
                          " border border-white/10"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {activeVariant === v.id && (
                      <div
                        className="absolute inset-0 rounded-lg opacity-50"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)",
                        }}
                      />
                    )}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`block text-xs font-medium ${
                          activeVariant === v.id
                            ? "text-white"
                            : "text-white/60"
                        }`}
                      >
                        {v.name}
                      </span>
                      {v.badge && activeVariant !== v.id && (
                        <span className="px-1 py-0.5 text-[7px] font-bold uppercase rounded bg-white/10 text-white/40">
                          {v.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`block text-[10px] mt-0.5 ${
                        activeVariant === v.id
                          ? "text-white/60"
                          : "text-white/30"
                      }`}
                    >
                      {v.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Content */}
      <div className="relative">
        {activeVariant === "obsidian-forge" && <ObsidianForgePreview />}
        {activeVariant === "obsidian-aurora" && <ObsidianForgeAuroraPreview />}
        {activeVariant === "obsidian-ember" && <ObsidianForgeEmberPreview />}
        {activeVariant === "obsidian-frost" && <ObsidianForgeFrostPreview />}
        {activeVariant === "obsidian-nebula" && <ObsidianForgeNebulaPreview />}
        {activeVariant === "obsidian-jade" && <ObsidianForgeJadePreview />}
        {activeVariant === "obsidian-rose" && <ObsidianForgeRosePreview />}
        {activeVariant === "void-prism" && <VoidPrismPreview />}
        {activeVariant === "copper-atlas" && <CopperAtlasPreview />}
        {activeVariant === "monochrome-absolute" && <MonochromeAbsolutePreview />}
        {activeVariant === "celestial-map" && <CelestialMapPreview />}
        {activeVariant === "paper-noir" && <PaperNoirPreview />}
        {activeVariant === "mercury-flow" && <MercuryFlowPreview />}
        {activeVariant === "brutalist-ledger" && <BrutalistLedgerPreview />}
        {activeVariant === "amber-archive" && <AmberArchivePreview />}
      </div>
    </div>
  );
}
