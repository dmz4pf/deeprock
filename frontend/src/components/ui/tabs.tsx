"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-xl p-1",
        className
      )}
      style={{
        background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
        border: "1px solid rgba(232,180,184,0.08)",
        backdropFilter: "blur(40px)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
              isActive
                ? "text-[#E8B4B8]"
                : "text-[#5A5347] hover:text-[#B8A99A] hover:bg-[rgba(232,180,184,0.04)]"
            )}
            style={
              isActive
                ? {
                    background: "rgba(232,180,184,0.12)",
                    boxShadow: "0 0 15px rgba(232,180,184,0.15), inset 0 1px 0 rgba(232,180,184,0.04)",
                    borderBottom: "2px solid rgba(232,180,184,0.6)",
                  }
                : undefined
            }
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
