"use client";

import { useState, useEffect } from "react";
import { documentApi, type DocumentVerifyResult } from "@/lib/api";
import { QGPanel } from "@/components/previews/quantum-grid/primitives/QGPanel";
import { QGButton } from "@/components/previews/quantum-grid/primitives/QGButton";
import { QGInput } from "@/components/previews/quantum-grid/primitives/QGInput";
import { QGBadge } from "@/components/previews/quantum-grid/primitives/QGBadge";
import { QGScrollReveal } from "@/components/previews/quantum-grid/primitives/QGScrollReveal";
import { PageLayout } from "@/components/layout/PageLayout";

interface RecentDocument {
  documentHash: string;
  metadata: string | null;
  sealedAt: number;
  txHash: string;
}

function truncateHash(hash: string): string {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString();
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* -- Seal Emblem (CSS-only animated ring) --------------------------------- */

function SealEmblem() {
  return (
    <div className="w-[72px] h-[72px] relative mx-auto mb-5">
      {/* Outer rotating ring */}
      <div className="absolute inset-0 rounded-full border-[1.5px] border-[rgba(232,180,184,0.15)] animate-[spin_20s_linear_infinite]" />
      {/* Inner ring with dashes */}
      <div className="absolute inset-[6px] rounded-full border border-dashed border-[rgba(232,180,184,0.1)] animate-[spin_30s_linear_infinite_reverse]" />
      {/* Shield icon center */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl text-[#E8B4B8] opacity-60">
        {"\u26E8"}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* -- Verification Result Display ------------------------------------------ */

function VerifyResult({ result }: { result: DocumentVerifyResult }) {
  return (
    <div className="forge-fade-in">
      <QGPanel accent>
        <div className="text-center pt-5 pb-2.5">
          {/* Animated seal stamp */}
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke={result.isSealed ? "#6FCF97" : "#EB5757"}
                strokeWidth="2"
                strokeDasharray="176"
                strokeDashoffset="0"
                style={{ animation: "drawCircle 0.8s ease-out forwards" }}
              />
              {result.isSealed ? (
                <path
                  d="M22 32 L29 39 L42 26"
                  fill="none"
                  stroke="#6FCF97"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="30"
                  strokeDashoffset="0"
                  style={{ animation: "drawCheck 0.5s ease-out 0.5s forwards" }}
                />
              ) : (
                <>
                  <line x1="24" y1="24" x2="40" y2="40" stroke="#EB5757" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "drawCheck 0.3s ease-out 0.5s forwards" }} />
                  <line x1="40" y1="24" x2="24" y2="40" stroke="#EB5757" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "drawCheck 0.3s ease-out 0.6s forwards" }} />
                </>
              )}
            </svg>
            <style>{`
              @keyframes drawCircle { from { stroke-dashoffset: 176; } to { stroke-dashoffset: 0; } }
              @keyframes drawCheck { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
            `}</style>
          </div>

          <div className={`text-lg font-semibold font-serif mb-1.5 ${result.isSealed ? "text-[#6FCF97]" : "text-[#EB5757]"}`}>
            {result.isSealed ? "Document Verified" : "Not Found"}
          </div>
          <div className="text-[13px] text-[#5A5347] font-sans">
            {result.isSealed ? "Cryptographic seal is valid and on-chain" : "No seal record found for this hash"}
          </div>
        </div>

        {result.isSealed && (
          <div className="mt-4 border-t border-[rgba(232,180,184,0.06)] pt-3.5">
            <div className="flex flex-col gap-2.5">
              {result.sealer && (
                <ResultRow label="Sealer">
                  <span className="text-[13px] text-[#F0EBE0] font-mono">{truncateHash(result.sealer)}</span>
                </ResultRow>
              )}
              {result.sealedAt && (
                <ResultRow label="Sealed">
                  <span className="text-[13px] text-[#F0EBE0] font-sans">{formatTimestamp(result.sealedAt)}</span>
                </ResultRow>
              )}
              {result.metadata && (
                <ResultRow label="Metadata">
                  <span className="text-[13px] text-[#F0EBE0] font-sans">{result.metadata}</span>
                </ResultRow>
              )}
            </div>
          </div>
        )}
      </QGPanel>
    </div>
  );
}

function ResultRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-[11px] tracking-[0.08em] uppercase text-[#5A5347] font-sans font-medium">
        {label}
      </span>
      {children}
    </div>
  );
}

/* -- Verify Action Card --------------------------------------------------- */

