import enforceNodeSpecifier from './utils/enforce-node-specifier.ts'
import disallowNodeSpecifier from './utils/disallow-node-specifier.ts'

export const rules = {
  'enforce-node-specifier': enforceNodeSpecifier,
  'disallow-node-specifier': disallowNodeSpecifier,
}
