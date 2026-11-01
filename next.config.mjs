/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  // Every page behind the login renders only after sign-in, so dev-time instant-navigation validation adds noise.
  experimental: { instantInsights: { validationLevel: "manual-warning" } },
  partialPrefetching: true,
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
