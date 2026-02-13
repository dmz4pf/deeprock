"use client";

import { useState, useEffect } from "react";

// ─── MOCK DATA ──────────────────────────────────────────────────────────────────

const STATS = [
  { label: "PORTFOLIO VALUE", value: "$2,847,392.18", delta: "+2.4%", positive: true, spark: [30,45,38,52,48,60,55,68,62,75] },
  { label: "24H P&L", value: "+$18,472.60", delta: "+0.65%", positive: true, spark: [20,25,18,30,22,35,28,40,38,42] },
  { label: "TOTAL APY", value: "8.74%", delta: "+0.12%", positive: true, spark: [60,62,58,65,63,67,64,68,66,70] },
  { label: "TVL DEPLOYED", value: "$12.4M", delta: "-1.2%", positive: false, spark: [80,78,75,72,74,70,68,72,69,65] },
  { label: "ACTIVE POSITIONS", value: "24", delta: "+3", positive: true, spark: [15,18,16,20,19,22,21,24,22,24] },
  { label: "PENDING YIELDS", value: "$4,219.83", delta: "claimable", positive: true, spark: [10,15,20,25,30,35,40,45,50,55] },
];

const POSITIONS = [
  { asset: "USDC-TBILL-01", type: "T-BILL", principal: "$500,000.00", apy: "5.24%", yieldDay: "$71.78", maturity: "2026-06-15", status: "active" },
  { asset: "AVAX-RE-FUND", type: "REAL ESTATE", principal: "$350,000.00", apy: "9.80%", yieldDay: "$93.97", maturity: "2027-03-01", status: "active" },
  { asset: "ETH-CORP-BD3", type: "CORP BOND", principal: "$275,000.00", apy: "6.15%", yieldDay: "$46.30", maturity: "2026-09-22", status: "active" },
  { asset: "GOLD-VAULT-A", type: "COMMODITY", principal: "$420,000.00", apy: "3.20%", yieldDay: "$36.82", maturity: "2028-01-10", status: "pending" },
  { asset: "USDT-MM-POOL", type: "MONEY MKT", principal: "$180,000.00", apy: "4.85%", yieldDay: "$23.92", maturity: "ROLLING", status: "active" },
  { asset: "PRIV-CRD-07", type: "PRIV CREDIT", principal: "$600,000.00", apy: "12.40%", yieldDay: "$203.84", maturity: "2027-11-30", status: "active" },
  { asset: "INF-LNK-02", type: "INFLATION", principal: "$225,000.00", apy: "7.60%", yieldDay: "$46.85", maturity: "2026-12-01", status: "locked" },
  { asset: "SOV-DEBT-BR", type: "SOVEREIGN", principal: "$297,392.18", apy: "11.20%", yieldDay: "$91.22", maturity: "2028-06-15", status: "active" },
];

const ALLOCATIONS = [
  { name: "T-Bills & Money Mkt", pct: 28, color: "#00FFD1" },
  { name: "Real Estate", pct: 22, color: "#0088FF" },
  { name: "Private Credit", pct: 19, color: "#FF0080" },
  { name: "Corporate Bonds", pct: 12, color: "#FFD700" },
  { name: "Sovereign Debt", pct: 10, color: "#8B5CF6" },
  { name: "Commodities", pct: 6, color: "#F97316" },
  { name: "Inflation-Linked", pct: 3, color: "#6EE7B7" },
];

const LOG_ENTRIES = [
  { time: "09:41:22", type: "YIELD_CLAIM", amount: "$847.20", target: "treasury-001", color: "#00FFD1" },
  { time: "09:38:14", type: "DEPOSIT", amount: "$50,000", target: "real-estate-fund", color: "#0088FF" },
  { time: "09:35:07", type: "REBALANCE", amount: "3.2%", target: "portfolio-main", color: "#FFD700" },
  { time: "09:31:55", type: "MATURITY", amount: "$275,000", target: "corp-bond-02", color: "#FF0080" },
  { time: "09:28:41", type: "APY_UPDATE", amount: "5.24%", target: "tbill-pool-01", color: "#00FFD1" },
  { time: "09:24:18", type: "WITHDRAWAL", amount: "$12,500", target: "money-market", color: "#F97316" },
  { time: "09:20:03", type: "YIELD_CLAIM", amount: "$1,204.80", target: "priv-credit-07", color: "#00FFD1" },
  { time: "09:15:49", type: "DEPOSIT", amount: "$100,000", target: "sovereign-br", color: "#0088FF" },
  { time: "09:11:32", type: "VERIFY", amount: "OK", target: "chain-state-sync", color: "#00FFD1" },
  { time: "09:08:17", type: "REBALANCE", amount: "1.8%", target: "inflation-hedge", color: "#FFD700" },
];

// ─── MINI SPARKLINE (SVG) ───────────────────────────────────────────────────────

