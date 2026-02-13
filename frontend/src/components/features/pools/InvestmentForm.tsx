"use client";

import { useState, useEffect } from "react";
import { gaslessInvestmentFlow, type GaslessFlowState } from "@/lib/flows/gasless-investment-flow";
import { getExplorerTxUrl } from "@/lib/chain";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  CheckCircle,
  Loader2,
  Fingerprint,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Lock,
  LockOpen,
  Check,
} from "lucide-react";
import { GasSavingsDisplay } from "./GasSavingsDisplay";
import {
  type InvestmentStep,
} from "./InvestmentStepIndicator";
import { TransactionTimeline } from "./TransactionTimeline";
import { parseInvestmentError, type InvestmentError } from "@/lib/investment-errors";
import { useAuthStore } from "@/stores/authStore";

type Step = "amount" | "review" | "signing" | "pending" | "success" | "error";

interface InvestmentFormProps {
  pool: {
    id: string;
    name: string;
    minInvestment: string;
    maxInvestment: string;
    yieldRate: number;
    navPerShare?: string;
  };
  onComplete?: () => void;
  categoryColor?: string; // glowRgb e.g. "232,180,184"
}

// Convert BigInt string (6 decimals) to readable number
function formatUSDC(value: string): number {
  const num = BigInt(value);
  return Number(num) / 1_000_000;
}

// Convert user-entered amount to BigInt string (6 decimals)
function toUSDCAmount(amount: string): string {
  const num = parseFloat(amount) || 0;
  return Math.floor(num * 1_000_000).toString();
}

const STEP_LABELS = ["Amount", "Review", "Confirm"] as const;

