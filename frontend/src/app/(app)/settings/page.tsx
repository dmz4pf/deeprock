"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore, type User } from "@/stores/authStore";
import { QGPanel } from "@/components/previews/quantum-grid/primitives/QGPanel";
import { QGBadge } from "@/components/previews/quantum-grid/primitives/QGBadge";
import { QGScrollReveal } from "@/components/previews/quantum-grid/primitives/QGScrollReveal";
import { PageLayout } from "@/components/layout/PageLayout";
import { EmptyState } from "@/components/ui/EmptyState";

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  EMAIL: { label: "Email", color: "#E8B4B8" },
  GOOGLE: { label: "Google", color: "#F0C8CC" },
  WALLET: { label: "Wallet", color: "#F59E0B" },
};

function getInitial(name: string | null): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/* ── Toggle Switch ────────────────────────────────────────────────────── */

function Toggle({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-[#B8A99A] font-sans">{label}</span>
      <button
        onClick={onToggle}
        aria-label={label}
        className="relative w-[44px] h-[24px] rounded-xl border-none p-0 shrink-0 cursor-pointer transition-[background] duration-300 ease-in-out"
        style={{
          background: enabled ? "#E8B4B8" : "rgba(232,180,184,0.15)",
          boxShadow: enabled ? "0 0 12px rgba(232,180,184,0.25)" : "none",
        }}
      >
        <div
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: enabled ? 23 : 3,
            background: enabled ? "#F0EBE0" : "#5A5347",
            boxShadow: enabled ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
          }}
        />
      </button>
    </div>
  );
}

/* ── Identity Card (merged Profile + Wallet) ──────────────────────────── */

