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

// Premium stat card
function ObsidianStatCard({
  title,
  value,
  subtitle,
  delay = 0
}: {
  title: string;
  value: string;
  subtitle?: string;
  delay?: number;
}) {
  return (
    <div
      className="obsidian-card relative rounded-lg p-5 animate-fadeIn transition-all duration-400 hover:-translate-y-1"
      style={{
        animationDelay: `${delay}ms`,
        background: "linear-gradient(160deg, rgba(20,16,12,0.75) 0%, rgba(8,8,10,0.92) 100%)",
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)"
      }}
    >
      <p className="text-xs text-amber-400/60 uppercase tracking-wider mb-2">{title}</p>
      <p className="text-2xl font-light text-white tracking-tight" style={{
        textShadow: "0 0 30px rgba(245,158,11,0.15)"
      }}>{value}</p>
      {subtitle && <p className="text-sm text-white/30 mt-1">{subtitle}</p>}
    </div>
  );
}

// Hero card with 3D tilt
function HeroValueCard({ value }: { value: string }) {
  return (
    <div
      className="obsidian-hero-card relative rounded-xl p-10 text-center transition-all duration-400 hover:transform hover:translate-y-[-4px]"
      style={{
        background: "linear-gradient(145deg, rgba(245,158,11,0.04) 0%, rgba(8,8,10,0.95) 100%)",
        border: "1px solid rgba(245,158,11,0.1)",
        boxShadow: "0 35px 70px rgba(0,0,0,0.6), 0 0 80px rgba(245,158,11,0.06)",
        transform: "perspective(1000px) rotateX(2deg)",
        transformOrigin: "center bottom"
      }}
    >
      {/* Gold accent line */}
      <div
        className="absolute top-0 left-[20%] right-[20%] h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)"
        }}
      />

      <p className="text-sm text-amber-400/50 uppercase tracking-[0.2em] mb-3">Portfolio Value</p>
      <p
        className="text-5xl font-extralight text-white tracking-tight mb-4"
        style={{
          textShadow: "0 0 60px rgba(245,158,11,0.3), 0 0 120px rgba(245,158,11,0.15)"
        }}
      >
        {value}
      </p>
      <div className="flex items-center justify-center gap-4 text-sm">
        <span
          className="px-3 py-1 rounded-full"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.15)",
            color: "#F59E0B"
          }}
        >
          +14.88% all time
        </span>
        <span className="text-white/30">|</span>
        <span className="text-emerald-400">+$320,000 unrealized</span>
      </div>
    </div>
  );
}

