"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { relayerApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const FAUCET_COOLDOWN_MS = 60_000; // 60 seconds

interface UseWalletBalanceReturn {
  /** Wallet USDC balance as a raw string (6 decimals) */
  balance: string | null;
  /** Formatted balance string (e.g. "1,250.00") */
  balanceFormatted: string | null;
  /** Balance as a number (already divided by 1e6) */
  balanceNum: number;
  /** Whether the balance is currently loading */
  isLoading: boolean;
  /** Error message if balance fetch failed */
  error: string | null;
  /** Manually refetch the balance */
  refetchBalance: () => Promise<void>;
  /** Request test USDC from faucet */
  requestFaucet: () => Promise<void>;
  /** Whether the faucet request is in progress */
  isFaucetLoading: boolean;
  /** Faucet error message */
  faucetError: string | null;
  /** Seconds remaining on the faucet cooldown */
  cooldownRemaining: number;
  /** Whether faucet is on cooldown */
  isOnCooldown: boolean;
}

export function useWalletBalance(): UseWalletBalanceReturn {
  const user = useAuthStore((s) => s.user);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceFormatted, setBalanceFormatted] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [faucetError, setFaucetError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownEnd = useRef<number>(0);

  const balanceNum = balance ? Number(balance) / 1e6 : 0;

  const fetchBalance = useCallback(async () => {
    if (!user?.walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await relayerApi.getUsdcBalance(user.walletAddress);
      setBalance(res.balance);
      setBalanceFormatted(res.balanceFormatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  }, [user?.walletAddress]);

  // Fetch on mount and when wallet address changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownEnd.current - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestFaucet = useCallback(async () => {
    if (cooldownRemaining > 0 || isFaucetLoading) return;
    setIsFaucetLoading(true);
    setFaucetError(null);
    try {
      const res = await relayerApi.faucet();
      // Update balance from the faucet response
      setBalance(res.newBalance);
      setBalanceFormatted(
        (Number(res.newBalance) / 1e6).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
      // Start cooldown
      cooldownEnd.current = Date.now() + FAUCET_COOLDOWN_MS;
      setCooldownRemaining(60);
    } catch (err) {
      setFaucetError(err instanceof Error ? err.message : "Faucet request failed");
    } finally {
      setIsFaucetLoading(false);
    }
  }, [cooldownRemaining, isFaucetLoading]);

  return {
    balance,
    balanceFormatted,
    balanceNum,
    isLoading,
    error,
    refetchBalance: fetchBalance,
    requestFaucet,
    isFaucetLoading,
    faucetError,
    cooldownRemaining,
    isOnCooldown: cooldownRemaining > 0,
  };
}
