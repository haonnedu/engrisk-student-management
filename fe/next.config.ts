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
  // Ensure proper handling of client components and reduce CPU usage
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Reduce CPU usage with optimized server components
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog'],
  },
  // Disable source maps in production to avoid path issues
  productionBrowserSourceMaps: false,
  // Configure server to handle errors better and reduce CPU usage
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000, // Reduced from 60s to 25s to free memory faster
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2, // Reduced from 5 to 2 to reduce memory/CPU usage
  },
  // Disable unnecessary features to reduce CPU usage
  compress: true,
  poweredByHeader: false,
  // Ensure proper build output for client components
  reactStrictMode: true,
  // Disable turbopack in production (use webpack) for better compatibility
  swcMinify: true,
};

export default nextConfig;
