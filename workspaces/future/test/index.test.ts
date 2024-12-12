import {expectType} from 'tsd'
import {describe, it} from 'node:test'
import assert from 'node:assert'
import {Future} from '../src/index.ts'

function resolveString(value: string, dep?: Future<string>) {
  let count = 0
  const future = new Future(
    (value, dep) => {
      count++
      if (dep) return value + dep
      return value
    },
    [value, dep],
  )
  const getCount = () => count
  const output: [Future<string>, () => number] = [future, getCount]
  return output
}

function resolveNumber(value: number, dep?: Future<number>) {
  let count = 0
  const future = new Future(
    (value, dep) => {
      count++
      if (dep) return value + dep
      return value
    },
    [value, dep],
  )
  const getCount = () => count
  const output: [Future<number>, () => number] = [future, getCount]
  return output
}

describe('constructor', () => {
  describe('simple', () => {
    it('should be able to resolve a value', async () => {
      const future = new Future(() => 'hello world')
      expectType<Future<string>>(future)
      assert.ok(future instanceof Future)
      assert.strictEqual(await future, 'hello world')
    })

    it('should catch', async () => {
      const future = new Future(() => {
        throw new Error('hello world')
      })
      expectType<Future<void>>(future)
      assert.ok(future instanceof Future)
      assert.rejects(async () => {
        await future
      }, new Error('hello world'))
    })

    it('demonstrates caching', async () => {
      let count = 0
      const future = new Future(() => {
        count += 1
        return 'hello world'
      })
      expectType<Future<string>>(future)
      assert.ok(future instanceof Future)
      assert.strictEqual(await future, 'hello world')
      assert.strictEqual(await future, 'hello world')
      assert.strictEqual(count, 1)
    })

    it('demonstrates parallel caching', async () => {
      let count = 0
      const future = new Future(() => {
        count += 1
        return 'hello world'
      })
      expectType<Future<string>>(future)
      assert.ok(future instanceof Future)
      assert.deepStrictEqual(await Promise.all([future, future, future]), ['hello world', 'hello world', 'hello world'])
      assert.strictEqual(count, 1)
    })

    it('demonstrates async callback', async () => {
      let countAsync = 0
      let countFuture = 0

      const exampleAsync = () => {
        return new Promise(resolve => {
          setTimeout(() => {
            countAsync += 1
            resolve('hello world')
          }, 100)
        })
      }

      const future = new Future(async () => {
        countFuture += 1
        const value = await exampleAsync()
        return value + ' ' + 'now'
      })
      expectType<Future<string>>(future)
      assert.ok(future instanceof Future)
      assert.deepStrictEqual(await Promise.all([future, future, future]), [
        'hello world now',
        'hello world now',
        'hello world now',
      ])
      assert.strictEqual(countAsync, 1)
      assert.strictEqual(countFuture, 1)
    })
  })

  describe('dependencies', () => {
    it('should be able to resolve a value', async () => {
      const alpha = new Future(() => 1)
      const beta = new Future(() => 2)

      const operation = new Future(
        (a, b) => {
          expectType<number>(a)
          expectType<number>(b)
          return a + b
        },
        [alpha, beta],
      )

      expectType<Future<number>>(alpha)
      expectType<Future<number>>(beta)
      expectType<Future<number>>(operation)
      assert.ok(alpha instanceof Future)
      assert.ok(beta instanceof Future)
      assert.ok(operation instanceof Future)
      assert.strictEqual(await operation, 3)
    })
  })

  describe('no cache', () => {
    it('should be able to resolve a value', async () => {
      let count = 0
      const future = new Future(
        () => {
          count += 1
          return 'hello world'
        },
        [],
        true,
      )
      expectType<Future<string>>(future)
      assert.ok(future instanceof Future)
      assert.strictEqual(await future, 'hello world')
      assert.strictEqual(await future, 'hello world')
      assert.strictEqual(count, 2)
    })
  })
})

describe('.then()', () => {
  it('should be able to resolve a value', async () => {
    const future = new Future(() => 1)
    const result = future.then(value => value + 1)
    expectType<Future<number>>(future)
    assert.strictEqual(await result, 2)
  })
})