function Sparkline({ data, color = "#00FFD1" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block ml-2 opacity-60">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#sg-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── STATUS DOT ─────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: "#00FFD1",
    pending: "#FFD700",
    locked: "#FF0080",
  };
  const color = colorMap[status] || "#555";
  const isPulsing = status === "active";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={isPulsing ? "status-pulse" : ""}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
          display: "inline-block",
        }}
      />
      <span style={{ color, fontSize: 11 }} className="font-mono uppercase tracking-wider">
        {status}
      </span>
    </span>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────────

export default function DesignTerminalPage() {
  const [blockNum, setBlockNum] = useState(48293847);
  const [time, setTime] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const blockInterval = setInterval(() => {
      setBlockNum((n) => n + Math.floor(Math.random() * 3) + 1);
    }, 2200);

    const timeInterval = setInterval(() => {
      setTime(
        new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC"
      );
    }, 1000);

    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);

    setTime(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");

    return () => {
      clearInterval(blockInterval);
      clearInterval(timeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  const totalPrincipal = POSITIONS.reduce((sum, p) => {
    return sum + parseFloat(p.principal.replace(/[$,]/g, ""));
  }, 0);

  const totalYieldDay = POSITIONS.reduce((sum, p) => {
    return sum + parseFloat(p.yieldDay.replace(/[$,]/g, ""));
  }, 0);

  return (
    <>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .status-pulse {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .scanline-overlay {
          pointer-events: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 50;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,255,209,0.015) 2px,
            rgba(0,255,209,0.015) 4px
          );
        }
        .scanline-sweep {
          pointer-events: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 120px;
          z-index: 51;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(0,255,209,0.03) 50%,
            transparent 100%
          );
          animation: scanline 8s linear infinite;
        }
        .glow-border {
          border: 1px solid rgba(0,255,209,0.15);
          box-shadow: 0 0 10px rgba(0,255,209,0.08), inset 0 0 10px rgba(0,255,209,0.03);
        }
        .glow-border-subtle {
          border: 1px solid rgba(0,255,209,0.08);
        }
        .row-hover:hover {
          background: rgba(0,255,209,0.04) !important;
          box-shadow: inset 0 0 20px rgba(0,255,209,0.05);
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(0,255,209,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,209,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .text-cyan { color: #00FFD1; }
        .text-magenta { color: #FF0080; }
        .text-elec-blue { color: #0088FF; }
        .text-gold { color: #FFD700; }
        .text-muted-term { color: #555555; }
        .bg-surface { background: #0A0A0A; }
        .bg-elevated { background: #111111; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0A0A; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,209,0.2); border-radius: 2px; }
        @keyframes data-flash {
          0% { color: #00FFD1; }
          50% { color: #fff; }
          100% { color: #00FFD1; }
        }
        .block-flash {
          animation: data-flash 0.3s ease-out;
        }
      `}</style>

      {/* Scanline overlays */}
      <div className="scanline-overlay" />
      <div className="scanline-sweep" />

      <div className="grid-bg min-h-screen" style={{ background: "#000", color: "#E0E0E0" }}>
        <div className="max-w-[1440px] mx-auto px-4 py-3">

          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <header className="flex items-center justify-between py-2 mb-4" style={{ borderBottom: "1px solid rgba(0,255,209,0.1)" }}>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm tracking-widest text-cyan">
                RWA_GATEWAY<span className="text-muted-term"> v2.0</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs font-mono">
                <span className="status-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#00FFD1", boxShadow: "0 0 8px #00FFD1", display: "inline-block" }} />
                <span style={{ color: "#00FFD1" }}>CONNECTED</span>
              </span>
              <span className="font-mono text-xs text-muted-term">
                AVAX C-CHAIN
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="font-mono text-xs">
                <span className="text-muted-term">Block </span>
                <span className="text-cyan">#{blockNum.toLocaleString()}</span>
              </span>
              <span className="font-mono text-xs text-muted-term">
                {time}
                <span style={{ opacity: cursorVisible ? 1 : 0 }} className="text-cyan ml-0.5">_</span>
              </span>
            </div>
          </header>

          {/* ── STATS GRID ─────────────────────────────────────────────── */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="glow-border bg-surface rounded p-3 flex flex-col justify-between"
              >
                <div className="font-mono text-[10px] tracking-widest text-cyan uppercase mb-2 opacity-70">
                  {stat.label}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="font-mono text-lg text-white leading-tight">{stat.value}</div>
                    <div
                      className="font-mono text-[10px] mt-0.5"
                      style={{ color: stat.positive ? "#00FFD1" : "#FF0080" }}
                    >
                      {stat.delta}
                    </div>
                  </div>
                  <Sparkline data={stat.spark} color={stat.positive ? "#00FFD1" : "#FF0080"} />
                </div>
              </div>
            ))}
          </section>

          {/* ── POSITION MATRIX ────────────────────────────────────────── */}
          <section className="glow-border bg-surface rounded mb-4 overflow-hidden">
            <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,255,209,0.1)" }}>
              <span className="font-mono text-xs tracking-widest text-cyan">
                {">"} POSITION_MATRIX
              </span>
              <span className="font-mono text-[10px] text-muted-term">
                {POSITIONS.length} ACTIVE INSTRUMENTS
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,255,209,0.08)" }}>
                    {["ASSET", "TYPE", "PRINCIPAL", "APY", "YIELD/DAY", "MATURITY", "STATUS"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left font-normal tracking-wider"
                        style={{ color: "#555", fontSize: 10 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {POSITIONS.map((pos, i) => (
                    <tr
                      key={pos.asset}
                      className="row-hover transition-colors"
                      style={{
                        borderBottom: "1px solid rgba(0,255,209,0.04)",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      }}
                    >
                      <td className="px-4 py-2.5 text-white">{pos.asset}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] tracking-wider"
                          style={{
                            background: "rgba(0,136,255,0.1)",
                            color: "#0088FF",
                            border: "1px solid rgba(0,136,255,0.2)",
                          }}
                        >
                          {pos.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-white tabular-nums">{pos.principal}</td>
                      <td className="px-4 py-2.5 text-cyan tabular-nums">{pos.apy}</td>
                      <td className="px-4 py-2.5 tabular-nums" style={{ color: "#00FFD1" }}>
                        {pos.yieldDay}
                      </td>
                      <td className="px-4 py-2.5 text-muted-term tabular-nums">{pos.maturity}</td>
                      <td className="px-4 py-2.5">
                        <StatusDot status={pos.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(0,255,209,0.15)" }}>
                    <td className="px-4 py-2.5 text-muted-term">TOTAL</td>
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5 text-white font-semibold tabular-nums">
                      ${totalPrincipal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-cyan">AVG 8.74%</td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums" style={{ color: "#00FFD1" }}>
                      ${totalYieldDay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] text-muted-term font-mono">
                        {POSITIONS.filter((p) => p.status === "active").length} ACTIVE
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* ── SIDE PANEL: ALLOCATIONS + LOG ──────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
            {/* Allocations — 3/5 width */}
            <div className="lg:col-span-3 glow-border bg-surface rounded overflow-hidden">
              <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(0,255,209,0.1)" }}>
                <span className="font-mono text-xs tracking-widest text-cyan">
                  {">"} ALLOCATION_MAP
                </span>
              </div>
              <div className="p-4 space-y-3">
                {ALLOCATIONS.map((alloc) => (
                  <div key={alloc.name} className="flex items-center gap-3">
                    <span className="font-mono text-[11px] w-40 truncate" style={{ color: "#999" }}>
                      {alloc.name}
                    </span>
                    <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: "#111" }}>
                      <div
                        className="h-full rounded-sm transition-all duration-700"
                        style={{
                          width: `${alloc.pct}%`,
                          background: `linear-gradient(90deg, ${alloc.color}cc, ${alloc.color}66)`,
                          boxShadow: `0 0 8px ${alloc.color}33`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs tabular-nums w-10 text-right" style={{ color: alloc.color }}>
                      {alloc.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Log — 2/5 width */}
            <div className="lg:col-span-2 glow-border bg-surface rounded overflow-hidden flex flex-col">
              <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,255,209,0.1)" }}>
                <span className="font-mono text-xs tracking-widest text-cyan">
                  {">"} SYS_LOG
                </span>
                <span className="status-pulse" style={{ width: 5, height: 5, borderRadius: "50%", background: "#00FFD1", boxShadow: "0 0 6px #00FFD1", display: "inline-block" }} />
              </div>
              <div className="p-3 flex-1 overflow-y-auto" style={{ maxHeight: 280 }}>
                <div className="space-y-1.5">
                  {LOG_ENTRIES.map((entry, i) => (
                    <div key={i} className="font-mono text-[11px] leading-relaxed flex">
                      <span className="text-muted-term mr-1.5">{">"}</span>
                      <span className="text-muted-term mr-2 tabular-nums">{entry.time}</span>
                      <span className="mr-2 tracking-wider" style={{ color: entry.color, minWidth: 96, display: "inline-block" }}>
                        {entry.type}
                      </span>
                      <span className="text-white mr-2 tabular-nums">{entry.amount}</span>
                      <span className="text-muted-term truncate">{entry.target}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-3 py-1.5" style={{ borderTop: "1px solid rgba(0,255,209,0.06)" }}>
                <span className="font-mono text-[10px] text-muted-term">
                  {">"} awaiting next event
                  <span style={{ opacity: cursorVisible ? 1 : 0 }} className="text-cyan ml-0.5">_</span>
                </span>
              </div>
            </div>
          </section>

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <footer
            className="flex items-center justify-between py-2 mt-2"
            style={{ borderTop: "1px solid rgba(0,255,209,0.08)" }}
          >
            <div className="font-mono text-[9px] tracking-[0.3em] text-muted-term uppercase">
              encrypted &bull; verified &bull; on-chain
            </div>
            <div className="font-mono text-[9px] text-muted-term flex items-center gap-3">
              <span>LATENCY: <span className="text-cyan">12ms</span></span>
              <span>UPTIME: <span className="text-cyan">99.97%</span></span>
              <span>NODES: <span className="text-cyan">4/4</span></span>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
