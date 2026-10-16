// Small voxel toolkit used to carve the illustrative sinus volumes out of the
// solid BodyParts3D bone meshes. Everything runs in source millimetres.

export type Mesh = { positions: number[]; indices: number[] }
export type Grid = {
  origin: [number, number, number]
  step: number
  size: [number, number, number]
  data: Uint8Array
}

export function grid(min: number[], max: number[], step: number): Grid {
  const size = [0, 1, 2].map((i) => Math.ceil((max[i] - min[i]) / step) + 1) as Grid['size']
  return {
    origin: [min[0], min[1], min[2]],
    step,
    size,
    data: new Uint8Array(size[0] * size[1] * size[2]),
  }
}

export const at = (g: Grid, x: number, y: number, z: number) => x + g.size[0] * (y + g.size[1] * z)

export function center(g: Grid, x: number, y: number, z: number): [number, number, number] {
  return [g.origin[0] + x * g.step, g.origin[1] + y * g.step, g.origin[2] + z * g.step]
}

// Inside test by ray parity along one axis for every voxel column. Columns
// whose crossings do not pair up (open or self-intersecting meshes) are
// skipped, so they cannot leave a filled streak.
function parity(mesh: Mesh, g: Grid, axis: 0 | 1 | 2): Uint8Array {
  const [a, b] = ([0, 1, 2] as const).filter((i) => i !== axis)
  const hits = new Map<number, number[]>()
  const p = mesh.positions
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const v = [0, 1, 2].map((k) => mesh.indices[t + k] * 3)
    const A = v.map((i) => p[i + a]),
      B = v.map((i) => p[i + b]),
      C = v.map((i) => p[i + axis])
    const lo = (vals: number[], o: number) => Math.ceil((Math.min(...vals) - o) / g.step)
    const hi = (vals: number[], o: number) => Math.floor((Math.max(...vals) - o) / g.step)
    const det = (A[1] - A[0]) * (B[2] - B[0]) - (A[2] - A[0]) * (B[1] - B[0])
    if (Math.abs(det) < 1e-12) continue
    for (
      let i = Math.max(0, lo(A, g.origin[a]));
      i <= Math.min(g.size[a] - 1, hi(A, g.origin[a]));
      i++
    )
      for (
        let j = Math.max(0, lo(B, g.origin[b]));
        j <= Math.min(g.size[b] - 1, hi(B, g.origin[b]));
        j++
      ) {
        // Tiny offset keeps rays off shared edges and vertices.
        const pa = g.origin[a] + i * g.step + 1.3e-5,
          pb = g.origin[b] + j * g.step + 2.9e-5
        const u = ((pa - A[0]) * (B[2] - B[0]) - (A[2] - A[0]) * (pb - B[0])) / det
        const w = ((A[1] - A[0]) * (pb - B[0]) - (pa - A[0]) * (B[1] - B[0])) / det
        if (u < 0 || w < 0 || u + w > 1) continue
        const key = i * 100000 + j
        const list = hits.get(key) ?? []
        list.push(C[0] + u * (C[1] - C[0]) + w * (C[2] - C[0]))
        hits.set(key, list)
      }
  }
  const out = new Uint8Array(g.data.length)
  for (const [key, list] of hits) {
    if (list.length % 2) continue
    const i = Math.floor(key / 100000),
      j = key % 100000
    list.sort((x, y) => x - y)
    for (let k = 0; k < list.length; k += 2) {
      const from = Math.max(0, Math.ceil((list[k] - g.origin[axis]) / g.step))
      const to = Math.min(g.size[axis] - 1, Math.floor((list[k + 1] - g.origin[axis]) / g.step))
      for (let c = from; c <= to; c++) {
        const idx = [0, 0, 0]
        idx[a] = i
        idx[b] = j
        idx[axis] = c
        out[at(g, idx[0], idx[1], idx[2])] = 1
      }
    }
  }
  return out
}

/** Voxels inside a closed mesh: a majority vote of parity along x, y and z. */
export function solid(mesh: Mesh, g: Grid): Grid {
  const votes = ([0, 1, 2] as const).map((axis) => parity(mesh, g, axis))
  const data = new Uint8Array(g.data.length)
  for (let i = 0; i < data.length; i++)
    data[i] = votes[0][i] + votes[1][i] + votes[2][i] >= 2 ? 1 : 0
  return { ...g, data }
}

