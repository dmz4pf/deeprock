import { useState, useEffect, useCallback } from "react";
import { investmentFlow, type InvestmentFlowState } from "@/lib/flows";

export function useInvestmentFlow() {
  const [state, setState] = useState<InvestmentFlowState>(investmentFlow.getState());

  useEffect(() => {
    const unsubscribe = investmentFlow.subscribe(setState);
    return unsubscribe;
  }, []);

  const startInvestment = useCallback(async (poolId: string, amount: string) => {
    return investmentFlow.startInvestment(poolId, amount);
  }, []);

  const reset = useCallback(() => {
    investmentFlow.reset();
  }, []);

  const isLoading = [
    "selecting",
    "authenticating",
    "signing",
    "submitting",
    "confirming",
  ].includes(state.step);

  return {
    ...state,
    isLoading,
    isError: state.step === "error",
    isComplete: state.step === "complete",
    isIdle: state.step === "idle",
    startInvestment,
    reset,
  };
}
