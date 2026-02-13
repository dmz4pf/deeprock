"use client";

import { CheckCircle, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GasSavingsDisplayProps {
  estimatedGasCost?: string;
  usdValue?: string;
  variant?: "default" | "compact" | "prominent";
  className?: string;
}

/**
 * Displays gas savings information for gasless transactions
 * Shows the estimated gas cost that users save by using the relayer
 */
export function GasSavingsDisplay({
  estimatedGasCost = "~0.02 AVAX",
  usdValue = "$0.45",
  variant = "default",
  className,
}: GasSavingsDisplayProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-forge-teal",
          className
        )}
      >
        <Zap className="h-3 w-3" />
        <span>Gas-free</span>
      </div>
    );
  }

  if (variant === "prominent") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-forge-teal/20 bg-gradient-to-r from-forge-teal/10 via-emerald-500/10 to-forge-teal/10 p-4",
          className
        )}
      >
        {/* Animated sparkle background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-forge-teal/5 via-transparent to-transparent" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forge-teal/20">
            <Sparkles className="h-6 w-6 text-forge-teal" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-[#F0EBE0]">
                Gas-Free Transaction
              </span>
              <span className="rounded-full bg-forge-teal/20 px-2 py-0.5 text-xs font-medium text-forge-teal">
                Sponsored
              </span>
            </div>
            <p className="mt-0.5 text-sm text-[#B8A99A]">
              You save{" "}
              <span className="font-medium text-forge-teal">{estimatedGasCost}</span>
              {" "}({usdValue}) in network fees
            </p>
          </div>

          <CheckCircle className="h-5 w-5 text-forge-teal" />
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg bg-forge-teal/10 border border-forge-teal/20 px-3 py-2 text-sm",
        className
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-forge-teal/20">
        <Zap className="h-3.5 w-3.5 text-forge-teal" />
      </div>
      <div className="flex-1">
        <span className="font-medium text-forge-teal">Gas-free transaction</span>
        <span className="text-[#B8A99A]">
          {" "} -- saving {estimatedGasCost} ({usdValue})
        </span>
      </div>
      <CheckCircle className="h-4 w-4 text-forge-teal" />
    </div>
  );
}

/**
 * Simple inline badge for gas-free status
 */
export function GasFreeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-forge-teal/10 px-2 py-0.5 text-xs font-medium text-forge-teal",
        className
      )}
    >
      <Zap className="h-3 w-3" />
      Gas-free
    </span>
  );
}
