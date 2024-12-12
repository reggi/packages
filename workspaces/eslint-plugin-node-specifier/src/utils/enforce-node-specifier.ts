import type ESTree from 'estree'
import type {Rule} from 'eslint'
import {builtinModules} from 'node:module'

function isNodeSpecifier(moduleName: string): boolean {
  return moduleName.startsWith('node:')
}

function isNativeModule(moduleName: string): boolean {
  return builtinModules.includes(moduleName)
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce the use of node: specifier for native Node.js modules',
    },
    fixable: 'code',
    schema: [], // no options
    messages: {
      enforceNodeSpecifier: `Use 'node:{{name}}' instead of '{{name}}'`,
    },
  },
  create(context: Rule.RuleContext) {
    return {
      ImportDeclaration(node: ESTree.ImportDeclaration) {
        const moduleName = node.source.value
        if (typeof moduleName === 'string' && isNativeModule(moduleName) && !isNodeSpecifier(moduleName)) {
          context.report({
            node: node.source,
            messageId: 'enforceNodeSpecifier',
            data: {name: moduleName},
            fix(fixer) {
              return fixer.replaceText(node.source, `'node:${moduleName}'`)
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
          if (isNativeModule(moduleName) && !isNodeSpecifier(moduleName)) {
            context.report({
              node: node.arguments[0],
              messageId: 'enforceNodeSpecifier',
              data: {name: moduleName},
              fix(fixer) {
                return fixer.replaceText(node.arguments[0], `'node:${moduleName}'`)
              },
            })
          }
        }
      },
    }
  },
}

export default rule
