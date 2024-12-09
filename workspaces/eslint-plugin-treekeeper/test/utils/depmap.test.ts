import {describe, it} from 'node:test'
import assert from 'node:assert'
import {createDependencyMap, GraphItem} from '../../src/utils/depmap.ts'

describe('createDependencyMap', () => {
  it('should create a dependency map with no dependencies', () => {
    const dependencies = {
      a: [],
      b: [],
      c: [],
    }
    const result = createDependencyMap(dependencies)

    const expected: GraphItem<string>[] = [
      {key: 'a', dependencies: [], dependents: []},
      {key: 'b', dependencies: [], dependents: []},
      {key: 'c', dependencies: [], dependents: []},
    ]
    assert.deepStrictEqual(result, expected)
  })

  it('should create a partial dependents', () => {
    const dependencies = {
      a: ['b'],
      b: ['c'],
      c: [],
    }

    const result = createDependencyMap(dependencies)

    const expected: GraphItem<string>[] = [
      {key: 'a', dependencies: ['b'], dependents: []},
      {key: 'b', dependencies: ['c'], dependents: ['a']},
      {key: 'c', dependencies: [], dependents: ['b']},
    ]

    assert.deepStrictEqual(result, expected)
  })

  it('should create a circular dependency', () => {
    const dependencies = {
      a: ['b'],
      b: ['c'],
      c: ['a'],
    }
    const result = createDependencyMap(dependencies)

    const expected: GraphItem<string>[] = [
      {key: 'a', dependencies: ['b'], dependents: ['c']},
      {key: 'b', dependencies: ['c'], dependents: ['a']},
      {key: 'c', dependencies: ['a'], dependents: ['b']},
    ]

    assert.deepStrictEqual(result, expected)
  })

  it('should handle multiple dependencies', () => {
    const dependencies = {
      a: ['b', 'c'],
      b: ['c'],
      c: [],
    }
    const result = createDependencyMap(dependencies)

    const expected: GraphItem<string>[] = [
      {key: 'a', dependencies: ['b', 'c'], dependents: []},
      {key: 'b', dependencies: ['c'], dependents: ['a']},
      {key: 'c', dependencies: [], dependents: ['a', 'b']},
    ]

    assert.deepStrictEqual(result, expected)
  })

  it('should handle no items', () => {
    const dependencies = {}
    const result = createDependencyMap(dependencies)

    const expected: GraphItem<string>[] = []

    assert.deepStrictEqual(result, expected)
  })

  it('should handle self-dependency', () => {
    const dependencies = {
      a: ['a'],
    }
    const result = createDependencyMap(dependencies)

    const expected: GraphItem<string>[] = [{key: 'a', dependencies: ['a'], dependents: ['a']}]

    assert.deepStrictEqual(result, expected)
  })
})
