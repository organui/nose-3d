import { mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Document, NodeIO } from '@gltf-transform/core'
import { BufferAttribute, BufferGeometry, Color, Mesh, type Object3D } from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import inputs from './model-inputs.json'
import { sourceObjects, structures, type SourceFile } from '../src/anatomy'
import { carve, sinusRecipes } from './sinuses'

// FBXLoader only touches these globals for texture loading, which these files don't use.
Object.assign(globalThis, { window: globalThis, self: globalThis })

const sha = (data: Uint8Array) => createHash('sha256').update(data).digest('hex')
await mkdir('.asset-cache/fbx', { recursive: true })
await mkdir('public/models', { recursive: true })
const roots = new Map<SourceFile, Object3D>()
for (const input of inputs.files) {
  const file = Bun.file(`.asset-cache/fbx/${input.name}.fbx`)
  if (!(await file.exists())) {
    console.log(`Downloading ${input.path}…`)
    const response = await fetch(input.url)
    if (!response.ok) throw new Error(`${input.name}: HTTP ${response.status}`)
    await Bun.write(file, response)
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.length !== input.bytes || sha(bytes) !== input.sha256)
    throw new Error(
      `Checksum mismatch: ${input.name}. Refusing changed upstream data; review it before updating the pin.`,
    )
  const root = new FBXLoader().parse(bytes.buffer, '')
  root.updateMatrixWorld(true)
  roots.set(input.name as SourceFile, root)
}

function findMesh(file: SourceFile, name: string) {
  const found: Mesh[] = []
  roots.get(file)!.traverse((o) => {
    if (o instanceof Mesh && o.name === name) found.push(o)
  })
  if (found.length !== 1)
    throw new Error(`${file}: expected one mesh named ${name}, found ${found.length}`)
  return found[0]
}

