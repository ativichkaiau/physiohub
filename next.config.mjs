/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["framer-motion", "zod"]
  }
};

export default nextConfig;
