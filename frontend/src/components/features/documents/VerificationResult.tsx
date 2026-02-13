"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, User, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationResultProps {
  documentHash: string;
  isSealed: boolean;
  sealer: string | null;
  sealedAt: number | null;
  metadata: string | null;
  txHash?: string;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

export function VerificationResult({
  documentHash,
  isSealed,
  sealer,
  sealedAt,
  metadata,
}: VerificationResultProps) {
  return (
    <Card
      className={cn(
        "border-forge-copper/10",
        isSealed ? "border-forge-teal/50" : "border-forge-rose-gold/50"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-forge-text-1">
            {isSealed ? (
              <CheckCircle className="h-5 w-5 text-forge-teal" />
            ) : (
              <XCircle className="h-5 w-5 text-forge-rose-gold" />
            )}
            Verification Result
          </span>
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              isSealed
                ? "bg-forge-teal/20 text-forge-teal"
                : "bg-forge-rose-gold/20 text-forge-rose-gold"
            )}
          >
            {isSealed ? "Verified" : "Not Sealed"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-forge-text-3">Document Hash</p>
          <p className="font-mono text-xs break-all mt-1 text-forge-text-1 bg-forge-copper/5 p-2 rounded">
            {documentHash}
          </p>
        </div>

        {isSealed && sealer && (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-1 text-forge-text-3" />
            <div className="flex-1">
              <p className="text-sm text-forge-text-3">Sealed By</p>
              <p className="font-mono text-xs break-all mt-1 text-forge-text-1">
                {sealer}
              </p>
            </div>
          </div>
        )}

        {isSealed && sealedAt && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-1 text-forge-text-3" />
            <div>
              <p className="text-sm text-forge-text-3">Sealed</p>
              <p className="text-sm mt-1 text-forge-text-1">
                {formatRelativeTime(sealedAt)}
              </p>
              <p className="text-xs text-forge-text-3">
                {formatTimestamp(sealedAt)}
              </p>
            </div>
          </div>
        )}

        {metadata && (
          <div>
            <p className="text-sm text-forge-text-3">Metadata</p>
            <p className="text-sm mt-1 text-forge-text-1 bg-forge-copper/5 p-2 rounded">
              {metadata}
            </p>
          </div>
        )}

        {!isSealed && (
          <div className="p-3 rounded-lg bg-forge-rose-gold/10 border border-forge-rose-gold/30">
            <p className="text-sm text-forge-rose-gold">
              This document has not been sealed on the blockchain.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
