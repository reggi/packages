#!/usr/bin/env -S npx tsx
import path from 'node:path'
import yaml from 'yaml'
import {workspacePaths} from 'workspace-paths'
import fs from 'node:fs/promises'
import {execSync} from 'node:child_process'
// eslint-disable-next-line
import {json2md} from '../../workspaces/knevee/src/build/json2md.ts'
import {glob} from 'glob'

const porcelainCheck =
  `
if [[ -z $(git diff --name-only HEAD) ]]; then
  echo "The repository is clean."
else
  echo "The repository has unstaged changes:"
  git diff --name-only HEAD
  exit 1
fi
`.trim() + '\n'

const buildAndTestTemplate = (name: string = '', isRoot = name === '') => ({
  name: `ci-${name || 'root'}`,
  on: {
    workflow_dispatch: {},
    push: {
      branches: ['main'],
      ...(isRoot ? {} : {paths: [`workspaces/${name}/**`]}),
    },
    pull_request: {
      branches: ['main'],
      ...(isRoot ? {} : {paths: [`workspaces/${name}/**`]}),
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
          name: 'Cache Node.js modules',
          uses: 'actions/cache@v3',
          with: {
            path: 'node_modules',
            key: "${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}",
            'restore-keys': '${{ runner.os }}-node-\n',
          },
        },
        {
          name: 'Install Node.js dependencies',
          run: 'npm ci --ignore-scripts',
        },
        ...(!isRoot
          ? [
              {
                name: 'Build source code',
                run: 'npm run build:only --if-present --workspaces',
              },
            ]
          : []),
        {
          name: 'Run build script',
          run: `npm run build ${isRoot ? '' : `--w=workspaces/${name}`} --if-present`,
        },
        {
          name: 'Check if repo is porcelain',
          run: porcelainCheck,
        },
        {
          name: 'Report results',
          run: `npm run test ${isRoot ? '' : `--w=workspaces/${name}`} --if-present`,
        },
        ...(isRoot ? [] : [{name: 'Run workspace', run: `./src/test/index.ts --w=${name}`}]),
      ],
    },
  },
})

const getOriginRemote = (): string => {
  try {
    return execSync('git config --get remote.origin.url')
      .toString()
      .trim()
      .replace(/\.git$/, '')
  } catch (error) {
    console.error('Error getting origin remote URL:', error)
    process.exit(1)
  }
}

const MCR = (value?) =>
  [
    `mcr --import tsx tsx --experimental-test-snapshots`,
    ...(value ? [value] : []),
    `--test ./test/*.test.ts ./test/**/*.test.ts`,
  ].join(' ')

const scripts = {
  build: 'npm run build:only --if-present && npm run style:fix && npm run pkg:fix',
  'build:only': 'tsup --clean ./src/*.ts --format esm,cjs --dts',
  'build:test': 'npm run build && npm run test',
  'build:watch': 'npm run build:only -- --watch',
  depcheck: "depcheck --ignores='@types/node,tsup,sort-package-json'",
  lint: 'eslint .',
  'lint:fix': 'eslint . --fix',
  pkg: 'sort-package-json --check',
  'pkg:fix': 'sort-package-json',
  report: 'open ./coverage/index.html',
  style: 'prettier --check .',
  'style:fix': 'prettier --write .',
  test: 'npm run test:only && npm run style && npm run typecheck && npm run depcheck && npm run pkg && npm run lint',
  'test:only': `if [ -d ./test ]; then ${MCR()}; fi`,
  'test:snap': `if [ -d ./test ]; then ${MCR('--test-update-snapshots')}; fi`,
  typecheck: 'tsc',
}

const rootScripts = {
  build: `${scripts.build} && npm run build --ws`,
  test: `${scripts.test}`,
}

