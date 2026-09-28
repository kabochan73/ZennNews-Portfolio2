import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server (.next/standalone) for a small production image.
  output: "standalone",
  experimental: {
    // Keep prefetched pages (the tag pages) in the browser for 10 minutes instead
    // of 5. Articles change only a few times a day, so this is safe.
    staleTimes: { static: 600 },
  },
};

export default nextConfig;
