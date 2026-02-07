import { PrismaClient, AssetClass, PoolStatus } from "@prisma/client";
import { NAV_BASE } from "../src/services/nav.service.js";

const prisma = new PrismaClient();

/**
 * Seed script for Asset Pools
 *
 * Creates 64 diverse pools across all asset classes:
 * - 12 Treasury pools
 * - 12 Real Estate pools
 * - 12 Private Credit pools
 * - 12 Corporate Bond pools
 * - 16 Commodities pools
 */

interface PoolData {
  chainPoolId: number;
  name: string;
  assetClass: AssetClass;
  yieldRateBps: number;
  totalDeposited: bigint;
  investorCount: number;
  minInvestment: bigint;
  maxInvestment: bigint;
  status: PoolStatus;
  metadata: {
    description: string;
    riskRating: "low" | "medium" | "high";
    lockupPeriod: number;
    totalCapacity: string;
    availableCapacity: string;
    documents: Array<{ name: string; url: string }>;
  };
}

const pools: PoolData[] = [
  // ============== TREASURY POOLS (4) ==============
  {
    chainPoolId: 1,
    name: "US Treasury Fund",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 525, // 5.25%
    totalDeposited: BigInt("2500000000"), // $2.5M
    investorCount: 47,
    minInvestment: BigInt("100000000"), // $100
    maxInvestment: BigInt("1000000000000"), // $1M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Short-term US Treasury bills providing stable, risk-free returns backed by the US government.",
      riskRating: "low",
      lockupPeriod: 0,
      totalCapacity: "10000000000000", // $10M
      availableCapacity: "7500000000000",
      documents: [
        { name: "Fund Prospectus", url: "/docs/treasury-prospectus.pdf" },
        { name: "Q4 Report", url: "/docs/treasury-q4-2025.pdf" }
      ]
    }
  },
  {
    chainPoolId: 2,
    name: "Treasury Money Market",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 490, // 4.90%
    totalDeposited: BigInt("15000000000000"), // $15M
    investorCount: 312,
    minInvestment: BigInt("50000000"), // $50
    maxInvestment: BigInt("500000000000"), // $500K
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Ultra-liquid money market fund investing in short-term Treasury securities with daily liquidity.",
      riskRating: "low",
      lockupPeriod: 0,
      totalCapacity: "50000000000000", // $50M
      availableCapacity: "35000000000000",
      documents: [
        { name: "Money Market Prospectus", url: "/docs/mm-prospectus.pdf" }
      ]
    }
  },
  {
    chainPoolId: 3,
    name: "Treasury Inflation Protected",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 380, // 3.80%
    totalDeposited: BigInt("8000000000000"), // $8M
    investorCount: 156,
    minInvestment: BigInt("500000000"), // $500
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "TIPS-based fund providing inflation protection with principal adjusted for CPI changes.",
      riskRating: "low",
      lockupPeriod: 30,
      totalCapacity: "20000000000000", // $20M
      availableCapacity: "12000000000000",
      documents: [
        { name: "TIPS Fund Overview", url: "/docs/tips-overview.pdf" }
      ]
    }
  },
  {
    chainPoolId: 4,
    name: "Long-Term Treasury Bonds",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 475, // 4.75%
    totalDeposited: BigInt("5000000000000"), // $5M
    investorCount: 89,
    minInvestment: BigInt("1000000000"), // $1,000
    maxInvestment: BigInt("5000000000000"), // $5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Portfolio of 10-30 year Treasury bonds for investors seeking higher yields with duration exposure.",
      riskRating: "low",
      lockupPeriod: 90,
      totalCapacity: "15000000000000", // $15M
      availableCapacity: "10000000000000",
      documents: [
        { name: "Long-Term Strategy", url: "/docs/lt-treasury.pdf" }
      ]
    }
  },

  // ============== REAL ESTATE POOLS (4) ==============
  {
    chainPoolId: 5,
    name: "Prime Real Estate REIT",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 850, // 8.5%
    totalDeposited: BigInt("20000000000000"), // $20M
    investorCount: 234,
    minInvestment: BigInt("1000000000"), // $1,000
    maxInvestment: BigInt("5000000000000"), // $5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Diversified commercial real estate portfolio across major US cities including office and retail.",
      riskRating: "medium",
      lockupPeriod: 90,
      totalCapacity: "25000000000000", // $25M
      availableCapacity: "5000000000000",
      documents: [
        { name: "REIT Offering Memorandum", url: "/docs/reit-memo.pdf" },
        { name: "Property Portfolio", url: "/docs/reit-properties.pdf" }
      ]
    }
  },
  {
    chainPoolId: 6,
    name: "Multifamily Residential Fund",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 725, // 7.25%
    totalDeposited: BigInt("35000000000000"), // $35M
    investorCount: 456,
    minInvestment: BigInt("2500000000"), // $2,500
    maxInvestment: BigInt("10000000000000"), // $10M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Class A apartment complexes in high-growth metropolitan areas with strong rental demand.",
      riskRating: "medium",
      lockupPeriod: 180,
      totalCapacity: "50000000000000", // $50M
      availableCapacity: "15000000000000",
      documents: [
        { name: "Multifamily PPM", url: "/docs/multi-ppm.pdf" }
      ]
    }
  },
  {
    chainPoolId: 7,
    name: "Industrial Warehouse REIT",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 780, // 7.80%
    totalDeposited: BigInt("18000000000000"), // $18M
    investorCount: 178,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("3000000000000"), // $3M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Last-mile logistics and e-commerce fulfillment centers in strategic distribution hubs.",
      riskRating: "medium",
      lockupPeriod: 120,
      totalCapacity: "30000000000000", // $30M
      availableCapacity: "12000000000000",
      documents: [
        { name: "Industrial Report", url: "/docs/industrial-report.pdf" }
      ]
    }
  },
  {
    chainPoolId: 8,
    name: "Healthcare Real Estate",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 695, // 6.95%
    totalDeposited: BigInt("12000000000000"), // $12M
    investorCount: 123,
    minInvestment: BigInt("10000000000"), // $10,000
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Medical office buildings and senior living facilities with long-term lease agreements.",
      riskRating: "low",
      lockupPeriod: 365,
      totalCapacity: "20000000000000", // $20M
      availableCapacity: "8000000000000",
      documents: [
        { name: "Healthcare Portfolio", url: "/docs/healthcare-portfolio.pdf" }
      ]
    }
  },

  // ============== PRIVATE CREDIT POOLS (4) ==============
  {
    chainPoolId: 9,
    name: "Private Credit Fund I",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 1100, // 11.0%
    totalDeposited: BigInt("12000000000000"), // $12M
    investorCount: 89,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Senior secured loans to established mid-market companies with strong cash flows.",
      riskRating: "medium",
      lockupPeriod: 180,
      totalCapacity: "15000000000000", // $15M
      availableCapacity: "3000000000000",
      documents: [
        { name: "Private Placement Memorandum", url: "/docs/credit-ppm.pdf" },
        { name: "Loan Portfolio Summary", url: "/docs/credit-loans.pdf" }
      ]
    }
  },
  {
    chainPoolId: 10,
    name: "Direct Lending Fund",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 1250, // 12.50%
    totalDeposited: BigInt("25000000000000"), // $25M
    investorCount: 167,
    minInvestment: BigInt("25000000000"), // $25,000
    maxInvestment: BigInt("5000000000000"), // $5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "First lien senior secured loans to lower middle market companies with 2-5x EBITDA coverage.",
      riskRating: "medium",
      lockupPeriod: 365,
      totalCapacity: "40000000000000", // $40M
      availableCapacity: "15000000000000",
      documents: [
        { name: "Direct Lending Strategy", url: "/docs/direct-lending.pdf" }
      ]
    }
  },
  {
    chainPoolId: 11,
    name: "Mezzanine Debt Fund",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 1450, // 14.50%
    totalDeposited: BigInt("8000000000000"), // $8M
    investorCount: 56,
    minInvestment: BigInt("50000000000"), // $50,000
    maxInvestment: BigInt("1000000000000"), // $1M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Subordinated debt with equity kickers targeting buyout and growth capital transactions.",
      riskRating: "high",
      lockupPeriod: 730, // 2 years
      totalCapacity: "15000000000000", // $15M
      availableCapacity: "7000000000000",
      documents: [
        { name: "Mezzanine Fund PPM", url: "/docs/mezz-ppm.pdf" }
      ]
    }
  },
  {
    chainPoolId: 12,
    name: "Specialty Finance Fund",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 985, // 9.85%
    totalDeposited: BigInt("22000000000000"), // $22M
    investorCount: 234,
    minInvestment: BigInt("10000000000"), // $10,000
    maxInvestment: BigInt("3000000000000"), // $3M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Asset-backed loans including equipment finance, factoring, and specialty lending.",
      riskRating: "medium",
      lockupPeriod: 90,
      totalCapacity: "35000000000000", // $35M
      availableCapacity: "13000000000000",
      documents: [
        { name: "Specialty Finance Overview", url: "/docs/specialty-finance.pdf" }
      ]
    }
  },

  // ============== CORPORATE BONDS POOLS (4) ==============
  {
    chainPoolId: 13,
    name: "Investment Grade Bonds",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 675, // 6.75%
    totalDeposited: BigInt("2000000000000"), // $2M
    investorCount: 156,
    minInvestment: BigInt("500000000"), // $500
    maxInvestment: BigInt("500000000000"), // $500K
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Portfolio of AAA-rated corporate bonds from Fortune 500 companies with quarterly distributions.",
      riskRating: "low",
      lockupPeriod: 30,
      totalCapacity: "8000000000000", // $8M
      availableCapacity: "6000000000000",
      documents: [
        { name: "Bond Fund Prospectus", url: "/docs/bonds-prospectus.pdf" },
        { name: "Holdings Report", url: "/docs/bonds-holdings.pdf" }
      ]
    }
  },
  {
    chainPoolId: 14,
    name: "High Yield Corporate Fund",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 875, // 8.75%
    totalDeposited: BigInt("18000000000000"), // $18M
    investorCount: 289,
    minInvestment: BigInt("1000000000"), // $1,000
    maxInvestment: BigInt("1000000000000"), // $1M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Diversified portfolio of BB/B-rated corporate bonds with enhanced yield potential.",
      riskRating: "medium",
      lockupPeriod: 60,
      totalCapacity: "30000000000000", // $30M
      availableCapacity: "12000000000000",
      documents: [
        { name: "High Yield Strategy", url: "/docs/hy-strategy.pdf" }
      ]
    }
  },
  {
    chainPoolId: 15,
    name: "Short Duration Corporate",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 585, // 5.85%
    totalDeposited: BigInt("28000000000000"), // $28M
    investorCount: 423,
    minInvestment: BigInt("250000000"), // $250
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Investment grade corporate bonds with 1-3 year duration for reduced interest rate sensitivity.",
      riskRating: "low",
      lockupPeriod: 0,
      totalCapacity: "40000000000000", // $40M
      availableCapacity: "12000000000000",
      documents: [
        { name: "Short Duration Overview", url: "/docs/short-duration.pdf" }
      ]
    }
  },
  {
    chainPoolId: 16,
    name: "Emerging Market Bonds",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 950, // 9.50%
    totalDeposited: BigInt("6000000000000"), // $6M
    investorCount: 78,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("500000000000"), // $500K
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Hard currency corporate bonds from investment grade EM issuers in Asia and Latin America.",
      riskRating: "high",
      lockupPeriod: 90,
      totalCapacity: "15000000000000", // $15M
      availableCapacity: "9000000000000",
      documents: [
        { name: "EM Bond Strategy", url: "/docs/em-bonds.pdf" }
      ]
    }
  },

  // ============== ADDITIONAL TREASURY POOLS (8 more = 12 total) ==============
  {
    chainPoolId: 17,
    name: "30-Day Treasury Note Fund",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 515, // 5.15%
    totalDeposited: BigInt("42000000000000"), // $42M
    investorCount: 892,
    minInvestment: BigInt("25000000"), // $25
    maxInvestment: BigInt("100000000000"), // $100K
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Ultra-short 30-day Treasury notes for maximum liquidity and minimal duration risk.",
      riskRating: "low",
      lockupPeriod: 0,
      totalCapacity: "100000000000000", // $100M
      availableCapacity: "58000000000000",
      documents: [{ name: "30-Day Note Prospectus", url: "/docs/30day-treasury.pdf" }]
    }
  },
  {
    chainPoolId: 18,
    name: "Treasury Strips Zero Coupon",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 510, // 5.10%
    totalDeposited: BigInt("7500000000000"), // $7.5M
    investorCount: 124,
    minInvestment: BigInt("1000000000"), // $1,000
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Zero-coupon Treasury STRIPS for precise duration matching and tax-efficient accumulation.",
      riskRating: "low",
      lockupPeriod: 180,
      totalCapacity: "15000000000000", // $15M
      availableCapacity: "7500000000000",
      documents: [{ name: "STRIPS Overview", url: "/docs/strips-overview.pdf" }]
    }
  },
  {
    chainPoolId: 19,
    name: "Floating Rate Treasury Fund",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 545, // 5.45%
    totalDeposited: BigInt("18000000000000"), // $18M
    investorCount: 267,
    minInvestment: BigInt("100000000"), // $100
    maxInvestment: BigInt("500000000000"), // $500K
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Treasury floating rate notes that reset quarterly, providing inflation protection.",
      riskRating: "low",
      lockupPeriod: 0,
      totalCapacity: "30000000000000", // $30M
      availableCapacity: "12000000000000",
      documents: [{ name: "FRN Strategy", url: "/docs/frn-treasury.pdf" }]
    }
  },
  {
    chainPoolId: 20,
    name: "Treasury Ladder 1-5Y",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 465, // 4.65%
    totalDeposited: BigInt("32000000000000"), // $32M
    investorCount: 456,
    minInvestment: BigInt("500000000"), // $500
    maxInvestment: BigInt("1000000000000"), // $1M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Laddered Treasury portfolio with staggered maturities from 1-5 years for smooth reinvestment.",
      riskRating: "low",
      lockupPeriod: 30,
      totalCapacity: "50000000000000", // $50M
      availableCapacity: "18000000000000",
      documents: [{ name: "Ladder Strategy", url: "/docs/ladder-treasury.pdf" }]
    }
  },
  {
    chainPoolId: 21,
    name: "Treasury Enhanced Cash",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 505, // 5.05%
    totalDeposited: BigInt("85000000000000"), // $85M
    investorCount: 1234,
    minInvestment: BigInt("10000000"), // $10
    maxInvestment: BigInt("50000000000"), // $50K
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Enhanced cash alternative using Treasury repo and short-dated bills for institutional liquidity.",
      riskRating: "low",
      lockupPeriod: 0,
      totalCapacity: "200000000000000", // $200M
      availableCapacity: "115000000000000",
      documents: [{ name: "Enhanced Cash", url: "/docs/enhanced-cash.pdf" }]
    }
  },
  {
    chainPoolId: 22,
    name: "5-Year Treasury Note Fund",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 440, // 4.40%
    totalDeposited: BigInt("21000000000000"), // $21M
    investorCount: 345,
    minInvestment: BigInt("250000000"), // $250
    maxInvestment: BigInt("3000000000000"), // $3M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Focused exposure to 5-year Treasury notes for moderate duration and competitive yield.",
      riskRating: "low",
      lockupPeriod: 60,
      totalCapacity: "35000000000000", // $35M
      availableCapacity: "14000000000000",
      documents: [{ name: "5Y Note Fund", url: "/docs/5y-treasury.pdf" }]
    }
  },
  {
    chainPoolId: 23,
    name: "Treasury Agency Blend",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 535, // 5.35%
    totalDeposited: BigInt("14000000000000"), // $14M
    investorCount: 198,
    minInvestment: BigInt("1000000000"), // $1,000
    maxInvestment: BigInt("1500000000000"), // $1.5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Blend of Treasury and agency securities for enhanced yield with government backing.",
      riskRating: "low",
      lockupPeriod: 30,
      totalCapacity: "25000000000000", // $25M
      availableCapacity: "11000000000000",
      documents: [{ name: "Agency Blend", url: "/docs/agency-blend.pdf" }]
    }
  },
  {
    chainPoolId: 24,
    name: "Treasury Auction Strategy",
    assetClass: AssetClass.TREASURY,
    yieldRateBps: 555, // 5.55%
    totalDeposited: BigInt("9500000000000"), // $9.5M
    investorCount: 87,
    minInvestment: BigInt("10000000000"), // $10,000
    maxInvestment: BigInt("5000000000000"), // $5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Direct Treasury auction participation strategy capturing new issue concessions.",
      riskRating: "low",
      lockupPeriod: 14,
      totalCapacity: "20000000000000", // $20M
      availableCapacity: "10500000000000",
      documents: [{ name: "Auction Strategy", url: "/docs/auction-strategy.pdf" }]
    }
  },

  // ============== ADDITIONAL REAL ESTATE POOLS (8 more = 12 total) ==============
  {
    chainPoolId: 25,
    name: "Data Center REIT",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 720, // 7.20%
    totalDeposited: BigInt("45000000000000"), // $45M
    investorCount: 567,
    minInvestment: BigInt("2000000000"), // $2,000
    maxInvestment: BigInt("8000000000000"), // $8M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Tier-1 hyperscale data centers in major metros powering cloud and AI infrastructure.",
      riskRating: "medium",
      lockupPeriod: 180,
      totalCapacity: "75000000000000", // $75M
      availableCapacity: "30000000000000",
      documents: [{ name: "Data Center PPM", url: "/docs/datacenter-ppm.pdf" }]
    }
  },
  {
    chainPoolId: 26,
    name: "Self-Storage Portfolio",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 685, // 6.85%
    totalDeposited: BigInt("28000000000000"), // $28M
    investorCount: 389,
    minInvestment: BigInt("1500000000"), // $1,500
    maxInvestment: BigInt("4000000000000"), // $4M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Climate-controlled self-storage facilities in suburban markets with high occupancy rates.",
      riskRating: "low",
      lockupPeriod: 90,
      totalCapacity: "45000000000000", // $45M
      availableCapacity: "17000000000000",
      documents: [{ name: "Storage Portfolio", url: "/docs/storage-portfolio.pdf" }]
    }
  },
  {
    chainPoolId: 27,
    name: "Student Housing Fund",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 755, // 7.55%
    totalDeposited: BigInt("16000000000000"), // $16M
    investorCount: 234,
    minInvestment: BigInt("3000000000"), // $3,000
    maxInvestment: BigInt("5000000000000"), // $5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Purpose-built student housing near Tier-1 universities with strong enrollment trends.",
      riskRating: "medium",
      lockupPeriod: 270,
      totalCapacity: "25000000000000", // $25M
      availableCapacity: "9000000000000",
      documents: [{ name: "Student Housing", url: "/docs/student-housing.pdf" }]
    }
  },
  {
    chainPoolId: 28,
    name: "Life Sciences Real Estate",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 810, // 8.10%
    totalDeposited: BigInt("38000000000000"), // $38M
    investorCount: 278,
    minInvestment: BigInt("10000000000"), // $10,000
    maxInvestment: BigInt("15000000000000"), // $15M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Lab and R&D facilities in Boston, San Diego, and SF Bay biotech clusters.",
      riskRating: "medium",
      lockupPeriod: 365,
      totalCapacity: "60000000000000", // $60M
      availableCapacity: "22000000000000",
      documents: [{ name: "Life Sciences RE", url: "/docs/lifesciences-re.pdf" }]
    }
  },
  {
    chainPoolId: 29,
    name: "Hospitality Recovery Fund",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 925, // 9.25%
    totalDeposited: BigInt("22000000000000"), // $22M
    investorCount: 167,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("3000000000000"), // $3M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Select-service hotels in leisure destinations capitalizing on travel recovery trends.",
      riskRating: "high",
      lockupPeriod: 365,
      totalCapacity: "40000000000000", // $40M
      availableCapacity: "18000000000000",
      documents: [{ name: "Hospitality Fund", url: "/docs/hospitality-fund.pdf" }]
    }
  },
  {
    chainPoolId: 30,
    name: "Manufactured Housing Communities",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 650, // 6.50%
    totalDeposited: BigInt("52000000000000"), // $52M
    investorCount: 612,
    minInvestment: BigInt("2500000000"), // $2,500
    maxInvestment: BigInt("6000000000000"), // $6M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Affordable manufactured housing communities with stable, recession-resistant cash flows.",
      riskRating: "low",
      lockupPeriod: 180,
      totalCapacity: "80000000000000", // $80M
      availableCapacity: "28000000000000",
      documents: [{ name: "MHC Portfolio", url: "/docs/mhc-portfolio.pdf" }]
    }
  },
  {
    chainPoolId: 31,
    name: "Retail Power Centers",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 870, // 8.70%
    totalDeposited: BigInt("19000000000000"), // $19M
    investorCount: 145,
    minInvestment: BigInt("7500000000"), // $7,500
    maxInvestment: BigInt("4000000000000"), // $4M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Grocery-anchored retail centers with essential services and strong national tenants.",
      riskRating: "medium",
      lockupPeriod: 270,
      totalCapacity: "35000000000000", // $35M
      availableCapacity: "16000000000000",
      documents: [{ name: "Retail Centers", url: "/docs/retail-centers.pdf" }]
    }
  },
  {
    chainPoolId: 32,
    name: "European Office Fund",
    assetClass: AssetClass.REAL_ESTATE,
    yieldRateBps: 735, // 7.35%
    totalDeposited: BigInt("31000000000000"), // $31M
    investorCount: 234,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("10000000000000"), // $10M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Grade-A office buildings in London, Paris, and Frankfurt CBDs with long-term leases.",
      riskRating: "medium",
      lockupPeriod: 365,
      totalCapacity: "50000000000000", // $50M
      availableCapacity: "19000000000000",
      documents: [{ name: "EU Office Fund", url: "/docs/eu-office.pdf" }]
    }
  },

  // ============== ADDITIONAL PRIVATE CREDIT POOLS (8 more = 12 total) ==============
  {
    chainPoolId: 33,
    name: "Healthcare Lending Fund",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 1150, // 11.50%
    totalDeposited: BigInt("27000000000000"), // $27M
    investorCount: 189,
    minInvestment: BigInt("15000000000"), // $15,000
    maxInvestment: BigInt("4000000000000"), // $4M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Senior secured loans to healthcare providers including dental practices and surgery centers.",
      riskRating: "medium",
      lockupPeriod: 270,
      totalCapacity: "45000000000000", // $45M
      availableCapacity: "18000000000000",
      documents: [{ name: "Healthcare Lending", url: "/docs/healthcare-lending.pdf" }]
    }
  },
  {
    chainPoolId: 34,
    name: "Technology Venture Debt",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 1380, // 13.80%
    totalDeposited: BigInt("18000000000000"), // $18M
    investorCount: 112,
    minInvestment: BigInt("25000000000"), // $25,000
    maxInvestment: BigInt("3000000000000"), // $3M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Growth capital loans to late-stage tech companies with warrants and revenue participation.",
      riskRating: "high",
      lockupPeriod: 365,
      totalCapacity: "30000000000000", // $30M
      availableCapacity: "12000000000000",
      documents: [{ name: "Venture Debt PPM", url: "/docs/venture-debt.pdf" }]
    }
  },
  {
    chainPoolId: 35,
    name: "Real Estate Bridge Loans",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 1050, // 10.50%
    totalDeposited: BigInt("42000000000000"), // $42M
    investorCount: 298,
    minInvestment: BigInt("10000000000"), // $10,000
    maxInvestment: BigInt("8000000000000"), // $8M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Short-term bridge loans for commercial real estate acquisitions and renovations.",
      riskRating: "medium",
      lockupPeriod: 180,
      totalCapacity: "65000000000000", // $65M
      availableCapacity: "23000000000000",
      documents: [{ name: "Bridge Loans", url: "/docs/bridge-loans.pdf" }]
    }
  },
  {
    chainPoolId: 36,
    name: "SBA Loan Fund",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 895, // 8.95%
    totalDeposited: BigInt("35000000000000"), // $35M
    investorCount: 423,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "SBA 7(a) loan participation with government guarantees and enhanced recovery rates.",
      riskRating: "low",
      lockupPeriod: 90,
      totalCapacity: "50000000000000", // $50M
      availableCapacity: "15000000000000",
      documents: [{ name: "SBA Fund", url: "/docs/sba-fund.pdf" }]
    }
  },
  {
    chainPoolId: 37,
    name: "ABL Receivables Fund",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 920, // 9.20%
    totalDeposited: BigInt("58000000000000"), // $58M
    investorCount: 534,
    minInvestment: BigInt("7500000000"), // $7,500
    maxInvestment: BigInt("5000000000000"), // $5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Asset-backed loans secured by trade receivables from investment-grade obligors.",
      riskRating: "low",
      lockupPeriod: 60,
      totalCapacity: "80000000000000", // $80M
      availableCapacity: "22000000000000",
      documents: [{ name: "ABL Overview", url: "/docs/abl-overview.pdf" }]
    }
  },
  {
    chainPoolId: 38,
    name: "European Direct Lending",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 1180, // 11.80%
    totalDeposited: BigInt("24000000000000"), // $24M
    investorCount: 156,
    minInvestment: BigInt("20000000000"), // $20,000
    maxInvestment: BigInt("6000000000000"), // $6M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "EUR-denominated senior loans to mid-market companies in UK, Germany, and France.",
      riskRating: "medium",
      lockupPeriod: 365,
      totalCapacity: "40000000000000", // $40M
      availableCapacity: "16000000000000",
      documents: [{ name: "EU Direct Lending", url: "/docs/eu-direct.pdf" }]
    }
  },
  {
    chainPoolId: 39,
    name: "Infrastructure Debt Fund",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 785, // 7.85%
    totalDeposited: BigInt("67000000000000"), // $67M
    investorCount: 312,
    minInvestment: BigInt("25000000000"), // $25,000
    maxInvestment: BigInt("15000000000000"), // $15M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Long-dated infrastructure debt for renewable energy, transport, and digital infrastructure.",
      riskRating: "low",
      lockupPeriod: 730, // 2 years
      totalCapacity: "100000000000000", // $100M
      availableCapacity: "33000000000000",
      documents: [{ name: "Infra Debt", url: "/docs/infra-debt.pdf" }]
    }
  },
  {
    chainPoolId: 40,
    name: "Distressed Debt Opportunities",
    assetClass: AssetClass.PRIVATE_CREDIT,
    yieldRateBps: 1650, // 16.50%
    totalDeposited: BigInt("12000000000000"), // $12M
    investorCount: 67,
    minInvestment: BigInt("100000000000"), // $100,000
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Opportunistic distressed debt and special situations with active restructuring involvement.",
      riskRating: "high",
      lockupPeriod: 1095, // 3 years
      totalCapacity: "25000000000000", // $25M
      availableCapacity: "13000000000000",
      documents: [{ name: "Distressed PPM", url: "/docs/distressed-ppm.pdf" }]
    }
  },

  // ============== ADDITIONAL CORPORATE BONDS POOLS (8 more = 12 total) ==============
  {
    chainPoolId: 41,
    name: "ESG Investment Grade",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 615, // 6.15%
    totalDeposited: BigInt("48000000000000"), // $48M
    investorCount: 678,
    minInvestment: BigInt("500000000"), // $500
    maxInvestment: BigInt("3000000000000"), // $3M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Investment grade corporate bonds from companies meeting strict ESG criteria.",
      riskRating: "low",
      lockupPeriod: 30,
      totalCapacity: "75000000000000", // $75M
      availableCapacity: "27000000000000",
      documents: [{ name: "ESG Bond Fund", url: "/docs/esg-bonds.pdf" }]
    }
  },
  {
    chainPoolId: 42,
    name: "Fallen Angels Bond Fund",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 785, // 7.85%
    totalDeposited: BigInt("22000000000000"), // $22M
    investorCount: 234,
    minInvestment: BigInt("1000000000"), // $1,000
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Recently downgraded investment grade bonds with recovery potential and enhanced yields.",
      riskRating: "medium",
      lockupPeriod: 60,
      totalCapacity: "35000000000000", // $35M
      availableCapacity: "13000000000000",
      documents: [{ name: "Fallen Angels", url: "/docs/fallen-angels.pdf" }]
    }
  },
  {
    chainPoolId: 43,
    name: "Financial Sector Bonds",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 695, // 6.95%
    totalDeposited: BigInt("31000000000000"), // $31M
    investorCount: 356,
    minInvestment: BigInt("2500000000"), // $2,500
    maxInvestment: BigInt("4000000000000"), // $4M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Senior unsecured bonds from G-SIB banks and major insurance companies.",
      riskRating: "medium",
      lockupPeriod: 45,
      totalCapacity: "50000000000000", // $50M
      availableCapacity: "19000000000000",
      documents: [{ name: "Financial Bonds", url: "/docs/financial-bonds.pdf" }]
    }
  },
  {
    chainPoolId: 44,
    name: "Convertible Bond Fund",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 545, // 5.45%
    totalDeposited: BigInt("16000000000000"), // $16M
    investorCount: 189,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("3000000000000"), // $3M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Investment grade convertible bonds with equity upside participation and downside protection.",
      riskRating: "medium",
      lockupPeriod: 90,
      totalCapacity: "30000000000000", // $30M
      availableCapacity: "14000000000000",
      documents: [{ name: "Convertibles", url: "/docs/convertibles.pdf" }]
    }
  },
  {
    chainPoolId: 45,
    name: "Tech Sector Corporate",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 635, // 6.35%
    totalDeposited: BigInt("54000000000000"), // $54M
    investorCount: 723,
    minInvestment: BigInt("1000000000"), // $1,000
    maxInvestment: BigInt("5000000000000"), // $5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Corporate bonds from mega-cap technology companies with fortress balance sheets.",
      riskRating: "low",
      lockupPeriod: 30,
      totalCapacity: "80000000000000", // $80M
      availableCapacity: "26000000000000",
      documents: [{ name: "Tech Bonds", url: "/docs/tech-bonds.pdf" }]
    }
  },
  {
    chainPoolId: 46,
    name: "Municipal-Like Corporate",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 485, // 4.85%
    totalDeposited: BigInt("39000000000000"), // $39M
    investorCount: 512,
    minInvestment: BigInt("2000000000"), // $2,000
    maxInvestment: BigInt("2500000000000"), // $2.5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Quasi-municipal corporate bonds from utilities and essential service providers.",
      riskRating: "low",
      lockupPeriod: 60,
      totalCapacity: "60000000000000", // $60M
      availableCapacity: "21000000000000",
      documents: [{ name: "Muni-Like Corp", url: "/docs/muni-corp.pdf" }]
    }
  },
  {
    chainPoolId: 47,
    name: "Global Corporate Bond Fund",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 725, // 7.25%
    totalDeposited: BigInt("28000000000000"), // $28M
    investorCount: 345,
    minInvestment: BigInt("3000000000"), // $3,000
    maxInvestment: BigInt("6000000000000"), // $6M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Diversified global corporate bonds across USD, EUR, and GBP denominations.",
      riskRating: "medium",
      lockupPeriod: 90,
      totalCapacity: "45000000000000", // $45M
      availableCapacity: "17000000000000",
      documents: [{ name: "Global Corp", url: "/docs/global-corp.pdf" }]
    }
  },
  {
    chainPoolId: 48,
    name: "BBB Crossover Fund",
    assetClass: AssetClass.CORPORATE_BONDS,
    yieldRateBps: 715, // 7.15%
    totalDeposited: BigInt("33000000000000"), // $33M
    investorCount: 412,
    minInvestment: BigInt("1500000000"), // $1,500
    maxInvestment: BigInt("3500000000000"), // $3.5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "BBB-rated corporate bonds on cusp of investment grade with yield enhancement potential.",
      riskRating: "medium",
      lockupPeriod: 45,
      totalCapacity: "55000000000000", // $55M
      availableCapacity: "22000000000000",
      documents: [{ name: "BBB Crossover", url: "/docs/bbb-crossover.pdf" }]
    }
  },

  // ============== COMMODITIES POOLS (16 new) ==============
  {
    chainPoolId: 49,
    name: "Gold Bullion Fund",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 0, // 0% yield (appreciation play)
    totalDeposited: BigInt("72000000000000"), // $72M
    investorCount: 1234,
    minInvestment: BigInt("100000000"), // $100
    maxInvestment: BigInt("10000000000000"), // $10M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Physically-backed gold bullion stored in London and Zurich vaults with full allocation.",
      riskRating: "medium",
      lockupPeriod: 0,
      totalCapacity: "150000000000000", // $150M
      availableCapacity: "78000000000000",
      documents: [{ name: "Gold Fund", url: "/docs/gold-fund.pdf" }]
    }
  },
  {
    chainPoolId: 50,
    name: "Silver Physical Fund",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 0, // 0% yield
    totalDeposited: BigInt("18000000000000"), // $18M
    investorCount: 456,
    minInvestment: BigInt("50000000"), // $50
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Allocated physical silver bars in LBMA-approved vaults with serial number tracking.",
      riskRating: "high",
      lockupPeriod: 0,
      totalCapacity: "40000000000000", // $40M
      availableCapacity: "22000000000000",
      documents: [{ name: "Silver Fund", url: "/docs/silver-fund.pdf" }]
    }
  },
  {
    chainPoolId: 51,
    name: "Precious Metals Basket",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 0, // 0% yield
    totalDeposited: BigInt("35000000000000"), // $35M
    investorCount: 567,
    minInvestment: BigInt("500000000"), // $500
    maxInvestment: BigInt("5000000000000"), // $5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Diversified precious metals including gold, silver, platinum, and palladium.",
      riskRating: "medium",
      lockupPeriod: 0,
      totalCapacity: "60000000000000", // $60M
      availableCapacity: "25000000000000",
      documents: [{ name: "PM Basket", url: "/docs/pm-basket.pdf" }]
    }
  },
  {
    chainPoolId: 52,
    name: "Crude Oil Futures Fund",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 250, // 2.50% roll yield
    totalDeposited: BigInt("28000000000000"), // $28M
    investorCount: 312,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("3000000000000"), // $3M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "WTI and Brent crude oil futures with optimized roll strategy to minimize contango.",
      riskRating: "high",
      lockupPeriod: 30,
      totalCapacity: "50000000000000", // $50M
      availableCapacity: "22000000000000",
      documents: [{ name: "Oil Futures", url: "/docs/oil-futures.pdf" }]
    }
  },
  {
    chainPoolId: 53,
    name: "Natural Gas Strategy",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 180, // 1.80% roll yield
    totalDeposited: BigInt("12000000000000"), // $12M
    investorCount: 178,
    minInvestment: BigInt("10000000000"), // $10,000
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Henry Hub natural gas futures with seasonal trading strategies.",
      riskRating: "high",
      lockupPeriod: 30,
      totalCapacity: "25000000000000", // $25M
      availableCapacity: "13000000000000",
      documents: [{ name: "Nat Gas", url: "/docs/nat-gas.pdf" }]
    }
  },
  {
    chainPoolId: 54,
    name: "Agricultural Commodities",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 320, // 3.20% roll yield
    totalDeposited: BigInt("21000000000000"), // $21M
    investorCount: 289,
    minInvestment: BigInt("2500000000"), // $2,500
    maxInvestment: BigInt("4000000000000"), // $4M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Diversified agricultural futures including corn, soybeans, and wheat.",
      riskRating: "medium",
      lockupPeriod: 60,
      totalCapacity: "40000000000000", // $40M
      availableCapacity: "19000000000000",
      documents: [{ name: "Ag Commodities", url: "/docs/ag-commodities.pdf" }]
    }
  },
  {
    chainPoolId: 55,
    name: "Copper Futures Fund",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 150, // 1.50% roll yield
    totalDeposited: BigInt("16000000000000"), // $16M
    investorCount: 234,
    minInvestment: BigInt("3000000000"), // $3,000
    maxInvestment: BigInt("2500000000000"), // $2.5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "LME copper futures providing exposure to global industrial demand and energy transition.",
      riskRating: "medium",
      lockupPeriod: 30,
      totalCapacity: "30000000000000", // $30M
      availableCapacity: "14000000000000",
      documents: [{ name: "Copper Fund", url: "/docs/copper-fund.pdf" }]
    }
  },
  {
    chainPoolId: 56,
    name: "Battery Metals Basket",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 0, // 0% yield
    totalDeposited: BigInt("24000000000000"), // $24M
    investorCount: 345,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("5000000000000"), // $5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Lithium, cobalt, nickel, and rare earth exposure for EV and clean energy transition.",
      riskRating: "high",
      lockupPeriod: 90,
      totalCapacity: "45000000000000", // $45M
      availableCapacity: "21000000000000",
      documents: [{ name: "Battery Metals", url: "/docs/battery-metals.pdf" }]
    }
  },
  {
    chainPoolId: 57,
    name: "Broad Commodities Index",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 200, // 2.00% roll yield
    totalDeposited: BigInt("45000000000000"), // $45M
    investorCount: 623,
    minInvestment: BigInt("1000000000"), // $1,000
    maxInvestment: BigInt("8000000000000"), // $8M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Bloomberg Commodity Index tracking diversified basket of energy, metals, and agriculture.",
      riskRating: "medium",
      lockupPeriod: 0,
      totalCapacity: "80000000000000", // $80M
      availableCapacity: "35000000000000",
      documents: [{ name: "BCOM Index", url: "/docs/bcom-index.pdf" }]
    }
  },
  {
    chainPoolId: 58,
    name: "Lumber & Timber Fund",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 280, // 2.80% yield
    totalDeposited: BigInt("9000000000000"), // $9M
    investorCount: 123,
    minInvestment: BigInt("7500000000"), // $7,500
    maxInvestment: BigInt("1500000000000"), // $1.5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Physical timberland and lumber futures capturing housing demand cycles.",
      riskRating: "medium",
      lockupPeriod: 180,
      totalCapacity: "20000000000000", // $20M
      availableCapacity: "11000000000000",
      documents: [{ name: "Timber Fund", url: "/docs/timber-fund.pdf" }]
    }
  },
  {
    chainPoolId: 59,
    name: "Carbon Credits Fund",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 0, // 0% yield
    totalDeposited: BigInt("14000000000000"), // $14M
    investorCount: 189,
    minInvestment: BigInt("2000000000"), // $2,000
    maxInvestment: BigInt("3000000000000"), // $3M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "EU ETS and California carbon allowances providing climate transition exposure.",
      riskRating: "high",
      lockupPeriod: 60,
      totalCapacity: "30000000000000", // $30M
      availableCapacity: "16000000000000",
      documents: [{ name: "Carbon Fund", url: "/docs/carbon-fund.pdf" }]
    }
  },
  {
    chainPoolId: 60,
    name: "Soft Commodities Fund",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 350, // 3.50% roll yield
    totalDeposited: BigInt("11000000000000"), // $11M
    investorCount: 156,
    minInvestment: BigInt("3000000000"), // $3,000
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Coffee, cocoa, sugar, and cotton futures with active harvest timing strategies.",
      riskRating: "high",
      lockupPeriod: 90,
      totalCapacity: "25000000000000", // $25M
      availableCapacity: "14000000000000",
      documents: [{ name: "Soft Commodities", url: "/docs/soft-commodities.pdf" }]
    }
  },
  {
    chainPoolId: 61,
    name: "Uranium Physical Trust",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 0, // 0% yield
    totalDeposited: BigInt("8000000000000"), // $8M
    investorCount: 134,
    minInvestment: BigInt("10000000000"), // $10,000
    maxInvestment: BigInt("2000000000000"), // $2M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Physical uranium oxide (U3O8) storage providing nuclear energy transition exposure.",
      riskRating: "high",
      lockupPeriod: 180,
      totalCapacity: "20000000000000", // $20M
      availableCapacity: "12000000000000",
      documents: [{ name: "Uranium Trust", url: "/docs/uranium-trust.pdf" }]
    }
  },
  {
    chainPoolId: 62,
    name: "Inflation Hedge Commodities",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 180, // 1.80% roll yield
    totalDeposited: BigInt("38000000000000"), // $38M
    investorCount: 489,
    minInvestment: BigInt("1500000000"), // $1,500
    maxInvestment: BigInt("6000000000000"), // $6M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Optimized commodity basket designed specifically for inflation hedging.",
      riskRating: "medium",
      lockupPeriod: 0,
      totalCapacity: "65000000000000", // $65M
      availableCapacity: "27000000000000",
      documents: [{ name: "Inflation Hedge", url: "/docs/inflation-hedge.pdf" }]
    }
  },
  {
    chainPoolId: 63,
    name: "Industrial Metals Fund",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 120, // 1.20% roll yield
    totalDeposited: BigInt("26000000000000"), // $26M
    investorCount: 312,
    minInvestment: BigInt("2500000000"), // $2,500
    maxInvestment: BigInt("4000000000000"), // $4M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Aluminum, zinc, lead, and tin futures tracking global manufacturing activity.",
      riskRating: "medium",
      lockupPeriod: 30,
      totalCapacity: "45000000000000", // $45M
      availableCapacity: "19000000000000",
      documents: [{ name: "Industrial Metals", url: "/docs/industrial-metals.pdf" }]
    }
  },
  {
    chainPoolId: 64,
    name: "Renewable Energy Commodities",
    assetClass: AssetClass.COMMODITIES,
    yieldRateBps: 0, // 0% yield
    totalDeposited: BigInt("19000000000000"), // $19M
    investorCount: 267,
    minInvestment: BigInt("5000000000"), // $5,000
    maxInvestment: BigInt("3500000000000"), // $3.5M
    status: PoolStatus.ACTIVE,
    metadata: {
      description: "Commodities essential for renewable energy: solar-grade silicon, rare earths, and green hydrogen.",
      riskRating: "high",
      lockupPeriod: 120,
      totalCapacity: "40000000000000", // $40M
      availableCapacity: "21000000000000",
      documents: [{ name: "Renewable Commodities", url: "/docs/renewable-commodities.pdf" }]
    }
  },
];

