import {expectType} from 'tsd'
import {describe, it} from 'node:test'
import assert from 'node:assert'
import {Future} from '../src/index.ts'
import {futurify} from '../src/futurify.ts'

describe('futurify', () => {
  it('should convert promise to future', async () => {
    const addAsync = (a: number, b: number) => Promise.resolve(a + b)
    const addFuture = futurify(addAsync)
    const a = Future.resolve(250)
    const b = Future.resolve(115)
    const result = addFuture(a, b)
    expectType<Future<number>>(result)
    assert.equal(await result, 365)
  })
})
