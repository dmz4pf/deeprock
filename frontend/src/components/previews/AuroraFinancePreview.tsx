"use client";

import { useEffect, useState } from "react";

// Animated counter hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Bouncy easing
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

// Aurora stat card with unique glow
function AuroraStatCard({
  title,
  value,
  subtitle,
  color,
  delay = 0
}: {
  title: string;
  value: string;
  subtitle?: string;
  color: "purple" | "cyan" | "pink" | "blue";
  delay?: number;
}) {
  const colorMap = {
    purple: { glow: "139,92,246", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
    cyan: { glow: "34,211,238", bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.2)" },
    pink: { glow: "236,72,153", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)" },
    blue: { glow: "59,130,246", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" }
  };

  const c = colorMap[color];

  return (
    <div
      className="aurora-card relative rounded-xl p-5 animate-fadeIn transition-all duration-300"
      style={{
        animationDelay: `${delay}ms`,
        background: `linear-gradient(135deg, ${c.bg} 0%, rgba(10,16,36,0.85) 100%)`,
        border: `1px solid ${c.border}`,
        boxShadow: `0 20px 40px rgba(${c.glow},0.15), 0 0 60px rgba(${c.glow},0.08)`
      }}
    >
      {/* Iridescent edge */}
      <div
        className="absolute top-0 left-0 right-0 h-px animate-iridescent"
        style={{
          background: `linear-gradient(90deg, transparent, rgb(${c.glow}), transparent)`,
          opacity: 0.5
        }}
      />

      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{title}</p>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{
          background: `linear-gradient(135deg, rgb(${c.glow}), rgba(${c.glow},0.7))`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}
      >
        {value}
      </p>
      {subtitle && <p className="text-sm text-white/30 mt-1">{subtitle}</p>}
    </div>
  );
}

// Position card with bouncy hover
function PositionCard({
  name,
  type,
  value,
  apy,
  color,
  delay = 0
}: {
  name: string;
  type: string;
  value: string;
  apy: string;
  color: "purple" | "cyan" | "pink" | "blue";
  delay?: number;
}) {
  const colorMap = {
    purple: "#8B5CF6",
    cyan: "#22D3EE",
    pink: "#EC4899",
    blue: "#3B82F6"
  };

  return (
    <div
      className="aurora-position-card relative rounded-xl p-5 animate-fadeIn transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02]"
      style={{
        animationDelay: `${delay}ms`,
        background: "linear-gradient(135deg, rgba(15,7,32,0.9) 0%, rgba(10,16,36,0.95) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{
          background: `${colorMap[color]}15`,
          border: `1px solid ${colorMap[color]}30`
        }}
      >
        <span style={{ color: colorMap[color] }}>
          {type === "Fixed Income" && "📊"}
          {type === "Real Estate" && "🏢"}
          {type === "Private Credit" && "💳"}
          {type === "Real Assets" && "🏗️"}
        </span>
      </div>

      <p className="text-white font-medium mb-1">{name}</p>
      <p className="text-sm text-white/40 mb-4">{type}</p>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-semibold text-white">{value}</p>
        </div>
        <span
          className="text-sm px-2 py-1 rounded-full"
          style={{
            background: `${colorMap[color]}15`,
            color: colorMap[color]
          }}
        >
          {apy} APY
        </span>
      </div>
    </div>
  );
}

export function AuroraFinancePreview() {
  const totalValue = useCountUp(2470000, 2500);
  const change = useCountUp(2450, 2500);

  return (
    <div
      className="min-h-screen p-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0a0815 0%, #06081a 100%)"
      }}
    >
      {/* Aurora mesh background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-full h-full animate-auroraDrift"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(139,92,246,0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(236,72,153,0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.08) 0%, transparent 60%)
            `
          }}
        />

        {/* Floating orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full animate-float1"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
            filter: "blur(60px)"
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full animate-float2"
          style={{
            background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)",
            filter: "blur(80px)"
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                boxShadow: "0 0 20px rgba(139,92,246,0.4)"
              }}
            >
              <span className="text-white font-bold">✧</span>
            </div>
            <span className="text-xl font-bold text-white">Deeprock</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Explore</button>
            <button className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Portfolio</button>
            <button
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                boxShadow: "0 0 20px rgba(139,92,246,0.3)"
              }}
            >
              0x7f3a...8b2c
            </button>
          </div>
        </div>

        {/* Hero Section with Gradient Mesh */}
        <div
          className="relative rounded-2xl p-8 mb-8 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.05) 50%, rgba(34,211,238,0.08) 100%)",
            border: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          {/* Animated mesh overlay */}
          <div className="absolute inset-0 animate-meshShift opacity-50" style={{
            background: `
              radial-gradient(circle at 30% 40%, rgba(139,92,246,0.15) 0%, transparent 40%),
              radial-gradient(circle at 70% 60%, rgba(236,72,153,0.1) 0%, transparent 40%)
            `
          }} />

          {/* Stats Row */}
          <div className="relative grid grid-cols-4 gap-4 mb-8">
            <AuroraStatCard title="Total Value" value={`$${totalValue.toLocaleString()}`} color="purple" delay={0} />
            <AuroraStatCard title="Cost Basis" value="$2,150,000" color="cyan" delay={100} />
            <AuroraStatCard title="Gain/Loss" value={`+$${change.toLocaleString()}`} subtitle="+1.0% today" color="pink" delay={200} />
            <AuroraStatCard title="Positions" value="5" subtitle="All earning" color="blue" delay={300} />
          </div>

          {/* Centered value display */}
          <div className="relative text-center py-6">
            <p className="text-sm text-white/40 mb-2">Portfolio Value</p>
            <p
              className="text-5xl font-bold tabular-nums"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #EC4899, #22D3EE)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              ${totalValue.toLocaleString()}.00
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-sm">+$2,450 (1.0%)</span>
            </div>
          </div>
        </div>

        {/* Wallet & Faucet Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div
            className="rounded-xl p-6"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(10,16,36,0.9) 100%)",
              border: "1px solid rgba(139,92,246,0.15)"
            }}
          >
            <p className="text-sm text-white/40 uppercase tracking-wider mb-3">Wallet Balance</p>
            <p className="text-3xl font-bold text-white mb-1">$10,000.00</p>
            <p className="text-sm text-white/30">USDC Available</p>
            <p className="text-xs text-purple-400 mt-3 font-mono">0x1234...5678</p>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: "linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(10,16,36,0.9) 100%)",
              border: "1px solid rgba(236,72,153,0.15)"
            }}
          >
            <p className="text-sm text-white/40 uppercase tracking-wider mb-3">Testnet Faucet</p>
            <p className="text-white/60 text-sm mb-4">Get test tokens to explore the platform</p>
            <button
              className="w-full py-3 rounded-xl font-medium text-white transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                boxShadow: "0 0 30px rgba(236,72,153,0.3)"
              }}
            >
              Get 10,000 USDC
            </button>
          </div>
        </div>

        {/* Performance Chart */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: "linear-gradient(135deg, rgba(15,7,32,0.8) 0%, rgba(10,16,36,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.06)"
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Portfolio Performance</h2>
            <div className="flex gap-2">
              {["1D", "1W", "1M", "1Y"].map((period, i) => (
                <button
                  key={period}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                    i === 2
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <svg viewBox="0 0 600 200" className="w-full h-48">
            <defs>
              <linearGradient id="auroraChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#EC4899" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="auroraLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[40, 80, 120, 160].map((y) => (
              <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
            ))}

            {/* Area fill */}
            <path
              d="M 0 180 Q 100 160, 150 140 T 300 100 T 450 60 T 600 30 L 600 200 L 0 200 Z"
              fill="url(#auroraChartGradient)"
            />

            {/* Line */}
            <path
              d="M 0 180 Q 100 160, 150 140 T 300 100 T 450 60 T 600 30"
              fill="none"
              stroke="url(#auroraLineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.5))" }}
            />

            {/* Current point */}
            <circle cx="600" cy="30" r="6" fill="#22D3EE">
              <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>

          <div className="flex justify-between text-xs text-white/20 mt-4">
            <span>Mar</span>
            <span>May</span>
            <span>Jul</span>
            <span>Sep</span>
            <span>Nov</span>
            <span>Feb</span>
          </div>
        </div>

        {/* Positions Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Your Positions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PositionCard name="US Treasury 6M" type="Fixed Income" value="$620K" apy="5.2%" color="purple" delay={0} />
            <PositionCard name="Manhattan RE" type="Real Estate" value="$450K" apy="8.1%" color="cyan" delay={100} />
            <PositionCard name="Corp Credit" type="Private Credit" value="$380K" apy="6.8%" color="pink" delay={200} />
            <PositionCard name="Infrastructure" type="Real Assets" value="$520K" apy="4.9%" color="blue" delay={300} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "linear-gradient(135deg, rgba(15,7,32,0.6) 0%, rgba(10,16,36,0.8) 100%)",
            border: "1px solid rgba(255,255,255,0.04)"
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>

          <div className="space-y-3">
            {[
              { type: "Invested", pool: "Treasury Pool", amount: "-$50K", time: "2h ago", status: "Confirmed" },
              { type: "Yield", pool: "RE Fund", amount: "+$1.2K", time: "Yesterday", status: "Confirmed" }
            ].map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === "Invested" ? "bg-purple-500/20" : "bg-emerald-500/20"
                    }`}
                  >
                    <span className={tx.type === "Invested" ? "text-purple-400" : "text-emerald-400"}>
                      {tx.type === "Invested" ? "↑" : "+"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm">{tx.type}</p>
                    <p className="text-white/30 text-xs">{tx.pool}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-white'}`}>{tx.amount}</p>
                  <p className="text-white/20 text-xs">{tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
        @keyframes auroraDrift {
          0%, 100% {
            background-position: 0% 0%, 100% 100%, 50% 50%;
          }
          50% {
            background-position: 100% 100%, 0% 0%, 50% 50%;
          }
        }
        .animate-auroraDrift {
          animation: auroraDrift 20s ease-in-out infinite;
        }
        @keyframes meshShift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -10px); }
        }
        .animate-meshShift {
          animation: meshShift 15s ease-in-out infinite;
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, -30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 40px); }
        }
        .animate-float1 { animation: float1 25s ease-in-out infinite; }
        .animate-float2 { animation: float2 30s ease-in-out infinite; }
        @keyframes iridescent {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .animate-iridescent {
          animation: iridescent 3s ease-in-out infinite;
        }
        .aurora-position-card:hover {
          box-shadow: 0 20px 60px rgba(139,92,246,0.2), 0 0 40px rgba(236,72,153,0.1);
        }
      `}</style>
    </div>
  );
}
