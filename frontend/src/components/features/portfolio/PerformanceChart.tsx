"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataPoint {
  date: number; // Unix timestamp in seconds
  value: string; // Value in smallest unit (e.g., USDC with 6 decimals)
}

interface PerformanceChartProps {
  history: DataPoint[];
  className?: string;
}

function formatValue(value: string): string {
  const num = Number(BigInt(value)) / 1e6; // USDC has 6 decimals
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function PerformanceChart({ history, className }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    if (history.length < 2) return null;

    const values = history.map((p) => Number(BigInt(p.value)));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Avoid division by zero

    // Create SVG path points
    const width = 100; // Use percentage for responsive
    const height = 100;
    const padding = 5;

    const points = history.map((point, index) => {
      const x = padding + ((width - 2 * padding) * index) / (history.length - 1);
      const y = height - padding - ((Number(BigInt(point.value)) - min) / range) * (height - 2 * padding);
      return { x, y, ...point };
    });

    // Create smooth path using SVG
    const pathData = points.reduce((acc, point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      return `${acc} L ${point.x},${point.y}`;
    }, "");

    // Create area fill path
    const areaPath = `${pathData} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`;

    return {
      points,
      pathData,
      areaPath,
      min,
      max,
      startValue: history[0].value,
      endValue: history[history.length - 1].value,
      change: Number(BigInt(history[history.length - 1].value) - BigInt(history[0].value)),
    };
  }, [history]);

  if (!chartData || history.length < 2) {
    return (
      <Card className={cn("border-forge-border", className)} style={{ background: "var(--forge-surface)" }}>
        <CardHeader>
          <CardTitle className="text-forge-text-primary flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: "#E8B4B8" }} />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p style={{ color: "#5A5347" }}>Not enough data to display chart</p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = chartData.change >= 0;
  const changePercent = (chartData.change / Number(BigInt(chartData.startValue))) * 100;

  return (
    <Card className={cn("border-forge-border", className)} style={{ background: "var(--forge-surface)" }}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2" style={{ color: "#F0EBE0" }}>
            <TrendingUp className="h-5 w-5" style={{ color: "#E8B4B8" }} />
            Portfolio Performance
          </CardTitle>
          <p className="text-2xl font-bold mt-2" style={{ color: "#F0EBE0" }}>
            {formatValue(chartData.endValue)}
          </p>
          <p className="text-sm" style={{ color: isPositive ? "#6FCF97" : "#EB5757" }}>
            {isPositive ? "+" : ""}{formatValue(chartData.change.toString())} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
          </p>
        </div>
        <div className="text-right text-sm" style={{ color: "#B8A99A" }}>
          <p>{formatDate(history[0].date)} - {formatDate(history[history.length - 1].date)}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full relative">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                {isPositive ? (
                  <>
                    <stop offset="0%" stopColor="rgba(232,180,184,0.18)" />
                    <stop offset="35%" stopColor="rgba(196,162,101,0.08)" />
                    <stop offset="65%" stopColor="rgba(111,207,151,0.04)" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="rgba(235,87,87,0.3)" />
                    <stop offset="100%" stopColor="rgba(235,87,87,0)" stopOpacity="0" />
                  </>
                )}
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="5" y1="25" x2="95" y2="25" stroke="rgba(232,180,184,0.06)" strokeWidth="0.2" />
            <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(232,180,184,0.06)" strokeWidth="0.2" />
            <line x1="5" y1="75" x2="95" y2="75" stroke="rgba(232,180,184,0.06)" strokeWidth="0.2" />

            {/* Area fill */}
            <path
              d={chartData.areaPath}
              fill="url(#chartGradient)"
            />

            {/* Line */}
            <path
              d={chartData.pathData}
              fill="none"
              stroke={isPositive ? "#E8B4B8" : "#EB5757"}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs" style={{ color: "#5A5347" }}>
            <span>{formatDate(history[0].date)}</span>
            {history.length > 4 && (
              <span>{formatDate(history[Math.floor(history.length / 2)].date)}</span>
            )}
            <span>{formatDate(history[history.length - 1].date)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