const rootJson = JSON.parse(await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8'))
const sharedDevDependencies = rootJson.devDependencies

const exists = async (filePath: string) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const updatePackageJson = async (name: string, workspace: string, repositoryUrl: string) => {
  const packageJsonPath = path.join(workspace, 'package.json')
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8')

  const relBuild = path.join('src', 'build', 'index.ts')
  const build = path.join(workspace, relBuild)
  const buildExists = await exists(build)

  const srcFiles = path.join(workspace, 'src')
  const checkSrcFiles = await glob(srcFiles + '/*.ts', {absolute: true, nodir: true})
  const {
    build: buildScript,
    'build:only': buildOnly,
    ...pkgRest
  } = {
    ...scripts,
    ...(name == '' ? rootScripts : {}),
  }
  const packageJson = JSON.parse(packageJsonContent)

  const {tsup, ...devDeps} = packageJson?.devDependencies || {}

  const extraFiles = (await exists(path.join(workspace, 'bins')))
    ? (await fs.readdir(path.join(workspace, 'bins'))).map(file => path.join(workspace, 'bins', file))
    : []

  for (const file of extraFiles) {
    const content = await fs.readFile(file, 'utf8')
    const firstLine = content.split('\n')[0]
    const hasShebang = firstLine.startsWith('#!')
    if (!hasShebang) {
      throw new Error(`non js file in src without shebang`)
    }
  }

  const readFiles = await Promise.all(
    checkSrcFiles.map(async file => {
      const content = await fs.readFile(file, 'utf8')
      const firstLine = content.split('\n')[0]
      const hasShebang = firstLine.startsWith('#!')
      const basename = path.basename(file)
      const ext = path.extname(basename)
      const basenameNoExt = path.basename(file, ext)
      const distFile = path.relative(workspace, file).replace('src', 'dist')
      const cjsFile = distFile.replace('.ts', '.cjs')
      const jsFile = distFile.replace('.ts', '.js')
      const exportKey = basenameNoExt === 'index' ? '.' : `./${basenameNoExt}`
      return {file, cjsFile, jsFile, basenameNoExt, hasShebang, exportKey}
    }),
  )
  const binFiles = readFiles.filter(v => v.hasShebang)
  const exportFiles = readFiles.filter(v => !v.hasShebang)

  for (const {file} of binFiles) {
    await fs.chmod(file, 0o755)
  }

  const bin = binFiles
    .map(v => {
      const name: string = v.basenameNoExt === 'bin' ? packageJson.name : v.basenameNoExt
      return [name, v.cjsFile]
    })
    .sort((a, b) => a[0].localeCompare(b[0]))

  bin.push(
    ...extraFiles.map(file => {
      const name = path.basename(file)
      return [name, path.relative(workspace, file)]
    }),
  )

  const exports = exportFiles
    .map(v => {
      const name: string = v.exportKey
      const value = {
        import: `./${v.jsFile}`,
        require: `./${v.cjsFile}`,
      }
      const result: [string, {require: string; import: string}] = [name, value]
      return result
    })
    .sort((a, b) => a[0].localeCompare(b[0]))

  const containsIndex = exportFiles.find(v => v.basenameNoExt === 'index')

  const buildScriptFinal = buildExists ? `${relBuild} && ${buildScript}` : buildScript

  const devDependencies = {
    ...sharedDevDependencies,
    ...devDeps,
    ...(checkSrcFiles.length ? {tsup} : {}),
  }

  delete devDependencies[name]

  const extend = {
    scripts: {
      build: name === '' ? `npm run build:only --if-present --workspaces && ${buildScriptFinal}` : buildScriptFinal,
      ...(checkSrcFiles.length ? {'build:only': buildOnly} : {}),
      ...pkgRest,
    },
    ...(exports.length ? {exports: Object.fromEntries(exports)} : {}),
    ...(bin.length ? {bin: Object.fromEntries(bin)} : {}),
    ...(containsIndex ? {main: containsIndex.cjsFile} : {}),
    files: ['dist/', 'src/'],
    prettier: '@github/prettier-config',
    repository: {
      type: 'git',
      url: repositoryUrl,
      ...(name == '' ? {} : {directory: `workspaces/${path.basename(workspace)}`}),
    },
    license: 'MIT',
    author: 'reggi <me@reggi.com> (https://reggi.com)',
    devDependencies,
  }
  await fs.writeFile(packageJsonPath, JSON.stringify({...packageJson, ...extend}, null, 2) + '\n')
  return packageJson
}

const workspaces = await workspacePaths({cwd: process.cwd(), includeRoot: true})
const repositoryUrl = getOriginRemote()

const manifest: [string, string][] = []
const packages: [string, object][] = []
const readme: {name: string; url: string}[] = []

const copyFromRoot = ['eslint.config.js', 'mcr.config.js', 'tsconfig.json', '.prettierignore', '.gitignore']

const readRoot = await Promise.all(
  copyFromRoot.map(async file => {
    const basename = path.basename(file)
    const content = await fs.readFile(path.join(process.cwd(), file), 'utf8')
    return {basename, content}
  }),
)

for (const workspace of workspaces) {
  const rel = path.relative(process.cwd(), workspace)
  const name = path.basename(rel)
  const filename = `ci-${name || 'root'}.yml`
  const result = buildAndTestTemplate(name)
  const content = yaml.stringify(result)
  await fs.writeFile(path.join(process.cwd(), '.github', 'workflows', filename), content)

  for (const {basename, content} of readRoot) {
    let swapContent = content
    if (name === 'eslint-plugin-treekeeper' && basename === 'eslint.config.js') {
      const find = `import {recommended} from 'eslint-plugin-treekeeper'`
      const replace = `import {recommended} from './dist/index.cjs'`
      swapContent = content.replace(find, replace)
    }
    await fs.writeFile(path.join(workspace, basename), swapContent)
  }

  const {version, name: pkgName} = await updatePackageJson(name, workspace, repositoryUrl)
  if (name) {
    manifest.push([`workspaces/${name}`, version])
    packages.push([`workspaces/${name}`, {}])
    readme.push({
      name: `[${name}](./workspaces/${name}/README.md)`,
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
    '\n\n',
  ) + '\n',
)
