import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/cards/:path*",
        destination: "/api/cards-static/:path*",
      },
    ];
  },
};

export default nextConfig;