/** Removes every voxel within `radius` mm of the outside (a spherical erosion). */
export function erode(g: Grid, radius: number): Grid {
  const r = Math.ceil(radius / g.step)
  const offsets: number[][] = []
  for (let z = -r; z <= r; z++)
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if ((x * x + y * y + z * z) * g.step * g.step <= radius * radius) offsets.push([x, y, z])
  const data = new Uint8Array(g.data.length)
  const [sx, sy, sz] = g.size
  for (let z = 0; z < sz; z++)
    for (let y = 0; y < sy; y++)
      for (let x = 0; x < sx; x++) {
        if (!g.data[at(g, x, y, z)]) continue
        let keep = true
        for (const [dx, dy, dz] of offsets) {
          const X = x + dx,
            Y = y + dy,
            Z = z + dz
          if (X < 0 || Y < 0 || Z < 0 || X >= sx || Y >= sy || Z >= sz || !g.data[at(g, X, Y, Z)]) {
            keep = false
            break
          }
        }
        if (keep) data[at(g, x, y, z)] = 1
      }
  return { ...g, data }
}

/** Keeps voxels for which `keep(point)` is true. */
export function mask(g: Grid, keep: (p: [number, number, number]) => boolean): Grid {
  const data = new Uint8Array(g.data.length)
  const [sx, sy, sz] = g.size
  for (let z = 0; z < sz; z++)
    for (let y = 0; y < sy; y++)
      for (let x = 0; x < sx; x++) {
        const i = at(g, x, y, z)
        if (g.data[i] && keep(center(g, x, y, z))) data[i] = 1
      }
  return { ...g, data }
}

/** Drops connected pieces (6-neighbour) smaller than `minVoxels`. */
export function dropSpecks(g: Grid, minVoxels: number): Grid {
  const data = g.data.slice()
  const seen = new Uint8Array(data.length)
  const [sx, sy] = g.size
  for (let start = 0; start < data.length; start++) {
    if (!data[start] || seen[start]) continue
    const stack = [start],
      piece: number[] = []
    seen[start] = 1
    while (stack.length) {
      const i = stack.pop()!
      piece.push(i)
      const x = i % sx,
        y = Math.floor(i / sx) % sy
      const next = [
        x > 0 ? i - 1 : -1,
        x < sx - 1 ? i + 1 : -1,
        y > 0 ? i - sx : -1,
        y < sy - 1 ? i + sx : -1,
        i - sx * sy,
        i + sx * sy,
      ]
      for (const n of next)
        if (n >= 0 && n < data.length && data[n] && !seen[n]) {
          seen[n] = 1
          stack.push(n)
        }
    }
    if (piece.length < minVoxels) for (const i of piece) data[i] = 0
  }
  return { ...g, data }
}

export const count = (g: Grid) => g.data.reduce((n, v) => n + v, 0)

/**
 * Surface nets: one vertex per boundary cell, one quad per occupied/empty
 * voxel face pair, then Taubin smoothing so the result reads as a soft
 * air space rather than a stack of cubes. Faces wind outward.
 */
