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
      const eased = 1 - Math.pow(1 - progress, 3);
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

// Stat Card with scan-line effect
function CyberStatCard({
  title,
  value,
  change,
  delay = 0
}: {
  title: string;
  value: string;
  change?: string;
  delay?: number;
}) {
  return (
    <div
      className="cyber-stat-card relative overflow-hidden rounded-xl p-5 animate-fadeIn"
      style={{
        animationDelay: `${delay}ms`,
        background: "linear-gradient(145deg, rgba(6,182,212,0.03) 0%, rgba(10,16,36,0.85) 100%)",
        border: "1px solid rgba(34,211,238,0.12)",
        boxShadow: "0 0 30px rgba(34,211,238,0.08), inset 0 1px 0 rgba(255,255,255,0.03)"
      }}
    >
      {/* Scan line effect */}
      <div className="scan-line absolute inset-0 pointer-events-none" />

      <p className="text-xs text-cyan-400/70 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-white tabular-nums" style={{
        textShadow: "0 0 20px rgba(34,211,238,0.5), 0 0 40px rgba(34,211,238,0.25)"
      }}>{value}</p>
      {change && (
        <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
          {change}
        </p>
      )}
    </div>
  );
}

// Data flow line component
function DataFlowLine({ delay = 0, color = "#22D3EE" }: { delay?: number; color?: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <linearGradient id={`flowGrad-${delay}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent">
            <animate attributeName="offset" values="-0.3;1" dur="2.5s" repeatCount="indefinite" begin={`${delay}s`} />
          </stop>
          <stop offset="15%" stopColor={color} stopOpacity="0.8">
            <animate attributeName="offset" values="-0.15;1.15" dur="2.5s" repeatCount="indefinite" begin={`${delay}s`} />
          </stop>
          <stop offset="30%" stopColor="transparent">
            <animate attributeName="offset" values="0;1.3" dur="2.5s" repeatCount="indefinite" begin={`${delay}s`} />
          </stop>
        </linearGradient>
        <filter id="flowGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M 50 200 Q 150 100, 300 150 T 550 200"
        fill="none"
        stroke={`${color}15`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 50 200 Q 150 100, 300 150 T 550 200"
        fill="none"
        stroke={`url(#flowGrad-${delay})`}
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#flowGlow)"
      />
    </svg>
  );
}

// Pulsing node
function PulsingNode({ x, y, label, value }: { x: number; y: number; label: string; value: string }) {
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
    >
      {/* Pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-20 h-20 rounded-full border border-cyan-500/30 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute w-16 h-16 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
      </div>

      {/* Core node */}
      <div
        className="relative w-24 h-24 rounded-full flex flex-col items-center justify-center"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, rgba(10,16,36,0.9) 70%)",
          border: "1px solid rgba(34,211,238,0.3)",
          boxShadow: "0 0 40px rgba(34,211,238,0.2)"
        }}
      >
        <p className="text-lg font-bold text-cyan-400" style={{ textShadow: "0 0 10px rgba(34,211,238,0.8)" }}>{value}</p>
        <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

export function CyberCommandPreview() {
  const totalValue = useCountUp(2470000, 2500);
  const costBasis = useCountUp(2150000, 2500);
  const gain = useCountUp(320000, 2500);

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: "linear-gradient(180deg, #030614 0%, #041019 50%, #030614 100%)"
      }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full animate-float1"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)",
            filter: "blur(60px)"
          }}
        />
        <div
          className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full animate-float2"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
            filter: "blur(80px)"
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-cyan-400/70 uppercase tracking-widest">System Online</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Command Center</h1>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <CyberStatCard title="Total Value" value={`$${totalValue.toLocaleString()}`} change="+5.2%" delay={0} />
          <CyberStatCard title="Cost Basis" value={`$${costBasis.toLocaleString()}`} delay={100} />
          <CyberStatCard title="Unrealized Gain" value={`$${gain.toLocaleString()}`} change="+14.8%" delay={200} />
          <CyberStatCard title="Positions" value="5" delay={300} />
        </div>

        {/* Central Visualization */}
        <div
          className="relative h-[400px] rounded-2xl mb-8 overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(6,182,212,0.02) 0%, rgba(10,16,36,0.9) 100%)",
            border: "1px solid rgba(34,211,238,0.15)",
            boxShadow: "0 0 60px rgba(34,211,238,0.1)"
          }}
        >
          {/* Animated border pulse */}
          <div className="absolute inset-0 rounded-2xl animate-borderPulse" style={{
            border: "1px solid rgba(34,211,238,0.2)"
          }} />

          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />

          {/* Data flow lines */}
          <DataFlowLine delay={0} color="#22D3EE" />
          <DataFlowLine delay={0.8} color="#3B82F6" />
          <DataFlowLine delay={1.6} color="#8B5CF6" />

          {/* Central hub */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div
              className="w-32 h-32 rounded-full flex flex-col items-center justify-center"
              style={{
                background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, rgba(10,16,36,0.95) 70%)",
                border: "2px solid rgba(34,211,238,0.3)",
                boxShadow: "0 0 60px rgba(34,211,238,0.3), inset 0 0 30px rgba(34,211,238,0.1)"
              }}
            >
              <p className="text-2xl font-bold text-cyan-400" style={{ textShadow: "0 0 20px rgba(34,211,238,0.8)" }}>$2.47M</p>
              <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider">Total Value</p>
            </div>
          </div>

          {/* Asset nodes */}
          <PulsingNode x={120} y={150} label="Treasury" value="$620K" />
          <PulsingNode x={480} y={100} label="Real Estate" value="$450K" />
          <PulsingNode x={480} y={300} label="Credit" value="$380K" />
          <PulsingNode x={120} y={300} label="Commodities" value="$520K" />
        </div>

        {/* Holdings List */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "linear-gradient(145deg, rgba(6,182,212,0.02) 0%, rgba(10,16,36,0.85) 100%)",
            border: "1px solid rgba(34,211,238,0.1)"
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Active Positions
          </h2>

          {[
            { name: "US Treasury 6M", type: "Fixed Income", value: "$620,000", apy: "5.2%" },
            { name: "Manhattan RE Fund", type: "Real Estate", value: "$450,000", apy: "8.1%" },
            { name: "Corporate Credit Pool", type: "Private Credit", value: "$380,000", apy: "6.8%" },
          ].map((position, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-cyan-500/5 transition-colors px-4 -mx-4 cursor-pointer"
            >
              <div>
                <p className="text-white font-medium">{position.name}</p>
                <p className="text-sm text-white/40">{position.type}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-mono">{position.value}</p>
                <p className="text-sm text-cyan-400">{position.apy} APY</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
        .cyber-stat-card .scan-line {
          background: linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.15) 50%, transparent 100%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .cyber-stat-card:hover .scan-line {
          transform: translateX(100%);
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(34,211,238,0.1); }
          50% { border-color: rgba(34,211,238,0.25); }
        }
        .animate-borderPulse {
          animation: borderPulse 4s ease-in-out infinite;
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 30px); }
        }
        .animate-float1 { animation: float1 20s ease-in-out infinite; }
        .animate-float2 { animation: float2 25s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
