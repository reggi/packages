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
import {exec} from 'node:child_process'
import util from 'node:util'

const execAsync = util.promisify(exec)

const workspaces = await workspacePaths({cwd: process.cwd(), includeRoot: true})

const execCommands = async (commands: string[]) => {
  await Promise.all(
    commands.map(async command => {
      try {
        await execAsync(command)
      } catch (error) {
        throw new Error(`Error executing ${command}: ${error.message}`)
      }
    }),
  )
}

// Parallelize workspace processing
await Promise.all(
  workspaces.map(async workspace => {
    const packageJsonPath = path.join(workspace, 'package.json')
    const {main, exports, bin} = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))

    const files = [main, ...Object.values(exports || {}).flatMap((v: any) => Object.values(v))]
      .filter(Boolean)
      .map((file: string) => {
        const dist = path.join(workspace, file)
        const src = path.join(workspace, file.replace('dist', 'src').replace('.cjs', '.ts').replace('.js', '.ts'))
        return {dist, src}
      })

    // Run file checks in parallel
    await Promise.all(
      files.map(async ({dist, src}) => {
        await execCommands(runtimes.src.map(runtime => `${runtime} ${src}`))
        await execCommands(runtimes.dist.map(runtime => `${runtime} ${dist}`))
      }),
    )

    const bins = [...Object.values(bin || {})].filter(Boolean).map((file: string) => {
      const dist = path.join(workspace, file)
      const src = path.join(workspace, file.replace('dist', 'src').replace('.cjs', '.ts').replace('.js', '.ts'))
      return {dist, src}
    })

    // Run bin checks in parallel
    await Promise.all(
      bins.map(async ({dist, src}) => {
        await execCommands(runtimes.src.map(runtime => `${runtime} ${src} --help`))
        await execAsync(`${dist} --help`)
        await execCommands(runtimes.dist.map(runtime => `${runtime} ${dist} --help`))
      }),
    )
  }),
)
