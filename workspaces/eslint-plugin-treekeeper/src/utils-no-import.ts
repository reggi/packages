import {defaultOptions, schema} from './utils/options.ts'
import {ESLintUtils} from '@typescript-eslint/utils'
import type {Rule} from 'eslint'
import {Context, plugin} from './context/index.ts'
import {localImport} from './utils/local-import.ts'

export const RULE = 'utils-no-import'
export const rule = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    messages: {
      [RULE]: 'Files in "{{ utils }}" or non "{{ indexFile }}" files in a module should never import another file.',
    },
    schema,
    type: 'problem',
  },
  defaultOptions: [defaultOptions],
  create(context) {
    const ctx = new Context(context, plugin, RULE, defaultOptions)
    if (!ctx.isModuleUtilOrUtils()) return {}
    return localImport((node, filename) => {
      const ictx = ctx.import(filename)
      if (!ictx.isValidModuleUtilImport()) {
        context.report({
          messageId: RULE,
          node,
          data: ictx.data(),
        })
      }
    })
  },
}) as unknown as Rule.RuleModule
