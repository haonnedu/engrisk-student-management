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
    // Optimize package imports for better performance
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tooltip",
      "recharts",
      "date-fns",
    ],
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Configure server to handle errors better and reduce CPU usage
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Disable unnecessary features to reduce CPU usage
  compress: true,
  poweredByHeader: false,
  // Ensure proper build output
  reactStrictMode: false, // Disable strict mode to reduce double-renders and CPU usage
  // Output configuration for standalone builds
  output: "standalone",
};

export default nextConfig;
