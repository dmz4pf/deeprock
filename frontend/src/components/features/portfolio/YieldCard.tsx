"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioApi, type YieldEvent } from "@/lib/api";
import { formatTokenAmount } from "@/lib/chain";
import { TrendingUp } from "lucide-react";

export function YieldCard() {
  const [yields, setYields] = useState<YieldEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchYields = async () => {
      try {
        const response = await portfolioApi.yield();
        setYields(response?.yields ?? []);
      } catch {
        // API failed - show empty state
        setYields([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchYields();
  }, []);

  const totalYield = yields.reduce(
    (acc, y) => acc + BigInt(y.amount),
    BigInt(0)
  );

  if (isLoading) {
    return (
      <Card style={{ background: "var(--forge-surface)", borderColor: "rgba(232,180,184,0.08)" }}>
        <CardHeader>
          <CardTitle style={{ color: "#F0EBE0" }}>Yield Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded" style={{ background: "rgba(232,180,184,0.06)" }} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ background: "var(--forge-surface)", borderColor: "rgba(232,180,184,0.08)" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle style={{ color: "#F0EBE0" }}>Yield Summary</CardTitle>
        <div className="rounded-lg p-2" style={{ background: "rgba(111,207,151,0.1)" }}>
          <TrendingUp className="h-4 w-4" style={{ color: "#6FCF97" }} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Total yield */}
        <div className="mb-6 rounded-lg p-4" style={{ background: "rgba(232,180,184,0.03)", border: "1px solid rgba(232,180,184,0.08)" }}>
          <p className="text-sm" style={{ color: "#B8A99A" }}>Total Yield Earned</p>
          <p className="text-3xl font-bold" style={{ color: "#F0EBE0" }}>
            ${formatTokenAmount(totalYield, 6)}
          </p>
        </div>

        {/* Recent yield events */}
        {yields.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: "#B8A99A" }}>Recent Distributions</p>
            {yields.slice(0, 5).map((yieldEvent) => (
              <div
                key={yieldEvent.id}
                className="flex items-center justify-between rounded-lg p-3"
                style={{ border: "1px solid rgba(232,180,184,0.08)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#F0EBE0" }}>{yieldEvent.poolName}</p>
                  <p className="text-xs" style={{ color: "#B8A99A" }}>
                    {new Date(yieldEvent.date).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-medium" style={{ color: "#6FCF97" }}>
                  +${formatTokenAmount(BigInt(yieldEvent.amount), 6)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p style={{ color: "#B8A99A" }}>No yield events yet</p>
            <p className="text-sm" style={{ color: "#5A5347" }}>
              Invest in pools to start earning yield
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
