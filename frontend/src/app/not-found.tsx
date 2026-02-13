"use client";

import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-forge-bg">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-forge-copper/5">
          <Search className="h-10 w-10 text-forge-text-3" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-forge-text-1">404</h1>
          <h2 className="text-xl font-semibold text-forge-text-1">Page Not Found</h2>
          <p className="text-forge-text-3">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/portfolio">
            <Button className="w-full" variant="glow">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-forge-copper/10 text-forge-text-2 hover:bg-forge-copper/5"
            onClick={() => typeof window !== "undefined" && window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
