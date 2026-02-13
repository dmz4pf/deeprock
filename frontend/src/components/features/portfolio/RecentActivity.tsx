"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioApi, type Transaction } from "@/lib/api";
import { formatTokenAmount, getExplorerTxUrl } from "@/lib/chain";
import { ArrowUpRight, ArrowDownRight, Coins, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const txTypeConfig = {
  invest: {
    icon: ArrowUpRight,
    label: "Invested",
    color: "#E8B4B8",
    bgColor: "rgba(232,180,184,0.1)",
  },
  redeem: {
    icon: ArrowDownRight,
    label: "Redeemed",
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.1)",
  },
  yield: {
    icon: Coins,
    label: "Yield",
    color: "#6FCF97",
    bgColor: "rgba(111,207,151,0.1)",
  },
};

const statusConfig = {
  pending: { label: "Pending", color: "#F59E0B", bgColor: "rgba(245,158,11,0.1)" },
  confirmed: { label: "Confirmed", color: "#6FCF97", bgColor: "rgba(111,207,151,0.1)" },
  failed: { label: "Failed", color: "#EB5757", bgColor: "rgba(235,87,87,0.1)" },
};

export function RecentActivity() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { transactions } = await portfolioApi.transactions({ limit: 10 });
        setTransactions(transactions);
      } catch {
        // Use mock data for demo
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (isLoading) {
    return (
      <Card style={{ background: "var(--forge-surface)", borderColor: "rgba(232,180,184,0.08)" }}>
        <CardHeader>
          <CardTitle style={{ color: "#F0EBE0" }}>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded" style={{ background: "rgba(232,180,184,0.06)" }} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ background: "var(--forge-surface)", borderColor: "rgba(232,180,184,0.08)" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle style={{ color: "#F0EBE0" }}>Recent Activity</CardTitle>
        <Link
          href="/portfolio"
          className="text-sm transition-colors"
          style={{ color: "#B8A99A" }}
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const typeConfig = txTypeConfig[tx.type];
              const status = statusConfig[tx.status];

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{ border: "1px solid rgba(232,180,184,0.08)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ background: typeConfig.bgColor }}>
                      <typeConfig.icon className="h-4 w-4" style={{ color: typeConfig.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#F0EBE0" }}>
                        {typeConfig.label} in {tx.poolName}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#B8A99A" }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: status.bgColor, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: typeConfig.color }}>
                      {tx.type === "invest" ? "-" : "+"}${formatTokenAmount(BigInt(tx.amount), 6)}
                    </span>
                    {tx.txHash && (
                      <a
                        href={getExplorerTxUrl(tx.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors"
                        style={{ color: "#B8A99A" }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-3" style={{ color: "#5A5347" }} />
            <p style={{ color: "#B8A99A" }}>No activity yet</p>
            <p className="text-sm" style={{ color: "#5A5347" }}>
              Your transactions will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
