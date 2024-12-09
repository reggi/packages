import test, {describe, before, after, it} from 'node:test'
import {clearCache, rule, RULE} from '../src/unused.ts'
import {plugin} from '../src/context/index.ts'
import {defaultOptions} from '../src/utils/options.ts'
import {RuleHarness} from './__fixtures__/main.ts'

async function runRuleTests() {
  await new Promise<void>(resolve => {
    describe('Rule Tests', () => {
      before(() => {
        clearCache()
      })

      const test = new RuleHarness(
        {
          'src/alpha/index.ts': 'import {a} from "../beta/index.ts";',
          'src/beta/index.ts': 'import {a} from "../delta/index.ts";',
          'src/delta/index.ts': 'import {a} from "../alpha/index.ts";',
          'src/gamma/index.ts': 'import {a} from "../delta/index.ts";',
          'src/sigma/index.ts': 'const a = 1;',
        },
        rule,
        RULE,
        plugin,
        defaultOptions,
      )

      test.valid('src/alpha/index.ts')
      test.valid('src/beta/index.ts')
      test.valid('src/delta/index.ts')
      test.valid('src/gamma/index.ts')
      test.invalid('src/sigma/index.ts')
      after(() => {
        test.cleanup()
        resolve()
      })
    })
  })
}

async function runRootTests() {
  await new Promise<void>(resolve => {
    describe('root', () => {
      before(() => {
        clearCache()
      })

      const test = new RuleHarness(
        {
          'src/index.ts': 'const a = 1;',
        },
        rule,
        RULE,
        plugin,
        defaultOptions,
      )

      test.valid('src/index.ts')
      after(() => {
        test.cleanup()
        resolve()
      })
    })
  })
}

;(async () => {
  await runRuleTests()
  await runRootTests()
})()
