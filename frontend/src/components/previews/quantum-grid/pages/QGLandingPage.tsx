"use client";

import React from "react";
import "@/styles/sovereign-landing.css";
import { QGScrollReveal } from "../primitives/QGScrollReveal";
import { useAnimatedValue } from "../hooks/useAnimatedValue";

// -- Data ---------------------------------------------------------------------

const features = [
  {
    index: "01",
    name: "Institutional Grade",
    description:
      "SEC-regulated framework with audited smart contracts and full institutional compliance. Every protocol interaction meets the standards demanded by sovereign wealth funds and pension managers.",
  },
  {
    index: "02",
    name: "Instant Settlement",
    description:
      "T+0 settlement on Avalanche C-Chain eliminates the days-long waiting periods of traditional finance. Capital efficiency, redefined.",
  },
  {
    index: "03",
    name: "Full Transparency",
    description:
      "On-chain NAV oracles deliver real-time yield tracking with verifiable, immutable data. No black boxes. Every basis point accounted for.",
  },
  {
    index: "04",
    name: "DeFi Composable",
    description:
      "Tokenized positions serve as collateral across DeFi protocols. Unlock capital efficiency by putting your real-world assets to work on-chain.",
  },
  {
    index: "05",
    name: "Diversified Yield",
    description:
      "Five asset classes and sixty-four investment pools, algorithmically optimized for risk-adjusted returns across market conditions.",
  },
  {
    index: "06",
    name: "Non-Custodial",
    description:
      "Smart contract custody with multi-sig governance. Your keys, your assets. Institutional security without surrendering control.",
  },
];

const trustItems = [
  {
    icon: "Infrastructure",
    title: "Built on Avalanche",
    text: "Sub-second finality and thousands of transactions per second on the industry\u2019s most reliable L1 network.",
  },
  {
    icon: "Security",
    title: "Biometric Authentication",
    text: "Passkey-based wallet creation with biometric verification. Enterprise-grade access control, consumer-grade simplicity.",
  },
  {
    icon: "Custody",
    title: "Non-Custodial Architecture",
    text: "No intermediaries hold your assets. Smart contracts enforce rules. Multi-sig governance ensures protocol integrity.",
  },
];

// -- Component ----------------------------------------------------------------

interface QGLandingPageProps {
  onLaunch?: () => void;
  onDocs?: () => void;
}