describe('.catch()', () => {
  it('should be able to resolve a value', async () => {
    const future = new Future(() => {
      throw new Error('hello world')
    })
    const result = future.catch(err => err)
    expectType<Future<number>>(future)
    assert.deepEqual(await result, new Error('hello world'))
  })
})

describe('.finally()', () => {
  it('should be able to resolve a value', async () => {
    let finallyRan = false
    const future = new Future(() => 1)
    const result = future.finally(() => {
      finallyRan = true
    })
    expectType<Future<number>>(future)
    assert.strictEqual(await result, 1)
    assert.strictEqual(finallyRan, true)
  })
})

describe('Future.resolve()', () => {
  it('should be able to resolve a value', async () => {
    const result = Future.resolve(1)
    expectType<Future<number>>(result)
    assert.ok(result instanceof Future)
    assert.strictEqual(await result, 1)
  })

  it('should be able to resolve a future', async () => {
    const future = new Future(() => 1)
    const result = Future.resolve(future)
    expectType<Future<number>>(result)
    assert.ok(result instanceof Future)
    assert.strictEqual(await result, 1)
  })
})

describe('.resolve()', () => {
  it('should be able to resolve a value', async () => {
    const [future, getCount] = resolveNumber(1)
    assert.strictEqual(await future.resolve(), 1)
    assert.strictEqual(getCount(), 1)
    assert.strictEqual(await future.resolve({clear: true}), 1)
    assert.strictEqual(getCount(), 2)
    assert.strictEqual(await future.resolve(), 1)
    assert.strictEqual(getCount(), 2)
  })
})

describe('.use()', () => {
  it('should be able to resolve a value', async () => {
    let resultCount = 0
    let resultPlusOneCount = 0
    const result = new Future(() => {
      resultCount += 1
      return 1
    })
    const resultPlusOne = result.use(value => {
      resultPlusOneCount += 1
      return value + 1
    })
    expectType<Future<number>>(result)
    expectType<Future<number>>(resultPlusOne)
    assert.ok(result instanceof Future)
    assert.ok(resultPlusOne instanceof Future)
    assert.strictEqual(await result, 1)
    assert.strictEqual(await resultPlusOne, 2)
    assert.strictEqual(await result, 1)
    assert.strictEqual(await resultPlusOne, 2)
    assert.notStrictEqual(result, resultPlusOne)
    assert.strictEqual(resultCount, 1)
    assert.strictEqual(resultPlusOneCount, 1)
  })
})

describe('.update()', () => {
  it('should be maintain cache if executed before update', async () => {
    let resultCount = 0
    let resultPlusOneCount = 0
    const result = new Future(() => {
      resultCount += 1
      return 1
    })
    assert.strictEqual(await result, 1)
    const resultPlusOne = result.update(value => {
      resultPlusOneCount += 1
      return value + 1
    })
    expectType<Future<number>>(result)
    expectType<Future<number>>(resultPlusOne)
    assert.ok(result instanceof Future)
    assert.ok(resultPlusOne instanceof Future)
    assert.strictEqual(await result, 2)
    assert.strictEqual(await resultPlusOne, 2)
    assert.strictEqual(await result, 2)
    assert.strictEqual(result, resultPlusOne)
    assert.strictEqual(resultCount, 1)
    assert.strictEqual(resultPlusOneCount, 1)
  })

  it('should update value', async () => {
    let resultCount = 0
    let resultPlusOneCount = 0
    const result = new Future(() => {
      resultCount += 1
      return 1
    })
    const resultPlusOne = result.update(value => {
      console.log('value', value)
      resultPlusOneCount += 1
      return value + 1
    })
    expectType<Future<number>>(result)
    expectType<Future<number>>(resultPlusOne)
    assert.ok(result instanceof Future)
    assert.ok(resultPlusOne instanceof Future)
    assert.strictEqual(await result, 2)
    assert.strictEqual(await resultPlusOne, 2)
    assert.strictEqual(await result, 2)
    assert.strictEqual(result, resultPlusOne)
    assert.strictEqual(resultCount, 1)
    assert.strictEqual(resultPlusOneCount, 1)
  })
})

