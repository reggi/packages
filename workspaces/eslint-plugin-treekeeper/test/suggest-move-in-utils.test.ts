import {rule, RULE} from '../src/suggest-move-in-utils.ts'
import {plugin} from '../src/context/index.ts'
import {defaultOptions} from '../src/utils/options.ts'
import {RuleHarness} from './__fixtures__/main.ts'
import {after, describe} from 'node:test'

const test = new RuleHarness(
  {
    'src/alpha/one.ts': 'const a = 1;',
    'src/alpha/index.ts': 'import { a } from "../beta/one.ts";',
    'src/beta/one.ts': 'const a = 1;',
    'src/beta/index.ts': 'import { a } from "../beta/one.ts";',
    'src/gamma/one.ts': 'const a = 1;',
    'src/gamma/index.ts': 'import { a } from "../gamma/one.ts";',

    'src/uses-json-a/index.ts': 'import json from "../../package.json";',
    'src/uses-json-b/index.ts': 'import json from "../../package.json";',
    'package.json': '{}',
  },
  rule,
  RULE,
  plugin,
  defaultOptions,
)

describe('imports-index', () => {
  after(() => test.cleanup())
  test.valid('src/alpha/one.ts') // not an index
  test.invalid('src/alpha/index.ts') // invalid index
  test.valid('src/gamma/index.ts') // valid index
  test.valid('src/uses-json-a/index.ts') // valid index
  test.valid('src/uses-json-b/index.ts') // valid index
})
