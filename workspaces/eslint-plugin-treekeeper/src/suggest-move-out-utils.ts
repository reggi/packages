import {defaultOptions, schema} from './utils/options.ts'
import {ESLintUtils} from '@typescript-eslint/utils'
import type {Rule} from 'eslint'
import {Context, plugin} from './context/index.ts'
import {Paths} from './paths/index.ts'

export const RULE = 'suggest-move-out-utils'
let cache: Paths | undefined

export const rule = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    messages: {
      [RULE]: `File should be moved from "{{ utils }}" to "{{ mod }}" because it's only used there.`,
    },
    schema,
    type: 'problem',
  },
  defaultOptions: [defaultOptions],
  create(context) {
    const ctx = new Context(context, plugin, RULE, defaultOptions)
    if (!cache) {
      cache = ctx.dependencyMap()
    }
    if (!ctx.isUtils) return {}
    return {
      Program(node) {
        const path = cache?.isInvalidUtil(context.filename)
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
