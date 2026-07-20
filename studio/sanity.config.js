import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {HomeIcon} from '@sanity/icons'
import {projectId, dataset} from './projectConfig.js'
import {schemaTypes} from './schemas/index.js'
import {deskStructure} from './structure/index.js'
import {qfpTheme} from './theme.js'
import {Logo} from './components/Logo.jsx'
import {StudioLayout} from './components/StudioLayout.jsx'
import {Welcome} from './components/Welcome.jsx'

export default defineConfig({
  name: 'default',
  title: 'QFP Newsroom',
  projectId,
  dataset,

  // Full QFP palette + Inter Tight / Inter / DM Mono (see theme.js).
  theme: qfpTheme,

  plugins: [
    structureTool({structure: deskStructure}),
    media(),
    visionTool(),
  ],

  // Scheduled Publishing is part of Studio core as of v3.39.0 (the standalone
  // @sanity/scheduled-publishing plugin was deprecated + folded in). The SITE's
  // scheduling is the GROQ `publishedAt <= now()` guard — future posts self-reveal.
  scheduledPublishing: {enabled: true, showReleasesBanner: false},

  schema: {types: schemaTypes},

  // QFP identity: wordmark in the navbar + layout (fonts, favicon, gold hairline).
  studio: {
    components: {logo: Logo, layout: StudioLayout},
  },

  // Welcome pane as the landing (first tool → default view).
  tools: (prev) => [
    {name: 'home', title: 'Home', icon: HomeIcon, component: Welcome},
    ...prev,
  ],
})
