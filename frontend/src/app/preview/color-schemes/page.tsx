"use client";

interface ColorScheme {
  name: string;
  tagline: string;
  bg: string;
  surface: string;
  elevated: string;
  glass: string;
  text1: string;
  text2: string;
  text3: string;
  accent: string;
  accentHover: string;
  accentGlow: string;
  border: string;
  activeBg: string;
  gradient: string;
}

const schemes: ColorScheme[] = [
  {
    name: "Obsidian Forge",
    tagline: "Warm Luxury",
    bg: "#060504",
    surface: "#110F0C",
    elevated: "#1A1612",
    glass: "rgba(17, 15, 12, 0.65)",
    text1: "#EDE5D8",
    text2: "#9B8B78",
    text3: "#7A6A59",
    accent: "#CD7F32",
    accentHover: "#E8A065",
    accentGlow: "rgba(205, 127, 50, 0.15)",
    border: "rgba(205, 127, 50, 0.08)",
    activeBg: "rgba(205, 127, 50, 0.10)",
    gradient: "linear-gradient(135deg, #CD7F32, #B76E79, #7C3AED, #14B8A6, #CD7F32)",
  },
  {
    name: "Arctic Silver",
    tagline: "Institutional Frost",
    bg: "#0A0E1A",
    surface: "#0F1424",
    elevated: "#151B30",
    glass: "rgba(15, 20, 36, 0.65)",
    text1: "#E2E8F0",
    text2: "#7B8BA8",
    text3: "#4A5568",
    accent: "#3B82F6",
    accentHover: "#60A5FA",
    accentGlow: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.08)",
    activeBg: "rgba(59, 130, 246, 0.10)",
    gradient: "linear-gradient(135deg, #3B82F6, #6366F1, #818CF8, #3B82F6)",
  },
  {
    name: "Violet Protocol",
    tagline: "Digital Alchemy",
    bg: "#0C0A18",
    surface: "#110E22",
    elevated: "#17132E",
    glass: "rgba(17, 14, 34, 0.65)",
    text1: "#E8E0F0",
    text2: "#8B7FA8",
    text3: "#5A4E73",
    accent: "#A78BFA",
    accentHover: "#C4B5FD",
    accentGlow: "rgba(167, 139, 250, 0.15)",
    border: "rgba(167, 139, 250, 0.08)",
    activeBg: "rgba(167, 139, 250, 0.10)",
    gradient: "linear-gradient(135deg, #A78BFA, #7C3AED, #EC4899, #A78BFA)",
  },
  {
    name: "Emerald Vault",
    tagline: "Nature Wealth",
    bg: "#0A1410",
    surface: "#0E1A14",
    elevated: "#14221C",
    glass: "rgba(14, 26, 20, 0.65)",
    text1: "#E0F0E8",
    text2: "#7FA88B",
    text3: "#4E735A",
    accent: "#10B981",
    accentHover: "#34D399",
    accentGlow: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.08)",
    activeBg: "rgba(16, 185, 129, 0.10)",
    gradient: "linear-gradient(135deg, #10B981, #059669, #14B8A6, #10B981)",
  },
  {
    name: "Rose Quartz",
    tagline: "Modern Elegance",
    bg: "#140A10",
    surface: "#1A0E16",
    elevated: "#22141E",
    glass: "rgba(26, 14, 22, 0.65)",
    text1: "#F0E0EA",
    text2: "#A87F96",
    text3: "#734E65",
    accent: "#F472B6",
    accentHover: "#F9A8D4",
    accentGlow: "rgba(244, 114, 182, 0.15)",
    border: "rgba(244, 114, 182, 0.08)",
    activeBg: "rgba(244, 114, 182, 0.10)",
    gradient: "linear-gradient(135deg, #F472B6, #EC4899, #A855F7, #F472B6)",
  },
  {
    name: "Midnight Steel",
    tagline: "Minimal Industrial",
    bg: "#0C0E14",
    surface: "#10131A",
    elevated: "#161A24",
    glass: "rgba(16, 19, 26, 0.65)",
    text1: "#E2E8F0",
    text2: "#8494A7",
    text3: "#4A5568",
    accent: "#94A3B8",
    accentHover: "#CBD5E1",
    accentGlow: "rgba(148, 163, 184, 0.15)",
    border: "rgba(148, 163, 184, 0.08)",
    activeBg: "rgba(148, 163, 184, 0.10)",
    gradient: "linear-gradient(135deg, #94A3B8, #64748B, #475569, #94A3B8)",
  },
];

