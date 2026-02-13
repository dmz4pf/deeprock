"use client";

import { Cpu, Fingerprint, Send, ShieldCheck, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestmentStep, AuthType } from "./InvestmentStepIndicator";

interface TimelineStepConfig {
  icon: React.ElementType;
  label: string;
  description: string;
  estimate: string;
}

const PASSKEY_TIMELINE: Record<Exclude<InvestmentStep, "complete" | "error">, TimelineStepConfig> = {
  preparing: {
    icon: Cpu,
    label: "Preparing",
    description: "Setting up your transaction",
    estimate: "~3s",
  },
  signing: {
    icon: Fingerprint,
    label: "Authenticate",
    description: "Verify with biometrics",
    estimate: "Waiting...",
  },
  submitting: {
    icon: Send,
    label: "Processing",
    description: "Submitting to the network",
    estimate: "~5s",
  },
  confirming: {
    icon: ShieldCheck,
    label: "Confirming",
    description: "Blockchain confirmation",
    estimate: "~15s",
  },
};

const WALLET_TIMELINE: Record<Exclude<InvestmentStep, "complete" | "error">, TimelineStepConfig> = {
  preparing: {
    icon: Cpu,
    label: "Preparing",
    description: "Generating permit request",
    estimate: "~3s",
  },
  signing: {
    icon: Fingerprint,
    label: "Sign in Wallet",
    description: "Approve in your wallet",
    estimate: "Waiting...",
  },
  submitting: {
    icon: Send,
    label: "Processing",
    description: "Submitting to the network",
    estimate: "~5s",
  },
  confirming: {
    icon: ShieldCheck,
    label: "Confirming",
    description: "Blockchain confirmation",
    estimate: "~15s",
  },
};

const STEP_ORDER: Exclude<InvestmentStep, "complete" | "error">[] = [
  "preparing",
  "signing",
  "submitting",
  "confirming",
];

interface TransactionTimelineProps {
  currentStep: InvestmentStep;
  authType: AuthType;
  className?: string;
}

export function TransactionTimeline({ currentStep, authType, className }: TransactionTimelineProps) {
  const timeline = authType === "wallet" ? WALLET_TIMELINE : PASSKEY_TIMELINE;
  const currentIndex = STEP_ORDER.indexOf(currentStep as Exclude<InvestmentStep, "complete" | "error">);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <h3 className="text-center text-lg font-semibold text-[#F0EBE0] font-serif mb-5">
        Confirming Your Investment
      </h3>

      {/* Vertical timeline */}
      <div className="flex flex-col gap-0 px-4">
        {STEP_ORDER.map((step, index) => {
          const config = timeline[step];
          const Icon = config.icon;
          const isCompleted = index < currentIndex || currentStep === "complete";
          const isCurrent = index === currentIndex && currentStep !== "complete";
          const isFuture = index > currentIndex && currentStep !== "complete";

          return (
            <div key={step}>
              {/* Step row */}
              <div className="flex items-center gap-4">
                {/* Icon circle */}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-full transition-all duration-500",
                      isCompleted && "bg-forge-teal/15",
                      isCurrent && "bg-forge-copper/15",
                      isFuture && "opacity-40 bg-[rgba(232,180,184,0.05)]"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle
                        className="h-5 w-5 text-forge-teal animate-[checkDraw_0.4s_ease-out_both]"
                      />
                    ) : (
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          isCurrent ? "text-forge-copper" : "text-[#5A5347]"
                        )}
                      />
                    )}
                  </div>
                  {/* Spinning arc for current step */}
                  {isCurrent && (
                    <svg
                      className="absolute inset-0 h-10 w-10 animate-timeline-spin"
                      viewBox="0 0 40 40"
                    >
                      <circle
                        cx="20" cy="20" r="18"
                        fill="none"
                        stroke="#E8B4B8"
                        strokeWidth="3"
                        strokeDasharray="70 43"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-sm font-semibold transition-colors duration-300",
                      isCompleted && "text-forge-teal",
                      isCurrent && "text-[#F0EBE0]",
                      isFuture && "text-[#5A5347]"
                    )}
                  >
                    {config.label}
                  </div>
                  <div
                    className={cn(
                      "text-xs transition-colors duration-300",
                      isFuture ? "text-[#3A3530]" : "text-[#B8A99A]"
                    )}
                  >
                    {config.description}
                  </div>
                </div>

                {/* Time estimate */}
                <div
                  className={cn(
                    "text-xs tabular-nums font-medium shrink-0",
                    isCompleted && "text-forge-teal",
                    isCurrent && "text-forge-copper",
                    isFuture && "text-[#3A3530]"
                  )}
                >
                  {isCompleted ? "Done" : config.estimate}
                </div>
              </div>

              {/* Connector line */}
              {index < STEP_ORDER.length - 1 && (
                <div className="ml-5 flex justify-center">
                  <div
                    className={cn(
                      "w-px h-3 transition-colors duration-500",
                      index < currentIndex ? "bg-forge-teal/30" : "bg-[rgba(232,180,184,0.08)]"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
