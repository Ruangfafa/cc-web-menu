import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.3.3", "ruangfafa.asuscomm.com"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "192.168.3.3:3000",
        "ruangfafa.asuscomm.com:3000",
      ],
    },
  },
};

export default nextConfig;
