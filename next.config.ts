import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { cpus: 1 },
  images: { unoptimized: true },
  async rewrites() {
    const backend = process.env.QUANTUM_API_ORIGIN ?? "http://127.0.0.1:8100";
    return [{ source: "/api/quantum-spin", destination: backend + "/quantum-spin" }];
  },
};

export default nextConfig;
