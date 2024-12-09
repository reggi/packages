import {defaultOptions, schema} from './utils/options.ts'
import {ESLintUtils} from '@typescript-eslint/utils'
import type {Rule} from 'eslint'
import {Context, plugin} from './context/index.ts'
import {Paths} from './paths/index.ts'

export const RULE = 'enforce-test-in-src'
let cache: Paths | undefined

export const rule = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    messages: {
      [RULE]: `{{ message }}`,
    },
    schema,
    type: 'problem',
  },
  defaultOptions: [defaultOptions],
  create(context) {
    const ctx = new Context(context, plugin, RULE, defaultOptions)
    if (!cache) {
      cache = ctx.projectFiles()
    }
    if (!ctx.isTest()) return {}
    return {
      Program(node) {
        const path = cache?.isInvalidTest(context.filename)
        if (path) {
          context.report({
            node,
            messageId: RULE,
            data: path.data(),
          })
        }
      },
    }
  },
}) as unknown as Rule.RuleModule
