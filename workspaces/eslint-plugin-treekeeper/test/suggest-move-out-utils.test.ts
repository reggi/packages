import {rule, RULE} from '../src/suggest-move-out-utils.ts'
import {plugin} from '../src/context/index.ts'
import {defaultOptions} from '../src/utils/options.ts'
import {RuleHarness} from './__fixtures__/main.ts'
import {after, describe} from 'node:test'

const test = new RuleHarness(
  {
    'src/mod/index.ts': 'import {a} from "../utils/alpha.ts";',
    'src/utils/alpha.ts': 'const a = 1;',
  },
  rule,
  RULE,
  plugin,
  defaultOptions,
)

describe('strict-utils', () => {
  after(() => test.cleanup())
  test.valid('src/mod/index.ts')
  test.invalid('src/utils/alpha.ts')
})
