"use client";

/* ─────────────────────────────────────────────────────────────
   Design Tokyo — Zen Precision
   Japanese minimalism meets institutional finance.
   Ma (間): the meaningful emptiness between things.
   ────────────────────────────────────────────────────────────── */

const POSITIONS = [
  { asset: "US Treasury 6-Mo", category: "Government", value: "$842,100", apy: "5.28" },
  { asset: "Ares Senior Secured", category: "Private Credit", value: "$518,200", apy: "9.45" },
  { asset: "Manhattan REIT A", category: "Real Estate", value: "$624,500", apy: "7.12" },
  { asset: "Prologis Logistics", category: "Real Estate", value: "$392,750", apy: "6.80" },
  { asset: "Swiss Gold Vault", category: "Commodity", value: "$284,342", apy: "3.14" },
  { asset: "Maple Credit Note", category: "Private Credit", value: "$185,500", apy: "8.91" },
];

const HIGHEST_APY_INDEX = 1; // Ares Senior Secured at 9.45%

const OPPORTUNITIES = [
  { name: "Avalanche Prime Yield", apy: "5.28", tvl: "$4.2M", category: "Government Bonds" },
  { name: "Alpine Credit Facility", apy: "9.45", tvl: "$6.1M", category: "Private Credit" },
  { name: "Summit Real Estate Trust", apy: "7.12", tvl: "$4.5M", category: "Real Estate" },
];

function Hairline() {
  return <div className="w-full" style={{ height: "0.5px", backgroundColor: "#3A3A38" }} />;
}

export default function DesignTokyo() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: "#0D0D0D",
        fontFamily: "'Outfit', 'Helvetica Neue', sans-serif",
      }}
    >
      <div className="mx-auto w-full" style={{ maxWidth: 900, padding: "80px 32px 120px" }}>

        {/* ── Section 1: Mark ── */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ marginBottom: 32 }}>
            <p
              style={{
                fontSize: 12,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#A0A09A",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              RWA
            </p>
            <p
              style={{
                fontSize: 12,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#A0A09A",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Gateway
            </p>
          </div>
          <Hairline />
        </section>

        {/* ── Section 2: The Number ── */}
        <section style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: 56,
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#F5F5F0",
              margin: 0,
              lineHeight: 1.1,
              fontWeight: 400,
              letterSpacing: "-0.02em",
            }}
          >
            $2,847,392
          </p>
          <p
            style={{
              fontSize: 14,
              color: "#6B8E6B",
              margin: 0,
              marginTop: 24,
            }}
          >
            +0.45% this month
          </p>
        </section>

        {/* ── 48px breathing space ── */}
        <div style={{ height: 48 }} />

        {/* ── Section 3: Vital Grid ── */}
        <section style={{ marginBottom: 64 }}>
          <div
            className="grid grid-cols-2"
            style={{
              border: "0.5px solid #3A3A38",
            }}
          >
            <VitalCell label="Invested" value="$2.4M" borderRight borderBottom />
            <VitalCell label="Yield" value="$427K" borderBottom />
            <VitalCell label="Positions" value="12" borderRight />
            <VitalCell label="Avg APY" value="7.2%" />
          </div>
        </section>

        {/* ── Section 4: Positions ── */}
        <section style={{ marginBottom: 64 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#A0A09A",
              margin: 0,
              marginBottom: 16,
            }}
          >
            Positions
          </p>
          <Hairline />
          {POSITIONS.map((pos, i) => (
            <div key={pos.asset}>
              <div
                className="flex items-center justify-between"
                style={{ padding: "20px 0" }}
              >
                <div className="flex items-center" style={{ gap: 10 }}>
                  {i === HIGHEST_APY_INDEX && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#DC2626",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div>
                    <p
                      style={{
                        fontSize: 16,
                        color: "#F5F5F0",
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {pos.asset}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#A0A09A",
                        margin: 0,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginTop: 2,
                      }}
                    >
                      {pos.category}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: 16,
                      color: "#F5F5F0",
                      margin: 0,
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {pos.value}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#A0A09A",
                      margin: 0,
                      marginTop: 2,
                    }}
                  >
                    {pos.apy}% APY
                  </p>
                </div>
              </div>
              <Hairline />
            </div>
          ))}
        </section>

        {/* ── Section 5: Opportunities ── */}
        <section style={{ marginBottom: 64 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#A0A09A",
              margin: 0,
              marginBottom: 16,
            }}
          >
            Opportunities
          </p>
          <Hairline />
          {OPPORTUNITIES.map((pool) => (
            <div key={pool.name}>
              <div style={{ padding: "24px 0" }}>
                <div
                  className="flex items-baseline justify-between"
                  style={{ marginBottom: 8 }}
                >
                  <p
                    style={{
                      fontSize: 16,
                      color: "#F5F5F0",
                      margin: 0,
                    }}
                  >
                    {pool.name}
                  </p>
                  <p
                    style={{
                      fontSize: 24,
                      fontFamily: "'Playfair Display', Georgia, serif",
                      color: "#DC2626",
                      margin: 0,
                      fontWeight: 400,
                    }}
                  >
                    {pool.apy}%
                  </p>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#A0A09A",
                    margin: 0,
                  }}
                >
                  {pool.tvl} TVL · {pool.category}
                </p>
              </div>
              <Hairline />
            </div>
          ))}
        </section>

        {/* ── Section 6: Seal ── */}
        <section>
          <Hairline />
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              color: "#A0A09A",
              textAlign: "center",
              margin: 0,
              marginTop: 32,
            }}
          >
            Avalanche · Verified · Immutable
          </p>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#DC2626",
              margin: "16px auto 0",
            }}
          />
        </section>

      </div>
    </div>
  );
}

/* ── Vital Cell ── */

function VitalCell({
  label,
  value,
  borderRight = false,
  borderBottom = false,
}: {
  label: string;
  value: string;
  borderRight?: boolean;
  borderBottom?: boolean;
}) {
  return (
    <div
      style={{
        padding: 32,
        borderRight: borderRight ? "0.5px solid #3A3A38" : "none",
        borderBottom: borderBottom ? "0.5px solid #3A3A38" : "none",
      }}
    >
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#A0A09A",
          margin: 0,
          marginBottom: 12,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 28,
          fontFamily: "'Playfair Display', Georgia, serif",
          color: "#F5F5F0",
          margin: 0,
          fontWeight: 400,
        }}
      >
        {value}
      </p>
    </div>
  );
}