describe('.clone()', () => {
  it('should be able to clone with value', async () => {
    const [alpha, alphaCount] = resolveNumber(1)
    const beta = alpha.clone(-1)
    expectType<Future<number>>(alpha)
    expectType<Future<number>>(beta)
    assert.ok(alpha instanceof Future)
    assert.ok(beta instanceof Future)
    assert.strictEqual(alphaCount(), 0)
    assert.strictEqual(await alpha, 1)
    assert.strictEqual(alphaCount(), 1)
    assert.strictEqual(await beta, 1)
    assert.strictEqual(alphaCount(), 1)
  })

  it('should be able to clone a future', async () => {
    const [alpha, alphaCount] = resolveNumber(1)
    const beta = alpha.clone()
    expectType<Future<number>>(alpha)
    expectType<Future<number>>(beta)
    assert.ok(alpha instanceof Future)
    assert.ok(beta instanceof Future)
    assert.strictEqual(alphaCount(), 0)
    assert.strictEqual(await alpha, 1)
    assert.strictEqual(alphaCount(), 1)
    assert.strictEqual(await beta, 1)
    assert.strictEqual(alphaCount(), 2)
  })

  it('should demonstrate clone with deps cached', async () => {
    const [a, aCount] = resolveString('a')
    const [b, bCount] = resolveString('b')
    const [c, cCount] = resolveString('c')
    const [d, dCount] = resolveString('d')

    let alphaCount = 0
    const alpha = new Future(
      (a, b, c, d) => {
        alphaCount += 1
        return a + b + c + d
      },
      [a, b, c, d],
    )

    const value = await alpha
    assert.strictEqual(value, 'abcd')
    ;[aCount(), bCount(), cCount(), dCount(), alphaCount].forEach(count => assert.strictEqual(count, 1))

    const value2 = await alpha.clone()
    assert.strictEqual(value2, 'abcd')
    ;[aCount(), bCount(), cCount(), dCount()].forEach(count => assert.strictEqual(count, 1))
    assert.strictEqual(alphaCount, 2)
  })

  it('should demonstrate clone with clearing deps', async () => {
    const [a, aCount] = resolveString('a')
    const [b, bCount] = resolveString('b')
    const [c, cCount] = resolveString('c')
    const [d, dCount] = resolveString('d')

    let alphaCount = 0
    const alpha = new Future(
      (a, b, c, d) => {
        alphaCount += 1
        return a + b + c + d
      },
      [a, b, c, d],
    )

    const value = await alpha
    assert.strictEqual(value, 'abcd')
    ;[aCount(), bCount(), cCount(), dCount(), alphaCount].forEach(count => assert.strictEqual(count, 1))

    const value2 = await alpha.clone(1)
    assert.strictEqual(value2, 'abcd')
    ;[aCount(), bCount(), cCount(), dCount(), alphaCount].forEach(count => assert.strictEqual(count, 2))
  })

  it('should clone 0', async () => {
    const [levelOne, getLevelOneCount] = resolveNumber(1)
    const [levelTwo, getLevelTwoCount] = resolveNumber(2, levelOne)
    const [levelThree, getLevelThreeCount] = resolveNumber(3, levelTwo)
    assert.strictEqual(await levelOne, 1)
    assert.strictEqual(await levelTwo, 3)
    assert.strictEqual(await levelThree, 6)
    assert.strictEqual(getLevelOneCount(), 1)
    assert.strictEqual(getLevelTwoCount(), 1)
    assert.strictEqual(getLevelThreeCount(), 1)
    assert.strictEqual(await levelThree.clone(), 6)
    assert.strictEqual(getLevelOneCount(), 1)
    assert.strictEqual(getLevelTwoCount(), 1)
    assert.strictEqual(getLevelThreeCount(), 2)
  })
  it('should clone 1', async () => {
    const [levelOne, getLevelOneCount] = resolveNumber(1)
    const [levelTwo, getLevelTwoCount] = resolveNumber(2, levelOne)
    const [levelThree, getLevelThreeCount] = resolveNumber(3, levelTwo)
    assert.strictEqual(await levelOne, 1)
    assert.strictEqual(await levelTwo, 3)
    assert.strictEqual(await levelThree, 6)
    assert.strictEqual(getLevelOneCount(), 1)
    assert.strictEqual(getLevelTwoCount(), 1)
    assert.strictEqual(getLevelThreeCount(), 1)
    assert.strictEqual(await levelThree.clone(1), 6)
    assert.strictEqual(getLevelOneCount(), 1)
    assert.strictEqual(getLevelTwoCount(), 2)
    assert.strictEqual(getLevelThreeCount(), 2)
  })
  it('should clone 2', async () => {
    const [levelOne, getLevelOneCount] = resolveNumber(1)
    const [levelTwo, getLevelTwoCount] = resolveNumber(2, levelOne)
    const [levelThree, getLevelThreeCount] = resolveNumber(3, levelTwo)
    assert.strictEqual(await levelOne, 1)
    assert.strictEqual(await levelTwo, 3)
    assert.strictEqual(await levelThree, 6)
    assert.strictEqual(getLevelOneCount(), 1)
    assert.strictEqual(getLevelTwoCount(), 1)
    assert.strictEqual(getLevelThreeCount(), 1)
    assert.strictEqual(await levelThree.clone(2), 6)
    assert.strictEqual(getLevelOneCount(), 2)
    assert.strictEqual(getLevelTwoCount(), 2)
    assert.strictEqual(getLevelThreeCount(), 2)
  })
})

