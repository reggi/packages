import {describe, it, before} from 'node:test'
import {strict as assert} from 'node:assert'
import {spawnAsync} from './fixtures/spawn.ts'

function withStdin(command: string, stdin: string[]) {
  return {command, stdin}
}

function removeDebugFromStdout(stdout: string) {
  return stdout
    .split('\n')
    .filter(v => !v.match(/\x1b\[[0-9;]*m/))
    .join('\n')
}

export const valid = (name: string, commands: (string | {command: string; stdin: string[]})[]) =>
  describe(name, () => {
    const out: string[] = []
    const serialzier = {serializers: [v => v.replaceAll('\\n|\n', /\n/)]}

    before(async () => {
      await Promise.all(
        commands.map(async command => {
          const commandString = typeof command === 'string' ? command : command.command
          const stdin = typeof command === 'string' ? '' : command.stdin.join('\n')
          const {stdout, stderr} = await spawnAsync(commandString, {
            input: stdin,
            env: {
              ...process.env,
              DEBUG: 'knevee',
            },
          })
          assert.strictEqual(stderr, '', 'No errors should be present in stderr')
          const core = removeDebugFromStdout(stdout)
          out.push(core)
        }),
      )
    })

    it(`should match snapshot`, t => {
      out.forEach(value => {
        t.assert.snapshot(value, serialzier)
      })
    })

    it('all stripped outputs should be identical', () => {
      out.forEach((output, index) => {
        assert.deepStrictEqual(output, out[0])
      })
    })
  })

export const invalid = (name: string, commands: string[]) =>
  describe(name, () => {
    it('should throw', async () => {
      await Promise.all(
        commands.map(async command => {
          try {
            await spawnAsync(command)
            assert.fail(`Command "${command}" should have thrown an error`)
          } catch (error) {
            assert(error instanceof Error, 'An error should have been thrown')
          }
        }),
      )
    })
  })

function runBin(bin) {
  describe(bin, async () => {
    await invalid('throws on depcheck failure', [
      `${bin} ./examples/dep-check-invalid.ts tea 32`, // dep-check
    ])

    await valid('valid stdout', [
      `${bin} ./examples stdin-uppercase woof`,
      `${bin} ./examples/stdin-uppercase.ts woof`,
      './examples/stdin-uppercase.ts woof',
    ])

    await valid('vaid stdin', [
      withStdin(`${bin} ./examples stdin-uppercase`, ['meow', 'woof']),
      withStdin(`${bin} ./examples/stdin-uppercase.ts`, ['meow', 'woof']),
      withStdin('./examples/stdin-uppercase.ts', ['meow', 'woof']),
    ])

    // dir list example
    await valid('dir list no index', [`${bin} ./examples/no-index`])

    // help example
    await valid('show knevee help', [`${bin} --help`])

    // no target
    await invalid('no knevee target', [`${bin}`])

    // no command found
    await invalid('no command found', [`${bin} ./examples/empty-dir`])

    // subcommand match
    await valid('subcommand match', [
      `${bin} ./examples/no-index`,
      `${bin} ./examples/no-index xxx`,
      `${bin} --cwd=examples/no-index`,
      `${bin} --cwd=examples/no-index xxx`,
    ])

    // UserError
    await invalid('user error', [`${bin} ./examples/throws.ts xxx 111`, 'tsx ./examples/throws-functional.ts xxx 111'])

    // knevee error
    await invalid('knevee error', [`KNEVEE_THROW=true ${bin} ./examples/exports.ts`])

    // knevee error
    await invalid('knevee error', [`KNEVEE_THROW=true ${bin} ./examples/empty.ts`])

    await valid('command help', [
      `${bin} ./examples functional --help`,
      `${bin} ./examples/functional.ts --help`,
      './examples/functional.ts --help',
    ])

    // normal kneve error
    await invalid('command arg error', [
      // ----- esm -----
      // command
      `${bin} ./examples command tea`,
      `${bin} ./examples/command.ts tea`,
      './examples/command.ts tea',
      // functional
      `${bin} ./examples functional tea`,
      `${bin} ./examples/functional.ts tea`,
      'tsx ./examples/functional.ts tea',
      './examples/functional.ts tea',
      // proxy
      `${bin} ./examples proxy tea`,
      `${bin} ./examples/proxy.ts tea`,
      './examples/proxy.ts tea',
      // exports
      `${bin} ./examples exports tea`,
      `${bin} ./examples/exports.ts tea`,
      './examples/exports.ts tea',
      // exports-symlink
      `${bin} ./examples exports-symlink tea`,
      `${bin} ./examples/exports-symlink.ts tea`,
      './examples/exports-symlink.ts tea',
      // extra
      `${bin} ./examples tea`, // index
      `${bin} ./examples/dep-check.ts tea`, // dep-check
      // ----- cjs -----
      // command-cjs
      `${bin} ./examples command-cjs tea`,
      `${bin} ./examples/command-cjs.cjs tea`,
      './examples/command-cjs.cjs tea',
      // proxy-cjs
      `${bin} ./examples proxy-cjs tea`,
      `${bin} ./examples/proxy-cjs.cjs tea`,
      './examples/proxy-cjs.cjs tea',
      // exports-cjs
      `${bin} ./examples exports-cjs tea`,
      `${bin} ./examples/exports-cjs.cjs tea`,
      './examples/exports-cjs.cjs tea',
      // functional-cjs
      `${bin} ./examples functional-cjs tea`,
      `${bin} ./examples/functional-cjs.cjs tea`,
      'tsx ./examples/functional-cjs.cjs tea', // extra functional call
      './examples/functional-cjs.cjs tea',
    ])

    await valid('successful command', [
      // ----- esm -----
      // command
      `${bin} ./examples command tea 32`,
      `${bin} ./examples/command.ts tea 32`,
      './examples/command.ts tea 32',
      // functional
      `${bin} ./examples functional tea 32`,
      `${bin} ./examples/functional.ts tea 32`,
      'tsx ./examples/functional.ts tea 32',
      './examples/functional.ts tea 32',
      // proxy
      `${bin} ./examples proxy tea 32`,
      `${bin} ./examples/proxy.ts tea 32`,
      './examples/proxy.ts tea 32',
      // exports
      `${bin} ./examples exports tea 32`,
      `${bin} ./examples/exports.ts tea 32`,
      './examples/exports.ts tea 32',
      // exports-symlink
      `${bin} ./examples exports-symlink tea 32`,
      `${bin} ./examples/exports-symlink.ts tea 32`,
      './examples/exports-symlink.ts tea 32',
      // extra
      `${bin} ./examples tea 32`, // index
      `${bin} ./examples/dep-check.ts tea 32`, // dep-check
      // ----- cjs -----
      // command-cjs
      `${bin} ./examples command-cjs tea 32`,
      `${bin} ./examples/command-cjs.cjs tea 32`,
      './examples/command-cjs.cjs tea 32',
      // proxy-cjs
      `${bin} ./examples proxy-cjs tea 32`,
      `${bin} ./examples/proxy-cjs.cjs tea 32`,
      './examples/proxy-cjs.cjs tea 32',
      // exports-cjs
      `${bin} ./examples exports-cjs tea 32`,
      `${bin} ./examples/exports-cjs.cjs tea 32`,
      './examples/exports-cjs.cjs tea 32',
      // functional-cjs
      `${bin} ./examples functional-cjs tea 32`,
      `${bin} ./examples/functional-cjs.cjs tea 32`,
      'tsx ./examples/functional-cjs.cjs tea 32', // extra functional call
      './examples/functional-cjs.cjs tea 32',
    ])
  })
}

await runBin('tsx ./src/bin.ts')
await runBin('./bins/dknevee')
