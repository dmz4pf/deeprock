"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Chrome, Wallet } from "lucide-react";

interface AuthMethodSelectorProps {
  onSelectEmail: () => void;
  onSelectGoogle: () => void;
  onSelectWallet: () => void;
  isLoading?: boolean;
}

export function AuthMethodSelector({
  onSelectEmail,
  onSelectGoogle,
  onSelectWallet,
  isLoading = false,
}: AuthMethodSelectorProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Deeprock</CardTitle>
        <CardDescription>
          Choose how you want to sign in or create an account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email + Passkey (Primary) */}
        <Button
          variant="default"
          className="w-full h-14 text-base justify-start px-4"
          onClick={onSelectEmail}
          disabled={isLoading}
        >
          <Mail className="mr-3 h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Continue with Email</div>
            <div className="text-xs text-muted-foreground">
              Secure passkey authentication
            </div>
          </div>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Google Sign-In */}
        <Button
          variant="outline"
          className="w-full h-14 text-base justify-start px-4"
          onClick={onSelectGoogle}
          disabled={isLoading}
        >
          <Chrome className="mr-3 h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Continue with Google</div>
            <div className="text-xs text-muted-foreground">
              Quick sign-in with your Google account
            </div>
          </div>
        </Button>

        {/* Connect Wallet */}
        <Button
          variant="outline"
          className="w-full h-14 text-base justify-start px-4"
          onClick={onSelectWallet}
          disabled={isLoading}
        >
          <Wallet className="mr-3 h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Connect Wallet</div>
            <div className="text-xs text-muted-foreground">
              Use MetaMask or other Web3 wallet
            </div>
          </div>
        </Button>

        <p className="text-xs text-center text-muted-foreground pt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  );
}
