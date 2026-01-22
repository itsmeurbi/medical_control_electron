import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disable image optimization for Electron
  images: {
    unoptimized: true
  },
  // Output standalone for Electron packaging
  output: 'standalone',
};

export default nextConfig;
