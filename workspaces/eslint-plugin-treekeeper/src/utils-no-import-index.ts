import {defaultOptions, schema} from './utils/options.ts'
import {ESLintUtils} from '@typescript-eslint/utils'
import type {Rule} from 'eslint'
import {Context, plugin} from './context/index.ts'
import {localImport} from './utils/local-import.ts'

export const RULE = 'utils-no-import-index'
export const rule = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    messages: {
      [RULE]: '"{{ indexFile }}" files can only be imported by other "{{ indexFile }}" files.',
    },
    schema,
    type: 'problem',
  },
  defaultOptions: [{index: 'index'}],
  create(context) {
    const ctx = new Context(context, plugin, RULE, defaultOptions)
    if (!ctx.isModuleUtilOrUtils() || ctx.isRoot()) return {}
    return localImport((node, filename) => {
      const ictx = ctx.import(filename)
      if (ictx.isModuleIndex()) {
        context.report({
          messageId: RULE,
          node,
          data: ictx.data(),
        })
      }
    })
  },
}) as unknown as Rule.RuleModule