async function main() {
  // SAFETY: Prevent accidental data wipe in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error('🚨 Cannot run seed script in production - this would delete all investments!');
  }

  console.log("Seeding 64 asset pools...\n");

  // Clear existing pools (for idempotent seeding in dev/test only)
  await prisma.investment.deleteMany({});
  await prisma.yieldHistory.deleteMany({});
  await prisma.assetPool.deleteMany({});
  console.log("Cleared existing pools and investments.\n");

  // Create all pools
  for (const pool of pools) {
    const created = await prisma.assetPool.create({
      data: {
        chainPoolId: pool.chainPoolId,
        name: pool.name,
        assetClass: pool.assetClass,
        rwaTokenAddress: `0x${pool.chainPoolId.toString().padStart(2, '0').repeat(20)}`, // Placeholder addresses
        yieldRateBps: pool.yieldRateBps,
        totalDeposited: pool.totalDeposited,
        investorCount: pool.investorCount,
        minInvestment: pool.minInvestment,
        maxInvestment: pool.maxInvestment,
        status: pool.status,
        metadata: pool.metadata,
        navPerShare: NAV_BASE, // 1.0 with 8 decimals (100000000)
      }
    });
    console.log(`Created: ${created.name} (${pool.assetClass}, ${(pool.yieldRateBps / 100).toFixed(2)}%)`);
  }

  // Summary
  const poolCount = await prisma.assetPool.count();
  const byClass = await prisma.assetPool.groupBy({
    by: ['assetClass'],
    _count: true,
    _sum: { totalDeposited: true },
  });

  console.log(`\n========================================`);
  console.log(`SEEDING COMPLETE: ${poolCount} pools created`);
  console.log(`========================================`);
  console.log(`\nBy Asset Class:`);

  for (const item of byClass) {
    const tvl = Number(item._sum.totalDeposited || 0) / 1_000_000;
    console.log(`  ${item.assetClass.padEnd(16)} | ${item._count} pools | $${(tvl / 1_000_000).toFixed(1)}M TVL`);
  }

  const totalTVL = byClass.reduce((sum, item) => sum + Number(item._sum.totalDeposited || 0), 0);
  console.log(`\nTotal TVL: $${(totalTVL / 1_000_000_000_000).toFixed(1)}M`);
  console.log(`========================================\n`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
