import {expectType} from 'tsd'
import {describe, it} from 'node:test'
import assert from 'node:assert'
import {Future} from '../src/index.ts'
import {FuturifiedInstance, futurifyClass} from '../src/futurify-class.ts'

class Example {
  constructor(public value: number) {}
  add(a: number) {
    this.value += a
    return this
  }
  static add(a: number) {
    return new Example(a).add(10)
  }
  static helloWorld() {
    return 'hello world'
  }
  static meow = true
  static numby = 4
}

describe('futurifyClass', () => {
  it('should convert promise to future', async () => {
    const $Example = futurifyClass(Example)
    const value = Future.resolve(23)
    const example = new $Example(value)
    const number = await example.value
    expectType<number>(number)
    assert.equal(number, 23)
    const result = example.add(Future.resolve(42))
    const number2 = await result.value
    expectType<number>(number2)
    assert.equal(number2, 65)
    const e = await example
    expectType<Example>(e)
    assert.equal(e.value, 65)
  })

  it('should use native class URL', async () => {
    const $Example = futurifyClass(URL)
    const value = Future.resolve('https://google.com')
    const example = new $Example(value)
    assert.equal(await example.hostname, 'google.com')
  })

  it('should use static members', async () => {
    const $Example = futurifyClass(Example)
    const helloWorldFuture = $Example.helloWorld()
    expectType<Future<string>>(helloWorldFuture)
    assert.equal(await helloWorldFuture, 'hello world')
    const twentyFuture = $Example.add(Future.resolve(10))
    expectType<FuturifiedInstance<Example>>(twentyFuture)
    assert.equal(await twentyFuture.value, 20)
    assert.equal(await $Example.meow, true)
    assert.equal(await $Example.numby, 4)
  })
})