export function surface(g: Grid, smoothing = 12): Mesh {
  const [sx, sy, sz] = g.size
  const occ = (x: number, y: number, z: number) =>
    x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz ? g.data[at(g, x, y, z)] : 0
  // Dual vertices live at cell corners (x-0.5…), indexed by the voxel corner.
  const vertex = new Map<number, number>()
  const positions: number[] = []
  const key = (x: number, y: number, z: number) => x + 1 + (sx + 2) * (y + 1 + (sy + 2) * (z + 1))
  const corner = (x: number, y: number, z: number) => {
    const k = key(x, y, z)
    let v = vertex.get(k)
    if (v === undefined) {
      v = positions.length / 3
      vertex.set(k, v)
      positions.push(
        g.origin[0] + (x - 0.5) * g.step,
        g.origin[1] + (y - 0.5) * g.step,
        g.origin[2] + (z - 0.5) * g.step,
      )
    }
    return v
  }
  const indices: number[] = []
  const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, c, a, c, d)
  for (let z = -1; z < sz; z++)
    for (let y = -1; y < sy; y++)
      for (let x = -1; x < sx; x++) {
        const here = occ(x, y, z)
        // Face between (x,y,z) and (x+1,y,z)
        if (here !== occ(x + 1, y, z)) {
          const q = [
            corner(x + 1, y, z),
            corner(x + 1, y + 1, z),
            corner(x + 1, y + 1, z + 1),
            corner(x + 1, y, z + 1),
          ]
          if (here) quad(q[0], q[1], q[2], q[3])
          else quad(q[0], q[3], q[2], q[1])
        }
        if (here !== occ(x, y + 1, z)) {
          const q = [
            corner(x, y + 1, z),
            corner(x, y + 1, z + 1),
            corner(x + 1, y + 1, z + 1),
            corner(x + 1, y + 1, z),
          ]
          if (here) quad(q[0], q[1], q[2], q[3])
          else quad(q[0], q[3], q[2], q[1])
        }
        if (here !== occ(x, y, z + 1)) {
          const q = [
            corner(x, y, z + 1),
            corner(x + 1, y, z + 1),
            corner(x + 1, y + 1, z + 1),
            corner(x, y + 1, z + 1),
          ]
          if (here) quad(q[0], q[1], q[2], q[3])
          else quad(q[0], q[3], q[2], q[1])
        }
      }
  const neighbours: Set<number>[] = Array.from({ length: positions.length / 3 }, () => new Set())
  for (let t = 0; t < indices.length; t += 3)
    for (let k = 0; k < 3; k++) {
      neighbours[indices[t + k]].add(indices[t + ((k + 1) % 3)])
      neighbours[indices[t + k]].add(indices[t + ((k + 2) % 3)])
    }
  const pass = (factor: number) => {
    const next = positions.slice()
    neighbours.forEach((set, v) => {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (const n of set) sum += positions[n * 3 + c]
        next[v * 3 + c] = positions[v * 3 + c] + factor * (sum / set.size - positions[v * 3 + c])
      }
    })
    for (let i = 0; i < next.length; i++) positions[i] = next[i]
  }
  for (let i = 0; i < smoothing; i++) {
    pass(0.5)
    pass(-0.53)
  }
  return { positions, indices }
}

/** Adds every voxel within `radius` of an occupied one (a spherical dilation). */
export function dilate(g: Grid, radius: number): Grid {
  const inverse = { ...g, data: g.data.map((v) => (v ? 0 : 1)) }
  // Pad by treating outside-the-grid as empty for the inverse: erode() treats it
  // as outside, so voxels near the border never dilate past it.
  const eroded = erode(inverse, radius)
  return { ...g, data: eroded.data.map((v) => (v ? 0 : 1)) }
}

export function union(a: Grid, b: Grid): Grid {
  return { ...a, data: a.data.map((v, i) => (v || b.data[i] ? 1 : 0)) }
}

export function subtract(a: Grid, b: Grid): Grid {
  return { ...a, data: a.data.map((v, i) => (v && !b.data[i] ? 1 : 0)) }
}

/** Keeps only the largest 6-connected piece. */
export function largest(g: Grid): Grid {
  const label = new Int32Array(g.data.length)
  const [sx, sy] = g.size
  let best = 0,
    bestSize = 0,
    next = 0
  for (let start = 0; start < g.data.length; start++) {
    if (!g.data[start] || label[start]) continue
    next++
    let size = 0
    const stack = [start]
    label[start] = next
    while (stack.length) {
      const i = stack.pop()!
      size++
      const x = i % sx,
        y = Math.floor(i / sx) % sy
      for (const n of [
        x > 0 ? i - 1 : -1,
        x < sx - 1 ? i + 1 : -1,
        y > 0 ? i - sx : -1,
        y < sy - 1 ? i + sx : -1,
        i - sx * sy,
        i + sx * sy,
      ])
        if (n >= 0 && n < g.data.length && g.data[n] && !label[n]) {
          label[n] = next
          stack.push(n)
        }
    }
    if (size > bestSize) {
      bestSize = size
      best = next
    }
  }
  return { ...g, data: g.data.map((_, i) => (label[i] === best ? 1 : 0)) }
}
