import type { NextConfig } from "next";
import { existsSync } from "fs";
import { join } from "path";

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
