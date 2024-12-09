import type {TSESTree} from '@typescript-eslint/types'
import path from 'node:path'

export const isLocal = v => v.startsWith('.') || v.startsWith(path.sep)

export const localImport = (handler: (node: TSESTree.ImportDeclaration, filename: string) => void) => ({
  ImportDeclaration(node: TSESTree.ImportDeclaration) {
    const isTypeOnly =
      node.importKind === 'type' || node.specifiers.every((specifier: any) => specifier.importKind === 'type')
    if (isTypeOnly) return
    if (!isLocal(node.source.value)) return
    handler(node, node.source.value)
  },
})
