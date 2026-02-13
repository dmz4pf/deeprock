"use client";

import { FileText, Download } from "lucide-react";

interface Document {
  name: string;
  description: string;
  size: string;
  type: string;
}

const poolDocuments: Document[] = [
  {
    name: "Investment Prospectus",
    description: "Complete fund offering documentation",
    size: "2.4 MB",
    type: "PDF",
  },
  {
    name: "Risk Disclosure",
    description: "Comprehensive risk factors and disclaimers",
    size: "1.1 MB",
    type: "PDF",
  },
  {
    name: "Audit Report",
    description: "Latest smart contract security audit by CertiK",
    size: "3.8 MB",
    type: "PDF",
  },
  {
    name: "SEC Compliance",
    description: "Regulatory compliance documentation",
    size: "890 KB",
    type: "PDF",
  },
];

export function PoolDocumentsTab() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
          border: "1px solid rgba(232,180,184,0.05)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-forge-copper" />
          <h3 className="text-lg font-semibold text-[#F0EBE0]">Fund Documents</h3>
        </div>
        <div className="space-y-3">
          {poolDocuments.map((doc) => (
            <a
              key={doc.name}
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-lg p-4 transition-all duration-300 hover:bg-forge-copper/5"
              style={{
                border: "1px solid rgba(232,180,184,0.05)",
              }}
            >
              <div
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: "rgba(232,180,184,0.1)",
                }}
              >
                <FileText className="h-5 w-5 text-forge-copper" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F0EBE0] group-hover:text-forge-copper transition-colors">
                  {doc.name}
                </p>
                <p className="text-xs text-[#5A5347] mt-0.5">{doc.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[#5A5347]">{doc.size}</span>
                <Download className="h-4 w-4 text-[#5A5347] group-hover:text-forge-copper transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
