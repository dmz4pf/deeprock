"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Wallet, CheckCircle2 } from "lucide-react";
import { authApi, type AuthUser } from "@/lib/api";
import { toast } from "sonner";

interface WalletAuthFlowProps {
  step: "wallet-connect" | "wallet-sign";
  onAuthenticated: (
    user: AuthUser & { authProvider: string },
    csrfToken: string,
    isNewUser: boolean,
    hasBiometrics: boolean
  ) => void;
  onBack: () => void;
}

export function WalletAuthFlow({
  step,
  onAuthenticated,
  onBack,
}: WalletAuthFlowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [siweMessage, setSiweMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(step);

  const hasMetaMask = typeof window !== "undefined" && window.ethereum;

  const handleConnectWallet = async () => {
    if (!hasMetaMask) {
      toast.error("MetaMask is not installed. Please install it to continue.");
      return;
    }

    setIsLoading(true);
    try {
      const accounts = (await window.ethereum!.request({
        method: "eth_requestAccounts",
      })) as string[];

      const address = accounts[0];
      setWalletAddress(address);

      const nonceResult = await authApi.walletNonce(address);
      setSiweMessage(nonceResult.message);
      setCurrentStep("wallet-sign");

      toast.success("Wallet connected! Please sign the message.");
    } catch (error: unknown) {
      console.error("Connect wallet error:", error);
      const ethError = error as { code?: number; message?: string };
      if (ethError.code === 4001) {
        toast.error("Connection rejected. Please try again.");
      } else {
        toast.error(ethError.message || "Failed to connect wallet");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignMessage = async () => {
    if (!walletAddress || !siweMessage || !hasMetaMask) return;

    setIsLoading(true);
    try {
      const signature = await window.ethereum!.request({
        method: "personal_sign",
        params: [siweMessage, walletAddress],
      });

      const result = await authApi.walletVerify(siweMessage, signature as string);

      toast.success("Wallet authentication successful!");
      onAuthenticated(result.user, result.csrfToken, result.isNewUser, result.hasBiometrics);
    } catch (error: unknown) {
      console.error("Sign message error:", error);
      const ethError = error as { code?: number; message?: string };
      if (ethError.code === 4001) {
        toast.error("Signature rejected. Please try again.");
      } else {
        toast.error(ethError.message || "Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleBackToConnect = () => {
    setCurrentStep("wallet-connect");
    setWalletAddress(null);
    setSiweMessage(null);
  };

  if (currentStep === "wallet-connect") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 mb-2"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <CardTitle className="text-2xl">Connect your wallet</CardTitle>
          <CardDescription>
            Connect with MetaMask or another Web3 wallet to sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasMetaMask ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                MetaMask is required to connect your wallet.
              </p>
              <Button asChild>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Install MetaMask
                </a>
              </Button>
            </div>
          ) : (
            <Button
              className="w-full h-14"
              onClick={handleConnectWallet}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect MetaMask
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 mb-2"
          onClick={handleBackToConnect}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Use different wallet
        </Button>
        <CardTitle className="text-2xl">Sign to verify</CardTitle>
        <CardDescription>
          Sign a message to prove you own this wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {walletAddress && (
          <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-forge-success" />
            <span className="font-mono">{formatAddress(walletAddress)}</span>
          </div>
        )}

        <Button
          className="w-full h-14"
          onClick={handleSignMessage}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Waiting for signature...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-5 w-5" />
              Sign message
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          This signature proves you own this wallet. It does not authorize any
          transactions.
        </p>
      </CardContent>
    </Card>
  );
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (
        event: string,
        callback: (...args: unknown[]) => void
      ) => void;
    };
  }
}
