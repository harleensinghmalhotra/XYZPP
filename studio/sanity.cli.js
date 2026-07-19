import {projectId, dataset} from './projectConfig.js'

// Plain config object (equivalent to defineCliConfig(...), which is a type-only
// identity helper). Avoids the CJS named-import interop issue with `sanity/cli`.
// studioHost sets the deploy target → https://qfp-newsroom.sanity.studio, so
// `sanity deploy` runs non-interactively.
export default {
  api: {projectId, dataset},
  studioHost: 'qfp-newsroom',
}
