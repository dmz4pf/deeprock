"use client";

import { Shield, ShieldCheck, ExternalLink, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getExplorerTxUrl } from "@/lib/chain";
import type { InvestmentStep, AuthType } from "./InvestmentStepIndicator";

// ─── Step Configuration ───

interface StepConfig {
  label: string;
  shortLabel: string;
}

const PASSKEY_STEPS: Record<Exclude<InvestmentStep, "complete" | "error">, StepConfig> = {
  preparing: { label: "Preparing transaction", shortLabel: "Prepare" },
  signing: { label: "Verify with biometrics", shortLabel: "Auth" },
  submitting: { label: "Submitting to network", shortLabel: "Submit" },
  confirming: { label: "Confirming on-chain", shortLabel: "Confirm" },
};

const WALLET_STEPS: Record<Exclude<InvestmentStep, "complete" | "error">, StepConfig> = {
  preparing: { label: "Generating permit", shortLabel: "Prepare" },
  signing: { label: "Approve in wallet", shortLabel: "Sign" },
  submitting: { label: "Submitting to network", shortLabel: "Submit" },
  confirming: { label: "Confirming on-chain", shortLabel: "Confirm" },
};

const STEP_ORDER: Exclude<InvestmentStep, "complete" | "error">[] = [
  "preparing",
  "signing",
  "submitting",
  "confirming",
];

// ─── Component ───

interface TransactionVaultProps {
  currentStep: InvestmentStep;
  authType: AuthType;
  amount?: string;
  poolName?: string;
  txHash?: string;
  categoryColor?: string;
  className?: string;
  /** Number of active steps (2 for redemption, 4 for investment) */
  totalSteps?: number;
  /** Map step indices for flows with fewer steps */
  stepMapping?: Exclude<InvestmentStep, "complete" | "error">[];
}

