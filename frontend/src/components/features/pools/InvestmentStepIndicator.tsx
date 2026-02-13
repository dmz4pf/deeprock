"use client";

import { CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type InvestmentStep =
  | "preparing"
  | "signing"
  | "submitting"
  | "confirming"
  | "complete"
  | "error";

export type AuthType = "wallet" | "passkey";

interface InvestmentStepIndicatorProps {
  currentStep: InvestmentStep;
  authType: AuthType;
  className?: string;
}

interface StepConfig {
  label: string;
  description: string;
}

const WALLET_STEPS: Record<Exclude<InvestmentStep, "error">, StepConfig> = {
  preparing: {
    label: "Preparing Permit",
    description: "Generating signature request...",
  },
  signing: {
    label: "Sign in Wallet",
    description: "Approve the transaction in your wallet",
  },
  submitting: {
    label: "Submitting",
    description: "Sending to the relayer...",
  },
  confirming: {
    label: "Confirming",
    description: "Waiting for blockchain confirmation...",
  },
  complete: {
    label: "Complete",
    description: "Transaction confirmed!",
  },
};

const PASSKEY_STEPS: Record<Exclude<InvestmentStep, "error">, StepConfig> = {
  preparing: {
    label: "Preparing UserOp",
    description: "Building transaction...",
  },
  signing: {
    label: "Authenticate",
    description: "Verify with biometrics",
  },
  submitting: {
    label: "Bundling",
    description: "Submitting to bundler...",
  },
  confirming: {
    label: "Confirming",
    description: "Waiting for confirmation...",
  },
  complete: {
    label: "Complete",
    description: "Investment successful!",
  },
};

const STEP_ORDER: Exclude<InvestmentStep, "error">[] = [
  "preparing",
  "signing",
  "submitting",
  "confirming",
  "complete",
];

/**
 * Visual progress indicator for the gasless investment flow
 * Shows different steps based on auth type (wallet vs passkey)
 */
export function InvestmentStepIndicator({
  currentStep,
  authType,
  className,
}: InvestmentStepIndicatorProps) {
  const steps = authType === "wallet" ? WALLET_STEPS : PASSKEY_STEPS;

  if (currentStep === "error") {
    return null;
  }

  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current step info */}
      <div className="text-center">
        <p className="text-lg font-medium text-[#F0EBE0]">
          {steps[currentStep].label}
        </p>
        <p className="text-sm text-[#B8A99A]">
          {steps[currentStep].description}
        </p>
      </div>

      {/* Step progress dots */}
      <div className="flex items-center justify-center gap-2">
        {STEP_ORDER.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={step}
              className="flex items-center"
            >
              <div
                className={cn(
                  "flex h-3 w-3 items-center justify-center rounded-full transition-all duration-300",
                  isCompleted && "bg-forge-teal",
                  isCurrent && "bg-forge-copper ring-2 ring-forge-copper/30",
                  isPending && "bg-forge-copper/10"
                )}
              >
                {isCompleted && (
                  <CheckCircle className="h-2 w-2 text-white" />
                )}
                {isCurrent && (
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                )}
              </div>
              {index < STEP_ORDER.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-6 transition-colors duration-300",
                    isCompleted ? "bg-forge-teal" : "bg-forge-copper/10"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels (optional, for larger displays) */}
      <div className="hidden sm:flex items-center justify-between text-xs text-[#5A5347]">
        {STEP_ORDER.slice(0, 4).map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <span
              key={step}
              className={cn(
                "transition-colors",
                isCompleted && "text-forge-teal",
                isCurrent && "text-forge-copper"
              )}
            >
              {steps[step].label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact inline step indicator showing current step
 */
export function InvestmentStepBadge({
  currentStep,
  authType,
  className,
}: InvestmentStepIndicatorProps) {
  const steps = authType === "wallet" ? WALLET_STEPS : PASSKEY_STEPS;

  if (currentStep === "error") {
    return null;
  }

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const isComplete = currentStep === "complete";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
        isComplete
          ? "bg-forge-teal/10 text-forge-teal"
          : "bg-forge-copper/10 text-forge-copper",
        className
      )}
    >
      {isComplete ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      <span>{steps[currentStep].label}</span>
      <span className="text-xs text-[#5A5347]">
        {currentIndex + 1}/{STEP_ORDER.length}
      </span>
    </div>
  );
}
