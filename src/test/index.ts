#!/usr/bin/env -S npx tsx
import path from 'node:path'
import fs from 'node:fs/promises'
import {workspacePaths} from 'workspace-paths'
import {exec} from 'node:child_process'
import util, {parseArgs} from 'node:util'

const runtimes = {
  src: [
    'node --experimental-strip-types --experimental-detect-module --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --disable-warning=ExperimentalWarning',
    'npx tsx',
    'deno run -A',
  ],
  dist: ['node', 'npx tsx', 'deno run -A'],
}

const _execAsync = util.promisify(exec)

const execAsync = async (command: string) => {
  console.log(command)
  return _execAsync(command)
}

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

const runWorkspace = async workspace => {
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
    const ext = path.extname(file)
    const dist = path.join(workspace, file)
    const src = path.join(workspace, file.replace('dist', 'src').replace('.cjs', '.ts').replace('.js', '.ts'))
    return {dist, src, ext}
  })

  // Run bin checks in parallel
  await Promise.all(
    bins
      .filter(v => v.ext)
      .map(async ({dist, src}) => {
        await execCommands(runtimes.src.map(runtime => `${runtime} ${src} --help`))
        await execAsync(`${dist} --help`)
        await execCommands(runtimes.dist.map(runtime => `${runtime} ${dist} --help`))
      }),
  )

  await Promise.all(
    bins
      .filter(v => !v.ext)
      .map(async ({dist}) => {
        await execAsync(`${dist} --help`)
      }),
  )
}

const {values} = parseArgs({
  args: process.argv.slice(2),
  options: {
    workspaces: {type: 'boolean'},
    workspace: {type: 'string'},
  },
})

if (values.workspaces) {
  // Parallelize workspace processing
  await Promise.all(
    workspaces.map(async workspace => {
      runWorkspace(workspace)
    }),
  )
} else if (values.workspace) {
  const ws = workspaces.find(workspace => path.basename(workspace) === values.workspace)
  if (!ws) {
    throw new Error(`Workspace ${values.workspace} not found`)
  }
  await runWorkspace(ws)
}
