import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NODE_ENV === "production"
        ? "https://msjenny.io.vn/api/v1"
        : "http://localhost:3001/api/v1",
  },
  // Ensure proper handling of client components
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Disable source maps in production to avoid path issues
  productionBrowserSourceMaps: false,
};

export default nextConfig;