/* ── Mini collapsed sidebar mockup ── */
function CollapsedMockup({ scheme }: { scheme: ColorScheme }) {
  const icons = ["P", "L", "D", "S"];
  return (
    <div
      style={{
        width: 44,
        background: scheme.glass,
        border: `1px solid ${scheme.border}`,
        borderRadius: 10,
        padding: "10px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        flexShrink: 0,
      }}
    >
      {/* Logo dot */}
      <div
        style={{
          width: 18,
          height: 18,
          background: scheme.gradient,
          transform: "rotate(45deg)",
          borderRadius: 3,
          opacity: 0.7,
          marginBottom: 8,
        }}
      />
      {icons.map((icon, i) => (
        <div
          key={icon}
          style={{
            width: 32,
            height: 28,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: i === 0 ? 700 : 500,
            color: i === 0 ? scheme.accent : scheme.text3,
            background: i === 0 ? scheme.activeBg : "transparent",
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );
}

/* ── Mini expanded sidebar mockup ── */
function ExpandedMockup({ scheme }: { scheme: ColorScheme }) {
  const navItems = [
    { label: "Portfolio", active: true },
    { label: "Pools", active: false },
    { label: "Documents", active: false },
    { label: "Settings", active: false },
  ];

  return (
    <div
      style={{
        width: 150,
        background: scheme.glass,
        border: `1px solid ${scheme.border}`,
        borderRadius: 10,
        padding: "10px 0",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 10px 8px",
          borderBottom: `1px solid ${scheme.border}`,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            background: scheme.gradient,
            transform: "rotate(45deg)",
            borderRadius: 2,
            opacity: 0.7,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: scheme.text1,
            letterSpacing: "0.1em",
            fontFamily: "var(--font-serif)",
          }}
        >
          DEEPROCK
        </span>
      </div>

      {/* Nav items — rounded active */}
      <div style={{ padding: "6px 0" }}>
        {navItems.map((item) => (
          <div
            key={item.label}
            style={{
              padding: "5px 10px",
              margin: "1px 5px",
              fontSize: 10,
              fontWeight: item.active ? 600 : 400,
              color: item.active ? scheme.text1 : scheme.text3,
              background: item.active ? scheme.activeBg : "transparent",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: item.active ? scheme.accent : "transparent",
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>

      {/* Chain pill */}
      <div style={{ padding: "6px 10px 0", borderTop: `1px solid ${scheme.border}` }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 600,
            color: "#10B981",
            padding: "2px 6px",
            borderRadius: 10,
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          AVAX
        </span>
      </div>
    </div>
  );
}

/* ── Hero metrics card ── */
function HeroCard({ scheme }: { scheme: ColorScheme }) {
  return (
    <div
      style={{
        background: scheme.surface,
        border: `1px solid ${scheme.border}`,
        borderRadius: 10,
        padding: 16,
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: scheme.text3,
          fontWeight: 600,
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        TOTAL AUM
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: scheme.text1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        $2,547,832
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
        {[
          { label: "W.APY", value: "6.4%", color: scheme.accent },
          { label: "24H VOL", value: "$142.5K", color: scheme.text2 },
          { label: "HEALTH", value: "92", color: "#10B981" },
        ].map((m) => (
          <div key={m.label}>
            <div
              style={{
                fontSize: 8,
                color: scheme.text3,
                fontWeight: 600,
                letterSpacing: "0.08em",
              }}
            >
              {m.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Pool card ── */
function PoolCard({
  scheme,
  name,
  apy,
  tvl,
}: {
  scheme: ColorScheme;
  name: string;
  apy: string;
  tvl: string;
}) {
  return (
    <div
      style={{
        background: scheme.surface,
        border: `1px solid ${scheme.border}`,
        borderRadius: 8,
        padding: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: scheme.text1 }}>
          {name}
        </div>
        <div style={{ fontSize: 10, color: scheme.text3, marginTop: 1 }}>
          TVL {tvl}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: scheme.accent }}>
        {apy}
      </div>
    </div>
  );
}

/* ── Full scheme preview card ── */
function SchemePreview({ scheme }: { scheme: ColorScheme }) {
  return (
    <div
      style={{
        background: scheme.bg,
        borderRadius: 14,
        padding: 20,
        border: `1px solid ${scheme.border}`,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: scheme.text1,
            fontFamily: "var(--font-serif)",
            letterSpacing: "0.04em",
          }}
        >
          {scheme.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: scheme.text3,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginTop: 2,
          }}
        >
          {scheme.tagline}
        </div>
      </div>

      {/* Sidebars + Hero */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <CollapsedMockup scheme={scheme} />
        <ExpandedMockup scheme={scheme} />
        <HeroCard scheme={scheme} />
      </div>

      {/* Pool cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <PoolCard scheme={scheme} name="Treasury Bills" apy="5.2%" tvl="$842K" />
        <PoolCard scheme={scheme} name="Private Credit" apy="8.7%" tvl="$1.2M" />
      </div>

      {/* Color palette */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${scheme.border}`,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: scheme.text3,
            fontWeight: 600,
            letterSpacing: "0.1em",
            marginBottom: 6,
          }}
        >
          PALETTE
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[
            { c: scheme.bg, l: "BG" },
            { c: scheme.surface, l: "Surface" },
            { c: scheme.elevated, l: "Elevated" },
            { c: scheme.accent, l: "Accent" },
            { c: scheme.accentHover, l: "Hover" },
            { c: scheme.text1, l: "T1" },
            { c: scheme.text2, l: "T2" },
            { c: scheme.text3, l: "T3" },
          ].map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  background: s.c,
                  border: `1px solid ${scheme.border}`,
                }}
              />
              <div style={{ fontSize: 7, color: scheme.text3, marginTop: 2 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function ColorSchemesPreview() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#EDE5D8",
            fontFamily: "var(--font-serif)",
            letterSpacing: "0.04em",
            marginBottom: 4,
          }}
        >
          Color Schemes
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#7A6A59",
            marginBottom: 32,
          }}
        >
          Six palettes for the Deeprock design system. Each preview shows collapsed + expanded sidebar states, metrics, and pool cards.
        </div>

        {/* Responsive 2-column grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
            gap: 20,
          }}
        >
          {schemes.map((scheme) => (
            <SchemePreview key={scheme.name} scheme={scheme} />
          ))}
        </div>
      </div>
    </div>
  );
}
