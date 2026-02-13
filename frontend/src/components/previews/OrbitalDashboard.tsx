"use client";

import { useEffect, useState, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// ORBITAL DASHBOARD
// Cinematic deep space visualization with dramatic lighting
// Inspired by film title sequences and space mission control interfaces
// ═══════════════════════════════════════════════════════════════════════════════

interface Asset {
  id: string;
  name: string;
  ticker: string;
  value: number;
  apy: number;
  allocation: number;
  riskLevel: "low" | "medium" | "high";
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
}

const DEFAULT_ASSETS: Asset[] = [
  { id: "1", name: "Treasury Bonds", ticker: "USTF", value: 875000, apy: 5.2, allocation: 35, riskLevel: "low", orbitRadius: 180, orbitSpeed: 45, color: "#06B6D4" },
  { id: "2", name: "Real Estate", ticker: "REPR", value: 700000, apy: 7.8, allocation: 28, riskLevel: "medium", orbitRadius: 240, orbitSpeed: 60, color: "#8B5CF6" },
  { id: "3", name: "Private Credit", ticker: "PCPL", value: 550000, apy: 9.4, allocation: 22, riskLevel: "medium", orbitRadius: 300, orbitSpeed: 80, color: "#10B981" },
  { id: "4", name: "Commodities", ticker: "CMDX", value: 375000, apy: 3.8, allocation: 15, riskLevel: "high", orbitRadius: 360, orbitSpeed: 100, color: "#F59E0B" },
];

function useAnimatedValue(target: number, duration = 2500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    const startTime = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

function OrbitingAsset({
  asset,
  centerX,
  centerY,
  isSelected,
  onSelect,
}: {
  asset: Asset;
  centerX: number;
  centerY: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const [angle, setAngle] = useState(Math.random() * 360);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const animate = (timestamp: number) => {
      const delta = timestamp - lastTime;
      lastTime = timestamp;
      setAngle((prev) => (prev + (360 / asset.orbitSpeed / 1000) * delta) % 360);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [asset.orbitSpeed]);

  const radians = (angle * Math.PI) / 180;
  const x = centerX + Math.cos(radians) * asset.orbitRadius;
  const y = centerY + Math.sin(radians) * asset.orbitRadius * 0.4; // Elliptical orbit for depth

  // Z-depth for opacity/scale (perspective effect)
  const zDepth = Math.sin(radians);
  const scale = 0.7 + (zDepth + 1) * 0.15;
  const opacity = 0.5 + (zDepth + 1) * 0.25;

  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(asset.id)}
    >
      {/* Orbit ring */}
      <ellipse
        cx={centerX}
        cy={centerY}
        rx={asset.orbitRadius}
        ry={asset.orbitRadius * 0.4}
        fill="none"
        stroke={asset.color}
        strokeWidth="1"
        strokeOpacity={isSelected ? 0.3 : 0.08}
        strokeDasharray="4 8"
      />

      {/* Asset node */}
      <g transform={`translate(${x}, ${y}) scale(${scale})`} style={{ opacity }}>
        {/* Glow */}
        <circle
          r={isSelected || isHovered ? 50 : 40}
          fill={asset.color}
          opacity={isSelected ? 0.15 : 0.08}
          style={{ filter: "blur(20px)" }}
        />

        {/* Outer ring */}
        <circle
          r={isSelected || isHovered ? 36 : 30}
          fill="none"
          stroke={asset.color}
          strokeWidth={isSelected ? 2 : 1}
          strokeOpacity={0.5}
        />

        {/* Inner fill */}
        <circle
          r={isSelected || isHovered ? 30 : 24}
          fill={`url(#gradient-${asset.id})`}
          style={{ filter: isSelected ? `drop-shadow(0 0 20px ${asset.color})` : "none" }}
        />

        {/* Value text */}
        <text
          y={-4}
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="600"
          style={{ fontFamily: "system-ui" }}
        >
          ${(asset.value / 1000).toFixed(0)}K
        </text>
        <text
          y={10}
          textAnchor="middle"
          fill="white"
          fillOpacity="0.5"
          fontSize="8"
          style={{ fontFamily: "monospace" }}
        >
          {asset.ticker}
        </text>
      </g>

      {/* Gradient definition */}
      <defs>
        <radialGradient id={`gradient-${asset.id}`}>
          <stop offset="0%" stopColor={asset.color} stopOpacity="0.4" />
          <stop offset="70%" stopColor={asset.color} stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
    </g>
  );
}

function CentralHub({ totalValue, pnl }: { totalValue: number; pnl: number }) {
  const animatedValue = useAnimatedValue(totalValue, 2500);
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseScale((p) => (p === 1 ? 1.02 : 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <g>
      {/* Multiple glow layers */}
      <circle
        r="200"
        fill="url(#hubGlow)"
        style={{ filter: "blur(100px)" }}
      />
      <circle
        r="120"
        fill="url(#hubGlowInner)"
        style={{ filter: "blur(60px)" }}
      />

      {/* Animated rings */}
      {[1, 2, 3].map((ring) => (
        <circle
          key={ring}
          r={80 + ring * 15}
          fill="none"
          stroke="rgba(6,182,212,0.1)"
          strokeWidth="1"
          style={{
            transform: `scale(${pulseScale})`,
            transformOrigin: "center",
            transition: "transform 2s ease-in-out",
          }}
        >
          <animate
            attributeName="stroke-opacity"
            values="0.1;0.2;0.1"
            dur={`${2 + ring}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Core container */}
      <circle
        r="85"
        fill="url(#hubCore)"
        stroke="rgba(6,182,212,0.3)"
        strokeWidth="2"
        style={{ filter: "drop-shadow(0 0 30px rgba(6,182,212,0.3))" }}
      />

      {/* Inner decorative ring */}
      <circle
        r="70"
        fill="none"
        stroke="rgba(6,182,212,0.15)"
        strokeWidth="1"
        strokeDasharray="2 6"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0"
          to="360"
          dur="30s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Text content */}
      <text
        y="-25"
        textAnchor="middle"
        fill="rgba(6,182,212,0.5)"
        fontSize="9"
        style={{ fontFamily: "system-ui", letterSpacing: "0.3em" }}
      >
        TOTAL VALUE
      </text>
      <text
        y="8"
        textAnchor="middle"
        fill="white"
        fontSize="32"
        fontWeight="200"
        style={{ fontFamily: "system-ui" }}
      >
        ${(animatedValue / 1000000).toFixed(2)}M
      </text>
      <text
        y="32"
        textAnchor="middle"
        fill={pnl >= 0 ? "#10B981" : "#EF4444"}
        fontSize="14"
        fontWeight="500"
        style={{ fontFamily: "monospace" }}
      >
        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
      </text>

      {/* Gradient definitions */}
      <defs>
        <radialGradient id="hubGlow">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="hubGlowInner">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="hubCore">
          <stop offset="0%" stopColor="rgba(6,20,40,0.95)" />
          <stop offset="100%" stopColor="rgba(3,6,8,0.98)" />
        </radialGradient>
      </defs>
    </g>
  );
}

export function OrbitalDashboard() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(600, rect.height) });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const totalValue = DEFAULT_ASSETS.reduce((sum, a) => sum + a.value, 0);
  const pnlPercentage = 6.38;
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  const selectedAssetData = selectedAsset
    ? DEFAULT_ASSETS.find((a) => a.id === selectedAsset)
    : null;

  return (
    <div className="min-h-screen bg-[#020408] text-white overflow-hidden">
      {/* Deep space background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Star field */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(1px 1px at 20px 30px, white, transparent),
                        radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), transparent),
                        radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.6), transparent),
                        radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.4), transparent),
                        radial-gradient(1px 1px at 130px 80px, white, transparent),
                        radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.5), transparent)`,
            backgroundSize: "200px 200px",
            opacity: 0.4,
          }}
        />

        {/* Nebula effects */}
        <div
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px]"
          style={{
            background: "radial-gradient(ellipse, rgba(6,182,212,0.05) 0%, transparent 60%)",
            filter: "blur(100px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px]"
          style={{
            background: "radial-gradient(ellipse, rgba(139,92,246,0.04) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CINEMATIC HEADER
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-10">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />

        <div className="relative max-w-[1800px] mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div>
              <h1 className="text-2xl font-extralight tracking-[0.2em] text-white/90">
                DEEPROCK
              </h1>
              <p className="text-[10px] tracking-[0.4em] text-cyan-400/60 mt-1">
                MISSION CONTROL
              </p>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-6 pl-8 border-l border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-emerald-400/80">SYSTEMS ONLINE</span>
              </div>
              <div className="text-[10px] font-mono text-white/30">
                AVAX C-CHAIN · BLOCK 48,291,847
              </div>
            </div>
          </div>

          {/* Time display */}
          <div className="text-right">
            <p className="text-3xl font-extralight tabular-nums text-white/80">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </p>
            <p className="text-[10px] text-white/30 tracking-widest mt-1">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
            </p>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN ORBITAL VISUALIZATION
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1"
        style={{ minHeight: "70vh" }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
          style={{ margin: "auto" }}
        >
          {/* Central hub */}
          <g transform={`translate(${centerX}, ${centerY})`}>
            <CentralHub totalValue={totalValue} pnl={pnlPercentage} />
          </g>

          {/* Orbiting assets */}
          {DEFAULT_ASSETS.map((asset) => (
            <OrbitingAsset
              key={asset.id}
              asset={asset}
              centerX={centerX}
              centerY={centerY}
              isSelected={selectedAsset === asset.id}
              onSelect={setSelectedAsset}
            />
          ))}
        </svg>

        {/* Selected asset detail panel */}
        {selectedAssetData && (
          <div
            className="absolute top-8 right-8 w-80 rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(6,20,40,0.95), rgba(3,6,8,0.98))",
              border: `1px solid ${selectedAssetData.color}30`,
              boxShadow: `0 0 60px ${selectedAssetData.color}15`,
            }}
          >
            <div
              className="px-6 py-4"
              style={{
                background: `linear-gradient(90deg, ${selectedAssetData.color}15, transparent)`,
                borderBottom: `1px solid ${selectedAssetData.color}20`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-8 rounded-full"
                    style={{ backgroundColor: selectedAssetData.color }}
                  />
                  <div>
                    <p className="text-lg font-medium">{selectedAssetData.name}</p>
                    <p className="text-xs text-white/40 font-mono">{selectedAssetData.ticker}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-white/40">Value</span>
                <span className="text-2xl font-light">${(selectedAssetData.value / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-white/40">APY</span>
                <span className="text-xl font-light" style={{ color: selectedAssetData.color }}>
                  {selectedAssetData.apy}%
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-white/40">Allocation</span>
                <span className="text-xl font-light">{selectedAssetData.allocation}%</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-white/40">Risk Level</span>
                <span
                  className={`text-sm font-medium uppercase ${
                    selectedAssetData.riskLevel === "low"
                      ? "text-emerald-400"
                      : selectedAssetData.riskLevel === "medium"
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {selectedAssetData.riskLevel}
                </span>
              </div>

              {/* Progress bar for allocation */}
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-white/30 mb-2">Portfolio Weight</p>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${selectedAssetData.allocation}%`,
                      backgroundColor: selectedAssetData.color,
                      boxShadow: `0 0 10px ${selectedAssetData.color}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BOTTOM TELEMETRY BAR
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="relative max-w-[1800px] mx-auto px-8 py-6">
          <div
            className="flex items-center justify-between py-4 px-8 rounded-xl"
            style={{
              background: "linear-gradient(90deg, rgba(6,182,212,0.05), transparent 50%, rgba(6,182,212,0.05))",
              border: "1px solid rgba(6,182,212,0.1)",
            }}
          >
            {[
              { label: "YIELD/24H", value: "$1,247", trend: "+12%" },
              { label: "POSITIONS", value: "4", trend: "" },
              { label: "AVG APY", value: "6.55%", trend: "" },
              { label: "HEALTH", value: "87/100", trend: "" },
              { label: "PENDING", value: "$847", trend: "" },
              { label: "GAS", value: "25 nAVAX", trend: "" },
            ].map((metric, i) => (
              <div key={i} className="text-center px-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-400/40 mb-1">{metric.label}</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg font-light text-white">{metric.value}</p>
                  {metric.trend && (
                    <span className="text-xs text-emerald-400">{metric.trend}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-white/20">
            <span>POWERED BY AVALANCHE</span>
            <span>·</span>
            <span>INSTITUTIONAL GRADE</span>
            <span>·</span>
            <span>REAL-WORLD ASSETS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default OrbitalDashboard;
