"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, Landmark, Briefcase, TrendingUp, LayoutGrid } from "lucide-react";

const assetClasses = [
  { value: "", label: "All", icon: LayoutGrid },
  { value: "treasury", label: "Treasury", icon: Landmark },
  { value: "real-estate", label: "Real Estate", icon: Building2 },
  { value: "private-credit", label: "Private Credit", icon: Briefcase },
  { value: "corporate-bonds", label: "Corporate Bonds", icon: TrendingUp },
];

interface PoolFiltersProps {
  selectedAssetClass: string;
  onAssetClassChange: (value: string) => void;
}

export function PoolFilters({ selectedAssetClass, onAssetClassChange }: PoolFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {assetClasses.map((assetClass) => {
        const isSelected = selectedAssetClass === assetClass.value;
        return (
          <Button
            key={assetClass.value}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-2",
              isSelected
                ? "bg-forge-copper/20 text-[#F0EBE0] hover:bg-forge-copper/30 border-forge-copper/30"
                : "border-forge-copper/10 text-[#B8A99A] hover:bg-forge-copper/5 hover:text-[#F0EBE0]"
            )}
            onClick={() => onAssetClassChange(assetClass.value)}
          >
            <assetClass.icon className="h-4 w-4" />
            {assetClass.label}
          </Button>
        );
      })}
    </div>
  );
}
