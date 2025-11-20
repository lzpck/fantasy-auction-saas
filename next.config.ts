import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.ignoreWarnings = [
      { message: /source map/i },
      { message: /Invalid source map/i },
    ];
    return config;
  },
};

export default nextConfig;
