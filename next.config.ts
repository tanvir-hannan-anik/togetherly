import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browser tests have their own build folder, so your dev server can stay open.
  distDir: process.env.E2E_TEST === "true" ? ".next-e2e" : ".next",
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
