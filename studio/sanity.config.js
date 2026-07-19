import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {projectId, dataset} from './projectConfig.js'
import {schemaTypes} from './schemas/index.js'
import {deskStructure} from './structure/index.js'

export default defineConfig({
  name: 'default',
  title: 'QFP Newsroom',
  projectId,
  dataset,
  plugins: [
    structureTool({structure: deskStructure}),
    media(),
    visionTool(),
  ],
  // Scheduled Publishing is now part of Studio core (as of v3.39.0 the standalone
  // @sanity/scheduled-publishing plugin was deprecated and folded in). Enabled
  // here so editors get the per-document "Schedule" action. Note: the SITE's own
  // scheduling is the GROQ `publishedAt <= now()` guard (Prompt 2) — a future
  // publishedAt reveals the post automatically, no plugin required.
  scheduledPublishing: {enabled: true, showReleasesBanner: false},
  schema: {
    types: schemaTypes,
  },
})
