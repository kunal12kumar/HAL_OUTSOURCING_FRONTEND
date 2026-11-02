import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = {
  ...defineCloudflareConfig({}),
  // `npm run build` runs OpenNext, so OpenNext must call Next.js directly or it would call itself.
  buildCommand: "npx next build",
};

export default config;
