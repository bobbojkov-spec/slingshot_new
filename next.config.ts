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
      {
        protocol: 'https',
        hostname: 'slingshotnewimages-hw-tht.storage.railway.app',
      },
      {
        protocol: 'https',
        hostname: 'slingshotnewimages-hw-tht.t3.storageapi.dev',
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
  async rewrites() {
    return [
      // Rewrite locale-prefixed admin routes to non-prefixed admin routes
      {
        source: '/bg/admin/:path*',
        destination: '/admin/:path*',
      },
      {
        source: '/en/admin/:path*',
        destination: '/admin/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

