import {test} from 'node:test'
import {RuleTester} from 'eslint'
import rule from '../../src/utils/enforce-node-specifier.ts'

const ruleTester = new RuleTester()

test('enforce-node-specifier require', async () => {
  const valid = [`const lodash = require('lodash')`, `const path = require('node:path')`].join('\n')

  const invalid = [`const lodash = require('lodash')`, `const path = require('path')`].join('\n')

  const output = [`const lodash = require('lodash')`, `const path = require('node:path')`].join('\n')

  const error = {
    message: `Use 'node:path' instead of 'path'`,
    line: 2,
  }

  ruleTester.run('enforce-node-specifier', rule, {
    valid: [valid],
    invalid: [{code: invalid, output, errors: [error]}],
  })
})

test('enforce-node-specifier import', async () => {
  const valid = [`import lodash from 'lodash'`, `import path from 'node:path'`].join('\n')

  const invalid = [`import lodash from 'lodash'`, `import path from 'path'`].join('\n')

  const output = [`import lodash from 'lodash'`, `import path from 'node:path'`].join('\n')

  const error = {
    message: `Use 'node:path' instead of 'path'`,
    line: 2,
  }

  ruleTester.run('enforce-node-specifier', rule, {
    valid: [valid],
    invalid: [{code: invalid, output, errors: [error]}],
  })
})