function VerifyCard({ onResult }: { onResult: (r: DocumentVerifyResult | null, err: string | null) => void }) {
  const [hash, setHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!hash.trim()) return;
    onResult(null, null);
    setIsVerifying(true);
    try {
      const data = await documentApi.verify(hash.trim());
      onResult(data, null);
    } catch {
      onResult(null, "Document not found or verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <QGPanel hover className="h-full">
      <div className="text-center mb-4">
        <div className="text-xl text-[#6FCF97] mb-2">{"\u2713"}</div>
        <div className="text-base font-semibold text-[#F0EBE0] font-serif mb-1">
          Verify
        </div>
        <div className="text-xs text-[#5A5347] font-sans">
          Check document authenticity
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <QGInput
          label="Document Hash"
          placeholder="Enter hash to verify..."
          value={hash}
          onChange={(e) => setHash(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-3" style={{ marginTop: "auto" }}>
        <QGButton onClick={handleVerify} disabled={!hash.trim() || isVerifying}>
          {isVerifying ? "Verifying..." : "Verify"}
        </QGButton>
        <p className="text-[11px] text-[#5A5347] text-center font-sans m-0">
          Enter a document hash to check its seal
        </p>
      </div>
    </QGPanel>
  );
}

/* -- Seal Action Card ----------------------------------------------------- */

function SealCard() {
  return (
    <QGPanel hover className="h-full">
      <div className="text-center mb-4">
        <div className="text-xl text-[#E8B4B8] mb-2">{"\u25C9"}</div>
        <div className="text-base font-semibold text-[#F0EBE0] font-serif mb-1">
          Seal
        </div>
        <div className="text-xs text-[#5A5347] font-sans">
          Seal a new document on-chain
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <QGInput label="Document Hash" placeholder="0x..." disabled />
        <QGInput label="Metadata" placeholder="Optional description..." disabled />
        <QGButton disabled>Seal Document</QGButton>
      </div>
      <p className="text-[11px] text-[#5A5347] mt-3 text-center font-sans">
        Requires connected wallet with passkey
      </p>
    </QGPanel>
  );
}

/* -- Seal Timeline -------------------------------------------------------- */

function SealTimeline() {
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { documents: docs } = await documentApi.list();
        setDocuments(docs);
      } catch {
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  if (isLoading) {
    return (
      <QGPanel>
        <div className="text-[11px] tracking-[0.14em] uppercase text-[#5A5347] mb-3.5 font-semibold font-sans">
          Recent Seals
        </div>
        <div className="h-20 rounded-lg bg-[rgba(232,180,184,0.02)]" />
      </QGPanel>
    );
  }

  if (documents.length === 0) {
    return (
      <QGPanel>
        <div className="text-[11px] tracking-[0.14em] uppercase text-[#5A5347] mb-3.5 font-semibold font-sans">
          Recent Seals
        </div>
        <p className="text-[13px] text-[#5A5347] text-center my-5 font-sans">
          No sealed documents yet.
        </p>
      </QGPanel>
    );
  }

  return (
    <QGPanel>
      <div className="text-[11px] tracking-[0.14em] uppercase text-[#5A5347] mb-5 font-semibold font-sans">
        Recent Seals
      </div>
      <div className="relative pl-6">
        {/* Vertical timeline line */}
        <div
          className="absolute left-[5px] top-1 bottom-1 w-px"
          style={{ background: "linear-gradient(180deg, rgba(111,207,151,0.3), rgba(232,180,184,0.08))" }}
        />

        {documents.map((doc, i) => {
          const opacity = Math.max(0.4, 1 - i * 0.15);
          const dotColor = i === 0 ? "#6FCF97" : i < 3 ? "#E8B4B8" : "#5A5347";

          return (
            <div
              key={doc.documentHash + i}
              className="relative"
              style={{
                paddingBottom: i < documents.length - 1 ? 20 : 0,
                opacity,
              }}
            >
              {/* Timeline dot */}
              <div
                className="absolute -left-[22px] top-[3px] w-2.5 h-2.5 rounded-full border-2 border-[var(--elevation-0)]"
                style={{
                  background: dotColor,
                  boxShadow: i === 0 ? `0 0 8px ${dotColor}66` : "none",
                }}
              />

              {/* Content */}
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] text-[#F0EBE0] font-mono tracking-[0.02em]">
                      {truncateHash(doc.documentHash)}
                    </span>
                    {doc.metadata && (
                      <span className="text-xs text-[#B8A99A] font-sans">
                        &quot;{doc.metadata}&quot;
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#5A5347] font-sans">
                    TX: {truncateHash(doc.txHash)}
                  </div>
                </div>
                <span className="text-[11px] text-[#5A5347] whitespace-nowrap font-sans shrink-0">
                  {formatDate(doc.sealedAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </QGPanel>
  );
}

/* -- Page: "The Seal Chamber" --------------------------------------------- */

export default function DocumentsPage() {
  const [verifyResult, setVerifyResult] = useState<DocumentVerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleResult = (result: DocumentVerifyResult | null, error: string | null) => {
    setVerifyResult(result);
    setVerifyError(error);
  };

  return (
    <PageLayout title="Document Vault" subtitle="Cryptographic proof of authenticity" maxWidth="narrow">
      {/* -- Side-by-side Action Cards -- */}
      <QGScrollReveal direction="scale">
        <div className="grid-2col">
          <VerifyCard onResult={handleResult} />
          <SealCard />
        </div>
      </QGScrollReveal>

      {/* -- Verification Result (animated) -- */}
      {verifyError && (
        <QGScrollReveal staggerIndex={1}>
          <QGPanel>
            <div className="text-center py-5 animate-[shake_0.4s_ease]">
              <QGBadge color="#EB5757">Not Found</QGBadge>
              <p className="text-[13px] text-[#5A5347] mt-2.5 font-sans">
                {verifyError}
              </p>
            </div>
            <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }`}</style>
          </QGPanel>
        </QGScrollReveal>
      )}
      {verifyResult && (
        <QGScrollReveal staggerIndex={1}>
          <VerifyResult result={verifyResult} />
        </QGScrollReveal>
      )}

      {/* -- Recent Seals Timeline -- */}
      <QGScrollReveal staggerIndex={2}>
        <SealTimeline />
      </QGScrollReveal>
    </PageLayout>
  );
}
