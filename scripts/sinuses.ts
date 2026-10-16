import { count, dropSpecks, erode, grid, mask, solid, surface, type Mesh } from './voxels'

// Z-Anatomy has frontal, ethmoid and sphenoid sinus meshes but no maxillary
// sinus, and its maxilla is a solid volume. So that the largest sinus can still
// be found and selected, an illustrative one is carved from the maxilla's own
// volume, so it always sits inside the bone. The recipe keeps the voxels of
// the host that lie in a textbook region, leaves a bony wall of `wall`, and is
// smoothed. Coordinates are Z-Anatomy centimetres: +x patient left, +y
// superior, +z anterior. It is an approximation for orientation, not measured
// anatomy.

type Point = [number, number, number]
export type SinusRecipe = {
  host: string
  wall: number
  region: (p: Point) => boolean
  why: string
}

const inEllipsoid = (p: Point, c: Point, r: Point) =>
  ((p[0] - c[0]) / r[0]) ** 2 + ((p[1] - c[1]) / r[1]) ** 2 + ((p[2] - c[2]) / r[2]) ** 2 <= 1

export const sinusRecipes: Record<string, SinusRecipe> = {
  'maxillary-sinuses': {
    host: 'maxillae',
    wall: 0.15,
    // The body of each maxilla: lateral to the nasal cavity, above the tooth
    // roots and below the floor of the orbit.
    region: (p) =>
      Math.abs(p[0]) > 1.1 && inEllipsoid(p, [Math.sign(p[0]) * 2.7, 157, 6.4], [1.7, 1.6, 2]),
    why: 'the body of each maxilla, lateral to the nasal cavity, above the tooth roots and below the orbit',
  },
}

export function carve(
  recipe: SinusRecipe,
  host: Mesh,
  step = 0.06,
): { mesh: Mesh; volumeMl: number } {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < host.positions.length; i++) {
    min[i % 3] = Math.min(min[i % 3], host.positions[i])
    max[i % 3] = Math.max(max[i % 3], host.positions[i])
  }
  const bone = solid(host, grid(min, max, step))
  const air = dropSpecks(mask(erode(bone, recipe.wall), recipe.region), 400)
  const voxels = count(air)
  if (!voxels) throw new Error('Carving produced an empty sinus')
  return { mesh: surface(air), volumeMl: voxels * step ** 3 }
}
