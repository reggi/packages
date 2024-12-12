import type ESTree from 'estree'
import type {Rule} from 'eslint'
import {builtinModules} from 'node:module'

function isNodeSpecifier(moduleName: string): boolean {
  return moduleName.startsWith('node:')
}

function isNativeModule(moduleName: string): boolean {
  return builtinModules.includes(moduleName.replace(/^node:/, ''))
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow the use of node: specifier for native Node.js modules',
    },
    fixable: 'code',
    schema: [], // no options
    messages: {
      disallowNodeSpecifier: `Do not use 'node:{{name}}', use '{{name}}' instead`,
    },
  },
  create(context: Rule.RuleContext) {
    return {
      ImportDeclaration(node: ESTree.ImportDeclaration) {
        const moduleName = node.source.value
        if (typeof moduleName === 'string' && isNativeModule(moduleName) && isNodeSpecifier(moduleName)) {
          const name = moduleName.replace(/^node:/, '')
          context.report({
            node: node.source,
            messageId: 'disallowNodeSpecifier',
            data: {name},
            fix(fixer) {
              return fixer.replaceText(node.source, `'${name}'`)
            },
          })
        }
      },
      CallExpression(node: ESTree.CallExpression) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'string'
        ) {
          const moduleName = node.arguments[0].value
          if (typeof moduleName === 'string' && isNativeModule(moduleName) && isNodeSpecifier(moduleName)) {
            const name = moduleName.replace(/^node:/, '')
            context.report({
              node: node.arguments[0],
              messageId: 'disallowNodeSpecifier',
              data: {name},
              fix(fixer) {
                return fixer.replaceText(node.arguments[0], `'${name}'`)
              },
            })
          }
        }
      },
    }
  },
}

export default rule
