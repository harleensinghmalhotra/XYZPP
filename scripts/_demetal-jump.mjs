import { NodeIO } from '@gltf-transform/core'
import { prune, dedup } from '@gltf-transform/functions'
const io = new NodeIO()
const doc = await io.read('FLOW assets/3d scene assets/jumping.glb')
const root = doc.getRoot()
for (const mat of root.listMaterials()) {
  console.log('before:', mat.getName(), 'metal=', mat.getMetallicFactor(), 'rough=', mat.getRoughnessFactor(),
    'mrTex=', !!mat.getMetallicRoughnessTexture())
  mat.setMetallicFactor(0)
  mat.setRoughnessFactor(0.9)
  mat.setMetallicRoughnessTexture(null)
}
await doc.transform(prune(), dedup())
console.log('textures left:', root.listTextures().map(t => t.getName() || t.getURI() || 'baseColor').length)
await io.write('scripts/_jump-demetal.glb', doc)
console.log('wrote _jump-demetal.glb')
