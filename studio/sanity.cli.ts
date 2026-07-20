import {defineCliConfig} from 'sanity/cli'

// CLI config for `sanity build|deploy|cors`. A .ts config is transpiled by
// esbuild (handles the CJS interop of `sanity/cli`), which the CLI's config
// loader reads reliably — a plain .js config in this `type: module` package is
// not. projectId/dataset are inlined here (as `sanity init` generates); the app
// runtime reads them from ./projectConfig.js (single source for app code).
export default defineCliConfig({
  api: {
    projectId: 'z8o5rxfi',
    dataset: 'production',
  },
  // Deploy target → https://qfp-newsroom.sanity.studio (non-interactive deploy).
  studioHost: 'qfp-newsroom',
})
