import {rule, RULE} from '../src/no-root-import.ts'
import {plugin} from '../src/context/index.ts'
import {defaultOptions} from '../src/utils/options.ts'
import {RuleHarness} from './__fixtures__/main.ts'
import {after, describe} from 'node:test'

const test = new RuleHarness(
  {
    'src/root.ts': 'const a = 1;',
    'src/gamma/one.ts': 'import { a } from "../root.ts";',
    'src/gamma/index.ts': 'import { a } from "../root.ts";',
    'test/root.ts': "import { a } from '../src/root.ts';",
  },
  rule,
  RULE,
  plugin,
  defaultOptions,
)

describe('mod-no-root', () => {
  after(() => test.cleanup())
  test.valid('src/root.ts')
  test.invalid('src/gamma/one.ts')
  test.invalid('src/gamma/index.ts')
  test.valid('test/root.ts')
})