// Donut chart component
function DonutChart() {
  const segments = [
    { percent: 33, color: "#F59E0B", label: "Treasury" },
    { percent: 25, color: "#059669", label: "Real Estate" },
    { percent: 21, color: "#8B5CF6", label: "Credit" },
    { percent: 21, color: "#3B82F6", label: "Commodities" }
  ];

  let offset = 0;

  return (
    <div className="flex items-center gap-8">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {segments.map((seg, i) => {
          const circumference = 2 * Math.PI * 40;
          const strokeLength = (seg.percent / 100) * circumference;
          const strokeOffset = offset;
          offset += strokeLength;

          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${strokeLength} ${circumference}`}
              strokeDashoffset={-strokeOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
              style={{
                transformOrigin: "center",
                transform: "rotate(-90deg)",
                filter: `drop-shadow(0 0 8px ${seg.color}40)`
              }}
            />
          );
        })}
      </svg>

      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color, boxShadow: `0 0 10px ${seg.color}50` }} />
            <span className="text-sm text-white/60">{seg.label}</span>
            <span className="text-sm text-white/30">{seg.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Holding card
function HoldingCard({
  name,
  type,
  value,
  apy,
  gain,
  status,
  delay = 0
}: {
  name: string;
  type: string;
  value: string;
  apy: string;
  gain: string;
  status: "unlocked" | "locked";
  delay?: number;
}) {
  return (
    <div
      className="rounded-xl p-5 transition-all duration-400 hover:-translate-y-1 animate-fadeIn"
      style={{
        animationDelay: `${delay}ms`,
        background: "linear-gradient(145deg, rgba(20,25,45,0.9), rgba(10,15,30,0.95))",
        boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.03)"
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white font-medium">{name}</p>
          <p className="text-sm text-white/40">{type} · {status === "locked" ? "Locked" : "Unlocked"}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            status === "locked"
              ? "bg-white/5 text-white/40"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {status === "locked" ? "Locked" : "Active"}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-light text-white">{value}</p>
          <p className="text-sm text-amber-400">{apy} APY</p>
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-medium">{gain}</p>
          <button
            className="text-xs text-white/40 hover:text-amber-400 transition-colors mt-1"
            disabled={status === "locked"}
          >
            {status === "locked" ? "Locked 45d" : "Redeem →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ObsidianWealthPreview() {
  const totalValue = useCountUp(2470000, 2500);

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: "linear-gradient(180deg, #050508 0%, #0a0a0f 50%, #050508 100%)"
      }}
    >
      {/* Subtle warm ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.03) 0%, transparent 70%)",
            filter: "blur(100px)"
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-amber-400/50 text-sm uppercase tracking-[0.15em]">Welcome back</p>
            <h1 className="text-2xl text-white font-light mt-1">Sarah Chen</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center">
              <span className="text-amber-400 text-sm">SC</span>
            </div>
          </div>
        </div>

        {/* Hero Card */}
        <div className="mb-8">
          <HeroValueCard value={`$${totalValue.toLocaleString()}.00`} />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <ObsidianStatCard title="Cost Basis" value="$2,150,000" delay={100} />
          <ObsidianStatCard title="Total Gain" value="+$320,000" subtitle="+14.88%" delay={200} />
          <ObsidianStatCard title="Positions" value="5" subtitle="4 unlocked" delay={300} />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-5 gap-8 mb-10">
          {/* Allocation */}
          <div
            className="col-span-2 rounded-xl p-6"
            style={{
              background: "linear-gradient(160deg, rgba(20,16,12,0.6) 0%, rgba(8,8,10,0.85) 100%)",
              border: "1px solid rgba(255,255,255,0.03)"
            }}
          >
            <h2 className="text-sm text-amber-400/50 uppercase tracking-wider mb-6">Allocation</h2>
            <DonutChart />
          </div>

          {/* Performance Sparkline */}
          <div
            className="col-span-3 rounded-xl p-6"
            style={{
              background: "linear-gradient(160deg, rgba(20,16,12,0.6) 0%, rgba(8,8,10,0.85) 100%)",
              border: "1px solid rgba(255,255,255,0.03)"
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-amber-400/50 uppercase tracking-wider">Performance</h2>
              <div className="flex gap-2">
                {["1W", "1M", "3M", "1Y"].map((period, i) => (
                  <button
                    key={period}
                    className={`text-xs px-3 py-1 rounded ${
                      i === 3 ? "bg-amber-400/10 text-amber-400" : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple SVG chart */}
            <svg viewBox="0 0 400 120" className="w-full h-28">
              <defs>
                <linearGradient id="obsidianGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 100 Q 50 90, 100 80 T 200 60 T 300 40 T 400 20"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }}
              />
              <path
                d="M 0 100 Q 50 90, 100 80 T 200 60 T 300 40 T 400 20 L 400 120 L 0 120 Z"
                fill="url(#obsidianGradient)"
              />
            </svg>

            <div className="flex justify-between text-xs text-white/20 mt-2">
              <span>Jan '25</span>
              <span>Feb '26</span>
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg text-white font-light">Your Holdings</h2>
            <button className="text-sm text-amber-400/60 hover:text-amber-400 transition-colors">
              + Add Position
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <HoldingCard
              name="US Treasury 6M"
              type="Fixed Income"
              value="$620,000"
              apy="5.2%"
              gain="+$12,400"
              status="unlocked"
              delay={0}
            />
            <HoldingCard
              name="Manhattan RE Fund"
              type="Real Estate"
              value="$450,000"
              apy="8.1%"
              gain="+$36,450"
              status="locked"
              delay={100}
            />
            <HoldingCard
              name="Corporate Credit Pool"
              type="Private Credit"
              value="$380,000"
              apy="6.8%"
              gain="+$25,840"
              status="unlocked"
              delay={200}
            />
            <HoldingCard
              name="Infrastructure Fund"
              type="Real Assets"
              value="$520,000"
              apy="4.9%"
              gain="+$25,480"
              status="unlocked"
              delay={300}
            />
          </div>
        </div>

        {/* Activity */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "linear-gradient(160deg, rgba(20,16,12,0.5) 0%, rgba(8,8,10,0.8) 100%)",
            border: "1px solid rgba(255,255,255,0.02)"
          }}
        >
          <h2 className="text-sm text-amber-400/50 uppercase tracking-wider mb-4">Recent Activity</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-emerald-400 text-sm">↑</span>
                </div>
                <div>
                  <p className="text-white text-sm">Invested $50,000</p>
                  <p className="text-white/30 text-xs">Treasury Pool · Today</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">Confirmed</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <span className="text-amber-400 text-sm">+</span>
                </div>
                <div>
                  <p className="text-white text-sm">Yield distribution +$1,250</p>
                  <p className="text-white/30 text-xs">RE Fund · Yesterday</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">Confirmed</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
