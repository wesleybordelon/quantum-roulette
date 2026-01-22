import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost:3000", "192.168.4.25:3000", "172.31.176.1:3000"],
  async rewrites() {
    return [
      {
        source: "/api/quantum-spin",
        destination: "http://127.0.0.1:8000/quantum-spin",
      },
    ];
  },
};

export default nextConfig;
