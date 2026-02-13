import { useState, useEffect, useCallback } from "react";
import { registrationFlow, type RegistrationFlowState } from "@/lib/flows";

export function useRegistrationFlow() {
  const [state, setState] = useState<RegistrationFlowState>(registrationFlow.getState());

  useEffect(() => {
    const unsubscribe = registrationFlow.subscribe(setState);
    return unsubscribe;
  }, []);

  const startRegistration = useCallback(async (email: string, displayName?: string) => {
    return registrationFlow.startRegistration(email, displayName);
  }, []);

  const reset = useCallback(() => {
    registrationFlow.reset();
  }, []);

  const isLoading = ["email", "webauthn", "verifying"].includes(state.step);

  return {
    ...state,
    isLoading,
    isError: state.step === "error",
    isComplete: state.step === "complete",
    isIdle: state.step === "idle",
    startRegistration,
    reset,
  };
}
