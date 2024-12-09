import {patterns} from '../../src/path/patterns.ts'
import {defaultOptions} from '../../src/utils/options.ts'
import {describe, it} from 'node:test'
import {minimatch} from 'minimatch'
import assert from 'node:assert'

const pathType = (path: string, pattern: keyof typeof patterns) => {
  const pat = patterns[pattern]({...defaultOptions}, '.ts')
  return minimatch(path, pat)
}

const runAssertions = (path: string, expectedResults: Record<keyof typeof patterns, boolean>) => {
  const results = {}
  for (const pattern in expectedResults) {
    results[pattern] = pathType(path, pattern as keyof typeof patterns)
  }
  assert.deepEqual(results, expectedResults)
}

const defaultResults = {
  moduleIndex: false,
  moduleUtil: false,
  root: false,
  test: false,
  utils: false,
  json: false,
  testModule: false,
  testRoot: false,
  testSpecial: false,
  module: false,
  src: false,
}

const testPattern = (path: string, expectedResults: Partial<typeof defaultResults>) => {
  it(`for ${path}`, () => {
    runAssertions(path, {
      ...defaultResults,
      ...expectedResults,
    })
  })
}

describe('patterns', () => {
  testPattern('src/module/index.ts', {
    module: true,
    moduleIndex: true,
    src: true,
  })
  testPattern('src/module/patterns.ts', {
    module: true,
    moduleUtil: true,
    src: true,
  })
  testPattern('src/meow.ts', {
    root: true,
    src: true,
  })
  testPattern('test/example/patterns.test.ts', {
    test: true,
    testModule: true,
  })
  testPattern('src/utils/patterns.ts', {
    module: true,
    src: true,
    utils: true,
  })
  testPattern('src/alpha/module/patterns.ts', {src: true})
})
