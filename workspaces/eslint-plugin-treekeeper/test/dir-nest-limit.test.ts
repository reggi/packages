import {rule, RULE} from '../src/dir-nest-limit.ts'
import {plugin} from '../src/context/index.ts'
import {defaultOptions} from '../src/utils/options.ts'
import {RuleHarness} from './__fixtures__/main.ts'
import {after, describe} from 'node:test'

const test = new RuleHarness(
  {
    'src/file.ts': 'const a = 1;',
    'src/nested/file.ts': 'const b = 2;',
    'src/nested/too/deep/file.ts': 'const c = 3;',
    'src/very/nested/too/deep/file.ts': 'const d = 4;',
  },
  rule,
  RULE,
  plugin,
  defaultOptions,
)

describe('dir-nest-limit', () => {
  after(() => test.cleanup())

  test.valid('src/file.ts', {limit: 3})
  test.valid('src/nested/file.ts', {limit: 3})

  test.invalid(
    'src/nested/too/deep/file.ts',
    {limit: 2},
    {
      limit: 2,
      depth: 5,
      depthOver: 3,
    },
  )

  test.invalid(
    'src/very/nested/too/deep/file.ts',
    {limit: 2},
    {
      limit: 2,
      depth: 6,
      depthOver: 4,
    },
  )
})
