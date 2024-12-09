import {defaultOptions, schema} from './utils/options.ts'
import {ESLintUtils} from '@typescript-eslint/utils'
import type {Rule} from 'eslint'
import {Context, plugin} from './context/index.ts'
import {Paths} from './paths/index.ts'

export const RULE = 'unused'
let cache: Paths | undefined
const eslint = new Set<string>()

export const clearCache = () => {
  cache = undefined
  eslint.clear()
}

export const rule = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    messages: {
      [RULE]: 'The following files are not used in the project:\n{{ files }}',
    },
    schema,
    type: 'problem',
  },
  defaultOptions: [defaultOptions],
  create(context) {
    eslint.add(context.filename)
    const ctx = new Context(context, plugin, RULE, defaultOptions)
    if (!cache) {
      cache = ctx.filesWithContent()
    }
    return {
      'Program:exit'(node) {
        if (cache?.paths.length === eslint?.size) {
          const unused = cache.unused().map(p => p.filename)
          if (!unused.length) return
          context.report({
            node,
            messageId: RULE,
            data: {
              files: unused.join('\n') + '\n',
            },
          })
        }
      },
    }
  },
}) as unknown as Rule.RuleModule
