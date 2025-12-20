import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Basic optimizations
  compress: true,
  poweredByHeader: false,
  // Disable strict mode to reduce double-renders
  reactStrictMode: false,
};

export default nextConfig;
