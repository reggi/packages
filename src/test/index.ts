#!/usr/bin/env -S npx tsx

const runtimes = {
  src: [
    'node --experimental-strip-types --experimental-detect-module --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --disable-warning=ExperimentalWarning',
    'npx tsx',
    'deno run -A',
  ],
  dist: ['node', 'npx tsx', 'deno run -A'],
}

import path from 'node:path'
import fs from 'node:fs/promises'
import {workspacePaths} from 'workspace-paths'
import {execSync} from 'node:child_process'

const workspaces = await workspacePaths({cwd: process.cwd(), includeRoot: true})

for (const workspace of workspaces) {
  const packageJsonPath = path.join(workspace, 'package.json')
  const {main, exports, bin} = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
  const files = [main, ...Object.values(exports || {}).flatMap((v: any) => Object.values(v))]
    .filter(Boolean)
    .map((file: string) => {
      const dist = path.join(workspace, file)
      const src = path.join(workspace, file.replace('dist', 'src').replace('.cjs', '.ts').replace('.js', '.ts'))
      return {dist, src}
    })

  for (const {dist, src} of files) {
    for (const runtime of runtimes.src) {
      try {
        execSync(`${runtime} ${src}`)
      } catch (error) {
        throw new Error(`Error executing ${runtime} ${src}: ${error.message}`)
      }
    }
    for (const runtime of runtimes.dist) {
      try {
        execSync(`${runtime} ${dist}`)
      } catch (error) {
        throw new Error(`Error executing ${runtime} ${dist}: ${error.message}`)
      }
    }
  }

  const bins = [...Object.values(bin || {})]
    .filter(Boolean)
    .map((file: string) => {
      const ext = path.extname(file)
      const dist = path.join(workspace, file)
      const src = path.join(workspace, file.replace('dist', 'src').replace('.cjs', '.ts').replace('.js', '.ts'))
      return {ext, dist, src}
    })
    .filter(({ext}) => ext)

  for (const {dist, src} of bins) {
    for (const runtime of runtimes.src) {
      try {
        execSync(`${runtime} ${src} --help`)
      } catch (error) {
        throw new Error(`Error executing ${runtime} ${src}: ${error.message}`)
      }
    }
    execSync(`${dist} --help`)
    for (const runtime of runtimes.dist) {
      try {
        execSync(`${runtime} ${dist} --help`)
      } catch (error) {
        throw new Error(`Error executing ${runtime} ${dist}: ${error.message}`)
      }
    }
  }
}
