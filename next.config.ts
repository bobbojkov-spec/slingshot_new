import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'slingshotsports.com',
      },
      {
        protocol: 'https',
        hostname: 'rideengine.com',
      },
    ],
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "next-flight-client-entry-loader": path.resolve(
        __dirname,
        "node_modules/next/dist/compiled/next-flight-client-entry-loader",
      ),
    };
    return config;
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/rideengine',
        destination: '/shop?brand=ride-engine',
        permanent: true,
      },
      {
        source: '/slingshot',
        destination: '/shop?brand=slingshot',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

