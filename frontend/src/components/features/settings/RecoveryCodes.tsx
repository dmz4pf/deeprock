"use client";

import { useState, useEffect } from "react";
import { recoveryApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Key,
  Shield,
  AlertTriangle,
  Copy,
  Download,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";

export function RecoveryCodes() {
  const [status, setStatus] = useState<{ total: number; unused: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const result = await recoveryApi.getStatus();
      setStatus({ total: result.total, unused: result.unused });
    } catch (err) {
      console.error("Failed to fetch recovery status:", err);
      // Status might fail if user has no codes yet - that's okay
      setStatus({ total: 0, unused: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (status && status.total > 0) {
      // If codes already exist, show confirmation
      setShowConfirmModal(true);
    } else {
      // First time generation
      generateCodes();
    }
  };

  const generateCodes = async () => {
    try {
      setError(null);
      setIsGenerating(true);
      setShowConfirmModal(false);

      const result = await recoveryApi.generateCodes();
      setCodes(result.codes);
      setShowCodesModal(true);

      // Refresh status after generation
      fetchStatus();
    } catch (err) {
      console.error("Failed to generate codes:", err);
      setError(err instanceof Error ? err.message : "Failed to generate codes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAll = async () => {
    if (codes) {
      const text = codes.join("\n");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (codes) {
      const text = `Deeprock Recovery Codes
Generated: ${new Date().toLocaleDateString()}

Keep these codes safe! Each code can only be used once.

${codes.map((code, i) => `${i + 1}. ${code}`).join("\n")}

If you lose access to your passkey, you can use one of these
codes along with email verification to recover your account.
`;
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "deeprock-recovery-codes.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCloseModal = () => {
    if (saved) {
      setShowCodesModal(false);
      setCodes(null);
      setSaved(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-forge-copper/10 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-forge-copper/5">
            <Key className="h-5 w-5 text-forge-text-3" />
          </div>
          <div>
            <p className="font-medium text-forge-text-1">Recovery Codes</p>
            <p className="text-sm text-forge-text-3">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveCodes = status && status.total > 0 && status.unused > 0;

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-forge-copper/10 p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-lg p-2",
              hasActiveCodes ? "bg-forge-teal/10" : "bg-forge-rose-gold/10"
            )}
          >
            <Key
              className={cn(
                "h-5 w-5",
                hasActiveCodes ? "text-forge-teal" : "text-forge-rose-gold"
              )}
            />
          </div>
          <div>
            <p className="font-medium text-forge-text-1">Recovery Codes</p>
            <p className="text-sm text-forge-text-3">
              {hasActiveCodes
                ? `${status.unused} of ${status.total} codes remaining`
                : "Generate backup codes for account recovery"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            hasActiveCodes
              ? "border-forge-copper/10 text-forge-text-3 hover:bg-forge-copper/5"
              : "border-forge-rose-gold/50 text-forge-rose-gold hover:bg-forge-rose-gold/10"
          )}
          onClick={handleGenerateClick}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : hasActiveCodes ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </>
          ) : (
            "Generate"
          )}
        </Button>
      </div>

      {error && <p className="text-sm text-forge-danger mt-2">{error}</p>}

      {/* Confirmation Modal for Regeneration */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="border-forge-copper/10 bg-forge-surface max-w-md">
          <DialogHeader>
            <DialogTitle className="text-forge-text-1 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-forge-rose-gold" />
              Regenerate Recovery Codes?
            </DialogTitle>
            <DialogDescription className="text-forge-text-3">
              This will invalidate all your existing recovery codes. Any codes
              you have saved will no longer work.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-forge-copper/10 text-forge-text-3 hover:bg-forge-copper/5"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-forge-rose-gold hover:bg-forge-rose-gold/80 text-forge-text-1"
              onClick={generateCodes}
            >
              Regenerate Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Codes Display Modal */}
      <Dialog open={showCodesModal} onOpenChange={handleCloseModal}>
        <DialogContent className="border-forge-copper/10 bg-forge-surface max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-forge-text-1 flex items-center gap-2">
              <Shield className="h-5 w-5 text-forge-teal" />
              Your Recovery Codes
            </DialogTitle>
            <DialogDescription className="text-forge-text-3">
              Save these codes in a secure location. Each code can only be used
              once. These will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-forge-copper/5 rounded-lg p-4 my-4">
            <div className="grid grid-cols-2 gap-2">
              {codes?.map((code, index) => (
                <div
                  key={index}
                  className="bg-forge-surface rounded px-3 py-2 font-mono text-sm text-forge-text-1 text-center"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              className="flex-1 border-forge-copper/10 text-forge-text-2 hover:bg-forge-copper/5"
              onClick={handleCopyAll}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-forge-teal" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-forge-copper/10 text-forge-text-2 hover:bg-forge-copper/5"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="bg-forge-rose-gold/10 border border-forge-rose-gold/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-forge-rose-gold shrink-0 mt-0.5" />
              <p className="text-xs text-forge-text-2">
                Store these codes somewhere safe. If you lose access to your
                passkey, you'll need one of these codes plus email verification
                to recover your account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="saved-codes"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="rounded border-forge-copper/10 bg-forge-copper/5 text-forge-copper focus:ring-forge-copper"
            />
            <label htmlFor="saved-codes" className="text-sm text-forge-text-2">
              I have saved these codes in a secure location
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="glow"
              className="w-full"
              disabled={!saved}
              onClick={handleCloseModal}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
