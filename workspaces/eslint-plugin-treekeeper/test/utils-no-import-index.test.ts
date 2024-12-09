import {rule, RULE} from '../src/utils-no-import-index.ts'
import {plugin} from '../src/context/index.ts'
import {defaultOptions} from '../src/utils/options.ts'
import {RuleHarness} from './__fixtures__/main.ts'
import {after, describe} from 'node:test'

const test = new RuleHarness(
  {
    'src/alpha/index.ts': 'const a = 1;',
    'src/gamma/one.ts': 'import { a } from "../alpha/index.ts";',
    'src/gamma/index.ts': 'import { a } from "../alpha/index.ts";',
  },
  rule,
  RULE,
  plugin,
  defaultOptions,
)

describe('index-4-index', () => {
  after(() => test.cleanup())
  test.valid('src/gamma/index.ts')
  test.valid('src/alpha/index.ts')
  test.invalid('src/gamma/one.ts')
})
