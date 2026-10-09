import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    "/api/supporters/certificates": ["./private/certificates/*.pdf"],
  },

  allowedDevOrigins: ["192.168.1.235"],
};

export default nextConfig;
