import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['@mogs/parser'],
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
