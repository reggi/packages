import {rule, RULE} from '../src/utils-no-import.ts'
import {plugin} from '../src/context/index.ts'
import {defaultOptions} from '../src/utils/options.ts'
import {RuleHarness} from './__fixtures__/main.ts'
import {after, describe} from 'node:test'

const test = new RuleHarness(
  {
    'src/valid/one.ts': 'const a = 1;',
    'src/invalid/one.ts': 'import { a } from "../valid/one.ts";',
  },
  rule,
  RULE,
  plugin,
  defaultOptions,
)

describe('imports-utils', () => {
  after(() => test.cleanup())
  test.valid('src/valid/one.ts')
  test.invalid('src/invalid/one.ts')
})
