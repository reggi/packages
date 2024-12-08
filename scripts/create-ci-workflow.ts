import path from 'node:path'
import yaml from 'yaml'
import {workspacePaths} from 'workspace-paths'
import fs from 'node:fs/promises'

const buildAndTestTemplate = (name: string = '', isRoot = name === '') => ({
  name: `ci-${name || 'root'}`,
  on: {
    workflow_dispatch: {},
    push: {
      branches: ['main'],
      paths: isRoot ? ['/*'] : [`workspaces/${name}/**`],
    },
    pull_request: {
      branches: ['main'],
      paths: isRoot ? ['/*'] : [`workspaces/${name}/**`],
    },
  },
  jobs: {
    build: {
      'runs-on': 'ubuntu-latest',
      strategy: {
        matrix: {
          'node-version': ['22.x'],
          'deno-version': ['2.x'],
        },
      },
      steps: [
        {
          name: 'Checkout repository',
          uses: 'actions/checkout@v2',
        },
        {
          name: 'Set up Node.js',
          uses: 'actions/setup-node@v4',
          with: {
            'node-version': '${{ matrix.node-version }}',
          },
        },
        {
          name: 'Setup Deno',
          uses: 'denoland/setup-deno@v1',
          with: {
            'deno-version': '${{ matrix.deno-version }}',
          },
        },
        {
          name: 'Install Node.js dependencies',
          run: 'npm ci',
        },
        {
          name: 'Run build script',
          run: `npm run build ${isRoot ? '' : `-w=${name}`} --if-present`,
        },
        {
          name: 'Report results',
          run: `npm run test ${isRoot ? '' : `-w=${name}`} --if-present`,
        },
      ],
    },
  },
})

const workspaces = await workspacePaths({cwd: process.cwd(), includeRoot: true})

for (const workspace of workspaces) {
  const rel = path.relative(process.cwd(), workspace)
  const name = path.basename(rel)
  const filename = `ci-${name || 'root'}.yml`
  const result = buildAndTestTemplate(name)
  const content = yaml.stringify(result)
  await fs.writeFile(path.join(process.cwd(), '.github', 'workflows', filename), content)
}
