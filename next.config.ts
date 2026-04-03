import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",").filter(Boolean) ?? ["127.0.0.1"],
  reactCompiler: true,
};

export default nextConfig;
