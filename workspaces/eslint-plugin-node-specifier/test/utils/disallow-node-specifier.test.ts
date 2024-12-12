import {test} from 'node:test'
import {RuleTester} from 'eslint'
import rule from '../../src/utils/disallow-node-specifier.ts'

const ruleTester = new RuleTester()

test('disallow-node-specifier require', async () => {
  const valid = [`const lodash = require('lodash')`, `const path = require('path')`].join('\n')

  const invalid = [`const lodash = require('lodash')`, `const path = require('node:path')`].join('\n')

  const output = [`const lodash = require('lodash')`, `const path = require('path')`].join('\n')

  const error = {
    message: `Do not use 'node:path', use 'path' instead`,
    line: 2,
  }

  ruleTester.run('disallow-node-specifier', rule, {
    valid: [valid],
    invalid: [{code: invalid, output, errors: [error]}],
  })
})

test('disallow-node-specifier import', async t => {
  const valid = [`import lodash from 'lodash'`, `import path from 'path'`].join('\n')

  const invalid = [`import lodash from 'lodash'`, `import path from 'node:path'`].join('\n')

  const output = [`import lodash from 'lodash'`, `import path from 'path'`].join('\n')

  const error = {
    message: `Do not use 'node:path', use 'path' instead`,
    line: 2,
  }

  ruleTester.run('disallow-node-specifier', rule, {
    valid: [valid],
    invalid: [{code: invalid, output, errors: [error]}],
  })
})
