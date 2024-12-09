import type {ESLint, Linter, Rule} from 'eslint'
import {defaultOptions, type Options} from './utils/options.ts'
import {plugin} from './context/index.ts'

import * as dirNestLimit from './dir-nest-limit.ts'
import * as enforceHasIndex from './enforce-has-index.ts'
import * as enforceTestInSrc from './enforce-test-in-src.ts'
import * as noRootImport from './no-root-import.ts'
import * as suggestMoveInUtils from './suggest-move-in-utils.ts'
import * as suggestMoveOutUtils from './suggest-move-out-utils.ts'
import * as unused from './unused.ts'
import * as utilsNoImport from './utils-no-import.ts'
import * as utilsNoImportIndex from './utils-no-import-index.ts'

function wrap({rule, RULE}: {rule: Rule.RuleModule; RULE: string}) {
  return {
    rules: {
      [RULE]: rule,
    },
  }
}

function getRules(rules: {rule: Rule.RuleModule; RULE: string}[]): {[key: string]: Rule.RuleModule} {
  return Object.assign({}, ...rules.map(wrap).map(v => v.rules))
}

const createPluginReccomended = (plugin: string) => {
  return (...rawPlugins: {rule: Rule.RuleModule; RULE: string}[]) => {
    return (options: Partial<Options> = {}) => {
      const plugins = getRules(rawPlugins)
      const rules = Object.assign(
        {},
        ...rawPlugins.map(v => {
          return {
            [`${plugin}/${v.RULE}`]: 'error',
          }
        }),
      )
      const mergedOptions = {...defaultOptions, ...options}
      const {files, ignores} = mergedOptions
      return {
        files,
        ignores,
        plugins: {
          [plugin]: {
            rules: plugins,
          },
        },
        rules,
        settings: {
          [plugin]: mergedOptions,
        },
      } satisfies Linter.Config
    }
  }
}

const rules = [
  dirNestLimit,
  enforceHasIndex,
  enforceTestInSrc,
  noRootImport,
  suggestMoveInUtils,
  suggestMoveOutUtils,
  unused,
  utilsNoImport,
  utilsNoImportIndex,
]

export const createRecommended = createPluginReccomended(plugin)
export const recommended = createRecommended(...rules)

const main = {
  rules: getRules(rules),
  configs: {
    recommended: recommended(defaultOptions),
  },
} satisfies ESLint.Plugin

export default main
