"use client";

import { useState, useEffect } from "react";
import { poolApi, type PortfolioHolding } from "@/lib/api";
import { getExplorerTxUrl } from "@/lib/chain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  ArrowDownRight,
  Unlock,
  Lock,
  Send,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

type Step = "amount" | "review" | "pending" | "success" | "error";

interface RedemptionFormProps {
  holding: PortfolioHolding;
  onComplete?: () => void;
  onCancel?: () => void;
}

// Convert value to readable number
// Handles both decimal strings ("1.0238") and BigInt strings ("1023800")
function formatValue(value: string, decimals: number): number {
  if (value.includes('.')) {
    return parseFloat(value);
  }
  try {
    const num = BigInt(value);
    return Number(num) / Math.pow(10, decimals);
  } catch {
    return parseFloat(value) || 0;
  }
}

function formatUSDC(value: string): number {
  return formatValue(value, 6);
}

function formatNAV(value: string): number {
  return formatValue(value, 8);
}

function toSharesAmount(shares: string): string {
  const num = parseFloat(shares) || 0;
  return Math.floor(num * 1_000_000).toString();
}

// --- Redemption Timeline (simplified 2-step) ---

type RedemptionPhase = "submitting" | "confirming";

const REDEMPTION_STEPS: { key: RedemptionPhase; icon: React.ElementType; label: string; description: string; estimate: string }[] = [
  { key: "submitting", icon: Send, label: "Processing", description: "Submitting to the network", estimate: "~5s" },
  { key: "confirming", icon: ShieldCheck, label: "Confirming", description: "Blockchain confirmation", estimate: "~15s" },
];

