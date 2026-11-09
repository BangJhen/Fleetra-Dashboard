import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  distDir: process.env.FLEETRA_TEST_SERVER === "1"
    ? ".next-qa"
    : process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  turbopack: {
    root: process.cwd(),
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};
export default nextConfig;
