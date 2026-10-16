/**
 * Compress the street model for the web.
 *   node scripts/optimize-street.mjs [in.glb] [out.glb] [maxTextureSize]
 * - drops material extensions that barely matter at night (specular, IOR, transmission)
 * - removes unused data, merges duplicates, joins meshes to cut draw calls
 * - resizes textures and converts them to WebP
 * - Draco-compresses geometry
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { dedup, draco, flatten, join, prune, resample, textureCompress, weld } from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import sharp from 'sharp'

const [input = 'assets-src/blender/street-raw.glb', output = 'public/assets/models/street.glb', size = '512'] =
  process.argv.slice(2)
const max = Number(size)

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  })

const doc = await io.read(input)

for (const name of ['KHR_materials_specular', 'KHR_materials_ior', 'KHR_materials_transmission']) {
  doc.getRoot().listExtensionsUsed().find((e) => e.extensionName === name)?.dispose()
}

// Opaque materials ignore alpha, but some textures still carry a (mostly zero)
// alpha channel. WebP throws away the colour under fully transparent pixels, so
// those textures came out blank. Strip alpha when only opaque materials use it.
for (const tex of doc.getRoot().listTextures()) {
  const users = doc.getRoot().listMaterials().filter((m) => m.getBaseColorTexture() === tex)
  if (!users.length || users.some((m) => m.getAlphaMode() !== 'OPAQUE')) continue
  const img = tex.getImage()
  if (!img || !(await sharp(img).metadata()).hasAlpha) continue
  tex.setImage(new Uint8Array(await sharp(img).removeAlpha().png().toBuffer())).setMimeType('image/png')
}

await doc.transform(
  dedup(),
  // no instance(): GPU instancing came out with wrong rotations and culling
  // (windows sticking out of walls and popping in and out)
  ...(process.env.JOIN === '1' ? [flatten(), join()] : []), // joining distorted some walls; off by default
  prune(), // drops textures orphaned by the removed extensions
  resample(),
  weld(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [max, max], quality: 75 }),
  draco(),
)
doc.createExtension(KHRDracoMeshCompression).setRequired(true)
await io.write(output, doc)
console.log(`wrote ${output}`)
