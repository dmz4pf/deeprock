"use client";

import { type Pool } from "@/lib/api";
import { Receipt, Building, FileSearch, Copy, Check } from "lucide-react";
import { useState } from "react";

interface PoolFeesTabProps {
  pool: Pool;
}

const feeStructure = [
  { name: "Management Fee", rate: "0.50%", frequency: "Annual" },
  { name: "Entry Fee", rate: "0.00%", frequency: "One-time" },
  { name: "Exit Fee", rate: "0.10%", frequency: "One-time" },
  { name: "Performance Fee", rate: "5.00%", frequency: "On profits" },
];

export function PoolFeesTab({ pool }: PoolFeesTabProps) {
  const [copied, setCopied] = useState(false);
  const tokenAddress = "0x1234...5678";

  const handleCopy = () => {
    navigator.clipboard.writeText("0x1234567890abcdef1234567890abcdef12345678");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Fee Structure */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
          border: "1px solid rgba(232,180,184,0.05)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="h-5 w-5 text-forge-copper" />
          <h3 className="text-lg font-semibold text-[#F0EBE0]">Fee Structure</h3>
        </div>
        <div className="space-y-3">
          {feeStructure.map((fee) => (
            <div
              key={fee.name}
              className="flex items-center justify-between rounded-lg p-3"
              style={{
                background: "rgba(232,180,184,0.03)",
                border: "1px solid rgba(232,180,184,0.05)",
              }}
            >
              <div>
                <p className="text-sm font-medium text-[#F0EBE0]">{fee.name}</p>
                <p className="text-xs text-[#5A5347]">{fee.frequency}</p>
              </div>
              <span
                className="text-lg font-bold text-forge-copper"
                style={{ textShadow: "0 0 15px rgba(232,180,184,0.3)" }}
              >
                {fee.rate}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Custodian & Auditor */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-6"
          style={{
            background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
            border: "1px solid rgba(232,180,184,0.05)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Building className="h-5 w-5 text-forge-violet" />
            <h3 className="text-sm font-semibold text-[#F0EBE0]">Custodian</h3>
          </div>
          <p className="text-[#B8A99A] font-medium">Fireblocks</p>
          <p className="text-xs text-[#5A5347] mt-1">Institutional-grade digital asset custody</p>
        </div>

        <div
          className="rounded-xl p-6"
          style={{
            background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
            border: "1px solid rgba(232,180,184,0.05)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileSearch className="h-5 w-5 text-forge-teal" />
            <h3 className="text-sm font-semibold text-[#F0EBE0]">Auditor</h3>
          </div>
          <p className="text-[#B8A99A] font-medium">CertiK</p>
          <p className="text-xs text-[#5A5347] mt-1">Smart contract security audit verified</p>
        </div>
      </div>

      {/* Token Address */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
          border: "1px solid rgba(232,180,184,0.05)",
        }}
      >
        <h3 className="text-sm font-semibold text-[#F0EBE0] mb-3">Token Contract</h3>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-sm text-[#B8A99A] font-mono bg-deep-bg/50 rounded-lg px-4 py-2.5 border border-forge-copper/5">
            {tokenAddress}
          </code>
          <button
            onClick={handleCopy}
            className="p-2.5 rounded-lg text-[#B8A99A] hover:text-[#F0EBE0] hover:bg-forge-copper/10 transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-forge-teal" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
