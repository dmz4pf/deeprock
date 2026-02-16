import { Landmark, Building2, Briefcase, TrendingUp, Gem, LucideIcon } from "lucide-react";

export interface AssetClassConfig {
  slug: string;
  label: string;
  description: string;
  details: string;
  riskLevel: string;
  riskColor: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  glowRgb: string;
  href: string;
}

export const ASSET_CLASSES: AssetClassConfig[] = [
  {
    slug: "treasury",
    label: "Treasury Bills",
    description: "Short-term US government securities with stable, risk-free returns",
    details:
      "Government-backed securities offering the highest safety rating available. Ideal for conservative investors seeking capital preservation with predictable, steady income. Typical maturities range from 4 to 52 weeks with no credit risk.",
    riskLevel: "Very Low",
    riskColor: "#6FCF97",
    icon: Landmark,
    color: "text-forge-copper",
    bgColor: "bg-forge-copper/10",
    glowRgb: "232,180,184",
    href: "/pools/treasury",
  },
  {
    slug: "real-estate",
    label: "Real Estate",
    description: "Diversified commercial and residential property investments",
    details:
      "Tokenized exposure to institutional-grade commercial and residential properties across major markets. Combines rental income with long-term capital appreciation potential. Quarterly distributions backed by physical assets.",
    riskLevel: "Medium",
    riskColor: "#F59E0B",
    icon: Building2,
    color: "text-forge-rose-gold",
    bgColor: "bg-forge-rose-gold/10",
    glowRgb: "196,162,101",
    href: "/pools/real-estate",
  },
  {
    slug: "private-credit",
    label: "Private Credit",
    description: "Senior secured loans to established mid-market companies",
    details:
      "Direct lending to established mid-market companies with strong cash flows and collateral. Offers premium yields above traditional fixed income with senior secured positioning. Typical loan terms of 2-5 years with floating rate structures.",
    riskLevel: "Medium",
    riskColor: "#F59E0B",
    icon: Briefcase,
    color: "text-forge-violet",
    bgColor: "bg-forge-violet/10",
    glowRgb: "245,230,211",
    href: "/pools/private-credit",
  },
  {
    slug: "corporate-bonds",
    label: "Corporate Bonds",
    description: "Investment-grade bonds from Fortune 500 companies",
    details:
      "Investment-grade debt instruments from blue-chip corporations. Provides reliable coupon payments with lower volatility than equities. Diversified across industries and maturities for stable, predictable returns.",
    riskLevel: "Low",
    riskColor: "#6FCF97",
    icon: TrendingUp,
    color: "text-forge-teal",
    bgColor: "bg-forge-teal/10",
    glowRgb: "184,169,154",
    href: "/pools/corporate-bonds",
  },
  {
    slug: "commodities",
    label: "Commodities",
    description: "Precious metals, energy, and agricultural commodity investments",
    details:
      "Tokenized access to precious metals, energy, and agricultural markets. Provides portfolio diversification and natural inflation hedging. Backed by physically stored or futures-settled commodity positions.",
    riskLevel: "Medium-High",
    riskColor: "#F59E0B",
    icon: Gem,
    color: "text-forge-bronze",
    bgColor: "bg-forge-bronze/10",
    glowRgb: "111,207,151",
    href: "/pools/commodities",
  },
];

export function getAssetClassBySlug(slug: string): AssetClassConfig | undefined {
  return ASSET_CLASSES.find((ac) => ac.slug === slug);
}

export const ASSET_CLASS_SLUGS = ASSET_CLASSES.map((ac) => ac.slug);