function IdentityCard({ user }: { user: User }) {
  const [copied, setCopied] = useState(false);
  const providerConfig = PROVIDER_LABELS[user.authProvider] || PROVIDER_LABELS.EMAIL;
  const initial = getInitial(user.displayName);

  const handleCopy = () => {
    if (!user.walletAddress) return;
    navigator.clipboard.writeText(user.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <QGPanel accent>
      <div className="flex flex-col items-center py-3">
        {/* Avatar with iridescent ring */}
        <div
          className="w-[68px] h-[68px] rounded-full p-[3px] mb-4"
          style={{
            background: "linear-gradient(135deg, #E8B4B8, #C4A265, #6FCF97, #F5E6D3, #E8B4B8)",
            animation: "iridescent-rotate 6s linear infinite",
          }}
        >
          <div
            className="w-full h-full rounded-full bg-[#15121A] flex items-center justify-center text-[28px] font-bold font-serif"
            style={{ color: providerConfig.color }}
          >
            {initial}
          </div>
        </div>
        <style>{`@keyframes iridescent-rotate { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(360deg); } }`}</style>

        {/* Name */}
        <div className="text-[22px] font-semibold text-primary font-serif mb-1">
          {user.displayName || "Anonymous"}
        </div>

        {/* Email */}
        {user.email && (
          <div className="text-sm text-dim font-sans mb-2.5">
            {user.email}
          </div>
        )}

        {/* Auth badge */}
        <QGBadge color={providerConfig.color}>{providerConfig.label}</QGBadge>

        {/* Wallet section */}
        {user.walletAddress && (
          <div className="mt-[18px] pt-4 border-t border-[rgba(232,180,184,0.06)] w-full flex justify-between items-center">
            <div>
              <div className="text-[15px] text-primary font-mono tracking-wide">
                {truncateAddress(user.walletAddress)}
              </div>
              <div className="text-[11px] text-dim mt-[3px] font-sans">
                Smart Account &middot; Avalanche C-Chain
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-semibold font-sans tracking-wide rounded-lg border cursor-pointer transition-all duration-300 ease-in-out"
              style={{
                borderColor: "rgba(232,180,184,0.15)",
                background: copied ? "rgba(111,207,151,0.1)" : "rgba(232,180,184,0.06)",
                color: copied ? "#6FCF97" : "#B8A99A",
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </QGPanel>
  );
}

/* ── Security Panel ───────────────────────────────────────────────────── */

function SecurityPanel({ hasBiometrics }: { hasBiometrics: boolean }) {
  return (
    <QGPanel>
      <div className="text-[11px] tracking-[0.14em] uppercase text-dim mb-4 font-semibold font-sans">
        Security
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#B8A99A] font-sans">Passkey / Biometrics</span>
          <QGBadge color={hasBiometrics ? "#6FCF97" : "#EB5757"} variant="dot" pulse={hasBiometrics}>
            {hasBiometrics ? "Enabled" : "Not Set Up"}
          </QGBadge>
        </div>
        <Link href="/settings/passkeys" className="no-underline">
          <button className="w-full py-2.5 px-5 text-[13px] font-semibold font-sans tracking-wide rounded-[10px] border border-[rgba(232,180,184,0.15)] cursor-pointer transition-all duration-300 ease-in-out bg-[rgba(232,180,184,0.06)] text-secondary-foreground">
            Manage Passkeys
          </button>

        </Link>

        <div className="border-t border-[rgba(232,180,184,0.04)] pt-3.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#B8A99A] font-sans">Two-Factor Auth</span>
            <QGBadge color="#5A5347">Not Set Up</QGBadge>
          </div>
        </div>

        <div className="border-t border-[rgba(232,180,184,0.04)] pt-3.5">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-dim font-sans">Session</span>
            <span className="text-[13px] text-teal font-medium font-sans">Active</span>
          </div>
        </div>
      </div>
    </QGPanel>
  );
}

/* ── Preferences Panel ────────────────────────────────────────────────── */

function PreferencesPanel() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [investmentAlerts, setInvestmentAlerts] = useState(true);
  const [yieldUpdates, setYieldUpdates] = useState(false);

  return (
    <QGPanel>
      <div className="text-[11px] tracking-[0.14em] uppercase text-dim mb-4 font-semibold font-sans">
        Preferences
      </div>
      <div className="flex flex-col gap-4">
        <Toggle label="Email Notifications" enabled={emailNotifications} onToggle={() => setEmailNotifications((v) => !v)} />
        <Toggle label="Investment Alerts" enabled={investmentAlerts} onToggle={() => setInvestmentAlerts((v) => !v)} />
        <Toggle label="Yield Updates" enabled={yieldUpdates} onToggle={() => setYieldUpdates((v) => !v)} />

        <div className="border-t border-[rgba(232,180,184,0.04)] pt-3.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#B8A99A] font-sans">Theme</span>
            <span className="text-[13px] text-accent font-medium font-sans">Fusion B</span>
          </div>
        </div>
      </div>
    </QGPanel>
  );
}

/* ── Danger Zone ──────────────────────────────────────────────────────── */

function SignOutButton() {
  const { logout } = useAuthStore();

  return (
    <button
      onClick={logout}
      className="w-full py-3 px-5 text-[13px] font-semibold font-sans tracking-wide rounded-[10px] border border-[rgba(232,180,184,0.12)] cursor-pointer transition-all duration-200 bg-[rgba(232,180,184,0.04)] text-[#B8A99A] hover:bg-[rgba(232,180,184,0.08)] hover:text-[#F0EBE0]"
    >
      Sign Out
    </button>
  );
}

function DangerZone() {
  return (
    <div className="border border-[rgba(235,87,87,0.12)] rounded-[14px] px-[22px] py-[18px] bg-[rgba(235,87,87,0.02)]">
      <div className="text-[11px] tracking-[0.14em] uppercase text-[#EB5757] mb-3.5 font-semibold font-sans opacity-70">
        Danger Zone
      </div>
      <button
        className="w-full py-2.5 px-5 text-[13px] font-semibold font-sans tracking-wide rounded-[10px] border border-[rgba(235,87,87,0.1)] cursor-not-allowed transition-all duration-300 ease-in-out bg-[rgba(235,87,87,0.03)] text-[#5A5347] opacity-60"
        disabled
      >
        Delete Account
      </button>
    </div>
  );
}

/* ── Page: "The Identity" ─────────────────────────────────────────────── */

export default function SettingsPage() {
  const { user, hasBiometrics } = useAuthStore();

  if (!user) {
    return (
      <PageLayout title="Settings" subtitle="Account and preferences" maxWidth="narrow">
        <EmptyState
          icon="lock"
          title="Not Signed In"
          description="Please log in to view your account settings and preferences."
          action={{ label: "Sign In", href: "/" }}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Settings" subtitle="Account and preferences" maxWidth="narrow">
      {/* ── Identity Card ── */}
      <QGScrollReveal>
        <IdentityCard user={user} />
      </QGScrollReveal>

      {/* ── Security | Preferences (2-column) ── */}
      <QGScrollReveal staggerIndex={1} direction="scale">
        <div className="grid-2col">
          <SecurityPanel hasBiometrics={hasBiometrics} />
          <PreferencesPanel />
        </div>
      </QGScrollReveal>

      {/* ── Sign Out (normal action) ── */}
      <QGScrollReveal staggerIndex={2}>
        <SignOutButton />
      </QGScrollReveal>

      {/* ── Danger Zone ── */}
      <QGScrollReveal staggerIndex={3}>
        <DangerZone />
      </QGScrollReveal>
    </PageLayout>
  );
}
