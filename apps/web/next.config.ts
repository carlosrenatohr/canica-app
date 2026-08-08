import type { NextConfig } from "next";

const apiBase = process.env.API_BASE_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiBase}/api/auth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
