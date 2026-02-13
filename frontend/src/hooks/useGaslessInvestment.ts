/**
 * Gasless Investment Hook
 * Convenience hook wrapping GaslessInvestmentFlow orchestrator
 *
 * Part 4: Frontend Integration
 *
 * Routes to appropriate gasless method based on auth provider:
 * - WALLET users → EIP-2612 Permit
 * - GOOGLE/EMAIL users → ERC-4337 UserOperation
 */

import { useState, useEffect, useCallback } from "react";
import {
  gaslessInvestmentFlow,
  type GaslessFlowState,
  type GaslessStep,
  type GaslessMethod,
} from "@/lib/flows/gasless-investment-flow";

export interface UseGaslessInvestmentReturn {
  // State
  step: GaslessStep;
  method: GaslessMethod;
  poolId: string | null;
  amount: string | null;
  txHash: string | null;
  userOpHash: string | null;
  walletAddress: string | null;
  error: string | null;

  // Derived state
  isIdle: boolean;
  isLoading: boolean;
  isComplete: boolean;
  isError: boolean;

  // Actions
  invest: (poolId: string, amount: string) => Promise<void>;
  abort: () => void;
  reset: () => void;
}

/**
 * Hook for gasless investments
 * Automatically routes to permit or userop based on auth provider
 */
export function useGaslessInvestment(): UseGaslessInvestmentReturn {
  const [state, setState] = useState<GaslessFlowState>(gaslessInvestmentFlow.getState());

  // Subscribe to flow state changes
  useEffect(() => {
    const unsubscribe = gaslessInvestmentFlow.subscribe(setState);
    return unsubscribe;
  }, []);

  const invest = useCallback(async (poolId: string, amount: string) => {
    await gaslessInvestmentFlow.invest(poolId, amount);
  }, []);

  const abort = useCallback(() => {
    gaslessInvestmentFlow.abort();
  }, []);

  const reset = useCallback(() => {
    gaslessInvestmentFlow.reset();
  }, []);

  // Derived state
  const isIdle = state.step === "idle";
  const isLoading = !["idle", "complete", "error"].includes(state.step);
  const isComplete = state.step === "complete";
  const isError = state.step === "error";

  return {
    // State
    step: state.step,
    method: state.method,
    poolId: state.poolId,
    amount: state.amount,
    txHash: state.txHash,
    userOpHash: state.userOpHash,
    walletAddress: state.walletAddress,
    error: state.error,

    // Derived
    isIdle,
    isLoading,
    isComplete,
    isError,

    // Actions
    invest,
    abort,
    reset,
  };
}

export default useGaslessInvestment;
