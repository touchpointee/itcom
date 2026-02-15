/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  // Use memory cache in dev to avoid Windows ENOENT on .next/cache/webpack
  webpack: (config, { dev, dir }) => {
    if (dev && config.cache) {
      config.cache = { type: "memory" };
    }
    // Disable CSS source maps (may help with Windows path issues)
    config.module.rules.forEach((rule) => {
      if (rule.oneOf) {
        rule.oneOf.forEach((one) => {
          if (one.use && Array.isArray(one.use)) {
            one.use.forEach((u) => {
              if (u.loader && u.loader.includes("css-loader") && u.options) {
                u.options.sourceMap = false;
              }
            });
          }
        });
      }
    });
    return config;
  },
};

module.exports = nextConfig;
