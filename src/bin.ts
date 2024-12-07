#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {globSync} from 'glob'

const argv = process.argv.slice(2)
const files = argv

if (argv.includes('--help') || !files.length) {
  console.log(
    `
Usage: add-pkg-exports <glob-pattern>
Description: Add exports field to package.json based on the files found by the glob pattern
`.trim(),
  )
  process.exit(0)
}

const resolvedFiles = files.length === 1 ? globSync(files[0], {cwd: process.cwd()}) : files

const x = resolvedFiles.map(rel => {
  const extname = `.${path.basename(rel).split('.').slice(1).join('.')}`
  const basename = path.basename(rel, extname)
  const key = basename === 'index' ? '.' : `./${basename}`
  const keyword = extname === '.cjs' ? 'require' : extname === '.js' ? 'import' : undefined
  return {extname, key, rel, keyword}
})

const grouped = Object.entries(Object.groupBy(x, v => v.key)).sort(([a], [b]) =>
  (a as string).localeCompare(b as string),
)

const exportsProperty = Object.fromEntries(
  grouped.map(([key, value]) => {
    return [key, Object.fromEntries(value?.filter(v => v.keyword).map(v => [v.keyword, v.rel]) || [])]
  }),
)

const packagePath = path.join(process.cwd(), './package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
packageJson.exports = exportsProperty
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
