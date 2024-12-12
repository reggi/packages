import * as fs from 'node:fs'
import * as path from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'

const tsConfig = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'tsconfig.json'), 'utf-8'))

export default {
  outputDir: './coverage',
  reports: ['v8', 'console-details'],
  entryFilter: {
    '**/node_modules/**': false,
    '**/src/build/**': false,
    '**/*.md': false,
    '**/*': true,
  },
  sourceFilter: {
    '**/node_modules/**': false,
    '**/src/build/**': false,
    '**/*.md': false,
    '**/src/**': true,
  },
  all: {
    dir: ['./src'],
    transformer: async entry => {
      const filePath = fileURLToPath(entry.url)
      const originalSource = fs.readFileSync(filePath, 'utf-8')
      const result = ts.transpileModule(originalSource, tsConfig)
      entry.source = result.outputText
      entry.sourceMap = result.sourceMapText
    },
  },
  onEnd: coverageResults => {
    const pkg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf-8'))
    const thresholds = {
      bytes: pkg.coverage,
      statements: pkg.coverage,
      functions: pkg.coverage,
      lines: pkg.coverage,
    }
    const errors = []
    const {summary} = coverageResults
    Object.keys(thresholds).forEach(k => {
      const pct = summary[k].pct
      if (pct < thresholds[k]) {
        errors.push(`Coverage threshold for ${k} (${pct} %) not met: ${thresholds[k]} %`)
      }
    })
    if (errors.length) {
      const errMsg = errors.join('\n')
      console.log(errMsg)
      process.exit(1)
    }
  },
}
