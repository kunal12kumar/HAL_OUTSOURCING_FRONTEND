import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig({}),
  // `npm run build` runs OpenNext, so OpenNext must call Next.js directly or it would call itself.
  buildCommand: "npx next build",
};
