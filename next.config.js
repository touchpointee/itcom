/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use memory cache in dev to avoid Windows ENOENT on .next/cache/webpack
  webpack: (config, { dev }) => {
    if (dev && config.cache) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

module.exports = nextConfig;
