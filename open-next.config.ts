import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Pages are built by each deploy and never regenerated at runtime: rendering one takes more CPU
// than a free-plan request allows (10 ms). They're read from Workers Static Assets, and cache
// interception serves them before Next's server even loads.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