// The source ethmoid also contains copies of every ethmoid cell, which are
// their own structures here. Only its largest connected piece, the bone
// itself, is kept.
const largestPieceOnly = new Set(['SkeletalSystem100/Ethmoid_bone'])
function largestPiece(indices: number[], vertexCount: number) {
  const parent = Array.from({ length: vertexCount }, (_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  for (let t = 0; t < indices.length; t += 3) {
    parent[find(indices[t + 1])] = find(indices[t])
    parent[find(indices[t + 2])] = find(indices[t])
  }
  const sizes = new Map<number, number>()
  for (let t = 0; t < indices.length; t += 3)
    sizes.set(find(indices[t]), (sizes.get(find(indices[t])) ?? 0) + 1)
  const keep = [...sizes].sort((a, b) => b[1] - a[1])[0][0]
  const kept: number[] = []
  for (let t = 0; t < indices.length; t += 3)
    if (find(indices[t]) === keep) kept.push(indices[t], indices[t + 1], indices[t + 2])
  return kept
}

// Cuts a mesh with the horizontal plane y = height and keeps what lies below,
// splitting the triangles that cross it so the cut edge is straight.
function clipAbove(positions: number[], indices: number[], height: number) {
  const out = positions.slice()
  const kept: number[] = []
  const cache = new Map<string, number>()
  const cross = (a: number, b: number) => {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`
    let v = cache.get(key)
    if (v === undefined) {
      const t = (height - positions[a * 3 + 1]) / (positions[b * 3 + 1] - positions[a * 3 + 1])
      v = out.length / 3
      for (let i = 0; i < 3; i++)
        out.push(positions[a * 3 + i] + t * (positions[b * 3 + i] - positions[a * 3 + i]))
      cache.set(key, v)
    }
    return v
  }
  for (let t = 0; t < indices.length; t += 3) {
    const tri = indices.slice(t, t + 3)
    const below = tri.map((v) => positions[v * 3 + 1] <= height)
    const polygon: number[] = []
    for (let k = 0; k < 3; k++) {
      if (below[k]) polygon.push(tri[k])
      if (below[k] !== below[(k + 1) % 3]) polygon.push(cross(tri[k], tri[(k + 1) % 3]))
    }
    for (let k = 1; k < polygon.length - 1; k++) kept.push(polygon[0], polygon[k], polygon[k + 1])
  }
  return { positions: out, indices: kept }
}

// The frontal bone reaches the top of the forehead. It is cut at this height
// (source cm, about 5 cm above the nasion, just above the frontal sinuses) so
// the nose fills the view.
const frontalCropY = 166

type Prepared = {
  structure: (typeof structures)[number]
  positions: number[]
  indices: number[]
  objects: { file: SourceFile; object: string; vertices: number; triangles: number }[]
}
const used = new Set<string>()
const prepared: Prepared[] = []
for (const structure of structures) {
  if (structure.carvedFrom) continue
  let positions: number[] = [],
    indices: number[] = []
  const objects: Prepared['objects'] = []
  for (const { file, objects: names } of structure.sources) {
    for (const name of names) {
      const key = `${file}/${name}`
      if (used.has(key)) throw new Error(`Duplicate ownership: ${key}`)
      used.add(key)
      const mesh = findMesh(file, name)
      // Keep positions only, apply the object's world transform, then weld
      // coincident vertices so normals can be smoothed.
      const source = new BufferGeometry().setAttribute(
        'position',
        mesh.geometry.getAttribute('position').clone(),
      )
      if (mesh.geometry.index) source.setIndex(mesh.geometry.index.clone())
      source.applyMatrix4(mesh.matrixWorld)
      const geometry = mergeVertices(source, 1e-5)
      const p = geometry.getAttribute('position') as BufferAttribute
      let index = Array.from(geometry.index!.array)
      if (largestPieceOnly.has(key)) index = largestPiece(index, p.count)
      const offset = positions.length / 3
      for (let i = 0; i < p.count; i++) {
        const v = [p.getX(i), p.getY(i), p.getZ(i)]
        if (!v.every(Number.isFinite)) throw new Error(`Invalid vertex: ${key}`)
        positions.push(...v)
      }
      for (const i of index) indices.push(offset + i)
      const triangles = index.length / 3
      if (!p.count || !triangles) throw new Error(`Empty mesh: ${key}`)
      objects.push({ file, object: name, vertices: p.count, triangles })
      source.dispose()
      geometry.dispose()
    }
  }
  if (structure.id === 'frontal-bone')
    ({ positions, indices } = clipAbove(positions, indices, frontalCropY))
  prepared.push({ structure, positions, indices, objects })
}
if (used.size !== structures.flatMap(sourceObjects).length) throw new Error('Source count mismatch')

// Illustrative sinuses are carved from their host bone's source volume, so
// they always lie inside it.
const carved: Record<
  string,
  { volumeMl: number; triangles: number; wallCm: number; region: string }
> = {}
for (const structure of structures) {
  if (!structure.carvedFrom) continue
  const recipe = sinusRecipes[structure.id]
  if (!recipe || recipe.host !== structure.carvedFrom)
    throw new Error(`No carving recipe for ${structure.id} in ${structure.carvedFrom}`)
  const host = prepared.find((p) => p.structure.id === recipe.host)!
  const { mesh, volumeMl } = carve(recipe, host)
  carved[structure.id] = {
    volumeMl: Math.round(volumeMl * 10) / 10,
    triangles: mesh.indices.length / 3,
    wallCm: recipe.wall,
    region: recipe.why,
  }
  prepared.push({ structure, positions: mesh.positions, indices: mesh.indices, objects: [] })
}
// Keep the structure order of anatomy.ts in the GLB.
prepared.sort((a, b) => structures.indexOf(a.structure) - structures.indexOf(b.structure))

// Bounds of what is actually drawn, ignoring vertices no triangle uses.
const min = [Infinity, Infinity, Infinity],
  max = [-Infinity, -Infinity, -Infinity]
for (const { positions, indices } of prepared)
  for (const v of indices)
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], positions[v * 3 + i])
      max[i] = Math.max(max[i], positions[v * 3 + i])
    }

const doc = new Document()
doc.getRoot().getAsset().copyright =
  'Z-Anatomy (CC BY-SA 4.0), based in part on BodyParts3D, © The Database Center for Life Science (CC BY-SA 2.1 Japan). Adapted by OrganUI.'
const scene = doc.createScene('OrganUI Nose — Z-Anatomy')
const buffer = doc.createBuffer()
const center = min.map((v, i) => (v + max[i]) / 2)
// Source units are centimetres, Y up, +Z anterior, patient right at −X, so the
// axes already match the display. Uniform scale only, no anatomical reshaping.
const scale = 0.25
for (const { structure, positions: all, indices: allIndices } of prepared) {
  // Drop vertices no triangle uses (cut-away frontal bone, ethmoid cell copies)
  // so they cannot widen the camera framing.
  const remap = new Map<number, number>()
  const positions: number[] = []
  const indices = allIndices.map((v) => {
    let next = remap.get(v)
    if (next === undefined) {
      next = remap.size
      remap.set(v, next)
      positions.push(all[v * 3], all[v * 3 + 1], all[v * 3 + 2])
    }
    return next
  })
  const transformed = new Float32Array(positions.length)
  for (let i = 0; i < positions.length; i++) transformed[i] = (positions[i] - center[i % 3]) * scale
  const geometry = new BufferGeometry()
    .setAttribute('position', new BufferAttribute(transformed, 3))
    .setIndex(indices)
  geometry.computeVertexNormals()
  const color = new Color(structure.color)
  const material = doc
    .createMaterial(structure.id)
    .setBaseColorFactor([color.r, color.g, color.b, 1])
    .setRoughnessFactor(0.65)
    .setMetallicFactor(0)
    .setDoubleSided(true)
  const primitive = doc
    .createPrimitive()
    .setAttribute(
      'POSITION',
      doc.createAccessor().setType('VEC3').setArray(transformed).setBuffer(buffer),
    )
    .setAttribute(
      'NORMAL',
      doc
        .createAccessor()
        .setType('VEC3')
        .setArray(new Float32Array(geometry.getAttribute('normal').array))
        .setBuffer(buffer),
    )
    .setIndices(
      doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)).setBuffer(buffer),
    )
    .setMaterial(material)
  const mesh = doc.createMesh(structure.id).addPrimitive(primitive)
  scene.addChild(
    doc
      .createNode(structure.id)
      .setMesh(mesh)
      .setExtras({ structureId: structure.id, sources: sourceObjects(structure) }),
  )
  geometry.dispose()
}
const runtime = await new NodeIO().writeBinary(doc)
await Bun.write('public/models/nose.glb', runtime)
const manifest = {
  dataset: 'Z-Anatomy',
  license: 'CC-BY-SA-4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  basedOn: {
    dataset: 'BodyParts3D / Anatomography',
    license: 'CC-BY-SA-2.1-JP',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en',
  },
  credit: doc.getRoot().getAsset().copyright,
  retrieved: '2026-10-16',
  source: { repository: inputs.repository, commit: inputs.commit, files: inputs.files },
  transform: {
    sourceBoundsCm: { min, max },
    centerCm: center,
    scale,
    axes: '[x, y, z]',
    frontalCropYCm: frontalCropY,
  },
  runtime: { file: 'nose.glb', bytes: runtime.byteLength, sha256: sha(runtime) },
  structures: prepared.map(({ structure, objects }) => ({
    id: structure.id,
    objects,
    ...(structure.carvedFrom
      ? { illustrative: { carvedFrom: structure.carvedFrom, ...carved[structure.id] } }
      : {}),
  })),
}
await Bun.write('public/models/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(
  `Prepared ${structures.length} structures (${Object.keys(carved).length} illustrative) from ${used.size} source objects, ${runtime.byteLength} bytes. SHA-256 ${sha(runtime)}`,
)
