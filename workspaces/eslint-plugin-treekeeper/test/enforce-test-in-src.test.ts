import {rule, RULE} from '../src/enforce-test-in-src.ts'
import {plugin} from '../src/context/index.ts'
import {defaultOptions} from '../src/utils/options.ts'
import {RuleHarness} from './__fixtures__/main.ts'
import {after, describe} from 'node:test'

const test = new RuleHarness(
  {
    'src/valid/alpha.ts': 'const a = 1;',
    'test/invalid/alpha.test.ts': 'const a = 1;',
    'test/valid/alpha.test.ts': 'const a = 1;',
    'test/valid/index.test.ts': 'const a = 1;',
  },
  rule,
  RULE,
  plugin,
  defaultOptions,
)

describe('strict-tests', () => {
  after(() => test.cleanup())
  test.valid('test/valid/alpha.test.ts')
  test.invalid('test/invalid/alpha.test.ts')
  test.invalid('test/valid/index.test.ts')
})