describe('.noCache()', () => {
  it('should be able to noCache with value', async () => {
    const [alpha, alphaCount] = resolveNumber(1)
    const beta = alpha.noCache(-1)
    expectType<Future<number>>(alpha)
    expectType<Future<number>>(beta)
    assert.ok(alpha instanceof Future)
    assert.ok(beta instanceof Future)
    assert.strictEqual(alphaCount(), 0)
    assert.strictEqual(await alpha, 1)
    assert.strictEqual(alphaCount(), 1)
    assert.strictEqual(await beta, 1)
    assert.strictEqual(alphaCount(), 1)
  })

  it('should work with noCache 0', async () => {
    const [alpha, alphaCount] = resolveNumber(1)
    const beta = alpha.noCache()
    expectType<Future<number>>(alpha)
    expectType<Future<number>>(beta)
    assert.ok(alpha instanceof Future)
    assert.ok(beta instanceof Future)
    assert.strictEqual(alphaCount(), 0)
    assert.strictEqual(await alpha, 1)
    assert.strictEqual(alphaCount(), 1)
    assert.strictEqual(await beta, 1)
    assert.strictEqual(alphaCount(), 2)
    assert.strictEqual(await beta, 1)
    assert.strictEqual(alphaCount(), 3)
    assert.strictEqual(await beta, 1)
    assert.strictEqual(alphaCount(), 4)
  })
  it('should work noCache 1', async () => {
    const [levelOne, getLevelOneCount] = resolveNumber(1)
    const [levelTwo, getLevelTwoCount] = resolveNumber(2, levelOne)
    const [levelThree, getLevelThreeCount] = resolveNumber(3, levelTwo)
    assert.strictEqual(await levelOne, 1)
    assert.strictEqual(await levelTwo, 3)
    assert.strictEqual(await levelThree, 6)
    assert.strictEqual(getLevelOneCount(), 1)
    assert.strictEqual(getLevelTwoCount(), 1)
    assert.strictEqual(getLevelThreeCount(), 1)
    const nc = levelThree.noCache(1)
    assert.strictEqual(await nc, 6)
    assert.strictEqual(getLevelOneCount(), 1)
    assert.strictEqual(getLevelTwoCount(), 2)
    assert.strictEqual(getLevelThreeCount(), 2)
    assert.strictEqual(await nc, 6)
    assert.strictEqual(getLevelOneCount(), 1)
    assert.strictEqual(getLevelTwoCount(), 3)
    assert.strictEqual(getLevelThreeCount(), 3)
  })
})