function RedemptionTimeline({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-center text-lg font-semibold text-[#F0EBE0] font-serif mb-5">
        Processing Redemption
      </h3>
      <div className="flex flex-col gap-0 px-4">
        {REDEMPTION_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = index === 0;
          const isFuture = index > 0;

          return (
            <div key={step.key}>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-full transition-all duration-500",
                      isCurrent && "bg-forge-rose-gold/15",
                      isFuture && "opacity-40 bg-[rgba(232,180,184,0.05)]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors duration-300",
                        isCurrent ? "text-forge-rose-gold" : "text-[#5A5347]"
                      )}
                    />
                  </div>
                  {isCurrent && (
                    <svg
                      className="absolute inset-0 h-10 w-10 animate-[timelineSpin_0.9s_linear_infinite]"
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

                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-sm font-semibold transition-colors duration-300",
                      isCurrent && "text-[#F0EBE0]",
                      isFuture && "text-[#5A5347]"
                    )}
                  >
                    {step.label}
                  </div>
                  <div
                    className={cn(
                      "text-xs transition-colors duration-300",
                      isFuture ? "text-[#3A3530]" : "text-[#B8A99A]"
                    )}
                  >
                    {step.description}
                  </div>
                </div>

                <div
                  className={cn(
                    "text-xs tabular-nums font-medium shrink-0",
                    isCurrent && "text-forge-rose-gold",
                    isFuture && "text-[#3A3530]"
                  )}
                >
                  {step.estimate}
                </div>
              </div>

              {index < REDEMPTION_STEPS.length - 1 && (
                <div className="ml-5 flex justify-center">
                  <div className="w-px h-3 bg-[rgba(232,180,184,0.08)]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Form ---

export function RedemptionForm({ holding, onComplete, onCancel }: RedemptionFormProps) {
  const [step, setStep] = useState<Step>("amount");
  const [sharesInput, setSharesInput] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unlock animation: show locked first, unlock after 0.5s
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    if (step === "success") {
      const t = setTimeout(() => setUnlocked(true), 500);
      return () => clearTimeout(t);
    } else {
      setUnlocked(false);
    }
  }, [step]);

  const totalShares = formatUSDC(holding.totalShares);
  const currentValue = formatUSDC(holding.currentValue);
  const navPerShare = formatNAV(holding.navPerShare);
  const sharesNum = parseFloat(sharesInput) || 0;
  const isValidShares = sharesNum > 0 && sharesNum <= totalShares;
  const expectedReturn = sharesNum * navPerShare;

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidShares) {
      setStep("review");
    }
  };

  const handleRedeem = async () => {
    try {
      setError(null);
      setStep("pending");
      setIsSubmitting(true);

      const sharesAmount = toSharesAmount(sharesInput);
      const result = await poolApi.redeem(holding.poolId, sharesAmount);

      if (result.success && result.redemption) {
        setTxHash(result.redemption.txHash || result.onChain?.txHash || "");
        setStep("success");
      } else {
        throw new Error("Redemption failed");
      }
    } catch (err: unknown) {
      console.error("Redemption error:", err);
      let message = "Redemption failed. Please try again.";

      if (err && typeof err === "object" && "code" in err) {
        const apiError = err as { code: string; daysRemaining?: number; unlockDate?: string };
        if (apiError.code === "POSITION_LOCKED") {
          message = `Your position is locked. ${apiError.daysRemaining} day(s) remaining until unlock.`;
        } else if (apiError.code === "INSUFFICIENT_SHARES") {
          message = "You don't have enough shares to redeem.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setStep("review");
  };

  const quickPercentages = [25, 50, 75, 100];

  return (
    <div className="space-y-6">
      {/* Step: Amount */}
      {step === "amount" && (
        <form onSubmit={handleAmountSubmit} className="space-y-4">
          <div
            className="rounded-lg p-4 space-y-2 border border-forge-copper/10"
            style={{ background: "rgba(232,180,184,0.03)" }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-[#B8A99A]">Your Shares</span>
              <span className="font-medium text-[#F0EBE0]">{totalShares.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#B8A99A]">Current Value</span>
              <span className="font-medium text-forge-teal">${currentValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#B8A99A]">NAV per Share</span>
              <span className="font-medium text-[#F0EBE0]">${navPerShare.toFixed(4)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shares" className="text-[#B8A99A]">
              Shares to Redeem
            </Label>
            <div className="relative">
              <Input
                id="shares"
                type="number"
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
                placeholder="0"
                min={0}
                max={totalShares}
                step="0.01"
                className="bg-forge-copper/5 border-forge-copper/10 text-[#F0EBE0] placeholder:text-[#5A5347]"
              />
            </div>
            <p className="text-xs text-[#5A5347]">
              Max: {totalShares.toLocaleString()} shares
            </p>
          </div>

          {/* Quick percentage buttons */}
          <div className="flex gap-2">
            {quickPercentages.map((pct) => {
              const quickShares = (totalShares * pct) / 100;
              return (
                <Button
                  key={pct}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 border-forge-copper/10 text-[#B8A99A] hover:bg-forge-copper/5",
                    Math.abs(sharesNum - quickShares) < 0.01 && "border-forge-rose-gold text-forge-rose-gold"
                  )}
                  onClick={() => setSharesInput(quickShares.toFixed(2))}
                >
                  {pct}%
                </Button>
              );
            })}
          </div>

          {sharesNum > 0 && (
            <div className="bg-forge-rose-gold/10 border border-forge-rose-gold/20 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#B8A99A]">Expected Return</span>
                <span className="font-medium text-forge-rose-gold">${expectedReturn.toFixed(2)} USDC</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-forge-copper/10 text-[#B8A99A] hover:bg-forge-copper/5"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-forge-rose-gold to-forge-danger hover:from-forge-rose-gold/90 hover:to-forge-danger/90"
              disabled={!isValidShares}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="space-y-6">
          <div
            className="rounded-lg p-4 space-y-3 border border-forge-copper/10"
            style={{ background: "rgba(232,180,184,0.03)" }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-[#B8A99A]">Pool</span>
              <span className="font-medium text-[#F0EBE0]">{holding.poolName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#B8A99A]">Shares to Redeem</span>
              <span className="font-medium text-[#F0EBE0]">{sharesNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#B8A99A]">NAV per Share</span>
              <span className="font-medium text-[#F0EBE0]">${navPerShare.toFixed(4)}</span>
            </div>
            <div className="border-t border-forge-copper/10 pt-3 flex justify-between text-sm">
              <span className="text-[#B8A99A]">You Receive</span>
              <span className="font-bold text-forge-rose-gold">${expectedReturn.toFixed(2)} USDC</span>
            </div>
          </div>

          <div className="bg-forge-rose-gold/10 border border-forge-rose-gold/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ArrowDownRight className="h-5 w-5 text-forge-rose-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#F0EBE0]">Redemption Notice</p>
                <p className="text-xs text-[#B8A99A] mt-1">
                  USDC will be returned to your wallet. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-forge-copper/10 text-[#B8A99A] hover:bg-forge-copper/5"
              onClick={() => setStep("amount")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-forge-rose-gold to-forge-danger hover:from-forge-rose-gold/90 hover:to-forge-danger/90"
              onClick={handleRedeem}
              disabled={isSubmitting}
            >
              <ArrowDownRight className="mr-2 h-4 w-4" />
              Confirm Redemption
            </Button>
          </div>
        </div>
      )}

      {/* Step: Pending — Narrative Timeline */}
      {step === "pending" && (
        <div className="py-6 space-y-5">
          <RedemptionTimeline />

          <p className="text-center text-xs text-[#5A5347]">
            Your USDC will arrive in your wallet shortly
          </p>
        </div>
      )}

      {/* Step: Success — Unlock & Lift */}
      {step === "success" && (
        <div className="text-center py-6 animate-[cardLift_0.4s_ease-out_0.3s_both]">
          {/* Unlock icon — lock → unlock transition */}
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-forge-rose-gold/10 mb-6 animate-[morphLock_0.5s_ease-out_both]">
            {unlocked ? (
              <Unlock className="h-8 w-8 text-forge-rose-gold animate-[checkDraw_0.4s_ease-out_both]" />
            ) : (
              <Lock className="h-8 w-8 text-forge-rose-gold" />
            )}
          </div>

          {/* Amount — large serif, staggered fade */}
          <p className="text-2xl font-bold text-[#F0EBE0] font-serif animate-[fadeInUp_0.6s_ease-out_0.5s_both]">
            ${expectedReturn.toFixed(2)}
          </p>
          <p className="text-sm text-[#B8A99A] animate-[fadeInUp_0.6s_ease-out_0.7s_both]">
            {holding.poolName}
          </p>

          {/* TxHash + actions fade in last */}
          <div className="mt-6 space-y-4 animate-[fadeInUp_0.6s_ease-out_0.9s_both]">
            {txHash && (
              <div
                className="rounded-lg p-3 text-left"
                style={{ background: "rgba(232,180,184,0.03)", border: "1px solid rgba(232,180,184,0.05)" }}
              >
                <p className="text-xs text-[#5A5347] mb-1">Transaction Hash</p>
                <p className="text-xs font-mono text-[#B8A99A] break-all">{txHash}</p>
              </div>
            )}

            {txHash && (
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-forge-rose-gold hover:text-forge-rose-gold/80 transition-colors"
              >
                View on Snowtrace
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <Button
              className="w-full bg-gradient-to-r from-forge-rose-gold to-forge-danger hover:from-forge-rose-gold/90 hover:to-forge-danger/90"
              onClick={onComplete}
            >
              Done
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

          <div className="bg-forge-danger/10 border border-forge-danger/20 rounded-lg p-4">
            <p className="text-base font-medium text-[#F0EBE0] mb-1">
              Redemption Failed
            </p>
            <p className="text-sm text-[#B8A99A]">
              {error || "Something went wrong. Please try again."}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-forge-copper/10 text-[#B8A99A] hover:bg-forge-copper/5"
              onClick={() => {
                setError(null);
                setStep("amount");
              }}
            >
              Start Over
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-forge-rose-gold to-forge-danger hover:from-forge-rose-gold/90 hover:to-forge-danger/90"
              onClick={handleRetry}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
