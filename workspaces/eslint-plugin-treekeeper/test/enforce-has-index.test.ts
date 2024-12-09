import {rule, RULE} from '../src/enforce-has-index.ts'
import {plugin} from '../src/context/index.ts'
import {defaultOptions} from '../src/utils/options.ts'
import {RuleHarness} from './__fixtures__/main.ts'
import {after, describe} from 'node:test'

const test = new RuleHarness(
  {
    'src/invalid/alpha.ts': 'const a = 1;',
    'src/valid/alpha.ts': 'const a = 1;',
    'src/valid/index.ts': 'const a = 1;',
  },
  rule,
  RULE,
  plugin,
  defaultOptions,
)

describe('strict-index', () => {
  after(() => test.cleanup())
  test.valid('src/valid/alpha.ts')
  test.invalid('src/invalid/alpha.ts')
})
