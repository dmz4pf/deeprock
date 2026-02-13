"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console in development
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-forge-bg">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-forge-danger/10">
          <AlertTriangle className="h-10 w-10 text-forge-danger" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-forge-text-1">Something went wrong</h1>
          <p className="text-forge-text-3">
            An unexpected error occurred. Please try again or contact support if the problem
            persists.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 rounded-lg bg-forge-copper/5 border border-forge-copper/10 text-left">
            <p className="text-sm font-mono text-forge-danger break-all">{error.message}</p>
            {error.digest && (
              <p className="mt-2 text-xs text-forge-text-3">Error ID: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="glow"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full border-forge-copper/10 text-forge-text-2 hover:bg-forge-copper/5"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
