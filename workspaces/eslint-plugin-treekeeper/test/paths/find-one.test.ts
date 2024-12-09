import {describe, it} from 'node:test'
import {findOne} from '../../src/paths/find-one.ts'
import assert from 'node:assert'

describe('findOne', () => {
  it('should return the item that matches the predicate', () => {
    const items = [1, 2, 3, 4]
    const predicate = (item: number) => item === 3
    const result = findOne(items, predicate)
    assert.strictEqual(result, 3)
  })

  it('should throw an error if no items match the predicate', () => {
    const items = [1, 2, 3, 4]
    const predicate = (item: number) => item === 5
    assert.throws(() => findOne(items, predicate), /No results found/)
  })

  it('should throw an error if multiple items match the predicate', () => {
    const items = [1, 2, 3, 3, 4]
    const predicate = (item: number) => item === 3
    assert.throws(() => findOne(items, predicate), /Multiple results found/)
  })

  it('should work with objects', () => {
    const items = [{id: 1}, {id: 2}, {id: 3}]
    const predicate = (item: {id: number}) => item.id === 2
    const result = findOne(items, predicate)
    assert.deepStrictEqual(result, {id: 2})
  })

  it('should throw an error if no objects match the predicate', () => {
    const items = [{id: 1}, {id: 2}, {id: 3}]
    const predicate = (item: {id: number}) => item.id === 4
    assert.throws(() => findOne(items, predicate), /No results found/)
  })

  it('should throw an error if multiple objects match the predicate', () => {
    const items = [{id: 1}, {id: 2}, {id: 2}]
    const predicate = (item: {id: number}) => item.id === 2
    assert.throws(() => findOne(items, predicate), /Multiple results found/)
  })
})
