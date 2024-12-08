#!/usr/bin/env -S npx tsx
import path from 'node:path'
import yaml from 'yaml'
import {workspacePaths} from 'workspace-paths'
import fs from 'node:fs/promises'
import {execSync} from 'node:child_process'
import {json2md} from '../../workspaces/knevee/src/build/json2md.ts'
const porcelainCheck =
  `
if [[ -z $(git diff --name-only) ]]; then
  echo "The repository is clean."
else
  echo "The repository has unstaged changes:"
  git diff
  exit 1
fi
`.trim() + '\n'

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
          name: 'Check if repo is porcelain',
          run: porcelainCheck,
        },
        {
          name: 'Report results',
          run: `npm run test ${isRoot ? '' : `-w=${name}`} --if-present`,
        },
      ],
    },
  },
})

const convertGitUrl = url => {
  return url.replace(':', '/').replace('git@', 'git+ssh://git@')
}

const getOriginRemote = (): string => {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url').toString().trim()
    return convertGitUrl(remoteUrl)
  } catch (error) {
    console.error('Error getting origin remote URL:', error)
    process.exit(1)
  }
}

const updatePackageJson = async (name: string, workspace: string, repositoryUrl: string) => {
  const packageJsonPath = path.join(workspace, 'package.json')
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageJsonContent)
  packageJson.repository = {
    type: 'git',
    url: repositoryUrl,
    ...(name == '' ? {} : {directory: `workspaces/${path.basename(workspace)}`}),
  }
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
  return packageJson
}

const workspaces = await workspacePaths({cwd: process.cwd(), includeRoot: true})
const repositoryUrl = getOriginRemote()

const manifest = []
const packages = []
const readme = []

for (const workspace of workspaces) {
  const rel = path.relative(process.cwd(), workspace)
  const name = path.basename(rel)
  const filename = `ci-${name || 'root'}.yml`
  const result = buildAndTestTemplate(name)
  const content = yaml.stringify(result)
  await fs.writeFile(path.join(process.cwd(), '.github', 'workflows', filename), content)
  const {version, name: pkgName} = await updatePackageJson(name, workspace, repositoryUrl)
  if (name) {
    manifest.push([`workspaces/${name}`, version])
    packages.push([`workspaces/${name}`, {}])
    readme.push({
      name: `[${name}](./workspaces/${name}/README.md)`,
      version,
      url: `https://www.npmjs.com/package/${pkgName}`,
    })
  }
}

manifest.sort((a, b) => a[0].localeCompare(b[0]))
packages.sort((a, b) => a[0].localeCompare(b[0]))

await fs.writeFile(
  path.join(process.cwd(), 'release-please-config.json'),
  JSON.stringify(
    {
      ...JSON.parse(await fs.readFile(path.join(process.cwd(), 'release-please-config.json'), 'utf8')),
      packages: Object.fromEntries(packages),
    },
    null,
    2,
  ) + '\n',
)

await fs.writeFile(
  path.join(process.cwd(), '.release-please-manifest.json'),
  JSON.stringify(Object.fromEntries(manifest), null, 2) + '\n',
)

await fs.writeFile(
  path.join(process.cwd(), 'README.md'),
  [`# packages`, 'This is a monorepo managed by release-please for my personal npm packages.', json2md(readme)].join(
    '\n',
  ),
)
