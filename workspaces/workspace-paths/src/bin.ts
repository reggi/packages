#!/usr/bin/env node
import {workspacePaths} from './index.ts'
;(async () => {
  const cwd = process.cwd()
  let includeRoot = false
  let showJson = false
  let showHelp = false
  const args = process.argv.slice(2).filter(val => {
    if (val === '--include-root') {
      includeRoot = true
      return false
    }
    if (val === '--json') {
      showJson = true
      return false
    }
    if (val === '--help') {
      showHelp = true
      return false
    }
    return true
  })

  const helpText = `
Usage: workspace-paths [path] [--include-root] [--json]
  [path]            Sets the target directory (defaults to cwd)
  --include-root    Include the current working directory in the output.
  --json            Output the result in JSON format.
`.trim()

  if (showHelp) {
    console.log(helpText)
    process.exit(0)
  }

  const value = await workspacePaths({includeRoot, cwd: args[0] || cwd})
  if (showJson) {
    console.log(JSON.stringify(value, null, 2))
  } else {
    if (value.length) {
      console.log(value.join('\n'))
    }
  }
})()
