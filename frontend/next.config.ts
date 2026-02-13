import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake barrel imports — lucide-react alone saves ~150KB
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-popover",
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