export function QGLandingPage({ onLaunch, onDocs }: QGLandingPageProps) {
  const tvl = useAnimatedValue(1.66, 2500);
  const investors = useAnimatedValue(1247, 2500);
  const apy = useAnimatedValue(6.4, 2000);

  return (
    <div className="sv-landing">
      {/* Nav */}
      <nav className="sv-nav page-enter-up" style={{ animationDelay: "0ms" }}>
        <div className="sv-container">
          <span className="sv-nav-brand">DeepRock</span>
          <ul className="sv-nav-links">
            <li>
              <button className="sv-nav-link" onClick={onLaunch}>
                Pools
              </button>
            </li>
            <li>
              <button className="sv-nav-link" onClick={onDocs}>
                Documents
              </button>
            </li>
            <li>
              <button
                className="sv-btn-primary sv-btn-primary-sm"
                onClick={onLaunch}
              >
                Launch App
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <section className="sv-hero">
        <div className="sv-hero-watermark">DEEPROCK</div>
        <div className="sv-container" style={{ position: "relative", zIndex: 1 }}>
          <p className="sv-hero-label page-enter-up" style={{ animationDelay: "100ms" }}>Institutional RWA Tokenization</p>
          <h1 className="sv-hero-headline page-enter-up" style={{ animationDelay: "200ms" }}>
            <span className="sv-gold">$1.66B</span> in Tokenized
            Real&#8209;World&nbsp;Assets
          </h1>
          <p className="sv-hero-subtitle page-enter-up" style={{ animationDelay: "350ms" }}>
            Institutional-grade yield. On-chain transparency. Built on
            Avalanche.
          </p>
          <div className="sv-hero-ctas page-enter-up" style={{ animationDelay: "500ms" }}>
            <button className="sv-btn-primary" onClick={onLaunch}>
              Launch App
            </button>
            <button className="sv-btn-text" onClick={onDocs}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      <div className="sv-container">
        <hr className="sv-gold-rule" />
      </div>

      {/* Stats */}
      <QGScrollReveal>
        <section className="sv-stats">
          <div className="sv-container">
            <div className="sv-stats-header">
              <h2 className="sv-stats-title">
                Protocol
                <br />
                at a Glance
              </h2>
              <p className="sv-stats-description">
                Real-time metrics from the DeepRock protocol, verified on-chain.
              </p>
            </div>
            <div className="sv-stats-grid">
              <div className="sv-stat-item">
                <div className="sv-stat-number">
                  ${tvl.toFixed(2)}
                  <span className="sv-gold">B</span>
                </div>
                <div className="sv-stat-label">Total Value Locked</div>
              </div>
              <div className="sv-stat-item">
                <div className="sv-stat-number">
                  {Math.round(investors).toLocaleString()}
                  <span className="sv-gold">+</span>
                </div>
                <div className="sv-stat-label">Active Investors</div>
              </div>
              <div className="sv-stat-item">
                <div className="sv-stat-number">
                  {apy.toFixed(1)}
                  <span className="sv-gold">%</span>
                </div>
                <div className="sv-stat-label">Average APY</div>
              </div>
              <div className="sv-stat-item">
                <div className="sv-stat-number">5</div>
                <div className="sv-stat-label">Asset Categories</div>
              </div>
              <div className="sv-stat-item">
                <div className="sv-stat-number">64</div>
                <div className="sv-stat-label">Investment Pools</div>
              </div>
            </div>
          </div>
        </section>
      </QGScrollReveal>

      <div className="sv-container">
        <hr className="sv-gold-rule sv-gold-rule-dim" />
      </div>

      {/* Features */}
      <section className="sv-features">
        <div className="sv-container">
          <QGScrollReveal>
            <div className="sv-features-header">
              <p className="sv-features-label">Platform Architecture</p>
              <h2 className="sv-features-title">
                Engineered for institutions.
                <br />
                Accessible to&nbsp;everyone.
              </h2>
            </div>
          </QGScrollReveal>

          {features.map((f, i) => (
            <QGScrollReveal key={f.index} staggerIndex={i}>
              <div className="sv-feature-row">
                <div>
                  <div className="sv-feature-index">{f.index}</div>
                  <h3 className="sv-feature-name">{f.name}</h3>
                </div>
                <p className="sv-feature-description">{f.description}</p>
              </div>
            </QGScrollReveal>
          ))}
        </div>
      </section>

      <div className="sv-container">
        <hr className="sv-gold-rule sv-gold-rule-dim" />
      </div>

      {/* Trust */}
      <QGScrollReveal>
        <section className="sv-trust">
          <div className="sv-container">
            <div className="sv-trust-grid">
              {trustItems.map((item) => (
                <div key={item.title} className="sv-trust-item">
                  <div className="sv-trust-icon">{item.icon}</div>
                  <h3 className="sv-trust-title">{item.title}</h3>
                  <p className="sv-trust-text">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </QGScrollReveal>

      <div className="sv-container">
        <hr className="sv-gold-rule" />
      </div>

      {/* CTA Band */}
      <QGScrollReveal>
        <section className="sv-cta-band">
          <div className="sv-container">
            <h2 className="sv-cta-title">
              Start building
              <br />
              your portfolio
            </h2>
            <p className="sv-cta-subtitle">
              Access institutional-grade real-world asset yields with on-chain
              transparency and instant settlement.
            </p>
            <div className="sv-cta-actions">
              <button className="sv-btn-primary" onClick={onLaunch}>
                Launch App
              </button>
              <button className="sv-btn-text" onClick={onDocs}>
                Read Documentation
              </button>
            </div>
          </div>
        </section>
      </QGScrollReveal>

      {/* Footer */}
      <footer className="sv-footer">
        <div className="sv-container">
          <span className="sv-footer-brand">DeepRock</span>
          <ul className="sv-footer-links">
            <li>
              <button className="sv-footer-link" onClick={onLaunch}>
                Pools
              </button>
            </li>
            <li>
              <button className="sv-footer-link" onClick={onDocs}>
                Documents
              </button>
            </li>
          </ul>
          <span className="sv-footer-copy">
            &copy; 2026 DeepRock. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
