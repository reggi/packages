import yaml from 'yaml'

export default ({ dirname, isWorkspaceRoot }) => {
  const value = {
    name: `ci-${dirname || 'root'}`,
    on: {
      workflow_dispatch: {},
      push: {
        branches: ['main'],
        ...(isWorkspaceRoot ? {} : {paths: [`workspaces/${dirname}/**`]}),
      },
      pull_request: {
        branches: ['main'],
        ...(isWorkspaceRoot ? {} : {paths: [`workspaces/${dirname}/**`]}),
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
          ...(!isWorkspaceRoot
            ? [
                {
                  name: 'Build source code',
                  run: 'npm run build:only --if-present --workspaces',
                },
              ]
            : []),
          {
            name: 'Run build script',
            run: `npm run build ${isWorkspaceRoot ? '' : `--w=workspaces/${dirname}`} --if-present`,
          },
          {
            name: 'Check if repo is porcelain',
            run: porcelainCheck,
          },
          {
            name: 'Report results',
            run: `npm run test ${isWorkspaceRoot ? '' : `--w=workspaces/${dirname}`} --if-present`,
          },
          ...(isWorkspaceRoot ? [] : [{name: 'Run workspace', run: `./src/test/index.ts --w=${dirname}`}]),
        ],
      },
    },
  }
  return yaml.stringify(value) 
}
