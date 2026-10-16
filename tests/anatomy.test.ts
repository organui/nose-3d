import { describe, expect, test } from 'bun:test'
import { byId, emphasis, sourceObjects, structures } from '../src/anatomy'
import { sinusRecipes } from '../scripts/sinuses'

describe('selection emphasis', () => {
  test('keeps every structure normal without a selection', () => {
    expect(structures.every((s) => emphasis(s.id, null) === 'normal')).toBe(true)
  })

  test('keeps the selection solid and ghosts everything else', () => {
    const states = structures.map((s) => emphasis(s.id, 'maxillary-sinuses'))
    expect(states.filter((s) => s === 'selected')).toHaveLength(1)
    expect(emphasis('maxillary-sinuses', 'maxillary-sinuses')).toBe('selected')
    expect(emphasis('maxillae', 'maxillary-sinuses')).toBe('ghosted')
  })
})

describe('source ownership', () => {
  test('assigns every source object to exactly one structure', () => {
    const objects = structures.flatMap(sourceObjects)
    expect(new Set(objects).size).toBe(objects.length)
  })

  test('gives every illustrative sinus a recipe, a host bone and no source objects', () => {
    const carved = structures.filter((s) => s.carvedFrom)
    expect(carved.map((s) => s.id).sort()).toEqual(Object.keys(sinusRecipes).sort())
    for (const s of carved) {
      expect(s.sources).toEqual([])
      expect(sinusRecipes[s.id].host).toBe(s.carvedFrom!)
      expect(sourceObjects(byId[s.carvedFrom!]).length).toBeGreaterThan(0)
    }
  })
})