export function InvestmentForm({ pool, onComplete, categoryColor = "232,180,184" }: InvestmentFormProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsedError, setParsedError] = useState<InvestmentError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investmentStep, setInvestmentStep] = useState<InvestmentStep>("preparing");

  const user = useAuthStore((s) => s.user);
  const authType = user?.authProvider === "WALLET" ? "wallet" : "passkey";
  const rgb = categoryColor;

  // Lock animation: show open lock first, close after 0.5s
  const [lockClosed, setLockClosed] = useState(false);
  useEffect(() => {
    if (step === "success") {
      const t = setTimeout(() => setLockClosed(true), 500);
      return () => clearTimeout(t);
    } else {
      setLockClosed(false);
    }
  }, [step]);

  // Parse min/max from BigInt strings (6 decimals)
  const minAmount = formatUSDC(pool.minInvestment);
  const maxAmount = formatUSDC(pool.maxInvestment);
  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum >= minAmount && amountNum <= maxAmount;

  // Subscribe to gasless investment flow state
  useEffect(() => {
    const unsubscribe = gaslessInvestmentFlow.subscribe((flowState: GaslessFlowState) => {
      switch (flowState.step) {
        case "checking":
        case "building":
          setStep("signing");
          setInvestmentStep("preparing");
          break;
        case "signing":
          setStep("signing");
          setInvestmentStep("signing");
          break;
        case "submitting":
          setStep("pending");
          setInvestmentStep("submitting");
          if (flowState.txHash) setTxHash(flowState.txHash);
          break;
        case "confirming":
          setStep("pending");
          setInvestmentStep("confirming");
          if (flowState.txHash) setTxHash(flowState.txHash);
          break;
        case "complete":
          setStep("success");
          setInvestmentStep("complete");
          if (flowState.txHash) setTxHash(flowState.txHash);
          break;
        case "error":
          setStep("error");
          setInvestmentStep("error");
          setError(flowState.error || "Investment failed");
          setParsedError(parseInvestmentError(flowState.error));
          break;
      }
    });

    return () => {
      unsubscribe();
      gaslessInvestmentFlow.abort();
    };
  }, []);

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidAmount) {
      setStep("review");
    }
  };

  const handleSign = async () => {
    try {
      setError(null);
      setStep("signing");
      setIsSubmitting(true);

      const usdcAmount = toUSDCAmount(amount);
      await gaslessInvestmentFlow.invest(pool.id, usdcAmount);
    } catch (err: unknown) {
      console.error("Investment error:", err);
      const message = err instanceof Error ? err.message : "Investment failed. Please try again.";
      setError(message);
      setParsedError(parseInvestmentError(err));
      setInvestmentStep("error");
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setParsedError(null);
    setInvestmentStep("preparing");
    setStep("review");
  };

  const estimatedYield = (amountNum * pool.yieldRate / 100).toFixed(2);
  const navPerShare = pool.navPerShare ? parseFloat(pool.navPerShare) : 1.0;
  const estimatedShares = navPerShare > 0 ? amountNum / navPerShare : amountNum;

  // Current step number for the indicator
  const currentStepNum = step === "amount" ? 1 : step === "review" ? 2 : 3;

  // Gradient divider helper
  const Divider = () => (
    <div
      style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, rgba(${rgb}, 0.15), transparent)`,
        margin: "16px 0",
      }}
    />
  );

  return (
    <div className="space-y-5">
      {/* Title section */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#F0EBE0", margin: 0 }}>
          Invest in {pool.name}
        </h3>
        <p style={{ fontSize: 13, color: "#B8A99A", marginTop: 4 }}>
          Earn {pool.yieldRate}% APY on your investment
        </p>
      </div>

      <Divider />

      {/* Premium Step Indicator */}
      <div style={{ position: "relative", padding: "0 12px" }}>
        {/* Background connector line */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 40,
            right: 40,
            height: 2,
            background: `rgba(${rgb}, 0.06)`,
            borderRadius: 1,
          }}
        />
        {/* Progress fill */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 40,
            width: currentStepNum === 1 ? "0%" : currentStepNum === 2 ? "calc(50% - 20px)" : "calc(100% - 80px)",
            height: 2,
            background: `rgba(${rgb}, 0.3)`,
            borderRadius: 1,
            transition: "width 300ms ease",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
          {STEP_LABELS.map((label, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < currentStepNum;
            const isCurrent = stepNum === currentStepNum;

            return (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all 300ms ease",
                    background: isCompleted
                      ? `rgba(${rgb}, 0.25)`
                      : isCurrent
                      ? `rgba(${rgb}, 0.15)`
                      : `rgba(${rgb}, 0.04)`,
                    border: `1.5px solid ${
                      isCompleted
                        ? `rgba(${rgb}, 0.4)`
                        : isCurrent
                        ? `rgba(${rgb}, 0.4)`
                        : `rgba(${rgb}, 0.08)`
                    }`,
                    color: isCompleted || isCurrent ? `rgb(${rgb})` : "#5A5347",
                    boxShadow: isCurrent ? `0 0 12px rgba(${rgb}, 0.2)` : "none",
                  }}
                >
                  {isCompleted ? <Check size={14} /> : stepNum}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? `rgb(${rgb})` : "#5A5347",
                    transition: "color 300ms ease",
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Divider />

      {/* Step: Amount */}
      {step === "amount" && (
        <form onSubmit={handleAmountSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" style={{ color: "#B8A99A", fontSize: 13 }}>
              Investment Amount (USDC)
            </Label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#B8A99A", transition: "color 200ms ease" }}
              >
                $
              </span>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={minAmount}
                max={maxAmount}
                step="0.01"
                className="w-full"
                style={{
                  paddingLeft: 28,
                  paddingRight: 12,
                  paddingTop: 10,
                  paddingBottom: 10,
                  fontSize: 15,
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.2)",
                  border: `1px solid rgba(${rgb}, 0.1)`,
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                  color: "#F0EBE0",
                  outline: "none",
                  transition: "border-color 200ms ease, box-shadow 200ms ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = `rgba(${rgb}, 0.3)`;
                  e.currentTarget.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 3px rgba(${rgb}, 0.08)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = `rgba(${rgb}, 0.1)`;
                  e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: "#5A5347" }}>
              Min: ${minAmount.toLocaleString()} &bull; Max: ${maxAmount.toLocaleString()}
            </p>
          </div>

          {/* Validation error messages */}
          {amountNum > 0 && amountNum < minAmount && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                background: "rgba(235,87,87,0.08)",
                border: "1px solid rgba(235,87,87,0.15)",
              }}
            >
              <AlertCircle className="h-4 w-4 text-forge-danger shrink-0" />
              <p className="text-sm text-forge-danger">
                Minimum investment is ${minAmount.toLocaleString()} USDC
              </p>
            </div>
          )}
          {amountNum > maxAmount && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                background: "rgba(235,87,87,0.08)",
                border: "1px solid rgba(235,87,87,0.15)",
              }}
            >
              <AlertCircle className="h-4 w-4 text-forge-danger shrink-0" />
              <p className="text-sm text-forge-danger">
                Maximum investment is ${maxAmount.toLocaleString()} USDC
              </p>
            </div>
          )}

          {/* Quick amounts */}
          <div className="flex gap-2">
            {[minAmount, minAmount * 2, minAmount * 4, minAmount * 10]
              .filter(q => q <= maxAmount)
              .slice(0, 4)
              .map((quickAmount) => {
                const isSelected = amountNum === quickAmount;
                return (
                  <button
                    key={quickAmount}
                    type="button"
                    className="flex-1 text-sm font-medium rounded-lg py-2 cursor-pointer"
                    style={{
                      background: isSelected ? `rgba(${rgb}, 0.12)` : `rgba(${rgb}, 0.04)`,
                      border: `1px solid ${isSelected ? `rgba(${rgb}, 0.3)` : `rgba(${rgb}, 0.08)`}`,
                      color: isSelected ? `rgb(${rgb})` : "#B8A99A",
                      boxShadow: isSelected ? `0 0 8px rgba(${rgb}, 0.1)` : "none",
                      transition: "all 200ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = `rgba(${rgb}, 0.08)`;
                        e.currentTarget.style.borderColor = `rgba(${rgb}, 0.15)`;
                        e.currentTarget.style.color = `rgb(${rgb})`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = `rgba(${rgb}, 0.04)`;
                        e.currentTarget.style.borderColor = `rgba(${rgb}, 0.08)`;
                        e.currentTarget.style.color = "#B8A99A";
                      }
                    }}
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    ${quickAmount.toLocaleString()}
                  </button>
                );
              })}
          </div>

          {/* Estimated shares display */}
          {amountNum > 0 && (
            <>
              <Divider />
              <div
                className="rounded-lg p-3"
                style={{
                  background: `rgba(${rgb}, 0.04)`,
                  border: `1px solid rgba(${rgb}, 0.08)`,
                }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#B8A99A" }}>Estimated Shares</span>
                  <span style={{ fontWeight: 600, color: `rgb(${rgb})` }}>
                    {estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} shares
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "#5A5347", marginTop: 4 }}>
                  @ ${navPerShare.toFixed(4)} NAV per share
                </p>
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-forge-copper to-forge-violet hover:from-forge-copper/90 hover:to-forge-violet/90"
            style={{
              boxShadow: `0 4px 20px rgba(${rgb}, 0.2)`,
            }}
            disabled={!isValidAmount}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="space-y-5">
          {/* Gas Savings Display - Prominent */}
          <GasSavingsDisplay
            variant="prominent"
            estimatedGasCost="~0.02 AVAX"
            usdValue="$0.45"
          />

          <div
            className="rounded-lg p-4 space-y-3"
            style={{ background: `rgba(${rgb}, 0.03)`, border: `1px solid rgba(${rgb}, 0.05)` }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: "#B8A99A" }}>Investment Amount</span>
              <span style={{ fontWeight: 500, color: "#F0EBE0" }}>${amount} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#B8A99A" }}>Shares You Receive</span>
              <span style={{ fontWeight: 500, color: `rgb(${rgb})` }}>
                {estimatedShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} @ ${navPerShare.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "#B8A99A" }}>Expected Annual Yield</span>
              <span className="font-medium text-forge-teal">${estimatedYield} ({pool.yieldRate}%)</span>
            </div>
            <div
              className="pt-3 flex justify-between text-sm"
              style={{ borderTop: `1px solid rgba(${rgb}, 0.05)` }}
            >
              <span style={{ color: "#B8A99A" }}>You Pay</span>
              <span style={{ fontWeight: 700, color: "#F0EBE0" }}>${amount} USDC</span>
            </div>
          </div>

          <div
            className="rounded-lg p-4"
            style={{
              background: `rgba(${rgb}, 0.04)`,
              border: `1px solid rgba(${rgb}, 0.08)`,
            }}
          >
            <div className="flex items-start gap-3">
              <Fingerprint className="h-5 w-5 shrink-0 mt-0.5" style={{ color: `rgb(${rgb})` }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#F0EBE0" }}>Biometric Authentication Required</p>
                <p style={{ fontSize: 12, color: "#B8A99A", marginTop: 4 }}>
                  You&apos;ll need to verify your identity using Face ID, Touch ID, or your device&apos;s biometrics.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg cursor-pointer text-sm font-medium"
              style={{
                background: "transparent",
                border: `1px solid rgba(${rgb}, 0.1)`,
                color: "#B8A99A",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${rgb}, 0.04)`;
                e.currentTarget.style.borderColor = `rgba(${rgb}, 0.15)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = `rgba(${rgb}, 0.1)`;
              }}
              onClick={() => setStep("amount")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <Button
              className="flex-1 bg-gradient-to-r from-forge-copper to-forge-violet hover:from-forge-copper/90 hover:to-forge-violet/90"
              style={{
                boxShadow: `0 4px 20px rgba(${rgb}, 0.2)`,
              }}
              onClick={handleSign}
              disabled={isSubmitting}
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              Confirm with Biometrics
            </Button>
          </div>
        </div>
      )}

      {/* Step: Transaction Processing (signing + pending merged) */}
      {(step === "signing" || step === "pending") && (
        <div className="py-6 space-y-5">
          <TransactionTimeline
            currentStep={investmentStep}
            authType={authType}
          />

          {txHash && (
            <div
              className="rounded-lg p-3 text-center"
              style={{ background: `rgba(${rgb}, 0.03)`, border: `1px solid rgba(${rgb}, 0.05)` }}
            >
              <p style={{ fontSize: 11, color: "#5A5347", marginBottom: 4 }}>Transaction Hash</p>
              <p style={{ fontSize: 11, fontFamily: "monospace", color: "#B8A99A", wordBreak: "break-all" }}>
                {txHash.slice(0, 20)}...{txHash.slice(-8)}
              </p>
            </div>
          )}

          <GasSavingsDisplay variant="compact" className="justify-center" />
        </div>
      )}

      {/* Step: Success — Lock & Lift */}
      {step === "success" && (
        <div className="text-center py-6 animate-[cardLift_0.4s_ease-out_0.3s_both]">
          <div
            className="inline-flex items-center justify-center h-16 w-16 rounded-full mb-6 animate-[morphLock_0.5s_ease-out_both]"
            style={{ background: "rgba(111,207,151,0.1)" }}
          >
            {lockClosed ? (
              <Lock className="h-8 w-8 text-forge-teal animate-[checkDraw_0.4s_ease-out_both]" />
            ) : (
              <LockOpen className="h-8 w-8 text-forge-teal" />
            )}
          </div>

          <p className="text-2xl font-bold text-[#F0EBE0] font-serif animate-[fadeInUp_0.6s_ease-out_0.5s_both]">
            ${amount}
          </p>
          <p className="text-sm text-[#B8A99A] animate-[fadeInUp_0.6s_ease-out_0.7s_both]">
            {pool.name}
          </p>

          <div className="mt-6 space-y-4 animate-[fadeInUp_0.6s_ease-out_0.9s_both]">
            {txHash && (
              <div
                className="rounded-lg p-3 text-left"
                style={{ background: `rgba(${rgb}, 0.03)`, border: `1px solid rgba(${rgb}, 0.05)` }}
              >
                <p style={{ fontSize: 11, color: "#5A5347", marginBottom: 4 }}>Transaction Hash</p>
                <p style={{ fontSize: 11, fontFamily: "monospace", color: "#B8A99A", wordBreak: "break-all" }}>{txHash}</p>
              </div>
            )}

            {txHash && (
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm transition-colors"
                style={{ color: `rgb(${rgb})` }}
              >
                View on Snowtrace
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <Button
              className="w-full bg-gradient-to-r from-forge-copper to-forge-violet hover:from-forge-copper/90 hover:to-forge-violet/90"
              style={{
                boxShadow: `0 4px 20px rgba(${rgb}, 0.2)`,
              }}
              onClick={onComplete}
            >
              View Portfolio
            </Button>
          </div>
        </div>
      )}

      {/* Step: Error */}
      {step === "error" && (
        <div className="py-4 space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-forge-danger/10 mb-4">
              <AlertCircle className="h-8 w-8 text-forge-danger" />
            </div>
          </div>

          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(235,87,87,0.08)",
              border: "1px solid rgba(235,87,87,0.15)",
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 500, color: "#F0EBE0", marginBottom: 4 }}>
              {parsedError?.title || "Investment Failed"}
            </p>
            <p style={{ fontSize: 14, color: "#B8A99A" }}>
              {parsedError?.message || error || "Something went wrong. Please try again."}
            </p>
            {parsedError?.code && parsedError.code !== "UNKNOWN" && (
              <p style={{ fontSize: 11, color: "#5A5347", marginTop: 8 }}>
                Error code: {parsedError.code}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 py-2.5 rounded-lg cursor-pointer text-sm font-medium"
              style={{
                background: "transparent",
                border: `1px solid rgba(${rgb}, 0.1)`,
                color: "#B8A99A",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${rgb}, 0.04)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              onClick={() => {
                setError(null);
                setParsedError(null);
                setStep("amount");
              }}
            >
              Start Over
            </button>
            {parsedError?.recoverable !== false && (
              <Button
                className="flex-1 bg-gradient-to-r from-forge-copper to-forge-violet hover:from-forge-copper/90 hover:to-forge-violet/90"
                style={{
                  boxShadow: `0 4px 20px rgba(${rgb}, 0.2)`,
                }}
                onClick={handleRetry}
              >
                {parsedError?.action || "Try Again"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