export function TransactionVault({
  currentStep,
  authType,
  amount,
  poolName,
  txHash,
  categoryColor = "232,180,184",
  className,
  totalSteps = 4,
  stepMapping,
}: TransactionVaultProps) {
  const steps = authType === "wallet" ? WALLET_STEPS : PASSKEY_STEPS;
  const activeSteps = stepMapping || STEP_ORDER.slice(0, totalSteps);
  const currentIndex = activeSteps.indexOf(
    currentStep as Exclude<InvestmentStep, "complete" | "error">
  );
  const isComplete = currentStep === "complete";

  // SVG ring geometry
  const ringSize = 120;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Progress: each completed step fills a segment
  const completedSteps = isComplete ? activeSteps.length : Math.max(0, currentIndex);
  const progressFraction = completedSteps / activeSteps.length;
  const dashOffset = circumference * (1 - progressFraction);

  // Current step label
  const currentLabel = isComplete
    ? "Investment Secured"
    : currentIndex >= 0
    ? steps[activeSteps[currentIndex]].label
    : "Initializing...";

  const rgb = categoryColor;

  return (
    <div
      className={cn(
        "flex flex-col items-center py-6 relative",
        className
      )}
    >
      {/* Success shimmer overlay */}
      {isComplete && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ top: -20 }}
        >
          <div
            className="rounded-full animate-[successShimmer_1.2s_ease-out_forwards]"
            style={{
              width: 120,
              height: 120,
              background: `radial-gradient(circle, rgba(111,207,151,0.25) 0%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* Orbital ring + central icon */}
      <div className="relative" style={{ width: ringSize, height: ringSize }}>
        {/* Ambient rotation ring (background) */}
        <svg
          className="absolute inset-0 animate-[orbitSpin_20s_linear_infinite] motion-reduce:hidden"
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          style={{ width: ringSize, height: ringSize }}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={`rgba(${rgb}, 0.06)`}
            strokeWidth={strokeWidth}
            strokeDasharray="4 8"
          />
        </svg>

        {/* Progress ring */}
        <svg
          className={cn(
            "absolute inset-0 -rotate-90",
            isComplete && "animate-[ringBurst_0.6s_ease-out_forwards]"
          )}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          style={{ width: ringSize, height: ringSize }}
        >
          {/* Track */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={`rgba(${rgb}, 0.08)`}
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={isComplete ? "rgb(111,207,151)" : `rgb(${rgb})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isComplete ? 0 : dashOffset}
            className="transition-all duration-800 ease-out motion-reduce:transition-none"
            style={{
              transitionDuration: "800ms",
              filter: isComplete ? "drop-shadow(0 0 6px rgba(111,207,151,0.4))" : "none",
            }}
          />
        </svg>

        {/* Central icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isComplete ? (
            <ShieldCheck
              className="animate-[checkDraw_0.4s_ease-out_both]"
              style={{
                width: 32,
                height: 32,
                color: "rgb(111,207,151)",
                filter: "drop-shadow(0 0 8px rgba(111,207,151,0.3))",
              }}
            />
          ) : (
            <Shield
              className="animate-[vaultBreathe_2s_ease-in-out_infinite] motion-reduce:animate-none"
              style={{
                width: 32,
                height: 32,
                color: `rgb(${rgb})`,
              }}
            />
          )}
        </div>
      </div>

      {/* Step label */}
      <p
        className="mt-4 text-sm font-medium transition-colors duration-300"
        style={{ color: isComplete ? "rgb(111,207,151)" : "#F0EBE0" }}
      >
        {currentLabel}
      </p>

      {/* Amount display */}
      {amount && (
        <p
          className={cn(
            "mt-1 text-2xl font-bold font-serif",
            !isComplete && "animate-[amountPulse_1.5s_ease-in-out_infinite] motion-reduce:animate-none"
          )}
          style={{
            color: "#F0EBE0",
            opacity: isComplete ? 1 : undefined,
          }}
        >
          {amount}
        </p>
      )}

      {/* Pool name */}
      {poolName && (
        <p className="mt-0.5 text-xs text-[#5A5347]">{poolName}</p>
      )}

      {/* Step dots */}
      <div className="mt-6 flex items-center gap-0">
        {activeSteps.map((step, index) => {
          const isStepComplete = index < completedSteps || isComplete;
          const isStepCurrent = index === currentIndex && !isComplete;
          const isStepFuture = index > currentIndex && !isComplete;

          return (
            <div key={step} className="flex items-center">
              {/* Dot */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-500",
                    isStepComplete && "h-5 w-5",
                    isStepCurrent && "h-5 w-5",
                    isStepFuture && "h-3 w-3"
                  )}
                  style={{
                    background: isStepComplete
                      ? "rgba(111,207,151,0.15)"
                      : isStepCurrent
                      ? `rgba(${rgb}, 0.15)`
                      : `rgba(${rgb}, 0.05)`,
                    boxShadow: isStepCurrent
                      ? `0 0 8px rgba(${rgb}, 0.25)`
                      : "none",
                  }}
                >
                  {isStepComplete && (
                    <CheckCircle
                      className="text-forge-teal animate-[checkDraw_0.4s_ease-out_both]"
                      style={{ width: 12, height: 12 }}
                    />
                  )}
                  {isStepCurrent && (
                    <div
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{ background: `rgb(${rgb})` }}
                    />
                  )}
                </div>
                {/* Label below dot */}
                <span
                  className="text-[10px] font-medium transition-colors duration-300"
                  style={{
                    color: isStepComplete
                      ? "rgb(111,207,151)"
                      : isStepCurrent
                      ? `rgb(${rgb})`
                      : "#3A3530",
                  }}
                >
                  {steps[step].shortLabel}
                </span>
              </div>

              {/* Connector line */}
              {index < activeSteps.length - 1 && (
                <div
                  className="h-px mx-2 transition-colors duration-500"
                  style={{
                    width: 24,
                    marginBottom: 20, // offset for the label
                    background: index < completedSteps
                      ? "rgba(111,207,151,0.3)"
                      : `rgba(${rgb}, 0.08)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Transaction hash link */}
      {txHash && (
        <a
          href={getExplorerTxUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
          style={{ color: `rgb(${rgb})` }}
        >
          <ExternalLink style={{ width: 12, height: 12 }} />
          View on Snowtrace
        </a>
      )}
    </div>
  );
}
